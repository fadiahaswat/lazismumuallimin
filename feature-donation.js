import { donasiData, currentUser } from './state.js';
import { formatRupiah, showToast, generateUniqueCode } from './utils.js';
import { STEP_TITLES, GAS_API_URL } from './config.js';
import { santriDB } from './santri-manager.js';
import { showPage } from './ui-navigation.js';

// --- FUNGSI NAVIGASI WIZARD ---

function updateStepTitle(step) {
    const titleEl = document.getElementById('wizard-title');
    const subEl = document.getElementById('wizard-subtitle');
    const data = STEP_TITLES[step - 1];
    if (data && titleEl && subEl) {
        titleEl.innerText = data.title;
        subEl.innerText = data.subtitle;
    }
}

export function goToStep(step) {
    document.querySelectorAll('.donasi-step-container').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`donasi-step-${step}`);
    if (target) {
        target.classList.remove('hidden');
        target.classList.remove('animate-fade-in-up');
        void target.offsetWidth; // Trigger reflow
        target.classList.add('animate-fade-in-up');
    }
    
    // Logika Kartu Saran Login di Step 3
    if (step === 3) {
        const suggestionCard = document.getElementById('login-suggestion-card');
        if (suggestionCard && !currentUser) {
            suggestionCard.classList.remove('hidden');
        } else if (suggestionCard) {
            suggestionCard.classList.add('hidden');
        }
    }

    const indicator = document.getElementById('wizard-step-indicator');
    const bar = document.getElementById('wizard-progress-bar');

    if (indicator) indicator.innerText = `Step ${step}/5`;
    if (bar) bar.style.width = `${step * 20}%`;

    updateStepTitle(step);

    const wizard = document.getElementById('donasi-wizard');
    if (wizard) wizard.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

export function startBeautificationDonation(nominalPaket = 0) {
    // 1. Buka Halaman Donasi
    showPage('donasi');
    
    // 2. Reset ke Langkah 1
    goToStep(1);

    // 3. Otomatis Klik Tombol "Infaq"
    const btnInfaq = document.querySelector('button[data-type="Infaq"]');
    if (btnInfaq) btnInfaq.click();

    // 4. Tunggu animasi sebentar, lalu pilih "Pengembangan Kampus"
    setTimeout(() => {
        const btnKampus = document.querySelector('button[data-type-infaq="Infaq Pengembangan Kampus"]');
        if (btnKampus) btnKampus.click();

        // 5. Tunggu lagi, lalu pindah ke langkah Nominal
        setTimeout(() => {
            goToStep(2); 

            const inputCustom = document.getElementById('nominal-custom');
            
            if (nominalPaket > 0) {
                // Jika memilih paket
                donasiData.nominal = nominalPaket;
                donasiData.nominalAsli = nominalPaket;
                
                if(inputCustom) inputCustom.value = donasiData.nominal.toLocaleString('id-ID');
                
                // Matikan seleksi tombol biasa agar tidak bingung
                document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
                
                showToast(`Paket Donasi ${formatRupiah(nominalPaket)} terpilih`, 'success');
            } else {
                // Jika memilih Wakaf Tunai (Bebas)
                donasiData.nominal = 0;
                donasiData.nominalAsli = 0;
                if(inputCustom) {
                    inputCustom.value = '';
                    inputCustom.focus();
                }
            }
        }, 500); 
    }, 300); 
}

