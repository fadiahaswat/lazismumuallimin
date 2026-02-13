# Lazismu Mu'allimin Website

Website untuk Lazismu Mu'allimin - Menempa Kader, Memberdaya Umat

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
├── assets/              # Aset statis
│   ├── images/         # Gambar umum (bank icons, templates, dll)
│   ├── logos/          # Logo dan branding
│   └── photos/         # Foto (bangunan, orang, fasilitas)
├── js/                  # JavaScript modules
│   ├── feature-*.js    # Feature modules (donation, history, news, recap)
│   ├── firebase-init.js
│   ├── main.js         # Main application entry point
│   ├── santri-manager.js
│   ├── state.js
│   ├── ui-navigation.js
│   ├── utils.js
│   └── zakat-calculator.js
├── src/
│   └── input.css        # Source file Tailwind CSS
├── dist/
│   └── tailwind.css     # Compiled & minified CSS (generated)
├── config.js            # Konfigurasi API & Firebase
├── constants.js         # Konstanta aplikasi
├── data-kelas.js        # Data kelas
├── data-santri.js       # Data santri
├── index.html           # Halaman utama
├── maintenance_page.html # Halaman maintenance
├── cetak.html           # Template cetak
├── tailwind.config.js   # Konfigurasi Tailwind CSS
└── package.json         # Dependencies dan scripts
```

## Production Deployment

Sebelum deploy ke production:

1. Build CSS dengan command: `npm run build:css`
2. Pastikan file `dist/tailwind.css` sudah ter-commit
3. Upload semua files ke server

## Google Apps Script Setup

Website ini menggunakan Google Apps Script sebagai backend untuk menyimpan data donasi ke Google Sheets.

### Setup Script

1. Buka [Google Apps Script](https://script.google.com)
2. Buat project baru
3. Copy isi file `code.gs` ke Apps Script editor
4. Update konfigurasi berikut:
   - `SPREADSHEET_ID`: ID Google Sheets Anda
   - `SECRET_KEY`: Secret key untuk reCAPTCHA v3
5. Deploy sebagai Web App
6. Update `GAS_API_URL` di `config.js` dengan URL deployment

### Integrasi reCAPTCHA v3

Website ini menggunakan Google reCAPTCHA v3 untuk keamanan. Pastikan:
- Site Key sudah dikonfigurasi di `config.js`
- Secret Key sudah dikonfigurasi di Google Apps Script (`code.gs`)
- Script reCAPTCHA sudah dimuat di `index.html`

#### Troubleshooting reCAPTCHA

Jika donasi terdeteksi sebagai bot:

1. **Periksa Threshold**: Buka `code.gs` dan cari `RECAPTCHA_THRESHOLD` (default: 0.5)
   - Nilai lebih rendah (0.2-0.3) lebih permisif
   - Nilai lebih tinggi (0.6-0.9) lebih ketat
   
2. **Debug dengan Console**: 
   - Buka Browser Console (tekan `F12`)
   - Submit donasi dan lihat log detail
   - Console akan menampilkan reCAPTCHA score dan alasan penolakan

3. **Verifikasi Konfigurasi**:
   - Pastikan Site Key di `config.js` cocok dengan domain Anda
   - Pastikan Secret Key di `code.gs` benar
   - Verifikasi domain terdaftar di reCAPTCHA Admin Console

## Firebase Configuration

Website menggunakan Firebase untuk autentikasi. Konfigurasi ada di `config.js`.

## Notes

- File `node_modules/` tidak di-commit (sudah ada di .gitignore)
- File CSS di `dist/` perlu di-commit karena diperlukan untuk production
- Jangan gunakan Tailwind CDN untuk production (sudah diganti dengan build process ini)
- **PENTING:** Jangan commit Secret Key reCAPTCHA ke repository publik

## License

© 2024-2026 Lazismu Mu'allimin. All rights reserved.
