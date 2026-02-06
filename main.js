// 1. Imports
import { loginWithGoogle, loginWithNIS, doLogout, linkGoogleAccount, updateUIForLogout } from './firebase-init.js';
import { showPage, scrollToSection, setupNavigation, setupModalLogic, toggleUserDropdown, toggleProfileDropdown, openChangePassModal, saveNewPassword, openAvatarModal, saveAvatar, hideLoginSuggestion } from './ui-navigation.js';
import { setupWizardLogic, goToStep, startBeautificationDonation, confirmPackageChoice } from './feature-donation.js';
import { setupHistoryLogic, loadRiwayat, loadPersonalDashboard, openReceiptWindow, refreshDashboard, refreshRiwayat } from './feature-history.js';
import { fetchNews, filterNews, loadMoreNews, openNewsModal, closeNewsModal, refreshNews } from './feature-news.js';
import { setupRekapLogic, exportRekapPDF, refreshRekap } from './feature-recap.js';
import { parseSantriData } from './santri-manager.js';
import { copyText, showToast } from './utils.js';
import { qrisDatabase } from './config.js';
import { donasiData } from './state.js';
import { formatInputRupiah, switchZakatMode, calculateZakat, applyZakatResult, handleManualZakatNext } from './zakat-calculator.js';

// --- LOGIKA MODAL QRIS ---
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

// Cache configuration constants (must match data-santri.js)
const CACHE_KEY = 'santri_data_cache';
const CACHE_TIME_KEY = 'santri_data_time';
const CACHE_EXPIRY_HOURS = 24;

// Helper function to check if valid cache exists
function hasCachedData() {
    const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
    
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    
    if (!cachedData || !cachedTime) return false;
    
    const now = new Date().getTime();
    const cacheTimestamp = parseInt(cachedTime, 10);
    
    // Validate parsed timestamp
    if (isNaN(cacheTimestamp)) return false;
    
    return (now - cacheTimestamp) < (CACHE_EXPIRY_HOURS * MILLISECONDS_PER_HOUR);
}

// 2. Initialization Function
async function init() {
    console.log("Memulai inisialisasi aplikasi...");

    // Check if we should show preloader
    const shouldShowPreloader = !hasCachedData();
    const preloader = document.getElementById('app-preloader');
    
    // If we have cached data, hide preloader immediately
    if (!shouldShowPreloader && preloader) {
        preloader.style.display = 'none';
        console.log("Menggunakan data cache, melewati preloader...");
    }

    // A. JALANKAN TEKS LOADING BERJALAN (only if showing preloader)
    const loadingTexts = [
        "Menghubungkan ke Server...",
        "Mengambil Data Santri...",
        "Menyiapkan Data Kelas...",
        "Hampir Selesai..."
    ];
    let textIdx = 0;
    let textInterval = null;
    
    if (shouldShowPreloader) {
        const loaderText = document.getElementById('loader-text');
        if (loaderText) {
            textInterval = setInterval(() => {
                textIdx = (textIdx + 1) % loadingTexts.length;
                loaderText.innerText = loadingTexts[textIdx];
            }, 800);
        }
    } 

    // B. PROSES AMBIL DATA
    try {
        const promises = [];
        // Pastikan fungsi ini ada di global (dari script.js lain jika belum dimodularkan)
        if (typeof window.loadSantriData === 'function') promises.push(window.loadSantriData());
        if (typeof window.loadClassData === 'function') promises.push(window.loadClassData());

        await Promise.all(promises);

        if (typeof window.santriData !== 'undefined' && window.santriData.length > 0) {
            console.log("Data Santri OK:", window.santriData.length);
            parseSantriData();
        } else {
            console.warn("Data santri kosong/gagal dimuat.");
        }

        if (typeof window.classMetaData !== 'undefined' && Object.keys(window.classMetaData).length > 0) {
            console.log("Data Wali Kelas OK.");
        }

        setupNavigation();
        setupWizardLogic();
        setupHistoryLogic();
        setupModalLogic();
        setupRekapLogic();
        
        // Handle Initial Hash Load
        const hash = window.location.hash.replace('#', '') || 'home';
        if (document.getElementById(`page-${hash}`)) {
            showPage(hash);
        } else {
            showPage('home');
        }

        // Fetch news category initially (simulated)
        // fetchNewsCategories(); 

    } catch (error) {
        console.error("Terjadi kesalahan fatal:", error);
        alert("Gagal memuat data. Silakan refresh halaman.");
    } finally {
        // C. HILANGKAN LOADING SCREEN & CLEANUP INTERVAL (only if showing preloader)
        if (textInterval) {
            clearInterval(textInterval);
            textInterval = null;
        }
        
        // Re-query preloader in case DOM was modified during async operations
        if (shouldShowPreloader) {
            const preloaderFinal = document.getElementById('app-preloader');
            if (preloaderFinal) {
                const loaderTextFinal = document.getElementById('loader-text');
                if(loaderTextFinal) loaderTextFinal.innerText = "Selesai!";

                setTimeout(() => {
                    preloaderFinal.classList.add('fade-out'); 
                    
                    setTimeout(() => {
                        preloaderFinal.style.display = 'none';
                    }, 500);
                }, 500);
            }
        }
    }
}

