# Lazismu Mu'allimin Website

Website untuk Lazismu Mu'allimin - Menempa Kader, Memberdaya Umat

## 📜 Dokumentasi Penting

### 🔥 Hot Issues & Solutions

**🆘 MASIH DIKIRA BOT?** Start here:

- **[BOT_DETECTION_QUICK_START.md](./BOT_DETECTION_QUICK_START.md)** - ⚡ **START HERE!** Quick diagnosis & fix dalam 5-10 menit
- **[TROUBLESHOOTING_BOT_DETECTION.md](./TROUBLESHOOTING_BOT_DETECTION.md)** - 📖 **PANDUAN LENGKAP** troubleshooting dengan FAQ

Additional Resources:
- **[BOT_DETECTION_FIX.md](./BOT_DETECTION_FIX.md)** - Penjelasan mendalam tentang threshold & bot detection
- **[RECAPTCHA_FIX.md](./RECAPTCHA_FIX.md)** - Fix HTML entities & reCAPTCHA config
- **[CONSOLE_LOGGING_GUIDE.md](./CONSOLE_LOGGING_GUIDE.md)** - Debug dengan browser console
- **[SOLUTION_SUMMARY.md](./SOLUTION_SUMMARY.md)** - Ringkasan solusi
- **[QUICK_FIX_BOT.md](./QUICK_FIX_BOT.md)** - Legacy quick fix guide

### 🔒 Security & Configuration
- **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)** - 🔐 Panduan keamanan untuk setup credentials

### 📚 General Documentation
- **[SK Lazismu DIY 2026](./SK_LAZISMU_DIY_2026.md)** - Surat Keputusan tentang Penetapan Besaran Zakat Fitri, Nishab Zakat Maal, dan Fidyah tahun 1447 H/2026 M
- **[INDEX.md](./INDEX.md)** - Dokumentasi lengkap proyek

## Setup & Development

### Prerequisites
- Node.js (versi 14 atau lebih baru)
- npm (sudah termasuk dengan Node.js)

### Installation

1. Clone repository ini
2. Install dependencies:
```bash
npm install
```

### Building CSS

Website ini menggunakan Tailwind CSS dengan build process. Untuk build CSS:

```bash
npm run build:css
```

File CSS yang di-compile akan di-generate di `dist/tailwind.css`.

### Development

Untuk development dengan auto-rebuild CSS saat ada perubahan:

```bash
npm run watch:css
```

## Tailwind Configuration

Konfigurasi Tailwind CSS ada di file `tailwind.config.js` dengan custom settings:

- **Custom Colors**: 
  - `brand-orange`: #F15A22
  - `brand-dark`: #1e293b

- **Custom Fonts**:
  - Sans: Plus Jakarta Sans
  - Arabic: Amiri

- **Custom Animations**:
  - `fade-in-up`: Fade in dengan efek slide ke atas
  - `pulse-slow`: Pulse animation yang lebih lambat

## File Structure

```
.
├── src/
│   └── input.css          # Source file Tailwind CSS
├── dist/
│   └── tailwind.css       # Compiled & minified CSS (generated)
├── index.html             # Halaman utama
├── maintenance_page.html  # Halaman maintenance
├── index_notwork.html     # Halaman alternatif
├── tailwind.config.js     # Konfigurasi Tailwind CSS
├── package.json           # Dependencies dan scripts
└── .gitignore            # Files yang tidak di-commit
```

## Production Deployment

Sebelum deploy ke production:

1. Build CSS dengan command: `npm run build:css`
2. Pastikan file `dist/tailwind.css` sudah ter-commit
3. Upload semua files ke server

## Google Apps Script Setup

Website ini menggunakan Google Apps Script sebagai backend untuk menyimpan data donasi ke Google Sheets. Setup lengkap:

1. **File `code.gs`** berisi kode Google Apps Script yang sudah diperbaiki
2. **Lihat `RECAPTCHA_FIX.md`** untuk panduan lengkap setup dan troubleshooting
3. **Deploy script** ke Google Apps Script dan update `GAS_API_URL` di `config.js`

### Integrasi reCAPTCHA v3

Website ini menggunakan Google reCAPTCHA v3 untuk keamanan. Pastikan:
- Site Key sudah dikonfigurasi di `config.js`
- Secret Key sudah dikonfigurasi di Google Apps Script (`code.gs`)
- Script reCAPTCHA sudah dimuat di `index.html`

📖 **Baca [RECAPTCHA_FIX.md](./RECAPTCHA_FIX.md) untuk panduan lengkap troubleshooting masalah reCAPTCHA**

### ⚠️ Troubleshooting: Masih Dikira Bot?

Jika Anda masih terdeteksi sebagai bot setelah mengisi donasi:

**📖 Baca [TROUBLESHOOTING_BOT_DETECTION.md](./TROUBLESHOOTING_BOT_DETECTION.md) - Panduan Lengkap!**

Panduan ini mencakup:
- ✅ Identifikasi masalah (3 jenis masalah umum)
- ✅ Fix HTML entities (`&amp;`, `&gt;=`, `=&gt;`) yang merusak code
- ✅ Turunkan threshold reCAPTCHA (0.5 → 0.2)
- ✅ Verifikasi konfigurasi reCAPTCHA
- ✅ Testing dan debugging step-by-step
- ✅ FAQ lengkap dengan 10+ pertanyaan umum

**Solusi Cepat (TL;DR):**
1. Fix HTML entities di `code.gs` (lihat panduan lengkap)
2. Ubah `RECAPTCHA_THRESHOLD` dari `0.5` ke `0.2`
3. Redeploy Google Apps Script
4. Test donasi

---

### 📝 Troubleshooting: Donasi Manual Terdeteksi sebagai BOT (Legacy)

> ⚠️ **DEPRECATED:** Gunakan [TROUBLESHOOTING_BOT_DETECTION.md](./TROUBLESHOOTING_BOT_DETECTION.md) untuk panduan terbaru!

Jika donasi manual terdeteksi sebagai BOT, kemungkinan threshold reCAPTCHA terlalu ketat (default: 0.5).

**Solusi Cepat:**
1. Buka file `code.gs` di Google Apps Script Editor
2. Cari konstanta `RECAPTCHA_THRESHOLD` (baris ~20)
3. Ubah dari `0.5` menjadi `0.2`
4. Save dan deploy ulang

📖 **Baca [BOT_DETECTION_FIX.md](./BOT_DETECTION_FIX.md) untuk panduan lengkap mengatasi masalah bot detection**

### 🔍 Debug dengan Console Logging (NEW!)

Website sekarang dilengkapi dengan comprehensive console logging untuk membantu debug masalah bot detection.

**Cara menggunakan:**
1. Buka Browser Console (tekan `F12`)
2. Submit donasi
3. Lihat log detail di console:
   - 🔐 reCAPTCHA token generation
   - 📤 Request/response details
   - 🤖 Bot detection analysis (jika ditolak)
   - 💡 Solutions langsung di console

Console akan menunjukkan:
- **Kenapa ditolak** (6 possible causes)
- **Cara memperbaiki** (6 actionable solutions)
- **reCAPTCHA score** (jika tersedia)
- **Score interpretation** (0.0-1.0 meaning)

📖 **Baca [CONSOLE_LOGGING_GUIDE.md](./CONSOLE_LOGGING_GUIDE.md) untuk panduan lengkap console debugging**

## Notes

- File `node_modules/` tidak di-commit (sudah ada di .gitignore)
- File CSS di `dist/` perlu di-commit karena diperlukan untuk production
- Jangan gunakan Tailwind CDN untuk production (sudah diganti dengan build process ini)
- **PENTING:** Jangan commit Secret Key reCAPTCHA ke repository publik
