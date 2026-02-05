// utils.js

export function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function showToast(message, type = 'warning') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const template = document.getElementById('toast-template');
    if (!template) return;

    const toast = template.content.cloneNode(true).querySelector('.toast');
    toast.className = `toast ${type}`;

    let icon = 'fa-exclamation-triangle text-orange-500';
    if (type === 'success') icon = 'fa-check-circle text-green-500';
    if (type === 'error') icon = 'fa-times-circle text-red-500';

    // Escape the message to prevent XSS
    const escapedMessage = escapeHtml(String(message));
    toast.querySelector('i').className = `fas ${icon} text-xl`;
    toast.querySelector('span').textContent = escapedMessage;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(`Berhasil disalin: ${text}`, 'success');
        }).catch(() => fallbackCopy(text));
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

export function formatRupiah(num) {
    return "Rp " + parseInt(num).toLocaleString('id-ID');
}

export function formatNumber(num) {
    return parseInt(num).toLocaleString('id-ID');
}

export function timeAgo(date) {
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

export function animateValue(obj, start, end, duration, isCurrency = false) {
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

export function generateUniqueCode() {
    return Math.floor(Math.random() * 999) + 1;
}

export function formatHP(hp) {
    let clean = String(hp || "").trim();
    if (clean === "" || clean === "-") return "-";
    if (!clean.startsWith('0')) return '0' + clean;
    return clean;
}

export function terbilang(angka) {
    const bil = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    angka = parseInt(angka);
    if (isNaN(angka)) return "";
    if (angka < 12) return bil[angka];
    if (angka < 20) return terbilang(angka - 10) + " Belas";
    if (angka < 100) return terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10);
    if (angka < 200) return "Seratus " + terbilang(angka - 100);
    if (angka < 1000) return terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100);
    if (angka < 2000) return "Seribu " + terbilang(angka - 1000);
    if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + " Ribu " + terbilang(angka % 1000);
    if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + " Juta " + terbilang(angka % 1000000);
    return "";
}

// FUNGSI INI YANG SEBELUMNYA HILANG
export function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}
