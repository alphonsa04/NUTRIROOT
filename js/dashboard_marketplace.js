const DashboardMarketplace = {
    async init() {
        console.log('Marketplace: Initializing...');
        await this.loadMarketplaceProducts();
    },

    async loadMarketplaceProducts() {
        const grid = document.getElementById('marketplaceGrid');
        if (!grid) return;

        try {
            // Fetch products that have a sellerId (listed by independent shops)
            const snapshot = await db.collection('products')
                .where('sellerId', '!=', null)
                .limit(8)
                .get();

            if (snapshot.empty) {
                grid.innerHTML = `
                    <div class="empty-marketplace">
                        <p>No products from nearby shops yet.</p>
                    </div>
                `;
                return;
            }

            grid.innerHTML = '';
            snapshot.forEach(doc => {
                const product = { id: doc.id, ...doc.data() };
                grid.appendChild(this.createMarketCard(product));
            });

        } catch (error) {
            console.error('Error loading marketplace products:', error);
            grid.innerHTML = '<p style="color:red; text-align:center;">Failed to load local shop products.</p>';
        }
    },

    createMarketCard(p) {
        const card = document.createElement('div');
        card.className = 'market-card';

        card.innerHTML = `
            <div class="market-img-container">
                <img src="${p.image || p.image_url || 'assets/images/products/generic-fertilizer.jpg'}" class="market-img" onerror="this.src='assets/images/products/generic-fertilizer.jpg'">
            </div>
            <div class="market-info">
                <p class="market-category">${p.category || 'Fertilizer'}</p>
                <h3 class="market-name">${p.name}</h3>
                <div class="market-price-row">
                    <span class="market-price">₹${p.price}</span>
                    <button class="btn-market-buy" onclick="DashboardMarketplace.buyProduct('${p.id}')">Buy Now</button>
                </div>
            </div>
        `;
        return card;
    },

    async buyProduct(productId) {
        const user = firebase.auth().currentUser;
        if (!user) {
            if (typeof showModal === 'function') {
                showModal('Auth Required', 'Please log in to purchase fertilizers.', 'error');
            } else {
                ValidationEngine.showNotification('Please log in to purchase fertilizers.', 'error');
            }
            return;
        }

        // Fetch full product details
        const doc = await db.collection('products').doc(productId).get();
        if (!doc.exists) return;
        const p = doc.data();

        // Redirect to global shop or handle direct payment?
        // Let's use the existing PaymentGateway if available
        if (typeof PaymentGateway !== 'undefined') {
            const amount = p.price * 100; // Razorpay needs paise
            PaymentGateway.initiatePayment(amount, async (response) => {
                // Success callback
                const cart = [{
                    id: productId,
                    name: p.name,
                    price: p.price,
                    quantity: 1,
                    sellerId: p.sellerId,
                    sellerName: p.sellerName,
                    shopName: p.shopName,
                    image: p.image || p.image_url || ""
                }];

                // Use ProductEngine if available to save order
                if (typeof ProductEngine !== 'undefined') {
                    const engine = new ProductEngine();
                    await engine.saveOrder(response.razorpay_payment_id, cart, p.price);
                    if (typeof showModal === 'function') {
                        showModal('Success!', 'Your order has been placed successfully.', 'success');
                    }
                }
            });
        } else {
            ValidationEngine.showNotification('Payment system is currently unavailable.', 'error');
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => DashboardMarketplace.init());
