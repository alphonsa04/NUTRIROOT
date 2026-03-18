// NutriRoot - Core Application Logic
// Handles soil data management, analysis, and recommendations

/* ========================================
   AUTHENTICATION & PAGE PROTECTION
   ======================================== */

/* ========================================
   INITIALIZATION
   ======================================== */

// Log when script is loaded
console.log('NutriRoot Core Script Loaded');

/**
 * Get current user (mock function for now)
 */
function getCurrentUser() {
    return { uid: 'user123', displayName: 'Farmer' };
}

/**
 * Toggle password visibility
 * @param {string} inputId - ID of the password input field
 * @param {HTMLElement} iconElement - The icon element that was clicked
 */
function togglePasswordVisibility(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (!input) {
        console.warn('Password field not found:', inputId);
        return;
    }

    if (input.type === 'password') {
        input.type = 'text';
        // Eye-off icon
        iconElement.innerHTML = `
            <path stroke-width="2.2" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line stroke-width="2.2" x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        input.type = 'password';
        // Eye icon
        iconElement.innerHTML = `
            <path stroke-width="2.2" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle stroke-width="2.2" cx="12" cy="12" r="3"></circle>
        `;
    }
}

/**
 * Show notification message to user
 */
function showMessage(message, type = 'info') {
    // Create or get notification container
    let notificationContainer = document.getElementById('notificationContainer');

    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : type === 'warning' ? '#FF9800' : '#2196F3'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease-out;
        font-size: 14px;
        font-weight: 500;
    `;
    notification.textContent = message;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    if (!document.getElementById('notificationStyles')) {
        style.id = 'notificationStyles';
        document.head.appendChild(style);
    }

    notificationContainer.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/* ========================================
   LOCAL STORAGE MANAGEMENT
   ======================================== */

/**
 * Save soil data to Firestore and localStorage
 */
async function saveSoilData(data) {
    try {
        // Validate data - ensure all fields have values
        const requiredFields = ['nitrogen', 'phosphorus', 'potassium', 'ph', 'moisture', 'temperature', 'crop'];
        for (const field of requiredFields) {
            if (data[field] === undefined || data[field] === null || data[field] === '') {
                showMessage(`Please fill the ${field} field`, 'error');
                return false;
            }
            if (field !== 'crop' && isNaN(data[field])) {
                showMessage(`Please enter a valid number for ${field}`, 'error');
                return false;
            }
        }

        // Specific range validation for phosphorus
        if (data.phosphorus < 0 || data.phosphorus > 100) {
            showMessage('Phosphorus must be between 0 and 100 mg/kg.', 'error');
            return false; // Changed from 'return;' to 'return false;' for consistency
        }

        // Add timestamp - use numeric (ms) for reliable comparisons
        data.timestamp = Date.now();

        // Get current user from Firebase Auth
        const user = auth.currentUser;
        if (!user) {
            showMessage('Session expired. Please login again.', 'error');
            return false;
        }

        data.userId = user.uid;
        data.userName = user.displayName || 'Farmer';

        // 1. Save to Firestore (Persistent History)
        await db.collection('soilData').doc(user.uid).collection('readings').add(data);
        console.log('Soil data saved to Firestore history');

        // 2. Save to localStorage (Instant Cache for Dashboard/Recs)
        try {
            localStorage.setItem(`nutriroot_latest_soil_data_${user.uid}`, JSON.stringify(data));
        } catch (storageError) {
            console.warn('script.js: localStorage.setItem failed:', storageError);
            // Non-critical, just won't be cached
        }

        return true;
    } catch (error) {
        console.error('Error saving soil data:', error);
        showMessage('Error saving data to cloud', 'error');
        return false;
    }
}

/**
 * Get latest soil data (from cache first, then Firestore)
 */
async function getLatestSoilData() {
    try {
        const user = auth.currentUser;
        if (!user) return null;

        // 1. Try Local Storage Cache (User-Specific)
        let cached = null;
        try {
            // First try user-specific key
            cached = localStorage.getItem(`nutriroot_latest_soil_data_${user.uid}`);
            // Fallback to generic key if user-specific is empty (migration/legacy support)
            if (!cached) {
                cached = localStorage.getItem('nutriroot_latest_soil_data');
            }
        } catch (storageError) {
            console.warn('script.js: localStorage.getItem failed:', storageError);
        }

        if (cached) {
            return JSON.parse(cached);
        }

        // 2. Fallback to Firestore Latest reading
        const snapshot = await db.collection('soilData')
            .doc(user.uid)
            .collection('readings')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            // Cache it for next time
            try {
                localStorage.setItem(`nutriroot_latest_soil_data_${user.uid}`, JSON.stringify(data));
            } catch (storageError) {
                console.warn('script.js: localStorage.setItem failed (fallback):', storageError);
            }
            return data;
        }

        return null;
    } catch (error) {
        console.error('Error getting latest soil data:', error);
        return null;
    }
}

/**
 * Get soil data history from Firestore
 */
async function getSoilHistory() {
    try {
        const user = auth.currentUser;
        if (!user) return [];

        const snapshot = await db.collection('soilData')
            .doc(user.uid)
            .collection('readings')
            .orderBy('timestamp', 'desc')
            .get();

        const history = [];
        snapshot.forEach(doc => {
            history.push({ id: doc.id, ...doc.data() });
        });

        return history;
    } catch (error) {
        console.error('Error getting soil history from Firestore:', error);
        return [];
    }
}

/**
 * Get the total number of soil analysis records for a user
 */
async function getAnalysisCount(uid) {
    try {
        const snapshot = await db.collection('soilData')
            .doc(uid)
            .collection('readings')
            .get();
        return snapshot.size;
    } catch (error) {
        console.error("Error getting analysis count:", error);
        return 0;
    }
}

/**
 * Clear all soil data (Firestore + LocalStorage)
 */
async function clearSoilData() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        // Clear Local Cache
        try {
            localStorage.removeItem('nutriroot_latest_soil_data');
        } catch (storageError) {
            console.warn('script.js: localStorage.removeItem failed:', storageError);
        }

        // Clear Firestore History (batch delete)
        const snapshot = await db.collection('soilData').doc(user.uid).collection('readings').get();
        const batch = db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        console.log('All soil records cleared');
        return true;
    } catch (error) {
        console.error('Error clearing soil data:', error);
        return false;
    }
}

/* ========================================
   SOIL ANALYSIS ENGINE
   ======================================== */

/**
 * Analyze soil data and generate recommendations
 */
