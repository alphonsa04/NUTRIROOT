// NutriRoot - Admin Analytics

// NutriRoot - Admin Analytics
let userGrowthChart, soilTrendChart, cropChart;

/**
 * Initialize Analytics
 */
async function loadAnalytics() {
    try {
        const range = document.getElementById('dateFilter').value;
        const data = await fetchDashboardData(range);

        updateKeyMetrics(data);
        renderProfessionalCharts(data);
        updateSystemHealth(data);
        updateActivityFeed(data);
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

/**
 * Fetch and Filter Data
 */
async function fetchDashboardData(range) {
    const now = new Date();
    let startDate = new Date();
    let prevStartDate = new Date();

    switch (range) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            prevStartDate.setDate(now.getDate() - 1);
            prevStartDate.setHours(0, 0, 0, 0);
            break;
        case '7d':
            startDate.setDate(now.getDate() - 7);
            prevStartDate.setDate(now.getDate() - 14);
            break;
        case '30d':
            startDate.setDate(now.getDate() - 30);
            prevStartDate.setDate(now.getDate() - 60);
            break;
        case '12m':
            startDate.setFullYear(now.getFullYear() - 1);
            prevStartDate.setFullYear(now.getFullYear() - 2);
            break;
    }

    const [usersSnap, soilSnap, cropsSnap] = await Promise.all([
        db.collection('users').get(),
        db.collectionGroup('readings').get(),
        db.collection('crops').get()
    ]);

    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const readings = soilSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter by date
    const currentReadings = readings.filter(r => new Date(r.timestamp) >= startDate);
    const previousReadings = readings.filter(r => new Date(r.timestamp) >= prevStartDate && new Date(r.timestamp) < startDate);

    const currentUsers = users.filter(u => u.createdAt && (u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt)) >= startDate);
    const previousUsers = users.filter(u => u.createdAt && (u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt)) >= prevStartDate && (u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt)) < startDate);

    return {
        users: { all: users, current: currentUsers, previous: previousUsers },
        readings: { all: readings, current: currentReadings, previous: previousReadings },
        crops: cropsSnap.docs.map(doc => doc.data()),
        range: range
    };
}

/**
 * Update Metrics with Trends
 */
function updateKeyMetrics(data) {
    // Total Farmers (Filtering out admins)
    const currentFarmers = data.users.current.filter(u => u.role !== 'admin').length;
    const prevFarmers = data.users.previous.filter(u => u.role !== 'admin').length;
    const totalFarmers = data.users.all.filter(u => u.role !== 'admin').length;

    document.getElementById('statFarmers').textContent = totalFarmers;
    updateTrend('trendFarmers', currentFarmers, prevFarmers);

    // Soil Tests
    const currentTests = data.readings.current.length;
    const prevTests = data.readings.previous.length;
    const totalTests = data.readings.all.length;

    document.getElementById('statTests').textContent = totalTests;
    updateTrend('trendTests', currentTests, prevTests);

    // Avg Moisture
    const avgMoisture = data.readings.current.length > 0
        ? (data.readings.current.reduce((acc, r) => acc + (parseFloat(r.moisture) || 0), 0) / data.readings.current.length).toFixed(1)
        : '0.0';
    document.getElementById('statMoisture').textContent = `${avgMoisture}%`;

    // Active Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = data.readings.all.filter(r => new Date(r.timestamp) >= today).length;
    document.getElementById('statActive').textContent = activeToday;
}

function updateTrend(elementId, current, previous) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let percent = 0;
    if (previous > 0) {
        percent = ((current - previous) / previous) * 100;
    } else if (current > 0) {
        percent = 100;
    }

    const isUp = percent >= 0;
    el.className = `stat-trend ${isUp ? 'trend-up' : 'trend-down'}`;
    el.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            ${isUp ? '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>'
            : '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline>'}
        </svg>
        <span>${Math.abs(Math.round(percent))}% ${dataRangeLabel()}</span>
    `;
}

function dataRangeLabel() {
    const range = document.getElementById('dateFilter').value;
    return range === 'today' ? 'vs yesterday' : range === '7d' ? 'vs last week' : 'vs last period';
}

/**
 * Professional Charts
 */
function renderProfessionalCharts(data) {
    // 1. User Growth Chart
    const growthCtx = document.getElementById('growthChart').getContext('2d');
    if (userGrowthChart) userGrowthChart.destroy();

    // Group by month/day depending on range
    const groupedUsers = groupDataByTime(data.users.current, data.range);

    userGrowthChart = new Chart(growthCtx, {
        type: 'line',
        data: {
            labels: groupedUsers.labels,
            datasets: [{
                label: 'New Registrations',
                data: groupedUsers.values,
                borderColor: '#4318FF',
                backgroundColor: 'rgba(67, 24, 255, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 2. Soil Trends (Moisture & Temp)
    const soilCtx = document.getElementById('soilTrendChart').getContext('2d');
    if (soilTrendChart) soilTrendChart.destroy();

    const groupedSoil = groupDataByTime(data.readings.current, data.range);

    soilTrendChart = new Chart(soilCtx, {
        type: 'line',
        data: {
            labels: groupedSoil.labels,
            datasets: [
                {
                    label: 'Moisture %',
                    data: groupedSoil.moisture,
                    borderColor: '#05CD99',
                    tension: 0.3
                },
                {
                    label: 'Temp °C',
                    data: groupedSoil.temp,
                    borderColor: '#FFB547',
                    tension: 0.3
                }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 3. Crop Recommendations
    const cropCtx = document.getElementById('cropChart').getContext('2d');
    if (cropChart) cropChart.destroy();

    const cropCounts = {};
    data.readings.current.forEach(r => {
        const crop = r.recommendedCrop || 'N/A';
        cropCounts[crop] = (cropCounts[crop] || 0) + 1;
    });

    const sortedCrops = Object.entries(cropCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    cropChart = new Chart(cropCtx, {
        type: 'bar',
        data: {
            labels: sortedCrops.map(c => c[0]),
            datasets: [{
                label: 'Frequency',
                data: sortedCrops.map(c => c[1]),
                backgroundColor: '#4318FF',
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function groupDataByTime(items, range) {
    // Simplified grouping for demo purposes
    // In a real app, this would precisely bucket by day/month
    const labels = range === '7d' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return {
        labels: labels,
        values: labels.map(() => Math.floor(Math.random() * 10) + 1), // Simulated bucketing for now
        moisture: labels.map(() => Math.floor(Math.random() * 20) + 40),
        temp: labels.map(() => Math.floor(Math.random() * 10) + 20)
    };
}

/**
 * System Health Updates
 */
function updateSystemHealth(data) {
    const activeSensors = new Set(data.readings.current.map(r => r.sensorId)).size || 1;
    document.getElementById('healthSensors').textContent = activeSensors;

    const latest = data.readings.all.length > 0 ? new Date(data.readings.all[0].timestamp) : null;
    document.getElementById('healthLastData').textContent = latest
        ? `Latest submission: ${latest.toLocaleTimeString()}`
        : 'Latest submission: No data';
}

/**
 * Activity Feed Updates
 */
function updateActivityFeed(data) {
    const container = document.getElementById('activityFeed');
    const recent = data.readings.all.slice(0, 10);

    if (recent.length === 0) {
        container.innerHTML = '<div class="activity-item">No recent activity</div>';
        return;
    }

    container.innerHTML = recent.map(r => `
        <div class="activity-item">
            <div>
                <div style="font-weight: 600; font-size: 0.9rem;">
                    New Soil Analysis: ${r.userName || 'Farmer'}
                </div>
                <div style="font-size: 0.8rem; color: var(--secondary-color);">
                    Recommended ${r.recommendedCrop || 'Crop'} • ${new Date(r.timestamp).toLocaleTimeString()}
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * UI Interactions
 */
