/**
 * LAZISMU MU'ALLIMIN APP SCRIPT
 * Refactored for Readability & Global Access
 */

// --- 1. KONFIGURASI & STATE ---
const CONFIG = {
    API_GAS: "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec",
    WP_SITE: 'lazismumuallimin.wordpress.com',
    NEWS_LIMIT: 6,
    WA_ADMIN: "6281196961918"
};

// State Donasi
let donasiState = {
    type: null, subType: null, nominal: 0, donaturTipe: 'santri',
    isAlumni: false, alumniTahun: '',
    namaSantri: '', nisSantri: '', rombelSantri: '',
    nama: '', hp: '', email: '', alamat: '', doa: '', nik: '', metode: null
};

// State Berita
let newsState = {
    page: 1, category: '', search: '', posts: [],
    isLoading: false, hasMore: true, isLoaded: false
};

// State Riwayat
let historyState = {
    allData: [], isLoaded: false, currentPage: 1, itemsPerPage: 10, timeFilter: 'all'
};

// Database Santri (In-Memory)
let santriDB = {};

// Check Data Santri Raw
if (typeof rawSantriData === 'undefined') var rawSantriData = "";


// --- 2. INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    parseSantriData();
    setupNavigation();
    setupWizardListeners();
    setupHistoryListeners();
    setupModalListeners();
    setupRekapListeners();
    
    // Load halaman sesuai URL Hash
    const hash = window.location.hash.replace('#', '') || 'home';
    showPage(hash);
    
    // Muat kategori berita
    fetchNewsCategories();
}


// --- 3. UTILITIES (FUNGSI BANTUAN) ---
function formatRupiah(num) {
    return "Rp " + parseInt(num || 0).toLocaleString('id-ID');
}

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

function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => showToast(`Berhasil disalin: ${text}`, 'success'))
            .catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
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

function timeAgo(dateStr) {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds > 31536000) return Math.floor(seconds / 31536000) + " thn lalu";
    if (seconds > 2592000) return Math.floor(seconds / 2592000) + " bln lalu";
    if (seconds > 86400) return Math.floor(seconds / 86400) + " hr lalu";
    if (seconds > 3600) return Math.floor(seconds / 3600) + " jam lalu";
    if (seconds > 60) return Math.floor(seconds / 60) + " mnt lalu";
    return "Baru saja";
}

function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

function animateValue(obj, start, end, duration, isCurrency = false) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const val = Math.floor(progress * (end - start) + start);
        obj.innerHTML = isCurrency ? formatRupiah(val) : val;
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}


// --- 4. NAVIGASI & TAMPILAN ---
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-section').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    // Show target page
    const target = document.getElementById(`page-${pageId}`);
    if (target) {
        target.style.display = 'block';
        void target.offsetWidth; // Trigger reflow
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update Nav Active State
    const navLink = document.querySelector(`a[href="#${pageId}"]`);
    if (navLink) navLink.classList.add('active');

    // Lazy Load Data
    if (pageId === 'riwayat' || pageId === 'home') loadRiwayat();
    if (pageId === 'berita' && !newsState.isLoaded) fetchNews();
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
    
    // Header Scroll Effect
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
}

function setupModalLogic() {
    const modal = document.getElementById('hubungi-modal');
    const btn = document.getElementById('btn-hubungi-hero');
    const close = document.getElementById('hubungi-modal-close');

    if (btn) btn.onclick = () => modal.classList.remove('hidden');
    if (close) close.onclick = () => modal.classList.add('hidden');
}


// --- 5. DATA SANTRI ---
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
        
        santriDB[level][rombel].push({ nama, nis, rombel });
    });
}


// --- 6. DONASI WIZARD ---
function updateStepTitle(step) {
    const titles = [
        { title: "Pilih Jenis Kebaikan", subtitle: "Niat Suci Dimulai" },
        { title: "Tentukan Nominal", subtitle: "Semoga Rezeki Berkah" },
        { title: "Isi Data Muzakki/Munfiq", subtitle: "Menyambung Silaturahmi" },
        { title: "Metode Pembayaran", subtitle: "Mudah dan Aman" },
        { title: "Konfirmasi Akhir", subtitle: "Menjemput Ridho-Nya" }
    ];
    const data = titles[step - 1];
    if (data) {
        document.getElementById('wizard-title').innerText = data.title;
        document.getElementById('wizard-subtitle').innerText = data.subtitle;
    }
}

