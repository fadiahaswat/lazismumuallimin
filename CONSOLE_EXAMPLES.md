# Console Output Examples

## Contoh Output Console untuk Berbagai Skenario

### ✅ Scenario 1: Donasi Berhasil (Normal User)

```
🔐 reCAPTCHA Bot Detection
  ⏱️ Timestamp: 2026-02-12T10:30:00.000Z
  👤 User: Ahmad Fauzi
  💰 Nominal: Rp 250.000
  🔄 Generating reCAPTCHA token...
  ✅ reCAPTCHA token generated successfully
  🔑 Token (first 50 chars): 03AGdBq27XYZabcdefghijklmnopqrstuvwxyz123456789AB...
  📏 Token length: 1842 characters

📤 Sending Donation Data
  🌐 API URL: https://script.google.com/macros/s/.../exec
  📦 Payload preview: {
    action: "create",
    nama: "Ahmad Fauzi",
    type: "Zakat Fitrah",
    nominal: "250000",
    hasRecaptchaToken: true
  }
  ⏱️ Request time: 2026-02-12T10:30:05.123Z
  📬 Response status: 200 OK
  📥 Backend response: {
    status: "success",
    message: "Data berhasil disimpan",
    data: {id: "DN-20260212103005", ...},
    recaptchaScore: 0.9
  }

✅ Donation submitted successfully!
📈 reCAPTCHA Score: 0.9
```

**Artinya:** 
- ✅ Semua berjalan lancar
- ✅ Score 0.9 = Definitely human
- ✅ Donasi berhasil disimpan

---

### ⚠️ Scenario 2: Borderline Score (Berhasil tapi Suspicious)

```
🔐 reCAPTCHA Bot Detection
  ⏱️ Timestamp: 2026-02-12T11:15:00.000Z
  👤 User: Budi Santoso
  💰 Nominal: Rp 100.000
  🔄 Generating reCAPTCHA token...
  ✅ reCAPTCHA token generated successfully
  🔑 Token (first 50 chars): 03AGdBq27ABCxyz123...
  📏 Token length: 1756 characters

📤 Sending Donation Data
  🌐 API URL: https://script.google.com/macros/s/.../exec
  📦 Payload preview: {
    action: "create",
    nama: "Budi Santoso",
    type: "Infaq",
    nominal: "100000",
    hasRecaptchaToken: true
  }
  ⏱️ Request time: 2026-02-12T11:15:03.456Z
  📬 Response status: 200 OK
  📥 Backend response: {
    status: "success",
    message: "Data berhasil disimpan",
    data: {id: "DN-20260212111503", ...},
    recaptchaScore: 0.4
  }

✅ Donation submitted successfully!
📈 reCAPTCHA Score: 0.4
```

**Artinya:**
- ✅ Berhasil (threshold 0.3)
- ⚠️ Tapi score rendah (0.4)
- 💡 Next time: Isi form lebih lambat, jangan pakai autofill

---

### ❌ Scenario 3: Bot Terdeteksi - Isi Form Terlalu Cepat

