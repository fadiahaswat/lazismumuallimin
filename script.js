const LazismuApp = (() => {
    // --- CONFIGURATION ---
    const CONFIG = {
        API: {
            GAS: "https://script.google.com/macros/s/AKfycbydrhNmtJEk-lHLfrAzI8dG_uOZEKk72edPAEeL9pzVCna6br_hY2dAqDr-t8V5ost4/exec",
            WP: "lazismumuallimin.wordpress.com",
            WA: "6281196961918"
        },
        NEWS: {
            PER_PAGE: 6
        },
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
            type: null,
            subType: null,
            nominal: 0,
            donaturTipe: 'santri',
            isAlumni: false,
            alumniTahun: '',
            namaSantri: '', nisSantri: '', rombelSantri: '',
            nama: '', hp: '', email: '', alamat: '', doa: '', nik: '',
            metode: null
        },
        news: {
            page: 1,
            category: '',
            search: '',
            posts: [],
            isLoading: false,
            hasMore: true,
            isLoaded: false
        },
        history: {
            allData: [],
            isLoaded: false,
            currentPage: 1,
            itemsPerPage: 10,
            timeFilter: 'all'
        },
        santriDB: {}
    };

    // --- UTILITIES ---
    const Utils = {
        formatRupiah: (num) => "Rp " + parseInt(num || 0).toLocaleString('id-ID'),
        
        showToast: (message, type = 'warning') => {
            const container = document.getElementById('toast-container');
            if (!container) return;
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            let icon = type === 'success' ? 'fa-check-circle text-green-500' : 
                       type === 'error' ? 'fa-times-circle text-red-500' : 
                       'fa-exclamation-triangle text-orange-500';

            toast.innerHTML = `<i class="fas ${icon} text-xl"></i><span class="font-bold text-sm text-slate-700">${message}</span>`;
            container.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        },

        copyText: (text) => {
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(text).then(() => Utils.showToast(`Berhasil disalin: ${text}`, 'success'));
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    Utils.showToast(`Berhasil disalin: ${text}`, 'success');
                } catch (err) {
                    Utils.showToast('Gagal menyalin text', 'error');
                }
                document.body.removeChild(textArea);
            }
        },

        timeAgo: (date) => {
            const seconds = Math.floor((new Date() - new Date(date)) / 1000);
            const intervals = { thn: 31536000, bln: 2592000, hr: 86400, jam: 3600, mnt: 60 };
            
            for (const [unit, secondsInUnit] of Object.entries(intervals)) {
                const interval = seconds / secondsInUnit;
                if (interval > 1) return Math.floor(interval) + " " + unit + " lalu";
            }
            return "Baru saja";
        },

        stripHtml: (html) => {
            let tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || "";
        },

        animateValue: (obj, start, end, duration, isCurrency = false) => {
            if (!obj) return;
            let startTimestamp = null;
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
            const res = await fetch(CONFIG.API.GAS);
            const json = await res.json();
            return json.status === 'success' ? json.data.reverse() : [];
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
            const hash = window.location.hash.replace('#', '') || 'home';
            Navigation.showPage(hash);
            
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
        },

        showPage: (pageId) => {
            const target = document.getElementById(`page-${pageId}`) || document.getElementById('page-home');
            const actualId = target.id.replace('page-', '');

            document.querySelectorAll('.page-section').forEach(p => {
                p.style.display = 'none';
                p.style.opacity = 0;
                p.classList.remove('active');
            });
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

            target.style.display = 'block';
            void target.offsetWidth; 
            target.style.opacity = 1;
            target.classList.add('active');
            
            const navLink = document.querySelector(`a[href="#${actualId}"]`);
            if (navLink) navLink.classList.add('active');

            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Module Lazy Loading
            if (actualId === 'riwayat' || actualId === 'home') HistoryModule.load();
            if (actualId === 'berita' && !State.news.isLoaded) NewsModule.fetch();
        }
    };

    // --- MODULE: DONATION WIZARD ---
    const Wizard = {
        init: () => {
            Wizard.bindEvents();
            Wizard.setupZakatCalculator();
            Wizard.setupSantriInputs();
            Wizard.updateStepUI(1);
        },

        bindEvents: () => {
            // Step 1: Type Selection
            document.querySelectorAll('.choice-button').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.choice-button').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    State.donation.type = btn.dataset.type;
                    State.donation.subType = null;
                    Wizard.handleTypeSelection(btn.dataset.type);
                };
            });

            document.querySelectorAll('.sub-choice-button').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.sub-choice-button').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    State.donation.subType = btn.dataset.typeInfaq;
                    document.getElementById('step-1-nav-default')?.classList.remove('hidden');
                };
            });

            // Step 2: Nominal
            document.querySelectorAll('.nominal-btn').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    State.donation.nominal = parseInt(btn.dataset.nominal);
                    const customInput = document.getElementById('nominal-custom');
                    if (customInput) customInput.value = Utils.formatRupiah(State.donation.nominal);
                };
            });

            const nominalCustom = document.getElementById('nominal-custom');
            if (nominalCustom) {
                nominalCustom.addEventListener('input', function() {
                    let val = this.value.replace(/\D/g, '');
                    State.donation.nominal = parseInt(val) || 0;
                    this.value = Utils.formatRupiah(State.donation.nominal);
                    document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
                });
            }

            // Step 4: Donator Details
            const checkAlsoAlumni = document.getElementById('check-also-alumni');
            if(checkAlsoAlumni) {
                checkAlsoAlumni.onchange = (e) => {
                    const el = document.getElementById('input-alumni-tahun');
                    if(el) e.target.checked ? el.classList.remove('hidden') : el.classList.add('hidden');
                };
            }

            document.querySelectorAll('input[name="donatur-tipe"]').forEach(r => {
                r.onchange = (e) => {
                    State.donation.donaturTipe = e.target.value;
                    Wizard.toggleSantriFields(e.target.value === 'santri');
                };
            });

            // Navigation Buttons
            document.querySelectorAll('[data-next-step]').forEach(btn => {
                btn.onclick = () => Wizard.validateAndGo(parseInt(btn.dataset.nextStep));
            });

            // Final Submit
            const btnSubmit = document.getElementById('btn-submit-final');
            if (btnSubmit) btnSubmit.onclick = Wizard.submit;
        },

        handleTypeSelection: (type) => {
            const els = {
                infaq: document.getElementById('infaq-options'),
                fitrah: document.getElementById('zakat-fitrah-checker'),
                maal: document.getElementById('zakat-maal-checker'),
                nav: document.getElementById('step-1-nav-default')
            };

            Object.values(els).forEach(el => el?.classList.add('hidden'));

            if (type === 'Infaq') els.infaq?.classList.remove('hidden');
            else if (type === 'Zakat Fitrah') els.fitrah?.classList.remove('hidden');
            else if (type === 'Zakat Maal') els.maal?.classList.remove('hidden');
        },

        setupZakatCalculator: () => {
            // Fitrah
            const fitrahInput = document.getElementById('fitrah-jumlah-orang');
            if (fitrahInput) {
                fitrahInput.oninput = (e) => {
                    const total = (parseInt(e.target.value) || 0) * CONFIG.DONATION.FITRAH_PER_SOUL;
                    document.getElementById('fitrah-total').value = Utils.formatRupiah(total);
                    State.donation.nominal = total;
                };
            }
            
            // Maal
            const btnCheck = document.getElementById('zakat-check-button');
            if (btnCheck) {
                btnCheck.onclick = () => {
                    const emas = parseInt(document.getElementById('harga-emas').value.replace(/\D/g,'')) || 0;
                    const hasil = parseInt(document.getElementById('penghasilan-bulanan').value.replace(/\D/g,'')) || 0;
                    const nisab = (emas * CONFIG.DONATION.GOLD_GRAMS_NISAB) / 12;
                    
                    document.getElementById('zakat-result').classList.remove('hidden');
                    const msg = document.getElementById('zakat-result-message');
                    const btnMaal = document.getElementById('btn-maal-next');

                    if (hasil >= nisab) {
                        const zakat = hasil * CONFIG.DONATION.ZAKAT_RATE;
                        msg.innerHTML = `<span class="text-green-600 block">WAJIB ZAKAT</span>Kewajiban: ${Utils.formatRupiah(zakat)}`;
                        State.donation.nominal = zakat;
                        btnMaal?.classList.remove('hidden');
                    } else {
                        msg.innerHTML = `<span class="text-orange-600 block">BELUM WAJIB</span>Belum mencapai nishab (${Utils.formatRupiah(nisab)})`;
                        btnMaal?.classList.add('hidden');
                    }
                };
            }
        },

        setupSantriInputs: () => {
            const lvlSelect = document.getElementById('santri-level-select');
            const rombelSelect = document.getElementById('santri-rombel-select');
            const namaSelect = document.getElementById('santri-nama-select');

            if (lvlSelect) {
                lvlSelect.onchange = () => {
                    rombelSelect.innerHTML = '<option value="">Rombel</option>';
                    rombelSelect.disabled = true;
                    const lvl = lvlSelect.value;
                    if (lvl && State.santriDB[lvl]) {
                        Object.keys(State.santriDB[lvl]).forEach(r => {
                            rombelSelect.innerHTML += `<option value="${r}">${r}</option>`;
                        });
                        rombelSelect.disabled = false;
                    }
                };
            }

            if (rombelSelect) {
                rombelSelect.onchange = () => {
                    namaSelect.innerHTML = '<option value="">Pilih Nama Santri</option>';
                    namaSelect.disabled = true;
                    const lvl = lvlSelect.value;
                    const rmb = rombelSelect.value;
                    if (lvl && rmb && State.santriDB[lvl][rmb]) {
                        State.santriDB[lvl][rmb].forEach(s => {
                            namaSelect.innerHTML += `<option value="${s.nama}::${s.nis}::${s.rombel}">${s.nama}</option>`;
                        });
                        namaSelect.disabled = false;
                    }
                };
            }

            if (namaSelect) {
                namaSelect.onchange = () => {
                    const [nama, nis, rombel] = namaSelect.value.split('::');
                    State.donation.namaSantri = nama;
                    State.donation.nisSantri = nis;
                    State.donation.rombelSantri = rombel;
                    
                    const radioAnSantri = document.getElementById('radio-an-santri');
                    if (radioAnSantri) {
                        radioAnSantri.disabled = false;
                        if(radioAnSantri.checked) {
                             document.getElementById('nama-muzakki-input').value = `A/n Santri: ${nama}`;
                        }
                    }
                };
            }
        },

        toggleSantriFields: (show) => {
            const els = {
                details: document.getElementById('santri-details'),
                alumni: document.getElementById('input-alumni-tahun'),
                radioAn: document.getElementById('radio-an-santri')
            };
            const checkAlso = document.getElementById('check-also-alumni');

            if (show) {
                els.details?.classList.remove('hidden');
                if (checkAlso.checked) els.alumni?.classList.remove('hidden');
                else els.alumni?.classList.add('hidden');
            } else {
                els.details?.classList.add('hidden');
                if (checkAlso.checked) els.alumni?.classList.remove('hidden');
                els.radioAn.disabled = true;
            }
        },

        validateAndGo: (step) => {
            if (step === 2) {
                if (State.donation.type === 'Infaq' && !State.donation.subType) return Utils.showToast("Pilih peruntukan infaq");
                if (State.donation.type === 'Zakat Fitrah' && State.donation.nominal < CONFIG.DONATION.FITRAH_PER_SOUL) return Utils.showToast("Minimal 1 jiwa");
            }
            if (step === 3) {
                if (State.donation.nominal < CONFIG.DONATION.MIN_NOMINAL) return Utils.showToast(`Minimal Rp ${CONFIG.DONATION.MIN_NOMINAL}`);
            }
            if (step === 4) {
                const required = {
                    nama: document.getElementById('nama-muzakki-input')?.value,
                    hp: document.getElementById('no-hp')?.value,
                    alamat: document.getElementById('alamat')?.value
                };
                
                if (State.donation.donaturTipe === 'santri' && !State.donation.namaSantri) return Utils.showToast("Wajib memilih data santri");
                if (!required.nama || !required.hp || !required.alamat) return Utils.showToast("Data diri wajib diisi");

                // Populate State
                State.donation.nama = required.nama;
                State.donation.hp = required.hp;
                State.donation.alamat = required.alamat;
                State.donation.email = document.getElementById('email')?.value || '';
                State.donation.doa = document.getElementById('pesan-doa')?.value || '';
                State.donation.nik = document.getElementById('no-ktp')?.value || '';
                State.donation.alumniTahun = document.getElementById('alumni-tahun')?.value || '';
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
            document.querySelectorAll('.donasi-step-container').forEach(s => s.classList.add('hidden'));
            const target = document.getElementById(`donasi-step-${step}`);
            if (target) {
                target.classList.remove('hidden');
                target.classList.add('animate-fade-in-up');
            }

            const titles = ["Pilih Jenis", "Nominal", "Data Diri", "Pembayaran", "Konfirmasi"];
            document.getElementById('wizard-step-indicator').innerText = `Step ${step}/5`;
            document.getElementById('wizard-title').innerText = titles[step-1];
            document.getElementById('wizard-progress-bar').style.width = `${step * 20}%`;
            
            document.getElementById('donasi-wizard')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },

        renderSummary: () => {
            document.getElementById('summary-type').innerText = State.donation.subType || State.donation.type;
            document.getElementById('summary-nominal').innerText = Utils.formatRupiah(State.donation.nominal);
            document.getElementById('summary-nama').innerText = State.donation.nama;
            document.getElementById('summary-hp').innerText = State.donation.hp;
            document.getElementById('summary-metode').innerText = State.donation.metode;
            
            const santriRow = document.getElementById('summary-santri-row');
            if(State.donation.donaturTipe === 'santri' && State.donation.namaSantri) {
                santriRow.classList.remove('hidden');
                document.getElementById('summary-santri').innerText = `${State.donation.namaSantri} (${State.donation.rombelSantri})`;
            } else {
                santriRow.classList.add('hidden');
            }
        },

        submit: async () => {
            const check = document.getElementById('confirm-check');
            if(!check || !check.checked) return Utils.showToast("Centang konfirmasi data", "warning");

            const btn = document.getElementById('btn-submit-final');
            btn.disabled = true;
            btn.querySelector('.default-text').classList.add('hidden');
            btn.querySelector('.loading-text').classList.remove('hidden');

            // Set final summary
            document.getElementById('final-nominal-display').innerText = Utils.formatRupiah(State.donation.nominal);
            document.getElementById('final-type-display').innerText = State.donation.subType || State.donation.type;
            document.getElementById('final-name-display').innerText = State.donation.nama;

            try {
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
                    DetailAlumni: State.donation.alumniTahun,
                    namaSantri: State.donation.namaSantri,
                    nisSantri: State.donation.nisSantri,
                    rombelSantri: State.donation.rombelSantri,
                    NoKTP: State.donation.nik
                };

                await API.submitDonation(payload);

                // Success UI
                document.getElementById('donasi-wizard').classList.add('hidden');
                document.getElementById('donasi-payment-instructions').classList.remove('hidden');
                document.getElementById('success-modal').classList.remove('hidden');

                const waMsg = `Assalamu'alaikum, konfirmasi donasi: ${payload.type} - ${Utils.formatRupiah(payload.nominal)} - ${payload.nama}`;
                document.getElementById('btn-wa-confirm').href = `https://wa.me/${CONFIG.API.WA}?text=${encodeURIComponent(waMsg)}`;
                
                Wizard.renderPaymentInstructions();

            } catch (e) {
                console.error(e);
                Utils.showToast("Gagal mengirim data", "error");
                btn.disabled = false;
                btn.querySelector('.default-text').classList.remove('hidden');
                btn.querySelector('.loading-text').classList.add('hidden');
            }
        },

        renderPaymentInstructions: () => {
            let html = '';
            if (State.donation.metode === 'QRIS') {
                html = `
                <div class="text-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p class="font-bold text-slate-700 mb-4">Scan QRIS Berikut:</p>
                    <div class="grid grid-cols-3 gap-3 mb-4">
                        <div class="bg-white p-2 border rounded"><img src="https://drive.google.com/thumbnail?id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt" class="w-full"></div>
                        <div class="bg-white p-2 border rounded"><img src="https://drive.google.com/thumbnail?id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V" class="w-full"></div>
                        <div class="bg-white p-2 border rounded"><img src="https://drive.google.com/thumbnail?id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm" class="w-full"></div>
                    </div>
                </div>`;
            } else if (State.donation.metode === 'Transfer') {
                const accounts = [
                    { bank: 'BNI', num: '3440000348', color: 'orange' },
                    { bank: 'BSI', num: '7930030303', color: 'teal' },
                    { bank: 'BPD DIY', num: '801241004624', color: 'blue' }
                ];
                html = '<div class="space-y-3">' + accounts.map(acc => `
                    <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div><span class="font-bold block text-slate-700">${acc.bank}</span><span class="text-sm font-mono text-slate-500">${acc.num}</span></div>
                        <button onclick="LazismuApp.copy('${acc.num}')" class="text-${acc.color}-500 text-xs font-bold border border-${acc.color}-200 px-3 py-1.5 rounded-lg">Salin</button>
                    </div>`).join('') + '</div>';
            } else {
                html = `<div class="p-8 bg-blue-50 rounded-2xl text-center border border-blue-100"><p class="text-blue-900 font-bold">Pembayaran Tunai</p><p class="text-sm">Silakan serahkan donasi di Kantor Layanan.</p></div>`;
            }

            const prayer = `<div class="mb-8 text-center p-6 bg-green-50/50 rounded-2xl border border-green-100/50"><p class="font-arabic text-2xl text-green-800 mb-3 font-bold">آجَرَكَ اللَّهُ فِيمَا أَعْطَيْتَ...</p></div>`;
            document.getElementById('instruction-content').innerHTML = prayer + html;
        }
    };

    // --- MODULE: HISTORY ---
    const HistoryModule = {
        load: async () => {
            if (State.history.isLoaded) return;
            const loader = document.getElementById('riwayat-loading');
            const content = document.getElementById('riwayat-content');
            
            loader?.classList.remove('hidden');
            content?.classList.add('hidden');

            try {
                State.history.allData = await API.fetchHistory();
                State.history.isLoaded = true;
                
                HistoryModule.calculateStats();
                HistoryModule.renderHomeWidgets();
                HistoryModule.renderList();
                HistoryModule.renderPagination();
                
                loader?.classList.add('hidden');
                content?.classList.remove('hidden');
            } catch (e) {
                if (loader) loader.innerHTML = '<p class="text-red-500">Gagal memuat data.</p>';
            }
        },

        getFiltered: () => {
            let data = State.history.allData;
            const filters = {
                type: document.getElementById('filter-jenis')?.value,
                method: document.getElementById('filter-metode')?.value,
                start: document.getElementById('filter-start-date')?.value,
                end: document.getElementById('filter-end-date')?.value
            };

            if (filters.type && filters.type !== 'all') data = data.filter(d => (d.JenisDonasi || d.type) === filters.type);
            if (filters.method && filters.method !== 'all') data = data.filter(d => (d.MetodePembayaran || d.metode) === filters.method);
            
            if (filters.start || filters.end) {
                const s = filters.start ? new Date(filters.start) : new Date(0);
                const e = filters.end ? new Date(filters.end) : new Date();
                e.setHours(23, 59, 59);
                data = data.filter(d => {
                    const time = new Date(d.Timestamp);
                    return time >= s && time <= e;
                });
            }

            if (State.history.timeFilter !== 'all') {
                const now = new Date();
                data = data.filter(d => {
                    const date = new Date(d.Timestamp);
                    if (State.history.timeFilter === 'today') return date.toDateString() === now.toDateString();
                    if (State.history.timeFilter === 'year') return date.getFullYear() === now.getFullYear();
                    return true;
                });
            }
            return data;
        },

        renderList: () => {
            const container = document.getElementById('riwayat-list-container');
            if (!container) return;

            const data = HistoryModule.getFiltered();
            const start = (State.history.currentPage - 1) * State.history.itemsPerPage;
            const pageData = data.slice(start, start + State.history.itemsPerPage);

            document.getElementById('riwayat-no-data')?.classList.toggle('hidden', pageData.length > 0);
            
            container.innerHTML = pageData.map(item => {
                const type = item.SubJenis || item.JenisDonasi || "Donasi";
                const method = item.MetodePembayaran || "Tunai";
                const nominal = parseInt(item.Nominal) || 0;
                
                let icon = 'fa-donate', color = 'text-slate-400', bg = 'bg-slate-100';
                if(type.includes('Fitrah')) { icon='fa-leaf'; color='text-emerald-600'; bg='bg-emerald-100'; }
                else if(type.includes('Maal')) { icon='fa-coins'; color='text-yellow-600'; bg='bg-yellow-100'; }
                else { icon='fa-hand-holding-heart'; color='text-orange-600'; bg='bg-orange-100'; }

                return `
                <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition group">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center text-xl"><i class="fas ${icon}"></i></div>
                            <div>
                                <h4 class="font-bold text-slate-800">${item.NamaDonatur || 'Hamba Allah'}</h4>
                                <span class="text-xs font-bold text-slate-500 uppercase">${type}</span>
                                <span class="text-[10px] px-2 py-0.5 rounded border ml-2">${method}</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="block font-black text-lg text-slate-800">${Utils.formatRupiah(nominal)}</span>
                            <span class="text-xs text-slate-400">${Utils.timeAgo(item.Timestamp)}</span>
                        </div>
                    </div>
                </div>`;
            }).join('');
        },

        renderPagination: () => {
            const total = HistoryModule.getFiltered().length;
            const pages = Math.ceil(total / State.history.itemsPerPage);
            document.getElementById('riwayat-page-info').innerText = `Page ${State.history.currentPage} of ${pages || 1}`;
            document.getElementById('riwayat-prev').disabled = State.history.currentPage === 1;
            document.getElementById('riwayat-next').disabled = State.history.currentPage >= pages || pages === 0;
        },

        setupEvents: () => {
            document.getElementById('riwayat-prev')?.addEventListener('click', () => {
                if(State.history.currentPage > 1) { State.history.currentPage--; HistoryModule.renderList(); HistoryModule.renderPagination(); }
            });
            document.getElementById('riwayat-next')?.addEventListener('click', () => {
                const max = Math.ceil(HistoryModule.getFiltered().length / State.history.itemsPerPage);
                if(State.history.currentPage < max) { State.history.currentPage++; HistoryModule.renderList(); HistoryModule.renderPagination(); }
            });
            ['filter-jenis', 'filter-metode', 'filter-start-date', 'filter-end-date'].forEach(id => {
                document.getElementById(id)?.addEventListener('change', () => {
                    State.history.currentPage = 1;
                    HistoryModule.renderList();
                    HistoryModule.renderPagination();
                });
            });
        },
        
        // Placeholder for extensive statistics logic 
        calculateStats: () => { 
            const data = State.history.allData;
            let total = 0;
            data.forEach(d => total += (parseInt(d.Nominal)||0));
            Utils.animateValue(document.getElementById('stat-total-donasi'), 0, total, 2000, true);
        },

        renderHomeWidgets: () => {
            const container = document.getElementById('home-latest-donations');
            if(!container) return;
            const latest = State.history.allData.slice(0, 6);
            
            let html = latest.map(item => `
                <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:-translate-y-1 transition h-full flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                             <div class="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><i class="fas fa-hand-holding-heart"></i></div>
                             <span class="text-[10px] font-bold bg-slate-50 px-2 py-1 rounded border">${item.SubJenis || item.JenisDonasi}</span>
                        </div>
                        <h5 class="font-bold text-slate-800 text-sm truncate">${item.NamaDonatur || 'Hamba Allah'}</h5>
                        <div class="font-black text-lg text-slate-800">${parseInt(item.Nominal).toLocaleString('id-ID')}</div>
                    </div>
                    <div class="mt-2 text-[10px] text-slate-400"><i class="far fa-clock"></i> ${Utils.timeAgo(item.Timestamp)}</div>
                </div>
            `).join('');
            
            // Add CTA Card
            html += `<div onclick="LazismuApp.nav('donasi')" class="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white cursor-pointer hover:-translate-y-1 transition flex flex-col items-center justify-center text-center"><i class="fas fa-heart text-3xl mb-2"></i><span class="font-bold">Donasi Sekarang</span></div>`;
            container.innerHTML = html;
        }
    };

    // --- MODULE: NEWS ---
    const NewsModule = {
        fetch: async (isLoadMore = false) => {
            if (State.news.isLoading) return;
            State.news.isLoading = true;
            
            const btnMore = document.getElementById('btn-news-load-more');
            if(isLoadMore && btnMore) btnMore.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            else document.getElementById('news-grid').innerHTML = '<div class="col-span-full text-center py-10"><div class="animate-spin inline-block w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full"></div></div>';

            try {
                const data = await API.fetchNews(State.news.page, State.news.category, State.news.search);
                State.news.isLoading = false;
                State.news.isLoaded = true;
                State.news.hasMore = data.posts.length >= CONFIG.NEWS.PER_PAGE;

                if (isLoadMore) State.news.posts = [...State.news.posts, ...data.posts];
                else State.news.posts = data.posts;

                NewsModule.render(isLoadMore);
                
                if (btnMore) {
                    btnMore.innerHTML = 'Muat Lebih Banyak';
                    btnMore.classList.toggle('hidden', !State.news.hasMore);
                }
            } catch (e) {
                State.news.isLoading = false;
                document.getElementById('news-grid').innerHTML = '<p class="text-center text-red-500 col-span-full">Gagal memuat berita.</p>';
            }
        },

        render: (append) => {
            const container = document.getElementById('news-grid');
            const posts = State.news.posts;
            const newPosts = append ? posts.slice(posts.length - CONFIG.NEWS.PER_PAGE) : posts;
            
            if (posts.length === 0) {
                container.innerHTML = `<div class="col-span-full text-center py-20"><p class="text-slate-400">Tidak ada berita.</p></div>`;
                return;
            }

            const html = newPosts.map((post, i) => {
                const idx = append ? (posts.length - newPosts.length + i) : i;
                const img = post.featured_image || 'https://via.placeholder.com/600x400';
                return `
                <div class="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition overflow-hidden cursor-pointer" onclick="LazismuApp.openNews(${idx})">
                    <div class="h-48 overflow-hidden relative">
                        <img src="${img}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
                        <span class="absolute bottom-3 left-3 bg-white/90 px-3 py-1 rounded-lg text-xs font-bold uppercase">${Object.values(post.categories)[0]?.name || 'Umum'}</span>
                    </div>
                    <div class="p-6">
                        <h3 class="font-bold text-lg text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-600">${post.title}</h3>
                        <p class="text-slate-500 text-sm line-clamp-3">${Utils.stripHtml(post.excerpt)}</p>
                    </div>
                </div>`;
            }).join('');

            if(append) container.innerHTML += html;
            else container.innerHTML = html;
        },

        setupCategories: async () => {
            try {
                const data = await API.fetchCategories();
                const container = document.getElementById('news-filter-container');
                if (data.categories && container) {
                    let html = `<button onclick="LazismuApp.filterNews('')" class="news-filter-btn active bg-brand-orange text-white px-4 py-2 rounded-lg text-sm font-bold">Semua</button>`;
                    data.categories.forEach(cat => {
                        if (cat.post_count > 0) {
                            html += `<button onclick="LazismuApp.filterNews('${cat.slug}')" class="news-filter-btn bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium ml-2">${cat.name}</button>`;
                        }
                    });
                    container.innerHTML = html;
                }
            } catch (e) { console.error(e); }
        }
    };

    // --- MODULE: SANTRI PARSER ---
    const SantriModule = {
        parse: () => {
            if (typeof rawSantriData === 'undefined') return;
            const lines = rawSantriData.trim().split('\n');
            lines.forEach(line => {
                const parts = line.split('\t');
                if (parts.length < 3) return;
                const [rombel, nis, nama] = parts.map(s => s.trim());
                const level = rombel.charAt(0);
                
                if (!State.santriDB[level]) State.santriDB[level] = {};
                if (!State.santriDB[level][rombel]) State.santriDB[level][rombel] = [];
                State.santriDB[level][rombel].push({ nama, nis, rombel });
            });
        },
        
        setupRekap: () => {
            const lvl = document.getElementById('rekap-level-select');
            const cls = document.getElementById('rekap-kelas-select');
            if(!lvl || !cls) return;

            lvl.onchange = () => {
                cls.innerHTML = '<option value="">-- Pilih Kelas --</option>';
                if (lvl.value && State.santriDB[lvl.value]) {
                    cls.disabled = false;
                    Object.keys(State.santriDB[lvl.value]).sort().forEach(c => {
                        cls.innerHTML += `<option value="${c}">Kelas ${c}</option>`;
                    });
                } else cls.disabled = true;
                document.getElementById('rekap-table-container').classList.add('hidden');
            };

            cls.onchange = () => {
                if(cls.value) {
                    document.getElementById('rekap-table-container').classList.remove('hidden');
                    SantriModule.renderTable(cls.value);
                }
            };
            
            document.getElementById('btn-export-pdf')?.addEventListener('click', SantriModule.exportPDF);
        },

        renderTable: (cls) => {
            const tbody = document.getElementById('rekap-table-body');
            tbody.innerHTML = '';
            const students = State.santriDB[cls.charAt(0)][cls] || [];
            let total = 0;

            students.forEach((s, i) => {
                let qris=0, tf=0, cash=0;
                State.history.allData.forEach(d => {
                    if(d.NamaSantri?.includes(s.nama) && (d.KelasSantri === cls || d.rombelSantri === cls)) {
                        const v = parseInt(d.Nominal)||0;
                        if(d.MetodePembayaran === 'QRIS') qris+=v;
                        else if(d.MetodePembayaran === 'Transfer') tf+=v;
                        else cash+=v;
                    }
                });
                const sub = qris+tf+cash;
                total += sub;
                
                tbody.innerHTML += `
                <tr class="${i%2===0?'bg-white':'bg-slate-50'}">
                    <td class="px-6 py-4">${i+1}</td>
                    <td class="px-6 py-4 font-bold">${s.nama}</td>
                    <td class="px-6 py-4 text-right font-mono text-xs">${qris>0?Utils.formatRupiah(qris):'-'}</td>
                    <td class="px-6 py-4 text-right font-mono text-xs">${tf>0?Utils.formatRupiah(tf):'-'}</td>
                    <td class="px-6 py-4 text-right font-mono text-xs">${cash>0?Utils.formatRupiah(cash):'-'}</td>
                    <td class="px-6 py-4 text-right font-bold text-orange-600">${Utils.formatRupiah(sub)}</td>
                </tr>`;
            });
            document.getElementById('rekap-total-kelas').innerText = Utils.formatRupiah(total);
        },

        exportPDF: () => {
            if (!window.jspdf) return Utils.showToast("Library PDF Error", "error");
            const cls = document.getElementById('rekap-kelas-select').value;
            const doc = new window.jspdf.jsPDF();
            
            doc.setFontSize(18); doc.setTextColor(241, 90, 34);
            doc.text("REKAP ZIS KELAS " + cls, 14, 20);
            
            doc.autoTable({
                html: '#rekap-table-container table',
                startY: 30,
                theme: 'grid',
                headStyles: { fillColor: [241, 90, 34] },
                styles: { fontSize: 8 }
            });
            doc.save(`Rekap_ZIS_${cls}.pdf`);
        }
    };

    // --- INITIALIZATION ---
    const init = () => {
        SantriModule.parse();
        Navigation.init();
        Wizard.init();
        HistoryModule.setupEvents();
        NewsModule.setupCategories();
        SantriModule.setupRekap();
        
        // Expose functions for onclick in HTML
        return {
            nav: Navigation.showPage,
            copy: Utils.copyText,
            filterNews: (cat) => {
                State.news.category = cat;
                State.news.page = 1;
                State.news.posts = [];
                NewsModule.fetch();
                // Update UI buttons
                document.querySelectorAll('.news-filter-btn').forEach(b => {
                    if(b.innerText === (cat || 'Semua') || b.getAttribute('onclick').includes(cat)) {
                        b.classList.add('bg-brand-orange', 'text-white');
                        b.classList.remove('bg-gray-100', 'text-gray-600');
                    } else {
                        b.classList.remove('bg-brand-orange', 'text-white');
                        b.classList.add('bg-gray-100', 'text-gray-600');
                    }
                });
            },
            openNews: (idx) => {
                const post = State.news.posts[idx];
                const modal = document.getElementById('news-modal');
                if(!post || !modal) return;
                
                // Inject Content
                const content = document.getElementById('news-modal-content');
                content.innerHTML = `
                    <div class="h-[40vh] w-full relative"><img src="${post.featured_image}" class="w-full h-full object-cover"><div class="absolute inset-0 bg-black/50 flex items-end p-8"><h2 class="text-3xl font-bold text-white">${post.title}</h2></div></div>
                    <div class="p-8 max-w-3xl mx-auto text-lg leading-relaxed text-slate-700 font-serif">${post.content}</div>
                    <div class="p-8 text-center bg-slate-50"><button onclick="LazismuApp.closeNews()" class="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold">Tutup</button></div>
                `;
                modal.classList.remove('hidden');
                setTimeout(() => { modal.classList.remove('opacity-0'); document.getElementById('news-modal-panel').classList.remove('translate-y-full'); }, 10);
                document.body.style.overflow = 'hidden';
            },
            closeNews: () => {
                const modal = document.getElementById('news-modal');
                modal.classList.add('opacity-0');
                document.getElementById('news-modal-panel').classList.add('translate-y-full');
                setTimeout(() => { modal.classList.add('hidden'); document.body.style.overflow = 'auto'; }, 300);
            },
            loadMoreNews: () => { State.news.page++; NewsModule.fetch(true); },
            openQris: (key) => {
                 const data = {
                    bni: { title: 'BNI', img: 'https://drive.google.com/thumbnail?id=1sVzvP6AUz_bYJ31CzQG2io9oJvdMDywt' },
                    bsi: { title: 'BSI', img: 'https://drive.google.com/thumbnail?id=1xNHeckecd8Pn_7dSOQ0KfGcl0I_FCY9V' },
                    bpd: { title: 'BPD', img: 'https://drive.google.com/thumbnail?id=1BHYcMAUp3OiVeRx2HwjPPEu2StcYiUpm' }
                 }[key];
                 if(data) {
                     document.getElementById('qris-modal').classList.remove('hidden');
                     document.getElementById('qris-modal-title').innerText = `QRIS ${data.title}`;
                     document.getElementById('qris-modal-img').src = data.img;
                 }
            },
            closeQris: () => document.getElementById('qris-modal').classList.add('hidden')
        };
    };

    return init();
})();

// Helper Global for raw data assumption
if (typeof rawSantriData === 'undefined') var rawSantriData = "";