function goToStep(step) {
    document.querySelectorAll('.donasi-step-container').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`donasi-step-${step}`);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('animate-fade-in-up');
    }

    document.getElementById('wizard-step-indicator').innerText = `Step ${step}/5`;
    document.getElementById('wizard-progress-bar').style.width = `${step * 20}%`;
    
    updateStepTitle(step);
    document.getElementById('donasi-wizard').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setupWizardListeners() {
    // STEP 1: Jenis Donasi
    document.querySelectorAll('.choice-button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.choice-button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            const type = btn.dataset.type;
            donasiState.type = type;
            donasiState.subType = null;

            // Hide/Show sub-sections
            ['infaq-options', 'zakat-fitrah-checker', 'zakat-maal-checker', 'step-1-nav-default'].forEach(id => {
                document.getElementById(id).classList.add('hidden');
            });

            if (type === 'Infaq') document.getElementById('infaq-options').classList.remove('hidden');
            else if (type === 'Zakat Fitrah') document.getElementById('zakat-fitrah-checker').classList.remove('hidden');
            else if (type === 'Zakat Maal') document.getElementById('zakat-maal-checker').classList.remove('hidden');
            else document.getElementById('step-1-nav-default').classList.remove('hidden');
        };
    });

    // Sub-choice Infaq
    document.querySelectorAll('.sub-choice-button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.sub-choice-button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            donasiState.subType = btn.dataset.typeInfaq;
            document.getElementById('step-1-nav-default').classList.remove('hidden');
        };
    });

    // Kalkulator Zakat Fitrah
    const fitrahInput = document.getElementById('fitrah-jumlah-orang');
    if(fitrahInput) {
        fitrahInput.oninput = (e) => {
            const total = (parseInt(e.target.value) || 0) * 37500;
            document.getElementById('fitrah-total').value = formatRupiah(total);
            donasiState.nominal = total;
        };
    }
    
    // Tombol Lanjut Fitrah
    document.getElementById('btn-fitrah-next')?.addEventListener('click', () => {
        if (donasiState.nominal < 37500) return showToast("Minimal 1 jiwa");
        goToStep(3);
    });

    // Kalkulator Zakat Maal
    document.getElementById('zakat-check-button')?.addEventListener('click', () => {
        const emas = parseInt(document.getElementById('harga-emas').value.replace(/\D/g, '')) || 0;
        const hasil = parseInt(document.getElementById('penghasilan-bulanan').value.replace(/\D/g, '')) || 0;
        const nisab = (emas * 85) / 12;
        const msg = document.getElementById('zakat-result-message');
        
        document.getElementById('zakat-result').classList.remove('hidden');

        if (hasil >= nisab) {
            const zakat = hasil * 0.025;
            msg.innerHTML = `<span class="text-green-600 block">WAJIB ZAKAT</span>Kewajiban: ${formatRupiah(zakat)}`;
            donasiState.nominal = zakat;
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
        const infaqBtn = document.querySelector('[data-type="Infaq"]');
        if(infaqBtn) infaqBtn.click();
    });

    // STEP 2: Nominal
    document.querySelectorAll('.nominal-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            donasiState.nominal = parseInt(btn.dataset.nominal);
            document.getElementById('nominal-custom').value = formatRupiah(donasiState.nominal);
        };
    });

    const nominalCustom = document.getElementById('nominal-custom');
    if(nominalCustom) {
        nominalCustom.addEventListener('input', function() {
            let val = this.value.replace(/\D/g, '');
            donasiState.nominal = parseInt(val) || 0;
            this.value = formatRupiah(donasiState.nominal);
            document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
        });
    }

    // STEP 3: Data Diri & Santri
    // Dropdowns
    const sLevel = document.getElementById('santri-level-select');
    const sRombel = document.getElementById('santri-rombel-select');
    const sNama = document.getElementById('santri-nama-select');

    if(sLevel) {
        sLevel.onchange = () => {
            sRombel.innerHTML = '<option value="">Rombel</option>';
            sRombel.disabled = true;
            sNama.innerHTML = '<option value="">Pilih Nama Santri</option>';
            sNama.disabled = true;
            
            if(sLevel.value && santriDB[sLevel.value]) {
                Object.keys(santriDB[sLevel.value]).forEach(r => {
                    sRombel.innerHTML += `<option value="${r}">${r}</option>`;
                });
                sRombel.disabled = false;
            }
        };
    }

    if(sRombel) {
        sRombel.onchange = () => {
            sNama.innerHTML = '<option value="">Pilih Nama Santri</option>';
            sNama.disabled = true;
            const lvl = sLevel.value;
            const rmb = sRombel.value;
            if(lvl && rmb && santriDB[lvl][rmb]) {
                santriDB[lvl][rmb].forEach(s => {
                    sNama.innerHTML += `<option value="${s.nama}::${s.nis}::${s.rombel}">${s.nama}</option>`;
                });
                sNama.disabled = false;
            }
        };
    }

    if(sNama) {
        sNama.onchange = () => {
            if(sNama.value) {
                const [nm, ns, rb] = sNama.value.split('::');
                donasiState.namaSantri = nm;
                donasiState.nisSantri = ns;
                donasiState.rombelSantri = rb;
                
                const radio = document.getElementById('radio-an-santri');
                radio.disabled = false;
                if(radio.checked) {
                    document.getElementById('nama-muzakki-input').value = `A/n Santri: ${nm}`;
                }
            }
        };
    }

    // Radio Tipe Donatur
    document.querySelectorAll('input[name="donatur-tipe"]').forEach(r => {
        r.onchange = (e) => {
            donasiState.donaturTipe = e.target.value;
            const details = document.getElementById('santri-details');
            const alumniInp = document.getElementById('input-alumni-tahun');
            const checkAlumni = document.getElementById('check-also-alumni');

            if(e.target.value === 'santri') {
                details.classList.remove('hidden');
                if(checkAlumni.checked) alumniInp.classList.remove('hidden');
                else alumniInp.classList.add('hidden');
            } else {
                details.classList.add('hidden');
                if(checkAlumni.checked) alumniInp.classList.remove('hidden');
            }
        };
    });

    // Check Alumni
    document.getElementById('check-also-alumni')?.addEventListener('change', (e) => {
        const inp = document.getElementById('input-alumni-tahun');
        if(e.target.checked) inp.classList.remove('hidden');
        else inp.classList.add('hidden');
    });

    // Pilihan Nama (Radio)
    document.querySelectorAll('input[name="nama-choice"]').forEach(r => {
        r.onchange = (e) => {
            const input = document.getElementById('nama-muzakki-input');
            if(e.target.value === 'hamba') {
                input.value = "Hamba Allah"; input.readOnly = true;
            } else if(e.target.value === 'santri') {
                if(donasiState.namaSantri) {
                    input.value = `A/n Santri: ${donasiState.namaSantri}`; input.readOnly = true;
                } else {
                    showToast("Pilih nama santri terlebih dahulu");
                    document.querySelector('input[name="nama-choice"][value="manual"]').checked = true;
                }
            } else {
                input.value = ""; input.readOnly = false; input.focus();
            }
        };
    });

    // Tombol Navigasi (Lanjut)
    document.querySelectorAll('[data-next-step]').forEach(btn => {
        btn.onclick = () => {
            const step = parseInt(btn.dataset.nextStep);
            
            // Validasi
            if(step === 2 && donasiState.type === 'Infaq' && !donasiState.subType) return showToast("Pilih peruntukan infaq");
            if(step === 3 && donasiState.nominal < 1000) return showToast("Nominal minimal Rp 1.000");
            if(step === 4) {
                const namaVal = document.getElementById('nama-muzakki-input').value;
                const hpVal = document.getElementById('no-hp').value;
                const alamatVal = document.getElementById('alamat').value;
                
                if(donasiState.donaturTipe === 'santri' && !donasiState.namaSantri) return showToast("Wajib memilih data santri");
                if(!namaVal || !hpVal || !alamatVal) return showToast("Data diri wajib diisi");
                
                donasiState.nama = namaVal;
                donasiState.hp = hpVal;
                donasiState.alamat = alamatVal;
                donasiState.email = document.getElementById('email').value;
                donasiState.doa = document.getElementById('pesan-doa').value;
                donasiState.nik = document.getElementById('no-ktp').value;
                donasiState.alumniTahun = document.getElementById('alumni-tahun').value;
            }
            if(step === 5) {
                const method = document.querySelector('input[name="payment-method"]:checked');
                if(!method) return showToast("Pilih metode pembayaran");
                donasiState.metode = method.value;
                renderDonasiSummary();
            }

            goToStep(step);
        };
    });

    // Tombol Kembali
    document.querySelectorAll('[data-prev-step]').forEach(btn => {
        btn.onclick = () => goToStep(parseInt(btn.dataset.prevStep));
    });

    // Submit Final
    document.getElementById('btn-submit-final')?.addEventListener('click', submitDonasi);
}

