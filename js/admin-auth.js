// NutriRoot - Admin Authentication Middleware

/**
 * Admin Authentication Check
 * Verifies that the current user has admin role
 * Redirects non-admin users to dashboard
 */

function checkAdminAccess() {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            // Not logged in - redirect to login
            console.log('Admin access denied: Not authenticated');
            window.location.href = 'index.html';
            return;
        }

        // Check if user has admin role in Firestore
        db.collection('users').doc(user.uid).get()
            .then((doc) => {
                if (!doc.exists) {
                    console.log('Admin access denied: User document not found');
                    window.location.href = 'dashboard.html';
                    return;
                }

                const userData = doc.data();
                const roleFound = userData ? userData.role : 'NOT FOUND';

                console.log('--- ADMIN ACCESS DIAGNOSTIC ---');
                console.log('User Email:', user.email);
                console.log('User UID:', user.uid);
                console.log('Role Found in DB:', roleFound);
                console.log('------------------------------');

                if (!userData || userData.role !== 'admin') {
                    const debugMsg = `Admin Access Denied!\nEmail: ${user.email}\nRole in DB: ${roleFound}\n\nYou need 'role: "admin"' in Firestore.`;
                    console.log(debugMsg);
                    // Uncomment the next line only if user still can't see logs
                    // alert(debugMsg); 
                    window.location.href = 'dashboard.html?admin_error=' + encodeURIComponent(roleFound);
                    return;
                }

                // User is admin - allow access
                console.log('Admin access granted:', user.email);

                // Update admin UI with user info
                updateAdminUI(user, userData);
            })
            .catch((error) => {
                console.error('Error checking admin access:', error);
                window.location.href = 'dashboard.html';
            });
    });
}

/**
 * Update Admin UI with user information
 */
function updateAdminUI(user, userData) {
    // Update profile dropdown if it exists
    const nameEl = document.getElementById('adminUserName');
    const emailEl = document.getElementById('adminUserEmail');

    if (nameEl) {
        nameEl.textContent = userData.name || user.displayName || 'Admin';
    }

    if (emailEl) {
        emailEl.textContent = user.email;
    }
}

/**
 * Check if current user is admin (async)
 * Returns a promise that resolves to true/false
 */
async function isCurrentUserAdmin() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                resolve(false);
                return;
            }

            try {
                const doc = await db.collection('users').doc(user.uid).get();
                if (!doc.exists) {
                    resolve(false);
                    return;
                }

                const userData = doc.data();
                resolve(userData.role === 'admin');
            } catch (error) {
                console.error('Error checking admin status:', error);
                resolve(false);
            }
        });
    });
}

/**
 * Show/hide admin navigation link based on user role
 * Call this on regular user pages (dashboard, etc.)
 */
async function toggleAdminNavLink() {
    const isAdmin = await isCurrentUserAdmin();
    const adminLinks = document.querySelectorAll('.admin-only');

    adminLinks.forEach(link => {
        if (isAdmin) {
            link.style.display = 'flex';
        } else {
            link.style.display = 'none';
        }
    });
}

/**
 * Automatically inject Admin Panel link into the profile dropdown if user is admin
 */
async function injectAdminLink() {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) return;

    const profileMenu = document.getElementById('profileMenu');
    if (!profileMenu) return;

    // Check if link already exists
    if (profileMenu.querySelector('.admin-link-injected')) return;

    // Create the admin link element
    const adminLink = document.createElement('a');
    adminLink.href = 'admin.html';
    adminLink.className = 'dropdown-item admin-link-injected';
    adminLink.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
        </svg>
        Admin Panel
    `;

    // Find a good place to insert (before Sign Out or after Settings)
    const dangerItem = profileMenu.querySelector('.dropdown-item.danger');
    if (dangerItem) {
        profileMenu.insertBefore(adminLink, dangerItem.previousElementSibling || dangerItem);
    } else {
        profileMenu.appendChild(adminLink);
    }
}

// Run admin check or link injection when page loads
if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
    const isAdminPage = window.location.pathname.includes('admin');

    if (isAdminPage) {
        checkAdminAccess();
    } else if (!isLoginPage) {
        // Only inject link on non-login pages
        injectAdminLink();
    }
} else {
    console.error('Firebase auth or db not initialized');
}

// Make functions globally available
window.checkAdminAccess = checkAdminAccess;
window.isCurrentUserAdmin = isCurrentUserAdmin;
window.toggleAdminNavLink = toggleAdminNavLink;
