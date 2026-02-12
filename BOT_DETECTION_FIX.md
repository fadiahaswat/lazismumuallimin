# Perbaikan: Donasi Manual Terdeteksi sebagai BOT

## 🔍 Masalah

Saat menginput donasi secara manual, sistem mendeteksi input tersebut sebagai BOT dan menolak donasi.

**Pesan Error yang Muncul:**
```
Bot activity detected / Aktivitas bot terdeteksi
```

## 🎯 Penyebab Masalah

Google reCAPTCHA v3 memberikan skor dari 0.0 (bot) sampai 1.0 (manusia) untuk setiap interaksi. Threshold (ambang batas) menentukan skor minimum yang dianggap sebagai manusia legitimate.

**Masalah yang sering terjadi:**
- **Threshold terlalu tinggi (0.5)** = Banyak user manual ditolak ❌
- **Threshold medium (0.3)** = Masih menolak fast typers ⚠️
- **Threshold optimal (0.2)** = Balance antara keamanan & UX ✅

- **Score >= threshold** = Dianggap manusia ✅
- **Score < threshold** = Dianggap bot ❌

### Kenapa Manual Input Bisa Terdeteksi sebagai Bot?

reCAPTCHA v3 menganalisis berbagai faktor:

1. **Pola interaksi pengguna** di website
2. **Riwayat browser** dan cookies
3. **Kecepatan mengisi form**
4. **Mouse movement** dan keyboard patterns
5. **IP address** dan device fingerprint

Beberapa kondisi yang bisa menyebabkan score rendah:
- ❌ Mengisi form terlalu cepat (seperti bot)
- ❌ Menggunakan browser mode incognito (tidak ada riwayat)
- ❌ Menggunakan VPN atau proxy
- ❌ Browser dengan tracking protection aktif
- ❌ Autofill/password manager yang mengisi form otomatis
- ❌ Copy-paste data (bukan ketik manual)
- ❌ Tidak ada mouse movement sebelum submit

## ✅ Solusi

Ada 2 cara untuk memperbaiki masalah ini:

### Solusi 1: Turunkan Threshold Score (Direkomendasikan)

Ubah threshold dari **0.5** atau **0.3** menjadi **0.2** untuk mengakomodasi input manual yang cepat.

**File yang perlu diubah:** `code.gs` di Google Apps Script

**Kode saat ini (Baris ~35-40):**
```javascript
function verifikasiRecaptcha(token) {
  const SECRET_KEY = "YOUR_RECAPTCHA_SECRET_KEY_HERE";
  const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET_KEY + "&response=" + token;
  
  const response = UrlFetchApp.fetch(url);
  const json = JSON.parse(response.getContentText());
  
  // Threshold saat ini: 0.3 (MASIH TERLALU KETAT UNTUK FAST TYPERS)
  return json.success && json.score >= 0.3;
}
```

**Ubah menjadi:**
```javascript
function verifikasiRecaptcha(token) {
  const SECRET_KEY = "YOUR_RECAPTCHA_SECRET_KEY_HERE";
  const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET_KEY + "&response=" + token;
  
  const response = UrlFetchApp.fetch(url);
  const json = JSON.parse(response.getContentText());
  
  // Threshold diturunkan ke 0.2 (LEBIH FLEKSIBEL UNTUK FAST TYPERS)
  // Log score untuk monitoring
  Logger.log('reCAPTCHA Score: ' + json.score + ' | Success: ' + json.success);
  
  return json.success && json.score >= 0.2;
}
```

#### Panduan Threshold:

| Threshold | Ketat/Longgar | Kasus Penggunaan | Trade-off |
|-----------|---------------|------------------|-----------|
| **0.7-0.9** | Sangat Ketat | High-risk transactions | Banyak false positive (user valid ditolak) ❌ |
| **0.5** | Ketat | Default Google | Beberapa user manual ditolak ⚠️ |
| **0.3** | Seimbang | General forms | Masih menolak fast typers ⚠️ |
| **0.2** | Fleksibel | **Recommended untuk donasi manual** | Balance antara keamanan & UX ✅ |
| **0.1** | Longgar | Low-risk forms | Bot bisa lolos ⚠️ |
| **0.0** | Tidak ada filter | Testing only | Semua bot lolos ❌ |

