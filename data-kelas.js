// File: data-kelas.js
import { GAS_SANTRI_API_URL } from './config.js';

// [PERBAIKAN] Gunakan window.classMetaData
window.classMetaData = {};

async function loadClassData() {
    try {
        console.log("Sedang mengambil data Wali Kelas & Musyrif...");
        
        const response = await fetch(GAS_SANTRI_API_URL + "?type=kelas");
        
        if (!response.ok) throw new Error("Gagal koneksi ke spreadsheet kelas");

        const data = await response.json();

        // [PERBAIKAN] Update variabel window langsung
        // Reset dulu biar bersih
        window.classMetaData = {};

        data.forEach(item => {
            window.classMetaData[item.kelas] = {
                wali: item.wali,
                musyrif: item.musyrif
            };
        });

        console.log("Data Kelas Berhasil Dimuat:", Object.keys(window.classMetaData).length, "kelas.");
        return window.classMetaData;

    } catch (error) {
        console.error("Gagal load data kelas:", error);
        return {};
    }
}

// [PERBAIKAN] Ekspos fungsi ke global window
window.loadClassData = loadClassData;
