import { riwayatData, currentUser, timeFilterState, setTimeFilterState } from './state.js';
import { GAS_API_URL } from './config.js';
import { formatRupiah, timeAgo, animateValue, escapeHtml, showToast } from './utils.js';
import { showPage } from './ui-navigation.js';
import { renderGlobalLeaderboard } from './feature-recap.js';

// Mengambil data riwayat dari Google Sheet
export async function loadRiwayat(forceRefresh = false) {
    // Prevent concurrent calls with better locking
    if (!forceRefresh && (riwayatData.isLoaded || riwayatData.isLoading)) return; 
    
    riwayatData.isLoading = true; 

    const loader = document.getElementById('riwayat-loading');
    const content = document.getElementById('riwayat-content');

    if (loader) loader.classList.remove('hidden');
    if (content) content.classList.add('hidden');

    try {
        const res = await fetch(GAS_API_URL);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const json = await res.json();

        if (json.status === 'success') {
            riwayatData.allData = json.data.reverse();
            riwayatData.isLoaded = true;

            calculateStats(); // Hitung total donasi dll
            renderHomeLatestDonations(); // Tampilkan di halaman depan
            renderPagination();
            renderRiwayatList();
            
            // Render leaderboard jika data sudah siap
            renderGlobalLeaderboard();

            if (loader) loader.classList.add('hidden');
            if (content) content.classList.remove('hidden');

            if (riwayatData.allData.length === 0) {
                const noData = document.getElementById('riwayat-no-data');
                if (noData) noData.classList.remove('hidden');
            }
        }
    } catch (e) {
        if (loader) loader.innerHTML = '<p class="text-red-500">Gagal memuat data.</p>';
    } finally {
        riwayatData.isLoading = false; 
    }
}

export function setupHistoryLogic() {
    // Mengatur tombol Next/Prev halaman riwayat
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

    // Filter jenis donasi, metode, dan tanggal
    ['filter-jenis', 'filter-metode', 'filter-start-date', 'filter-end-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.onchange = () => {
            riwayatData.currentPage = 1;
            renderRiwayatList();
            renderPagination();
        };
    });

    // Filter cepat waktu (Hari ini, Minggu ini, dll)
    document.querySelectorAll('.time-filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.time-filter-btn').forEach(b => {
                b.classList.remove('bg-slate-900', 'text-white', 'shadow-md', 'active');
                b.classList.add('text-slate-500', 'hover:bg-white', 'hover:text-slate-700', 'hover:shadow-sm');
                b.classList.remove('bg-white');
            });

            btn.classList.remove('text-slate-500', 'hover:bg-white', 'hover:text-slate-700', 'hover:shadow-sm');
            btn.classList.add('bg-slate-900', 'text-white', 'shadow-md', 'active');

            setTimeFilterState(btn.dataset.time);
            riwayatData.currentPage = 1;
            renderRiwayatList();
            renderPagination();
        }
    });

    // Tombol Reset Filter
    const resetBtn = document.getElementById('btn-reset-filter');
    if (resetBtn) {
        resetBtn.onclick = () => {
            document.getElementById('filter-jenis').value = 'all';
            document.getElementById('filter-metode').value = 'all';
            document.getElementById('filter-start-date').value = '';
            document.getElementById('filter-end-date').value = '';

            setTimeFilterState('all');

            document.querySelectorAll('.time-filter-btn').forEach(b => {
                b.classList.remove('bg-slate-900', 'text-white', 'shadow-md', 'active');
                b.classList.add('text-slate-500', 'hover:bg-white', 'hover:text-slate-700', 'hover:shadow-sm');

                if (b.dataset.time === 'all') {
                    b.classList.remove('text-slate-500', 'hover:bg-white', 'hover:text-slate-700', 'hover:shadow-sm');
                    b.classList.add('bg-slate-900', 'text-white', 'shadow-md', 'active');
                }
            });

            riwayatData.currentPage = 1;
            renderRiwayatList();
            renderPagination();
        }
    }
}

