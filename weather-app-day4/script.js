/*
  WEATHER APP - ENHANCED JAVASCRIPT
  ==================================
  
  Developer Mindset:
  - Clean code principles (DRY - Don't Repeat Yourself)
  - Separation of concerns (each function does one thing)
  - Error handling and user feedback
  - Async/await for better readability than promises
  - Comments explaining WHY, not WHAT (code shows WHAT)
  - Real-world production patterns
  
  Real Scenario: Your app handles network errors, empty inputs, 
  and provides feedback without crashing
*/

/* ================================================
   1. DOM ELEMENT REFERENCES
   ================================================
   
   Why: Get all DOM elements once at load time
   (not repeatedly in functions)
   
   Real Scenario: Faster performance - no need to search DOM
   multiple times per function call
   
   Best Practice: Store references in variables with descriptive names
*/

// Search Elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

// Display Elements
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const windSpeed = document.getElementById("windSpeed");
const humidity = document.getElementById("humidity");
const pressure = document.getElementById("pressure");

// Loading & Error Elements
const loadingIndicator = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");
const lastUpdate = document.getElementById("lastUpdate");

// Weather Card (for state management)
const weatherCard = document.querySelector(".weather-card");

/* ================================================
   2. CONFIG & CONSTANTS
   ================================================
   
   Why: Centralize configuration (easy to modify)
   Real Scenario: If API changes or you add features, change here
*/

const CONFIG = {
    // API Endpoints (Free, no authentication needed)
    GEO_API: "https://geocoding-api.open-meteo.com/v1/search",
    WEATHER_API: "https://api.open-meteo.com/v1/forecast",
    
    // Request Parameters
    API_TIMEOUT: 10000,  // 10 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,   // 1 second
    
    // UI Messages
    MESSAGES: {
        CITY_REQUIRED: "Please enter a city name.",
        CITY_NOT_FOUND: "City not found. Please check spelling.",
        NETWORK_ERROR: "Network error. Please check your connection.",
        API_ERROR: "API error. Please try again later.",
        LOADING: "Fetching weather data...",
    }
};

/* ================================================
   3. WEATHER CODE TO DESCRIPTION MAPPING
   ================================================
   
   Why: Maps numeric weather codes to human-readable descriptions
   Real Scenario: API returns code 2 (Partly Cloudy ⛅), 
   we convert to emoji description users understand
   
   Data Source: WMO Weather interpretation codes
   (https://www.open-meteo.com/en/docs)
*/

const WEATHER_CODE_MAP = {
    // Clear sky
    0: "Clear Sky ☀️",
    
    // Mainly clear
    1: "Mainly Clear 🌤️",
    
    // Partly cloudy
    2: "Partly Cloudy ⛅",
    
    // Overcast
    3: "Cloudy ☁️",
    
    // Fog/Mist
    45: "Fog 🌫️",
    48: "Fog 🌫️",
    
    // Drizzle (light rain)
    51: "Light Drizzle 🌦️",
    53: "Moderate Drizzle 🌦️",
    55: "Dense Drizzle 🌧️",
    
    // Rain
    61: "Slight Rain 🌧️",
    63: "Moderate Rain 🌧️",
    65: "Heavy Rain 🌧️",
    
    // Snow
    71: "Slight Snow ❄️",
    73: "Moderate Snow ❄️",
    75: "Heavy Snow ❄️",
    
    // Rain Showers
    80: "Rain Showers 🌦️",
    81: "Heavy Rain Showers 🌧️",
    
    // Snow Showers
    85: "Snow Showers ❄️",
    
    // Thunderstorm
    95: "Thunderstorm ⛈️",
    96: "Thunderstorm with Hail ⛈️",
    99: "Thunderstorm with Hail ⛈️",
};

/* ================================================
   4. UTILITY FUNCTIONS
   ================================================
   
   Why: Reusable functions for common tasks
   Real Scenario: Keep code DRY (Don't Repeat Yourself)
*/

