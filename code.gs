// =====================================================================
// KONFIGURASI
// =====================================================================

// ID Spreadsheet Anda
const SPREADSHEET_ID = "1EhFeSGfar1mqzEQo5CgncmDr8nflFqcSyAaXAFmWFqE"; 

// Nama Sheet (Tab)
const SHEET_NAME = "DataDonasi";        // Tab Web Donasi (JANGAN DIUBAH)
const SHEET_KUITANSI = "DataKuitansi"; // Tab Web Kuitansi (BARU)

/**
 * =====================================================================
 * FUNGSI UTAMA (ENTRY POINTS)
 * =====================================================================
 */

function doGet(e) {
  try {
    // Logika asli Web Donasi (Tidak diganggu)
    const data = readData();
    return response({ status: "success", data: data });
  } catch (error) {
    return response({ status: "error", message: error.message });
  }
}

// ==========================================
// 1. TAMBAHKAN FUNGSI INI DI LUAR doPost (Bisa di paling atas atau paling bawah file)
// ==========================================
function verifikasiRecaptcha(token) {
  // GANTI TEKS DI BAWAH INI DENGAN SECRET KEY DARI GOOGLE CONSOLE ANDA
  const SECRET_KEY = "6LdhLGIsAAAAABVKoyyNjpCjIt8z_eF54m1NyUQm"; 
  
  const url = "https://www.google.com/recaptcha/api/siteverify?secret=" + SECRET_KEY + "&response=" + token;
  const response = UrlFetchApp.fetch(url);
  const json = JSON.parse(response.getContentText());
  
  // Kita anggap valid jika success = true DAN score >= 0.5
  return json.success && json.score >= 0.5;
}

// ==========================================
// 2. INI FUNGSI doPost YANG SUDAH DIUPDATE
// ==========================================
function doPost(e) {
  // Lock untuk mencegah bentrok data jika input bersamaan
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    if (!action) throw new Error("Invalid request: 'action' is missing.");

    let result;
    
    // ==========================================
    // PERCABANGAN BARU: KHUSUS KUITANSI
    // ==========================================
    if (action == "kuitansi") {
       // Masuk ke fungsi baru di paling bawah script ini
       result = simpanKuitansi(requestData);
    }

    // ==========================================
    // LOGIKA LAMA: KHUSUS DONASI
    // ==========================================
    else if (action == "create") {
      // --- UPDATE: CEK RECAPTCHA DULU ---
      
      // 1. Ambil token dari payload
      const token = requestData.payload.recaptchaToken;
      
      // 2. Jika tidak ada token, tolak
      if (!token) {
        throw new Error("Verifikasi keamanan (reCAPTCHA) gagal: Token tidak ditemukan.");
      }

      // 3. Cek ke Google apakah ini Manusia atau Bot
      const isHuman = verifikasiRecaptcha(token);
      
      if (!isHuman) {
        throw new Error("Sistem mendeteksi aktivitas mencurigakan (Bot). Donasi ditolak.");
      }

      // 4. Jika lolos, hapus token dari data agar tidak ikut tersimpan ke Spreadsheet (biar rapi)
      delete requestData.payload.recaptchaToken;

      // 5. Lanjut simpan data seperti biasa
      result = createData(requestData.payload);
      // --- AKHIR UPDATE ---
    } 
    else if (action == "verify") {
      if (!requestData.row) throw new Error("Row number is missing for verify.");
      result = verifyData(requestData.row);
    }
    else if (action == "update") {
      if (!requestData.row || !requestData.payload) throw new Error("Data incomplete for update.");
      result = updateData(requestData.row, requestData.payload);
    } 
    else if (action == "delete") {
      if (!requestData.row) throw new Error("Row number is missing for delete.");
      result = deleteData(requestData.row);
    } 
    else if (action == "sendReceipt") {
      return response({ status: "success", message: "Kuitansi berhasil digenerate di klien." });
    }
    else {
      throw new Error(`Invalid action: ${action}`);
    }

    return response({ status: "success", data: result });

  } catch (error) {
    return response({ status: "error", message: error.message });
  } finally {
    lock.releaseLock(); // Lepaskan kunci
  }
}

/**
 * =====================================================================
 * FUNGSI TAMBAHAN: KHUSUS WEB KUITANSI
 * =====================================================================
 */
function simpanKuitansi(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_KUITANSI);
  
  if (!sheet) throw new Error(`Tab "${SHEET_KUITANSI}" tidak ditemukan! Harap buat tab baru.`);

  // Mencari baris kosong berikutnya
  var nextRow = sheet.getLastRow() + 1;
  
  // Susunan Data Sesuai Kolom A-L di Tab Data_Kuitansi
  var newRow = [
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

  sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
  return { message: "Data Kuitansi berhasil disimpan." };
}

/**
 * =====================================================================
 * FUNGSI LOGIKA DATA LAMA (CRUD + VERIFY WEB DONASI)
 * TIDAK DIUBAH SAMA SEKALI AGAR DASHBOARD AMAN
 * =====================================================================
 */

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME); // Tetap mengarah ke "DataDonasi"
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" tidak ditemukan.`);
  return sheet;
}

// 1. CREATE
function createData(payload) {
  const sheet = getSheet();
  const timestamp = new Date();
  
  const rowData = [
    timestamp,                  // A
    payload.type,               // B
    payload.nominal,            // C
    payload.metode,             // D
    payload.nama,               // E
    payload.donaturTipe,        // F
    payload.DetailAlumni || "", // G
    payload.namaSantri || "",   // H
    payload.nisSantri || "",    // I
    payload.rombelSantri || "", // J
    payload.hp,                 // K
    payload.alamat,             // L
    payload.email || "",        // M
    payload.NoKTP || "",        // N
    payload.doa || "",          // O
    "Belum Verifikasi"          // P
  ];

  sheet.appendRow(rowData);
  return { message: "Data berhasil disimpan." };
}

// 2. READ
function readData() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) return []; 
  
  const range = sheet.getRange(2, 1, lastRow - 1, 16); 
  const values = range.getValues();
  
  return values.map((row, index) => ({
    row: index + 2,
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
}

// 3. VERIFY
function verifyData(rowNumber) {
  const sheet = getSheet();
  sheet.getRange(rowNumber, 16).setValue("Terverifikasi");
  return { message: "Data berhasil diverifikasi." };
}

// 4. UPDATE
function updateData(rowNumber, p) {
  const sheet = getSheet();
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
  
  sheet.getRange(rowNumber, 2, 1, 14).setValues(values);
  return { message: "Data berhasil diperbarui." };
}

// 5. DELETE
function deleteData(rowNumber) {
  const sheet = getSheet();
  sheet.deleteRow(rowNumber);
  return { message: "Data berhasil dihapus." };
}

/**
 * Helper JSON Response
 */
function response(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
