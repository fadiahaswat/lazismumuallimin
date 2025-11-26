/**
 * SCRIPT UTAMA LAZISMU MU'ALLIMIN (FIXED & ROBUST)
 * Perbaikan:
 * 1. Menangani error jika data santri belum dimuat.
 * 2. Memaksa penghapusan class 'hidden' Tailwind agar halaman muncul.
 * 3. Menggunakan Try-Catch agar satu error tidak mematikan seluruh web.
 */

// --- 1. PERSIAPAN DATA (PENTING: Mencegah Crash) ---
// Kita definisikan variabel ini di awal agar tidak error "ReferenceError"
var rawSantriData = (typeof rawSantriData !== 'undefined') ? rawSantriData : "";
var santriDB = {};

// Konfigurasi
const CONFIG = {
    API_GAS: "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec",
    WP_SITE: 'lazismumuallimin.wordpress.com',
    NEWS_LIMIT: 6,
    WA_ADMIN: "6281196961918"
};

// State Aplikasi
let appState = {
    donasi: {
        type: null, subType: null, nominal: 0, donaturTipe: 'santri',
        isAlumni: false, alumniTahun: '', namaSantri: '', nisSantri: '', rombelSantri: '',
        nama: '', hp: '', email: '', alamat: '', doa: '', nik: '', metode: null
    },
    news: {
        page: 1, category: '', search: '', posts: [], isLoading: false, hasMore: true, isLoaded: false
    },
    history: {
        allData: [], isLoaded: false, currentPage: 1, itemsPerPage: 10, timeFilter: 'all'
    }
};

// --- 2. INISIALISASI SAAT LOADING SELESAI ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("System Init...");
    try {
        initApp();
    } catch (e) {
        console.error("Critical Init Error:", e);
        // Fallback darurat: Paksa halaman home muncul jika script error
        document.getElementById('page-home').classList.remove('hidden');
        document.getElementById('page-home').style.display = 'block';
    }
});

function initApp() {
    parseSantriData();
    setupNavigation();
    setupWizard();
    setupHistory();
    setupModal();
    setupRekap();
    
    // Deteksi halaman awal
    const hash = window.location.hash.replace('#', '') || 'home';
    showPage(hash);
    
    // Load data background
    fetchNewsCategories();
}

// --- 3. NAVIGASI & TAMPILAN (BAGIAN KRUSIAL) ---
function showPage(pageId) {
    // Normalisasi ID (jaga-jaga jika user kirim 'page-home' atau cuma 'home')
    const cleanId = pageId.replace('page-', ''); 
    const targetId = `page-${cleanId}`;
    const targetElement = document.getElementById(targetId);

    if (!targetElement) {
        console.warn(`Halaman ${targetId} tidak ditemukan, kembali ke home.`);
        showPage('home');
        return;
    }

    // 1. Sembunyikan SEMUA halaman
    document.querySelectorAll('.page-section').forEach(el => {
        el.classList.add('hidden'); // Tambah class hidden (Tailwind)
        el.style.display = 'none';  // Paksa style none (CSS Inline)
        el.classList.remove('active');
    });

    // 2. Nonaktifkan SEMUA menu
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    // 3. Tampilkan halaman TARGET
    targetElement.classList.remove('hidden'); // Hapus class hidden
    targetElement.style.display = 'block';    // Paksa style block
    
    // Trik animasi CSS (Reflow)
    void targetElement.offsetWidth; 
    targetElement.classList.add('active');

    // 4. Scroll ke atas
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 5. Aktifkan Menu Navigasi
    const navLink = document.querySelector(`a[href="#${cleanId}"]`);
    if (navLink) navLink.classList.add('active');

    // 6. Lazy Load Data (Muat data hanya jika halaman dibuka)
    if (cleanId === 'riwayat' || cleanId === 'home') loadRiwayat();
    if (cleanId === 'berita' && !appState.news.isLoaded) fetchNews();
}

function scrollToSection(sectionId) {
    showPage('home');
    setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
}

function setupNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const menuLinks = document.getElementById('menu-links');
    
    if (menuToggle && menuLinks) {
        menuToggle.onclick = () => menuLinks.classList.toggle('hidden');
    }

    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if(!header) return;
        if (window.scrollY > 50) {
            header.classList.add('shadow-md', 'bg-white/95');
            header.classList.remove('bg-white/80');
        } else {
            header.classList.remove('shadow-md', 'bg-white/95');
            header.classList.add('bg-white/80');
        }
    });
}

function setupModal() {
    // Tombol "Hubungi Kami" di Hero
    const btnHubungi = document.getElementById('btn-hubungi-hero');
    if(btnHubungi) btnHubungi.onclick = () => document.getElementById('hubungi-modal').classList.remove('hidden');
    
    // Tombol Close Hubungi
    const closeHubungi = document.getElementById('hubungi-modal-close');
    if(closeHubungi) closeHubungi.onclick = () => document.getElementById('hubungi-modal').classList.add('hidden');
}


// --- 4. FITUR DONASI (WIZARD) ---
function setupWizard() {
    // STEP 1: Tipe
    document.querySelectorAll('.choice-button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.choice-button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            appState.donasi.type = btn.dataset.type;
            appState.donasi.subType = null;
            
            // Reset Tampilan
            ['infaq-options', 'zakat-fitrah-checker', 'zakat-maal-checker', 'step-1-nav-default'].forEach(id => {
                document.getElementById(id)?.classList.add('hidden');
            });

            if (btn.dataset.type === 'Infaq') document.getElementById('infaq-options').classList.remove('hidden');
            else if (btn.dataset.type === 'Zakat Fitrah') document.getElementById('zakat-fitrah-checker').classList.remove('hidden');
            else if (btn.dataset.type === 'Zakat Maal') document.getElementById('zakat-maal-checker').classList.remove('hidden');
            else document.getElementById('step-1-nav-default').classList.remove('hidden');
        }
    });

    // Sub-Tipe Infaq
    document.querySelectorAll('.sub-choice-button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.sub-choice-button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            appState.donasi.subType = btn.dataset.typeInfaq;
            document.getElementById('step-1-nav-default').classList.remove('hidden');
        }
    });

    // Hitung Fitrah
    const fitrahInput = document.getElementById('fitrah-jumlah-orang');
    if(fitrahInput) {
        fitrahInput.oninput = (e) => {
            const val = (parseInt(e.target.value) || 0) * 37500;
            document.getElementById('fitrah-total').value = formatRupiah(val);
            appState.donasi.nominal = val;
        }
    }
    document.getElementById('btn-fitrah-next')?.addEventListener('click', () => {
        if(appState.donasi.nominal < 37500) return showToast("Minimal 1 jiwa");
        goToStep(3);
    });

    // Hitung Maal
    document.getElementById('zakat-check-button')?.addEventListener('click', () => {
        const emas = parseInt(document.getElementById('harga-emas').value.replace(/\D/g,'')) || 0;
        const hasil = parseInt(document.getElementById('penghasilan-bulanan').value.replace(/\D/g,'')) || 0;
        const nisab = (emas * 85) / 12;
        const msg = document.getElementById('zakat-result-message');
        
        document.getElementById('zakat-result').classList.remove('hidden');
        
        if(hasil >= nisab) {
            const zakat = hasil * 0.025;
            msg.innerHTML = `<span class="text-green-600 block">WAJIB ZAKAT</span>Kewajiban: ${formatRupiah(zakat)}`;
            appState.donasi.nominal = zakat;
            document.getElementById('btn-maal-next').classList.remove('hidden');
            document.getElementById('zakat-lanjutkan-infaq').classList.add('hidden');
        } else {
            msg.innerHTML = `<span class="text-orange-600 block">BELUM WAJIB</span>Belum mencapai nishab (${formatRupiah(nisab)})`;
            document.getElementById('btn-maal-next').classList.add('hidden');
            document.getElementById('zakat-lanjutkan-infaq').classList.remove('hidden');
        }
    });
    document.getElementById('btn-maal-next')?.addEventListener('click', () => goToStep(3));
    document.getElementById('zakat-lanjutkan-infaq')?.addEventListener('click', () => {
        const btn = document.querySelector('.type-infaq'); // Cari tombol infaq via class helper
        if(btn) btn.click(); else document.querySelector('[data-type="Infaq"]').click();
    });

    // STEP 2: Nominal
    document.querySelectorAll('.nominal-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            appState.donasi.nominal = parseInt(btn.dataset.nominal);
            document.getElementById('nominal-custom').value = formatRupiah(appState.donasi.nominal);
        }
    });
    const nomCust = document.getElementById('nominal-custom');
    if(nomCust) {
        nomCust.addEventListener('input', function() {
            let v = this.value.replace(/\D/g, '');
            appState.donasi.nominal = parseInt(v) || 0;
            this.value = formatRupiah(appState.donasi.nominal);
            document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
        });
    }

    // STEP 3: Data Diri & Santri
    const sLvl = document.getElementById('santri-level-select');
    const sRmb = document.getElementById('santri-rombel-select');
    const sNam = document.getElementById('santri-nama-select');

    if(sLvl) {
        sLvl.onchange = () => {
            sRmb.innerHTML = '<option value="">Pilih Kelas</option>'; sRmb.disabled = true;
            sNam.innerHTML = '<option value="">Pilih Nama</option>'; sNam.disabled = true;
            if(sLvl.value && santriDB[sLvl.value]) {
                Object.keys(santriDB[sLvl.value]).forEach(r => {
                    sRmb.innerHTML += `<option value="${r}">${r}</option>`;
                });
                sRmb.disabled = false;
            }
        }
    }
    if(sRmb) {
        sRmb.onchange = () => {
            sNam.innerHTML = '<option value="">Pilih Nama</option>'; sNam.disabled = true;
            if(sLvl.value && sRmb.value) {
                santriDB[sLvl.value][sRmb.value].forEach(s => {
                    sNam.innerHTML += `<option value="${s.nama}::${s.nis}::${s.rombel}">${s.nama}</option>`;
                });
                sNam.disabled = false;
            }
        }
    }
    if(sNam) {
        sNam.onchange = () => {
            if(sNam.value) {
                const [nm, ns, rb] = sNam.value.split('::');
                appState.donasi.namaSantri = nm; appState.donasi.nisSantri = ns; appState.donasi.rombelSantri = rb;
                document.getElementById('radio-an-santri').disabled = false;
                // Auto select radio
                const rad = document.getElementById('radio-an-santri');
                if(rad.checked) document.getElementById('nama-muzakki-input').value = `A/n Santri: ${nm}`;
            }
        }
    }

    // Navigasi Wizard
    document.querySelectorAll('[data-next-step]').forEach(btn => {
        btn.onclick = () => {
            const step = parseInt(btn.dataset.nextStep);
            
            // Validasi Sederhana
            if(step === 2 && appState.donasi.type === 'Infaq' && !appState.donasi.subType) return showToast("Pilih jenis infaq");
            if(step === 3 && appState.donasi.nominal < 1000) return showToast("Minimal Rp 1.000");
            if(step === 4) {
                appState.donasi.nama = document.getElementById('nama-muzakki-input').value;
                appState.donasi.hp = document.getElementById('no-hp').value;
                appState.donasi.alamat = document.getElementById('alamat').value;
                appState.donasi.email = document.getElementById('email').value;
                appState.donasi.doa = document.getElementById('pesan-doa').value;
                appState.donasi.nik = document.getElementById('no-ktp').value;
                appState.donasi.alumniTahun = document.getElementById('alumni-tahun').value;
                
                if(!appState.donasi.nama || !appState.donasi.hp || !appState.donasi.alamat) return showToast("Data diri wajib diisi");
            }
            if(step === 5) {
                const met = document.querySelector('input[name="payment-method"]:checked');
                if(!met) return showToast("Pilih metode pembayaran");
                appState.donasi.metode = met.value;
                renderSummary();
            }
            
            goToStep(step);
        }
    });

    document.querySelectorAll('[data-prev-step]').forEach(btn => {
        btn.onclick = () => goToStep(parseInt(btn.dataset.prevStep));
    });

    // FINAL SUBMIT
    document.getElementById('btn-submit-final')?.addEventListener('click', submitDonasi);
}

