# Security Fixes Implementation Guide

This document outlines the security fixes that can be implemented to address vulnerabilities found in the security analysis.

## ✅ Implemented Fixes

### 1. HTML Escaping Utility
**Status:** ✅ Already exists in `utils.js`

The application already has an `escapeHtml()` function that should be used consistently:

```javascript
export function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
```

**Usage:** This function is already used in toast messages but needs to be applied consistently across all dynamic HTML generation.

---

## 🔧 Fixes to Implement

### 2. XSS Prevention in Dynamic HTML

**Files Affected:**
- `feature-recap.js` - Lines 196-219, 223-245
- `feature-news.js` - Multiple innerHTML assignments
- `feature-history.js` - User data rendering
- `firebase-init.js` - Dropdown population

**Issue:** Dynamic HTML is generated without escaping user-controlled data.

**Fix Required:**
Apply `escapeHtml()` to all user-controlled variables before inserting into HTML:

```javascript
// BEFORE (Vulnerable):
html += `<h5 class="font-bold">${meta.wali}</h5>`;

// AFTER (Secure):
import { escapeHtml } from './utils.js';
html += `<h5 class="font-bold">${escapeHtml(meta.wali)}</h5>`;
```

**Specific Locations to Fix:**

1. **feature-recap.js** - Lines 211-212:
```javascript
// Escape wali and musyrif names
<p><i class="fas fa-user-tie w-4 text-center"></i> ${escapeHtml(meta.wali)}</p>
<p><i class="fas fa-user-shield w-4 text-center"></i> ${escapeHtml(meta.musyrif)}</p>
```

2. **feature-recap.js** - Line 232-233:
```javascript
<h5 class="font-bold text-slate-800 text-lg">Kelas ${escapeHtml(item.kelas)}</h5>
<span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 truncate max-w-[150px]">${escapeHtml(meta.wali)}</span>
```

3. **feature-news.js** - All dynamic content from WordPress API needs escaping
4. **feature-history.js** - Donor names, donation messages, etc.

---

### 3. Content Security Policy (CSP)

**Implementation:** Add CSP meta tag to `index.html` in the `<head>` section:

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' 
        https://www.gstatic.com 
        https://cdnjs.cloudflare.com 
        https://fonts.googleapis.com
        https://script.google.com;
    style-src 'self' 'unsafe-inline' 
        https://fonts.googleapis.com 
        https://cdnjs.cloudflare.com;
    font-src 'self' 
        https://fonts.gstatic.com 
        https://cdnjs.cloudflare.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' 
        https://script.google.com 
        https://lazismumuallimin.wordpress.com 
        https://firestore.googleapis.com
        https://identitytoolkit.googleapis.com;
    frame-src 'self' https:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
">
```

**Note:** The `'unsafe-inline'` and `'unsafe-eval'` directives are necessary for the current implementation but should be removed in a future refactoring by:
- Moving inline scripts to external files
- Removing eval-like constructs
- Using nonces for necessary inline scripts

---

### 4. Subresource Integrity (SRI) for CDN Resources

**Files Affected:** `index.html`

**Current (Insecure):**
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

**Fixed (With SRI):**
```html
<link rel="stylesheet" 
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
    crossorigin="anonymous"
    referrerpolicy="no-referrer">

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    integrity="sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA=="
    crossorigin="anonymous"
    referrerpolicy="no-referrer"></script>
```

---

### 5. Secure Password Storage - ARCHITECTURAL CHANGE REQUIRED

**⚠️ CRITICAL:** This requires significant changes and cannot be quickly patched.

**Current (Insecure):**
- Passwords stored in plain text in localStorage
- Default password is NIS

**Recommended Architecture:**
```javascript
// REMOVE all password storage code from:
// - santri-manager.js (lines 10, 13)
// - ui-navigation.js (line 151)
// - firebase-init.js (line 93)

// INSTEAD: Use Firebase Authentication exclusively
// Students should use Firebase email/password auth
// Server-side validation required
```

**Steps:**
1. Create Firebase user accounts for all students
2. Send password reset emails
3. Remove localStorage password code
4. Update login flow to use Firebase auth only
5. Implement server-side NIS verification

---

### 6. Input Validation Enhancement

**Add to `utils.js`:**

```javascript
/**
 * Validates email format
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates phone number (Indonesian format)
 */
