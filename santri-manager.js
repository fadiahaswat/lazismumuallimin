// santri-manager.js

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
            if (key && key.startsWith('santri_pref_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data && data.linkedEmail === email) {
                        return key.replace('santri_pref_', '');
                    }
                } catch (error) {
                    console.error(`Failed to parse santri pref for key ${key}:`, error);
                    continue;
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
        const asrama = item.asrama || ""; // Ambil data asrama

        if (!rombel) return;

        const level = rombel.charAt(0);
        
        if (!santriDB[level]) santriDB[level] = {};
        if (!santriDB[level][rombel]) santriDB[level][rombel] = [];

        santriDB[level][rombel].push({ 
            nama, 
            nis, 
            rombel, 
            waliKhusus,   
            musyrifKhusus, 
            asrama // <-- JANGAN LUPA MASUKKAN KE SINI
        });
    });
    
    console.log("Database Santri Berhasil Disusun.");
}
