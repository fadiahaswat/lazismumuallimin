// URL Web App dari Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbzW3fqMmvcHXSO15NM2kfNbd458JjB7NRuJE8Mirfv4R7eyRBDHeuEYmwLPYRJWyTA3/exec";

// Variabel global untuk menampung data
// Awalnya kosong, nanti akan terisi setelah data diambil dari spreadsheet
let santriData = [];

/**
 * Fungsi untuk mengambil data dari Google Spreadsheet
 * Fungsi ini bersifat ASYNC (butuh waktu tunggu)
 */
async function loadSantriData() {
    try {
        console.log("Sedang mengambil data santri...");
        const response = await fetch(API_URL);
        
        // Cek jika koneksi gagal
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Ubah data menjadi JSON
        const data = await response.json();
        
        // Simpan ke variabel global santriData
        santriData = data;
        
        console.log("Berhasil! Data termuat:", santriData.length, "santri.");
        return santriData;

    } catch (error) {
        console.error("Gagal mengambil data:", error);
        alert("Gagal memuat data santri. Pastikan internet lancar.");
        return [];
    }
}