// Menghitung statistik donasi (Total, Rata-rata, dll)
function calculateStats() {
    const data = riwayatData.allData;
    let total = 0;
    let todayTotal = 0;
    let maxDonation = 0;
    let maxDonationName = "-";
    const todayStr = new Date().toDateString();

    // Grade-level maps for classes 1-6
    const classMapByGrade = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };
    const santriDonasiByGrade = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };
    const santriFreqByGrade = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };
    const donationTypes = {};

    let totalFitrah = 0;
    let totalMaal = 0;
    let totalInfaq = 0;

    // Payment method statistics
    let totalQRIS = 0;
    let totalTransfer = 0;
    let totalTunai = 0;

    data.forEach(d => {
        // Hanya hitung donasi yang sudah Terverifikasi
        if (d.Status !== 'Terverifikasi') return;
        
        const val = parseInt(d.Nominal) || 0;
        total += val;
        if (val > maxDonation) {
            maxDonation = val;
            maxDonationName = d.NamaDonatur || "Hamba Allah";
        }

        const dateObj = new Date(d.Timestamp);
        if (dateObj.toDateString() === todayStr) todayTotal += val;

        const typeName = d.JenisDonasi || "Lainnya";
        donationTypes[typeName] = (donationTypes[typeName] || 0) + 1;

        // Track payment methods
        const metode = d.MetodePembayaran || "";
        if (metode === 'QRIS') totalQRIS += val;
        else if (metode === 'Transfer') totalTransfer += val;
        else if (metode === 'Tunai') totalTunai += val;

        if (typeName.includes('Fitrah')) totalFitrah += val;
        else if (typeName.includes('Maal')) totalMaal += val;
        else if (typeName.includes('Infaq')) totalInfaq += val;

        const rombel = d.KelasSantri || d.rombelSantri;
        const nama = d.NamaSantri || d.namaSantri;

        if (rombel && nama) {
            const lvl = parseInt(rombel.charAt(0));
            if (lvl >= 1 && lvl <= 6) {
                const mapClass = classMapByGrade[lvl];
                const mapSantri = santriDonasiByGrade[lvl];
                const mapFreq = santriFreqByGrade[lvl];

                mapClass[rombel] = (mapClass[rombel] || 0) + val;
                const key = `${nama} (${rombel})`;
                mapSantri[key] = (mapSantri[key] || 0) + val;
                mapFreq[key] = (mapFreq[key] || 0) + 1;
            }
        }
    });

    const getPopular = (obj) => {
        let popular = "-";
        let max = 0;
        for (const [key, count] of Object.entries(obj)) {
            if (count > max) {
                max = count;
                popular = key;
            }
        }
        return popular;
    };

    const popularType = getPopular(donationTypes);

    const setText = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.innerText = txt;
    };
    const getMax = (map, type = 'val', minThreshold = 500000) => {
        let maxK = 'N/A',
            maxV = 0;
        for (const [k, v] of Object.entries(map)) {
            if (v >= minThreshold && v > maxV) {
                maxV = v;
                maxK = k;
            }
        }
        return {
            key: maxK,
            val: type === 'val' ? formatRupiah(maxV) : maxV + 'x',
            rawVal: maxV
        };
    };

    const elTotal = document.getElementById('stat-total-donasi');
    if (elTotal) animateValue(elTotal, 0, total, 2000, true);

    const elTrans = document.getElementById('stat-total-transaksi');
    if (elTrans) animateValue(elTrans, 0, data.length, 1500);

    const elRata = document.getElementById('stat-donasi-rata');
    if (elRata) animateValue(elRata, 0, data.length ? total / data.length : 0, 1500, true);

    const elMax = document.getElementById('stat-donasi-tertinggi');
    if (elMax) animateValue(elMax, 0, maxDonation, 1500, true);
    setText('stat-donasi-tertinggi-nama', maxDonationName);

    const elRTotal = document.getElementById('stat-r-total');
    if (elRTotal) animateValue(elRTotal, 0, total, 2000, true);

    const elRTrans = document.getElementById('stat-r-transaksi');
    if (elRTrans) animateValue(elRTrans, 0, data.length, 1500);

    const elRHari = document.getElementById('stat-r-hari-ini');
    if (elRHari) animateValue(elRHari, 0, todayTotal, 1000, true);

    const elRTipe = document.getElementById('stat-r-tipe-top');
    if (elRTipe) elRTipe.innerText = popularType;

    const elDetFitrah = document.getElementById('stat-detail-fitrah');
    if (elDetFitrah) animateValue(elDetFitrah, 0, totalFitrah, 1500, true);

    const elDetMaal = document.getElementById('stat-detail-maal');
    if (elDetMaal) animateValue(elDetMaal, 0, totalMaal, 1500, true);

    const elDetInfaq = document.getElementById('stat-detail-infaq');
    if (elDetInfaq) animateValue(elDetInfaq, 0, totalInfaq, 1500, true);

    // Update statistics for each grade level (1-6)
    for (let grade = 1; grade <= 6; grade++) {
        const classMax = getMax(classMapByGrade[grade]);
        setText(`stat-kelas${grade}-kelas-max`, classMax.key);
        setText(`stat-kelas${grade}-kelas-total`, classMax.val);

        const santriMax = getMax(santriDonasiByGrade[grade]);
        const santriName = santriMax.key !== 'N/A' ? santriMax.key.split('(')[0] : 'Belum ada';
        setText(`stat-kelas${grade}-santri-max-donasi`, santriName);
        setText(`stat-kelas${grade}-santri-total-donasi`, santriMax.val);

        // For frequency, filter students who meet the minimum 500K donation threshold
        const freqFiltered = {};
        for (const [key, count] of Object.entries(santriFreqByGrade[grade])) {
            if (santriDonasiByGrade[grade][key] >= 500000) {
                freqFiltered[key] = count;
            }
        }
        // Get student with highest frequency; minThreshold=0 allows any count since we pre-filtered
        const santriFreq = getMax(freqFiltered, 'freq', 0);
        const freqName = santriFreq.key !== 'N/A' ? santriFreq.key.split('(')[0] : 'Belum ada';
        setText(`stat-kelas${grade}-santri-freq-nama`, freqName);
        setText(`stat-kelas${grade}-santri-freq-val`, santriFreq.val);
    }

    // Update payment method statistics
    const elQRIS = document.getElementById('stat-payment-qris');
    if (elQRIS) animateValue(elQRIS, 0, totalQRIS, 1500, true);
    
    const elTransfer = document.getElementById('stat-payment-transfer');
    if (elTransfer) animateValue(elTransfer, 0, totalTransfer, 1500, true);
    
    const elTunai = document.getElementById('stat-payment-tunai');
    if (elTunai) animateValue(elTunai, 0, totalTunai, 1500, true);

    // Update progress bars for payment methods
    const maxPayment = Math.max(totalQRIS, totalTransfer, totalTunai) || 1;
    const qrisBar = document.getElementById('stat-payment-qris-bar');
    const transferBar = document.getElementById('stat-payment-transfer-bar');
    const tunaiBar = document.getElementById('stat-payment-tunai-bar');
    
    if (qrisBar) setTimeout(() => qrisBar.style.width = `${(totalQRIS / maxPayment) * 100}%`, 100);
    if (transferBar) setTimeout(() => transferBar.style.width = `${(totalTransfer / maxPayment) * 100}%`, 200);
    if (tunaiBar) setTimeout(() => tunaiBar.style.width = `${(totalTunai / maxPayment) * 100}%`, 300);

    // Render alumni leaderboard
    renderAlumniLeaderboard();
}

