// NutriRoot - Admin User Management

let allUsers = [];
let filteredUsers = [];

/**
 * Load all users from Firestore
 */
async function loadUsers() {
    const loadingDiv = document.getElementById('usersTableBody');
    if (loadingDiv) {
        loadingDiv.innerHTML = '<tr><td colspan="5" class="admin-loading"><div class="admin-spinner"></div></td></tr>';
    }

    try {
        const snapshot = await db.collection('users').get();
        allUsers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        filteredUsers = [...allUsers];
        renderUsersTable();
        updateUserStats();
    } catch (error) {
        console.error('Error loading users:', error);
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem; color: var(--accent-red);">
                        Error loading users. Please check your permissions.
                    </td>
                </tr>
            `;
        }
    }
}

/**
 * Render users table
 */
function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="admin-empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <h3>No users found</h3>
                    <p>Try adjusting your search criteria</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredUsers.map(user => `
        <tr>
            <td>
                <div style="font-weight: 600; color: var(--primary-color);">${user.name || 'No Name'}</div>
                <div style="font-size: 0.85rem; color: var(--secondary-color);">${user.email}</div>
            </td>
            <td><span class="role-badge ${user.role || 'farmer'}">${user.role || 'farmer'}</span></td>
            <td style="color: var(--secondary-color);">${formatDate(user.createdAt)}</td>
            <td style="color: var(--secondary-color);">${user.uid ? user.uid.substring(0, 8) + '...' : 'N/A'}</td>
            <td>
                <div class="admin-action-buttons">
                    <button class="btn-icon-small edit" onclick="openEditUserModal('${user.id}')" title="Edit User">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon-small delete" onclick="confirmDeleteUser('${user.id}', '${user.name || user.email}')" title="Delete User">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Search/filter users
 */
function searchUsers(query) {
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) {
        filteredUsers = [...allUsers];
    } else {
        filteredUsers = allUsers.filter(user =>
            (user.name && user.name.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm)) ||
            (user.role && user.role.toLowerCase().includes(searchTerm))
        );
    }

    renderUsersTable();
}

/**
 * Filter users by role
 */
function filterByRole(role) {
    if (role === 'all') {
        filteredUsers = [...allUsers];
    } else {
        filteredUsers = allUsers.filter(user => user.role === role);
    }
    renderUsersTable();
}

/**
 * Update user statistics
 */
function updateUserStats() {
    const totalUsers = allUsers.length;
    const adminUsers = allUsers.filter(u => u.role === 'admin').length;
    const farmerUsers = allUsers.filter(u => u.role === 'farmer' || !u.role).length;

    document.getElementById('totalUsersCount').textContent = totalUsers;
    document.getElementById('adminUsersCount').textContent = adminUsers;
    document.getElementById('farmerUsersCount').textContent = farmerUsers;
}

/**
 * Open edit user modal
 */
function openEditUserModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.name || '';
    document.getElementById('editUserEmail').value = user.email || '';
    document.getElementById('editUserRole').value = user.role || 'farmer';

    document.getElementById('editUserModal').classList.add('active');
}

/**
 * Close edit user modal
 */
function closeEditUserModal() {
    document.getElementById('editUserModal').classList.remove('active');
}

/**
 * Save user changes
 */
async function saveUserChanges() {
    const userId = document.getElementById('editUserId').value;
    const name = document.getElementById('editUserName').value.trim();
    const role = document.getElementById('editUserRole').value;

    if (!name) {
        showNotification('Input Required', 'Please enter a name for the user.', 'error');
        return;
    }

    try {
        await db.collection('users').doc(userId).update({
            name: name,
            role: role
        });

        showNotification('User Updated', `${name}'s profile has been updated.`, 'success');
        closeEditUserModal();
        loadUsers(); // Reload users
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('Update Failed', error.message, 'error');
    }
}

/**
 * Confirm delete user
 */
function confirmDeleteUser(userId, userName) {
    document.getElementById('deleteUserName').textContent = userName;
    document.getElementById('confirmDeleteUserId').value = userId;
    document.getElementById('deleteUserModal').classList.add('active');
}

/**
 * Close delete confirmation modal
 */
function closeDeleteUserModal() {
    document.getElementById('deleteUserModal').classList.remove('active');
}

/**
 * Delete user
 */
async function deleteUser() {
    const userId = document.getElementById('confirmDeleteUserId').value;

    try {
        await db.collection('users').doc(userId).delete();
        showNotification('User Deleted', 'The user account has been removed.', 'success');
        closeDeleteUserModal();
        loadUsers(); // Reload users
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Deletion Failed', error.message, 'error');
    }
}

/**
 * Format date
 */
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';

    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        return 'N/A';
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
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

// Load users when page loads
window.addEventListener('load', () => {
    setTimeout(loadUsers, 1000);
});

// Make functions globally available
window.loadUsers = loadUsers;
window.searchUsers = searchUsers;
window.filterByRole = filterByRole;
window.openEditUserModal = openEditUserModal;
window.closeEditUserModal = closeEditUserModal;
window.saveUserChanges = saveUserChanges;
window.confirmDeleteUser = confirmDeleteUser;
window.closeDeleteUserModal = closeDeleteUserModal;
window.deleteUser = deleteUser;
