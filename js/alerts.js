/**
 * NutriRoot - Modern Notification Center Logic
 * Handles rendering of structured alerts, summary statistics, and interactive actions.
 */

// Mock System Updates to populate the UI
const SYSTEM_UPDATES = [
    {
        id: 'sys-1',
        type: 'System Update',
        category: 'system',
        severity: 'low',
        title: 'NutriRoot v2.4 Live',
        message: 'We\'ve added new soil sensor compatibility and improved recommendation accuracy. Check out the new dashboard features!',
        timestamp: Date.now() - 86400000, // 1 day ago
        status: 'new'
    },
    {
        id: 'sys-2',
        type: 'Security',
        category: 'system',
        severity: 'low',
        title: 'Account Sync Successful',
        message: 'Your farm data is now securely backed up to the cloud. Last sync was successful.',
        timestamp: Date.now() - 3600000 * 5, // 5 hours ago
        status: 'read'
    }
];

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth to initialize
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            await initNotificationCenter();
        } else {
            showLoginState();
        }
    });

    // Initialize tab filters
    setupTabFilters();
});

/**
 * Initialize the notification center
 */
async function initNotificationCenter() {
    const container = document.getElementById('alertsContainer');
    if (!container) return;

    try {
        // 1. Get latest soil data and analyze it
        const soilData = await getLatestSoilData();
        let soilAlerts = [];

        if (soilData) {
            const analysis = analyzeSoilData(soilData);
            soilAlerts = mapSoilWarningsToAlerts(analysis.warnings, soilData.timestamp);
        }

        // 2. Combine with system updates
        const allAlerts = [...soilAlerts, ...SYSTEM_UPDATES];

        // 3. Sort by timestamp (newest first)
        allAlerts.sort((a, b) => b.timestamp - a.timestamp);

        // 4. Update Summary Stats
        updateSummaryStats(allAlerts);

        // 5. Render Alerts
        if (allAlerts.length === 0) {
            renderHealthyState(container);
        } else {
            renderAlertTimeline(container, allAlerts);
        }

        // 6. Update Tab Counts
        updateTabCounts(allAlerts);

    } catch (error) {
        console.error('Error initializing alerts:', error);
        container.innerHTML = `<div class="empty-state-card" style="border-color: #feb2b2; background: #fff5f5;">
            <h3>Oops! Something went wrong</h3>
            <p>We couldn't load your notifications. Please try refreshing the page.</p>
            <button onclick="window.location.reload()" class="btn-primary" style="margin-top: 1rem;">Retry</button>
        </div>`;
    }
}

/**
 * Map soil analysis warnings to the new alert format
 */
function mapSoilWarningsToAlerts(warnings, timestamp) {
    const ts = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;

    return warnings.map((w, index) => {
        let category = 'soil';
        // Map some things to Weather if they are temp/moisture related
        if (w.type.includes('Moisture') || w.type.includes('Temperature')) {
            category = 'weather';
        }

        // If high severity, highlight as critical
        const isCritical = w.severity === 'high';

        return {
            id: `soil-${index}-${ts}`,
            type: w.type,
            category: category,
            severity: isCritical ? 'critical' : (category === 'weather' ? 'soil' : 'soil'), // Using soil as default orange
            isCritical: isCritical,
            title: w.type,
            message: w.message,
            timestamp: ts,
            parameter: w.parameter,
            value: w.value,
            unit: w.unit,
            status: 'new'
        };
    });
}

/**
 * Calculate and update summary cards
 */
function updateSummaryStats(alerts) {
    const stats = {
        total: alerts.length,
        critical: alerts.filter(a => a.isCritical || a.severity === 'high').length,
        soil: alerts.filter(a => a.category === 'soil').length,
        system: alerts.filter(a => a.category === 'system').length
    };

    document.getElementById('statsTotal').textContent = stats.total;
    document.getElementById('statsCritical').textContent = stats.critical;
    document.getElementById('statsSoil').textContent = stats.soil;
    document.getElementById('statsSystem').textContent = stats.system;
}

/**
 * Update the numbers on the filter tabs
 */
function updateTabCounts(alerts) {
    document.getElementById('countAll').textContent = alerts.length;
    document.getElementById('countCritical').textContent = alerts.filter(a => a.isCritical || a.severity === 'high').length;
    document.getElementById('countSoil').textContent = alerts.filter(a => a.category === 'soil').length;
    document.getElementById('countWeather').textContent = alerts.filter(a => a.category === 'weather').length;
    document.getElementById('countSystem').textContent = alerts.filter(a => a.category === 'system').length;
}

/**
 * Render the alerts in a timeline format
 */
