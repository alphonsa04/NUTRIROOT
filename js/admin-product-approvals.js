const AdminProductApprovals = {
    pendingProducts: [],
    selectedProductId: null,

    async init() {
        await this.loadPendingProducts();
    },

    async loadPendingProducts() {
        const tableBody = document.getElementById('pendingProductsBody');
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 3rem;"><div class="loader" style="margin:0 auto;"></div></td></tr>';

        try {
            const snapshot = await db.collection('products')
                .where('status', '==', 'pending')
                .get();

            this.pendingProducts = [];
            tableBody.innerHTML = '';

            if (snapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 3rem; color: #A3AED0;">No pending product requests.</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const p = doc.data();
                const product = { id: doc.id, ...p };
                this.pendingProducts.push(product);

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.8rem;">
                            <img src="${p.image || p.image_url || 'assets/images/products/generic-fertilizer.jpg'}" class="product-img-sm" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;">
                            <span>${p.name}</span>
                        </div>
                    </td>
                    <td>
                        <div style="font-weight: 500;">${p.sellerName || 'Unknown'}</div>
                        <div style="font-size: 0.8rem; color: #A3AED0;">${p.shopName || 'No Shop'}</div>
                    </td>
                    <td>${p.category || 'N/A'}</td>
                    <td>₹${p.price}</td>
                    <td>${p.npk || 'N/A'}</td>
                    <td>
                        <button class="btn btn-outline btn-sm" onclick="AdminProductApprovals.openModal('${doc.id}')">Review</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error loading pending products:', error);
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 3rem; color: var(--accent-red);">Error loading data.</td></tr>';
        }
    },

    openModal(id) {
        const p = this.pendingProducts.find(item => item.id === id);
        if (!p) return;

        this.selectedProductId = id;
        // Keep static heading "Product Details" from HTML, or set it here:
        document.getElementById('modalProductName').textContent = 'Product Review';

        const body = document.getElementById('modalBody');
        body.innerHTML = `
            <div style="margin-bottom: 1.5rem; border-bottom: 1px solid #F4F7FE; padding-bottom: 1rem;">
                <h2 style="margin: 0; color: #2B3674; font-size: 1.4rem;">${p.name}</h2>
                <div style="font-size: 0.85rem; color: #707EAE; margin-top: 4px;">Posted by ${p.sellerName} • ${p.shopName || 'Marketplace Vendor'}</div>
            </div>
            <div style="display: grid; grid-template-columns: 200px 1fr; gap: 2rem; margin-bottom: 1.5rem;">
                <div style="text-align: center;">
                    <img src="${p.image || p.image_url || 'assets/images/products/generic-fertilizer.jpg'}" 
                         style="width: 100%; height: auto; border-radius: 12px; object-fit: cover; border: 1px solid #E0E5F2; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div style="margin-top: 1rem; padding: 0.5rem; background: #F4F7FE; border-radius: 8px;">
                        <span style="font-size: 0.75rem; color: #707EAE; display: block; margin-bottom: 2px;">STOCK LEVEL</span>
                        <span style="font-weight: 700; color: #2B3674; font-size: 1rem;">${p.stock || 0} Units</span>
                    </div>
                </div>
                <div>
                    <div style="margin-bottom: 1.5rem;">
                        <span style="font-size: 0.75rem; font-weight: 700; color: #A3AED0; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.5rem;">Category</span>
                        <div style="display: inline-block; padding: 4px 12px; background: #E9EDF7; color: #2B3674; border-radius: 20px; font-weight: 600; font-size: 0.85rem;">
                            ${p.category}
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                        <div>
                            <span style="font-size: 0.75rem; font-weight: 700; color: #A3AED0; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.25rem;">Market Price</span>
                            <div style="font-weight: 700; font-size: 1.25rem; color: #05CD99;">₹${p.price}</div>
                        </div>
                        <div>
                            <span style="font-size: 0.75rem; font-weight: 700; color: #A3AED0; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.25rem;">NPK Formula</span>
                            <div style="font-weight: 700; font-size: 1.25rem; color: #4318FF;">${p.npk || 'N/A'}</div>
                        </div>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <span style="font-size: 0.75rem; font-weight: 700; color: #A3AED0; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.5rem;">Description</span>
                        <p style="font-size: 0.9rem; line-height: 1.6; color: #4A5568; margin: 0;">${p.description || 'No detailed description provided.'}</p>
                    </div>
                </div>
            </div>
            
            <div style="background: #FAFBFF; padding: 1.25rem; border-radius: 12px; border: 1px solid #E0E5F2;">
                <span style="font-size: 0.75rem; font-weight: 700; color: #A3AED0; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 1rem;">Seller Information</span>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 45px; height: 45px; background: #4318FF; color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem;">
                        ${(p.sellerName || 'U').charAt(0)}
                    </div>
                    <div>
                        <div style="font-weight: 700; color: #2B3674;">${p.sellerName}</div>
                        <div style="font-size: 0.85rem; color: #707EAE;">${p.shopName || 'Registered Vendor'}</div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('productDetailOverlay').classList.add('active');
    },

    closeModal() {
        document.getElementById('productDetailOverlay').classList.remove('active');
    },

    async handleAction(status) {
        if (!this.selectedProductId) return;

        try {
            await db.collection('products').doc(this.selectedProductId).update({
                status: status,
                reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            ValidationEngine.showNotification(
                status === 'approved' ? 'Product approved and listed!' : 'Product request rejected.',
                'success'
            );

            this.closeModal();
            this.loadPendingProducts();
        } catch (error) {
            console.error('Error updating product status:', error);
            ValidationEngine.showNotification('Failed to update product status.', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => AdminProductApprovals.init());
