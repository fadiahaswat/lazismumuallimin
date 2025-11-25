// =========================================
// FILE: script.js (VERSI FINAL & LENGKAP)
// =========================================

// --- 1. CONFIGURATION ---
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec";
const WORDPRESS_SITE = 'lazismumuallimin.wordpress.com';
const NEWS_PER_PAGE = 6;

// --- 2. STATE MANAGEMENT ---
let donasiData = {
    type: null,
    subType: null,
    nominal: 0,
    donaturTipe: 'santri',
    isAlumni: false,
    alumniTahun: '',
    namaSantri: '', nisSantri: '', rombelSantri: '',
    nama: '', hp: '', email: '', alamat: '', doa: '',
    metode: null,
    nik: ''
};

let riwayatData = { allData: [], isLoaded: false, currentPage: 1, itemsPerPage: 10 };
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

// --- 3. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    // Cek URL hash saat pertama buka (misal #tentang atau #donasi)
    handleInitialLoad();
    
    // Pasang event listener untuk tombol-tombol
    setupNavigation();
    setupWizardLogic(); // Logic Formulir Donasi
    setupHistoryLogic(); // Logic Laporan
    setupModalLogic(); // Logic Pop-up Hubungi & QRIS
    setupRekapLogic(); // Logic Rekap Kelas
    
    // Ambil data awal
    fetchNewsCategories();
}

// --- 4. NAVIGATION SYSTEM ---
function showPage(pageId) {
    // 1. Sembunyikan semua section halaman
    document.querySelectorAll('.page-section').forEach(p => {
        p.style.display = 'none'; 
        p.classList.remove('active');
    });

    // 2. Matikan status aktif di menu
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    // 3. Tampilkan halaman yang diminta
    const target = document.getElementById(`page-${pageId}`);
    if (target) {
        target.style.display = 'block';
        void target.offsetWidth; // Trigger reflow untuk animasi
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 4. Nyalakan status aktif di menu navbar
    const navLink = document.querySelector(`a[href="#${pageId}"]`);
    if (navLink) navLink.classList.add('active');

    // 5. Load data khusus jika diperlukan
    if (pageId === 'riwayat' || pageId === 'home') loadRiwayat();
    if (pageId === 'berita') {
        if (!newsState.isLoaded) fetchNews();
    }
}

function scrollToSection(sectionId) {
    // Pastikan user ada di halaman home dulu
    const homeSection = document.getElementById('page-home');
    if (homeSection && homeSection.style.display === 'none') {
        showPage('home');
    }
    
    // Scroll ke section target
    setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 300);
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
    // Tombol Burger Menu (Mobile)
    const menuToggle = document.getElementById('menu-toggle');
    const menuLinks = document.getElementById('menu-links');
    if (menuToggle && menuLinks) {
        menuToggle.onclick = () => {
            menuLinks.classList.toggle('hidden');
        };
    }
}

// --- 5. MODAL LOGIC (Hubungi & QRIS) ---
function setupModalLogic() {
    // Modal Hubungi Kami
    const modalHubungi = document.getElementById('hubungi-modal');
    const btnHubungi = document.getElementById('btn-hubungi-hero');
    const closeHubungi = document.getElementById('hubungi-modal-close');

    if (btnHubungi) btnHubungi.onclick = () => modalHubungi.classList.remove('hidden');
    if (closeHubungi) closeHubungi.onclick = () => modalHubungi.classList.add('hidden');
    if (modalHubungi) {
        modalHubungi.onclick = (e) => {
            if (e.target === modalHubungi) modalHubungi.classList.add('hidden');
        }
    }
}

// Database QRIS
const qrisDatabase = {
    'bni': {
        title: 'QRIS BNI',
        img: 'https://drive.google.com/thumbnail?id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt&sz=w1000',
        url: 'https://drive.google.com/uc?export=download&id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt'
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

// Fungsi Buka Modal QRIS
function openQrisModal(key) {
    const data = qrisDatabase[key];
    if (!data) return;

    const modal = document.getElementById('qris-modal');
    const panel = document.getElementById('qris-modal-panel');

    // Isi konten modal
    document.getElementById('qris-modal-title').innerText = data.title;
    document.getElementById('qris-modal-img').src = data.img;
    document.getElementById('qris-modal-btn').href = data.url;

    // Tampilkan
    modal.classList.remove('hidden');
    setTimeout(() => {
        panel.classList.remove('scale-95');
        panel.classList.add('scale-100');
    }, 10);
}

// Fungsi Tutup Modal QRIS
function closeQrisModal() {
    const modal = document.getElementById('qris-modal');
    const panel = document.getElementById('qris-modal-panel');

    panel.classList.remove('scale-100');
    panel.classList.add('scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// --- 6. NEWS SYSTEM (Berita) ---
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
                    html += `<button data-slug="${cat.slug}" onclick="filterNews('${cat.slug}')" class="news-filter-btn bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition">${cat.name}</button>`;
                }
            });
        }
        container.innerHTML = html;
    } catch (e) {
        console.error("Gagal load kategori", e);
    }
}

