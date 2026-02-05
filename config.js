// config.js

// --- KONFIGURASI API & SERVER ---
// IMPORTANT: These API endpoints are intentionally public for client-side use.
// Security is enforced through:
// 1. Firebase Firestore Rules (see firestore.rules)
// 2. Google Apps Script server-side validation
// 3. Rate limiting on client-side
// 4. Bot detection mechanisms
export const GAS_API_URL = "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec";
export const WORDPRESS_SITE = 'lazismumuallimin.wordpress.com';
export const NEWS_PER_PAGE = 6;

// --- KONFIGURASI FIREBASE ---
// NOTE: Firebase client configuration is public by design.
// Security is enforced through Firestore security rules (see firestore.rules).
// DO NOT store sensitive data in client-accessible configuration.
export const firebaseConfig = {
    apiKey: "AIzaSyAWPIcS8h3kE6kJYBxjeVFdSprgrMzOFo8",
    authDomain: "lazismu-auth.firebaseapp.com",
    projectId: "lazismu-auth",
    storageBucket: "lazismu-auth.firebasestorage.app",
    messagingSenderId: "398570239500",
    appId: "1:398570239500:web:0b3e96109a4bf304ebe029"
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
