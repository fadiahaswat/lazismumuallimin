// security-utils.js
// Security utilities for preventing abuse and bot attacks

/**
 * Rate limiting implementation using localStorage
 * Prevents bot spam by limiting number of submissions per time window
 */
class RateLimiter {
    constructor(maxRequests = 5, windowMinutes = 15) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMinutes * 60 * 1000;
        this.storageKey = 'donation_rate_limit';
    }

    /**
     * Check if user has exceeded rate limit
     * @returns {object} { allowed: boolean, remainingTime: number }
     */
    checkLimit() {
        const now = Date.now();
        const data = this.getData();
        
        // Remove old entries outside the time window
        data.requests = data.requests.filter(timestamp => 
            now - timestamp < this.windowMs
        );

        // Check if limit exceeded
        if (data.requests.length >= this.maxRequests) {
            const oldestRequest = Math.min(...data.requests);
            const resetTime = oldestRequest + this.windowMs;
            const remainingMs = resetTime - now;
            const remainingMinutes = Math.ceil(remainingMs / 60000);
            
            return {
                allowed: false,
                remainingTime: remainingMinutes,
                message: `Terlalu banyak percobaan donasi. Silakan coba lagi dalam ${remainingMinutes} menit.`
            };
        }

        return { allowed: true };
    }

    /**
     * Record a new request
     */
    recordRequest() {
        const data = this.getData();
        data.requests.push(Date.now());
        this.saveData(data);
    }

    /**
     * Get rate limit data from localStorage
     */
    getData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                return { requests: [] };
            }
            return JSON.parse(stored);
        } catch (error) {
            console.error('Error reading rate limit data:', error);
            return { requests: [] };
        }
    }

    /**
     * Save rate limit data to localStorage
     */
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving rate limit data:', error);
        }
    }

    /**
     * Reset rate limit (for testing or admin purposes)
     */
    reset() {
        localStorage.removeItem(this.storageKey);
    }
}

/**
 * Validate donation data before submission
 * Provides server-side style validation on client
 */
export function validateDonationData(data) {
    const errors = [];

    // Validate required fields
    if (!data.type || data.type.trim() === '') {
        errors.push('Jenis donasi harus dipilih');
    }

    // Validate nominal
    const nominal = parseInt(data.nominal);
    if (!nominal || nominal < 1000) {
        errors.push('Nominal donasi minimal Rp 1.000');
    }
    if (nominal > 1000000000) {
        errors.push('Nominal donasi terlalu besar');
    }

    // Validate name
    if (!data.nama || data.nama.trim().length < 3) {
        errors.push('Nama harus diisi minimal 3 karakter');
    }
    if (data.nama && data.nama.length > 100) {
        errors.push('Nama terlalu panjang (maksimal 100 karakter)');
    }

    // Validate phone number
    if (!data.hp || data.hp.trim() === '') {
        errors.push('Nomor HP harus diisi');
    } else {
        const cleanHP = data.hp.replace(/[^0-9]/g, '');
        if (cleanHP.length < 10 || cleanHP.length > 15) {
            errors.push('Nomor HP tidak valid (10-15 digit)');
        }
    }

    // Validate email format if provided
    if (data.email && data.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            errors.push('Format email tidak valid');
        }
    }

    // Validate payment method
    const validMethods = ['bni', 'bsi', 'bpd', 'transfer'];
    if (!data.metode || !validMethods.includes(data.metode)) {
        errors.push('Metode pembayaran harus dipilih');
    }

    // Sanitize text inputs to prevent XSS
    if (data.nama) {
        data.nama = sanitizeText(data.nama);
    }
    if (data.alamat) {
        data.alamat = sanitizeText(data.alamat);
    }
    if (data.doa) {
        data.doa = sanitizeText(data.doa);
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
        sanitizedData: data
    };
}

/**
 * Sanitize text input to prevent XSS attacks
 */
function sanitizeText(text) {
    if (!text) return text;
    
    // Remove any HTML tags
    const temp = document.createElement('div');
    temp.textContent = text;
    let sanitized = temp.innerHTML;
    
    // Remove potentially dangerous characters
    sanitized = sanitized
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
    
    return sanitized.trim();
}

/**
 * Add timestamp and signature to payload for replay attack prevention
 */
export function addSecurityHeaders(payload) {
    return {
        ...payload,
        timestamp: new Date().toISOString(),
        clientVersion: '1.0.0',
        // Generate a simple hash for integrity check
        checksum: generateChecksum(payload)
    };
}

/**
 * Generate a simple checksum for data integrity
 */
function generateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

/**
 * Detect if submission looks like bot activity
 * Returns true if suspicious patterns detected
 */
export function detectBotActivity() {
    const checks = {
        // Check if form filled too quickly (< 3 seconds is suspicious)
        fillTime: checkFormFillTime(),
        
        // Check if user interacted with page
        hasInteraction: checkUserInteraction(),
        
        // Check for automated tools
        hasAutomationSignature: checkAutomationSignatures()
    };

    // If any check fails, likely a bot
    return checks.hasAutomationSignature || !checks.hasInteraction || !checks.fillTime;
}

/**
 * Check if form was filled too quickly
 */
function checkFormFillTime() {
    const formStartTime = window.donationFormStartTime || Date.now();
    const elapsed = Date.now() - formStartTime;
    const minTime = 3000; // 3 seconds minimum
    return elapsed >= minTime;
}

/**
 * Check if user has interacted with the page
 */
function checkUserInteraction() {
    // Check if there were mouse movements or clicks
    return window.hasUserInteraction === true;
}

/**
 * Check for automation signatures
 */
function checkAutomationSignatures() {
    // Check for common automation tools
    if (window.navigator.webdriver) {
        return true; // Selenium/WebDriver detected
    }
    
    // Check for headless browsers
    if (navigator.plugins.length === 0) {
        return true; // Likely headless
    }
    
    return false;
}

/**
 * Initialize security tracking
 * Call this when the donation page loads
 */
export function initSecurityTracking() {
    // Track when user first opens donation form
    window.donationFormStartTime = Date.now();
    
    // Track user interactions
    window.hasUserInteraction = false;
    
    const interactionEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    interactionEvents.forEach(event => {
        document.addEventListener(event, () => {
            window.hasUserInteraction = true;
        }, { once: true, passive: true });
    });
}

/**
 * Create singleton rate limiter instance
 */
export const rateLimiter = new RateLimiter(5, 15);

/**
 * Main security check before donation submission
 * @returns {object} { allowed: boolean, message: string }
 */
export function performSecurityChecks() {
    // Check rate limit
    const rateLimitCheck = rateLimiter.checkLimit();
    if (!rateLimitCheck.allowed) {
        return {
            allowed: false,
            message: rateLimitCheck.message
        };
    }

    // Check for bot activity
    if (detectBotActivity()) {
        return {
            allowed: false,
            message: 'Aktivitas mencurigakan terdeteksi. Silakan refresh halaman dan coba lagi.'
        };
    }

    return { allowed: true };
}
