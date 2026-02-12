# 🔧 Troubleshooting: Masih Dikira Bot? Panduan Lengkap Solusi

## 📋 Daftar Isi
1. [Identifikasi Masalah](#identifikasi-masalah)
2. [Penyebab Umum](#penyebab-umum)
3. [Solusi Step-by-Step](#solusi-step-by-step)
4. [Verifikasi dan Testing](#verifikasi-dan-testing)
5. [FAQ](#faq)

---

## 🔍 Identifikasi Masalah

### Gejala yang Muncul:
- ❌ Donasi ditolak dengan pesan "Bot activity detected"
- ❌ Donasi ditolak dengan pesan "Sistem mendeteksi aktivitas mencurigakan"  
- ❌ Data tidak masuk ke Google Sheet
- ❌ Error di browser console

### Cek Mana yang Terjadi:

**A. Data TIDAK masuk ke Google Sheet sama sekali**
→ Kemungkinan masalah: **HTML Entities di code.gs** (lihat [Solusi 1](#solusi-1-fix-html-entities))

**B. Data ditolak dengan pesan "Bot detected"**  
→ Kemungkinan masalah: **Threshold terlalu ketat** (lihat [Solusi 2](#solusi-2-turunkan-threshold))

**C. Error di console browser**
→ Kemungkinan masalah: **Konfigurasi reCAPTCHA** (lihat [Solusi 3](#solusi-3-verifikasi-recaptcha))

---

## 🎯 Penyebab Umum

### 1. HTML Entities di code.gs (PALING SERING!)

Jika Anda copy-paste code dari dokumen HTML/web, kemungkinan ada **HTML entities** yang merusak JavaScript syntax:

**❌ SALAH (dengan HTML entities):**
```javascript
const url = "...?secret=" + SECRET_KEY + "&amp;response=" + token;  // ❌ &amp; salah!
return json.success &amp;&amp; json.score &gt;= RECAPTCHA_THRESHOLD;  // ❌ HTML entities!
if (lastRow &amp;lt;= 1) return [];  // ❌ &amp;lt;= salah!
return values.map((row, index) =&gt; ({  // ❌ =&gt; salah!
```

**✅ BENAR (JavaScript murni):**
```javascript
const url = "...?secret=" + SECRET_KEY + "&response=" + token;  // ✅ Benar!
return json.success && json.score >= RECAPTCHA_THRESHOLD;  // ✅ Benar!
if (lastRow <= 1) return [];  // ✅ Benar!
return values.map((row, index) => ({  // ✅ Benar!
```

### 2. Threshold Terlalu Ketat

Google reCAPTCHA v3 memberikan score 0.0-1.0:
- **1.0** = Pasti manusia
- **0.5** = Kemungkinan manusia (default)
- **0.2** = Masih bisa manusia (fast typer)
- **0.0** = Kemungkinan bot

**Masalah:** Threshold default (0.5) terlalu ketat, sehingga user yang mengisi form cepat atau menggunakan autofill dianggap bot.

### 3. Konfigurasi reCAPTCHA Tidak Match

- Site Key dan Secret Key tidak match
- Domain tidak terdaftar di reCAPTCHA console
- Token reCAPTCHA tidak digenerate dengan benar

---

## ✅ Solusi Step-by-Step

### Solusi 1: Fix HTML Entities

**LANGKAH 1:** Buka Google Apps Script Editor
1. Buka https://script.google.com/
2. Pilih project Anda
3. Buka file `Code.gs`

**LANGKAH 2:** Cek apakah ada HTML entities

Cari teks berikut di code Anda. Jika ada, itu adalah HTML entities yang harus diganti:

| HTML Entity | Harus Diganti Jadi | Lokasi |
|-------------|-------------------|---------|
| `&amp;` | `&` | URL separator, logical AND |
| `&lt;` | `<` | Less than operator |
| `&gt;` | `>` | Greater than operator |
| `&lt;=` | `<=` | Less than or equal |
| `&gt;=` | `>=` | Greater than or equal |
| `&amp;&amp;` | `&&` | Logical AND |
| `=&gt;` | `=>` | Arrow function |

**LANGKAH 3:** Find and Replace

Di Google Apps Script Editor:
1. Tekan `Ctrl+H` (Windows) atau `Cmd+H` (Mac) untuk Find & Replace
2. Lakukan replace berikut secara berurutan:

```
Find: &amp;     Replace with: &
Find: &lt;      Replace with: <
Find: &gt;      Replace with: >
Find: =&gt;     Replace with: =>
```

**LANGKAH 4:** Verifikasi Fungsi `verifikasiRecaptcha`

Pastikan fungsi ini terlihat seperti ini (TANPA HTML entities):

```javascript
function verifikasiRecaptcha(token) {
  try {
    // ✅ BENAR: Menggunakan & (bukan &amp;)
    const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET_KEY + "&response=" + encodeURIComponent(token);
    
    const response = UrlFetchApp.fetch(url);
    const json = JSON.parse(response.getContentText());
    
    // Log untuk debugging
    Logger.log("========== reCAPTCHA Verification ==========");
    Logger.log("Success: " + json.success);
    Logger.log("Score: " + json.score);
    Logger.log("Action: " + json.action);
    Logger.log("Hostname: " + json.hostname);
    Logger.log("Challenge Timestamp: " + json.challenge_ts);
    Logger.log("Threshold: " + RECAPTCHA_THRESHOLD);
    
    // ✅ BENAR: Menggunakan >= (bukan &gt;=) dan && (bukan &amp;&amp;)
    const isValid = json.success && json.score >= RECAPTCHA_THRESHOLD;
    
    Logger.log("Is Valid: " + isValid);
    
    if (!isValid && json.success) {
      Logger.log("WARNING: reCAPTCHA token valid but score too low!");
      Logger.log("Score: " + json.score + " < Threshold: " + RECAPTCHA_THRESHOLD);
      Logger.log("Tip: Pertimbangkan menurunkan RECAPTCHA_THRESHOLD jika banyak user legitimate ditolak");
    }
    
    Logger.log("==========================================");
    
    return {
      isValid: isValid,
      score: json.score,
      success: json.success,
      action: json.action
    };
    
  } catch (error) {
    Logger.log("Error in verifikasiRecaptcha: " + error.toString());
    return {
      isValid: false,
      score: 0,
      success: false,
      error: error.toString()
    };
  }
}
```

**LANGKAH 5:** Verifikasi Fungsi `readData`

Pastikan terlihat seperti ini:

```javascript
function readData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    throw new Error("Sheet '" + SHEET_NAME + "' tidak ditemukan");
  }
  
  const lastRow = sheet.getLastRow();
  
  // ✅ BENAR: Menggunakan <= (bukan &lt;=)
  if (lastRow <= 1) return [];
  
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  
  // ✅ BENAR: Menggunakan => (bukan =&gt;)
  return values.map((row, index) => ({
    id: row[0] || "",
    timestamp: row[1] || "",
    jenisDonasi: row[2] || "",
    nominal: row[3] || "",
    nama: row[4] || "",
    email: row[5] || "",
    telepon: row[6] || "",
    alamat: row[7] || "",
    metodePembayaran: row[8] || "",
    rekening: row[9] || "",
    catatan: row[10] || "",
    status: row[11] || "Pending"
  }));
}
```

**LANGKAH 6:** Save dan Deploy

1. Klik **Save** (ikon disk)
2. Klik **Deploy** > **Manage deployments**
3. Klik **Edit** (ikon pensil) pada deployment aktif
4. Pilih **New version**
5. Klik **Deploy**
6. Copy Web app URL (pastikan sama dengan `GAS_API_URL` di `config.js`)

---

### Solusi 2: Turunkan Threshold

Jika setelah fix HTML entities masih ditolak, kemungkinan threshold terlalu ketat.

**LANGKAH 1:** Cari konstanta `RECAPTCHA_THRESHOLD`

Di file `code.gs`, cari baris seperti ini (sekitar baris 20-40):

```javascript
const RECAPTCHA_THRESHOLD = 0.5;  // ← Default, terlalu ketat!
```

**LANGKAH 2:** Ubah nilai threshold

Ganti dengan nilai yang lebih rendah:

```javascript
const RECAPTCHA_THRESHOLD = 0.2;  // ← Recommended untuk donasi manual
```

**Panduan Threshold:**

| Threshold | Karakteristik | Cocok Untuk | Trade-off |
|-----------|--------------|-------------|-----------|
| **0.7-0.9** | Sangat Ketat | High-security transactions | Banyak user valid ditolak ❌ |
| **0.5** | Ketat (Default Google) | General purpose | User cepat ditolak ⚠️ |
| **0.3** | Seimbang | Forms dengan variasi user | Masih ada false positive ⚠️ |
| **0.2** | **Fleksibel (RECOMMENDED)** | **Donasi, forms publik** | **Balance optimal** ✅ |
| **0.1** | Longgar | Low-risk only | Bot bisa lolos ⚠️ |
| **0.0** | Disabled | Testing only | Tidak aman ❌ |

**LANGKAH 3:** Save dan Deploy (sama seperti Solusi 1 langkah 6)

---

### Solusi 3: Verifikasi reCAPTCHA Configuration

**LANGKAH 1:** Verifikasi Keys Match

Pastikan keys di 2 tempat ini **MATCH**:

**A. File `code.gs` (Google Apps Script):**
```javascript
const SECRET_KEY = "6LdhLGIsAAAAABVKoyyNjpCjIt8z_eF54m1NyUQm";  // SECRET KEY
```

**B. File `config.js` (Website):**
```javascript
export const RECAPTCHA_SITE_KEY = "6LdhLGIsAAAAAOFfE86013kZqCZvZwVTTBPZTdp6";  // SITE KEY
```

**LANGKAH 2:** Verifikasi Domain Terdaftar

1. Buka [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Pilih site Anda
3. Pastikan domain website terdaftar di **Domains**
4. Jika testing lokal, tambahkan `localhost`

**LANGKAH 3:** Verifikasi Script Loaded

Di file `index.html`, pastikan ada:

```html
<!-- reCAPTCHA v3 Script -->
<script src="https://www.google.com/recaptcha/api.js?render=6LdhLGIsAAAAAOFfE86013kZqCZvZwVTTBPZTdp6"></script>
```

Ganti `6LdhLGIsAAAAAOFfE86013kZqCZvZwVTTBPZTdp6` dengan SITE KEY Anda.

---

## 🧪 Verifikasi dan Testing

### Test 1: Cek Console Logs

1. Buka website donasi
2. Buka Browser Console (`F12`)
3. Submit donasi
4. Periksa logs di console:

**Yang harus ada:**
```
✅ 🔑 reCAPTCHA loaded successfully
✅ 🔐 reCAPTCHA Token Generated
✅ 📏 Token length: ~500+ characters
✅ 📤 Sending donation data...
✅ 📥 Server Response: { status: "success", ... }
```

**Jika error:**
```
❌ reCAPTCHA not loaded
❌ Token generation failed
❌ Server Response: { status: "error", message: "Bot detected" }
```

### Test 2: Cek Google Apps Script Logs

1. Buka [Google Apps Script Editor](https://script.google.com/)
2. Klik **Executions** di sidebar kiri
3. Klik execution terbaru
4. Lihat logs

**Yang harus ada:**
```
========== reCAPTCHA Verification ==========
Success: true
Score: 0.7  ← Ini score user (0.0-1.0)
Action: donasi
Hostname: your-domain.com
Threshold: 0.2
Is Valid: true
==========================================
```

**Jika score < threshold:**
```
WARNING: reCAPTCHA token valid but score too low!
Score: 0.15 < Threshold: 0.2
Tip: Pertimbangkan menurunkan RECAPTCHA_THRESHOLD...
```

### Test 3: Cek Google Sheet

1. Buka Google Sheet data donasi
2. Pastikan ada tab `DataDonasi`
3. Submit donasi dari website
4. Cek apakah data masuk (refresh sheet)

**Jika tidak masuk:**
- Cek Executions di Apps Script untuk error
- Cek SPREADSHEET_ID di code.gs
- Cek nama sheet (case-sensitive!)

---

## ❓ FAQ

### Q1: Kenapa manual input masih dianggap bot?

**A:** Ada beberapa faktor yang bisa menyebabkan score rendah:
- ✗ Mengisi form terlalu cepat (seperti bot)
- ✗ Menggunakan browser incognito (tidak ada history)
- ✗ Menggunakan VPN atau proxy
- ✗ Browser dengan tracking protection aktif
- ✗ Autofill yang mengisi semua field sekaligus
- ✗ Copy-paste semua data
- ✗ Tidak ada mouse movement sebelum submit

**Solusi:** Turunkan threshold ke 0.2 (lihat [Solusi 2](#solusi-2-turunkan-threshold))

### Q2: Apakah aman menurunkan threshold ke 0.2?

**A:** Ya, 0.2 masih aman untuk kebanyakan kasus:
- ✅ Masih menolak bot dengan score < 0.2
- ✅ Mengakomodasi user yang mengetik cepat
- ✅ Mengurangi false positive
- ✅ Balance antara keamanan & user experience

**JANGAN turunkan di bawah 0.15** kecuali absolutely necessary dan dengan monitoring ekstra.

### Q3: Bagaimana cara memonitor score user?

**A:** Logging sudah ada di fungsi `verifikasiRecaptcha`. Untuk tracking jangka panjang, tambahkan ini di `handleCreate`:

```javascript
function handleCreate(payload) {
  try {
    const token = payload.recaptchaToken;
    const recaptchaResult = verifikasiRecaptcha(token);
    
    // Log ke sheet terpisah untuk analisis
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const scoreSheet = ss.getSheetByName('ScoreLog') || ss.insertSheet('ScoreLog');
    
    scoreSheet.appendRow([
      new Date(),
      recaptchaResult.score,
      recaptchaResult.isValid,
      payload.nama || 'N/A'
    ]);
    
    // Continue normal flow...
  }
}
```

Dengan ini, Anda bisa analisis distribusi score dan tentukan threshold optimal.

### Q4: Data masuk tapi ada pesan error di console?

**A:** Jika data berhasil masuk ke Google Sheet tapi ada error di console:
1. Periksa apakah ada typo di response handling
2. Cek apakah struktur response dari server sesuai expected
3. Verifikasi `GAS_API_URL` di `config.js` benar

### Q5: Error "Sheet tidak ditemukan"?

**A:** Pastikan:
1. Tab `DataDonasi` dan `DataKuitansi` sudah dibuat di Google Sheet
2. Nama tab **case-sensitive** (harus persis sama)
3. `SPREADSHEET_ID` di code.gs benar (ambil dari URL spreadsheet)

### Q6: Bagaimana cara mendapatkan reCAPTCHA keys?

**A:**
1. Buka [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Klik **Create** atau **+**
3. Pilih **reCAPTCHA v3**
4. Masukkan domain website
5. Copy **Site Key** (untuk `config.js`) dan **Secret Key** (untuk `code.gs`)

### Q7: Threshold berapa yang paling optimal?

**A:** Berdasarkan testing:
- **Untuk donasi publik:** 0.2 (recommended)
- **Untuk internal forms:** 0.3
- **Untuk high-security:** 0.5

Monitor selama 1-2 minggu dan adjust jika perlu.

### Q8: Apakah harus redeploy setiap kali ubah threshold?

**A:** Ya, setiap perubahan di code.gs memerlukan deployment baru:
1. Save changes
2. Deploy > Manage deployments
3. Edit deployment aktif
4. New version
5. Deploy

### Q9: Kenapa setelah fix masih error?

**A:** Checklist debug:
1. ✅ HTML entities sudah diperbaiki?
2. ✅ Threshold sudah diturunkan?
3. ✅ Secret Key dan Site Key match?
4. ✅ Domain terdaftar di reCAPTCHA?
5. ✅ Script sudah di-redeploy?
6. ✅ Browser cache sudah di-clear?
7. ✅ Test di browser berbeda?

### Q10: Copy code dari repository masih error?

**A:** Jika copy dari repository GitHub atau file markdown:
1. Jangan copy dari web view (bisa ada HTML entities)
2. Download file raw atau clone repository
3. Copy dari file lokal
4. Atau type manual (paling aman)

---

## 🔗 Referensi Tambahan

- **[code.gs](./code.gs)** - File yang sudah diperbaiki (copy dari sini!)
- **[BOT_DETECTION_FIX.md](./BOT_DETECTION_FIX.md)** - Panduan lengkap bot detection
- **[RECAPTCHA_FIX.md](./RECAPTCHA_FIX.md)** - Troubleshooting reCAPTCHA
- **[CONSOLE_LOGGING_GUIDE.md](./CONSOLE_LOGGING_GUIDE.md)** - Debug dengan console
- **[QUICK_FIX_BOT.md](./QUICK_FIX_BOT.md)** - Solusi cepat 5 menit

---

## 📞 Masih Butuh Bantuan?

Jika setelah mengikuti semua langkah di atas masih bermasalah:

1. **Cek Logs:** Google Apps Script Executions dan Browser Console
2. **Verifikasi Setup:** Gunakan checklist di [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
3. **Test Methodically:** Satu solusi pada satu waktu
4. **Document Error:** Screenshot error messages untuk troubleshooting lebih lanjut

---

**🎯 TL;DR - Solusi Cepat:**

1. **Fix HTML entities** di code.gs (`&amp;` → `&`, `&gt;=` → `>=`, dll)
2. **Turunkan threshold** dari 0.5 ke 0.2
3. **Redeploy** Google Apps Script
4. **Test** dengan submit donasi

Seharusnya sudah fix! ✅