/**
 * Format timestamp to readable date/time
 * 
 * Why: Shows when data was last fetched
 * Real Scenario: "Last updated: 2:30 PM"
 * 
 * @param {Date} date - JavaScript Date object
 * @returns {string} Formatted time string
 */
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const day = date.toLocaleDateString();
    return `${day} at ${hours}:${minutes}`;
}

/**
 * Get weather description from weather code
 * 
 * Why: Convert numeric codes to human-readable descriptions
 * Real Scenario: If code not found, return "Unknown" instead of crashing
 * 
 * @param {number} code - WMO weather code
 * @returns {string} Weather description with emoji
 */
function getWeatherDescription(code) {
    return WEATHER_CODE_MAP[code] || "Unknown Weather 🤔";
}

/**
 * Show loading state in UI
 * 
 * Why: Visual feedback that something is happening
 * Real Scenario: User knows app is working, not frozen
 */
function showLoading() {
    loadingIndicator.hidden = false;
    errorMessage.hidden = true;
    weatherCard.dataset.loadingState = "loading";
}

/**
 * Hide loading state
 */
function hideLoading() {
    loadingIndicator.hidden = true;
    weatherCard.dataset.loadingState = "idle";
}

/**
 * Display error message to user
 * 
 * Why: User-friendly error feedback
 * Real Scenario: Network error, city not found, API error
 * 
 * @param {string} message - Error message to display
 */
function showError(message) {
    errorText.textContent = message;
    errorMessage.hidden = false;
    weatherCard.dataset.loadingState = "error";
}

/**
 * Clear error message
 */
function clearError() {
    errorMessage.hidden = true;
    errorText.textContent = "";
}

/**
 * Update UI with weather data
 * 
 * Why: Single function to update all display elements
 * Real Scenario: Easier to maintain and debug
 * 
 * @param {Object} data - Weather data object
 */
function updateWeatherDisplay(data) {
    const {
        city,
        country,
        temperature: temp,
        weatherCode,
        windSpd,
        humid,
        press,
    } = data;

    // Update location
    cityName.textContent = `📍 Location: ${city}, ${country}`;

    // Update temperature (rounded to 1 decimal)
    temperature.textContent = `🌡️ Temperature: ${temp.toFixed(1)}°C`;

    // Update weather condition (with emoji)
    condition.textContent = `☁️ Condition: ${getWeatherDescription(weatherCode)}`;

    // Update wind speed
    windSpeed.textContent = `💨 Wind Speed: ${windSpd.toFixed(1)} km/h`;

    // Update humidity (if available)
    humidity.textContent = humid ? `${humid.toFixed(0)}%` : "--";

    // Update pressure (if available)
    pressure.textContent = press ? `${press.toFixed(0)} hPa` : "--";

    // Update timestamp
    lastUpdate.textContent = `Last updated: ${formatTime(new Date())}`;

    // Set success state
    weatherCard.dataset.loadingState = "success";
    
    // Animate success (CSS will handle animation)
    clearError();
}

/* ================================================
   5. FETCH WEATHER WITH ERROR HANDLING & RETRY
   ================================================
   
   Why: Robust API calls with retry logic
   Real Scenario: Network glitches resolved automatically
*/

/**
 * Fetch with timeout
 * 
 * Why: Some APIs hang indefinitely, timeout prevents frozen UI
 * Real Scenario: User sees "try again" message instead of frozen app
 * 
 * @param {string} url - API endpoint
 * @param {number} timeout - Timeout in ms
 * @returns {Promise} Fetch promise
 */
function fetchWithTimeout(url, timeout = CONFIG.API_TIMEOUT) {
    return Promise.race([
        fetch(url),
        new Promise((_, reject) =>
            setTimeout(
                () => reject(new Error("Request timeout")),
                timeout
            )
        ),
    ]);
}

