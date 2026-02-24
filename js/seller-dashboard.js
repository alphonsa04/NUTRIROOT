const SellerDashboard = {
    currentTab: 'overview',
    currentUser: null,
    shopData: null,

    init() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                const doc = await db.collection('users').doc(user.uid).get();
                if (doc.exists && doc.data().role === 'seller') {
                    this.shopData = doc.data();
                    this.updateUI();
                    this.loadProducts();
                    this.loadOrders();

                    // Temporary auto-approval for Jewel Treasa
                    if (this.shopData.name === 'Jewel Treasa Raphel') {
                        this.autoApproveJewelProducts();
                    }
                }
            }
        });
    },

    async autoApproveJewelProducts() {
        console.log("NutriRoot: Running temporary auto-approval...");
        const snapshot = await db.collection('products')
            .where('sellerId', '==', this.currentUser.uid)
            .get();

        const batch = db.batch();
        let count = 0;
        snapshot.forEach(doc => {
            if (doc.data().status !== 'approved') {
                batch.update(doc.ref, {
                    status: 'approved',
                    approvedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                count++;
            }
        });

        if (count > 0) {
            try {
                await batch.commit();
                console.log(`NutriRoot: Successfully approved ${count} products.`);
                this.loadProducts();
            } catch (error) {
                console.error("NutriRoot: Auto-approval failed:", error);
            }
        }
    },

    updateUI() {
        // Core profile info is now handled globally by auth.js
        // We only add seller-specific updates if needed beyond what auth.js does
        console.log('SellerDashboard: UI update triggered.');
    },

    switchTab(tabId) {
        this.currentTab = tabId;
        const tabs = ['overview', 'products', 'orders'];
        tabs.forEach(t => {
            document.getElementById(t + 'Tab').style.display = t === tabId ? 'block' : 'none';
        });

        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
            if (item.textContent.toLowerCase().includes(tabId)) {
                item.classList.add('active');
            }
        });
    },

    async loadProducts() {
        const snapshot = await db.collection('products')
            .where('sellerId', '==', this.currentUser.uid)
            .get();

        const tableBody = document.getElementById('myProductsTableBody');
        tableBody.innerHTML = '';

        let count = 0;
        snapshot.forEach(doc => {
            const p = doc.data();
            count++;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <img src="${p.image || p.image_url || 'assets/images/products/generic-fertilizer.jpg'}" class="product-img-sm">
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</span>
                    </div>
                </td>
                <td>${p.category || 'N/A'}</td>
                <td>₹${p.price}</td>
                <td>${p.stock || 0}</td>
                <td style="font-family: monospace;">${p.npk || '0-0-0'}</td>
                <td style="text-align: center;">
                    <span class="status-badge ${p.status || 'pending'}">
                        ${(p.status || 'pending').toUpperCase()}
                    </span>
                </td>
                <td style="text-align: right;">
                    <div class="action-btns">
                        <button class="btn btn-outline btn-sm" onclick="SellerDashboard.openEditModal('${doc.id}')">Edit</button>
                        <button class="btn btn-outline btn-sm danger" style="color: #EE5D50; border-color: #EE5D50;" onclick="SellerDashboard.deleteProduct('${doc.id}')">Delete</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        document.getElementById('statProducts').textContent = count;
    },

    async loadOrders() {
        // In a real app, orders would have item.sellerId
        // For now, we fetch all orders and filter locally or query by items mapping
        // Simplification: assume orders collection has a sellerIds array or we search items
        const snapshot = await db.collection('orders').get();
        let sellerOrders = [];
        let totalRevenue = 0;

        snapshot.forEach(doc => {
            const order = doc.data();
            const myItems = order.items.filter(item => item.sellerId === this.currentUser.uid);
            if (myItems.length > 0) {
                const revenue = myItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                sellerOrders.push({ ...order, id: doc.id, myRevenue: revenue });
                totalRevenue += revenue;
            }
        });

        document.getElementById('statOrders').textContent = sellerOrders.length;
        document.getElementById('statRevenue').textContent = `₹${totalRevenue.toLocaleString()}`;

        this.renderOrders(sellerOrders);
    },

    renderOrders(orders) {
        const recentList = document.getElementById('recentOrdersList');
        const allList = document.getElementById('allOrdersList');

        if (orders.length === 0) {
            recentList.innerHTML = '<p style="color: #A3AED0; text-align: center; padding: 2rem;">No orders yet.</p>';
            allList.innerHTML = '<p style="color: #A3AED0; text-align: center; padding: 2rem;">No orders found.</p>';
            return;
        }

        const orderHtml = orders.map(o => `
            <div style="padding: 1rem; border-bottom: 1px solid #F4F7FE; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin:0;">Order #${o.id.substring(0, 8)}</h4>
                    <p style="font-size: 0.8rem; color: #A3AED0; margin:0;">${o.timestamp ? o.timestamp.toDate().toLocaleDateString() : 'Just now'}</p>
                </div>
                <div style="text-align: right;">
                    <p style="font-weight: 700; margin:0;">₹${o.myRevenue}</p>
                    <span style="font-size: 0.75rem; background: #E0F9F1; color: #05CD99; padding: 2px 8px; border-radius: 20px;">${o.status}</span>
                </div>
            </div>
        `).join('');

        recentList.innerHTML = orderHtml;
        allList.innerHTML = orderHtml;
    },

    openAddProductModal() {
        document.getElementById('modalTitle').textContent = 'Add New Fertilizer';
        document.getElementById('productForm').reset();
        document.getElementById('editProductId').value = '';

        // Reset image preview
        document.getElementById('pPreview').style.display = 'none';
        document.getElementById('previewPlaceholder').style.display = 'block';
        document.getElementById('pImgBase64').value = '';

        document.getElementById('productModal').classList.add('active');
    },

    async openEditModal(id) {
        const doc = await db.collection('products').doc(id).get();
        if (doc.exists) {
            const p = doc.data();
            document.getElementById('modalTitle').textContent = 'Edit Fertilizer';
            document.getElementById('editProductId').value = id;
            document.getElementById('pName').value = p.name;
            document.getElementById('pCategory').value = p.category;
            document.getElementById('pPrice').value = p.price;
            document.getElementById('pStock').value = p.stock || 0;
            const npk = (p.npk || '0-0-0').split('-');
            document.getElementById('pN').value = npk[0] || 0;
            document.getElementById('pP').value = npk[1] || 0;
            document.getElementById('pK').value = npk[2] || 0;
            document.getElementById('pDesc').value = p.description || '';

            // Handle image preview
            const imgUrl = p.image || p.image_url || 'assets/images/products/generic-fertilizer.jpg';
            const preview = document.getElementById('pPreview');
            const placeholder = document.getElementById('previewPlaceholder');

            preview.src = imgUrl;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
            document.getElementById('pImgBase64').value = p.image || ''; // Keep existing if it's base64

            document.getElementById('productModal').classList.add('active');
        }
    },

    closeModal() {
        document.getElementById('productModal').classList.remove('active');
    },

    async handleProductSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('editProductId').value;
        const productData = {
            name: document.getElementById('pName').value,
            category: document.getElementById('pCategory').value,
            price: parseFloat(document.getElementById('pPrice').value),
            stock: parseInt(document.getElementById('pStock').value),
            npk: `${document.getElementById('pN').value}-${document.getElementById('pP').value}-${document.getElementById('pK').value}`,
            description: document.getElementById('pDesc').value,
            image: document.getElementById('pImgBase64').value || 'assets/images/products/generic-fertilizer.jpg',
            sellerId: this.currentUser.uid,
            sellerName: this.shopData.name,
            shopName: this.shopData.shopName,
            status: id ? (this.allProducts?.find(p => p.id === id)?.status || 'pending') : 'pending',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (id) {
                await db.collection('products').doc(id).update(productData);
                showMessage('Product updated successfully!');
            } else {
                productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('products').add(productData);
                showMessage('Product added successfully!');
            }
            this.closeModal();
            this.loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            ValidationEngine.showNotification('Failed to save product.', 'error');
        }
    },

    async deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            await db.collection('products').doc(id).delete();
            showMessage('Product deleted.');
            this.loadProducts();
        }
    },

    handleImagePreview(input) {
        const preview = document.getElementById('pPreview');
        const placeholder = document.getElementById('previewPlaceholder');
        const base64Input = document.getElementById('pImgBase64');

        if (input.files && input.files[0]) {
            const reader = new FileReader();

            reader.onload = function (e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                placeholder.style.display = 'none';
                base64Input.value = e.target.result;
            };

            reader.readAsDataURL(input.files[0]);
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => SellerDashboard.init());
