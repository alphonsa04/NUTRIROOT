/**
 * Weather Service for NutriRoot
 * Powered by WeatherAPI.com
 */

const WeatherService = {
    config: {
        apiKey: localStorage.getItem('WEATHER_API_KEY') || '6abe9686a74841adbec170504261002',
        endpoint: 'https://api.weatherapi.com/v1',
        cacheKey: 'nutriroot_weather_cache',
        cacheDuration: 30 * 60 * 1000, // 30 minutes
    },

    /**
     * Initialize the weather service
     */
    async init() {
        console.log("WeatherService: Initializing...");

        // Check if we have cached data
        const cachedData = this.getCachedWeather();
        if (cachedData) {
            this.displayWeather(cachedData);
            return;
        }

        // Fetch fresh weather data
        await this.fetchWeather();
    },

    /**
     * Get cached weather data if still valid
     */
    getCachedWeather() {
        try {
            const cached = localStorage.getItem(this.config.cacheKey);
            if (!cached) return null;

            const data = JSON.parse(cached);
            const now = Date.now();

            if (now - data.timestamp < this.config.cacheDuration) {
                console.log("WeatherService: Using cached data");
                return data.weather;
            }

            return null;
        } catch (e) {
            console.error("WeatherService: Cache read error", e);
            return null;
        }
    },

    /**
     * Fetch weather data from API
     */
    async fetchWeather() {
        // Check if API key exists
        if (!this.config.apiKey) {
            this.showApiKeyPrompt();
            return;
        }

        try {
            // Get user location
            const location = await this.getLocation();

            // Fetch current weather and forecast
            const apiUrl = `${this.config.endpoint}/forecast.json?key=${this.config.apiKey}&q=${location}&days=3&aqi=no`;
            console.log("WeatherService: Fetching from", apiUrl);

            const response = await fetch(apiUrl);

            if (!response.ok) {
                console.error("WeatherAPI Status:", response.status, response.statusText);
                const errorData = await response.json();
                console.error("WeatherAPI Error:", errorData);

                if (response.status === 400 && errorData.error && errorData.error.code === 1006) {
                    this.showError(`Location "${location}" not found. Please try searching for a nearby city.`);
                    this.showLocationSearch();
                } else if (response.status === 401 || response.status === 403) {
                    this.showApiKeyPrompt("Invalid API Key. Please check your key and try again.");
                } else {
                    this.showError("Unable to fetch weather data. Please try again later.");
                }
                return;
            }

            const data = await response.json();

            // Cache the data
            localStorage.setItem(this.config.cacheKey, JSON.stringify({
                timestamp: Date.now(),
                weather: data
            }));

            this.displayWeather(data);
        } catch (error) {
            console.error("WeatherService: Fetch error", error);
            this.showError("Network error. Please check your connection.");
        }
    },

    /**
     * Get user location (geolocation or manual)
     */
    async getLocation() {
        return new Promise((resolve) => {
            // Try to get saved location first
            const savedLocation = localStorage.getItem('nutriroot_location');
            if (savedLocation) {
                resolve(savedLocation);
                return;
            }

            // Try browser geolocation
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const coords = `${position.coords.latitude},${position.coords.longitude}`;
                        localStorage.setItem('nutriroot_location', coords);
                        resolve(coords);
                    },
                    (error) => {
                        console.log("Geolocation denied, using default location");
                        // Default to a general location (can be changed by user)
                        const defaultLocation = "India";
                        this.showLocationPrompt();
                        resolve(defaultLocation);
                    }
                );
            } else {
                // Geolocation not supported
                const defaultLocation = "India";
                this.showLocationPrompt();
                resolve(defaultLocation);
            }
        });
    },

    /**
     * Display weather data in the UI
     */
    displayWeather(data) {
        const container = document.getElementById('weatherWidget');
        if (!container) return;

        const current = data.current;
        const location = data.location;
        const forecast = data.forecast.forecastday;

        const weatherHTML = `
            <div class="weather-header">
                <div class="weather-location">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>${location.name}, ${location.region}</span>
                </div>
                <div class="weather-controls">
                    <button class="weather-location-btn" onclick="WeatherService.requestLiveLocation()" title="Use Live Location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="3"></circle>
                            <line x1="12" y1="2" x2="12" y2="6"></line>
                            <line x1="12" y1="18" x2="12" y2="22"></line>
                            <line x1="2" y1="12" x2="6" y2="12"></line>
                            <line x1="18" y1="12" x2="22" y2="12"></line>
                        </svg>
                    </button>
                    <button class="weather-search-btn" onclick="WeatherService.showLocationSearch()" title="Search Location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </button>
                    <button class="weather-refresh" onclick="WeatherService.refreshWeather()" title="Refresh Weather">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 2v6h-6"></path>
                            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                            <path d="M3 22v-6h6"></path>
                            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="weather-current">
                <div class="weather-icon">
                    <img src="https:${current.condition.icon}" alt="${current.condition.text}">
                </div>
                <div class="weather-temp">
                    <span class="temp-value">${Math.round(current.temp_c)}°C</span>
                    <span class="temp-condition">${current.condition.text}</span>
                </div>
            </div>

            <div class="weather-details">
                <div class="weather-detail">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                    </svg>
                    <span>Humidity: ${current.humidity}%</span>
                </div>
                <div class="weather-detail">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path>
                    </svg>
                    <span>Wind: ${current.wind_kph} km/h</span>
                </div>
                <div class="weather-detail">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    <span>UV Index: ${current.uv}</span>
                </div>
            </div>

            <div class="weather-forecast">
                <h4>3-Day Forecast</h4>
                <div class="forecast-days">
                    ${forecast.map((day, index) => `
                        <div class="forecast-day">
                            <span class="forecast-date">${index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" class="forecast-icon">
                            <span class="forecast-temp">${Math.round(day.day.maxtemp_c)}° / ${Math.round(day.day.mintemp_c)}°</span>
                            <span class="forecast-rain">${day.day.daily_chance_of_rain}% rain</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="weather-updated">
                Last updated: ${new Date(current.last_updated).toLocaleTimeString()}
            </div>
        `;

        container.innerHTML = weatherHTML;
    },

    /**
     * Show API key input prompt
     */
    showApiKeyPrompt(message = null) {
        const container = document.getElementById('weatherWidget');
        if (!container) return;

        const promptHTML = `
            <div class="weather-setup">
                <h3>Weather Setup</h3>
                ${message ? `<p class="error-message">${message}</p>` : ''}
                <p>Get real-time weather data for better farming decisions.</p>
                <ol>
                    <li>Get a free API key from <a href="https://www.weatherapi.com/signup.aspx" target="_blank">WeatherAPI.com</a></li>
                    <li>Enter your API key below</li>
                </ol>
                <div class="api-key-input">
                    <input type="password" id="weatherApiKeyInput" placeholder="Paste your WeatherAPI key here...">
                    <button onclick="WeatherService.saveApiKey()">Save & Load Weather</button>
                </div>
            </div>
        `;

        container.innerHTML = promptHTML;
    },

    /**
     * Show location input prompt
     */
    showLocationPrompt() {
        // This can be enhanced to show a modal for manual location entry
        console.log("WeatherService: Location prompt needed");
    },

    /**
     * Show error message
     */
    showError(message) {
        const container = document.getElementById('weatherWidget');
        if (!container) return;

        container.innerHTML = `
            <div class="weather-error">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>${message}</p>
                <button onclick="WeatherService.fetchWeather()">Retry</button>
            </div>
        `;
    },

    /**
     * Save API key from input
     */
    saveApiKey() {
        const input = document.getElementById('weatherApiKeyInput');
        const key = input.value.trim();

        if (key) {
            localStorage.setItem('WEATHER_API_KEY', key);
            this.config.apiKey = key;
            this.fetchWeather();
        }
    },

    /**
     * Refresh weather data
     */
    async refreshWeather() {
        localStorage.removeItem(this.config.cacheKey);
        await this.fetchWeather();
    },

    /**
     * Request live location from browser
     */
    async requestLiveLocation() {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        // Clear saved location to force new request
        localStorage.removeItem('nutriroot_location');

        // Show loading state
        const container = document.getElementById('weatherWidget');
        if (container) {
            const originalContent = container.innerHTML;
            container.innerHTML = `
                <div class="weather-loading">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="loading-spinner">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                    <p>Requesting location permission...</p>
                </div>
            `;
        }

        // Request location
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const coords = `${position.coords.latitude},${position.coords.longitude}`;
                localStorage.setItem('nutriroot_location', coords);
                localStorage.removeItem(this.config.cacheKey);
                await this.fetchWeather();
            },
            (error) => {
                alert("Location access denied. Please allow location access in your browser settings or use the search option.");
                // Restore weather display
                this.init();
            }
        );
    },

    /**
     * Show location search modal
     */
    showLocationSearch() {
        const container = document.getElementById('weatherWidget');
        if (!container) return;

        const currentLocation = localStorage.getItem('nutriroot_location') || '';

        const searchHTML = `
            <div class="weather-search-modal">
                <h3>Search Location</h3>
                <p>Enter a city name, postal code, or coordinates (lat,lon)</p>
                <div class="location-search-input">
                    <input type="text" id="locationSearchInput" placeholder="e.g., London, 10001, or 51.5074,-0.1278" value="${currentLocation}">
                    <div class="search-actions">
                        <button onclick="WeatherService.searchLocation()" class="btn-search">Search</button>
                        <button onclick="WeatherService.init()" class="btn-cancel">Cancel</button>
                    </div>
                </div>
                <div class="search-examples">
                    <p><strong>Examples:</strong></p>
                    <ul>
                        <li>City: <code onclick="document.getElementById('locationSearchInput').value='Mumbai, India'">Mumbai, India</code></li>
                        <li>Postal: <code onclick="document.getElementById('locationSearchInput').value='10001'">10001</code></li>
                        <li>Coords: <code onclick="document.getElementById('locationSearchInput').value='19.0760,72.8777'">19.0760,72.8777</code></li>
                    </ul>
                </div>
            </div>
        `;

        container.innerHTML = searchHTML;

        // Focus input
        setTimeout(() => {
            const input = document.getElementById('locationSearchInput');
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);

        // Add Enter key support
        const input = document.getElementById('locationSearchInput');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchLocation();
                }
            });
        }
    },

    /**
     * Search for location and update weather
     */
    async searchLocation() {
        const input = document.getElementById('locationSearchInput');
        const location = input ? input.value.trim() : '';

        if (!location) {
            alert("Please enter a location.");
            return;
        }

        // Save location and refresh
        localStorage.setItem('nutriroot_location', location);
        localStorage.removeItem(this.config.cacheKey);
        await this.fetchWeather();
    },

    /**
     * Get current weather data for AI context
     */
    getWeatherContext() {
        const cached = this.getCachedWeather();
        if (!cached) return null;

        const current = cached.current;
        const forecast = cached.forecast.forecastday[0];

        return {
            temperature: Math.round(current.temp_c),
            condition: current.condition.text,
            humidity: current.humidity,
            windSpeed: current.wind_kph,
            uvIndex: current.uv,
            rainChance: forecast.day.daily_chance_of_rain,
            location: `${cached.location.name}, ${cached.location.region}`
        };
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('weatherWidget')) {
        WeatherService.init();
    }
});
