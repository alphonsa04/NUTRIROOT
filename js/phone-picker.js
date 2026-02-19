/**
 * phone-picker.js
 * Searchable country code dropdown for the phone input field.
 * Stores result in hidden #phone as +<dialCode><digits> (international format).
 */

const COUNTRIES = [
    { name: "Afghanistan", flag: "🇦🇫", dial: "+93", min: 9, max: 9 },
    { name: "Albania", flag: "🇦🇱", dial: "+355", min: 9, max: 9 },
    { name: "Algeria", flag: "🇩🇿", dial: "+213", min: 9, max: 9 },
    { name: "American Samoa", flag: "🇦🇸", dial: "+1", min: 10, max: 10 },
    { name: "Andorra", flag: "🇦🇩", dial: "+376", min: 6, max: 6 },
    { name: "Angola", flag: "🇦🇴", dial: "+244", min: 9, max: 9 },
    { name: "Argentina", flag: "🇦🇷", dial: "+54", min: 10, max: 11 },
    { name: "Armenia", flag: "🇦🇲", dial: "+374", min: 8, max: 8 },
    { name: "Australia", flag: "🇦🇺", dial: "+61", min: 9, max: 9 },
    { name: "Austria", flag: "🇦🇹", dial: "+43", min: 10, max: 11 },
    { name: "Azerbaijan", flag: "🇦🇿", dial: "+994", min: 9, max: 9 },
    { name: "Bahrain", flag: "🇧🇭", dial: "+973", min: 8, max: 8 },
    { name: "Bangladesh", flag: "🇧🇩", dial: "+880", min: 10, max: 10 },
    { name: "Belarus", flag: "🇧🇾", dial: "+375", min: 9, max: 9 },
    { name: "Belgium", flag: "🇧🇪", dial: "+32", min: 9, max: 9 },
    { name: "Bolivia", flag: "🇧🇴", dial: "+591", min: 8, max: 8 },
    { name: "Bosnia and Herzegovina", flag: "🇧🇦", dial: "+387", min: 8, max: 8 },
    { name: "Brazil", flag: "🇧🇷", dial: "+55", min: 10, max: 11 },
    { name: "Bulgaria", flag: "🇧🇬", dial: "+359", min: 9, max: 9 },
    { name: "Cambodia", flag: "🇰🇭", dial: "+855", min: 8, max: 9 },
    { name: "Cameroon", flag: "🇨🇲", dial: "+237", min: 9, max: 9 },
    { name: "Canada", flag: "🇨🇦", dial: "+1", min: 10, max: 10 },
    { name: "Chile", flag: "🇨🇱", dial: "+56", min: 9, max: 9 },
    { name: "China", flag: "🇨🇳", dial: "+86", min: 11, max: 11 },
    { name: "Colombia", flag: "🇨🇴", dial: "+57", min: 10, max: 10 },
    { name: "Croatia", flag: "🇭🇷", dial: "+385", min: 8, max: 9 },
    { name: "Cuba", flag: "🇨🇺", dial: "+53", min: 8, max: 8 },
    { name: "Cyprus", flag: "🇨🇾", dial: "+357", min: 8, max: 8 },
    { name: "Czech Republic", flag: "🇨🇿", dial: "+420", min: 9, max: 9 },
    { name: "Denmark", flag: "🇩🇰", dial: "+45", min: 8, max: 8 },
    { name: "Ecuador", flag: "🇪🇨", dial: "+593", min: 9, max: 9 },
    { name: "Egypt", flag: "🇪🇬", dial: "+20", min: 10, max: 10 },
    { name: "Ethiopia", flag: "🇪🇹", dial: "+251", min: 9, max: 9 },
    { name: "Finland", flag: "🇫🇮", dial: "+358", min: 9, max: 10 },
    { name: "France", flag: "🇫🇷", dial: "+33", min: 9, max: 9 },
    { name: "Germany", flag: "🇩🇪", dial: "+49", min: 10, max: 11 },
    { name: "Ghana", flag: "🇬🇭", dial: "+233", min: 9, max: 9 },
    { name: "Greece", flag: "🇬🇷", dial: "+30", min: 10, max: 10 },
    { name: "Guatemala", flag: "🇬🇹", dial: "+502", min: 8, max: 8 },
    { name: "Hong Kong", flag: "🇭🇰", dial: "+852", min: 8, max: 8 },
    { name: "Hungary", flag: "🇭🇺", dial: "+36", min: 9, max: 9 },
    { name: "India", flag: "🇮🇳", dial: "+91", min: 10, max: 10 },
    { name: "Indonesia", flag: "🇮🇩", dial: "+62", min: 9, max: 12 },
    { name: "Iran", flag: "🇮🇷", dial: "+98", min: 10, max: 10 },
    { name: "Iraq", flag: "🇮🇶", dial: "+964", min: 10, max: 10 },
    { name: "Ireland", flag: "🇮🇪", dial: "+353", min: 9, max: 9 },
    { name: "Israel", flag: "🇮🇱", dial: "+972", min: 9, max: 9 },
    { name: "Italy", flag: "🇮🇹", dial: "+39", min: 9, max: 10 },
    { name: "Japan", flag: "🇯🇵", dial: "+81", min: 10, max: 10 },
    { name: "Jordan", flag: "🇯🇴", dial: "+962", min: 9, max: 9 },
    { name: "Kazakhstan", flag: "🇰🇿", dial: "+7", min: 10, max: 10 },
    { name: "Kenya", flag: "🇰🇪", dial: "+254", min: 9, max: 9 },
    { name: "Kuwait", flag: "🇰🇼", dial: "+965", min: 8, max: 8 },
    { name: "Lebanon", flag: "🇱🇧", dial: "+961", min: 7, max: 8 },
    { name: "Libya", flag: "🇱🇾", dial: "+218", min: 9, max: 9 },
    { name: "Malaysia", flag: "🇲🇾", dial: "+60", min: 9, max: 10 },
    { name: "Mexico", flag: "🇲🇽", dial: "+52", min: 10, max: 10 },
    { name: "Morocco", flag: "🇲🇦", dial: "+212", min: 9, max: 9 },
    { name: "Myanmar", flag: "🇲🇲", dial: "+95", min: 8, max: 9 },
    { name: "Nepal", flag: "🇳🇵", dial: "+977", min: 10, max: 10 },
    { name: "Netherlands", flag: "🇳🇱", dial: "+31", min: 9, max: 9 },
    { name: "New Zealand", flag: "🇳🇿", dial: "+64", min: 8, max: 9 },
    { name: "Nigeria", flag: "🇳🇬", dial: "+234", min: 10, max: 10 },
    { name: "Norway", flag: "🇳🇴", dial: "+47", min: 8, max: 8 },
    { name: "Oman", flag: "🇴🇲", dial: "+968", min: 8, max: 8 },
    { name: "Pakistan", flag: "🇵🇰", dial: "+92", min: 10, max: 10 },
    { name: "Palestine", flag: "🇵🇸", dial: "+970", min: 9, max: 9 },
    { name: "Peru", flag: "🇵🇪", dial: "+51", min: 9, max: 9 },
    { name: "Philippines", flag: "🇵🇭", dial: "+63", min: 10, max: 10 },
    { name: "Poland", flag: "🇵🇱", dial: "+48", min: 9, max: 9 },
    { name: "Portugal", flag: "🇵🇹", dial: "+351", min: 9, max: 9 },
    { name: "Qatar", flag: "🇶🇦", dial: "+974", min: 8, max: 8 },
    { name: "Romania", flag: "🇷🇴", dial: "+40", min: 9, max: 9 },
    { name: "Russia", flag: "🇷🇺", dial: "+7", min: 10, max: 10 },
    { name: "Saudi Arabia", flag: "🇸🇦", dial: "+966", min: 9, max: 9 },
    { name: "Serbia", flag: "🇷🇸", dial: "+381", min: 8, max: 9 },
    { name: "Singapore", flag: "🇸🇬", dial: "+65", min: 8, max: 8 },
    { name: "South Africa", flag: "🇿🇦", dial: "+27", min: 9, max: 9 },
    { name: "South Korea", flag: "🇰🇷", dial: "+82", min: 9, max: 10 },
    { name: "Spain", flag: "🇪🇸", dial: "+34", min: 9, max: 9 },
    { name: "Sri Lanka", flag: "🇱🇰", dial: "+94", min: 9, max: 9 },
    { name: "Sudan", flag: "🇸🇩", dial: "+249", min: 9, max: 9 },
    { name: "Sweden", flag: "🇸🇪", dial: "+46", min: 9, max: 9 },
    { name: "Switzerland", flag: "🇨🇭", dial: "+41", min: 9, max: 9 },
    { name: "Syria", flag: "🇸🇾", dial: "+963", min: 9, max: 9 },
    { name: "Taiwan", flag: "🇹🇼", dial: "+886", min: 9, max: 9 },
    { name: "Tanzania", flag: "🇹🇿", dial: "+255", min: 9, max: 9 },
    { name: "Thailand", flag: "🇹🇭", dial: "+66", min: 9, max: 9 },
    { name: "Tunisia", flag: "🇹🇳", dial: "+216", min: 8, max: 8 },
    { name: "Turkey", flag: "🇹🇷", dial: "+90", min: 10, max: 10 },
    { name: "Uganda", flag: "🇺🇬", dial: "+256", min: 9, max: 9 },
    { name: "Ukraine", flag: "🇺🇦", dial: "+380", min: 9, max: 9 },
    { name: "United Arab Emirates", flag: "🇦🇪", dial: "+971", min: 9, max: 9 },
    { name: "United Kingdom", flag: "🇬🇧", dial: "+44", min: 10, max: 10 },
    { name: "United States", flag: "🇺🇸", dial: "+1", min: 10, max: 10 },
    { name: "Uruguay", flag: "🇺🇾", dial: "+598", min: 8, max: 8 },
    { name: "Uzbekistan", flag: "🇺🇿", dial: "+998", min: 9, max: 9 },
    { name: "Venezuela", flag: "🇻🇪", dial: "+58", min: 10, max: 10 },
    { name: "Vietnam", flag: "🇻🇳", dial: "+84", min: 9, max: 10 },
    { name: "Yemen", flag: "🇾🇪", dial: "+967", min: 9, max: 9 },
    { name: "Zimbabwe", flag: "🇿🇼", dial: "+263", min: 9, max: 9 },
];

