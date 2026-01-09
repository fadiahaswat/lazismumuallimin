// ============================================================================
// LAZISMU MU'ALLIMIN - DONATION MANAGEMENT SYSTEM
// Refactored for Better Performance & Maintainability
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ============================================================================
// 1. CONFIGURATION
// ============================================================================
const CONFIG = {
    GAS_API_URL: "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec",
    WORDPRESS_SITE: 'lazismumuallimin.wordpress.com',
    NEWS_PER_PAGE: 6,
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyAWPIcS8h3kE6kJYBxjeVFdSprgrMzOFo8",
        authDomain: "lazismu-auth.firebaseapp.com",
        projectId: "lazismu-auth",
        storageBucket: "lazismu-auth.firebasestorage.app",
        messagingSenderId: "398570239500",
        appId: "1:398570239500:web:0b3e96109a4bf304ebe029"
    }
};

// ============================================================================
// 2. STATE MANAGEMENT
// ============================================================================
const STATE = {
    currentUser: null,
    donasi: {
        type: null,
        subType: null,
        nominal: 0,
        nominalAsli: 0,
        nominalTotal: 0,
        kodeUnik: 0,
        donaturTipe: 'santri',
        isAlumni: false,
        alumniTahun: '',
        namaSantri: '',
        nisSantri: '',
        rombelSantri: '',
        nama: '',
        hp: '',
        email: '',
        alamat: '',
        doa: '',
        metode: null,
        nik: ''
    },
    riwayat: {
        allData: [],
        isLoaded: false,
        currentPage: 1,
        itemsPerPage: 10,
        isLoading: false
    },
    news: {
        page: 1,
        category: '',
        search: '',
        posts: [],
        isLoading: false,
        hasMore: true,
        isLoaded: false
    },
    timeFilterState: 'all',
    santriDB: {},
    myDonations: []
};

// Create aliases for backward compatibility
let currentUser = null;
const donasiData = STATE.donasi;
const riwayatData = STATE.riwayat;
const newsState = STATE.news;
let timeFilterState = STATE.timeFilterState;
let santriDB = STATE.santriDB;
let myDonations = STATE.myDonations;