function goToStep(step) {
    document.querySelectorAll('.donasi-step-container').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`donasi-step-${step}`);
    if(target) {
        target.classList.remove('hidden');
        target.classList.add('animate-fade-in-up');
    }
    
    // Update UI Indikator
    document.getElementById('wizard-step-indicator').innerText = `Step ${step}/5`;
    document.getElementById('wizard-progress-bar').style.width = `${step*20}%`;
    
    const titles = ["Pilih Jenis", "Nominal", "Data Diri", "Metode Bayar", "Konfirmasi"];
    document.getElementById('wizard-title').innerText = titles[step-1];
    
    document.getElementById('donasi-wizard').scrollIntoView({behavior:'smooth', block:'center'});
}

function renderSummary() {
    document.getElementById('summary-type').innerText = appState.donasi.subType || appState.donasi.type;
    document.getElementById('summary-nominal').innerText = formatRupiah(appState.donasi.nominal);
    document.getElementById('summary-nama').innerText = appState.donasi.nama;
    document.getElementById('summary-metode').innerText = appState.donasi.metode;
    
    const row = document.getElementById('summary-santri-row');
    if(appState.donasi.namaSantri) {
        row.classList.remove('hidden');
        document.getElementById('summary-santri').innerText = `${appState.donasi.namaSantri} (${appState.donasi.rombelSantri})`;
    } else {
        row.classList.add('hidden');
    }
}

