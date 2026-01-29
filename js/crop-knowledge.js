// Crop Reference JavaScript
// Fetches data from Firebase Firestore

// Global cache object - kept global for compatibility
let cropData = {};

// Function to fetch data from Firestore
async function loadCropData() {
    // If we already have data, don't fetch again
    if (Object.keys(cropData).length > 0) {
        return cropData;
    }

    console.log("Fetching crop data from Firestore...");

    // Add a loading indicator to the grid
    const grid = document.getElementById('cropsGrid');
    if (grid) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;"><div class="loader-spinner"></div><p style="margin-top: 1rem; color: var(--secondary-color);">Loading crop library...</p></div>';
    }

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('crops').get();

            const newCropData = {};
            snapshot.forEach(doc => {
                newCropData[doc.id] = doc.data();
            });

            cropData = newCropData;
            console.log(`Loaded ${Object.keys(cropData).length} crops from database.`);
            return cropData;
        } catch (error) {
            attempts++;
            console.error(`Attempt ${attempts} failed to load crops:`, error);

            if (attempts >= maxAttempts) {
                if (grid) {
                    grid.innerHTML = `
                        <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                            <h3 style="color: var(--primary-color);">Failed to load crop data</h3>
                            <p style="color: var(--secondary-color); margin-bottom: 1.5rem;">${error.message || 'The database connection could not be established.'}</p>
                            <button class="btn btn-primary" onclick="location.reload()">Retry Connection</button>
                        </div>
                    `;
                }
                return {};
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
    }
}

