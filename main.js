// 1. Imports
import { loginWithGoogle, loginWithNIS, doLogout, linkGoogleAccount, updateUIForLogout } from './firebase-init.js';
import { showPage, scrollToSection, setupNavigation, setupModalLogic, toggleUserDropdown, toggleProfileDropdown, openChangePassModal, saveNewPassword, openAvatarModal, saveAvatar, hideLoginSuggestion } from './ui-navigation.js';
import { setupWizardLogic, goToStep, startBeautificationDonation } from './feature-donation.js';
import { setupHistoryLogic, loadRiwayat, loadPersonalDashboard, openReceiptWindow } from './feature-history.js';
import { fetchNews, filterNews, loadMoreNews, openNewsModal, closeNewsModal } from './feature-news.js';
import { setupRekapLogic, exportRekapPDF } from './feature-recap.js';
import { parseSantriData } from './santri-manager.js';
import { copyText, showToast } from './utils.js';
import { qrisDatabase } from './config.js';

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

// 2. Initialization Function
async function init() {
    console.log("Memulai inisialisasi aplikasi...");

    // A. JALANKAN TEKS LOADING BERJALAN
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
    }, 800); 

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
        // C. HILANGKAN LOADING SCREEN
        clearInterval(textInterval); 
        
        const preloader = document.getElementById('app-preloader');
        if (preloader) {
            const textEl = document.getElementById('loader-text');
            if(textEl) textEl.innerText = "Selesai!";

            setTimeout(() => {
                preloader.classList.add('fade-out'); 
                
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 500);
            }, 500);
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

// History & Dashboard
window.loadRiwayat = loadRiwayat;
window.openReceiptWindow = openReceiptWindow;
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

// Recap & Utils
window.exportRekapPDF = exportRekapPDF;
window.copyText = copyText;
window.openQrisModal = openQrisModal;
window.closeQrisModal = closeQrisModal;

// Run Init
document.addEventListener('DOMContentLoaded', () => {
    init();
});

/* ============================================================================
   LOGIKA ZAKAT MAAL (WAJIB TARUH DI MAIN.JS PALING BAWAH)
   ============================================================================ */

// 1. Format Input Rupiah saat mengetik
window.formatInputRupiah = function(input) {
    let val = input.value.replace(/\D/g, ''); // Hanya angka
    if (val === '') {
        input.value = '';
    } else {
        // Format angka dengan titik ribuan
        input.value = parseInt(val).toLocaleString('id-ID');
    }
};

// 2. Switch Tab Mode (Manual / Kalkulator)
window.switchZakatMode = function(mode) {
    const btnManual = document.getElementById('btn-mode-manual');
    const btnCalc = document.getElementById('btn-mode-calculator');
    const divManual = document.getElementById('mode-manual');
    const divCalc = document.getElementById('mode-calculator');

    if (!btnManual || !btnCalc || !divManual || !divCalc) return;

    if (mode === 'manual') {
        // Aktifkan Tab Manual
        btnManual.className = "flex-1 py-3 text-sm font-bold rounded-lg bg-white text-amber-600 shadow-sm transition-all border border-slate-100";
        btnCalc.className = "flex-1 py-3 text-sm font-bold rounded-lg text-slate-500 hover:text-amber-600 transition-all";
        divManual.classList.remove('hidden');
        divCalc.classList.add('hidden');
    } else {
        // Aktifkan Tab Kalkulator
        btnCalc.className = "flex-1 py-3 text-sm font-bold rounded-lg bg-white text-amber-600 shadow-sm transition-all border border-slate-100";
        btnManual.className = "flex-1 py-3 text-sm font-bold rounded-lg text-slate-500 hover:text-amber-600 transition-all";
        divCalc.classList.remove('hidden');
        divManual.classList.add('hidden');
    }
};

