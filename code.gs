// ========================================
// GOOGLE APPS SCRIPT - LAZISMU MU'ALLIMIN
// Backend untuk Sistem Donasi
// ========================================

// KONFIGURASI
const SPREADSHEET_ID = "1EhFeSGfar1mqzEQo5CgncmDr8nflFqcSyAaXAFmWFqE";
const SHEET_NAME = "DataDonasi";
const SHEET_KUITANSI = "DataKuitansi";
const SECRET_KEY = "6LdhLGIsAAAAABVKoyyNjpCjIt8z_eF54m1NyUQm"; // ⚠️ JANGAN COMMIT KE PUBLIC REPO!

// KONFIGURASI THRESHOLD RECAPTCHA
// ===============================
// PENTING: Threshold menentukan seberapa ketat bot detection
// 
// Panduan:
// - 0.7-0.9: Sangat ketat (banyak false positive)
// - 0.5: Default (beberapa user manual ditolak) ← MASALAH ADA DI SINI!
// - 0.3: Seimbang (recommended untuk donasi) ← SOLUSI!
// - 0.1: Longgar (bot bisa lolos)
//
// REKOMENDASI: Gunakan 0.3 untuk menghindari false positive pada input manual
const RECAPTCHA_THRESHOLD = 0.3; // ← UBAH DARI 0.5 KE 0.3

// ========================================
// FUNGSI UTAMA
// ========================================

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    
    if (requestData.action === "create") {
      return handleCreate(requestData.payload);
    } else if (requestData.action === "read") {
      return handleRead();
    } else if (requestData.action === "getKuitansi") {
      return handleGetKuitansi(requestData.id);
    }
    
    return response({ status: "error", message: "Invalid action" });
  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    return response({ status: "error", message: error.toString() });
  }
}

function doGet(e) {
  return response({ 
    status: "error", 
    message: "GET method not allowed. Use POST." 
  });
}

// ========================================
// HANDLER FUNCTIONS
// ========================================

function handleCreate(payload) {
  try {
    // 1. Verifikasi reCAPTCHA
    const token = payload.recaptchaToken;
    
    if (!token) {
      throw new Error("reCAPTCHA token tidak ditemukan");
    }
    
    const recaptchaResult = verifikasiRecaptcha(token);
    
    if (!recaptchaResult.isValid) {
      Logger.log("reCAPTCHA verification failed - Score: " + recaptchaResult.score);
      throw new Error("Verifikasi keamanan gagal. Score: " + recaptchaResult.score + " (threshold: " + RECAPTCHA_THRESHOLD + ")");
    }
    
    Logger.log("reCAPTCHA verification passed - Score: " + recaptchaResult.score);
    
    // 2. Hapus token dari payload (jangan simpan di sheet)
    delete payload.recaptchaToken;
    
    // 3. Simpan data
    const result = createData(payload);
    
    return response({ 
      status: "success", 
      message: "Data berhasil disimpan",
      data: result,
      recaptchaScore: recaptchaResult.score // Info untuk debugging
    });
    
  } catch (error) {
    Logger.log("Error in handleCreate: " + error.toString());
    return response({ 
      status: "error", 
      message: error.toString() 
    });
  }
}

function handleRead() {
  try {
    const data = readData();
    return response({ 
      status: "success", 
      data: data 
    });
  } catch (error) {
    Logger.log("Error in handleRead: " + error.toString());
    return response({ 
      status: "error", 
      message: error.toString() 
    });
  }
}

function handleGetKuitansi(id) {
  try {
    const data = getKuitansiData(id);
    return response({ 
      status: "success", 
      data: data 
    });
  } catch (error) {
    Logger.log("Error in handleGetKuitansi: " + error.toString());
    return response({ 
      status: "error", 
      message: error.toString() 
    });
  }
}

// ========================================
// RECAPTCHA VERIFICATION
// ========================================

