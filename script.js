// --- IMPORT FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- CONFIG FIREBASE (PASTE DARI CONSOLE SEPERTI DI ADMIN KEMARIN) ---
const firebaseConfig = {
  apiKey: "AIzaSyAWPIcS8h3kE6kJYBxjeVFdSprgrMzOFo8",
  authDomain: "lazismu-auth.firebaseapp.com",
  projectId: "lazismu-auth",
  storageBucket: "lazismu-auth.firebasestorage.app",
  messagingSenderId: "398570239500",
  appId: "1:398570239500:web:0b3e96109a4bf304ebe029"
};

// --- INIT ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
let currentUser = null; // Menyimpan data user yang sedang login

// GANTI FUNGSI doLogin DENGAN INI:

window.doLogin = async function() {
    const btn = document.getElementById('btn-google-login');
    const label = document.getElementById('label-login');
    
    // 1. Matikan tombol biar tidak bisa diklik berkali-kali
    if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        if(label) label.innerText = "Memproses...";
    }

    try {
        // 2. Eksekusi Login
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        console.log("Login sukses:", user.displayName);
        showToast(`Ahlan Wa Sahlan, ${user.displayName.split(' ')[0]}!`, 'success');
        
        // Tombol biarkan mati karena halaman akan berubah tampilan (kena onAuthStateChanged)
        
    } catch (error) {
        console.error("Login Error:", error);

        // Handle error khusus
        if (error.code === 'auth/popup-blocked') {
            alert("Popup Login terblokir browser. Izinkan popup untuk situs ini.");
        } else if (error.code === 'auth/popup-closed-by-user') {
            showToast("Login dibatalkan", 'warning');
        } else {
            showToast("Gagal login: " + error.message, 'error');
        }

        // 3. Hidupkan tombol lagi jika gagal
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            if(label) label.innerText = "Masuk Akun";
        }
    }
}

// Fungsi Logout (DIPERBAIKI)
window.doLogout = function() {
    signOut(auth).then(() => {
        showToast("Berhasil keluar", 'success');
        
        // 1. Paksa URL kembali ke Home (hapus #dashboard)
        window.location.hash = "#home";
        
        // 2. Refresh halaman untuk membersihkan memori data user
        // Menggunakan replace agar history back tidak kembali ke dashboard
        window.location.replace(window.location.pathname + "#home");
        window.location.reload();
    });
}

// --- UPDATE SCRIPT.JS (Bagian Auth Listener) ---

// Satpam Pemantau (Cek status login)
onAuthStateChanged(auth, (user) => {
    const btnWrapper = document.getElementById('login-btn-wrapper'); // Gunakan wrapper
    const profileMenu = document.getElementById('user-profile-menu');
    const inputNama = document.getElementById('nama-muzakki-input');
    const inputEmail = document.getElementById('email');
    
    if (user) {
        // --- USER LOGIN ---
        currentUser = user; // Simpan ke variabel global

        // 1. UI Header: Sembunyikan tombol login, Munculkan profil
        if (btnWrapper) btnWrapper.style.display = 'none'; // Pakai inline style biar keras
        if (profileMenu) {
            profileMenu.classList.remove('hidden');
            profileMenu.classList.add('flex'); // Pastikan flex aktif
        }

        // 2. Isi Data Profil di Header
        if(document.getElementById('user-avatar')) document.getElementById('user-avatar').src = user.photoURL || "https://ui-avatars.com/api/?name=" + user.displayName;
        if(document.getElementById('user-name')) document.getElementById('user-name').textContent = user.displayName;
        
        // 3. Auto-Fill Form Donasi
        if(inputNama) inputNama.value = user.displayName;
        if(inputEmail) {
            inputEmail.value = user.email;
            inputEmail.readOnly = true;
            inputEmail.classList.add('bg-slate-100', 'text-slate-500');
        }
        if (typeof loadPersonalDashboard === 'function') loadPersonalDashboard(user.email);

        // 4. Load Data Personal untuk Dashboard (Fungsi baru nanti)
        // if (typeof loadPersonalDashboard === 'function') loadPersonalDashboard(user.email);

    } else {
        // --- USER BELUM LOGIN / LOGOUT ---
        currentUser = null;

        // 1. UI Header: Munculkan tombol login
        if (btnWrapper) btnWrapper.style.display = 'block';
        if (profileMenu) {
            profileMenu.classList.add('hidden');
            profileMenu.classList.remove('flex');
        }

        // 2. Reset Form Donasi
        if(inputNama) inputNama.value = '';
        if(inputEmail) {
            inputEmail.value = '';
            inputEmail.readOnly = false;
            inputEmail.classList.remove('bg-slate-100', 'text-slate-500');
        }
    }
});

// Helper untuk dropdown profil di mobile/touch
window.toggleProfileDropdown = function() {
    const dropdown = document.getElementById('profile-dropdown-content');
    if (dropdown) dropdown.classList.toggle('hidden');
}

/**
 * ============================================================================
 * SCRIPT UTAMA WEBSITE DONASI LAZISMU (UPDATED)
 * ============================================================================
 * Update Log:
 * - Support format data santri JSON (Array) dan TSV (String)
 * - Integrasi Global Leaderboard di halaman Rekap
 * - Perbaikan logika deteksi data eksternal
 */

// Tampilkan Riwayat Donasi Pribadi
window.showMyHistory = function() {
    if (!currentUser) return showToast("Silakan login terlebih dahulu");

    const modal = document.getElementById('my-history-modal');
    const container = document.getElementById('my-history-content');
    modal.classList.remove('hidden');
    
    // Ambil data riwayat yang sudah ada di memori (riwayatData dari script.js lama)
    // Filter hanya yang email-nya sama dengan email Google User
    const myData = riwayatData.allData.filter(item => 
        (item.Email && item.Email.toLowerCase() === currentUser.email.toLowerCase())
    );

    if (myData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10">
                <div class="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500 text-2xl"><i class="fas fa-hand-holding-heart"></i></div>
                <h4 class="font-bold text-slate-700">Belum Ada Riwayat</h4>
                <p class="text-sm text-slate-400 mt-2">Donasi yang Anda lakukan dengan email ini akan muncul di sini.</p>
            </div>`;
    } else {
        let html = '';
        myData.forEach(d => {
            const statusColor = d.Status === 'Terverifikasi' ? 'text-green-600 bg-green-50 border-green-200' : 'text-yellow-600 bg-yellow-50 border-yellow-200';
            const statusIcon = d.Status === 'Terverifikasi' ? 'fa-check-circle' : 'fa-clock';
            
            html += `
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${d.JenisDonasi}</p>
                    <h4 class="font-black text-slate-800 text-lg">${formatRupiah(d.Nominal)}</h4>
                    <p class="text-xs text-slate-500 mt-1"><i class="far fa-calendar-alt mr-1"></i> ${new Date(d.Timestamp).toLocaleDateString()}</p>
                </div>
                <div class="text-right">
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold border ${statusColor} flex items-center gap-1">
                        <i class="fas ${statusIcon}"></i> ${d.Status || 'Proses'}
                    </span>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    }
}
// ============================================================================
// 1. KONFIGURASI (PENGATURAN DASAR)
// ============================================================================
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec";
const WORDPRESS_SITE = 'lazismumuallimin.wordpress.com';
const NEWS_PER_PAGE = 6;

// ============================================================================
// 2. PENYIMPANAN DATA SEMENTARA (STATE MANAGEMENT)
// ============================================================================

let donasiData = {
    type: null,
    subType: null,
    nominal: 0,
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
};

let riwayatData = {
    allData: [],          
    isLoaded: false,      
    currentPage: 1,       
    itemsPerPage: 10      
};

let timeFilterState = 'all';

let newsState = {
    page: 1,
    category: '',
    search: '',
    posts: [],
    isLoading: false,
    hasMore: true,
    isLoaded: false
};

// ============================================================================
// 3. INISIALISASI (SAAT WEBSITE PERTAMA KALI DIBUKA)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    init();
});

