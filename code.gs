/**
 * =====================================================================
 * LAZISMU MU'ALLIMIN - GOOGLE APPS SCRIPT BACKEND
 * =====================================================================
 * 
 * Script ini mengelola data donasi dan kuitansi untuk website Lazismu Mu'allimin
 * Fitur:
 * - CRUD operations untuk data donasi
 * - Google reCAPTCHA v3 verification untuk mencegah bot
 * - Penyimpanan data kuitansi
 * - Verifikasi status donasi
 * 
 * @version 2.0
 * @date 2026-02-12
 */

// =====================================================================
// KONFIGURASI
// =====================================================================

/**
 * ID Google Spreadsheet untuk menyimpan data
 * Format: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
 */
const SPREADSHEET_ID = "1EhFeSGfar1mqzEQo5CgncmDr8nflFqcSyAaXAFmWFqE";

/**
 * Nama tab/sheet di dalam spreadsheet
 */
const SHEET_NAME = "DataDonasi";           // Tab untuk data donasi web
const SHEET_KUITANSI = "DataKuitansi";     // Tab untuk data kuitansi

/**
 * Google reCAPTCHA v3 Secret Key
 * Dapatkan dari: https://www.google.com/recaptcha/admin
 * PENTING: Jangan share secret key ini ke publik!
 */
const RECAPTCHA_SECRET_KEY = "6LdhLGIsAAAAABVKoyyNjpCjIt8z_eF54m1NyUQm";

/**
 * Threshold score untuk reCAPTCHA (0.0 - 1.0)
 * 0.0 = kemungkinan bot, 1.0 = kemungkinan manusia
 * Recommended: 0.5
 */
const RECAPTCHA_THRESHOLD = 0.5;

// =====================================================================
// FUNGSI UTAMA - ENTRY POINTS
// =====================================================================

/**
 * Handler untuk HTTP GET request
 * Digunakan untuk membaca data donasi
 * 
 * @param {Object} e - Event parameter dari Google Apps Script
 * @return {TextOutput} JSON response dengan data atau error
 */
function doGet(e) {
  try {
    const data = readData();
    return response({ status: "success", data: data });
  } catch (error) {
    Logger.log("Error in doGet: " + error.message);
    return response({ status: "error", message: error.message });
  }
}

/**
 * Handler untuk HTTP POST request
 * Menangani berbagai action: create, verify, update, delete, kuitansi
 * 
 * @param {Object} e - Event parameter dari Google Apps Script
 * @return {TextOutput} JSON response dengan result atau error
 */