async function submitDonasi() {
    const check = document.getElementById('confirm-check');
    if(!check.checked) return showToast("Centang pernyataan kebenaran data");
    
    const btn = document.getElementById('btn-submit-final');
    btn.disabled = true;
    btn.querySelector('.default-text').classList.add('hidden');
    btn.querySelector('.loading-text').classList.remove('hidden');
    
    const payload = appState.donasi;
    // Mapping field agar sesuai GAS
    payload.DetailAlumni = payload.alumniTahun;
    payload.NoKTP = payload.nik;
    
    try {
        await fetch(CONFIG.API_GAS, {
            method: "POST",
            headers: {"Content-Type": "text/plain"},
            body: JSON.stringify({action: "create", payload: payload})
        });
        
        // SUKSES
        document.getElementById('donasi-wizard').classList.add('hidden');
        document.getElementById('success-modal').classList.remove('hidden');
        document.getElementById('donasi-payment-instructions').classList.remove('hidden');
        
        const waMsg = `Assalamu'alaikum, konfirmasi donasi: ${payload.type} - ${formatRupiah(payload.nominal)} - ${payload.nama}`;
        document.getElementById('btn-wa-confirm').href = `https://wa.me/${CONFIG.WA_ADMIN}?text=${encodeURIComponent(waMsg)}`;
        
        document.getElementById('final-nominal-display').innerText = formatRupiah(payload.nominal);
        
        // Render Instruksi Pembayaran
        let instr = '';
        if(payload.metode === 'QRIS') instr = `<div class="bg-white p-4 rounded border text-center">Silakan Scan QRIS BNI/BSI/BPD di atas.</div>`;
        else if(payload.metode === 'Transfer') instr = `<div class="bg-white p-4 rounded border text-sm">BNI: 3440000348<br>BSI: 7930030303</div>`;
        else instr = `<div class="bg-white p-4 rounded border text-center">Silakan ke Kantor Layanan.</div>`;
        
        document.getElementById('instruction-content').innerHTML = instr;
        
    } catch(e) {
        console.error(e);
        showToast("Gagal mengirim data. Periksa koneksi.", "error");
        btn.disabled = false;
        btn.querySelector('.default-text').classList.remove('hidden');
        btn.querySelector('.loading-text').classList.add('hidden');
    }
}


// --- 5. DATA SANTRI PARSER ---
function parseSantriData() {
    if (!rawSantriData) return;
    const lines = rawSantriData.trim().split('\n');
    lines.forEach(line => {
        const [rmb, nis, nm] = line.split('\t');
        if(rmb && nm) {
            const lvl = rmb.trim().charAt(0);
            const r = rmb.trim();
            if(!santriDB[lvl]) santriDB[lvl] = {};
            if(!santriDB[lvl][r]) santriDB[lvl][r] = [];
            santriDB[lvl][r].push({ nama: nm.trim(), nis: nis?.trim(), rombel: r });
        }
    });
}


