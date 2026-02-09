import { santriDB } from './santri-manager.js';
import { riwayatData } from './state.js';
import { showToast, formatRupiah } from './utils.js';
import { loadRiwayat } from './feature-history.js';

export function setupRekapLogic() {
    const lvlSelect = document.getElementById('rekap-level-select');
    const clsSelect = document.getElementById('rekap-kelas-select');
    const btnExport = document.getElementById('btn-export-pdf');

    if (!lvlSelect || !clsSelect) return;

    if (!clsSelect.value) toggleRekapDisplay(false);

    lvlSelect.onchange = () => {
        const lvl = lvlSelect.value;
        clsSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>';

        if (lvl && santriDB[lvl]) {
            clsSelect.disabled = false;
            
            // 1. TAMPILKAN KELAS FISIK / REGULER
            const classes = Object.keys(santriDB[lvl]).sort();
            classes.forEach(cls => {
                const opt = document.createElement('option');
                opt.value = cls;
                opt.innerText = `Kelas ${cls}`;
                clsSelect.appendChild(opt);
            });

            // 2. AUTO-DETECT TAHFIZH (LOGIKA BARU: CEK BEDA MUSYRIF)
            let adaAnakTahfizhBedaMusyrif = false;

            classes.forEach(namaKelas => {
                const dataSatuKelas = santriDB[lvl][namaKelas];
                
                const metaKelas = (typeof window.classMetaData !== 'undefined' ? window.classMetaData[namaKelas] : null) || { musyrif: '' };
                const musyrifKelas = (metaKelas.musyrif || "").trim().toLowerCase();

                // Cek apakah ada santri yang punya Musyrif Khusus DAN Berbeda dengan Musyrif Kelas
                if (dataSatuKelas.some(s => {
                    const musyrifTahfizh = (s.musyrifKhusus || "").trim().toLowerCase();
                    return musyrifTahfizh !== "" && musyrifTahfizh !== musyrifKelas;
                })) {
                    adaAnakTahfizhBedaMusyrif = true;
                }
            });

            if (adaAnakTahfizhBedaMusyrif) {
                if (lvl !== '4' && lvl !== '6') {
                    const opt = document.createElement('option');
                    opt.value = `tahfizh-${lvl}`;
                    opt.innerText = `Kelas ${lvl} Tahfizh (Khusus)`;
                    clsSelect.appendChild(opt);
                }
            }

            // 3. LOGIKA SPESIAL GABUNGAN
            if (lvl === '4' || lvl === '6') {
                const opt = document.createElement('option');
                opt.value = 'tahfizh-4,6';
                opt.innerText = 'Kelas 4 & 6 Tahfizh';
                clsSelect.appendChild(opt);
            }

        } else {
            clsSelect.disabled = true;
        }
        
        toggleRekapDisplay(false);
        renderGlobalLeaderboard(); 
    };

    clsSelect.onchange = () => {
        const cls = clsSelect.value;
        if (cls) {
            toggleRekapDisplay(true);
            renderRekapTable(cls);
        } else {
            toggleRekapDisplay(false);
            renderGlobalLeaderboard();
        }
    };

    if (btnExport) btnExport.onclick = () => exportRekapPDF();
}

function toggleRekapDisplay(showDetail) {
    const ph = document.getElementById('rekap-placeholder');
    const sum = document.getElementById('rekap-summary');
    const tbl = document.getElementById('rekap-table-container');
    const btnExport = document.getElementById('btn-export-pdf');

    if (showDetail) {
        ph.classList.add('hidden'); 
        sum.classList.remove('hidden');
        tbl.classList.remove('hidden');
        if (btnExport) btnExport.disabled = false;
    } else {
        ph.classList.remove('hidden'); 
        sum.classList.add('hidden');
        tbl.classList.add('hidden');
        if (btnExport) btnExport.disabled = true;
        renderGlobalLeaderboard(); 
    }
}

