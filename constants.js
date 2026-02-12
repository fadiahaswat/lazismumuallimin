// Application-wide constants and configuration values

// Cache configuration
export const CACHE = {
    KEY: 'santri_data_cache',
    TIME_KEY: 'santri_data_time',
    EXPIRY_HOURS: 24,
    MILLISECONDS_PER_HOUR: 60 * 60 * 1000
};

// Zakat calculation constants
// Updated based on SK Lazismu Wilayah DIY No. 005.BP/KEP/II.19/B/2026
export const ZAKAT = {
    NISAB_TAHUN: 171912500,  // Nisab threshold: 85 gram x Rp 2.022.500 = Rp 171.912.500
    RATE: 0.025,             // 2.5% zakat rate
    MIN_NOMINAL: 10000,      // Minimum donation amount
    FITRAH: 40000,           // Update 2026: Rp 40.000/jiwa (range Rp 35.000-40.000)
    FIDYAH: 50000            // Update 2026: Rp 50.000/hari (makanan siap saji, range Rp 30.000-50.000)
};

// Donation limits
export const DONATION = {
    MAX_AMOUNT: 10000000,    // Maximum donation amount per transaction (10 million IDR)
    WA_CONTACT: '6281196961918'  // WhatsApp contact for donations above limit
};

// Form validation constants
export const VALIDATION = {
    MIN_PHONE_LENGTH: 10,    // Minimum phone number length
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,  // Basic email validation pattern
    PHONE_PATTERN: /^[0-9+\-\s()]+$/  // Allow digits, +, -, spaces, and parentheses
};

// Animation and UI timing (in milliseconds)
export const DELAYS = {
    PRELOADER: 50,
    DOM_READY: 100,          // Wait for DOM to be ready
    CASCADE_SELECT: 200,     // Wait for cascading select options to populate
    MODAL_TRANSITION: 200,
    TOAST: 500,
    LOADING_TEXT: 800
};

// Loading text messages
export const LOADING_TEXTS = [
    "Menghubungkan ke Server...",
    "Mengambil Data Santri...",
    "Menyiapkan Data Kelas...",
    "Hampir Selesai..."
];
