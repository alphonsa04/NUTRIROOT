/**
 * NutriRoot Crop Suggestion Engine
 * Handles fetching crops from Firestore and calculating suitability scores.
 */

const SuggestionEngine = {
    // Cache for crop data
    cropsCache: null,

    /**
     * Fetch all crop data from Firestore
     */
    async fetchCrops() {
        if (this.cropsCache) return this.cropsCache;

        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('crops').get();
            const crops = {};
            snapshot.forEach(doc => {
                crops[doc.id] = { id: doc.id, ...doc.data() };
            });
            this.cropsCache = crops;
            console.log(`SuggestionEngine: Loaded ${Object.keys(crops).length} crops from Firestore.`);
            return crops;
        } catch (error) {
            console.error("SuggestionEngine: Error fetching crops:", error);
            return null;
        }
    },

    /**
     * Calculate suitability score (0-100) for a crop based on soil data
     */
    calculateScore(crop, soilData) {
        if (!crop.soilRequirements) return 0;

        const req = crop.soilRequirements;
        let score = 100;
        let reasons = [];

        // 1. pH Score (25% weight)
        const pha = req.ph; // [min, max]
        if (soilData.ph < pha[0]) {
            const diff = pha[0] - soilData.ph;
            const penalty = Math.min(diff * 15, 25);
            score -= penalty;
            if (penalty > 5) reasons.push("pH is slightly low");
        } else if (soilData.ph > pha[1]) {
            const diff = soilData.ph - pha[1];
            const penalty = Math.min(diff * 15, 25);
            score -= penalty;
            if (penalty > 5) reasons.push("pH is slightly high");
        } else {
            reasons.push("Perfect pH match");
        }

        // 2. NPK Score (45% weight - 15% each)
        const nutrients = [
            { id: 'nitrogen', key: 'n', label: 'Nitrogen' },
            { id: 'phosphorus', key: 'p', label: 'Phosphorus' },
            { id: 'potassium', key: 'k', label: 'Potassium' }
        ];

        nutrients.forEach(nut => {
            const val = soilData[nut.id];
            const range = req[nut.id]; // [min, max]

            if (val < range[0]) {
                const diffPercent = (range[0] - val) / range[0];
                const penalty = Math.min(diffPercent * 15, 15);
                score -= penalty;
                if (penalty > 3) reasons.push(`${nut.label} is too low`);
            } else if (val > range[1]) {
                const diffPercent = (val - range[1]) / range[1];
                const penalty = Math.min(diffPercent * 10, 10); // Over-fertilization is slightly less penalizing than deficiency usually
                score -= penalty;
                if (penalty > 3) reasons.push(`${nut.label} is higher than needed`);
            } else {
                reasons.push(`${nut.label} is optimal`);
            }
        });

        // 3. Moisture Score (15% weight)
        const moist = req.moisture;
        if (soilData.moisture < moist[0]) {
            const diff = (moist[0] - soilData.moisture) / moist[0];
            const penalty = Math.min(diff * 15, 15);
            score -= penalty;
            if (penalty > 3) reasons.push("Soil is too dry");
        } else if (soilData.moisture > moist[1]) {
            const diff = (soilData.moisture - moist[1]) / moist[1];
            const penalty = Math.min(diff * 15, 15);
            score -= penalty;
            if (penalty > 3) reasons.push("Soil is too wet");
        } else {
            reasons.push("Moisture level is ideal");
        }

        // 4. Temperature Score (15% weight)
        const temp = req.temperature;
        if (soilData.temperature < temp[0]) {
            const diff = temp[0] - soilData.temperature;
            const penalty = Math.min(diff * 2, 15);
            score -= penalty;
            if (penalty > 3) reasons.push("Temperature is too low");
        } else if (soilData.temperature > temp[1]) {
            const diff = soilData.temperature - temp[1];
            const penalty = Math.min(diff * 2, 15);
            score -= penalty;
            if (penalty > 3) reasons.push("Temperature is too high");
        } else {
            reasons.push("Temperature is optimal");
        }

        return {
            score: Math.max(0, Math.round(score)),
            reasons: reasons.slice(0, 3) // Return top 3 reasons
        };
    },

    /**
     * Get suggestions for given soil data
     */
    async getSuggestions(soilData) {
        const crops = await this.fetchCrops();
        if (!crops) return [];

        const results = Object.values(crops).map(crop => {
            const analysis = this.calculateScore(crop, soilData);
            return {
                ...crop,
                matchScore: analysis.score,
                matchReasons: analysis.reasons,
                matchLevel: analysis.score >= 85 ? 'Excellent' : analysis.score >= 70 ? 'Good' : analysis.score >= 50 ? 'Fair' : 'Low'
            };
        });

        // Sort by score descending
        return results.sort((a, b) => b.matchScore - a.matchScore);
    }
};
