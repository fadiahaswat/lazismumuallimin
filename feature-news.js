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
        const loadingTemplate = document.getElementById('news-loading-template');
        if(grid && loadingTemplate) {
            grid.innerHTML = '';
            grid.appendChild(loadingTemplate.content.cloneNode(true));
        }
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
            const emptyTemplate = document.getElementById('news-empty-template');
            if(grid && emptyTemplate) {
                const emptyElement = emptyTemplate.content.cloneNode(true);
                emptyElement.querySelector('[data-message]').textContent = pesanKosong;
                grid.innerHTML = '';
                grid.appendChild(emptyElement);
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
        const errorTemplate = document.getElementById('news-error-template');
        if(grid && errorTemplate) {
            grid.innerHTML = '';
            grid.appendChild(errorTemplate.content.cloneNode(true));
        }
    }
}

export function renderNewsGrid(postsToRender, appendMode) {
    const container = document.getElementById('news-grid');
    const template = document.getElementById('news-card-template');
    if(!container || !template) return;

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

    if (!appendMode) container.innerHTML = '';

    let startIndex = appendMode ? (newsState.posts.length - postsToRender.length) : 0;

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

        const card = template.content.cloneNode(true);
        const cardElement = card.querySelector('.group');
        
        cardElement.setAttribute('onclick', `window.openNewsModal(${globalIndex})`);
        card.querySelector('[data-src]').src = img;
        card.querySelector('[data-alt]').alt = post.title;
        card.querySelector('[data-day]').textContent = day;
        card.querySelector('[data-month]').textContent = month;
        card.querySelector('[data-badge-class]').className += ' ' + badgeClass;
        card.querySelector('[data-category]').textContent = categoryName;
        card.querySelector('[data-title]').textContent = post.title;
        card.querySelector('[data-excerpt]').textContent = stripHtml(post.excerpt);

        container.appendChild(card);
    });
}

}

export function filterNews(cat) {
    newsState.category = cat;
    newsState.search = '';
    const searchInput = document.getElementById('news-search-input');
    if(searchInput) searchInput.value = '';
    
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
