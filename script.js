/**
 * LAZISMU MU'ALLIMIN - MAIN SCRIPT
 * Terorganisir & Rapi
 */

// =========================================
// 1. CONFIGURATION & STATE
// =========================================

const GAS_API_URL = "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec";
const WORDPRESS_SITE = 'lazismumuallimin.wordpress.com';
const NEWS_PER_PAGE = 6;

// State Donasi
let donasiData = {
    type: null,
    subType: null,
    nominal: 0,
    donaturTipe: 'santri',
    isAlumni: false,
    alumniTahun: '',
    namaSantri: '', nisSantri: '', rombelSantri: '',
    nama: '', hp: '', email: '', alamat: '', doa: '',
    metode: null
};

// State Riwayat & News
let riwayatData = { allData: [], isLoaded: false, currentPage: 1, itemsPerPage: 10 };
let newsState = {
    page: 1,
    category: '',
    search: '',
    posts: [],
    isLoading: false,
    hasMore: true,
    isLoaded: false
};

let timeFilterState = 'all';
let santriDB = {}; // Database lokal santri setelah parsing


// =========================================
// 2. INITIALIZATION
// =========================================

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
    
    // Optional: Header Scroll Effect
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (!header) return;
        if (window.scrollY > 50) {
            header.classList.add('shadow-md', 'bg-white/95');
            header.classList.remove('bg-white/80');
        } else {
            header.classList.remove('shadow-md', 'bg-white/95');
            header.classList.add('bg-white/80');
        }
    });
}


// =========================================
// 3. UTILITIES (Fungsi Bantuan)
// =========================================

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
    return "Rp " + parseInt(num || 0).toLocaleString('id-ID');
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

function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}


// =========================================
// 4. DATA PROCESSING (Santri & Navigation)
// =========================================

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

        santriDB[level][rombel].push({ nama, nis, rombel });
    });
}

function handleInitialLoad() {
    const hash = window.location.hash.replace('#', '') || 'home';
    if (document.getElementById(`page-${hash}`)) {
        showPage(hash);
    } else {
        showPage('home');
    }
}