export function setupWizardLogic() {
    // --- LANGKAH 1: Pilih Jenis Donasi ---
    document.querySelectorAll('.choice-button').forEach(btn => {
        btn.onclick = () => {
            // 1. Reset Visual Semua Tombol
            document.querySelectorAll('.choice-button').forEach(b => {
                b.classList.remove('active'); 
                b.classList.remove('border-emerald-500', 'bg-emerald-50');
                b.classList.remove('border-amber-500', 'bg-amber-50');
                b.classList.remove('border-orange-500', 'bg-orange-50');
                b.classList.add('border-slate-100'); 
            });

            // 2. Set Active State
            btn.classList.add('active'); 
            btn.classList.remove('border-slate-100'); 

            // 3. Tambahkan Warna Spesifik Sesuai Tipe
            const type = btn.dataset.type;
            
            // Reset Nominal & Input saat ganti jenis
            donasiData.nominal = 0;
            donasiData.nominalAsli = 0; 
            const inputCustom = document.getElementById('nominal-custom');
            if(inputCustom) inputCustom.value = ''; 
            document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected')); 
            
            if (type === 'Zakat Fitrah') {
                btn.classList.add('border-emerald-500', 'bg-emerald-50');
            } else if (type === 'Zakat Maal') {
                btn.classList.add('border-amber-500', 'bg-amber-50');
            } else if (type === 'Infaq') {
                btn.classList.add('border-orange-500', 'bg-orange-50');
            }

            // 4. Update Data Logic
            donasiData.type = type;
            donasiData.subType = null;

            const infaqOpts = document.getElementById('infaq-options');
            const zakatFitrah = document.getElementById('zakat-fitrah-checker');
            const zakatMaal = document.getElementById('zakat-maal-checker');
            const step1Nav = document.getElementById('step-1-nav-default');

            // Hide All Sections
            if (infaqOpts) infaqOpts.classList.add('hidden');
            if (zakatFitrah) zakatFitrah.classList.add('hidden');
            if (zakatMaal) zakatMaal.classList.add('hidden');
            if (step1Nav) step1Nav.classList.add('hidden');

            // Show Specific Section
            if (type === 'Infaq' && infaqOpts) {
                infaqOpts.classList.remove('hidden');
                document.querySelectorAll('.sub-choice-button').forEach(b => {
                    b.classList.remove('active', 'border-rose-500', 'bg-rose-50', 'border-sky-500', 'bg-sky-50', 'border-violet-500', 'bg-violet-50');
                    b.classList.add('border-slate-200');
                });
            } 
            else if (type === 'Zakat Fitrah' && zakatFitrah) {
                zakatFitrah.classList.remove('hidden');
                if(step1Nav) step1Nav.classList.remove('hidden'); 
            } 
            else if (type === 'Zakat Maal' && zakatMaal) {
                zakatMaal.classList.remove('hidden');
            }
        };
    });

    // --- Sub-Pilihan Infaq ---
    document.querySelectorAll('.sub-choice-button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.sub-choice-button').forEach(b => {
                b.classList.remove('active');
                b.classList.remove('border-rose-500', 'bg-rose-50');
                b.classList.remove('border-sky-500', 'bg-sky-50');
                b.classList.remove('border-violet-500', 'bg-violet-50');
                b.classList.add('border-slate-200');
            });

            btn.classList.add('active');
            btn.classList.remove('border-slate-200');

            const subType = btn.dataset.typeInfaq;
            if (subType.includes('Kampus')) btn.classList.add('border-rose-500', 'bg-rose-50');
            else if (subType.includes('Beasiswa')) btn.classList.add('border-sky-500', 'bg-sky-50');
            else if (subType.includes('Umum')) btn.classList.add('border-violet-500', 'bg-violet-50');

            donasiData.subType = subType;
            
            const step1Nav = document.getElementById('step-1-nav-default');
            if (step1Nav) step1Nav.classList.remove('hidden');
        };
    });

    // --- Logika Zakat Fitrah ---
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

    // --- Logika Zakat Maal ---
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

    const btnMaalNext = document.getElementById('btn-maal-next');
    if (btnMaalNext) btnMaalNext.onclick = () => goToStep(3);

    const btnZakatSkip = document.getElementById('zakat-lanjutkan-infaq');
    if (btnZakatSkip) {
        btnZakatSkip.onclick = () => {
            const infaqBtn = document.querySelector('[data-type="Infaq"]');
            if (infaqBtn) infaqBtn.click();
        };
    }

    // Tombol Lanjut Step 1
    const btnNextStep2 = document.querySelector('[data-next-step="2"]');
    if (btnNextStep2) {
        btnNextStep2.onclick = () => {
            if (donasiData.type === 'Infaq' && !donasiData.subType) return showToast("Pilih peruntukan infaq terlebih dahulu");
            goToStep(2);
        };
    }

    // --- LANGKAH 2: Tentukan Nominal ---
    document.querySelectorAll('.nominal-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nominal-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            donasiData.nominal = parseInt(btn.dataset.nominal);
            donasiData.nominalAsli = donasiData.nominal;
            
            const customInput = document.getElementById('nominal-custom');
            if (customInput) {
                customInput.value = donasiData.nominal.toLocaleString('id-ID');
            }
        };
    });

    const nominalCustom = document.getElementById('nominal-custom');
    if (nominalCustom) {
        nominalCustom.addEventListener('input', function() {
            let val = this.value.replace(/\D/g, '');
            
            donasiData.nominal = parseInt(val) || 0;
            donasiData.nominalAsli = donasiData.nominal;
            
            if (val === '') {
                this.value = '';
            } else {
                this.value = donasiData.nominal.toLocaleString('id-ID');
            }
            
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

    // --- LANGKAH 3: Isi Data Muzakki ---
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
                donasiData.namaSantri = '';
                donasiData.nisSantri = '';
                donasiData.rombelSantri = '';
                
                if(santriLevel) santriLevel.value = '';
                if(santriRombel) { santriRombel.innerHTML = '<option value="">Rombel</option>'; santriRombel.disabled = true; }
                if(santriNama) { santriNama.innerHTML = '<option value="">Pilih Nama Santri</option>'; santriNama.disabled = true; }
            }
        };
    });

    const checkAlsoAlumni = document.getElementById('check-also-alumni');
    if (checkAlsoAlumni) {
        checkAlsoAlumni.onchange = (e) => {
            const alumniInput = document.getElementById('input-alumni-tahun');
            if (alumniInput) {
                if (e.target.checked) {
                    alumniInput.classList.remove('hidden');
                } else {
                    alumniInput.classList.add('hidden');
                }
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
            if (isAlsoAlumni && alumniInput && !alumniInput.value) return showToast("Tahun lulus wajib diisi bagi Alumni");
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

    // --- LANGKAH 4: Metode Pembayaran ---
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const divSudah = document.getElementById('div-sudah-transfer');
            const checkSudah = document.getElementById('check-sudah-transfer');
            
            if (divSudah) {
                if (e.target.value === 'Transfer' || e.target.value === 'QRIS') {
                    divSudah.classList.remove('hidden');
                    divSudah.classList.add('animate-fade-in-up');
                } else {
                    divSudah.classList.add('hidden');
                    if (checkSudah) checkSudah.checked = false; 
                }
            }
        });
    });

    const btnNextStep5 = document.querySelector('[data-next-step="5"]');
    if (btnNextStep5) {
        btnNextStep5.onclick = () => {
            const method = document.querySelector('input[name="payment-method"]:checked');
            if (!method) return showToast("Pilih metode pembayaran");

            donasiData.metode = method.value;

            // 1. Pastikan nominal asli aman
            if (!donasiData.nominalAsli) {
                donasiData.nominalAsli = donasiData.nominal;
            }

            // 2. Reset Default
            donasiData.kodeUnik = 0;
            donasiData.nominalTotal = donasiData.nominalAsli;

            // 3. Ambil Status Checkbox "Sudah Transfer"
            const checkSudahTransfer = document.getElementById('check-sudah-transfer');
            const isAlreadyTransferred = checkSudahTransfer ? checkSudahTransfer.checked : false;

            // 4. Logika Kode Unik
            const isDigital = (donasiData.metode === 'Transfer' || donasiData.metode === 'QRIS');
            const isZakat = (donasiData.type === 'Zakat Fitrah' || donasiData.type === 'Zakat Maal');

            if (isDigital && !isZakat && !isAlreadyTransferred) {
                const kodeUnik = generateUniqueCode(); 
                donasiData.kodeUnik = kodeUnik;
                donasiData.nominalTotal = donasiData.nominalAsli + kodeUnik;
            }

            // 5. Update UI Ringkasan
            document.getElementById('summary-type').innerText = donasiData.subType || donasiData.type;
            const elNominalSummary = document.getElementById('summary-nominal');
            elNominalSummary.innerText = formatRupiah(donasiData.nominalTotal);

            const oldMsg = document.getElementById('msg-kode-unik-summary');
            if (oldMsg) oldMsg.remove();

            if (donasiData.kodeUnik > 0) {
                const htmlPesan = `
                    <div id="msg-kode-unik-summary" class="mt-2 text-right animate-fade-in-up">
                        <span class="inline-block bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded border border-yellow-200">
                            <i class="fas fa-asterisk text-[8px] mr-1"></i>Kode Unik: ${donasiData.kodeUnik} (Masuk ke donasi)
                        </span>
                    </div>`;
                elNominalSummary.insertAdjacentHTML('afterend', htmlPesan);
            }
            
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

    // --- LANGKAH TERAKHIR: Kirim Data ---
    const btnSubmitFinal = document.getElementById('btn-submit-final');
    if (btnSubmitFinal) {
        btnSubmitFinal.onclick = async () => {
            const btn = document.getElementById('btn-submit-final');
            const check = document.getElementById('confirm-check');

            if (!check || !check.checked) return showToast("Mohon centang pernyataan konfirmasi");

            // 1. Ubah tombol jadi Loading
            btn.disabled = true;
            btn.querySelector('.default-text').classList.add('hidden');
            btn.querySelector('.loading-text').classList.remove('hidden');

            // 2. Siapkan Data (Payload)
            const payload = {
                "type": donasiData.subType || donasiData.type,
                "nominal": donasiData.nominalTotal, 
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
                // 3. Kirim ke Google Apps Script
                await fetch(GAS_API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: "create", payload: payload })
                });

                // 4. Update Data Tampilan di Halaman Sukses
                const finalNominal = document.getElementById('final-nominal-display');
                const finalType = document.getElementById('final-type-display');
                const finalName = document.getElementById('final-name-display');
                const summaryType = document.getElementById('summary-type');
                const summaryName = document.getElementById('summary-nama');

                if (finalNominal) {
                    finalNominal.innerText = formatRupiah(donasiData.nominalTotal);
                    
                    // --- INFO KODE UNIK (KUNING) ---
                    const oldFinalMsg = document.getElementById('msg-kode-unik-final');
                    if (oldFinalMsg) oldFinalMsg.remove();

                    if (donasiData.kodeUnik > 0) {
                        finalNominal.classList.remove('mb-4');
                        finalNominal.classList.add('mb-2');

                        const htmlFinalPesan = `
                            <div id="msg-kode-unik-final" class="mb-6 flex justify-center animate-fade-in-up">
                                <div class="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm max-w-xs">
                                    <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0">
                                        <i class="fas fa-exclamation text-sm"></i>
                                    </div>
                                    <div class="text-left">
                                        <p class="text-[10px] font-bold text-yellow-800 uppercase tracking-wide mb-0.5">PENTING</p>
                                        <p class="text-xs text-slate-600 leading-tight">
                                            Mohon transfer tepat hingga <span class="font-black text-orange-600 border-b-2 border-orange-200">${donasiData.kodeUnik}</span> digit terakhir agar terverifikasi otomatis.
                                        </p>
                                    </div>
                                </div>
                            </div>`;
                        finalNominal.insertAdjacentHTML('afterend', htmlFinalPesan);
                    }
                }

                if (finalType && summaryType) finalType.innerText = summaryType.innerText;
                if (finalName && summaryName) finalName.innerText = summaryName.innerText;

                // Tampilkan Modal Sukses (Wadah Utama)
                const modal = document.getElementById('success-modal');
                if (modal) modal.classList.remove('hidden');

                // --- 5. GENERATE KONTEN INTRUKSI PEMBAYARAN & DOA ---
                
                // A. Generate Doa
                const prayerHTML = `
                    <div class="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white rounded-3xl border border-emerald-100 shadow-lg p-8 md:p-10 mb-8 text-center group hover:shadow-xl transition-all duration-500">
                        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-300 via-teal-400 to-emerald-300"></div>
                        <div class="absolute -top-10 -left-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                        <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                        <div class="relative z-10">
                            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-emerald-100 shadow-sm text-emerald-600 mb-6 group-hover:scale-110 transition-transform duration-300"><i class="fas fa-praying-hands text-xl"></i></div>
                            <h3 class="font-arabic text-2xl md:text-3xl font-black text-emerald-900 leading-[2.5] mb-6 drop-shadow-sm tracking-wide" dir="rtl">
                                آجَرَكَ اللَّهُ فِيمَا أَعْطَيْتَ، وَبَارَكَ اللَّهُ فِيمَا أَبْقَيْتَ، وَجَعَلَهُ لَكَ طَهُورًا
                            </h3>
                            <div class="flex items-center justify-center gap-3 opacity-60 mb-6"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span class="w-16 h-0.5 rounded-full bg-gradient-to-r from-transparent via-emerald-300 to-transparent"></span><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span></div>
                            <p class="text-slate-600 text-sm italic leading-relaxed max-w-2xl mx-auto">
                                "Semoga Allah memberikan pahala atas apa yang engkau berikan, dan semoga Allah memberkahimu atas apa yang masih ada di tanganmu dan menjadikannya sebagai pembersih (dosa) bagimu."
                            </p>
                        </div>
                    </div>
                `;

                // B. Generate Metode Pembayaran
                let paymentDetails = '';
                
                if (donasiData.metode === 'QRIS') {
                    paymentDetails = `
                        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <div class="flex items-center justify-center gap-2 mb-6">
                                <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-lg"><i class="fas fa-qrcode"></i></div>
                                <h4 class="font-bold text-slate-800 text-lg">Pindai QRIS</h4>
                            </div>
                            
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div onclick="openQrisModal('bni')" class="group cursor-pointer border border-slate-200 rounded-2xl p-4 hover:border-orange-500 hover:shadow-md transition-all text-center flex flex-col items-center justify-between h-full bg-slate-50/50 hover:bg-white">
                                    <div class="h-8 flex items-center mb-3"><img src="bank-bni.png" class="h-full object-contain"></div>
                                    <button class="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wide group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition">Lihat QR</button>
                                </div>
                                <div onclick="openQrisModal('bsi')" class="group cursor-pointer border border-slate-200 rounded-2xl p-4 hover:border-teal-500 hover:shadow-md transition-all text-center flex flex-col items-center justify-between h-full bg-slate-50/50 hover:bg-white">
                                    <div class="h-10 flex items-center mb-3"><img src="bank-bsi.png" class="h-full object-contain"></div>
                                    <button class="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wide group-hover:bg-teal-500 group-hover:text-white group-hover:border-teal-500 transition">Lihat QR</button>
                                </div>
                                <div onclick="openQrisModal('bpd')" class="group cursor-pointer border border-slate-200 rounded-2xl p-4 hover:border-blue-500 hover:shadow-md transition-all text-center flex flex-col items-center justify-between h-full bg-slate-50/50 hover:bg-white">
                                    <div class="h-8 flex items-center mb-3"><img src="bank-bpd.png" class="h-full object-contain"></div>
                                    <button class="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wide group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition">Lihat QR</button>
                                </div>
                            </div>
                            <p class="text-center text-[10px] text-slate-400 mt-4 bg-slate-50 py-2 rounded-lg"><i class="fas fa-info-circle mr-1"></i> Mendukung GoPay, OVO, Dana, ShopeePay, & Mobile Banking</p>
                        </div>`;
                
                } else if (donasiData.metode === 'Transfer') {
                    paymentDetails = `
                        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                            <div class="flex items-center justify-center gap-2 mb-4">
                                <div class="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-lg"><i class="fas fa-university"></i></div>
                                <h4 class="font-bold text-slate-800 text-lg">Transfer Bank</h4>
                            </div>
                            
                            <div class="flex flex-col sm:flex-row items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-orange-200 hover:bg-orange-50/30 transition-all gap-4 group">
                                <div class="flex items-center gap-4 w-full sm:w-auto">
                                    <div class="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-sm">
                                        <img src="bank-bni.png" class="w-full h-full object-contain">
                                    </div>
                                    <div class="text-left">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank BNI</p>
                                        <p class="text-lg font-black text-slate-700 tracking-tight group-hover:text-orange-600 transition-colors">3440 000 348</p>
                                    </div>
                                </div>
                                <button onclick="copyText('3440000348')" class="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-orange-500 hover:text-white hover:border-orange-500 transition flex items-center justify-center gap-2 shadow-sm active:scale-95">
                                    <i class="far fa-copy"></i> Salin
                                </button>
                            </div>

                            <div class="flex flex-col sm:flex-row items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-teal-200 hover:bg-teal-50/30 transition-all gap-4 group">
                                <div class="flex items-center gap-4 w-full sm:w-auto">
                                    <div class="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-sm">
                                        <img src="bank-bsi.png" class="w-full h-full object-contain">
                                    </div>
                                    <div class="text-left">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BSI (Syariah)</p>
                                        <p class="text-lg font-black text-slate-700 tracking-tight group-hover:text-teal-600 transition-colors">7930 030 303</p>
                                    </div>
                                </div>
                                <button onclick="copyText('7930030303')" class="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-teal-500 hover:text-white hover:border-teal-500 transition flex items-center justify-center gap-2 shadow-sm active:scale-95">
                                    <i class="far fa-copy"></i> Salin
                                </button>
                            </div>

                            <div class="flex flex-col sm:flex-row items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/30 transition-all gap-4 group">
                                <div class="flex items-center gap-4 w-full sm:w-auto">
                                    <div class="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-sm">
                                        <img src="bank-bpd.png" class="w-full h-full object-contain">
                                    </div>
                                    <div class="text-left">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BPD DIY Syariah</p>
                                        <p class="text-lg font-black text-slate-700 tracking-tight group-hover:text-blue-600 transition-colors">801 241 004 624</p>
                                    </div>
                                </div>
                                <button onclick="copyText('801241004624')" class="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-blue-500 hover:text-white hover:border-blue-500 transition flex items-center justify-center gap-2 shadow-sm active:scale-95">
                                    <i class="far fa-copy"></i> Salin
                                </button>
                            </div>
                        </div>`;
                
                } else {
                    // Tampilan Tunai
                    paymentDetails = `
                        <div class="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 text-center">
                            <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-emerald-600 text-3xl"><i class="fas fa-handshake"></i></div>
                            <h4 class="font-black text-emerald-900 text-xl mb-1">Layanan Kantor</h4>
                            <p class="text-emerald-700 text-sm">Silakan datang langsung ke kantor Lazismu Mu'allimin.</p>
                        </div>`;
                }

                // C. Masukkan ke Container yang Tepat
                const prayerContainer = document.getElementById('success-prayer-container');
                if (prayerContainer) prayerContainer.innerHTML = prayerHTML;

                const paymentContainer = document.getElementById('payment-methods-content');
                if (paymentContainer) paymentContainer.innerHTML = paymentDetails;

                // Tampilkan Wrapper Utama
                const wizard = document.getElementById('donasi-wizard');
                if (wizard) wizard.classList.add('hidden');

                const paymentInstr = document.getElementById('donasi-payment-instructions');
                if (paymentInstr) paymentInstr.classList.remove('hidden');

                // --- 6. SET UP WHATSAPP ---
                const waMsg = `Assalamu'alaikum Admin Lazismu Mu'allimin,\n\nSaya telah melakukan transfer donasi:\n\n• Nama: *${donasiData.nama}*\n• Jenis: ${donasiData.subType || donasiData.type}\n• Nominal: *${formatRupiah(donasiData.nominalTotal)}*\n\nMohon diverifikasi agar status donasi saya berubah menjadi *DITERIMA*. Terima kasih.`;
                
                const btnWa = document.getElementById('btn-wa-confirm');
                if (btnWa) {
                    btnWa.href = `https://wa.me/6281196961918?text=${encodeURIComponent(waMsg)}`;
                    
                    // --- HIMBAUAN KONFIRMASI ---
                    const waContainer = btnWa.parentElement; 
                    const oldAdvice = document.getElementById('wa-verification-advice');
                    if(oldAdvice) oldAdvice.remove();

                    const verificationAdvice = document.createElement('div');
                    verificationAdvice.id = 'wa-verification-advice';
                    verificationAdvice.className = 'mb-3 bg-blue-50 border border-blue-100 rounded-xl p-3 text-center animate-pulse';
                    verificationAdvice.innerHTML = `
                        <div class="flex items-center justify-center gap-2 text-blue-700 mb-1">
                            <i class="fas fa-bell"></i>
                            <span class="text-xs font-black uppercase tracking-wider">Langkah Terakhir</span>
                        </div>
                        <p class="text-xs text-slate-600 leading-tight">
                            Agar donasi Anda segera diverifikasi Admin dan status berubah menjadi <strong class="text-green-600">DITERIMA</strong>, mohon kirim bukti transfer sekarang.
                        </p>
                    `;
                    waContainer.insertBefore(verificationAdvice, btnWa);
                }

            } catch (e) {
                showToast("Gagal mengirim data: " + e.message, "error");
                btn.disabled = false;
                btn.querySelector('.default-text').classList.remove('hidden');
                btn.querySelector('.loading-text').classList.add('hidden');
            }
        };
    }

    const successContinue = document.getElementById('success-modal-continue');
    if (successContinue) {
        successContinue.onclick = () => {
            const modal = document.getElementById('success-modal');
            if (modal) modal.classList.add('hidden');
            
            // Reload riwayat jika diperlukan
            if (window.location.hash === '#riwayat') {
               // LoadRiwayat will be called in main if needed via exposed method, or auto refresh if implemented
            } else if (window.location.hash === '#dashboard' && typeof currentUser !== 'undefined') {
                // Dashboard logic
            }

            const paymentInstr = document.getElementById('donasi-payment-instructions');
            if (paymentInstr) paymentInstr.scrollIntoView({ behavior: 'smooth' });
        };
    }

    document.querySelectorAll('[data-prev-step]').forEach(btn => {
        btn.onclick = () => goToStep(parseInt(btn.dataset.prevStep));
    });
}

