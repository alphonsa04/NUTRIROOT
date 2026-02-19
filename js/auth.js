// NutriRoot - Authentication Module

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBH8-lzi0tdTd6PO5KTKliErz-gLyh1_6I",
    authDomain: "nutriroot-9dcdc.firebaseapp.com",
    projectId: "nutriroot-9dcdc",
    storageBucket: "nutriroot-9dcdc.firebasestorage.app",
    messagingSenderId: "1020174292074",
    appId: "1:1020174292074:web:102ac5f8b16dcabe356613"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Services
const auth = firebase.auth();
const db = firebase.firestore();

/* ========================================
   UI Helpers (Custom Modal)
   ======================================== */
var activeModalCloseCallback = null;

// Modal Logic - Moved from index.html and exposed globally
function openAuthModal(type) {
    const overlay = document.getElementById('authModalOverlay');
    if (overlay) overlay.classList.add('active');
    switchModal(type);
}

function closeAuthModal() {
    const overlay = document.getElementById('authModalOverlay');
    if (overlay) overlay.classList.remove('active');
}

function switchModal(type) {
    const loginCard = document.getElementById('loginCard');
    const registerCard = document.getElementById('registerCard');
    const forgotCard = document.getElementById('forgotCard');

    if (loginCard && registerCard) {
        loginCard.style.display = 'none';
        registerCard.style.display = 'none';
        if (forgotCard) forgotCard.style.display = 'none';

        if (type === 'login') {
            loginCard.style.display = 'flex';
        } else if (type === 'register') {
            registerCard.style.display = 'flex';
        } else if (type === 'forgot' && forgotCard) {
            forgotCard.style.display = 'flex';
        }
    }
}

// Make globally available
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchModal = switchModal;

