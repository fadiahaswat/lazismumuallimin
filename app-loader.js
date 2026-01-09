// app-loader.js

async function loadComponent(targetId, url, append = false) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        const html = await response.text();
        const target = document.getElementById(targetId);
        if (target) {
            if (append) target.insertAdjacentHTML('beforeend', html);
            else target.innerHTML = html;
        }
    } catch (error) {
        console.error("Component Loader Error:", error);
    }
}

async function initApp() {
    console.log("🚀 Starting Hybrid App Initialization...");

    // 1. Load Komponen Layout (Header, Footer, Modals)
    // Dilakukan paralel agar cepat
    await Promise.all([
        loadComponent('app-header', 'components/header.html'),
        loadComponent('app-modals', 'components/modals.html'),
        loadComponent('app-footer', 'components/footer.html'),
    ]);

    // 2. Load Halaman SISA (Kecuali Home yang sudah ada di index.html)
    // Halaman ini akan di-append di bawah #page-home di dalam <main>
    const extraPages = [
        'pages/tentang.html',
        'pages/beautifikasi.html',
        'pages/news.html',
        'pages/history.html',
        'pages/rekap.html',
        'pages/donation.html',
        'pages/dashboard.html'
    ];

    const contentContainer = document.getElementById('app-content');
    
    // Fetch semua halaman sisa secara background
    const rawPages = await Promise.all(extraPages.map(file => fetch(file).then(res => res.text())));
    
    // Masukkan ke DOM
    rawPages.forEach(html => {
        contentContainer.insertAdjacentHTML('beforeend', html);
    });

    console.log("✅ All Pages Loaded");

    // 3. Load Main Script Logic
    const scriptMain = document.createElement('script');
    scriptMain.type = 'module';
    scriptMain.src = 'main.js'; // Logic show/hide halaman ada di sini
    document.body.appendChild(scriptMain);

    // Load Data Helpers
    const scriptSantri = document.createElement('script');
    scriptSantri.src = 'data-santri.js';
    document.body.appendChild(scriptSantri);

    const scriptKelas = document.createElement('script');
    scriptKelas.src = 'data-kelas.js';
    document.body.appendChild(scriptKelas);
    
    // 4. Matikan Preloader
    setTimeout(() => {
        const preloader = document.getElementById('app-preloader');
        if(preloader) preloader.classList.add('fade-out');
    }, 800);
}

document.addEventListener('DOMContentLoaded', initApp);