function analyzeSoilData(soilData) {
    const analysis = {
        nitrogen: analyzeNutrient(soilData.nitrogen, 'nitrogen'),
        phosphorus: analyzeNutrient(soilData.phosphorus, 'phosphorus'),
        potassium: analyzeNutrient(soilData.potassium, 'potassium'),
        ph: analyzePH(soilData.ph),
        moisture: analyzeMoisture(soilData.moisture),
        temperature: analyzeTemperature(soilData.temperature)
    };

    // Generate overall status
    const overallStatus = calculateOverallStatus(analysis);

    // Generate warnings
    const warnings = generateWarnings(analysis, soilData);

    // Generate fertilizer recommendations
    const recommendations = generateRecommendations(analysis, soilData);

    // Get crop-specific recommendations
    const cropRecommendation = getCropRecommendation(soilData.crop, analysis);

    return {
        analysis,
        overallStatus,
        warnings,
        recommendations,
        cropRecommendation
    };
}

/**
 * Analyze individual nutrient levels
 */
function analyzeNutrient(value, nutrient) {
    const ranges = {
        nitrogen: { low: 30, optimal: [30, 70], high: 70 },
        phosphorus: { low: 20, optimal: [20, 100], high: 100 },
        potassium: { low: 25, optimal: [25, 65], high: 65 }
    };

    const range = ranges[nutrient];

    if (value < range.low) {
        return {
            status: 'low',
            message: `Low ${nutrient} levels detected`,
            value: value
        };
    } else if (value >= range.optimal[0] && value <= range.optimal[1]) {
        return {
            status: 'optimal',
            message: `${nutrient.charAt(0).toUpperCase() + nutrient.slice(1)} levels are optimal`,
            value: value
        };
    } else {
        return {
            status: 'high',
            message: `High ${nutrient} levels detected`,
            value: value
        };
    }
}

/**
 * Analyze pH levels
 */
function analyzePH(ph) {
    if (ph < 6.0) {
        return { status: 'low', message: 'Soil is too acidic', value: ph };
    } else if (ph >= 6.0 && ph <= 7.5) {
        return { status: 'optimal', message: 'pH level is optimal', value: ph };
    } else {
        return { status: 'high', message: 'Soil is too alkaline', value: ph };
    }
}

/**
 * Analyze moisture levels
 */
function analyzeMoisture(moisture) {
    if (moisture < 40) {
        return { status: 'low', message: 'Soil moisture is low', value: moisture };
    } else if (moisture >= 40 && moisture <= 60) {
        return { status: 'optimal', message: 'Moisture level is optimal', value: moisture };
    } else {
        return { status: 'high', message: 'Soil moisture is high', value: moisture };
    }
}

/**
 * Analyze temperature
 */
function analyzeTemperature(temp) {
    if (temp < 15) {
        return { status: 'low', message: 'Soil temperature is low', value: temp };
    } else if (temp >= 15 && temp <= 30) {
        return { status: 'optimal', message: 'Temperature is optimal', value: temp };
    } else {
        return { status: 'high', message: 'Soil temperature is high', value: temp };
    }
}


/**
 * Calculate overall soil health status and numeric score
 */
function calculateOverallStatus(analysis) {
    const statuses = [
        analysis.nitrogen.status,
        analysis.phosphorus.status,
        analysis.potassium.status,
        analysis.ph.status,
        analysis.moisture.status,
        analysis.temperature.status
    ];

    const optimalCount = statuses.filter(s => s === 'optimal').length;
    const lowCount = statuses.filter(s => s === 'low').length;
    const highCount = statuses.filter(s => s === 'high').length;

    // Calculate numeric score (0-100)
    // Each optimal parameter gives ~16.7 points
    const healthScore = Math.round((optimalCount / 6) * 100);

    let result = {
        score: healthScore,
        status: '',
        message: '',
        actions: []
    };

    if (healthScore >= 90) {
        result.status = 'excellent';
        result.message = 'Your soil is in excellent condition! All parameters are within optimal ranges.';
        result.actions = ['Maintain current management practices.', 'Monitor regularly to sustain high productivity.'];
    } else if (healthScore >= 70) {
        result.status = 'good';
        result.message = 'Your soil is in good condition with minor adjustments needed.';
        result.actions = ['Address minor nutrient imbalances.', 'Ensure consistent irrigation scheduling.'];
    } else if (healthScore >= 40) {
        result.status = 'fair';
        result.message = 'Your soil needs attention. Several parameters are outside optimal ranges.';
        result.actions = ['Apply specific fertilizers as recommended below.', 'Check soil pH levels and amend if necessary.', 'Improve drainage or irrigation based on moisture data.'];
    } else {
        result.status = 'poor';
        result.message = 'Immediate action required! Multiple soil parameters need correction.';
        result.actions = ['Complete nutrient restoration is recommended.', 'Urgent pH correction may be required.', 'Consult with an agronomist for a detailed recovery plan.'];
    }

    return result;
}

/**
 * Generate warnings based on analysis
 */
function generateWarnings(analysis, soilData) {
    const warnings = [];

    if (analysis.nitrogen.status === 'low') {
        warnings.push({
            type: 'Nitrogen Deficiency',
            severity: 'high',
            message: 'Low nitrogen can reduce crop growth and yield. Apply nitrogen-rich fertilizers.',
            parameter: 'Nitrogen',
            value: soilData.nitrogen,
            unit: 'mg/kg'
        });
    }

    if (analysis.phosphorus.status === 'low') {
        warnings.push({
            type: 'Phosphorus Deficiency',
            severity: 'high',
            message: 'Low phosphorus affects root development. Apply phosphate fertilizers.',
            parameter: 'Phosphorus',
            value: soilData.phosphorus,
            unit: 'mg/kg'
        });
    }

    if (analysis.potassium.status === 'low') {
        warnings.push({
            type: 'Potassium Deficiency',
            severity: 'medium',
            message: 'Low potassium reduces disease resistance. Apply potash fertilizers.',
            parameter: 'Potassium',
            value: soilData.potassium,
            unit: 'mg/kg'
        });
    }

    if (analysis.ph.status === 'low') {
        warnings.push({
            type: 'Acidic Soil',
            severity: 'high',
            message: 'Acidic soil can limit nutrient availability. Consider applying lime.',
            parameter: 'Soil pH',
            value: soilData.ph,
            unit: 'pH'
        });
    }

    if (analysis.ph.status === 'high') {
        warnings.push({
            type: 'Alkaline Soil',
            severity: 'high',
            message: 'Alkaline soil can cause nutrient deficiencies. Consider applying sulfur.',
            parameter: 'Soil pH',
            value: soilData.ph,
            unit: 'pH'
        });
    }

    if (analysis.moisture.status === 'low') {
        warnings.push({
            type: 'Low Moisture',
            severity: 'medium',
            message: 'Increase irrigation to maintain optimal moisture levels.',
            parameter: 'Moisture',
            value: soilData.moisture,
            unit: '%'
        });
    }

    if (analysis.moisture.status === 'high') {
        warnings.push({
            type: 'High Moisture',
            severity: 'medium',
            message: 'Excessive moisture can cause root rot. Improve drainage.',
            parameter: 'Moisture',
            value: soilData.moisture,
            unit: '%'
        });
    }


    return warnings;
}