function verifikasiRecaptcha(token) {
  try {
    // ✅ FIXED: Menggunakan & (bukan &amp;) untuk URL parameter separator
    const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET_KEY + "&response=" + token;
    
    const response = UrlFetchApp.fetch(url);
    const json = JSON.parse(response.getContentText());
    
    // Log untuk monitoring dan debugging
    Logger.log("========== reCAPTCHA Verification ==========");
    Logger.log("Success: " + json.success);
    Logger.log("Score: " + json.score);
    Logger.log("Action: " + json.action);
    Logger.log("Hostname: " + json.hostname);
    Logger.log("Challenge Timestamp: " + json.challenge_ts);
    Logger.log("Threshold: " + RECAPTCHA_THRESHOLD);
    
    // ✅ FIXED: Menggunakan >= (bukan &gt;=) dan threshold yang lebih rendah
    const isValid = json.success && json.score >= RECAPTCHA_THRESHOLD;
    
    Logger.log("Is Valid: " + isValid);
    
    if (!isValid && json.success) {
      Logger.log("WARNING: reCAPTCHA token valid but score too low!");
      Logger.log("Score: " + json.score + " < Threshold: " + RECAPTCHA_THRESHOLD);
      Logger.log("Tip: Pertimbangkan menurunkan RECAPTCHA_THRESHOLD jika banyak user legitimate ditolak");
    }
    
    Logger.log("==========================================");
    
    return {
      isValid: isValid,
      score: json.score,
      success: json.success,
      action: json.action
    };
    
  } catch (error) {
    Logger.log("Error in verifikasiRecaptcha: " + error.toString());
    return {
      isValid: false,
      score: 0,
      success: false,
      error: error.toString()
    };
  }
}

// ========================================
// DATABASE OPERATIONS
// ========================================

function createData(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    throw new Error("Sheet '" + SHEET_NAME + "' tidak ditemukan");
  }
  
  const timestamp = new Date();
  const id = "DN-" + Utilities.formatDate(timestamp, "Asia/Jakarta", "yyyyMMddHHmmss");
  
  // Append data ke sheet
  sheet.appendRow([
    id,
    timestamp,
    data.jenisDonasi || "",
    data.nominal || "",
    data.nama || "",
    data.email || "",
    data.telepon || "",
    data.alamat || "",
    data.metodePembayaran || "",
    data.rekening || "",
    data.catatan || "",
    "Pending" // Status
  ]);
  
  // Simpan juga ke sheet kuitansi
  const sheetKuitansi = ss.getSheetByName(SHEET_KUITANSI);
  if (sheetKuitansi) {
    sheetKuitansi.appendRow([
      id,
      timestamp,
      data.jenisDonasi || "",
      data.nominal || "",
      data.nama || "",
      data.email || "",
      data.telepon || "",
      data.alamat || "",
      data.metodePembayaran || "",
      data.rekening || "",
      data.catatan || ""
    ]);
  }
  
  return { id: id, timestamp: timestamp };
}

function readData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    throw new Error("Sheet '" + SHEET_NAME + "' tidak ditemukan");
  }
  
  const lastRow = sheet.getLastRow();
  
  // ✅ FIXED: Menggunakan <= (bukan &lt;=)
  if (lastRow <= 1) return []; // Hanya header, tidak ada data
  
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  
  // ✅ FIXED: Menggunakan => (bukan =&gt;) untuk arrow function
  return values.map((row, index) => ({
    id: row[0] || "",
    timestamp: row[1] || "",
    jenisDonasi: row[2] || "",
    nominal: row[3] || "",
    nama: row[4] || "",
    email: row[5] || "",
    telepon: row[6] || "",
    alamat: row[7] || "",
    metodePembayaran: row[8] || "",
    rekening: row[9] || "",
    catatan: row[10] || "",
    status: row[11] || "Pending"
  }));
}

function getKuitansiData(id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_KUITANSI);
  
  if (!sheet) {
    throw new Error("Sheet '" + SHEET_KUITANSI + "' tidak ditemukan");
  }
  
  const values = sheet.getDataRange().getValues();
  
  // Cari data berdasarkan ID
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      return {
        id: values[i][0],
        timestamp: values[i][1],
        jenisDonasi: values[i][2],
        nominal: values[i][3],
        nama: values[i][4],
        email: values[i][5],
        telepon: values[i][6],
        alamat: values[i][7],
        metodePembayaran: values[i][8],
        rekening: values[i][9],
        catatan: values[i][10]
      };
    }
  }
  
  throw new Error("Data kuitansi dengan ID '" + id + "' tidak ditemukan");
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function response(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// TESTING FUNCTIONS (Untuk Development)
// ========================================

function testRecaptcha() {
  // Test dengan token dummy
  const result = verifikasiRecaptcha("dummy-token-for-testing");
  Logger.log("Test Result: " + JSON.stringify(result));
}

function getCurrentThreshold() {
  Logger.log("Current reCAPTCHA Threshold: " + RECAPTCHA_THRESHOLD);
  Logger.log("Recommended for manual donations: 0.3");
  Logger.log("Current setting: " + (RECAPTCHA_THRESHOLD === 0.3 ? "✅ OPTIMAL" : "⚠️ PERLU PENYESUAIAN"));
}
