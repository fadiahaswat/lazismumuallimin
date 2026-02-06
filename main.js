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

/* =========================================
   SISTEM GAMIFIKASI & APRESIASI SANTRI
   ========================================= */

// Data Config (Mudah diedit di masa depan)
const TIER_DATA = [
    {
        level: 1,
        name: "Pejuang Kebaikan",
        min: 500000,
        color: "from-amber-400 to-orange-500",
        icon: "fas fa-star",
        benefits: [
            "Sertifikat Penghargaan",
            "30 Poin Prestasi Siswa"
        ]
    },
    {
        level: 2,
        name: "Ksatria Dermawan",
        min: 1000000,
        color: "from-blue-400 to-indigo-600",
        icon: "fas fa-shield-alt",
        benefits: [
            "Semua Benefit Level 1",
            "Exclusive Goodybag Lazismu",
            "Prioritas Pelayanan"
        ]
    },
    {
        level: 3,
        name: "Pahlawan Lazismu",
        min: 5000000,
        color: "from-purple-500 to-pink-600",
        icon: "fas fa-crown",
        benefits: [
            "Semua Benefit Level 2",
            "Voucher Bebas SPP 1 Bulan",
            "Gala Dinner Bersama Direksi"
        ]
    }
];

const RULES_DATA = [
    {
        title: "Dokumen Hilang",
        desc: "Kehilangan map/amplop/dokumen fisik fundraising.",
        sanction: "Denda Ganti Cetak Rp 50.000",
        icon: "fas fa-file-excel",
        color: "text-red-500 bg-red-50"
    },
    {
        title: "Lalai Lapor",
        desc: "Tidak melaporkan hasil perolehan sesuai tenggat waktu.",
        sanction: "Surat Pernyataan Bermaterai (Rp 10.000)",
        icon: "fas fa-user-clock",
        color: "text-orange-500 bg-orange-50"
    }
];