/**
 * Generate fertilizer recommendations
 */
function generateRecommendations(analysis, soilData) {
    const recommendations = [];
    const { nitrogen, phosphorus, potassium, ph } = analysis;

    // PH correction is often the first step in professional soil management
    if (ph.status === 'low') {
        recommendations.push({
            fertilizer: 'Agricultural Lime',
            nutrient: 'PH Balancer',
            dosage: '2-4 tons/ha',
            reason: `Your soil pH of ${ph.value} is acidic. Agricultural Lime is essential to raise the pH level, which unlocks the availability of key nutrients like Nitrogen and Phosphorus that are otherwise trapped in the soil.`,
            ai_insight: `Raising pH to the optimal 6.5-7.0 range can increase your fertilizer efficiency by up to 50%.`
        });
    } else if (ph.status === 'high') {
        recommendations.push({
            fertilizer: 'Elemental Sulfur',
            nutrient: 'PH Balancer',
            dosage: '500-1000 kg/ha',
            reason: `Your soil pH of ${ph.value} is alkaline. Elemental Sulfur helps lower the pH, making micronutrients more available to your ${soilData.crop} crops.`,
            ai_insight: `Lowering pH prevents nutrient lockout and leaf yellowing commonly seen in alkaline soils.`
        });
    }

    // Nitrogen recommendations
    if (nitrogen.status === 'low') {
        recommendations.push({
            fertilizer: 'Urea',
            nutrient: 'Nitrogen',
            dosage: '100-150 kg/ha',
            reason: `Nitrogen level is low (${nitrogen.value} mg/kg). Urea provides a concentrated source of Nitrogen (46%) which is vital for the rapid vegetative growth and leaf greening of your ${soilData.crop}.`,
            ai_insight: `Early Nitrogen application is critical for maximum yield potential in the initial growth stages.`
        });
    }

    // Phosphorus recommendations
    if (phosphorus.status === 'low') {
        recommendations.push({
            fertilizer: 'DAP',
            nutrient: 'Phosphorus',
            dosage: '75-125 kg/ha',
            reason: `Phosphorus level is low (${phosphorus.value} mg/kg). DAP (Diammonium Phosphate) stimulates vigorous root development and ensures healthy plant establishment.`,
            ai_insight: `Phosphorus is the "energy currency" of the plant; fixing this now prevents stunted growth later.`
        });
    }

    // Potassium recommendations
    if (potassium.status === 'low') {
        recommendations.push({
            fertilizer: 'MOP',
            nutrient: 'Potassium',
            dosage: '50-100 kg/ha',
            reason: `Potassium level is low (${potassium.value} mg/kg). MOP (Muriate of Potash) improves water regulation, disease resistance, and product quality of your ${soilData.crop}.`,
            ai_insight: `Potassium strengthens cell walls, making your crops more resilient to drought and pests.`
        });
    }

    // Balanced maintenance or warnings for high levels
    if (recommendations.length === 0) {
        const isHigh = nitrogen.status === 'high' || phosphorus.status === 'high' || potassium.status === 'high';

        if (isHigh) {
            recommendations.push({
                fertilizer: 'Organic Compost / No Synthetic Fertilizer',
                nutrient: 'Soil Restoration',
                dosage: 'As needed',
                reason: 'Some nutrient levels are excessively high. Avoid synthetic fertilizers and focus on organic matter to balance soil biology.'
            });
        } else {
            recommendations.push({
                fertilizer: 'N-P-K 15-15-15 (Small Dose)',
                nutrient: 'Balanced Maintenance',
                dosage: '50 kg/ha',
                reason: 'Nutrient levels are currently optimal. A small maintenance dose will sustain soil health throughout the growing season for ' + soilData.crop + '.'
            });
        }
    }

    return recommendations;
}

/**
 * Feature-specific Logic (Premium)
 */

async function checkPremiumStatus(uid) {
    try {
        const doc = await db.collection('users').doc(uid).get();
        return doc.exists && doc.data().isPremium === true;
    } catch (error) {
        console.error("Error checking premium status:", error);
        return false;
    }
}