function showPage(pageId) {
    // Sembunyikan semua halaman
    document.querySelectorAll('.page-section').forEach(p => {
        p.style.display = 'none';
        p.style.opacity = 0;
        p.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    // Tampilkan halaman target
    const target = document.getElementById(`page-${pageId}`);
    if (target) {
        target.style.display = 'block';
        void target.offsetWidth; // Trigger reflow
        target.style.opacity = 1;
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update status link navigasi
    const navLink = document.querySelector(`a[href="#${pageId}"]`);
    if (navLink) navLink.classList.add('active');

    // Logic khusus per halaman (Lazy Load)
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


// =========================================
// 5. WIZARD DONASI LOGIC
// =========================================

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
    // STEP 1: Jenis Donasi
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
            else if (step1Nav) step1Nav.classList.remove('hidden');
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

    // Kalkulator Zakat Fitrah
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

    // Kalkulator Zakat Maal
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

    document.getElementById('btn-maal-next')?.addEventListener('click', () => goToStep(3));
    document.getElementById('zakat-lanjutkan-infaq')?.addEventListener('click', () => {
        const infaqBtn = document.querySelector('[data-type="Infaq"]');
        if (infaqBtn) infaqBtn.click();
    });

    // Navigasi Umum Step 1
    const btnNextStep2 = document.querySelector('[data-next-step="2"]');
    if (btnNextStep2) {
        btnNextStep2.onclick = () => {
            if (donasiData.type === 'Infaq' && !donasiData.subType) return showToast("Pilih peruntukan infaq terlebih dahulu");
            goToStep(2);
        };
    }

    // STEP 2: Nominal
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

    // STEP 3: Data Diri
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
                if (e.target.checked) alumniInput.classList.remove('hidden');
                else alumniInput.classList.add('hidden');
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

    // STEP 4: Pembayaran
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

    // STEP 5: Submit
    const btnSubmitFinal = document.getElementById('btn-submit-final');
    if (btnSubmitFinal) {
        btnSubmitFinal.onclick = async () => {
            const btn = document.getElementById('btn-submit-final');
            const check = document.getElementById('confirm-check');

            if (!check || !check.checked) return showToast("Mohon centang pernyataan kebenaran data", "warning");

            btn.disabled = true;
            btn.querySelector('.default-text').classList.add('hidden');
            btn.querySelector('.loading-text').classList.remove('hidden');

            const finalNominal = document.getElementById('final-nominal-display');
            const finalType = document.getElementById('final-type-display');
            const finalName = document.getElementById('final-name-display');

            if (finalNominal) finalNominal.innerText = formatRupiah(donasiData.nominal);
            if (finalType) finalType.innerText = donasiData.subType || donasiData.type;
            if (finalName) finalName.innerText = donasiData.nama || 'Hamba Allah';

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
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: "create", payload: payload })
                });

                const wizard = document.getElementById('donasi-wizard');
                if (wizard) wizard.classList.add('hidden');

                const paymentInstr = document.getElementById('donasi-payment-instructions');
                if (paymentInstr) paymentInstr.classList.remove('hidden');

                const modal = document.getElementById('success-modal');
                if (modal) modal.classList.remove('hidden');

                const waMsg = `Assalamu'alaikum, saya ingin konfirmasi donasi kebaikan:\n\nJenis: ${donasiData.subType || donasiData.type}\nNominal: ${formatRupiah(donasiData.nominal)}\nNama: ${donasiData.nama}\nMetode: ${donasiData.metode}\n${donasiData.namaSantri ? `Santri: ${donasiData.namaSantri} (${donasiData.rombelSantri})` : ''}`;
                const btnWa = document.getElementById('btn-wa-confirm');
                if (btnWa) btnWa.href = `https://wa.me/6281196961918?text=${encodeURIComponent(waMsg)}`;

                let paymentDetails = '';
                if (donasiData.metode === 'QRIS') {
                    paymentDetails = `
                    <div class="text-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p class="font-bold text-slate-700 mb-4">Silakan Scan QRIS Berikut:</p>
                        <div class="grid grid-cols-3 gap-3 mb-4">
                            <div class="bg-white p-2 rounded-xl border border-slate-100 shadow-sm"><img src="https://drive.google.com/thumbnail?id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt" class="w-full rounded-lg"></div>
                            <div class="bg-white p-2 rounded-xl border border-slate-100 shadow-sm"><img src="https://drive.google.com/thumbnail?id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V" class="w-full rounded-lg"></div>
                            <div class="bg-white p-2 rounded-xl border border-slate-100 shadow-sm"><img src="https://drive.google.com/thumbnail?id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm" class="w-full rounded-lg"></div>
                        </div>
                        <p class="text-xs text-slate-500">Mendukung semua E-Wallet & Mobile Banking</p>
                    </div>`;
                } else if (donasiData.metode === 'Transfer') {
                    paymentDetails = `
                    <div class="space-y-3">
                        <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center"><div><span class="font-bold block text-slate-700">BNI</span><span class="text-sm font-mono text-slate-500">3440000348</span></div><button onclick="copyText('3440000348')" class="text-orange-500 text-xs font-bold bg-white border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50">Salin</button></div>
                        <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center"><div><span class="font-bold block text-slate-700">BSI</span><span class="text-sm font-mono text-slate-500">7930030303</span></div><button onclick="copyText('7930030303')" class="text-teal-500 text-xs font-bold bg-white border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-50">Salin</button></div>
                        <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center"><div><span class="font-bold block text-slate-700">BPD DIY</span><span class="text-sm font-mono text-slate-500">801241004624</span></div><button onclick="copyText('801241004624')" class="text-blue-500 text-xs font-bold bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50">Salin</button></div>
                    </div>`;
                } else {
                    paymentDetails = `<div class="p-8 bg-blue-50 rounded-2xl text-center border border-blue-100"><p class="text-blue-900 font-bold text-lg">Pembayaran Tunai</p><p class="text-blue-700/80 text-sm mt-1">Silakan serahkan donasi ke Kantor Layanan.</p></div>`;
                }

                const prayerHTML = `<div class="mb-8 text-center p-6 bg-green-50/50 rounded-2xl border border-green-100/50"><p class="font-arabic text-2xl text-green-800 mb-3 leading-loose font-bold">آجَرَكَ اللَّهُ فِيمَا أَعْطَيْتَ...</p></div>`;

                const instrContent = document.getElementById('instruction-content');
                if (instrContent) instrContent.innerHTML = prayerHTML + paymentDetails;

            } catch (e) {
                console.error(e);
                showToast("Gagal mengirim data, periksa koneksi internet.", "error");
                btn.disabled = false;
                btn.querySelector('.default-text').classList.remove('hidden');
                btn.querySelector('.loading-text').classList.add('hidden');
            }
        };
    }
    
    document.querySelectorAll('[data-prev-step]').forEach(btn => {
        btn.onclick = () => goToStep(parseInt(btn.dataset.prevStep));
    });
    
    const successContinue = document.getElementById('success-modal-continue');
    if(successContinue) {
        successContinue.onclick = () => {
            document.getElementById('success-modal').classList.add('hidden');
            document.getElementById('donasi-payment-instructions').scrollIntoView({behavior:'smooth'});
        };
    }
}


