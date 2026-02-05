# Lazismu Mu'allimin Website

Website untuk Lazismu Mu'allimin - Menempa Kader, Memberdaya Umat

## 🔒 Security Features

Aplikasi ini dilengkapi dengan fitur keamanan berlapis untuk melindungi dari berbagai ancaman:

### Client-Side Security
- ✅ **Rate Limiting**: Maksimal 5 submission per 15 menit per browser
- ✅ **Bot Detection**: Deteksi otomatis untuk mencegah spam dari bot
- ✅ **Input Validation**: Validasi semua input sebelum dikirim ke server
- ✅ **XSS Protection**: Sanitasi input untuk mencegah serangan XSS
- ✅ **Data Integrity**: Timestamp dan checksum untuk verifikasi integritas data

### Server-Side Security
- ✅ **Firestore Security Rules**: Akses database berbasis autentikasi
- ✅ **Storage Rules**: Upload file dengan validasi ukuran dan tipe
- ✅ **Google Apps Script Validation**: Validasi ulang di server-side

### Documentation
- 📖 **[KEAMANAN.md](KEAMANAN.md)** - Dokumentasi lengkap keamanan (Bahasa Indonesia)
- 📖 **[.env.example](.env.example)** - Template environment variables

**⚠️ Catatan Penting**: 
- Firebase client config (apiKey, projectId) adalah **PUBLIC BY DESIGN** dan aman
- Keamanan sebenarnya dijamin oleh **Firestore Security Rules**, bukan dengan menyembunyikan config
- Untuk detail lengkap, lihat [KEAMANAN.md](KEAMANAN.md)

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
├── config.js              # Konfigurasi API & Firebase
├── security-utils.js      # Security utilities (NEW)
├── feature-donation.js    # Donation feature dengan security
├── firebase-init.js       # Firebase authentication
├── firestore.rules        # Firestore security rules
├── storage.rules          # Storage security rules
├── KEAMANAN.md           # Dokumentasi keamanan (NEW)
├── .env.example          # Environment variables template (NEW)
├── maintenance_page.html  # Halaman maintenance
├── tailwind.config.js     # Konfigurasi Tailwind CSS
├── package.json           # Dependencies dan scripts
└── .gitignore            # Files yang tidak di-commit
```

## Production Deployment

Sebelum deploy ke production:

1. Build CSS dengan command: `npm run build:css`
2. Pastikan file `dist/tailwind.css` sudah ter-commit
3. Review dan update environment-specific settings jika diperlukan
4. Pastikan Firestore Rules sudah di-deploy dengan `firebase deploy --only firestore:rules`
5. Upload semua files ke server

### Security Checklist
- [ ] Firestore security rules sudah di-deploy
- [ ] Storage rules sudah di-deploy
- [ ] Google Apps Script sudah implement server-side validation
- [ ] Rate limiting di server-side sudah aktif (opsional tapi direkomendasikan)
- [ ] Monitoring error logs sudah di-setup

## Security Testing

Untuk test fitur keamanan, buka file `test-security.html` di browser:

```bash
# Start local server
python3 -m http.server 8080

# Open http://localhost:8080/test-security.html
```

Tests meliputi:
- Rate limiting (coba submit 6x)
- Input validation
- Bot detection
- XSS sanitization

## Notes

- File `node_modules/` tidak di-commit (sudah ada di .gitignore)
- File CSS di `dist/` perlu di-commit karena diperlukan untuk production
- Jangan gunakan Tailwind CDN untuk production (sudah diganti dengan build process ini)
