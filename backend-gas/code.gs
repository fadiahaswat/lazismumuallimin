/**
 * =====================================================================
 * LAZISMU MU'ALLIMIN - GOOGLE APPS SCRIPT BACKEND
 * =====================================================================
 * Script ini mengelola data donasi dan kuitansi untuk website Lazismu Mu'allimin
 * Fitur:
 * - CRUD operations untuk data donasi berbasis UUID (Anti Bentrok)
 * - Google reCAPTCHA v3 verification (Dengan fitur Bypass untuk Testing)
 * - Penyimpanan data kuitansi
 * - Verifikasi status donasi
 * 
 * @version 2.1 (Revised)
 */

// =====================================================================
// KONFIGURASI
// =====================================================================

const SPREADSHEET_ID = "1EhFeSGfar1mqzEQo5CgncmDr8nflFqcSyAaXAFmWFqE";
const SHEET_NAME = "DataDonasi";           
const SHEET_KUITANSI = "DataKuitansi";     
const RECAPTCHA_SECRET_KEY = "6LdhLGIsAAAAABVKoyyNjpCjIt8z_eF54m1NyUQm";
const RECAPTCHA_THRESHOLD = 0.2;

// SAKLAR PENGATURAN (TRUE = Bypass Captcha Aktif, FALSE = Wajib Captcha)
// Ganti menjadi FALSE saat website sudah rilis untuk publik!
const BYPASS_RECAPTCHA = true; 

// =====================================================================
// FUNGSI UTAMA - ENTRY POINTS
// =====================================================================

function doGet(e) {
  try {
    const data = readData();
    return response({ status: "success", data: data });
  } catch (error) {
    return response({ status: "error", message: error.message });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  
  try {
    lock.tryLock(10000);
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    if (!action) throw new Error("Invalid request: 'action' is missing.");
    
    let result;
    
    switch (action) {
      case "create":
        result = handleCreateDonation(requestData);
        break;
        
      case "kuitansi":
        result = simpanKuitansi(requestData);
        break;
        
      case "verify":
        if (!requestData.id) throw new Error("ID Transaksi is missing for verify action.");
        result = verifyData(requestData.id);
        break;
        
      case "update":
        if (!requestData.id || !requestData.payload) throw new Error("ID Transaksi and payload are required for update action.");
        result = updateData(requestData.id, requestData.payload);
        break;
        
      case "delete":
        if (!requestData.id) throw new Error("ID Transaksi is missing for delete action.");
        result = deleteData(requestData.id);
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
    if (lock.hasLock()) lock.releaseLock();
  }
}

// =====================================================================
// RECAPTCHA VERIFICATION
// =====================================================================

function verifikasiRecaptcha(token) {
  try {
    const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + RECAPTCHA_SECRET_KEY + "&response=" + token;
    const httpResponse = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const json = JSON.parse(httpResponse.getContentText());
    return json.success && json.score >= RECAPTCHA_THRESHOLD;
  } catch (error) {
    return false;
  }
}

function handleCreateDonation(requestData) {
  if (!requestData.payload) throw new Error("Payload is missing for create action.");
  
  const token = requestData.payload.recaptchaToken;
  let isHuman = false;

  // FITUR BYPASS RECAPTCHA
  if (BYPASS_RECAPTCHA) {
    isHuman = true; 
    Logger.log("Peringatan: Verifikasi reCAPTCHA di-bypass (Testing Mode).");
  } else {
    if (!token) throw new Error("Verifikasi keamanan gagal: Token reCAPTCHA tidak ditemukan.");
    isHuman = verifikasiRecaptcha(token);
  }
  
  if (!isHuman) {
    throw new Error("Sistem mendeteksi aktivitas mencurigakan (Bot). Donasi ditolak.");
  }
  
  delete requestData.payload.recaptchaToken;
  return createData(requestData.payload);
}

// =====================================================================
// DONATION CRUD OPERATIONS (UUID BASED)
// =====================================================================

function getSheet() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" tidak ditemukan.`);
  return sheet;
}

// HELPER: Cari nomor baris berdasarkan ID Transaksi (Anti-Bentrok)
function findRowById(sheet, idTransaksi) {
  const data = sheet.getRange("A:A").getValues(); // Baca Kolom A (ID Transaksi)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === idTransaksi) {
      return i + 1; // Return nomor baris sebenarnya
    }
  }
  throw new Error(`Data dengan ID Transaksi ${idTransaksi} tidak ditemukan.`);
}

