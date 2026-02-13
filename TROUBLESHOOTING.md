# Troubleshooting Guide - Lazismu Mu'allimin

Panduan mengatasi masalah umum yang mungkin terjadi pada aplikasi Lazismu Mu'allimin.

## 🔴 Error 404: Module Not Found

### Gejala:
```
GET https://lazismumuallimin.org/js/config.js net::ERR_ABORTED 404 (Not Found)
GET https://lazismumuallimin.org/js/xxxxx.js net::ERR_ABORTED 404 (Not Found)
```

### Penyebab:
1. File tidak ter-upload ke server
2. Import path salah (relative path tidak sesuai struktur folder)
3. Typo pada nama file

### Solusi:

#### 1. Verifikasi Struktur Folder di Server
Pastikan struktur folder di server sama dengan repository:

```
lazismumuallimin.org/
├── index.html
├── config.js           ← Harus ada di ROOT
├── constants.js
├── data-santri.js
├── data-kelas.js
├── js/
│   ├── main.js
│   ├── firebase-init.js
│   ├── feature-history.js
│   ├── feature-donation.js
│   ├── feature-news.js
│   ├── feature-recap.js
│   ├── santri-manager.js
│   ├── state.js
│   ├── ui-navigation.js
│   ├── utils.js
│   └── zakat-calculator.js
├── dist/
│   └── tailwind.css
└── assets/
    ├── logos/
    └── ...
```

#### 2. Periksa Import Paths
Semua import dari folder `js/` ke `config.js` HARUS menggunakan `'../config.js'`:

```javascript
// ✅ BENAR
import { GAS_API_URL } from '../config.js';

// ❌ SALAH
import { GAS_API_URL } from './config.js';
import { GAS_API_URL } from 'config.js';
```

#### 3. Re-upload File yang Hilang
Jika file hilang, upload ulang dari repository dengan struktur yang sama.

---

## 🔴 Error: tailwindcss not found

### Gejala:
```bash
sh: 1: tailwindcss: not found
npm ERR! code 127
```

### Penyebab:
Dependencies belum diinstall (folder `node_modules` tidak ada).

### Solusi:

```bash
npm install
```

Setelah install selesai, jalankan build:

```bash
npm run build:css
```

---

## 🔴 Error: Module tidak bisa di-import

### Gejala:
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html"
```

### Penyebab:
- File dibuka langsung dari filesystem (`file:///`)
- Bukan melalui web server

### Solusi:

**JANGAN** buka `index.html` langsung dengan double-click!

**GUNAKAN** web server lokal:

**Opsi 1: Python**
```bash
python3 -m http.server 8080
# Buka: http://localhost:8080
```

**Opsi 2: VS Code Live Server**
1. Install extension "Live Server"
2. Klik kanan pada `index.html`
3. Pilih "Open with Live Server"

**Opsi 3: Node.js http-server**
```bash
npx http-server -p 8080
# Buka: http://localhost:8080
```

---

## 🔴 CSS Tidak Berubah Setelah Edit

### Gejala:
Edit file CSS tapi tampilan tidak berubah.

### Penyebab:
- Cache browser
- Lupa rebuild Tailwind CSS
- Edit file yang salah

### Solusi:

#### 1. Rebuild CSS
```bash
npm run build:css
```