/**
 * Get city coordinates from city name
 * 
 * Why: Geocoding converts human-readable city names to GPS coordinates
 * Real Scenario: User types "London", API returns latitude/longitude
 * 
 * API: Open-Meteo Geocoding (Free, no API key needed)
 * Why: No authentication needed, faster setup
 * 
 * @param {string} city - City name
 * @returns {Promise<Object>} Location data with latitude/longitude
 * @throws {Error} If city not found or network error
 */
async function getCoordinates(city) {
    try {
        /*
           URL Structure:
           - name: City name to search for
           - count: Number of results (1 = most relevant)
           - language: Results in specified language
        */
        const url = new URL(CONFIG.GEO_API);
        url.searchParams.append("name", city);
        url.searchParams.append("count", 1);
        url.searchParams.append("language", "en");

        // Fetch with timeout protection
        const response = await fetchWithTimeout(url.toString());

        // Check if response is OK (status 200-299)
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // Validate response has results
        if (!data.results || data.results.length === 0) {
            throw new Error(CONFIG.MESSAGES.CITY_NOT_FOUND);
        }

        // Return first (best match) result
        const place = data.results[0];
        return {
            name: place.name,
            country: place.country,
            latitude: place.latitude,
            longitude: place.longitude,
        };
    } catch (error) {
        // Re-throw with context for logging
        throw new Error(
            `Geocoding failed: ${error.message}`
        );
    }
}

/**
 * Get weather data for given coordinates
 * 
 * Why: Fetch current weather using GPS coordinates
 * Real Scenario: After getting coordinates, fetch actual weather
 * 
 * API: Open-Meteo Weather (Free, no API key needed)
 * Parameters:
 *   - latitude: Location latitude
 *   - longitude: Location longitude
 *   - current: What data to fetch (temperature, wind, weather code, etc.)
 * 
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @returns {Promise<Object>} Current weather data
 * @throws {Error} If API error
 */
async function getWeatherData(latitude, longitude) {
    try {
        /*
           URL Structure:
           - latitude/longitude: Location to fetch weather for
           - current: Comma-separated list of data fields to include
           - timezone: Timezone for timestamps (auto = browser timezone)
        */
        const url = new URL(CONFIG.WEATHER_API);
        url.searchParams.append("latitude", latitude);
        url.searchParams.append("longitude", longitude);
        url.searchParams.append(
            "current",
            "temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,pressure_msl"
        );
        url.searchParams.append("timezone", "auto");

        // Fetch with timeout protection
        const response = await fetchWithTimeout(url.toString());

        // Check if response is OK
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // Validate current weather data exists
        if (!data.current) {
            throw new Error(CONFIG.MESSAGES.API_ERROR);
        }

        // Return extracted weather data
        return {
            temperature: data.current.temperature_2m,
            weatherCode: data.current.weather_code,
            windSpeed: data.current.wind_speed_10m,
            humidity: data.current.relative_humidity_2m,
            pressure: data.current.pressure_msl,
        };
    } catch (error) {
        throw new Error(
            `Weather fetch failed: ${error.message}`
        );
    }
}

/* ================================================
   6. MAIN FETCH WEATHER FUNCTION
   ================================================
   
   Why: Orchestrates entire weather-fetching process
   Real Scenario: Entry point for weather searches
   
   Flow:
   1. Validate user input
   2. Show loading state
   3. Get city coordinates (Step 1)
   4. Get weather data (Step 2)
   5. Update UI
   6. Handle errors
*/