export function renderGlobalLeaderboard() {
    const container = document.getElementById('rekap-placeholder');
    if (!container) return;

    if (!riwayatData.isLoaded || riwayatData.allData.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-24">
                <div class="w-24 h-24 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin mb-6"></div>
                <h3 class="text-xl font-bold text-slate-800 animate-pulse">Sedang Menghitung Donasi...</h3>
            </div>
        `;
        return;
    }

    const classTotals = {};
    riwayatData.allData.forEach(d => {
        // Hanya hitung donasi yang sudah Terverifikasi
        if (d.Status !== 'Terverifikasi') return;
        
        const rombel = d.KelasSantri || d.rombelSantri;
        if (rombel) {
            const val = parseInt(d.Nominal) || 0;
            classTotals[rombel] = (classTotals[rombel] || 0) + val;
        }
    });

    const leaderboard = Object.keys(classTotals).map(key => ({
        kelas: key,
        total: classTotals[key]
    })).sort((a, b) => b.total - a.total);

    if (leaderboard.length === 0) {
        container.innerHTML = `<div class="p-10 text-center border-2 border-dashed border-slate-300 rounded-xl">Data Kosong</div>`;
        return;
    }

    const maxVal = leaderboard[0].total;

    let html = `
        <div class="max-w-5xl mx-auto px-4 font-sans">
            <div class="text-center mb-12">
                <span class="inline-block py-1 px-3 rounded-lg bg-slate-900 text-white text-xs font-bold tracking-widest mb-3 uppercase">Realtime Leaderboard</span>
                <h3 class="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">
                    Klasemen <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">Donasi</span>
                </h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
    `;

    leaderboard.forEach((item, index) => {
        const rank = index + 1;
        const percent = (item.total / maxVal) * 100;
        
        const meta = (typeof window.classMetaData !== 'undefined' ? window.classMetaData[item.kelas] : null) || { 
            wali: '-', 
            musyrif: '-' 
        };

        if (rank <= 3) {
            let theme = {};
            
            if (rank === 1) {
                theme = {
                    bg: "bg-gradient-to-b from-yellow-50 to-white border-yellow-400 ring-4 ring-yellow-400/20",
                    badge: "bg-yellow-500 text-white",
                    icon: "fa-crown animate-bounce",
                    text: "text-yellow-700",
                    glow: "shadow-[0_20px_50px_-12px_rgba(234,179,8,0.3)]",
                    col: "md:col-span-1 md:-mt-8 order-1 md:order-2 z-20" 
                };
            } else if (rank === 2) {
                theme = {
                    bg: "bg-white border-slate-300",
                    badge: "bg-slate-400 text-white",
                    icon: "fa-medal",
                    text: "text-slate-600",
                    glow: "shadow-xl",
                    col: "md:col-span-1 order-2 md:order-1 z-10" 
                };
            } else {
                theme = {
                    bg: "bg-white border-orange-200",
                    badge: "bg-orange-700 text-white",
                    icon: "fa-medal",
                    text: "text-orange-800",
                    glow: "shadow-xl",
                    col: "md:col-span-1 order-3 md:order-3 z-10" 
                };
            }

            html += `
                <div class="${theme.col} relative flex flex-col items-center text-center p-6 rounded-[2rem] border-2 ${theme.bg} ${theme.glow} transition-transform hover:scale-[1.02]">
                    
                    <div class="w-16 h-16 rounded-2xl ${theme.badge} flex items-center justify-center text-2xl shadow-lg mb-4 rotate-3">
                        <i class="fas ${theme.icon}"></i>
                    </div>

                    <div class="mb-4">
                        <span class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Terkumpul</span>
                        <h4 class="text-3xl font-black ${theme.text} tracking-tight">${formatRupiah(item.total)}</h4>
                    </div>

                    <div class="w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <h5 class="text-xl font-black text-slate-800 mb-2">Kelas ${item.kelas}</h5>
                        <div class="text-xs text-slate-500 space-y-1">
                            <p><i class="fas fa-user-tie w-4 text-center"></i> ${meta.wali}</p>
                            <p><i class="fas fa-user-shield w-4 text-center"></i> ${meta.musyrif}</p>
                        </div>
                    </div>

                    <div class="w-full bg-slate-100 h-2 rounded-full mt-6 overflow-hidden">
                        <div class="h-full ${rank === 1 ? 'bg-yellow-500' : 'bg-slate-800'} w-full" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
        } 
        else {
            html += `
                <div class="md:col-span-3 order-last group bg-white p-4 rounded-2xl border border-slate-100 hover:border-slate-300 shadow-sm flex flex-col md:flex-row items-center gap-4 transition-all hover:bg-slate-50">
                    
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-sm border border-slate-200">
                        #${rank}
                    </div>

                    <div class="flex-1 text-center md:text-left w-full">
                        <div class="flex items-center justify-center md:justify-start gap-2">
                            <h5 class="font-bold text-slate-800 text-lg">Kelas ${item.kelas}</h5>
                            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 truncate max-w-[150px]">${meta.wali}</span>
                        </div>
                        
                        <div class="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                             <div class="h-full bg-slate-400" style="width: ${percent}%"></div>
                        </div>
                    </div>

                    <div class="flex-shrink-0 text-right">
                        <span class="block font-bold text-slate-700 text-lg">${formatRupiah(item.total)}</span>
                    </div>
                </div>
            `;
        }
    });

    html += `
            </div> <div class="mt-8 text-center text-slate-400 text-xs font-mono">
                *Data diurutkan berdasarkan nominal tertinggi
            </div>
        </div>
    `;

    container.innerHTML = html;
    container.classList.remove('hidden');
}