async function setPremiumStatus(uid, status) {
    try {
        await db.collection('users').doc(uid).set({
            isPremium: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        updatePremiumUI(status);
        return true;
    } catch (error) {
        console.error("Error setting premium status:", error);
        return false;
    }
}

function updatePremiumUI(isPremium) {
    const lockedElements = document.querySelectorAll('.premium-locked');
    const blurredElements = document.querySelectorAll('.premium-blur');
    const premiumBadges = document.querySelectorAll('.premium-badge');

    if (isPremium) {
        lockedElements.forEach(el => el.classList.remove('premium-locked'));
        blurredElements.forEach(el => el.classList.remove('premium-blur'));
        premiumBadges.forEach(el => el.style.display = 'inline-block');

        // Hide lock overlays
        document.querySelectorAll('.lock-overlay').forEach(el => el.style.display = 'none');
    }
}
/**
 * Get specific recommendations and tips for a particular crop
 */
function getCropRecommendation(crop, analysis) {
    const tips = {
        'Rice': {
            notes: 'Rice needs consistent water levels. Ensure your soil stays at optimal moisture (40-60%).',
            bestPH: '6.0 - 7.0'
        },
        'Wheat': {
            notes: 'Wheat is sensitive to waterlogging. Ensure good drainage if moisture is high.',
            bestPH: '6.0 - 7.5'
        },
        'Maize': {
            notes: 'Maize is a heavy feeder. Pay close attention to Nitrogen and Phosphorus levels.',
            bestPH: '5.8 - 7.0'
        },
        'Cotton': {
            notes: 'Cotton needs stable temperatures. Keep an eye on soil temperature readings.',
            bestPH: '5.5 - 7.5'
        },
        'Sugarcane': {
            notes: 'Sugarcane needs high Nitrogen for mass. Ensure Nitrogen stays optimal.',
            bestPH: '6.0 - 8.0'
        }
    };

    return tips[crop] || {
        notes: 'Maintain balanced N-P-K levels and consistent monitoring for best results.',
        bestPH: '6.0 - 7.5'
    };
}



/* ========================================
   UI UPDATES
   ======================================== */

/**
 * Update the dashboard with latest soil data
 */
async function updateDashboardUI() {
    // Start local sensor polling immediately (No Firebase)
    startLocalSensorPolling();

    const latestData = await getLatestSoilData();
    if (!latestData) {
        console.log('updateDashboardUI: No soil data found');
        return;
    }

    console.log('updateDashboardUI: Updating with', latestData);

    // Update NPK values
    const elements = {
        'nitrogenValue': latestData.nitrogen,
        'phosphorusValue': latestData.phosphorus,
        'potassiumValue': latestData.potassium,
        'phValue': latestData.ph,
        'moistureValue': latestData.moisture,
        'temperatureValue': latestData.temperature
    };

    for (const [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = value || '0.0';
    }

    // Update timestamp
    const timeEl = document.getElementById('lastUpdated');
    if (timeEl && latestData.timestamp) {
        timeEl.innerText = 'Last updated: ' + new Date(latestData.timestamp).toLocaleString();
    }

    // Update overall status if element exists
    const analysis = analyzeSoilData(latestData);
    const statusEl = document.getElementById('overallStatusMessage');
    if (statusEl) {
        statusEl.innerText = analysis.overallStatus.message;
        statusEl.className = 'status-message status-' + analysis.overallStatus.status;
    }

    // Update recommendations list on dashboard if element exists
    const recList = document.getElementById('dashboardRecommendations');
    if (recList) {
        recList.innerHTML = '';
        if (analysis.recommendations.length === 0) {
            recList.innerHTML = '<p class="info-text">No immediate fertilizer needs detected. Your soil is in good health!</p>';
        } else {
            analysis.recommendations.forEach(rec => {
                const div = document.createElement('div');
                div.className = 'mini-recommendation-card';
                div.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-weight: 700; color: var(--primary-color);">${rec.fertilizer}</span>
                        <span style="font-size: 0.75rem; background: rgba(67, 24, 255, 0.1); color: var(--accent-blue); padding: 2px 8px; border-radius: 99px;">${rec.nutrient}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--secondary-color); margin-bottom: 4px;">Dosage: ${rec.dosage}</p>
                    <p style="font-size: 0.85rem; color: #707EAE; line-height: 1.4;">${rec.reason}</p>
                `;
                recList.appendChild(div);
            });
        }
    }

    // Update sparkline graphs
    await updateDashboardGraphs();
}

/**
 * Poll local Python API bridge for MQTT sensor data
 */
let localPollingInterval = null;
function startLocalSensorPolling() {
    if (localPollingInterval) return;

    console.log('Starting local sensor polling (http://localhost:8000/sensors)');

    const poll = async () => {
        try {
            let response;
            try {
                response = await fetch('/sensors');
                if (!response.ok) throw new Error('Relative fetch failed');
            } catch (e) {
                console.log('Relative fetch failed, trying absolute fallback...');
                response = await fetch('http://localhost:8000/sensors');
            }

            if (!response.ok) throw new Error('Bridge unreachable on all paths');

            const data = await response.json();
            console.log('Local sensor data received:', data);

            // Update UI Gauges
            updateCircularGauge('moisture', data.moisture);
            updateCircularGauge('temp', data.temperature);

            // Update Card Values
            const mValue = document.getElementById('moistureValue');
            if (mValue) mValue.innerText = data.moisture !== undefined ? data.moisture : '--';

            const tValue = document.getElementById('temperatureValue');
            if (tValue) tValue.innerText = data.temperature !== undefined ? data.temperature : '--';

            // Sync with manual form hidden fields
            const modalM = document.getElementById('modal_moisture') || document.getElementById('crops_moisture');
            if (modalM) modalM.value = data.moisture || 0;

            const modalT = document.getElementById('modal_temperature') || document.getElementById('crops_temperature');
            if (modalT) modalT.value = data.temperature || 0;

            // Pulse the live indicators
            document.querySelectorAll('.live-pill .pulse').forEach(p => {
                p.style.animation = 'none';
                p.offsetHeight;
                p.style.animation = 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite';
            });

        } catch (error) {
            console.warn('Local bridge polling failed (Is mqtt_bridge.py running?):', error.message);
        }
    };

    // Poll every 2 seconds
    poll();
    localPollingInterval = setInterval(poll, 2000);
}

/**
 * Helper to update circular dashboard gauges
 */
function updateCircularGauge(type, value) {
    if (value === undefined || value === null) return;

    const progressId = type === 'moisture' ? 'moistureProgress' : 'tempProgress';
    const textId = type === 'moisture' ? 'gaugeMoistureValue' : 'gaugeTempValue';

    const circle = document.getElementById(progressId);
    const text = document.getElementById(textId);

    if (text) text.innerText = value;

    if (circle) {
        // SVG circle math: 2 * PI * r = 2 * 3.14159 * 45 ≈ 283
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;

        let percentage = 0;
        if (type === 'moisture') {
            percentage = value; // 0-100%
        } else {
            // Temperature mapping (let's say 0-50°C is 0-100%)
            percentage = (value / 50) * 100;
        }

        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        // Dynamic color transition
        if (type === 'moisture') {
            circle.style.stroke = value < 30 ? '#F44336' : (value > 70 ? '#2196F3' : '#4CAF50');
        } else {
            circle.style.stroke = value > 35 ? '#F44336' : (value < 15 ? '#2196F3' : '#FF9800');
        }
    }
}



/**
 * Update recommendation page UI
 */
async function updateRecommendationPageUI() {
    const latestData = await getLatestSoilData();
    const container = document.getElementById('recommendationsList');
    if (!container) return;

    if (!latestData) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 4rem; background: white; border-radius: 24px; border: 1px dashed #E0E5F2;">
                <h3 style="color: var(--primary-color); font-weight: 700;">No Soil Data Yet</h3>
                <p style="color: var(--secondary-color); margin-top: 0.5rem;">Please enter your soil parameters on the dashboard to see recommendations.</p>
                <button class="btn btn-primary" onclick="window.location.href='dashboard.html'" style="margin-top: 2rem;">Go to Dashboard</button>
            </div>
        `;
        return;
    }

    const result = analyzeSoilData(latestData);
    const scoreClass = `score-${result.overallStatus.status}`;

    let html = `
        <!-- Enhanced Soil Health Score Section -->
        <div class="info-section glass-card" style="margin-bottom: 3rem; background: white; border-radius: 24px; padding: 2.5rem; box-shadow: 0 12px 40px rgba(0,0,0,0.06); border: 1px solid #E0E5F2; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; right: 0; width: 200px; height: 200px; background: radial-gradient(circle, rgba(5, 205, 153, 0.03) 0%, transparent 70%); border-radius: 0 0 0 100px;"></div>
            
            <div style="display: flex; gap: 3rem; align-items: center; flex-wrap: wrap; position: relative; z-index: 1;">
                <!-- Circular Gauge -->
                <div class="soil-score-gauge ${scoreClass}" style="flex-shrink: 0;">
                    <svg viewBox="0 0 100 100">
                        <circle class="gauge-bg" cx="50" cy="50" r="45"></circle>
                        <circle class="gauge-progress" cx="50" cy="50" r="45" style="stroke-dasharray: 283; stroke-dashoffset: ${283 - (result.overallStatus.score / 100 * 283)};"></circle>
                    </svg>
                    <div class="gauge-content">
                        <span class="score-value">${result.overallStatus.score}</span>
                        <span class="score-label">HEALTH</span>
                    </div>
                </div>

                <div style="flex: 1; min-width: 300px;">
                    <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: var(--card-bg); border-radius: 12px; margin-bottom: 1.25rem; border: 1px solid #E0E5F2;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--accent-green); box-shadow: 0 0 10px var(--accent-green);"></div>
                        <span style="font-size: 0.85rem; font-weight: 700; color: var(--primary-color); text-transform: uppercase; letter-spacing: 1px;">Overall Condition: ${result.overallStatus.status}</span>
                    </div>

                    <h2 style="font-size: 2rem; font-weight: 800; color: var(--primary-color); margin: 0 0 1rem 0; line-height: 1.2;">
                        ${result.overallStatus.status === 'excellent' ? 'Exceptional Land Fertility' : result.overallStatus.status === 'good' ? 'Productive Soil Resources' : result.overallStatus.status === 'fair' ? 'Marginal Soil Health' : 'Critical Soil Restoration Required'}
                    </h2>
                    
                    <p style="color: #707EAE; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">
                        ${result.overallStatus.message}
                    </p>

                    <div style="background: #F8FAFC; border-radius: 16px; padding: 1.5rem; border: 1px solid #E0E5F2;">
                        <h4 style="font-size: 0.9rem; font-weight: 800; color: var(--primary-color); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            Improvement Actions
                        </h4>
                        <ul style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.75rem;">
                            ${result.overallStatus.actions.map(action => `
                                <li style="font-size: 0.95rem; color: #52665A; display: flex; align-items: flex-start; gap: 0.75rem;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="3" style="margin-top: 2px;">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    ${action}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <h3 class="section-title" style="margin-top: 4rem; margin-bottom: 2rem;">Soil Nutrient Status</h3>
        <div class="nutrient-status-grid">
            ${Object.entries(result.analysis).map(([key, data]) => {
        const icons = {
            nitrogen: '<path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path>',
            phosphorus: '<path d="M12 3v18M3 12h18"></path><circle cx="12" cy="12" r="4"></circle>',
            potassium: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
            ph: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>',
            moisture: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
            temperature: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>'
        };

        const statusClass = `status-${data.status}`;
        const iconBgClass = `status-${data.status}-bg`;
        const unit = key === 'ph' ? 'pH' : key === 'moisture' ? '%' : key === 'temperature' ? '°C' : 'mg/kg';

        return `
                    <div class="nutrient-card">
                        <div class="nutrient-card-header">
                            <div class="nutrient-icon-container ${iconBgClass}">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    ${icons[key] || ''}
                                </svg>
                            </div>
                            <span class="nutrient-status-badge ${statusClass}">${data.status}</span>
                        </div>
                        <div class="nutrient-value-container">
                            <span class="nutrient-label">${key}</span>
                            <span class="nutrient-value">${data.value} <small style="font-size: 0.65em; opacity: 0.7;">${unit}</small></span>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;

    // Add specific recommendations
    if (result.recommendations.length > 0) {
        let shopProducts = [];
        const engine = window.ProductEngine || (typeof ProductEngine !== 'undefined' ? ProductEngine : null);

        if (engine) {
            shopProducts = await engine.fetchProducts();
        }

        html += `<h3 class="section-title" style="margin-top: 4rem;">Recommended Strategy</h3>`;
        html += `<div class="rec-products-grid">`;

        const standardize = (str) => {
            if (!str) return '';
            return str.toLowerCase()
                .replace(/\(.*\)/g, '') // Remove parentheses content
                .replace(/\[.*\]/g, '') // Remove bracketed content
                .replace(/[^a-z\s]/g, '') // Remove everything except letters and spaces
                .replace(/\s+/g, ' ')
                .trim();
        };

        result.recommendations.forEach(rec => {
            // Fuzzy search for matching product
            const recName = standardize(rec.fertilizer);
            const matchingProduct = shopProducts.find(p => {
                const prodName = standardize(p.name);
                return prodName.includes(recName) || recName.includes(prodName);
            });

            if (matchingProduct) {
                const img = matchingProduct.image || matchingProduct.image_url || 'assets/images/products/generic-fertilizer.jpg';
                html += `
                    <div class="rec-product-card">
                        <div class="rec-card-top-layout">
                            <div class="rec-card-image">
                                <span class="rec-type-badge">${rec.nutrient}</span>
                                <img src="${img}" alt="${matchingProduct.name}" onerror="this.src='assets/images/tree-logo.png'">
                            </div>
                            
                            <div class="rec-card-ai-side">
                                <!-- AI Explanation Section (Now in the side panel) -->
                                <div class="rec-ai-explanation">
                                    <span class="rec-ai-badge">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                                        AI Recommendation
                                    </span>
                                    <p class="rec-ai-text">${rec.reason}</p>
                                    ${rec.ai_insight ? `<div style="margin-top: 1rem; display: flex; align-items: center; gap: 8px; color: var(--accent-green); font-weight: 700; font-size: 0.9rem;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2v20m-5-5l5 5 5-5"/></svg>
                                        Expert Tip: ${rec.ai_insight}
                                    </div>` : ''}
                                </div>
                            </div>
                        </div>

                        <div class="rec-card-content">
                            <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 2rem;">
                                <div style="flex: 1;">
                                    <h4 class="rec-card-title" style="font-size: 1.25rem; margin-bottom: 0.5rem;">${matchingProduct.name}</h4>
                                    <p class="rec-card-desc" style="margin-bottom: 1rem;">${matchingProduct.description || 'Professional grade solution for your specific soil deficiency.'}</p>
                                    
                                    <div style="font-size: 0.85rem; font-weight: 700; color: #64748B; background: #F1F5F9; padding: 6px 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                        Dosage: ${rec.dosage}
                                    </div>
                                </div>

                                <div class="rec-card-footer" style="padding: 0; border: none; flex-shrink: 0; text-align: right;">
                                    <div class="rec-card-price" style="display: block; margin-bottom: 0.75rem; font-size: 1.5rem;">₹${matchingProduct.price}</div>
                                    <div class="rec-card-actions">
                                        <button class="btn btn-primary" onclick="ProductEngine.handleAddToCartById('${matchingProduct.id}')" style="padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700;">
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // No match in shop - show text-only simpler info
                html += `
                    <div class="rec-simple-info" style="grid-column: 1 / -1;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h4 style="font-size: 1.4rem; font-weight: 800; color: var(--primary-color); margin: 0 0 0.5rem 0;">${rec.fertilizer}</h4>
                                <span style="font-size: 0.8rem; font-weight: 800; color: var(--accent-green); text-transform: uppercase;">${rec.nutrient}</span>
                            </div>
                            <div class="rec-simple-dosage">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 8px;">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                </svg>
                                Recommended Dosage: ${rec.dosage}
                            </div>
                        </div>
                        
                        <!-- AI Explanation for non-shop items -->
                        <div class="rec-ai-explanation">
                            <span class="rec-ai-badge">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                                AI Insights & Analysis
                            </span>
                            <p class="rec-ai-text">${rec.reason}</p>
                            ${rec.ai_insight ? `<p style="margin-top: 0.75rem; color: var(--accent-green); font-weight: 700; font-size: 0.9rem;">Expert Tip: ${rec.ai_insight}</p>` : ''}
                        </div>
                    </div>
                `;
            }
        });

        html += `</div>`;
    } else {
        html += `
            <div class="info-section" style="text-align: center; padding: 2rem;">
                <p>No specific fertilizer recommendations needed at this time.</p>
            </div>
        `;
    }

    container.innerHTML = html;

    // Load Product Recommendations
    const productContainer = document.getElementById('recommendedProducts');
    if (productContainer && window.ProductEngine) {
        console.log('RecommendationPage: Requesting product recommendations for:', result.analysis);
        const products = await ProductEngine.getRecommendations(result.analysis);
        console.log('RecommendationPage: Found matched products:', products.length);

        if (products.length > 0) {
            let productHtml = `
                <div class="section-title" style="display: flex; justify-content: space-between; align-items: center; margin-top: 4rem;">
                    <span>Top Recommended Products</span>
                    <a href="shop.html" style="font-size: 0.9rem; color: var(--accent-green); text-decoration: none; font-weight: 600;">Browse All &rarr;</a>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
            `;

            products.slice(0, 3).forEach(product => {
                const img = product.image || product.image_url || 'assets/images/products/generic-fertilizer.jpg';
                productHtml += `
                    <div class="product-card" style="background: white; border-radius: 20px; border: 1px solid #E0E5F2; overflow: hidden; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                        <div style="height: 200px; background: #F9FAFC; display: flex; align-items: center; justify-content: center; position: relative; padding: 1rem;">
                            <img src="${img}" alt="${product.name}" style="max-height: 100%; max-width: 100%; object-fit: contain; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.08));" onerror="this.src='assets/images/tree-logo.png'">
                            ${product.matchReason ? `<span style="position: absolute; top: 12px; left: 12px; background: #E6F7F2; color: #05CD99; font-size: 0.7rem; padding: 4px 10px; border-radius: 8px; font-weight: 700; box-shadow: 0 2px 8px rgba(5,205,153,0.15);">${product.matchReason}</span>` : ''}
                        </div>
                        <div style="padding: 1.5rem;">
                            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; color: var(--primary-color); font-weight: 700; line-height: 1.4;">${product.name}</h4>
                            <p style="color: #707EAE; font-size: 0.85rem; margin-bottom: 1.25rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.description || 'Professional grade fertilizer for optimal results.'}</p>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                                <span style="font-weight: 800; color: var(--accent-green); font-size: 1.25rem;">₹${product.price}</span>
                                <button class="btn btn-primary btn-sm" onclick="ProductEngine.handleAddToCartById('${product.id}')" style="padding: 0.5rem 1.25rem; border-radius: 10px;">Buy Now</button>
                            </div>
                        </div>
                    </div>
                `;
            });

            productHtml += `</div>`;
            productContainer.innerHTML = productHtml;
        } else {
            productContainer.innerHTML = `
                <div style="margin-top: 4rem; padding: 3rem; background: #F9FAFC; border-radius: 24px; text-align: center; border: 1px dashed #E0E5F2;">
                    <p style="color: #707EAE;">No specific products matched your current soil profile, but you can explore our full catalog.</p>
                    <a href="shop.html" class="btn btn-outline" style="display: inline-flex; margin-top: 1rem;">View All Products</a>
                </div>
            `;
        }
    }
}

/**
 * Update history page UI
 */
async function updateHistoryUI() {
    const container = document.getElementById('history-container');
    if (!container) return;

    const history = await getSoilHistory();
    const clearBtn = document.getElementById('clearHistoryBtn');

    if (history.length === 0) {
        if (clearBtn) clearBtn.style.display = 'none';
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 4rem; background: white; border-radius: 24px; border: 1px dashed #E0E5F2;">
                <h3 style="color: var(--primary-color); font-weight: 700;">No Analysis History</h3>
                <p style="color: var(--secondary-color); margin-top: 0.5rem;">Your past soil records will appear here for tracking.</p>
                <button class="btn btn-primary" onclick="window.location.href='dashboard.html'" style="margin-top: 2rem;">Start New Analysis</button>
            </div>
        `;
        return;
    }

    if (clearBtn) clearBtn.style.display = 'flex';

    let html = `
        <div class="history-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <!--Header for the list-->
            <div style="display: flex; padding: 0 1.25rem 0.5rem; color: #A3AED0; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                <div style="min-width: 180px;">Date & Status</div>
                <div style="flex: 1;">Target Crop</div>
                <div style="flex: 1.5;">Suggested Fertilizers</div>
                <div style="min-width: 200px;">NPK Levels (mg/kg)</div>
                <div style="min-width: 220px;">pH / Moist / Temp</div>
                <div style="width: 36px;"></div>
            </div>
    `;

    // Show latest first
    [...history].reverse().forEach((record) => {
        const result = analyzeSoilData(record);
        const date = new Date(record.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusColor = result.overallStatus.status === 'excellent' ? '#05CD99' :
            result.overallStatus.status === 'good' ? '#4ade80' :
                result.overallStatus.status === 'fair' ? '#FFAC33' : '#EE5D72';

        // Format fertilizers as pill badges
        const fertilizerBadges = result.recommendations.length > 0
            ? result.recommendations.map(rec => `
                <span style="background: rgba(67, 24, 255, 0.05); color: #4318FF; font-size: 0.7rem; padding: 2px 8px; border-radius: 6px; font-weight: 600; margin-right: 4px; border: 1px solid rgba(67, 24, 255, 0.1); white-space: nowrap;">${rec.fertilizer}</span>
            `).join('')
            : '<span style="color: #05CD99; font-size: 0.75rem; font-weight: 600;">✓ Optimal</span>';

        html += `
            <div class="history-item-row" style="display: flex; align-items: center; background: white; border-radius: 16px; padding: 0.875rem 1.25rem; border: 1px solid #E0E5F2; transition: transform 0.2s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                <!--Status & Date-->
                <div style="display: flex; align-items: center; gap: 12px; min-width: 180px;">
                    <div title="${result.overallStatus.status}" style="width: 10px; height: 10px; border-radius: 50%; background: ${statusColor}; flex-shrink: 0; box-shadow: 0 0 8px ${statusColor}44;"></div>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 0.85rem; font-weight: 700; color: var(--primary-color);">${formattedDate}</span>
                        <span style="font-size: 0.7rem; color: #A3AED0; font-weight: 500;">${formattedTime}</span>
                    </div>
                </div>

                <!--Crop -->
                <div style="flex: 1; min-width: 0; padding-right: 1rem;">
                    <span style="font-weight: 700; color: var(--primary-color); font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${record.crop}</span>
                </div>

                <!--Fertilizers -->
                <div style="flex: 1.5; min-width: 0; display: flex; flex-wrap: nowrap; overflow: hidden; align-items: center; margin-right: 1rem;">
                    ${fertilizerBadges}
                </div>

                <!--NPK Values-->
                <div style="display: flex; gap: 0.75rem; min-width: 200px; background: #F8FAFC; padding: 6px 12px; border-radius: 10px; margin-right: 1.5rem;">
                    <div style="flex: 1; text-align: center;"><small style="color: #A3AED0; font-weight: 700; font-size: 0.65rem; display: block;">N</small><span style="font-weight: 800; font-size: 0.85rem; color: #4318FF;">${record.nitrogen}</span></div>
                    <div style="flex: 1; text-align: center; border-left: 1px solid #E0E5F2; border-right: 1px solid #E0E5F2;"><small style="color: #A3AED0; font-weight: 700; font-size: 0.65rem; display: block;">P</small><span style="font-weight: 800; font-size: 0.85rem; color: #9747FF;">${record.phosphorus}</span></div>
                    <div style="flex: 1; text-align: center;"><small style="color: #A3AED0; font-weight: 700; font-size: 0.65rem; display: block;">K</small><span style="font-weight: 800; font-size: 0.85rem; color: #FF5630;">${record.potassium}</span></div>
                </div>

                <!--Other Values-->
                <div style="display: flex; gap: 0.75rem; min-width: 220px; align-items: center;">
                    <div style="font-size: 0.8rem; color: #707EAE;"><strong style="color: var(--primary-color);">${record.ph}</strong> <small>pH</small></div>
                    <div style="font-size: 0.8rem; color: #707EAE;"><strong style="color: var(--primary-color);">${record.moisture}%</strong> <small>M</small></div>
                    <div style="font-size: 0.8rem; color: #707EAE;"><strong style="color: var(--primary-color);">${record.temperature}°C</strong> <small>T</small></div>
                </div>

                <!--Delete Action-->
                <div style="width: 36px; text-align: right;">
                    <button class="btn-icon danger" onclick="deleteHistoryItem('${record.id}')" title="Delete Record" style="background: rgba(238, 93, 114, 0.08); color: var(--accent-red); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

/**
 * Update alerts page UI
 */
/**
 * Update alerts page UI
 * (Logic moved to js/alerts.js)
 */
async function updateAlertsPageUI() {
    // Deprecated: js/alerts.js now handles this
    console.log('Legacy updateAlertsPageUI called - functionality moved to alerts.js');
}

/**
 * Confirm and clear all history
 */
async function confirmClearHistory() {
    if (confirm('Are you sure you want to clear your entire analysis history? This cannot be undone.')) {
        await clearSoilData();
        await updateHistoryUI();
        showMessage('History cleared successfully', 'success');
    }
}

/**
 * Delete a single history item from Firestore
 */
async function deleteHistoryItem(id) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        await db.collection('soilData').doc(user.uid).collection('readings').doc(id).delete();

        // Check if we need to update LocalStorage (if we deleted the latest)
        const history = await getSoilHistory();
        const latestInStorage = getLatestSoilData();

        if (history.length > 0) {
            // Check if deleted item was the cached one (approximate by timestamp if needed, but here we just cache first in history)
            if (latestInStorage && history[0].timestamp !== latestInStorage.timestamp) {
                localStorage.setItem('nutriroot_latest_soil_data', JSON.stringify(history[0]));
            }
        } else {
            localStorage.removeItem('nutriroot_latest_soil_data');
        }

        await updateHistoryUI();
        showMessage('Record deleted from cloud', 'success');
    } catch (error) {
        console.error('Error deleting record:', error);
        showMessage('Error deleting record', 'error');
    }
}

// Automatically update UI on relevant pages - Wait for Auth to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Check auth state for premium features
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            const isPremium = await checkPremiumStatus(user.uid);
            updatePremiumUI(isPremium);
            await updateAlertBadge();


            if (document.getElementById('nitrogenValue')) {
                await updateDashboardUI();
            }
            // Also start polling if gauges exist on ANY page (Dashboard or Crops)
            if (document.getElementById('moistureProgress') || document.getElementById('tempProgress')) {
                startLocalSensorPolling();
            }
            if (document.getElementById('recommendationsList')) {
                await updateRecommendationPageUI();
            }
            if (document.getElementById('history-container')) {
                await updateHistoryUI();
            }
            if (document.getElementById('history-container')) {
                await updateHistoryUI();
            }
            // alerts.js handles its own rendering now

        }
    });
});




