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
    try {
        const db = firebase.firestore();
        const snapshot = await db.collection('crops').get();

        snapshot.forEach(doc => {
            // Populate the global object
            cropData[doc.id] = doc.data();
        });

        console.log(`Loaded ${Object.keys(cropData).length} crops from database.`);
        return cropData;
    } catch (error) {
        console.error("Error loading crops from database:", error);
        return {};
    }
}
