// env-config.js
// Environment Configuration Loader
// This module safely loads configuration from environment variables or defaults

/**
 * Gets environment variable value safely
 * For browser environments, window.ENV can be set during build/deployment
 * For development, values can be injected via build tools or service workers
 */
function getEnvVar(key, defaultValue = '') {
    // Check if window.ENV exists (can be set by build process)
    if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
        return window.ENV[key];
    }
    
    // Fallback to default value
    return defaultValue;
}

/**
 * Firebase Configuration
 * These are safe to expose in client-side code as they're protected by Firestore rules
 */
export const firebaseConfig = {
    apiKey: getEnvVar('FIREBASE_API_KEY', 'AIzaSyAWPIcS8h3kE6kJYBxjeVFdSprgrMzOFo8'),
    authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', 'lazismu-auth.firebaseapp.com'),
    projectId: getEnvVar('FIREBASE_PROJECT_ID', 'lazismu-auth'),
    storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', 'lazismu-auth.firebasestorage.app'),
    messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', '398570239500'),
    appId: getEnvVar('FIREBASE_APP_ID', '1:398570239500:web:0b3e96109a4bf304ebe029')
};

/**
 * Google Apps Script API URLs
 * SECURITY NOTE: These should be kept private when possible
 * Consider using a proxy endpoint that validates requests
 */
export const GAS_API_URL = getEnvVar('GAS_API_URL', 
    'https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec'
);

export const GAS_API_URL_SANTRI = getEnvVar('GAS_API_URL_SANTRI',
    'https://script.google.com/macros/s/AKfycbw-URYAsLTWCdnGurQhM1ZXa9N8vm-GBlHwtetDlin73-Ma8G0aAbFoboGGUI8GgVDl/exec'
);

export const GAS_API_URL_KELAS = getEnvVar('GAS_API_URL_KELAS',
    'https://script.google.com/macros/s/AKfycbw-URYAsLTWCdnGurQhM1ZXa9N8vm-GBlHwtetDlin73-Ma8G0aAbFoboGGUI8GgVDl/exec'
);

/**
 * reCAPTCHA Configuration
 * Site key is safe to expose, secret key should NEVER be in client code
 */
export const RECAPTCHA_SITE_KEY = getEnvVar('RECAPTCHA_SITE_KEY', 
    '6LdhLGIsAAAAAOFfE86013kZqCZvZwVTTBPZTdp6'
);

/**
 * WordPress Site for News
 */
export const WORDPRESS_SITE = getEnvVar('WORDPRESS_SITE', 
    'lazismumuallimin.wordpress.com'
);

/**
 * News Configuration
 */
export const NEWS_PER_PAGE = parseInt(getEnvVar('NEWS_PER_PAGE', '6'), 10);

/**
 * Rate Limiting Configuration (Client-side)
 * Note: This is only client-side protection. Server-side rate limiting is essential.
 */
export const RATE_LIMIT = {
    MAX_REQUESTS: parseInt(getEnvVar('RATE_LIMIT_MAX_REQUESTS', '5'), 10),
    WINDOW_MINUTES: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MINUTES', '15'), 10)
};

/**
 * Utility function to check if running in development mode
 */
export function isDevelopment() {
    const hostname = window.location.hostname;
    // Check for common development hostnames
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' ||
           hostname === '0.0.0.0' ||
           hostname.startsWith('localhost:') ||
           hostname.startsWith('127.0.0.1:') ||
           // Allow explicitly setting development mode via ENV
           (window.ENV && window.ENV.NODE_ENV === 'development');
}

/**
 * Utility function to validate that required environment variables are set
 * Call this during app initialization to catch configuration errors early
 */
export function validateConfig() {
    const errors = [];
    
    // Validate Firebase config
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your-firebase-api-key') {
        errors.push('Firebase API Key is not configured');
    }
    
    // Validate GAS URLs
    if (GAS_API_URL.includes('YOUR_DEPLOYMENT_ID')) {
        errors.push('Google Apps Script API URL is not configured');
    }
    
    // Validate reCAPTCHA
    if (!RECAPTCHA_SITE_KEY || RECAPTCHA_SITE_KEY === 'your-recaptcha-site-key') {
        errors.push('reCAPTCHA Site Key is not configured');
    }
    
    if (errors.length > 0 && isDevelopment()) {
        console.warn('⚠️ Configuration warnings:', errors);
        console.warn('Please check your .env file and ensure all variables are set correctly');
    }
    
    return errors;
}

// Log configuration status in development
if (isDevelopment()) {
    console.group('🔧 Environment Configuration');
    console.log('Firebase Project:', firebaseConfig.projectId);
    console.log('WordPress Site:', WORDPRESS_SITE);
    console.log('Rate Limit:', `${RATE_LIMIT.MAX_REQUESTS} requests per ${RATE_LIMIT.WINDOW_MINUTES} minutes`);
    console.log('Environment:', isDevelopment() ? 'Development' : 'Production');
    
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
        console.warn('Configuration issues detected:', configErrors);
    } else {
        console.log('✅ All required configurations are set');
    }
    console.groupEnd();
}