/* ========================================
   SPARKLINE GRAPHS LOGIC
   ======================================== */

/**
 * Generate an SVG path for a sparkline graph from data points
 * @param {Array<number>} data - Array of values
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 * @returns {string} SVG path 'd' string
 */
function generateSparklinePath(data, width = 100, height = 40) {
    if (!data || data.length === 0) return `M 0 ${height / 2} L ${width} ${height / 2} `;

    // If only one point, draw a flat line
    if (data.length === 1) return `M 0 ${height / 2} L ${width} ${height / 2} `;

    const min = Math.min(...data);
    const max = Math.max(...data);
    // Avoid division by zero
    const range = (max - min) === 0 ? 1 : (max - min);

    // Create points
    const points = data.map((val, index) => {
        const x = (index / (data.length - 1)) * width;
        // Invert Y (SVG 0 is top), add padding (5px)
        const normalizedY = 1 - ((val - min) / range);
        const y = (normalizedY * (height - 10)) + 5;
        return `${x} ${y} `;
    });

    // Create path command
    return `M ${points.join(' L ')} `;
}

/**
 * Update dashboard sparklines with real history data
 */
async function updateDashboardGraphs() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        let history = [];
        // Check if we can fetch history
        if (typeof getSoilHistory === 'function') {
            const allHistory = await getSoilHistory();
            if (allHistory) history = allHistory;
        }

        if (!history || history.length < 2) {
            console.log('Not enough history for dynamic graphs');
            return;
        }

        // Take last 10 entries (chronological order required for graph)
        const recent = history.slice(0, 10).reverse();

        const nData = recent.map(r => parseFloat(r.nitrogen || 0));
        const pData = recent.map(r => parseFloat(r.phosphorus || 0));
        const kData = recent.map(r => parseFloat(r.potassium || 0));

        const nPath = document.getElementById('nitrogenGraph');
        const pPath = document.getElementById('phosphorusGraph');
        const kPath = document.getElementById('potassiumGraph');

        if (nPath) nPath.setAttribute('d', generateSparklinePath(nData));
        if (pPath) pPath.setAttribute('d', generateSparklinePath(pData));
        if (kPath) kPath.setAttribute('d', generateSparklinePath(kData));

        console.log('Updated dashboard graphs with real data points:', recent.length);

    } catch (error) {
        console.error('Error updating dashboard graphs:', error);
    }
}