**Rekomendasi:** Mulai dengan **0.2**, lalu monitor dan sesuaikan jika diperlukan.

### Solusi 2: Tambahkan Logging untuk Monitoring

Tambahkan logging untuk melihat score setiap submission:

```javascript
function verifikasiRecaptcha(token) {
  const SECRET_KEY = "YOUR_RECAPTCHA_SECRET_KEY_HERE";
  const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET_KEY + "&response=" + token;
  
  const response = UrlFetchApp.fetch(url);
  const json = JSON.parse(response.getContentText());
  
  // Log detail untuk debugging
  Logger.log('========== reCAPTCHA Verification ==========');
  Logger.log('Success: ' + json.success);
  Logger.log('Score: ' + json.score);
  Logger.log('Action: ' + json.action);
  Logger.log('Hostname: ' + json.hostname);
  Logger.log('Timestamp: ' + json.challenge_ts);
  
  // Threshold 0.2 - lebih fleksibel untuk fast manual input
  const threshold = 0.2;
  const isValid = json.success && json.score >= threshold;
  
  Logger.log('Threshold: ' + threshold);
  Logger.log('Valid: ' + isValid);
  Logger.log('===========================================');
  
  return isValid;
}
```

**Cara melihat logs:**
1. Buka Google Apps Script Editor
2. Klik **Executions** di sidebar kiri
3. Klik execution tertentu untuk lihat logs
4. Atau klik **View** > **Logs** (untuk execution terakhir)

### Solusi 3: Fallback untuk Score Rendah

Tambahkan mekanisme fallback untuk user dengan score rendah tapi terlihat legitimate:

```javascript
function verifikasiRecaptcha(token) {
  const SECRET_KEY = "YOUR_RECAPTCHA_SECRET_KEY_HERE";
  const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET_KEY + "&response=" + token;
  
  const response = UrlFetchApp.fetch(url);
  const json = JSON.parse(response.getContentText());
  
  Logger.log('reCAPTCHA Score: ' + json.score);
  
  // Primary check: Score >= 0.2
  if (json.success && json.score >= 0.2) {
    return true;
  }
  
  // Fallback: Score antara 0.1 - 0.2 (suspicious tapi bisa jadi manusia cepat)
  // Bisa ditambahkan logic tambahan di sini, misalnya:
  // - Cek apakah dari domain yang benar
  // - Cek apakah action sesuai
  if (json.success && json.score >= 0.1 && json.action === 'donasi') {
    Logger.log('WARNING: Low score (' + json.score + ') but allowing with fallback');
    return true; // Allow dengan warning
  }
  
  // Reject jika score terlalu rendah
  Logger.log('REJECTED: Score too low (' + json.score + ')');
  return false;
}
```

## 📋 Langkah-langkah Implementasi

### 1. Backup Code Lama
```
1. Buka Google Apps Script Editor
2. Select semua kode di Code.gs
3. Copy dan simpan di file lokal sebagai backup
```

### 2. Update Code
```
1. Cari fungsi verifikasiRecaptcha
2. Ubah baris: return json.success && json.score >= 0.5;
3. Atau ubah: return json.success && json.score >= 0.3;
4. Menjadi: return json.success && json.score >= 0.2;
5. Tambahkan logging jika diperlukan (lihat Solusi 2)
```

### 3. Save dan Deploy
```
1. Klik tombol Save (disk icon)
2. Klik Deploy > Manage deployments
3. Klik Edit (pensil icon) pada deployment aktif
4. Ubah Version menjadi "New version"
5. Klik Deploy
6. Copy URL deployment (harus sama dengan yang di config.js)
```

### 4. Test
```
1. Buka website donasi
2. Isi form dengan data valid
3. Test dengan berbagai kecepatan input (cepat dan lambat)
4. Submit
5. Cek apakah berhasil masuk ke Google Sheet
6. Cek logs di Apps Script untuk lihat score yang didapat
7. Verifikasi bahwa input cepat tidak lagi ditolak
```

## 🧪 Testing & Monitoring

### Cara Monitor Score

Setelah implement logging (Solusi 2), lakukan:

1. **Test beberapa submission normal**
   - Isi form seperti user biasa
   - Lihat score yang didapat di logs
   - Jika score > 0.2, berarti threshold sudah pas ✅

