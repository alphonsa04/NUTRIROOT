/**
 * NutriRoot - Product Initialization Script
 * Seeds the Firestore 'products' collection with initial fertilizer data.
 * Run this once via console or include temporarily in index.html to populate DB.
 */

const predefinedProducts = [
    // --- NITROGEN FERTILIZERS ---
    {
        id: "urea_46",
        name: "Urea (46-0-0)",
        category: "Nitrogen Fertilizers",
        nitrogen_percent: 46,
        phosphorus_percent: 0,
        potassium_percent: 0,
        price: 266.50,
        stock_quantity: 500,
        description: "High-concentration nitrogen fertilizer promoting rapid vegetative growth. Key for cereals and leafy crops.",
        image_url: "assets/images/products/urea.png",
        is_recommended: false
    },
    {
        id: "ammonium_sulphate",
        name: "Ammonium Sulphate (21-0-0)",
        category: "Nitrogen Fertilizers",
        nitrogen_percent: 21,
        phosphorus_percent: 0,
        potassium_percent: 0,
        price: 850.00,
        stock_quantity: 200,
        description: "Provides Nitrogen and Sulfur. Ideal for alkaline soils as it helps lower pH.",
        image_url: "assets/images/products/amsul.png",
        is_recommended: false
    },

    // --- PHOSPHATIC FERTILIZERS ---
    {
        id: "dap_18_46",
        name: "DAP - Diammonium Phosphate (18-46-0)",
        category: "Phosphatic Fertilizers",
        nitrogen_percent: 18,
        phosphorus_percent: 46,
        potassium_percent: 0,
        price: 1350.00,
        stock_quantity: 300,
        description: "Excellent for root development and crop establishment. Contains high Phosphorus.",
        image_url: "assets/images/products/dap.png",
        is_recommended: false
    },
    {
        id: "ssp_16",
        name: "SSP - Single Super Phosphate (0-16-0)",
        category: "Phosphatic Fertilizers",
        nitrogen_percent: 0,
        phosphorus_percent: 16,
        potassium_percent: 0,
        price: 450.00,
        stock_quantity: 400,
        description: "Cost-effective Phosphorus source with Calcium and Sulfur. Good for oilseeds.",
        image_url: "assets/images/products/ssp.png",
        is_recommended: false
    },

    // --- POTASSIC FERTILIZERS ---
    {
        id: "mop_60",
        name: "MOP - Muriate of Potash (0-0-60)",
        category: "Potassic Fertilizers",
        nitrogen_percent: 0,
        phosphorus_percent: 0,
        potassium_percent: 60,
        price: 1700.00,
        stock_quantity: 250,
        description: "High Potassium content for disease resistance, better quality, and yield.",
        image_url: "assets/images/products/mop.png",
        is_recommended: false
    },

    // --- COMPLEX NPK FERTILIZERS ---
    {
        id: "npk_20_20_20",
        name: "NPK 20-20-20",
        category: "Complex NPK Fertilizers",
        nitrogen_percent: 20,
        phosphorus_percent: 20,
        potassium_percent: 20,
        price: 220.00,
        stock_quantity: 150,
        description: "Balanced fertilizer for general growth maintenance and correction of all major deficiencies.",
        image_url: "assets/images/products/npk20.png",
        is_recommended: false
    },
    {
        id: "npk_10_26_26",
        name: "NPK 10-26-26",
        category: "Complex NPK Fertilizers",
        nitrogen_percent: 10,
        phosphorus_percent: 26,
        potassium_percent: 26,
        price: 1400.00,
        stock_quantity: 100,
        description: "High P and K content, suitable for fruit and vegetable crops.",
        image_url: "assets/images/products/npk102626.png",
        is_recommended: false
    },
    {
        id: "npk_12_32_16",
        name: "NPK 12-32-16",
        category: "Complex NPK Fertilizers",
        nitrogen_percent: 12,
        phosphorus_percent: 32,
        potassium_percent: 16,
        price: 1450.00,
        stock_quantity: 120,
        description: "Phosphorus-rich complex fertilizer for basal application.",
        image_url: "assets/images/products/npk123216.png",
        is_recommended: false
    },
    {
        id: "npk_17_17_17",
        name: "NPK 17-17-17",
        category: "Complex NPK Fertilizers",
        nitrogen_percent: 17,
        phosphorus_percent: 17,
        potassium_percent: 17,
        price: 1300.00,
        stock_quantity: 180,
        description: "Balanced nutrient source for sustained crop growth.",
        image_url: "assets/images/products/npk17.png",
        is_recommended: false
    },
    {
        id: "npk_19_19_19",
        name: "NPK 19-19-19 (Water Soluble)",
        category: "Complex NPK Fertilizers",
        nitrogen_percent: 19,
        phosphorus_percent: 19,
        potassium_percent: 19,
        price: 180.00,
        stock_quantity: 300,
        description: "100% Water soluble balanced fertilizer for foliar spray.",
        image_url: "assets/images/products/npk19.png",
        is_recommended: false
    },

    // --- ORGANIC FERTILIZERS ---
    {
        id: "vermicompost",
        name: "Premium Vermicompost",
        category: "Organic Fertilizers",
        nitrogen_percent: 1.5,
        phosphorus_percent: 0.5,
        potassium_percent: 0.5,
        price: 250.00,
        stock_quantity: 1000,
        description: "Enriched organic manure to improve soil health and microbial activity.",
        image_url: "assets/images/products/vermicompost.png",
        is_recommended: false
    },
    {
        id: "neem_cake",
        name: "Neem Cake",
        category: "Organic Fertilizers",
        nitrogen_percent: 2,
        phosphorus_percent: 1,
        potassium_percent: 1,
        price: 950.00,
        stock_quantity: 400,
        description: "Natural pesticide and soil conditioner. Helps reduce soil-borne pests.",
        image_url: "assets/images/products/neem_cake.png",
        is_recommended: false
    },

    // --- SOIL CONDITIONERS ---
    {
        id: "zinc_sulphate",
        name: "Zinc Sulphate",
        category: "Soil Conditioners",
        nitrogen_percent: 0,
        phosphorus_percent: 0,
        potassium_percent: 0,
        price: 180.00,
        stock_quantity: 150,
        description: "Used to correct Zinc deficiency (leaf mottling, khaira disease).",
        image_url: "assets/images/products/zinc.png",
        is_recommended: false
    },
    {
        id: "gypsum",
        name: "Gypsum (Calcium Sulfate)",
        category: "Soil Conditioners",
        nitrogen_percent: 0,
        phosphorus_percent: 0,
        potassium_percent: 0,
        price: 250.00,
        stock_quantity: 300,
        description: "Used to reclaim sodic (alkaline) soils and supply Calcium and Sulfur.",
        image_url: "assets/images/products/gypsum.png",
        is_recommended: false
    }
];

async function seedProducts() {
    const db = firebase.firestore();
    const batch = db.batch();

    console.log("Seeding products...");

    predefinedProducts.forEach(product => {
        const docRef = db.collection('products').doc(product.id);
        batch.set(docRef, product, { merge: true });
    });

    try {
        await batch.commit();
        console.log("Products seeded successfully!");
        return true;
    } catch (error) {
        console.error("Error seeding products:", error);
        return false;
    }
}
