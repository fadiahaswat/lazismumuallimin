# 🚀 Quick Start: Fix "Masih Dikira Bot?"

## ⚡ Diagnosis Cepat (30 detik)

Pilih yang sesuai dengan masalah Anda:

### 🔴 Data TIDAK masuk ke Google Sheet sama sekali
→ **Masalah:** HTML Entities di code.gs  
→ **Solusi:** [Fix HTML Entities](#fix-html-entities-5-menit)

### 🟡 Data ditolak dengan pesan "Bot detected" atau "Aktivitas mencurigakan"
→ **Masalah:** Threshold terlalu ketat  
→ **Solusi:** [Turunkan Threshold](#turunkan-threshold-3-menit)

### 🔵 Error di browser console atau Google Apps Script logs
→ **Masalah:** Konfigurasi reCAPTCHA  
→ **Solusi:** [Verifikasi Konfigurasi](#verifikasi-konfigurasi-10-menit)

---

## Fix HTML Entities (5 menit)

### Cek Apakah Anda Punya Masalah Ini

Buka file `code.gs` di Google Apps Script. Cari teks berikut:

```javascript
// ❌ Jika Anda melihat ini, Anda punya masalah HTML entities:
&amp;response=
&amp;&amp;
&gt;=
&lt;=
=&gt;

// ✅ Seharusnya terlihat seperti ini:
&response=
&&
>=
<=
=>
```

### Cara Fix

**Option 1: Download code.gs yang sudah benar**
1. Download file [code.gs](./code.gs) dari repository ini
2. Buka Google Apps Script Editor
3. Copy semua isi file yang Anda download
4. Paste ke Google Apps Script (ganti semua)
5. Update `SPREADSHEET_ID` dan `SECRET_KEY` dengan nilai Anda
6. Save dan Deploy

**Option 2: Find & Replace manual**
1. Buka Google Apps Script Editor
2. Tekan `Ctrl+H` (Windows) atau `Cmd+H` (Mac)
3. Find & Replace (satu per satu):
   - Find: `&amp;` → Replace: `&`
   - Find: `&lt;` → Replace: `<`
   - Find: `&gt;` → Replace: `>`
   - Find: `=&gt;` → Replace: `=>`
4. Save dan Deploy

### Deploy Script
1. Klik **Save** (ikon disk)
2. **Deploy** > **Manage deployments**
3. Klik **Edit** (ikon pensil)
4. **New version**
5. **Deploy**

✅ **Done!** Test dengan submit donasi.

---

## Turunkan Threshold (3 menit)

### Ubah Threshold

1. Buka file `code.gs` di Google Apps Script
2. Cari baris ini (sekitar baris 41):
   ```javascript
   const RECAPTCHA_THRESHOLD = 0.5;  // atau 0.3
   ```
3. Ubah menjadi:
   ```javascript
   const RECAPTCHA_THRESHOLD = 0.2;  // ← Recommended!
   ```
4. Save dan Deploy (sama seperti di atas)

### Mengapa 0.2?

| Threshold | Hasil |
|-----------|-------|
| 0.5 | User cepat ditolak ❌ |
| 0.3 | Fast typers masih ditolak ⚠️ |
| **0.2** | **Balance optimal** ✅ |
| 0.1 | Bot bisa lolos ⚠️ |

✅ **Done!** Test dengan submit donasi.

---

## Verifikasi Konfigurasi (10 menit)

### 1. Verifikasi Keys Match

**A. code.gs (Google Apps Script):**
```javascript
const SECRET_KEY = "6LdhLGIsAAAAABVKoyyNjpCjIt8z_eF54m1NyUQm";
```

**B. config.js (Website):**
```javascript
export const RECAPTCHA_SITE_KEY = "6LdhLGIsAAAAAOFfE86013kZqCZvZwVTTBPZTdp6";
```

Kedua keys ini **HARUS BERBEDA** (Site Key ≠ Secret Key)  
Kedua keys **HARUS DARI PROJECT RECAPTCHA YANG SAMA**

### 2. Verifikasi Domain Terdaftar

1. Buka [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Pilih site Anda
3. Pastikan domain website terdaftar
4. Untuk testing lokal, tambahkan `localhost`

### 3. Verifikasi Script Loaded

Di `index.html`, pastikan ada:

```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY_HERE"></script>
```

Ganti `YOUR_SITE_KEY_HERE` dengan Site Key Anda.

### 4. Test di Browser Console

1. Buka website → Tekan `F12`
2. Ketik di console:
   ```javascript
   typeof grecaptcha
   ```
3. Harus return: `"object"` (bukan `"undefined"`)

✅ **Done!** Test dengan submit donasi.

---

## 🧪 Verifikasi Berhasil

### Cek Console Browser (F12)

Submit donasi dan lihat console. Harus ada:

```
✅ 🔑 reCAPTCHA loaded successfully
✅ 🔐 reCAPTCHA Token Generated
✅ 📤 Sending donation data...
✅ 📥 Success! Data saved.
```

### Cek Google Apps Script Logs

1. Buka https://script.google.com/
2. **Executions** → Klik execution terbaru
3. Lihat logs:
   ```
   ========== reCAPTCHA Verification ==========
   Success: true
   Score: 0.7  ← Score user (should be >= 0.2)
   Is Valid: true
   ==========================================
   ```

### Cek Google Sheet

1. Buka Google Sheet
2. Tab `DataDonasi`
3. Data donasi harus muncul di row baru

---

## ❌ Masih Bermasalah?

Jika 3 solusi di atas sudah dicoba tapi masih error, coba langkah berikut:

### 1. Clear Browser Cache
- `Ctrl+Shift+Delete` → Clear cache → Reload website

### 2. Test Browser Lain
- Try Chrome, Firefox, atau Edge

### 3. Cek Error Message Detail
- Screenshot error di console
- Screenshot error di Apps Script logs

### 4. Verifikasi Deployment
- Pastikan script sudah di-deploy ulang setelah perubahan
- Copy Web app URL baru jika ada perubahan
- Update `GAS_API_URL` di `config.js` jika URL berubah

### 5. Konsultasi Dokumentasi Lengkap

Jika basic fixes di atas tidak berhasil, kemungkinan masalahnya lebih kompleks. Baca dokumentasi lengkap untuk troubleshooting mendalam:

**📖 [TROUBLESHOOTING_BOT_DETECTION.md](./TROUBLESHOOTING_BOT_DETECTION.md)**

Dokumentasi lengkap ini berisi:
- ✅ 10+ FAQ dengan jawaban detail
- ✅ Advanced debugging techniques
- ✅ Edge case scenarios
- ✅ Step-by-step untuk masalah kompleks
- ✅ Monitoring dan analytics setup

Baca dokumentasi lengkap **HANYA JIKA** basic fixes di halaman ini tidak berhasil.

---

## 📚 Dokumentasi Lengkap

Untuk troubleshooting mendalam dan FAQ:

- **[TROUBLESHOOTING_BOT_DETECTION.md](./TROUBLESHOOTING_BOT_DETECTION.md)** - Panduan lengkap
- **[BOT_DETECTION_FIX.md](./BOT_DETECTION_FIX.md)** - Penjelasan detail
- **[RECAPTCHA_FIX.md](./RECAPTCHA_FIX.md)** - reCAPTCHA specific
- **[CONSOLE_LOGGING_GUIDE.md](./CONSOLE_LOGGING_GUIDE.md)** - Debug guide

---

## 🎯 Checklist Akhir

Sebelum bertanya atau troubleshoot lebih lanjut, pastikan:

- [ ] HTML entities sudah diperbaiki di `code.gs`
- [ ] Threshold sudah diubah ke 0.2
- [ ] Script sudah di-redeploy (New version)
- [ ] Browser cache sudah di-clear
- [ ] Test di browser berbeda
- [ ] Site Key dan Secret Key benar dan match
- [ ] Domain terdaftar di reCAPTCHA console
- [ ] `grecaptcha` loaded (cek console: `typeof grecaptcha`)
- [ ] Google Sheet memiliki tab `DataDonasi`
- [ ] Logs di Apps Script tidak ada error
- [ ] Logs di browser console tidak ada error

Jika semua ✅, seharusnya sudah bekerja dengan baik!

---

**💡 Pro Tip:** Simpan file `code.gs` yang sudah benar sebagai template untuk future reference!