```
🔐 reCAPTCHA Bot Detection
  ⏱️ Timestamp: 2026-02-12T14:20:00.000Z
  👤 User: Citra Dewi
  💰 Nominal: Rp 500.000
  🔄 Generating reCAPTCHA token...
  ✅ reCAPTCHA token generated successfully
  🔑 Token (first 50 chars): 03AGdBq27FastUser...
  📏 Token length: 1823 characters

📤 Sending Donation Data
  🌐 API URL: https://script.google.com/macros/s/.../exec
  📦 Payload preview: {
    action: "create",
    nama: "Citra Dewi",
    type: "Zakat Maal",
    nominal: "500000",
    hasRecaptchaToken: true
  }
  ⏱️ Request time: 2026-02-12T14:20:02.789Z
  📬 Response status: 200 OK
  📥 Backend response: {
    status: "error",
    message: "Verifikasi keamanan gagal. Score: 0.2 (threshold: 0.3)",
    recaptchaScore: 0.2
  }

🤖 Bot Detection Analysis
  ❌ Backend rejected the submission
  📝 Error message: Verifikasi keamanan gagal. Score: 0.2 (threshold: 0.3)
  🚫 REASON: Bot activity detected by reCAPTCHA
  
  📊 Possible causes:
    1. ⚡ Form filled too quickly (looks automated)
    2. 🔄 Using autofill or password manager
    3. 🕵️ Using VPN or proxy
    4. 🕶️ Using incognito/private browsing mode
    5. 📋 Copy-pasting all form fields
    6. 🖱️ No mouse movement or interaction detected
  
  💡 Solutions:
    ✅ Fill form more slowly and naturally
    ✅ Use normal browsing mode (not incognito)
    ✅ Disable VPN during donation
    ✅ Type manually instead of copy-paste
    ✅ Move mouse and scroll before submitting
    ✅ Wait 3-5 seconds after page load
  
  📈 reCAPTCHA Score: 0.2
  📊 Score meaning:
    • 0.9-1.0: Definitely human ✅
    • 0.7-0.8: Likely human ✅
    • 0.5-0.6: Probably human ⚠️
    • 0.3-0.4: Suspicious ⚠️
    • 0.1-0.2: Likely bot ❌  ← YOUR SCORE
    • 0.0-0.1: Definitely bot ❌
  
  🚨 Score too low! Current: 0.2 | Required: ≥0.3
  
  🔧 Admin: Check backend logs for more details
  📖 Documentation: See BOT_DETECTION_FIX.md

❌ Donation Submission Error
  💥 Error occurred during donation submission
  📝 Error message: Verifikasi keamanan gagal. Score: 0.2 (threshold: 0.3)
  📋 Error details: {
    name: "Error",
    message: "Verifikasi keamanan gagal. Score: 0.2 (threshold: 0.3)",
    stack: "Error: Verifikasi keamanan gagal..."
  }
  
  🤖 This is a BOT DETECTION error
  
  🔍 Why this happens:
    Your interaction pattern was flagged as automated/bot-like
  
  💡 How to fix:
    1. Wait 5-10 seconds before trying again
    2. Fill the form more slowly
    3. Disable VPN if you're using one
    4. Use normal browsing mode (not incognito)
    5. Make sure to scroll and interact naturally
  
  📖 For more help, see: BOT_DETECTION_FIX.md
  
  ⏱️ Error time: 2026-02-12T14:20:03.123Z
  👤 User: Citra Dewi
```

**User akan melihat toast:**
```
⚠️ Aktivitas terdeteksi tidak natural. Mohon tunggu beberapa detik 
dan coba lagi dengan lebih santai. Lihat console (F12) untuk detail.
```

**Artinya:**
- ❌ Ditolak karena bot detection
- 📈 Score 0.2 < threshold 0.3
- 💡 Isi form terlalu cepat
- ✅ Solusi: Tunggu, lalu isi lebih lambat

---

### ❌ Scenario 4: Menggunakan VPN

```
🔐 reCAPTCHA Bot Detection
  ⏱️ Timestamp: 2026-02-12T15:45:00.000Z
  👤 User: Dedi Prasetyo
  💰 Nominal: Rp 150.000
  🔄 Generating reCAPTCHA token...
  ✅ reCAPTCHA token generated successfully
  🔑 Token (first 50 chars): 03AGdBq27VPNuser...
  📏 Token length: 1801 characters

📤 Sending Donation Data
  📬 Response status: 200 OK
  📥 Backend response: {
    status: "error",
    message: "Verifikasi keamanan gagal. Score: 0.1 (threshold: 0.3)",
    recaptchaScore: 0.1
  }

🤖 Bot Detection Analysis
  📈 reCAPTCHA Score: 0.1
  📊 Score meaning:
    • 0.1-0.2: Likely bot ❌  ← YOUR SCORE
  
  🚨 Score too low! Current: 0.1 | Required: ≥0.3
  
  💡 Solutions:
    ✅ Disable VPN during donation  ← IMPORTANT!
```