// Fungsi Utama untuk Merender Gamifikasi
// Panggil fungsi ini saat Dashboard dimuat (misal di dalam loadPersonalDashboard)
function renderGamification(totalDonasiSantri) {
    const container = document.getElementById('gamification-container');
    if (!container) return;
    
    container.classList.remove('hidden'); // Tampilkan section

    // 1. Hitung Level Saat Ini
    let currentTierIdx = -1;
    let nextTier = TIER_DATA[0];
    
    // Cari level tertinggi yang sudah dicapai
    for (let i = 0; i < TIER_DATA.length; i++) {
        if (totalDonasiSantri >= TIER_DATA[i].min) {
            currentTierIdx = i;
        }
    }

    // Tentukan target berikutnya
    if (currentTierIdx < TIER_DATA.length - 1) {
        nextTier = TIER_DATA[currentTierIdx + 1];
    } else {
        nextTier = null; // Sudah max level
    }

    // 2. Update Header UI
    const tierNameEl = document.getElementById('current-tier-name');
    const nextInfoEl = document.getElementById('next-tier-info');
    const progressBar = document.getElementById('tier-progress-bar');
    const targetLabel = document.getElementById('target-next-tier');
    const totalEl = document.getElementById('user-total-progress');

    // Format Rupiah helper
    const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

    totalEl.innerText = fmt(totalDonasiSantri);

    if (currentTierIdx === -1) {
        tierNameEl.innerText = "Pemula";
        tierNameEl.className = "text-3xl md:text-4xl font-black text-slate-400";
        nextInfoEl.innerHTML = `Butuh <strong>${fmt(nextTier.min - totalDonasiSantri)}</strong> lagi untuk naik level.`;
        
        // Hitung persentase ke level 1
        let pct = (totalDonasiSantri / nextTier.min) * 100;
        progressBar.style.width = `${pct}%`;
        targetLabel.innerText = `Target: ${fmt(nextTier.min)}`;
        
    } else if (nextTier) {
        const currTier = TIER_DATA[currentTierIdx];
        tierNameEl.innerText = currTier.name;
        // Ubah warna text sesuai tier
        if(currentTierIdx === 0) tierNameEl.className = "text-3xl md:text-4xl font-black text-amber-500";
        if(currentTierIdx === 1) tierNameEl.className = "text-3xl md:text-4xl font-black text-indigo-600";
        if(currentTierIdx === 2) tierNameEl.className = "text-3xl md:text-4xl font-black text-pink-600";

        nextInfoEl.innerHTML = `Luar biasa! <strong>${fmt(nextTier.min - totalDonasiSantri)}</strong> lagi menuju ${nextTier.name}.`;
        
        // Progress bar logic (range antara current tier min dan next tier min)
        const range = nextTier.min - currTier.min;
        const currentInTier = totalDonasiSantri - currTier.min;
        let pct = (currentInTier / range) * 100;
        progressBar.style.width = `${pct}%`;
        targetLabel.innerText = `Next: ${fmt(nextTier.min)}`;

    } else {
        // Max Level
        const maxTier = TIER_DATA[TIER_DATA.length - 1];
        tierNameEl.innerText = maxTier.name + " (MAX)";
        tierNameEl.className = "text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600";
        nextInfoEl.innerText = "Anda adalah legenda kebaikan!";
        progressBar.style.width = "100%";
        targetLabel.innerText = "Unstoppable";
    }

    // 3. Render Reward Cards
    const rewardsContainer = document.getElementById('content-rewards');
    rewardsContainer.innerHTML = '';

    TIER_DATA.forEach((tier, index) => {
        const isUnlocked = index <= currentTierIdx;
        const isNext = index === currentTierIdx + 1;
        
        // Styling logic
        let cardClass = isUnlocked 
            ? "bg-white border-emerald-500 shadow-xl shadow-emerald-500/10 transform -translate-y-2" 
            : (isNext ? "bg-white border-slate-200 opacity-100" : "bg-slate-50 border-slate-100 opacity-60 grayscale");
            
        let iconBg = isUnlocked ? `bg-gradient-to-br ${tier.color} text-white` : "bg-slate-200 text-slate-400";
        let statusBadge = isUnlocked 
            ? `<span class="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full"><i class="fas fa-check"></i> Dicapai</span>`
            : (isNext ? `<span class="absolute top-4 right-4 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">Target Berikutnya</span>` : `<span class="absolute top-4 right-4 bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full"><i class="fas fa-lock"></i> Terkunci</span>`);

        const benefitsList = tier.benefits.map(b => 
            `<li class="flex items-start gap-2 text-xs text-slate-600 mb-1">
                <i class="fas fa-check-circle ${isUnlocked ? 'text-emerald-500' : 'text-slate-300'} mt-0.5"></i> ${b}
             </li>`
        ).join('');

        const html = `
        <div class="relative p-6 rounded-3xl border-2 transition-all duration-300 group ${cardClass}">
            ${statusBadge}
            <div class="w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center text-xl shadow-lg mb-4 transition-transform group-hover:scale-110">
                <i class="${tier.icon}"></i>
            </div>
            <h4 class="font-black text-lg text-slate-800 mb-1">${tier.name}</h4>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Target: ${fmt(tier.min)}</p>
            
            <div class="h-px bg-slate-100 w-full mb-4"></div>
            
            <ul class="space-y-2">
                ${benefitsList}
            </ul>
        </div>
        `;
        rewardsContainer.innerHTML += html;
    });

    // 4. Render Rules Cards
    const rulesContainer = document.getElementById('content-rules');
    rulesContainer.innerHTML = '';
    
    RULES_DATA.forEach(rule => {
        const html = `
        <div class="flex items-start gap-5 bg-white p-6 rounded-3xl border border-slate-100 hover:border-red-200 hover:shadow-lg transition-all">
            <div class="w-12 h-12 rounded-full ${rule.color} flex items-center justify-center text-xl shrink-0">
                <i class="${rule.icon}"></i>
            </div>
            <div>
                <h4 class="font-bold text-slate-800 text-lg mb-1">${rule.title}</h4>
                <p class="text-sm text-slate-500 mb-3 leading-relaxed">${rule.desc}</p>
                <div class="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-bold inline-block border border-red-100">
                    <i class="fas fa-gavel mr-1"></i> ${rule.sanction}
                </div>
            </div>
        </div>
        `;
        rulesContainer.innerHTML += html;
    });
}

// Fungsi Tab Switcher
window.switchTab = function(tabName) {
    const rewardsContent = document.getElementById('content-rewards');
    const rulesContent = document.getElementById('content-rules');
    const btnRewards = document.getElementById('tab-btn-rewards');
    const btnRules = document.getElementById('tab-btn-rules');

    if (tabName === 'rewards') {
        rewardsContent.classList.remove('hidden');
        rulesContent.classList.add('hidden');
        
        btnRewards.className = "px-6 py-2.5 rounded-xl bg-white text-slate-800 font-bold text-sm shadow-sm transition-all";
        btnRules.className = "px-6 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 font-bold text-sm hover:bg-white/50 transition-all";
    } else {
        rewardsContent.classList.add('hidden');
        rulesContent.classList.remove('hidden');

        btnRules.className = "px-6 py-2.5 rounded-xl bg-white text-slate-800 font-bold text-sm shadow-sm transition-all";
        btnRewards.className = "px-6 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 font-bold text-sm hover:bg-white/50 transition-all";
    }
}

// Expose render function to window so other modules can call it
window.renderGamification = renderGamification;