// ============================================================================
// 3. FIREBASE INITIALIZATION
// ============================================================================
const app = initializeApp(CONFIG.FIREBASE_CONFIG);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ============================================================================
// 4. SANTRI MANAGER (Local Storage)
// ============================================================================
const SantriManager = {
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

// ============================================================================
// 5. UTILITY FUNCTIONS
// ============================================================================
const Utils = {
    formatRupiah: (num) => "Rp " + parseInt(num).toLocaleString('id-ID'),
    
    timeAgo: (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " thn lalu";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " bln lalu";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " hr lalu";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " jam lalu";
        interval = seconds / 60;
        return interval > 1 ? Math.floor(interval) + " mnt lalu" : "Baru saja";
    },
    
    escapeHtml: (text) => {
        if (!text) return text;
        const map = { '&': "&amp;", '<': "&lt;", '>': "&gt;", '"': "&quot;", "'": "&#039;" };
        return text.replace(/[&<>"']/g, m => map[m]);
    },
    
    animateValue: (obj, start, end, duration, isCurrency = false) => {
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const val = Math.floor(progress * (end - start) + start);
            obj.innerHTML = isCurrency ? Utils.formatRupiah(val) : val;
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    },
    
    generateUniqueCode: () => Math.floor(Math.random() * 999) + 1,
    
    showToast: (message, type = 'warning') => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const iconMap = {
            success: 'fa-check-circle text-green-500',
            error: 'fa-times-circle text-red-500',
            warning: 'fa-exclamation-triangle text-orange-500'
        };

        const icon = iconMap[type] || iconMap.warning;
        toast.innerHTML = `<i class="fas ${icon} text-xl"></i><span class="font-bold text-sm text-slate-700">${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    copyText: (text) => {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                Utils.showToast(`Berhasil disalin: ${text}`, 'success');
            }).catch(() => Utils.fallbackCopy(text));
        } else {
            Utils.fallbackCopy(text);
        }
    },
    
    fallbackCopy: (text) => {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            Utils.showToast(`Berhasil disalin: ${text}`, 'success');
        } catch {
            Utils.showToast('Gagal menyalin', 'error');
        }
        document.body.removeChild(textarea);
    }
};

// Create backward compatible aliases
const formatRupiah = Utils.formatRupiah;
const timeAgo = Utils.timeAgo;
const escapeHtml = Utils.escapeHtml;
const animateValue = Utils.animateValue;
const generateUniqueCode = Utils.generateUniqueCode;
const showToast = Utils.showToast;
const copyText = Utils.copyText;

// ============================================================================
// 6. AUTH HANDLERS
// ============================================================================
window.doLogin = async function() {
    const modal = document.getElementById('login-modal');
    if(modal) modal.classList.remove('hidden');
}

window.closeLoginModal = function() {
    const modal = document.getElementById('login-modal');
    if(modal) modal.classList.add('hidden');
}

window.loginWithGoogle = async function() {
    closeLoginModal();
    const label = document.getElementById('label-login');
    if(label) label.innerText = "Memproses...";

    try {
        const result = await signInWithPopup(auth, googleProvider);
        const googleUser = result.user;
        
        // 1. CEK APAKAH EMAIL INI TERHUBUNG DENGAN NIS?
        const linkedNIS = SantriManager.findNisByEmail(googleUser.email);

        if (linkedNIS) {
            // JIKA YA: Login sebagai Santri (Bukan User Google Biasa)
            const santri = santriData.find(s => String(s.nis) === String(linkedNIS));
            if (santri) {
                const prefs = SantriManager.getPrefs(linkedNIS);
                const mockUser = {
                    uid: "nis_" + santri.nis,
                    displayName: santri.nama,
                    email: googleUser.email, // Pakai email google
                    photoURL: prefs.avatar || googleUser.photoURL, // Prioritas Avatar Santri
                    isSantri: true,
                    rombel: santri.kelas || santri.rombel,
                    nis: santri.nis,
                    linkedEmail: googleUser.email
                };
                
                // Simpan sesi santri, abaikan sesi firebase murni
                localStorage.setItem('lazismu_user_santri', JSON.stringify(mockUser));
                updateUIForLogin(mockUser);
                showToast(`Login via Google berhasil (Terhubung ke NIS ${linkedNIS})`, 'success');
                return; 
            }
        }

        // JIKA TIDAK: Login sebagai User Google Biasa (Default Firebase)
        console.log("Login Google Biasa:", googleUser.displayName);
        // onAuthStateChanged akan menangani sisanya

    } catch (error) {
        console.error(error);
        showToast("Gagal login Google", 'error');
    } finally {
        if(label) label.innerText = "Masuk Akun";
    }
}

window.loginWithNIS = function() {
    const nisInput = document.getElementById('login-nis').value.trim();
    const passInput = document.getElementById('login-pass').value.trim();

    if (!nisInput || !passInput) return showToast("Mohon isi NIS dan Password", "warning");

    if (typeof santriData === 'undefined' || santriData.length === 0) {
        return showToast("Data Santri sedang dimuat...", "warning");
    }

    // 1. Cari Data Santri Asli
    const santri = santriData.find(s => String(s.nis) === String(nisInput));

    if (santri) {
        // 2. Ambil Preferensi Lokal (Password Custom dll)
        const prefs = SantriManager.getPrefs(santri.nis);
        
        // 3. Logika Password: Cek Custom dulu, kalau tidak ada baru cek Default (NIS)
        const validPassword = prefs.password ? (prefs.password === passInput) : (String(santri.nis) === passInput);

        if (validPassword) {
            // LOGIN SUKSES
            
            // Generate Avatar (Prioritas: Custom > UI Avatars)
            const avatarUrl = prefs.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(santri.nama)}&background=10b981&color=fff`;

            const mockUser = {
                uid: "nis_" + santri.nis,
                displayName: santri.nama,
                email: santri.nis + "@santri.muallimin", 
                photoURL: avatarUrl,
                isSantri: true, 
                rombel: santri.kelas || santri.rombel,
                nis: santri.nis,
                linkedEmail: prefs.linkedEmail // Info email google yg terhubung
            };

            localStorage.setItem('lazismu_user_santri', JSON.stringify(mockUser));
            updateUIForLogin(mockUser);
            
            // [TAMBAHAN BARU] Render Kartu Profil
            renderDashboardProfil(santri.nis); 
            // -----------------------------------

            closeLoginModal();
            showToast(`Ahlan Wa Sahlan, ${santri.nama.split(' ')[0]}!`, 'success');

        } else {
            showToast("Password salah.", "error");
        }
    } else {
        showToast("NIS tidak ditemukan", "error");
    }
}

window.doLogout = function() {
    // 1. Logout Firebase
    signOut(auth).then(() => {
        // 2. Logout Santri (Hapus Storage)
        localStorage.removeItem('lazismu_user_santri');
        
        showToast("Berhasil keluar", 'success');
        
        // 3. Reset UI & Redirect
        updateUIForLogout(); // Panggil fungsi reset UI manual biar instan
        window.location.hash = "#home";
        window.location.replace(window.location.pathname + "#home");
        window.location.reload();
    });
}

// ============================================================================
// 7. UI & NAVIGATION
// ============================================================================
function updateUIForLogin(user) {
    STATE.currentUser = user; 

    // 1. UI Header & Menu (Logika Tampilan)
    const btnWrapper = document.getElementById('login-btn-wrapper');
    const profileMenu = document.getElementById('user-profile-menu');
    const santriMenu = document.getElementById('santri-menu-options');
    const googleIndicator = document.getElementById('google-linked-indicator');

    if (btnWrapper) btnWrapper.style.display = 'none';
    if (profileMenu) {
        profileMenu.classList.remove('hidden');
        profileMenu.classList.add('flex');
    }
    if (santriMenu) {
        user.isSantri ? santriMenu.classList.remove('hidden') : santriMenu.classList.add('hidden');
    }
    if (googleIndicator) {
        (user.linkedEmail || (user.providerData && user.providerData.length > 0)) ? googleIndicator.classList.remove('hidden') : googleIndicator.classList.add('hidden');
    }

    // Update Header Text & Avatar
    if(document.getElementById('user-avatar')) document.getElementById('user-avatar').src = user.photoURL;
    if(document.getElementById('user-name')) document.getElementById('user-name').textContent = user.displayName;
    if(document.getElementById('user-role')) document.getElementById('user-role').textContent = user.isSantri ? `Santri - ${user.rombel}` : "Donatur Umum";
    if(document.getElementById('mobile-user-name')) document.getElementById('mobile-user-name').textContent = user.displayName;
    if(document.getElementById('mobile-user-role')) document.getElementById('mobile-user-role').textContent = user.isSantri ? `Santri - ${user.rombel}` : "Donatur Umum";
    if(document.getElementById('dash-avatar')) document.getElementById('dash-avatar').src = user.photoURL;
    if(document.getElementById('dash-name')) document.getElementById('dash-name').innerText = user.displayName.split(' ')[0];

    // 2. LOGIKA AUTO-FILL FORM DONASI (STEP 3)
    const inputNama = document.getElementById('nama-muzakki-input');
    const inputEmail = document.getElementById('email');
    
    // Auto Isi Nama & Email (Default)
    if(inputNama) inputNama.value = user.displayName;
    if(inputEmail) {
        if (!user.isSantri) { 
            inputEmail.value = user.email;
            inputEmail.readOnly = true;
            inputEmail.classList.add('bg-slate-100', 'text-slate-500');
        } else {
            if (user.linkedEmail) inputEmail.value = user.linkedEmail;
            inputEmail.readOnly = false;
            inputEmail.classList.remove('bg-slate-100', 'text-slate-500');
        }
    }

    // --- LOGIKA HIERARKI SANTRI (LEVEL -> ROMBEL -> NAMA) ---
    if (user.isSantri) {
        // A. Pastikan Variabel Global Terisi
        donasiData.donaturTipe = 'santri';
        donasiData.nisSantri = user.nis;
        donasiData.rombelSantri = user.rombel;
        // Nama santri nanti diisi setelah pencocokan database di bawah

        // B. Set Radio Button & Tampilkan Detail
        const radioSantri = document.querySelector('input[name="donatur-tipe"][value="santri"]');
        if (radioSantri) {
            radioSantri.checked = true;
            const santriDetails = document.getElementById('santri-details');
            if (santriDetails) santriDetails.classList.remove('hidden');
        }

        // C. Populate Dropdowns (Hierarki)
        const levelSelect = document.getElementById('santri-level-select');
        const rombelSelect = document.getElementById('santri-rombel-select');
        const namaSelect = document.getElementById('santri-nama-select');
        
        // 1. TENTUKAN LEVEL (Ambil angka pertama dari Rombel, misal "1A" -> "1")
        const currentLevel = user.rombel.charAt(0); 

        // Isi Dropdown Level
        if (levelSelect) {
            levelSelect.value = currentLevel;
        }

        // 2. ISI ROMBEL (Berdasarkan Level)
        if (rombelSelect && typeof santriDB !== 'undefined' && santriDB[currentLevel]) {
            let rombelHtml = '<option value="">Pilih Rombel</option>';
            // Loop keys dari santriDB (nama-nama kelas)
            Object.keys(santriDB[currentLevel]).forEach(r => {
                rombelHtml += `<option value="${r}">${r}</option>`;
            });
            rombelSelect.innerHTML = rombelHtml;
            rombelSelect.disabled = false;
            
            // Pilih Rombel User
            rombelSelect.value = user.rombel;
        }

        // 3. ISI NAMA (Berdasarkan Rombel -> Cari NIS yang cocok)
        if (namaSelect && typeof santriDB !== 'undefined' && santriDB[currentLevel] && santriDB[currentLevel][user.rombel]) {
            let namaHtml = '<option value="">Pilih Nama Santri</option>';
            let exactValueToSelect = "";
            let exactName = user.displayName; // Default fallback

            // Loop semua siswa di kelas tersebut
            santriDB[currentLevel][user.rombel].forEach(s => {
                // Format Value Dropdown: Nama::NIS::Rombel
                const val = `${s.nama}::${s.nis}::${s.rombel}`;
                namaHtml += `<option value="${val}">${s.nama}</option>`;

                // CEK APAKAH INI SISWA YANG LOGIN? (Cek pakai NIS biar akurat 100%)
                if (String(s.nis) === String(user.nis)) {
                    exactValueToSelect = val;
                    exactName = s.nama; // Ambil nama persis dari database
                }
            });

            namaSelect.innerHTML = namaHtml;
            namaSelect.disabled = false;
            
            // PILIH NAMA YANG SESUAI
            if (exactValueToSelect) {
                namaSelect.value = exactValueToSelect;
                
                // Update Global Variable dengan Nama yang Benar dari Database
                donasiData.namaSantri = exactName;
            }
        }

        // D. Kunci Form Nama Muzakki
        const radioName = document.querySelector('input[name="nama-choice"][value="santri"]');
        if (radioName) {
            radioName.disabled = false; 
            radioName.checked = true;   
        }

        if (inputNama) {
            // Gunakan nama dari donasiData agar konsisten
            inputNama.value = `A/n Santri: ${donasiData.namaSantri || user.displayName}`;
            inputNama.readOnly = true;
            inputNama.classList.add('bg-slate-100', 'text-slate-500'); 
        }
    }

    // 3. Load Data Dashboard & Lainnya
    const suggestionCard = document.getElementById('login-suggestion-card');
    if (suggestionCard) suggestionCard.classList.add('hidden');
    
    const dashboardId = user.linkedEmail || user.email || user.uid;
    if (typeof loadPersonalDashboard === 'function') {
        loadPersonalDashboard(dashboardId);
        if (window.location.hash === '#dashboard') {
            loadPersonalDashboard(dashboardId);
        }
    }

    // 4. Render Profil (Jika fungsi tersedia)
    if (user.isSantri && user.nis && typeof renderDashboardProfil === 'function') {
        renderDashboardProfil(user.nis);
    }
}

function updateUIForLogout() {
    STATE.currentUser = null;

    const btnWrapper = document.getElementById('login-btn-wrapper');
    const profileMenu = document.getElementById('user-profile-menu');
    
    if (btnWrapper) btnWrapper.style.display = 'block';
    if (profileMenu) {
        profileMenu.classList.add('hidden');
        profileMenu.classList.remove('flex');
    }

    // Reset Label Tombol Login (jika sebelumnya "Memproses...")
    const label = document.getElementById('label-login');
    if(label) label.innerText = "Masuk Akun";

    // Reset Form
    const inputNama = document.getElementById('nama-muzakki-input');
    const inputEmail = document.getElementById('email');
    if(inputNama) inputNama.value = '';
    if(inputEmail) {
        inputEmail.value = '';
        inputEmail.readOnly = false;
        inputEmail.classList.remove('bg-slate-100', 'text-slate-500');
    }
}

// ============================================================================
// 8. DATA LOADING & PARSING
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    console.log("Memulai inisialisasi aplikasi...");

    // A. JALANKAN TEKS LOADING BERJALAN (Biar ga bosen nunggu)
    const loadingTexts = [
        "Menghubungkan ke Server...",
        "Mengambil Data Santri...",
        "Menyiapkan Data Kelas...",
        "Hampir Selesai..."
    ];
    let textIdx = 0;
    const textInterval = setInterval(() => {
        const textEl = document.getElementById('loader-text');
        if (textEl) {
            textIdx = (textIdx + 1) % loadingTexts.length;
            textEl.innerText = loadingTexts[textIdx];
        }
    }, 800); // Ganti teks setiap 0.8 detik

    // B. PROSES AMBIL DATA (YANG BIKIN LAMA)
    try {
        const promises = [];
        if (typeof loadSantriData === 'function') promises.push(loadSantriData());
        if (typeof loadClassData === 'function') promises.push(loadClassData());

        // Tunggu semua data selesai didownload
        await Promise.all(promises);

        // Cek Hasil Data
        if (typeof santriData !== 'undefined' && santriData.length > 0) {
            console.log("Data Santri OK:", santriData.length);
            parseSantriData();
          // === [MULAI PERBAIKAN] ===
            // Tambahkan kode ini tepat setelah parseSantriData()
            // Tujuannya: Jika user sudah login duluan sebelum data siap, 
            // kita refresh UI-nya sekarang karena data sudah ada.
            if (currentUser && currentUser.isSantri) {
                console.log("Database siap, memperbarui data formulir user...");
                updateUIForLogin(currentUser);
            }
            // === [AKHIR PERBAIKAN] ===
        } else {
            console.warn("Data santri kosong/gagal dimuat.");
        }

        if (typeof classMetaData !== 'undefined' && Object.keys(classMetaData).length > 0) {
            console.log("Data Wali Kelas OK.");
        }

        // Jalankan Fungsi Lain
        setupNavigation();
        setupWizardLogic();
        setupHistoryLogic();
        setupModalLogic();
        setupRekapLogic();
        handleInitialLoad();
        fetchNewsCategories();

    } catch (error) {
        console.error("Terjadi kesalahan fatal:", error);
        alert("Gagal memuat data. Silakan refresh halaman.");
    } finally {
        // C. HILANGKAN LOADING SCREEN (SUKSES ATAU GAGAL TETAP HILANG)
        clearInterval(textInterval); // Stop ganti teks
        
        const preloader = document.getElementById('app-preloader');
        if (preloader) {
            // Ubah teks terakhir jadi "Selesai!"
            const textEl = document.getElementById('loader-text');
            if(textEl) textEl.innerText = "Selesai!";

            // Kasih jeda dikit biar smooth
            setTimeout(() => {
                preloader.classList.add('fade-out'); // Efek memudar (CSS)
                
                // Hapus dari HTML setelah efek pudar selesai (0.5 detik)
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 500);
            }, 500);
        }
    }
}

// ============================================================================
// 9. SANTRI DATA PARSING
// ============================================================================
let santriDB = {};

function parseSantriData() {
    if (typeof santriData === 'undefined' || !Array.isArray(santriData)) return;

    santriDB = {}; // Reset database lokal

    santriData.forEach(item => {
        // Ambil data dasar
        const rombel = item.kelas || item.rombel || ""; 
        const nis = item.nis || "";
        const nama = item.nama || "";
        
        // AMBIL DATA KHUSUS (OVERRIDE)
        const waliKhusus = item.wali_khusus || "";
        const musyrifKhusus = item.musyrif_khusus || "";

        if (!rombel) return;

        const level = rombel.charAt(0);
        
        // Buat struktur object jika belum ada
        if (!santriDB[level]) santriDB[level] = {};
        if (!santriDB[level][rombel]) santriDB[level][rombel] = [];

        // Simpan data lengkap ke database
        santriDB[level][rombel].push({ 
            nama, 
            nis, 
            rombel, 
            waliKhusus,   // Simpan info wali khusus
            musyrifKhusus // Simpan info musyrif khusus
        });
    });
    
    console.log("Database Santri Berhasil Disusun.");
}

// ============================================================================
// 10. NAVIGATION & PAGE HANDLING
// ============================================================================
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(p => {
        p.style.display = 'none';
        p.style.opacity = 0;
        p.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    const target = document.getElementById(`page-${pageId}`);
    if (target) {
        target.style.display = 'block';
        void target.offsetWidth;
        target.style.opacity = 1;
        target.classList.add('active');
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    const navLink = document.querySelector(`a[href="#${pageId}"]`);
    if (navLink) navLink.classList.add('active');

    if (pageId === 'riwayat' || pageId === 'home') loadRiwayat();
    if (pageId === 'berita') {
        if (!newsState.isLoaded) fetchNews();
    }
}

function scrollToSection(sectionId) {
    showPage('home');
    setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 500);
}

// WAJIB DITAMBAHKAN:
window.scrollToSection = scrollToSection;

function handleInitialLoad() {
    const hash = window.location.hash.replace('#', '') || 'home';
    if (document.getElementById(`page-${hash}`)) {
        showPage(hash);
    } else {
        showPage('home');
    }
}

function setupNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const menuLinks = document.getElementById('menu-links');
    if (menuToggle && menuLinks) {
        menuToggle.onclick = () => {
            menuLinks.classList.toggle('hidden');
        };
    }
}