// --- 6. RIWAYAT & STATISTIK ---
function setupHistory() {
    document.getElementById('riwayat-prev')?.addEventListener('click', () => {
        if(appState.history.currentPage > 1) { appState.history.currentPage--; renderHistoryList(); }
    });
    document.getElementById('riwayat-next')?.addEventListener('click', () => {
        appState.history.currentPage++; renderHistoryList();
    });
    
    // Filter Event Listeners
    ['filter-jenis', 'filter-metode'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            appState.history.currentPage = 1; renderHistoryList();
        });
    });
    
    document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
        document.getElementById('filter-jenis').value = 'all';
        renderHistoryList();
    });
}

async function loadRiwayat() {
    if(appState.history.isLoaded) return;
    const loader = document.getElementById('riwayat-loading');
    if(loader) loader.classList.remove('hidden');
    
    try {
        const res = await fetch(CONFIG.API_GAS);
        const json = await res.json();
        if(json.status === 'success') {
            appState.history.allData = json.data.reverse();
            appState.history.isLoaded = true;
            calculateStats();
            renderHistoryList();
            renderHomeWidgets();
            if(loader) loader.classList.add('hidden');
            document.getElementById('riwayat-content')?.classList.remove('hidden');
        }
    } catch(e) {
        if(loader) loader.innerHTML = '<div class="text-red-500">Gagal memuat data.</div>';
    }
}

function renderHistoryList() {
    const container = document.getElementById('riwayat-list-container');
    if(!container) return;
    
    let data = appState.history.allData;
    const filterJenis = document.getElementById('filter-jenis')?.value;
    if(filterJenis && filterJenis !== 'all') data = data.filter(d => (d.JenisDonasi||d.type) === filterJenis);
    
    const start = (appState.history.currentPage - 1) * 10;
    const pageData = data.slice(start, start + 10);
    
    if(pageData.length === 0) {
        container.innerHTML = ''; 
        document.getElementById('riwayat-no-data').classList.remove('hidden');
        return;
    }
    document.getElementById('riwayat-no-data').classList.add('hidden');
    
    container.innerHTML = pageData.map(d => `
        <div class="bg-white p-4 rounded-xl border mb-3 shadow-sm flex justify-between items-center">
            <div>
                <h4 class="font-bold text-slate-800">${d.NamaDonatur || 'Hamba Allah'}</h4>
                <p class="text-xs text-slate-500">${d.JenisDonasi} • ${d.MetodePembayaran}</p>
            </div>
            <div class="text-right">
                <div class="font-black text-slate-800">${formatRupiah(d.Nominal)}</div>
                <div class="text-[10px] text-slate-400">${timeAgo(d.Timestamp)}</div>
            </div>
        </div>
    `).join('');
    
    // Update Pagination Text
    const totalPages = Math.ceil(data.length / 10);
    document.getElementById('riwayat-page-info').innerText = `Page ${appState.history.currentPage} of ${totalPages || 1}`;
}

function calculateStats() {
    const data = appState.history.allData;
    let total = 0;
    data.forEach(d => total += parseInt(d.Nominal)||0);
    
    animateValue('stat-total-donasi', 0, total);
    animateValue('stat-r-total', 0, total); // Rekap
    animateValue('stat-total-transaksi', 0, data.length);
}

function renderHomeWidgets() {
    const cont = document.getElementById('home-latest-donations');
    if(!cont) return;
    const latest = appState.history.allData.slice(0, 4);
    cont.innerHTML = latest.map(d => `
        <div class="bg-white p-4 rounded-2xl border shadow-sm">
            <div class="flex justify-between mb-2">
                <div class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><i class="fas fa-hand-holding-heart"></i></div>
                <span class="text-[10px] border px-2 py-1 rounded bg-slate-50 font-bold text-slate-500 truncate max-w-[80px]">${d.JenisDonasi}</span>
            </div>
            <h5 class="font-bold text-slate-800 text-sm truncate">${d.NamaDonatur||'Hamba Allah'}</h5>
            <p class="font-black text-slate-800">${formatRupiah(d.Nominal)}</p>
        </div>
    `).join('');
}


