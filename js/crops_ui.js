/**
 * NutriRoot Crops Page UI Handler
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Crops UI Initializing...');

    const cropsForm = document.getElementById('cropsSoilForm');
    if (cropsForm) {
        cropsForm.addEventListener('submit', handleCropsSubmit);
    }
});

/**
 * Handle form submission
 */
async function handleCropsSubmit(e) {
    e.preventDefault();

    // Show loading state
    const container = document.getElementById('cropSuggestionsContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 4rem;">
            <div class="loader-spinner"></div>
            <p style="margin-top: 1.5rem; color: var(--secondary-color);">Finding the best crops for your soil...</p>
        </div>
    `;

    const soilData = {
        nitrogen: parseFloat(document.getElementById('crops_nitrogen').value),
        phosphorus: parseFloat(document.getElementById('crops_phosphorus').value),
        potassium: parseFloat(document.getElementById('crops_potassium').value),
        ph: parseFloat(document.getElementById('crops_ph').value),
        moisture: parseFloat(document.getElementById('crops_moisture').value),
        temperature: parseFloat(document.getElementById('crops_temperature').value)
    };

    // Save to history (optional but good for consistency)
    if (typeof saveSoilData === 'function') {
        await saveSoilData({ ...soilData, crop: 'Recommendation' });
    } else {
        localStorage.setItem('nutriroot_latest_soil_data', JSON.stringify(soilData));
    }

    await renderSuggestions(soilData);
}

/**
 * Fetch and render suggestions
 */
async function renderSuggestions(soilData) {
    const container = document.getElementById('cropSuggestionsContainer');
    const suggestions = await SuggestionEngine.getSuggestions(soilData);

    if (!suggestions || suggestions.length === 0) {
        container.innerHTML = `<p style="text-align: center; padding: 2rem;">No matching crops found. Try adjusting your inputs.</p>`;
        return;
    }

    let html = `
        <div style="margin-top: 3rem; margin-bottom: 2rem;">
            <h2 class="section-title">Top Recommended Crops</h2>
            <p style="color: var(--secondary-color);">Based on your soil data: N:${soilData.nitrogen}, P:${soilData.phosphorus}, K:${soilData.potassium}, pH:${soilData.ph}</p>
        </div>
        <div class="crops-grid-fresh" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
    `;

    // Show top 6 matches
    suggestions.slice(0, 9).forEach(crop => {
        const matchColor = crop.matchLevel === 'Excellent' ? '#05CD99' :
            crop.matchLevel === 'Good' ? '#F4F7FE' :
                crop.matchLevel === 'Fair' ? '#FFAC33' : '#E31A1A';

        const badgeBg = crop.matchLevel === 'Excellent' ? 'rgba(5, 205, 153, 0.1)' : 'rgba(112, 126, 174, 0.1)';
        const badgeText = crop.matchLevel === 'Excellent' ? '#05CD99' : '#707EAE';

        html += `
            <div class="crop-match-card" style="background: white; border-radius: 24px; padding: 1.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #E0E5F2; transition: transform 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
                    <div style="width: 60px; height: 60px; border-radius: 16px; overflow: hidden; background: #F4F7FE;">
                        <img src="${crop.image}" alt="${crop.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/images/placeholder.png'">
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; font-size: 1.5rem; font-weight: 800; color: var(--primary-color);">${crop.matchScore}%</span>
                        <span style="font-size: 0.75rem; color: var(--secondary-color); font-weight: 700; text-transform: uppercase;">Match</span>
                    </div>
                </div>

                <h3 style="font-weight: 700; color: var(--primary-color); font-size: 1.25rem; margin-bottom: 0.5rem;">${crop.name}</h3>
                <p style="font-size: 0.85rem; color: #52665A; line-height: 1.5; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${crop.description}
                </p>

                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem;">
                    ${crop.matchReasons.map(reason => `
                        <span style="background: ${badgeBg}; color: ${badgeText}; padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 600;">
                            ${reason}
                        </span>
                    `).join('')}
                </div>

                <div style="border-top: 1px solid #F4F7FE; padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 0.75rem; color: var(--secondary-color);">
                        <span style="display: block; font-weight: 700;">Duration</span>
                        <span>${crop.duration || 'Short Term'}</span>
                    </div>
                    <a href="crop-knowledge.html" class="btn btn-sm" style="padding: 0.5rem 1rem; font-size: 0.8rem; border-radius: 10px; background: var(--primary-color); color: white; text-decoration: none;">View Guide</a>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;

    // Scroll to results
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
