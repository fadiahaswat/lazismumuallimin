# Deployment Guide - Secure Configuration

This guide explains how to deploy the Lazismu Muallimin website with secure environment variable configuration.

## Table of Contents
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Deployment Options](#deployment-options)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Local Development

For local development, the application uses default values defined in `js/env-config.js`. These are safe defaults that work with the existing setup.

```bash
# No special setup needed for development
# Just open index.html in your browser or use a local server
python -m http.server 8000
# or
npx serve
```

### 2. Production Deployment

For production, you have two options to configure environment variables:

#### Option A: Using env-loader script (Simple)

1. Copy `env-loader-example.html` to `env-config-production.js`
2. Update values with your production configuration
3. Include it in your `index.html` BEFORE other scripts:

```html
<head>
  ...
  <script src="env-config-production.js"></script>
  <script src="data-santri.js" defer></script>
  <script src="data-kelas.js" defer></script>
  <script type="module" src="js/main.js"></script>
</head>
```

**⚠️ IMPORTANT**: Add `env-config-production.js` to `.gitignore` to prevent committing secrets!

```bash
echo "env-config-production.js" >> .gitignore
```

#### Option B: Using Hosting Platform (Recommended)

Use your hosting platform's environment variable system. See [Deployment Options](#deployment-options) below.

## Environment Variables

### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `FIREBASE_API_KEY` | Firebase API key | `AIzaSy...` | Yes |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `project.firebaseapp.com` | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `my-project` | Yes |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `project.appspot.com` | Yes |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | `123456789` | Yes |
| `FIREBASE_APP_ID` | Firebase app ID | `1:123:web:abc` | Yes |
| `GAS_API_URL` | Google Apps Script donation URL | `https://script.google.com/...` | Yes |
| `GAS_API_URL_SANTRI` | GAS student data URL | `https://script.google.com/...` | Yes |
| `GAS_API_URL_KELAS` | GAS class data URL | `https://script.google.com/...` | Yes |
| `RECAPTCHA_SITE_KEY` | reCAPTCHA site key (v3) | `6Ld...` | Yes |

### Optional Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `WORDPRESS_SITE` | WordPress site for news | `lazismumuallimin.wordpress.com` | No |
| `NEWS_PER_PAGE` | News items per page | `6` | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `5` | No |
| `RATE_LIMIT_WINDOW_MINUTES` | Rate limit window | `15` | No |

## Deployment Options

### Netlify

1. **Add environment variables in Netlify UI:**
   - Go to Site Settings > Build & Deploy > Environment
   - Add each variable

2. **Create build script:**

```javascript
// netlify-build.js
const fs = require('fs');

const envScript = `
window.ENV = {
  FIREBASE_API_KEY: '${process.env.FIREBASE_API_KEY}',
  FIREBASE_AUTH_DOMAIN: '${process.env.FIREBASE_AUTH_DOMAIN}',
  // ... other variables
};
`;

fs.writeFileSync('env-config-production.js', envScript);
```

3. **Update netlify.toml:**

```toml
[build]
  command = "node netlify-build.js && npm run build:css"
  publish = "."
```

### Vercel

1. **Add environment variables in Vercel dashboard:**
   - Go to Project Settings > Environment Variables
   - Add each variable

2. **Create build script** (similar to Netlify)

3. **Update vercel.json:**

```json
{
  "buildCommand": "node vercel-build.js && npm run build:css",
  "outputDirectory": "."
}
```

### Firebase Hosting

1. **Use Firebase Functions for dynamic config:**

```javascript
// functions/index.js
const functions = require('firebase-functions');

exports.config = functions.https.onRequest((req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.send(`
    window.ENV = {
      FIREBASE_API_KEY: '${functions.config().app.firebase_key}',
      // ... other variables
    };
  `);
});
```

2. **Set environment config:**

```bash
firebase functions:config:set \
  app.firebase_key="your-key" \
  app.gas_url="your-url"
```

3. **Load in HTML:**

```html
<script src="/__/functions/config"></script>
```

### GitHub Pages

1. **Use GitHub Actions to inject variables:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Create env config
        env:
          FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          GAS_API_URL: ${{ secrets.GAS_API_URL }}
        run: |
          cat > env-config-production.js << EOF
          window.ENV = {
            FIREBASE_API_KEY: '$FIREBASE_API_KEY',
            GAS_API_URL: '$GAS_API_URL',
            // ... other variables
          };
          EOF
      
      - name: Build CSS
        run: npm run build:css
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .
```

2. **Add secrets in GitHub:**
   - Go to Repository Settings > Secrets and Variables > Actions
   - Add each secret

### Manual Deployment (Any Host)

1. **Create env-config-production.js locally:**

```javascript
window.ENV = {
  FIREBASE_API_KEY: 'your-actual-key',
  // ... other variables
};
```

2. **Update index.html to include it:**

```html
<head>
  ...
  <script src="env-config-production.js"></script>
  <script src="data-santri.js" defer></script>
  ...
</head>
```

3. **Upload all files to your hosting**

4. **DO NOT commit env-config-production.js to Git!**

## Security Checklist

Before deploying to production:

### Google Apps Script Backend
- [ ] Deployed with security measures (see `gas-backend-sample/README.md`)
- [ ] Request origin validation enabled
- [ ] Rate limiting implemented
- [ ] reCAPTCHA server-side verification enabled
- [ ] Input validation and sanitization working
- [ ] Logging configured
- [ ] Secrets stored in Script Properties (not in code)
- [ ] ALLOWED_ORIGINS set to production domain only

### Frontend Configuration
- [ ] Environment variables properly set
- [ ] No secrets committed to Git
- [ ] `.env` and `env-config-production.js` in `.gitignore`
- [ ] Production URLs (not test/dev URLs) configured
- [ ] reCAPTCHA site key matches the secret key in GAS
- [ ] HTTPS enforced (use `https://` URLs only)

### Firebase
- [ ] Firestore security rules deployed and tested
- [ ] Firebase project set to production mode
- [ ] Usage quotas and alerts configured
- [ ] Authentication properly configured
- [ ] App Check enabled (recommended)

### General
- [ ] All dependencies updated
- [ ] CSS built for production (`npm run build:css`)
- [ ] Tested in multiple browsers
- [ ] Mobile responsiveness verified
- [ ] Error handling works correctly
- [ ] Monitoring and logging set up

## Troubleshooting

### Configuration Not Loading

**Problem**: Application shows "Configuration warnings" in console

**Solution**:
1. Check that `window.ENV` is defined before application scripts load
2. Verify the env config script is loaded first in HTML
3. Check browser console for specific missing variables
4. Ensure variable names match exactly (case-sensitive)

### API Calls Failing

**Problem**: Donations or data fetching doesn't work

**Solution**:
1. Verify GAS_API_URL is correct and accessible
2. Check Google Apps Script deployment is set to "Anyone"
3. Verify CORS is not blocking requests
4. Check browser console for specific error messages
5. Test GAS endpoint directly with curl/Postman

### reCAPTCHA Not Working

**Problem**: "Bot verification failed" errors

**Solution**:
1. Verify reCAPTCHA site key matches the secret key in GAS
2. Check that reCAPTCHA v3 is properly initialized
3. Ensure the domain is registered in reCAPTCHA admin console
4. Check browser console for reCAPTCHA errors
5. Verify GAS backend has correct secret key in Script Properties

### Firebase Connection Issues

**Problem**: Authentication or database operations fail

**Solution**:
1. Verify all Firebase config variables are correct
2. Check Firebase project is active and not in free trial expired state
3. Review Firestore security rules
4. Check Firebase console for errors
5. Verify the domain is authorized in Firebase project settings

### Environment Variables Not Applied

**Problem**: Application still uses default values

**Solution**:
1. Clear browser cache and reload
2. Check that env config script loads before application scripts
3. Verify `window.ENV` object is created (check in browser console)
4. Ensure script tags are in correct order in HTML
5. Check for JavaScript errors that might prevent script execution

## Testing Production Configuration

Before going live, test your production configuration:

```bash
# 1. Build production assets
npm run build:css

# 2. Serve locally with production config
# (Create env-config-production.js with test values first)
npx serve

# 3. Open in browser and check:
# - Browser console for configuration logs
# - No errors in console
# - All features working (donations, news, authentication)
# - Check Network tab for correct API endpoints being called
```

## Rollback Procedure

If you need to rollback:

1. **Revert to previous deployment** on your hosting platform
2. **Check GAS deployment versions** and revert if needed
3. **Verify Firestore rules** haven't changed unexpectedly
4. **Monitor logs** for any issues
5. **Communicate with users** if there's downtime

## Support

For deployment issues:
- Review [SECURITY.md](SECURITY.md) for security guidelines
- Check hosting platform documentation
- Review browser console for errors
- Test individual components (Firebase, GAS, reCAPTCHA)

---

**Remember**: Always test in a staging environment before deploying to production!
