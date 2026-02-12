# Security Guide: Proper Configuration of code.gs

## ⚠️ Security Warning

File `code.gs` dalam repository ini adalah **TEMPLATE** dan mengandung placeholder values. **JANGAN** langsung copy-paste ke production dengan credentials asli yang di-hardcode!

## 🔒 Best Practice: Gunakan Properties Service

Google Apps Script menyediakan **Properties Service** untuk menyimpan credentials secara aman tanpa perlu hardcode di kode.

### Keuntungan Properties Service:

✅ Credentials tidak tersimpan di code
✅ Tidak ter-commit ke version control
✅ Lebih aman jika repository public
✅ Mudah diupdate tanpa edit code
✅ Berbeda untuk setiap deployment

## 📋 Langkah-langkah Setup (Recommended)

### Step 1: Copy Template Code

1. Copy file `code.gs` dari repository ini
2. Paste ke Google Apps Script Editor
3. **JANGAN ISI credentials dulu**

### Step 2: Setup Properties

1. Di Apps Script Editor, cari fungsi `setupProperties()`
2. Edit fungsi tersebut, isi dengan credentials yang benar:
   ```javascript
   function setupProperties() {
     const scriptProperties = PropertiesService.getScriptProperties();
     
     scriptProperties.setProperties({
       'SPREADSHEET_ID': 'YOUR_SPREADSHEET_ID_HERE', // ← ISI YANG BENAR
       'RECAPTCHA_SECRET_KEY': 'YOUR_RECAPTCHA_SECRET_KEY_HERE' // ← ISI YANG BENAR
     });
     
     Logger.log("✅ Properties configured successfully!");
   }
   ```

3. Pilih function `setupProperties` di dropdown
4. Click **Run**
5. Authorize jika diminta
6. Lihat logs (View > Logs) untuk konfirmasi

### Step 3: Verifikasi Properties

1. Pilih function `checkProperties` di dropdown
2. Click **Run**
3. Lihat logs, harus muncul:
   ```
   ========== Properties Check ==========
   SPREADSHEET_ID: ✅ Set
   RECAPTCHA_SECRET_KEY: ✅ Set
   ✅ All properties configured correctly!
   =====================================
   ```

### Step 4: Hapus Credentials dari Code

1. Edit kembali fungsi `setupProperties()`
2. **HAPUS** nilai yang sudah diisi, ganti dengan placeholder:
   ```javascript
   function setupProperties() {
     const scriptProperties = PropertiesService.getScriptProperties();
     
     scriptProperties.setProperties({
       'SPREADSHEET_ID': 'YOUR_SPREADSHEET_ID_HERE',
       'RECAPTCHA_SECRET_KEY': 'YOUR_SECRET_KEY_HERE'
     });
     
     Logger.log("✅ Properties configured successfully!");
   }
   ```
3. Save

### Step 5: Aktifkan Properties Service di Config

1. Cari bagian KONFIGURASI (baris ~6-19)
2. **Comment** baris template:
   ```javascript
   // Template values (TIDAK DIGUNAKAN LAGI)
   // const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
   // const SECRET_KEY = "YOUR_RECAPTCHA_SECRET_KEY_HERE";
   ```

3. **Uncomment** baris Properties Service:
   ```javascript
   // Untuk production, gunakan:
   const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
   const SECRET_KEY = PropertiesService.getScriptProperties().getProperty('RECAPTCHA_SECRET_KEY');
   ```

4. Save

### Step 6: Deploy

1. Click **Deploy** > **New deployment** (atau **Manage deployments**)
2. Deploy seperti biasa
3. Test apakah berfungsi

## 🚫 Metode TIDAK AMAN (Jangan Lakukan Ini)

### ❌ Hardcode Credentials di Code

```javascript
// ❌ BURUK - Credentials visible di code
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
const SECRET_KEY = "YOUR_RECAPTCHA_SECRET_KEY_HERE";
```

**Masalah:**
- Credentials tersimpan di version history
- Bisa bocor jika repository public
- Sulit untuk rotate credentials
- Security risk

### ❌ Commit Credentials ke Git

```bash
# ❌ BURUK - Commit code.gs dengan credentials asli
git add code.gs
git commit -m "Add backend code with credentials"
git push
```

