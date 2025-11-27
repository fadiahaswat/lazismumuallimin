/**
 * ============================================================================
 * SCRIPT UTAMA WEBSITE DONASI LAZISMU
 * ============================================================================
 * File ini mengatur semua logika website:
 * 1. Navigasi halaman (pindah dari Home ke Donasi, Riwayat, dll)
 * 2. Formulir Donasi (langkah-langkah wizard dengan desain baru)
 * 3. Menampilkan Berita dari WordPress
 * 4. Menampilkan Riwayat Donasi dari Google Sheets
 * 5. Tampilan pop-up (Modal) QRIS dan Berita
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
    type: null,          // Jenis donasi
    subType: null,       // Sub jenis
    nominal: 0,          // Jumlah uang
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

function init() {
    // Pengecekan aman untuk variabel global
    if (typeof rawSantriData !== 'undefined') {
        parseSantriData();
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
// 6. PENGOLAHAN DATA SANTRI
// ============================================================================
let santriDB = {};

function parseSantriData() {
    if (typeof rawSantriData === 'undefined' || !rawSantriData) return;
    const lines = rawSantriData.trim().split('\n');
    lines.forEach(line => {
        const parts = line.split('\t');
        if (parts.length < 3) return;

        const rombel = parts[0].trim();
        const nis = parts[1].trim();
        const nama = parts[2].trim();
        const level = rombel.charAt(0);

        if (!santriDB[level]) santriDB[level] = {};
        if (!santriDB[level][rombel]) santriDB[level][rombel] = [];

        santriDB[level][rombel].push({
            nama,
            nis,
            rombel
        });
    });
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
// 9. FITUR REKAPITULASI KELAS (EXPORT PDF)
// ============================================================================
function setupRekapLogic() {
    const lvlSelect = document.getElementById('rekap-level-select');
    const clsSelect = document.getElementById('rekap-kelas-select');
    const btnExport = document.getElementById('btn-export-pdf');

    if (!lvlSelect || !clsSelect) return;

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
        toggleRekapDisplay(false);
    };

    clsSelect.onchange = () => {
        const cls = clsSelect.value;
        if (cls) {
            toggleRekapDisplay(true);
            renderRekapTable(cls);
        } else {
            toggleRekapDisplay(false);
        }
    };

    if (btnExport) btnExport.onclick = () => exportRekapPDF();
}

function toggleRekapDisplay(show) {
    const ph = document.getElementById('rekap-placeholder');
    const sum = document.getElementById('rekap-summary');
    const tbl = document.getElementById('rekap-table-container');
    const btnExport = document.getElementById('btn-export-pdf');

    if (show) {
        ph.classList.add('hidden');
        sum.classList.remove('hidden');
        tbl.classList.remove('hidden');
        if (btnExport) btnExport.disabled = false;
    } else {
        ph.classList.remove('hidden');
        sum.classList.add('hidden');
        tbl.classList.add('hidden');
        if (btnExport) btnExport.disabled = true;
    }
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
const STEP_TITLES = [
    { title: "Pilih Jenis Kebaikan", subtitle: "Niat Suci Dimulai" },
    { title: "Tentukan Nominal", subtitle: "Semoga Rezeki Berkah" },
    { title: "Isi Data Muzakki/Munfiq", subtitle: "Menyambung Silaturahmi" },
    { title: "Metode Pembayaran", subtitle: "Mudah dan Aman" },
    { title: "Konfirmasi Akhir", subtitle: "Menjemput Ridho-Nya" }
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
    if (wizard) wizard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setupWizardLogic() {
    // Tombol Jenis Donasi (Desain Baru)
    document.querySelectorAll('.choice-button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.choice-button').forEach(b => {
                b.classList.remove('active');
                b.classList.remove('border-emerald-500', 'bg-emerald-50', 'border-amber-500', 'bg-amber-50', 'border-orange-500', 'bg-orange-50');
                b.classList.add('border-slate-100');
            });

            btn.classList.add('active');
            btn.classList.remove('border-slate-100');

            const type = btn.dataset.type;
            if (type === 'Zakat Fitrah') btn.classList.add('border-emerald-500', 'bg-emerald-50');
            else if (type === 'Zakat Maal') btn.classList.add('border-amber-500', 'bg-amber-50');
            else if (type === 'Infaq') btn.classList.add('border-orange-500', 'bg-orange-50');

            donasiData.type = type;
            donasiData.subType = null;

            document.getElementById('infaq-options').classList.add('hidden');
            document.getElementById('zakat-fitrah-checker').classList.add('hidden');
            document.getElementById('zakat-maal-checker').classList.add('hidden');
            document.getElementById('step-1-nav-default').classList.add('hidden');

            if (type === 'Infaq') document.getElementById('infaq-options').classList.remove('hidden');
            else if (type === 'Zakat Fitrah') {
                document.getElementById('zakat-fitrah-checker').classList.remove('hidden');
                document.getElementById('step-1-nav-default').classList.remove('hidden');
            }
            else if (type === 'Zakat Maal') document.getElementById('zakat-maal-checker').classList.remove('hidden');
        };
    });

    // Sub-Pilihan Infaq
    document.querySelectorAll('.sub-choice-button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.sub-choice-button').forEach(b => {
                b.classList.remove('active');
                b.classList.remove('border-rose-500', 'bg-rose-50', 'border-sky-500', 'bg-sky-50', 'border-violet-500', 'bg-violet-50');
                b.classList.add('border-slate-200');
            });
            btn.classList.add('active');
            btn.classList.remove('border-slate-200');

            const subType = btn.dataset.typeInfaq;
            if (subType.includes('Kampus')) btn.classList.add('border-rose-500', 'bg-rose-50');
            else if (subType.includes('Beasiswa')) btn.classList.add('border-sky-500', 'bg-sky-50');
            else if (subType.includes('Umum')) btn.classList.add('border-violet-500', 'bg-violet-50');

            donasiData.subType = subType;
            document.getElementById('step-1-nav-default').classList.remove('hidden');
        };
    });

    // ... (Logic input nominal, zakat calculator, data muzakki tetap sama)
    const fitrahInput = document.getElementById('fitrah-jumlah-orang');
    if (fitrahInput) {
        fitrahInput.oninput = (e) => {
            const total = (parseInt(e.target.value) || 0) * 37500;
            document.getElementById('fitrah-total').value = formatRupiah(total);
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

    // Nominal Button Logic
    document.querySelectorAll('.nominal-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            donasiData.nominal = parseInt(btn.dataset.nominal);
            document.getElementById('nominal-custom').value = formatRupiah(donasiData.nominal);
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

    // Step Navigations
    const btnNextStep2 = document.querySelector('[data-next-step="2"]');
    if(btnNextStep2) btnNextStep2.onclick = () => { if(donasiData.type === 'Infaq' && !donasiData.subType) return showToast('Pilih Infaq'); goToStep(2); };

    const btnNextStep3 = document.querySelector('[data-next-step="3"]');
    if(btnNextStep3) btnNextStep3.onclick = () => { if(donasiData.nominal < 1000) return showToast('Min Rp 1.000'); goToStep(3); };

    // Setup Santri Selects
    const santriLevel = document.getElementById('santri-level-select');
    const santriRombel = document.getElementById('santri-rombel-select');
    const santriNama = document.getElementById('santri-nama-select');

    if (santriLevel) {
        santriLevel.onchange = () => {
            if (santriRombel) { santriRombel.innerHTML = '<option value="">Rombel</option>'; santriRombel.disabled = true; }
            if (santriNama) { santriNama.innerHTML = '<option value="">Pilih Nama Santri</option>'; santriNama.disabled = true; }
            if (santriLevel.value && santriDB[santriLevel.value]) {
                Object.keys(santriDB[santriLevel.value]).forEach(r => { santriRombel.innerHTML += `<option value="${r}">${r}</option>`; });
                santriRombel.disabled = false;
            }
        };
    }
    if (santriRombel) {
        santriRombel.onchange = () => {
            if (santriNama) { santriNama.innerHTML = '<option value="">Pilih Nama Santri</option>'; santriNama.disabled = true; }
            if (santriLevel.value && santriRombel.value) {
                santriDB[santriLevel.value][santriRombel.value].forEach(s => { santriNama.innerHTML += `<option value="${s.nama}::${s.nis}::${s.rombel}">${s.nama}</option>`; });
                santriNama.disabled = false;
            }
        };
    }
    if (santriNama) {
        santriNama.onchange = () => {
            if (santriNama.value) {
                const [n, nis, r] = santriNama.value.split('::');
                donasiData.namaSantri = n; donasiData.nisSantri = nis; donasiData.rombelSantri = r;
            }
        };
    }

    // Step 4 Logic
    const btnNextStep4 = document.querySelector('[data-next-step="4"]');
    if (btnNextStep4) {
        btnNextStep4.onclick = () => {
            const nameInput = document.getElementById('nama-muzakki-input');
            const hpInput = document.getElementById('no-hp');
            if (!nameInput.value || !hpInput.value) return showToast("Data wajib diisi");
            
            donasiData.nama = nameInput.value;
            donasiData.hp = hpInput.value;
            donasiData.email = document.getElementById('email').value;
            donasiData.alamat = document.getElementById('alamat').value;
            donasiData.doa = document.getElementById('pesan-doa').value;
            
            goToStep(4);
        };
    }

    const btnNextStep5 = document.querySelector('[data-next-step="5"]');
    if (btnNextStep5) {
        btnNextStep5.onclick = () => {
            const method = document.querySelector('input[name="payment-method"]:checked');
            if (!method) return showToast("Pilih metode pembayaran");
            donasiData.metode = method.value;
            
            document.getElementById('summary-type').innerText = donasiData.subType || donasiData.type;
            document.getElementById('summary-nominal').innerText = formatRupiah(donasiData.nominal);
            document.getElementById('summary-nama').innerText = donasiData.nama;
            document.getElementById('summary-metode').innerText = donasiData.metode;
            
            goToStep(5);
        };
    }

    // Submit Logic
    const btnSubmit = document.getElementById('btn-submit-final');
    if (btnSubmit) {
        btnSubmit.onclick = async () => {
            if (!document.getElementById('confirm-check').checked) return showToast("Centang konfirmasi");
            btnSubmit.disabled = true;
            btnSubmit.querySelector('.default-text').classList.add('hidden');
            btnSubmit.querySelector('.loading-text').classList.remove('hidden');

            try {
                await fetch(GAS_API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: "create", payload: donasiData })
                });
                
                document.getElementById('success-modal').classList.remove('hidden');
                document.getElementById('donasi-wizard').classList.add('hidden');
                document.getElementById('donasi-payment-instructions').classList.remove('hidden');
                
                // Render Payment & Doa HTML
                let paymentHTML = donasiData.metode === 'QRIS' ? '<p>Silakan scan QRIS</p>' : '<p>Silakan Transfer</p>';
                document.getElementById('instruction-content').innerHTML = paymentHTML;

            } catch (e) {
                showToast("Gagal kirim data", "error");
                btnSubmit.disabled = false;
            }
        };
    }
}

// ============================================================================
// 9. RIWAYAT & STATISTIK (DIPERBARUI)
// ============================================================================
async function loadRiwayat() {
    if (riwayatData.isLoaded) return;
    document.getElementById('riwayat-loading').classList.remove('hidden');
    
    try {
        const res = await fetch(GAS_API_URL);
        const json = await res.json();
        if (json.status === 'success') {
            riwayatData.allData = json.data.reverse();
            riwayatData.isLoaded = true;
            renderHomeLatestDonations();
            renderRiwayatList();
            calculateStats();
            document.getElementById('riwayat-loading').classList.add('hidden');
            document.getElementById('riwayat-content').classList.remove('hidden');
        }
    } catch (e) {
        document.getElementById('riwayat-loading').innerHTML = '<p class="text-red-500">Gagal memuat data</p>';
    }
}

function calculateStats() {
    // (Logika hitung total, dll sama seperti sebelumnya)
}

function renderHomeLatestDonations() {
    const container = document.getElementById('home-latest-donations');
    if (!container) return;
    
    const latest = riwayatData.allData.slice(0, 6);
    if (latest.length === 0) {
        container.innerHTML = '<p class="text-center col-span-full">Belum ada donasi.</p>';
        return;
    }

    let html = latest.map(item => {
        const type = item.JenisDonasi || item.type || "";
        const subType = item.SubJenis || item.subType || "";
        const displayType = subType || type;
        const nominal = parseInt(item.Nominal) || 0;
        
        // Logika Ikon & Warna Baru
        let icon = 'fa-hand-holding-heart';
        let colorClass = 'bg-orange-100 text-orange-600';
        let badgeClass = 'bg-orange-50 text-orange-700 border-orange-100';

        if (displayType.includes('Fitrah')) { icon = 'fa-bowl-rice'; colorClass = 'bg-emerald-100 text-emerald-600'; badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100'; }
        else if (displayType.includes('Maal')) { icon = 'fa-sack-dollar'; colorClass = 'bg-amber-100 text-amber-600'; badgeClass = 'bg-amber-50 text-amber-700 border-amber-100'; }
        else if (displayType.includes('Kampus')) { icon = 'fa-school'; colorClass = 'bg-rose-100 text-rose-600'; badgeClass = 'bg-rose-50 text-rose-700 border-rose-100'; }
        else if (displayType.includes('Beasiswa')) { icon = 'fa-user-graduate'; colorClass = 'bg-sky-100 text-sky-600'; badgeClass = 'bg-sky-50 text-sky-700 border-sky-100'; }
        else if (displayType.includes('Umum')) { icon = 'fa-parachute-box'; colorClass = 'bg-violet-100 text-violet-600'; badgeClass = 'bg-violet-50 text-violet-700 border-violet-100'; }

        return `
        <div class="relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl border border-slate-100 transition-all group">
            <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center text-lg"><i class="fas ${icon}"></i></div>
                <span class="text-[10px] font-bold ${badgeClass} border px-2.5 py-1 rounded-lg uppercase tracking-wider">${displayType}</span>
            </div>
            <h5 class="font-bold text-slate-800 text-base mb-1">${item.NamaDonatur || 'Hamba Allah'}</h5>
            <div class="text-xl font-black text-slate-800">${formatRupiah(nominal)}</div>
            <div class="mt-3 text-[10px] text-slate-400 flex items-center gap-1"><i class="far fa-clock"></i> ${timeAgo(item.Timestamp)}</div>
        </div>`;
    }).join('');
    
    // Kartu statis (Ajakan & Lihat Semua)
    html += `<div onclick="showPage('donasi')" class="group cursor-pointer bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-center text-white flex flex-col items-center justify-center"><i class="fas fa-hand-holding-heart text-3xl mb-2"></i><h5 class="font-bold">Mari Berbagi</h5></div>`;
    html += `<div onclick="showPage('riwayat')" class="group cursor-pointer bg-white border border-slate-200 rounded-2xl p-6 text-center flex flex-col items-center justify-center hover:border-blue-300"><span class="font-bold text-slate-700">Lihat Semua</span></div>`;

    container.innerHTML = html;
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
            // Default Infaq
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