function renderDonasiSummary() {
    document.getElementById('summary-type').innerText = donasiState.subType || donasiState.type;
    document.getElementById('summary-nominal').innerText = formatRupiah(donasiState.nominal);
    document.getElementById('summary-nama').innerText = donasiState.nama;
    document.getElementById('summary-hp').innerText = donasiState.hp;
    document.getElementById('summary-metode').innerText = donasiState.metode;

    const sRow = document.getElementById('summary-santri-row');
    if(donasiState.donaturTipe === 'santri' && donasiState.namaSantri) {
        sRow.classList.remove('hidden');
        document.getElementById('summary-santri').innerText = `${donasiState.namaSantri} (${donasiState.rombelSantri})`;
    } else {
        sRow.classList.add('hidden');
    }
}

async function submitDonasi() {
    const check = document.getElementById('confirm-check');
    if (!check.checked) return showToast("Mohon centang pernyataan kebenaran data", "warning");

    const btn = document.getElementById('btn-submit-final');
    btn.disabled = true;
    btn.querySelector('.default-text').classList.add('hidden');
    btn.querySelector('.loading-text').classList.remove('hidden');

    // Update Tampilan Akhir
    document.getElementById('final-nominal-display').innerText = formatRupiah(donasiState.nominal);
    document.getElementById('final-type-display').innerText = donasiState.subType || donasiState.type;
    document.getElementById('final-name-display').innerText = donasiState.nama;

    const payload = {
        "type": donasiState.subType || donasiState.type,
        "nominal": donasiState.nominal,
        "nama": donasiState.nama,
        "hp": donasiState.hp,
        "email": donasiState.email,
        "alamat": donasiState.alamat,
        "metode": donasiState.metode,
        "doa": donasiState.doa,
        "donaturTipe": donasiState.donaturTipe,
        "alumniTahun": donasiState.alumniTahun || "",
        "DetailAlumni": donasiState.alumniTahun || "", 
        "namaSantri": donasiState.namaSantri || "",
        "nisSantri": donasiState.nisSantri || "",
        "rombelSantri": donasiState.rombelSantri || "",
        "NoKTP": donasiState.nik || ""
    };

    try {
        await fetch(CONFIG.API_GAS, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "create", payload: payload })
        });

        // UI Success
        document.getElementById('donasi-wizard').classList.add('hidden');
        document.getElementById('donasi-payment-instructions').classList.remove('hidden');
        document.getElementById('success-modal').classList.remove('hidden');

        // WA Link
        const waMsg = `Assalamu'alaikum, saya ingin konfirmasi donasi:\n\nJenis: ${payload.type}\nNominal: ${formatRupiah(payload.nominal)}\nNama: ${payload.nama}\nMetode: ${payload.metode}`;
        document.getElementById('btn-wa-confirm').href = `https://wa.me/${CONFIG.WA_ADMIN}?text=${encodeURIComponent(waMsg)}`;

        renderPaymentInstructions();

    } catch (e) {
        console.error(e);
        showToast("Gagal mengirim data, periksa koneksi internet.", "error");
        btn.disabled = false;
        btn.querySelector('.default-text').classList.remove('hidden');
        btn.querySelector('.loading-text').classList.add('hidden');
    }
}

