# Quick Deployment Guide

This is a step-by-step guide to deploy the Lazismu Mu'allimin backend Google Apps Script.

## 🚀 Quick Start (5 minutes)

### Step 1: Prepare Google Sheets (2 minutes)

1. Open [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet named "Lazismu Mu'allimin Database"
3. Create two sheets:
   - **DataDonasi** with 17 columns (A-Q)
   - **DataKuitansi** with 12 columns (A-L)
4. Copy the Spreadsheet ID from the URL

📝 See [SHEETS_TEMPLATE.md](./SHEETS_TEMPLATE.md) for detailed column structure

### Step 2: Deploy Apps Script (2 minutes)

1. Open [Google Apps Script](https://script.google.com)
2. Click **New Project**
3. Copy all code from `code.gs` and paste it
4. Update these constants:
   ```javascript
   const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID";
   const RECAPTCHA_SECRET_KEY = "YOUR_SECRET_KEY";
   const BYPASS_RECAPTCHA = false; // Set false for production
   ```
5. Click **Deploy** > **New deployment** > **Web app**
6. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy** and authorize
8. Copy the Web app URL

### Step 3: Update Frontend (1 minute)

Update `config.js`:
```javascript
export const GAS_API_URL = "YOUR_WEB_APP_URL";
```

✅ Done! Test by submitting a donation through the website.

## 🔐 Security Checklist

Before going live, ensure:

- [ ] `BYPASS_RECAPTCHA` is set to `false`
- [ ] Valid reCAPTCHA secret key is configured
- [ ] Spreadsheet permissions are set correctly
- [ ] Test all API endpoints (create, verify, update, delete)
- [ ] Backup the spreadsheet

## 🧪 Testing

Use this curl command to test:

```bash
curl -X GET "YOUR_WEB_APP_URL"
```

Expected response:
```json
{
  "status": "success",
  "data": []
}
```

Test POST:
```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: text/plain" \
  -d '{
    "action": "create",
    "payload": {
      "type": "Infaq",
      "nominal": 50000,
      "nama": "Test User",
      "hp": "081234567890",
      "email": "test@example.com",
      "metode": "QRIS BNI"
    }
  }'
```

## 📊 Monitoring

Monitor your deployment:

1. **View Logs**: Apps Script Editor > Executions
2. **Check Errors**: Look for error messages in execution logs
3. **Verify Data**: Check Google Sheets for new entries

## 🔄 Updating

To deploy a new version:

1. Edit the code in Apps Script editor
2. Click **Deploy** > **Manage deployments**
3. Click edit icon ✏️ on the current deployment
4. Select **New version** from dropdown
5. Click **Deploy**

The Web app URL remains the same - no need to update frontend.

## ⚠️ Troubleshooting

### "Script not found"
- Redeploy the script
- Check deployment settings

### "Authorization required"
- Reauthorize the script
- Check spreadsheet permissions

### "Data not saving"
- Verify Spreadsheet ID is correct
- Check sheet names match exactly
- Review execution logs for errors

### "reCAPTCHA failed"
- Verify secret key matches site key
- Check if BYPASS_RECAPTCHA is true for testing
- Ensure threshold is reasonable (0.2 recommended)

## 📞 Support

For additional help, refer to:
- [README.md](./README.md) - Full documentation
- [SHEETS_TEMPLATE.md](./SHEETS_TEMPLATE.md) - Sheet structure
- [Google Apps Script Documentation](https://developers.google.com/apps-script)

---

**Version**: 2.1 (Revised)  
**Last Updated**: February 2024