// End of script




/* ========================================
   NOTIFICATION BADGE LOGIC (Updated View Check)
   ======================================== */

/**
 * Check for soil deficiencies and update the nav badge
 * Checks if user has already viewed the latest analysis.
 */
async function updateAlertBadge() {
    const badge = document.getElementById('alertBadge');
    if (!badge) return;

    try {
        const soilData = await getLatestSoilData();
        if (!soilData) {
            badge.style.display = 'none';
            return;
        }

        // Check if user has already viewed this specific analysis
        const lastViewedTime = localStorage.getItem('nutriroot_last_viewed_analysis');

        // Convert timestamp to numeric if it's an ISO string (legacy compatibility)
        const currentTs = typeof soilData.timestamp === 'string' ?
            new Date(soilData.timestamp).getTime() :
            soilData.timestamp;

        if (lastViewedTime && parseInt(lastViewedTime) >= currentTs) {
            badge.style.display = 'none';
            return;
        }

        const analysis = analyzeSoilData(soilData);
        const warnings = analysis.warnings || [];

        // Count critical and medium severity issues
        const issues = warnings.filter(w => w.severity === 'high' || w.severity === 'medium').length;

        if (issues > 0) {
            badge.textContent = issues > 9 ? '9+' : issues;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch (e) {
        console.warn('Failed to update alert badge:', e);
        badge.style.display = 'none';
    }
}

/* ========================================
   IoT SENSOR INTEGRATION (Live Updates)
   ======================================== */

/**
 * Initialize real-time sensor listener
 */
function initSensorIntegration() {
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('IoT: Starting live sensor listener for', user.uid);
            listenForSensorUpdates(user.uid);
        }
    });
}

