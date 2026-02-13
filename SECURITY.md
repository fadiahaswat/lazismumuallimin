# Security Guide - Lazismu Muallimin Website

## Table of Contents
- [Overview](#overview)
- [Security Measures Implemented](#security-measures-implemented)
- [Environment Variables Setup](#environment-variables-setup)
- [Google Apps Script Security](#google-apps-script-security)
- [Firebase Security](#firebase-security)
- [Best Practices](#best-practices)
- [Security Checklist](#security-checklist)
- [Incident Response](#incident-response)

## Overview

This document outlines the security measures implemented in the Lazismu Muallimin website and provides guidelines for maintaining a secure application.

### Key Security Principles
1. **Defense in Depth**: Multiple layers of security
2. **Least Privilege**: Minimal access rights required
3. **Secure by Default**: Safe defaults for all configurations
4. **Data Protection**: Encryption and validation at all levels

## Security Measures Implemented

### 1. Environment Variable Management

All sensitive configuration has been moved to environment variables:

- ✅ Firebase API credentials
- ✅ Google Apps Script deployment URLs
- ✅ reCAPTCHA site keys
- ✅ API endpoints

**Benefits:**
- Prevents accidental exposure of secrets in version control
- Allows different configurations per environment (dev, staging, prod)
- Makes credential rotation easier
- Supports secure deployment pipelines

### 2. API Protection

#### Google Apps Script (GAS) Backend

The application uses Google Apps Script as a serverless backend. Current protections:

- ✅ reCAPTCHA v3 integration for bot detection
- ✅ Client-side request validation
- ⚠️ **Requires additional server-side protection** (see recommendations below)

### 3. Firebase Security

- ✅ Firestore security rules implemented
- ✅ Authentication required for sensitive operations
- ✅ Read/write restrictions based on user roles
- ✅ Immutable donation records (no updates/deletes)

### 4. Client-Side Protection

- ✅ Input validation and sanitization
- ✅ Rate limiting awareness (configurable)
- ✅ Secure data handling
- ✅ XSS prevention through proper escaping

## Environment Variables Setup

### Step 1: Create Environment File

```bash
# Copy the example file
cp .env.example .env

# Edit with your actual values
nano .env
```

### Step 2: Configure Required Variables

Edit `.env` and fill in all required values:

```env
# Firebase Configuration
FIREBASE_API_KEY=your-actual-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Google Apps Script API
GAS_API_URL=https://script.google.com/macros/s/YOUR_ACTUAL_DEPLOYMENT_ID/exec
GAS_API_URL_SANTRI=https://script.google.com/macros/s/YOUR_ACTUAL_DEPLOYMENT_ID/exec
GAS_API_URL_KELAS=https://script.google.com/macros/s/YOUR_ACTUAL_DEPLOYMENT_ID/exec

# reCAPTCHA
RECAPTCHA_SITE_KEY=your-actual-recaptcha-site-key
```

### Step 3: Inject Environment Variables (Build Time)

For production deployments, you can inject environment variables at build time:

```javascript
// In your build process or index.html
<script>
  window.ENV = {
    FIREBASE_API_KEY: 'your-firebase-key',
    GAS_API_URL: 'your-gas-url',
    // ... other variables
  };
</script>
```

Or use your hosting platform's environment variable system (Netlify, Vercel, etc.)

### Step 4: Verify Configuration

The application will automatically validate configuration on load (in development mode). Check the browser console for any warnings.

## Google Apps Script Security

### Current Setup
The application uses GAS as a serverless backend for:
- Processing donation submissions
- Storing data in Google Sheets
- Handling reCAPTCHA verification

### CRITICAL Security Recommendations for GAS Backend

⚠️ **IMPORTANT**: Implement these security measures in your Google Apps Script backend:

#### 1. Request Origin Validation

```javascript
// In your GAS code (Code.gs)
function doPost(e) {
  // Validate request origin
  const allowedOrigins = [
    'https://lazismu-muallimin.com',
    'https://www.lazismu-muallimin.com'
  ];
  
  const origin = e.parameter.origin || e.headers.origin || '';
  
  if (!allowedOrigins.includes(origin)) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Unauthorized origin'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Continue with normal processing...
}
```

#### 2. Rate Limiting (Server-Side)

```javascript
// Implement rate limiting in GAS
const RATE_LIMIT = {
  MAX_REQUESTS: 5,
  WINDOW_MINUTES: 15
};

function checkRateLimit(identifier) {
  const cache = CacheService.getScriptCache();
  const key = 'rate_limit_' + identifier;
  const cached = cache.get(key);
  
  if (cached) {
    const data = JSON.parse(cached);
    if (data.count >= RATE_LIMIT.MAX_REQUESTS) {
      return false; // Rate limit exceeded
    }
    data.count++;
    cache.put(key, JSON.stringify(data), RATE_LIMIT.WINDOW_MINUTES * 60);
  } else {
    cache.put(key, JSON.stringify({count: 1}), RATE_LIMIT.WINDOW_MINUTES * 60);
  }
  
  return true; // Within rate limit
}
```

#### 3. reCAPTCHA Verification (Server-Side)

```javascript
function verifyRecaptcha(token) {
  const secretKey = 'YOUR_RECAPTCHA_SECRET_KEY'; // Store in Script Properties!
  const url = 'https://www.google.com/recaptcha/api/siteverify';
  
  const payload = {
    secret: secretKey,
    response: token
  };
  
  const options = {
    method: 'post',
    payload: payload
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    // Check score (for reCAPTCHA v3)
    return result.success && result.score >= 0.5;
  } catch (error) {
    Logger.log('reCAPTCHA verification error: ' + error);
    return false;
  }
}
```

#### 4. Input Validation and Sanitization

```javascript
function validateDonationData(data) {
  // Validate required fields
  if (!data.nama || !data.nominal || !data.type) {
    return {valid: false, error: 'Missing required fields'};
  }
  
  // Validate data types and ranges
  const nominal = parseFloat(data.nominal);
  if (isNaN(nominal) || nominal < 10000 || nominal > 10000000) {
    return {valid: false, error: 'Invalid nominal amount'};
  }
  
  // Sanitize strings
  data.nama = sanitizeString(data.nama);
  data.email = sanitizeEmail(data.email);
  
  return {valid: true, data: data};
}

function sanitizeString(str) {
  // Remove potentially harmful characters
  return str.replace(/[<>\"\']/g, '').substring(0, 200);
}
```

#### 5. Logging and Monitoring

```javascript
function logDonationAttempt(data, status) {
  const logSheet = SpreadsheetApp.openById('YOUR_LOG_SHEET_ID')
    .getSheetByName('Logs');
  
  logSheet.appendRow([
    new Date(),
    data.nama || 'Unknown',
    data.email || 'Unknown',
    data.nominal || 0,
    status,
    Session.getActiveUser().getEmail() || 'Anonymous',
    data.ip || 'Unknown'
  ]);
}
```

### Deployment Configuration

When deploying your Google Apps Script:

1. **Execute as**: Set to "Me" (the script owner)
2. **Who has access**: Set to "Anyone" (but protect with validation as shown above)
3. **Version**: Always deploy as a new version for tracking
4. **Project properties**: Store secrets in Script Properties (File > Project Properties > Script Properties)

### Storing Secrets in GAS

NEVER hardcode secrets in your GAS code. Use Script Properties:

```javascript
// To set (run once)
function setSecrets() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('RECAPTCHA_SECRET', 'your-secret-key');
}

// To use
function getRecaptchaSecret() {
  const scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty('RECAPTCHA_SECRET');
}
```

## Firebase Security

### Firestore Security Rules

Current rules (in `firestore.rules`):

- Default deny all
- Users can only access their own data
- Donations are readable by authenticated users (for leaderboard)
- Donations are immutable (cannot be updated or deleted)
- Student data is read-only

### Recommended Enhancements

1. **Enable Firebase App Check**
   - Protects against abuse from unauthorized clients
   - Works alongside reCAPTCHA

2. **Monitor Usage**
   - Set up Firebase usage alerts
   - Monitor for unusual patterns
   - Review security rules regularly

3. **Enable Audit Logging**
   - Track all database access
   - Monitor authentication events
   - Set up alerts for suspicious activity

## Best Practices

### For Developers

1. **Never commit secrets**
   - Always use `.env` for local development
   - Use `.env.example` for templates
   - Verify `.env` is in `.gitignore`

2. **Regular Security Audits**
   - Review Firestore rules monthly
   - Check GAS logs for anomalies
   - Update dependencies regularly

3. **Input Validation**
   - Validate on both client and server
   - Sanitize all user inputs
   - Use prepared statements/parameterized queries

4. **Secure Coding**
   - Avoid `eval()` and similar functions
   - Escape output to prevent XSS
   - Use Content Security Policy headers

### For System Administrators

1. **Access Control**
   - Limit who can access GAS projects
   - Use least privilege principle
   - Regular access reviews

2. **Monitoring**
   - Set up logging for all systems
   - Monitor API usage patterns
   - Alert on unusual activity

3. **Incident Response**
   - Have a security incident plan
   - Know how to rotate credentials
   - Document procedures

### For End Users

1. **Secure Communication**
   - Always use HTTPS
   - Verify the website URL
   - Report suspicious activity

## Security Checklist

Use this checklist before deploying:

### Development
- [ ] All secrets in `.env` file
- [ ] `.env` file in `.gitignore`
- [ ] No hardcoded credentials in code
- [ ] Dependencies updated
- [ ] Security linters run

### Google Apps Script
- [ ] Request origin validation implemented
- [ ] Rate limiting configured
- [ ] reCAPTCHA server-side verification enabled
- [ ] Input validation and sanitization implemented
- [ ] Logging and monitoring set up
- [ ] Secrets stored in Script Properties
- [ ] Deployment access properly configured

### Firebase
- [ ] Firestore rules reviewed and tested
- [ ] Authentication configured
- [ ] App Check enabled (recommended)
- [ ] Usage alerts configured
- [ ] Backup strategy in place

### Frontend
- [ ] All forms validated
- [ ] XSS prevention implemented
- [ ] CSRF protection for state-changing operations
- [ ] Content Security Policy configured
- [ ] HTTPS enforced

### Production
- [ ] Environment variables properly injected
- [ ] API keys rotated from development
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery tested
- [ ] Incident response plan documented

## Incident Response

### If You Suspect a Security Breach

1. **Immediate Actions**
   - Document what you observed
   - Take screenshots if applicable
   - Note the time and date

2. **Containment**
   - Disable affected API keys if compromised
   - Review recent logs for suspicious activity
   - Consider temporarily disabling the affected feature

3. **Investigation**
   - Check Firebase logs
   - Review GAS execution logs
   - Analyze access patterns
   - Identify affected users/data

4. **Recovery**
   - Rotate all potentially compromised credentials
   - Deploy fixed version
   - Monitor closely for recurrence

5. **Post-Incident**
   - Document lessons learned
   - Update security measures
   - Inform affected parties if required

### Contact Information

For security concerns:
- Create an issue in the repository (for non-sensitive issues)
- Contact the repository owner directly (for sensitive issues)

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Google Apps Script Best Practices](https://developers.google.com/apps-script/guides/support/best-practices)
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/v3)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)

---

**Last Updated**: February 2026  
**Version**: 1.0

Remember: Security is an ongoing process, not a one-time task. Regularly review and update these measures.