function setupModalLogic() {
    const modal = document.getElementById('hubungi-modal');
    const btn = document.getElementById('btn-hubungi-hero');
    const close = document.getElementById('hubungi-modal-close');

    if (btn) btn.onclick = () => modal.classList.remove('hidden');
    if (close) close.onclick = () => modal.classList.add('hidden');

    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        }
    }
}

// ============================================================================
// 11. DONATION WIZARD LOGIC
// ============================================================================
const STEP_TITLES = [{
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

function updateStepTitle(step) {
    const titleEl = document.getElementById('wizard-title');
    const subEl = document.getElementById('wizard-subtitle');
    const data = STEP_TITLES[step - 1];
    if (data && titleEl && subEl) {
        titleEl.innerText = data.title;
        subEl.innerText = data.subtitle;
    }
}

function goToStep(step) {
    document.querySelectorAll('.donasi-step-container').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`donasi-step-${step}`);
    if (target) {
        target.classList.remove('hidden');
        target.classList.remove('animate-fade-in-up');
        void target.offsetWidth;
        target.classList.add('animate-fade-in-up');
    }
    if (step === 3) {
          const suggestionCard = document.getElementById('login-suggestion-card');
          
          // Hanya munculkan jika: Card ada DAN User belum login (currentUser null)
          if (suggestionCard && !currentUser) {
              suggestionCard.classList.remove('hidden');
          } else if (suggestionCard) {
              suggestionCard.classList.add('hidden');
          }
    }

    const indicator = document.getElementById('wizard-step-indicator');
    const bar = document.getElementById('wizard-progress-bar');

    if (indicator) indicator.innerText = `Step ${step}/5`;
    if (bar) bar.style.width = `${step * 20}%`;

    updateStepTitle(step);

    const wizard = document.getElementById('donasi-wizard');
    if (wizard) wizard.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// Logika utama untuk setiap langkah formulir donasi
function setupWizardLogic() {
    // --- LANGKAH 1: Pilih Jenis Donasi (UPDATED FOR NEW DESIGN) ---
    document.querySelectorAll('.choice-button').forEach(btn => {
        btn.onclick = () => {
            // 1. Reset Visual Semua Tombol (Hilangkan Border & BG Active)
            document.querySelectorAll('.choice-button').forEach(b => {
                b.classList.remove('active'); // Hapus class active
                // Hapus warna border/bg spesifik saat aktif
                b.classList.remove('border-emerald-500', 'bg-emerald-50');
                b.classList.remove('border-amber-500', 'bg-amber-50');
                b.classList.remove('border-orange-500', 'bg-orange-50');
                // Kembalikan ke border default
                b.classList.add('border-slate-100'); 
            });

            // 2. Set Active State pada Tombol yang Diklik
            btn.classList.add('active'); // Trigger opacity checkmark via CSS group-[.active]
            btn.classList.remove('border-slate-100'); // Hapus border default

            // 3. Tambahkan Warna Spesifik Sesuai Tipe
            const type = btn.dataset.type;
          
          // [TAMBAHAN WAJIB] Reset Nominal & Input saat ganti jenis
            donasiData.nominal = 0;
            donasiData.nominalAsli = 0; // Penting untuk logika kode unik
            const inputCustom = document.getElementById('nominal-custom');
            if(inputCustom) inputCustom.value = ''; // Kosongkan tampilan input
            document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected')); // Hapus seleksi tombol
          
            if (type === 'Zakat Fitrah') {
                btn.classList.add('border-emerald-500', 'bg-emerald-50');
            } else if (type === 'Zakat Maal') {
                btn.classList.add('border-amber-500', 'bg-amber-50');
            } else if (type === 'Infaq') {
                btn.classList.add('border-orange-500', 'bg-orange-50');
            }

            // 4. Update Data Logic
            donasiData.type = type;
            donasiData.subType = null;

            const infaqOpts = document.getElementById('infaq-options');
            const zakatFitrah = document.getElementById('zakat-fitrah-checker');
            const zakatMaal = document.getElementById('zakat-maal-checker');
            const step1Nav = document.getElementById('step-1-nav-default');

            // Hide All Sections
            if (infaqOpts) infaqOpts.classList.add('hidden');
            if (zakatFitrah) zakatFitrah.classList.add('hidden');
            if (zakatMaal) zakatMaal.classList.add('hidden');
            if (step1Nav) step1Nav.classList.add('hidden');

            // Show Specific Section
            if (type === 'Infaq' && infaqOpts) {
                infaqOpts.classList.remove('hidden');
                // Reset visual sub-choices saat pindah ke Infaq
                document.querySelectorAll('.sub-choice-button').forEach(b => {
                    b.classList.remove('active', 'border-rose-500', 'bg-rose-50', 'border-sky-500', 'bg-sky-50', 'border-violet-500', 'bg-violet-50');
                    b.classList.add('border-slate-200');
                });
            } 
            else if (type === 'Zakat Fitrah' && zakatFitrah) {
                zakatFitrah.classList.remove('hidden');
                if(step1Nav) step1Nav.classList.remove('hidden'); // Fitrah langsung bisa lanjut
            } 
            else if (type === 'Zakat Maal' && zakatMaal) {
                zakatMaal.classList.remove('hidden');
                // Maal butuh kalkulator dulu, tombol lanjut ada di kalkulator
            }
        };
    });

    // --- Sub-Pilihan Infaq (UPDATED FOR NEW DESIGN) ---
    document.querySelectorAll('.sub-choice-button').forEach(btn => {
        btn.onclick = () => {
            // 1. Reset Visual Sub-Buttons
            document.querySelectorAll('.sub-choice-button').forEach(b => {
                b.classList.remove('active');
                b.classList.remove('border-rose-500', 'bg-rose-50');
                b.classList.remove('border-sky-500', 'bg-sky-50');
                b.classList.remove('border-violet-500', 'bg-violet-50');
                b.classList.add('border-slate-200');
            });

            // 2. Set Active State
            btn.classList.add('active');
            btn.classList.remove('border-slate-200');

            // 3. Tambahkan Warna Spesifik Sub-Tipe
            const subType = btn.dataset.typeInfaq;
            if (subType.includes('Kampus')) btn.classList.add('border-rose-500', 'bg-rose-50');
            else if (subType.includes('Beasiswa')) btn.classList.add('border-sky-500', 'bg-sky-50');
            else if (subType.includes('Umum')) btn.classList.add('border-violet-500', 'bg-violet-50');

            // 4. Update Data
            donasiData.subType = subType;
            
            // 5. Show Next Button
            const step1Nav = document.getElementById('step-1-nav-default');
            if (step1Nav) step1Nav.classList.remove('hidden');
        };
    });

    // --- LANGKAH 2: Tentukan Nominal (LOGIKA TOMBOL PRESET) ---
    document.querySelectorAll('.nominal-btn').forEach(btn => {
        btn.onclick = () => {
            // 1. Visual: Hapus seleksi lama, tambahkan ke yang baru
            document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            // 2. Ambil data angka dari tombol
            donasiData.nominal = parseInt(btn.dataset.nominal);
            donasiData.nominalAsli = donasiData.nominal;
            
            // 3. Masukkan ke Input Custom (PERBAIKAN DI SINI)
            const customInput = document.getElementById('nominal-custom');
            if (customInput) {
                // GANTI: customInput.value = formatRupiah(donasiData.nominal);
                // MENJADI: Gunakan toLocaleString agar hanya angka dan titik (100.000)
                customInput.value = donasiData.nominal.toLocaleString('id-ID');
            }
        };
    });

    // --- PERBAIKAN: Input Nominal Custom ---
    const nominalCustom = document.getElementById('nominal-custom');
    if (nominalCustom) {
        nominalCustom.addEventListener('input', function() {
            // 1. Ambil hanya angkanya
            let val = this.value.replace(/\D/g, '');
            
            // 2. Simpan ke data
            donasiData.nominal = parseInt(val) || 0;
            donasiData.nominalAsli = donasiData.nominal;
            
            // 3. Tampilkan KEMBALI ke input HANYA ANGKA + TITIK (Tanpa Rp)
            if (val === '') {
                this.value = '';
            } else {
                // Menggunakan toLocaleString('id-ID') agar muncul titik ribuan (Contoh: 100.000)
                this.value = donasiData.nominal.toLocaleString('id-ID');
            }
            
            // Hapus seleksi tombol preset jika user mengetik
            document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
        });
    }
  
    const btnNextStep3 = document.querySelector('[data-next-step="3"]');
    if (btnNextStep3) {
        btnNextStep3.onclick = () => {
            if (donasiData.nominal < 1000) showToast("Nominal minimal Rp 1.000");
            else goToStep(3);
        };
    }

    // --- LANGKAH 3: Isi Data Muzakki ---
    const santriLevel = document.getElementById('santri-level-select');
    const santriRombel = document.getElementById('santri-rombel-select');
    const santriNama = document.getElementById('santri-nama-select');

    if (santriLevel) {
        santriLevel.onchange = () => {
            if (santriRombel) {
                santriRombel.innerHTML = '<option value="">Rombel</option>';
                santriRombel.disabled = true;
            }
            if (santriNama) {
                santriNama.innerHTML = '<option value="">Pilih Nama Santri</option>';
                santriNama.disabled = true;
            }

            const lvl = santriLevel.value;
            if (lvl && santriDB[lvl]) {
                Object.keys(santriDB[lvl]).forEach(r => {
                    if (santriRombel) santriRombel.innerHTML += `<option value="${r}">${r}</option>`;
                });
                if (santriRombel) santriRombel.disabled = false;
            }
        };
    }

    if (santriRombel) {
        santriRombel.onchange = () => {
            if (santriNama) {
                santriNama.innerHTML = '<option value="">Pilih Nama Santri</option>';
                santriNama.disabled = true;
            }

            const lvl = santriLevel.value;
            const rmb = santriRombel.value;
            if (lvl && rmb && santriDB[lvl][rmb]) {
                santriDB[lvl][rmb].forEach(s => {
                    if (santriNama) santriNama.innerHTML += `<option value="${s.nama}::${s.nis}::${s.rombel}">${s.nama}</option>`;
                });
                if (santriNama) santriNama.disabled = false;
            }
        };
    }

    if (santriNama) {
        santriNama.onchange = () => {
            if (santriNama.value) {
                const [nama, nis, rombel] = santriNama.value.split('::');
                donasiData.namaSantri = nama;
                donasiData.nisSantri = nis;
                donasiData.rombelSantri = rombel;

                const radioAnSantri = document.getElementById('radio-an-santri');
                if (radioAnSantri) {
                    radioAnSantri.disabled = false;
                    if (radioAnSantri.checked) {
                        const nameInput = document.getElementById('nama-muzakki-input');
                        if (nameInput) nameInput.value = `A/n Santri: ${nama}`;
                    }
                }
            }
        };
    }

    document.querySelectorAll('input[name="donatur-tipe"]').forEach(r => {
        r.onchange = (e) => {
            donasiData.donaturTipe = e.target.value;
            const santriDetails = document.getElementById('santri-details');
            const alumniInput = document.getElementById('input-alumni-tahun');
            const radioAnSantri = document.getElementById('radio-an-santri');
            const checkAlumniDiv = document.getElementById('div-check-alumni');
            const checkAlsoAlumni = document.getElementById('check-also-alumni');

            if (radioAnSantri) radioAnSantri.disabled = true;
            if (radioAnSantri && radioAnSantri.checked) {
                const manualRadio = document.querySelector('input[name="nama-choice"][value="manual"]');
                if (manualRadio) manualRadio.click();
            }

            if (e.target.value === 'santri') {
                if (santriDetails) santriDetails.classList.remove('hidden');
                if (checkAlumniDiv) checkAlumniDiv.classList.remove('hidden');
                if (checkAlsoAlumni && checkAlsoAlumni.checked) {
                    if (alumniInput) alumniInput.classList.remove('hidden');
                } else {
                    if (alumniInput) alumniInput.classList.add('hidden');
                }
            } else {
                if (santriDetails) santriDetails.classList.add('hidden');
                if (checkAlumniDiv) checkAlumniDiv.classList.remove('hidden');
                if (checkAlsoAlumni && checkAlsoAlumni.checked) {
                    if (alumniInput) alumniInput.classList.remove('hidden');
                } else {
                    if (alumniInput) alumniInput.classList.add('hidden');
                }
              // [TAMBAHAN WAJIB] Hapus data santri dari memori agar tidak ikut terkirim
                donasiData.namaSantri = '';
                donasiData.nisSantri = '';
                donasiData.rombelSantri = '';
                
                // Reset juga dropdown di UI agar sinkron saat kembali lagi
                if(santriLevel) santriLevel.value = '';
                if(santriRombel) { santriRombel.innerHTML = '<option value="">Rombel</option>'; santriRombel.disabled = true; }
                if(santriNama) { santriNama.innerHTML = '<option value="">Pilih Nama Santri</option>'; santriNama.disabled = true; }
            }
        };
    });

    const checkAlsoAlumni = document.getElementById('check-also-alumni');
    if (checkAlsoAlumni) {
        checkAlsoAlumni.onchange = (e) => {
            const alumniInput = document.getElementById('input-alumni-tahun');
            if (alumniInput) {
                if (e.target.checked) {
                    alumniInput.classList.remove('hidden');
                } else {
                    alumniInput.classList.add('hidden');
                }
            }
        };
    }

    document.querySelectorAll('input[name="nama-choice"]').forEach(r => {
        r.onchange = (e) => {
            const input = document.getElementById('nama-muzakki-input');
            if (!input) return;

            if (e.target.value === 'hamba') {
                input.value = "Hamba Allah";
                input.readOnly = true;
            } else if (e.target.value === 'santri') {
                if (donasiData.namaSantri) {
                    input.value = `A/n Santri: ${donasiData.namaSantri}`;
                    input.readOnly = true;
                } else {
                    showToast("Pilih nama santri terlebih dahulu");
                    const manualRadio = document.querySelector('input[name="nama-choice"][value="manual"]');
                    if (manualRadio) manualRadio.checked = true;
                }
            } else {
                input.value = "";
                input.readOnly = false;
                input.focus();
            }
        };
    });

    const btnNextStep4 = document.querySelector('[data-next-step="4"]');
    if (btnNextStep4) {
        btnNextStep4.onclick = () => {
            const nameInput = document.getElementById('nama-muzakki-input');
            const hpInput = document.getElementById('no-hp');
            const alamatInput = document.getElementById('alamat');
            const emailInput = document.getElementById('email');
            const doaInput = document.getElementById('pesan-doa');
            
            // Perbaikan ID untuk No KTP & Alumni
            const nikInput = document.getElementById('no-ktp'); 
            const alumniInput = document.getElementById('alumni-tahun'); 
            
            const checkAlsoAlumni = document.getElementById('check-also-alumni');
            const isAlsoAlumni = checkAlsoAlumni ? checkAlsoAlumni.checked : false;

            if (donasiData.donaturTipe === 'santri' && !donasiData.namaSantri) return showToast("Wajib memilih data santri");

            if (isAlsoAlumni && alumniInput && !alumniInput.value) {
                return showToast("Tahun lulus wajib diisi bagi Alumni");
            }

            if (!nameInput || !nameInput.value) return showToast("Nama donatur wajib diisi");
            if (!hpInput || !hpInput.value) return showToast("Nomor WhatsApp wajib diisi");
            if (!alamatInput || !alamatInput.value) return showToast("Alamat wajib diisi");

            donasiData.nama = nameInput.value;
            donasiData.hp = hpInput.value;
            donasiData.alamat = alamatInput.value;
            donasiData.email = emailInput ? emailInput.value : '';
            donasiData.doa = doaInput ? doaInput.value : '';
            
            // Ambil value NIK
            donasiData.nik = nikInput ? nikInput.value : '';

            if (isAlsoAlumni) {
                donasiData.isAlumni = true;
                // Ambil value Tahun Alumni
                donasiData.alumniTahun = alumniInput ? alumniInput.value : '';
            } else {
                donasiData.isAlumni = false;
                donasiData.alumniTahun = '';
            }

            goToStep(4);
        };
    }

    // --- LANGKAH 4: Metode Pembayaran ---
    
    // A. Logika Tampilkan Checkbox "Sudah Transfer" saat pilih Metode
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const divSudah = document.getElementById('div-sudah-transfer');
            const checkSudah = document.getElementById('check-sudah-transfer');
            
            if (divSudah) {
                // Tampilkan hanya jika Transfer atau QRIS
                if (e.target.value === 'Transfer' || e.target.value === 'QRIS') {
                    divSudah.classList.remove('hidden');
                    divSudah.classList.add('animate-fade-in-up');
                } else {
                    divSudah.classList.add('hidden');
                    if (checkSudah) checkSudah.checked = false; // Reset jika ganti ke Tunai
                }
            }
        });
    });

    // B. Logika Tombol Lanjut (Kalkulasi Final)
    const btnNextStep5 = document.querySelector('[data-next-step="5"]');
    if (btnNextStep5) {
        btnNextStep5.onclick = () => {
            const method = document.querySelector('input[name="payment-method"]:checked');
            if (!method) return showToast("Pilih metode pembayaran");

            donasiData.metode = method.value;

            // 1. Pastikan nominal asli aman
            if (!donasiData.nominalAsli) {
                donasiData.nominalAsli = donasiData.nominal;
            }

            // 2. Reset Default
            donasiData.kodeUnik = 0;
            donasiData.nominalTotal = donasiData.nominalAsli;

            // 3. Ambil Status Checkbox "Sudah Transfer"
            const checkSudahTransfer = document.getElementById('check-sudah-transfer');
            const isAlreadyTransferred = checkSudahTransfer ? checkSudahTransfer.checked : false;

            // 4. Logika Kode Unik
            // Syarat Generate: 
            // a. Digital (Transfer/QRIS)
            // b. BUKAN Zakat (Fitrah/Maal)
            // c. BELUM Transfer (Kalau sudah transfer, jangan ubah nominalnya)
            
            const isDigital = (donasiData.metode === 'Transfer' || donasiData.metode === 'QRIS');
            const isZakat = (donasiData.type === 'Zakat Fitrah' || donasiData.type === 'Zakat Maal');

            if (isDigital && !isZakat && !isAlreadyTransferred) {
                const kodeUnik = generateUniqueCode(); 
                donasiData.kodeUnik = kodeUnik;
                donasiData.nominalTotal = donasiData.nominalAsli + kodeUnik;
            }

            // 5. Update UI Ringkasan
            document.getElementById('summary-type').innerText = donasiData.subType || donasiData.type;
            
            const elNominalSummary = document.getElementById('summary-nominal');
            elNominalSummary.innerText = formatRupiah(donasiData.nominalTotal);

            // Tampilkan Info Kode Unik HANYA JIKA ADA
            const oldMsg = document.getElementById('msg-kode-unik-summary');
            if (oldMsg) oldMsg.remove();

            if (donasiData.kodeUnik > 0) {
                const htmlPesan = `
                    <div id="msg-kode-unik-summary" class="mt-2 text-right animate-fade-in-up">
                        <span class="inline-block bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded border border-yellow-200">
                            <i class="fas fa-asterisk text-[8px] mr-1"></i>Kode Unik: ${donasiData.kodeUnik} (Masuk ke donasi)
                        </span>
                    </div>`;
                elNominalSummary.insertAdjacentHTML('afterend', htmlPesan);
            }
            
            document.getElementById('summary-nama').innerText = donasiData.nama;
            document.getElementById('summary-hp').innerText = donasiData.hp;
            document.getElementById('summary-metode').innerText = donasiData.metode;

            const santriRow = document.getElementById('summary-santri-row');
            if (donasiData.namaSantri && donasiData.donaturTipe === 'santri') {
                santriRow.classList.remove('hidden');
                document.getElementById('summary-santri').innerText = `${donasiData.namaSantri} (${donasiData.rombelSantri})`;
            } else {
                santriRow.classList.add('hidden');
            }

            goToStep(5);
        };
    }
    
    // --- LANGKAH TERAKHIR: Kirim Data ---
    const btnSubmitFinal = document.getElementById('btn-submit-final');
    if (btnSubmitFinal) {
        btnSubmitFinal.onclick = async () => {
            const btn = document.getElementById('btn-submit-final');
            const check = document.getElementById('confirm-check');

            if (!check || !check.checked) return showToast("Mohon centang pernyataan konfirmasi");

            // 1. Ubah tombol jadi Loading
            btn.disabled = true;
            btn.querySelector('.default-text').classList.add('hidden');
            btn.querySelector('.loading-text').classList.remove('hidden');

            // 2. Siapkan Data (Payload)
            const payload = {
                "type": donasiData.subType || donasiData.type,
                "nominal": donasiData.nominalTotal, 
                "nama": donasiData.nama,
                "hp": donasiData.hp,
                "email": donasiData.email,
                "alamat": donasiData.alamat,
                "metode": donasiData.metode,
                "doa": donasiData.doa,
                "donaturTipe": donasiData.donaturTipe,
                "alumniTahun": donasiData.alumniTahun || "",
                "DetailAlumni": donasiData.alumniTahun || "",
                "namaSantri": donasiData.namaSantri || "",
                "nisSantri": donasiData.nisSantri || "",
                "rombelSantri": donasiData.rombelSantri || "",
                "NoKTP": donasiData.nik || ""
            };

            try {
                // 3. Kirim ke Google Apps Script
                await fetch(GAS_API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: "create", payload: payload })
                });

                // 4. Update Data Tampilan di Halaman Sukses
                const finalNominal = document.getElementById('final-nominal-display');
                const finalType = document.getElementById('final-type-display');
                const finalName = document.getElementById('final-name-display');
                const summaryType = document.getElementById('summary-type');
                const summaryName = document.getElementById('summary-nama');

                // Update Teks Ringkasan
                if (finalNominal) {
                    finalNominal.innerText = formatRupiah(donasiData.nominalTotal);
                    
                    // --- INFO KODE UNIK (KUNING) ---
                    const oldFinalMsg = document.getElementById('msg-kode-unik-final');
                    if (oldFinalMsg) oldFinalMsg.remove();

                    if (donasiData.kodeUnik > 0) {
                        finalNominal.classList.remove('mb-4');
                        finalNominal.classList.add('mb-2');

                        const htmlFinalPesan = `
                            <div id="msg-kode-unik-final" class="mb-6 flex justify-center animate-fade-in-up">
                                <div class="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm max-w-xs">
                                    <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0">
                                        <i class="fas fa-exclamation text-sm"></i>
                                    </div>
                                    <div class="text-left">
                                        <p class="text-[10px] font-bold text-yellow-800 uppercase tracking-wider mb-0.5">PENTING</p>
                                        <p class="text-xs text-slate-600 leading-tight">
                                            Mohon transfer tepat hingga <span class="font-black text-orange-600 border-b-2 border-orange-200">${donasiData.kodeUnik}</span> digit terakhir agar terverifikasi otomatis.
                                        </p>
                                    </div>
                                </div>
                            </div>`;
                        finalNominal.insertAdjacentHTML('afterend', htmlFinalPesan);
                    }
                }

                if (finalType && summaryType) finalType.innerText = summaryType.innerText;
                if (finalName && summaryName) finalName.innerText = summaryName.innerText;

                // Tampilkan Modal Sukses (Wadah Utama)
                const modal = document.getElementById('success-modal');
                if (modal) modal.classList.remove('hidden');

                // --- 5. GENERATE KONTEN INTRUKSI PEMBAYARAN & DOA ---
                
                // A. Generate Doa (Lengkap & Indah)
                // Ini akan ditaruh di paling atas sesuai request
                const prayerHTML = `
                    <div class="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white rounded-3xl border border-emerald-100 shadow-lg p-8 md:p-10 mb-8 text-center group hover:shadow-xl transition-all duration-500">
                        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-300 via-teal-400 to-emerald-300"></div>
                        <div class="absolute -top-10 -left-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                        <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                        <div class="relative z-10">
                            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-emerald-100 shadow-sm text-emerald-600 mb-6 group-hover:scale-110 transition-transform duration-300"><i class="fas fa-praying-hands text-xl"></i></div>
                            <h3 class="font-arabic text-2xl md:text-3xl font-black text-emerald-900 leading-[2.5] mb-6 drop-shadow-sm tracking-wide" dir="rtl">
                                آجَرَكَ اللَّهُ فِيمَا أَعْطَيْتَ، وَبَارَكَ اللَّهُ فِيمَا أَبْقَيْتَ، وَجَعَلَهُ لَكَ طَهُورًا
                            </h3>
                            <div class="flex items-center justify-center gap-3 opacity-60 mb-6"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span class="w-16 h-0.5 rounded-full bg-gradient-to-r from-transparent via-emerald-300 to-transparent"></span><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span></div>
                            <p class="text-slate-600 text-sm italic leading-relaxed max-w-2xl mx-auto">
                                "Semoga Allah memberikan pahala atas apa yang engkau berikan, dan semoga Allah memberkahimu atas apa yang masih ada di tanganmu dan menjadikannya sebagai pembersih (dosa) bagimu."
                            </p>
                        </div>
                    </div>
                `;

                // B. Generate Metode Pembayaran (Desain Modern)
                let paymentDetails = '';
                
                if (donasiData.metode === 'QRIS') {
                    paymentDetails = `
                        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <div class="flex items-center justify-center gap-2 mb-6">
                                <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-lg"><i class="fas fa-qrcode"></i></div>
                                <h4 class="font-bold text-slate-800 text-lg">Pindai QRIS</h4>
                            </div>
                            
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div onclick="openQrisModal('bni')" class="group cursor-pointer border border-slate-200 rounded-2xl p-4 hover:border-orange-500 hover:shadow-md transition-all text-center flex flex-col items-center justify-between h-full bg-slate-50/50 hover:bg-white">
                                    <div class="h-8 flex items-center mb-3"><img src="bank-bni.png" class="h-full object-contain"></div>
                                    <button class="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wide group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition">Lihat QR</button>
                                </div>
                                <div onclick="openQrisModal('bsi')" class="group cursor-pointer border border-slate-200 rounded-2xl p-4 hover:border-teal-500 hover:shadow-md transition-all text-center flex flex-col items-center justify-between h-full bg-slate-50/50 hover:bg-white">
                                    <div class="h-10 flex items-center mb-3"><img src="bank-bsi.png" class="h-full object-contain"></div>
                                    <button class="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wide group-hover:bg-teal-500 group-hover:text-white group-hover:border-teal-500 transition">Lihat QR</button>
                                </div>
                                <div onclick="openQrisModal('bpd')" class="group cursor-pointer border border-slate-200 rounded-2xl p-4 hover:border-blue-500 hover:shadow-md transition-all text-center flex flex-col items-center justify-between h-full bg-slate-50/50 hover:bg-white">
                                    <div class="h-8 flex items-center mb-3"><img src="bank-bpd.png" class="h-full object-contain"></div>
                                    <button class="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wide group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition">Lihat QR</button>
                                </div>
                            </div>
                            <p class="text-center text-[10px] text-slate-400 mt-4 bg-slate-50 py-2 rounded-lg"><i class="fas fa-info-circle mr-1"></i> Mendukung GoPay, OVO, Dana, ShopeePay, & Mobile Banking</p>
                        </div>`;
                
                } else if (donasiData.metode === 'Transfer') {
                    paymentDetails = `
                        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                            <div class="flex items-center justify-center gap-2 mb-4">
                                <div class="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-lg"><i class="fas fa-university"></i></div>
                                <h4 class="font-bold text-slate-800 text-lg">Transfer Bank</h4>
                            </div>
                            
                            <div class="flex flex-col sm:flex-row items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-orange-200 hover:bg-orange-50/30 transition-all gap-4 group">
                                <div class="flex items-center gap-4 w-full sm:w-auto">
                                    <div class="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-sm">
                                        <img src="bank-bni.png" class="w-full h-full object-contain">
                                    </div>
                                    <div class="text-left">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bank BNI</p>
                                        <p class="text-lg font-black text-slate-700 tracking-tight group-hover:text-orange-600 transition-colors">3440 000 348</p>
                                    </div>
                                </div>
                                <button onclick="copyText('3440000348')" class="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-orange-500 hover:text-white hover:border-orange-500 transition flex items-center justify-center gap-2 shadow-sm active:scale-95">
                                    <i class="far fa-copy"></i> Salin
                                </button>
                            </div>

                            <div class="flex flex-col sm:flex-row items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-teal-200 hover:bg-teal-50/30 transition-all gap-4 group">
                                <div class="flex items-center gap-4 w-full sm:w-auto">
                                    <div class="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-sm">
                                        <img src="bank-bsi.png" class="w-full h-full object-contain">
                                    </div>
                                    <div class="text-left">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BSI (Syariah)</p>
                                        <p class="text-lg font-black text-slate-700 tracking-tight group-hover:text-teal-600 transition-colors">7930 030 303</p>
                                    </div>
                                </div>
                                <button onclick="copyText('7930030303')" class="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-teal-500 hover:text-white hover:border-teal-500 transition flex items-center justify-center gap-2 shadow-sm active:scale-95">
                                    <i class="far fa-copy"></i> Salin
                                </button>
                            </div>

                            <div class="flex flex-col sm:flex-row items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/30 transition-all gap-4 group">
                                <div class="flex items-center gap-4 w-full sm:w-auto">
                                    <div class="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-sm">
                                        <img src="bank-bpd.png" class="w-full h-full object-contain">
                                    </div>
                                    <div class="text-left">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BPD DIY Syariah</p>
                                        <p class="text-lg font-black text-slate-700 tracking-tight group-hover:text-blue-600 transition-colors">801 241 004 624</p>
                                    </div>
                                </div>
                                <button onclick="copyText('801241004624')" class="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-blue-500 hover:text-white hover:border-blue-500 transition flex items-center justify-center gap-2 shadow-sm active:scale-95">
                                    <i class="far fa-copy"></i> Salin
                                </button>
                            </div>
                        </div>`;
                
                } else {
                    // Tampilan Tunai
                    paymentDetails = `
                        <div class="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 text-center">
                            <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-emerald-600 text-3xl"><i class="fas fa-handshake"></i></div>
                            <h4 class="font-black text-emerald-900 text-xl mb-1">Layanan Kantor</h4>
                            <p class="text-emerald-700 text-sm">Silakan datang langsung ke kantor Lazismu Mu'allimin.</p>
                        </div>`;
                }

                // C. Masukkan ke Container yang Tepat (Sesuai Urutan di HTML Baru)
                // 1. Masukkan Doa ke Container Atas
                const prayerContainer = document.getElementById('success-prayer-container');
                if (prayerContainer) prayerContainer.innerHTML = prayerHTML;

                // 2. Masukkan Payment ke Container Bawah
                const paymentContainer = document.getElementById('payment-methods-content');
                if (paymentContainer) paymentContainer.innerHTML = paymentDetails;

                // Tampilkan Wrapper Utama
                const wizard = document.getElementById('donasi-wizard');
                if (wizard) wizard.classList.add('hidden');

                const paymentInstr = document.getElementById('donasi-payment-instructions');
                if (paymentInstr) paymentInstr.classList.remove('hidden');

                // --- 6. SET UP WHATSAPP (Di Bawah) ---
                const waMsg = `Assalamu'alaikum Admin Lazismu Mu'allimin,\n\nSaya telah melakukan transfer donasi:\n\n• Nama: *${donasiData.nama}*\n• Jenis: ${donasiData.subType || donasiData.type}\n• Nominal: *${formatRupiah(donasiData.nominalTotal)}*\n\nMohon diverifikasi agar status donasi saya berubah menjadi *DITERIMA*. Terima kasih.`;
                
                const btnWa = document.getElementById('btn-wa-confirm');
                if (btnWa) {
                    btnWa.href = `https://wa.me/6281196961918?text=${encodeURIComponent(waMsg)}`;
                    
                    // --- HIMBAUAN KONFIRMASI (BIRU) ---
                    const waContainer = btnWa.parentElement; 
                    const oldAdvice = document.getElementById('wa-verification-advice');
                    if(oldAdvice) oldAdvice.remove();

                    const verificationAdvice = document.createElement('div');
                    verificationAdvice.id = 'wa-verification-advice';
                    verificationAdvice.className = 'mb-3 bg-blue-50 border border-blue-100 rounded-xl p-3 text-center animate-pulse';
                    verificationAdvice.innerHTML = `
                        <div class="flex items-center justify-center gap-2 text-blue-700 mb-1">
                            <i class="fas fa-bell"></i>
                            <span class="text-xs font-black uppercase tracking-wider">Langkah Terakhir</span>
                        </div>
                        <p class="text-xs text-slate-600 leading-tight">
                            Agar donasi Anda segera diverifikasi Admin dan status berubah menjadi <strong class="text-green-600">DITERIMA</strong>, mohon kirim bukti transfer sekarang.
                        </p>
                    `;
                    waContainer.insertBefore(verificationAdvice, btnWa);
                }

            } catch (e) {
                showToast("Gagal mengirim data: " + e.message, "error");
                btn.disabled = false;
                btn.querySelector('.default-text').classList.remove('hidden');
                btn.querySelector('.loading-text').classList.add('hidden');
            }
        };
    }

    const successContinue = document.getElementById('success-modal-continue');
    if (successContinue) {
        successContinue.onclick = () => {
            const modal = document.getElementById('success-modal');
            if (modal) modal.classList.add('hidden');
            
            // [TAMBAHAN WAJIB] Tandai data sebagai 'kotor' agar dimuat ulang
            riwayatData.isLoaded = false; 
            
            // Jika pengguna sedang di halaman Dashboard/Riwayat, refresh otomatis
            // Cek hash URL saat ini
            const currentHash = window.location.hash;
            if (currentHash === '#riwayat') {
                loadRiwayat(); // Muat ulang tabel riwayat
            } else if (currentHash === '#dashboard' && typeof currentUser !== 'undefined') {
                loadPersonalDashboard(currentUser.email); // Muat ulang dashboard
            }

            const paymentInstr = document.getElementById('donasi-payment-instructions');
            if (paymentInstr) paymentInstr.scrollIntoView({ behavior: 'smooth' });
        };
    }

    document.querySelectorAll('[data-prev-step]').forEach(btn => {
        btn.onclick = () => goToStep(parseInt(btn.dataset.prevStep));
    });
}

