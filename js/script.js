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
 * Save soil data to localStorage
 */
function saveSoilData(data) {
    try {
        // Validate data - ensure all fields have values
        const requiredFields = ['nitrogen', 'phosphorus', 'potassium', 'ph', 'moisture', 'temperature', 'crop'];
        for (const field of requiredFields) {
            if (data[field] === undefined || data[field] === null || data[field] === '') {
                showMessage(`Please fill the ${field} field`, 'error');
                return false;
            }
            // Check for NaN if we expect a number
            if (field !== 'crop' && isNaN(data[field])) {
                showMessage(`Please enter a valid number for ${field}`, 'error');
                return false;
            }
        }

        // Add timestamp
        data.timestamp = new Date().toISOString();

        // Get current user
        const user = getCurrentUser();
        if (user) {
            data.userId = user.uid;
        }

        // Get existing history
        const history = getSoilHistory();

        // Add new data to history
        history.push(data);

        // Save to localStorage
        localStorage.setItem('nutriroot_soil_history', JSON.stringify(history));
        localStorage.setItem('nutriroot_latest_soil_data', JSON.stringify(data));

        return true;
    } catch (error) {
        console.error('Error saving soil data:', error);
        showMessage('Error saving data', 'error');
        return false;
    }
}

/**
 * Get latest soil data
 */
function getLatestSoilData() {
    try {
        const data = localStorage.getItem('nutriroot_latest_soil_data');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error getting soil data:', error);
        return null;
    }
}

/**
 * Get soil data history
 */
function getSoilHistory() {
    try {
        const history = localStorage.getItem('nutriroot_soil_history');
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('Error getting soil history:', error);
        return [];
    }
}

/**
 * Clear all soil data
 */
function clearSoilData() {
    localStorage.removeItem('nutriroot_latest_soil_data');
    localStorage.removeItem('nutriroot_soil_history');
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
        phosphorus: { low: 20, optimal: [20, 60], high: 60 },
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
 * Calculate overall soil health status
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

    if (optimalCount === 6) {
        return {
            status: 'excellent',
            message: 'Your soil is in excellent condition! All parameters are within optimal ranges.'
        };
    } else if (optimalCount >= 4) {
        return {
            status: 'good',
            message: 'Your soil is in good condition with minor adjustments needed.'
        };
    } else if (optimalCount >= 2) {
        return {
            status: 'fair',
            message: 'Your soil needs attention. Several parameters are outside optimal ranges.'
        };
    } else {
        return {
            status: 'poor',
            message: 'Immediate action required! Multiple soil parameters need correction.'
        };
    }
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
            message: 'Low nitrogen can reduce crop growth and yield. Apply nitrogen-rich fertilizers.'
        });
    }

    if (analysis.phosphorus.status === 'low') {
        warnings.push({
            type: 'Phosphorus Deficiency',
            severity: 'high',
            message: 'Low phosphorus affects root development. Apply phosphate fertilizers.'
        });
    }

    if (analysis.potassium.status === 'low') {
        warnings.push({
            type: 'Potassium Deficiency',
            severity: 'medium',
            message: 'Low potassium reduces disease resistance. Apply potash fertilizers.'
        });
    }

    if (analysis.ph.status === 'low') {
        warnings.push({
            type: 'Acidic Soil',
            severity: 'high',
            message: 'Acidic soil can limit nutrient availability. Consider applying lime.'
        });
    }

    if (analysis.ph.status === 'high') {
        warnings.push({
            type: 'Alkaline Soil',
            severity: 'high',
            message: 'Alkaline soil can cause nutrient deficiencies. Consider applying sulfur.'
        });
    }

    if (analysis.moisture.status === 'low') {
        warnings.push({
            type: 'Low Moisture',
            severity: 'medium',
            message: 'Increase irrigation to maintain optimal moisture levels.'
        });
    }

    if (analysis.moisture.status === 'high') {
        warnings.push({
            type: 'High Moisture',
            severity: 'medium',
            message: 'Excessive moisture can cause root rot. Improve drainage.'
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
            nutrient: 'pH Balancer',
            dosage: '2-4 tons/ha',
            reason: 'Soil is acidic (pH ' + ph.value + '). Lime is essential to raise pH and unlock nutrient availability.'
        });
    } else if (ph.status === 'high') {
        recommendations.push({
            fertilizer: 'Elemental Sulfur',
            nutrient: 'pH Balancer',
            dosage: '500-1000 kg/ha',
            reason: 'Soil is alkaline (pH ' + ph.value + '). Sulfur helps lower pH to a range suitable for ' + soilData.crop + '.'
        });
    }

    // Nitrogen recommendations
    if (nitrogen.status === 'low') {
        recommendations.push({
            fertilizer: 'Urea (46% N)',
            nutrient: 'Nitrogen',
            dosage: '100-150 kg/ha',
            reason: 'To correct significant nitrogen deficiency and support rapid vegetative growth in ' + soilData.crop + '.'
        });
    }

    // Phosphorus recommendations
    if (phosphorus.status === 'low') {
        recommendations.push({
            fertilizer: 'DAP (18-46-0)',
            nutrient: 'Phosphorus',
            dosage: '75-125 kg/ha',
            reason: 'High phosphorus content in DAP will stimulate root development and early plant vigor.'
        });
    }

    // Potassium recommendations
    if (potassium.status === 'low') {
        recommendations.push({
            fertilizer: 'MOP (0-0-60)',
            nutrient: 'Potassium',
            dosage: '50-100 kg/ha',
            reason: 'Potassium is vital for water regulation and disease resistance, especially in ' + soilData.crop + '.'
        });
    }

    // Balanced maintenance if all are optimal
    if (nitrogen.status === 'optimal' && phosphorus.status === 'optimal' && potassium.status === 'optimal' && recommendations.length === 0) {
        recommendations.push({
            fertilizer: 'N-P-K 15-15-15',
            nutrient: 'Balanced Maintenance',
            dosage: '50 kg/ha',
            reason: 'Nutrient levels are currently optimal. A small maintenance dose will sustain soil health throughout the growing season.'
        });
    }

    return recommendations;
}

/**
 * Get crop-specific recommendations
 */
