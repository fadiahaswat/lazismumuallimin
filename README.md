# Lazismu Mu'allimin - Website Donasi

Website Lazismu Madrasah Mu'allimin Muhammadiyah Yogyakarta untuk mengelola Zakat, Infaq, dan Shodaqoh secara Amanah, Transparan, dan Profesional.

## 🚀 Cara Menjalankan Aplikasi

### Prasyarat
- Node.js (versi 14 atau lebih baru)
- npm (biasanya sudah terinstall bersama Node.js)

### Langkah-langkah Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/fadiahaswat/lazismumuallimin.git
   cd lazismumuallimin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build CSS dengan Tailwind**
   ```bash
   npm run build:css
   ```

4. **Jalankan aplikasi**
   
   Gunakan web server lokal, misalnya:
   
   **Menggunakan Python:**
   ```bash
   python3 -m http.server 8080
   ```
   
   **Atau menggunakan Live Server di VS Code**
   - Install ekstensi "Live Server"
   - Klik kanan pada `index.html` → "Open with Live Server"

5. **Akses aplikasi**
   
   Buka browser dan akses:
   ```
   http://localhost:8080
   ```

## 📦 Scripts yang Tersedia

- `npm run build:css` - Build dan minify file CSS dengan Tailwind
- `npm run watch:css` - Watch mode untuk development (auto-rebuild CSS saat ada perubahan)

## 🛠️ Teknologi yang Digunakan

- **Frontend Framework:** Vanilla JavaScript (ES6 Modules)
- **CSS Framework:** Tailwind CSS v3.4.1
- **Backend:** Google Apps Script (untuk API)
- **Database:** Google Sheets
- **Authentication:** Firebase Auth
- **Libraries:**
  - jsPDF (untuk generate PDF)
  - Font Awesome (icons)
  - Google reCAPTCHA v3 (bot protection)

## 📁 Struktur Project

```
lazismumuallimin/
├── assets/              # Asset gambar dan logo
├── dist/               # File CSS hasil build
├── js/                 # File JavaScript modular
│   ├── main.js        # Entry point aplikasi
│   ├── firebase-init.js
│   ├── feature-donation.js
│   ├── feature-history.js
│   └── ...
├── src/               # Source files
│   └── input.css     # Tailwind CSS input
├── index.html         # Halaman utama
├── config.js          # Konfigurasi API dan Firebase
├── package.json       # Dependencies npm
└── tailwind.config.js # Konfigurasi Tailwind
```

## 🔧 Konfigurasi

Konfigurasi API dan Firebase dapat diubah di file `config.js`:

- `GAS_API_URL` - URL Google Apps Script API
- `firebaseConfig` - Konfigurasi Firebase
- `RECAPTCHA_SITE_KEY` - Site key untuk reCAPTCHA

## 📝 Development

Untuk development, gunakan watch mode agar CSS otomatis rebuild saat ada perubahan:

```bash
npm run watch:css
```

## 🐛 Troubleshooting

### Error: "tailwindcss: not found"

**Solusi:** Jalankan `npm install` untuk menginstall dependencies.

### CSS tidak berubah setelah edit

**Solusi:** Rebuild CSS dengan `npm run build:css` atau gunakan watch mode.

### Module tidak ditemukan

**Solusi:** Pastikan menggunakan web server yang mendukung ES6 modules. Jangan buka file HTML langsung di browser (file://).

## 📞 Kontak

- **Alamat:** Jl. Letjen S. Parman No.68, Patangpuluhan, Wirobrajan, Yogyakarta 55252
- **Telepon:** +62-811-9696-1918
- **Instagram:** [@lazismu_muallimin](https://instagram.com/lazismu_muallimin)
- **Facebook:** [lazismumuallimin](https://facebook.com/lazismumuallimin)
- **YouTube:** [@lazismumuallimin](https://youtube.com/@lazismumuallimin)

## 📄 Lisensi

© 2024 Lazismu Mu'allimin. All rights reserved.

---

**Menempa Kader, Memberdaya Umat** 🌟
