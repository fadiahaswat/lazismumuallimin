# The Bug Visualized

## 🔴 Problem: HTML Entities Breaking JavaScript

### What Happened?

When code was copied from an HTML source (webpage, email, document), special characters were converted to HTML entities. These entities are **visible in HTML** but **break JavaScript**.

---

## Example 1: The Ampersand Bug

### ❌ BEFORE (BROKEN)

```javascript
// Line 35 in verifikasiRecaptcha()
const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET_KEY + "&amp;response=" + token;
```

**What the code looks like to a human reading HTML:**
- Might LOOK okay in a browser viewing HTML source

**What JavaScript actually sees:**
```javascript
const url = "...secret=KEY&amp;response=TOKEN"
//                         ^^^^^
//                    Literal text "&amp;" not "&"
```

**What gets sent to Google:**
```
https://www.google.com/recaptcha/api/siteverify?secret=6LdhLG...&amp;response=03AGdB...
                                                                 ^^^^^
                                                            Not a valid URL separator!
```

**Google API receives:**
```
{
  secret: "6LdhLG...",
  // ❌ NO 'response' parameter! Google doesn't understand "&amp;"
}
```

**Result:**
```json
{
  "success": false,
  "error-codes": ["missing-input-response"]
}
```

### ✅ AFTER (FIXED)

```javascript
// Line 35 in verifikasiRecaptcha()
const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET_KEY + "&response=" + token;
//                                                                                     ^
//                                                                          Single ampersand
```

**What JavaScript sees:**
```javascript
const url = "...secret=KEY&response=TOKEN"
//                         ^
//                    Proper URL separator
```

**What gets sent to Google:**
```
https://www.google.com/recaptcha/api/siteverify?secret=6LdhLG...&response=03AGdB...
                                                                 ^
                                                            Valid URL separator!
```

**Google API receives:**
```
{
  secret: "6LdhLG...",
  response: "03AGdB..."  // ✅ Both parameters received!
}
```

**Result:**
```json
{
  "success": true,
  "score": 0.9,
  "action": "donasi",
  "challenge_ts": "2024-02-09T...",
  "hostname": "lazismumuallimin.com"
}
```

---

## Example 2: The Comparison Operator Bug

### ❌ BEFORE (BROKEN)

```javascript
// Line 204 in readData()
if (lastRow &amp;lt;= 1) return [];
```

**What JavaScript sees:**
```javascript
if (lastRow &amp;lt;= 1) return [];
//          ^^^^^^^
//     This is NOT a valid operator!
```

**Error:**
```
SyntaxError: Unexpected token '&'
  at readData (Code.gs:204)
```

**Console:**
```
Uncaught SyntaxError: invalid or unexpected token
```

**Result:**
- Function crashes immediately
- Dashboard can't load data
- All read operations fail

### ✅ AFTER (FIXED)

```javascript
// Line 204 in readData()
if (lastRow <= 1) return [];
//          ^^
//    Valid JavaScript operator
```

**What JavaScript sees:**
```javascript
if (lastRow <= 1) return [];
//          ^^
//    "less than or equal to" operator
```

**Execution:**
```
✅ Syntax valid
✅ Comparison executes correctly
✅ Function returns data
✅ Dashboard loads successfully
```

---

## Example 3: The Arrow Function Bug

### ❌ BEFORE (BROKEN)

```javascript
// Line 209 in readData()
return values.map((row, index) =&gt; ({
```

**What JavaScript sees:**
```javascript
return values.map((row, index) =&gt; ({
//                                ^^^
//                        NOT arrow function syntax!
```

**Error:**
```
SyntaxError: Unexpected token '&'
  at readData (Code.gs:209)
```

**Result:**
- Syntax error prevents execution
- `.map()` never runs
- No data returned
- Dashboard shows empty

### ✅ AFTER (FIXED)

```javascript
// Line 209 in readData()
return values.map((row, index) => ({
//                                ^^
//                        Valid arrow function
```

**What JavaScript sees:**
```javascript
return values.map((row, index) => ({
//                                ^^
//                        Arrow function syntax
```

**Execution:**
```
✅ Syntax valid
✅ .map() executes correctly
✅ Data transformed properly
✅ Dashboard displays records
```

---

## Visual Comparison Table

| Character Needed | HTML Entity | JavaScript Result | Outcome |
|-----------------|-------------|-------------------|---------|
| `&` | `&amp;` | Literal text "&amp;" | ❌ URL breaks |
| `<` | `&lt;` | Literal text "&lt;" | ❌ Syntax error |
| `>` | `&gt;` | Literal text "&gt;" | ❌ Syntax error |
| `<=` | `&lt;=` | Text "&lt;=" | ❌ Syntax error |
| `>=` | `&gt;=` | Text "&gt;=" | ❌ Syntax error |
| `=>` | `=&gt;` | Text "=&gt;" | ❌ Syntax error |
| `&&` | `&amp;&amp;` | Text "&amp;&amp;" | ❌ Syntax error |