// ============================================================================
// 12. LOGIKA RIWAYAT DONASI & STATISTIK
// ============================================================================
function setupHistoryLogic() {
    // Mengatur tombol Next/Prev halaman riwayat
    const prevBtn = document.getElementById('riwayat-prev');
    const nextBtn = document.getElementById('riwayat-next');

    if (prevBtn) {
        prevBtn.onclick = () => {
            if (riwayatData.currentPage > 1) {
                riwayatData.currentPage--;
                renderRiwayatList();
                renderPagination();
            }
        };
    }
    if (nextBtn) {
        nextBtn.onclick = () => {
            const totalPages = Math.ceil(riwayatData.allData.length / riwayatData.itemsPerPage);
            if (riwayatData.currentPage < totalPages) {
                riwayatData.currentPage++;
                renderRiwayatList();
                renderPagination();
            }
        };
    }

    // Filter jenis donasi, metode, dan tanggal
    ['filter-jenis', 'filter-metode', 'filter-start-date', 'filter-end-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.onchange = () => {
                riwayatData.currentPage = 1;
                renderRiwayatList();
                renderPagination();
            };
        }
    });

    // Filter cepat waktu (Hari ini, Minggu ini, dll)
    document.querySelectorAll('.time-filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.time-filter-btn').forEach(b => {
                b.classList.remove('bg-slate-900', 'text-white', 'shadow-md', 'active');
                b.classList.add('text-slate-500', 'hover:bg-white', 'hover:text-slate-700', 'hover:shadow-sm');
                b.classList.remove('bg-white');
            });

            btn.classList.remove('text-slate-500', 'hover:bg-white', 'hover:text-slate-700', 'hover:shadow-sm');
            btn.classList.add('bg-slate-900', 'text-white', 'shadow-md', 'active');

            timeFilterState = btn.dataset.time;
            riwayatData.currentPage = 1;
            renderRiwayatList();
            renderPagination();
        }
    });

    // Tombol Reset Filter
    const resetBtn = document.getElementById('btn-reset-filter');
    if (resetBtn) {
        resetBtn.onclick = () => {
            document.getElementById('filter-jenis').value = 'all';
            document.getElementById('filter-metode').value = 'all';
            document.getElementById('filter-start-date').value = '';
            document.getElementById('filter-end-date').value = '';

            timeFilterState = 'all';

            document.querySelectorAll('.time-filter-btn').forEach(b => {
                b.classList.remove('bg-slate-900', 'text-white', 'shadow-md', 'active');
                b.classList.add('text-slate-500', 'hover:bg-white', 'hover:text-slate-700', 'hover:shadow-sm');

                if (b.dataset.time === 'all') {
                    b.classList.remove('text-slate-500', 'hover:bg-white', 'hover:text-slate-700', 'hover:shadow-sm');
                    b.classList.add('bg-slate-900', 'text-white', 'shadow-md', 'active');
                }
            });

            riwayatData.currentPage = 1;
            renderRiwayatList();
            renderPagination();
        }
    }
}