// Tambahkan kata 'async' di depan function
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
// 4. SISTEM NOTIFIKASI (TOAST)
// ============================================================================
function showToast(message, type = 'warning') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-exclamation-triangle text-orange-500';
    if (type === 'success') icon = 'fa-check-circle text-green-500';
    if (type === 'error') icon = 'fa-times-circle text-red-500';

    toast.innerHTML = `<i class="fas ${icon} text-xl"></i><span class="font-bold text-sm text-slate-700">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================================
// 5. FUNGSI BANTUAN (UTILITIES)
// ============================================================================

function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(`Berhasil disalin: ${text}`, 'success');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showToast(`Berhasil disalin: ${text}`, 'success');
    } catch (err) {
        showToast('Gagal menyalin text', 'error');
    }
    document.body.removeChild(textArea);
}

function formatRupiah(num) {
    return "Rp " + parseInt(num).toLocaleString('id-ID');
}

function timeAgo(date) {
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
    if (interval > 1) return Math.floor(interval) + " mnt lalu";
    return "Baru saja";
}

function animateValue(obj, start, end, duration, isCurrency = false) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const val = Math.floor(progress * (end - start) + start);
        obj.innerHTML = isCurrency ? formatRupiah(val) : val;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function generateUniqueCode() {
    // Menghasilkan angka acak antara 1 - 999
    return Math.floor(Math.random() * 999) + 1;
}

// ============================================================================
// 6. PENGOLAHAN DATA SANTRI (DIPERBAIKI)
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
// 7. SISTEM NAVIGASI HALAMAN
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
// 8. LOGIKA BERITA (WORDPRESS API)
// ============================================================================

async function fetchNewsCategories() {
    const container = document.getElementById('news-filter-container');
    if (!container) return;

    try {
        const res = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${WORDPRESS_SITE}/categories`);
        const data = await res.json();

        let html = `<button data-slug="" onclick="filterNews('')" class="news-filter-btn active bg-brand-orange text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition">Semua</button>`;

        if (data.categories) {
            data.categories.forEach(cat => {
                if (cat.post_count > 0) {
                    html += `<button data-slug="${cat.slug}" onclick="filterNews('${cat.slug}')" class="news-filter-btn bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition">${cat.name}</button>`;
                }
            });
        }
        container.innerHTML = html;
    } catch (e) {
        console.error("Gagal ambil kategori", e);
        container.innerHTML = `<button data-slug="" onclick="filterNews('')" class="news-filter-btn active bg-brand-orange text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition">Semua</button>`;
    }
}

async function fetchNews(isLoadMore = false) {
    if (newsState.isLoading) return;
    newsState.isLoading = true;

    if (isLoadMore) {
        const btnMore = document.getElementById('btn-news-load-more');
        if (btnMore) btnMore.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';
    } else {
        const grid = document.getElementById('news-grid');
        if(grid) grid.innerHTML = '<div class="col-span-full text-center py-20"><div class="animate-spin inline-block w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full mb-4"></div><p class="text-slate-400">Memuat berita terbaru...</p></div>';
    }

    let apiURL = `https://public-api.wordpress.com/rest/v1.1/sites/${WORDPRESS_SITE}/posts/?number=${NEWS_PER_PAGE}&page=${newsState.page}`;

    if (newsState.search) {
        apiURL += `&search=${encodeURIComponent(newsState.search)}`;
    }
    if (newsState.category) {
        apiURL += `&category=${encodeURIComponent(newsState.category)}`;
    }

    try {
        const res = await fetch(apiURL);
        const data = await res.json();

        newsState.isLoading = false;
        newsState.isLoaded = true;

        if (data.posts.length < NEWS_PER_PAGE) newsState.hasMore = false;
        else newsState.hasMore = true;

        if (isLoadMore) {
            newsState.posts = [...newsState.posts, ...data.posts];
        } else {
            newsState.posts = data.posts;
            const grid = document.getElementById('news-grid');
            if(grid) grid.innerHTML = '';
        }

        if (newsState.posts.length === 0) {
            let pesanKosong = "Tidak ada berita ditemukan.";
            if (newsState.category) pesanKosong = `Belum ada berita di kategori ini.`;

            const grid = document.getElementById('news-grid');
            if(grid) {
                grid.innerHTML = `
                <div class="col-span-full text-center py-24">
                    <div class="inline-block p-6 rounded-full bg-slate-50 mb-6 relative">
                        <div class="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                        <i class="far fa-folder-open text-5xl text-slate-300"></i>
                    </div>
                    <h3 class="text-xl font-bold text-slate-700 mb-2">Ups, Belum Ada Kabar</h3>
                    <p class="text-slate-400 max-w-xs mx-auto mb-8">${pesanKosong}</p>
                    <button onclick="resetNewsFilter()" class="bg-white border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 px-6 py-3 rounded-xl font-bold transition-all shadow-sm hover:shadow-md">
                        <i class="fas fa-undo mr-2"></i> Reset Filter
                    </button>
                </div>`;
            }
        } else {
            renderNewsGrid(isLoadMore ? data.posts : newsState.posts, isLoadMore);
        }

        const btnMore = document.getElementById('btn-news-load-more');
        if (btnMore) {
            btnMore.innerHTML = 'Muat Lebih Banyak <i class="fas fa-sync-alt ml-2"></i>';
            if (newsState.hasMore) btnMore.classList.remove('hidden');
            else btnMore.classList.add('hidden');
        }

    } catch (err) {
        console.error(err);
        newsState.isLoading = false;
        const grid = document.getElementById('news-grid');
        if(grid) grid.innerHTML = '<p class="text-center text-red-500 col-span-full">Gagal memuat berita. Periksa koneksi.</p>';
    }
}

