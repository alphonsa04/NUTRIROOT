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
            loginCard.style.display = 'block';
        } else if (type === 'register') {
            registerCard.style.display = 'block';
        } else if (type === 'forgot' && forgotCard) {
            forgotCard.style.display = 'block';
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

// 2. Email/Password Registration
function registerWithEmail(fullName, email, password) {
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // Update the display name in Firebase Auth
            user.updateProfile({
                displayName: fullName
            }).then(() => {
                // Save additional user data to Firestore
                return saveUserToFirestore(user, fullName);
            }).then(() => {
                // Sign out so they have to log in manually
                // and redirect via callback
                return auth.signOut();
            }).then(() => {
                showModal('Success!', 'Registration successful! Please login.', 'success', () => {
                    // Stay on index page and switch to login modal
                    switchModal('login');
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

// 3. Email/Password Login
function signInWithEmail(email, password) {
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Login successful:', userCredential.user);
            // Sync user to Firestore if missing
            return saveUserToFirestore(userCredential.user).then(() => {
                window.location.href = 'dashboard.html';
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
    auth.signOut().then(() => {
        console.log('User signed out, redirecting to index.html');
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
function saveUserToFirestore(user, specificName = null) {
    const userRef = db.collection('users').doc(user.uid);

    return userRef.get().then((doc) => {
        if (!doc.exists) {
            // Create new user document
            return userRef.set({
                uid: user.uid,
                name: specificName || user.displayName || "No Name",
                email: user.email,
                photoURL: user.photoURL || "assets/images/default-avatar.png",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: "farmer"
            })
                .then(() => {
                    console.log("User successfully stored in Firestore!");
                });
        } else {
            console.log("User already exists in db.");
        }
    }).catch((error) => {
        console.error("Error getting document:", error);
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
    if (!user) {
        console.log('updateProfileUI: No user provided');
        return;
    }

    console.log('updateProfileUI: Attempting to populate dropdown for:', user.email);
    const nameEl = document.getElementById('dropdownUserName');
    const emailEl = document.getElementById('dropdownUserEmail');

    if (nameEl && emailEl) {
        nameEl.textContent = user.displayName || "Farmer";
        emailEl.textContent = user.email;
        console.log('updateProfileUI: UI updated successfully with:', user.email);

        // Try to fetch custom name from Firestore if displayName is empty or default
        if (!user.displayName || user.displayName === "Farmer" || user.displayName === "User") {
            const userRef = db.collection('users').doc(user.uid);
            userRef.get().then((doc) => {
                if (doc.exists && doc.data().name) {
                    nameEl.textContent = doc.data().name;
                    console.log('updateProfileUI: Name updated from Firestore:', doc.data().name);
                }
            }).catch(err => console.error('Error fetching name from Firestore:', err));
        }
    } else {
        console.warn('updateProfileUI: Dropdown elements NOT found. (nameEl:', !!nameEl, 'emailEl:', !!emailEl, ')');
    }
}

// Global variable to store current user for re-checks
let _currentUser = null;

auth.onAuthStateChanged((user) => {
    _currentUser = user;
    if (user) {
        console.log('Auth: User is logged in:', user.email);
        startPersistentUpdate(user);
    } else {
        console.log('Auth: No user logged in');
        const path = window.location.pathname;
        if (path.includes('dashboard.html') || path.includes('crops.html') || path.includes('recommendation.html') || path.includes('history.html') || path.includes('alerts.html')) {
            window.location.href = 'index.html';
        }
    }
});

/**
 * Retries updating the UI until elements are found and updated
 * This solves race conditions where DOM might not be ready or 
 * elements might be temporarily missing.
 */
function startPersistentUpdate(user) {
    if (!user) return;

    // Initial attempt
    updateProfileUI(user);

    // Retry for a few seconds to be absolutely sure
    let attempts = 0;
    const maxAttempts = 15;
    const interval = setInterval(() => {
        attempts++;

        const emailEl = document.getElementById('dropdownUserEmail');
        if (emailEl && emailEl.textContent === user.email) {
            // Already updated correctly
            console.log('Auth: Profile UI successfully verified.');
            clearInterval(interval);
            return;
        }

        console.log('Auth: Retrying profile update (attempt ' + attempts + ')...');
        updateProfileUI(user);

        if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.warn('Auth: Persistent update stopped after max attempts.');
        }
    }, 1000); // Check every second
}

// Re-check after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    if (_currentUser) {
        startPersistentUpdate(_currentUser);
    }
});
