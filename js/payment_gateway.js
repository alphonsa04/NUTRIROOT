/**
 * NutriRoot Razorpay Integration
 * For Academic/Demo purposes - Uses Razorpay Standard Checkout
 */

const PaymentGateway = {
    // Placeholder Test Key
    RAZORPAY_KEY: 'rzp_test_S9ZEnR6yRMmHWB',

    /**
     * Show the pricing plan selection modal
     * @param {function} callback - Function to run on success
     */
    showPlanSelection(callback) {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert("Please log in to see premium plans.");
            return;
        }

        // Store callback for later use
        this.currentSuccessCallback = callback;

        // Create Modal HTML
        const checkIcon = `
            <svg class="feature-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="color: #097939;">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;

        const modalHtml = `
            <div id="pricingModalOverlay" class="pricing-modal-overlay">
                <div class="pricing-modal">
                    <button class="pricing-close-btn" onclick="PaymentGateway.closePricingModal()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    <div class="pricing-header">
                        <h2>Choose Your Plan</h2>
                        <p>Unlock unlimited access to premium features.</p>
                    </div>

                    <div class="pricing-grid">
                        <!-- Free Trial (Used) -->
                        <div class="pricing-card used">
                            <h3 class="card-title">Free Trial</h3>
                            <div class="card-price">
                                <span class="price-currency">₹</span>
                                <span class="price-amount">0</span>
                                <span class="price-period">/mo</span>
                            </div>
                            <ul class="card-features">
                                <li class="feature-item">${checkIcon} 1-time Analysis</li>
                                <li class="feature-item">${checkIcon} Basic Reports</li>
                                <li class="feature-item">${checkIcon} Limited History</li>
                            </ul>
                            <button class="pricing-btn btn-trial" disabled>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                Expired
                            </button>
                            <p class="trial-used-msg">Trial already used.</p>
                        </div>

                        <!-- Monthly Plan -->
                        <div class="pricing-card popular">
                            <div class="badge badge-popular">Popular</div>
                            <h3 class="card-title">Monthly</h3>
                            <div class="card-price">
                                <span class="price-currency">₹</span>
                                <span class="price-amount">499</span>
                                <span class="price-period">/mo</span>
                            </div>
                            <ul class="card-features">
                                <li class="feature-item">${checkIcon} Unlimited Analysis</li>
                                <li class="feature-item">${checkIcon} Premium Reports</li>
                                <li class="feature-item">${checkIcon} Priority Help</li>
                            </ul>
                            <button class="pricing-btn btn-monthly" onclick="PaymentGateway.selectPlan('Monthly', 499)">
                                Get Started
                            </button>
                        </div>

                        <!-- Yearly Plan -->
                        <div class="pricing-card best-value">
                            <h3 class="card-title">Yearly</h3>
                            <div class="card-price">
                                <span class="price-currency">₹</span>
                                <span class="price-amount">4999</span>
                                <span class="price-period">/yr</span>
                            </div>
                            <ul class="card-features">
                                <li class="feature-item">${checkIcon} Save ₹1000/yr</li>
                                <li class="feature-item">${checkIcon} Expert Advice</li>
                                <li class="feature-item">${checkIcon} Multi-user</li>
                            </ul>
                            <button class="pricing-btn btn-yearly" onclick="PaymentGateway.selectPlan('Yearly', 4999)">
                                Best Value
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Inject Modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        setTimeout(() => {
            document.getElementById('pricingModalOverlay').classList.add('active');
        }, 10);
    },

    closePricingModal() {
        const overlay = document.getElementById('pricingModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 400);
        }
    },

    selectPlan(plan, amount) {
        this.closePricingModal();
        this.startPayment(plan, amount, this.currentSuccessCallback);
    },

    /**
     * Start the Razorpay payment process
     */
    startPayment(feature, amount, callback) {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const options = {
            "key": this.RAZORPAY_KEY,
            "amount": amount * 100,
            "currency": "INR",
            "name": "NutriRoot Premium",
            "description": `Upgrade to ${feature} Plan`,
            "image": "assets/images/tree-logo.png",
            "handler": function (response) {
                console.log("Payment Successful:", response.razorpay_payment_id);
                if (callback) callback();
            },
            "prefill": {
                "name": user.displayName || "Farmer",
                "email": user.email || ""
            },
            "theme": {
                "color": "#1A3C25"
            },
            "modal": {
                "ondismiss": function () {
                    console.log("Checkout form closed by user");
                }
            }
        };

        if (typeof Razorpay === 'undefined') {
            alert("Razorpay SDK not loaded.");
            return;
        }

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
            alert("Payment Failed: " + response.error.description);
        });
        rzp.open();
    }
};