function renderNewsGrid(postsToRender, appendMode) {
    const container = document.getElementById('news-grid');
    if(!container) return;

    let html = '';
    let startIndex = appendMode ? (newsState.posts.length - postsToRender.length) : 0;

    const getBadgeColor = (catName) => {
        const colors = [
            'bg-blue-50 text-blue-600 border-blue-100',
            'bg-orange-50 text-orange-600 border-orange-100',
            'bg-green-50 text-green-600 border-green-100',
            'bg-purple-50 text-purple-600 border-purple-100'
        ];
        let hash = 0;
        for (let i = 0; i < catName.length; i++) hash = catName.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    postsToRender.forEach((post, i) => {
        const globalIndex = startIndex + i;
        const img = post.featured_image || 'https://via.placeholder.com/600x400?text=Lazismu+Update';

        const dateObj = new Date(post.date);
        const day = dateObj.toLocaleDateString('id-ID', {
            day: '2-digit'
        });
        const month = dateObj.toLocaleDateString('id-ID', {
            month: 'short'
        });
        
        const categoryName = post.categories ? Object.values(post.categories)[0].name : 'Umum';
        const badgeClass = getBadgeColor(categoryName);

        html += `
        <div class="group flex flex-col h-full bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 overflow-hidden transform hover:-translate-y-2 cursor-pointer fade-in" onclick="openNewsModal(${globalIndex})">
            <div class="relative h-60 overflow-hidden">
                <div class="absolute inset-0 bg-slate-200 animate-pulse"></div> <img src="${img}" alt="${post.title}" class="w-full h-full object-cover transition duration-700 group-hover:scale-110 group-hover:rotate-1 relative z-10">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity z-20"></div>
                <div class="absolute top-4 right-4 z-30 bg-white/90 backdrop-blur-md rounded-2xl px-3 py-2 text-center shadow-lg border border-white/20">
                    <span class="block text-xl font-black text-slate-800 leading-none">${day}</span>
                    <span class="block text-[10px] font-bold text-slate-500 uppercase">${month}</span>
                </div>
                <div class="absolute bottom-4 left-4 z-30">
                    <span class="${badgeClass} px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border shadow-sm">
                        ${categoryName}
                    </span>
                </div>
            </div>
            <div class="p-6 md:p-8 flex flex-col flex-grow relative">
                <h3 class="font-bold text-xl text-slate-800 mb-3 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                    ${post.title}
                </h3>
                <p class="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                    ${stripHtml(post.excerpt)}
                </p>
                <div class="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div class="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <i class="far fa-user-circle"></i> Admin Lazismu
                    </div>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-sm">
                        <i class="fas fa-arrow-right transform group-hover:-rotate-45 transition-transform"></i>
                    </span>
                </div>
            </div>
        </div>`;
    });

    if (appendMode) container.innerHTML += html;
    else container.innerHTML = html;
}

function handleNewsSearch(e) {
    if (e.key === 'Enter') {
        newsState.search = e.target.value;
        newsState.page = 1;
        newsState.hasMore = true;
        fetchNews();
    }
}

function filterNews(cat) {
    newsState.category = cat;
    newsState.search = '';
    document.getElementById('news-search-input').value = '';
    newsState.page = 1;
    newsState.hasMore = true;

    document.querySelectorAll('.news-filter-btn').forEach(btn => {
        const btnSlug = btn.getAttribute('data-slug');
        if (btnSlug === cat) {
            btn.classList.remove('bg-gray-100', 'text-gray-600');
            btn.classList.add('bg-brand-orange', 'text-white');
        } else {
            btn.classList.add('bg-gray-100', 'text-gray-600');
            btn.classList.remove('bg-brand-orange', 'text-white');
        }
    });

    fetchNews();
}

function loadMoreNews() {
    newsState.page++;
    fetchNews(true);
}

function resetNewsFilter() {
    filterNews('');
}

function openNewsModal(index) {
    const post = newsState.posts[index];
    if (!post) return;

    const modal = document.getElementById('news-modal');
    const panel = document.getElementById('news-modal-panel');
    const container = document.getElementById('news-modal-content');

    const dateObj = new Date(post.date);
    const date = dateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const img = post.featured_image || 'https://via.placeholder.com/1200x600?text=Lazismu+Update';
    const category = post.categories ? Object.values(post.categories)[0].name : 'Berita';
    const author = post.author.name || 'Admin Lazismu';
    const avatar = post.author.avatar_URL || 'https://ui-avatars.com/api/?name=Admin+Lazismu&background=random';

    container.innerHTML = `
        <div class="relative h-[40vh] md:h-[50vh] w-full group overflow-hidden">
            <img src="${img}" class="w-full h-full object-cover" alt="Hero Image">
            <div class="absolute inset-0 bg-slate-900/70"></div>
            <div class="absolute bottom-0 left-0 w-full p-6 md:p-10 z-10">
                <span class="inline-block px-3 py-1 rounded bg-orange-500 text-white text-xs font-bold uppercase tracking-wider mb-3">
                    ${category}
                </span>
                <h2 class="text-2xl md:text-4xl font-black text-white leading-tight mb-4 drop-shadow-md">
                    ${post.title}
                </h2>
                <div class="flex items-center gap-3 text-white/90">
                    <img src="${avatar}" class="w-8 h-8 rounded-full border border-white/50 shadow-sm" alt="${author}">
                    <div class="text-xs md:text-sm font-medium">
                        <span>${author}</span> • <span class="opacity-80">${date}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-3xl mx-auto px-5 py-10 md:py-12">
            <div class="flex justify-between items-center border-b border-slate-100 pb-6 mb-8">
                <div class="flex items-center gap-2 text-slate-500 text-sm font-bold">
                    <i class="fas fa-share-alt"></i> Bagikan
                </div>
                <div class="flex gap-2">
                    <a href="https://wa.me/?text=${encodeURIComponent(post.title + ' ' + post.URL)}" target="_blank" class="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition"><i class="fab fa-whatsapp"></i></a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(post.URL)}" target="_blank" class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition"><i class="fab fa-facebook-f"></i></a>
                    <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(post.URL)}" target="_blank" class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-black transition group">
                          <img src="x.png" class="w-4 h-4 object-contain opacity-60 group-hover:invert group-hover:opacity-100 transition" alt="X">
                    </a>
                    <button onclick="copyText('${post.URL}')" class="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-600 hover:text-white transition"><i class="fas fa-link"></i></button>
                </div>
            </div>

            <div class="wp-content text-base md:text-lg text-slate-700 font-sans leading-loose text-justify">
                ${post.content}
            </div>

            <div class="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <h4 class="font-bold text-slate-800 mb-3">Mari wujudkan lebih banyak kebaikan</h4>
                <button onclick="closeNewsModal(); showPage('donasi');" class="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition shadow-lg flex items-center justify-center gap-2 mx-auto">
                    <i class="fas fa-heart text-red-500"></i> Donasi Sekarang
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    const progress = document.getElementById('reading-progress');
    if (progress) progress.style.width = '0%';

    setTimeout(() => {
        modal.classList.remove('opacity-0');
        panel.classList.remove('translate-y-full', 'scale-95');
        panel.classList.add('translate-y-0', 'scale-100');
    }, 10);

    document.body.style.overflow = 'hidden';
}

function closeNewsModal() {
    const modal = document.getElementById('news-modal');
    const panel = document.getElementById('news-modal-panel');

    modal.classList.add('opacity-0');
    panel.classList.remove('scale-100');
    panel.classList.add('scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
    document.body.style.overflow = 'auto';
}

function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

// ============================================================================
// 9. FITUR REKAPITULASI KELAS (EXPORT PDF) & LEADERBOARD
// ============================================================================
function setupRekapLogic() {
    const lvlSelect = document.getElementById('rekap-level-select');
    const clsSelect = document.getElementById('rekap-kelas-select');
    const btnExport = document.getElementById('btn-export-pdf');

    if (!lvlSelect || !clsSelect) return;

    if (!clsSelect.value) toggleRekapDisplay(false);

    lvlSelect.onchange = () => {
        const lvl = lvlSelect.value;
        clsSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>';

        if (lvl && santriDB[lvl]) {
            clsSelect.disabled = false;
            
            // 1. TAMPILKAN KELAS FISIK / REGULER
            const classes = Object.keys(santriDB[lvl]).sort();
            classes.forEach(cls => {
                clsSelect.appendChild(createOption(cls, `Kelas ${cls}`));
            });

            // ============================================================
            // 2. AUTO-DETECT TAHFIZH (LOGIKA OTOMATIS)
            // ============================================================
            
            // Cek apakah di level ini ada setidaknya 1 anak yang punya Musyrif Khusus?
            let adaAnakTahfizh = false;
            classes.forEach(namaKelas => {
                const dataSatuKelas = santriDB[lvl][namaKelas];
                // Cek jika ada murid yang kolom musyrifKhusus-nya terisi
                if (dataSatuKelas.some(s => s.musyrifKhusus && s.musyrifKhusus.trim() !== "")) {
                    adaAnakTahfizh = true;
                }
            });

            // Jika ditemukan anak tahfizh, OTOMATIS buatkan tombolnya
            if (adaAnakTahfizh) {
                // Kecuali untuk kasus spesial (4 & 6), kita pakai nama standar
                if (lvl !== '4' && lvl !== '6') {
                    clsSelect.appendChild(createOption(`tahfizh-${lvl}`, `Kelas ${lvl} Tahfizh`));
                }
            }

            // ============================================================
            // 3. LOGIKA SPESIAL GABUNGAN (Tetap Manual untuk Lintas Level)
            // ============================================================
            // Karena ini menggabungkan dua level berbeda, harus ditulis manual
            if (lvl === '4' || lvl === '6') {
                clsSelect.appendChild(createOption('tahfizh-4,6', 'Kelas 4 & 6 Tahfizh'));
            }

        } else {
            clsSelect.disabled = true;
        }
        
        toggleRekapDisplay(false);
        renderGlobalLeaderboard(); 
    };

    // Helper sederhana
    function createOption(val, text) {
        const opt = document.createElement('option');
        opt.value = val;
        opt.innerText = text;
        return opt;
    }

    clsSelect.onchange = () => {
        const cls = clsSelect.value;
        if (cls) {
            toggleRekapDisplay(true);
            renderRekapTable(cls);
        } else {
            toggleRekapDisplay(false);
            renderGlobalLeaderboard();
        }
    };

    if (btnExport) btnExport.onclick = () => exportRekapPDF();
}

function toggleRekapDisplay(showDetail) {
    const ph = document.getElementById('rekap-placeholder');
    const sum = document.getElementById('rekap-summary');
    const tbl = document.getElementById('rekap-table-container');
    const btnExport = document.getElementById('btn-export-pdf');

    // showDetail = true  => Tampilkan Tabel Kelas (Mode Detail)
    // showDetail = false => Tampilkan Leaderboard (Mode Umum)

    if (showDetail) {
        ph.classList.add('hidden'); // Sembunyikan placeholder/leaderboard
        sum.classList.remove('hidden');
        tbl.classList.remove('hidden');
        if (btnExport) btnExport.disabled = false;
    } else {
        ph.classList.remove('hidden'); // Tampilkan placeholder/leaderboard
        sum.classList.add('hidden');
        tbl.classList.add('hidden');
        if (btnExport) btnExport.disabled = true;
        renderGlobalLeaderboard(); // Pastikan leaderboard dirender
    }
}

function renderGlobalLeaderboard() {
    const container = document.getElementById('rekap-placeholder');
    if (!container) return;

    // Loading State
    if (!riwayatData.isLoaded || riwayatData.allData.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 space-y-4">
                <div class="relative">
                    <div class="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-75"></div>
                    <div class="relative bg-white p-4 rounded-full shadow-sm border border-orange-100">
                        <i class="fas fa-trophy text-4xl text-orange-400 animate-pulse"></i>
                    </div>
                </div>
                <p class="text-slate-400 font-medium text-sm animate-pulse">Sedang memuat data perolehan kelas...</p>
            </div>
        `;
        return;
    }

    // 1. Agregasi Data per Kelas
    const classTotals = {};
    riwayatData.allData.forEach(d => {
        const rombel = d.KelasSantri || d.rombelSantri;
        if (rombel) {
            const val = parseInt(d.Nominal) || 0;
            classTotals[rombel] = (classTotals[rombel] || 0) + val;
        }
    });

    // 2. Sort & Structure
    const leaderboard = Object.keys(classTotals).map(key => ({
        kelas: key,
        total: classTotals[key]
    })).sort((a, b) => b.total - a.total);

    if (leaderboard.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                <i class="far fa-folder-open text-4xl text-slate-300 mb-2"></i>
                <p class="text-slate-400 font-medium">Belum ada data donasi masuk.</p>
            </div>`;
        return;
    }

    // Max value for progress bars
    const maxVal = leaderboard[0].total;

    // 3. Render HTML
    let html = `
        <div class="max-w-4xl mx-auto px-2">
            <div class="text-center mb-10">
                <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 border border-orange-100 shadow-sm">
                    <span class="relative flex h-2 w-2">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    Live Update
                </div>
                <h3 class="text-3xl font-black text-slate-800 mb-2 tracking-tight">Klasemen Kebaikan</h3>
                <p class="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">Berlomba-lomba dalam kebaikan. Berikut adalah perolehan donasi tertinggi antar kelas.</p>
            </div>
            
            <div class="space-y-4">
    `;

    leaderboard.forEach((item, index) => {
        const rank = index + 1;
        const percent = (item.total / maxVal) * 100;
        
        // Ambil Data Wali & Musyrif
        const meta = (typeof classMetaData !== 'undefined' ? classMetaData[item.kelas] : null) || { 
            wali: '-', 
            musyrif: '-' 
        };

        let cardClass = "";
        let rankBadge = "";
        let textClass = "text-slate-700";
        let amountClass = "text-slate-800";
        let progressGradient = "bg-slate-200";
        let glowEffect = "";

        // Styling Juara
        if (rank === 1) {
            cardClass = "bg-gradient-to-r from-yellow-50 via-white to-white border-yellow-300 shadow-xl shadow-yellow-500/10 ring-1 ring-yellow-100 relative overflow-hidden transform hover:-translate-y-1";
            rankBadge = `<div class="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white flex flex-col items-center justify-center shadow-lg shadow-orange-300/50"><i class="fas fa-crown text-xs mb-0.5"></i><span class="font-black text-lg md:text-xl leading-none">1</span></div>`;
            progressGradient = "bg-gradient-to-r from-yellow-400 to-orange-500";
            amountClass = "text-yellow-700";
            glowEffect = `<div class="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-10 pointer-events-none"></div>`;
        } 
        else if (rank === 2) {
            cardClass = "bg-white border-slate-300 shadow-md transform hover:-translate-y-0.5";
            rankBadge = `<div class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-black text-lg border border-slate-300">2</div>`;
            progressGradient = "bg-slate-400";
        } 
        else if (rank === 3) {
            cardClass = "bg-white border-orange-200 shadow-md transform hover:-translate-y-0.5";
            rankBadge = `<div class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-lg border border-orange-200">3</div>`;
            progressGradient = "bg-orange-400";
            amountClass = "text-orange-800";
        } 
        else {
            cardClass = "bg-white border-slate-100 hover:border-slate-300 transition-colors";
            rankBadge = `<div class="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center text-sm font-bold">#${rank}</div>`;
            progressGradient = "bg-slate-200";
        }

        html += `
            <div class="relative p-4 md:p-5 rounded-2xl border ${cardClass} group transition-all duration-500">
                ${glowEffect}
                
                <div class="flex items-start gap-4 md:gap-6 relative z-10">
                    <div class="shrink-0 mt-1">
                        ${rankBadge}
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-3">
                            
                            <div class="w-full">
                                <h4 class="font-black text-xl md:text-2xl ${textClass} mb-2 tracking-tight">Kelas ${item.kelas}</h4>
                                
                                <div class="flex flex-col gap-1.5">
                                    <div class="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-medium">
                                        <div class="w-5 shrink-0 flex justify-center mt-0.5"><i class="fas fa-chalkboard-user text-blue-400"></i></div>
                                        <span class="leading-tight break-words">${meta.wali}</span>
                                    </div>
                                    <div class="flex items-start gap-3 text-xs md:text-sm text-slate-600 font-medium">
                                        <div class="w-5 shrink-0 flex justify-center mt-0.5"><i class="fas fa-user-shield text-emerald-400"></i></div>
                                        <span class="leading-tight break-words">${meta.musyrif}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-1 md:mt-0 md:text-right shrink-0">
                                <span class="block font-black text-xl md:text-2xl ${amountClass}">${formatRupiah(item.total)}</span>
                                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block md:inline">Terkumpul</span>
                            </div>
                        </div>
                        
                        <div class="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 mt-2">
                            <div class="h-full rounded-full ${progressGradient} transition-all duration-1000 ease-out relative overflow-hidden group-hover:brightness-110 shadow-sm" style="width: ${percent}%">
                                <div class="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += `
            </div>
            <div class="mt-12 flex items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                <i class="fas fa-sync-alt text-xs text-slate-400 animate-spin-slow"></i>
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Realtime Data Integration</span>
            </div>
        </div>
        
        <style>
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            .animate-spin-slow {
                animation: spin 3s linear infinite;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        </style>
    `;

    container.innerHTML = html;
    container.classList.remove('hidden');
}

function renderRekapTable(cls) {
    const tbody = document.getElementById('rekap-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    let students = [];
    let namaWali = "";
    let namaMusyrif = "";

    // === SKENARIO 1: PILIHAN KHUSUS TAHFIZH (VIA ID 'tahfizh-...') ===
    if (cls.startsWith('tahfizh-')) {
        // Ambil target level, misal "4,6" jadi array ["4", "6"]
        const targetLevels = cls.replace('tahfizh-', '').split(',');

        targetLevels.forEach(lvl => {
            if (santriDB[lvl]) {
                Object.keys(santriDB[lvl]).forEach(realClass => {
                    const classData = santriDB[lvl][realClass];
                    // FILTER: Hanya ambil yang punya Musyrif Khusus (Tidak Kosong)
                    const filtered = classData.filter(s => s.musyrifKhusus && s.musyrifKhusus.trim() !== "");
                    students = students.concat(filtered);
                });
            }
        });

        namaWali = "Gabungan Lintas Kelas";
        // Ambil nama musyrif dari anak pertama yg ditemukan (misal: Ust. Faiz)
        namaMusyrif = students.length > 0 ? students[0].musyrifKhusus : "-";
    } 
    
    // === SKENARIO 2: PILIHAN KELAS STANDAR (MISAL '4A') ===
    else {
        const level = cls.charAt(0);
        // AMBIL SEMUA: Tidak ada filter, jadi anak Tahfizh pun tetap masuk sini untuk laporan Wali Kelas.
        students = santriDB[level] ? santriDB[level][cls] : [];
        
        // Ambil info Wali Kelas & Musyrif default dari data-kelas.js
        const meta = (typeof classMetaData !== 'undefined' ? classMetaData[cls] : null) || {
            wali: '-',
            musyrif: '-'
        };
        namaWali = meta.wali;
        namaMusyrif = meta.musyrif; // Menampilkan Musyrif Asrama (Reguler)
    }

    // === RENDER TABEL ===

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-slate-400">Data belum tersedia.</td></tr>';
        
        // Kosongkan header info
        document.getElementById('rekap-wali').innerText = "-";
        document.getElementById('rekap-musyrif').innerText = "-";
        document.getElementById('rekap-total-kelas').innerText = "Rp 0";
        return;
    }

    // Urutkan nama (Penting untuk kelas gabungan)
    students.sort((a, b) => a.nama.localeCompare(b.nama));

    let totalKelas = 0;

    students.forEach((s, index) => {
        let qris = 0, transfer = 0, tunai = 0;

        // Hitung Donasi (Cek Nama & Kelas ASLI si Anak)
        riwayatData.allData.forEach(d => {
            const matchNama = d.NamaSantri && d.NamaSantri.includes(s.nama);
            const matchKelas = d.KelasSantri === s.rombel || d.rombelSantri === s.rombel;

            if (matchNama && matchKelas) {
                const nom = parseInt(d.Nominal) || 0;
                if (d.MetodePembayaran === 'QRIS') qris += nom;
                else if (d.MetodePembayaran === 'Transfer') transfer += nom;
                else tunai += nom;
            }
        });
        
        const subtotal = qris + transfer + tunai;
        totalKelas += subtotal;

        // Label Kelas (Muncul jika mode Tahfizh Gabungan, biar Ust Faiz tau asalnya)
        const badgeKelas = cls.startsWith('tahfizh-') ? 
            `<span class="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded ml-2 font-bold">${s.rombel}</span>` : '';

        // Label Tahfizh (Muncul jika mode Kelas Biasa, biar Wali Kelas tau statusnya)
        let labelTahfizh = '';
        if (!cls.startsWith('tahfizh-') && s.musyrifKhusus) {
             labelTahfizh = `<span class="ml-1 text-[10px] text-teal-600 bg-teal-50 px-1.5 rounded border border-teal-100" title="Musyrif: ${s.musyrifKhusus}"><i class="fas fa-quran"></i> Tahfizh</span>`;
        }

        const tr = document.createElement('tr');
        tr.className = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-slate-900">${index + 1}</td>
            <td class="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">
                ${s.nama} ${badgeKelas} ${labelTahfizh}
            </td>
            <td class="px-6 py-4 text-right font-mono text-slate-500 whitespace-nowrap">${qris > 0 ? formatRupiah(qris) : '-'}</td>
            <td class="px-6 py-4 text-right font-mono text-slate-500 whitespace-nowrap">${transfer > 0 ? formatRupiah(transfer) : '-'}</td>
            <td class="px-6 py-4 text-right font-mono text-slate-500 whitespace-nowrap">${tunai > 0 ? formatRupiah(tunai) : '-'}</td>
            <td class="px-6 py-4 text-right font-bold text-orange-600 whitespace-nowrap">${formatRupiah(subtotal)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Update Header Tabel dengan Data yang Benar
    const elWali = document.getElementById('rekap-wali');
    const elMusyrif = document.getElementById('rekap-musyrif');
    const elTotal = document.getElementById('rekap-total-kelas');

    if (elWali) elWali.innerText = namaWali;
    if (elMusyrif) elMusyrif.innerText = namaMusyrif;
    if (elTotal) elTotal.innerText = formatRupiah(totalKelas);
}

function exportRekapPDF() {
    if (!window.jspdf) {
        showToast("Library PDF belum dimuat.", "error");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const clsSelect = document.getElementById('rekap-kelas-select');
    const cls = clsSelect ? clsSelect.value : '';
    const date = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
    const meta = (typeof classMetaData !== 'undefined' ? classMetaData[cls] : null) || {
        wali: '-',
        musyrif: '-'
    };

    doc.setFontSize(18);
    doc.setTextColor(241, 90, 34);
    doc.text("REKAPITULASI PEROLEHAN ZIS", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Kelas: ${cls}`, 14, 30);
    doc.text(`Tanggal: ${date}`, 14, 36);
    doc.text(`Wali Kelas: ${meta.wali}`, 120, 30);
    doc.text(`Musyrif: ${meta.musyrif}`, 120, 36);

    doc.autoTable({
        html: '#rekap-table-container table',
        startY: 45,
        theme: 'grid',
        headStyles: {
            fillColor: [241, 90, 34]
        },
        styles: {
            fontSize: 8
        },
    });

    const totalEl = document.getElementById('rekap-total-kelas');
    const total = totalEl ? totalEl.innerText : 'Rp 0';

    doc.setFontSize(12);
    doc.setTextColor(0);
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 50;
    doc.text(`Total Perolehan: ${total}`, 14, finalY + 10);

    doc.save(`Rekap ZIS_Kelas ${cls}_${date}.pdf`);
}