function renderPaymentInstructions() {
    let html = '';
    if(donasiState.metode === 'QRIS') {
        html = `
        <div class="text-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p class="font-bold text-slate-700 mb-4">Silakan Scan QRIS Berikut:</p>
            <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="bg-white p-2 rounded-xl border shadow-sm"><img src="https://drive.google.com/thumbnail?id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt" class="w-full rounded-lg"></div>
                <div class="bg-white p-2 rounded-xl border shadow-sm"><img src="https://drive.google.com/thumbnail?id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V" class="w-full rounded-lg"></div>
                <div class="bg-white p-2 rounded-xl border shadow-sm"><img src="https://drive.google.com/thumbnail?id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm" class="w-full rounded-lg"></div>
            </div>
            <p class="text-xs text-slate-500">Mendukung semua E-Wallet & Mobile Banking</p>
        </div>`;
    } else if(donasiState.metode === 'Transfer') {
        html = `
        <div class="space-y-3">
            <div class="p-4 bg-slate-50 rounded-xl border flex justify-between items-center">
                <div><span class="font-bold block text-slate-700">BNI</span><span class="text-sm font-mono text-slate-500">3440000348</span></div>
                <button onclick="copyText('3440000348')" class="text-orange-500 text-xs font-bold border border-orange-200 px-3 py-1 rounded">Salin</button>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border flex justify-between items-center">
                <div><span class="font-bold block text-slate-700">BSI</span><span class="text-sm font-mono text-slate-500">7930030303</span></div>
                <button onclick="copyText('7930030303')" class="text-teal-500 text-xs font-bold border border-teal-200 px-3 py-1 rounded">Salin</button>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border flex justify-between items-center">
                <div><span class="font-bold block text-slate-700">BPD DIY</span><span class="text-sm font-mono text-slate-500">801241004624</span></div>
                <button onclick="copyText('801241004624')" class="text-blue-500 text-xs font-bold border border-blue-200 px-3 py-1 rounded">Salin</button>
            </div>
        </div>`;
    } else {
        html = `<div class="p-8 bg-blue-50 rounded-2xl text-center border border-blue-100"><p class="text-blue-900 font-bold">Pembayaran Tunai</p><p class="text-sm mt-1">Silakan serahkan donasi ke Kantor Layanan.</p></div>`;
    }

    const prayer = `<div class="mb-8 text-center p-6 bg-green-50 rounded-2xl border border-green-100"><p class="font-arabic text-2xl text-green-800 font-bold mb-2">آجَرَكَ اللَّهُ فِيمَا أَعْطَيْتَ...</p></div>`;
    document.getElementById('instruction-content').innerHTML = prayer + html;
}