// =========================================
// 6. HISTORY & STATS LOGIC
// =========================================

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
                b.classList.remove('bg-slate-900', 'text-white', 'shadow-md', 'active');
                b.classList.add('text-slate-500', 'hover:bg-white');
            });
            btn.classList.remove('text-slate-500', 'hover:bg-white');
            btn.classList.add('bg-slate-900', 'text-white', 'shadow-md', 'active');

            timeFilterState = btn.dataset.time;
            riwayatData.currentPage = 1;
            renderRiwayatList();
            renderPagination();
        }
    });
    
    const resetBtn = document.getElementById('btn-reset-filter');
    if(resetBtn) {
        resetBtn.onclick = () => {
            document.getElementById('filter-jenis').value = 'all';
            document.getElementById('filter-metode').value = 'all';
            timeFilterState = 'all';
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

    container.innerHTML = visibleItems.map(item => {
        let iconClass = 'fa-donate', bgIcon = 'bg-slate-100 text-slate-400';
        const type = item.JenisDonasi || "Donasi";
        
        if (type.includes('Fitrah')) { iconClass = 'fa-leaf'; bgIcon = 'bg-emerald-100 text-emerald-600'; }
        else if (type.includes('Maal')) { iconClass = 'fa-coins'; bgIcon = 'bg-yellow-100 text-yellow-600'; }
        else { iconClass = 'fa-hand-holding-heart'; bgIcon = 'bg-orange-100 text-orange-600'; }

        return `
        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex justify-between items-center mb-3">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl ${bgIcon} flex items-center justify-center text-xl"><i class="fas ${iconClass}"></i></div>
                <div>
                    <h4 class="font-bold text-slate-800 text-sm">${item.NamaDonatur || 'Hamba Allah'}</h4>
                    <div class="flex gap-2 mt-1">
                        <span class="text-[10px] font-bold bg-slate-50 px-2 py-0.5 rounded border text-slate-500">${type}</span>
                        <span class="text-[10px] font-bold bg-slate-50 px-2 py-0.5 rounded border text-slate-500">${item.MetodePembayaran}</span>
                    </div>
                </div>
            </div>
            <div class="text-right">
                <span class="block font-black text-lg text-slate-800">${formatRupiah(item.Nominal)}</span>
                <span class="text-[10px] text-slate-400">${timeAgo(item.Timestamp)}</span>
            </div>
        </div>`;
    }).join('');
}

function renderPagination() {
    const items = getFilteredData();
    const totalPages = Math.ceil(items.length / riwayatData.itemsPerPage);
    const pageInfo = document.getElementById('riwayat-page-info');
    if (pageInfo) pageInfo.innerText = `Page ${riwayatData.currentPage} of ${totalPages || 1}`;
    
    const prevBtn = document.getElementById('riwayat-prev');
    if (prevBtn) prevBtn.disabled = riwayatData.currentPage === 1;

    const nextBtn = document.getElementById('riwayat-next');
    if (nextBtn) nextBtn.disabled = riwayatData.currentPage >= totalPages;
}

function calculateStats() {
    const data = riwayatData.allData;
    let total = 0, maxDonation = 0, maxName = "-";
    let fitrah = 0, maal = 0, infaq = 0;

    data.forEach(d => {
        const val = parseInt(d.Nominal) || 0;
        total += val;
        if (val > maxDonation) { maxDonation = val; maxName = d.NamaDonatur; }
        
        const type = d.JenisDonasi || "";
        if (type.includes('Fitrah')) fitrah += val;
        else if (type.includes('Maal')) maal += val;
        else infaq += val;
    });

    animateValue(document.getElementById('stat-total-donasi'), 0, total, 2000, true);
    animateValue(document.getElementById('stat-r-total'), 0, total, 2000, true);
    animateValue(document.getElementById('stat-total-transaksi'), 0, data.length, 1500);
    animateValue(document.getElementById('stat-r-transaksi'), 0, data.length, 1500);
    animateValue(document.getElementById('stat-donasi-rata'), 0, data.length ? total/data.length : 0, 1500, true);
    animateValue(document.getElementById('stat-donasi-tertinggi'), 0, maxDonation, 1500, true);
    
    const maxNameEl = document.getElementById('stat-donasi-tertinggi-nama');
    if(maxNameEl) maxNameEl.innerText = maxName || 'Hamba Allah';

    animateValue(document.getElementById('stat-detail-fitrah'), 0, fitrah, 1500, true);
    animateValue(document.getElementById('stat-detail-maal'), 0, maal, 1500, true);
    animateValue(document.getElementById('stat-detail-infaq'), 0, infaq, 1500, true);
}

function renderHomeLatestDonations() {
    const container = document.getElementById('home-latest-donations');
    if (!container) return;
    const latest = riwayatData.allData.slice(0, 4);
    
    if(latest.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400">Belum ada data donasi.</div>';
        return;
    }

    container.innerHTML = latest.map(d => `
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:-translate-y-1 transition">
            <div class="flex justify-between items-start mb-3">
                <div class="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center"><i class="fas fa-hand-holding-heart"></i></div>
                <span class="text-[10px] font-bold bg-slate-50 px-2 py-1 rounded border text-slate-500 truncate max-w-[80px]">${d.JenisDonasi}</span>
            </div>
            <h5 class="font-bold text-slate-800 text-sm truncate">${d.NamaDonatur || 'Hamba Allah'}</h5>
            <p class="font-black text-lg text-slate-800">${formatRupiah(d.Nominal)}</p>
            <p class="text-[10px] text-slate-400 mt-2 flex items-center gap-1"><i class="far fa-clock"></i> ${timeAgo(d.Timestamp)}</p>
        </div>
    `).join('');
}


// =========================================
// 7. NEWS & BERITA LOGIC
// =========================================

async function fetchNewsCategories() {
    const container = document.getElementById('news-filter-container');
    if(!container) return;
    try {
        const res = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${WORDPRESS_SITE}/categories`);
        const data = await res.json();
        let html = `<button onclick="filterNews('')" class="news-filter-btn active bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition shadow-lg">Semua</button>`;
        if (data.categories) {
            data.categories.forEach(cat => {
                if (cat.post_count > 0) {
                    html += `<button data-slug="${cat.slug}" onclick="filterNews('${cat.slug}')" class="news-filter-btn bg-white text-slate-600 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition border border-slate-100 ml-2">${cat.name}</button>`;
                }
            });
        }
        container.innerHTML = html;
    } catch (e) { console.error(e); }
}

async function fetchNews(isLoadMore = false) {
    if (newsState.isLoading) return;
    newsState.isLoading = true;

    const btnMore = document.getElementById('btn-news-load-more');
    if (!isLoadMore) document.getElementById('news-grid').innerHTML = '<div class="col-span-full text-center py-20"><div class="animate-spin inline-block w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full"></div></div>';
    else if(btnMore) btnMore.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    let apiURL = `https://public-api.wordpress.com/rest/v1.1/sites/${WORDPRESS_SITE}/posts/?number=${NEWS_PER_PAGE}&page=${newsState.page}`;
    if (newsState.search) apiURL += `&search=${encodeURIComponent(newsState.search)}`;
    if (newsState.category) apiURL += `&category=${encodeURIComponent(newsState.category)}`;

    try {
        const res = await fetch(apiURL);
        const data = await res.json();
        newsState.isLoading = false;
        newsState.isLoaded = true;
        newsState.hasMore = data.posts.length >= NEWS_PER_PAGE;

        if (isLoadMore) newsState.posts = [...newsState.posts, ...data.posts];
        else newsState.posts = data.posts;

        if (newsState.posts.length === 0) {
            document.getElementById('news-grid').innerHTML = '<div class="col-span-full text-center py-20 text-slate-400">Belum ada berita.</div>';
        } else {
            renderNewsGrid(isLoadMore ? data.posts : newsState.posts, isLoadMore);
        }
        
        if (btnMore) {
            btnMore.innerHTML = 'Muat Lebih Banyak';
            if (newsState.hasMore) btnMore.classList.remove('hidden');
            else btnMore.classList.add('hidden');
        }
    } catch (err) {
        newsState.isLoading = false;
        document.getElementById('news-grid').innerHTML = '<div class="col-span-full text-center text-red-500">Gagal memuat berita.</div>';
    }
}

function renderNewsGrid(postsToRender, appendMode) {
    const container = document.getElementById('news-grid');
    let html = '';
    let startIndex = appendMode ? (newsState.posts.length - postsToRender.length) : 0;

    postsToRender.forEach((post, i) => {
        const globalIndex = startIndex + i;
        const img = post.featured_image || 'https://via.placeholder.com/600x400?text=Lazismu';
        const cat = post.categories ? Object.values(post.categories)[0].name : 'Umum';
        
        html += `
        <div class="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full" onclick="openNewsModal(${globalIndex})">
            <div class="h-48 overflow-hidden relative">
                <img src="${img}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
                <span class="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold uppercase shadow-sm">${cat}</span>
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

    if (appendMode) container.innerHTML += html;
    else container.innerHTML = html;
}

function filterNews(cat) {
    newsState.category = cat;
    newsState.page = 1;
    newsState.posts = [];
    fetchNews();
    
    document.querySelectorAll('.news-filter-btn').forEach(btn => {
        if(btn.innerText.includes(cat || 'Semua')) {
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
                <span class="bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold uppercase mb-2 inline-block">${Object.values(post.categories)[0].name}</span>
                <h2 class="text-2xl md:text-4xl font-black text-white leading-tight drop-shadow-lg">${post.title}</h2>
            </div>
        </div>
        <div class="p-8 md:p-12 max-w-4xl mx-auto text-slate-700 leading-loose text-lg font-serif text-justify">
            ${post.content}
        </div>
    `;

    modal.classList.remove('hidden', 'opacity-0');
    setTimeout(() => document.getElementById('news-modal-panel').classList.remove('translate-y-full', 'scale-95'), 10);
    document.body.style.overflow = 'hidden';
}


// =========================================
// 8. QRIS MODAL
// =========================================

const qrisDatabase = {
    'bni': { title: 'QRIS BNI', img: 'https://drive.google.com/thumbnail?id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt&sz=w1000', url: 'https://drive.google.com/uc?export=download&id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt' },
    'bsi': { title: 'QRIS BSI', img: 'https://drive.google.com/thumbnail?id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V&sz=w1000', url: 'https://drive.google.com/uc?export=download&id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V' },
    'bpd': { title: 'QRIS BPD DIY', img: 'https://drive.google.com/thumbnail?id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm&sz=w1000', url: 'https://drive.google.com/uc?export=download&id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm' }
};

function openQrisModal(key) {
    const data = qrisDatabase[key];
    if (!data) return;
    
    document.getElementById('qris-modal-title').innerText = data.title;
    document.getElementById('qris-modal-img').src = data.img;
    document.getElementById('qris-modal-btn').href = data.url;

    const modal = document.getElementById('qris-modal');
    modal.classList.remove('hidden');
    setTimeout(() => document.getElementById('qris-modal-panel').classList.remove('scale-95'), 10);
}

function closeQrisModal() {
    const modal = document.getElementById('qris-modal');
    document.getElementById('qris-modal-panel').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 200);
}