// ============================================================================
// 10. FORMULIR DONASI BERTAHAP (WIZARD) - DENGAN LOGIKA DESAIN BARU
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

    // ... (Sisa logika wizard tetap sama seperti sebelumnya) ...

    const fitrahInput = document.getElementById('fitrah-jumlah-orang');
    if (fitrahInput) {
        fitrahInput.oninput = (e) => {
            const total = (parseInt(e.target.value) || 0) * 37500;
            const totalInput = document.getElementById('fitrah-total');
            if (totalInput) totalInput.value = formatRupiah(total);
            donasiData.nominal = total;
        };
    }

    const btnFitrahNext = document.getElementById('btn-fitrah-next');
    if (btnFitrahNext) {
        btnFitrahNext.onclick = () => {
            if (donasiData.nominal < 37500) return showToast("Minimal 1 jiwa");
            goToStep(3);
        };
    }

    const btnZakatCheck = document.getElementById('zakat-check-button');
    if (btnZakatCheck) {
        btnZakatCheck.onclick = () => {
            const emasEl = document.getElementById('harga-emas');
            const hasilEl = document.getElementById('penghasilan-bulanan');
            const emas = parseInt(emasEl.value.replace(/\D/g, '')) || 0;
            const hasil = parseInt(hasilEl.value.replace(/\D/g, '')) || 0;
            const nisab = (emas * 85) / 12;

            const resultDiv = document.getElementById('zakat-result');
            const msg = document.getElementById('zakat-result-message');
            const btnMaal = document.getElementById('btn-maal-next');
            const btnSkip = document.getElementById('zakat-lanjutkan-infaq');

            if (resultDiv) resultDiv.classList.remove('hidden');

            if (hasil >= nisab) {
                const zakat = hasil * 0.025;
                if (msg) msg.innerHTML = `<span class="text-green-600 block">WAJIB ZAKAT</span>Kewajiban: ${formatRupiah(zakat)}`;
                donasiData.nominal = zakat;
                if (btnMaal) btnMaal.classList.remove('hidden');
                if (btnSkip) btnSkip.classList.add('hidden');
            } else {
                if (msg) msg.innerHTML = `<span class="text-orange-600 block">BELUM WAJIB</span>Belum mencapai nishab (${formatRupiah(nisab)})`;
                if (btnMaal) btnMaal.classList.add('hidden');
                if (btnSkip) btnSkip.classList.remove('hidden');
            }
        };
    }

    const btnMaalNext = document.getElementById('btn-maal-next');
    if (btnMaalNext) btnMaalNext.onclick = () => goToStep(3);

    const btnZakatSkip = document.getElementById('zakat-lanjutkan-infaq');
    if (btnZakatSkip) {
        btnZakatSkip.onclick = () => {
            const infaqBtn = document.querySelector('[data-type="Infaq"]');
            if (infaqBtn) infaqBtn.click();
        };
    }

    const btnNextStep2 = document.querySelector('[data-next-step="2"]');
    if (btnNextStep2) {
        btnNextStep2.onclick = () => {
            if (donasiData.type === 'Infaq' && !donasiData.subType) return showToast("Pilih peruntukan infaq terlebih dahulu");
            goToStep(2);
        };
    }

    // --- LANGKAH 2: Tentukan Nominal ---
    document.querySelectorAll('.nominal-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            donasiData.nominal = parseInt(btn.dataset.nominal);
            // [FIX] Simpan sebagai nominal asli setiap kali user memilih
            donasiData.nominalAsli = donasiData.nominal; 
            
            const customInput = document.getElementById('nominal-custom');
            if (customInput) customInput.value = formatRupiah(donasiData.nominal);
        };
    });

    const nominalCustom = document.getElementById('nominal-custom');
    if (nominalCustom) {
        nominalCustom.addEventListener('input', function() {
            let val = this.value.replace(/\D/g, '');
            donasiData.nominal = parseInt(val) || 0;
            
            // [FIX] Simpan sebagai nominal asli setiap kali user mengetik
            donasiData.nominalAsli = donasiData.nominal; 
            
            this.value = formatRupiah(donasiData.nominal);
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
    const btnNextStep5 = document.querySelector('[data-next-step="5"]');
    if (btnNextStep5) {
        btnNextStep5.onclick = () => {
            const method = document.querySelector('input[name="payment-method"]:checked');
            if (!method) return showToast("Pilih metode pembayaran");

            donasiData.metode = method.value;

            // [LOGIKA BARU: RESET & KODE UNIK]
            
            // 1. Pastikan kita punya data nominal asli yang bersih
            // Jika undefined (misal user langsung lompat), ambil dari nominal saat ini
            if (!donasiData.nominalAsli) {
                donasiData.nominalAsli = donasiData.nominal;
            }

            // 2. SELALU Reset donasiData.nominal ke nilai murni (tanpa kode unik)
            donasiData.nominal = donasiData.nominalAsli;

            // 3. Generate Kode Unik & Hitung Total
            if (donasiData.metode === 'Transfer' || donasiData.metode === 'QRIS') {
                const kodeUnik = generateUniqueCode(); 
                donasiData.kodeUnik = kodeUnik;
                
                // Total = Nominal Murni + Kode Unik
                donasiData.nominalTotal = donasiData.nominalAsli + kodeUnik;
            } else {
                // Tunai = Tidak ada kode unik
                donasiData.kodeUnik = 0;
                donasiData.nominalTotal = donasiData.nominalAsli;
            }

            // 4. Update Data Tampilan Ringkasan (Summary)
            document.getElementById('summary-type').innerText = donasiData.subType || donasiData.type;
            
            const elNominalSummary = document.getElementById('summary-nominal');
            elNominalSummary.innerText = formatRupiah(donasiData.nominalTotal);

            // Tampilkan Info Kode Unik jika ada
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
                                        <p class="text-[10px] font-bold text-yellow-800 uppercase tracking-wide mb-0.5">PENTING</p>
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
                                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank BNI</p>
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
                                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BSI (Syariah)</p>
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
                                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BPD DIY Syariah</p>
                                        <p class="text-lg font-black text-slate-700 tracking-tight group-hover:text-blue-600 transition-colors">804 211 000 000</p>
                                    </div>
                                </div>
                                <button onclick="copyText('804211000000')" class="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-blue-500 hover:text-white hover:border-blue-500 transition flex items-center justify-center gap-2 shadow-sm active:scale-95">
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
            const paymentInstr = document.getElementById('donasi-payment-instructions');
            if (paymentInstr) paymentInstr.scrollIntoView({
                behavior: 'smooth'
            });
        };
    }

    document.querySelectorAll('[data-prev-step]').forEach(btn => {
        btn.onclick = () => goToStep(parseInt(btn.dataset.prevStep));
    });
}

// ============================================================================
// 11. LOGIKA RIWAYAT DONASI & STATISTIK
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
        if (el) el.onchange = () => {
            riwayatData.currentPage = 1;
            renderRiwayatList();
            renderPagination();
        };
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
    if (riwayatData.isLoaded) return;

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
            
            <span class="text-[10px] font-bold ${bgBadge} border px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                ${displayType}
            </span>
        </div>

        <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Muzaki</p>
            
            <h5 class="font-bold text-slate-800 text-base mb-2 line-clamp-1" title="${item.NamaDonatur || 'Hamba Allah'}">
                ${item.NamaDonatur || 'Hamba Allah'}
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

// Menghitung statistik donasi (Total, Rata-rata, dll)
function calculateStats() {
    const data = riwayatData.allData;
    let total = 0;
    let todayTotal = 0;
    let maxDonation = 0;
    let maxDonationName = "-";
    const todayStr = new Date().toDateString();

    const classMapMTs = {}, classMapMA = {};
    const santriDonasiMTs = {}, santriDonasiMA = {};
    const santriFreqMTs = {}, santriFreqMA = {};
    const donationTypes = {};

    let totalFitrah = 0;
    let totalMaal = 0;
    let totalInfaq = 0;

    data.forEach(d => {
        const val = parseInt(d.Nominal) || 0;
        total += val;
        if (val > maxDonation) {
            maxDonation = val;
            maxDonationName = d.NamaDonatur || "Hamba Allah";
        }

        const dateObj = new Date(d.Timestamp);
        if (dateObj.toDateString() === todayStr) todayTotal += val;

        const typeName = d.JenisDonasi || "Lainnya";
        donationTypes[typeName] = (donationTypes[typeName] || 0) + 1;

        if (typeName.includes('Fitrah')) totalFitrah += val;
        else if (typeName.includes('Maal')) totalMaal += val;
        else if (typeName.includes('Infaq')) totalInfaq += val;

        const rombel = d.KelasSantri || d.rombelSantri;
        const nama = d.NamaSantri || d.namaSantri;

        if (rombel && nama) {
            const lvl = parseInt(rombel.charAt(0));
            const isMTs = lvl <= 3;
            const mapClass = isMTs ? classMapMTs : classMapMA;
            const mapSantri = isMTs ? santriDonasiMTs : santriDonasiMA;
            const mapFreq = isMTs ? santriFreqMTs : santriFreqMA;

            mapClass[rombel] = (mapClass[rombel] || 0) + val;
            const key = `${nama} (${rombel})`;
            mapSantri[key] = (mapSantri[key] || 0) + val;
            mapFreq[key] = (mapFreq[key] || 0) + 1;
        }
    });

    const getPopular = (obj) => {
        let popular = "-";
        let max = 0;
        for (const [key, count] of Object.entries(obj)) {
            if (count > max) {
                max = count;
                popular = key;
            }
        }
        return popular;
    };

    const popularType = getPopular(donationTypes);

    const setText = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.innerText = txt;
    };
    const getMax = (map, type = 'val') => {
        let maxK = 'N/A',
            maxV = 0;
        for (const [k, v] of Object.entries(map)) {
            if (v > maxV) {
                maxV = v;
                maxK = k;
            }
        }
        return {
            key: maxK,
            val: type === 'val' ? formatRupiah(maxV) : maxV + 'x'
        };
    };

    const elTotal = document.getElementById('stat-total-donasi');
    if (elTotal) animateValue(elTotal, 0, total, 2000, true);

    const elTrans = document.getElementById('stat-total-transaksi');
    if (elTrans) animateValue(elTrans, 0, data.length, 1500);

    const elRata = document.getElementById('stat-donasi-rata');
    if (elRata) animateValue(elRata, 0, data.length ? total / data.length : 0, 1500, true);

    const elMax = document.getElementById('stat-donasi-tertinggi');
    if (elMax) animateValue(elMax, 0, maxDonation, 1500, true);
    setText('stat-donasi-tertinggi-nama', maxDonationName);

    const elRTotal = document.getElementById('stat-r-total');
    if (elRTotal) animateValue(elRTotal, 0, total, 2000, true);

    const elRTrans = document.getElementById('stat-r-transaksi');
    if (elRTrans) animateValue(elRTrans, 0, data.length, 1500);

    const elRHari = document.getElementById('stat-r-hari-ini');
    if (elRHari) animateValue(elRHari, 0, todayTotal, 1000, true);

    const elRTipe = document.getElementById('stat-r-tipe-top');
    if (elRTipe) elRTipe.innerText = popularType;

    const elDetFitrah = document.getElementById('stat-detail-fitrah');
    if (elDetFitrah) animateValue(elDetFitrah, 0, totalFitrah, 1500, true);

    const elDetMaal = document.getElementById('stat-detail-maal');
    if (elDetMaal) animateValue(elDetMaal, 0, totalMaal, 1500, true);

    const elDetInfaq = document.getElementById('stat-detail-infaq');
    if (elDetInfaq) animateValue(elDetInfaq, 0, totalInfaq, 1500, true);

    const mtsClass = getMax(classMapMTs);
    setText('stat-mts-kelas-max', mtsClass.key);
    setText('stat-mts-kelas-total', mtsClass.val);

    const mtsSantri = getMax(santriDonasiMTs);
    setText('stat-mts-santri-max-donasi', mtsSantri.key.split('(')[0]);
    setText('stat-mts-santri-total-donasi', mtsSantri.val);

    const mtsFreq = getMax(santriFreqMTs, 'freq');
    setText('stat-mts-santri-freq-nama', mtsFreq.key.split('(')[0]);
    setText('stat-mts-santri-freq-val', mtsFreq.val);

    const maClass = getMax(classMapMA);
    setText('stat-ma-kelas-max', maClass.key);
    setText('stat-ma-kelas-total', maClass.val);

    const maSantri = getMax(santriDonasiMA);
    setText('stat-ma-santri-max-donasi', maSantri.key.split('(')[0]);
    setText('stat-ma-santri-total-donasi', maSantri.val);

    const maFreq = getMax(santriFreqMA, 'freq');
    setText('stat-ma-santri-freq-nama', maFreq.key.split('(')[0]);
    setText('stat-ma-santri-freq-val', maFreq.val);
}

function renderPagination() {
    const items = getFilteredData();
    const totalPages = Math.ceil(items.length / riwayatData.itemsPerPage);

    const pageInfo = document.getElementById('riwayat-page-info');
    if (pageInfo) pageInfo.innerText = `Page ${riwayatData.currentPage} of ${totalPages || 1}`;

    const prevBtn = document.getElementById('riwayat-prev');
    if (prevBtn) prevBtn.disabled = riwayatData.currentPage === 1;

    const nextBtn = document.getElementById('riwayat-next');
    if (nextBtn) nextBtn.disabled = riwayatData.currentPage >= totalPages || totalPages === 0;
}

function getFilteredData() {
    let filtered = riwayatData.allData;
    const typeFilter = document.getElementById('filter-jenis') ? document.getElementById('filter-jenis').value : 'all';
    const methodFilter = document.getElementById('filter-metode') ? document.getElementById('filter-metode').value : 'all';
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;

    if (typeFilter !== 'all') {
        filtered = filtered.filter(d => d.JenisDonasi === typeFilter || d.type === typeFilter);
    }
    if (methodFilter !== 'all') {
        filtered = filtered.filter(d => d.MetodePembayaran === methodFilter);
    }

    if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : new Date('1970-01-01');
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        filtered = filtered.filter(d => {
            const itemDate = new Date(d.Timestamp);
            return itemDate >= start && itemDate <= end;
        });
    }

    if (timeFilterState !== 'all') {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        filtered = filtered.filter(d => {
            const date = new Date(d.Timestamp);
            if (timeFilterState === 'today') return date.toDateString() === now.toDateString();
            if (timeFilterState === 'week') return date >= startOfWeek;
            if (timeFilterState === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            if (timeFilterState === 'year') return date.getFullYear() === now.getFullYear();
            return true;
        });
    }

    return filtered;
}

function renderRiwayatList() {
    const container = document.getElementById('riwayat-list-container');
    if (!container) return;

    const items = getFilteredData();
    const start = (riwayatData.currentPage - 1) * riwayatData.itemsPerPage;
    const end = start + riwayatData.itemsPerPage;
    const visibleItems = items.slice(start, end);

    const noDataEl = document.getElementById('riwayat-no-data');
    if (visibleItems.length === 0) {
        container.innerHTML = '';
        if (noDataEl) noDataEl.classList.remove('hidden');
        return;
    } else {
        if (noDataEl) noDataEl.classList.add('hidden');
    }

    container.innerHTML = visibleItems.map((item, index) => {
        let iconClass = 'fa-donate';
        let bgIcon = 'bg-slate-100 text-slate-400';
        let borderClass = 'border-slate-100';

        const type = item.JenisDonasi || item.type || "";
        const subType = item.SubJenis || item.subType || "";
        const displayType = subType || type;
        const paymentMethod = item.MetodePembayaran || item.metode || "Tunai";
        const donaturName = item.NamaDonatur || item.nama || 'Hamba Allah';
        const nominal = parseInt(item.Nominal || item.nominal) || 0;

        // === [1. LOGIKA STATUS MAKER-CHECKER] ===
        // Ambil status dari spreadsheet, default "Belum Verifikasi" jika kosong
        const status = item.Status || "Belum Verifikasi";
        let statusBadgeHTML = '';

        if (status === 'Terverifikasi') {
            // Tampilan Hijau (Sudah di-acc Admin)
            statusBadgeHTML = `
                <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 shadow-sm ml-auto sm:ml-0" title="Donasi Diterima">
                    <i class="fas fa-check-circle text-[10px]"></i> 
                    <span class="text-[10px] font-bold uppercase tracking-wider">Diterima</span>
                </div>`;
        } else {
            // Tampilan Kuning (Menunggu Admin)
            statusBadgeHTML = `
                <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm ml-auto sm:ml-0" title="Menunggu Verifikasi Admin">
                    <i class="fas fa-hourglass-half text-[10px] animate-pulse"></i> 
                    <span class="text-[10px] font-bold uppercase tracking-wider">Proses</span>
                </div>`;
        }

        // === [2. LOGIKA HIGHLIGHT KODE UNIK] ===
        // Format angka ke Rupiah
        let nominalHTML = nominal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
        
        // Jika bukan Tunai dan ada digit unik (tidak habis dibagi 1000)
        // Warnai 3 digit terakhir dengan warna oranye
        if (nominal % 1000 !== 0 && paymentMethod !== 'Tunai') {
             nominalHTML = nominalHTML.replace(/(\d{3})(?=\D*$)/, '<span class="text-orange-500 border-b-2 border-orange-200 font-black">$1</span>');
        }

        // === [3. LOGIKA STYLE CARD] ===
        if (displayType.includes('Fitrah')) {
            iconClass = 'fa-bowl-rice'; bgIcon = 'bg-emerald-100 text-emerald-600'; borderClass = 'hover:border-emerald-200';
        } else if (displayType.includes('Maal')) {
            iconClass = 'fa-sack-dollar'; bgIcon = 'bg-amber-100 text-amber-600'; borderClass = 'hover:border-amber-200';
        } else if (displayType.includes('Kampus')) {
            iconClass = 'fa-school'; bgIcon = 'bg-rose-100 text-rose-600'; borderClass = 'hover:border-rose-200';
        } else if (displayType.includes('Beasiswa')) {
            iconClass = 'fa-user-graduate'; bgIcon = 'bg-sky-100 text-sky-600'; borderClass = 'hover:border-sky-200';
        } else if (displayType.includes('Umum')) {
            iconClass = 'fa-parachute-box'; bgIcon = 'bg-violet-100 text-violet-600'; borderClass = 'hover:border-violet-200';
        } else {
            iconClass = 'fa-hand-holding-heart'; bgIcon = 'bg-orange-100 text-orange-600'; borderClass = 'hover:border-orange-200';
        }

        const dateObj = new Date(item.Timestamp);
        const date = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const time = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        const alumniYear = item.DetailAlumni || item.detailAlumni;
        const alumniBadge = alumniYear ?
            `<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-white border border-slate-600" title="Alumni ${alumniYear}"><i class="fas fa-graduation-cap mr-1"></i> ${alumniYear}</span>` : '';

        let metodeBadge = 'bg-slate-100 text-slate-500 border-slate-200';
        if (paymentMethod === 'QRIS') metodeBadge = 'bg-blue-50 text-blue-600 border-blue-200';
        else if (paymentMethod === 'Transfer') metodeBadge = 'bg-purple-50 text-purple-600 border-purple-200';
        else if (paymentMethod === 'Tunai') metodeBadge = 'bg-green-50 text-green-600 border-green-200';

        return `
        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 ${borderClass} group relative overflow-hidden transform hover:-translate-y-1">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                
                <div class="flex items-start sm:items-center gap-5 w-full">
                    <div class="w-14 h-14 rounded-2xl ${bgIcon} flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center flex-wrap gap-y-1 mb-1">
                            <h4 class="font-bold text-slate-800 text-lg group-hover:text-brand-orange transition-colors truncate pr-2">
                                ${donaturName}
                            </h4>
                            ${alumniBadge}
                        </div>
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-xs font-bold text-slate-500 uppercase tracking-wide truncate">${displayType}</span>
                            <span class="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                            <span class="text-[10px] px-2 py-0.5 rounded border ${metodeBadge} font-bold uppercase tracking-wider">${paymentMethod}</span>
                        </div>
                    </div>
                </div>

                <div class="text-left sm:text-right w-full sm:w-auto pl-[4.5rem] sm:pl-0 mt-[-10px] sm:mt-0">
                    <span class="block font-black text-xl text-slate-800 mb-1 tracking-tight group-hover:text-brand-orange transition-colors">
                        ${nominalHTML}
                    </span>
                    <div class="flex flex-col sm:items-end gap-2">
                        <div class="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <i class="far fa-clock"></i> ${date} • ${time}
                        </div>
                        ${statusBadgeHTML}
                    </div>
                </div>
            </div>
            
            <div class="absolute right-[-20px] bottom-[-20px] text-9xl opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-500 rotate-12">
                <i class="fas ${iconClass}"></i>
            </div>
        </div>
        `;
    }).join('');
}

// ============================================================================
// 12. LOGIKA MODAL QRIS (POP-UP GAMBAR BESAR)
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
   13. LOGIKA DASHBOARD PERSONAL & KWITANSI (NEW FEATURE)
   ============================================================================ */

// Panggil fungsi ini di dalam onAuthStateChanged saat user login (di bagian Tahap 1 tadi)
// Contoh: if (typeof loadPersonalDashboard === 'function') loadPersonalDashboard(user.email);

let myDonations = []; // Menyimpan data donasi khusus user yang login

/**
 * FUNGSI BARU: Load Dashboard Personal (Aman & Cepat)
 * Menggunakan Server-Side Filtering via endpoint 'getPersonalHistory'
 */
window.loadPersonalDashboard = async function(userEmail) {
    // Validasi email
    if (!userEmail) {
        console.warn("Email user tidak ditemukan.");
        return;
    }

    // 1. Tampilkan Loading State di Tabel Dashboard
    // Agar user tahu sistem sedang bekerja
    const tbody = document.getElementById('dash-history-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="p-8 text-center text-slate-400">
                    <div class="flex flex-col items-center justify-center gap-2">
                        <i class="fas fa-circle-notch fa-spin text-2xl text-orange-500"></i>
                        <span class="text-sm">Mengambil data donasi Anda...</span>
                    </div>
                </td>
            </tr>
        `;
    }

    try {
        // 2. Request Data ke Server (Google Apps Script)
        // Mengirim parameter action='getPersonalHistory' dan email user
        const params = new URLSearchParams({
            action: 'getPersonalHistory',
            email: userEmail
        });

        const response = await fetch(`${GAS_API_URL}?${params.toString()}`);
        const json = await response.json();

        // 3. Proses Hasil
        if (json.status === 'success') {
            // Simpan ke variabel global 'myDonations'
            // Data ini HANYA berisi donasi milik user ini saja.
            myDonations = json.data;
            
            // Render ulang tampilan tabel dashboard
            updateDashboardUI(); 
            
            // Update statistik personal (Total Donasi, Frekuensi, dll)
            updatePersonalStats(); 
        } else {
            console.error("Gagal memuat data personal:", json.message);
            if(tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-red-400">Gagal memuat data.</td></tr>`;
        }

    } catch (error) {
        console.error("Network Error:", error);
        if(tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-red-400">Terjadi kesalahan koneksi.</td></tr>`;
    }
};

// Helper kecil untuk update statistik di kartu atas dashboard
function updatePersonalStats() {
    if (!myDonations) return;

    const totalNominal = myDonations.reduce((sum, item) => sum + (parseInt(item.Nominal) || 0), 0);
    const totalFrekuensi = myDonations.length;
    // Cari donasi terakhir
    const lastDonation = myDonations.length > 0 ? myDonations[myDonations.length - 1].Nominal : 0;

    // Update Elemen HTML (Pastikan ID elemen sesuai dengan HTML Anda)
    // Contoh ID: user-total-donation, user-donation-count
    const elTotal = document.getElementById('user-total-donation');
    const elCount = document.getElementById('user-donation-count');
    
    if(elTotal) elTotal.innerText = formatRupiah(totalNominal);
    if(elCount) elCount.innerText = totalFrekuensi + "x";
}

function updateDashboardUI() {
    // A. Update Profil Header
    const user = currentUser; // Variabel global dari auth firebase
    if (user) {
        document.getElementById('dash-avatar').src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`;
        document.getElementById('dash-name').innerText = user.displayName.split(' ')[0]; // Nama depan saja
    }

    // B. Hitung Statistik
    let totalDonasi = 0;
    let frekuensi = myDonations.length;
    let lastDonasi = null;

    myDonations.forEach((d, index) => {
        totalDonasi += parseInt(d.Nominal) || 0;
        // Karena data diurutkan dari baru ke lama (di loadRiwayat), yang pertama adalah yang terbaru
        if (index === 0) lastDonasi = d; 
    });

    // C. Render Angka Statistik
    animateValue(document.getElementById('dash-stat-total'), 0, totalDonasi, 1500, true);
    animateValue(document.getElementById('dash-stat-freq'), 0, frekuensi, 1000);
    
    if (lastDonasi) {
        document.getElementById('dash-stat-last').innerText = formatRupiah(lastDonasi.Nominal);
        document.getElementById('dash-stat-last-date').innerText = timeAgo(lastDonasi.Timestamp);
    } else {
        document.getElementById('dash-stat-last').innerText = "-";
        document.getElementById('dash-stat-last-date').innerText = "Belum ada donasi";
    }

    // D. Gamifikasi Level Donatur
    const levelBadge = document.getElementById('dash-level');
    if (totalDonasi > 10000000) {
        levelBadge.innerHTML = `<span class="text-purple-600"><i class="fas fa-crown"></i> Muhsinin Utama</span>`;
    } else if (totalDonasi > 1000000) {
        levelBadge.innerHTML = `<span class="text-blue-600"><i class="fas fa-medal"></i> Donatur Setia</span>`;
    } else if (frekuensi > 0) {
        levelBadge.innerHTML = `<span class="text-green-600"><i class="fas fa-user-check"></i> Sahabat Lazismu</span>`;
    } else {
        levelBadge.innerText = "Donatur Baru";
    }

    // E. Render Tabel Riwayat
    renderPersonalHistoryTable();
}

function renderPersonalHistoryTable() {
    const tbody = document.getElementById('dash-history-body');
    const emptyState = document.getElementById('dash-empty-state');
    
    if (myDonations.length === 0) {
        tbody.innerHTML = '';
        tbody.parentElement.classList.add('hidden'); // Sembunyikan tabel
        emptyState.classList.remove('hidden'); // Munculkan pesan kosong
        return;
    }

    tbody.parentElement.classList.remove('hidden');
    emptyState.classList.add('hidden');
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

// Fitur Refresh Manual
window.refreshDashboard = async function() {
    const btn = document.querySelector('button[onclick="refreshDashboard()"] i');
    if(btn) btn.classList.add('fa-spin');
    
    // Paksa ambil data baru dari server (abaikan cache riwayatData.isLoaded)
    riwayatData.isLoaded = false; 
    if (currentUser) {
        await loadPersonalDashboard(currentUser.email);
        showToast("Data berhasil diperbarui", "success");
    }
    
    if(btn) btn.classList.remove('fa-spin');
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

// --- JEMBATAN PENGHUBUNG (Agar HTML bisa panggil fungsi di module) ---
window.showPage = showPage;
window.filterNews = filterNews;
window.closeNewsModal = closeNewsModal;
window.openNewsModal = openNewsModal;
window.closeQrisModal = closeQrisModal;
window.openQrisModal = openQrisModal;
window.copyText = copyText;
window.loadMoreNews = loadMoreNews;
window.init = init;
