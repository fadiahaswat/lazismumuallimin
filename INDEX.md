# 📚 Documentation Index - Lazismu Mu'allimin

This directory contains comprehensive documentation for the Lazismu Mu'allimin website project.

## 📜 Official Documents

### Zakat & Fidyah Regulations

| File | Description | Language |
|------|-------------|----------|
| **[SK_LAZISMU_DIY_2026.md](SK_LAZISMU_DIY_2026.md)** | **COMPLETE SK Documentation** - Surat Keputusan Badan Pengurus Lazismu Wilayah D.I. Yogyakarta No. 005.BP/KEP/II.19/B/2026 tentang Penetapan Besaran Zakat Fitri, Nishab Zakat Maal, dan Fidyah tahun 1447 H/2026 M | Indonesian |

**Contains:**
- ✅ Complete SK information (No. 005.BP/KEP/II.19/B/2026)
- ✅ Zakat Fitri: Rp 35.000 - Rp 40.000/jiwa
- ✅ Zakat Maal Nisab: Rp 171.912.500 (85 gram emas @ Rp 2.022.500)
- ✅ Fidyah: Rp 8.400 - Rp 50.000/hari (2 options)
- ✅ Calculation examples and FAQ
- ✅ Implementation in the application

---

## 🚀 Quick Start (5 Minutes)

**New to this issue?** Start here:

1. **Read:** [QUICK_REFERENCE.md](QUICK_REFERENCE.md) (2 min)
2. **Deploy:** Copy [code.gs](code.gs) to Google Apps Script (2 min)
3. **Test:** Submit a test donation (1 min)

## 📖 Complete Documentation

### 🔧 Fix Files

| File | Description | When to Use |
|------|-------------|-------------|
| [code.gs](code.gs) | **THE FIX** - Corrected Google Apps Script code | Copy this to your Apps Script Editor |

### 📘 Setup Guides

| File | Language | Audience | Size |
|------|----------|----------|------|
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | English | Everyone | 3.7 KB |
| [RECAPTCHA_FIX.md](RECAPTCHA_FIX.md) | Indonesian | Indonesian users | 5.5 KB |

### 🔍 Understanding the Bug

| File | Language | Content | Best For |
|------|----------|---------|----------|
| [BUG_VISUALIZATION.md](BUG_VISUALIZATION.md) | English | Visual explanations with diagrams | Understanding what went wrong |
| [KODE_PERBANDINGAN.md](KODE_PERBANDINGAN.md) | Indonesian | Side-by-side code comparison | Seeing exact changes |
| [DATA_FLOW.md](DATA_FLOW.md) | English | Complete architecture & data flow | Technical deep dive |

### 🧪 Testing

| File | Content | When to Use |
|------|---------|-------------|
| [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) | Comprehensive testing guide | Before and after deployment |

### 📝 General Information

| File | Content |
|------|---------|
| [README.md](README.md) | Main project documentation (updated) |

---

## 🎯 Which Document Should I Read?

