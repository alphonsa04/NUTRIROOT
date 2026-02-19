/**
 * ValidationEngine - A utility for real-time form validation
 */
const ValidationEngine = {
    /**
     * Initialize validation for a form
     * @param {string} formId - The ID of the form
     * @param {Object} rules - Validation rules for fields
     */
    init: function (formId, rules) {
        const form = document.getElementById(formId);
        if (!form) return;

        // Store rules on the form element for later access
        form._validationRules = rules;

        // Attach listeners to fields defined in rules
        Object.keys(rules).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field) return;

            // Trigger validation on input and blur
            const validateFn = () => this.validateField(field, rules[fieldId]);
            field.addEventListener('input', validateFn);
            field.addEventListener('blur', validateFn);

            // Create error placeholder if it doesn't exist
            this._getOrCreateMsgElement(field);
        });

        // Intercept form submission
        form.addEventListener('submit', (e) => {
            let isValid = true;
            Object.keys(rules).forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field && !this.validateField(field, rules[fieldId])) {
                    isValid = false;
                }
            });

            if (!isValid) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    },

    /**
     * Validate a single field
     * @param {HTMLElement} field - The field to validate
     * @param {Object} rules - Rules for this field
     * @returns {boolean} - Whether the field is valid
     */
    validateField: function (field, rules) {
        if (!rules) return true;

        const value = field.value.trim();
        let errorMessage = '';

        // Check rules
        if (rules.required && !value) {
            errorMessage = rules.requiredMsg || 'This field is required';
        } else if (rules.minLength && value.length < rules.minLength) {
            errorMessage = rules.minLengthMsg || `Minimum ${rules.minLength} characters required`;
        } else if (rules.pattern && !rules.pattern.test(value)) {
            errorMessage = rules.patternMsg || 'Invalid format';
        } else if (rules.custom) {
            errorMessage = rules.custom(value, field);
        }

        if (errorMessage) {
            this.showError(field, errorMessage);
            return false;
        } else {
            this.showSuccess(field);
            return true;
        }
    },

    /**
     * Show error for a field
     */
    showError: function (field, message) {
        field.classList.remove('input-valid');
        field.classList.add('input-invalid');
        const msgEl = this._getOrCreateMsgElement(field);
        msgEl.textContent = message;
        msgEl.className = 'validation-msg error';
    },

    /**
     * Show success/valid state for a field
     */
    showSuccess: function (field) {
        field.classList.remove('input-invalid');
        field.classList.add('input-valid');
        const msgEl = this._getOrCreateMsgElement(field);
        msgEl.textContent = ''; // Or "Looks good!" if desired
        msgEl.className = 'validation-msg success';
    },

    /**
     * Clear validation state for a field
     */
    clearError: function (field) {
        field.classList.remove('input-invalid', 'input-valid');
        const msgEl = this._getOrCreateMsgElement(field);
        msgEl.textContent = '';
        msgEl.className = 'validation-msg';
    },

    /**
     * Internal helper to find or create the message element
     */
    _getOrCreateMsgElement: function (field) {
        let msgEl = field.parentNode.querySelector('.validation-msg');
        if (!msgEl) {
            msgEl = document.createElement('span');
            msgEl.className = 'validation-msg';
            field.parentNode.appendChild(msgEl);
        }
        return msgEl;
    },

    /**
     * Show a non-blocking notification (Toast)
     */
    showNotification: function (message, type = 'success') {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.cssText = `
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border-left: 5px solid ${type === 'success' ? '#05CD99' : '#E31A1A'};
            color: var(--primary-color);
            font-weight: 600;
            min-width: 250px;
            animation: slideIn 0.3s ease-out;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;
        toast.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background:none; border:none; color:#A3AED0; cursor:pointer; margin-left:1rem;">✕</button>
        `;

        container.appendChild(toast);

        // Auto remove after 5s
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
};

// Add CSS for animation if not present
if (!document.getElementById('validation-extra-styles')) {
    const style = document.createElement('style');
    style.id = 'validation-extra-styles';
    style.textContent = `
        @keyframes slideIn {
            from { opacity: 0; transform: translateX(50px); }
            to { opacity: 1; transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);
}

window.ValidationEngine = ValidationEngine;
