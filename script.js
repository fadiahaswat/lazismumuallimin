// --- CONFIGURATION ---
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec";
const WORDPRESS_SITE = 'lazismumuallimin.wordpress.com';
const NEWS_PER_PAGE = 6;

// --- STATE MANAGEMENT ---
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
    metode: null
};

let riwayatData = {
    allData: [],
    isLoaded: false,
    currentPage: 1,
    itemsPerPage: 10
};

let timeFilterState = 'all';

// NEW: News State
let newsState = {
    page: 1,
    category: '',
    search: '',
    posts: [],
    isLoading: false,
    hasMore: true,
    isLoaded: false // Prevent re-fetching on tab switch
};

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    parseSantriData();
    setupNavigation();
    setupWizardLogic();
    setupHistoryLogic();
    setupModalLogic();
    setupRekapLogic();
    handleInitialLoad();
    fetchNewsCategories();
}

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = 'warning') {
    const container = document.getElementById('toast-container');
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

// --- UTILS ---
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

// --- SANTRI DATA PARSING ---
let santriDB = {};

function parseSantriData() {
    if (!rawSantriData) return;
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

// --- NAVIGATION ---
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

    // Logic khusus per halaman
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

// --- NEWS LOGIC (DYNAMIC CATEGORIES) ---
async function fetchNewsCategories() {
    const container = document.getElementById('news-filter-container');
    if (!container) return;

    try {
        // Fetch categories from WordPress
        const res = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${WORDPRESS_SITE}/categories`);
        const data = await res.json();

        // Start with "Semua" button
        let html = `<button data-slug="" onclick="filterNews('')" class="news-filter-btn active bg-brand-orange text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition">Semua</button>`;

        if (data.categories) {
            data.categories.forEach(cat => {
                // Only show categories that have posts
                if (cat.post_count > 0) {
                    html += `<button data-slug="${cat.slug}" onclick="filterNews('${cat.slug}')" class="news-filter-btn bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition">${cat.name}</button>`;
                }
            });
        }
        container.innerHTML = html;
    } catch (e) {
        console.error("Gagal ambil kategori", e);
        // Fallback to just "Semua" if fetch fails
        container.innerHTML = `<button data-slug="" onclick="filterNews('')" class="news-filter-btn active bg-brand-orange text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition">Semua</button>`;
    }
}

async function fetchNews(isLoadMore = false) {
    if (newsState.isLoading) return;
    newsState.isLoading = true;

    // UI Loading State
    if (isLoadMore) {
        const btnMore = document.getElementById('btn-news-load-more');
        if (btnMore) btnMore.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';
    } else {
        document.getElementById('news-grid').innerHTML = '<div class="col-span-full text-center py-20"><div class="animate-spin inline-block w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full mb-4"></div><p class="text-slate-400">Memuat berita terbaru...</p></div>';
    }

    // KONSTRUKSI URL API
    let apiURL = `https://public-api.wordpress.com/rest/v1.1/sites/${WORDPRESS_SITE}/posts/?number=${NEWS_PER_PAGE}&page=${newsState.page}`;

    // 1. Jika ada kata kunci pencarian (Search Box)
    if (newsState.search) {
        apiURL += `&search=${encodeURIComponent(newsState.search)}`;
    }

    // 2. Jika ada filter kategori
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
            document.getElementById('news-grid').innerHTML = '';
        }

        if (newsState.posts.length === 0) {
            let pesanKosong = "Tidak ada berita ditemukan.";
            if (newsState.category) pesanKosong = `Belum ada berita di kategori ini.`;

            document.getElementById('news-grid').innerHTML = `
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
        document.getElementById('news-grid').innerHTML = '<p class="text-center text-red-500 col-span-full">Gagal memuat berita. Periksa koneksi.</p>';
    }
}

function renderNewsGrid(postsToRender, appendMode) {
    const container = document.getElementById('news-grid');
    let html = '';
    let startIndex = appendMode ? (newsState.posts.length - postsToRender.length) : 0;

    // Helper untuk warna badge kategori acak
    const getBadgeColor = (catName) => {
        const colors = [
            'bg-blue-50 text-blue-600 border-blue-100',
            'bg-orange-50 text-orange-600 border-orange-100',
            'bg-green-50 text-green-600 border-green-100',
            'bg-purple-50 text-purple-600 border-purple-100'
        ];
        // Simple hash function untuk warna konsisten per kategori
        let hash = 0;
        for (let i = 0; i < catName.length; i++) hash = catName.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    postsToRender.forEach((post, i) => {
        const globalIndex = startIndex + i;
        const img = post.featured_image || 'https://via.placeholder.com/600x400?text=Lazismu+Update';

        // Format Date: "25 Nov 2025"
        const dateObj = new Date(post.date);
        const day = dateObj.toLocaleDateString('id-ID', {
            day: '2-digit'
        });
        const month = dateObj.toLocaleDateString('id-ID', {
            month: 'short'
        });
        const year = dateObj.getFullYear();

        // Get Category (First one)
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
        // Use robust data-slug matching
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

function updateReadingProgress() {
    const container = document.getElementById('news-modal-content');
    const progressBar = document.getElementById('reading-progress');
    // Mencegah error jika elemen belum ada
    if (!container || !progressBar) return;

    const scrollHeight = container.scrollHeight - container.clientHeight;
    const scrolled = (container.scrollTop / scrollHeight) * 100;
    progressBar.style.width = `${scrolled}%`;
}

function openNewsModal(index) {
    const post = newsState.posts[index];
    if (!post) return;

    const modal = document.getElementById('news-modal');
    const panel = document.getElementById('news-modal-panel');
    const container = document.getElementById('news-modal-content');

    // Format Data
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

    // Inject Content
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

    // Animation Open
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

// --- REKAPITULASI LOGIC ---
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

    const meta = classMetaData[cls] || {
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
    const meta = classMetaData[cls] || {
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

// --- WIZARD LOGIC ---
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

function setupWizardLogic() {
    // STEP 1
    document.querySelectorAll('.choice-button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.choice-button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            const type = btn.dataset.type;
            donasiData.type = type;
            donasiData.subType = null;

            const infaqOpts = document.getElementById('infaq-options');
            const zakatFitrah = document.getElementById('zakat-fitrah-checker');
            const zakatMaal = document.getElementById('zakat-maal-checker');
            const step1Nav = document.getElementById('step-1-nav-default');

            if (infaqOpts) infaqOpts.classList.add('hidden');
            if (zakatFitrah) zakatFitrah.classList.add('hidden');
            if (zakatMaal) zakatMaal.classList.add('hidden');
            if (step1Nav) step1Nav.classList.add('hidden');

            if (type === 'Infaq' && infaqOpts) infaqOpts.classList.remove('hidden');
            else if (type === 'Zakat Fitrah' && zakatFitrah) zakatFitrah.classList.remove('hidden');
            else if (type === 'Zakat Maal' && zakatMaal) zakatMaal.classList.remove('hidden');
        };
    });

    document.querySelectorAll('.sub-choice-button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.sub-choice-button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            donasiData.subType = btn.dataset.typeInfaq;
            const step1Nav = document.getElementById('step-1-nav-default');
            if (step1Nav) step1Nav.classList.remove('hidden');
        };
    });

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

    // STEP 2
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

    // STEP 3
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
            donasiData.nik = nikInput ? nikInput.value : '';

            if (isAlsoAlumni) {
                donasiData.isAlumni = true;
                donasiData.alumniTahun = alumniInput ? alumniInput.value : '';
            } else {
                donasiData.isAlumni = false;
                donasiData.alumniTahun = '';
            }

            goToStep(4);
        };
    }

    // STEP 4
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

    // SUBMIT FINAL
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
                "DetailAlumni": donasiData.alumniTahun || "",
                "namaSantri": donasiData.namaSantri || "",
                "nisSantri": donasiData.nisSantri || "",
                "rombelSantri": donasiData.rombelSantri || "",
                "NoKTP": donasiData.nik || ""
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

                const modal = document.getElementById('success-modal');
                if (modal) modal.classList.remove('hidden');

                const waMsg = `Assalamu'alaikum, saya ingin konfirmasi donasi kebaikan:\n\nJenis: ${donasiData.subType || donasiData.type}\nNominal: ${formatRupiah(donasiData.nominal)}\nNama: ${donasiData.nama}\nMetode: ${donasiData.metode}\n${donasiData.namaSantri ? `Santri: ${donasiData.namaSantri} (${donasiData.rombelSantri})` : ''}`;
                const btnWa = document.getElementById('btn-wa-confirm');
                if (btnWa) btnWa.href = `https://wa.me/6281196961918?text=${encodeURIComponent(waMsg)}`;

                // GENERATE PAYMENT INSTRUCTIONS
                let paymentDetails = '';
                if (donasiData.metode === 'QRIS') {
                    paymentDetails = `
                        <div class="text-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <p class="font-bold text-slate-700 mb-4">Silakan Scan QRIS Berikut:</p>
                            <div class="grid grid-cols-3 gap-4 mb-2">
                                <div class="bg-white p-2 rounded-xl border border-slate-100 shadow-sm"><img src="https://drive.google.com/thumbnail?id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt" class="w-full rounded-lg"></div>
                                <div class="bg-white p-2 rounded-xl border border-slate-100 shadow-sm"><img src="https://drive.google.com/thumbnail?id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V" class="w-full rounded-lg"></div>
                                <div class="bg-white p-2 rounded-xl border border-slate-100 shadow-sm"><img src="https://drive.google.com/thumbnail?id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm" class="w-full rounded-lg"></div>
                            </div>
                            <p class="text-xs text-slate-400">Mendukung semua e-wallet & m-banking</p>
                        </div>
                    `;
                } else if (donasiData.metode === 'Transfer') {
                    paymentDetails = `
                        <div class="space-y-3">
                            <div class="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex justify-between items-center"><div><span class="font-bold block text-slate-700">BNI</span><span class="text-sm font-mono text-slate-500">3440000348</span></div><button onclick="copyText('3440000348')" class="text-orange-500 text-sm font-bold hover:bg-orange-50 px-3 py-1 rounded-lg transition">Salin</button></div>
                            <div class="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex justify-between items-center"><div><span class="font-bold block text-slate-700">BSI</span><span class="text-sm font-mono text-slate-500">7930030303</span></div><button onclick="copyText('7930030303')" class="text-teal-500 text-sm font-bold hover:bg-teal-50 px-3 py-1 rounded-lg transition">Salin</button></div>
                            <div class="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex justify-between items-center"><div><span class="font-bold block text-slate-700">BPD DIY Syariah</span><span class="text-sm font-mono text-slate-500">801241004624</span></div><button onclick="copyText('801241004624')" class="text-blue-500 text-sm font-bold hover:bg-blue-50 px-3 py-1 rounded-lg transition">Salin</button></div>
                        </div>
                    `;
                } else {
                    paymentDetails = `<div class="p-6 bg-blue-50 rounded-2xl text-center border border-blue-100"><div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl"><i class="fas fa-hand-holding-usd"></i></div><p class="text-blue-800 font-bold">Pembayaran Tunai</p><p class="text-blue-600 text-sm mt-1">Silakan serahkan donasi ke Kantor Layanan Lazismu Mu'allimin.</p></div>`;
                }

                const prayerHTML = `
                    <div class="mb-8 text-center bg-green-50 p-6 rounded-2xl border border-green-100">
                        <p class="font-arabic text-2xl text-green-800 mb-4 leading-loose font-bold">
                            آجَرَكَ اللَّهُ فِيمَا أَعْطَيْتَ، وَبَارَكَ اللَّهُ فِيمَا أَبْقَيْتَ، وَجَعَلَهُ لَكَ طَهُورًا
                        </p>
                        <p class="text-green-700 text-sm italic">
                            "Semoga Allah memberikan pahala atas apa yang engkau berikan, dan semoga Allah memberkahimu atas apa yang masih ada di tanganmu dan menjadikannya sebagai pembersih (dosa) bagimu."
                        </p>
                    </div>
                `;

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

// --- HISTORY LOGIC ---
function setupHistoryLogic() {
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

    ['filter-jenis', 'filter-metode', 'filter-start-date', 'filter-end-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.onchange = () => {
            riwayatData.currentPage = 1;
            renderRiwayatList();
            renderPagination();
        };
    });

    document.querySelectorAll('.time-filter-btn').forEach(btn => {
        btn.onclick = () => {
            // 1. RESET SEMUA TOMBOL KE TAMPILAN MATI (INACTIVE)
            document.querySelectorAll('.time-filter-btn').forEach(b => {
                // Hapus style aktif
                b.classList.remove('bg-slate-900', 'text-white', 'shadow-md', 'active');
                // Tambahkan style tidak aktif
                b.classList.add('text-slate-500', 'hover:bg-white', 'hover:text-slate-700', 'hover:shadow-sm');
                // Hapus background putih jika ada (dari sisa hover)
                b.classList.remove('bg-white');
            });

            // 2. AKTIFKAN TOMBOL YANG DIKLIK
            // Hapus style tidak aktif
            btn.classList.remove('text-slate-500', 'hover:bg-white', 'hover:text-slate-700', 'hover:shadow-sm');
            // Tambahkan style aktif
            btn.classList.add('bg-slate-900', 'text-white', 'shadow-md', 'active');

            // 3. JALANKAN LOGIKA FILTER
            timeFilterState = btn.dataset.time;
            riwayatData.currentPage = 1;
            renderRiwayatList();
            renderPagination();
        }
    });

    // UPDATE JUGA BAGIAN RESET BUTTON
    const resetBtn = document.getElementById('btn-reset-filter');
    if (resetBtn) {
        resetBtn.onclick = () => {
            document.getElementById('filter-jenis').value = 'all';
            document.getElementById('filter-metode').value = 'all';
            document.getElementById('filter-start-date').value = '';
            document.getElementById('filter-end-date').value = '';

            timeFilterState = 'all';

            // RESET VISUAL TOMBOL WAKTU (Kembali ke 'Semua')
            document.querySelectorAll('.time-filter-btn').forEach(b => {
                b.classList.remove('bg-slate-900', 'text-white', 'shadow-md', 'active');
                b.classList.add('text-slate-500', 'hover:bg-white', 'hover:text-slate-700', 'hover:shadow-sm');

                // Jika tombol adalah 'all', jadikan aktif
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

            calculateStats();
            renderHomeLatestDonations();
            renderPagination();
            renderRiwayatList();

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
            iconClass = 'fa-leaf';
            bgIcon = 'bg-emerald-100 text-emerald-600';
            bgBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
        } else if (displayType.includes('Maal')) {
            iconClass = 'fa-coins';
            bgIcon = 'bg-amber-100 text-amber-600';
            bgBadge = 'bg-amber-50 text-amber-700 border-amber-100';
        } else {
            iconClass = 'fa-hand-holding-heart';
            bgIcon = 'bg-orange-100 text-brand-orange';
            bgBadge = 'bg-orange-50 text-orange-700 border-orange-100';
        }

        return `
        <div class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-slate-100 transition-all duration-300 group hover:-translate-y-1 h-full flex flex-col justify-between">
            <div>
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-full ${bgIcon} flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <span class="text-[10px] font-bold ${bgBadge} border px-2 py-1 rounded-full truncate max-w-[100px]">${displayType}</span>
                </div>
                <div>
                    <h5 class="font-bold text-slate-800 text-sm mb-1 truncate" title="${item.NamaDonatur || 'Hamba Allah'}">
                        ${item.NamaDonatur || 'Hamba Allah'}
                    </h5>
                    <div class="flex items-baseline gap-1">
                        <span class="text-xs text-slate-400 font-medium">Rp</span>
                        <span class="text-lg font-black text-slate-800 group-hover:text-brand-orange transition-colors">${parseInt(item.Nominal).toLocaleString('id-ID')}</span>
                    </div>
                </div>
            </div>
            <div class="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2 text-[10px] text-slate-400">
                <i class="far fa-clock"></i>
                <span>${timeAgo(item.Timestamp)}</span>
            </div>
        </div>
        `;
    }).join('');

    // --- KARTU 7: AJAKAN DONASI (Accent Color) ---
    html += `
        <div onclick="showPage('donasi')" class="group relative bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 shadow-lg shadow-orange-500/20 text-white cursor-pointer hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center h-full min-h-[180px] overflow-hidden border border-orange-400/50">
            <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            <div class="relative z-10">
                <div class="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition duration-300">
                    <i class="fas fa-hand-holding-heart text-2xl"></i>
                </div>
                <h5 class="font-bold text-lg mb-1 leading-tight">Mari Berbagi</h5>
                <p class="text-xs text-orange-100 mb-3">Tunaikan ZIS Anda sekarang</p>
                <span class="inline-block bg-white text-orange-600 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm group-hover:shadow-md transition">
                    Klik di sini
                </span>
            </div>
        </div>
    `;

    // --- KARTU 8: LIHAT SEMUA (Outline Style) ---
    html += `
        <div onclick="showPage('riwayat')" class="group bg-slate-50 rounded-2xl p-5 border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center h-full min-h-[180px]">
             <div class="w-12 h-12 rounded-full bg-white text-slate-400 border border-slate-200 flex items-center justify-center mb-3 shadow-sm group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all duration-300">
                <i class="fas fa-arrow-right text-lg group-hover:-rotate-45 transition-transform duration-300"></i>
             </div>
             <span class="font-bold text-sm text-slate-500 group-hover:text-blue-600 transition-colors">Lihat Semua</span>
             <span class="text-xs text-slate-400 mt-1 group-hover:text-blue-400">Arsip Data Lengkap</span>
        </div>
    `;

    container.innerHTML = html;
}

function calculateStats() {
    const data = riwayatData.allData;
    let total = 0;
    let todayTotal = 0;
    let maxDonation = 0;
    let maxDonationName = "-";
    const todayStr = new Date().toDateString();

    const classMapMTs = {},
        classMapMA = {};
    const santriDonasiMTs = {},
        santriDonasiMA = {};
    const santriFreqMTs = {},
        santriFreqMA = {};
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

    // Handle Empty State
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

        // Normalisasi data (handle properti huruf besar/kecil dari API)
        const type = item.JenisDonasi || item.type || "";
        const subType = item.SubJenis || item.subType || "";
        const displayType = subType || type;
        const paymentMethod = item.MetodePembayaran || item.metode || "Tunai";
        const donaturName = item.NamaDonatur || item.nama || 'Hamba Allah';
        const nominal = parseInt(item.Nominal || item.nominal) || 0;

        // Logika Warna Berdasarkan Jenis Donasi
        if (displayType.includes('Fitrah')) {
            iconClass = 'fa-leaf';
            bgIcon = 'bg-emerald-100 text-emerald-600';
            borderClass = 'hover:border-emerald-200';
        } else if (displayType.includes('Maal')) {
            iconClass = 'fa-coins';
            bgIcon = 'bg-yellow-100 text-yellow-600';
            borderClass = 'hover:border-yellow-200';
        } else if (displayType.includes('Infaq')) {
            iconClass = 'fa-hand-holding-heart';
            bgIcon = 'bg-orange-100 text-orange-600';
            borderClass = 'hover:border-orange-200';
        }

        // Format Waktu
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

        // Badge Alumni
        const alumniYear = item.DetailAlumni || item.detailAlumni;
        const alumniBadge = alumniYear ?
            `<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-white border border-slate-600" title="Alumni Tahun ${alumniYear}"><i class="fas fa-graduation-cap mr-1"></i> ${alumniYear}</span>` :
            '';

        // Badge Metode Pembayaran
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

// --- LOGIKA MODAL QRIS (POP-UP) ---
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

// Optional: Header Scroll Effect
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
