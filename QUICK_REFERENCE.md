# Google reCAPTCHA v3 Fix - Quick Reference

## 🐛 Bug Summary

**Issue:** Donation data not saving to Google Sheets database

**Root Cause:** HTML entities in `code.gs` file causing JavaScript syntax errors

**Impact:** 
- reCAPTCHA verification fails
- All donation submissions rejected as "bot activity"
- No data reaches Google Sheets

## 🔧 The Fix

Three HTML entities were breaking the JavaScript:

| Line | Wrong Code | Correct Code |
|------|------------|--------------|
| 35   | `&amp;response=` | `&response=` |
| 204  | `&amp;lt;= 1` | `<= 1` |
| 209  | `=&gt;` | `=>` |

## ✅ Solution Files

This PR provides:

1. **`code.gs`** - Fixed Google Apps Script (no HTML entities)
2. **`RECAPTCHA_FIX.md`** - Complete setup guide (Indonesian)
3. **`KODE_PERBANDINGAN.md`** - Code comparison (Indonesian)
4. **`README.md`** - Updated with setup instructions

## 🚀 Deployment Steps

1. **Open Google Apps Script Editor**
   - Go to https://script.google.com/
   - Open your project

2. **Replace the code**
   - Delete all content in `Code.gs`
   - Copy entire content from `code.gs` in this repo
   - Paste into Google Apps Script Editor

3. **Update Secret Key**
   ```javascript
   const SECRET_KEY = "YOUR_ACTUAL_SECRET_KEY_HERE";
   ```

4. **Deploy**
   - Click **Deploy** > **New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**

5. **Update config.js** (if URL changed)
   ```javascript
   export const GAS_API_URL = "YOUR_NEW_DEPLOYMENT_URL";
   ```

6. **Test**
   - Submit a donation form
   - Check Google Sheets for new entry

## 🔑 Required Configuration

Ensure these are correctly set:

**In Google Apps Script (`code.gs`):**
```javascript
const SPREADSHEET_ID = "1EhFeSGfar1mqzEQo5CgncmDr8nflFqcSyAaXAFmWFqE";
const SECRET_KEY = "YOUR_RECAPTCHA_SECRET_KEY"; // ⚠️ Change this!
```

**In Website (`config.js`):**
```javascript
export const GAS_API_URL = "https://script.google.com/macros/s/.../exec";
export const RECAPTCHA_SITE_KEY = "6LdhLGIsAAAAAOFfE86013kZqCZvZwVTTBPZTdp6";
```

**In Website (`index.html`):**
```html
<script src="https://www.google.com/recaptcha/api.js?render=6LdhLGIsAAAAAOFfE86013kZqCZvZwVTTBPZTdp6"></script>
```

## 🧪 Testing

1. Open browser console (F12)
2. Submit donation form
3. Check for errors in console
4. Verify data in Google Sheets

**Expected flow:**
1. Form submission triggers reCAPTCHA
2. Token sent to Google Apps Script
3. Script verifies with Google reCAPTCHA API
4. If score >= 0.5, data saved to sheet
5. Success response returned to frontend

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "Token not found" | reCAPTCHA not loaded in frontend |
| "Bot detected" | Score < 0.5 or secret key mismatch |
| "Unauthorized" | Script not deployed as "Anyone" |
| Still has `&amp;` | Copy code from raw file, not HTML view |

## 📚 Documentation

- **Indonesian users:** See `RECAPTCHA_FIX.md` for detailed guide
- **Code comparison:** See `KODE_PERBANDINGAN.md` for before/after

## 🔒 Security Notes

- ⚠️ Never commit Secret Key to public repository
- ✅ Site Key is safe to be public (it's for client-side)
- ✅ Secret Key stays in Google Apps Script only
- ✅ Adjust score threshold as needed (default 0.5)

## 📋 Verification Checklist

- [ ] No HTML entities in code (`&amp;`, `&lt;`, `&gt;`)
- [ ] Secret Key configured in Apps Script
- [ ] Site Key configured in config.js
- [ ] Script deployed as Web App
- [ ] GAS_API_URL matches deployment URL
- [ ] Sheets "DataDonasi" and "DataKuitansi" exist
- [ ] reCAPTCHA script loaded in index.html
- [ ] Test submission successful
- [ ] Data appears in Google Sheets

---

**For detailed troubleshooting, see:** `RECAPTCHA_FIX.md`
