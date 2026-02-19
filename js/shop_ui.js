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

        // Load Order History in background
        this.renderOrderHistory();

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

        // --- Deduplication & Grouping Logic ---
        const grouped = {};
        products.forEach(p => {
            // SAFETY FILTER: Only process approved items
            if (p.status !== 'approved' && p.status !== undefined) return;

            // Generate a unique key based on Name, Category, and Price
            const key = `${p.name}|${p.category}|${p.price}`.toLowerCase().replace(/\s+/g, '');
            const isThisItemRecommended = recommendedIds.has(p.id);
            if (!grouped[key]) {
                grouped[key] = {
                    ...p,
                    image_url: p.image_url || p.image || 'assets/images/products/generic-fertilizer.jpg',
                    originalStock: p.stock_quantity || 0,
                    sellerAttributionId: p.id, // Primary seller for this group
                    isGroupRecommended: isThisItemRecommended
                };
            } else {
                // Aggregate Stock
                grouped[key].stock_quantity += (p.stock_quantity || 0);
                if (isThisItemRecommended) grouped[key].isGroupRecommended = true;

                // Update representative seller if this one has more stock
                if ((p.stock_quantity || 0) > (grouped[key].originalStock || 0)) {
                    grouped[key].id = p.id;
                    grouped[key].sellerAttributionId = p.id;
                    grouped[key].originalStock = p.stock_quantity;
                    grouped[key].image_url = p.image_url || p.image || grouped[key].image_url;
                }
            }
        });

        const displayProducts = Object.values(grouped);

        let handledIds = new Set(); // Track rendered products to prevent duplicates

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
            const isRec = isRecommended || product.isGroupRecommended || recommendedIds.has(product.id);
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

        if (recommendedIds.size > 0) {
            const recSectionTitle = document.createElement('h2');
            recSectionTitle.className = 'section-title';
            recSectionTitle.style.gridColumn = "1 / -1";
            recSectionTitle.style.marginTop = "2rem";
            recSectionTitle.innerText = "🌟 Recommended for Your Soil";
            grid.appendChild(recSectionTitle);

            // Filter and Render Recommended items first
            displayProducts.filter(p => p.isGroupRecommended || recommendedIds.has(p.id)).forEach(product => {
                grid.appendChild(createProductCard(product, true));
                handledIds.add(product.id); // Mark as handled so it doesn't repeat in categories
            });
        }

        // 5. Render Categories

        categories.forEach(cat => {
            const catProducts = displayProducts.filter(p => p.category === cat && !handledIds.has(p.id));

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
        const otherProducts = displayProducts.filter(p => !handledIds.has(p.id));
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
            ValidationEngine.showNotification("Your cart is empty!", "error");
            return;
        }

        if (typeof PaymentGateway !== 'undefined') {
            PaymentGateway.startShopPayment(total, itemCount, async (paymentId) => {
                // Success Callback
                ValidationEngine.showNotification(`Order Placed Successfully! Payment ID: ${paymentId}`, "success");

                // Save Order to Firestore
                try {
                    const saved = await ProductEngine.saveOrder(paymentId, [...cart], total);

                    if (saved) {
                        // Clear cart
                        ProductEngine.clearCart();
                        this.renderCartItems();
                        this.toggleCart();

                        // Show Orders View
                        this.showOrders();
                    }
                } catch (saveError) {
                    console.error("Checkout save failed:", saveError);
                    ValidationEngine.showNotification("Order placed but could not be saved to history.", "error");
                }
            });
        } else {
            console.error("PaymentGateway not loaded");
            ValidationEngine.showNotification("Payment system unavailable.", "error");
        }
    },

    /**
     * Helper to calculate estimated delivery
     */
    getDeliveryEstimate(timestamp) {
        const orderDate = (timestamp && timestamp.seconds)
            ? new Date(timestamp.seconds * 1000)
            : new Date();

        // Add 5 days for estimate
        const estimate = new Date(orderDate);
        estimate.setDate(orderDate.getDate() + 5);

        return estimate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    },

    /**
     * Modal Controller
     */
    openActionModal(title, html) {
        document.getElementById('actionModalTitle').innerText = title;
        document.getElementById('actionModalBody').innerHTML = html;
        document.getElementById('actionOverlay').classList.add('active');
    },

    closeActionModal() {
        document.getElementById('actionOverlay').classList.remove('active');
    },

    /**
     * Interactive Order Actions
     */
    async shareItem(productName) {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Check out ${productName} from NutriRoot`,
                    text: `I just ordered ${productName} from NutriRoot Fertilizer shop!`,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Share canceled or failed:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            const dummy = document.createElement('input');
            document.body.appendChild(dummy);
            dummy.value = `NutriRoot: ${productName} - ${window.location.href}`;
            dummy.select();
            document.execCommand('copy');
            document.body.removeChild(dummy);
            ValidationEngine.showNotification('Link copied to clipboard!', 'success');
        }
    },

    trackPackage(orderId, arrivalDate) {
        const orderNum = orderId ? orderId.substring(4) : 'N/A';
        const html = `
            <div style="margin-bottom: 1rem; color: #565959; font-size: 0.9rem;">Order #${orderNum}</div>
            <div class="stepper">
                <div class="step active">
                    <div class="step-icon">✓</div>
                    <div class="step-content">
                        <div class="step-title">Order Placed</div>
                        <div class="step-desc">We've received your order</div>
                    </div>
                </div>
                <div class="step active">
                    <div class="step-icon">✓</div>
                    <div class="step-content">
                        <div class="step-title">Dispatched</div>
                        <div class="step-desc">Package has left our warehouse</div>
                    </div>
                </div>
                <div class="step active">
                    <div class="step-icon">●</div>
                    <div class="step-content">
                        <div class="step-title">In Transit</div>
                        <div class="step-desc">On its way to your city</div>
                    </div>
                </div>
                <div class="step">
                    <div class="step-icon"></div>
                    <div class="step-content">
                        <div class="step-title">Delivered</div>
                        <div class="step-desc">Estimated arrival: ${arrivalDate}</div>
                    </div>
                </div>
            </div>
            <div style="background: #F4F7FE; padding: 1rem; border-radius: 12px; margin-top: 2rem;">
                <div style="font-weight: 700; color: var(--primary-color); font-size: 0.9rem;">Latest Update</div>
                <div style="font-size: 0.85rem; color: #565959; margin-top: 4px;">Your package has left the distribution center and is on its way to your location.</div>
            </div>
        `;
        this.openActionModal('Track Package', html);
    },

    requestReturn(orderId) {
        const html = `
            <form class="modal-form" id="returnForm" onsubmit="event.preventDefault(); ShopUI.submitReturn()">
                <label>Reason for Return</label>
                <select required>
                    <option value="">Select a reason</option>
                    <option value="damaged">Item damaged</option>
                    <option value="wrong">Wrong item received</option>
                    <option value="quality">Quality not as expected</option>
                    <option value="other">Other</option>
                </select>
                <label>Additional Comments</label>
                <textarea placeholder="Tell us more about the issue..."></textarea>
                <button type="submit" class="btn btn-primary" style="margin-top: 1rem; justify-content: center;">Submit Return Request</button>
            </form>
        `;
        this.openActionModal('Return Items', html);
    },

    submitReturn() {
        this.closeActionModal();
        ValidationEngine.showNotification("Return request submitted successfully. Our agent will contact you within 24 hours.");
    },

    writeReview(productName) {
        const html = `
            <form class="modal-form" onsubmit="event.preventDefault(); ShopUI.submitReview()">
                <div style="text-align: center; margin-bottom: 1rem;">
                    <div style="font-weight: 700; margin-bottom: 0.5rem;">${productName}</div>
                    <div style="color: #FFB800; font-size: 1.5rem;">★★★★★</div>
                </div>
                <label>Your Review</label>
                <textarea required placeholder="What did you like or dislike about this fertilizer?"></textarea>
                <button type="submit" class="btn btn-primary" style="margin-top: 1rem; justify-content: center;">Submit Review</button>
            </form>
        `;
        this.openActionModal('Write a Review', html);
    },

    submitReview() {
        this.closeActionModal();
        ValidationEngine.showNotification("Thank you for your feedback! Your review has been submitted for moderation.");
    },

    async downloadInvoice(orderId) {
        const orders = await ProductEngine.getUserOrders();
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const date = (order.timestamp && order.timestamp.seconds)
            ? new Date(order.timestamp.seconds * 1000).toLocaleDateString()
            : 'Recent';

        let invoiceText = `NUTRIROOT FERTILIZER SHOP - INVOICE\n`;
        invoiceText += `====================================\n`;
        invoiceText += `Order ID: ${order.paymentId || order.id}\n`;
        invoiceText += `Date: ${date}\n\n`;
        invoiceText += `Items:\n`;
        order.items.forEach(item => {
            invoiceText += `- ${item.name} x ${item.quantity}: ₹${(item.price * item.quantity).toFixed(2)}\n`;
        });
        invoiceText += `\nTOTAL AMOUNT: ₹${order.total.toFixed(2)}\n`;
        invoiceText += `Status: ${order.status || 'Paid'}\n`;
        invoiceText += `====================================\n`;
        invoiceText += `Thank you for shopping with NutriRoot!`;

        const blob = new Blob([invoiceText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NutriRoot_Invoice_${orderId.substring(4)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * View Toggles
     */
    showShop() {
        document.getElementById('shopMainView').classList.remove('view-hidden');
        document.getElementById('ordersView').classList.add('view-hidden');
        document.getElementById('btnBrowse').classList.add('active');
        document.getElementById('btnOrders').classList.remove('active');
    },

    showOrders() {
        document.getElementById('shopMainView').classList.add('view-hidden');
        document.getElementById('ordersView').classList.remove('view-hidden');
        document.getElementById('ordersListView').classList.remove('view-hidden');
        document.getElementById('orderDetailsView').classList.add('view-hidden');
        document.getElementById('btnBrowse').classList.remove('active');
        document.getElementById('btnOrders').classList.add('active');
        this.renderOrderHistory();
    },

    /**
     * Render Order History List (Amazon Style)
     */
    async renderOrderHistory() {
        const container = document.getElementById('orderHistoryGrid');
        if (!container) return;

        container.innerHTML = `<div style="text-align:center; padding: 2rem;"><div class="loader"></div></div>`;

        const orders = await ProductEngine.getUserOrders();

        if (orders.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: #fff; border-radius: 12px; border: 1px solid #F0F2F2;">
                    <p style="color: #565959;">You haven't placed any orders yet.</p>
                    <button class="btn btn-primary" style="margin-top: 1rem;" onclick="ShopUI.showShop()">Start Shopping</button>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => {
            const date = (order.timestamp && order.timestamp.seconds)
                ? new Date(order.timestamp.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Recent Order';

            const arrivalDate = this.getDeliveryEstimate(order.timestamp);

            const firstItem = order.items[0] || { name: 'Fertilizer', image: 'assets/images/tree-logo.png' };
            const otherCount = order.items.length - 1;

            return `
                <div class="order-card" onclick="ShopUI.renderOrderDetail('${order.id}')" style="background: white; border-radius: 12px; border: 1px solid #D5D9D9; margin-bottom: 1.5rem; overflow: hidden; cursor: pointer;">
                    <div style="background: #F0F2F2; padding: 1rem; border-bottom: 1px solid #D5D9D9; display: flex; justify-content: space-between; font-size: 0.85rem; color: #565959;">
                        <div>
                            <div style="text-transform: uppercase; font-size: 0.7rem; margin-bottom: 2px;">Order Placed</div>
                            <div style="color: #0F1111; font-weight: 500;">${date}</div>
                        </div>
                        <div>
                            <div style="text-transform: uppercase; font-size: 0.7rem; margin-bottom: 2px;">Total</div>
                            <div style="color: #0F1111; font-weight: 500;">₹${order.total.toFixed(2)}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="text-transform: uppercase; font-size: 0.7rem; margin-bottom: 2px;">Order # ${order.paymentId ? order.paymentId.substring(4, 15) : 'N/A'}</div>
                            <div style="color: #007185; font-weight: 500;">View order details</div>
                        </div>
                    </div>
                    <div style="padding: 1.25rem; display: flex; gap: 1.5rem; align-items: center;">
                        <img src="${firstItem.image}" style="width: 80px; height: 80px; object-fit: contain;" onerror="this.src='assets/images/tree-logo.png'">
                        <div>
                            <div style="font-weight: 700; color: #0F1111; margin-bottom: 4px;">${firstItem.name}</div>
                            ${otherCount > 0 ? `<div style="font-size: 0.85rem; color: #565959;">+ ${otherCount} other item${otherCount > 1 ? 's' : ''}</div>` : ''}
                            <div style="margin-top: 10px; font-size: 0.9rem; color: #007600; font-weight: 700;">Arriving by ${arrivalDate}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Render Detailed View (Amazon Style)
     */
    async renderOrderDetail(orderId) {
        const orders = await ProductEngine.getUserOrders();
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const detailContainer = document.getElementById('orderDetailsView');
        const listContainer = document.getElementById('ordersListView');

        listContainer.classList.add('view-hidden');
        detailContainer.classList.remove('view-hidden');

        const date = (order.timestamp && order.timestamp.seconds)
            ? new Date(order.timestamp.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Recent';

        const arrivalDate = this.getDeliveryEstimate(order.timestamp);

        detailContainer.innerHTML = `
            <div class="back-btn" onclick="ShopUI.showOrders()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Orders
            </div>

            <div class="order-details-view">
                <!-- Status Banner -->
                <div class="status-banner">
                    <div class="status-check">✓</div>
                    <div>
                        <div class="status-header">Arriving by ${arrivalDate}</div>
                        <div class="status-sub">Your package is on its way.</div>
                    </div>
                </div>

                <!-- Products -->
                <div class="action-section">
                    <div class="action-title">Items ordered</div>
                    ${order.items.map(item => `
                        <div class="order-product-card">
                            <img src="${item.image}" alt="${item.name}" class="order-product-image" onerror="this.src='assets/images/tree-logo.png'">
                            <div class="order-product-info">
                                <div class="order-product-name">${item.name}</div>
                                <div style="font-size: 0.9rem; color: #B12704; font-weight: 700;">₹${item.price.toFixed(2)}</div>
                                <div style="font-size: 0.85rem; color: #565959; margin-top: 4px;">Qty: ${item.quantity}</div>
                                <a href="javascript:void(0)" onclick="ShopUI.shareItem('${item.name}')" class="share-link" style="margin-top: 12px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                                        <polyline points="16 6 12 2 8 6"></polyline>
                                        <line x1="12" y1="2" x2="12" y2="15"></line>
                                    </svg>
                                    Share this item
                                </a>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Help Section -->
                <div class="action-section">
                    <div class="action-title">Need help with your item?</div>
                    <a href="javascript:void(0)" onclick="ShopUI.trackPackage('${order.paymentId}', '${arrivalDate}')" class="action-item">
                        <span>Track Package</span>
                        <span style="color: #007600; font-weight: 700;">Arriving ${arrivalDate}</span>
                    </a>
                    <a href="javascript:void(0)" onclick="ShopUI.requestReturn('${order.id}')" class="action-item">
                        <span>Return items</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </a>
                </div>

                <!-- Feedback Section -->
                <div class="action-section">
                    <div class="action-title">How's your item?</div>
                    <a href="javascript:void(0)" onclick="ShopUI.writeReview('${order.items[0]?.name || 'the product'}')" class="action-item">
                        <span>Write a product review</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </a>
                    <a href="javascript:void(0)" onclick="ShopUI.writeReview('${order.items[0]?.name || 'the product'}')" class="action-item">
                        <span>Create a video review</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </a>
                </div>

                <!-- Order Info -->
                <div class="action-section">
                    <div class="action-title">Order info</div>
                    <a href="javascript:void(0)" onclick="ShopUI.renderOrderDetail('${order.id}')" class="action-item">
                        <span>View order details</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </a>
                    <a href="javascript:void(0)" onclick="ShopUI.downloadInvoice('${order.id}')" class="action-item">
                        <span>Download Invoice</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </a>
                    <div style="padding: 1rem 0; color: #565959; font-size: 0.85rem;">
                        Ordered on ${date}
                    </div>
                </div>
            </div>
        `;
    }
};

// Initialize after DOM load
window.addEventListener('DOMContentLoaded', () => {
    ShopUI.init();
});
