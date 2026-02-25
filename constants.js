// Application-wide constants and configuration values

// Zakat calculation constants
// Updated based on SK Lazismu Wilayah DIY No. 005.BP/KEP/II.19/B/2026
export const ZAKAT = {
    NISAB_TAHUN: 171912500,                          // Nisab threshold: 85 gram x Rp 2.022.500 = Rp 171.912.500
    get NISAB_BULAN() { return Math.round(this.NISAB_TAHUN / 12); }, // Nisab bulanan: dihitung dari NISAB_TAHUN
    RATE: 0.025,             // 2.5% zakat rate
    MIN_NOMINAL: 10000,      // Minimum donation amount
    FITRAH: 40000,           // Update 2026: Rp 40.000/jiwa (range Rp 35.000-40.000)
    FIDYAH: 50000            // Update 2026: Rp 50.000/hari (makanan siap saji, range Rp 30.000-50.000)
};

// Donation limits
export const DONATION = {
    MAX_AMOUNT: 10000000,        // Maximum donation amount per transaction (10 million IDR)
    MIN_NOMINAL_INFAQ: 1000,     // Minimum infaq/donation amount (Rp 1.000)
    WA_CONTACT: '6281196961918'  // WhatsApp contact for donations above limit
};

// Form validation constants
export const VALIDATION = {
    MIN_PHONE_LENGTH: 10,    // Minimum phone number length
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,  // Basic email validation pattern
    PHONE_PATTERN: /^[0-9+\-\s()]+$/  // Allow digits, +, -, spaces, and parentheses
};

// Session / LocalStorage key constants
export const SESSION = {
    SANTRI_KEY: 'lazismu_user_santri'  // LocalStorage key for santri login session
};

// UI behavior constants
export const UI = {
    TOAST_DURATION: 3000,       // Toast notification display duration in ms
    TOAST_ANIMATION: 300,       // Toast fade-out animation duration in ms
    SCROLL_THRESHOLD: 50        // Scroll Y position to trigger header shadow effect
};

