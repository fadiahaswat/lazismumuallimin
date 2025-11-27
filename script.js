/**
 * ============================================================================
 * SCRIPT UTAMA WEBSITE DONASI LAZISMU (UPDATED)
 * ============================================================================
 * Update Log:
 * - Support format data santri JSON (Array) dan TSV (String)
 * - Integrasi Global Leaderboard di halaman Rekap
 * - Perbaikan logika deteksi data eksternal
 */

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

    // --- BAGIAN BARU: AMBIL DATA DARI SPREADSHEET ---
    // Pastikan fungsi loadSantriData sudah ada (dari file santri-data.js)
    if (typeof loadSantriData === 'function') {
        // Kita tunggu (await) sampai data selesai diambil
        await loadSantriData(); 
    }
    // -----------------------------------------------

    // 1. Proses Data Santri yang sudah diambil
    // Kita cek variabel 'santriData' (bukan rawSantriData lagi)
    if (typeof santriData !== 'undefined' && santriData.length > 0) {
        console.log("Data Santri ditemukan:", santriData.length);
        parseSantriData();
    } else {
        console.warn("Data santri belum termuat atau kosong.");
    }

    // 2. Cek Data Kelas (Sisa kode ke bawah biarkan sama)
    if (typeof classMetaData !== 'undefined') {
        console.log("Data Wali Kelas (classMetaData) ditemukan.");
    }

    setupNavigation();
    setupWizardLogic();
    setupHistoryLogic();
    setupModalLogic();
    setupRekapLogic();
    handleInitialLoad();
    fetchNewsCategories();
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

// ============================================================================
// 6. PENGOLAHAN DATA SANTRI (DIPERBAIKI)
// ============================================================================
let santriDB = {};

