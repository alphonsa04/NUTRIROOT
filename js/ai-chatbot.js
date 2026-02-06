/**
 * AI Chatbot for NutriRoot
 * Powered by Groq (Llama 3)
 */

const AIChatbot = {
    // Configuration - Note: In a production app, the API key should be handled via a backend proxy
    // For this demonstration, we'll look for a key in local storage or use a placeholder if not provided
    config: {
        apiKey: localStorage.getItem('GROQ_API_KEY') || '',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
        systemPrompt: `You are NutriRoot AI, an expert Agronomist and Soil Health assistant. 
        Your goal is to provide intelligent assistance on soil health, fertilizer management, crop cultivation, and sustainable agriculture.
        
        GUIDELINES:
        - Use simple, farmer-friendly, and professional language.
        - Be accurate and follow standard agronomic practices.
        - Emphasize the 4R Fertilizer Stewardship (Right Source, Right Rate, Right Time, Right Place).
        - Interpret soil parameters: NPK (Nitrogen, Phosphorus, Potassium), pH, Moisture, Temperature, and EC (Electrical Conductivity).
        - CLEARLY STATE: "I am an AI assistant providing informational guidance. For critical decisions, please consult with a local certified agronomist."
        - Avoid unsafe or unverified advice.
        
        CURRENT CONTEXT:
        If you see any soil data provided in the prompt, prioritize using it to give specific advice.
        If no data is provided, ask the user to enter their parameters in the dashboard for a better analysis.`
    },

    isOpen: false,
    history: [],

    /**
     * Initialize the chatbot UI and events
     */
    init() {
        console.log("AIChatbot: Initializing...");
        this.renderUI();
        this.addEventListeners();

        // Add welcome message
        setTimeout(() => {
            this.addMessage("ai", "Hello! I'm your NutriRoot AI assistant. I can help you with soil analysis, crop recommendations, or general farming questions. How can I assist you today?");
        }, 1000);
    },

    /**
     * Render the chatbot HTML structure
     */
    renderUI() {
        if (document.getElementById('nutriroot-chatbot')) return;

        const chatbotHTML = `
            <div id="nutriroot-chatbot">
                <button class="chatbot-toggle" id="chatbotToggle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>

                <div class="chatbot-window" id="chatbotWindow">
                    <div class="chatbot-header">
                        <div class="header-info">
                            <div class="header-icon">
                                <img src="assets/images/tree-icon.png" alt="NutriRoot AI" style="width: 24px; height: 24px;">
                            </div>
                            <div class="header-title">
                                <h3>NutriRoot AI</h3>
                                <p>Powered by Groq</p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="reset-key-btn" id="resetKeyBtn" title="Reset API Key">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 2v6h-6"></path>
                                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                                    <path d="M3 22v-6h6"></path>
                                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                                </svg>
                            </button>
                            <button class="close-chatbot" id="closeChatbot">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="12" x2="6" y2="12"></line> <!-- dummy to match length if needed -->
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="chatbot-messages" id="chatbotMessages">
                        <!-- Messages populated here -->
                    </div>

                    <div class="chatbot-input-area">
                        <input type="text" class="chatbot-input" id="chatbotInput" placeholder="Ask about soil, crops, or fertilizers...">
                        <button class="send-btn" id="sendMsgBtn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    },

    /**
     * Setup event listeners
     */
    addEventListeners() {
        const toggle = document.getElementById('chatbotToggle');
        const close = document.getElementById('closeChatbot');
        const input = document.getElementById('chatbotInput');
        const sendBtn = document.getElementById('sendMsgBtn');

        toggle.onclick = () => this.toggleChat();
        close.onclick = () => this.toggleChat();

        const resetBtn = document.getElementById('resetKeyBtn');
        if (resetBtn) {
            resetBtn.onclick = () => {
                if (confirm("Reset Groq API Key? You will need to enter a new one.")) {
                    localStorage.removeItem('GROQ_API_KEY');
                    this.config.apiKey = '';
                    location.reload();
                }
            };
        }

        sendBtn.onclick = () => this.handleSendMessage();
        input.onkeypress = (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        };
    },

    toggleChat() {
        this.isOpen = !this.isOpen;
        document.getElementById('chatbotWindow').classList.toggle('active', this.isOpen);
        if (this.isOpen) {
            document.getElementById('chatbotInput').focus();
        }
    },

    /**
     * Add a message to the chat display
     */
    addMessage(role, text) {
        const container = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        // Simple markdown replacement (can be improved with a library like marked.js)
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>')
            .replace(/^- (.*)/gm, '• $1');

        messageDiv.innerHTML = formattedText;
        container.appendChild(messageDiv);

        // Auto scroll
        container.scrollTop = container.scrollHeight;

        // Add to history
        this.history.push({ role: role === 'ai' ? 'model' : 'user', parts: [{ text: text }] });
    },

    /**
     * Show/Hide typing indicator
     */
    showTyping(show) {
        const container = document.getElementById('chatbotMessages');
        if (show) {
            const typingDiv = document.createElement('div');
            typingDiv.id = 'typingIndicator';
            typingDiv.className = 'message ai typing';
            typingDiv.innerHTML = '<span></span><span></span><span></span>';
            container.appendChild(typingDiv);
            container.scrollTop = container.scrollHeight;
        } else {
            const typingDiv = document.getElementById('typingIndicator');
            if (typingDiv) typingDiv.remove();
        }
    },

    /**
     * Handle user message submission
     */
    async handleSendMessage() {
        const input = document.getElementById('chatbotInput');
        const text = input.value.trim();

        if (!text) return;

        input.value = '';
        this.addMessage("user", text);

        await this.getAIResponse(text);
    },

    /**
     * Core logic to fetch response from Gemini
     */
    async getAIResponse(userText) {
        if (!this.config.apiKey) {
            this.addMessage("ai", `
                <strong>I need a Groq API Key to function.</strong><br><br>
                1. Go to <a href="https://console.groq.com/keys" target="_blank" style="color: var(--chatbot-secondary);">Groq Cloud Console</a> to get your free key.<br>
                2. Enter it below and click Save.<br><br>
                <div style="display: flex; gap: 8px;">
                    <input type="password" id="key-input" placeholder="Paste Groq Key here..." style="flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <button id="save-key-btn" style="background: var(--chatbot-secondary); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer;">Save</button>
                </div>
            `);

            // Attach listener specifically for this input
            setTimeout(() => {
                const saveBtn = document.getElementById('save-key-btn');
                const keyInput = document.getElementById('key-input');
                if (saveBtn && keyInput) {
                    saveBtn.onclick = () => {
                        const newKey = keyInput.value.trim();
                        if (newKey) {
                            localStorage.setItem('GROQ_API_KEY', newKey);
                            this.config.apiKey = newKey;
                            this.addMessage("ai", "API Key saved! You can now start chatting.");
                        }
                    };
                }
            }, 100);
            return;
        }

        this.showTyping(true);

        try {
            // Context injection: Get latest soil data if available
            let contextText = "";
            const latestSoil = await this.getLatestSoilDataForContext();

            if (latestSoil) {
                contextText = `[USER SOIL DATA]: Target Crop: ${latestSoil.crop}, N: ${latestSoil.nitrogen}, P: ${latestSoil.phosphorus}, K: ${latestSoil.potassium}, pH: ${latestSoil.ph}, EC: ${latestSoil.ec || 'N/A'}, Moisture: ${latestSoil.moisture}%, Temp: ${latestSoil.temperature}°C. Recorded on: ${new Date(latestSoil.timestamp).toLocaleDateString()}.\n\n`;
            }

            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: this.config.systemPrompt },
                        { role: 'user', content: contextText + userText }
                    ],
                    model: this.config.model,
                    temperature: 0.7,
                    max_tokens: 800,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Groq API Error:", errorData);

                if (response.status === 429) {
                    this.showTyping(false);
                    this.addMessage("ai", `
                        <strong>Groq API limit reached.</strong><br><br>
                        1. <strong>Wait</strong>: Free keys have rate limits.<br>
                        2. <strong>Switch Key</strong>: <button onclick="localStorage.removeItem('GROQ_API_KEY'); location.reload();" style="background: var(--chatbot-secondary); color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: 600;">Click here to Reset & Use a New Key</button><br><br>
                        <small>Tip: You can get a fresh key from <a href="https://console.groq.com/keys" target="_blank" style="color: var(--chatbot-secondary);">Groq Console</a>.</small>
                    `);
                    return;
                }

                let errorMsg = "I'm having trouble connecting to Groq.";
                if (errorData.error) {
                    errorMsg = `<strong>API Error:</strong> ${errorData.error.message}`;
                }

                this.addMessage("ai", errorMsg);
                this.showTyping(false);
                return;
            }

            const data = await response.json();
            this.showTyping(false);

            if (data.choices && data.choices[0].message) {
                const aiResponse = data.choices[0].message.content;
                this.addMessage("ai", aiResponse);
            } else {
                console.error("Unexpected Groq Response:", data);
                this.addMessage("ai", "I'm having trouble reading the response from Groq.");
            }
        } catch (error) {
            console.error("Chatbot Fetch Error:", error);
            this.showTyping(false);
            this.addMessage("ai", "<strong>Network Error:</strong> Please check your internet connection or try again later.");
        }
    },

    /**
     * Helper to get latest soil data for context injection
     */
    async getLatestSoilDataForContext() {
        try {
            if (typeof getLatestSoilData === 'function') {
                return await getLatestSoilData();
            }
            return null;
        } catch (e) {
            return null;
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if scripts are already loaded (script.js is required for context)
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        AIChatbot.init();
    } else {
        window.addEventListener('load', () => AIChatbot.init());
    }
});
