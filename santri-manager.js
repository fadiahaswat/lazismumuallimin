// santri-manager.js
import { donasiData } from './state.js';

export let santriDB = {};

export const SantriManager = {
    getKey: (nis) => `santri_pref_${nis}`,
    
    getPrefs: (nis) => {
        const data = localStorage.getItem(`santri_pref_${nis}`);
        return data ? JSON.parse(data) : { password: null, avatar: null, linkedEmail: null };
    },

    savePrefs: (nis, newPrefs) => {
        const current = SantriManager.getPrefs(nis);
        const updated = { ...current, ...newPrefs };
        localStorage.setItem(`santri_pref_${nis}`, JSON.stringify(updated));
        return updated;
    },

    findNisByEmail: (email) => {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('santri_pref_')) {
                const data = JSON.parse(localStorage.getItem(key));
                if (data.linkedEmail === email) {
                    return key.replace('santri_pref_', '');
                }
            }
        }
        return null;
    }
};

export function parseSantriData() {
    // Assumes santriData is global (window.santriData) loaded via script tag
    if (typeof window.santriData === 'undefined' || !Array.isArray(window.santriData)) return;

    santriDB = {}; 

    window.santriData.forEach(item => {
        const rombel = item.kelas || item.rombel || ""; 
        const nis = item.nis || "";
        const nama = item.nama || "";
        
        const waliKhusus = item.wali_khusus || "";
        const musyrifKhusus = item.musyrif_khusus || "";

        if (!rombel) return;

        const level = rombel.charAt(0);
        
        if (!santriDB[level]) santriDB[level] = {};
        if (!santriDB[level][rombel]) santriDB[level][rombel] = [];

        santriDB[level][rombel].push({ 
            nama, 
            nis, 
            rombel, 
            waliKhusus,   
            musyrifKhusus 
        });
    });
    
    console.log("Database Santri Berhasil Disusun.");
}