// --- 7. BERITA ---
async function fetchNewsCategories() {
    const container = document.getElementById('news-filter-container');
    if(!container) return;
    try {
        const res = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${CONFIG.WP_SITE}/categories`);
        const data = await res.json();
        let html = `<button onclick="filterNews('')" class="news-filter-btn active bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition shadow-lg">Semua</button>`;
        
        if(data.categories) {
            data.categories.forEach(cat => {
                if(cat.post_count > 0) {
                    html += `<button data-slug="${cat.slug}" onclick="filterNews('${cat.slug}')" class="news-filter-btn bg-white text-slate-600 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition border border-slate-100 ml-2">${cat.name}</button>`;
                }
            });
        }
        container.innerHTML = html;
    } catch(e) { console.error(e); }
}

async function fetchNews(isLoadMore = false) {
    if (newsState.isLoading) return;
    newsState.isLoading = true;

    const btnMore = document.getElementById('btn-news-load-more');
    if(isLoadMore && btnMore) btnMore.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    else document.getElementById('news-grid').innerHTML = '<div class="col-span-full text-center py-20"><div class="animate-spin inline-block w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full"></div></div>';

    let apiURL = `https://public-api.wordpress.com/rest/v1.1/sites/${CONFIG.WP_SITE}/posts/?number=${CONFIG.NEWS_LIMIT}&page=${newsState.page}`;
    if(newsState.search) apiURL += `&search=${encodeURIComponent(newsState.search)}`;
    if(newsState.category) apiURL += `&category=${encodeURIComponent(newsState.category)}`;

    try {
        const res = await fetch(apiURL);
        const data = await res.json();
        
        newsState.isLoading = false;
        newsState.isLoaded = true;
        newsState.hasMore = data.posts.length >= CONFIG.NEWS_LIMIT;

        if(isLoadMore) newsState.posts = [...newsState.posts, ...data.posts];
        else newsState.posts = data.posts;

        if(newsState.posts.length === 0) {
            document.getElementById('news-grid').innerHTML = '<div class="col-span-full text-center py-20 text-slate-400">Belum ada berita.</div>';
        } else {
            renderNewsGrid(isLoadMore ? data.posts : newsState.posts, isLoadMore);
        }

        if(btnMore) {
            btnMore.innerHTML = 'Muat Lebih Banyak';
            if(newsState.hasMore) btnMore.classList.remove('hidden');
            else btnMore.classList.add('hidden');
        }
    } catch(e) {
        newsState.isLoading = false;
        document.getElementById('news-grid').innerHTML = '<p class="text-center text-red-500 col-span-full">Gagal memuat berita.</p>';
    }
}

function renderNewsGrid(posts, appendMode) {
    const container = document.getElementById('news-grid');
    let html = '';
    let startIndex = appendMode ? (newsState.posts.length - posts.length) : 0;

    posts.forEach((post, i) => {
        const idx = startIndex + i;
        const img = post.featured_image || 'https://via.placeholder.com/600x400';
        const cat = post.categories ? Object.values(post.categories)[0].name : 'Umum';
        
        html += `
        <div class="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full" onclick="openNewsModal(${idx})">
            <div class="h-48 overflow-hidden relative">
                <img src="${img}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
                <span class="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold uppercase text-slate-700 shadow-sm">${cat}</span>
            </div>
            <div class="p-6 flex flex-col flex-grow">
                <h3 class="font-bold text-lg text-slate-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">${post.title}</h3>
                <p class="text-slate-500 text-sm line-clamp-3 flex-grow">${stripHtml(post.excerpt)}</p>
                <div class="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400">
                    <span>${new Date(post.date).toLocaleDateString('id-ID')}</span>
                    <span class="group-hover:translate-x-1 transition-transform"><i class="fas fa-arrow-right"></i></span>
                </div>
            </div>
        </div>`;
    });

    if(appendMode) container.innerHTML += html;
    else container.innerHTML = html;
}

function openNewsModal(index) {
    const post = newsState.posts[index];
    if (!post) return;
    const modal = document.getElementById('news-modal');
    const content = document.getElementById('news-modal-content');
    
    content.innerHTML = `
        <div class="relative h-[40vh] w-full">
            <img src="${post.featured_image}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
            <div class="absolute bottom-0 left-0 p-8 w-full">
                <span class="bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold uppercase mb-2 inline-block">${Object.values(post.categories)[0]?.name}</span>
                <h2 class="text-2xl md:text-3xl font-black text-white leading-tight">${post.title}</h2>
            </div>
        </div>
        <div class="p-8 md:p-12 max-w-3xl mx-auto text-slate-700 leading-loose text-lg font-serif text-justify">
            ${post.content}
        </div>`;
    
    modal.classList.remove('hidden', 'opacity-0');
    setTimeout(() => {
        document.getElementById('news-modal-panel').classList.remove('translate-y-full', 'scale-95');
    }, 10);
    document.body.style.overflow = 'hidden';
}

function closeNewsModal() {
    const modal = document.getElementById('news-modal');
    document.getElementById('news-modal-panel').classList.add('translate-y-full');
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }, 300);
}