**Masalah:**
- Credentials terpublish ke GitHub
- Bisa dilihat orang lain jika repo public
- Tetap ada di git history meskipun sudah dihapus
- Critical security vulnerability

## ✅ Metode AMAN (Best Practice)

### 1. Gunakan Properties Service

```javascript
// ✅ BAIK - Load dari Properties Service
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const SECRET_KEY = PropertiesService.getScriptProperties().getProperty('RECAPTCHA_SECRET_KEY');
```

### 2. Setup Properties via Function

```javascript
// ✅ BAIK - Setup sekali, lalu hapus nilai
function setupProperties() {
  PropertiesService.getScriptProperties().setProperties({
    'SPREADSHEET_ID': 'REAL_VALUE_HERE', // ← Edit & run sekali
    'RECAPTCHA_SECRET_KEY': 'REAL_VALUE_HERE' // ← Lalu hapus
  });
}
```

### 3. Commit Template Saja

```javascript
// ✅ BAIK - Commit template dengan placeholder
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE"; // Placeholder
const SECRET_KEY = "YOUR_RECAPTCHA_SECRET_KEY_HERE"; // Placeholder
```

## 🔄 Cara Rotate/Update Credentials

Jika perlu update credentials (misalnya, secret key baru):

### Metode 1: Via setupProperties()

```javascript
function setupProperties() {
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Update dengan nilai baru
  scriptProperties.setProperty('RECAPTCHA_SECRET_KEY', 'NEW_SECRET_KEY_HERE');
  
  Logger.log("✅ Secret key updated!");
}
```

Run fungsi ini, lalu hapus nilai dari code.

### Metode 2: Via Console (Manual)

1. Buka Apps Script Editor
2. Klik **Project Settings** (gear icon) di sidebar
3. Scroll ke **Script Properties**
4. Edit property yang ingin diubah
5. Save

## 📊 Perbandingan Metode

| Aspek | Hardcode | Properties Service |
|-------|----------|-------------------|
| **Security** | ❌ Poor | ✅ Excellent |
| **Version Control** | ❌ Credentials visible | ✅ Safe to commit |
| **Rotation** | ❌ Need to edit code | ✅ Easy update |
| **Public Repo** | ❌ NOT SAFE | ✅ Safe |
| **Setup** | ✅ Simple | ⚠️ Sedikit lebih kompleks |

## 🆘 Troubleshooting

### Error: "Cannot read property 'getProperty' of null"

**Penyebab:** Properties belum di-setup

**Solusi:**
1. Run `setupProperties()` dengan nilai yang benar
2. Verifikasi dengan `checkProperties()`

### Error: Properties returns null/undefined

**Penyebab:** Property name salah atau belum di-set

**Solusi:**
```javascript
// Cek nama property yang tersimpan
function listProperties() {
  const props = PropertiesService.getScriptProperties().getProperties();
  Logger.log(JSON.stringify(props));
}
```

### Ingin Reset Semua Properties

```javascript
// Run fungsi ini untuk hapus semua
function clearProperties() {
  PropertiesService.getScriptProperties().deleteAllProperties();
  Logger.log("⚠️ All properties cleared!");
}
```

## 📖 Dokumentasi Terkait

- **[Google Apps Script Properties Service](https://developers.google.com/apps-script/reference/properties/properties-service)**
- **[Best Practices for Apps Script](https://developers.google.com/apps-script/guides/support/best-practices)**

## ✅ Checklist Keamanan

Sebelum deploy ke production, pastikan:

- [ ] Credentials TIDAK hardcode di code
- [ ] Properties Service sudah di-setup
- [ ] `checkProperties()` return ✅ untuk semua properties
- [ ] Function `setupProperties()` sudah dibersihkan (tidak ada credentials)
- [ ] Code yang di-commit hanya template dengan placeholder
- [ ] Secret key tidak ter-commit ke git history
- [ ] Repository .gitignore sudah exclude file sensitif

## 🎯 Kesimpulan

**SELALU gunakan Properties Service untuk credentials di production!**

Template `code.gs` di repository ini sudah include helper functions untuk memudahkan setup. Ikuti langkah-langkah di atas untuk deployment yang aman.

---

**🔐 Remember:** Security is not optional!