/**
 * Listen for updates from Firestore users/{uid}/liveData/sensors
 */
function listenForSensorUpdates(uid) {
    db.collection('users').doc(uid).collection('liveData').doc('sensors')
        .onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                console.log('IoT: Received live data:', data);
                updateSensorUI(data);
            } else {
                console.log('IoT: No live sensor data document found yet');
            }
        }, (error) => {
            console.error('IoT: Error listening for updates:', error);
        });
}

/**
 * Update the circular gauges and hidden inputs with live data
 */
function updateSensorUI(data) {
    const moisture = data.moisture || 0;
    const temp = data.temperature || 0;

    // Update Moisture Gauge
    const moistureValEl = document.getElementById('gaugeMoistureValue');
    const moistureProgressEl = document.getElementById('moistureProgress');
    const moistureHidden = document.getElementById('modal_moisture');

    if (moistureValEl) moistureValEl.innerText = moisture.toFixed(1);
    if (moistureProgressEl) {
        // Circumference = 2 * PI * 45 ≈ 283
        const offset = 283 - (moisture / 100) * 283;
        moistureProgressEl.style.strokeDashoffset = offset;
    }
    if (moistureHidden) moistureHidden.value = moisture;

    // Update Temp Gauge
    const tempValEl = document.getElementById('gaugeTempValue');
    const tempProgressEl = document.getElementById('tempProgress');
    const tempHidden = document.getElementById('modal_temperature');

    if (tempValEl) tempValEl.innerText = temp.toFixed(1);
    if (tempProgressEl) {
        // For temp, let's normalize 0-50°C to 0-100%
        const normalizedTemp = Math.max(0, Math.min(50, temp));
        const offset = 283 - (normalizedTemp / 50) * 283;
        tempProgressEl.style.strokeDashoffset = offset;
    }
    if (tempHidden) tempHidden.value = temp;
}