function filterNews(cat) {
    newsState.category = cat;
    newsState.page = 1;
    newsState.posts = [];
    fetchNews();
    
    document.querySelectorAll('.news-filter-btn').forEach(btn => {
        if(btn.innerText.includes(cat || 'Semua') || btn.getAttribute('onclick').includes(cat)) {
            btn.classList.remove('bg-white', 'text-slate-600');
            btn.classList.add('bg-slate-900', 'text-white');
        } else {
            btn.classList.add('bg-white', 'text-slate-600');
            btn.classList.remove('bg-slate-900', 'text-white');
        }
    });
}

function handleNewsSearch(e) {
    if (e.key === 'Enter') {
        newsState.search = e.target.value;
        newsState.page = 1;
        fetchNews();
    }
}

function loadMoreNews() {
    newsState.page++;
    fetchNews(true);
}

function resetNewsFilter() {
    filterNews('');
}


// --- 8. RIWAYAT & REKAP ---
function setupHistoryListeners() {
    document.getElementById('riwayat-prev')?.addEventListener('click', () => {
        if(historyState.currentPage > 1) { historyState.currentPage--; renderRiwayatList(); renderPagination(); }
    });
    document.getElementById('riwayat-next')?.addEventListener('click', () => {
        const max = Math.ceil(historyState.allData.length / historyState.itemsPerPage);
        if(historyState.currentPage < max) { historyState.currentPage++; renderRiwayatList(); renderPagination(); }
    });

    ['filter-jenis', 'filter-metode', 'filter-start-date', 'filter-end-date'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            historyState.currentPage = 1; renderRiwayatList(); renderPagination();
        });
    });

    document.querySelectorAll('.time-filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.time-filter-btn').forEach(b => {
                b.classList.remove('bg-slate-900', 'text-white'); b.classList.add('text-slate-500', 'hover:bg-white');
            });
            btn.classList.add('bg-slate-900', 'text-white'); btn.classList.remove('text-slate-500');
            historyState.timeFilter = btn.dataset.time;
            historyState.currentPage = 1;
            renderRiwayatList(); renderPagination();
        };
    });

    document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
        document.getElementById('filter-jenis').value = 'all';
        document.getElementById('filter-metode').value = 'all';
        historyState.timeFilter = 'all';
        historyState.currentPage = 1;
        renderRiwayatList(); renderPagination();
    });
}

