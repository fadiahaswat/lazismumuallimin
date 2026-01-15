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

## Notes

- File `node_modules/` tidak di-commit (sudah ada di .gitignore)
- File CSS di `dist/` perlu di-commit karena diperlukan untuk production
- Jangan gunakan Tailwind CDN untuk production (sudah diganti dengan build process ini)
