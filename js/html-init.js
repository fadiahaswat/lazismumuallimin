// html-init.js
// Hydrates HTML elements with values from config.js and constants.js.
// This prevents hardcoded contact info, bank accounts, social links, and
// zakat rates from being scattered across static HTML.
// Must be loaded as type="module" at the end of <body>.

import {
    RECAPTCHA_SITE_KEY,
    CONTACT,
    SOCIAL_LINKS,
    BANK_ACCOUNTS,
    QUICK_NOMINALS
} from '../config.js';
import { ZAKAT } from '../constants.js';

// ============================================================
// 1. INJECT RECAPTCHA SCRIPT DYNAMICALLY
//    Removes the need to hardcode the site key in <head>
// ============================================================
(function injectRecaptcha() {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    document.head.appendChild(script);
})();

// All DOM hydration runs after the document is fully parsed
document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    // 2. HYDRATE WHATSAPP LINKS  [data-wa-link]
    //    Use data-wa-type="consult" for the pre-filled consult message
    // ============================================================
    document.querySelectorAll('[data-wa-link]').forEach(el => {
        const waType = el.dataset.waType;
        if (waType === 'consult') {
            el.href = `https://wa.me/${CONTACT.WA_NUMBER}?text=${encodeURIComponent(CONTACT.WA_CONSULT_TEXT)}`;
        } else {
            el.href = `https://wa.me/${CONTACT.WA_NUMBER}`;
        }
    });

    // ============================================================
    // 3. HYDRATE WHATSAPP DISPLAY TEXT  [data-wa-display]
    // ============================================================
    document.querySelectorAll('[data-wa-display]').forEach(el => {
        el.textContent = CONTACT.WA_DISPLAY;
    });

    // ============================================================
    // 4. HYDRATE BANK ACCOUNT DISPLAY NUMBERS  [data-bank-display]
    // ============================================================
    document.querySelectorAll('[data-bank-display]').forEach(el => {
        const bank = el.dataset.bankDisplay;
        if (BANK_ACCOUNTS[bank]) el.textContent = BANK_ACCOUNTS[bank].displayNumber;
    });

    // ============================================================
    // 5. HYDRATE BANK COPY BUTTONS  [data-bank-copy]
    // ============================================================
    document.querySelectorAll('[data-bank-copy]').forEach(btn => {
        const bank = btn.dataset.bankCopy;
        if (BANK_ACCOUNTS[bank]) {
            btn.onclick = () => window.copyText(BANK_ACCOUNTS[bank].accountNumber);
        }
    });

    // ============================================================
    // 6. HYDRATE SOCIAL MEDIA LINKS  [data-social]
    // ============================================================
    document.querySelectorAll('[data-social]').forEach(link => {
        const platform = link.dataset.social;
        if (SOCIAL_LINKS[platform]) link.href = SOCIAL_LINKS[platform];
    });

    // ============================================================
    // 7. HYDRATE QUICK NOMINAL BUTTONS  [data-quick-nominal]
    //    data-quick-nominal="i" maps to QUICK_NOMINALS[i]
    // ============================================================
    document.querySelectorAll('[data-quick-nominal]').forEach(btn => {
        const idx = parseInt(btn.dataset.quickNominal, 10);
        if (!isNaN(idx) && QUICK_NOMINALS[idx] !== undefined) {
            btn.dataset.nominal = QUICK_NOMINALS[idx];
        }
    });

    // ============================================================
    // 8. HYDRATE ZAKAT DISPLAY VALUES
    // ============================================================
    document.querySelectorAll('[data-zakat-fitrah]').forEach(el => {
        el.textContent = `Rp ${ZAKAT.FITRAH.toLocaleString('id-ID')}`;
    });

    document.querySelectorAll('[data-zakat-fidyah]').forEach(el => {
        el.textContent = `Rp ${ZAKAT.FIDYAH.toLocaleString('id-ID')}`;
    });

    document.querySelectorAll('[data-zakat-nisab-tahun]').forEach(el => {
        el.textContent = `Rp ${ZAKAT.NISAB_TAHUN.toLocaleString('id-ID')}`;
    });

    document.querySelectorAll('[data-zakat-nisab-bulan]').forEach(el => {
        el.textContent = `Rp ${ZAKAT.NISAB_BULAN.toLocaleString('id-ID')}`;
    });

});