async function loadRiwayat() {
    if(historyState.isLoaded) return;
    const loader = document.getElementById('riwayat-loading');
    const content = document.getElementById('riwayat-content');
    
    loader.classList.remove('hidden');
    content.classList.add('hidden');

    try {
        const res = await fetch(CONFIG.API_GAS);
        const json = await res.json();
        
        if(json.status === 'success') {
            historyState.allData = json.data.reverse();
            historyState.isLoaded = true;
            calculateStats();
            renderHomeLatestDonations();
            renderPagination();
            renderRiwayatList();
            
            loader.classList.add('hidden');
            content.classList.remove('hidden');
        }
    } catch(e) {
        loader.innerHTML = '<p class="text-red-500">Gagal memuat data riwayat.</p>';
    }
}

function getFilteredHistory() {
    let data = historyState.allData;
    const type = document.getElementById('filter-jenis')?.value;
    const method = document.getElementById('filter-metode')?.value;
    const start = document.getElementById('filter-start-date')?.value;
    const end = document.getElementById('filter-end-date')?.value;

    if(type && type !== 'all') data = data.filter(d => (d.JenisDonasi || d.type) === type);
    if(method && method !== 'all') data = data.filter(d => (d.MetodePembayaran || d.metode) === method);
    
    if(start || end) {
        const sDate = start ? new Date(start) : new Date('1970-01-01');
        const eDate = end ? new Date(end) : new Date();
        eDate.setHours(23, 59, 59);
        data = data.filter(d => {
            const t = new Date(d.Timestamp);
            return t >= sDate && t <= eDate;
        });
    }

    if(historyState.timeFilter !== 'all') {
        const now = new Date();
        const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
        data = data.filter(d => {
            const t = new Date(d.Timestamp);
            if(historyState.timeFilter === 'today') return t.toDateString() === now.toDateString();
            if(historyState.timeFilter === 'week') return t >= weekAgo;
            if(historyState.timeFilter === 'month') return t.getMonth() === now.getMonth();
            return true;
        });
    }
    return data;
}

function renderRiwayatList() {
    const container = document.getElementById('riwayat-list-container');
    if(!container) return;
    
    const filtered = getFilteredHistory();
    const start = (historyState.currentPage - 1) * historyState.itemsPerPage;
    const pageData = filtered.slice(start, start + historyState.itemsPerPage);

    if(pageData.length === 0) {
        document.getElementById('riwayat-no-data').classList.remove('hidden');
        container.innerHTML = '';
        return;
    }
    document.getElementById('riwayat-no-data').classList.add('hidden');

    container.innerHTML = pageData.map(item => `
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition flex justify-between items-center">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-xl"><i class="fas fa-donate"></i></div>
                <div>
                    <h4 class="font-bold text-slate-800 text-sm md:text-base">${item.NamaDonatur || 'Hamba Allah'}</h4>
                    <div class="flex gap-2 mt-1">
                        <span class="text-[10px] font-bold bg-slate-50 px-2 py-0.5 rounded border text-slate-500">${item.JenisDonasi}</span>
                        <span class="text-[10px] font-bold bg-slate-50 px-2 py-0.5 rounded border text-slate-500">${item.MetodePembayaran}</span>
                    </div>
                </div>
            </div>
            <div class="text-right">
                <span class="block font-black text-lg text-slate-800">${formatRupiah(item.Nominal)}</span>
                <span class="text-[10px] text-slate-400">${timeAgo(item.Timestamp)}</span>
            </div>
        </div>
    `).join('');
}

function renderPagination() {
    const total = getFilteredHistory().length;
    const pages = Math.ceil(total / historyState.itemsPerPage);
    document.getElementById('riwayat-page-info').innerText = `Page ${historyState.currentPage} of ${pages || 1}`;
    document.getElementById('riwayat-prev').disabled = historyState.currentPage === 1;
    document.getElementById('riwayat-next').disabled = historyState.currentPage >= pages;
}

