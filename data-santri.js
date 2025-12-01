// URL Web App dari Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbzW3fqMmvcHXSO15NM2kfNbd458JjB7NRuJE8Mirfv4R7eyRBDHeuEYmwLPYRJWyTA3/exec";

// Variabel global santriData
let santriData = [];

/**
 * Fungsi Mengambil Data Santri dengan Sistem Caching (Local Storage)
 */
async function loadSantriData() {
    const CACHE_KEY = 'santri_data_cache';
    const CACHE_TIME_KEY = 'santri_data_time';
    const EXPIRY_HOURS = 24; // Data berlaku 24 jam

    // 1. Cek apakah ada cache yang valid di browser
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    const now = new Date().getTime();

    // Jika cache ada DAN belum kadaluwarsa (kurang dari 24 jam)
    if (cachedData && cachedTime && (now - cachedTime < EXPIRY_HOURS * 3600 * 1000)) {
        console.log("Mengambil data santri dari Cache (Hemat Kuota)...");
        try {
            santriData = JSON.parse(cachedData);
            return santriData;
        } catch (e) {
            console.warn("Cache rusak, akan download ulang.");
        }
    }

    // 2. Jika tidak ada cache atau sudah kadaluwarsa, ambil dari Server (GAS)
    try {
        console.log("Mengunduh data santri baru dari Server...");
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Update variabel global
        santriData = data;

        // 3. Simpan data baru ke Cache Browser
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CACHE_TIME_KEY, now);
            console.log("Data santri berhasil disimpan ke cache.");
        } catch (e) {
            console.warn("Penyimpanan penuh, gagal caching data.");
        }
        
        return santriData;

    } catch (error) {
        console.error("Gagal mengambil data:", error);
        
        // Fallback: Jika internet mati tapi ada cache lama (kadaluwarsa), pakai saja
        if (cachedData) {
            console.warn("Menggunakan data cache lama karena koneksi error.");
            santriData = JSON.parse(cachedData);
            return santriData;
        }
        
        alert("Gagal memuat data santri. Pastikan internet lancar.");
        return [];
    }
}