function parseSantriData() {
    if (typeof rawSantriData === 'undefined' || !rawSantriData) return;

    // A. JIKA FORMATNYA ARRAY (JSON) - DARI FILE JS MODERN
    if (Array.isArray(rawSantriData)) {
        rawSantriData.forEach(item => {
            const rombel = item.rombel || item.kelas || ""; // Support field 'rombel' atau 'kelas'
            const nis = item.nis || item.noInduk || "";
            const nama = item.nama || item.namaLengkap || "";
            
            if (!rombel) return;

            const level = rombel.charAt(0);
            if (!santriDB[level]) santriDB[level] = {};
            if (!santriDB[level][rombel]) santriDB[level][rombel] = [];

            santriDB[level][rombel].push({ nama, nis, rombel });
        });
        return;
    }

    // B. JIKA FORMATNYA STRING (TSV/CSV) - LEGACY
    if (typeof rawSantriData === 'string') {
        const lines = rawSantriData.trim().split('\n');
        lines.forEach(line => {
            // Coba split dengan tab (\t) dulu, kalau gagal coba koma (,) atau titik koma (;)
            let parts = line.split('\t');
            if (parts.length < 3) parts = line.split(';'); // Fallback CSV semicolon
            if (parts.length < 3) parts = line.split(','); // Fallback CSV comma

            if (parts.length < 3) return;

            const rombel = parts[0].trim();
            const nis = parts[1].trim();
            const nama = parts[2].trim();
            const level = rombel.charAt(0);

            if (!santriDB[level]) santriDB[level] = {};
            if (!santriDB[level][rombel]) santriDB[level][rombel] = [];

            santriDB[level][rombel].push({ nama, nis, rombel });
        });
    }
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

    // Inisialisasi awal: jika belum ada kelas dipilih, tampilkan leaderboard
    if (!clsSelect.value) {
        toggleRekapDisplay(false); // Mode false sekarang menampilkan Leaderboard
    }

    lvlSelect.onchange = () => {
        const lvl = lvlSelect.value;
        clsSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>';

        if (lvl && santriDB[lvl]) {
            clsSelect.disabled = false;
            const classes = Object.keys(santriDB[lvl]).sort();
            classes.forEach(cls => {
                const opt = document.createElement('option');
                opt.value = cls;
                opt.innerText = `Kelas ${cls}`;
                clsSelect.appendChild(opt);
            });
        } else {
            clsSelect.disabled = true;
        }
        // Kembali ke leaderboard jika level diganti/direset
        toggleRekapDisplay(false);
        renderGlobalLeaderboard(); 
    };

    clsSelect.onchange = () => {
        const cls = clsSelect.value;
        if (cls) {
            toggleRekapDisplay(true); // Tampilkan detail tabel
            renderRekapTable(cls);
        } else {
            toggleRekapDisplay(false); // Tampilkan leaderboard
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

    // 3. Render HTML (DESAIN BARU YANG MENARIK)
    let html = `
        <div class="max-w-3xl mx-auto px-2">
            <div class="text-center mb-10">
                <span class="inline-block px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 border border-orange-100">Live Update</span>
                <h3 class="text-2xl font-black text-slate-800 mb-2">Papan Peringkat Kebaikan</h3>
                <p class="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">Berlomba-lomba dalam kebaikan. Berikut adalah perolehan donasi per kelas saat ini.</p>
            </div>
            
            <div class="space-y-4">
    `;

    leaderboard.forEach((item, index) => {
        const rank = index + 1;
        const percent = (item.total / maxVal) * 100;
        
        let cardClass = "";
        let rankIcon = "";
        let textClass = "text-slate-700";
        let amountClass = "text-slate-800";
        let progressColor = "bg-slate-100";

        if (rank === 1) {
            cardClass = "bg-gradient-to-br from-yellow-50 via-white to-white border-yellow-200 shadow-lg shadow-yellow-500/10 scale-105 z-10 ring-1 ring-yellow-100";
            rankIcon = `<div class="w-10 h-10 rounded-full bg-yellow-400 text-white flex items-center justify-center text-lg shadow-md shadow-yellow-200"><i class="fas fa-crown"></i></div>`;
            progressColor = "bg-gradient-to-r from-yellow-400 to-orange-400";
            amountClass = "text-yellow-700";
        } else if (rank === 2) {
            cardClass = "bg-white border-slate-200 shadow-md z-0";
            rankIcon = `<div class="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold shadow-sm">2</div>`;
            progressColor = "bg-slate-400";
        } else if (rank === 3) {
            cardClass = "bg-white border-orange-100 shadow-md z-0";
            rankIcon = `<div class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold shadow-sm">3</div>`;
            progressColor = "bg-orange-400";
            amountClass = "text-orange-700";
        } else {
            cardClass = "bg-white border-slate-100 hover:border-slate-300 transition-colors";
            rankIcon = `<div class="w-6 h-6 rounded-full bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center text-xs font-bold">${rank}</div>`;
            progressColor = "bg-slate-200";
        }

        html += `
            <div class="relative p-4 rounded-2xl border ${cardClass} flex items-center gap-4 group transition-all duration-300">
                <!-- Rank Icon -->
                <div class="shrink-0">
                    ${rankIcon}
                </div>

                <!-- Class Name & Bar -->
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-end mb-1.5">
                        <h4 class="font-bold text-base ${textClass}">Kelas ${item.kelas}</h4>
                        <span class="font-black text-base ${amountClass}">${formatRupiah(item.total)}</span>
                    </div>
                    
                    <!-- Progress Bar Background -->
                    <div class="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <!-- Actual Progress -->
                        <div class="h-full rounded-full ${progressColor} transition-all duration-1000 ease-out relative overflow-hidden group-hover:brightness-110" style="width: ${percent}%">
                            <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
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
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Realtime Data</span>
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

    const level = cls.charAt(0);
    const students = santriDB[level] ? santriDB[level][cls] : [];

    if (!students) return;

    let totalKelas = 0;

    students.forEach((s, index) => {
        let qris = 0,
            transfer = 0,
            tunai = 0;

        riwayatData.allData.forEach(d => {
            if (d.NamaSantri && d.NamaSantri.includes(s.nama) && (d.KelasSantri === cls || d.rombelSantri === cls)) {
                const nom = parseInt(d.Nominal) || 0;
                if (d.MetodePembayaran === 'QRIS') qris += nom;
                else if (d.MetodePembayaran === 'Transfer') transfer += nom;
                else tunai += nom;
            }
        });
        const subtotal = qris + transfer + tunai;
        totalKelas += subtotal;

        const tr = document.createElement('tr');
        tr.className = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-slate-900">${index + 1}</td>
            <td class="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">${s.nama}</td>
            <td class="px-6 py-4 text-right font-mono text-slate-500 whitespace-nowrap">${qris > 0 ? formatRupiah(qris) : '-'}</td>
            <td class="px-6 py-4 text-right font-mono text-slate-500 whitespace-nowrap">${transfer > 0 ? formatRupiah(transfer) : '-'}</td>
            <td class="px-6 py-4 text-right font-mono text-slate-500 whitespace-nowrap">${tunai > 0 ? formatRupiah(tunai) : '-'}</td>
            <td class="px-6 py-4 text-right font-bold text-orange-600 whitespace-nowrap">${formatRupiah(subtotal)}</td>
        `;
        tbody.appendChild(tr);
    });

    const meta = (typeof classMetaData !== 'undefined' ? classMetaData[cls] : null) || {
        wali: 'Belum Ditentukan',
        musyrif: 'Belum Ditentukan'
    };
    const elWali = document.getElementById('rekap-wali');
    const elMusyrif = document.getElementById('rekap-musyrif');
    const elTotal = document.getElementById('rekap-total-kelas');

    if (elWali) elWali.innerText = meta.wali;
    if (elMusyrif) elMusyrif.innerText = meta.musyrif;
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
            const customInput = document.getElementById('nominal-custom');
            if (customInput) customInput.value = formatRupiah(donasiData.nominal);
        };
    });

    const nominalCustom = document.getElementById('nominal-custom');
    if (nominalCustom) {
        nominalCustom.addEventListener('input', function() {
            let val = this.value.replace(/\D/g, '');
            donasiData.nominal = parseInt(val) || 0;
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

            document.getElementById('summary-type').innerText = donasiData.subType || donasiData.type;
            document.getElementById('summary-nominal').innerText = formatRupiah(donasiData.nominal);
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

            btn.disabled = true;
            btn.querySelector('.default-text').classList.add('hidden');
            btn.querySelector('.loading-text').classList.remove('hidden');

            const payload = {
                "type": donasiData.subType || donasiData.type,
                "nominal": donasiData.nominal,
                "nama": donasiData.nama,
                "hp": donasiData.hp,
                "email": donasiData.email,
                "alamat": donasiData.alamat,
                "metode": donasiData.metode,
                "doa": donasiData.doa,
                "donaturTipe": donasiData.donaturTipe,
                "alumniTahun": donasiData.alumniTahun || "",
                "DetailAlumni": donasiData.alumniTahun || "", // Mengirim data detail alumni
                "namaSantri": donasiData.namaSantri || "",
                "nisSantri": donasiData.nisSantri || "",
                "rombelSantri": donasiData.rombelSantri || "",
                "NoKTP": donasiData.nik || "" // Mengirim data NIK
            };

            try {
                await fetch(GAS_API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain"
                    },
                    body: JSON.stringify({
                        action: "create",
                        payload: payload
                    })
                });

                // Update Tampilan Halaman Sukses
                const finalNominal = document.getElementById('final-nominal-display');
                const finalType = document.getElementById('final-type-display');
                const finalName = document.getElementById('final-name-display');
                const summaryNominal = document.getElementById('summary-nominal');
                const summaryType = document.getElementById('summary-type');
                const summaryName = document.getElementById('summary-nama');

                if (finalNominal && summaryNominal) finalNominal.innerText = summaryNominal.innerText;
                if (finalType && summaryType) finalType.innerText = summaryType.innerText;
                if (finalName && summaryName) finalName.innerText = summaryName.innerText;

                const modal = document.getElementById('success-modal');
                if (modal) modal.classList.remove('hidden');

                const waMsg = `Assalamu'alaikum, saya ingin konfirmasi donasi kebaikan:\n\nJenis: ${donasiData.subType || donasiData.type}\nNominal: ${formatRupiah(donasiData.nominal)}\nNama: ${donasiData.nama}\nMetode: ${donasiData.metode}\n${donasiData.namaSantri ? `Santri: ${donasiData.namaSantri} (${donasiData.rombelSantri})` : ''}`;
                const btnWa = document.getElementById('btn-wa-confirm');
                if (btnWa) btnWa.href = `https://wa.me/6281196961918?text=${encodeURIComponent(waMsg)}`;

                // --- GENERATE TAMPILAN PEMBAYARAN ---
                let paymentDetails = '';
                
                if (donasiData.metode === 'QRIS') {
                    // TAMPILAN QRIS
                    paymentDetails = `
                        <div class="relative overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-xl">
    <div class="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-50 pointer-events-none translate-x-10 -translate-y-10"></div>
    <div class="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none -translate-x-10 translate-y-10"></div>
    
    <div class="relative z-10 p-6 md:p-8 text-center">
        <div class="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm text-slate-700 text-2xl">
            <i class="fas fa-qrcode"></i>
        </div>
        <h4 class="font-black text-slate-800 text-xl mb-1">Pindai QRIS Pilihan Anda</h4>
        <p class="text-slate-500 text-sm mb-8 max-w-xs mx-auto">Klik gambar untuk memperbesar atau mengunduh kode QR.</p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            
            <div onclick="openQrisModal('bni')" class="group relative bg-white p-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-orange-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div class="absolute top-3 right-3 z-20 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm">
                    <img src="bank-bni.png" alt="BNI" class="h-4 w-auto object-contain">
                </div>
                
                <div class="relative overflow-hidden rounded-xl">
                    <div class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors z-10 flex items-center justify-center">
                        <i class="fas fa-search-plus text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300 drop-shadow-md"></i>
                    </div>
                    <img src="https://drive.google.com/thumbnail?id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt" class="w-full h-auto object-cover mix-blend-multiply" alt="QRIS BNI">
                </div>
                <p class="mt-3 text-xs font-bold text-slate-600 group-hover:text-orange-600 transition-colors">Infaq & Shadaqah</p>
            </div>

            <div onclick="openQrisModal('bsi')" class="group relative bg-white p-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-teal-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div class="absolute top-3 right-3 z-20 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm">
                    <img src="bank-bsi.png" alt="BSI" class="h-4 w-auto object-contain">
                </div>

                <div class="relative overflow-hidden rounded-xl">
                    <div class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors z-10 flex items-center justify-center">
                        <i class="fas fa-search-plus text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300 drop-shadow-md"></i>
                    </div>
                    <img src="https://drive.google.com/thumbnail?id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V" class="w-full h-auto object-cover mix-blend-multiply" alt="QRIS BSI">
                </div>
                <p class="mt-3 text-xs font-bold text-slate-600 group-hover:text-teal-600 transition-colors">Zakat & Wakaf</p>
            </div>

            <div onclick="openQrisModal('bpd')" class="group relative bg-white p-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div class="absolute top-3 right-3 z-20 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm">
                    <img src="bank-bpd.png" alt="BPD" class="h-4 w-auto object-contain">
                </div>

                <div class="relative overflow-hidden rounded-xl">
                    <div class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors z-10 flex items-center justify-center">
                        <i class="fas fa-search-plus text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300 drop-shadow-md"></i>
                    </div>
                    <img src="https://drive.google.com/thumbnail?id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm" class="w-full h-auto object-cover mix-blend-multiply" alt="QRIS BPD">
                </div>
                <p class="mt-3 text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">Kemanusiaan</p>
            </div>

        </div>
        
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
            <span class="flex -space-x-2">
                <div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">D</div>
                <div class="w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">G</div>
                <div class="w-6 h-6 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">O</div>
            </span>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Support All E-Wallet</span>
        </div>
    </div>
</div>`;
                } else if (donasiData.metode === 'Transfer') {
                    // TAMPILAN TRANSFER
                    paymentDetails = `
                        <div class="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
    <div class="bg-slate-50 p-6 border-b border-slate-100 text-center">
        <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 shadow-sm text-blue-600 text-xl">
            <i class="fas fa-university"></i>
        </div>
        <h4 class="font-black text-slate-800 text-lg">Transfer Bank</h4>
        <p class="text-slate-500 text-sm">Silakan transfer ke salah satu rekening resmi Lazismu di bawah ini.</p>
    </div>
    
    <div class="p-6 md:p-8 space-y-4">
        
        <!-- Bank BNI -->
        <div class="group relative bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:shadow-lg hover:border-orange-300 transition-all duration-300">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100 group-hover:scale-110 transition-transform p-2">
                    <img src="bank-bni.png" alt="BNI" class="w-full h-full object-contain mix-blend-multiply">
                </div>
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Bank BNI</p>
                    <p class="font-mono font-bold text-slate-800 text-lg md:text-xl tracking-tight">3440 000 348</p>
                </div>
            </div>
            <button onclick="copyText('3440000348', this)" class="w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full md:rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white border border-orange-100 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn" title="Salin Nomor Rekening">
                <i class="far fa-copy"></i>
                <span class="hidden md:inline text-xs font-bold">Salin</span>
            </button>
        </div>

        <!-- Bank BSI -->
        <div class="group relative bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:shadow-lg hover:border-teal-300 transition-all duration-300">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100 group-hover:scale-110 transition-transform p-2">
                    <img src="bank-bsi.png" alt="BSI" class="w-full h-full object-contain mix-blend-multiply">
                </div>
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Bank Syariah Ind (BSI)</p>
                    <p class="font-mono font-bold text-slate-800 text-lg md:text-xl tracking-tight">7930 030 303</p>
                </div>
            </div>
            <button onclick="copyText('7930030303', this)" class="w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full md:rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white border border-teal-100 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn" title="Salin Nomor Rekening">
                <i class="far fa-copy"></i>
                <span class="hidden md:inline text-xs font-bold">Salin</span>
            </button>
        </div>

        <!-- Bank BPD DIY Syariah (Ditambahkan) -->
        <div class="group relative bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-110 transition-transform p-2">
                    <img src="bank-bpd.png" alt="BPD" class="w-full h-full object-contain mix-blend-multiply">
                </div>
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">BPD DIY Syariah</p>
                    <p class="font-mono font-bold text-slate-800 text-lg md:text-xl tracking-tight">804 211 000 000</p>
                </div>
            </div>
            <button onclick="copyText('804211000000', this)" class="w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full md:rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn" title="Salin Nomor Rekening">
                <i class="far fa-copy"></i>
                <span class="hidden md:inline text-xs font-bold">Salin</span>
            </button>
        </div>

    </div>
</div>`;
                } else {
                    // TAMPILAN TUNAI (KANTOR)
                    paymentDetails = `
                        <div class="relative overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-xl">
                            <div class="absolute top-0 right-0 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-40 pointer-events-none translate-x-10 -translate-y-10"></div>
                            <div class="relative z-10">
                                <div class="bg-emerald-50/50 p-8 text-center border-b border-emerald-100"><div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm text-emerald-600 text-3xl transform rotate-3"><i class="fas fa-handshake"></i></div><h4 class="font-black text-slate-800 text-xl mb-2">Layanan Kantor</h4><p class="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">Silakan berkunjung langsung ke kantor layanan kami untuk menyerahkan donasi tunai & bersilaturahmi.</p></div>
                                <div class="p-6 md:p-8">
                                    <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300 group">
                                        <div class="flex items-start gap-4"><div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><i class="fas fa-map-marker-alt"></i></div><div class="flex-1"><h5 class="font-bold text-slate-800 text-sm mb-1 uppercase tracking-wide">Alamat Kantor</h5><p class="text-slate-600 text-sm leading-relaxed mb-4">Gedung Lazismu Mu'allimin<br>Jl. Letjen S. Parman No.68, Patangpuluhan, Wirobrajan, Yogyakarta</p><a href="https://maps.app.goo.gl/kLyg2BgZm9N88rqo9" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 active:scale-95"><i class="fas fa-directions"></i> Buka Google Maps</a></div></div>
                                    </div>
                                    <div class="mt-6 grid grid-cols-2 gap-4">
                                        <div class="bg-slate-50 rounded-xl p-3 text-center border border-slate-100"><i class="far fa-clock text-emerald-500 mb-1"></i><p class="text-[10px] font-bold text-slate-400 uppercase">Senin - Jumat</p><p class="font-bold text-slate-700 text-sm">08.00 - 15.00 WIB</p></div>
                                        <div class="bg-slate-50 rounded-xl p-3 text-center border border-slate-100"><i class="far fa-calendar-alt text-emerald-500 mb-1"></i><p class="text-[10px] font-bold text-slate-400 uppercase">Sabtu</p><p class="font-bold text-slate-700 text-sm">08.00 - 12.00 WIB</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                }

                // TAMPILAN DOA (KARTU ISLAMI)
                const prayerHTML = `
                    <div class="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white rounded-3xl border border-emerald-100 shadow-lg p-8 md:p-10 mb-8 text-center group hover:shadow-xl transition-all duration-500">
                        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-300 via-teal-400 to-emerald-300"></div>
                        <div class="absolute -top-10 -left-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                        <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                        <div class="relative z-10">
                            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-emerald-100 shadow-sm text-emerald-600 mb-6 group-hover:scale-110 transition-transform duration-300"><i class="fas fa-praying-hands text-xl"></i></div>
                            <h3 class="font-arabic text-2xl md:text-4xl font-black text-emerald-900 leading-[2.2] md:leading-[2.5] mb-6 drop-shadow-sm tracking-wide" dir="rtl">آجَرَكَ اللَّهُ فِيمَا أَعْطَيْتَ،<br class="hidden md:block"> وَبَارَكَ اللَّهُ فِيمَا أَبْقَيْتَ، وَجَعَلَهُ لَكَ طَهُورًا</h3>
                            <div class="flex items-center justify-center gap-3 opacity-60 mb-6"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span class="w-16 h-0.5 rounded-full bg-gradient-to-r from-transparent via-emerald-300 to-transparent"></span><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span></div>
                            <p class="text-slate-600 text-sm md:text-base font-serif italic leading-relaxed max-w-2xl mx-auto">"Semoga Allah memberikan pahala atas apa yang engkau berikan, dan semoga Allah memberkahimu atas apa yang masih ada di tanganmu dan menjadikannya sebagai pembersih (dosa) bagimu."</p>
                        </div>
                    </div>
                `;

                // UPDATE KONTEN MODAL SUKSES
                // Urutan: Doa -> Instruksi Pembayaran (Ringkasan dihapus)
                const instrContent = document.getElementById('instruction-content');
                if (instrContent) instrContent.innerHTML = prayerHTML + paymentDetails;

                const wizard = document.getElementById('donasi-wizard');
                if (wizard) wizard.classList.add('hidden');

                const paymentInstr = document.getElementById('donasi-payment-instructions');
                if (paymentInstr) paymentInstr.classList.remove('hidden');

            } catch (e) {
                showToast("Gagal mengirim data, periksa koneksi internet.", "error");
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

        if (displayType.includes('Fitrah')) {
            iconClass = 'fa-bowl-rice';
            bgIcon = 'bg-emerald-100 text-emerald-600';
            borderClass = 'hover:border-emerald-200';
        } else if (displayType.includes('Maal')) {
            iconClass = 'fa-sack-dollar';
            bgIcon = 'bg-amber-100 text-amber-600';
            borderClass = 'hover:border-amber-200';
        } else if (displayType.includes('Kampus')) {
            iconClass = 'fa-school';
            bgIcon = 'bg-rose-100 text-rose-600';
            borderClass = 'hover:border-rose-200';
        } else if (displayType.includes('Beasiswa')) {
            iconClass = 'fa-user-graduate';
            bgIcon = 'bg-sky-100 text-sky-600';
            borderClass = 'hover:border-sky-200';
        } else if (displayType.includes('Umum')) {
            iconClass = 'fa-parachute-box';
            bgIcon = 'bg-violet-100 text-violet-600';
            borderClass = 'hover:border-violet-200';
        } else {
            // Default Infaq / Lainnya
            iconClass = 'fa-hand-holding-heart';
            bgIcon = 'bg-orange-100 text-orange-600';
            borderClass = 'hover:border-orange-200';
        }

        const dateObj = new Date(item.Timestamp);
        const date = dateObj.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const time = dateObj.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const alumniYear = item.DetailAlumni || item.detailAlumni;
        const alumniBadge = alumniYear ?
            `<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-white border border-slate-600" title="Alumni Tahun ${alumniYear}"><i class="fas fa-graduation-cap mr-1"></i> ${alumniYear}</span>` :
            '';

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
                        ${parseInt(nominal).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                    </span>
                    <div class="flex items-center sm:justify-end gap-2 text-xs text-slate-400 font-medium">
                        <i class="far fa-clock"></i> ${date} • ${time}
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