function getCropRecommendation(crop, analysis) {
    const cropData = {
        'Rice': {
            idealPH: '5.5 - 7.0',
            idealMoisture: '50-60%',
            npkRatio: '120:60:40',
            notes: 'Rice requires consistent moisture. Ensure proper water management.'
        },
        'Wheat': {
            idealPH: '6.0 - 7.5',
            idealMoisture: '40-50%',
            npkRatio: '120:60:40',
            notes: 'Wheat prefers well-drained soil. Avoid waterlogging.'
        },
        'Maize': {
            idealPH: '5.8 - 7.0',
            idealMoisture: '45-55%',
            npkRatio: '150:75:75',
            notes: 'Maize is a heavy feeder. Apply fertilizers in split doses.'
        },
        'Cotton': {
            idealPH: '6.0 - 7.5',
            idealMoisture: '40-50%',
            npkRatio: '120:60:60',
            notes: 'Cotton requires good drainage and moderate moisture.'
        },
        'Sugarcane': {
            idealPH: '6.0 - 7.5',
            idealMoisture: '50-60%',
            npkRatio: '150:75:100',
            notes: 'Sugarcane needs high potassium for sugar content.'
        },
        'Vegetables': {
            idealPH: '6.0 - 7.0',
            idealMoisture: '50-60%',
            npkRatio: '100:50:50',
            notes: 'Most vegetables prefer slightly acidic to neutral soil.'
        }
    };

    return cropData[crop] || {
        idealPH: '6.0 - 7.5',
        idealMoisture: '40-60%',
        npkRatio: '100:50:50',
        notes: 'Maintain balanced nutrition and proper moisture levels.'
    };
}

/**
 * Generate crop suggestions based on soil analysis
 */
function generateCropSuggestions(soilData, analysis) {
    const suggestions = [];
    // Analysis is the nested analysis object from analyzeSoilData


    // Define crop requirements and scoring system
    const crops = [
        {
            name: 'Rice',
            idealPH: [5.5, 7.0],
            idealMoisture: [50, 60],
            idealTemperature: [20, 35],
            nitrogenTolerance: 'medium',
            phosphorusTolerance: 'medium',
            potassiumTolerance: 'medium',
            waterRequirement: 'high',
            description: 'Rice is a staple crop that thrives in moist conditions and can tolerate slightly acidic soil.',
            yield: 'High',
            season: 'Kharif (Monsoon)',
            benefits: ['High yield potential', 'Good for wet conditions', 'Staple food crop']
        },
        {
            name: 'Wheat',
            idealPH: [6.0, 7.5],
            idealMoisture: [40, 50],
            idealTemperature: [15, 25],
            nitrogenTolerance: 'high',
            phosphorusTolerance: 'medium',
            potassiumTolerance: 'medium',
            waterRequirement: 'medium',
            description: 'Wheat prefers well-drained soil and moderate temperatures. It\'s a major cereal crop.',
            yield: 'High',
            season: 'Rabi (Winter)',
            benefits: ['High yield', 'Good for dry conditions', 'Essential food grain']
        },
        {
            name: 'Maize',
            idealPH: [5.8, 7.0],
            idealMoisture: [45, 55],
            idealTemperature: [20, 30],
            nitrogenTolerance: 'high',
            phosphorusTolerance: 'high',
            potassiumTolerance: 'high',
            waterRequirement: 'medium',
            description: 'Maize is a versatile crop that can be grown in various soil types and is used for food, feed, and industrial purposes.',
            yield: 'Very High',
            season: 'Kharif/Rabi',
            benefits: ['Very high yield', 'Multiple uses', 'Quick maturing']
        },
        {
            name: 'Cotton',
            idealPH: [6.0, 7.5],
            idealMoisture: [40, 50],
            idealTemperature: [25, 35],
            nitrogenTolerance: 'medium',
            phosphorusTolerance: 'medium',
            potassiumTolerance: 'high',
            waterRequirement: 'medium',
            description: 'Cotton requires warm temperatures and well-drained soil. It\'s a major cash crop.',
            yield: 'Medium-High',
            season: 'Kharif',
            benefits: ['High value cash crop', 'Good for arid regions', 'Long staple fiber']
        },
        {
            name: 'Sugarcane',
            idealPH: [6.0, 7.5],
            idealMoisture: [50, 60],
            idealTemperature: [25, 35],
            nitrogenTolerance: 'high',
            phosphorusTolerance: 'medium',
            potassiumTolerance: 'very_high',
            waterRequirement: 'high',
            description: 'Sugarcane thrives in warm, humid conditions and requires high potassium for sugar production.',
            yield: 'Very High',
            season: 'Annual/Perennial',
            benefits: ['Highest sugar yield', 'Long growing season', 'High economic value']
        },
        {
            name: 'Tomatoes',
            idealPH: [6.0, 6.8],
            idealMoisture: [50, 60],
            idealTemperature: [20, 25],
            nitrogenTolerance: 'medium',
            phosphorusTolerance: 'high',
            potassiumTolerance: 'high',
            waterRequirement: 'medium',
            description: 'Tomatoes prefer slightly acidic soil and consistent moisture. They\'re highly nutritious.',
            yield: 'High',
            season: 'Year-round',
            benefits: ['High nutritional value', 'Good market price', 'Multiple varieties']
        },
        {
            name: 'Potatoes',
            idealPH: [5.0, 6.5],
            idealMoisture: [60, 70],
            idealTemperature: [15, 20],
            nitrogenTolerance: 'high',
            phosphorusTolerance: 'high',
            potassiumTolerance: 'medium',
            waterRequirement: 'high',
            description: 'Potatoes grow best in loose, well-drained soil with high organic matter content.',
            yield: 'Very High',
            season: 'Rabi',
            benefits: ['High yield per acre', 'Staple food', 'Good storage life']
        },
        {
            name: 'Soybean',
            idealPH: [6.0, 7.0],
            idealMoisture: [45, 55],
            idealTemperature: [20, 30],
            nitrogenTolerance: 'medium',
            phosphorusTolerance: 'high',
            potassiumTolerance: 'medium',
            waterRequirement: 'medium',
            description: 'Soybean is a legume that fixes nitrogen and can improve soil fertility.',
            yield: 'High',
            season: 'Kharif',
            benefits: ['Nitrogen fixer', 'High protein content', 'Oil extraction']
        },
        {
            name: 'Groundnuts',
            idealPH: [6.0, 7.0],
            idealMoisture: [40, 50],
            idealTemperature: [25, 35],
            nitrogenTolerance: 'medium',
            phosphorusTolerance: 'high',
            potassiumTolerance: 'medium',
            waterRequirement: 'low',
            description: 'Groundnuts prefer sandy loam soil and can tolerate drought conditions.',
            yield: 'High',
            season: 'Kharif',
            benefits: ['Drought tolerant', 'High oil content', 'Good for sandy soils']
        },
        {
            name: 'Chickpeas',
            idealPH: [6.0, 8.0],
            idealMoisture: [30, 40],
            idealTemperature: [15, 25],
            nitrogenTolerance: 'medium',
            phosphorusTolerance: 'high',
            potassiumTolerance: 'medium',
            waterRequirement: 'low',
            description: 'Chickpeas are drought-tolerant legumes that can grow in poor soil conditions.',
            yield: 'Medium',
            season: 'Rabi',
            benefits: ['Drought tolerant', 'Nitrogen fixer', 'Protein rich']
        }
    ];

    // Calculate suitability score for each crop
    crops.forEach(crop => {
        let score = 100;
        let reasons = [];

        // pH suitability
        if (soilData.ph < crop.idealPH[0]) {
            score -= Math.min(Math.abs(soilData.ph - crop.idealPH[0]) * 5, 20);
            reasons.push('pH too low');
        } else if (soilData.ph > crop.idealPH[1]) {
            score -= Math.min(Math.abs(soilData.ph - crop.idealPH[1]) * 5, 20);
            reasons.push('pH too high');
        } else {
            reasons.push('Optimal pH');
        }

        // Temperature suitability
        if (soilData.temperature < crop.idealTemperature[0]) {
            score -= Math.min(Math.abs(soilData.temperature - crop.idealTemperature[0]) * 2, 15);
            reasons.push('Temperature too low');
        } else if (soilData.temperature > crop.idealTemperature[1]) {
            score -= Math.min(Math.abs(soilData.temperature - crop.idealTemperature[1]) * 2, 15);
            reasons.push('Temperature too high');
        } else {
            reasons.push('Optimal temperature');
        }

        // Moisture suitability
        if (soilData.moisture < crop.idealMoisture[0]) {
            score -= Math.min(Math.abs(soilData.moisture - crop.idealMoisture[0]) * 1.5, 12);
            reasons.push('Moisture too low');
        } else if (soilData.moisture > crop.idealMoisture[1]) {
            score -= Math.min(Math.abs(soilData.moisture - crop.idealMoisture[1]) * 1.5, 12);
            reasons.push('Moisture too high');
        } else {
            reasons.push('Optimal moisture');
        }

        // Nutrient requirements matching
        const nutrientFactors = {
            nitrogen: { low: 0.8, optimal: 1.0, high: 0.9 },
            phosphorus: { low: 0.8, optimal: 1.0, high: 0.9 },
            potassium: { low: 0.8, optimal: 1.0, high: 0.9 }
        };

        ['nitrogen', 'phosphorus', 'potassium'].forEach(nutrient => {
            const factor = nutrientFactors[nutrient][analysis[nutrient].status] || 1.0;
            score *= factor;
        });

        // Special considerations
        if (crop.waterRequirement === 'high' && analysis.moisture.status === 'low') {
            score -= 10;
        }
        if (crop.waterRequirement === 'low' && analysis.moisture.status === 'high') {
            score -= 8;
        }

        // Ensure score doesn't go below 0
        score = Math.max(0, Math.min(100, score));

        suggestions.push({
            ...crop,
            suitabilityScore: Math.round(score),
            suitabilityLevel: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor',
            reasons: reasons
        });
    });

    // Sort by suitability score (highest first)
    suggestions.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    return suggestions;
}