/* =========================================
   ZAKAT MAAL LOGIC (UPDATED 2025)
   ========================================= */

// KONSTANTA NISAB (SK BAZNAS No. 13 Tahun 2025)
const NISAB_TAHUN = 85685972; 
const NISAB_BULAN = 7140498; 

let currentZakatMode = 'manual';

// 1. FUNGSI SWITCH MODE (MANUAL <-> KALKULATOR)
function switchZakatMode(mode) {
    currentZakatMode = mode;
    
    const btnManual = document.getElementById('btn-mode-manual');
    const btnCalc = document.getElementById('btn-mode-calculator');
    const divManual = document.getElementById('mode-manual');
    const divCalc = document.getElementById('mode-calculator');

    if (mode === 'manual') {
        // Tampilan
        btnManual.className = "flex-1 py-2 text-sm font-bold rounded-lg bg-white text-emerald-600 shadow-sm transition-all";
        btnCalc.className = "flex-1 py-2 text-sm font-bold rounded-lg text-slate-500 hover:text-emerald-600 transition-all";
        
        divManual.classList.remove('hidden');
        divCalc.classList.add('hidden');
        
        // Reset Input Hidden Form Utama jika ada
        // document.getElementById('amount').value = document.getElementById('manual-zakat-input').value; 
    } else {
        // Tampilan
        btnCalc.className = "flex-1 py-2 text-sm font-bold rounded-lg bg-white text-emerald-600 shadow-sm transition-all";
        btnManual.className = "flex-1 py-2 text-sm font-bold rounded-lg text-slate-500 hover:text-emerald-600 transition-all";
        
        divCalc.classList.remove('hidden');
        divManual.classList.add('hidden');
    }
}

