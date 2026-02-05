// Application-wide constants and configuration values

// Cache configuration
export const CACHE = {
    KEY: 'santri_data_cache',
    TIME_KEY: 'santri_data_time',
    EXPIRY_HOURS: 24,
    MILLISECONDS_PER_HOUR: 60 * 60 * 1000
};

// Zakat calculation constants
export const ZAKAT = {
    NISAB_TAHUN: 85685972,  // Nisab threshold for annual zakat
    RATE: 0.025,             // 2.5% zakat rate
    MIN_NOMINAL: 10000       // Minimum donation amount
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