// Start sensor integration on page load if we are on dashboard
if (window.location.pathname.includes('dashboard.html')) {
    initSensorIntegration();
}

/**
 * Toggle mobile navigation for internal pages (dashboard, shop, etc.)
 */
function toggleMobileNav() {
    const navLinks = document.querySelector('.nav-links') || document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');

    if (navLinks) {
        navLinks.classList.toggle('active');
        if (mobileToggle) mobileToggle.classList.toggle('active');
    }
}

// Alias for landing page compatibility
window.toggleMobileMenu = toggleMobileNav;
// Export functions to window if needed
window.toggleMobileNav = toggleMobileNav;

/**
 * Handle closing mobile menu on link click
 */
document.addEventListener('click', (e) => {
    const navLinks = document.querySelector('.nav-links');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');

    // Close if clicking outside nav links but on a toggle or link
    if (navLinks && navLinks.classList.contains('active')) {
        if (!navLinks.contains(e.target) && !mobileToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            mobileToggle.classList.remove('active');
        }
    }
});

// Close mobile menu when clicking internal nav links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        const navLinks = document.querySelector('.nav-links');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        if (navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            mobileToggle.classList.remove('active');
        }
    });
});

// Export functions to window if needed
window.toggleMobileNav = toggleMobileNav;
