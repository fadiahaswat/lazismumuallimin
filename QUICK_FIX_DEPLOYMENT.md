# ⚡ QUICK FIX - Bot Detection Masih Menolak Donasi

## 🔴 Masalah
Console menunjukkan: **"Sistem mendeteksi aktivitas mencurigakan (Bot). Donasi ditolak."**

## ✅ Solusi Cepat

### Kenapa Masih Ditolak?
Perubahan `code.gs` di repository **belum di-deploy** ke Google Apps Script!

### Langkah Fix (5 Menit):

1. **Buka Google Apps Script**
   - Buka Google Sheets donasi Anda
   - Klik **Extensions** > **Apps Script**

2. **Backup Code Lama**
   - Select All (Ctrl+A) → Copy (Ctrl+C)
   - Save ke file lokal

3. **Update Threshold**
   - Cari baris: `const RECAPTCHA_THRESHOLD = 0.3;` (atau `0.5`)
   - Ubah jadi: `const RECAPTCHA_THRESHOLD = 0.2;`
   - Atau copy full code dari `code.gs` di repository ini

4. **JANGAN LUPA** restore credentials:
   ```javascript
   const SPREADSHEET_ID = "COPY_DARI_BACKUP";
   const SECRET_KEY = "COPY_DARI_BACKUP";
   ```

5. **Save & Deploy**
   - Save (Ctrl+S)
   - Deploy > Manage deployments
   - Edit deployment yang ada (JANGAN buat baru!)
   - Version: "New version"
   - Description: "Lower threshold to 0.2"
   - Deploy

6. **Test**
   - Refresh website donasi
   - Coba submit donasi
   - Harus berhasil sekarang! ✅

## 🔍 Verifikasi Berhasil

Di Apps Script Editor, jalankan function `getCurrentThreshold()`:
- Klik Run > getCurrentThreshold
- View > Logs
- Harus terlihat: **"Current reCAPTCHA Threshold: 0.2"**

## 📖 Detail Lengkap

Lihat: **DEPLOYMENT_INSTRUCTIONS.md**

## ⚠️ Penting

- URL deployment **JANGAN SAMPAI BERUBAH**
- Selalu Edit deployment yang ada, jangan buat baru
- Jika URL berubah, update `config.js` juga