### "I just want to fix this quickly"
→ [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

### "I want detailed setup instructions in Indonesian"
→ [RECAPTCHA_FIX.md](RECAPTCHA_FIX.md)

### "I want to understand what the bug was"
→ [BUG_VISUALIZATION.md](BUG_VISUALIZATION.md)

### "I want to see the exact code changes"
→ [KODE_PERBANDINGAN.md](KODE_PERBANDINGAN.md) (Indonesian)

### "I want to understand the complete system"
→ [DATA_FLOW.md](DATA_FLOW.md)

### "I want to test thoroughly before deploying"
→ [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)

---

## 🐛 What Was The Bug?

HTML entities (`&amp;`, `&lt;`, `&gt;`) in JavaScript code caused:
- ❌ reCAPTCHA verification to always fail
- ❌ All donations rejected as "bot activity"
- ❌ No data saved to Google Sheets
- ❌ Dashboard unable to read data

**Root cause:** Code was copied from HTML source, which uses HTML entities. These entities are NOT valid in JavaScript.

---

## ✅ What Is The Fix?

Replace HTML entities with actual characters in `code.gs`:

| Line | Wrong | Correct |
|------|-------|---------|
| 35   | `&amp;response=` | `&response=` |
| 204  | `&amp;lt;= 1` | `<= 1` |
| 209  | `=&gt;` | `=>` |

**The fixed file:** [code.gs](code.gs) ✅

---

## 📋 Deployment Checklist

- [ ] Copy [code.gs](code.gs) to Google Apps Script Editor
- [ ] Update `SECRET_KEY` with your reCAPTCHA secret key
- [ ] Deploy as Web App (Execute as: Me, Who has access: Anyone)
- [ ] Copy deployment URL
- [ ] Update `GAS_API_URL` in `config.js` (if URL changed)
- [ ] Test with a donation submission
- [ ] Verify data in Google Sheets
- [ ] Run full test suite (see [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md))

---

## 🔑 Required Configuration

### Backend (code.gs)
```javascript
const SPREADSHEET_ID = "1EhFeSGfar1mqzEQo5CgncmDr8nflFqcSyAaXAFmWFqE";
const SECRET_KEY = "YOUR_RECAPTCHA_SECRET_KEY"; // ⚠️ Update this!
```

### Frontend (config.js)
```javascript
export const GAS_API_URL = "https://script.google.com/macros/s/.../exec";
export const RECAPTCHA_SITE_KEY = "6LdhLGIsAAAAAOFfE86013kZqCZvZwVTTBPZTdp6";
```

---

## 📊 File Sizes Reference

| File | Size | Reading Time |
|------|------|--------------|
| code.gs | 8.3 KB | - (code file) |
| QUICK_REFERENCE.md | 3.7 KB | ~5 min |
| RECAPTCHA_FIX.md | 5.5 KB | ~10 min |
| KODE_PERBANDINGAN.md | 6.6 KB | ~10 min |
| TESTING_CHECKLIST.md | 9.7 KB | ~15 min |
| BUG_VISUALIZATION.md | 12 KB | ~15 min |
| DATA_FLOW.md | 18 KB | ~20 min |

**Total documentation:** ~56 KB (~75 min reading time for everything)

---

## 🆘 Still Having Issues?

1. **Check configuration:**
   - SPREADSHEET_ID correct?
   - SECRET_KEY updated?
   - Deployment settings correct?

2. **Review documentation:**
   - [RECAPTCHA_FIX.md](RECAPTCHA_FIX.md) - Troubleshooting section
   - [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) - Common issues

3. **Verify the fix:**
   - Run: `grep "&amp;\|&lt;\|&gt;" code.gs`
   - Should return: nothing (no HTML entities)

4. **Check logs:**
   - Browser Console (F12) for frontend errors
   - Apps Script Editor → View → Logs for backend errors

---

## 📞 Support Resources

| Resource | Link |
|----------|------|
| Google Apps Script | https://script.google.com/ |
| reCAPTCHA Admin | https://www.google.com/recaptcha/admin |
| reCAPTCHA Docs | https://developers.google.com/recaptcha/docs/v3 |

---

## 🎓 Learning Path

**Beginner:**
1. QUICK_REFERENCE.md
2. Deploy code.gs
3. Test

**Intermediate:**
1. RECAPTCHA_FIX.md
2. KODE_PERBANDINGAN.md
3. TESTING_CHECKLIST.md

**Advanced:**
1. BUG_VISUALIZATION.md
2. DATA_FLOW.md
3. Full testing suite

---

## ✨ Success Criteria

After deploying the fix:

- ✅ Users can submit donations
- ✅ No "Bot detected" errors (for humans)
- ✅ Data saves to Google Sheets
- ✅ Dashboard displays data
- ✅ Actual bots are blocked

---

## 🔐 Security Notes

- ⚠️ **Never** commit `SECRET_KEY` to public repository
- ✅ Site Key is public (used in browser)
- ✅ Secret Key is private (stays in Apps Script)
- ✅ Adjust score threshold as needed (default: 0.5)

---

**Last Updated:** February 9, 2024

**Version:** 1.0.0

**Status:** ✅ Complete and tested
