// NutriRoot - Admin Crop Management

// DOM Elements
const cropsTableBody = document.getElementById('cropsTableBody');
const cropSearchInput = document.getElementById('cropSearchInput');
const categoryFilter = document.getElementById('categoryFilter');
const cropModal = document.getElementById('cropModal');
const deleteModal = document.getElementById('deleteModal');
const cropForm = document.getElementById('cropForm');
const modalTitle = document.getElementById('modalTitle');
const deleteCropName = document.getElementById('deleteCropName');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// State
let allCrops = [];
let filteredCrops = [];
let deleteTargetId = null;

/**
 * Initialize Crop Management
 */
function initCropManagement() {
    loadCrops();
}

/**
 * Load crops from Firestore
 */
async function loadCrops() {
    try {
        const snapshot = await db.collection('crops').get();
        allCrops = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Update stats
        updateStats();

        applyFilters();
    } catch (error) {
        console.error('Error loading crops:', error);
        showNotification('Error loading crops database', 'error');
    }
}

/**
 * Update statistics cards
 */
function updateStats() {
    document.getElementById('statTotalCrops').textContent = allCrops.length;

    const categories = new Set(allCrops.map(c => c.category).filter(Boolean));
    document.getElementById('statCategories').textContent = categories.size;
}

/**
 * Render crops table
 */
