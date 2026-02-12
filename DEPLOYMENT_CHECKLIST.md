# Checklist Deployment: Fix Bot Detection

## ✅ Pre-Deployment Checklist

### 1. Backup
- [ ] Backup code.gs yang sedang berjalan
  - Copy semua kode dari Google Apps Script Editor
  - Simpan di file lokal dengan nama `code.gs.backup.txt`
  - Atau screenshot konfigurasi yang ada

### 2. Persiapan File
- [ ] Download file `code.gs` dari repository ini
- [ ] Buka file dan verifikasi:
  - [ ] Tidak ada HTML entities (`&amp;`, `&lt;`, `&gt;`)
  - [ ] RECAPTCHA_THRESHOLD sudah di-set ke 0.3
  - [ ] SPREADSHEET_ID sesuai dengan spreadsheet Anda
  - [ ] SECRET_KEY siap untuk diisi (jangan commit ke public repo!)

### 3. Konfigurasi
- [ ] Pastikan memiliki reCAPTCHA keys:
  - [ ] Site Key (untuk frontend)
  - [ ] Secret Key (untuk backend)
- [ ] Catat URL deployment yang sedang digunakan
- [ ] Pastikan GAS_API_URL di config.js match dengan deployment URL

## 🚀 Deployment Steps

### Step 1: Update Google Apps Script

