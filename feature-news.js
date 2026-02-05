import { newsState } from './state.js';
import { WORDPRESS_SITE, NEWS_PER_PAGE } from './config.js';
import { copyText, stripHtml, showToast } from './utils.js';
import { showPage } from './ui-navigation.js';

export async function fetchNews(isLoadMore = false) {
    if (newsState.isLoading) return;
    newsState.isLoading = true;

    if (isLoadMore) {
        const btnMore = document.getElementById('btn-news-load-more');
        if (btnMore) btnMore.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';
    } else {
        const grid = document.getElementById('news-grid');
        if(grid) grid.innerHTML = '<div class="col-span-full text-center py-20"><div class="animate-spin inline-block w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full mb-4"></div><p class="text-slate-600">Memuat berita terbaru...</p></div>';
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
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
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
                        <i class="far fa-folder-open text-5xl text-slate-500"></i>
                    </div>
                    <h3 class="text-xl font-bold text-slate-700 mb-2">Ups, Belum Ada Kabar</h3>
                    <p class="text-slate-600 max-w-xs mx-auto mb-8">${pesanKosong}</p>
                    <button onclick="window.resetNewsFilter()" class="bg-white border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 px-6 py-3 rounded-xl font-bold transition-all shadow-sm hover:shadow-md">
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

export function renderNewsGrid(postsToRender, appendMode) {
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
        <div class="group flex flex-col h-full bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 overflow-hidden transform hover:-translate-y-2 cursor-pointer fade-in" onclick="window.openNewsModal(${globalIndex})">
            <div class="relative h-60 overflow-hidden">
                <div class="absolute inset-0 bg-slate-200 animate-pulse"></div>
                <img src="${img}" alt="${post.title}" class="w-full h-full object-cover transition duration-700 group-hover:scale-110 group-hover:rotate-1 relative z-10" onerror="this.src='https://via.placeholder.com/600x400?text=Lazismu+Update'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-50 group-hover:opacity-40 transition-opacity z-20"></div>
                <div class="absolute top-4 right-4 z-30 bg-white/90 backdrop-blur-md rounded-2xl px-3 py-2 text-center shadow-lg border border-white/20">
                    <span class="block text-xl font-black text-slate-800 leading-none">${day}</span>
                    <span class="block text-sm font-bold text-slate-500 uppercase">${month}</span>
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
                    <div class="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <i class="far fa-user-circle text-slate-500"></i> Admin Lazismu
                    </div>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-sm">
                        <i class="fas fa-arrow-right transform group-hover:-rotate-45 transition-transform"></i>
                    </span>
                </div>
            </div>
        </div>`;
    });

    if (appendMode) container.innerHTML += html;
    else container.innerHTML = html;
}

export function filterNews(cat) {
    newsState.category = cat;
    newsState.search = '';
    const searchInput = document.getElementById('news-search-input');
    if(searchInput) searchInput.value = '';
    
    newsState.page = 1;
    newsState.hasMore = true;

    // Update button styles with new color scheme
    document.querySelectorAll('.news-filter-btn').forEach(btn => {
        const btnSlug = btn.getAttribute('data-slug');
        if (btnSlug === cat) {
            // Remove all possible inactive states
            btn.classList.remove('bg-blue-100', 'text-blue-700', 'bg-emerald-100', 'text-emerald-700', 
                               'bg-purple-100', 'text-purple-700', 'bg-orange-100', 'text-orange-700',
                               'bg-pink-100', 'text-pink-700', 'bg-cyan-100', 'text-cyan-700',
                               'bg-gray-100', 'text-gray-600');
            
            // Add active state based on button's category
            if (btnSlug === '') {
                btn.classList.add('bg-slate-900', 'text-white', 'shadow-lg', 'shadow-slate-900/20', 'scale-105');
            } else {
                // Add active color based on button's hover color
                if (btn.classList.contains('hover:bg-blue-600')) {
                    btn.classList.add('bg-blue-600', 'text-white', 'shadow-lg', 'shadow-blue-600/30', 'scale-105');
                } else if (btn.classList.contains('hover:bg-emerald-600')) {
                    btn.classList.add('bg-emerald-600', 'text-white', 'shadow-lg', 'shadow-emerald-600/30', 'scale-105');
                } else if (btn.classList.contains('hover:bg-purple-600')) {
                    btn.classList.add('bg-purple-600', 'text-white', 'shadow-lg', 'shadow-purple-600/30', 'scale-105');
                } else if (btn.classList.contains('hover:bg-orange-600')) {
                    btn.classList.add('bg-orange-600', 'text-white', 'shadow-lg', 'shadow-orange-600/30', 'scale-105');
                } else if (btn.classList.contains('hover:bg-pink-600')) {
                    btn.classList.add('bg-pink-600', 'text-white', 'shadow-lg', 'shadow-pink-600/30', 'scale-105');
                } else if (btn.classList.contains('hover:bg-cyan-600')) {
                    btn.classList.add('bg-cyan-600', 'text-white', 'shadow-lg', 'shadow-cyan-600/30', 'scale-105');
                }
            }
        } else {
            // Inactive state - restore original colors
            btn.classList.remove('bg-slate-900', 'text-white', 'bg-blue-600', 'bg-emerald-600', 
                               'bg-purple-600', 'bg-orange-600', 'bg-pink-600', 'bg-cyan-600',
                               'shadow-lg', 'scale-105');
            
            // Restore light background based on hover state
            if (btn.classList.contains('hover:bg-blue-600')) {
                btn.classList.add('bg-blue-100', 'text-blue-700');
            } else if (btn.classList.contains('hover:bg-emerald-600')) {
                btn.classList.add('bg-emerald-100', 'text-emerald-700');
            } else if (btn.classList.contains('hover:bg-purple-600')) {
                btn.classList.add('bg-purple-100', 'text-purple-700');
            } else if (btn.classList.contains('hover:bg-orange-600')) {
                btn.classList.add('bg-orange-100', 'text-orange-700');
            } else if (btn.classList.contains('hover:bg-pink-600')) {
                btn.classList.add('bg-pink-100', 'text-pink-700');
            } else if (btn.classList.contains('hover:bg-cyan-600')) {
                btn.classList.add('bg-cyan-100', 'text-cyan-700');
            } else if (btnSlug === '') {
                btn.classList.add('bg-gray-100', 'text-gray-600');
            }
        }
    });

    fetchNews();
}

export function loadMoreNews() {
    newsState.page++;
    fetchNews(true);
}

export function openNewsModal(index) {
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
                    <img src="${avatar}" class="w-8 h-8 rounded-full border border-white/50 shadow-sm" alt="${author}" onerror="this.src='https://ui-avatars.com/api/?name=Admin'">
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
                    <button onclick="window.copyText('${post.URL}')" class="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-600 hover:text-white transition"><i class="fas fa-link"></i></button>
                </div>
            </div>

            <div class="wp-content text-base md:text-lg text-slate-700 font-sans leading-loose text-justify">
                ${post.content}
            </div>

            <div class="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <h4 class="font-bold text-slate-800 mb-3">Mari wujudkan lebih banyak kebaikan</h4>
                <button onclick="window.closeNewsModal(); window.showPage('donasi');" class="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition shadow-lg flex items-center justify-center gap-2 mx-auto">
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

export function closeNewsModal() {
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

export async function refreshNews() {
    const btnRefresh = document.getElementById('btn-refresh-news');
    const icon = btnRefresh ? btnRefresh.querySelector('i') : null;

    // 1. Efek Loading (Putar Icon)
    if (icon) icon.classList.add('fa-spin');
    
    // 2. Reset state
    newsState.page = 1;
    newsState.hasMore = true;
    newsState.posts = [];
    
    try {
        // 3. Fetch fresh data
        await fetchNews();
        
        showToast('Berita berhasil diperbarui', 'success');
    } catch (error) {
        console.error(error);
        showToast('Gagal memperbarui berita', 'error');
    } finally {
        // 4. Hentikan Efek Loading
        if (icon) icon.classList.remove('fa-spin');
    }
}

// Fetch and render news categories for filter buttons
export async function fetchNewsCategories() {
    try {
        const apiURL = `https://public-api.wordpress.com/rest/v1.1/sites/${WORDPRESS_SITE}/categories`;
        const res = await fetch(apiURL);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        renderNewsCategories(data.categories);
    } catch (error) {
        console.error('Failed to fetch news categories:', error);
        // Keep the "Semua" button even if categories fail to load
        const container = document.getElementById('news-filter-container');
        if (container) {
            // Remove skeleton loaders
            const skeletons = container.querySelectorAll('.animate-pulse');
            skeletons.forEach(el => el.remove());
        }
    }
}

// Render category filter buttons with enhanced design
function renderNewsCategories(categories) {
    const container = document.getElementById('news-filter-container');
    if (!container) return;
    
    // Remove skeleton loaders
    const skeletons = container.querySelectorAll('.animate-pulse');
    skeletons.forEach(el => el.remove());
    
    // Get top categories (limit to 5-6 for better UX)
    const topCategories = Object.values(categories)
        .filter(cat => cat.post_count > 0) // Only show categories with posts
        .sort((a, b) => b.post_count - a.post_count)
        .slice(0, 6);
    
    // Color schemes for category buttons
    const colorSchemes = [
        { bg: 'bg-blue-100', text: 'text-blue-700', hover: 'hover:bg-blue-600', active: 'bg-blue-600' },
        { bg: 'bg-emerald-100', text: 'text-emerald-700', hover: 'hover:bg-emerald-600', active: 'bg-emerald-600' },
        { bg: 'bg-purple-100', text: 'text-purple-700', hover: 'hover:bg-purple-600', active: 'bg-purple-600' },
        { bg: 'bg-orange-100', text: 'text-orange-700', hover: 'hover:bg-orange-600', active: 'bg-orange-600' },
        { bg: 'bg-pink-100', text: 'text-pink-700', hover: 'hover:bg-pink-600', active: 'bg-pink-600' },
        { bg: 'bg-cyan-100', text: 'text-cyan-700', hover: 'hover:bg-cyan-600', active: 'bg-cyan-600' }
    ];
    
    // Add category buttons after "Semua" button
    topCategories.forEach((cat, index) => {
        const scheme = colorSchemes[index % colorSchemes.length];
        const button = document.createElement('button');
        button.setAttribute('data-slug', cat.slug);
        button.onclick = () => filterNews(cat.slug);
        button.className = `news-filter-btn ${scheme.bg} ${scheme.text} ${scheme.hover} hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 flex items-center gap-2`;
        button.innerHTML = `
            <i class="fas fa-tag text-xs"></i>
            <span>${cat.name}</span>
            <span class="ml-1 px-2 py-0.5 bg-white/30 rounded-full text-xs font-black">${cat.post_count}</span>
        `;
        container.appendChild(button);
    });
}

// Handle search with Enter key
window.handleNewsSearch = function(event) {
    if (event.key === 'Enter') {
        const searchValue = event.target.value.trim();
        newsState.search = searchValue;
        newsState.category = '';
        newsState.page = 1;
        newsState.hasMore = true;
        
        // Reset filter buttons
        document.querySelectorAll('.news-filter-btn').forEach(btn => {
            const btnSlug = btn.getAttribute('data-slug');
            if (btnSlug === '') {
                btn.classList.add('bg-slate-900', 'text-white');
                btn.classList.remove('bg-blue-100', 'text-blue-700', 'bg-emerald-100', 'text-emerald-700');
            } else {
                const colorClasses = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-orange-600', 'bg-pink-600', 'bg-cyan-600', 'text-white'];
                btn.classList.remove(...colorClasses);
            }
        });
        
        fetchNews();
    }
};
