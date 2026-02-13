# Field Names Mapping - Backend vs Frontend

## 📊 Field Names Yang Telah Disinkronkan

Dokumen ini menjelaskan mapping antara field names di backend (code.gs) dan frontend JavaScript.

### Backend (code.gs) - Field Names Standar Baru

Backend code.gs menggunakan field names yang konsisten dan lebih pendek:

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `idTransaksi` | String (UUID) | Unique transaction ID | `550e8400-e29b-41d4-a716-446655440000` |
| `Timestamp` | Date | Transaction timestamp | `2024-01-15 14:30:00` |
| `type` | String | Donation type | `Zakat Mal`, `Infaq` |
| `nominal` | Number | Donation amount | `100000` |
| `metode` | String | Payment method | `QRIS BNI`, `Transfer BSI` |
| `nama` | String | Donor name | `Ahmad Yusuf` |
| `donaturTipe` | String | Donor type | `Umum`, `Alumni`, `Wali Santri` |
| `DetailAlumni` | String | Alumni details | `Angkatan 2010` |
| `namaSantri` | String | Student name | `Muhammad Rizki` |
| `nisSantri` | String | Student ID | `2024001` |
| `rombelSantri` | String | Student class | `7A` |
| `hp` | String | Phone number | `081234567890` |
| `alamat` | String | Address | `Jl. Merdeka No. 123` |
| `email` | String | Email address | `ahmad@example.com` |
| `NoKTP` | String | ID card number | `3374010101990001` |
| `doa` | String | Prayer message | `Semoga berkah` |
| `Status` | String | Verification status | `Terverifikasi` |

### Frontend - Field Names Lama (Deprecated)

Field names lama yang **TIDAK LAGI DIGUNAKAN** oleh backend:

| Old Field Name | New Field Name | Status |
|----------------|----------------|--------|
| `JenisDonasi` | `type` | ⚠️ Deprecated |
| `MetodePembayaran` | `metode` | ⚠️ Deprecated |
| `NamaDonatur` | `nama` | ⚠️ Deprecated |
| `NoHP` | `hp` | ⚠️ Deprecated |
| `Nominal` | `nominal` | ⚠️ Deprecated |
| `Alamat` | `alamat` | ⚠️ Deprecated |
| `PesanDoa` | `doa` | ⚠️ Deprecated |
| `NamaSantri` | `namaSantri` | ⚠️ Deprecated |
| `KelasSantri` | `rombelSantri` | ⚠️ Deprecated |

## ✅ Perubahan Yang Sudah Dilakukan

### 1. Feature History (`feature-history.js`)

**Sebelum:**
```javascript
const type = item.JenisDonasi;
const paymentMethod = item.MetodePembayaran;
const donaturName = item.NamaDonatur;
```

**Sesudah (Backward Compatible):**
```javascript
const type = item.type || item.JenisDonasi || "";
const paymentMethod = item.metode || item.MetodePembayaran || "Tunai";
const donaturName = item.nama || item.NamaDonatur || 'Hamba Allah';
```

### 2. Feature Recap (`feature-recap.js`)

**Sebelum:**
```javascript
if (d.MetodePembayaran === 'QRIS') qris += nom;
const matchNama = d.NamaSantri && s.nama && d.NamaSantri.trim() === s.nama.trim();
const matchKelas = d.KelasSantri === s.rombel;
```

**Sesudah (Backward Compatible):**
```javascript
if ((d.metode || d.MetodePembayaran) === 'QRIS') qris += nom;
const matchNama = (d.namaSantri || d.NamaSantri) && s.nama;
const matchKelas = (d.rombelSantri || d.KelasSantri) === s.rombel;
```

### 3. Feature Donation (`feature-donation.js`)

✅ Sudah menggunakan field names baru sejak awal:
- Mengirim `type`, `nominal`, `metode`, `nama`, `hp`, `alamat`, dll ke backend
- Tidak perlu perubahan

## 🔄 Backward Compatibility Strategy

Semua perubahan menggunakan **fallback pattern** untuk mendukung data lama dan baru:

```javascript
// Pattern yang digunakan:
const fieldValue = item.newFieldName || item.oldFieldName || defaultValue;
```

**Keuntungan:**
- ✅ Tetap bisa membaca data lama dari Google Sheets (jika ada)
- ✅ Mendukung data baru dari backend code.gs
- ✅ Tidak ada breaking changes
- ✅ Migrasi smooth tanpa downtime

## 📝 Catatan Penting

### Untuk Developer:

1. **Gunakan field names baru** untuk semua kode baru:
   - ✅ `type` (bukan `JenisDonasi`)
   - ✅ `metode` (bukan `MetodePembayaran`)
   - ✅ `nama` (bukan `NamaDonatur`)
   - dll

2. **Backward compatibility** sudah diimplementasikan:
   - Data lama tetap bisa dibaca
   - Tidak perlu migrasi database manual

3. **Testing:**
   - Test dengan data lama (jika ada di Google Sheets)
   - Test dengan data baru dari backend code.gs
   - Verifikasi filter, sort, dan display berfungsi normal

### Untuk Deployment:

1. **Deploy backend code.gs** terlebih dahulu
2. **Update frontend** dengan kode yang sudah disinkronkan
3. **Test end-to-end** flow donasi
4. Data lama (jika ada) akan tetap berfungsi normal

## 🎯 Status Sinkronisasi

| Komponen | Status | Field Names |
|----------|--------|-------------|
| Backend (code.gs) | ✅ Updated | Menggunakan field names baru |
| feature-donation.js | ✅ Compatible | Sudah gunakan field names baru |
| feature-history.js | ✅ Synced | Support old & new field names |
| feature-recap.js | ✅ Synced | Support old & new field names |
| cetak.html | ✅ Compatible | Support old & new field names |

## 📚 Referensi

- **Backend Structure**: Lihat `backend-gas/SHEETS_TEMPLATE.md`
- **API Documentation**: Lihat `backend-gas/README.md`
- **Field Mapping**: Dokumen ini

---

**Last Updated**: February 2024  
**Version**: 2.1 (Revised)
