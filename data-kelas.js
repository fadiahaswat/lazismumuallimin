// File: data-kelas.js

// URL SAMA dengan santri, tapi nanti kita tambah parameter
const API_BASE_URL = "https://script.google.com/macros/s/AKfycbzW3fqMmvcHXSO15NM2kfNbd458JjB7NRuJE8Mirfv4R7eyRBDHeuEYmwLPYRJWyTA3/exec";

// Variabel global classMetaData (Awalnya kosong)
let classMetaData = {};

async function loadClassData() {
    try {
        console.log("Sedang mengambil data Wali Kelas & Musyrif...");
        
        // PENTING: Tambahkan ?type=kelas di ujung URL
        const response = await fetch(API_BASE_URL + "?type=kelas");
        
        if (!response.ok) throw new Error("Gagal koneksi ke spreadsheet kelas");

        const data = await response.json();

        // KONVERSI: Mengubah Array menjadi Object Key-Value
        // Dari: [{kelas: "1A", wali: "A", musyrif: "B"}, ...]
        // Jadi: { "1A": {wali: "A", musyrif: "B"}, ... }
        
        data.forEach(item => {
            classMetaData[item.kelas] = {
                wali: item.wali,
                musyrif: item.musyrif
            };
        });

        console.log("Data Kelas Berhasil Dimuat:", Object.keys(classMetaData).length, "kelas.");
        return classMetaData;

    } catch (error) {
        console.error("Gagal load data kelas:", error);
        return {};
    }
}