**Artinya:**
- ❌ Score sangat rendah (0.1)
- 🕵️ Kemungkinan besar pakai VPN
- ✅ Solusi: Matikan VPN, coba lagi

---

### ⚠️ Scenario 5: reCAPTCHA Tidak Loaded

```
🔐 reCAPTCHA Bot Detection
  ⏱️ Timestamp: 2026-02-12T16:00:00.000Z
  👤 User: Eka Putri
  💰 Nominal: Rp 200.000
  ⚠️ reCAPTCHA not loaded, proceeding without verification
  ⚠️ Bot protection DISABLED - this may cause security issues

📤 Sending Donation Data
  📦 Payload preview: {
    action: "create",
    nama: "Eka Putri",
    type: "Zakat Fitrah",
    nominal: "200000",
    hasRecaptchaToken: false  ← NO TOKEN!
  }
  📬 Response status: 200 OK
  📥 Backend response: {
    status: "error",
    message: "reCAPTCHA token tidak ditemukan"
  }

❌ Donation Submission Error
  📝 Error message: reCAPTCHA token tidak ditemukan
```

**Artinya:**
- ⚠️ reCAPTCHA script tidak loaded
- 🚫 Kemungkinan: adblocker, firewall, slow internet
- ✅ Solusi: Disable adblocker, refresh, coba browser lain

---

### 🌐 Scenario 6: Network/HTTP Error

```
🔐 reCAPTCHA Bot Detection
  ✅ reCAPTCHA token generated successfully

📤 Sending Donation Data
  🌐 API URL: https://script.google.com/macros/s/.../exec
  📬 Response status: 500 Internal Server Error
  ❌ HTTP error! 500 Internal Server Error

❌ Donation Submission Error
  💥 Error occurred during donation submission
  📝 Error message: HTTP error! status: 500
  
  🌐 This is a NETWORK/HTTP error
  
  💡 Possible causes:
    • Internet connection issue
    • Backend server is down
    • API URL is incorrect
  
  🔧 Try:
    • Check your internet connection
    • Refresh the page and try again
    • Contact admin if problem persists
```

**Artinya:**
- 🌐 Masalah network/server
- 🚫 Bukan masalah bot detection
- ✅ Solusi: Check internet, refresh, contact admin

---

## 🎯 Cara Membaca Console Log

### 1. Lihat Emoji
- 🔐 = reCAPTCHA process
- 📤 = Sending data
- 🤖 = Bot detection
- ❌ = Error

### 2. Cari Score (Jika Ada)
```
📈 reCAPTCHA Score: 0.X
```
- **0.7-1.0** = Aman ✅
- **0.3-0.6** = Borderline ⚠️
- **0.0-0.2** = Bahaya ❌

### 3. Baca "Possible causes"
Ini yang menyebabkan masalah

### 4. Ikuti "Solutions"
Langkah-langkah untuk fix

---

## 💡 Tips

### Jika Score Rendah (<0.3):
1. ⏱️ Tunggu 10 detik
2. 🔄 Refresh halaman (F5)
3. 🐌 Isi form LAMBAT (20-30 detik)
4. 🖱️ Gerakkan mouse, scroll
5. ⏳ Tunggu 5 detik setelah load
6. ✅ Submit

### Jika Masih Ditolak:
1. 🚫 Matikan VPN
2. 🔓 Keluar dari incognito mode
3. ⌨️ Ketik manual (jangan autofill)
4. 🔌 Disable adblocker
5. 🌐 Coba browser lain

### Untuk Developer:
1. 📊 Collect scores untuk analisis
2. 📉 Jika banyak <0.3 → Lower threshold
3. 📈 Monitor score distribution
4. 🔧 Compare frontend vs backend logs

---

**Remember:** Console adalah teman terbaik untuk debugging! 🚀
