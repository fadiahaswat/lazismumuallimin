# Quick Fix: Donasi Manual Terdeteksi BOT

## ❌ Masalah
```
Error: Bot activity detected / Aktivitas bot terdeteksi
```

Donasi manual ditolak sistem karena reCAPTCHA score terlalu rendah.

## ✅ Solusi (5 Menit)

### Langkah 1: Buka Google Apps Script
1. Buka https://script.google.com/
2. Pilih project yang terhubung dengan spreadsheet donasi
3. Buka file `Code.gs`

### Langkah 2: Ubah Threshold
Cari baris ini (sekitar baris 20):
```javascript
const RECAPTCHA_THRESHOLD = 0.5; // ← TERLALU KETAT!
```

Ubah menjadi:
```javascript
const RECAPTCHA_THRESHOLD = 0.3; // ← LEBIH FLEKSIBEL
```

### Langkah 3: Deploy
1. Klik **Save** (ikon disk)
2. Klik **Deploy** > **Manage deployments**
3. Klik **Edit** (ikon pensil)
4. Pilih **New version**
5. Klik **Deploy**

### Langkah 4: Test
1. Buka website donasi
2. Isi form dan submit
3. Seharusnya berhasil! ✅

## 📊 Penjelasan

| Threshold | Arti | Masalah |
|-----------|------|---------|
| 0.5 | Default | Manual input sering ditolak ❌ |
| 0.3 | Recommended | Balance keamanan & user experience ✅ |

## 🔍 Cek Score User

Tambahkan logging untuk monitoring (opsional):

```javascript
function verifikasiRecaptcha(token) {
  // ... kode existing ...
  
  Logger.log('reCAPTCHA Score: ' + json.score); // ← Tambahkan ini
  
  return json.success && json.score >= RECAPTCHA_THRESHOLD;
}
```

Lihat logs di: **Executions** di sidebar kiri Apps Script Editor.

## 📖 Dokumentasi Lengkap

Lihat [BOT_DETECTION_FIX.md](./BOT_DETECTION_FIX.md) untuk:
- Penjelasan mendalam kenapa ini terjadi
- Opsi threshold berbeda (0.1, 0.3, 0.5, 0.7)
- Tips untuk user agar tidak ditolak
- Monitoring dan analytics

## 💡 Tips Tambahan

Untuk user yang masih ditolak setelah fix, sarankan:
1. Jangan terburu-buru mengisi form
2. Jangan pakai VPN atau incognito mode
3. Tunggu beberapa detik setelah halaman load
4. Ketik manual (jangan copy-paste semua)

## ⚠️ Perhatian

- Jangan set threshold < 0.1 (bot bisa lolos)
- Monitor logs setelah perubahan
- Backup code sebelum edit

## 🆘 Masih Bermasalah?

1. Cek [RECAPTCHA_FIX.md](./RECAPTCHA_FIX.md) untuk masalah HTML entities
2. Verifikasi SECRET_KEY dan SITE_KEY match
3. Pastikan domain terdaftar di reCAPTCHA console
4. Cek logs di Google Apps Script untuk error detail
