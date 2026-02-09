# Panduan Perbaikan Google reCAPTCHA v3 Integration

## 🔍 Masalah yang Ditemukan

Data donasi tidak masuk ke Google Sheet database karena terdapat **HTML entities** dalam file `code.gs` yang menyebabkan syntax error JavaScript. HTML entities ini mencegah script dari berjalan dengan benar.

### Detail Kesalahan:

1. **Baris 37 dalam `verifikasiRecaptcha`:**
   ```javascript
   // ❌ SALAH (HTML entity)
   const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET_KEY + "&amp;response=" + token;
   
   // ✅ BENAR
   const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET_KEY + "&response=" + token;
   ```

2. **Baris 223 dalam `readData`:**
   ```javascript
   // ❌ SALAH (HTML entity)
   if (lastRow &amp;lt;= 1) return [];
   
   // ✅ BENAR
   if (lastRow <= 1) return [];
   ```

3. **Baris 228 dalam `readData`:**
   ```javascript
   // ❌ SALAH (HTML entity)
   return values.map((row, index) =&gt; ({
   
   // ✅ BENAR
   return values.map((row, index) => ({
   ```

## 🔧 Cara Memperbaiki

### Langkah 1: Backup Script Lama

1. Buka [Google Apps Script Editor](https://script.google.com/)
2. Buka project script Anda yang terhubung dengan spreadsheet
3. Copy semua kode yang ada dan simpan sebagai backup

### Langkah 2: Replace dengan Kode yang Sudah Diperbaiki

1. Hapus semua kode dalam file `Code.gs`
2. Copy seluruh isi dari file `code.gs` yang ada di repository ini
3. Paste ke Google Apps Script Editor
4. **PENTING:** Ganti `SECRET_KEY` dengan secret key reCAPTCHA Anda:
   ```javascript
   const SECRET_KEY = "GANTI_DENGAN_SECRET_KEY_ANDA";
   ```

### Langkah 3: Verifikasi Konfigurasi

Pastikan nilai-nilai berikut sudah benar:

```javascript
// ID Spreadsheet Anda
const SPREADSHEET_ID = "1EhFeSGfar1mqzEQo5CgncmDr8nflFqcSyAaXAFmWFqE";

// Nama Sheet (Tab)
const SHEET_NAME = "DataDonasi";
const SHEET_KUITANSI = "DataKuitansi";

// reCAPTCHA Secret Key (dari Google reCAPTCHA Console)
const SECRET_KEY = "6LdhLGIsAAAAABVKoyyNjpCjIt8z_eF54m1NyUQm";
```

### Langkah 4: Deploy Ulang

1. Klik **Deploy** > **New deployment**
2. Pilih type: **Web app**
3. Konfigurasi:
   - **Execute as:** Me (email Anda)
   - **Who has access:** Anyone
4. Klik **Deploy**
5. Copy **Web app URL** yang baru
6. Update `GAS_API_URL` di file `config.js` dengan URL baru (jika berbeda)

### Langkah 5: Test

1. Buka website donasi Anda
2. Coba submit formulir donasi
3. Cek Google Sheet apakah data masuk

## 📋 Checklist Verifikasi

- [ ] File `code.gs` tidak mengandung HTML entities (`&amp;`, `&lt;`, `&gt;`)
- [ ] `SPREADSHEET_ID` sesuai dengan ID spreadsheet Anda
- [ ] `SECRET_KEY` reCAPTCHA sudah diisi dengan benar
- [ ] Tab `DataDonasi` dan `DataKuitansi` sudah dibuat di spreadsheet
- [ ] Script sudah di-deploy sebagai Web app
- [ ] `GAS_API_URL` di `config.js` sudah sesuai dengan deployment URL
- [ ] `RECAPTCHA_SITE_KEY` di `config.js` sudah benar
- [ ] Script reCAPTCHA sudah dimuat di `index.html`

## 🔑 Mendapatkan reCAPTCHA Keys

Jika Anda belum memiliki reCAPTCHA keys:

1. Buka [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Klik **Create** atau **+** untuk membuat site baru
3. Isi form:
   - **Label:** Nama website Anda
   - **reCAPTCHA type:** reCAPTCHA v3
   - **Domains:** Domain website Anda (misal: `lazismumuallimin.com`)
4. Submit
5. Copy **Site Key** dan **Secret Key**:
   - **Site Key** → masukkan ke `config.js` sebagai `RECAPTCHA_SITE_KEY`
   - **Secret Key** → masukkan ke `code.gs` sebagai `SECRET_KEY`

## 🧪 Testing reCAPTCHA

Untuk memastikan reCAPTCHA berfungsi:

1. Buka browser developer console (F12)
2. Submit form donasi
3. Periksa console logs untuk melihat apakah token reCAPTCHA berhasil didapat
4. Periksa response dari server untuk memastikan tidak ada error
5. Verifikasi data masuk ke Google Sheet

### Debug Logs yang Berguna:

Tambahkan logging di Apps Script untuk debug:

```javascript
function verifikasiRecaptcha(token) {
  const SECRET_KEY = "YOUR_SECRET_KEY";
  const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET_KEY + "&response=" + token;
  
  Logger.log("Verifying reCAPTCHA token: " + token);
  
  const response = UrlFetchApp.fetch(url);
  const json = JSON.parse(response.getContentText());
  
  Logger.log("reCAPTCHA response: " + JSON.stringify(json));
  
  return json.success && json.score >= 0.5;
}
```

Kemudian lihat logs dengan: **View** > **Logs** di Apps Script Editor.

## ⚠️ Catatan Penting

1. **Jangan commit Secret Key:** Secret key sebaiknya tidak di-commit ke repository publik
2. **Score threshold:** Script ini menggunakan threshold score 0.5. Sesuaikan jika perlu:
   ```javascript
   return json.success && json.score >= 0.5; // Ubah 0.5 sesuai kebutuhan
   ```
3. **CORS:** Pastikan deployment di-set ke "Anyone" agar bisa diakses dari website
4. **HTML Entities:** Jika copy-paste kode dari HTML/web, selalu check untuk HTML entities

## 🚀 Ringkasan Perubahan

File `code.gs` yang sudah diperbaiki memiliki perubahan berikut:

1. ✅ Mengganti `&amp;` dengan `&` pada URL reCAPTCHA verification
2. ✅ Mengganti `&amp;lt;=` dengan `<=` pada kondisi if
3. ✅ Mengganti `=&gt;` dengan `=>` pada arrow function

Semua perubahan ini adalah perbaikan syntax yang krusial agar JavaScript dapat berjalan dengan benar.

## 📞 Support

Jika masih mengalami masalah:

1. Periksa logs di Google Apps Script: **View** > **Logs**
2. Periksa browser console untuk error di sisi client
3. Verifikasi semua konfigurasi sesuai checklist di atas
4. Pastikan reCAPTCHA keys (site key dan secret key) valid dan match
