# Google Apps Script Backend - Lazismu Mu'allimin

This directory contains the backend code for the Lazismu Mu'allimin donation website, implemented as a Google Apps Script.

## 📋 Overview

The `code.gs` file is a Google Apps Script that manages:
- ✅ Donation data CRUD operations (UUID-based)
- 🔒 Google reCAPTCHA v3 verification (with bypass option for testing)
- 📝 Receipt (Kuitansi) data storage
- ✔️ Donation status verification

## 🚀 Deployment Instructions

### Prerequisites
- Google Account with access to Google Sheets and Google Apps Script
- The Google Sheets ID specified in the configuration (or create a new one)

### Step 1: Create/Access Google Spreadsheet

1. Create a new Google Spreadsheet or use the existing one
2. Create two sheets:
   - **DataDonasi** - For donation records (columns A-Q):
     - A: ID Transaksi (UUID)
     - B: Timestamp
     - C: Jenis Donasi (type)
     - D: Nominal
     - E: Metode Pembayaran
     - F: Nama Donatur
     - G: Tipe Donatur
     - H: Detail Alumni
     - I: Nama Santri
     - J: NIS Santri
     - K: Rombel/Kelas Santri
     - L: No HP
     - M: Alamat
     - N: Email
     - O: No KTP
     - P: Pesan Doa
     - Q: Status
   
   - **DataKuitansi** - For receipt records (columns A-L):
     - A: Timestamp
     - B: No Invoice
     - C: Tanggal Kuitansi
     - D: Nama
     - E: Penyetor
     - F: Alamat
     - G: No HP
     - H: Zakat
     - I: Infaq
     - J: Lain-lain
     - K: Total
     - L: Amil

3. Note the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### Step 2: Create Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com/)
2. Click **New Project**
3. Replace the default code with the contents of `code.gs`
4. Update the configuration constants at the top:
   ```javascript
   const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
   const RECAPTCHA_SECRET_KEY = "YOUR_RECAPTCHA_SECRET_KEY";
   const BYPASS_RECAPTCHA = false; // Set to false for production!
   ```

### Step 3: Deploy as Web App

1. In the Apps Script editor, click **Deploy** > **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Select **Web app**
4. Configure deployment:
   - **Description**: "Lazismu Backend API v2.1"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. Click **Deploy**
6. Authorize the script when prompted
7. Copy the **Web app URL** - this is your API endpoint

### Step 4: Update Frontend Configuration

Update the `config.js` file in the main project:

```javascript
export const GAS_API_URL = "YOUR_WEB_APP_URL_HERE";
```

Or use environment variable in `.env`:
```
VITE_GAS_API_URL=YOUR_WEB_APP_URL_HERE
```

## 🔧 Configuration

### reCAPTCHA Settings

- **RECAPTCHA_SECRET_KEY**: Your reCAPTCHA v3 secret key
- **RECAPTCHA_THRESHOLD**: Minimum score (0.0-1.0) to accept (default: 0.2)
- **BYPASS_RECAPTCHA**: Set to `true` for testing, `false` for production

⚠️ **IMPORTANT**: Set `BYPASS_RECAPTCHA = false` before going live!

### Spreadsheet Configuration

- **SPREADSHEET_ID**: Your Google Sheets ID
- **SHEET_NAME**: Name of the donations sheet (default: "DataDonasi")
- **SHEET_KUITANSI**: Name of the receipts sheet (default: "DataKuitansi")

## 📡 API Endpoints

### GET Request
Returns all donation data:
```javascript
fetch('YOUR_WEB_APP_URL')
  .then(response => response.json())
  .then(data => console.log(data));
```

Response:
```json
{
  "status": "success",
  "data": [...]
}
```

### POST Request
Performs various actions based on the `action` field:

#### Create Donation
```javascript
fetch('YOUR_WEB_APP_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({
    action: "create",
    payload: {
      type: "Zakat Mal",
      nominal: 100000,
      nama: "John Doe",
      hp: "081234567890",
      email: "john@example.com",
      metode: "QRIS BNI",
      recaptchaToken: "token_here"
      // ... other fields
    }
  })
})
```

#### Verify Donation
```javascript
{
  action: "verify",
  id: "transaction-uuid"
}
```

#### Update Donation
```javascript
{
  action: "update",
  id: "transaction-uuid",
  payload: { /* updated fields */ }
}
```

#### Delete Donation
```javascript
{
  action: "delete",
  id: "transaction-uuid"
}
```

#### Save Receipt (Kuitansi)
```javascript
{
  action: "kuitansi",
  no_inv: "INV-001",
  tgl_kwt: "2024-01-01",
  nama: "John Doe",
  // ... other receipt fields
}
```

## 🔒 Security Features

1. **UUID-based IDs**: Prevents conflicts and timing attacks
2. **reCAPTCHA v3**: Bot protection for donation submissions
3. **Script Lock**: Prevents race conditions during concurrent requests
4. **Error Handling**: Comprehensive error messages for debugging

## 🧪 Testing

1. Set `BYPASS_RECAPTCHA = true` in the configuration
2. Deploy the script
3. Test API endpoints using tools like Postman or curl
4. Verify data appears correctly in Google Sheets
5. Set `BYPASS_RECAPTCHA = false` before production deployment

## 📝 Version History

- **v2.1 (Revised)**: Current version
  - UUID-based transaction IDs
  - reCAPTCHA bypass for testing
  - Standardized field names with frontend
  - Comprehensive error handling

## 🤝 Support

For issues or questions, contact the Lazismu Mu'allimin development team.

## 📄 License

This code is proprietary to Lazismu Mu'allimin.