function setupRekapListeners() {
    const lvl = document.getElementById('rekap-level-select');
    const cls = document.getElementById('rekap-kelas-select');
    
    if(lvl && cls) {
        lvl.onchange = () => {
            cls.innerHTML = '<option value="">Pilih Kelas</option>';
            cls.disabled = true;
            if(santriDB[lvl.value]) {
                Object.keys(santriDB[lvl.value]).sort().forEach(c => {
                    cls.innerHTML += `<option value="${c}">${c}</option>`;
                });
                cls.disabled = false;
            }
            document.getElementById('rekap-table-container').classList.add('hidden');
            document.getElementById('rekap-placeholder').classList.remove('hidden');
            document.getElementById('rekap-summary').classList.add('hidden');
        };

        cls.onchange = () => {
            if(cls.value) renderRekapTable(cls.value);
        };
    }
    
    document.getElementById('btn-export-pdf')?.addEventListener('click', exportRekapPDF);
}

function renderRekapTable(cls) {
    const lvl = cls.charAt(0);
    const students = santriDB[lvl][cls] || [];
    const tbody = document.getElementById('rekap-table-body');
    tbody.innerHTML = '';
    
    let grandTotal = 0;
    students.forEach((s, i) => {
        let total = 0;
        historyState.allData.forEach(d => {
            if(d.NamaSantri && d.NamaSantri.includes(s.nama) && (d.KelasSantri === cls || d.rombelSantri === cls)) {
                total += parseInt(d.Nominal) || 0;
            }
        });
        grandTotal += total;
        
        tbody.innerHTML += `
        <tr class="${i%2===0?'bg-white':'bg-slate-50'} hover:bg-orange-50 transition">
            <td class="px-6 py-4 text-center">${i+1}</td>
            <td class="px-6 py-4 font-bold text-slate-700">${s.nama}</td>
            <td class="px-6 py-4 text-right font-mono font-bold text-slate-800">${total > 0 ? formatRupiah(total) : '-'}</td>
            <td class="px-6 py-4"></td>
            <td class="px-6 py-4"></td>
            <td class="px-6 py-4"></td>
        </tr>`;
    });
    
    document.getElementById('rekap-total-kelas').innerText = formatRupiah(grandTotal);
    document.getElementById('rekap-table-container').classList.remove('hidden');
    document.getElementById('rekap-placeholder').classList.add('hidden');
    document.getElementById('rekap-summary').classList.remove('hidden');
    document.getElementById('btn-export-pdf').disabled = false;
}

function exportRekapPDF() {
    if (!window.jspdf) return showToast("Library PDF gagal dimuat", "error");
    const cls = document.getElementById('rekap-kelas-select').value;
    const doc = new window.jspdf.jsPDF();
    
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text(`REKAPITULASI ZIS KELAS ${cls}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 26);
    
    doc.autoTable({
        html: '#rekap-table-container table',
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [241, 90, 34] },
        styles: { fontSize: 8, cellPadding: 2 },
    });
    
    doc.save(`Rekap_ZIS_${cls}.pdf`);
}


// --- 9. QRIS MODAL ---
const qrisData = {
    'bni': { title: 'BNI', img: 'https://drive.google.com/thumbnail?id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt&sz=w1000', url: 'https://drive.google.com/uc?export=download&id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt' },
    'bsi': { title: 'BSI', img: 'https://drive.google.com/thumbnail?id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V&sz=w1000', url: 'https://drive.google.com/uc?export=download&id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V' },
    'bpd': { title: 'BPD DIY', img: 'https://drive.google.com/thumbnail?id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm&sz=w1000', url: 'https://drive.google.com/uc?export=download&id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm' }
};

function openQrisModal(key) {
    const d = qrisData[key];
    if(d) {
        document.getElementById('qris-modal-title').innerText = `Scan QRIS ${d.title}`;
        document.getElementById('qris-modal-img').src = d.img;
        document.getElementById('qris-modal-btn').href = d.url;
        document.getElementById('qris-modal').classList.remove('hidden');
        setTimeout(() => document.getElementById('qris-modal-panel').classList.remove('scale-95'), 10);
    }
}

function closeQrisModal() {
    document.getElementById('qris-modal-panel').classList.add('scale-95');
    setTimeout(() => document.getElementById('qris-modal').classList.add('hidden'), 200);
}