// Menampilkan 6 donasi terbaru di halaman depan (Home)
export function renderHomeLatestDonations() {
    const container = document.getElementById('home-latest-donations');
    if (!container) return;

    // Filter hanya donasi yang sudah Terverifikasi
    const verified = riwayatData.allData.filter(d => d.Status === 'Terverifikasi');
    const latest = verified.slice(0, 6);

    if (latest.length === 0) {
        container.innerHTML = '<div class="text-center col-span-full py-4 text-slate-400 text-sm">Belum ada donasi. Jadilah yang pertama!</div>';
        return;
    }

    let html = latest.map(item => {
        let iconClass = 'fa-donate';
        let bgIcon = 'bg-slate-100 text-slate-400';
        let bgBadge = 'bg-slate-50 text-slate-600';

        const type = item.JenisDonasi || item.type || "";
        const subType = item.SubJenis || item.subType || "";
        const displayType = subType || type;

        let labelSebutan = "Donatur"; 

        if (displayType.toLowerCase().includes('zakat')) {
            labelSebutan = "Muzaki"; 
        } else if (displayType.toLowerCase().includes('infaq') || displayType.toLowerCase().includes('wakaf')) {
            labelSebutan = "Munfiq"; 
        }

        if (displayType.includes('Fitrah')) {
            iconClass = 'fa-bowl-rice';
            bgIcon = 'bg-emerald-100 text-emerald-600';
            bgBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
        } else if (displayType.includes('Maal')) {
            iconClass = 'fa-sack-dollar';
            bgIcon = 'bg-amber-100 text-amber-600';
            bgBadge = 'bg-amber-50 text-amber-700 border-amber-100';
        } else if (displayType.includes('Kampus')) {
            iconClass = 'fa-school';
            bgIcon = 'bg-rose-100 text-rose-600';
            bgBadge = 'bg-rose-50 text-rose-700 border-rose-100';
        } else if (displayType.includes('Beasiswa')) {
            iconClass = 'fa-user-graduate';
            bgIcon = 'bg-sky-100 text-sky-600';
            bgBadge = 'bg-sky-50 text-sky-700 border-sky-100';
        } else if (displayType.includes('Umum')) {
            iconClass = 'fa-parachute-box';
            bgIcon = 'bg-violet-100 text-violet-600';
            bgBadge = 'bg-violet-50 text-violet-700 border-violet-100';
        } else {
            iconClass = 'fa-hand-holding-heart';
            bgIcon = 'bg-orange-100 text-brand-orange';
            bgBadge = 'bg-orange-50 text-orange-700 border-orange-100';
        }

        return `
        <div class="relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 border border-slate-100 transition-all duration-300 group hover:-translate-y-1 h-full flex flex-col justify-between overflow-hidden">
            <div class="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 rotate-12">
                <i class="fas ${iconClass} text-9xl text-slate-800"></i>
            </div>

            <div class="relative z-10">
                <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl ${bgIcon} flex items-center justify-center text-lg shadow-sm ring-4 ring-white group-hover:scale-110 transition-transform duration-300">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    
                    <span class="text-[10px] font-bold ${bgBadge} border px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                        ${displayType}
                    </span>
                </div>

                <div>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">${labelSebutan}</p>
                    
                    <h5 class="font-bold text-slate-800 text-base mb-2 line-clamp-1" title="${escapeHtml(item.NamaDonatur) || 'Hamba Allah'}">
                        ${escapeHtml(item.NamaDonatur) || 'Hamba Allah'}
                    </h5>

                    <div class="bg-slate-50 rounded-xl p-3 border border-slate-100 group-hover:border-orange-200 group-hover:bg-orange-50/30 transition-colors">
                        <div class="flex items-baseline gap-1">
                            <span class="text-xs text-slate-500 font-medium">Rp</span>
                            <span class="text-xl md:text-2xl font-black text-slate-800 group-hover:text-orange-600 transition-colors">
                                ${(parseInt(item.Nominal) || 0).toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="relative z-10 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <div class="flex items-center gap-1.5">
                    <i class="far fa-clock text-orange-400"></i>
                    <span>${timeAgo(item.Timestamp)}</span>
                </div>
                
                <div class="flex items-center gap-1 opacity-70">
                   <span class="font-medium text-slate-500">Via Web</span>
                   <i class="fas fa-check-circle text-green-500"></i>
                </div>
            </div>
        </div>
        `;
    }).join('');

    html += `
        <div onclick="showPage('donasi')" class="group relative bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 shadow-xl shadow-orange-500/30 text-white cursor-pointer hover:-translate-y-2 transition-all duration-300 flex flex-col items-center justify-center text-center h-full min-h-[180px] overflow-hidden border border-white/20 ring-4 ring-orange-500/10 hover:ring-orange-500/30">
            <div class="absolute top-[-50%] left-[-50%] w-full h-full bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="absolute bottom-[-50%] right-[-50%] w-full h-full bg-yellow-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

            <div class="relative z-10">
                <div class="relative mb-4 mx-auto w-16">
                    <div class="absolute inset-0 bg-white/30 rounded-full blur-lg animate-pulse"></div>
                    <div class="relative w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition duration-300 shadow-inner">
                        <i class="fas fa-hand-holding-heart text-3xl drop-shadow-md group-hover:animate-pulse"></i>
                    </div>
                </div>

                <h5 class="font-black text-xl mb-1 tracking-tight">Mari Berbagi</h5>
                <p class="text-sm text-orange-50 font-medium mb-4 opacity-90">Jemput keberkahan harta Anda hari ini.</p>
                
                <span class="inline-flex items-center gap-2 bg-white text-orange-600 text-xs font-bold px-5 py-2 rounded-full shadow-lg group-hover:bg-orange-50 transition-colors">
                    Tunaikan Sekarang <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                </span>
            </div>
        </div>
    `;

    html += `
        <div onclick="showPage('riwayat')" class="group relative cursor-pointer h-full min-h-[180px] w-full">
            <div class="absolute inset-0 bg-blue-100 rounded-2xl transform translate-x-2 translate-y-2 rotate-2 group-hover:rotate-6 group-hover:translate-x-3 group-hover:translate-y-3 transition-all duration-300"></div>
            <div class="absolute inset-0 bg-slate-100 rounded-2xl transform translate-x-1 translate-y-1 rotate-1 group-hover:rotate-3 group-hover:translate-x-1.5 group-hover:translate-y-1.5 transition-all duration-300"></div>
            
            <div class="relative bg-white rounded-2xl p-5 border border-slate-200 shadow-sm group-hover:shadow-xl group-hover:border-blue-300 group-hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center h-full text-center overflow-hidden">
                
                <div class="absolute -right-4 -top-4 opacity-[0.05] group-hover:opacity-1 transition-opacity rotate-12">
                    <i class="fas fa-layer-group text-8xl text-blue-600"></i>
                </div>

                <div class="relative z-10 w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mb-3 shadow-inner group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                    <i class="fas fa-arrow-right text-lg group-hover:-rotate-45 transition-transform duration-300"></i>
                </div>
                
                <span class="font-bold text-base text-slate-700 group-hover:text-blue-600 transition-colors">Lihat Semua</span>
                <span class="text-xs text-slate-400 mt-1 group-hover:text-blue-500/80">Buka arsip lengkap</span>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Render alumni leaderboard (Desain Baru: Ranked by Total Donation)
export function renderAlumniLeaderboard() {
    const container = document.getElementById('alumni-leaderboard-container');
    if (!container) return;

    // 1. State: Loading
    if (!riwayatData.isLoaded || riwayatData.allData.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-slate-400">
                <i class="fas fa-circle-notch fa-spin text-3xl mb-3 text-brand-orange"></i>
                <span class="text-sm font-medium animate-pulse">Memuat Data Alumni...</span>
            </div>
        `;
        return;
    }

    // 2. Data Processing (Aggregation)
    const angkatanTotals = {};
    const currentYear = new Date().getFullYear();

    riwayatData.allData.forEach(d => {
        // Hanya hitung donasi yang sudah Terverifikasi
        if (d.Status !== 'Terverifikasi') return;
        
        let year = null;

        // PRIORITAS 1: Cek kolom input khusus alumni (DetailAlumni)
        if (d.DetailAlumni && String(d.DetailAlumni).trim() !== "") {
            year = String(d.DetailAlumni).trim();
        } else if (d.detailAlumni && String(d.detailAlumni).trim() !== "") {
            year = String(d.detailAlumni).trim();
        }
        
        // PRIORITAS 2: Fallback ke Regex Nama/Keterangan jika kolom khusus kosong
        if (!year) {
            const combined = `${d.NamaDonatur || ""} ${d.Keterangan || ""}`.toLowerCase();
            const yearMatch = combined.match(/(?:alumni|angkatan|tahun|lulusan)\s*(\d{4})|^(\d{4})\s*$/i);
            if (yearMatch) year = yearMatch[1] || yearMatch[2];
        }

        // Validasi Tahun & Akumulasi Nominal
        if (year) {
            const numYear = parseInt(year);
            if (!isNaN(numYear) && numYear >= 1950 && numYear <= currentYear) {
                const val = parseInt(d.Nominal) || 0;
                angkatanTotals[numYear] = (angkatanTotals[numYear] || 0) + val;
            }
        }
    });

    // 3. Sorting (High to Low Donation)
    const leaderboard = Object.keys(angkatanTotals)
        .map(year => ({ year: year, total: angkatanTotals[year] }))
        .sort((a, b) => b.total - a.total); // Urutkan berdasarkan Total Donasi Terbesar

    // 4. State: Empty
    if (leaderboard.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 px-4 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                <i class="fas fa-users-slash text-4xl text-slate-300 mb-3"></i>
                <p class="text-slate-500 font-medium text-sm">Belum ada data kontribusi alumni.</p>
            </div>
        `;
        return;
    }

    // Hitung persentase untuk progress bar (Base = Donasi Tertinggi)
    const maxTotal = leaderboard[0].total;

    // 5. Render HTML (New Design)
    let html = `<div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">`;
    
    // Header
    html += `
        <div class="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 class="font-bold text-slate-700 flex items-center gap-2">
                <i class="fas fa-trophy text-yellow-500"></i> Top Kontribusi
            </h4>
            <span class="text-[10px] font-bold px-2 py-1 bg-slate-200 text-slate-600 rounded text-xs">
                ${leaderboard.length} Angkatan
            </span>
        </div>
        <div class="divide-y divide-slate-50">
    `;

    leaderboard.forEach((item, index) => {
        const rank = index + 1;
        const percentage = (item.total / maxTotal) * 100;
        
        // Styling untuk Top 3
        let rankBadge = `<span class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold text-sm border border-slate-200">${rank}</span>`;
        let barColor = "bg-slate-200";
        let rowClass = "hover:bg-slate-50 transition-colors";

        if (rank === 1) {
            rankBadge = `<div class="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600 border border-yellow-200 shadow-sm"><i class="fas fa-crown text-sm"></i></div>`;
            barColor = "bg-gradient-to-r from-yellow-400 to-amber-500";
            rowClass = "bg-yellow-50/30 hover:bg-yellow-50/60 transition-colors";
        } else if (rank === 2) {
            rankBadge = `<div class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 border border-slate-300 shadow-sm"><i class="fas fa-medal text-sm"></i></div>`;
            barColor = "bg-gradient-to-r from-slate-400 to-slate-500";
        } else if (rank === 3) {
            rankBadge = `<div class="w-8 h-8 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 border border-orange-200 shadow-sm"><i class="fas fa-medal text-sm"></i></div>`;
            barColor = "bg-gradient-to-r from-orange-400 to-orange-500";
        }

        html += `
            <div class="p-4 ${rowClass} relative group">
                <div class="flex items-center gap-4 relative z-10">
                    <div class="shrink-0">
                        ${rankBadge}
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <span class="font-bold text-slate-700 text-sm">Angkatan ${item.year}</span>
                            <span class="font-bold text-slate-800 text-sm">${formatRupiah(item.total)}</span>
                        </div>
                        
                        <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div class="${barColor} h-2 rounded-full transition-all duration-1000 ease-out group-hover:brightness-110" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div></div>`; // Close wrapper
    container.innerHTML = html;
}

function getFilteredData() {
    let filtered = riwayatData.allData;
    const typeFilter = document.getElementById('filter-jenis') ? document.getElementById('filter-jenis').value : 'all';
    const methodFilter = document.getElementById('filter-metode') ? document.getElementById('filter-metode').value : 'all';
    const startDateEl = document.getElementById('filter-start-date');
    const endDateEl = document.getElementById('filter-end-date');
    const startDate = startDateEl ? startDateEl.value : '';
    const endDate = endDateEl ? endDateEl.value : '';

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
            if (timeFilterState === 'year') return date.getFullYear() === now.getFullYear();
            return true;
        });
    }

    return filtered;
}