/* ========================================
   UI UPDATES
   ======================================== */

/**
 * Update the dashboard with latest soil data
 */
function updateDashboardUI() {
    const latestData = getLatestSoilData();
    if (!latestData) return;

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
}

/**
 * Update crops page UI with crop suggestions
 */
function updateCropsPageUI() {
    const latestData = getLatestSoilData();
    const container = document.getElementById('cropSuggestionsContainer');
    if (!container) return;

    if (!latestData) {
        container.innerHTML = `
            <div class="info-section" style="text-align: center; padding: 3rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🌽</div>
                <p style="color: var(--secondary-color);">Enter your soil parameters above to get personalized crop recommendations.</p>
            </div>
        `;
        return;
    }

    const analysis = analyzeSoilData(latestData);
    const cropSuggestions = generateCropSuggestions(latestData, analysis.analysis);


    let html = `
        <!-- Soil Analysis Summary -->
        <div class="info-section" style="margin-bottom: 3rem; background: linear-gradient(135deg, #ffffff 0%, #F9FAFC 100%); border-radius: 24px; padding: 2.5rem; box-shadow: 0 12px 40px rgba(0,0,0,0.06); border: 1px solid #E0E5F2; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; right: 0; width: 150px; height: 150px; background: radial-gradient(circle, rgba(5, 205, 153, 0.05) 0%, transparent 70%); border-radius: 0 0 0 100px;"></div>

            <div style="position: relative; z-index: 1;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.75rem;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                    <h3 class="info-title" style="color: var(--primary-color); font-weight: 700; font-size: 1.4rem; margin: 0;">Soil Analysis Results</h3>
                </div>

                <div style="display: flex; align-items: flex-start; gap: 1.75rem; flex-wrap: wrap;">
                    <div style="width: 88px; height: 88px; background: linear-gradient(135deg, ${analysis.overallStatus.status === 'excellent' ? 'rgba(5, 205, 153, 0.1)' : analysis.overallStatus.status === 'good' ? 'rgba(5, 205, 153, 0.1)' : analysis.overallStatus.status === 'fair' ? 'rgba(255, 153, 72, 0.1)' : 'rgba(227, 26, 26, 0.1)'}; border-radius: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 8px 20px rgba(0,0,0,0.05);">
                        <span style="font-size: 2.5rem;">${analysis.overallStatus.status === 'excellent' ? '🌟' : analysis.overallStatus.status === 'good' ? '✅' : analysis.overallStatus.status === 'fair' ? '⚠️' : '🚨'}</span>
                    </div>
                    <div style="flex: 1; min-width: 250px;">
                        <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: ${analysis.overallStatus.status === 'excellent' ? 'rgba(5, 205, 153, 0.1)' : analysis.overallStatus.status === 'good' ? 'rgba(5, 205, 153, 0.1)' : analysis.overallStatus.status === 'fair' ? 'rgba(255, 153, 72, 0.1)' : 'rgba(227, 26, 26, 0.1)'}; border-radius: 8px; margin-bottom: 1rem;">
                            <span style="font-size: 0.85rem; font-weight: 600; color: ${analysis.overallStatus.status === 'excellent' ? 'var(--accent-green)' : analysis.overallStatus.status === 'good' ? 'var(--accent-green)' : analysis.overallStatus.status === 'fair' ? 'var(--accent-orange)' : 'var(--accent-red)'}; text-transform: uppercase; letter-spacing: 0.5px;">${analysis.overallStatus.status} Soil Health</span>
                        </div>
                        <h4 style="color: var(--primary-color); font-size: 1.4rem; font-weight: 700; margin: 0 0 0.75rem 0; line-height: 1.3;">
                            Crop Recommendations Based on Your Soil
                        </h4>
                        <p style="color: #52665A; font-size: 1rem; line-height: 1.7; margin: 0;">
                            Based on your soil analysis (pH: ${latestData.ph}, N: ${latestData.nitrogen} mg/kg, P: ${latestData.phosphorus} mg/kg, K: ${latestData.potassium} mg/kg),
                            here are the most suitable crops for your conditions.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <h2 class="section-title">Recommended Crops</h2>
        <p style="color: var(--secondary-color); margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.6;">Crops are ranked by their suitability to your soil conditions. Higher scores indicate better matches.</p>
    `;

    // Display top crop suggestions
    const topSuggestions = cropSuggestions.slice(0, 6); // Show top 6 crops

    html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem;">`;

    topSuggestions.forEach((crop, index) => {
        const suitabilityColor = crop.suitabilityLevel === 'Excellent' ? '#05CD99' :
            crop.suitabilityLevel === 'Good' ? '#05CD99' :
                crop.suitabilityLevel === 'Fair' ? '#FF9948' : '#E31A1A';

        const bgColor = crop.suitabilityLevel === 'Excellent' ? 'rgba(5, 205, 153, 0.05)' :
            crop.suitabilityLevel === 'Good' ? 'rgba(5, 205, 153, 0.05)' :
                crop.suitabilityLevel === 'Fair' ? 'rgba(255, 153, 72, 0.05)' : 'rgba(227, 26, 26, 0.05)';

        html += `
            <div class="recommendation-card" style="border-left: 5px solid ${suitabilityColor}; background: white; padding: 2rem; border-radius: 20px; box-shadow: 0 8px 30px rgba(0,0,0,0.06); margin-bottom: 1.5rem; position: relative; overflow: hidden; transition: all 0.3s ease;">
                <!-- Decorative accent -->
                <div style="position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: ${bgColor}; border-radius: 0 20px 0 50px;"></div>

                <div style="position: relative; z-index: 1;">
                    <div class="rec-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 48px; height: 48px; background: ${bgColor}; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <span style="font-size: 1.5rem;">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🌱'}</span>
                            </div>
                            <div>
                                <h3 class="rec-title" style="font-weight: 700; color: var(--primary-color); font-size: 1.3rem; margin: 0 0 0.25rem 0; line-height: 1.3;">${crop.name}</h3>
                                <span class="rec-badge" style="background: ${bgColor}; color: ${suitabilityColor}; padding: 4px 12px; border-radius: 99px; font-weight: 600; font-size: 0.8rem;">${crop.suitabilityLevel} Match</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.5rem; font-weight: 800; color: ${suitabilityColor}; line-height: 1;">${crop.suitabilityScore}%</div>
                            <div style="font-size: 0.75rem; color: var(--secondary-color); font-weight: 600;">Suitability</div>
                        </div>
                    </div>

                    <p class="rec-reason" style="color: #52665A; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.25rem;">${crop.description}</p>

                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.25rem;">
                        <div style="background: #F9FAFC; padding: 0.75rem; border-radius: 8px;">
                            <div style="font-size: 0.75rem; color: #a3aed0; font-weight: 700; text-transform: uppercase; margin-bottom: 0.25rem;">Best Season</div>
                            <div style="font-size: 0.85rem; color: var(--primary-color); font-weight: 600;">${crop.season}</div>
                        </div>
                        <div style="background: #F9FAFC; padding: 0.75rem; border-radius: 8px;">
                            <div style="font-size: 0.75rem; color: #a3aed0; font-weight: 700; text-transform: uppercase; margin-bottom: 0.25rem;">Yield Potential</div>
                            <div style="font-size: 0.85rem; color: var(--primary-color); font-weight: 600;">${crop.yield}</div>
                        </div>
                    </div>

                    <div style="background: rgba(5, 205, 153, 0.05); padding: 1rem; border-radius: 12px; border-left: 3px solid var(--accent-green); margin-bottom: 1rem;">
                        <div style="font-size: 0.8rem; color: var(--secondary-color); font-weight: 600; margin-bottom: 0.5rem;">Why ${crop.name}?</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${crop.benefits.map(benefit => `<span style="background: rgba(5, 205, 153, 0.1); color: var(--accent-green); padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 500;">${benefit}</span>`).join('')}
                        </div>
                    </div>

                    <div style="font-size: 0.8rem; color: #707EAE; line-height: 1.4;">
                        <strong>Ideal Conditions:</strong> pH ${crop.idealPH[0]}-${crop.idealPH[1]}, Moisture ${crop.idealMoisture[0]}-${crop.idealMoisture[1]}%, Temp ${crop.idealTemperature[0]}-${crop.idealTemperature[1]}°C
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;

    // Add educational section
    html += `
        <div class="info-section" style="margin-top: 3rem; background: #F9FAFC; border-radius: 24px; padding: 2.5rem; border: 1px solid #E0E5F2;">
            <h3 class="info-title" style="margin-bottom: 2rem; color: var(--primary-color); font-weight: 700; display: flex; align-items: center; gap: 0.75rem;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                Understanding Your Crop Recommendations
            </h3>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
                <div>
                    <h5 style="color: var(--accent-green); font-weight: 700; margin-bottom: 0.75rem;">🌱 Soil pH Impact</h5>
                    <p style="font-size: 0.85rem; color: var(--secondary-color); line-height: 1.6;">
                        pH affects nutrient availability. Most crops prefer slightly acidic to neutral soil (pH 6.0-7.5) where nutrients are most accessible to plant roots.
                    </p>
                </div>
                <div>
                    <h5 style="color: var(--accent-blue); font-weight: 700; margin-bottom: 0.75rem;">💧 Moisture Requirements</h5>
                    <p style="font-size: 0.85rem; color: var(--secondary-color); line-height: 1.6;">
                        Different crops have varying water needs. Rice loves wet conditions while chickpeas tolerate drought. Proper irrigation is crucial for success.
                    </p>
                </div>
                <div>
                    <h5 style="color: var(--accent-purple); font-weight: 700; margin-bottom: 0.75rem;">🌡️ Temperature Ranges</h5>
                    <p style="font-size: 0.85rem; color: var(--secondary-color); line-height: 1.6;">
                        Each crop has optimal temperature ranges for growth. Some crops like potatoes prefer cooler conditions while cotton needs heat.
                    </p>
                </div>
                <div>
                    <h5 style="color: var(--accent-orange); font-weight: 700; margin-bottom: 0.75rem;">🧪 Nutrient Matching</h5>
                    <p style="font-size: 0.85rem; color: var(--secondary-color); line-height: 1.6;">
                        Crops have different nutrient requirements. Heavy feeders like maize need more fertilizer than legumes that fix their own nitrogen.
                    </p>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Update recommendation page UI
 */
function updateRecommendationPageUI() {
    const latestData = getLatestSoilData();
    const container = document.getElementById('recommendationsList');
    if (!container) return;

    if (!latestData) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 3rem;">
                <span style="font-size: 3rem;">📊</span>
                <h3 style="margin-top: 1rem; color: var(--primary-color);">No Soil Data Yet</h3>
                <p style="color: var(--secondary-color);">Please enter your soil parameters to see recommendations.</p>
            </div>
        `;
        return;
    }

    const result = analyzeSoilData(latestData);

    let html = `
        <!-- Professional Soil Health Overview -->
        <div class="info-section glass-card" style="margin-bottom: 3rem; background: linear-gradient(135deg, #ffffff 0%, #F9FAFC 100%); border-radius: 24px; padding: 2.5rem; box-shadow: 0 12px 40px rgba(0,0,0,0.06); border: 1px solid #E0E5F2; position: relative; overflow: hidden;">
            <!-- Decorative accent -->
            <div style="position: absolute; top: 0; right: 0; width: 150px; height: 150px; background: radial-gradient(circle, rgba(5, 205, 153, 0.05) 0%, transparent 70%); border-radius: 0 0 0 100px;"></div>
            
            <div style="position: relative; z-index: 1;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.75rem;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                    <h3 class="info-title" style="color: var(--primary-color); font-weight: 700; font-size: 1.4rem; margin: 0;">Soil Health Analysis</h3>
                </div>
                
                <div style="display: flex; align-items: flex-start; gap: 1.75rem; flex-wrap: wrap;">
                    <div style="width: 88px; height: 88px; background: linear-gradient(135deg, ${result.overallStatus.status === 'excellent' ? 'rgba(5, 205, 153, 0.1)' : result.overallStatus.status === 'good' ? 'rgba(5, 205, 153, 0.1)' : result.overallStatus.status === 'fair' ? 'rgba(255, 153, 72, 0.1)' : 'rgba(227, 26, 26, 0.1)'}; border-radius: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 8px 20px rgba(0,0,0,0.05);">
                        <span style="font-size: 2.5rem;">${result.overallStatus.status === 'excellent' ? '🌟' : result.overallStatus.status === 'good' ? '✅' : result.overallStatus.status === 'fair' ? '⚠️' : '🚨'}</span>
                    </div>
                    <div style="flex: 1; min-width: 250px;">
                        <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: ${result.overallStatus.status === 'excellent' ? 'rgba(5, 205, 153, 0.1)' : result.overallStatus.status === 'good' ? 'rgba(5, 205, 153, 0.1)' : result.overallStatus.status === 'fair' ? 'rgba(255, 153, 72, 0.1)' : 'rgba(227, 26, 26, 0.1)'}; border-radius: 8px; margin-bottom: 1rem;">
                            <span style="font-size: 0.85rem; font-weight: 600; color: ${result.overallStatus.status === 'excellent' ? 'var(--accent-green)' : result.overallStatus.status === 'good' ? 'var(--accent-green)' : result.overallStatus.status === 'fair' ? 'var(--accent-orange)' : 'var(--accent-red)'}; text-transform: uppercase; letter-spacing: 0.5px;">${result.overallStatus.status} Condition</span>
                        </div>
                        <h4 style="color: var(--primary-color); font-size: 1.4rem; font-weight: 700; margin: 0 0 0.75rem 0; line-height: 1.3;">
                            ${result.overallStatus.status === 'excellent' ? 'Optimal Soil Health' : result.overallStatus.status === 'good' ? 'Good Soil Condition' : result.overallStatus.status === 'fair' ? 'Moderate Soil Health' : 'Soil Improvement Needed'}
                        </h4>
                        <p style="color: #52665A; font-size: 1rem; line-height: 1.7; margin: 0;">
                            ${result.overallStatus.message} We've analyzed <strong style="color: var(--primary-color);">6 key parameters</strong> for your <strong style="color: var(--primary-color);">${latestData.crop}</strong> crop to provide you with precise, actionable recommendations.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <h2 class="section-title">Personalized Fertilizer Plan</h2>
        
        <!-- Professional Summary View at Top -->
        <div class="simple-summary-card" style="background: linear-gradient(135deg, #1A3C25 0%, #2D5A3D 100%); padding: 2.5rem; border-radius: 24px; box-shadow: 0 20px 60px rgba(26, 60, 37, 0.15); margin-bottom: 3rem; color: white; position: relative; overflow: hidden;">
            <!-- Decorative background elements -->
            <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(5, 205, 153, 0.15) 0%, transparent 70%); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: radial-gradient(circle, rgba(5, 205, 153, 0.1) 0%, transparent 70%); border-radius: 50%;"></div>
            
            <div style="position: relative; z-index: 1;">
                <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 2rem;">
                    <div style="width: 56px; height: 56px; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 11l3 3L22 4"></path>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 style="font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem 0; color: white; letter-spacing: -0.02em;">Required Fertilizers</h3>
                        <p style="font-size: 0.95rem; color: rgba(255, 255, 255, 0.85); margin: 0; font-weight: 400;">Quick reference guide for your soil treatment plan</p>
                    </div>
                </div>
    `;

    if (result.recommendations.length === 0) {
        html += `
            <div style="background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(10px); padding: 2rem; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.2); text-align: center;">
                <div style="width: 64px; height: 64px; background: rgba(5, 205, 153, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 2rem;">
                    ✓
                </div>
                <p style="color: white; font-size: 1.15rem; font-weight: 600; margin: 0; line-height: 1.5;">
                    Optimal Soil Condition<br>
                    <span style="font-size: 0.9rem; font-weight: 400; opacity: 0.9;">No additional fertilizers required at this time</span>
                </p>
            </div>
        `;
    } else {
        // Professional fertilizer chips
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem;">`;
        result.recommendations.forEach((rec, index) => {
            const color = rec.nutrient === 'Nitrogen' ? '#4318FF' :
                rec.nutrient === 'Phosphorus' ? '#9747FF' :
                    rec.nutrient === 'Potassium' ? '#FF5630' :
                        rec.nutrient === 'pH Balancer' ? '#F6AD55' : '#05CD99';

            // Nutrient icons
            const icon = rec.nutrient === 'Nitrogen' ?
                '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>' :
                rec.nutrient === 'Phosphorus' ?
                    '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>' :
                    rec.nutrient === 'Potassium' ?
                        '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>' :
                        '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>';

            html += `
                <div class="fertilizer-chip" style="background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(10px); padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.2); position: relative; overflow: hidden;">
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: ${color};"></div>
                    <div style="display: flex; align-items: flex-start; gap: 1rem;">
                        <div style="width: 40px; height: 40px; background: rgba(255, 255, 255, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                ${icon}
                            </svg>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <h4 style="font-size: 1.05rem; font-weight: 700; color: white; margin: 0 0 0.5rem 0; line-height: 1.3;">${rec.fertilizer}</h4>
                            <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.75rem; background: rgba(255, 255, 255, 0.1); border-radius: 6px; margin-top: 0.5rem;">
                                <div style="width: 6px; height: 6px; background: ${color}; border-radius: 50%;"></div>
                                <span style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.85); font-weight: 500;">${rec.nutrient}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div></div>`;

    // Professional Detailed Description Section
    html += `
        <div style="margin-top: 4rem;">
            <h2 class="section-title">Detailed Application Guide</h2>
            <p style="color: var(--secondary-color); margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.6;">Comprehensive instructions for optimal fertilizer application and soil improvement.</p>
        </div>
    `;

    if (result.recommendations.length === 0) {
        html += `
            <div class="recommendation-card" style="border-left: 5px solid var(--accent-green); background: linear-gradient(135deg, #ffffff 0%, #F0FFF4 100%); padding: 2.5rem; border-radius: 24px; box-shadow: 0 8px 30px rgba(5, 205, 153, 0.1); margin-bottom: 1.5rem; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -20px; right: -20px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(5, 205, 153, 0.1) 0%, transparent 70%); border-radius: 50%;"></div>
                <div style="position: relative; z-index: 1;">
                    <div class="rec-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 48px; height: 48px; background: rgba(5, 205, 153, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                            <h3 class="rec-title" style="font-weight: 700; color: var(--primary-color); font-size: 1.3rem;">Balanced Soil Health</h3>
                        </div>
                        <span class="rec-badge" style="background: rgba(5, 205, 153, 0.1); color: var(--accent-green); padding: 6px 16px; border-radius: 99px; font-weight: 700; font-size: 0.85rem;">Optimal</span>
                    </div>
                    <div class="rec-dosage" style="font-size: 1.15rem; font-weight: 600; color: var(--primary-color); margin-bottom: 1rem; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: rgba(5, 205, 153, 0.08); border-radius: 10px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        Maintenance Only
                    </div>
                    <p class="rec-reason" style="color: #52665A; font-size: 1rem; line-height: 1.7; margin: 0;">Your nutrient levels are currently ideal for <strong style="color: var(--primary-color);">${latestData.crop}</strong>. Continue with regular soil monitoring and standard maintenance practices. No additional fertilizers required at this time.</p>
                </div>
            </div>
        `;
    } else {
        result.recommendations.forEach((rec, index) => {
            const color = rec.nutrient === 'Nitrogen' ? '#4318FF' :
                rec.nutrient === 'Phosphorus' ? '#9747FF' :
                    rec.nutrient === 'Potassium' ? '#FF5630' :
                        rec.nutrient === 'pH Balancer' ? '#F6AD55' : '#05CD99';
            const bg = rec.nutrient === 'Nitrogen' ? 'rgba(67, 24, 255, 0.08)' :
                rec.nutrient === 'Phosphorus' ? 'rgba(151, 71, 255, 0.08)' :
                    rec.nutrient === 'Potassium' ? 'rgba(255, 86, 48, 0.08)' : 'rgba(246, 173, 85, 0.08)';
            const lightBg = rec.nutrient === 'Nitrogen' ? 'rgba(67, 24, 255, 0.03)' :
                rec.nutrient === 'Phosphorus' ? 'rgba(151, 71, 255, 0.03)' :
                    rec.nutrient === 'Potassium' ? 'rgba(255, 86, 48, 0.03)' : 'rgba(246, 173, 85, 0.03)';

            html += `
                <div class="recommendation-card" style="border-left: 5px solid ${color}; background: white; padding: 2.5rem; border-radius: 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.06); margin-bottom: 2rem; position: relative; overflow: hidden;">
                    <!-- Decorative corner accent -->
                    <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: ${lightBg}; border-radius: 0 24px 0 100px;"></div>
                    
                    <div style="position: relative; z-index: 1;">
                        <div class="rec-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                            <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                                <div style="width: 48px; height: 48px; background: ${bg}; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <span style="font-size: 1.25rem; font-weight: 700; color: ${color};">${index + 1}</span>
                                </div>
                                <div>
                                    <h3 class="rec-title" style="font-weight: 700; color: var(--primary-color); font-size: 1.35rem; margin: 0 0 0.25rem 0; line-height: 1.3;">${rec.fertilizer}</h3>
                                    <span class="rec-badge" style="background: ${bg}; color: ${color}; padding: 6px 14px; border-radius: 99px; font-weight: 600; font-size: 0.8rem; display: inline-block; margin-top: 0.25rem;">${rec.nutrient}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="rec-dosage" style="font-size: 1.05rem; font-weight: 600; color: var(--primary-color); margin: 1.25rem 0; display: inline-flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1.5rem; background: ${lightBg}; border-radius: 12px; border: 1px solid ${bg};">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            <span>Recommended Dosage: <strong style="color: ${color};">${rec.dosage}</strong></span>
                        </div>
                        
                        <div style="padding: 1.25rem; background: #F9FAFC; border-radius: 12px; border-left: 3px solid ${color}; margin-top: 1rem;">
                            <p class="rec-reason" style="color: #52665A; font-size: 0.95rem; line-height: 1.7; margin: 0;">${rec.reason}</p>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // Farmer's Educational Guide Section
    html += `
        <div class="info-section" style="margin-top: 3.5rem; background: #F9FAFC; border-radius: 24px; padding: 2.5rem; border: 1px solid #E0E5F2;">
            <h3 class="info-title" style="margin-bottom: 2rem; color: var(--primary-color); font-weight: 700; display: flex; align-items: center; gap: 0.75rem;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                Farmer's Guide: What do these numbers mean?
            </h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
                <div>
                    <h5 style="color: var(--accent-blue); font-weight: 700; margin-bottom: 0.75rem;">🌿 Nitrogen (Growth)</h5>
                    <p style="font-size: 0.85rem; color: var(--secondary-color); line-height: 1.6;">
                        Nitrogen is like food for the leaves. It makes plants stay deep green and grow tall. Without enough, plants turn yellow and stop growing.
                    </p>
                </div>
                <div>
                    <h5 style="color: var(--accent-purple); font-weight: 700; margin-bottom: 0.75rem;">🌱 Phosphorus (Roots)</h5>
                    <p style="font-size: 0.85rem; color: var(--secondary-color); line-height: 1.6;">
                        Phosphorus is for the roots and flowers. It helps the plant establish itself early and produce healthy fruits or grains.
                    </p>
                </div>
                <div>
                    <h5 style="color: var(--accent-orange); font-weight: 700; margin-bottom: 0.75rem;">🍎 Potassium (Health)</h5>
                    <p style="font-size: 0.85rem; color: var(--secondary-color); line-height: 1.6;">
                        Potassium acts like medicine. It helps the plant fight off diseases, survive hot weather, and makes the harvest taste better.
                    </p>
                </div>
                <div>
                    <h5 style="color: var(--accent-green); font-weight: 700; margin-bottom: 0.75rem;">🧪 Soil pH (Balance)</h5>
                    <p style="font-size: 0.85rem; color: var(--secondary-color); line-height: 1.6;">
                        pH is the "balance" of the soil. If it's too high or low, the plant can't drink the nutrients even if you apply fertilizer.
                    </p>
                </div>
            </div>

            <div style="margin-top: 2.5rem; padding: 1.5rem; background: rgba(5, 205, 153, 0.05); border-radius: 16px; border: 1px dashed var(--accent-green);">
                <p style="color: var(--primary-color); font-weight: 600; font-size: 0.95rem;">
                    💡 Smart Tip for ${latestData.crop}: ${result.cropRecommendation.notes}
                </p>
            </div>
        </div>

    `;

    container.innerHTML = html;
}

/**
 * Update history page UI
 */
function updateHistoryUI() {
    const container = document.getElementById('history-container');
    if (!container) return;

    const history = getSoilHistory();
    const clearBtn = document.getElementById('clearHistoryBtn');

    if (history.length === 0) {
        if (clearBtn) clearBtn.style.display = 'none';
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 4rem; background: white; border-radius: 24px; border: 1px dashed #E0E5F2;">
                <span style="font-size: 3.5rem; opacity: 0.5;">📅</span>
                <h3 style="margin-top: 1.5rem; color: var(--primary-color); font-weight: 700;">No Analysis History</h3>
                <p style="color: var(--secondary-color); margin-top: 0.5rem;">Your past soil records will appear here for tracking.</p>
                <button class="btn btn-primary" onclick="window.location.href='dashboard.html'" style="margin-top: 2rem;">Start New Analysis</button>
            </div>
        `;
        return;
    }

    if (clearBtn) clearBtn.style.display = 'flex';

    let html = `
        <div class="history-grid" style="display: grid; gap: 1.5rem;">
    `;

    // Show latest first
    [...history].reverse().forEach((record, revIndex) => {
        const index = history.length - 1 - revIndex;
        const result = analyzeSoilData(record);
        const date = new Date(record.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        html += `
            <div class="history-card glass-card" style="background: white; border-radius: 20px; padding: 1.5rem; border: 1px solid #E0E5F2; transition: all 0.3s ease; position: relative; overflow: hidden;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                            <span style="font-size: 0.85rem; font-weight: 700; color: #707EAE; text-transform: uppercase; letter-spacing: 0.5px;">${formattedDate}</span>
                            <span class="status-badge ${result.overallStatus.status}" style="font-size: 0.75rem; padding: 2px 10px; border-radius: 99px; font-weight: 700;">${result.overallStatus.status.toUpperCase()}</span>
                        </div>
                        <h4 style="color: var(--primary-color); font-size: 1.15rem; font-weight: 800;">Analysis for ${record.crop}</h4>
                    </div>
                    <button class="btn-icon danger" onclick="deleteHistoryItem(${index})" title="Delete Record" style="background: rgba(238, 93, 114, 0.1); color: var(--accent-red); width: 36px; height: 36px; border-radius: 10px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 1rem; background: #F9FAFC; border-radius: 15px;">
                    <div style="text-align: center;">
                        <span style="display: block; font-size: 0.7rem; color: #a3aed0; font-weight: 700; text-transform: uppercase;">Nitrogen</span>
                        <span style="font-size: 1rem; font-weight: 800; color: var(--primary-color);">${record.nitrogen} <small>mg/kg</small></span>
                    </div>
                    <div style="text-align: center; border-left: 1px solid #E0E5F2; border-right: 1px solid #E0E5F2;">
                        <span style="display: block; font-size: 0.7rem; color: #a3aed0; font-weight: 700; text-transform: uppercase;">Phosphorus</span>
                        <span style="font-size: 1rem; font-weight: 800; color: var(--primary-color);">${record.phosphorus} <small>mg/kg</small></span>
                    </div>
                    <div style="text-align: center;">
                        <span style="display: block; font-size: 0.7rem; color: #a3aed0; font-weight: 700; text-transform: uppercase;">Potassium</span>
                        <span style="font-size: 1rem; font-weight: 800; color: var(--primary-color);">${record.potassium} <small>mg/kg</small></span>
                    </div>
                </div>

                <div style="display: flex; gap: 1.5rem; margin-top: 1.25rem; padding-left: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 0.85rem; color: #707EAE;">pH:</span>
                        <span style="font-size: 0.9rem; font-weight: 700; color: var(--primary-color);">${record.ph}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 0.85rem; color: #707EAE;">Moisture:</span>
                        <span style="font-size: 0.9rem; font-weight: 700; color: var(--primary-color);">${record.moisture}%</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 0.85rem; color: #707EAE;">Temp:</span>
                        <span style="font-size: 0.9rem; font-weight: 700; color: var(--primary-color);">${record.temperature}°C</span>
                    </div>
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
function updateAlertsPageUI() {
    const container = document.getElementById('alertsContainer');
    if (!container) return;

    const latestData = getLatestSoilData();
    if (!latestData) {
        container.innerHTML = `
            <div class="empty-state" style="min-height: 400px; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔔</div>
                <h3 class="info-title">No Data Yet</h3>
                <p class="info-text">Enter soil data on the dashboard to see alerts.</p>
            </div>
        `;
        return;
    }

    const result = analyzeSoilData(latestData);
    const warnings = result.warnings;

    if (warnings.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="min-height: 400px; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔔</div>
                <h3 class="info-title">All Caught Up!</h3>
                <p class="info-text">Your soil conditions are optimal. No alerts at this time.</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="info-section" style="margin-bottom: 2rem; background: #F9FAFC; border-radius: 20px; padding: 1.5rem; border: 1px solid #E0E5F2;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                <div style="width: 40px; height: 40px; background: rgba(67, 24, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                    🔍
                </div>
                <div>
                    <h3 style="margin: 0; color: var(--primary-color); font-weight: 700; font-size: 1.1rem;">Analysis Context</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: #707EAE;">Based on your last soil test for <strong>${latestData.crop}</strong></p>
                </div>
            </div>
            <p style="margin: 0; color: var(--secondary-color); font-size: 0.95rem; line-height: 1.6;">
                We've detected <strong>${warnings.length} critical issues</strong> in your soil health that require immediate attention. 
                These alerts were generated based on the NPK, pH, and environmental parameters entered on ${new Date(latestData.timestamp).toLocaleDateString()}.
            </p>
        </div>
        <div class="alerts-grid" style="display: grid; gap: 1.5rem; padding: 0;">
    `;

    warnings.forEach(warning => {
        const severityColor = warning.severity === 'high' ? '#E31A1A' : '#FF9948';
        const severityBg = warning.severity === 'high' ? 'rgba(227, 26, 26, 0.05)' : 'rgba(255, 153, 72, 0.05)';
        const icon = warning.severity === 'high' ? '🚨' : '⚠️';

        html += `
            <div class="alert-card" style="background: white; border-radius: 20px; padding: 2rem; border: 1px solid #E0E5F2; border-left: 6px solid ${severityColor}; display: flex; align-items: flex-start; gap: 1.5rem; box-shadow: 0 8px 30px rgba(0,0,0,0.04); transition: transform 0.2s ease;">
                <div style="width: 56px; height: 56px; background: ${severityBg}; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0;">
                    ${icon}
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <h3 style="margin: 0; color: var(--primary-color); font-weight: 700; font-size: 1.25rem;">${warning.type}</h3>
                        <span style="background: ${severityBg}; color: ${severityColor}; padding: 4px 12px; border-radius: 99px; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">${warning.severity} Severity</span>
                    </div>
                    <p style="margin: 0; color: var(--secondary-color); line-height: 1.6; font-size: 1rem;">${warning.message}</p>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Confirm and clear all history
 */
function confirmClearHistory() {
    if (confirm('Are you sure you want to clear your entire analysis history? This cannot be undone.')) {
        clearSoilData();
        updateHistoryUI();
        showMessage('History cleared successfully', 'success');
    }
}

/**
 * Delete a single history item
 */
function deleteHistoryItem(index) {
    const history = getSoilHistory();
    if (index >= 0 && index < history.length) {
        history.splice(index, 1);
        localStorage.setItem('nutriroot_soil_history', JSON.stringify(history));

        // If we deleted the latest one, update latest_soil_data too
        if (index === history.length) { // history.length is now 1 less
            const newLatest = history.length > 0 ? history[history.length - 1] : null;
            if (newLatest) {
                localStorage.setItem('nutriroot_latest_soil_data', JSON.stringify(newLatest));
            } else {
                localStorage.removeItem('nutriroot_latest_soil_data');
            }
        }

        updateHistoryUI();
        showMessage('Record deleted', 'success');
    }
}

// Automatically update UI on relevant pages
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('nitrogenValue')) {
        updateDashboardUI();
    }
    if (document.getElementById('recommendationsList')) {
        updateRecommendationPageUI();
    }
    // Check if on crops page
    const suggestionsContainer = document.getElementById('cropSuggestionsContainer');
    if (suggestionsContainer) {
        updateCropsPageUI();
        // Add event listener for crops form
        const cropsForm = document.getElementById('cropsSoilForm');
        if (cropsForm) {
            // Remove any existing listener to be safe
            cropsForm.removeEventListener('submit', handleCropsSoilSubmit);
            cropsForm.addEventListener('submit', handleCropsSoilSubmit);
            console.log('Crops form event listener added');
        }
    }
    if (document.getElementById('history-container')) {
        updateHistoryUI();
    }
    if (document.getElementById('alertsContainer')) {
        updateAlertsPageUI();
    }
});

/**
 * Handle crop suggestions form submission
 */
function handleCropsSoilSubmit(e) {
    e.preventDefault();
    console.log('Handling crops form submission');

    // Get values and convert to numbers where appropriate
    const data = {
        nitrogen: parseFloat(document.getElementById('crops_nitrogen').value),
        phosphorus: parseFloat(document.getElementById('crops_phosphorus').value),
        potassium: parseFloat(document.getElementById('crops_potassium').value),
        ph: parseFloat(document.getElementById('crops_ph').value),
        moisture: parseFloat(document.getElementById('crops_moisture').value),
        temperature: parseFloat(document.getElementById('crops_temperature').value),
        crop: 'General' // Default for suggestions
    };

    console.log('Processed data:', data);

    if (saveSoilData(data)) {
        updateCropsPageUI();

        // Show success state
        const check = document.getElementById('successCheck');
        if (check) {
            check.classList.add('active');
            setTimeout(() => {
                check.classList.remove('active');
            }, 1500);
        }

        showMessage('Soil data analyzed! Crop suggestions generated.', 'success');

        // Scroll to results
        const container = document.getElementById('cropSuggestionsContainer');
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// End of script
