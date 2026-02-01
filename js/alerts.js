/**
 * NutriRoot - Alerts Page Logic
 * Handles rendering of smart alerts based on soil analysis.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth to initialize
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            await renderAlertsPage();
        } else {
            showLoginState();
        }
    });

    // Initialize filter buttons
    setupFilters();
});

/**
 * Main function to render the alerts page
 */
async function renderAlertsPage() {
    const container = document.getElementById('alertsContainer');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="loader-container">
            <div class="loader-spinner"></div>
            <p>Scanning your soil data...</p>
        </div>
    `;

    try {
        // 1. Get latest soil data
        const soilData = await getLatestSoilData();

        if (!soilData) {
            renderEmptyState(container, 'No soil data found. Go to the Dashboard to enter your latest readings.');
            return;
        }

        // 2. Analyze data to get warnings
        // Using the global analyzeSoilData function from script.js
        const analysis = analyzeSoilData(soilData);
        const alerts = analysis.warnings || [];

        // 3. Render alerts
        if (alerts.length === 0) {
            renderAllGoodState(container);
        } else {
            renderAlertList(container, alerts, soilData.timestamp);
        }

        // 4. Mark as read
        localStorage.setItem('nutriroot_last_viewed_analysis', soilData.timestamp.toString());

        // Clear badge immediately
        const badge = document.getElementById('alertBadge');
        if (badge) badge.style.display = 'none';

    } catch (error) {
        console.error('Error rendering alerts:', error);
        container.innerHTML = `<p class="error-text">Failed to load alerts. Please try again.</p>`;
    }
}

/**
 * Render list of alert cards
 */
function renderAlertList(container, alerts, timestamp = Date.now()) {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    container.innerHTML = '';

    // Sort alerts: high severity first
    alerts.sort((a, b) => {
        const severityScore = { 'high': 3, 'medium': 2, 'low': 1 };
        return severityScore[b.severity] - severityScore[a.severity];
    });

    alerts.forEach(alert => {
        const card = document.createElement('div');
        card.className = `alert-card alert-${alert.severity}`;
        card.setAttribute('data-category', alert.severity === 'high' ? 'critical' : 'soil'); // Simple mapping for filtering

        // Icon mapping
        let icon = 'Info';
        if (alert.type.includes('Deficiency')) icon = 'TrendingDown';
        if (alert.type.includes('High') || alert.type.includes('Excess')) icon = 'TrendingUp';
        if (alert.type.includes('PH') || alert.type.includes('Acid') || alert.type.includes('Alkaline')) icon = 'Activity';
        if (alert.type.includes('Moisture')) icon = 'Droplet';

        card.innerHTML = `
            <div class="alert-icon-box">
                ${getFeatherIcon(icon)}
            </div>
            <div class="alert-content" style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 1rem;">
                
                <!-- Title & Message Group -->
                <div style="flex: 2; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                        <h3 class="alert-title" style="white-space: nowrap; margin: 0;">${alert.type}</h3>
                    </div>
                    <p class="alert-message" style="margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${alert.message}</p>
                </div>

                <!-- Measured Level Pill -->
                ${alert.parameter ? `
                <div style="flex: 1; display: flex; justify-content: center; min-width: 140px;">
                    <span style="background: rgba(0,0,0,0.04); padding: 4px 10px; border-radius: 99px; font-size: 0.8rem; font-weight: 700; color: var(--primary-color); border: 1px solid rgba(0,0,0,0.05); white-space: nowrap; display: flex; align-items: center; gap: 6px;">
                        <span style="color: #64748b; font-weight: 500;">${alert.parameter}:</span>
                        <span>${alert.value} ${alert.unit}</span>
                    </span>
                </div>
                ` : '<div style="flex: 1;"></div>'}

                <!-- Timestamp -->
                <div class="alert-actions" style="flex-shrink: 0; min-width: 100px; text-align: right;">
                    <span style="font-size: 0.8rem; color: #94a3b8; font-weight: 500;">${timeStr}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Render "All Good" Zero State
 */
function renderAllGoodState(container) {
    container.innerHTML = `
        <div class="empty-state all-good">
            <div class="empty-icon-bg">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#05CD99" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h3>Your Soil is Healthy!</h3>
            <p>No issues detected in your latest analysis. Keep up the good work!</p>
            <button onclick="window.location.href='dashboard.html'" class="btn-secondary">Check Dashboard</button>
        </div>
    `;
}

/**
 * Render Empty State (No Data)
 */
function renderEmptyState(container, message) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon-bg">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <h3>No Alerts Yet</h3>
            <p>${message}</p>
            <button onclick="window.location.href='dashboard.html'" class="btn-primary">Enter Soil Data</button>
        </div>
    `;
}

/**
 * Setup Filter Buttons
 */
function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            buttons.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            filterAlerts(filter);
        });
    });
}

/**
 * Filter Cards Logic
 */
function filterAlerts(filter) {
    const cards = document.querySelectorAll('.alert-card');
    cards.forEach(card => {
        if (filter === 'all') {
            card.style.display = 'flex';
        } else {
            if (card.getAttribute('data-category') === filter) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

function showLoginState() {
    const container = document.getElementById('alertsContainer');
    if (container) {
        renderEmptyState(container, 'Please log in to view your soil alerts.');
    }
}

/**
 * Helper to get SVG icons
 */
function getFeatherIcon(name) {
    const icons = {
        'TrendingDown': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>',
        'TrendingUp': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
        'Activity': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
        'Droplet': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.74 5.88-5.74 5.88-5.74-5.88z"></path><path d="M2 22h20"></path></svg>',
        'Info': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };
    return icons[name] || icons['Info'];
}
