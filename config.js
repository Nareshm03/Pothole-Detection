// API Configuration
const API_CONFIG = {
    // Development
    development: {
        API_BASE_URL: 'http://localhost:5000'
    },
    // Production - Replace with your Render backend URL
    production: {
        API_BASE_URL: 'https://pothole-detection-wd0h.onrender.com'
    }
};

// Auto-detect environment
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const config = isDevelopment ? API_CONFIG.development : API_CONFIG.production;

window.API_BASE_URL = config.API_BASE_URL;