function createData(payload) {
  const sheet = getSheet();
  const timestamp = new Date();
  const idTransaksi = Utilities.getUuid(); // Generate ID Unik
  
  // Susun data sesuai struktur kolom A-Q (A adalah ID Transaksi)
  const rowData = [
    idTransaksi,                // A: ID Transaksi (UUID)
    timestamp,                  // B: Timestamp
    payload.type || "",         // C: Jenis Donasi
    payload.nominal || 0,       // D: Nominal
    payload.metode || "",       // E: Metode Pembayaran
    payload.nama || "",         // F: Nama Donatur
    payload.donaturTipe || "",  // G: Tipe Donatur
    payload.DetailAlumni || "", // H: Detail Alumni
    payload.namaSantri || "",   // I: Nama Santri
    payload.nisSantri || "",    // J: NIS Santri
    payload.rombelSantri || "", // K: Rombel/Kelas Santri
    payload.hp || "",           // L: No HP
    payload.alamat || "",       // M: Alamat
    payload.email || "",        // N: Email
    payload.NoKTP || "",        // O: No KTP
    payload.doa || "",          // P: Pesan Doa
    "Belum Verifikasi"          // Q: Status
  ];
  
  sheet.appendRow(rowData);
  return { message: "Data berhasil disimpan.", idTransaksi: idTransaksi };
}

function readData() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) return [];
  
  // Baca data dari Kolom A-Q (17 Kolom)
  const range = sheet.getRange(2, 1, lastRow - 1, 17);
  const values = range.getValues();
  
  return values.map(row => ({
    idTransaksi: row[0],       // Ambil ID dari Kolom A
    Timestamp: row[1],
    type: row[2],              // Diseragamkan dengan frontend (dulu: JenisDonasi)
    nominal: row[3],           // Diseragamkan
    metode: row[4],            // Diseragamkan
    nama: row[5],              // Diseragamkan
    donaturTipe: row[6],
    DetailAlumni: row[7],
    namaSantri: row[8],
    nisSantri: row[9],
    rombelSantri: row[10],
    hp: row[11],               // Diseragamkan
    alamat: row[12],
    email: row[13],
    NoKTP: row[14],
    doa: row[15],              // Diseragamkan (dulu: PesanDoa)
    Status: row[16]
  }));
}

function verifyData(idTransaksi) {
  const sheet = getSheet();
  const rowNumber = findRowById(sheet, idTransaksi);
  
  // Update kolom Q (17) dengan status "Terverifikasi"
  sheet.getRange(rowNumber, 17).setValue("Terverifikasi");
  return { message: "Data berhasil diverifikasi." };
}

function updateData(idTransaksi, p) {
  const sheet = getSheet();
  const rowNumber = findRowById(sheet, idTransaksi);
  
  // Update data dari Kolom C - P (Diseragamkan dengan payload createData)
  const values = [[
    p.type || "",
    p.nominal || 0,
    p.metode || "",
    p.nama || "",
    p.donaturTipe || "",
    p.DetailAlumni || "",
    p.namaSantri || "",
    p.nisSantri || "",
    p.rombelSantri || "",
    p.hp || "",
    p.alamat || "",
    p.email || "",
    p.NoKTP || "",
    p.doa || ""
  ]];
  
  // Update 14 kolom mulai dari Kolom ke-3 (C)
  sheet.getRange(rowNumber, 3, 1, 14).setValues(values);
  return { message: "Data berhasil diperbarui." };
}

function deleteData(idTransaksi) {
  const sheet = getSheet();
  const rowNumber = findRowById(sheet, idTransaksi);
  sheet.deleteRow(rowNumber);
  return { message: "Data berhasil dihapus." };
}

// =====================================================================
// KUITANSI FUNCTIONS
// =====================================================================

function simpanKuitansi(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_KUITANSI);
  if (!sheet) throw new Error(`Tab "${SHEET_KUITANSI}" tidak ditemukan!`);
  
  const nextRow = sheet.getLastRow() + 1;
  const newRow = [
    new Date(),        // A
    data.no_inv,       // B
    data.tgl_kwt,      // C
    data.nama,         // D
    data.penyetor,     // E
    data.alamat,       // F
    data.hp,           // G
    data.zakat,        // H
    data.infaq,        // I
    data.lain,         // J
    data.total,        // K
    data.amil          // L
  ];
  
  sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
  return { message: "Data Kuitansi berhasil disimpan." };
}

function response(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