export function renderRiwayatList() {
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

    container.innerHTML = visibleItems.map((item, index) => {
        let iconClass = 'fa-donate';
        let bgIcon = 'bg-slate-100 text-slate-400';
        let borderClass = 'border-slate-100';

        const type = item.JenisDonasi || item.type || "";
        const subType = item.SubJenis || item.subType || "";
        const displayType = subType || type;
        const paymentMethod = item.MetodePembayaran || item.metode || "Tunai";
        const donaturName = escapeHtml(item.NamaDonatur || item.nama) || 'Hamba Allah';
        const nominal = parseInt(item.Nominal || item.nominal) || 0;

        let labelSebutan = "Donatur"; 
        if (displayType.toLowerCase().includes('zakat')) labelSebutan = "Muzaki";
        else if (displayType.toLowerCase().includes('infaq') || displayType.toLowerCase().includes('wakaf')) labelSebutan = "Munfiq";

        // Status Maker-Checker
        const status = item.Status || "Belum Verifikasi";
        let statusBadgeHTML = '';

        if (status === 'Terverifikasi') {
            statusBadgeHTML = `
                <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 shadow-sm ml-auto sm:ml-0" title="Donasi Diterima">
                    <i class="fas fa-check-circle text-[10px]"></i> 
                    <span class="text-[10px] font-bold uppercase tracking-wider">Diterima</span>
                </div>`;
        } else {
            statusBadgeHTML = `
                <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm ml-auto sm:ml-0" title="Menunggu Verifikasi Admin">
                    <i class="fas fa-hourglass-half text-[10px] animate-pulse"></i> 
                    <span class="text-[10px] font-bold uppercase tracking-wider">Proses</span>
                </div>`;
        }

        // Highlight Kode Unik
        let nominalHTML = nominal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
        if (nominal % 1000 !== 0 && paymentMethod !== 'Tunai') {
             nominalHTML = nominalHTML.replace(/(\d{3})(?=\D*$)/, '<span class="text-orange-500 border-b-2 border-orange-200 font-black">$1</span>');
        }

        // Style Card
        let bgBadge = 'bg-slate-50 text-slate-600';
        
        if (displayType.includes('Fitrah')) {
            iconClass = 'fa-bowl-rice'; bgIcon = 'bg-emerald-100 text-emerald-600'; borderClass = 'hover:border-emerald-200';
            bgBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
        } else if (displayType.includes('Maal')) {
            iconClass = 'fa-sack-dollar'; bgIcon = 'bg-amber-100 text-amber-600'; borderClass = 'hover:border-amber-200';
            bgBadge = 'bg-amber-50 text-amber-700 border-amber-100';
        } else if (displayType.includes('Kampus')) {
            iconClass = 'fa-school'; bgIcon = 'bg-rose-100 text-rose-600'; borderClass = 'hover:border-rose-200';
            bgBadge = 'bg-rose-50 text-rose-700 border-rose-100';
        } else if (displayType.includes('Beasiswa')) {
            iconClass = 'fa-user-graduate'; bgIcon = 'bg-sky-100 text-sky-600'; borderClass = 'hover:border-sky-200';
            bgBadge = 'bg-sky-50 text-sky-700 border-sky-100';
        } else if (displayType.includes('Umum')) {
            iconClass = 'fa-parachute-box'; bgIcon = 'bg-violet-100 text-violet-600'; borderClass = 'hover:border-violet-200';
            bgBadge = 'bg-violet-50 text-violet-700 border-violet-100';
        } else {
            iconClass = 'fa-hand-holding-heart'; bgIcon = 'bg-orange-100 text-orange-600'; borderClass = 'hover:border-orange-200';
            bgBadge = 'bg-orange-50 text-orange-700 border-orange-100';
        }

        const dateObj = new Date(item.Timestamp);
        const date = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const time = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        const alumniYear = item.DetailAlumni || item.detailAlumni;
        const alumniBadge = alumniYear ?
            `<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-white border border-slate-600" title="Alumni ${alumniYear}"><i class="fas fa-graduation-cap mr-1"></i> ${alumniYear}</span>` : '';

        let metodeBadge = 'bg-slate-100 text-slate-500 border-slate-200';
        if (paymentMethod === 'QRIS') metodeBadge = 'bg-blue-50 text-blue-600 border-blue-200';
        else if (paymentMethod === 'Transfer') metodeBadge = 'bg-purple-50 text-purple-600 border-purple-200';
        else if (paymentMethod === 'Tunai') metodeBadge = 'bg-green-50 text-green-600 border-green-200';

        return `
        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 ${borderClass} group relative overflow-hidden transform hover:-translate-y-1">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                
                <div class="flex items-start sm:items-center gap-5 w-full">
                    <div class="w-14 h-14 rounded-2xl ${bgIcon} flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">${labelSebutan}</p>

                        <div class="flex items-center flex-wrap gap-y-1 mb-1">
                            <h4 class="font-bold text-slate-800 text-lg group-hover:text-brand-orange transition-colors truncate pr-2">
                                ${donaturName}
                            </h4>
                            ${alumniBadge}
                        </div>
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-xs font-bold text-slate-500 uppercase tracking-wide truncate">${displayType}</span>
                            <span class="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                            <span class="text-[10px] px-2 py-0.5 rounded border ${metodeBadge} font-bold uppercase tracking-wider">${paymentMethod}</span>
                        </div>
                    </div>
                </div>

                <div class="text-left sm:text-right w-full sm:w-auto pl-[4.5rem] sm:pl-0 mt-[-10px] sm:mt-0">
                    <span class="block font-black text-xl text-slate-800 mb-1 tracking-tight group-hover:text-brand-orange transition-colors">
                        ${nominalHTML}
                    </span>
                    <div class="flex flex-col sm:items-end gap-2">
                        <div class="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <i class="far fa-clock"></i> ${date} • ${time}
                        </div>
                        ${statusBadgeHTML}
                    </div>
                </div>
            </div>
            
            <div class="absolute right-[-20px] bottom-[-20px] text-9xl opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-500 rotate-12">
                <i class="fas ${iconClass}"></i>
            </div>
        </div>
        `;
    }).join('');
}

