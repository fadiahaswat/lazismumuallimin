# 🚀 Cara Deploy Perubahan code.gs ke Google Apps Script

## ⚠️ PENTING - BACA INI DULU!

Perubahan pada file `code.gs` di repository **TIDAK OTOMATIS** teraplikasi ke sistem live. File ini harus di-copy manual ke Google Apps Script dan di-deploy ulang.

## 📋 Langkah-langkah Deploy

### 1️⃣ Buka Google Apps Script Editor

1. Buka Google Sheets tempat data donasi disimpan
2. Klik **Extensions** > **Apps Script**
3. Atau buka langsung: https://script.google.com/

### 2️⃣ Backup Code Lama (WAJIB!)

1. Di Apps Script Editor, pilih semua code yang ada
2. Copy (Ctrl+C / Cmd+C)
3. Simpan di file lokal sebagai backup (misalnya: `code.gs.backup`)
4. Catat tanggal dan waktu backup

### 3️⃣ Update Code dengan Versi Baru

1. Buka file `code.gs` dari repository ini
2. Copy semua isinya (Ctrl+A, Ctrl+C)
3. Kembali ke Apps Script Editor
4. **JANGAN LUPA ISI CREDENTIALS:**
   ```javascript
   const SPREADSHEET_ID = "ISI_DENGAN_ID_SPREADSHEET_ANDA";
   const SECRET_KEY = "ISI_DENGAN_RECAPTCHA_SECRET_KEY_ANDA";
   ```
   ⚠️ Gunakan nilai dari backup code lama!

5. Paste code baru, ganti credentials di baris 20 dan 23
6. Klik **Save** (ikon disk atau Ctrl+S)

### 4️⃣ Deploy ke Production

1. Klik **Deploy** > **Manage deployments**
2. Klik **Edit** (ikon pensil) pada deployment yang aktif
3. Di bagian "Version", ubah menjadi **"New version"**
4. Tambahkan description: "Lower reCAPTCHA threshold to 0.2 for fast manual input"
5. Klik **Deploy**
6. **PENTING:** Pastikan URL deployment tidak berubah! Harus sama dengan yang di config.js:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

### 5️⃣ Verifikasi Deployment

1. Check threshold saat ini dengan menjalankan function `getCurrentThreshold()`:
   - Klik **Run** > Pilih `getCurrentThreshold`
   - Klik **Run**
   - Lihat logs: **View** > **Logs**
   - Harus terlihat: `Current reCAPTCHA Threshold: 0.2`
   - Dan: `Current setting: ✅ OPTIMAL`

2. Atau check di Execution log setelah ada submission:
   - Klik **Executions** di sidebar kiri
   - Klik execution terbaru
   - Lihat logs, cari baris "Threshold: 0.2"

### 6️⃣ Test Submission

1. Buka website donasi
2. Isi form dengan data test
3. Submit dengan kecepatan normal/cepat
4. Cek di Google Sheet apakah data masuk
5. Cek di Apps Script **Executions** untuk lihat score reCAPTCHA yang didapat

## 🔍 Troubleshooting

### Error: "Sistem mendeteksi aktivitas mencurigakan (Bot)"

**Penyebab:** Threshold masih menggunakan nilai lama (0.3 atau 0.5)

**Solusi:**
1. Verifikasi deployment sudah benar (langkah 5 di atas)
2. Check logs di Apps Script Executions
3. Pastikan `RECAPTCHA_THRESHOLD = 0.2` di code yang di-deploy
4. Pastikan menggunakan "New version" saat deploy, bukan version lama

### URL Deployment Berubah

**Penyebab:** Membuat deployment baru instead of update yang lama

**Solusi:**
1. Jangan buat deployment baru!
2. Selalu gunakan **Edit** pada deployment yang ada
3. Jika URL sudah berubah, update `config.js` dengan URL baru
4. Clear cache browser dan reload website

### Code Tidak Tersimpan

**Penyebab:** Tidak klik Save sebelum deploy

**Solusi:**
1. Pastikan klik **Save** (Ctrl+S) setelah paste code
2. Tunggu sampai ada notifikasi "Saved"
3. Baru kemudian deploy

### Credentials Hilang

**Penyebab:** Lupa restore credentials dari backup

**Solusi:**
1. Buka backup code lama
2. Copy nilai `SPREADSHEET_ID` dan `SECRET_KEY`
3. Paste ke code baru di baris 20 dan 23
4. Save dan deploy ulang

## ✅ Checklist Deployment

- [ ] Backup code lama tersimpan
- [ ] Copy code baru dari repository
- [ ] Restore SPREADSHEET_ID dari backup
- [ ] Restore SECRET_KEY dari backup
- [ ] Verify RECAPTCHA_THRESHOLD = 0.2
- [ ] Save code di Apps Script Editor
- [ ] Deploy dengan "New version" (bukan deployment baru)
- [ ] URL deployment tidak berubah
- [ ] Test function getCurrentThreshold() - harus return 0.2
- [ ] Test submission donasi - harus berhasil
- [ ] Check logs di Executions - threshold harus 0.2

## 📝 Catatan Penting

1. **Jangan commit credentials ke git!** File code.gs di repository menggunakan placeholder.
2. **Selalu backup** sebelum deploy perubahan.
3. **Test di staging** jika memungkinkan sebelum deploy ke production.
4. **Monitor logs** setelah deployment untuk ensure tidak ada error.
5. **Dokumentasikan** setiap deployment (tanggal, perubahan, alasan).

## 🆘 Jika Masih Gagal

1. Rollback ke backup code lama
2. Check apakah ada error di Executions logs
3. Verifikasi reCAPTCHA secret key masih valid
4. Test dengan submission manual yang sangat lambat
5. Lihat dokumentasi: BOT_DETECTION_FIX.md