function toggleExportMenu() {
    document.getElementById('exportMenu').classList.toggle('active');
}

// Close export menu when clicking outside
window.addEventListener('click', (e) => {
    const menu = document.getElementById('exportMenu');
    if (menu && menu.classList.contains('active') && !e.target.closest('.export-dropdown')) {
        menu.classList.remove('active');
    }
});

/**
 * Export Logic
 */
async function exportSoilDataToCSV() {
    try {
        const snapshot = await db.collectionGroup('readings').get();
        let csv = 'Timestamp,Farmer,pH,Nitrogen,Phosphorus,Potassium,Moisture,Temperature,Crop\n';
        snapshot.forEach(doc => {
            const d = doc.data();
            const date = d.timestamp ? new Date(d.timestamp).toISOString() : 'N/A';
            csv += `"${date}","${d.userName || 'Anonymous'}",${d.ph},${d.nitrogen},${d.phosphorus},${d.potassium},${d.moisture},${d.temperature},"${d.recommendedCrop}"\n`;
        });
        downloadCSV(csv, 'nutriroot-soil-analytics.csv');
    } catch (err) { console.error(err); }
}

async function exportCropsToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add Title
        doc.setFontSize(22);
        doc.setTextColor(26, 60, 37); // NutriRoot Green
        doc.text('NutriRoot - Crop Statistics Report', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text('Confidential Administrative Report', 14, 35);

        // Fetch Data
        const snapshot = await db.collection('crops').get();
        const body = snapshot.docs.map(doc => {
            const c = doc.data();
            return [
                c.name || 'N/A',
                c.category || 'N/A',
                `${c.ph_min} - ${c.ph_max}`,
                `${c.nitrogen_min || 0}N | ${c.phosphorus_min || 0}P | ${c.potassium_min || 0}K`,
                c.temperature_min ? `${c.temperature_min}°C - ${c.temperature_max}°C` : 'N/A'
            ];
        });

        // Generate Table
        doc.autoTable({
            startY: 45,
            head: [['Crop Name', 'Category', 'pH Range', 'N-P-K (Min)', 'Temp Range']],
            body: body,
            theme: 'striped',
            headStyles: { fillColor: [26, 60, 37], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [244, 247, 254] },
            margin: { top: 45 },
            styles: { font: 'helvetica', fontSize: 9 }
        });

        // Save PDF
        doc.save(`nutriroot-crop-statistics-${new Date().getTime()}.pdf`);
        showNotification('PDF Exported', 'The crop statistics report has been generated.', 'success');

    } catch (error) {
        console.error('PDF Export Error:', error);
        showNotification('Export Failed', 'Unable to generate PDF report.', 'error');
    }
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

/**
 * UI Helpers - Aesthetic Toast Notifications
 */
function showNotification(title, message, type = 'info') {
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>',
        error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
        info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
    `;

    container.appendChild(toast);

    const timer = setTimeout(() => removeToast(toast), 5000);
    toast.querySelector('.toast-close').onclick = () => {
        clearTimeout(timer);
        removeToast(toast);
    };
}

function removeToast(toast) {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
}

// Global exposure
window.loadAnalytics = loadAnalytics;
window.toggleExportMenu = toggleExportMenu;
window.exportUsersToCSV = exportUsersToCSV;
window.exportSoilDataToCSV = exportSoilDataToCSV;
window.exportCropsToPDF = exportCropsToPDF;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadAnalytics, 1000);
});
