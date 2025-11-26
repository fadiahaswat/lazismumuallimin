/**
 * LAZISMU MU'ALLIMIN APP ENGINE
 * Refactored for Modular Architecture & Performance
 */

// 1. DATA DUMMY FALLBACK (Mencegah error jika data-santri.js belum dimuat)
if (typeof rawSantriData === 'undefined') var rawSantriData = "";

const LazismuApp = (() => {
    // --- CONFIGURATION ---
    const CONFIG = {
        API: {
            GAS: "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec",
            WP: "lazismumuallimin.wordpress.com",
            WA: "6281196961918"
        },
        NEWS: { PER_PAGE: 6 },
        DONATION: {
            MIN_NOMINAL: 1000,
            FITRAH_PER_SOUL: 37500,
            ZAKAT_RATE: 0.025,
            GOLD_GRAMS_NISAB: 85
        }
    };

    // --- STATE MANAGEMENT ---
    const State = {
        donation: {
            type: null, subType: null, nominal: 0, donaturTipe: 'santri',
            isAlumni: false, alumniTahun: '',
            namaSantri: '', nisSantri: '', rombelSantri: '',
            nama: '', hp: '', email: '', alamat: '', doa: '', nik: '', metode: null
        },
        news: {
            page: 1, category: '', search: '', posts: [],
            isLoading: false, hasMore: true, isLoaded: false
        },
        history: {
            allData: [], isLoaded: false, currentPage: 1, itemsPerPage: 10, timeFilter: 'all'
        },
        santriDB: {}
    };

    // --- UTILITIES ---
    const Utils = {
        formatRupiah: (num) => "Rp " + parseInt(num || 0).toLocaleString('id-ID'),
        
        showToast: (message, type = 'warning') => {
            const container = document.getElementById('toast-container');
            if (!container) return alert(message);
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`; // Pastikan CSS toast ada di style.css
            
            // Mapping icon berdasarkan tipe
            let iconClass = 'fa-exclamation-triangle text-orange-500';
            if (type === 'success') iconClass = 'fa-check-circle text-green-500';
            if (type === 'error') iconClass = 'fa-times-circle text-red-500';

            toast.innerHTML = `<i class="fas ${iconClass} text-xl"></i><span class="font-bold text-sm text-slate-700">${message}</span>`;
            container.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        },

        copyText: (text) => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => Utils.showToast(`Berhasil disalin: ${text}`, 'success'));
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    Utils.showToast(`Berhasil disalin: ${text}`, 'success');
                } catch (err) {
                    Utils.showToast('Gagal menyalin', 'error');
                }
                document.body.removeChild(textArea);
            }
        },

        timeAgo: (dateStr) => {
            const date = new Date(dateStr);
            const seconds = Math.floor((new Date() - date) / 1000);
            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + " thn lalu";
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + " bln lalu";
            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + " hr lalu";
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + " jam lalu";
            return "Baru saja";
        },

        stripHtml: (html) => {
            let tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || "";
        },

        animateValue: (id, end, duration = 1500, isCurrency = false) => {
            const obj = document.getElementById(id);
            if (!obj) return;
            let startTimestamp = null;
            const start = 0; 
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const val = Math.floor(progress * (end - start) + start);
                obj.innerHTML = isCurrency ? Utils.formatRupiah(val) : val;
                if (progress < 1) window.requestAnimationFrame(step);
            };
            window.requestAnimationFrame(step);
        }
    };

    // --- API SERVICE ---
    const API = {
        fetchHistory: async () => {
            try {
                const res = await fetch(CONFIG.API.GAS);
                const json = await res.json();
                return json.status === 'success' ? json.data.reverse() : [];
            } catch (e) { return []; }
        },
        submitDonation: async (payload) => {
            return await fetch(CONFIG.API.GAS, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: "create", payload })
            });
        },
        fetchNews: async (page, category, search) => {
            let url = `https://public-api.wordpress.com/rest/v1.1/sites/${CONFIG.API.WP}/posts/?number=${CONFIG.NEWS.PER_PAGE}&page=${page}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (category) url += `&category=${encodeURIComponent(category)}`;
            const res = await fetch(url);
            return await res.json();
        },
        fetchCategories: async () => {
            const res = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${CONFIG.API.WP}/categories`);
            return await res.json();
        }
    };

    // --- MODULE: NAVIGATION ---
    const Navigation = {
        init: () => {
            // Handle Initial Hash
            const hash = window.location.hash.replace('#', '') || 'home';
            Navigation.showPage(hash);

            // Handle "Hubungi Kami" Modal Button
            const btnHubungi = document.getElementById('btn-hubungi-hero');
            if(btnHubungi) {
                btnHubungi.onclick = () => document.getElementById('hubungi-modal').classList.remove('hidden');
            }
        },

        showPage: (pageId) => {
            // Normalisasi ID (terkadang dikirim 'home', terkadang 'page-home')
            const cleanId = pageId.replace('page-', '');
            const targetId = `page-${cleanId}`;

            // Hide All Sections
            document.querySelectorAll('.page-section').forEach(p => {
                p.style.display = 'none';
                p.classList.remove('active');
            });
            // Deactivate Nav Links
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

            // Show Target
            const target = document.getElementById(targetId);
            if (target) {
                target.style.display = 'block';
                // Force reflow for animation
                void target.offsetWidth; 
                target.classList.add('active');
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Activate Link (jika ada di menu)
                const link = document.querySelector(`a[href="#${cleanId}"]`);
                if(link) link.classList.add('active');

                // Lazy Load Modules
                if (cleanId === 'riwayat' || cleanId === 'home') HistoryModule.load();
                if (cleanId === 'berita' && !State.news.isLoaded) NewsModule.fetch();
            }
        },

        scrollToSection: (sectionId) => {
            Navigation.showPage('home');
            setTimeout(() => {
                const el = document.getElementById(sectionId);
                if(el) el.scrollIntoView({behavior: 'smooth', block: 'start'});
            }, 300);
        }
    };

    // --- MODULE: DONATION WIZARD ---
    const Wizard = {
        init: () => {
            Wizard.bindEvents();
            
            // Setup Kalkulator Zakat Fitrah
            const fInput = document.getElementById('fitrah-jumlah-orang');
            if(fInput) {
                fInput.oninput = (e) => {
                    const tot = (parseInt(e.target.value) || 0) * CONFIG.DONATION.FITRAH_PER_SOUL;
                    document.getElementById('fitrah-total').value = Utils.formatRupiah(tot);
                    State.donation.nominal = tot;
                };
            }

            // Setup Kalkulator Zakat Maal
            const btnZakat = document.getElementById('zakat-check-button');
            if(btnZakat) {
                btnZakat.onclick = () => {
                    const emas = parseInt(document.getElementById('harga-emas').value.replace(/\D/g,'')) || 0;
                    const hasil = parseInt(document.getElementById('penghasilan-bulanan').value.replace(/\D/g,'')) || 0;
                    const nisab = (emas * CONFIG.DONATION.GOLD_GRAMS_NISAB) / 12;
                    
                    document.getElementById('zakat-result').classList.remove('hidden');
                    const msg = document.getElementById('zakat-result-message');
                    
                    if (hasil >= nisab) {
                        const zakat = hasil * CONFIG.DONATION.ZAKAT_RATE;
                        msg.innerHTML = `<span class="text-green-600">WAJIB ZAKAT</span><br>Rp ${Utils.formatRupiah(zakat)}`;
                        State.donation.nominal = zakat;
                        document.getElementById('btn-maal-next').classList.remove('hidden');
                        document.getElementById('zakat-lanjutkan-infaq').classList.add('hidden');
                    } else {
                        msg.innerHTML = `<span class="text-orange-600">BELUM WAJIB</span><br>Nishab: ${Utils.formatRupiah(nisab)}`;
                        document.getElementById('btn-maal-next').classList.add('hidden');
                        document.getElementById('zakat-lanjutkan-infaq').classList.remove('hidden');
                    }
                };
            }
        },

        bindEvents: () => {
            // Step 1: Type Buttons
            document.querySelectorAll('.choice-button').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.choice-button').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    State.donation.type = btn.dataset.type;
                    State.donation.subType = null;
                    
                    // Toggle Subsections
                    ['infaq-options', 'zakat-fitrah-checker', 'zakat-maal-checker', 'step-1-nav-default'].forEach(id => {
                        document.getElementById(id).classList.add('hidden');
                    });

                    if(btn.dataset.type === 'Infaq') document.getElementById('infaq-options').classList.remove('hidden');
                    else if(btn.dataset.type === 'Zakat Fitrah') document.getElementById('zakat-fitrah-checker').classList.remove('hidden');
                    else if(btn.dataset.type === 'Zakat Maal') document.getElementById('zakat-maal-checker').classList.remove('hidden');
                    else document.getElementById('step-1-nav-default').classList.remove('hidden'); // Default
                };
            });

            // Step 1: Sub-choice (Infaq)
            document.querySelectorAll('.sub-choice-button').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.sub-choice-button').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    State.donation.subType = btn.dataset.typeInfaq;
                    document.getElementById('step-1-nav-default').classList.remove('hidden');
                };
            });

            // Step 2: Nominal Buttons
            document.querySelectorAll('.nominal-btn').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    State.donation.nominal = parseInt(btn.dataset.nominal);
                    document.getElementById('nominal-custom').value = Utils.formatRupiah(State.donation.nominal);
                };
            });

            // Step 2: Custom Nominal
            const customInput = document.getElementById('nominal-custom');
            if(customInput) {
                customInput.addEventListener('input', function() {
                    let val = this.value.replace(/\D/g, '');
                    State.donation.nominal = parseInt(val) || 0;
                    this.value = Utils.formatRupiah(State.donation.nominal);
                    document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
                });
            }

            // Step 3: Donatur Tipe & Santri Logic
            document.querySelectorAll('input[name="donatur-tipe"]').forEach(r => {
                r.onchange = (e) => {
                    State.donation.donaturTipe = e.target.value;
                    const santriDetails = document.getElementById('santri-details');
                    const alumniInput = document.getElementById('input-alumni-tahun');
                    const checkAlumni = document.getElementById('check-also-alumni');

                    if(e.target.value === 'santri') {
                        santriDetails.classList.remove('hidden');
                        if(checkAlumni.checked) alumniInput.classList.remove('hidden');
                        else alumniInput.classList.add('hidden');
                    } else {
                        santriDetails.classList.add('hidden');
                        if(checkAlumni.checked) alumniInput.classList.remove('hidden');
                    }
                };
            });

            // Checkbox Alumni
            const checkAlumni = document.getElementById('check-also-alumni');
            if(checkAlumni) {
                checkAlumni.onchange = (e) => {
                    const el = document.getElementById('input-alumni-tahun');
                    if(e.target.checked) el.classList.remove('hidden');
                    else el.classList.add('hidden');
                };
            }

            // Nama Choice (Manual/Santri/Hamba Allah)
            document.querySelectorAll('input[name="nama-choice"]').forEach(r => {
                r.onchange = (e) => {
                    const input = document.getElementById('nama-muzakki-input');
                    if(e.target.value === 'hamba') {
                        input.value = "Hamba Allah"; input.readOnly = true;
                    } else if (e.target.value === 'santri') {
                        if(State.donation.namaSantri) {
                            input.value = `A/n Santri: ${State.donation.namaSantri}`; input.readOnly = true;
                        } else {
                            Utils.showToast("Pilih nama santri dulu");
                            document.querySelector('input[value="manual"]').checked = true;
                        }
                    } else {
                        input.value = ""; input.readOnly = false; input.focus();
                    }
                };
            });

            // Navigation Buttons (Next/Prev)
            document.querySelectorAll('[data-next-step]').forEach(btn => {
                btn.onclick = () => Wizard.validateAndGo(parseInt(btn.dataset.nextStep));
            });
            document.querySelectorAll('[data-prev-step]').forEach(btn => {
                btn.onclick = () => Wizard.showStep(parseInt(btn.dataset.prevStep));
            });

            // Final Submit
            const btnSubmit = document.getElementById('btn-submit-final');
            if(btnSubmit) btnSubmit.onclick = Wizard.submit;
        },

        validateAndGo: (step) => {
            // Validation Logic
            if (step === 2) {
                if (State.donation.type === 'Infaq' && !State.donation.subType) return Utils.showToast("Pilih jenis infaq");
                if (State.donation.type === 'Zakat Fitrah' && State.donation.nominal < CONFIG.DONATION.FITRAH_PER_SOUL) return Utils.showToast("Minimal 1 jiwa");
            }
            if (step === 3) {
                if (State.donation.nominal < CONFIG.DONATION.MIN_NOMINAL) return Utils.showToast("Minimal donasi Rp 1.000");
            }
            if (step === 4) {
                // Collect Data
                State.donation.nama = document.getElementById('nama-muzakki-input').value;
                State.donation.hp = document.getElementById('no-hp').value;
                State.donation.alamat = document.getElementById('alamat').value;
                State.donation.email = document.getElementById('email').value;
                State.donation.doa = document.getElementById('pesan-doa').value;
                State.donation.nik = document.getElementById('no-ktp').value;
                State.donation.alumniTahun = document.getElementById('alumni-tahun').value;

                if (State.donation.donaturTipe === 'santri' && !State.donation.namaSantri) return Utils.showToast("Wajib pilih data santri");
                if (!State.donation.nama || !State.donation.hp || !State.donation.alamat) return Utils.showToast("Data diri wajib diisi lengkap");
            }
            if (step === 5) {
                const method = document.querySelector('input[name="payment-method"]:checked');
                if (!method) return Utils.showToast("Pilih metode pembayaran");
                State.donation.metode = method.value;
                Wizard.renderSummary();
            }

            Wizard.showStep(step);
        },

        showStep: (step) => {
            document.querySelectorAll('.donasi-step-container').forEach(el => el.classList.add('hidden'));
            const target = document.getElementById(`donasi-step-${step}`);
            if (target) {
                target.classList.remove('hidden');
                target.classList.add('animate-fade-in-up');
            }
            
            // Update UI Wizard
            const titles = ["Pilih Jenis", "Nominal", "Data Diri", "Pembayaran", "Konfirmasi"];
            const subtitles = ["Niat Suci Dimulai", "Semoga Rezeki Berkah", "Menyambung Silaturahmi", "Mudah dan Aman", "Menjemput Ridho-Nya"];
            
            document.getElementById('wizard-step-indicator').innerText = `Step ${step}/5`;
            document.getElementById('wizard-progress-bar').style.width = `${step * 20}%`;
            document.getElementById('wizard-title').innerText = titles[step-1];
            document.getElementById('wizard-subtitle').innerText = subtitles[step-1];
            
            document.getElementById('donasi-wizard').scrollIntoView({behavior: 'smooth', block: 'center'});
        },

        renderSummary: () => {
            document.getElementById('summary-type').innerText = State.donation.subType || State.donation.type;
            document.getElementById('summary-nominal').innerText = Utils.formatRupiah(State.donation.nominal);
            document.getElementById('summary-nama').innerText = State.donation.nama;
            document.getElementById('summary-hp').innerText = State.donation.hp;
            document.getElementById('summary-metode').innerText = State.donation.metode;
            
            const row = document.getElementById('summary-santri-row');
            if(State.donation.donaturTipe === 'santri' && State.donation.namaSantri) {
                row.classList.remove('hidden');
                document.getElementById('summary-santri').innerText = `${State.donation.namaSantri} (${State.donation.rombelSantri})`;
            } else {
                row.classList.add('hidden');
            }
        },

        submit: async () => {
            if(!document.getElementById('confirm-check').checked) return Utils.showToast("Mohon centang pernyataan kebenaran data");

            const btn = document.getElementById('btn-submit-final');
            btn.disabled = true;
            btn.querySelector('.default-text').classList.add('hidden');
            btn.querySelector('.loading-text').classList.remove('hidden');

            try {
                // Prepare Payload
                const payload = {
                    type: State.donation.subType || State.donation.type,
                    nominal: State.donation.nominal,
                    nama: State.donation.nama,
                    hp: State.donation.hp,
                    email: State.donation.email,
                    alamat: State.donation.alamat,
                    metode: State.donation.metode,
                    doa: State.donation.doa,
                    donaturTipe: State.donation.donaturTipe,
                    alumniTahun: State.donation.alumniTahun,
                    DetailAlumni: State.donation.alumniTahun, // For GAS compatibility
                    namaSantri: State.donation.namaSantri,
                    nisSantri: State.donation.nisSantri,
                    rombelSantri: State.donation.rombelSantri,
                    NoKTP: State.donation.nik
                };

                await API.submitDonation(payload);

                // Update UI to Success
                document.getElementById('donasi-wizard').classList.add('hidden');
                document.getElementById('donasi-payment-instructions').classList.remove('hidden');
                document.getElementById('success-modal').classList.remove('hidden');

                // Update WA Link & Final Display
                const waMsg = `Assalamu'alaikum, Konfirmasi Donasi:\nJenis: ${payload.type}\nNominal: ${Utils.formatRupiah(payload.nominal)}\nNama: ${payload.nama}\nMetode: ${payload.metode}`;
                document.getElementById('btn-wa-confirm').href = `https://wa.me/${CONFIG.API.WA}?text=${encodeURIComponent(waMsg)}`;
                
                document.getElementById('final-nominal-display').innerText = Utils.formatRupiah(payload.nominal);
                document.getElementById('final-type-display').innerText = payload.type;
                document.getElementById('final-name-display').innerText = payload.nama;

                // Render Instructions
                let instrHtml = '';
                if(payload.metode === 'QRIS') {
                    instrHtml = `<div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center"><p class="font-bold text-slate-700 mb-2">Silakan Scan QRIS Tersedia</p><p class="text-xs text-slate-500">Gunakan QRIS BNI/BSI/BPD di bagian atas halaman.</p></div>`;
                } else if(payload.metode === 'Transfer') {
                    instrHtml = `<div class="bg-slate-50 p-4 rounded-xl border border-slate-200"><p class="font-bold text-slate-700 mb-2">Silakan Transfer:</p><ul class="text-xs text-slate-600 space-y-1"><li>BNI: 3440000348</li><li>BSI: 7930030303</li><li>BPD DIY: 801241004624</li></ul></div>`;
                } else {
                    instrHtml = `<div class="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center"><p class="font-bold text-blue-800">Pembayaran Tunai</p><p class="text-xs text-blue-600">Silakan menuju Kantor Layanan Lazismu Mu'allimin.</p></div>`;
                }
                
                const prayer = `<div class="bg-green-50 p-4 rounded-xl border border-green-100 text-center mb-4"><p class="font-arabic text-xl text-green-700 font-bold mb-2">آجَرَكَ اللَّهُ فِيمَا أَعْطَيْتَ...</p><p class="text-xs text-green-600 italic">"Semoga Allah memberikan pahala atas apa yang engkau berikan..."</p></div>`;
                
                document.getElementById('instruction-content').innerHTML = prayer + instrHtml;

            } catch (e) {
                console.error(e);
                Utils.showToast("Gagal mengirim data. Periksa koneksi.", "error");
                btn.disabled = false;
                btn.querySelector('.default-text').classList.remove('hidden');
                btn.querySelector('.loading-text').classList.add('hidden');
            }
        }
    };

    // --- MODULE: HISTORY & STATS ---
    const HistoryModule = {
        load: async () => {
            if(State.history.isLoaded) return;
            
            document.getElementById('riwayat-loading').classList.remove('hidden');
            document.getElementById('riwayat-content').classList.add('hidden');

            State.history.allData = await API.fetchHistory();
            State.history.isLoaded = true;

            HistoryModule.calculateStats();
            HistoryModule.renderList();
            HistoryModule.renderPagination();
            HistoryModule.renderHomeWidgets();

            document.getElementById('riwayat-loading').classList.add('hidden');
            document.getElementById('riwayat-content').classList.remove('hidden');
        },

        calculateStats: () => {
            const data = State.history.allData;
            let total = 0, maxVal = 0, maxName = '-';
            let fitrah = 0, maal = 0, infaq = 0;
            let typesCount = {};

            data.forEach(d => {
                const val = parseInt(d.Nominal) || 0;
                total += val;
                if(val > maxVal) { maxVal = val; maxName = d.NamaDonatur; }
                
                // Categorize
                const type = d.JenisDonasi || d.type || '';
                if(type.includes('Fitrah')) fitrah += val;
                else if(type.includes('Maal')) maal += val;
                else infaq += val;

                typesCount[type] = (typesCount[type] || 0) + 1;
            });

            // Find Popular
            let popType = Object.keys(typesCount).reduce((a, b) => typesCount[a] > typesCount[b] ? a : b, '-');

            // Animate Stats
            Utils.animateValue('stat-total-donasi', total, 2000, true);
            Utils.animateValue('stat-r-total', total, 2000, true); // Rekap section
            Utils.animateValue('stat-total-transaksi', data.length);
            Utils.animateValue('stat-r-transaksi', data.length);
            Utils.animateValue('stat-donasi-rata', data.length ? total/data.length : 0, 1500, true);
            Utils.animateValue('stat-donasi-tertinggi', maxVal, 1500, true);
            
            document.getElementById('stat-donasi-tertinggi-nama').innerText = maxName || 'Hamba Allah';
            
            Utils.animateValue('stat-detail-fitrah', fitrah, 1500, true);
            Utils.animateValue('stat-detail-maal', maal, 1500, true);
            Utils.animateValue('stat-detail-infaq', infaq, 1500, true);
            
            document.getElementById('stat-r-tipe-top').innerText = popType;
        },

        renderList: () => {
            const container = document.getElementById('riwayat-list-container');
            if(!container) return;

            // Filter Logic
            let filtered = State.history.allData;
            const typeFilter = document.getElementById('filter-jenis').value;
            const methodFilter = document.getElementById('filter-metode').value;
            const timeFilter = State.history.timeFilter;

            if(typeFilter !== 'all') filtered = filtered.filter(d => (d.JenisDonasi || d.type) === typeFilter);
            if(methodFilter !== 'all') filtered = filtered.filter(d => (d.MetodePembayaran || d.metode) === methodFilter);
            
            const now = new Date();
            if(timeFilter === 'today') filtered = filtered.filter(d => new Date(d.Timestamp).toDateString() === now.toDateString());
            else if(timeFilter === 'week') {
                const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
                filtered = filtered.filter(d => new Date(d.Timestamp) >= weekAgo);
            } else if(timeFilter === 'month') filtered = filtered.filter(d => new Date(d.Timestamp).getMonth() === now.getMonth());

            // Pagination
            const start = (State.history.currentPage - 1) * State.history.itemsPerPage;
            const pageData = filtered.slice(start, start + State.history.itemsPerPage);

            if(pageData.length === 0) {
                container.innerHTML = '';
                document.getElementById('riwayat-no-data').classList.remove('hidden');
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
                        <span class="block font-black text-lg text-slate-800">${Utils.formatRupiah(item.Nominal)}</span>
                        <span class="text-[10px] text-slate-400">${Utils.timeAgo(item.Timestamp)}</span>
                    </div>
                </div>
            `).join('');
            
            // Update Pagination Info
            const totalPages = Math.ceil(filtered.length / State.history.itemsPerPage);
            document.getElementById('riwayat-page-info').innerText = `Page ${State.history.currentPage} of ${totalPages || 1}`;
            document.getElementById('riwayat-prev').disabled = State.history.currentPage === 1;
            document.getElementById('riwayat-next').disabled = State.history.currentPage >= totalPages;
        },

        renderPagination: () => {
            // Event listeners handled in init
        },

        renderHomeWidgets: () => {
            const container = document.getElementById('home-latest-donations');
            if(!container) return;
            const latest = State.history.allData.slice(0, 4);
            
            if(latest.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center text-slate-400 py-10">Belum ada data.</div>';
                return;
            }

            container.innerHTML = latest.map(d => `
                <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:-translate-y-1 transition">
                    <div class="flex justify-between items-start mb-3">
                        <div class="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center"><i class="fas fa-hand-holding-heart"></i></div>
                        <span class="text-[10px] font-bold bg-slate-50 px-2 py-1 rounded border text-slate-500">${d.JenisDonasi}</span>
                    </div>
                    <h5 class="font-bold text-slate-800 text-sm truncate">${d.NamaDonatur || 'Hamba Allah'}</h5>
                    <p class="font-black text-lg text-slate-800">${Utils.formatRupiah(d.Nominal)}</p>
                    <p class="text-[10px] text-slate-400 mt-2 flex items-center gap-1"><i class="far fa-clock"></i> ${Utils.timeAgo(d.Timestamp)}</p>
                </div>
            `).join('');
        },

        setupEvents: () => {
            // Pagination
            document.getElementById('riwayat-prev').onclick = () => {
                if(State.history.currentPage > 1) { State.history.currentPage--; HistoryModule.renderList(); }
            };
            document.getElementById('riwayat-next').onclick = () => {
                State.history.currentPage++; HistoryModule.renderList(); // Boundary check inside renderList helper usually, or here
            };

            // Filters
            ['filter-jenis', 'filter-metode'].forEach(id => {
                document.getElementById(id).onchange = () => {
                    State.history.currentPage = 1; HistoryModule.renderList();
                };
            });

            // Time Filter Buttons
            document.querySelectorAll('.time-filter-btn').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.time-filter-btn').forEach(b => {
                        b.classList.remove('bg-slate-900', 'text-white', 'active');
                        b.classList.add('text-slate-500', 'hover:bg-white');
                    });
                    btn.classList.add('bg-slate-900', 'text-white', 'active');
                    btn.classList.remove('text-slate-500');
                    State.history.timeFilter = btn.dataset.time;
                    State.history.currentPage = 1;
                    HistoryModule.renderList();
                };
            });
            
            // Reset
            document.getElementById('btn-reset-filter').onclick = () => {
                document.getElementById('filter-jenis').value = 'all';
                document.getElementById('filter-metode').value = 'all';
                State.history.timeFilter = 'all';
                // Reset UI buttons visually...
                State.history.currentPage = 1;
                HistoryModule.renderList();
            };
        }
    };

    // --- MODULE: NEWS ---
    const NewsModule = {
        fetch: async (isMore = false) => {
            if(State.news.isLoading) return;
            State.news.isLoading = true;
            
            const btnMore = document.getElementById('btn-news-load-more');
            if(!isMore) document.getElementById('news-grid').innerHTML = '<div class="col-span-full text-center py-10"><div class="animate-spin inline-block w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full"></div></div>';
            else if(btnMore) btnMore.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            try {
                const res = await API.fetchNews(State.news.page, State.news.category, State.news.search);
                State.news.isLoading = false;
                State.news.isLoaded = true;
                State.news.hasMore = res.posts.length >= CONFIG.NEWS.PER_PAGE;

                if(isMore) State.news.posts = [...State.news.posts, ...res.posts];
                else State.news.posts = res.posts;

                NewsModule.render(isMore);

                if(btnMore) {
                    btnMore.innerHTML = 'Muat Lebih Banyak';
                    btnMore.classList.toggle('hidden', !State.news.hasMore);
                }
            } catch (e) {
                State.news.isLoading = false;
                document.getElementById('news-grid').innerHTML = '<div class="col-span-full text-center text-red-500">Gagal memuat berita.</div>';
            }
        },

        render: (append) => {
            const container = document.getElementById('news-grid');
            const posts = State.news.posts;
            const renderData = append ? posts.slice(posts.length - CONFIG.NEWS.PER_PAGE) : posts;

            if(posts.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center text-slate-400 py-10">Belum ada berita.</div>';
                return;
            }

            const html = renderData.map((post, i) => {
                const globalIdx = append ? (posts.length - renderData.length + i) : i;
                const img = post.featured_image || 'https://via.placeholder.com/600x400';
                const cat = Object.values(post.categories)[0]?.name || 'Umum';
                
                return `
                <div class="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full" onclick="LazismuApp.openNews(${globalIdx})">
                    <div class="h-48 overflow-hidden relative">
                        <img src="${img}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
                        <span class="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold uppercase text-slate-700 shadow-sm">${cat}</span>
                    </div>
                    <div class="p-6 flex flex-col flex-grow">
                        <h3 class="font-bold text-lg text-slate-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">${post.title}</h3>
                        <p class="text-slate-500 text-sm line-clamp-3 flex-grow">${Utils.stripHtml(post.excerpt)}</p>
                        <div class="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400">
                            <span>${new Date(post.date).toLocaleDateString('id-ID')}</span>
                            <span class="group-hover:translate-x-1 transition-transform"><i class="fas fa-arrow-right"></i></span>
                        </div>
                    </div>
                </div>`;
            }).join('');

            if(append) container.innerHTML += html;
            else container.innerHTML = html;
        },

        setup: async () => {
            try {
                const cats = await API.fetchCategories();
                const container = document.getElementById('news-filter-container');
                if(container && cats.categories) {
                    let html = `<button onclick="LazismuApp.filterNews('')" class="news-filter-btn active bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition shadow-lg">Semua</button>`;
                    cats.categories.forEach(c => {
                        if(c.post_count > 0) {
                            html += `<button onclick="LazismuApp.filterNews('${c.slug}')" class="news-filter-btn bg-white text-slate-600 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition border border-slate-100 ml-2">${c.name}</button>`;
                        }
                    });
                    container.innerHTML = html;
                }
            } catch(e) {}
        }
    };

    // --- MODULE: SANTRI & REKAP ---
    const SantriModule = {
        init: () => {
            if(!rawSantriData) return;
            // Parse Data Santri
            const lines = rawSantriData.trim().split('\n');
            lines.forEach(line => {
                const [rmb, nis, nm] = line.split('\t');
                if(rmb && nm) {
                    const lvl = rmb.trim().charAt(0);
                    const rombel = rmb.trim();
                    if(!State.santriDB[lvl]) State.santriDB[lvl] = {};
                    if(!State.santriDB[lvl][rombel]) State.santriDB[lvl][rombel] = [];
                    State.santriDB[lvl][rombel].push({ nama: nm.trim(), nis: nis?.trim(), rombel });
                }
            });

            // Setup Dropdowns Santri (Donasi)
            const lSelect = document.getElementById('santri-level-select');
            const rSelect = document.getElementById('santri-rombel-select');
            const nSelect = document.getElementById('santri-nama-select');

            if(lSelect) {
                lSelect.onchange = () => {
                    rSelect.innerHTML = '<option value="">Pilih Kelas</option>';
                    rSelect.disabled = true; nSelect.disabled = true;
                    const lvl = lSelect.value;
                    if(State.santriDB[lvl]) {
                        Object.keys(State.santriDB[lvl]).sort().forEach(r => {
                            rSelect.innerHTML += `<option value="${r}">${r}</option>`;
                        });
                        rSelect.disabled = false;
                    }
                };
            }
            if(rSelect) {
                rSelect.onchange = () => {
                    nSelect.innerHTML = '<option value="">Pilih Nama</option>';
                    nSelect.disabled = true;
                    const lvl = lSelect.value;
                    const rmb = rSelect.value;
                    if(State.santriDB[lvl][rmb]) {
                        State.santriDB[lvl][rmb].forEach(s => {
                            nSelect.innerHTML += `<option value="${s.nama}::${s.nis}::${s.rombel}">${s.nama}</option>`;
                        });
                        nSelect.disabled = false;
                    }
                };
            }
            if(nSelect) {
                nSelect.onchange = () => {
                    if(nSelect.value) {
                        const [nm, ns, rb] = nSelect.value.split('::');
                        State.donation.namaSantri = nm;
                        State.donation.nisSantri = ns;
                        State.donation.rombelSantri = rb;
                        document.getElementById('radio-an-santri').disabled = false;
                    }
                };
            }

            // Setup Rekapitulasi
            const rekLvl = document.getElementById('rekap-level-select');
            const rekCls = document.getElementById('rekap-kelas-select');
            if(rekLvl && rekCls) {
                rekLvl.onchange = () => {
                    rekCls.innerHTML = '<option value="">Pilih Kelas</option>';
                    rekCls.disabled = true;
                    if(State.santriDB[rekLvl.value]) {
                        Object.keys(State.santriDB[rekLvl.value]).sort().forEach(r => {
                            rekCls.innerHTML += `<option value="${r}">${r}</option>`;
                        });
                        rekCls.disabled = false;
                    }
                    document.getElementById('rekap-placeholder').classList.remove('hidden');
                    document.getElementById('rekap-summary').classList.add('hidden');
                    document.getElementById('rekap-table-container').classList.add('hidden');
                    document.getElementById('btn-export-pdf').disabled = true;
                };

                rekCls.onchange = () => {
                    if(rekCls.value) {
                        SantriModule.renderRekap(rekCls.value);
                    }
                };
            }
            
            // Export PDF
            document.getElementById('btn-export-pdf').onclick = SantriModule.exportPDF;
        },

        renderRekap: (cls) => {
            const lvl = cls.charAt(0);
            const students = State.santriDB[lvl][cls] || [];
            const tbody = document.getElementById('rekap-table-body');
            tbody.innerHTML = '';
            let grandTotal = 0;

            students.forEach((s, i) => {
                let qris = 0, tf = 0, cash = 0;
                State.history.allData.forEach(d => {
                    // Simple fuzzy match logic
                    if(d.NamaSantri && d.NamaSantri.includes(s.nama) && (d.KelasSantri === cls || d.rombelSantri === cls)) {
                        const val = parseInt(d.Nominal) || 0;
                        if(d.MetodePembayaran === 'QRIS') qris += val;
                        else if(d.MetodePembayaran === 'Transfer') tf += val;
                        else cash += val;
                    }
                });
                const sub = qris + tf + cash;
                grandTotal += sub;

                tbody.innerHTML += `
                <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-orange-50 transition">
                    <td class="px-6 py-4 font-medium text-slate-900">${i+1}</td>
                    <td class="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">${s.nama}</td>
                    <td class="px-6 py-4 text-right font-mono text-slate-500">${qris > 0 ? Utils.formatRupiah(qris) : '-'}</td>
                    <td class="px-6 py-4 text-right font-mono text-slate-500">${tf > 0 ? Utils.formatRupiah(tf) : '-'}</td>
                    <td class="px-6 py-4 text-right font-mono text-slate-500">${cash > 0 ? Utils.formatRupiah(cash) : '-'}</td>
                    <td class="px-6 py-4 text-right font-bold text-slate-800 bg-slate-50/50">${sub > 0 ? Utils.formatRupiah(sub) : '-'}</td>
                </tr>`;
            });

            document.getElementById('rekap-placeholder').classList.add('hidden');
            document.getElementById('rekap-summary').classList.remove('hidden');
            document.getElementById('rekap-table-container').classList.remove('hidden');
            document.getElementById('rekap-total-kelas').innerText = Utils.formatRupiah(grandTotal);
            document.getElementById('rekap-wali').innerText = `Wali Kelas ${cls}`; // Placeholder
            document.getElementById('rekap-musyrif').innerText = `Musyrif ${cls}`; // Placeholder
            document.getElementById('btn-export-pdf').disabled = false;
        },

        exportPDF: () => {
            if(!window.jspdf) return Utils.showToast("Library PDF gagal dimuat", "error");
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
    };

    // --- INITIALIZATION & PUBLIC API ---
    const init = () => {
        Navigation.init();
        Wizard.init();
        SantriModule.init();
        HistoryModule.setupEvents();
        NewsModule.setup();
    };

    // PUBLIC FUNCTIONS (Untuk dipanggil dari onclick HTML)
    return {
        init,
        // Mapping fungsi internal ke publik
        nav: Navigation.showPage,
        scrollTo: Navigation.scrollToSection,
        copy: Utils.copyText,
        filterNews: (cat) => {
            State.news.category = cat;
            State.news.page = 1;
            State.news.posts = [];
            NewsModule.fetch();
            // UI Update for buttons
            document.querySelectorAll('.news-filter-btn').forEach(b => {
                if(b.innerText.includes(cat || 'Semua') || b.getAttribute('onclick').includes(cat)) {
                    b.classList.remove('bg-white', 'text-slate-600');
                    b.classList.add('bg-slate-900', 'text-white');
                } else {
                    b.classList.add('bg-white', 'text-slate-600');
                    b.classList.remove('bg-slate-900', 'text-white');
                }
            });
        },
        handleNewsSearch: (e) => {
            if(e.key === 'Enter') {
                State.news.search = e.target.value;
                State.news.page = 1;
                State.news.posts = [];
                NewsModule.fetch();
            }
        },
        loadMoreNews: () => {
            State.news.page++;
            NewsModule.fetch(true);
        },
        openNews: (idx) => {
            const post = State.news.posts[idx];
            if(!post) return;
            const modal = document.getElementById('news-modal');
            const content = document.getElementById('news-modal-content');
            
            content.innerHTML = `
                <div class="relative h-64 md:h-96">
                    <img src="${post.featured_image}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
                    <div class="absolute bottom-0 left-0 p-8 w-full">
                        <span class="bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold uppercase mb-2 inline-block">${Object.values(post.categories)[0]?.name}</span>
                        <h2 class="text-2xl md:text-4xl font-black text-white leading-tight shadow-black drop-shadow-lg">${post.title}</h2>
                        <div class="flex items-center gap-3 mt-4 text-white/80 text-sm">
                            <i class="far fa-clock"></i> ${new Date(post.date).toLocaleDateString('id-ID', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}
                        </div>
                    </div>
                </div>
                <div class="p-8 md:p-12 max-w-4xl mx-auto text-slate-700 leading-loose text-lg font-serif">
                    ${post.content}
                </div>
            `;
            modal.classList.remove('hidden', 'opacity-0');
            setTimeout(() => document.getElementById('news-modal-panel').classList.remove('translate-y-full', 'scale-95'), 10);
            document.body.style.overflow = 'hidden';
        },
        closeNewsModal: () => {
            const modal = document.getElementById('news-modal');
            const panel = document.getElementById('news-modal-panel');
            panel.classList.add('translate-y-full');
            setTimeout(() => {
                modal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }, 300);
        },
        openQris: (key) => {
            const db = {
                bni: { title: 'BNI', img: 'https://drive.google.com/thumbnail?id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt&sz=w1000', url: 'https://drive.google.com/uc?export=download&id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt' },
                bsi: { title: 'BSI', img: 'https://drive.google.com/thumbnail?id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V&sz=w1000', url: 'https://drive.google.com/uc?export=download&id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V' },
                bpd: { title: 'BPD DIY', img: 'https://drive.google.com/thumbnail?id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm&sz=w1000', url: 'https://drive.google.com/uc?export=download&id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm' }
            };
            const d = db[key];
            if(d) {
                document.getElementById('qris-modal-title').innerText = `Scan QRIS ${d.title}`;
                document.getElementById('qris-modal-img').src = d.img;
                document.getElementById('qris-modal-btn').href = d.url;
                document.getElementById('qris-modal').classList.remove('hidden');
                setTimeout(() => document.getElementById('qris-modal-panel').classList.remove('scale-95'), 10);
            }
        },
        closeQris: () => {
            document.getElementById('qris-modal-panel').classList.add('scale-95');
            setTimeout(() => document.getElementById('qris-modal').classList.add('hidden'), 200);
        }
    };
})();

// --- GLOBAL ALIASES (JEMBATAN PENGHUBUNG) ---
// Ini bagian terpenting agar HTML onclick="..." berfungsi!
window.showPage = LazismuApp.nav;
window.scrollToSection = LazismuApp.scrollTo;
window.copyText = LazismuApp.copy;
window.filterNews = LazismuApp.filterNews;
window.handleNewsSearch = LazismuApp.handleNewsSearch;
window.loadMoreNews = LazismuApp.loadMoreNews;
window.closeNewsModal = LazismuApp.closeNewsModal;
window.openQrisModal = LazismuApp.openQris; // Perhatikan nama fungsinya disamakan dengan HTML
window.closeQrisModal = LazismuApp.closeQris;

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    LazismuApp.init();
});