// Mengambil data riwayat dari Google Sheet
async function loadRiwayat() {
    if (riwayatData.isLoaded || riwayatData.isLoading) return; 
    
    riwayatData.isLoading = true; // Set flag loading

    const loader = document.getElementById('riwayat-loading');
    const content = document.getElementById('riwayat-content');

    if (loader) loader.classList.remove('hidden');
    if (content) content.classList.add('hidden');

    try {
        const res = await fetch(GAS_API_URL);
        const json = await res.json();

        if (json.status === 'success') {
            riwayatData.allData = json.data.reverse();
            riwayatData.isLoaded = true;

            calculateStats(); // Hitung total donasi dll
            renderHomeLatestDonations(); // Tampilkan di halaman depan
            renderPagination();
            renderRiwayatList();
            
            // Render leaderboard jika data sudah siap
            renderGlobalLeaderboard();

            if (loader) loader.classList.add('hidden');
            if (content) content.classList.remove('hidden');

            if (riwayatData.allData.length === 0) {
                const noData = document.getElementById('riwayat-no-data');
                if (noData) noData.classList.remove('hidden');
            }
        }
    } catch (e) {
        if (loader) loader.innerHTML = '<p class="text-red-500">Gagal memuat data.</p>';
    } finally {
        riwayatData.isLoading = false; // Matikan flag loading selesai (sukses/gagal)
    }
}