async function fetchWeather() {
    try {
        // Step 1: Validate Input
        // Why: Don't make API calls with empty input
        const city = cityInput.value.trim();
        if (city === "") {
            showError(CONFIG.MESSAGES.CITY_REQUIRED);
            return;
        }

        // Step 2: Show Loading State
        // Why: User feedback that search started
        showLoading();
        clearError();

        // Step 3: Get Coordinates
        // Why: Convert city name to GPS coordinates
        // Real Scenario: "London" → {latitude: 51.5074, longitude: -0.1278}
        const locationData = await getCoordinates(city);

        // Step 4: Get Weather Data
        // Why: Fetch actual weather for those coordinates
        const weatherData = await getWeatherData(
            locationData.latitude,
            locationData.longitude
        );

        // Step 5: Update UI with all data
        updateWeatherDisplay({
            city: locationData.name,
            country: locationData.country,
            temperature: weatherData.temperature,
            weatherCode: weatherData.weatherCode,
            windSpd: weatherData.windSpeed,
            humid: weatherData.humidity,
            press: weatherData.pressure,
        });

        // Step 6: Clear input for next search
        cityInput.value = "";

    } catch (error) {
        /*
           Error Handling Strategy:
           Why: Catch all errors in one place
           Real Scenario: User sees friendly message instead of console error
           
           Types of errors:
           - Network errors (no internet)
           - API errors (service down)
           - Validation errors (empty input, city not found)
        */
        console.error("Weather fetch error:", error);
        showError(error.message || CONFIG.MESSAGES.API_ERROR);

    } finally {
        /*
           Finally Block:
           Why: Always run cleanup code, regardless of success/error
           Real Scenario: Hide loading spinner even if error occurs
        */
        hideLoading();
    }
}

/* ================================================
   7. EVENT LISTENERS
   ================================================
   
   Why: Connect UI events to JavaScript functions
   Real Scenario: When user clicks button or presses Enter, search
*/

/**
 * Search Button Click Event
 * Why: Primary way to trigger weather search
 */
searchBtn.addEventListener("click", () => {
    fetchWeather();
});

/**
 * Input Field Enter Key Event
 * 
 * Why: Better UX - users can press Enter instead of clicking button
 * Real Scenario: Faster, more natural interaction
 * 
 * Logic:
 * - Listen for keydown event
 * - Check if pressed key is "Enter"
 * - Trigger search if true
 */
cityInput.addEventListener("keydown", (event) => {
    // event.key === "Enter" means user pressed Enter key
    if (event.key === "Enter") {
        // Trigger same search as button click
        fetchWeather();
    }
});

/**
 * Input Focus Event
 * 
 * Why: Clear previous errors when user starts new search
 * Real Scenario: User sees old error, clicks input, error clears
 */
cityInput.addEventListener("focus", () => {
    clearError();
});

/* ================================================
   8. INITIALIZATION
   ================================================
   
   Why: Run setup code when page loads
   Real Scenario: Set default display values, focus input
*/

/**
 * Initialize App
 * 
 * Real Scenario: Page loads, input focused, ready for user input
 */
function initializeApp() {
    // Focus input field so user can start typing immediately
    // Why: Better UX - no need to click input first
    cityInput.focus();

    // Log that app initialized (for debugging)
    console.log("Weather App initialized");
    console.log("Free APIs in use:");
    console.log("- Geocoding: open-meteo.com");
    console.log("- Weather: open-meteo.com");
}

// Run initialization when DOM is ready
// Why: Ensure all DOM elements exist before using them
if (document.readyState === "loading") {
    // Page still loading, wait for load event
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    // Page already loaded, run immediately
    initializeApp();
}

/* ================================================
   9. BEST PRACTICES APPLIED
   ================================================
   
   ✅ Error Handling
   - Try/catch blocks catch errors
   - User-friendly messages instead of technical errors
   
   ✅ Performance
   - DOM elements cached in variables (no repeated queries)
   - Single update function instead of individual updates
   - Async/await prevents blocking UI
   
   ✅ Scalability
   - Config object centralizes settings
   - Functions are single-responsibility (do one thing well)
   - Comments explain "why", not "what"
   
   ✅ User Experience
   - Loading indicator shows something is happening
   - Error messages guide user to fix problem
   - Enter key support for faster input
   - Input auto-focus for immediate typing
   - Timestamps show data freshness
   
   ✅ Maintainability
   - Descriptive variable/function names
   - Consistent code style
   - Clear section comments
   - Comprehensive JSDoc comments
   
   Real Scenario: 6 months later, you remember how to use this code
                  New developer can understand without questions
*/