2. **Test submission cepat**
   - Isi form dengan sangat cepat
   - Atau gunakan autofill
   - Verifikasi bahwa submission tetap diterima
   - Score mungkin 0.2-0.4, tetap harus lolos ✅

3. **Monitor selama 1-2 minggu**
   - Catat berapa % submission yang ditolak
   - Jika masih banyak yang ditolak, turunkan threshold ke 0.15-0.18 (⚠️ minimum aman: 0.15)
   - **PERINGATAN:** Threshold di bawah 0.15 dapat membahayakan keamanan
   - Jika ada tanda-tanda spam, naikkan threshold ke 0.23-0.25

### Menentukan Threshold Optimal

```javascript
// Tambahkan di doPost untuk tracking
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    
    if (requestData.action === "create") {
      const token = requestData.payload.recaptchaToken;
      
      // Verifikasi dan dapatkan full response
      const SECRET_KEY = "YOUR_RECAPTCHA_SECRET_KEY_HERE";
      const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET_KEY + "&response=" + token;
      const response = UrlFetchApp.fetch(url);
      const json = JSON.parse(response.getContentText());
      
      // Log untuk analisis
      const ss = SpreadsheetApp.openById('1EhFeSGfar1mqzEQo5CgncmDr8nflFqcSyAaXAFmWFqE');
      const scoreSheet = ss.getSheetByName('ScoreLog') || ss.insertSheet('ScoreLog');
      
      scoreSheet.appendRow([
        new Date(),
        json.score,
        json.success,
        json.action,
        requestData.payload.nama || 'N/A'
      ]);
      
      // Lanjut dengan verifikasi normal
      // ...
    }
  } catch (error) {
    // ...
  }
}
```

Dengan log ini, Anda bisa analisis distribusi score dan tentukan threshold optimal.

## 🎓 Tips Menghindari False Positive

Untuk user yang sering ditolak, sarankan mereka:

1. ✅ **Jangan terburu-buru** - Isi form dengan kecepatan normal
2. ✅ **Gunakan browser normal** - Hindari incognito mode
3. ✅ **Disable VPN** saat mengisi form donasi
4. ✅ **Interaksi natural** - Scroll halaman, gerakkan mouse
5. ✅ **Tunggu sebentar** setelah halaman load sebelum isi form
6. ✅ **Ketik manual** - Hindari copy-paste semua field

## 📊 Perbandingan Before & After

### Before (Threshold 0.3)
```
User A: Score 0.7 → ✅ Diterima
User B: Score 0.4 → ✅ Diterima
User C: Score 0.25 → ❌ Ditolak (FALSE POSITIVE - fast typer!)
User D: Score 0.9 → ✅ Diterima
Bot E:  Score 0.15 → ❌ Ditolak ✅

Success Rate untuk Human: 75% (masih ada false positive)
```

### After (Threshold 0.2)
```
User A: Score 0.7 → ✅ Diterima
User B: Score 0.4 → ✅ Diterima
User C: Score 0.25 → ✅ Diterima (FIXED - fast typer allowed!)
User D: Score 0.9 → ✅ Diterima
Bot E:  Score 0.15 → ❌ Ditolak ✅

Success Rate untuk Human: 100% (tidak ada false positive)
Bot masih terdeteksi: ✅
```

## ⚠️ Perhatian

1. **Jangan set threshold terlalu rendah** (< 0.1) - Bot bisa lolos
2. **Monitor logs secara berkala** - Pastikan tidak ada anomali
3. **Backup code sebelum perubahan** - Untuk rollback jika ada masalah
4. **Test di staging dulu** - Jika memungkinkan
5. **Inform users** - Jika perubahan mempengaruhi UX

## 📞 Support

Jika setelah menurunkan threshold masih ada masalah:

1. ✅ Cek logs di Google Apps Script executions
2. ✅ Pastikan SECRET_KEY dan SITE_KEY match
3. ✅ Verifikasi domain terdaftar di reCAPTCHA console
4. ✅ Cek apakah HTML entities sudah diperbaiki (lihat RECAPTCHA_FIX.md)
5. ✅ Test dengan browser berbeda

## 🔗 Referensi

- [Google reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [Interpreting the score](https://developers.google.com/recaptcha/docs/v3#interpreting_the_score)
- `RECAPTCHA_FIX.md` - Fix untuk HTML entities bug
- `DATA_FLOW.md` - Penjelasan flow lengkap
