# Google Sheets Template Structure

This document describes the structure of Google Sheets required for the Lazismu Mu'allimin backend.

## Sheet 1: DataDonasi

### Column Structure (A-Q, 17 columns total)

| Column | Field Name | Data Type | Description | Example |
|--------|------------|-----------|-------------|---------|
| A | ID Transaksi | Text (UUID) | Unique transaction identifier | `550e8400-e29b-41d4-a716-446655440000` |
| B | Timestamp | Date/Time | Donation submission timestamp | `2024-01-15 14:30:00` |
| C | Jenis Donasi (type) | Text | Type of donation | `Zakat Mal`, `Zakat Fitrah`, `Infaq` |
| D | Nominal | Number | Donation amount in IDR | `100000` |
| E | Metode Pembayaran | Text | Payment method | `QRIS BNI`, `Transfer BSI`, `Tunai` |
| F | Nama Donatur | Text | Donor name | `Ahmad Yusuf` |
| G | Tipe Donatur | Text | Donor type | `Umum`, `Alumni`, `Wali Santri` |
| H | Detail Alumni | Text | Alumni details (if applicable) | `Angkatan 2010` |
| I | Nama Santri | Text | Student name (if wali santri) | `Muhammad Rizki` |
| J | NIS Santri | Text | Student ID (if wali santri) | `2024001` |
| K | Rombel/Kelas Santri | Text | Student class (if wali santri) | `7A` |
| L | No HP | Text | Phone number | `081234567890` |
| M | Alamat | Text | Address | `Jl. Merdeka No. 123, Yogyakarta` |
| N | Email | Text | Email address | `ahmad@example.com` |
| O | No KTP | Text | ID card number | `3374010101990001` |
| P | Pesan Doa (doa) | Text | Prayer message | `Semoga berkah` |
| Q | Status | Text | Verification status | `Belum Verifikasi`, `Terverifikasi` |

### Header Row (Row 1)
```
ID Transaksi | Timestamp | Jenis Donasi | Nominal | Metode Pembayaran | Nama Donatur | Tipe Donatur | Detail Alumni | Nama Santri | NIS Santri | Rombel/Kelas Santri | No HP | Alamat | Email | No KTP | Pesan Doa | Status
```

### Sample Data (Row 2)
```
550e8400-e29b-41d4-a716-446655440000 | 2024-01-15 14:30:00 | Zakat Mal | 500000 | QRIS BNI | Ahmad Yusuf | Alumni | Angkatan 2010 | | | | 081234567890 | Jl. Merdeka No. 123 | ahmad@example.com | 3374010101990001 | Semoga berkah | Terverifikasi
```

## Sheet 2: DataKuitansi

### Column Structure (A-L, 12 columns total)

| Column | Field Name | Data Type | Description | Example |
|--------|------------|-----------|-------------|---------|
| A | Timestamp | Date/Time | Receipt creation timestamp | `2024-01-15 14:35:00` |
| B | No Invoice | Text | Invoice/receipt number | `INV-20240115-001` |
| C | Tanggal Kuitansi | Text/Date | Receipt date | `15 Januari 2024` |
| D | Nama | Text | Donor name | `Ahmad Yusuf` |
| E | Penyetor | Text | Depositor name | `Ahmad Yusuf` |
| F | Alamat | Text | Address | `Jl. Merdeka No. 123, Yogyakarta` |
| G | No HP | Text | Phone number | `081234567890` |
| H | Zakat | Number | Zakat amount | `200000` |
| I | Infaq | Number | Infaq amount | `300000` |
| J | Lain-lain | Number | Other donations amount | `0` |
| K | Total | Number | Total amount | `500000` |
| L | Amil | Text | Amil/receiver name | `Lazismu Mu'allimin` |

### Header Row (Row 1)
```
Timestamp | No Invoice | Tanggal Kuitansi | Nama | Penyetor | Alamat | No HP | Zakat | Infaq | Lain-lain | Total | Amil
```