function renderRekapTable(cls) {
    const tbody = document.getElementById('rekap-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    let students = [];
    let namaWali = "";
    let namaMusyrif = "";

    // === SKENARIO 1: PILIHAN KHUSUS TAHFIZH (VIA ID 'tahfizh-...') ===
    if (cls.startsWith('tahfizh-')) {
        const targetLevels = cls.replace('tahfizh-', '').split(',');

        targetLevels.forEach(lvl => {
            if (santriDB[lvl]) {
                Object.keys(santriDB[lvl]).forEach(realClass => {
                    const classData = santriDB[lvl][realClass];
                    
                    const meta = (typeof window.classMetaData !== 'undefined' ? window.classMetaData[realClass] : null) || { musyrif: '' };
                    const mKelas = (meta.musyrif || "").trim().toLowerCase();

                    const filtered = classData.filter(s => {
                        const mTahfizh = (s.musyrifKhusus || "").trim().toLowerCase();
                        return mTahfizh !== "" && mTahfizh !== mKelas;
                    });
                    
                    students = students.concat(filtered);
                });
            }
        });

        namaWali = "Gabungan Lintas Kelas";
        namaMusyrif = students.length > 0 ? students[0].musyrifKhusus : "-";
    } 
    // === SKENARIO 2: PILIHAN KELAS STANDAR ===
    else {
        const level = cls.charAt(0);
        students = santriDB[level] ? santriDB[level][cls] : [];
        
        const meta = (typeof window.classMetaData !== 'undefined' ? window.classMetaData[cls] : null) || {
            wali: '-',
            musyrif: '-'
        };
        namaWali = meta.wali;
        namaMusyrif = meta.musyrif; 
    }

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-slate-400">Data belum tersedia.</td></tr>';
        document.getElementById('rekap-wali').innerText = "-";
        document.getElementById('rekap-musyrif').innerText = "-";
        document.getElementById('rekap-total-kelas').innerText = "Rp 0";
        return;
    }

    students.sort((a, b) => a.nama.localeCompare(b.nama));
    let totalKelas = 0;

    students.forEach((s, index) => {
        let qris = 0, transfer = 0, tunai = 0;

        riwayatData.allData.forEach(d => {
            // Hanya hitung donasi yang sudah Terverifikasi
            if (d.Status !== 'Terverifikasi') return;
            
            const matchNama = d.NamaSantri && s.nama && d.NamaSantri.trim() === s.nama.trim();
            const matchKelas = d.KelasSantri === s.rombel || d.rombelSantri === s.rombel;

            if (matchNama && matchKelas) {
                const nom = parseInt(d.Nominal) || 0;
                if (d.MetodePembayaran === 'QRIS') qris += nom;
                else if (d.MetodePembayaran === 'Transfer') transfer += nom;
                else tunai += nom;
            }
        });
        
        const subtotal = qris + transfer + tunai;
        totalKelas += subtotal;

        const badgeKelas = cls.startsWith('tahfizh-') ? 
            `<span class="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded ml-2 font-bold">${s.rombel}</span>` : '';

        let labelTahfizh = '';
        if (s.musyrifKhusus) {
             labelTahfizh = `<span class="ml-1 text-[10px] text-teal-600 bg-teal-50 px-1.5 rounded border border-teal-100" title="Musyrif: ${s.musyrifKhusus}"><i class="fas fa-quran"></i> Tahfizh</span>`;
        }

        let labelMujanib = '';
        
        const asramaStr = String(s.asrama || '').trim();
        const kelasStr = String(s.rombel || '');

        if (kelasStr.startsWith('4') && (asramaStr === '1' || asramaStr === '10')) {
            labelMujanib = `<span class="ml-1 text-[10px] text-purple-600 bg-purple-50 px-1.5 rounded border border-purple-100" title="Asrama ${asramaStr}"><i class="fas fa-user-shield"></i> Mujanib</span>`;
        }

        const tr = document.createElement('tr');
        tr.className = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-slate-900">${index + 1}</td>
            <td class="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">
                ${s.nama} ${badgeKelas} ${labelTahfizh} ${labelMujanib}
            </td>
            <td class="px-6 py-4 text-right font-mono text-slate-500 whitespace-nowrap">${qris > 0 ? formatRupiah(qris) : '-'}</td>
            <td class="px-6 py-4 text-right font-mono text-slate-500 whitespace-nowrap">${transfer > 0 ? formatRupiah(transfer) : '-'}</td>
            <td class="px-6 py-4 text-right font-mono text-slate-500 whitespace-nowrap">${tunai > 0 ? formatRupiah(tunai) : '-'}</td>
            <td class="px-6 py-4 text-right font-bold text-orange-600 whitespace-nowrap">${formatRupiah(subtotal)}</td>
        `;
        tbody.appendChild(tr);
    });

    const elWali = document.getElementById('rekap-wali');
    const elMusyrif = document.getElementById('rekap-musyrif');
    const elTotal = document.getElementById('rekap-total-kelas');

    if (elWali) elWali.innerText = namaWali;
    if (elMusyrif) elMusyrif.innerText = namaMusyrif;
    if (elTotal) elTotal.innerText = formatRupiah(totalKelas);
}

export function exportRekapPDF() {
    if (!window.jspdf) {
        showToast("Library PDF belum dimuat.", "error");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const clsSelect = document.getElementById('rekap-kelas-select');
    const cls = clsSelect ? clsSelect.value : '';
    const date = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
    const meta = (typeof window.classMetaData !== 'undefined' ? window.classMetaData[cls] : null) || {
        wali: '-',
        musyrif: '-'
    };

    doc.setFontSize(18);
    doc.setTextColor(241, 90, 34);
    doc.text("REKAPITULASI PEROLEHAN ZIS", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Kelas: ${cls}`, 14, 30);
    doc.text(`Tanggal: ${date}`, 14, 36);
    doc.text(`Wali Kelas: ${meta.wali}`, 120, 30);
    doc.text(`Musyrif: ${meta.musyrif}`, 120, 36);

    doc.autoTable({
        html: '#rekap-table-container table',
        startY: 45,
        theme: 'grid',
        headStyles: {
            fillColor: [241, 90, 34]
        },
        styles: {
            fontSize: 8
        },
    });

    const totalEl = document.getElementById('rekap-total-kelas');
    const total = totalEl ? totalEl.innerText : 'Rp 0';

    doc.setFontSize(12);
    doc.setTextColor(0);
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 50;
    doc.text(`Total Perolehan: ${total}`, 14, finalY + 10);

    doc.save(`Rekap ZIS_Kelas ${cls}_${date}.pdf`);
}

export async function refreshRekap() {
    const btnRefresh = document.getElementById('btn-refresh-rekap');
    const icon = btnRefresh ? btnRefresh.querySelector('i') : null;

    // 1. Efek Loading (Putar Icon)
    if (icon) icon.classList.add('fa-spin');
    
    // 2. Reset Status Data agar fetch ulang
    riwayatData.isLoaded = false;
    
    try {
        // 3. Ambil ulang data
        await loadRiwayat(true);
        
        // 4. Update leaderboard
        renderGlobalLeaderboard();
        
        // 5. Re-render tabel jika ada kelas terpilih
        const clsSelect = document.getElementById('rekap-kelas-select');
        if (clsSelect && clsSelect.value) {
            renderRekapTable(clsSelect.value);
        }
        
        showToast('Data rekapitulasi berhasil diperbarui', 'success');
    } catch (error) {
        console.error(error);
        showToast('Gagal memperbarui data', 'error');
    } finally {
        // 6. Hentikan Efek Loading
        if (icon) icon.classList.remove('fa-spin');
    }
}