// Menampilkan 6 donasi terbaru di halaman depan (Home)
function renderHomeLatestDonations() {
    const container = document.getElementById('home-latest-donations');
    if (!container) return;

    // Kita ambil 6 data saja agar sisa 2 slot untuk kartu spesial
    const latest = riwayatData.allData.slice(0, 6);

    if (latest.length === 0) {
        container.innerHTML = '<div class="text-center col-span-full py-4 text-slate-400 text-sm">Belum ada donasi. Jadilah yang pertama!</div>';
        return;
    }

    let html = latest.map(item => {
        let iconClass = 'fa-donate';
        let bgIcon = 'bg-slate-100 text-slate-400';
        let bgBadge = 'bg-slate-50 text-slate-600';

        const type = item.JenisDonasi || item.type || "";
        const subType = item.SubJenis || item.subType || "";
        const displayType = subType || type;

        // === [PERBAIKAN DIMULAI DISINI] ===
        // Tentukan Label Sebutan (Muzaki vs Munfiq)
        let labelSebutan = "Donatur"; // Default umum

        if (displayType.toLowerCase().includes('zakat')) {
            labelSebutan = "Muzaki"; // Untuk Zakat Maal & Fitrah
        } else if (displayType.toLowerCase().includes('infaq') || displayType.toLowerCase().includes('wakaf')) {
            labelSebutan = "Munfiq"; // Untuk Infaq & Wakaf
        }

        if (displayType.includes('Fitrah')) {
            iconClass = 'fa-bowl-rice';
            bgIcon = 'bg-emerald-100 text-emerald-600';
            bgBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
        } else if (displayType.includes('Maal')) {
            iconClass = 'fa-sack-dollar';
            bgIcon = 'bg-amber-100 text-amber-600';
            bgBadge = 'bg-amber-50 text-amber-700 border-amber-100';
        } else if (displayType.includes('Kampus')) {
            iconClass = 'fa-school';
            bgIcon = 'bg-rose-100 text-rose-600';
            bgBadge = 'bg-rose-50 text-rose-700 border-rose-100';
        } else if (displayType.includes('Beasiswa')) {
            iconClass = 'fa-user-graduate';
            bgIcon = 'bg-sky-100 text-sky-600';
            bgBadge = 'bg-sky-50 text-sky-700 border-sky-100';
        } else if (displayType.includes('Umum')) {
            iconClass = 'fa-parachute-box';
            bgIcon = 'bg-violet-100 text-violet-600';
            bgBadge = 'bg-violet-50 text-violet-700 border-violet-100';
        } else {
            iconClass = 'fa-hand-holding-heart';
            bgIcon = 'bg-orange-100 text-brand-orange';
            bgBadge = 'bg-orange-50 text-orange-700 border-orange-100';
        }

        return `
        <div class="relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 border border-slate-100 transition-all duration-300 group hover:-translate-y-1 h-full flex flex-col justify-between overflow-hidden">
    <div class="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 rotate-12">
        <i class="fas ${iconClass} text-9xl text-slate-800"></i>
    </div>

    <div class="relative z-10">
        <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-xl ${bgIcon} flex items-center justify-center text-lg shadow-sm ring-4 ring-white group-hover:scale-110 transition-transform duration-300">
                <i class="fas ${iconClass}"></i>
            </div>
            
            <span class="text-[10px] font-bold ${bgBadge} border px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm ml-auto sm:ml-0" title="${displayType}">
                ${displayType}
            </span>
        </div>

        <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">${labelSebutan}</p>
            
            <h5 class="font-bold text-slate-800 text-base mb-2 line-clamp-1" title="${escapeHtml(item.NamaDonatur) || 'Hamba Allah'}">
                ${escapeHtml(item.NamaDonatur) || 'Hamba Allah'}
            </h5>

            <div class="bg-slate-50 rounded-xl p-3 border border-slate-100 group-hover:border-orange-200 group-hover:bg-orange-50/30 transition-colors">
                <div class="flex items-baseline gap-1">
                    <span class="text-xs text-slate-500 font-medium">Rp</span>
                    <span class="text-xl md:text-2xl font-black text-slate-800 group-hover:text-orange-600 transition-colors">
                        ${parseInt(item.Nominal).toLocaleString('id-ID')}
                    </span>
                </div>
            </div>
        </div>
    </div>

    <div class="relative z-10 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
        <div class="flex items-center gap-1.5">
            <i class="far fa-clock text-orange-400"></i>
            <span>${timeAgo(item.Timestamp)}</span>
        </div>
        
        <div class="flex items-center gap-1 opacity-70">
           <span class="font-medium text-slate-500">Via Web</span>
           <i class="fas fa-check-circle text-green-500"></i>
        </div>
    </div>
</div>
        `;
    }).join('');

    // --- KARTU 7: AJAKAN DONASI (Accent Color) ---
    html += `
        <div onclick="showPage('donasi')" class="group relative bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 shadow-xl shadow-orange-500/30 text-white cursor-pointer hover:-translate-y-2 transition-all duration-300 flex flex-col items-center justify-center text-center h-full min-h-[180px] overflow-hidden border border-white/20 ring-4 ring-orange-500/10 hover:ring-orange-500/30">
    
    <div class="absolute top-[-50%] left-[-50%] w-full h-full bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
    <div class="absolute bottom-[-50%] right-[-50%] w-full h-full bg-yellow-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
    <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

    <div class="relative z-10">
        <div class="relative mb-4 mx-auto w-16">
            <div class="absolute inset-0 bg-white/30 rounded-full blur-lg animate-pulse"></div>
            <div class="relative w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition duration-300 shadow-inner">
                <i class="fas fa-hand-holding-heart text-3xl drop-shadow-md group-hover:animate-pulse"></i>
            </div>
        </div>

        <h5 class="font-black text-xl mb-1 tracking-tight">Mari Berbagi</h5>
        <p class="text-sm text-orange-50 font-medium mb-4 opacity-90">Jemput keberkahan harta Anda hari ini.</p>
        
        <span class="inline-flex items-center gap-2 bg-white text-orange-600 text-xs font-bold px-5 py-2 rounded-full shadow-lg group-hover:bg-orange-50 transition-colors">
            Tunaikan Sekarang <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
        </span>
    </div>
</div>
    `;

    // --- KARTU 8: LIHAT SEMUA (Outline Style) ---
    html += `
        <div onclick="showPage('riwayat')" class="group relative cursor-pointer h-full min-h-[180px] w-full">
    <div class="absolute inset-0 bg-blue-100 rounded-2xl transform translate-x-2 translate-y-2 rotate-2 group-hover:rotate-6 group-hover:translate-x-3 group-hover:translate-y-3 transition-all duration-300"></div>
    <div class="absolute inset-0 bg-slate-100 rounded-2xl transform translate-x-1 translate-y-1 rotate-1 group-hover:rotate-3 group-hover:translate-x-1.5 group-hover:translate-y-1.5 transition-all duration-300"></div>
    
    <div class="relative bg-white rounded-2xl p-5 border border-slate-200 shadow-sm group-hover:shadow-xl group-hover:border-blue-300 group-hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center h-full text-center overflow-hidden">
        
        <div class="absolute -right-4 -top-4 opacity-[0.05] group-hover:opacity-1 transition-opacity rotate-12">
            <i class="fas fa-layer-group text-8xl text-blue-600"></i>
        </div>

        <div class="relative z-10 w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mb-3 shadow-inner group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-300">
            <i class="fas fa-arrow-right text-lg group-hover:-rotate-45 transition-transform duration-300"></i>
        </div>
        
        <span class="font-bold text-base text-slate-700 group-hover:text-blue-600 transition-colors">Lihat Semua</span>
        <span class="text-xs text-slate-400 mt-1 group-hover:text-blue-500/80">Buka arsip lengkap</span>
    </div>
</div>
    `;

    container.innerHTML = html;
}

