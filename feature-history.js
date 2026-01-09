import { riwayatData, currentUser, timeFilterState, setTimeFilterState } from './state.js';
import { GAS_API_URL } from './config.js';
import { formatRupiah, timeAgo, animateValue, escapeHtml, showToast } from './utils.js';
import { showPage } from './ui-navigation.js';
import { renderGlobalLeaderboard } from './feature-recap.js';

// Mengambil data riwayat dari Google Sheet
export async function loadRiwayat() {
    if (riwayatData.isLoaded || riwayatData.isLoading) return; 
    
    riwayatData.isLoading = true; 

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

    const classMapMTs = {}, classMapMA = {};
    const santriDonasiMTs = {}, santriDonasiMA = {};
    const santriFreqMTs = {}, santriFreqMA = {};
    const donationTypes = {};

    let totalFitrah = 0;
    let totalMaal = 0;
    let totalInfaq = 0;

    data.forEach(d => {
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

        if (typeName.includes('Fitrah')) totalFitrah += val;
        else if (typeName.includes('Maal')) totalMaal += val;
        else if (typeName.includes('Infaq')) totalInfaq += val;

        const rombel = d.KelasSantri || d.rombelSantri;
        const nama = d.NamaSantri || d.namaSantri;

        if (rombel && nama) {
            const lvl = parseInt(rombel.charAt(0));
            const isMTs = lvl <= 3;
            const mapClass = isMTs ? classMapMTs : classMapMA;
            const mapSantri = isMTs ? santriDonasiMTs : santriDonasiMA;
            const mapFreq = isMTs ? santriFreqMTs : santriFreqMA;

            mapClass[rombel] = (mapClass[rombel] || 0) + val;
            const key = `${nama} (${rombel})`;
            mapSantri[key] = (mapSantri[key] || 0) + val;
            mapFreq[key] = (mapFreq[key] || 0) + 1;
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
    const getMax = (map, type = 'val') => {
        let maxK = 'N/A',
            maxV = 0;
        for (const [k, v] of Object.entries(map)) {
            if (v > maxV) {
                maxV = v;
                maxK = k;
            }
        }
        return {
            key: maxK,
            val: type === 'val' ? formatRupiah(maxV) : maxV + 'x'
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

    const mtsClass = getMax(classMapMTs);
    setText('stat-mts-kelas-max', mtsClass.key);
    setText('stat-mts-kelas-total', mtsClass.val);

    const mtsSantri = getMax(santriDonasiMTs);
    setText('stat-mts-santri-max-donasi', mtsSantri.key.split('(')[0]);
    setText('stat-mts-santri-total-donasi', mtsSantri.val);

    const mtsFreq = getMax(santriFreqMTs, 'freq');
    setText('stat-mts-santri-freq-nama', mtsFreq.key.split('(')[0]);
    setText('stat-mts-santri-freq-val', mtsFreq.val);

    const maClass = getMax(classMapMA);
    setText('stat-ma-kelas-max', maClass.key);
    setText('stat-ma-kelas-total', maClass.val);

    const maSantri = getMax(santriDonasiMA);
    setText('stat-ma-santri-max-donasi', maSantri.key.split('(')[0]);
    setText('stat-ma-santri-total-donasi', maSantri.val);

    const maFreq = getMax(santriFreqMA, 'freq');
    setText('stat-ma-santri-freq-nama', maFreq.key.split('(')[0]);
    setText('stat-ma-santri-freq-val', maFreq.val);
}

// Menampilkan 6 donasi terbaru di halaman depan (Home)
export function renderHomeLatestDonations() {
    const container = document.getElementById('home-latest-donations');
    if (!container) return;

    const latest = riwayatData.allData.slice(0, 6);

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
                                ${parseInt(item.Nominal).toLocaleString('id-ID')}
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
        if(document.getElementById('dash-name')) document.getElementById('dash-name').innerText = user.displayName.split(' ')[0]; 
    }

    let totalDonasi = 0;
    let frekuensi = myDonations.length;
    let lastDonasi = null;

    myDonations.forEach((d, index) => {
        totalDonasi += parseInt(d.Nominal) || 0;
        if (index === 0) lastDonasi = d; 
    });

    const elStatTotal = document.getElementById('dash-stat-total');
    const elStatFreq = document.getElementById('dash-stat-freq');
    const elStatLast = document.getElementById('dash-stat-last');
    const elStatDate = document.getElementById('dash-stat-last-date');

    if (elStatTotal) animateValue(elStatTotal, 0, totalDonasi, 1500, true);
    if (elStatFreq) animateValue(elStatFreq, 0, frekuensi, 1000);
    
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

function renderPersonalHistoryTable() {
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
                <button onclick='window.openReceiptWindow(${JSON.stringify(item)})' class="text-slate-400 hover:text-orange-600 transition p-2" title="Cetak Kwitansi">
                    <i class="fas fa-file-invoice"></i>
                </button>
            </td>
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