// 2. FUNGSI HITUNG ZAKAT (KALKULATOR)
function calculateZakat() {
    // Ambil semua input kalkulator
    const inputs = document.querySelectorAll('.calc-input');
    let totalHarta = 0;
    let hutang = 0;

    // Loop 3 input pertama (Aset)
    for(let i=0; i<3; i++) {
        let val = inputs[i].value.replace(/[^0-9]/g, '');
        totalHarta += parseInt(val || 0);
    }

    // Input ke-4 adalah Hutang
    let valHutang = inputs[3].value.replace(/[^0-9]/g, '');
    hutang = parseInt(valHutang || 0);

    const hartaBersih = totalHarta - hutang;

    // Tampilkan Hasil
    document.getElementById('calc-result').classList.remove('hidden');
    document.getElementById('total-harta').innerText = formatRupiahDisplay(hartaBersih);

    const divWajib = document.getElementById('status-wajib');
    const divTidak = document.getElementById('status-tidak-wajib');

    // Cek Nisab
    if (hartaBersih >= NISAB_TAHUN) {
        divWajib.classList.remove('hidden');
        divTidak.classList.add('hidden');

        // Hitung 2.5%
        const zakat = Math.ceil(hartaBersih * 0.025);
        document.getElementById('final-zakat-amount').innerText = formatRupiahDisplay(zakat);
        document.getElementById('final-zakat-amount').dataset.value = zakat; // Simpan nilai asli
    } else {
        divWajib.classList.add('hidden');
        divTidak.classList.remove('hidden');
    }
}

// 3. FUNGSI TERAPKAN HASIL KALKULATOR KE INPUT MANUAL
function applyZakatResult() {
    const nominal = document.getElementById('final-zakat-amount').dataset.value;
    
    // Pindah ke mode manual
    switchZakatMode('manual');
    
    // Isi input manual dengan hasil hitungan
    const inputManual = document.getElementById('manual-zakat-input');
    inputManual.value = formatRupiahDisplay(nominal);
    
    // Trigger event input agar format Rupiah berjalan (jika ada listener lain)
    inputManual.dispatchEvent(new Event('input'));
}

// Helper Format Rupiah (Jika belum ada di script.js)
function formatRupiahDisplay(angka) {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Listener untuk Input Manual (Sync ke variabel global donasi)
document.getElementById('manual-zakat-input').addEventListener('input', function(e) {
    // Logika untuk menyimpan nilai ke state donasi global aplikasi Anda
    // Contoh: donationState.amount = cleanNumber(e.target.value);
});
