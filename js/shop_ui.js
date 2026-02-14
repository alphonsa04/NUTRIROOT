/**
 * NutriRoot - Shop UI Logic
 * Handles filtering, rendering products, and cart interactions.
 */

const ShopUI = {
    allProducts: [],

    async init() {
        // Load products
        this.allProducts = await ProductEngine.fetchProducts();

        // Initial render
        this.renderProducts(this.allProducts);

        // Update Cart Badge
        ProductEngine.updateCartUI();

        // Listen for filter changes
        // Already handled by inline 'onchange' attributes calling ShopUI.filterProducts()

        // Init price slider label
        const range = document.getElementById('priceRange');
        if (range) {
            range.addEventListener('input', (e) => {
                document.getElementById('priceValue').innerText = `₹${e.target.value}`;
            });
        }
    },

    /**
     * Render the product grid
     */
    async renderProducts(products) {
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = '';

        if (products.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <p style="color: var(--secondary-color); font-size: 1.1rem;">No products found matching your criteria.</p>
                </div>
            `;
            return;
        }

        // 1. Get Recommendations for styling
        const soilData = JSON.parse(localStorage.getItem('nutriroot_latest_soil_data'));
        let recommendedIds = new Set();

        if (soilData) {
            const recommendedProducts = await ProductEngine.getRecommendations(soilData);
            recommendedProducts.forEach(p => recommendedIds.add(p.id));
        }

        // 2. Define Categories order
        const categories = [
            "Nitrogen Fertilizers",
            "Phosphatic Fertilizers",
            "Potassic Fertilizers",
            "Complex NPK Fertilizers",
            "Organic Fertilizers",
            "Soil Conditioners"
        ];

        // 3. Helper to render a card
        const createProductCard = (product, isRecommended = false) => {
            const isRec = isRecommended || recommendedIds.has(product.id);
            const badgeHtml = isRec
                ? `<div class="recommendation-badge">Recommended Based on Your Soil Analysis</div>`
                : '';

            const card = document.createElement('div');
            card.className = 'product-card';
            if (isRec) card.style.border = "2px solid #05CD99"; // Highlight recommended

            // Safe property access with defaults
            const npkString = (product.nitrogen_percent !== undefined)
                ? `NPK: ${product.nitrogen_percent}-${product.phosphorus_percent}-${product.potassium_percent}`
                : '';

            card.innerHTML = `
                ${badgeHtml}
                <div class="product-image-container">
                    <img src="${product.image_url}" alt="${product.name}" class="product-image" onerror="this.src='assets/images/tree-logo.png'"> 
                </div>
                <div class="product-details">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-meta" style="font-size: 0.85rem; color: #555; margin-bottom:0.5rem; font-weight:600;">
                        ${npkString}
                    </div>
                    <div class="product-price">₹${product.price}</div>
                    <p style="font-size: 0.9rem; color: #707EAE; margin-bottom: 1rem; flex: 1;">${product.description ? product.description.substring(0, 80) + '...' : ''}</p>
                    
                    ${product.stock_quantity === 0 ? '<div style="color:red; font-size:0.8rem; margin-bottom:0.5rem;">Out of Stock</div>' : ''}

                    <div class="product-actions">
                        <button class="btn btn-outline btn-cart" 
                            onclick="ShopUI.addToCart('${product.id}')"
                            ${product.stock_quantity === 0 ? 'disabled' : ''}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
            return card;
        };

        // 4. Render Recommended Section First (if any)
        if (recommendedIds.size > 0) {
            const recSectionTitle = document.createElement('h2');
            recSectionTitle.className = 'section-title';
            recSectionTitle.style.gridColumn = "1 / -1";
            recSectionTitle.style.marginTop = "2rem";
            recSectionTitle.innerText = "🌟 Recommended for Your Soil";
            grid.appendChild(recSectionTitle);

            // Filter and Render Recommended items first
            products.filter(p => recommendedIds.has(p.id)).forEach(product => {
                grid.appendChild(createProductCard(product, true));
            });
        }

        // 5. Render Categories
        let handledIds = new Set(recommendedIds);

        categories.forEach(cat => {
            const catProducts = products.filter(p => p.category === cat);

            if (catProducts.length > 0) {
                const title = document.createElement('h2');
                title.className = 'section-title';
                title.style.gridColumn = "1 / -1";
                title.style.marginTop = "2rem";
                title.style.borderBottom = "1px solid #eee";
                title.style.paddingBottom = "0.5rem";
                title.innerText = cat;
                grid.appendChild(title);

                catProducts.forEach(product => {
                    grid.appendChild(createProductCard(product));
                    handledIds.add(product.id);
                });
            }
        });

        // 6. Catch-all for other products
        const otherProducts = products.filter(p => !handledIds.has(p.id));
        if (otherProducts.length > 0) {
            const title = document.createElement('h2');
            title.className = 'section-title';
            title.style.gridColumn = "1 / -1";
            title.style.marginTop = "2rem";
            title.style.borderBottom = "1px solid #eee";
            title.style.paddingBottom = "0.5rem";
            title.innerText = "Other Fertilizers";
            grid.appendChild(title);

            otherProducts.forEach(product => {
                grid.appendChild(createProductCard(product));
            });
        }
    },

    /**
     * Filter products based on sidebar inputs
     */
    filterProducts() {
        const searchText = document.getElementById('shopSearch').value.toLowerCase();
        const maxPrice = parseInt(document.getElementById('priceRange').value);

        // Get checked categories
        const checkedCategories = Array.from(document.querySelectorAll('.filter-option input:checked'))
            .map(cb => cb.value.toLowerCase());

        const filtered = this.allProducts.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchText) ||
                product.description.toLowerCase().includes(searchText);

            const matchesPrice = product.price <= maxPrice;

            // Category match logic (OR logic within categories)
            // If no category selected, show all
            let matchesCategory = true;
            if (checkedCategories.length > 0) {
                // Check if product category matches any checked box
                // Or if product tags overlap with checked categories
                const productTags = [product.category.toLowerCase(), ...(product.tags || [])];
                matchesCategory = checkedCategories.some(cat => productTags.includes(cat));
            }

            return matchesSearch && matchesPrice && matchesCategory;
        });

        this.renderProducts(filtered);
    },

    clearFilters() {
        document.getElementById('shopSearch').value = '';
        document.getElementById('priceRange').value = 2000;
        document.getElementById('priceValue').innerText = '₹2000';
        document.querySelectorAll('.filter-option input').forEach(cb => cb.checked = false);
        this.renderProducts(this.allProducts);
    },

    /**
     * Cart Interactions
     */
    addToCart(productId) {
        const product = this.allProducts.find(p => p.id === productId);
        if (product) {
            ProductEngine.addToCart(product);
            this.renderCartItems(); // Render if modal is open
        }
    },

    toggleCart() {
        const modal = document.getElementById('cartModal');
        const overlay = document.getElementById('cartOverlay');
        modal.classList.toggle('active');
        overlay.classList.toggle('active');

        if (modal.classList.contains('active')) {
            this.renderCartItems();
        }
    },

    renderCartItems() {
        const container = document.getElementById('cartItems');
        const cart = ProductEngine.cart;
        const total = ProductEngine.getCartTotal();

        document.getElementById('cartTotal').innerText = `₹${total.toFixed(2)}`;

        if (cart.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; margin-top: 3rem; color: var(--secondary-color);">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E0E5F2" stroke-width="2" style="margin-bottom: 1rem;">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <p>Your cart is empty</p>
                    <button class="btn btn-outline" style="margin-top: 1rem;" onclick="ShopUI.toggleCart()">Start Shopping</button>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        cart.forEach(item => {
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <img src="${item.image}" class="cart-item-img" onerror="this.src='assets/images/tree-logo.png'">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">₹${item.price}</div>
                    <div class="cart-controls">
                        <button class="qty-btn" onclick="ProductEngine.updateQuantity('${item.id}', -1); ShopUI.renderCartItems()">-</button>
                        <span style="font-weight: 600; font-size: 0.9rem; margin: 0 4px;">${item.quantity}</span>
                        <button class="qty-btn" onclick="ProductEngine.updateQuantity('${item.id}', 1); ShopUI.renderCartItems()">+</button>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    },

    checkout() {
        const cart = ProductEngine.cart;
        const total = ProductEngine.getCartTotal();
        const itemCount = cart.reduce((count, item) => count + item.quantity, 0);

        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        if (typeof PaymentGateway !== 'undefined') {
            PaymentGateway.startShopPayment(total, itemCount, (paymentId) => {
                // Success Callback
                alert(`Order Placed Successfully! Payment ID: ${paymentId}\nThank you for shopping with NutriRoot.`);

                // Clear cart
                ProductEngine.clearCart();
                this.renderCartItems();
                this.toggleCart();
            });
        } else {
            console.error("PaymentGateway not loaded");
            alert("Payment system unavailable. Please check your internet connection.");
        }
    }
};

// Initialize after DOM load
window.addEventListener('DOMContentLoaded', () => {
    ShopUI.init();
});