// Default: India
let selectedCountry = COUNTRIES.find(c => c.name === "India");

function initPhonePicker() {
    const trigger = document.getElementById('countryTrigger');
    const dropdown = document.getElementById('countryDropdown');
    const searchInput = document.getElementById('countrySearch');
    const listEl = document.getElementById('countryList');
    const flagEl = document.getElementById('selectedFlag');
    const codeEl = document.getElementById('selectedCode');
    const numberInput = document.getElementById('phoneNumber');
    const hiddenPhone = document.getElementById('phone');
    const errorEl = document.getElementById('phoneError');

    if (!trigger) return; // not on this page

    // Render full list
    function renderList(filter = '') {
        const q = filter.toLowerCase();
        listEl.innerHTML = '';
        COUNTRIES
            .filter(c => c.name.toLowerCase().includes(q) || c.dial.includes(q))
            .forEach(c => {
                const li = document.createElement('li');
                li.className = 'cp-item';
                li.innerHTML = `<span class="cp-flag">${c.flag}</span>
                        <span class="cp-name">${c.name}</span>
                        <span class="cp-dial">${c.dial}</span>`;
                li.addEventListener('click', () => selectCountry(c));
                listEl.appendChild(li);
            });
    }

    function selectCountry(c) {
        selectedCountry = c;
        flagEl.textContent = c.flag;
        codeEl.textContent = c.dial;
        dropdown.classList.remove('cp-open');
        searchInput.value = '';
        renderList();
        composePhone();
        validatePhone(false);
    }

    function composePhone() {
        const digits = numberInput.value.replace(/\D/g, '');
        hiddenPhone.value = digits ? selectedCountry.dial + digits : '';
    }

    function validatePhone(showError = true) {
        const digits = numberInput.value.replace(/\D/g, '');
        const wrapper = document.getElementById('phoneWrapper');
        const { min, max } = selectedCountry;

        if (!digits) {
            if (showError) setError('Phone number is required.');
            wrapper.classList.remove('cp-valid');
            wrapper.classList.add('cp-invalid');
            return false;
        }
        if (digits.length < min || digits.length > max) {
            if (showError) setError(`Enter ${min === max ? min : min + '–' + max} digits for ${selectedCountry.name}.`);
            wrapper.classList.remove('cp-valid');
            wrapper.classList.add('cp-invalid');
            return false;
        }
        clearError();
        wrapper.classList.remove('cp-invalid');
        wrapper.classList.add('cp-valid');
        return true;
    }

    function setError(msg) {
        const errorEl = document.getElementById('phoneError');
        if (errorEl) errorEl.textContent = msg;
    }

    function clearError() {
        const errorEl = document.getElementById('phoneError');
        if (errorEl) errorEl.textContent = '';
    }

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('cp-open');
        if (dropdown.classList.contains('cp-open')) {
            searchInput.focus();
        }
    });

    // Search
    searchInput.addEventListener('input', () => renderList(searchInput.value));

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== trigger) {
            dropdown.classList.remove('cp-open');
            searchInput.value = '';
            renderList();
        }
    });

    // Number input events
    numberInput.addEventListener('input', () => {
        // Strip non-digits
        numberInput.value = numberInput.value.replace(/\D/g, '');
        composePhone();
        validatePhone(false);
    });

    numberInput.addEventListener('blur', () => {
        if (numberInput.value) validatePhone(true);
    });

    // Initial render
    renderList();
    flagEl.textContent = selectedCountry.flag;
    codeEl.textContent = selectedCountry.dial;
}

// Expose validator for use in navigate()
window.validatePhonePicker = function () {
    return (document.getElementById('phoneNumber'))
        ? (function () {
            const digits = document.getElementById('phoneNumber').value.replace(/\D/g, '');
            const { min, max, name } = selectedCountry;
            const errorEl = document.getElementById('phoneError');
            const wrapper = document.getElementById('phoneWrapper');
            if (!digits) {
                if (errorEl) errorEl.textContent = 'Phone number is required.';
                if (wrapper) { wrapper.classList.add('cp-invalid'); wrapper.classList.remove('cp-valid'); }
                return false;
            }
            if (digits.length < min || digits.length > max) {
                if (errorEl) errorEl.textContent = `Enter ${min === max ? min : min + '–' + max} digits for ${name}.`;
                if (wrapper) { wrapper.classList.add('cp-invalid'); wrapper.classList.remove('cp-valid'); }
                return false;
            }
            if (errorEl) errorEl.textContent = '';
            if (wrapper) { wrapper.classList.remove('cp-invalid'); wrapper.classList.add('cp-valid'); }
            return true;
        })()
        : true;
};

document.addEventListener('DOMContentLoaded', initPhonePicker);