// Header Scroll Effect
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


// 3. EXPOSE TO GLOBAL SCOPE (CRUCIAL for HTML inline events)
window.init = init;

// Auth
window.loginWithGoogle = loginWithGoogle;
window.loginWithNIS = loginWithNIS;
window.doLogin = function() { 
    const modal = document.getElementById('login-modal');
    if(modal) modal.classList.remove('hidden');
};
window.closeLoginModal = function() { 
    const modal = document.getElementById('login-modal');
    if(modal) modal.classList.add('hidden');
};
window.doLogout = doLogout;
window.linkGoogleAccount = linkGoogleAccount;

// UI & Nav
window.showPage = showPage;
window.scrollToSection = scrollToSection;
window.toggleUserDropdown = toggleUserDropdown;
window.toggleProfileDropdown = toggleProfileDropdown;
window.hideLoginSuggestion = hideLoginSuggestion;
window.openChangePassModal = openChangePassModal;
window.saveNewPassword = saveNewPassword;
window.openAvatarModal = openAvatarModal;
window.saveAvatar = saveAvatar;

// Donation
window.goToStep = goToStep;
window.startBeautificationDonation = startBeautificationDonation;
window.confirmPackageChoice = confirmPackageChoice; // <--- TAMBAHKAN INI

// History & Dashboard
window.loadRiwayat = loadRiwayat;
window.openReceiptWindow = openReceiptWindow;
window.refreshDashboard = refreshDashboard;
window.showMyHistory = function() {
    // Membuka modal history pribadi
    // Import state dilakukan di dalam modul feature-history, 
    // tapi karena tombol di HTML memanggil ini, kita perlu logic sederhana di sini atau import currentUser
    // Untuk simplifikasi, kita asumsikan modal dihandle CSS dan logic isi data dihandle loadPersonalDashboard
    const modal = document.getElementById('my-history-modal');
    if(modal) modal.classList.remove('hidden');
    // Panggil load dashboard agar data refresh
    // Kita butuh akses currentUser di sini, tapi karena modular, 
    // kita biarkan loadPersonalDashboard menanganinya jika dipanggil.
    // Di kode asli, showMyHistory memfilter riwayatData.allData berdasarkan currentUser.
    
    // Kita gunakan jembatan ke feature-history jika diperlukan, 
    // namun logic filter sudah ada di loadPersonalDashboard.
    // Kita panggil loadPersonalDashboard dengan parameter null (akan ambil dari currentUser global di state)
    loadPersonalDashboard(null); 
};
window.loadPersonalDashboard = loadPersonalDashboard; // Expose jika perlu dipanggil manual

// News
window.filterNews = filterNews;
window.loadMoreNews = loadMoreNews;
window.openNewsModal = openNewsModal;
window.closeNewsModal = closeNewsModal;
window.resetNewsFilter = function() { filterNews(''); };
window.refreshNews = refreshNews;

// Recap & Utils
window.exportRekapPDF = exportRekapPDF;
window.refreshRekap = refreshRekap;
window.copyText = copyText;
window.openQrisModal = openQrisModal;
window.closeQrisModal = closeQrisModal;

// History refresh
window.refreshRiwayat = refreshRiwayat;

// Run Init
document.addEventListener('DOMContentLoaded', () => {
    init();
});

/* ============================================================================
   LOGIKA ZAKAT MAAL - Expose functions to window for HTML inline handlers
   ============================================================================ */

// Expose zakat calculator functions to window for HTML inline event handlers
window.formatInputRupiah = formatInputRupiah;
window.switchZakatMode = switchZakatMode;
window.calculateZakat = calculateZakat;
window.applyZakatResult = applyZakatResult;
window.handleManualZakatNext = handleManualZakatNext;
