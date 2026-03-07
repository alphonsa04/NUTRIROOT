/**
 * NutriRoot - Product Engine
 * Handles fetching products, managing cart, and generating smart recommendations.
 */

const ProductEngine = {
    // Cache for products
    productsCache: null,

    // Cart State
    cart: [],

    /**
     * Initialize Engine
     */
    init() {
        this.loadCart();
        console.log('ProductEngine initialized');
    },

    /**
     * Fetch all products from Firestore with caching
     */
    async fetchProducts() {
        if (this.productsCache) return this.productsCache;

        try {
            const db = firebase.firestore();
            let snapshot = await db.collection('products')
                .where('status', '==', 'approved')
                .get();
            let products = [];

            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });

            if ((products.length < 16) && typeof seedProducts === 'function') {
                console.log("ProductEngine: Product list incomplete or empty. Seeding/Updating database...");
                await seedProducts();
                // Re-fetch after seeding - ENSURE FILTER IS APPLIED
                snapshot = await db.collection('products')
                    .where('status', '==', 'approved')
                    .get();
                products = [];
                snapshot.forEach(doc => {
                    products.push({ id: doc.id, ...doc.data() });
                });
            }

            this.productsCache = products;
            console.log(`ProductEngine: Loaded ${products.length} products.`);
            return products;
        } catch (error) {
            console.error("ProductEngine: Error fetching products:", error);

            // Fallback to hardcoded products if Firestore fails
            console.log("ProductEngine: Using fallback product data.");
            const fallbackProducts = [
                // Nitrogen
                { id: "urea_46", name: "Urea (46-0-0)", category: "Nitrogen Fertilizers", nitrogen_percent: 46, phosphorus_percent: 0, potassium_percent: 0, price: 266.50, stock_quantity: 500, description: "High-concentration nitrogen fertilizer.", image_url: "assets/images/products/urea.png", status: 'approved' },
                { id: "ammonium_sulphate", name: "Ammonium Sulphate (21-0-0)", category: "Nitrogen Fertilizers", nitrogen_percent: 21, phosphorus_percent: 0, potassium_percent: 0, price: 850.00, stock_quantity: 200, description: "Provides Nitrogen and Sulfur. High quality.", image_url: "assets/images/products/amsul.png", status: 'approved' },

                // Phosphatic
                { id: "dap_18_46", name: "DAP (18-46-0)", category: "Phosphatic Fertilizers", nitrogen_percent: 18, phosphorus_percent: 46, potassium_percent: 0, price: 1350.00, stock_quantity: 300, description: "Excellent for root development.", image_url: "assets/images/products/dap.png", status: 'approved' },
                { id: "ssp_16", name: "SSP (0-16-0)", category: "Phosphatic Fertilizers", nitrogen_percent: 0, phosphorus_percent: 16, potassium_percent: 0, price: 450.00, stock_quantity: 400, description: "Cost-effective Phosphorus source.", image_url: "assets/images/products/ssp.png", status: 'approved' },

                // Potassic
                { id: "mop_60", name: "MOP (0-0-60)", category: "Potassic Fertilizers", nitrogen_percent: 0, phosphorus_percent: 0, potassium_percent: 60, price: 1700.00, stock_quantity: 250, description: "Improves disease resistance.", image_url: "assets/images/products/mop.png", status: 'approved' },

                // Complex NPK
                { id: "npk_20_20_20", name: "NPK 20-20-20", category: "Complex NPK Fertilizers", nitrogen_percent: 20, phosphorus_percent: 20, potassium_percent: 20, price: 220.00, stock_quantity: 150, description: "Balanced fertilizer for general growth.", image_url: "assets/images/products/npk20.png", status: 'approved' },
                { id: "npk_10_26_26", name: "NPK 10-26-26", category: "Complex NPK Fertilizers", nitrogen_percent: 10, phosphorus_percent: 26, potassium_percent: 26, price: 1400.00, stock_quantity: 100, description: "High P and K content.", image_url: "assets/images/products/npk102626.png", status: 'approved' },
                { id: "npk_12_32_16", name: "NPK 12-32-16", category: "Complex NPK Fertilizers", nitrogen_percent: 12, phosphorus_percent: 32, potassium_percent: 16, price: 1450.00, stock_quantity: 120, description: "Phosphorus-rich complex fertilizer.", image_url: "assets/images/products/npk123216.png", status: 'approved' },
                { id: "npk_17_17_17", name: "NPK 17-17-17", category: "Complex NPK Fertilizers", nitrogen_percent: 17, phosphorus_percent: 17, potassium_percent: 17, price: 1300.00, stock_quantity: 180, description: "Balanced nutrient source.", image_url: "assets/images/products/npk17.png", status: 'approved' },
                { id: "npk_19_19_19", name: "NPK 19-19-19", category: "Complex NPK Fertilizers", nitrogen_percent: 19, phosphorus_percent: 19, potassium_percent: 19, price: 180.00, stock_quantity: 300, description: "Balanced water-soluble fertilizer.", image_url: "assets/images/products/npk19.png", status: 'approved' },

                // Organic
                { id: "vermicompost", name: "Premium Vermicompost", category: "Organic Fertilizers", nitrogen_percent: 1.5, phosphorus_percent: 0.5, potassium_percent: 0.5, price: 250.00, stock_quantity: 1000, description: "Organic manure for soil health.", image_url: "assets/images/products/vermicompost.png", status: 'approved' },
                { id: "neem_cake", name: "Neem Cake", category: "Organic Fertilizers", nitrogen_percent: 2, phosphorus_percent: 1, potassium_percent: 1, price: 950.00, stock_quantity: 400, description: "Natural pesticide and soil conditioner.", image_url: "assets/images/products/neem_cake.png", status: 'approved' },

                // Conditioners
                { id: "zinc_sulphate", name: "Zinc Sulphate", category: "Soil Conditioners", nitrogen_percent: 0, phosphorus_percent: 0, potassium_percent: 0, price: 180.00, stock_quantity: 150, description: "Used to correct Zinc deficiency.", image_url: "assets/images/products/zinc.png", status: 'approved' },
                { id: "gypsum", name: "Gypsum", category: "Soil Conditioners", nitrogen_percent: 0, phosphorus_percent: 0, potassium_percent: 0, price: 250.00, stock_quantity: 300, description: "Used for soil conditioning.", image_url: "assets/images/products/gypsum.png", status: 'approved' },
                { id: "agri_lime", name: "Agricultural Lime", category: "Soil Conditioners", nitrogen_percent: 0, phosphorus_percent: 0, potassium_percent: 0, price: 350.00, stock_quantity: 500, description: "Used to raise pH of acidic soils.", image_url: "assets/images/products/lime.png", status: 'approved' },
                { id: "elemental_sulfur", name: "Elemental Sulfur", category: "Soil Conditioners", nitrogen_percent: 0, phosphorus_percent: 0, potassium_percent: 0, price: 450.00, stock_quantity: 200, description: "Used to lower pH of alkaline soils.", image_url: "assets/images/products/sulfur.png", status: 'approved' }
            ];

            this.productsCache = fallbackProducts;
            return fallbackProducts;
        }
    },

    /**
     * Get products matching specific deficiencies
     */
    async getRecommendations(soilAnalysis) {
        const allProducts = await this.fetchProducts();
        if (!soilAnalysis) return [];

        // Check for specific deficiencies
        const needsN = soilAnalysis.nitrogen.status === 'low';
        const needsP = soilAnalysis.phosphorus.status === 'low';
        const needsK = soilAnalysis.potassium.status === 'low';
        const needsPhLow = soilAnalysis.ph.status === 'low';
        const needsPhHigh = soilAnalysis.ph.status === 'high';

        // Filter valid products based on logic
        let recommendations = allProducts.map(product => {
            let isRecommended = false;
            let matchReason = "";
            const nameLower = product.name.toLowerCase();

            // Logic 1: N Deficiency -> Urea or high N
            if (needsN && (nameLower.includes('urea') || product.nitrogen_percent > 20)) {
                isRecommended = true;
                matchReason += "Rich in Nitrogen for rapid growth. ";
            }

            // Logic 2: P Deficiency -> DAP or high P
            if (needsP && (nameLower.includes('dap') || product.phosphorus_percent > 20)) {
                isRecommended = true;
                matchReason += "High Phosphorus for root development. ";
            }

            // Logic 3: K Deficiency -> MOP or high K
            if (needsK && (nameLower.includes('mop') || product.potassium_percent > 20)) {
                isRecommended = true;
                matchReason += "Potassium-rich for disease resistance. ";
            }

            // Logic 4: Balanced Deficiency (All 3 low) -> Show Complex NPK
            if (needsN && needsP && needsK && product.category === 'Complex NPK Fertilizers') {
                isRecommended = true;
                matchReason = "Balanced NPK for total nutrient recovery. ";
            }

            // Logic 5: pH Correction
            if (needsPhLow && (nameLower.includes('lime') || nameLower.includes('gypsum') || product.id === 'gypsum')) {
                isRecommended = true;
                matchReason += "Helps stabilize soil pH. ";
            }
            if (needsPhHigh && (nameLower.includes('sulfur') || nameLower.includes('sulphur') || nameLower.includes('gypsum') || product.id === 'gypsum')) {
                isRecommended = true;
                matchReason += "Helps lower soil pH. ";
            }

            return { ...product, is_recommended: isRecommended, matchReason: matchReason.trim() };
        });

        const filtered = recommendations.filter(p => p.is_recommended);
        console.log('ProductEngine: Recommended products:', filtered.map(p => p.name));
        return filtered;
    },

    /**
     * Helper to add to cart by ID (for recommendations page)
     */
    async handleAddToCartById(productId) {
        const allProducts = await this.fetchProducts();
        const product = allProducts.find(p => p.id === productId);
        if (product) {
            this.addToCart(product);
        } else {
            console.error('ProductEngine: Product not found:', productId);
        }
    },

    /**
     * Cart Management
     */
    addToCart(product, quantity = 1) {
        // Find existing or add new
        const existing = this.cart.find(item => item.id === product.id);
        const currentQty = existing ? existing.quantity : 0;

        // STANDARD STOCK DETECTION
        const stock = product.stock !== undefined ? Number(product.stock) :
            (product.stock_quantity !== undefined ? Number(product.stock_quantity) : 0);

        if (currentQty + quantity > stock) {
            const msg = `Limit reached. Only ${stock} items available.`;
            if (typeof ValidationEngine !== 'undefined') {
                ValidationEngine.showNotification(msg, 'error');
            } else if (typeof showMessage === 'function') {
                showMessage(msg, 'error');
            }
            return;
        }

        if (existing) {
            existing.quantity += quantity;
        } else {
            this.cart.push({ ...product, quantity: quantity });
        }
        this.saveCart();
        this.updateCartUI();

        const successMsg = `Added ${quantity} x ${product.name} to cart`;
        if (typeof showMessage === 'function') showMessage(successMsg, 'success');
        else if (typeof ValidationEngine !== 'undefined') ValidationEngine.showNotification(successMsg, 'success');
    },

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
    },

    updateQuantity(productId, delta) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            // Prioritize 'stock' then 'stock_quantity'
            const stock = item.stock !== undefined ? Number(item.stock) :
                (item.stock_quantity !== undefined ? Number(item.stock_quantity) : 0);

            if (delta > 0 && item.quantity + delta > stock) {
                const msg = `Cannot exceed available stock (${stock}).`;
                if (typeof ValidationEngine !== 'undefined') {
                    ValidationEngine.showNotification(msg, 'error');
                } else if (typeof showMessage === 'function') {
                    showMessage(msg, 'error');
                }
                return;
            }
            item.quantity += delta;
            if (item.quantity <= 0) this.removeFromCart(productId);
            else this.saveCart();
        }
        this.updateCartUI();
    },

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartUI();
    },

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    saveCart() {
        localStorage.setItem('nutriroot_cart', JSON.stringify(this.cart));
    },

    loadCart() {
        const saved = localStorage.getItem('nutriroot_cart');
        let parsedCart = [];
        try {
            parsedCart = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Error parsing cart from localStorage:", e);
            // Fallback to empty cart if parsing fails
        }
        this.cart = parsedCart;

        // Final Robust Safety: Clamp all loaded items to their identified stock
        let cartModified = false;
        this.cart = this.cart.map(item => {
            // Use the same stock logic as addToCart/updateQuantity
            const stock = item.stock !== undefined ? Number(item.stock) :
                (item.stock_quantity !== undefined ? Number(item.stock_quantity) : 0);

            if (item.quantity > stock && stock > 0) {
                console.warn(`NutriRoot: Clamping ${item.name} from ${item.quantity} to stock limit ${stock}`);
                cartModified = true;
                return { ...item, quantity: stock };
            } else if (stock === 0 && item.quantity > 0) { // If stock is 0 but item is in cart
                console.warn(`NutriRoot: Removing ${item.name} from cart as stock is 0.`);
                cartModified = true;
                return null; // Mark for removal
            }
            return item;
        }).filter(item => item !== null); // Filter out items marked for removal

        if (cartModified) {
            this.saveCart(); // Save back if clamped or items removed
        }
    },

    // Placeholder for UI update - to be overwritten by UI, or emit event
    updateCartUI() {
        const count = this.cart.reduce((a, b) => a + b.quantity, 0);
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.innerText = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }

        // Also update cart modal if open
        if (typeof renderCartItems === 'function') renderCartItems();
    },

    /**
     * Save Order to Firestore
     */
    async saveOrder(paymentId, cart, total, shippingDetails = {}) {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error("saveOrder: No user logged in");
            throw new Error("User not authenticated");
        }

        try {
            const db = firebase.firestore();
            const orderData = {
                uid: user.uid,
                paymentId: paymentId,
                items: cart.map(item => ({
                    id: item.id || "N/A",
                    name: item.name || "Unknown Product",
                    price: item.price || 0,
                    quantity: item.quantity || 1,
                    image: item.image || item.image_url || "",
                    sellerId: item.sellerId || "admin",
                    sellerName: item.sellerName || "NutriRoot",
                    shopName: item.shopName || "NutriRoot Official"
                })),
                total: total,
                shippingDetails: shippingDetails,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'Paid'
            };

            console.log("Saving order for user:", user.uid);
            await db.collection('orders').add(orderData);

            console.log("Order saved to Firestore successfully.");
            return true;
        } catch (error) {
            console.error("Error saving order:", error);
            throw error; // Throw so caller can handle/show message
        }
    },

    /**
     * Fetch user orders from Firestore
     */
    async getUserOrders() {
        const user = firebase.auth().currentUser;
        if (!user) return [];

        try {
            const db = firebase.firestore();
            // Try fetching with ordering first
            let snapshot;
            try {
                snapshot = await db.collection('orders')
                    .where('uid', '==', user.uid)
                    .orderBy('timestamp', 'desc')
                    .get();
            } catch (indexError) {
                console.warn("Firestore index might be missing. Falling back to in-memory sort.", indexError);
                // Fallback: fetch without ordering and sort in memory
                snapshot = await db.collection('orders')
                    .where('uid', '==', user.uid)
                    .get();
            }

            let orders = [];
            snapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() });
            });

            // If we had to fallback, or just to be safe, sort by timestamp
            orders.sort((a, b) => {
                const timeA = a.timestamp ? (a.timestamp.seconds || new Date(a.timestamp).getTime()) : 0;
                const timeB = b.timestamp ? (b.timestamp.seconds || new Date(b.timestamp).getTime()) : 0;
                return timeB - timeA;
            });

            return orders;
        } catch (error) {
            console.error("Error fetching user orders:", error);
            return [];
        }
    }
};

// Auto-init
ProductEngine.init();
