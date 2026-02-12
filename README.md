# Lazismu Mu'allimin Website

Website untuk Lazismu Mu'allimin - Menempa Kader, Memberdaya Umat

## 📜 Dokumentasi Penting

- **[SK Lazismu DIY 2026](./SK_LAZISMU_DIY_2026.md)** - Surat Keputusan tentang Penetapan Besaran Zakat Fitri, Nishab Zakat Maal, dan Fidyah tahun 1447 H/2026 M
- **[RECAPTCHA_FIX.md](./RECAPTCHA_FIX.md)** - Panduan troubleshooting reCAPTCHA
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

## Notes

- File `node_modules/` tidak di-commit (sudah ada di .gitignore)
- File CSS di `dist/` perlu di-commit karena diperlukan untuk production
- Jangan gunakan Tailwind CDN untuk production (sudah diganti dengan build process ini)
- **PENTING:** Jangan commit Secret Key reCAPTCHA ke repository publik
