# Testing Checklist - reCAPTCHA v3 Integration

## Pre-Deployment Verification

### 1. Code.gs File Validation

- [ ] **No HTML entities present**
  ```bash
  # Run this command to check:
  grep -E "&amp;|&lt;|&gt;" code.gs
  # Should return: nothing (exit code 1)
  ```

- [ ] **URL construction is correct** (Line 35)
  ```javascript
  // Should be:
  "&response=" + token
  // NOT:
  "&amp;response=" + token
  ```

- [ ] **Operators are correct** (Line 204, 209)
  ```javascript
  // Line 204 should be:
  if (lastRow <= 1) return [];
  
  // Line 209 should be:
  return values.map((row, index) => ({
  ```

- [ ] **Configuration values set**
  - [ ] SPREADSHEET_ID is correct
  - [ ] SECRET_KEY is filled (not the default example)
  - [ ] SHEET_NAME = "DataDonasi"
  - [ ] SHEET_KUITANSI = "DataKuitansi"

### 2. Google Apps Script Deployment

- [ ] **Script deployed as Web App**
  - [ ] Execute as: **Me** (your account)
  - [ ] Who has access: **Anyone**
  - [ ] Deployment successful
  - [ ] Web app URL obtained

- [ ] **Permissions granted**
  - [ ] Apps Script authorized to access spreadsheet
  - [ ] Apps Script authorized to make external requests (UrlFetchApp)

### 3. Frontend Configuration (config.js)

- [ ] **GAS_API_URL matches deployment**
  ```javascript
  export const GAS_API_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
  ```

- [ ] **RECAPTCHA_SITE_KEY is correct**
  ```javascript
  export const RECAPTCHA_SITE_KEY = "6LdhLGIsAAAAAOFfE86013kZqCZvZwVTTBPZTdp6";
  ```

### 4. HTML Configuration (index.html)

- [ ] **reCAPTCHA script loaded**
  ```html
  <script src="https://www.google.com/recaptcha/api.js?render=SITE_KEY"></script>
  ```

- [ ] **Site key matches config.js**

### 5. Google Sheets Setup

- [ ] **Spreadsheet exists** (ID: 1EhFeSGfar1mqzEQo5CgncmDr8nflFqcSyAaXAFmWFqE)

- [ ] **Tab "DataDonasi" exists** with columns:
  - A: Timestamp
  - B: JenisDonasi (Type)
  - C: Nominal
  - D: MetodePembayaran
  - E: NamaDonatur (Name)
  - F: TipeDonatur (DonaturTipe)
  - G: DetailAlumni
  - H: NamaSantri
  - I: NISSantri
  - J: KelasSantri (RombelSantri)
  - K: NoHP
  - L: Alamat
  - M: Email
  - N: NoKTP
  - O: PesanDoa (Doa)
  - P: Status

- [ ] **Tab "DataKuitansi" exists** with columns:
  - A: Waktu Input
  - B: No Invoice
  - C: Tanggal Kuitansi
  - D: Nama Donatur
  - E: Nama Penyetor
  - F: Alamat
  - G: No HP
  - H: Zakat
  - I: Infaq
  - J: Lainnya
  - K: Total
  - L: Amil

### 6. reCAPTCHA Console Configuration

- [ ] **Site created** at https://www.google.com/recaptcha/admin
- [ ] **reCAPTCHA v3** selected
- [ ] **Domain added** (your website domain)
- [ ] **Site Key obtained** and matches frontend
- [ ] **Secret Key obtained** and matches backend

---

## Manual Testing

### Test 1: Basic Form Submission (Human Simulation)

**Steps:**
1. Open website in browser
2. Navigate to donation form
3. Fill all required fields with valid data
4. Open browser DevTools (F12) → Console tab
5. Click "Submit" button

**Expected Results:**
- [ ] No JavaScript errors in console
- [ ] Loading spinner appears on submit button
- [ ] After 2-3 seconds, success modal appears
- [ ] Success message: "Data tersimpan!" or similar
- [ ] Check Google Sheet → new row added with data

**Console Checks:**
```javascript
// You should see logs like:
// "Submitting donation..."
// "reCAPTCHA token obtained"
// "Data sent to server"
// "Success: {status: 'success', data: {...}}"
```

**Google Sheet Checks:**
- [ ] New row in DataDonasi tab
- [ ] Timestamp is current
- [ ] All fields match submitted data
- [ ] Status = "Belum Verifikasi"
- [ ] NO "recaptchaToken" field (should be removed before saving)

### Test 2: reCAPTCHA Token Verification

**Steps:**
1. Open browser DevTools → Network tab
2. Submit donation form
3. Find the POST request to Google Apps Script
4. Inspect request payload

**Expected Results:**
- [ ] Request payload contains `recaptchaToken` field
- [ ] Token is a long string (starts with something like "03AGdB...")
- [ ] Token is sent in payload alongside other form data

**Additional Check:**
In Google Apps Script:
1. Add temporary logging:
   ```javascript
   function doPost(e) {
     var lock = LockService.getScriptLock();
     lock.tryLock(10000);
     try {
       const requestData = JSON.parse(e.postData.contents);
       Logger.log("Received data: " + JSON.stringify(requestData));
       
       // Rest of the code...
     }
   }
   ```
2. View logs: **Apps Script Editor → View → Logs**
3. Check if token is received

### Test 3: Bot Detection (Low Score Simulation)

**Note:** This is hard to simulate naturally. Skip if not possible.

