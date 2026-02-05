// Zakat Calculator and Management Module
import { donasiData } from './state.js';
import { showToast, formatRupiah, formatNumber } from './utils.js';
import { ZAKAT } from './constants.js';
import { showElement, hideElement } from './dom-utils.js';
import { goToStep } from './feature-donation.js';

/**
 * Format input as Rupiah and update donation state
 * @param {HTMLInputElement} input - The input element to format
 */
export function formatInputRupiah(input) {
    let val = input.value.replace(/\D/g, ''); 
    if (val === '') {
        input.value = '';
    } else {
        input.value = formatNumber(val);
    }
    
    // Update state immediately when typing
    if (input.id === 'manual-zakat-input') {
        const numVal = parseInt(val) || 0;
        if (typeof donasiData !== 'undefined') {
            donasiData.nominal = numVal;
            donasiData.nominalAsli = numVal;
        }
    }
}

/**
 * Switch between manual and calculator zakat modes
 * @param {string} mode - 'manual' or 'calculator'
 */
export function switchZakatMode(mode) {
    const btnManual = document.getElementById('btn-mode-manual');
    const btnCalc = document.getElementById('btn-mode-calculator');
    const divManual = document.getElementById('mode-manual');
    const divCalc = document.getElementById('mode-calculator');

    if (!btnManual || !btnCalc || !divManual || !divCalc) return;

    // Style definitions
    const activeClass = "bg-white text-slate-800 shadow-sm border-slate-200 ring-1 ring-slate-100";
    const inactiveClass = "text-slate-500 hover:text-slate-800 hover:bg-white/60 border-transparent";

    // Update button classes
    btnManual.className = `flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold transition-all border ${mode === 'manual' ? activeClass : inactiveClass}`;
    btnCalc.className = `flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold transition-all border ${mode === 'calculator' ? activeClass : inactiveClass}`;

    // Toggle visibility and animation
    if (mode === 'manual') {
        divManual.classList.remove('hidden');
        divManual.classList.add('animate-fade-in-up');
        divCalc.classList.add('hidden');
    } else {
        divCalc.classList.remove('hidden');
        divCalc.classList.add('animate-fade-in-up');
        divManual.classList.add('hidden');
    }
}

/**
 * Calculate zakat based on assets and liabilities
 */
export function calculateZakat() {
    const inputs = document.querySelectorAll('.calc-input');
    let totalHarta = 0;
    let hutang = 0;

    // Get first 3 inputs (Assets)
    for (let i = 0; i < 3; i++) {
        if (inputs[i]) {
            let val = inputs[i].value.replace(/\D/g, '');
            totalHarta += parseInt(val || 0);
        }
    }
    
    // 4th input = Liabilities
    if (inputs[3]) {
        let valHutang = inputs[3].value.replace(/\D/g, '');
        hutang = parseInt(valHutang || 0);
    }

    const hartaBersih = totalHarta - hutang;
    
    const resultDiv = document.getElementById('calc-result');
    if (resultDiv) resultDiv.classList.remove('hidden');
    
    const elTotal = document.getElementById('total-harta');
    if (elTotal) elTotal.innerText = formatRupiah(hartaBersih);

    const divWajib = document.getElementById('status-wajib');
    const divTidak = document.getElementById('status-tidak-wajib');

    if (hartaBersih >= ZAKAT.NISAB_TAHUN) {
        showElement('status-wajib');
        hideElement('status-tidak-wajib');

        const zakat = Math.ceil(hartaBersih * ZAKAT.RATE);
        const elAmount = document.getElementById('final-zakat-amount');
        if (elAmount) {
            elAmount.innerText = formatRupiah(zakat);
            elAmount.dataset.value = zakat;
        }
    } else {
        hideElement('status-wajib');
        showElement('status-tidak-wajib');
        
        // Reset value if not required to pay zakat
        const elAmount = document.getElementById('final-zakat-amount');
        if (elAmount) elAmount.dataset.value = 0;
    }
    
    if (resultDiv) resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Apply calculated zakat result to manual input
 */
export function applyZakatResult() {
    const elAmount = document.getElementById('final-zakat-amount');
    if (!elAmount) return;
    
    let nominal = parseInt(elAmount.dataset.value) || 0;
    
    // Switch to manual tab
    switchZakatMode('manual');
    
    // Fill manual input
    const inputManual = document.getElementById('manual-zakat-input');
    if (inputManual) {
        if (nominal > 0) {
            inputManual.value = formatNumber(nominal);
            
            // Force update state
            if (typeof donasiData !== 'undefined') {
                donasiData.nominal = nominal;
                donasiData.nominalAsli = nominal;
            }
        } else {
            inputManual.value = "";
            inputManual.focus();
        }
    }
}

/**
 * Handle manual zakat input and proceed to next step
 */
export function handleManualZakatNext() {
    const input = document.getElementById('manual-zakat-input');
    if (!input) return;

    // Get clean value from input
    const cleanVal = parseInt(input.value.replace(/\D/g, '')) || 0;

    if (cleanVal < ZAKAT.MIN_NOMINAL) {
        if (typeof showToast === 'function') {
            showToast(`Minimal nominal zakat ${formatRupiah(ZAKAT.MIN_NOMINAL)}`, 'warning');
        } else {
            alert(`Minimal nominal zakat ${formatRupiah(ZAKAT.MIN_NOMINAL)}`);
        }
        return;
    }

    // Save to global state
    if (typeof donasiData === 'undefined') {
        console.error("CRITICAL: donasiData undefined in feature-zakat.js");
        alert("Terjadi kesalahan sistem (State Error). Silakan refresh halaman.");
        return;
    }

    // Set data
    donasiData.nominal = cleanVal;
    donasiData.nominalAsli = cleanVal;
    donasiData.type = 'Zakat Maal'; 
    donasiData.subType = null; // Ensure subType is empty so it's not treated as infaq

    console.log("Zakat Maal Saved:", donasiData);

    // Move to step 3 (skip step 2 nominal buttons)
    if (typeof goToStep === 'function') {
        goToStep(3);
    } else {
        // Manual fallback if goToStep errors
        console.warn("goToStep function missing, using fallback");
        hideElement('donasi-step-1');
        hideElement('donasi-step-2');
        
        const step3 = document.getElementById('donasi-step-3');
        if (step3) {
            step3.classList.remove('hidden');
            step3.classList.add('animate-fade-in-up');
        }
        
        // Update wizard UI manually
        const indicator = document.getElementById('wizard-step-indicator');
        const bar = document.getElementById('wizard-progress-bar');
        const title = document.getElementById('wizard-title');
        
        if (indicator) indicator.innerText = "Step 3/5";
        if (bar) bar.style.width = "60%";
        if (title) title.innerText = "Isi Data Diri";
    }
}