export function renderPagination() {
    const items = getFilteredData();
    const totalPages = Math.ceil(items.length / riwayatData.itemsPerPage);

    const pageInfo = document.getElementById('riwayat-page-info');
    if (pageInfo) pageInfo.innerText = `Page ${riwayatData.currentPage} of ${totalPages || 1}`;

    const prevBtn = document.getElementById('riwayat-prev');
    if (prevBtn) prevBtn.disabled = riwayatData.currentPage === 1;

    const nextBtn = document.getElementById('riwayat-next');
    if (nextBtn) nextBtn.disabled = riwayatData.currentPage >= totalPages || totalPages === 0;
}

let myDonations = []; 

export async function loadPersonalDashboard(userEmail) {
    if (!riwayatData.isLoaded) {
        await loadRiwayat();
    }

    if (riwayatData.allData) {
        myDonations = riwayatData.allData.filter(item => {
            // Hanya hitung donasi yang sudah Terverifikasi
            if (item.Status !== 'Terverifikasi') return false;
            
            const emailData = item.Email ? String(item.Email).toLowerCase() : "";
            const emailUser = userEmail ? String(userEmail).toLowerCase() : "";
            const matchEmail = emailData && emailUser && emailData === emailUser;
            
            const itemNIS = item.nisSantri || item.NISSantri || item.NIS || ""; 
            const userNIS = (currentUser && currentUser.isSantri) ? String(currentUser.nis) : "";
            const matchNIS = userNIS && String(itemNIS) === userNIS;

            return matchEmail || matchNIS;
        });
    }

    updateDashboardUI();
}

