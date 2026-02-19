// NutriRoot - Admin Seller Request Management

let pendingRequests = [];
let filteredRequests = [];

/**
 * Load all pending seller requests from Firestore
 */
async function loadRequests() {
    const loadingDiv = document.getElementById('requestsTableBody');
    if (loadingDiv) {
        loadingDiv.innerHTML = '<tr><td colspan="5" class="admin-loading"><div class="admin-spinner"></div></td></tr>';
    }

    try {
        // Fetch users where role is seller and status is pending
        const snapshot = await db.collection('users')
            .where('role', '==', 'seller')
            .where('shopStatus', '==', 'pending')
            .get();

        pendingRequests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort by creation date (newest first)
        pendingRequests.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });

        filteredRequests = [...pendingRequests];
        renderRequestsTable();

        // Also update the dashboard count if we're on the main admin page (unlikely but good for consistency)
        const pendingBadge = document.getElementById('pendingSellers');
        if (pendingBadge) pendingBadge.textContent = pendingRequests.length;

    } catch (error) {
        console.error('Error loading requests:', error);
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem; color: var(--accent-red);">
                        Error loading requests. Please check your permissions.
                    </td>
                </tr>
            `;
        }
    }
}

/**
 * Render requests table
 */
function renderRequestsTable() {
    const tbody = document.getElementById('requestsTableBody');
    if (!tbody) return;

    if (filteredRequests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="admin-empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <polyline points="17 11 19 13 23 9"></polyline>
                    </svg>
                    <h3>No pending requests</h3>
                    <p>Great! All applications have been processed.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredRequests.map(req => `
        <tr>
            <td>
                <div style="font-weight: 600; color: var(--primary-color);">${req.shopName || 'Unnamed Shop'}</div>
                <div style="font-size: 0.85rem; color: var(--secondary-color);">${req.shopAddress || 'No Address'}</div>
            </td>
            <td>
                <div style="font-weight: 500; color: var(--primary-color);">${req.name || 'No Name'}</div>
                <div style="font-size: 0.85rem; color: var(--secondary-color);">${req.email}</div>
                <div style="font-size: 0.85rem; color: var(--secondary-color);">${req.phone || 'No Phone'}</div>
            </td>
            <td>
                <div style="font-weight: 600; color: #1A3C25;">${req.tin || 'N/A'}</div>
                <div style="font-size: 0.8rem; color: var(--accent-orange);">Expires: ${req.tinExpireDate || 'N/A'}</div>
            </td>
            <td style="color: var(--secondary-color);">${formatDate(req.createdAt)}</td>
            <td>
                <div class="admin-action-buttons">
                    <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--accent-green);" 
                        onclick="approveSeller('${req.id}', '${req.shopName}')">
                        Approve
                    </button>
                    <button class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; color: var(--accent-red); border-color: var(--accent-red);" 
                        onclick="confirmReject('${req.id}', '${req.shopName}')">
                        Reject
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Approve seller application
 */
async function approveSeller(userId, shopName) {
    if (!confirm(`Are you sure you want to approve ${shopName}?`)) return;

    try {
        await db.collection('users').doc(userId).update({
            shopStatus: 'active',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (typeof showNotification === 'function') {
            showNotification('Success', `${shopName} has been approved.`, 'success');
        } else {
            alert(`${shopName} has been approved.`);
        }

        loadRequests();
    } catch (error) {
        console.error('Error approving seller:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error', 'Failed to approve application.', 'error');
        } else {
            alert('Failed to approve application.');
        }
    }
}

/**
 * Confirm rejection
 */
function confirmReject(userId, shopName) {
    document.getElementById('rejectUserId').value = userId;
    document.getElementById('rejectShopName').textContent = shopName;
    document.getElementById('rejectModal').classList.add('active');
}

/**
 * Close reject modal
 */
function closeRejectModal() {
    document.getElementById('rejectModal').classList.remove('active');
}

/**
 * Reject/Delete application
 */
async function rejectSeller() {
    const userId = document.getElementById('rejectUserId').value;
    const shopName = document.getElementById('rejectShopName').textContent;

    try {
        // In this implementation, we delete the user doc for simplicity if rejected
        // A better flow might be setting status to 'rejected'
        await db.collection('users').doc(userId).delete();

        if (typeof showNotification === 'function') {
            showNotification('Application Rejected', `${shopName} request has been removed.`, 'success');
        }

        closeRejectModal();
        loadRequests();
    } catch (error) {
        console.error('Error rejecting seller:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error', 'Failed to reject application.', 'error');
        }
    }
}

/**
 * Search requests
 */
function searchRequests(query) {
    const term = query.toLowerCase();
    filteredRequests = pendingRequests.filter(req =>
        (req.shopName && req.shopName.toLowerCase().includes(term)) ||
        (req.name && req.name.toLowerCase().includes(term)) ||
        (req.email && req.email.toLowerCase().includes(term))
    );
    renderRequestsTable();
}

/**
 * Format date helper
 */
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Global exposure
window.loadRequests = loadRequests;
window.searchRequests = searchRequests;
window.approveSeller = approveSeller;
window.confirmReject = confirmReject;
window.closeRejectModal = closeRejectModal;
window.rejectSeller = rejectSeller;

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadRequests, 1000); // Wait for auth/db to init
});
Riverside