function renderCropsTable() {
    cropsTableBody.innerHTML = '';

    if (filteredCrops.length === 0) {
        cropsTableBody.innerHTML = '<tr><td colspan="9" class="empty-state">No crops found matching your criteria.</td></tr>';
        return;
    }

    filteredCrops.forEach(crop => {
        const tr = document.createElement('tr');

        // Handle legacy data vs new structure
        const soil = crop.soilRequirements || {
            ph: [crop.ph_min || 0, crop.ph_max || 14],
            nitrogen: [crop.n_min || crop.n_val || 0, crop.n_max || crop.n_val || 100],
            phosphorus: [crop.p_min || crop.p_val || 0, crop.p_max || crop.p_val || 100],
            potassium: [crop.k_min || crop.k_val || 0, crop.k_max || crop.k_val || 100],
            moisture: [crop.moisture_min || 0, crop.moisture_max || 100],
            temperature: [crop.temperature_min || 0, crop.temperature_max || 50]
        };

        tr.innerHTML = `
            <td><strong>${crop.name}</strong></td>
            <td><span class="badge ${crop.category || 'other'}">${crop.category || 'other'}</span></td>
            <td>${soil.ph[0]} - ${soil.ph[1]}</td>
            <td class="nutrient-cell">
                <span class="nutrient-tag n">${soil.nitrogen[0]} - ${soil.nitrogen[1]}</span>
            </td>
            <td class="nutrient-cell">
                <span class="nutrient-tag p">${soil.phosphorus[0]} - ${soil.phosphorus[1]}</span>
            </td>
            <td class="nutrient-cell">
                <span class="nutrient-tag k">${soil.potassium[0]} - ${soil.potassium[1]}</span>
            </td>
            <td>${soil.moisture[0]}% - ${soil.moisture[1]}%</td>
            <td>${soil.temperature[0]}°C - ${soil.temperature[1]}°C</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon" onclick="openEditCropModal('${crop.id}')" title="Edit Crop">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon danger" onclick="openDeleteCropModal('${crop.id}', '${crop.name}')" title="Delete Crop">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        cropsTableBody.appendChild(tr);
    });
}

/**
 * Handle Search
 */
function handleCropSearch() {
    applyFilters();
}

/**
 * Handle Filter
 */
function handleCropFilter() {
    applyFilters();
}

/**
 * Apply all filters together
 */
function applyFilters() {
    const searchTerm = cropSearchInput.value.toLowerCase();
    const category = categoryFilter.value;

    filteredCrops = allCrops.filter(crop => {
        const matchesSearch = crop.name.toLowerCase().includes(searchTerm);
        const matchesCategory = category === 'all' || crop.category === category;
        return matchesSearch && matchesCategory;
    });

    renderCropsTable();
}

/**
 * Modals
 */
function openAddCropModal() {
    modalTitle.textContent = 'Add New Crop';
    cropForm.reset();
    document.getElementById('editCropId').value = '';
    cropModal.classList.add('active');
}

function openEditCropModal(id) {
    const crop = allCrops.find(c => c.id === id);
    if (!crop) return;

    modalTitle.textContent = 'Edit Crop: ' + crop.name;
    document.getElementById('editCropId').value = crop.id;
    document.getElementById('cropName').value = crop.name;
    document.getElementById('cropCategory').value = crop.category || 'other';

    // Support legacy data vs new structure
    const soil = crop.soilRequirements || {
        ph: [crop.ph_min || 0, crop.ph_max || 14],
        nitrogen: [crop.n_min || crop.n_val || 0, crop.n_max || crop.n_val || 100],
        phosphorus: [crop.p_min || crop.p_val || 0, crop.p_max || crop.p_val || 100],
        potassium: [crop.k_min || crop.k_val || 0, crop.k_max || crop.k_val || 100],
        moisture: [crop.moisture_min || 0, crop.moisture_max || 100],
        temperature: [crop.temperature_min || 0, crop.temperature_max || 50]
    };

    document.getElementById('phMin').value = soil.ph[0];
    document.getElementById('phMax').value = soil.ph[1];

    document.getElementById('nMin').value = soil.nitrogen[0];
    document.getElementById('nMax').value = soil.nitrogen[1];

    document.getElementById('pMin').value = soil.phosphorus[0];
    document.getElementById('pMax').value = soil.phosphorus[1];

    document.getElementById('kMin').value = soil.potassium[0];
    document.getElementById('kMax').value = soil.potassium[1];

    document.getElementById('moistureMin').value = soil.moisture[0];
    document.getElementById('moistureMax').value = soil.moisture[1];

    document.getElementById('tempMin').value = soil.temperature[0];
    document.getElementById('tempMax').value = soil.temperature[1];

    cropModal.classList.add('active');
}

function closeCropModal() {
    cropModal.classList.remove('active');
}

/**
 * Save Crop
 */
async function handleCropFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('editCropId').value;
    const cropNameVal = document.getElementById('cropName').value;

    const soilRequirements = {
        ph: [parseFloat(document.getElementById('phMin').value), parseFloat(document.getElementById('phMax').value)],
        nitrogen: [parseFloat(document.getElementById('nMin').value), parseFloat(document.getElementById('nMax').value)],
        phosphorus: [parseFloat(document.getElementById('pMin').value), parseFloat(document.getElementById('pMax').value)],
        potassium: [parseFloat(document.getElementById('kMin').value), parseFloat(document.getElementById('kMax').value)],
        moisture: [parseFloat(document.getElementById('moistureMin').value), parseFloat(document.getElementById('moistureMax').value)],
        temperature: [parseFloat(document.getElementById('tempMin').value), parseFloat(document.getElementById('tempMax').value)]
    };

    const cropData = {
        name: cropNameVal,
        category: document.getElementById('cropCategory').value,
        soilRequirements: soilRequirements,
        // Legacy flat structure for backwards compatibility if needed
        ph_min: soilRequirements.ph[0],
        ph_max: soilRequirements.ph[1],
        n_min: soilRequirements.nitrogen[0],
        n_max: soilRequirements.nitrogen[1],
        p_min: soilRequirements.phosphorus[0],
        p_max: soilRequirements.phosphorus[1],
        k_min: soilRequirements.potassium[0],
        k_max: soilRequirements.potassium[1],
        moisture_min: soilRequirements.moisture[0],
        moisture_max: soilRequirements.moisture[1],
        temperature_min: soilRequirements.temperature[0],
        temperature_max: soilRequirements.temperature[1],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (id) {
            await db.collection('crops').doc(id).update(cropData);
            showNotification('Crop Updated', `${cropNameVal} has been updated successfully.`, 'success');
        } else {
            cropData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            cropData.description = `Optimal growing conditions for ${cropNameVal}.`; // Default if new
            await db.collection('crops').add(cropData);
            showNotification('Crop Added', `${cropNameVal} has been added to the database.`, 'success');
        }
        closeCropModal();
        loadCrops();
    } catch (error) {
        console.error('Error saving crop:', error);
        showNotification('Error', 'Failed to save crop changes.', 'error');
    }
}

/**
 * Delete Crop
 */
function openDeleteCropModal(id, name) {
    deleteTargetId = id;
    deleteCropName.textContent = name;
    deleteModal.classList.add('active');
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    deleteTargetId = null;
}

confirmDeleteBtn.onclick = async () => {
    if (!deleteTargetId) return;

    try {
        const cropName = deleteCropName.textContent;
        await db.collection('crops').doc(deleteTargetId).delete();
        showNotification('Crop Deleted', `${cropName} has been removed from the database.`, 'success');
        closeDeleteModal();
        loadCrops();
    } catch (error) {
        console.error('Error deleting crop:', error);
        showNotification('Error', 'Failed to delete the crop.', 'error');
    }
};

/**
 * UI Helpers - Aesthetic Toast Notifications
 */
function showNotification(title, message, type = 'info') {
    // Create container if it doesn't exist
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>',
        error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
        info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
    `;

    container.appendChild(toast);

    // Auto remove
    const timer = setTimeout(() => {
        removeToast(toast);
    }, 5000);

    // Close button
    toast.querySelector('.toast-close').onclick = () => {
        clearTimeout(timer);
        removeToast(toast);
    };
}

function removeToast(toast) {
    toast.classList.add('removing');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

// Global functions for HTML access
window.openAddCropModal = openAddCropModal;
window.openEditCropModal = openEditCropModal;
window.closeCropModal = closeCropModal;
window.handleCropSearch = handleCropSearch;
window.handleCropFilter = handleCropFilter;
window.handleCropFormSubmit = handleCropFormSubmit;
window.openDeleteCropModal = openDeleteCropModal;
window.closeDeleteModal = closeDeleteModal;

// Initialize when Firebase is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure auth and db are ready
    setTimeout(initCropManagement, 1000);
});
