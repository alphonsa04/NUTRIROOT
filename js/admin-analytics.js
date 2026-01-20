// NutriRoot - Admin Analytics

/**
 * Initialize Analytics
 */
async function loadAnalytics() {
    try {
        await Promise.all([
            loadKeyMetrics(),
            renderGrowthChart(),
            renderCropTrendChart()
        ]);
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

/**
 * Load Key Metrics
 */
async function loadKeyMetrics() {
    try {
        // Users
        const usersSnapshot = await db.collection('users').get();
        const farmers = usersSnapshot.docs.filter(doc => doc.data().role !== 'admin');
        document.getElementById('statFarmers').textContent = farmers.length;

        // Soil Tests (History/SoilData count)
        const soilSnapshot = await db.collection('soilData').get();
        document.getElementById('statTests').textContent = soilSnapshot.size;

        // Success Rate (Placeholder for demo)
        document.getElementById('statSuccess').textContent = '94.2%';

    } catch (error) {
        console.error('Error loading key metrics:', error);
    }
}

/**
 * Render User Growth Chart
 */
async function renderGrowthChart() {
    const ctx = document.getElementById('growthChart')?.getContext('2d');
    if (!ctx) return;

    // Simulated data for demo (as real historical data might be sparse in a new project)
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = [12, 19, 34, 45, 67, 89];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'New Farmers',
                data: data,
                borderColor: '#05CD99',
                backgroundColor: 'rgba(5, 205, 153, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#05CD99'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
                x: { grid: { display: false } }
            }
        }
    });
}

/**
 * Render Crop Recommendation Trend Chart
 */
async function renderCropTrendChart() {
    const ctx = document.getElementById('cropTrendChart')?.getContext('2d');
    if (!ctx) return;

    // Simulated data
    const labels = ['Rice', 'Wheat', 'Maize', 'Tomato', 'Pepper'];
    const data = [45, 32, 28, 22, 15];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Recommendations',
                data: data,
                backgroundColor: '#1A3C25',
                borderRadius: 8,
                barThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
            }
        }
    });
}

/**
 * Export Functions
 */
async function exportUsersToCSV() {
    try {
        const snapshot = await db.collection('users').get();
        let csv = 'Name,Email,Role,Joined At\n';

        snapshot.forEach(doc => {
            const u = doc.data();
            const date = u.createdAt ?
                (u.createdAt.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A') :
                'N/A';
            csv += `"${u.name || 'N/A'}","${u.email}","${u.role || 'farmer'}","${date}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nutriroot-users.csv';
        a.click();
        showNotification('Export Successful', 'Your data has been exported to CSV.', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Export Failed', 'Unable to generate CSV file.', 'error');
    }
}

async function exportCropsToCSV() {
    try {
        const snapshot = await db.collection('crops').get();
        let csv = 'Name,Category,pH Min,pH Max,N,P,K\n';

        snapshot.forEach(doc => {
            const c = doc.data();
            csv += `"${c.name}","${c.category}",${c.ph_min},${c.ph_max},${c.nitrogen_min},${c.phosphorus_min},${c.potassium_min}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nutriroot-crops.csv';
        a.click();
        showNotification('CSV Exported Successfully', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Export Failed', 'error');
    }
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
window.exportUsersToCSV = exportUsersToCSV;
window.exportCropsToCSV = exportCropsToCSV;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadAnalytics, 1000);
});