// --- 7. BERITA ---
async function fetchNews(isMore = false) {
    if(appState.news.isLoading) return;
    appState.news.isLoading = true;
    
    const grid = document.getElementById('news-grid');
    if(!isMore) grid.innerHTML = '<div class="col-span-full text-center py-10"><i class="fas fa-spinner fa-spin text-2xl text-blue-500"></i></div>';
    
    try {
        const res = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${CONFIG.WP_SITE}/posts/?number=6&page=${appState.news.page}`);
        const data = await res.json();
        
        appState.news.posts = isMore ? [...appState.news.posts, ...data.posts] : data.posts;
        appState.news.hasMore = data.posts.length >= 6;
        appState.news.isLoading = false;
        appState.news.isLoaded = true;
        
        renderNews(isMore);
        
        const btnMore = document.getElementById('btn-news-load-more');
        if(btnMore) {
            if(appState.news.hasMore) {
                btnMore.classList.remove('hidden');
                btnMore.onclick = () => { appState.news.page++; fetchNews(true); };
            } else btnMore.classList.add('hidden');
        }
    } catch(e) {
        grid.innerHTML = '<div class="col-span-full text-center text-red-500">Gagal memuat berita.</div>';
        appState.news.isLoading = false;
    }
}

function renderNews(append) {
    const grid = document.getElementById('news-grid');
    const posts = appState.news.posts;
    const renderData = append ? posts.slice(posts.length - 6) : posts;
    
    const html = renderData.map((p, i) => `
        <div class="bg-white rounded-2xl overflow-hidden shadow-sm border cursor-pointer hover:shadow-lg transition" onclick="openNews(${append ? posts.length-renderData.length+i : i})">
            <div class="h-48 bg-slate-200"><img src="${p.featured_image || 'https://via.placeholder.com/400'}" class="w-full h-full object-cover"></div>
            <div class="p-5">
                <div class="text-xs font-bold text-orange-500 uppercase mb-2">${Object.values(p.categories)[0]?.name || 'Berita'}</div>
                <h3 class="font-bold text-slate-800 line-clamp-2">${p.title}</h3>
            </div>
        </div>
    `).join('');
    
    if(append) grid.innerHTML += html; else grid.innerHTML = html;
}

async function fetchNewsCategories() {
    try {
        const res = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${CONFIG.WP_SITE}/categories`);
        const data = await res.json();
        const cont = document.getElementById('news-filter-container');
        if(cont && data.categories) {
            let html = `<button onclick="filterNews('')" class="news-filter-btn active bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold">Semua</button>`;
            data.categories.forEach(c => {
                if(c.post_count > 0) html += `<button onclick="filterNews('${c.slug}')" class="news-filter-btn bg-white text-slate-600 border px-4 py-2 rounded-xl text-sm font-bold ml-2">${c.name}</button>`;
            });
            cont.innerHTML = html;
        }
    } catch(e){}
}

function filterNews(cat) {
    appState.news.category = cat;
    appState.news.page = 1;
    fetchNews();
}

function openNews(idx) {
    const p = appState.news.posts[idx];
    if(!p) return;
    const m = document.getElementById('news-modal');
    document.getElementById('news-modal-content').innerHTML = `
        <img src="${p.featured_image}" class="w-full h-64 object-cover">
        <div class="p-8 max-w-3xl mx-auto">
            <h1 class="text-3xl font-black mb-4">${p.title}</h1>
            <div class="prose max-w-none text-slate-700 leading-loose">${p.content}</div>
        </div>`;
    m.classList.remove('hidden');
    setTimeout(() => document.getElementById('news-modal-panel').classList.remove('translate-y-full'), 10);
    document.body.style.overflow = 'hidden';
}

function closeNewsModal() {
    const m = document.getElementById('news-modal');
    document.getElementById('news-modal-panel').classList.add('translate-y-full');
    setTimeout(() => { m.classList.add('hidden'); document.body.style.overflow = 'auto'; }, 300);
}