---

## The Copy-Paste Problem

### How HTML Entities Got Into JavaScript:

```
┌─────────────────────────────────────────────────────────┐
│  ORIGINAL SOURCE (HTML Document or Web Page)            │
│  ┌────────────────────────────────────────────────┐    │
│  │ <script>                                        │    │
│  │   const url = "...?secret=KEY&amp;response=" + │    │  
│  │                              ^^^^^              │    │
│  │                         HTML entity for &       │    │
│  │ </script>                                       │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  When viewed in browser, LOOKS like:                    │
│  const url = "...?secret=KEY&response="                 │
│                             ^                           │
│                    (Browser renders &amp; as &)         │
└─────────────────────────────────────────────────────────┘
                           │
                           │ User copies code
                           │ (from "View Source" or HTML email)
                           ↓
┌─────────────────────────────────────────────────────────┐
│  PASTED INTO APPS SCRIPT EDITOR                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ function verifikasiRecaptcha(token) {           │    │
│  │   const url = "...?secret=KEY&amp;response="   │    │
│  │                              ^^^^^              │    │
│  │                         ❌ HTML ENTITY          │    │
│  │                         (Not converted!)        │    │
│  │ }                                               │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  JavaScript sees LITERAL text "&amp;"                   │
│  NOT the character "&"                                  │
│  → CODE BREAKS ❌                                       │
└─────────────────────────────────────────────────────────┘
```

### The Fix:

```
┌─────────────────────────────────────────────────────────┐
│  CORRECTED SOURCE (Plain JavaScript File)               │
│  ┌────────────────────────────────────────────────┐    │
│  │ function verifikasiRecaptcha(token) {           │    │
│  │   const url = "...?secret=KEY&response=" + ...  │    │
│  │                              ^                  │    │
│  │                         ✅ PLAIN &              │    │
│  │ }                                               │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Copied from:                                           │
│  - Plain .gs/.js file                                   │
│  - Code editor (VS Code, Notepad++)                     │
│  - GitHub raw file                                      │
│  - This PR's code.gs file ✅                            │
│                                                          │
│  → CODE WORKS ✅                                        │
└─────────────────────────────────────────────────────────┘
```

---

## Impact Chain

### ❌ Before Fix (Broken Chain)

```
User submits form
    ↓
Frontend generates reCAPTCHA token ✅
    ↓
Token sent to Google Apps Script ✅
    ↓
verifikasiRecaptcha(token) called ✅
    ↓
URL constructed with "&amp;" ❌  ← BUG #1
    ↓
Google API receives malformed URL ❌
    ↓
Google API responds: "missing-input-response" ❌
    ↓
Verification fails ❌
    ↓
Error thrown: "Bot detected" ❌
    ↓
Data NOT saved ❌
    ↓
User sees error message ❌
```

### ✅ After Fix (Working Chain)

```
User submits form
    ↓
Frontend generates reCAPTCHA token ✅
    ↓
Token sent to Google Apps Script ✅
    ↓
verifikasiRecaptcha(token) called ✅
    ↓
URL constructed with "&" ✅  ← FIXED!
    ↓
Google API receives correct URL ✅
    ↓
Google API verifies token ✅
    ↓
Google API responds: {success: true, score: 0.9} ✅
    ↓
Verification passes ✅
    ↓
Token removed from payload ✅
    ↓
Data saved to Google Sheet ✅
    ↓
User sees success message ✅
```

---

## Summary

### The Root Cause:
**HTML entities in JavaScript code**

### The Symptoms:
- ❌ reCAPTCHA always fails
- ❌ Data never saves
- ❌ Users always see "Bot detected"
- ❌ Dashboard can't load data

### The Fix:
**Replace HTML entities with actual characters**
- `&amp;` → `&`
- `&lt;` → `<`
- `&gt;` → `>`
- `&amp;lt;=` → `<=`
- `&amp;gt;=` → `>=`
- `=&gt;` → `=>`

### The Files:
- ✅ `code.gs` - Fixed version with no HTML entities
- 📖 Documentation explains everything

### How to Prevent:
- ✅ Copy code from `.gs` files, not HTML sources
- ✅ Use code editors (VS Code, Notepad++)
- ✅ Get code from GitHub raw files
- ✅ Always check for `&amp;`, `&lt;`, `&gt;` before deploying