function doPost(e) {
  // Lock untuk mencegah race condition saat multiple requests bersamaan
  const lock = LockService.getScriptLock();
  
  try {
    // Tunggu maksimal 10 detik untuk mendapatkan lock
    lock.tryLock(10000);
    
    // Parse request data
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    // Validasi action
    if (!action) {
      throw new Error("Invalid request: 'action' is missing.");
    }
    
    let result;
    
    // Route ke handler yang sesuai berdasarkan action
    switch (action) {
      case "create":
        result = handleCreateDonation(requestData);
        break;
        
      case "kuitansi":
        result = simpanKuitansi(requestData);
        break;
        
      case "verify":
        if (!requestData.row) {
          throw new Error("Row number is missing for verify action.");
        }
        result = verifyData(requestData.row);
        break;
        
      case "update":
        if (!requestData.row || !requestData.payload) {
          throw new Error("Row number and payload are required for update action.");
        }
        result = updateData(requestData.row, requestData.payload);
        break;
        
      case "delete":
        if (!requestData.row) {
          throw new Error("Row number is missing for delete action.");
        }
        result = deleteData(requestData.row);
        break;
        
      case "sendReceipt":
        result = { message: "Kuitansi berhasil digenerate di klien." };
        break;
        
      default:
        throw new Error(`Invalid action: ${action}`);
    }
    
    return response({ status: "success", data: result });
    
  } catch (error) {
    Logger.log("Error in doPost: " + error.message);
    return response({ status: "error", message: error.message });
  } finally {
    // Selalu release lock
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

// =====================================================================
// RECAPTCHA VERIFICATION
// =====================================================================

/**
 * Verifikasi reCAPTCHA token dengan Google API
 * 
 * @param {string} token - reCAPTCHA token dari client
 * @return {boolean} true jika valid dan bukan bot, false jika bot atau invalid
 */
function verifikasiRecaptcha(token) {
  try {
    // Build verification URL
    const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + RECAPTCHA_SECRET_KEY + "&response=" + token;
    
    // Call Google reCAPTCHA API
    const httpResponse = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const json = JSON.parse(httpResponse.getContentText());
    
    // Log untuk debugging (bisa dinonaktifkan di production)
    Logger.log("reCAPTCHA response: " + JSON.stringify(json));
    
    // Valid jika success = true DAN score >= threshold
    return json.success && json.score >= RECAPTCHA_THRESHOLD;
  } catch (error) {
    Logger.log("reCAPTCHA verification error: " + error.message);
    return false;
  }
}

/**
 * Handler khusus untuk create donation dengan reCAPTCHA verification
 * 
 * @param {Object} requestData - Request data dengan payload dan recaptchaToken
 * @return {Object} Result dari createData
 */
function handleCreateDonation(requestData) {
  // 1. Validasi payload exists
  if (!requestData.payload) {
    throw new Error("Payload is missing for create action.");
  }
  
  // 2. Ambil reCAPTCHA token
  const token = requestData.payload.recaptchaToken;
  
  // 3. Validasi token exists
  if (!token) {
    throw new Error("Verifikasi keamanan (reCAPTCHA) gagal: Token tidak ditemukan.");
  }
  
  // 4. Verifikasi dengan Google reCAPTCHA API
  const isHuman = verifikasiRecaptcha(token);
  
  if (!isHuman) {
    throw new Error("Sistem mendeteksi aktivitas mencurigakan (Bot). Donasi ditolak.");
  }
  
  // 5. Hapus token dari payload agar tidak tersimpan ke spreadsheet
  delete requestData.payload.recaptchaToken;
  
  // 6. Simpan data donasi
  return createData(requestData.payload);
}

// =====================================================================
// KUITANSI FUNCTIONS
// =====================================================================

/**
 * Simpan data kuitansi ke sheet terpisah
 * 
 * @param {Object} data - Data kuitansi yang akan disimpan
 * @return {Object} Result message
 */
function simpanKuitansi(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_KUITANSI);
    
    // Validasi sheet exists
    if (!sheet) {
      throw new Error(`Tab "${SHEET_KUITANSI}" tidak ditemukan! Harap buat tab baru di spreadsheet.`);
    }
    
    // Cari baris kosong berikutnya
    const nextRow = sheet.getLastRow() + 1;
    
    // Susun data sesuai struktur kolom A-L
    const newRow = [
      new Date(),        // A: Waktu Input
      data.no_inv,       // B: No Invoice
      data.tgl_kwt,      // C: Tanggal di Kuitansi
      data.nama,         // D: Nama Donatur
      data.penyetor,     // E: Nama Penyetor
      data.alamat,       // F: Alamat
      data.hp,           // G: No HP
      data.zakat,        // H: Zakat
      data.infaq,        // I: Infaq
      data.lain,         // J: Lainnya
      data.total,        // K: Total
      data.amil          // L: Amil (Penerima)
    ];
    
    // Tulis ke spreadsheet
    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
    
    Logger.log(`Kuitansi saved: Invoice ${data.no_inv}, Row ${nextRow}`);
    return { message: "Data Kuitansi berhasil disimpan." };
    
  } catch (error) {
    Logger.log("Error in simpanKuitansi: " + error.message);
    throw error;
  }
}

// =====================================================================
// DONATION CRUD OPERATIONS
// =====================================================================

/**
 * Helper function untuk mendapatkan sheet donasi
 * 
 * @return {Sheet} Google Spreadsheet Sheet object
 */
function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    throw new Error(`Sheet "${SHEET_NAME}" tidak ditemukan di spreadsheet.`);
  }
  
  return sheet;
}

/**
 * CREATE - Simpan data donasi baru
 * 
 * @param {Object} payload - Data donasi yang akan disimpan
 * @return {Object} Result message
 */