function renderAlertTimeline(container, alerts) {
    container.innerHTML = '<div class="alerts-timeline" id="timeline"></div>';
    const timeline = document.getElementById('timeline');

    alerts.forEach((alert, index) => {
        const item = document.createElement('div');
        item.className = `alert-item ${alert.isCritical ? 'critical' : alert.category}`;
        item.style.animationDelay = `${index * 0.1}s`;
        item.setAttribute('data-category', alert.category);
        if (alert.isCritical) item.setAttribute('data-is-critical', 'true');

        const timeStr = formatRelativeTime(alert.timestamp);

        // Icon logic
        let icon = 'bell';
        if (alert.category === 'soil') icon = 'activity';
        if (alert.category === 'weather') icon = 'cloud';
        if (alert.category === 'system') icon = 'settings';
        if (alert.isCritical) icon = 'alert-triangle';

        item.innerHTML = `
            <div class="alert-card-modern ${alert.status === 'new' ? 'unread' : ''} ${alert.isCritical ? 'critical' : alert.category}" id="card-${alert.id}">
                <div class="alert-icon-wrapper">
                    <i data-feather="${icon}"></i>
                </div>
                <div class="alert-body">
                    <div class="alert-header">
                        <span class="alert-type">${alert.isCritical ? 'Critical' : alert.type}</span>
                        <span class="alert-time">${timeStr}</span>
                    </div>
                    <h3 class="alert-title-modern">${alert.title}</h3>
                    <p class="alert-desc">${alert.message}</p>
                    
                    <div class="alert-meta">
                        ${alert.parameter ? `
                        <div class="meta-pill">
                            <i data-feather="bar-chart-2" style="width: 14px; height: 14px;"></i>
                            <span>${alert.parameter}: <strong>${alert.value} ${alert.unit}</strong></span>
                        </div>
                        ` : ''}
                        <div class="meta-pill">
                            <i data-feather="tag" style="width: 14px; height: 14px;"></i>
                            <span>${capitalize(alert.category)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        timeline.appendChild(item);
    });

    // Initialize feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    } else {
        // Fallback for icons if feather isn't loaded yet
        setTimeout(() => { if (window.feather) feather.replace(); }, 1000);
    }
}

/**
 * Render "All Healthy" State
 */
function renderHealthyState(container) {
    container.innerHTML = `
        <div class="empty-state-card">
            <div class="success-icon-badge">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h2 style="font-size: 2rem; color: #2d3748; margin-bottom: 0.5rem;">Your Farm is Healthy</h2>
            <p style="color: #718096; max-width: 400px; margin: 0 auto 2rem;">No issues detected in your latest analysis or system status. Your crops are growing in optimal conditions.</p>
            <button onclick="window.location.href='dashboard.html'" class="btn-primary" style="padding: 1rem 2rem; font-size: 1rem;">
                View Dashboard
            </button>
        </div>
    `;
}

/**
 * Interaction Handlers
 */
function markAsRead(id) {
    const card = document.getElementById(`card-${id}`);
    if (card) {
        card.classList.remove('unread');
        // In a real app, this would update Firestore
        const btn = card.querySelector('button[onclick*="markAsRead"]');
        if (btn) btn.remove();
        showMessage('Marked as read', 'info');
    }
}

function resolveAlert(id) {
    const card = document.getElementById(`card-${id}`);
    const item = card ? card.closest('.alert-item') : null;
    if (item) {
        item.classList.add('fade-out');
        setTimeout(() => {
            item.remove();
            // Update stats
            const currentTotal = parseInt(document.getElementById('statsTotal').textContent);
            document.getElementById('statsTotal').textContent = Math.max(0, currentTotal - 1);

            // Check if all gone
            const remaining = document.querySelectorAll('.alert-item');
            if (remaining.length === 0) {
                renderHealthyState(document.getElementById('alertsContainer'));
            }
            showMessage('Alert resolved', 'success');
        }, 300);
    }
}

function viewRecommendation(category) {
    if (category === 'soil' || category === 'weather') {
        window.location.href = 'recommendation.html';
    } else {
        showMessage('Viewing details for system update...', 'info');
    }
}

/**
 * Setup Tab Filters
 */
function setupTabFilters() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.getAttribute('data-filter');
            applyFilter(filter);
        });
    });
}

function applyFilter(filter) {
    const items = document.querySelectorAll('.alert-item');
    let visibleCount = 0;

    items.forEach(item => {
        const category = item.getAttribute('data-category');
        const isCritical = item.getAttribute('data-is-critical') === 'true';

        let show = false;
        if (filter === 'all') show = true;
        else if (filter === 'critical') show = isCritical;
        else if (filter === category) show = true;

        if (show) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    // If no items match filter, show small empty state
    const container = document.getElementById('alertsContainer');
    const existingMsg = document.getElementById('no-filter-results');
    if (visibleCount === 0) {
        if (!existingMsg) {
            const msg = document.createElement('div');
            msg.id = 'no-filter-results';
            msg.className = 'empty-state-card';
            msg.style.padding = '2rem';
            msg.innerHTML = `<h3>No ${capitalize(filter)} alerts</h3><p>Everything looks good in this category.</p>`;
            container.appendChild(msg);
        }
    } else if (existingMsg) {
        existingMsg.remove();
    }
}

/**
 * Utility Functions
 */
function formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showLoginState() {
    const container = document.getElementById('alertsContainer');
    if (container) {
        container.innerHTML = `
            <div class="empty-state-card" style="border-color: #e2e8f0;">
                <div class="success-icon-badge" style="color: #718096;">
                    <i data-feather="lock"></i>
                </div>
                <h3>Authentication Required</h3>
                <p>Please log in to view your personalized farm alerts.</p>
                <button onclick="window.location.href='index.html'" class="btn-primary" style="margin-top: 1rem;">Go to Login</button>
            </div>
        `;
        if (window.feather) feather.replace();
    }
}