1. [ ] Buka [Google Apps Script](https://script.google.com/)
2. [ ] Pilih project yang terhubung dengan spreadsheet
3. [ ] Buka file Code.gs
4. [ ] **BACKUP:** Copy semua kode existing
5. [ ] Hapus semua kode lama
6. [ ] Paste kode baru dari file `code.gs`
7. [ ] **PENTING:** Ganti `SECRET_KEY` dengan key Anda:
   ```javascript
   const SECRET_KEY = "GANTI_DENGAN_SECRET_KEY_ANDA";
   ```
8. [ ] Verifikasi `SPREADSHEET_ID` dan `SHEET_NAME` sudah benar
9. [ ] Click Save (disk icon)

### Step 2: Deploy Script

1. [ ] Click **Deploy** > **Manage deployments**
2. [ ] Click **Edit** (pencil icon) pada deployment aktif
3. [ ] Di bagian "Version", pilih **New version**
4. [ ] Tambahkan description: "Fix bot detection - threshold 0.3"
5. [ ] Click **Deploy**
6. [ ] Tunggu sampai deployment selesai
7. [ ] Copy Web app URL yang muncul
8. [ ] Verifikasi URL sama dengan yang di `config.js`

### Step 3: Test di Apps Script

1. [ ] Di Apps Script Editor, klik function dropdown
2. [ ] Pilih `getCurrentThreshold`
3. [ ] Click Run
4. [ ] Lihat logs (View > Logs)
5. [ ] Verifikasi output: "Current reCAPTCHA Threshold: 0.3"
6. [ ] Verifikasi: "Current setting: ✅ OPTIMAL"

## 🧪 Testing Checklist

### Test 1: Normal Submission

1. [ ] Buka website donasi di browser normal
2. [ ] Isi form dengan data valid
3. [ ] Tidak terburu-buru, isi seperti biasa
4. [ ] Click Submit
5. [ ] **Expected:**
   - [ ] Tidak ada error "Bot detected"
   - [ ] Muncul modal/toast sukses
   - [ ] Data masuk ke Google Sheet
   - [ ] Email konfirmasi terkirim (jika ada)

### Test 2: Fast Submission (Previously Failed)

1. [ ] Buka website donasi
2. [ ] Isi form dengan CEPAT atau pakai autofill
3. [ ] Langsung submit tanpa delay
4. [ ] **Expected:**
   - [ ] Tetap berhasil! (Ini yang dulu gagal)
   - [ ] Data masuk ke Google Sheet

### Test 3: Edge Cases

1. [ ] Test dengan browser incognito
   - [ ] Seharusnya berhasil (mungkin score rendah tapi masih > 0.3)
2. [ ] Test dengan VPN (jika ada)
   - [ ] Seharusnya tetap berhasil
3. [ ] Test submit multiple kali berturut-turut
   - [ ] Semua harus berhasil

### Test 4: Verify Logs

1. [ ] Buka Google Apps Script
2. [ ] Click **Executions** di sidebar
3. [ ] Lihat execution terakhir
4. [ ] Verifikasi logs menunjukkan:
   - [ ] "reCAPTCHA Score: 0.X" (X bisa bervariasi)
   - [ ] "Threshold: 0.3"
   - [ ] "Is Valid: true"
   - [ ] Tidak ada error

### Test 5: Check Data Quality

1. [ ] Buka Google Sheet
2. [ ] Verifikasi data dari test submission:
   - [ ] Semua field terisi dengan benar
   - [ ] Timestamp akurat
   - [ ] ID unik ter-generate
   - [ ] Status default adalah "Pending"

## 📊 Post-Deployment Monitoring

### Week 1: Daily Monitoring

- [ ] Day 1: Check submission logs
  - [ ] Berapa submission total?
  - [ ] Ada yang ditolak? Score berapa?
  - [ ] Ada error di logs?

- [ ] Day 3: Analyze patterns
  - [ ] Apakah ada peak hours dengan banyak submission?
  - [ ] Apakah ada user yang submit berkali-kali (suspicious)?
  - [ ] Score rata-rata berapa?

- [ ] Day 7: Review statistics
  - [ ] Success rate: harus > 95%
  - [ ] Jika < 95%, pertimbangkan turunkan threshold lagi
  - [ ] Ada tanda-tanda spam/bot? Naikkan threshold

### Week 2-4: Weekly Review

- [ ] Week 2: 
  - [ ] Total submissions: ___
  - [ ] Rejected submissions: ___
  - [ ] Success rate: ____%
  - [ ] Average score: ___

- [ ] Week 3:
  - [ ] Ada complaint dari user? [ ] Ya [ ] Tidak
  - [ ] Ada spam yang lolos? [ ] Ya [ ] Tidak
  - [ ] Perlu adjustment? [ ] Ya [ ] Tidak

- [ ] Week 4:
  - [ ] Threshold 0.3 optimal? [ ] Ya [ ] Tidak
  - [ ] Jika tidak, threshold baru yang cocok: ___

## 🔍 Troubleshooting Checklist

### Jika Masih Ada "Bot Detected"

- [ ] Cek threshold di code.gs sudah 0.3?
- [ ] Script sudah di-deploy dengan version baru?
- [ ] URL di config.js match dengan deployment URL?
- [ ] Clear browser cache dan test lagi
- [ ] Cek logs untuk lihat score actual
- [ ] Jika score < 0.3, pertimbangkan turunkan ke 0.2

### Jika Data Tidak Masuk

- [ ] Cek logs Apps Script untuk error
- [ ] Verifikasi SPREADSHEET_ID benar
- [ ] Verifikasi SHEET_NAME ada di spreadsheet
- [ ] Cek permission Apps Script ke spreadsheet
- [ ] Test dengan function createData() manual

### Jika reCAPTCHA Error

- [ ] Verifikasi SECRET_KEY benar
- [ ] Verifikasi SITE_KEY di config.js benar
- [ ] Domain terdaftar di reCAPTCHA console?
- [ ] Lihat RECAPTCHA_FIX.md untuk HTML entities
- [ ] Check console browser untuk error JavaScript

## 📝 Notes & Observations

### Deployment Date: _______________

### Initial Configuration:
- Threshold sebelumnya: ___
- Threshold baru: 0.3
- Expected improvement: Mengurangi false positive

### Observations:

Day 1:
```
Total submissions: ___
Rejected: ___
Success rate: ___%
Issues: _______________
```

Day 7:
```
Total submissions: ___
Rejected: ___
Success rate: ___%
Issues: _______________
```

### Adjustments Made:
```
Date: _____ | Change: __________ | Reason: __________
Date: _____ | Change: __________ | Reason: __________
```

## ✅ Final Verification

Sebelum mark sebagai "DONE", pastikan:

- [ ] Code deployed dengan sukses
- [ ] Test manual berhasil
- [ ] Tidak ada error di logs
- [ ] Data masuk ke Google Sheet
- [ ] Documentation lengkap
- [ ] Team/stakeholder informed tentang perubahan
- [ ] Monitoring setup untuk minggu pertama

## 📞 Contact & Support

Jika ada masalah:

1. ✅ Check dokumentasi:
   - BOT_DETECTION_FIX.md
   - QUICK_FIX_BOT.md
   - BOT_DETECTION_VISUAL.md
   - RECAPTCHA_FIX.md

2. ✅ Check logs:
   - Google Apps Script > Executions
   - Browser Console (F12)

3. ✅ Check references:
   - [Google reCAPTCHA Docs](https://developers.google.com/recaptcha/docs/v3)
   - [Apps Script Docs](https://developers.google.com/apps-script)

---

**Status: [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Issues**

**Completed By: _______________**

**Date: _______________**