// --- 8. REKAPITULASI ---
function setupRekap() {
    const lvl = document.getElementById('rekap-level-select');
    const cls = document.getElementById('rekap-kelas-select');
    if(lvl && cls) {
        lvl.onchange = () => {
            cls.innerHTML = '<option value="">Pilih Kelas</option>'; cls.disabled = true;
            if(santriDB[lvl.value]) {
                Object.keys(santriDB[lvl.value]).sort().forEach(c => cls.innerHTML += `<option value="${c}">${c}</option>`);
                cls.disabled = false;
            }
            document.getElementById('rekap-table-container').classList.add('hidden');
        };
        cls.onchange = () => {
            if(cls.value) renderRekapTable(cls.value);
        };
    }
    document.getElementById('btn-export-pdf')?.addEventListener('click', exportPDF);
}

function renderRekapTable(cls) {
    const tbody = document.getElementById('rekap-table-body');
    tbody.innerHTML = '';
    const lvl = cls.charAt(0);
    const students = santriDB[lvl][cls] || [];
    let grandTotal = 0;
    
    students.forEach((s, i) => {
        let total = 0;
        appState.history.allData.forEach(d => {
            if(d.NamaSantri?.includes(s.nama) && (d.KelasSantri === cls || d.rombelSantri === cls)) total += parseInt(d.Nominal)||0;
        });
        grandTotal += total;
        tbody.innerHTML += `<tr class="${i%2===0?'bg-white':'bg-slate-50'}"><td class="px-4 py-2 text-center">${i+1}</td><td class="px-4 py-2 font-bold">${s.nama}</td><td class="px-4 py-2 text-right font-mono text-orange-600">${total>0?formatRupiah(total):'-'}</td></tr>`;
    });
    
    document.getElementById('rekap-total-kelas').innerText = formatRupiah(grandTotal);
    document.getElementById('rekap-table-container').classList.remove('hidden');
    document.getElementById('rekap-placeholder').classList.add('hidden');
    document.getElementById('rekap-summary').classList.remove('hidden');
    document.getElementById('btn-export-pdf').disabled = false;
}

function exportPDF() {
    if(!window.jspdf) return showToast("Library PDF error");
    const cls = document.getElementById('rekap-kelas-select').value;
    const doc = new window.jspdf.jsPDF();
    doc.text(`REKAP ZIS KELAS ${cls}`, 14, 20);
    doc.autoTable({ html: '#rekap-table-container table', startY: 30 });
    doc.save(`Rekap_${cls}.pdf`);
}


// --- 9. UTILITIES ---
function formatRupiah(num) { return "Rp " + parseInt(num||0).toLocaleString('id-ID'); }
function showToast(msg, type='warning') {
    const c = document.getElementById('toast-container');
    const d = document.createElement('div');
    d.className = `toast ${type}`;
    d.innerText = msg;
    c.appendChild(d);
    setTimeout(() => d.remove(), 3000);
}
function copyText(txt) {
    navigator.clipboard.writeText(txt).then(() => showToast("Disalin!", "success"));
}
function timeAgo(date) {
    const s = Math.floor((new Date() - new Date(date))/1000);
    if(s > 86400) return Math.floor(s/86400) + " hari lalu";
    if(s > 3600) return Math.floor(s/3600) + " jam lalu";
    return "Baru saja";
}
function stripHtml(html) {
   let t = document.createElement("div"); t.innerHTML = html; return t.innerText || "";
}
function animateValue(id, start, end, duration=1500) {
    const obj = document.getElementById(id);
    if(!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = formatRupiah(Math.floor(progress * (end - start) + start));
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// --- 10. QRIS MODAL ---
function openQrisModal(key) {
    const db = {
        bni: {t:'BNI', u:'https://drive.google.com/uc?export=download&id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt', i:'https://drive.google.com/thumbnail?id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt'},
        bsi: {t:'BSI', u:'https://drive.google.com/uc?export=download&id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V', i:'https://drive.google.com/thumbnail?id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V'},
        bpd: {t:'BPD', u:'https://drive.google.com/uc?export=download&id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm', i:'https://drive.google.com/thumbnail?id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm'}
    };
    const d = db[key];
    if(d) {
        document.getElementById('qris-modal-title').innerText = d.t;
        document.getElementById('qris-modal-img').src = d.i;
        document.getElementById('qris-modal-btn').href = d.u;
        document.getElementById('qris-modal').classList.remove('hidden');
    }
}
function closeQrisModal() {
    document.getElementById('qris-modal').classList.add('hidden');
}