async function fetchNews(isLoadMore = false) {
    if (newsState.isLoading) return;
    newsState.isLoading = true;

    if (isLoadMore) {
        const btnMore = document.getElementById('btn-news-load-more');
        if (btnMore) btnMore.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';
    } else {
        document.getElementById('news-grid').innerHTML = '<div class="col-span-full text-center py-20"><div class="animate-spin inline-block w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full mb-4"></div><p class="text-slate-400">Memuat berita terbaru...</p></div>';
    }

    let apiURL = `https://public-api.wordpress.com/rest/v1.1/sites/${WORDPRESS_SITE}/posts/?number=${NEWS_PER_PAGE}&page=${newsState.page}`;
    if (newsState.search) apiURL += `&search=${encodeURIComponent(newsState.search)}`;
    if (newsState.category) apiURL += `&category=${encodeURIComponent(newsState.category)}`;

    try {
        const res = await fetch(apiURL);
        const data = await res.json();
        
        newsState.isLoading = false;
        newsState.isLoaded = true;
        newsState.hasMore = data.posts.length >= NEWS_PER_PAGE;

        if (isLoadMore) {
            newsState.posts = [...newsState.posts, ...data.posts];
        } else {
            newsState.posts = data.posts;
            document.getElementById('news-grid').innerHTML = '';
        }

        if (newsState.posts.length === 0) {
            document.getElementById('news-grid').innerHTML = `<div class="col-span-full text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200"><i class="fas fa-newspaper text-4xl text-slate-300 mb-3"></i><p class="text-slate-500">Tidak ada berita ditemukan.</p><button onclick="resetNewsFilter()" class="mt-4 text-brand-orange font-bold hover:underline">Reset Filter</button></div>`;
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

    postsToRender.forEach((post, i) => {
        const globalIndex = startIndex + i;
        const img = post.featured_image || 'https://via.placeholder.com/600x400?text=Lazismu';
        const date = new Date(post.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        
        html += `
        <div class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition duration-300 overflow-hidden flex flex-col h-full border border-slate-100 group cursor-pointer" onclick="openNewsModal(${globalIndex})">
            <div class="relative h-56 overflow-hidden bg-slate-100">
                <img src="${img}" alt="${post.title}" class="w-full h-full object-cover transition duration-700 group-hover:scale-105">
                <div class="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-slate-600 shadow">${date}</div>
            </div>
            <div class="p-6 flex flex-col flex-grow">
                <h3 class="font-bold text-lg text-slate-800 mb-3 line-clamp-2 group-hover:text-brand-orange transition">${post.title}</h3>
                <p class="text-slate-500 text-sm line-clamp-3 mb-4 flex-grow">${stripHtml(post.excerpt)}</p>
                <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-xs font-bold text-brand-orange uppercase tracking-wide">Baca Selengkapnya</span>
                    <i class="fas fa-arrow-right text-slate-300 group-hover:text-brand-orange transition transform group-hover:translate-x-1"></i>
                </div>
            </div>
        </div>`;
    });

    if (appendMode) container.innerHTML += html;
    else container.innerHTML = html;
}

function openNewsModal(index) {
    const post = newsState.posts[index];
    if (!post) return;

    const modal = document.getElementById('news-modal');
    const panel = document.getElementById('news-modal-panel');
    const container = document.getElementById('news-modal-content');
    const date = new Date(post.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const img = post.featured_image || 'https://via.placeholder.com/1200x600';

    container.innerHTML = `
        <div class="relative h-64 md:h-80 w-full bg-slate-900">
            <img src="${img}" class="w-full h-full object-contain" alt="Detail">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>
            <div class="absolute bottom-0 left-0 p-8 w-full">
                <span class="bg-brand-orange text-white px-3 py-1 rounded text-xs font-bold mb-3 inline-block shadow">Berita Lazismu</span>
                <h2 class="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-md mb-2">${post.title}</h2>
                <div class="flex items-center gap-4 text-sm text-slate-300">
                    <span><i class="far fa-calendar-alt mr-2"></i> ${date}</span>
                </div>
            </div>
        </div>
        <div class="p-8 md:p-10 overflow-y-auto">
            <div class="wp-content text-lg text-slate-700">${post.content}</div>
            <div class="mt-10 pt-6 border-t border-slate-100 text-center">
                <p class="text-slate-400 text-sm mb-4">Bagikan kebaikan ini:</p>
                <div class="flex justify-center gap-3">
                    <a href="https://wa.me/?text=${encodeURIComponent(post.title + ' ' + post.URL)}" target="_blank" class="w-10 h-10 rounded-full bg-green-500 text-white hover:scale-110 transition flex items-center justify-center"><i class="fab fa-whatsapp"></i></a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(post.URL)}" target="_blank" class="w-10 h-10 rounded-full bg-blue-600 text-white hover:scale-110 transition flex items-center justify-center"><i class="fab fa-facebook-f"></i></a>
                </div>
            </div>
        </div>`;

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        panel.classList.remove('scale-95');
        panel.classList.add('scale-100');
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
            btn.classList.remove('bg-slate-100', 'text-slate-600');
            btn.classList.add('bg-brand-orange', 'text-white');
        } else {
            btn.classList.add('bg-slate-100', 'text-slate-600');
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

function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

// --- 7. HISTORY LOGIC (Riwayat & Statistik) ---
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
        console.error(e);
        if (loader) loader.innerHTML = '<p class="text-red-500">Gagal memuat data.</p>';
    }
}

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
            document.querySelectorAll('.time-filter-btn').forEach(b => {
                b.classList.remove('bg-brand-orange', 'text-white');
                b.classList.add('bg-slate-100', 'text-slate-500');
            });
            btn.classList.remove('bg-slate-100', 'text-slate-500');
            btn.classList.add('bg-brand-orange', 'text-white');

            timeFilterState = btn.dataset.time;
            riwayatData.currentPage = 1;
            renderRiwayatList();
            renderPagination();
        }
    });

    const resetBtn = document.getElementById('btn-reset-filter');
    if (resetBtn) {
        resetBtn.onclick = () => {
            document.getElementById('filter-jenis').value = 'all';
            document.getElementById('filter-metode').value = 'all';
            document.getElementById('filter-start-date').value = '';
            document.getElementById('filter-end-date').value = '';
            
            timeFilterState = 'all';
            document.querySelectorAll('.time-filter-btn').forEach(b => {
                b.classList.remove('bg-brand-orange', 'text-white');
                b.classList.add('bg-slate-100', 'text-slate-500');
            });
            riwayatData.currentPage = 1;
            renderRiwayatList();
            renderPagination();
        }
    }
}

