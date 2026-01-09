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
        console.error("Loader Error:", error);
    }
}

async function initApp() {
    console.log("🚀 Initializing App Shell...");

    // 1. Load Modals (Popup Login, Berita, dll)
    // Kita load ini secara async agar halaman utama muncul duluan
    await loadComponent('app-modals', 'components/modals.html');

    // 2. Load Halaman SISA (Kecuali Home yang sudah statis)
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
    
    // Fetch halaman sisa secara paralel
    const rawPages = await Promise.all(extraPages.map(file => fetch(file).then(res => res.text())));
    
    // Inject ke bawah konten Home
    rawPages.forEach(html => {
        contentContainer.insertAdjacentHTML('beforeend', html);
    });

    console.log("✅ Dynamic Content Loaded");

    // 3. Load Main Script Logic (Setelah HTML lengkap tertanam)
    const scriptMain = document.createElement('script');
    scriptMain.type = 'module';
    scriptMain.src = 'main.js';
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
    }, 500);
}

document.addEventListener('DOMContentLoaded', initApp);