**Alternative Test:**
1. Temporarily modify code.gs to always reject:
   ```javascript
   function verifikasiRecaptcha(token) {
     return false; // Always reject for testing
   }
   ```
2. Submit form
3. Should see error: "Sistem mendeteksi aktivitas mencurigakan (Bot)"
4. Restore original code

### Test 4: Missing Token Handling

**Steps:**
1. Temporarily comment out reCAPTCHA token generation in feature-donation.js:
   ```javascript
   // const tokenRecaptcha = await new Promise((resolve) => { ... });
   // payload.recaptchaToken = tokenRecaptcha;
   ```
2. Submit form

**Expected Results:**
- [ ] Error toast appears
- [ ] Error message: "Verifikasi keamanan (reCAPTCHA) gagal: Token tidak ditemukan"
- [ ] Data NOT saved to Google Sheet
- [ ] Form remains editable (not cleared)

**Restore code after test!**

### Test 5: Network Error Handling

**Steps:**
1. Open DevTools → Network tab
2. Enable "Offline" mode
3. Submit form

**Expected Results:**
- [ ] Error toast appears
- [ ] Error message: "Gagal mengirim data: Failed to fetch" or similar
- [ ] Submit button re-enabled
- [ ] Form data not lost

### Test 6: Invalid Secret Key

**Steps:**
1. Temporarily change SECRET_KEY in code.gs to invalid value
2. Re-deploy
3. Submit form

**Expected Results:**
- [ ] Error toast appears
- [ ] Error message about bot detection or verification failure
- [ ] Data NOT saved to Google Sheet

**Restore correct key after test!**

### Test 7: Multiple Rapid Submissions

**Steps:**
1. Fill form
2. Click submit multiple times rapidly (5-10 times)

**Expected Results:**
- [ ] Only ONE row added to Google Sheet (thanks to lock mechanism)
- [ ] No duplicate entries
- [ ] No errors in console

---

## Browser Console Debug Commands

Open browser console and run these to check configuration:

### Check if reCAPTCHA is loaded:
```javascript
console.log("grecaptcha loaded:", typeof grecaptcha !== 'undefined');
console.log("grecaptcha.ready:", typeof grecaptcha?.ready === 'function');
```

### Check configuration:
```javascript
console.log("GAS_API_URL:", GAS_API_URL);
console.log("RECAPTCHA_SITE_KEY:", RECAPTCHA_SITE_KEY);
```

### Manually execute reCAPTCHA (must import module first):
```javascript
import { RECAPTCHA_SITE_KEY } from './config.js';
grecaptcha.ready(() => {
  grecaptcha.execute(RECAPTCHA_SITE_KEY, {action: 'test'}).then((token) => {
    console.log("Token generated:", token);
    console.log("Token length:", token.length);
  });
});
```

---

## Apps Script Debug Logs

Add these temporary logs to code.gs for debugging:

### In verifikasiRecaptcha function:
```javascript
function verifikasiRecaptcha(token) {
  const SECRET_KEY = "...";
  Logger.log("Verifying token: " + token);
  
  const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET_KEY + "&response=" + token;
  Logger.log("Request URL: " + url);
  
  const response = UrlFetchApp.fetch(url);
  const json = JSON.parse(response.getContentText());
  Logger.log("Google response: " + JSON.stringify(json));
  
  const isValid = json.success && json.score >= 0.5;
  Logger.log("Verification result: " + isValid + " (score: " + json.score + ")");
  
  return isValid;
}
```

### View logs:
1. Go to Apps Script Editor
2. Click **View** → **Logs** (or **Executions**)
3. See detailed execution logs

---

## Common Issues & Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| "Token not found" | reCAPTCHA not loading | Check script tag in index.html |
| "Bot detected" always | Wrong SECRET_KEY | Verify key in code.gs matches reCAPTCHA console |
| "Bot detected" always | HTML entities in URL | Use fixed code.gs from this PR |
| Data not saving | Spreadsheet ID wrong | Verify SPREADSHEET_ID in code.gs |
| Data not saving | Tab name wrong | Ensure "DataDonasi" tab exists |
| "Unauthorized" | Deployment settings | Re-deploy with "Anyone" access |
| Syntax error in console | HTML entities | Use fixed code.gs from this PR |

---

## Success Criteria

All of these should be TRUE:

- [x] Form submits without errors
- [x] Success modal appears after submission  
- [x] Data appears in Google Sheet within 5 seconds
- [x] No JavaScript errors in browser console
- [x] No errors in Apps Script logs
- [x] Token field NOT saved to spreadsheet (removed before saving)
- [x] Status field = "Belum Verifikasi"
- [x] All user data fields correctly mapped
- [x] Multiple submissions don't create duplicate rows (lock works)
- [x] Low-score users rejected (if testable)

---

## Final Verification

After all tests pass:

1. **Remove all debug logs** from code.gs
2. **Remove any test modifications** from frontend
3. **Re-deploy Apps Script** (production version)
4. **Clear browser cache**
5. **Do one final end-to-end test**
6. **Monitor for 24 hours** to catch any edge cases

---

## Support

If tests fail, refer to:
- `RECAPTCHA_FIX.md` - Detailed troubleshooting
- `DATA_FLOW.md` - Architecture and data flow
- `KODE_PERBANDINGAN.md` - Code comparison
- `QUICK_REFERENCE.md` - Quick setup guide

**Still having issues?**
1. Check all configuration values match
2. Verify HTML entities are gone
3. Check Apps Script logs for errors
4. Check browser console for errors
5. Verify reCAPTCHA keys are valid and match