#### 2. Clear Cache Browser
- Chrome/Edge: `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)
- Firefox: `Ctrl + F5`

#### 3. Pastikan Edit File yang Benar

**File Source** (yang harus di-edit):
- `src/input.css` (Tailwind directives)
- `style.css` (Custom CSS)
- `tailwind.config.js` (Tailwind configuration)

**File Build Result** (JANGAN di-edit):
- `dist/tailwind.css` (Auto-generated, akan di-overwrite)

#### 4. Gunakan Watch Mode untuk Development
```bash
npm run watch:css
```

Mode ini akan auto-rebuild setiap kali ada perubahan.

---

## 🔴 Firebase Error / Auth Tidak Berfungsi

### Gejala:
```
Firebase: Error (auth/...)
Failed to load resource: Firebase
```

### Penyebab:
1. Koneksi internet bermasalah
2. Firebase config salah
3. Firebase services diblokir firewall/ad-blocker

### Solusi:

#### 1. Periksa Koneksi Internet
Pastikan terkoneksi ke internet.

#### 2. Verifikasi Firebase Config
Buka `config.js` dan pastikan konfigurasi benar:

```javascript
export const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    // ... dst
};
```

#### 3. Disable Ad-blocker
Beberapa ad-blocker memblokir Firebase. Coba disable untuk domain ini.

#### 4. Cek Firewall
Pastikan firewall tidak memblokir:
- `*.googleapis.com`
- `*.firebaseapp.com`
- `*.gstatic.com`

---

## 🔴 Data Santri Tidak Muncul

### Gejala:
Dropdown kelas/santri kosong atau data tidak muncul.

### Penyebab:
1. File `data-santri.js` atau `data-kelas.js` tidak ter-load
2. Script tidak defer/async dengan benar
3. Data cache expired

### Solusi:

#### 1. Periksa Console Browser
Buka Developer Tools (F12) → Console.
Lihat apakah ada error loading script.

#### 2. Verifikasi Script Tags di HTML
Pastikan di `index.html` ada:

```html
<script src="data-santri.js" defer></script>
<script src="data-kelas.js" defer></script>
<script type="module" src="js/main.js"></script>
```

#### 3. Clear localStorage
```javascript
// Jalankan di Console browser:
localStorage.clear();
location.reload();
```

---

## 🔴 Deployment ke Hosting Gagal

### Gejala:
Aplikasi work di local tapi error di production.

### Checklist Pre-Deployment:

- [ ] Build CSS: `npm run build:css`
- [ ] Test di local server (bukan file://)
- [ ] Periksa console tidak ada error
- [ ] Verifikasi semua file ada di repository
- [ ] Struktur folder sesuai
- [ ] Git ignore `node_modules/`

### File yang HARUS di-upload:

```
✅ index.html
✅ config.js (di ROOT, bukan di js/)
✅ constants.js
✅ data-santri.js
✅ data-kelas.js
✅ style.css
✅ tailwind.config.js (optional, untuk backup)
✅ cetak.html
✅ maintenance_page.html (optional)

✅ js/ (semua file .js di dalamnya)
✅ dist/tailwind.css
✅ assets/ (semua isi folder)

❌ node_modules/ (JANGAN upload!)
❌ package-lock.json (optional)
❌ .git/ (JANGAN upload!)
```

### Post-Deployment Verification:

1. Buka URL production
2. Buka Developer Tools (F12) → Console
3. Refresh halaman (Ctrl + Shift + R)
4. Periksa:
   - ✅ Tidak ada error 404
   - ✅ Tidak ada error module
   - ✅ Aplikasi terload dengan benar

---

## 📞 Bantuan Lebih Lanjut

Jika masih ada masalah:

1. **Check Repository:** [github.com/fadiahaswat/lazismumuallimin](https://github.com/fadiahaswat/lazismumuallimin)
2. **Baca README.md** untuk setup lengkap
3. **Lihat Recent Commits** untuk perubahan terbaru
4. **Create Issue** di GitHub jika menemukan bug baru

---

## 🔧 Quick Fixes Cheat Sheet

| Masalah | Quick Fix |
|---------|-----------|
| tailwindcss not found | `npm install` |
| CSS tidak update | `npm run build:css` + Clear cache |
| 404 module error | Periksa import path dan struktur folder |
| Firebase error | Check internet + config.js |
| Module loading error | Gunakan web server, jangan buka file:// |
| Data tidak muncul | Clear localStorage + reload |

---

**Last Updated:** 2026-02-13  
**Version:** 1.0
