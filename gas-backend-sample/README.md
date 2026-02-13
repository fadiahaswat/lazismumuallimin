# Google Apps Script Backend - Security Implementation Guide

This directory contains sample secure implementation for the Google Apps Script backend.

## ⚠️ IMPORTANT SECURITY NOTICE

The sample code below shows how to implement security measures in your Google Apps Script backend. This code should be deployed in your Google Apps Script project, NOT in this repository.

## Files Overview

- `Code.gs.sample` - Sample backend code with security features
- `README.md` - This file

## Sample Secure Implementation

See `Code.gs.sample` for a complete secure implementation with:

1. ✅ Request origin validation
2. ✅ Rate limiting
3. ✅ reCAPTCHA v3 verification  
4. ✅ Input validation and sanitization
5. ✅ Audit logging
6. ✅ Error handling
7. ✅ Secure configuration management

## Deployment Steps

### 1. Set Up Script Properties

1. In Google Apps Script editor: **File > Project Properties > Script Properties**
2. Add the following properties:

| Property | Description | Example |
|----------|-------------|---------|
| `RECAPTCHA_SECRET_KEY` | Your reCAPTCHA v3 secret key | `6Lc...` |
| `SPREADSHEET_ID` | Google Sheet ID for donations | `1a2b3c...` |
| `LOG_SHEET_ID` | Google Sheet ID for logs | `4d5e6f...` |
| `ALLOWED_ORIGINS` | Comma-separated allowed domains | `https://yourdomain.com,https://www.yourdomain.com` |

### 2. Deploy as Web App

1. **Click "Deploy" > "New deployment"**
2. Configure:
   - Type: **Web app**
   - Description: `Lazismu Backend v1.0`
   - Execute as: **Me** (your account)
   - Who has access: **Anyone**
3. Click **Deploy**
4. Copy the Web App URL
5. Update your `.env` file with this URL

### 3. Test the Deployment

Use curl or Postman to verify the deployment works correctly.

### 4. Monitor and Maintain

- Check execution logs regularly: **View > Executions**
- Review security logs in your log spreadsheet
- Monitor rate limit effectiveness
- Update reCAPTCHA threshold based on bot activity

## Security Checklist

Before going live:

- [ ] All secrets stored in Script Properties (not in code)
- [ ] ALLOWED_ORIGINS configured with production domain
- [ ] reCAPTCHA secret key configured
- [ ] Spreadsheet IDs configured
- [ ] Rate limiting tested
- [ ] Input validation tested with malicious inputs
- [ ] Logging verified to work
- [ ] Error handling tested
- [ ] Backup of spreadsheets configured

## Support

For issues or questions, refer to SECURITY.md in the repository root.

---

**Remember**: This backend handles sensitive donation data. Security must be the top priority!