// ============================================================================
// 13. LOGIKA MODAL QRIS (POP-UP GAMBAR BESAR)
// ============================================================================
const qrisDatabase = {
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

function openQrisModal(key) {
    const data = qrisDatabase[key];
    if (!data) return;

    const modal = document.getElementById('qris-modal');
    const panel = document.getElementById('qris-modal-panel');

    // Isi Data ke dalam Modal
    document.getElementById('qris-modal-title').innerText = data.title;
    document.getElementById('qris-modal-img').src = data.img;
    document.getElementById('qris-modal-btn').href = data.url;

    // Tampilkan Modal dengan Animasi
    modal.classList.remove('hidden');
    setTimeout(() => {
        panel.classList.remove('scale-95');
        panel.classList.add('scale-100');
    }, 10);
}

function closeQrisModal() {
    const modal = document.getElementById('qris-modal');
    const panel = document.getElementById('qris-modal-panel');

    panel.classList.remove('scale-100');
    panel.classList.add('scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// Efek bayangan pada Header saat digulir (Scroll Effect)
window.addEventListener('scroll', () => {
    const header = document.getElementById('main-header');
    if (window.scrollY > 50) {
        header.classList.add('shadow-md', 'bg-white/95');
        header.classList.remove('bg-white/80');
    } else {
        header.classList.remove('shadow-md', 'bg-white/95');
        header.classList.add('bg-white/80');
    }
});

/* ============================================================================
   14. LOGIKA DASHBOARD PERSONAL & KWITANSI (FIXED)
   ============================================================================ */

let myDonations = []; // Menyimpan data donasi khusus user yang login

window.loadPersonalDashboard = async function(userEmail) {
    // 1. Pastikan Data Riwayat Sudah Ada
    if (!riwayatData.isLoaded) {
        // Jika belum ada, panggil loadRiwayat dulu dan tunggu
        await loadRiwayat();
    }

    // 2. Filter Data (LOGIKA YANG SUDAH DIPERBAIKI: CEK EMAIL & NIS)
    // Menggunakan logika OR: Data diambil jika Email cocok ATAU NIS cocok
    if (riwayatData.allData) {
        myDonations = riwayatData.allData.filter(item => {
            // A. Cek Kecocokan Email (jika ada data email)
            const emailData = item.Email ? String(item.Email).toLowerCase() : "";
            const emailUser = userEmail ? String(userEmail).toLowerCase() : "";
            const matchEmail = emailData && emailUser && emailData === emailUser;
            
            // B. Cek Kecocokan NIS (Khusus Santri)
            // Pastikan properti NIS sesuai dengan header JSON Google Sheet Anda
            const itemNIS = item.nisSantri || item.NISSantri || item.NIS || ""; 
            // Ambil NIS dari user yang sedang login (global variable currentUser)
            const userNIS = (currentUser && currentUser.isSantri) ? String(currentUser.nis) : "";
            const matchNIS = userNIS && String(itemNIS) === userNIS;

            // Ambil jika SALAH SATU cocok
            return matchEmail || matchNIS;
        });
    }

    // 3. Update Tampilan Dashboard
    updateDashboardUI();
}

function updateDashboardUI() {
    // A. Update Profil Header
    const user = currentUser; // Variabel global dari auth firebase
    if (user) {
        if(document.getElementById('dash-avatar')) document.getElementById('dash-avatar').src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`;
        if(document.getElementById('dash-name')) document.getElementById('dash-name').innerText = user.displayName.split(' ')[0]; 
    }

    // B. Hitung Statistik
    let totalDonasi = 0;
    let frekuensi = myDonations.length;
    let lastDonasi = null;

    // Urutkan myDonations dari yang terbaru (berjaga-jaga)
    // Asumsi riwayatData.allData sudah sorted, tapi kita pastikan lagi jika perlu
    // myDonations.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

    myDonations.forEach((d, index) => {
        totalDonasi += parseInt(d.Nominal) || 0;
        if (index === 0) lastDonasi = d; // Ambil yang pertama sebagai 'Terakhir'
    });

    // C. Render Angka Statistik (Pastikan ID ini ada di HTML Anda)
    const elStatTotal = document.getElementById('dash-stat-total');
    const elStatFreq = document.getElementById('dash-stat-freq');
    const elStatLast = document.getElementById('dash-stat-last');
    const elStatDate = document.getElementById('dash-stat-last-date');

    if (elStatTotal) animateValue(elStatTotal, 0, totalDonasi, 1500, true);
    if (elStatFreq) animateValue(elStatFreq, 0, frekuensi, 1000);
    
    if (lastDonasi) {
        if(elStatLast) elStatLast.innerText = formatRupiah(lastDonasi.Nominal);
        if(elStatDate) elStatDate.innerText = timeAgo(lastDonasi.Timestamp);
    } else {
        if(elStatLast) elStatLast.innerText = "-";
        if(elStatDate) elStatDate.innerText = "Belum ada donasi";
    }

    // D. Gamifikasi Level Donatur
    const levelBadge = document.getElementById('dash-level');
    if (levelBadge) {
        if (totalDonasi > 10000000) {
            levelBadge.innerHTML = `<span class="text-purple-600"><i class="fas fa-crown"></i> Muhsinin Utama</span>`;
        } else if (totalDonasi > 1000000) {
            levelBadge.innerHTML = `<span class="text-blue-600"><i class="fas fa-medal"></i> Donatur Setia</span>`;
        } else if (frekuensi > 0) {
            levelBadge.innerHTML = `<span class="text-green-600"><i class="fas fa-user-check"></i> Sahabat Lazismu</span>`;
        } else {
            levelBadge.innerText = "Donatur Baru";
        }
    }

    // E. Render Tabel Riwayat
    renderPersonalHistoryTable();
}

function renderPersonalHistoryTable() {
    const tbody = document.getElementById('dash-history-body');
    const emptyState = document.getElementById('dash-empty-state');
    
    if (!tbody) return; // Safety check

    if (myDonations.length === 0) {
        tbody.innerHTML = '';
        if(tbody.parentElement) tbody.parentElement.classList.add('hidden'); // Sembunyikan tabel
        if(emptyState) emptyState.classList.remove('hidden'); // Munculkan pesan kosong
        return;
    } else {
        if (noDataEl) noDataEl.classList.add('hidden');
    }

    tbody.innerHTML = '';

    myDonations.forEach(item => {
        const dateObj = new Date(item.Timestamp);
        const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        
        let statusClass = item.Status === 'Terverifikasi' 
            ? 'bg-green-100 text-green-700 border-green-200' 
            : 'bg-yellow-100 text-yellow-700 border-yellow-200';
        
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50 transition border-b border-slate-50 last:border-0';
        row.innerHTML = `
            <td class="p-5 whitespace-nowrap">
                <div class="font-bold text-slate-700">${dateStr}</div>
                <div class="text-xs text-slate-400">${timeAgo(item.Timestamp)}</div>
            </td>
            <td class="p-5">
                <div class="font-bold text-slate-700">${item.JenisDonasi}</div>
                <div class="text-xs text-slate-500">${item.SubJenis || '-'}</div>
            </td>
            <td class="p-5 font-bold text-slate-700">
                ${formatRupiah(item.Nominal)}
            </td>
            <td class="p-5 text-center">
                <span class="px-3 py-1 rounded-full text-xs font-bold border bg-white text-slate-500">
                    ${item.MetodePembayaran}
                </span>
            </td>
            <td class="p-5 text-center">
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusClass}">
                    ${item.Status === 'Terverifikasi' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-clock"></i>'}
                    ${item.Status || 'Proses'}
                </span>
            </td>
            <td class="p-5 text-center">
                <button onclick='openReceiptWindow(${JSON.stringify(item)})' class="text-slate-400 hover:text-orange-600 transition p-2" title="Cetak Kwitansi">
                    <i class="fas fa-file-invoice"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/* ============================================================================
   14. FITUR KWITANSI ULTIMATE (MODAL PREVIEW + PDF PRESISI)
   ============================================================================ */

let currentReceiptData = null; // Menyimpan data sementara untuk download

// --- HELPER 1: TERBILANG ---
function terbilang(angka) {
    const bil = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    angka = parseInt(angka);
    if (isNaN(angka)) return "";
    if (angka < 12) return bil[angka];
    if (angka < 20) return terbilang(angka - 10) + " Belas";
    if (angka < 100) return terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10);
    if (angka < 200) return "Seratus " + terbilang(angka - 100);
    if (angka < 1000) return terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100);
    if (angka < 2000) return "Seribu " + terbilang(angka - 1000);
    if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + " Ribu " + terbilang(angka % 1000);
    if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + " Juta " + terbilang(angka % 1000000);
    return "";
}

// --- HELPER 2: LOAD IMAGE ---
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; 
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
    });
}