// 3. Logika Hitung Zakat
window.calculateZakat = function() {
    const inputs = document.querySelectorAll('.calc-input');
    let totalHarta = 0;
    let hutang = 0;

    // Ambil 3 input pertama (Aset)
    for(let i=0; i<3; i++) {
        let val = inputs[i].value.replace(/\D/g, '');
        totalHarta += parseInt(val || 0);
    }

    // Input ke-4 (Hutang)
    let valHutang = inputs[3].value.replace(/\D/g, '');
    hutang = parseInt(valHutang || 0);

    const hartaBersih = totalHarta - hutang;
    const NISAB_TAHUN = 85685972; // SK BAZNAS 2025

    // Tampilkan Container Hasil
    const resultDiv = document.getElementById('calc-result');
    if(resultDiv) resultDiv.classList.remove('hidden');
    
    // Tampilkan Total Harta
    const elTotalHarta = document.getElementById('total-harta');
    if(elTotalHarta) elTotalHarta.innerText = "Rp " + hartaBersih.toLocaleString('id-ID');

    const divWajib = document.getElementById('status-wajib');
    const divTidak = document.getElementById('status-tidak-wajib');

    if (hartaBersih >= NISAB_TAHUN) {
        // WAJIB ZAKAT
        if(divWajib) divWajib.classList.remove('hidden');
        if(divTidak) divTidak.classList.add('hidden');

        // Hitung 2.5%
        const zakat = Math.ceil(hartaBersih * 0.025);
        const elAmount = document.getElementById('final-zakat-amount');
        if(elAmount) {
            elAmount.innerText = "Rp " + zakat.toLocaleString('id-ID');
            elAmount.dataset.value = zakat;
        }
    } else {
        // TIDAK WAJIB
        if(divWajib) divWajib.classList.add('hidden');
        if(divTidak) divTidak.classList.remove('hidden');
    }
};

// 4. Terapkan Hasil Hitungan ke Input Manual
window.applyZakatResult = function() {
    const elAmount = document.getElementById('final-zakat-amount');
    if (!elAmount) return;

    let nominal = parseInt(elAmount.dataset.value) || 0;
    
    // Pindah ke tab manual
    switchZakatMode('manual');
    
    // Masukkan ke input manual
    const inputManual = document.getElementById('manual-zakat-input');
    if (inputManual) {
        if (nominal > 0) {
            inputManual.value = nominal.toLocaleString('id-ID');
        } else {
            inputManual.value = ""; 
            inputManual.focus();
        }
    }
};

// 5. Tombol Lanjut (Dari Zakat Maal ke Data Diri)
window.handleManualZakatNext = function() {
    const input = document.getElementById('manual-zakat-input');
    if (!input) return;

    const cleanVal = parseInt(input.value.replace(/\D/g, '')) || 0;

    if (cleanVal < 10000) {
        // Menggunakan showToast dari main.js (pastikan utils.js ter-import)
        if(typeof showToast === 'function') {
            showToast('Minimal nominal Rp 10.000', 'warning');
        } else {
            alert('Minimal nominal Rp 10.000');
        }
        return;
    }

    // Simpan ke state global donasi (Variable donasiData ada di main.js)
    if (typeof donasiData !== 'undefined') {
        donasiData.nominal = cleanVal;
        donasiData.nominalAsli = cleanVal;
    }

    // Pindah Langkah (Sembunyikan Step 1 & 2, Munculkan Step 3)
    const step1 = document.getElementById('donasi-step-1');
    const step2 = document.getElementById('donasi-step-2');
    const step3 = document.getElementById('donasi-step-3');

    if(step1) step1.classList.add('hidden');
    if(step2) step2.classList.add('hidden'); 
    if(step3) {
        step3.classList.remove('hidden');
        step3.classList.add('animate-fade-in-up');
    }
    
    // Update Progress Bar Wizard
    const indicator = document.getElementById('wizard-step-indicator');
    const bar = document.getElementById('wizard-progress-bar');
    if (indicator) indicator.innerText = `Step 3/5`;
    if (bar) bar.style.width = `60%`;
    
    // Update judul wizard
    const title = document.getElementById('wizard-title');
    const sub = document.getElementById('wizard-subtitle');
    if(title) title.innerText = "Isi Data Diri";
    if(sub) sub.innerText = "Agar tercatat dengan rapi.";
    
    // Scroll ke wizard
    const wizard = document.getElementById('donasi-wizard');
    if (wizard) wizard.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