### Sample Data (Row 2)
```
2024-01-15 14:35:00 | INV-20240115-001 | 15 Januari 2024 | Ahmad Yusuf | Ahmad Yusuf | Jl. Merdeka No. 123 | 081234567890 | 200000 | 300000 | 0 | 500000 | Lazismu Mu'allimin
```

## Setup Instructions

### Quick Setup

1. **Create a new Google Spreadsheet**
   - Go to [Google Sheets](https://sheets.google.com)
   - Click **Blank** to create a new spreadsheet
   - Rename it to "Lazismu Mu'allimin - Database"

2. **Create Sheet 1: DataDonasi**
   - Rename "Sheet1" to "DataDonasi"
   - In row 1, add the following headers (A1 through Q1):
     ```
     ID Transaksi, Timestamp, Jenis Donasi, Nominal, Metode Pembayaran, 
     Nama Donatur, Tipe Donatur, Detail Alumni, Nama Santri, NIS Santri, 
     Rombel/Kelas Santri, No HP, Alamat, Email, No KTP, Pesan Doa, Status
     ```
   - Format column B (Timestamp) as Date/Time
   - Format column D (Nominal) as Currency (IDR)

3. **Create Sheet 2: DataKuitansi**
   - Click the **+** button to add a new sheet
   - Rename it to "DataKuitansi"
   - In row 1, add the following headers (A1 through L1):
     ```
     Timestamp, No Invoice, Tanggal Kuitansi, Nama, Penyetor, 
     Alamat, No HP, Zakat, Infaq, Lain-lain, Total, Amil
     ```
   - Format column A (Timestamp) as Date/Time
   - Format columns H, I, J, K (Zakat, Infaq, Lain-lain, Total) as Currency (IDR)

4. **Optional: Format for Better Readability**
   - Make header row bold
   - Apply freeze to row 1 (View > Freeze > 1 row)
   - Apply alternating colors (Format > Alternating colors)
   - Set column widths appropriately

5. **Get the Spreadsheet ID**
   - Copy the ID from the URL:
     ```
     https://docs.google.com/spreadsheets/d/[THIS_IS_YOUR_SPREADSHEET_ID]/edit
     ```
   - Use this ID in the `SPREADSHEET_ID` constant in `code.gs`

## Data Validation Rules (Optional)

### DataDonasi Sheet

- **Column Q (Status)**: Dropdown with values
  - `Belum Verifikasi`
  - `Terverifikasi`

- **Column C (Jenis Donasi)**: Dropdown with common values
  - `Zakat Mal`
  - `Zakat Fitrah`
  - `Zakat Penghasilan`
  - `Infaq`
  - `Sedekah`
  - `Fidyah`

- **Column E (Metode Pembayaran)**: Dropdown with values
  - `QRIS BNI`
  - `QRIS BSI`
  - `QRIS BPD DIY`
  - `Transfer BNI`
  - `Transfer BSI`
  - `Transfer BPD DIY`
  - `Tunai`

- **Column G (Tipe Donatur)**: Dropdown with values
  - `Umum`
  - `Alumni`
  - `Wali Santri`

## Permissions

### For Script Access
- The Apps Script needs **Editor** access to the spreadsheet
- Set this automatically by creating the script from within the spreadsheet (Tools > Script editor)

### For Viewing/Editing
- **Viewers**: Can see the data but cannot edit
- **Editors**: Can edit the data and see the script
- **Owners**: Full control

## Backup Recommendations

1. **Enable Version History**
   - Automatically enabled in Google Sheets
   - Access via File > Version history

2. **Regular Exports**
   - Download as Excel/CSV weekly
   - File > Download > Microsoft Excel (.xlsx)

3. **Duplicate Sheet**
   - Create a backup copy monthly
   - File > Make a copy

## Notes

- The script automatically appends new rows to the sheets
- Never delete the header row (Row 1)
- Column order is critical - do not rearrange columns
- The script expects exactly 17 columns in DataDonasi and 12 in DataKuitansi
- UUID in column A (ID Transaksi) is auto-generated by the script