function createData(payload) {
  try {
    const sheet = getSheet();
    const timestamp = new Date();
    
    // Susun data sesuai struktur kolom A-P
    const rowData = [
      timestamp,                  // A: Timestamp
      payload.type,               // B: Jenis Donasi
      payload.nominal,            // C: Nominal
      payload.metode,             // D: Metode Pembayaran
      payload.nama,               // E: Nama Donatur
      payload.donaturTipe,        // F: Tipe Donatur
      payload.DetailAlumni || "", // G: Detail Alumni
      payload.namaSantri || "",   // H: Nama Santri
      payload.nisSantri || "",    // I: NIS Santri
      payload.rombelSantri || "", // J: Rombel/Kelas Santri
      payload.hp,                 // K: No HP
      payload.alamat,             // L: Alamat
      payload.email || "",        // M: Email
      payload.NoKTP || "",        // N: No KTP
      payload.doa || "",          // O: Pesan Doa
      "Belum Verifikasi"          // P: Status
    ];
    
    // Append row ke sheet
    sheet.appendRow(rowData);
    
    Logger.log(`Donation created: ${payload.nama}, ${payload.type}, Rp ${payload.nominal}`);
    return { message: "Data berhasil disimpan." };
    
  } catch (error) {
    Logger.log("Error in createData: " + error.message);
    throw error;
  }
}

/**
 * READ - Baca semua data donasi
 * 
 * @return {Array} Array of donation objects
 */
function readData() {
  try {
    const sheet = getSheet();
    const lastRow = sheet.getLastRow();
    
    // Jika hanya ada header atau kosong, return empty array
    if (lastRow <= 1) {
      return [];
    }
    
    // Baca semua data (skip header di row 1)
    const range = sheet.getRange(2, 1, lastRow - 1, 16);
    const values = range.getValues();
    
    // Transform ke format object
    return values.map((row, index) => ({
      row: index + 2,              // Row number di spreadsheet
      Timestamp: row[0],
      JenisDonasi: row[1],
      Nominal: row[2],
      MetodePembayaran: row[3],
      NamaDonatur: row[4],
      TipeDonatur: row[5],
      DetailAlumni: row[6],
      NamaSantri: row[7],
      NISSantri: row[8],
      KelasSantri: row[9],
      NoHP: row[10],
      Alamat: row[11],
      Email: row[12],
      NoKTP: row[13],
      PesanDoa: row[14],
      Status: row[15]
    }));
    
  } catch (error) {
    Logger.log("Error in readData: " + error.message);
    throw error;
  }
}

/**
 * VERIFY - Update status donasi menjadi terverifikasi
 * 
 * @param {number} rowNumber - Nomor baris di spreadsheet
 * @return {Object} Result message
 */
function verifyData(rowNumber) {
  try {
    const sheet = getSheet();
    
    // Update kolom P (16) dengan status "Terverifikasi"
    sheet.getRange(rowNumber, 16).setValue("Terverifikasi");
    
    Logger.log(`Donation verified: Row ${rowNumber}`);
    return { message: "Data berhasil diverifikasi." };
    
  } catch (error) {
    Logger.log("Error in verifyData: " + error.message);
    throw error;
  }
}

/**
 * UPDATE - Update data donasi yang sudah ada
 * 
 * @param {number} rowNumber - Nomor baris di spreadsheet
 * @param {Object} p - Payload data yang akan diupdate
 * @return {Object} Result message
 */
function updateData(rowNumber, p) {
  try {
    const sheet = getSheet();
    
    // Susun data update (kolom B-O, skip timestamp dan status)
    const values = [[
      p.JenisDonasi,
      p.Nominal,
      p.MetodePembayaran,
      p.NamaDonatur,
      p.TipeDonatur,
      p.DetailAlumni,
      p.NamaSantri,
      p.NISSantri,
      p.KelasSantri,
      p.NoHP,
      p.Alamat,
      p.Email,
      p.NoKTP,
      p.PesanDoa
    ]];
    
    // Update kolom B-O (2-15) di row yang ditentukan
    sheet.getRange(rowNumber, 2, 1, 14).setValues(values);
    
    Logger.log(`Donation updated: Row ${rowNumber}`);
    return { message: "Data berhasil diperbarui." };
    
  } catch (error) {
    Logger.log("Error in updateData: " + error.message);
    throw error;
  }
}

/**
 * DELETE - Hapus data donasi
 * 
 * @param {number} rowNumber - Nomor baris di spreadsheet
 * @return {Object} Result message
 */
function deleteData(rowNumber) {
  try {
    const sheet = getSheet();
    
    // Hapus baris
    sheet.deleteRow(rowNumber);
    
    Logger.log(`Donation deleted: Row ${rowNumber}`);
    return { message: "Data berhasil dihapus." };
    
  } catch (error) {
    Logger.log("Error in deleteData: " + error.message);
    throw error;
  }
}

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

/**
 * Create JSON response untuk HTTP output
 * 
 * @param {Object} data - Data yang akan di-return sebagai JSON
 * @return {TextOutput} JSON formatted text output
 */
function response(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