export function isValidPhone(phone) {
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

/**
 * Validates NIS format (6 digits)
 */
export function isValidNIS(nis) {
    const nisRegex = /^[0-9]{6}$/;
    return nisRegex.test(String(nis));
}

/**
 * Sanitizes numeric input
 */
export function sanitizeNumber(input, min = 0, max = Infinity) {
    const num = parseInt(String(input).replace(/\D/g, ''));
    if (isNaN(num)) return min;
    return Math.max(min, Math.min(max, num));
}
```

**Usage in forms:**

```javascript
// In firebase-init.js - loginWithNIS()
if (!isValidNIS(nisInput)) {
    return showToast("Format NIS tidak valid (6 digit)", "error");
}

// In donation forms
if (!isValidEmail(emailInput)) {
    return showToast("Format email tidak valid", "error");
}

// In amount inputs
const amount = sanitizeNumber(amountInput, 10000, 100000000);
```

---

### 7. Firebase Security Rules

**File:** Create `.firebaserc` and `firestore.rules`

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default deny all
    match /{document=**} {
      allow read, write: if false;
    }
    
    // Only authenticated users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Donations - read only for authenticated users
    match /donations/{donationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false; // Immutable
    }
  }
}
```

**Firebase App Check Setup:**
1. Enable App Check in Firebase Console
2. Register your domain
3. Add reCAPTCHA v3 site key
4. Enforce App Check for all API calls

---

### 8. Rate Limiting for Login

**Add to `firebase-init.js`:**

```javascript
// Track login attempts
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(identifier) {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier) || { count: 0, firstAttempt: now };
    
    // Reset if lockout period has passed
    if (now - attempts.firstAttempt > LOCKOUT_DURATION) {
        loginAttempts.set(identifier, { count: 1, firstAttempt: now });
        return true;
    }
    
    // Check if max attempts exceeded
    if (attempts.count >= MAX_ATTEMPTS) {
        const remainingTime = Math.ceil((LOCKOUT_DURATION - (now - attempts.firstAttempt)) / 60000);
        showToast(`Terlalu banyak percobaan. Coba lagi dalam ${remainingTime} menit.`, 'error');
        return false;
    }
    
    // Increment attempts
    attempts.count++;
    loginAttempts.set(identifier, attempts);
    return true;
}

// Use in loginWithNIS():
export function loginWithNIS() {
    const nisInput = document.getElementById('login-nis').value.trim();
    
    // Check rate limit first
    if (!checkRateLimit(nisInput)) {
        return;
    }
    
    // ... rest of login logic
}
```

---

### 9. Secure Session Management

**Replace localStorage with sessionStorage for session data:**

```javascript
// In firebase-init.js - updateUIForLogin()
// INSTEAD OF:
localStorage.setItem('lazismu_user_santri', JSON.stringify(mockUser));

// USE:
sessionStorage.setItem('lazismu_user_session', JSON.stringify({
    uid: mockUser.uid,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
}));

// Check expiration on every auth state change
function isSessionValid() {
    const session = sessionStorage.getItem('lazismu_user_session');
    if (!session) return false;
    
    const data = JSON.parse(session);
    if (Date.now() > data.expiresAt) {
        sessionStorage.removeItem('lazismu_user_session');
        return false;
    }
    return true;
}
```

---

### 10. Secure Data Transmission

**Ensure all API calls use HTTPS and proper error handling:**

```javascript
// Add to data-santri.js and feature-history.js
async function secureFetch(url, options = {}) {
    try {
        // Ensure HTTPS
        if (!url.startsWith('https://')) {
            throw new Error('Only HTTPS requests are allowed');
        }
        
        const response = await fetch(url, {
            ...options,
            credentials: 'same-origin', // Don't send credentials to third parties
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Secure fetch failed:', error);
        throw error;
    }
}

// Usage:
const data = await secureFetch(API_URL);
```

---

## 🔒 Server-Side Requirements

The following fixes require backend changes:

### 11. Google Apps Script Security

**In your Google Apps Script:**

```javascript
function doGet(e) {
    // 1. Verify origin
    const allowedOrigins = ['https://lazismumuallimin.org'];
    const origin = e.parameter.origin;
    
    if (!allowedOrigins.includes(origin)) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Unauthorized origin'
        })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. Implement rate limiting
    // (Use PropertiesService to track requests)
    
    // 3. Add API key validation
    const apiKey = e.parameter.apiKey;
    if (apiKey !== 'your-secret-key-here') {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Invalid API key'
        })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ... rest of your logic
}

function doPost(e) {
    // Same security checks
    // + Input validation
    // + Sanitization
}
```

---

## 📋 Security Checklist

Before deploying to production:

- [ ] All user inputs are validated and sanitized
- [ ] All dynamic HTML uses `escapeHtml()`
- [ ] CSP headers are implemented
- [ ] SRI hashes added to all CDN resources
- [ ] Firebase Security Rules configured
- [ ] Firebase App Check enabled
- [ ] Rate limiting implemented for critical operations
- [ ] Session management uses secure tokens
- [ ] All API endpoints require authentication
- [ ] HTTPS enforced everywhere
- [ ] Error messages don't leak sensitive information
- [ ] Logging doesn't expose sensitive data
- [ ] Password storage removed from client-side
- [ ] Security testing completed
- [ ] Penetration testing performed
- [ ] Privacy policy and ToS updated

---

## 🚨 Emergency Response Plan

If a security breach is detected:

1. **Immediate Actions:**
   - Disable affected functionality
   - Rotate all API keys and credentials
   - Force logout all users
   - Enable maintenance mode

2. **Investigation:**
   - Review server logs
   - Check Firebase Auth logs
   - Analyze affected data
   - Identify attack vector

3. **Communication:**
   - Notify affected users
   - Report to relevant authorities if required
   - Update security disclosure

4. **Remediation:**
   - Apply security patches
   - Update authentication mechanisms
   - Enhance monitoring
   - Conduct post-mortem analysis

---

## 📚 Additional Resources

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

---

**Last Updated:** 2026-02-04  
**Version:** 1.0
