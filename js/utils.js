// utils.js
import { UI } from '../constants.js';

// Development mode check
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Safe logging functions that only log in development
export const logger = {
    log: (...args) => {
        if (isDevelopment) console.log(...args);
    },
    warn: (...args) => {
        if (isDevelopment) console.warn(...args);
    },
    error: (...args) => {
        // Always log errors
        console.error(...args);
    }
};

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

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-exclamation-triangle text-orange-500';
    if (type === 'success') icon = 'fa-check-circle text-green-500';
    if (type === 'error') icon = 'fa-times-circle text-red-500';

    // Escape the message to prevent XSS
    const escapedMessage = escapeHtml(String(message));
    toast.innerHTML = `<i class="fas ${icon} text-xl"></i><span class="font-bold text-sm text-slate-700">${escapedMessage}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), UI.TOAST_ANIMATION);
    }, UI.TOAST_DURATION);
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

// Add visual validation feedback to input fields
export function validateInput(input, isValid, errorMessage = '') {
    if (!input) return;
    
    // Remove existing validation classes
    input.classList.remove('border-red-500', 'border-green-500', 'bg-red-50', 'bg-green-50');
    
    // Remove existing error message if any
    const existingError = input.parentElement?.querySelector('.validation-error');
    if (existingError) existingError.remove();
    
    if (isValid) {
        // Valid state
        input.classList.add('border-green-500', 'bg-green-50');
    } else {
        // Invalid state
        input.classList.add('border-red-500', 'bg-red-50');
        
        // Add error message if provided
        if (errorMessage) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error text-red-500 text-xs mt-1 ml-1 font-medium animate-fade-in-up';
            
            // Create icon element
            const icon = document.createElement('i');
            icon.className = 'fas fa-exclamation-circle mr-1';
            
            // Create text node with escaped message
            const textNode = document.createTextNode(escapeHtml(errorMessage));
            
            errorDiv.appendChild(icon);
            errorDiv.appendChild(textNode);
            input.parentElement?.appendChild(errorDiv);
        }
    }
}

// Clear validation state from input
export function clearValidation(input) {
    if (!input) return;
    
    input.classList.remove('border-red-500', 'border-green-500', 'bg-red-50', 'bg-green-50');
    const existingError = input.parentElement?.querySelector('.validation-error');
    if (existingError) existingError.remove();
}