// Initialize Custom Modal HTML
function initCustomModal() {
    // Ensure body exists before trying to insert
    if (!document.body) return;

    if (!document.getElementById('customModal')) {
        const modalHtml = `
            <div id="customModal" class="modal-overlay" style="transition: none !important;">
                <div class="modal-box" style="transition: none !important; animation: none !important; transform: translateY(0) !important;">
                    <div class="modal-icon"></div>
                    <h3 class="modal-title" id="modalTitle"></h3>
                    <p class="modal-message" id="modalMessage"></p>
                    <button class="btn btn-primary" onclick="closeModal()">OK</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
}

// Run immediately AND on DOMContentLoaded to be safe
initCustomModal();
document.addEventListener('DOMContentLoaded', initCustomModal);

function showModal(title, message, type = 'info', onClose = null) {
    const modal = document.getElementById('customModal');
    if (!modal) return;

    const icon = modal.querySelector('.modal-icon');
    icon.innerHTML = ''; // Clear previous icon content
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;

    // Icon styling
    icon.className = 'modal-icon ' + type;
    icon.innerHTML = type === 'success' ? '✓' : type === 'error' ? '!' : 'i';

    // Callback
    activeModalCloseCallback = onClose;

    // Show instantly
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.classList.remove('active');
    }
    if (activeModalCloseCallback) {
        activeModalCloseCallback();
        activeModalCloseCallback = null;
    }
}
window.closeModal = closeModal; // Make globally available for button onclick

/* ========================================
   Authentication Functions
   ======================================== */

/* ========================================
   Validation Helpers
   ======================================== */
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
    // Firebase requires at least 6 chars
    return password && password.length >= 6;
}

function validateName(name) {
    // Check if name exists, has proper length, and contains only letters and spaces
    const namePattern = /^[A-Za-z\s]+$/;
    return name && name.trim().length >= 2 && name.trim().length <= 50 && namePattern.test(name.trim());
}

/* ========================================
   Authentication Functions
   ======================================== */

// 1. Google Sign-In
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            // Save to Firestore, then redirect
            return saveUserToFirestore(user);
        })
        .then(() => {
            console.log('Google Sign-In successful, redirecting...');
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            console.error('Error during Google sign-in:', error);

            let title = 'Sign In Failed';
            let message = 'An error occurred during Google sign-in. Please try again.';

            if (error.code === 'auth/popup-closed-by-user') {
                title = 'Sign In Cancelled';
                message = 'The sign-in window was closed before finishing. Please try again if you want to log in.';
            } else if (error.code === 'auth/cancelled-popup-request') {
                message = 'Only one sign-in window can be open at a time.';
            } else if (error.code === 'auth/popup-blocked') {
                title = 'Popup Blocked';
                message = 'Your browser blocked the sign-in popup. Please allow popups for this site.';
            } else {
                message = error.message;
            }

            showModal(title, message, 'error');
        });
}

// 2. Email/Password Registration (Farmer)
function registerWithEmail(fullName, email, password) {
    // Rely on native HTML5 validation attributes
    const form = document.getElementById('registerForm');
    if (form && !form.reportValidity()) {
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            return user.updateProfile({
                displayName: fullName
            }).then(() => {
                return saveUserToFirestore(user, fullName, 'farmer');
            }).then(() => {
                return auth.signOut();
            }).then(() => {
                showModal('Success!', 'Registration successful! Please login as Farmer.', 'success', () => {
                    if (window.location.pathname.includes('register.html')) {
                        window.location.href = 'index.html';
                    } else {
                        switchModal('login');
                    }
                });
            });
        })
        .catch((error) => {
            console.error('Registration error:', error);
            let title = 'Registration Failed';
            let message = error.message;

            if (error.code === 'auth/email-already-in-use') {
                title = 'Account Already Exists';
                message = 'This email is already registered. Please Log In instead.';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password should be at least 6 characters.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            }

            showModal(title, message, 'error');
        });
}

// 2b. Seller Registration
function registerSeller(sellerPayload) {
    const { email, password, firstName, lastName, phone, shopName, shopAddress, tin, tinExpireDate } = sellerPayload;
    const fullName = `${firstName} ${lastName}`;

    return auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const sellerData = {
                firstName,
                lastName,
                phone,
                shopName,
                shopAddress,
                tin,
                tinExpireDate,
                role: 'seller',
                shopStatus: 'pending', // New sellers might need approval in a real flow
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            return user.updateProfile({
                displayName: fullName
            }).then(() => {
                return saveUserToFirestore(user, fullName, 'seller', sellerData);
            }).then(() => {
                return auth.signOut();
            }).then(() => {
                showModal('Success!', 'Seller account application submitted! Please login.', 'success', () => {
                    window.location.href = 'index.html';
                });
            });
        })
        .catch((error) => {
            console.error('Seller registration error:', error);
            showModal('Registration Failed', error.message, 'error');
            throw error;
        });
}
window.registerSeller = registerSeller;

// 3. Email/Password Login
function signInWithEmail(email, password) {
    const form = document.getElementById('loginForm');
    if (form && !form.reportValidity()) {
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            return db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    const role = userData.role;

                    if (role === 'seller') {
                        if (userData.shopStatus === 'active') {
                            window.location.href = 'seller-dashboard.html';
                        } else {
                            // If not active, sign them out and show message
                            auth.signOut();
                            showModal('Account Pending', 'Your seller account is awaiting administrator approval. Please try again later.', 'info');
                        }
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    // Default to farmer dashboard if missing doc
                    window.location.href = 'dashboard.html';
                }
            });
        })
        .catch((error) => {
            console.error('Login error:', error);
            let title = 'Login Failed';
            let message = 'An error occurred during login. Please try again.';

            if (error.code === 'auth/invalid-login-credentials' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                title = 'Invalid Credentials';
                message = 'Incorrect email or password. Please try again.';
            } else if (error.code === 'auth/too-many-requests') {
                title = 'Too Many Attempts';
                message = 'Access to this account has been temporarily disabled due to many failed login attempts. Please reset your password or try again later.';
            } else {
                message = error.message;
            }

            showModal(title, message, 'error');
        });
}

// 4. Password Reset
function resetPassword(email) {
    // Rely on native HTML5 validation attributes in index.html
    const form = document.getElementById('forgotForm');
    if (form && !form.reportValidity()) {
        return; // Browser will show validation bubbles
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            const successMsg = document.getElementById('forgotSuccessMessage');
            if (successMsg) successMsg.style.display = 'block';

            showModal('Email Sent', 'Password reset link sent to ' + email, 'success');
        })
        .catch((error) => {
            console.error('Reset password error:', error);
            let title = 'Error';
            let message = error.message;

            if (error.code === 'auth/user-not-found') {
                title = 'User Not Found';
                message = 'No account found with this email address. Please check your spelling or register.';
            } else if (error.code === 'auth/invalid-email') {
                title = 'Invalid Email';
                message = 'Please enter a valid email address.';
            }

            showModal(title, message, 'error');
        });
}

// 5. Sign Out
function signOut() {
    const user = auth.currentUser;
    const uid = user ? user.uid : null;

    auth.signOut().then(() => {
        console.log('User signed out, clearing local cache...');

        // Clear user-specific soil data
        if (uid) {
            localStorage.removeItem(`nutriroot_latest_soil_data_${uid}`);
        }

        // Also fallback clear any legacy keys if they exist
        localStorage.removeItem('nutriroot_latest_soil_data');

        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Sign out error:', error);
    });
}
window.signOut = signOut; // Ensure global availability

/* ========================================
   Database Functions
   ======================================== */

// Save or Update User in Firestore
function saveUserToFirestore(user, specificName = null, role = 'farmer', additionalData = {}) {
    const userRef = db.collection('users').doc(user.uid);

    return userRef.get().then((doc) => {
        if (!doc.exists) {
            // Create new user document
            const baseData = {
                uid: user.uid,
                name: specificName || user.displayName || "No Name",
                email: user.email,
                photoURL: user.photoURL || "assets/images/default-avatar.svg",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: role
            };

            const fullData = { ...baseData, ...additionalData };

            return userRef.set(fullData)
                .then(() => {
                    console.log("User successfully stored in Firestore with role:", role);
                });
        }
    }).catch((error) => {
        console.error("Error saving user document:", error);
    });
}

/* ========================================
   Dropdown UI Logic
   ======================================== */
function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}
window.toggleProfileMenu = toggleProfileMenu;

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
    const menu = document.getElementById('profileMenu');
    const btn = document.getElementById('profileBtn');

    if (menu && menu.classList.contains('active')) {
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
            menu.classList.remove('active');
        }
    }
});

/* ========================================
   State Listener & UI Updates
   ======================================== */
function updateProfileUI(user) {
    if (!user) return;

    const userRef = db.collection('users').doc(user.uid);
    userRef.get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            const displayName = userData.name || user.displayName || "User";
            const displayEmail = user.email || userData.email || "";
            const photoURL = userData.photoURL || user.photoURL || "assets/images/default-avatar.svg";

            // List of various IDs used across different pages
            const nameIDs = ['dropdownUserName', 'adminUserName', 'sellerName', 'sellerShopName'];
            const emailIDs = ['dropdownUserEmail', 'adminUserEmail', 'sellerEmail'];
            const imgIDs = ['dropdownProfileImg', 'adminProfileImg', 'sellerProfileImg'];

            // Update Names
            nameIDs.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = (id === 'sellerShopName' && userData.role === 'seller') ? (userData.shopName || displayName) : displayName;
            });

            // Update Emails
            emailIDs.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = displayEmail;
            });

            // Update Images
            imgIDs.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.src = photoURL;
            });

            // Update Premium Badge if it exists
            const premiumBadge = document.getElementById('premiumBadge');
            if (premiumBadge) {
                premiumBadge.style.display = userData.isPremium === true ? 'inline-block' : 'none';
            }
        }
    }).catch(err => console.error('Error fetching user data from Firestore:', err));
}

// Global variable to store current user for re-checks
let _currentUser = null;

auth.onAuthStateChanged((user) => {
    _currentUser = user;
    if (user) {
        console.log('Auth: User is logged in:', user.email);

        // Role-based route guard
        db.collection('users').doc(user.uid).get().then(doc => {
            const userData = doc.exists ? doc.data() : { role: 'farmer' };
            const role = userData.role;
            const path = window.location.pathname;

            if (role === 'seller') {
                // Check approval status
                if (userData.shopStatus !== 'active') {
                    console.log('Auth: Seller account not active, signing out.');
                    auth.signOut();
                    if (!path.includes('index.html') && path !== '/') {
                        window.location.href = 'index.html';
                    }
                    return;
                }

                // If seller is on farmer pages, redirect to seller dashboard
                // Use regex to ensure we only match the specific farmer dashboard file, not seller-dashboard.html
                const isFarmerPage = /\/(dashboard|crops|recommendation|history|alerts)\.html$/.test(path);
                if (isFarmerPage) {
                    window.location.href = 'seller-dashboard.html';
                }
            } else if (role === 'farmer') {
                // If farmer is on seller pages, redirect to farmer dashboard
                if (path.includes('seller-dashboard.html')) {
                    window.location.href = 'dashboard.html';
                }
            }
        });

        startPersistentUpdate(user);
    } else {
        console.log('Auth: No user logged in');
        const path = window.location.pathname;
        const protectedPages = ['dashboard.html', 'crops.html', 'recommendation.html', 'history.html', 'alerts.html', 'seller-dashboard.html', 'admin.html', 'admin-seller-requests.html'];
        if (protectedPages.some(p => path.includes(p))) {
            window.location.href = 'index.html';
        }
    }
});

/**
 * Retries updating the UI until elements are found and updated
 */
function startPersistentUpdate(user) {
    // Initial attempt
    updateProfileUI(user);

    // Retry for a few seconds to handle dynamic loading
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
        attempts++;
        updateProfileUI(user);
        if (attempts >= maxAttempts) clearInterval(interval);
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    if (_currentUser) {
        startPersistentUpdate(_currentUser);
    }
});
