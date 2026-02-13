// config.js
// 
// SECURITY NOTICE:
// This file now imports configuration from env-config.js which supports
// environment variables. To use custom values:
// 1. Set window.ENV object before loading this module
// 2. Or use the default values provided in env-config.js
//
// For production deployments, consider setting up environment variables
// through your build process or deployment pipeline.

import {
    firebaseConfig,
    GAS_API_URL,
    RECAPTCHA_SITE_KEY,
    WORDPRESS_SITE,
    NEWS_PER_PAGE
} from './js/env-config.js';

// Re-export all configuration for backward compatibility
export { 
    firebaseConfig,
    GAS_API_URL,
    RECAPTCHA_SITE_KEY,
    WORDPRESS_SITE,
    NEWS_PER_PAGE
};

// --- KONFIGURASI LANGKAH WIZARD DONASI ---
export const STEP_TITLES = [
    {
        title: "Pilih Jenis Kebaikan",
        subtitle: "Niat Suci Dimulai"
    },
    {
        title: "Tentukan Nominal",
        subtitle: "Semoga Rezeki Berkah"
    },
    {
        title: "Isi Data Muzakki/Munfiq",
        subtitle: "Menyambung Silaturahmi"
    },
    {
        title: "Metode Pembayaran",
        subtitle: "Mudah dan Aman"
    },
    {
        title: "Konfirmasi Akhir",
        subtitle: "Menjemput Ridho-Nya"
    }
];

// --- DATABASE LINK GAMBAR QRIS ---
export const qrisDatabase = {
    'bni': {
        title: 'QRIS BNI',
        img: 'https://drive.google.com/thumbnail?id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt&sz=w1000', // Link Gambar Tampilan
        url: 'https://drive.google.com/uc?export=download&id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt' // Link Download
    },
    'bsi': {
        title: 'QRIS BSI',
        img: 'https://drive.google.com/thumbnail?id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V&sz=w1000',
        url: 'https://drive.google.com/uc?export=download&id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V'
    },
    'bpd': {
        title: 'QRIS BPD DIY',
        img: 'https://drive.google.com/thumbnail?id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm&sz=w1000',
        url: 'https://drive.google.com/uc?export=download&id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm'
    }
};