function getFilteredData() {
    let filtered = riwayatData.allData;
    const typeFilter = document.getElementById('filter-jenis') ? document.getElementById('filter-jenis').value : 'all';
    const methodFilter = document.getElementById('filter-metode') ? document.getElementById('filter-metode').value : 'all';
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;

    if (typeFilter !== 'all') filtered = filtered.filter(d => d.JenisDonasi === typeFilter || d.type === typeFilter);
    if (methodFilter !== 'all') filtered = filtered.filter(d => d.MetodePembayaran === methodFilter);

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

    if (visibleItems.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-400 py-4">Tidak ada data.</p>';
        return;
    }

    container.innerHTML = visibleItems.map(item => {
        let iconClass = 'fa-donate text-slate-400';
        let bgIcon = 'bg-slate-100';
        const displayType = item.SubJenis || item.JenisDonasi || "";

        if (displayType.includes('Fitrah')) { iconClass = 'fa-leaf text-emerald-500'; bgIcon = 'bg-emerald-50'; }
        else if (displayType.includes('Maal')) { iconClass = 'fa-coins text-yellow-500'; bgIcon = 'bg-yellow-50'; }
        else { iconClass = 'fa-hand-holding-heart text-indigo-500'; bgIcon = 'bg-indigo-50'; }

        const date = new Date(item.Timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const alumniText = (item.DetailAlumni || item.detailAlumni) ? `<span class="text-xs text-orange-500 font-semibold block mt-0.5">Alumni ${item.DetailAlumni || item.detailAlumni}</span>` : '';

        return `
            <div class="soft-card p-4 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full ${bgIcon} flex items-center justify-center text-lg shrink-0"><i class="fas ${iconClass}"></i></div>
                    <div>
                        <h4 class="font-bold text-slate-800 text-sm md:text-base">${item.NamaDonatur || 'Hamba Allah'}</h4>
                        ${alumniText}
                        <p class="text-xs text-slate-500 mt-1">${displayType}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="block font-black text-slate-700">${formatRupiah(item.Nominal)}</span>
                    <span class="text-xs text-slate-400">${date}</span>
                </div>
            </div>`;
    }).join('');
}

function renderPagination() {
    const items = getFilteredData();
    const totalPages = Math.ceil(items.length / riwayatData.itemsPerPage);
    
    const pageInfo = document.getElementById('riwayat-page-info');
    if(pageInfo) pageInfo.innerText = `Page ${riwayatData.currentPage} of ${totalPages || 1}`;
    
    const prevBtn = document.getElementById('riwayat-prev');
    if(prevBtn) prevBtn.disabled = riwayatData.currentPage === 1;
    
    const nextBtn = document.getElementById('riwayat-next');
    if(nextBtn) nextBtn.disabled = riwayatData.currentPage >= totalPages || totalPages === 0;
}

function renderHomeLatestDonations() {
    const container = document.getElementById('home-latest-donations');
    if(!container) return;

    const latest = riwayatData.allData.slice(0, 8);
    if (latest.length === 0) {
        container.innerHTML = '<div class="text-center col-span-full py-4 text-slate-400 text-sm">Belum ada donasi. Jadilah yang pertama!</div>';
        return;
    }

    let html = latest.map(item => {
        let iconClass = 'fa-donate';
        let bgIcon = 'bg-slate-100 text-slate-400';
        let bgBadge = 'bg-slate-50 text-slate-600';
        const displayType = item.SubJenis || item.JenisDonasi || "";

        if(displayType.includes('Fitrah')) { iconClass = 'fa-leaf'; bgIcon = 'bg-emerald-100 text-emerald-600'; bgBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100'; }
        else if(displayType.includes('Maal')) { iconClass = 'fa-coins'; bgIcon = 'bg-amber-100 text-amber-600'; bgBadge = 'bg-amber-50 text-amber-700 border-amber-100'; }
        else { iconClass = 'fa-hand-holding-heart'; bgIcon = 'bg-orange-100 text-brand-orange'; bgBadge = 'bg-orange-50 text-orange-700 border-orange-100'; }

        return `
        <div class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-slate-100 transition-all duration-300 group hover:-translate-y-1">
            <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 rounded-full ${bgIcon} flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300"><i class="fas ${iconClass}"></i></div>
                <span class="text-xs font-bold ${bgBadge} border px-2 py-1 rounded-full truncate max-w-[120px]">${displayType}</span>
            </div>
            <div>
                <h5 class="font-bold text-slate-800 text-sm mb-1 truncate" title="${item.NamaDonatur || 'Hamba Allah'}">${item.NamaDonatur || 'Hamba Allah'}</h5>
                <div class="flex items-baseline gap-1">
                    <span class="text-xs text-slate-400 font-medium">Rp</span>
                    <span class="text-lg font-black text-slate-800 group-hover:text-brand-orange transition-colors">${parseInt(item.Nominal).toLocaleString('id-ID')}</span>
                </div>
                <div class="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2 text-[10px] text-slate-400">
                    <i class="far fa-clock"></i><span>${timeAgo(item.Timestamp)}</span>
                </div>
            </div>
        </div>`;
    }).join('');
    
    html += `<div onclick="showPage('riwayat')" class="bg-slate-50 p-5 rounded-2xl hover:bg-white hover:shadow-md border border-slate-100 border-dashed hover:border-solid transition-all duration-300 cursor-pointer flex flex-col items-center justify-center h-full min-h-[180px] group"><div class="w-12 h-12 rounded-full bg-white text-slate-400 flex items-center justify-center mb-3 shadow-sm group-hover:bg-brand-orange group-hover:text-white transition-all duration-300"><i class="fas fa-arrow-right text-lg"></i></div><span class="font-bold text-sm text-slate-500 group-hover:text-brand-orange transition-colors">Lihat Semua</span><span class="text-xs text-slate-400 mt-1">Jejak Kebaikan Lainnya</span></div>`;
    container.innerHTML = html;
}

function calculateStats() {
    const data = riwayatData.allData;
    let total = 0, todayTotal = 0, maxDonation = 0, maxDonationName = "-";
    const todayStr = new Date().toDateString();
    const classMapMTs = {}, classMapMA = {};
    const santriDonasiMTs = {}, santriDonasiMA = {};
    const santriFreqMTs = {}, santriFreqMA = {};
    const donationTypes = {};
    let totalFitrah = 0, totalMaal = 0, totalInfaq = 0;

    data.forEach(d => {
        const val = parseInt(d.Nominal) || 0;
        total += val;
        if(val > maxDonation) { maxDonation = val; maxDonationName = d.NamaDonatur || "Hamba Allah"; }
        if(new Date(d.Timestamp).toDateString() === todayStr) todayTotal += val;

        const typeName = d.JenisDonasi || "Lainnya";
        donationTypes[typeName] = (donationTypes[typeName] || 0) + 1;
        if(typeName.includes('Fitrah')) totalFitrah += val;
        else if(typeName.includes('Maal')) totalMaal += val;
        else if(typeName.includes('Infaq')) totalInfaq += val;

        const rombel = d.KelasSantri || d.rombelSantri;
        const nama = d.NamaSantri || d.namaSantri;
        if(rombel && nama) {
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
        let pop = "-"; let max = 0;
        for(const [k,v] of Object.entries(obj)) { if(v > max) { max = v; pop = k; } }
        return pop;
    };
    const popularType = getPopular(donationTypes);
    const getMax = (map, type='val') => {
        let maxK = 'N/A', maxV = 0;
        for(const [k,v] of Object.entries(map)) { if(v > maxV) { maxV = v; maxK = k; } }
        return { key: maxK, val: type === 'val' ? formatRupiah(maxV) : maxV + 'x' };
    };

    animateValue('stat-total-donasi', total, true);
    animateValue('stat-total-transaksi', data.length);
    animateValue('stat-donasi-rata', data.length ? total/data.length : 0, true);
    animateValue('stat-donasi-tertinggi', maxDonation, true);
    setText('stat-donasi-tertinggi-nama', maxDonationName);
    animateValue('stat-r-total', total, true);
    animateValue('stat-r-transaksi', data.length);
    animateValue('stat-r-hari-ini', todayTotal, true);
    setText('stat-r-tipe-top', popularType);
    animateValue('stat-detail-fitrah', totalFitrah, true);
    animateValue('stat-detail-maal', totalMaal, true);
    animateValue('stat-detail-infaq', totalInfaq, true);

    const mtsClass = getMax(classMapMTs); setText('stat-mts-kelas-max', mtsClass.key); setText('stat-mts-kelas-total', mtsClass.val);
    const mtsSantri = getMax(santriDonasiMTs); setText('stat-mts-santri-max-donasi', mtsSantri.key.split('(')[0]); setText('stat-mts-santri-total-donasi', mtsSantri.val);
    const mtsFreq = getMax(santriFreqMTs, 'freq'); setText('stat-mts-santri-freq-nama', mtsFreq.key.split('(')[0]); setText('stat-mts-santri-freq-val', mtsFreq.val);

    const maClass = getMax(classMapMA); setText('stat-ma-kelas-max', maClass.key); setText('stat-ma-kelas-total', maClass.val);
    const maSantri = getMax(santriDonasiMA); setText('stat-ma-santri-max-donasi', maSantri.key.split('(')[0]); setText('stat-ma-santri-total-donasi', maSantri.val);
    const maFreq = getMax(santriFreqMA, 'freq'); setText('stat-ma-santri-freq-nama', maFreq.key.split('(')[0]); setText('stat-ma-santri-freq-val', maFreq.val);
}

// --- 8. REKAP LOGIC ---
function setupRekapLogic() {
    const lvlSelect = document.getElementById('rekap-level-select');
    const clsSelect = document.getElementById('rekap-kelas-select');
    const btnExport = document.getElementById('btn-export-pdf');

    if (!lvlSelect || !clsSelect) return;

    lvlSelect.onchange = () => {
        const lvl = lvlSelect.value;
        clsSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>';
        if (lvl && typeof santriDB !== 'undefined' && santriDB[lvl]) {
            clsSelect.disabled = false;
            Object.keys(santriDB[lvl]).sort().forEach(cls => {
                clsSelect.innerHTML += `<option value="${cls}">Kelas ${cls}</option>`;
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
        ph.classList.add('hidden'); sum.classList.remove('hidden'); tbl.classList.remove('hidden'); if(btnExport) btnExport.disabled = false;
    } else {
        ph.classList.remove('hidden'); sum.classList.add('hidden'); tbl.classList.add('hidden'); if(btnExport) btnExport.disabled = true;
    }
}

function renderRekapTable(cls) {
    const tbody = document.getElementById('rekap-table-body');
    if (!tbody || typeof santriDB === 'undefined') return;
    tbody.innerHTML = '';

    const level = cls.charAt(0);
    const students = santriDB[level][cls];
    if (!students) return;

    let totalKelas = 0;
    students.forEach((s, index) => {
        let qris = 0, transfer = 0, tunai = 0;
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
        tr.innerHTML = `<td class="px-6 py-4 font-medium text-slate-900">${index + 1}</td><td class="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">${s.nama}</td><td class="px-6 py-4 text-right font-mono text-slate-500">${qris > 0 ? formatRupiah(qris) : '-'}</td><td class="px-6 py-4 text-right font-mono text-slate-500">${transfer > 0 ? formatRupiah(transfer) : '-'}</td><td class="px-6 py-4 text-right font-mono text-slate-500">${tunai > 0 ? formatRupiah(tunai) : '-'}</td><td class="px-6 py-4 text-right font-bold text-orange-600">${formatRupiah(subtotal)}</td>`;
        tbody.appendChild(tr);
    });

    if (typeof classMetaData !== 'undefined' && classMetaData[cls]) {
        document.getElementById('rekap-wali').innerText = classMetaData[cls].wali;
        document.getElementById('rekap-musyrif').innerText = classMetaData[cls].musyrif;
    }
    document.getElementById('rekap-total-kelas').innerText = formatRupiah(totalKelas);
}

function exportRekapPDF() {
    if (!window.jspdf) { showToast("PDF Lib Error", "error"); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const cls = document.getElementById('rekap-kelas-select').value;
    const date = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
    
    doc.setFontSize(18); doc.setTextColor(241, 90, 34); doc.text("REKAPITULASI PEROLEHAN ZIS", 14, 20);
    doc.setFontSize(12); doc.setTextColor(100); doc.text(`Kelas: ${cls}`, 14, 30); doc.text(`Tanggal: ${date}`, 14, 36);
    
    doc.autoTable({ html: '#rekap-table-container table', startY: 45, theme: 'grid', headStyles: { fillColor: [241, 90, 34] }, styles: { fontSize: 8 } });
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 50;
    doc.setFontSize(12); doc.setTextColor(0); doc.text(`Total: ${document.getElementById('rekap-total-kelas').innerText}`, 14, finalY + 10);
    doc.save(`Rekap_ZIS_${cls}_${date}.pdf`);
}

// --- 9. DONASI WIZARD LOGIC ---
function setupWizardLogic() {
    document.querySelectorAll('.choice-button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.choice-button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            donasiData.type = btn.dataset.type;
            donasiData.subType = null;
            
            ['infaq-options', 'zakat-fitrah-checker', 'zakat-maal-checker', 'step-1-nav-default'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.classList.add('hidden');
            });
            
            if (donasiData.type === 'Infaq') document.getElementById('infaq-options').classList.remove('hidden');
            else if (donasiData.type === 'Zakat Fitrah') document.getElementById('zakat-fitrah-checker').classList.remove('hidden');
            else if (donasiData.type === 'Zakat Maal') document.getElementById('zakat-maal-checker').classList.remove('hidden');
        };
    });

    document.querySelectorAll('.sub-choice-button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.sub-choice-button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            donasiData.subType = btn.dataset.typeInfaq;
            document.getElementById('step-1-nav-default').classList.remove('hidden');
        };
    });

    const fitrahInput = document.getElementById('fitrah-jumlah-orang');
    if (fitrahInput) fitrahInput.oninput = (e) => {
        const total = (parseInt(e.target.value) || 0) * 37500;
        document.getElementById('fitrah-total').value = formatRupiah(total);
        donasiData.nominal = total;
    };

    const btnFitrahNext = document.getElementById('btn-fitrah-next');
    if (btnFitrahNext) btnFitrahNext.onclick = () => {
        if (donasiData.nominal < 37500) return showToast("Minimal 1 jiwa");
        goToStep(3);
    };

    const btnZakatCheck = document.getElementById('zakat-check-button');
    if (btnZakatCheck) btnZakatCheck.onclick = () => {
        const emas = parseInt(document.getElementById('harga-emas').value.replace(/\D/g, '')) || 0;
        const hasil = parseInt(document.getElementById('penghasilan-bulanan').value.replace(/\D/g, '')) || 0;
        const nisab = (emas * 85) / 12;
        
        document.getElementById('zakat-result').classList.remove('hidden');
        const msg = document.getElementById('zakat-result-message');
        const btnMaal = document.getElementById('btn-maal-next');
        const btnSkip = document.getElementById('zakat-lanjutkan-infaq');

        if (hasil >= nisab) {
            const zakat = hasil * 0.025;
            msg.innerHTML = `<span class="text-green-600 block">WAJIB ZAKAT</span>Kewajiban: ${formatRupiah(zakat)}`;
            donasiData.nominal = zakat;
            btnMaal.classList.remove('hidden');
            btnSkip.classList.add('hidden');
        } else {
            msg.innerHTML = `<span class="text-orange-600 block">BELUM WAJIB</span>Belum mencapai nishab (${formatRupiah(nisab)})`;
            btnMaal.classList.add('hidden');
            btnSkip.classList.remove('hidden');
        }
    };

    const btnMaalNext = document.getElementById('btn-maal-next');
    if (btnMaalNext) btnMaalNext.onclick = () => goToStep(3);

    const btnZakatSkip = document.getElementById('zakat-lanjutkan-infaq');
    if (btnZakatSkip) btnZakatSkip.onclick = () => { document.querySelector('[data-type="Infaq"]').click(); };

    const btnNextStep2 = document.querySelector('[data-next-step="2"]');
    if (btnNextStep2) btnNextStep2.onclick = () => {
        if (donasiData.type === 'Infaq' && !donasiData.subType) return showToast("Pilih peruntukan infaq");
        goToStep(2);
    };

    document.querySelectorAll('.nominal-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            donasiData.nominal = parseInt(btn.dataset.nominal);
            document.getElementById('nominal-custom').value = formatRupiah(donasiData.nominal);
        };
    });

    const nominalCustom = document.getElementById('nominal-custom');
    if (nominalCustom) nominalCustom.addEventListener('input', function() {
        let val = this.value.replace(/\D/g, '');
        donasiData.nominal = parseInt(val) || 0;
        this.value = formatRupiah(donasiData.nominal);
        document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
    });

    const btnNextStep3 = document.querySelector('[data-next-step="3"]');
    if (btnNextStep3) btnNextStep3.onclick = () => {
        if (donasiData.nominal < 1000) showToast("Nominal minimal Rp 1.000");
        else goToStep(3);
    };

    const santriLevel = document.getElementById('santri-level-select');
    const santriRombel = document.getElementById('santri-rombel-select');
    const santriNama = document.getElementById('santri-nama-select');

    if (santriLevel) santriLevel.onchange = () => {
        santriRombel.innerHTML = '<option value="">Rombel</option>'; santriRombel.disabled = true;
        santriNama.innerHTML = '<option value="">Pilih Nama Santri</option>'; santriNama.disabled = true;
        
        const lvl = santriLevel.value;
        if (lvl && typeof santriDB !== 'undefined' && santriDB[lvl]) {
            Object.keys(santriDB[lvl]).forEach(r => { santriRombel.innerHTML += `<option value="${r}">${r}</option>`; });
            santriRombel.disabled = false;
        }
    };

    if (santriRombel) santriRombel.onchange = () => {
        santriNama.innerHTML = '<option value="">Pilih Nama Santri</option>'; santriNama.disabled = true;
        const lvl = santriLevel.value; const rmb = santriRombel.value;
        if (lvl && rmb && santriDB[lvl][rmb]) {
            santriDB[lvl][rmb].forEach(s => { santriNama.innerHTML += `<option value="${s.nama}::${s.nis}::${s.rombel}">${s.nama}</option>`; });
            santriNama.disabled = false;
        }
    };

    if (santriNama) santriNama.onchange = () => {
        if (santriNama.value) {
            const [nama, nis, rombel] = santriNama.value.split('::');
            donasiData.namaSantri = nama; donasiData.nisSantri = nis; donasiData.rombelSantri = rombel;
            const radioAnSantri = document.getElementById('radio-an-santri');
            if (radioAnSantri) {
                radioAnSantri.disabled = false;
                if (radioAnSantri.checked) document.getElementById('nama-muzakki-input').value = `A/n Santri: ${nama}`;
            }
        }
    };

    document.querySelectorAll('input[name="donatur-tipe"]').forEach(r => {
        r.onchange = (e) => {
            donasiData.donaturTipe = e.target.value;
            const details = document.getElementById('santri-details');
            const alumni = document.getElementById('div-check-alumni');
            if (e.target.value === 'santri') {
                details.classList.remove('hidden'); alumni.classList.remove('hidden');
            } else {
                details.classList.add('hidden'); alumni.classList.remove('hidden');
            }
        };
    });

    const checkAlumni = document.getElementById('check-also-alumni');
    if (checkAlumni) checkAlumni.onchange = (e) => {
        const inp = document.getElementById('input-alumni-tahun');
        if (e.target.checked) inp.classList.remove('hidden'); else inp.classList.add('hidden');
    };

    document.querySelectorAll('input[name="nama-choice"]').forEach(r => {
        r.onchange = (e) => {
            const input = document.getElementById('nama-muzakki-input');
            if (e.target.value === 'hamba') { input.value = "Hamba Allah"; input.readOnly = true; }
            else if (e.target.value === 'santri') {
                if (donasiData.namaSantri) { input.value = `A/n Santri: ${donasiData.namaSantri}`; input.readOnly = true; }
                else { showToast("Pilih santri dulu"); document.querySelector('input[value="manual"]').checked = true; }
            } else { input.value = ""; input.readOnly = false; input.focus(); }
        };
    });

    const btnNextStep4 = document.querySelector('[data-next-step="4"]');
    if (btnNextStep4) btnNextStep4.onclick = () => {
        const name = document.getElementById('nama-muzakki-input').value;
        const hp = document.getElementById('no-hp').value;
        const alamat = document.getElementById('alamat').value;
        
        if (donasiData.donaturTipe === 'santri' && !donasiData.namaSantri) return showToast("Pilih data santri");
        if (!name) return showToast("Isi nama donatur");
        if (!hp) return showToast("Isi nomor WhatsApp");
        if (!alamat) return showToast("Isi alamat");

        donasiData.nama = name; donasiData.hp = hp; donasiData.alamat = alamat;
        donasiData.email = document.getElementById('email').value;
        donasiData.doa = document.getElementById('pesan-doa').value;
        donasiData.nik = document.getElementById('no-ktp').value;
        
        const isAlumni = document.getElementById('check-also-alumni').checked;
        donasiData.isAlumni = isAlumni;
        donasiData.alumniTahun = isAlumni ? document.getElementById('alumni-tahun').value : '';

        goToStep(4);
    };

    const btnNextStep5 = document.querySelector('[data-next-step="5"]');
    if (btnNextStep5) btnNextStep5.onclick = () => {
        const method = document.querySelector('input[name="payment-method"]:checked');
        if (!method) return showToast("Pilih metode pembayaran");
        donasiData.metode = method.value;

        document.getElementById('summary-type').innerText = donasiData.subType || donasiData.type;
        document.getElementById('summary-nominal').innerText = formatRupiah(donasiData.nominal);
        document.getElementById('summary-nama').innerText = donasiData.nama;
        document.getElementById('summary-hp').innerText = donasiData.hp;
        document.getElementById('summary-metode').innerText = donasiData.metode;
        
        const row = document.getElementById('summary-santri-row');
        if (donasiData.namaSantri && donasiData.donaturTipe === 'santri') {
            row.classList.remove('hidden');
            document.getElementById('summary-santri').innerText = `${donasiData.namaSantri} (${donasiData.rombelSantri})`;
        } else {
            row.classList.add('hidden');
        }
        goToStep(5);
    };

    const btnFinal = document.getElementById('btn-submit-final');
    if (btnFinal) btnFinal.onclick = async () => {
        if (!document.getElementById('confirm-check').checked) return showToast("Centang konfirmasi");
        
        btnFinal.disabled = true;
        btnFinal.querySelector('.default-text').classList.add('hidden');
        btnFinal.querySelector('.loading-text').classList.remove('hidden');

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
            "alumniTahun": donasiData.alumniTahun,
            "DetailAlumni": donasiData.alumniTahun,
            "namaSantri": donasiData.namaSantri,
            "nisSantri": donasiData.nisSantri,
            "rombelSantri": donasiData.rombelSantri,
            "NoKTP": donasiData.nik
        };

        try {
            await fetch(GAS_API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: "create", payload: payload })
            });

            document.getElementById('success-modal').classList.remove('hidden');
            
            const waMsg = `Assalamu'alaikum, saya konfirmasi donasi:\n\nJenis: ${payload.type}\nNominal: ${formatRupiah(payload.nominal)}\nNama: ${payload.nama}\nMetode: ${payload.metode}`;
            document.getElementById('btn-wa-confirm').href = `https://wa.me/6281196961918?text=${encodeURIComponent(waMsg)}`;

            let payHtml = '';
            if (donasiData.metode === 'QRIS') {
                payHtml = `<div class="text-center bg-slate-50 p-4 rounded-xl"><p class="font-bold mb-2">Scan QRIS:</p><img src="logo-qris.png" class="h-10 mx-auto mb-2"><p class="text-xs">Gunakan tombol di halaman depan untuk download QRIS.</p></div>`;
            } else if (donasiData.metode === 'Transfer') {
                payHtml = `<div class="bg-slate-50 p-4 rounded-xl text-sm space-y-2"><p><strong>BNI:</strong> 3440000348</p><p><strong>BSI:</strong> 7930030303</p><p><strong>BPD DIY:</strong> 801241004624</p></div>`;
            } else {
                payHtml = `<p class="text-center text-blue-600">Silakan menuju Kantor Layanan.</p>`;
            }

            document.getElementById('instruction-content').innerHTML = `<div class="text-center mb-4"><p class="font-arabic text-xl text-green-700 mb-2 font-bold">آجَرَكَ اللَّهُ فِيمَا أَعْطَيْتَ</p><p class="italic text-sm">"Semoga Allah memberikan pahala atas apa yang engkau berikan."</p></div>` + payHtml;
            
            document.getElementById('donasi-wizard').classList.add('hidden');
            document.getElementById('donasi-payment-instructions').classList.remove('hidden');

        } catch (e) {
            showToast("Gagal kirim data", "error");
            btnFinal.disabled = false;
            btnFinal.querySelector('.default-text').classList.remove('hidden');
            btnFinal.querySelector('.loading-text').classList.add('hidden');
        }
    };

    const successContinue = document.getElementById('success-modal-continue');
    if (successContinue) successContinue.onclick = () => {
        document.getElementById('success-modal').classList.add('hidden');
        document.getElementById('donasi-payment-instructions').scrollIntoView({ behavior: 'smooth' });
    };

    document.querySelectorAll('[data-prev-step]').forEach(btn => {
        btn.onclick = () => goToStep(parseInt(btn.dataset.prevStep));
    });
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
    const titles = ["Pilih Jenis", "Nominal", "Data Diri", "Metode Bayar", "Konfirmasi"];
    const subs = ["Niat Suci", "Rezeki Berkah", "Silaturahmi", "Mudah Aman", "Jemput Ridho"];
    
    document.getElementById('wizard-step-indicator').innerText = `Step ${step}/5`;
    document.getElementById('wizard-progress-bar').style.width = `${step * 20}%`;
    document.getElementById('wizard-title').innerText = titles[step-1];
    document.getElementById('wizard-subtitle').innerText = subs[step-1];
    document.getElementById('donasi-wizard').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// --- UTILS ---
function formatRupiah(num) { return "Rp " + parseInt(num).toLocaleString('id-ID'); }
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
function copyText(text) {
    navigator.clipboard.writeText(text).then(() => showToast("Disalin: " + text, "success")).catch(() => showToast("Gagal salin", "error"));
}
function showToast(msg, type = 'warning') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'} border px-4 py-3 rounded-xl shadow-lg mb-2 flex items-center gap-2 animate-fade-in-up`;
    t.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check' : 'fa-exclamation-circle'}"></i><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}
function animateValue(id, end, isCurr = false) {
    const obj = document.getElementById(id);
    if (!obj) return;
    const start = 0; const duration = 1000; let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const val = Math.floor(progress * (end - start) + start);
        obj.innerHTML = isCurr ? formatRupiah(val) : val;
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}
function setText(id, txt) { const el = document.getElementById(id); if (el) el.innerText = txt; }