function updateDashboardUI() {
    const user = currentUser; 
    if (user) {
        if(document.getElementById('dash-avatar')) document.getElementById('dash-avatar').src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`;
        if(document.getElementById('dash-name')) {
            const firstName = user.displayName ? user.displayName.split(' ')[0] : 'User';
            document.getElementById('dash-name').innerText = firstName;
        }
    }

    let totalDonasi = 0;
    let frekuensi = myDonations.length;
    let lastDonasi = null;
    
    // Track payment methods
    let totalQRIS = 0;
    let totalTransfer = 0;
    let totalTunai = 0;

    myDonations.forEach((d, index) => {
        const val = parseInt(d.Nominal) || 0;
        totalDonasi += val;
        
        // Track payment methods
        const metode = d.MetodePembayaran || "";
        if (metode === 'QRIS') totalQRIS += val;
        else if (metode === 'Transfer') totalTransfer += val;
        else if (metode === 'Tunai') totalTunai += val;
        
        if (index === 0) lastDonasi = d; 
    });

    if (typeof renderGamification === 'function') {
        renderGamification(totalDonasi);
    } else {
        console.log("Fungsi renderGamification belum siap");
    }

    const elStatTotal = document.getElementById('dash-stat-total');
    const elStatFreq = document.getElementById('dash-stat-freq');
    const elStatLast = document.getElementById('dash-stat-last');
    const elStatDate = document.getElementById('dash-stat-last-date');

    if (elStatTotal) animateValue(elStatTotal, 0, totalDonasi, 1500, true);
    if (elStatFreq) animateValue(elStatFreq, 0, frekuensi, 1000);
    
    // Update payment method cards
    const elDashQRIS = document.getElementById('dash-stat-qris');
    const elDashTransfer = document.getElementById('dash-stat-transfer');
    const elDashTunai = document.getElementById('dash-stat-tunai');
    
    if (elDashQRIS) animateValue(elDashQRIS, 0, totalQRIS, 1500, true);
    if (elDashTransfer) animateValue(elDashTransfer, 0, totalTransfer, 1500, true);
    if (elDashTunai) animateValue(elDashTunai, 0, totalTunai, 1500, true);
    
    if (lastDonasi) {
        if(elStatLast) elStatLast.innerText = formatRupiah(lastDonasi.Nominal);
        if(elStatDate) elStatDate.innerText = timeAgo(lastDonasi.Timestamp);
    } else {
        if(elStatLast) elStatLast.innerText = "-";
        if(elStatDate) elStatDate.innerText = "Belum ada donasi";
    }

    const levelBadge = document.getElementById('dash-level');
    if (levelBadge) {
        if (totalDonasi > 10000000) {
            levelBadge.innerHTML = `<span class="text-purple-600"><i class="fas fa-crown"></i> Muhsinin Utama</span>`;
        } else if (totalDonasi > 1000000) {
            levelBadge.innerHTML = `<span class="text-blue-600"><i class="fas fa-medal"></i> Donatur Setia</span>`;
        } else if (frekuensi > 0) {
            levelBadge.innerHTML = `<span class="text-green-600"><i class="fas fa-user-check"></i> Sahabat Lazismu</span>`;
        } else {
            levelBadge.innerText = "Donatur Baru";
        }
    }

    renderPersonalHistoryTable();
}

export function renderPersonalHistoryTable() {
    const tbody = document.getElementById('dash-history-body');
    const emptyState = document.getElementById('dash-empty-state');
    
    if (!tbody) return; 

    if (myDonations.length === 0) {
        tbody.innerHTML = '';
        if(tbody.parentElement) tbody.parentElement.classList.add('hidden'); 
        if(emptyState) emptyState.classList.remove('hidden'); 
        return;
    }

    if(tbody.parentElement) tbody.parentElement.classList.remove('hidden');
    if(emptyState) emptyState.classList.add('hidden');
    tbody.innerHTML = '';

    myDonations.forEach(item => {
        const dateObj = new Date(item.Timestamp);
        const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        
        let statusClass = item.Status === 'Terverifikasi' 
            ? 'bg-green-100 text-green-700 border-green-200' 
            : 'bg-yellow-100 text-yellow-700 border-yellow-200';
        
        // --- PERBAIKAN DI SINI: LOGIKA TOMBOL KWITANSI ---
        let btnKwitansiHTML = '';
        
        // Cek Status (Sesuaikan string 'Terverifikasi' dengan data Anda)
        if (item.Status === 'Terverifikasi') {
            // Jika SUDAH VERIFIKASI: Tampilkan tombol bisa diklik
            btnKwitansiHTML = `
                <button onclick='window.openReceiptWindow(${JSON.stringify(item)})' class="text-emerald-600 hover:text-emerald-800 transition p-2 bg-emerald-50 rounded-lg border border-emerald-100" title="Cetak Kwitansi">
                    <i class="fas fa-file-invoice"></i> Cetak
                </button>
            `;
        } else {
            // Jika BELUM: Tampilkan icon jam / gembok (Tidak bisa diklik)
            btnKwitansiHTML = `
                <span class="text-slate-300 cursor-not-allowed p-2" title="Menunggu Verifikasi Admin">
                    <i class="fas fa-clock"></i>
                </span>
            `;
        }
        // -----------------------------------------------

        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50 transition border-b border-slate-50 last:border-0';
        row.innerHTML = `
            <td class="p-5 whitespace-nowrap">
                <div class="font-bold text-slate-700">${dateStr}</div>
                <div class="text-xs text-slate-400">${timeAgo(item.Timestamp)}</div>
            </td>
            <td class="p-5">
                <div class="font-bold text-slate-700">${item.JenisDonasi}</div>
                <div class="text-xs text-slate-500">${item.SubJenis || '-'}</div>
            </td>
            <td class="p-5 font-bold text-slate-700">
                ${formatRupiah(item.Nominal)}
            </td>
            <td class="p-5 text-center">
                <span class="px-3 py-1 rounded-full text-xs font-bold border bg-white text-slate-500">
                    ${item.MetodePembayaran}
                </span>
            </td>
            <td class="p-5 text-center">
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusClass}">
                    ${item.Status === 'Terverifikasi' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-clock"></i>'}
                    ${item.Status || 'Proses'}
                </span>
            </td>
            <td class="p-5 text-center">
                ${btnKwitansiHTML} </td>
        `;
        tbody.appendChild(row);
    });
}

export async function renderDashboardProfil(nisUser) {
    if (typeof window.santriData === 'undefined' || window.santriData.length === 0) {
        if(window.loadSantriData) await window.loadSantriData(); 
    }
    if (typeof window.classMetaData === 'undefined' || Object.keys(window.classMetaData).length === 0) {
        if(window.loadClassData) await window.loadClassData();
    }

    const santri = window.santriData.find(s => String(s.nis) === String(nisUser));

    if (!santri) {
        console.warn("Data santri tidak ditemukan untuk profil.");
        return;
    }

    const dataKelas = window.classMetaData[santri.kelas] || {}; 

    const namaWali = santri.wali_khusus || dataKelas.wali || "-";
    const namaMusyrif = santri.musyrif_khusus || dataKelas.musyrif || "-";

    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    setText('dash-nama', santri.nama);
    setText('dash-nis', santri.nis);
    setText('dash-kelas', santri.kelas);
    setText('dash-asrama', santri.asrama || "-"); 
    setText('dash-wali', namaWali);
    setText('dash-musyrif', namaMusyrif);

    const card = document.getElementById('santri-profile-card');
    if (card) {
        card.classList.remove('hidden');
        card.classList.add('animate-fade-in-up');
    }
    
    // Show appreciation section for students
    const appreciationSection = document.getElementById('santri-appreciation-section');
    if (appreciationSection) {
        appreciationSection.classList.remove('hidden');
        appreciationSection.classList.add('animate-fade-in-up');
    }
}

export function openReceiptWindow(itemData) {
    const paketData = {
        nama: itemData.NamaDonatur || itemData.nama || "Hamba Allah",
        alamat: itemData.Alamat || "-",
        hp: itemData.NoHP || itemData.hp || "-",
        nominal: itemData.Nominal || itemData.nominal || 0,
        
        jenis: itemData.JenisDonasi || itemData.type || "Infaq",
        sub: itemData.SubJenis || "", 
        
        metode: itemData.MetodePembayaran || itemData.metode || "Tunai",
        tanggal: itemData.Timestamp || new Date().toISOString()
    };

    localStorage.setItem('tiket_cetak_kwitansi', JSON.stringify(paketData));
    window.open('cetak.html', '_blank', 'width=900,height=700,menubar=no,toolbar=no');
}

export async function refreshDashboard() {
    const btnRefresh = document.getElementById('btn-refresh-dash'); // Asumsi ID tombol refresh
    const icon = btnRefresh ? btnRefresh.querySelector('i') : null;

    // 1. Efek Loading (Putar Icon)
    if (icon) icon.classList.add('fa-spin');
    
    // 2. Reset Status Data agar fetch ulang
    riwayatData.isLoaded = false; 
    
    try {
        // 3. Ambil ulang data
        await loadRiwayat();
        
        // 4. Update tampilan Dashboard Pribadi jika user sedang login
        if (currentUser) {
            // Gunakan email atau NIS yang tersedia
            const identifier = currentUser.email || currentUser.nis;
            await loadPersonalDashboard(identifier);
        }
        
        showToast('Data dashboard berhasil diperbarui', 'success');
    } catch (error) {
        console.error(error);
        showToast('Gagal memperbarui data', 'error');
    } finally {
        // 5. Hentikan Efek Loading
        if (icon) icon.classList.remove('fa-spin');
    }
}

export async function refreshRiwayat() {
    const btnRefresh = document.getElementById('btn-refresh-riwayat');
    const icon = btnRefresh ? btnRefresh.querySelector('i') : null;

    // 1. Efek Loading (Putar Icon)
    if (icon) icon.classList.add('fa-spin');
    
    // 2. Reset Status Data agar fetch ulang
    riwayatData.isLoaded = false;
    riwayatData.currentPage = 1;
    
    try {
        // 3. Ambil ulang data
        await loadRiwayat(true);
        
        showToast('Data laporan berhasil diperbarui', 'success');
    } catch (error) {
        console.error(error);
        showToast('Gagal memperbarui data', 'error');
    } finally {
        // 4. Hentikan Efek Loading
        if (icon) icon.classList.remove('fa-spin');
    }
}

/* =========================================
   SISTEM GAMIFIKASI & APRESIASI (Baru)
   ========================================= */

const TIER_DATA = [
    {
        level: 1,
        name: "Pejuang Kebaikan",
        min: 500000,
        color: "from-amber-400 to-orange-500",
        icon: "fas fa-star",
        benefits: ["Sertifikat Penghargaan", "30 Poin Prestasi Siswa"]
    },
    {
        level: 2,
        name: "Ksatria Dermawan",
        min: 1000000,
        color: "from-blue-400 to-indigo-600",
        icon: "fas fa-shield-alt",
        benefits: ["Semua Benefit Level 1", "Exclusive Goodybag Lazismu", "Prioritas Pelayanan"]
    },
    {
        level: 3,
        name: "Pahlawan Lazismu",
        min: 5000000,
        color: "from-purple-500 to-pink-600",
        icon: "fas fa-crown",
        benefits: ["Semua Benefit Level 2", "Voucher Bebas SPP 1 Bulan", "Gala Dinner Bersama Direksi"]
    }
];

const RULES_DATA = [
    {
        title: "Dokumen Hilang",
        desc: "Kehilangan map/amplop/dokumen fisik fundraising.",
        sanction: "Denda Ganti Cetak Rp 50.000",
        icon: "fas fa-file-excel",
        color: "text-red-500 bg-red-50"
    },
    {
        title: "Lalai Lapor",
        desc: "Tidak melaporkan hasil perolehan sesuai tenggat waktu.",
        sanction: "Surat Pernyataan Bermaterai (Rp 10.000)",
        icon: "fas fa-user-clock",
        color: "text-orange-500 bg-orange-50"
    }
];

function renderGamification(totalDonasiSantri) {
    const container = document.getElementById('gamification-container');
    if (!container) return; // Jika elemen HTML belum di-update, stop.
    
    container.classList.remove('hidden');

    // 1. Hitung Level
    let currentTierIdx = -1;
    let nextTier = TIER_DATA[0];
    
    for (let i = 0; i < TIER_DATA.length; i++) {
        if (totalDonasiSantri >= TIER_DATA[i].min) {
            currentTierIdx = i;
        }
    }

    if (currentTierIdx < TIER_DATA.length - 1) {
        nextTier = TIER_DATA[currentTierIdx + 1];
    } else {
        nextTier = null;
    }

    // 2. Update Header UI
    const tierNameEl = document.getElementById('current-tier-name');
    const nextInfoEl = document.getElementById('next-tier-info');
    const progressBar = document.getElementById('tier-progress-bar');
    const targetLabel = document.getElementById('target-next-tier');
    const totalEl = document.getElementById('user-total-progress');
    const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

    if(totalEl) totalEl.innerText = fmt(totalDonasiSantri);

    if (currentTierIdx === -1) {
        if(tierNameEl) {
            tierNameEl.innerText = "Pemula";
            tierNameEl.className = "text-3xl md:text-4xl font-black text-slate-400";
        }
        if(nextInfoEl) nextInfoEl.innerHTML = `Butuh <strong>${fmt(nextTier.min - totalDonasiSantri)}</strong> lagi untuk naik level.`;
        
        let pct = (totalDonasiSantri / nextTier.min) * 100;
        if(progressBar) progressBar.style.width = `${pct}%`;
        if(targetLabel) targetLabel.innerText = `Target: ${fmt(nextTier.min)}`;
        
    } else if (nextTier) {
        const currTier = TIER_DATA[currentTierIdx];
        if(tierNameEl) {
            tierNameEl.innerText = currTier.name;
            if(currentTierIdx === 0) tierNameEl.className = "text-3xl md:text-4xl font-black text-amber-500";
            if(currentTierIdx === 1) tierNameEl.className = "text-3xl md:text-4xl font-black text-indigo-600";
            if(currentTierIdx === 2) tierNameEl.className = "text-3xl md:text-4xl font-black text-pink-600";
        }
        if(nextInfoEl) nextInfoEl.innerHTML = `Luar biasa! <strong>${fmt(nextTier.min - totalDonasiSantri)}</strong> lagi menuju ${nextTier.name}.`;
        
        const range = nextTier.min - currTier.min;
        const currentInTier = totalDonasiSantri - currTier.min;
        let pct = (currentInTier / range) * 100;
        if(progressBar) progressBar.style.width = `${pct}%`;
        if(targetLabel) targetLabel.innerText = `Next: ${fmt(nextTier.min)}`;

    } else {
        // Max Level
        const maxTier = TIER_DATA[TIER_DATA.length - 1];
        if(tierNameEl) {
            tierNameEl.innerText = maxTier.name + " (MAX)";
            tierNameEl.className = "text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600";
        }
        if(nextInfoEl) nextInfoEl.innerText = "Anda adalah legenda kebaikan!";
        if(progressBar) progressBar.style.width = "100%";
        if(targetLabel) targetLabel.innerText = "Unstoppable";
    }

    // 3. Render Reward Cards
    const rewardsContainer = document.getElementById('content-rewards');
    if(rewardsContainer) {
        rewardsContainer.innerHTML = '';
        TIER_DATA.forEach((tier, index) => {
            const isUnlocked = index <= currentTierIdx;
            const isNext = index === currentTierIdx + 1;
            
            let cardClass = isUnlocked 
                ? "bg-white border-emerald-500 shadow-xl shadow-emerald-500/10 transform -translate-y-2" 
                : (isNext ? "bg-white border-slate-200 opacity-100" : "bg-slate-50 border-slate-100 opacity-60 grayscale");
                
            let iconBg = isUnlocked ? `bg-gradient-to-br ${tier.color} text-white` : "bg-slate-200 text-slate-400";
            let statusBadge = isUnlocked 
                ? `<span class="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full"><i class="fas fa-check"></i> Dicapai</span>`
                : (isNext ? `<span class="absolute top-4 right-4 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">Target Berikutnya</span>` : `<span class="absolute top-4 right-4 bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full"><i class="fas fa-lock"></i> Terkunci</span>`);

            const benefitsList = tier.benefits.map(b => 
                `<li class="flex items-start gap-2 text-xs text-slate-600 mb-1">
                    <i class="fas fa-check-circle ${isUnlocked ? 'text-emerald-500' : 'text-slate-300'} mt-0.5"></i> ${b}
                 </li>`
            ).join('');

            const html = `
            <div class="relative p-6 rounded-3xl border-2 transition-all duration-300 group ${cardClass}">
                ${statusBadge}
                <div class="w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center text-xl shadow-lg mb-4 transition-transform group-hover:scale-110">
                    <i class="${tier.icon}"></i>
                </div>
                <h4 class="font-black text-lg text-slate-800 mb-1">${tier.name}</h4>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Target: ${fmt(tier.min)}</p>
                <div class="h-px bg-slate-100 w-full mb-4"></div>
                <ul class="space-y-2">${benefitsList}</ul>
            </div>`;
            rewardsContainer.innerHTML += html;
        });
    }

    // 4. Render Rules Cards
    const rulesContainer = document.getElementById('content-rules');
    if(rulesContainer) {
        rulesContainer.innerHTML = '';
        RULES_DATA.forEach(rule => {
            const html = `
            <div class="flex items-start gap-5 bg-white p-6 rounded-3xl border border-slate-100 hover:border-red-200 hover:shadow-lg transition-all">
                <div class="w-12 h-12 rounded-full ${rule.color} flex items-center justify-center text-xl shrink-0">
                    <i class="${rule.icon}"></i>
                </div>
                <div>
                    <h4 class="font-bold text-slate-800 text-lg mb-1">${rule.title}</h4>
                    <p class="text-sm text-slate-500 mb-3 leading-relaxed">${rule.desc}</p>
                    <div class="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-bold inline-block border border-red-100">
                        <i class="fas fa-gavel mr-1"></i> ${rule.sanction}
                    </div>
                </div>
            </div>`;
            rulesContainer.innerHTML += html;
        });
    }
}

// Fungsi Tab Switcher (Global)
window.switchTab = function(tabName) {
    const rewardsContent = document.getElementById('content-rewards');
    const rulesContent = document.getElementById('content-rules');
    const btnRewards = document.getElementById('tab-btn-rewards');
    const btnRules = document.getElementById('tab-btn-rules');

    if (!rewardsContent || !rulesContent) return;

    if (tabName === 'rewards') {
        rewardsContent.classList.remove('hidden');
        rulesContent.classList.add('hidden');
        btnRewards.className = "px-6 py-2.5 rounded-xl bg-white text-slate-800 font-bold text-sm shadow-sm transition-all";
        btnRules.className = "px-6 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 font-bold text-sm hover:bg-white/50 transition-all";
    } else {
        rewardsContent.classList.add('hidden');
        rulesContent.classList.remove('hidden');
        btnRules.className = "px-6 py-2.5 rounded-xl bg-white text-slate-800 font-bold text-sm shadow-sm transition-all";
        btnRewards.className = "px-6 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 font-bold text-sm hover:bg-white/50 transition-all";
    }
};
