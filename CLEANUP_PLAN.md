# Repository Cleanup & Code Synchronization Plan

## Masalah yang Ditemukan

### 1. **CRITICAL: Fungsi di main.js yang seharusnya di module terpisah**

**Masalah:**
- `formatInputRupiah()` dan `switchZakatMode()` didefinisikan di `main.js` (lines 266-286)
- Fungsi-fungsi ini dipanggil dari `feature-donation.js` via `window.*`
- Ini menciptakan coupling yang tidak perlu dan masalah sinkronisasi

**Solusi:**
- Pindahkan kedua fungsi ke file baru: `zakat-calculator.js`
- Export sebagai module ES6
- Import di `feature-donation.js` dan `main.js`
- Hapus exposure ke `window.*`

### 2. **CRITICAL: Defensive typeof checks untuk imported modules**

**Masalah:**
```javascript
// main.js:277, 383, 410
if(typeof donasiData !== 'undefined') { ... }
```

**Penyebab:**
- Import sudah ada di line 11: `import { donasiData } from './state.js'`
- Defensive check menandakan ada masalah sinkronisasi di masa lalu

**Solusi:**
- Hapus semua `typeof` checks untuk `donasiData` karena sudah di-import
- Gunakan langsung (guaranteed to exist with ES6 imports)

### 3. **MEDIUM: Race conditions dengan window.santriData dan window.classMetaData**

**Masalah:**
```javascript
// firebase-init.js:85
if (typeof window.santriData === 'undefined' || window.santriData.length === 0) {
    await parseSantriData();
}
```

**Penyebab:**
- Data loading dari `data-santri.js` dan `data-kelas.js` (defer scripts)
- Module ES6 (`main.js`) mungkin execute sebelum defer scripts

**Solusi:**
- Ensure proper loading order with Promise.all
- Remove defensive typeof checks where not needed
- Use consistent patterns

### 4. **MEDIUM: Timing-dependent code (setTimeout delays)**

**Masalah:**
```javascript
// feature-donation.js:10
const DOM_UPDATE_DELAY_MS = 50;

// feature-donation.js:260
setTimeout(() => { ... }, DOM_UPDATE_DELAY_MS);
```

**Penyebab:**
- Race condition antara page visibility dan step navigation
- Fragile, depends on execution speed

**Solusi:**
- Replace dengan Promise-based approach
- Use requestAnimationFrame for DOM updates
- Add proper event listeners

### 5. **LOW: Inconsistent error handling**

**Masalah:**
- Beberapa functions punya try-catch dengan showToast
- Beberapa hanya console.error
- Beberapa tidak ada error handling sama sekali

**Solusi:**
- Standardize error handling pattern
- Always show user feedback for user-facing errors
- Always log to console for debugging

## Prioritas Perbaikan

### Phase 1: Critical Fixes (Hari ini)
1. ✅ Create `zakat-calculator.js` module
2. ✅ Move `formatInputRupiah()` and `switchZakatMode()` 
3. ✅ Update imports in `feature-donation.js` and `main.js`
4. ✅ Remove `typeof donasiData !== 'undefined'` checks
5. ✅ Test zakat flow still works

### Phase 2: Synchronization (Berikutnya)
6. ⏳ Fix race conditions with santriData/classMetaData
7. ⏳ Replace setTimeout with proper event-driven code
8. ⏳ Standardize error handling patterns

### Phase 3: Polish (Optional)
9. ⏳ Add JSDoc comments
10. ⏳ Remove duplicate code
11. ⏳ Optimize imports

## Testing Checklist

- [ ] Zakat calculator berfungsi normal
- [ ] Infaq donation berfungsi normal  
- [ ] Data santri loading properly
- [ ] No console errors
- [ ] All features working as before