// --- HELPER 3: FORMAT HP (Tambah 0 di depan) ---
function formatHP(hp) {
    let clean = String(hp || "").trim();
    if (clean === "" || clean === "-") return "-";
    if (!clean.startsWith('0')) return '0' + clean;
    return clean;
}

// --- FITUR CETAK KWITANSI (Pop-Up Window) ---
// Ganti fungsi openReceiptModal yang lama dengan ini:

window.openReceiptWindow = function(itemData) {
    // 1. Siapkan Paket Data yang Bersih dari baris tabel yang diklik
    const paketData = {
        nama: itemData.NamaDonatur || itemData.nama || "Hamba Allah",
        alamat: itemData.Alamat || "-",
        hp: itemData.NoHP || itemData.hp || "-",
        nominal: itemData.Nominal || itemData.nominal || 0,
        
        // Cek jenis dan sub-jenis untuk penempatan kolom
        jenis: itemData.JenisDonasi || itemData.type || "Infaq",
        sub: itemData.SubJenis || "", // Misal: Pengembangan Kampus
        
        metode: itemData.MetodePembayaran || itemData.metode || "Tunai",
        tanggal: itemData.Timestamp || new Date().toISOString()
    };

    // 2. Simpan ke "Saku Celana" Browser (LocalStorage)
    // Nama kuncinya 'tiket_cetak_kwitansi' harus sama dengan yang ada di cetak.html
    localStorage.setItem('tiket_cetak_kwitansi', JSON.stringify(paketData));

    // 3. Buka File cetak.html di Jendela Baru
    // width=900,height=700 agar pas ukurannya di layar PC
    window.open('cetak.html', '_blank', 'width=900,height=700,menubar=no,toolbar=no');
}

function closeReceiptModal() {
    document.getElementById('receipt-modal').classList.add('hidden');
}

// ============================================================
// TAMBAHAN FITUR: DONASI OTOMATIS (BEAUTIFIKASI)
// ============================================================

function startBeautificationDonation(nominalPaket = 0) {
    // 1. Buka Halaman Donasi
    showPage('donasi');
    
    // 2. Reset ke Langkah 1
    goToStep(1);

    // 3. Otomatis Klik Tombol "Infaq"
    const btnInfaq = document.querySelector('button[data-type="Infaq"]');
    if (btnInfaq) btnInfaq.click();

    // 4. Tunggu animasi sebentar, lalu pilih "Pengembangan Kampus"
    setTimeout(() => {
        const btnKampus = document.querySelector('button[data-type-infaq="Infaq Pengembangan Kampus"]');
        if (btnKampus) btnKampus.click();

        // 5. Tunggu lagi, lalu pindah ke langkah Nominal
        setTimeout(() => {
            goToStep(2); 

            const inputCustom = document.getElementById('nominal-custom');
            
            if (nominalPaket > 0) {
                // Jika memilih paket (misal 500rb)
                donasiData.nominal = nominalPaket;
                donasiData.nominalAsli = nominalPaket;
                
                if(inputCustom) inputCustom.value = formatRupiah(nominalPaket);
                
                // Matikan seleksi tombol biasa agar tidak bingung
                document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
                
                showToast(`Paket Donasi ${formatRupiah(nominalPaket)} terpilih`, 'success');
            } else {
                // Jika memilih Wakaf Tunai (Bebas)
                donasiData.nominal = 0;
                donasiData.nominalAsli = 0;
                if(inputCustom) {
                    inputCustom.value = '';
                    inputCustom.focus();
                }
            }
        }, 500); // Jeda transisi ke step 2
    }, 300); // Jeda transisi tampilkan opsi infaq
}

window.hideLoginSuggestion = function() {
    const card = document.getElementById('login-suggestion-card');
    if (card) {
        card.classList.add('hidden');
        // Opsional: Fokus ke input nama agar user langsung ngetik
        const inputNama = document.getElementById('nama-muzakki-input');
        if(inputNama) inputNama.focus();
    }
}

// --- 1. FITUR GANTI PASSWORD ---
window.openChangePassModal = function() {
    toggleUserDropdown(); // Tutup menu
    document.getElementById('pass-modal').classList.remove('hidden');
    document.getElementById('new-pass-1').value = '';
    document.getElementById('new-pass-2').value = '';
}

window.saveNewPassword = function() {
    if (!currentUser || !currentUser.isSantri) return;

    const p1 = document.getElementById('new-pass-1').value;
    const p2 = document.getElementById('new-pass-2').value;

    if (!p1 || !p2) return showToast("Password tidak boleh kosong", "warning");
    if (p1 !== p2) return showToast("Konfirmasi password tidak cocok", "error");
    if (p1.length < 4) return showToast("Password minimal 4 karakter", "warning");

    // Simpan ke Local Storage
    SantriManager.savePrefs(currentUser.nis, { password: p1 });
    
    showToast("Password berhasil diganti!", "success");
    document.getElementById('pass-modal').classList.add('hidden');
}

// --- FITUR GANTI AVATAR EMOJI (DIPERBAIKI) ---
window.openAvatarModal = function() {
    toggleUserDropdown(); // Tutup menu dropdown
    const modal = document.getElementById('avatar-modal');
    if(modal) modal.classList.remove('hidden');

    const emojis = ["😎", "🤓", "🤠", "😊", "😇", "🤖", "👻", "🐯", "🐱", "🐶", "🦁", "🐼", "🐸", "🎓", "🕌", "🚀", "⭐", "🔥", "⚽", "🎨"];
    const grid = document.getElementById('emoji-grid');
    if(!grid) return;
    
    grid.innerHTML = ''; // Reset grid

    emojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = "text-3xl hover:scale-110 hover:bg-orange-100 transition p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm cursor-pointer";
        btn.innerHTML = emoji;
        
        // Event Listener langsung pada elemen
        btn.onclick = function() {
            saveAvatar(emoji);
        };
        
        grid.appendChild(btn);
    });
}

window.saveAvatar = function(emoji) {
    if (!currentUser || !currentUser.isSantri) return;

    // --- PERBAIKAN LOGIKA SVG ---
    // Menggunakan encodeURIComponent agar Emoji (Unicode) tidak error
    const svgString = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
        <style>text{font-family:sans-serif}</style>
        <rect width='100%' height='100%' fill='#f1f5f9'/>
        <text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-size='70'>${emoji}</text>
    </svg>`;
    
    // Konversi ke Data URI yang aman
    const avatarUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;

    // 1. Simpan ke Local Storage
    SantriManager.savePrefs(currentUser.nis, { avatar: avatarUrl });
    
    // 2. Update Tampilan di Header
    const imgEl = document.getElementById('user-avatar');
    if(imgEl) imgEl.src = avatarUrl;

    // 3. Update Tampilan di Dashboard (jika sedang terbuka)
    const dashEl = document.getElementById('dash-avatar');
    if(dashEl) dashEl.src = avatarUrl;
    
    // 4. Update Objek User di Memori
    currentUser.photoURL = avatarUrl;
    localStorage.setItem('lazismu_user_santri', JSON.stringify(currentUser));

    showToast("Avatar berhasil diganti!", "success");
    document.getElementById('avatar-modal').classList.add('hidden');
}

// --- 3. FITUR LINK AKUN GOOGLE ---
window.linkGoogleAccount = async function() {
    if (!currentUser || !currentUser.isSantri) return;
    
    // Cek apakah sudah terhubung?
    if (currentUser.linkedEmail) {
        return showToast(`Sudah terhubung dengan: ${currentUser.linkedEmail}`, "info");
    }

    toggleUserDropdown();
    
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Cek apakah email ini sudah dipakai santri lain?
        const existingLink = SantriManager.findNisByEmail(user.email);
        if (existingLink && existingLink !== currentUser.nis) {
            return showToast("Email Google ini sudah dipakai santri lain.", "error");
        }

        // Simpan Link
        SantriManager.savePrefs(currentUser.nis, { linkedEmail: user.email });
        
        // Update Current User State
        currentUser.linkedEmail = user.email;
        localStorage.setItem('lazismu_user_santri', JSON.stringify(currentUser));
        
        // Update UI
        updateUIForLogin(currentUser);
        showToast("Akun Google berhasil dihubungkan!", "success");

    } catch (error) {
        console.error(error);
        showToast("Gagal menghubungkan akun.", "error");
    }
}

// ============================================================
// JEMBATAN PENGHUBUNG (EXPOSE KE GLOBAL WINDOW)
// ============================================================

// 1. Auth
window.doLogin = doLogin;
window.doLogout = doLogout;

// 2. Navigasi & UI
window.showPage = showPage;
window.copyText = copyText;
window.hideLoginSuggestion = hideLoginSuggestion; // <-- PENTING

// 3. Fitur Berita
window.filterNews = filterNews;
window.loadMoreNews = loadMoreNews;
window.openNewsModal = openNewsModal;
window.closeNewsModal = closeNewsModal;

// 4. Fitur QRIS & Donasi
window.openQrisModal = openQrisModal;
window.closeQrisModal = closeQrisModal;
window.openReceiptWindow = openReceiptWindow;
window.startBeautificationDonation = startBeautificationDonation; // <-- Untuk Paket

// 5. Init
window.init = init;
window.scrollToSection = scrollToSection;
window.loginWithGoogle = loginWithGoogle;
window.loginWithNIS = loginWithNIS;
window.closeLoginModal = closeLoginModal;
window.toggleUserDropdown = toggleUserDropdown;
window.showMyHistory = showMyHistory;
window.loadPersonalDashboard = loadPersonalDashboard;
window.openChangePassModal = openChangePassModal;
window.saveNewPassword = saveNewPassword;
window.openAvatarModal = openAvatarModal;
window.saveAvatar = saveAvatar;
window.linkGoogleAccount = linkGoogleAccount;
