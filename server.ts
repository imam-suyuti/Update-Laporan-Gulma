import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import sql from "mssql";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// SQL Server connection pool manager (Lazy state)
let mssqlPool: sql.ConnectionPool | null = null;
let mssqlErrorLogged = false;

// Default Users array
const DEFAULT_USERS = [
  { username: "owner", nama: "Owner Utama", password: "owner123", role: "owner", grup: "Admin" },
  { username: "hasan", nama: "Mandor Hasan", password: "hasan123", role: "mandor", grup: "Grup Hasan" },
  { username: "ali", nama: "Mandor Ali", password: "ali123", role: "mandor", grup: "Grup Ali" },
  { username: "budi", nama: "Mandor Budi", password: "budi123", role: "mandor", grup: "Grup Budi" }
];

async function initializeMssqlTables(pool: sql.ConnectionPool) {
  try {
    // 1. Create Grup_Mandor table if not exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Grup_Mandor' and xtype='U')
      CREATE TABLE Grup_Mandor (
        Username NVARCHAR(100) PRIMARY KEY,
        Nama NVARCHAR(250) NOT NULL,
        Password NVARCHAR(250) NOT NULL,
        Role NVARCHAR(50) NOT NULL,
        Grup NVARCHAR(100) NOT NULL
      );
    `);

    // 2. Create Laporan table if not exists (headers matching Google sheets)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Laporan' and xtype='U')
      CREATE TABLE Laporan (
        ID NVARCHAR(100) PRIMARY KEY,
        Tanggal NVARCHAR(50) NOT NULL,
        Lokasi NVARCHAR(250) NOT NULL,
        Grup NVARCHAR(100) NOT NULL,
        Jenis NVARCHAR(50) NOT NULL,
        Pekerjaan NVARCHAR(MAX),
        Jam NVARCHAR(50),
        Orang NVARCHAR(50),
        Kg_Produksi NVARCHAR(50),
        Jenis_Pupuk NVARCHAR(100),
        Merek_Pupuk NVARCHAR(100),
        Sopir NVARCHAR(250),
        Nopol NVARCHAR(50),
        Jenis_Truk NVARCHAR(100),
        Jenis_Muatan NVARCHAR(100),
        Merek_Muatan NVARCHAR(100),
        Kg_Angkut NVARCHAR(50),
        Link_Foto_Kerja NVARCHAR(MAX),
        Link_Surat_Jalan NVARCHAR(MAX),
        Link_Foto_Truk NVARCHAR(MAX),
        Gaji NVARCHAR(50),
        Status_Pembayaran NVARCHAR(50)
      );
    `);

    // Seed default users if table is empty
    const usersCountRes = await pool.request().query("SELECT COUNT(*) as count FROM Grup_Mandor");
    if (usersCountRes.recordset[0].count === 0) {
      console.log("Seeding default mandor/owner users to MS SQL Server...");
      for (const u of DEFAULT_USERS) {
        await pool.request()
          .input("Username", sql.NVarChar, u.username)
          .input("Nama", sql.NVarChar, u.nama)
          .input("Password", sql.NVarChar, u.password)
          .input("Role", sql.NVarChar, u.role)
          .input("Grup", sql.NVarChar, u.grup)
          .query(`
            INSERT INTO Grup_Mandor (Username, Nama, Password, Role, Grup)
            VALUES (@Username, @Nama, @Password, @Role, @Grup)
          `);
      }
    }
  } catch (err) {
    console.error("Error creating/initializing SQL Server tables:", err);
  }
}

async function getMssqlPool(): Promise<sql.ConnectionPool | null> {
  const mssqlServer = process.env.MSSQL_SERVER || process.env.DB_HOST;
  if (!mssqlServer) return null; // Fall back gracefully to Google Sheets/Local JSON

  if (mssqlPool) return mssqlPool;

  const config: sql.config = {
    user: process.env.MSSQL_USER || process.env.DB_USER,
    password: process.env.MSSQL_PASSWORD || process.env.DB_PASSWORD,
    server: mssqlServer,
    database: process.env.MSSQL_DATABASE || process.env.DB_DATABASE || "master",
    port: Number(process.env.MSSQL_PORT || process.env.DB_PORT) || 1433,
    options: {
      encrypt: process.env.MSSQL_ENCRYPT === "true" || process.env.MSSQL_ENCRYPT === undefined, 
      trustServerCertificate: true, 
    },
    connectionTimeout: 15000,
  };

  try {
    console.log(`Connecting to SQL Server: ${config.server}:${config.port}, DB: ${config.database}...`);
    mssqlPool = await sql.connect(config);
    console.log("Connected to SQL Server successfully!");
    await initializeMssqlTables(mssqlPool);
    return mssqlPool;
  } catch (err) {
    if (!mssqlErrorLogged) {
      console.error("Failed to connect to MS SQL Server, falling back to Sheets/Local JSON storage:", err);
      mssqlErrorLogged = true;
    }
    return null;
  }
}

// High limits for base64 photo uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- PATHS ---
const CREDENTIALS_PATH = path.join(process.cwd(), "google-credentials.json");
const LAPORAN_FALLBACK_PATH = path.join(process.cwd(), "laporan-fallback.json");
const USERS_FALLBACK_PATH = path.join(process.cwd(), "users-fallback.json");

const DEFAULT_LAPORAN = [
  {
    ID: "L-1723450000001",
    Tanggal: "2026-06-12",
    Lokasi: "Tongas",
    Grup: "Grup Hasan",
    Jenis: "harian",
    Pekerjaan: "Rebag & Bersih-bersih Gudang",
    Jam: "8",
    Orang: "5",
    Kg_Produksi: "",
    Jenis_Pupuk: "",
    Merek_Pupuk: "",
    Sopir: "",
    Nopol: "",
    Jenis_Truk: "",
    Jenis_Muatan: "",
    Merek_Muatan: "",
    Kg_Angkut: "",
    Link_Foto_Kerja: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=600",
    Link_Surat_Jalan: "",
    Link_Foto_Truk: "",
    Gaji: "400000",
    Status_Pembayaran: "Belum Lunas"
  },
  {
    ID: "L-1723450000002",
    Tanggal: "2026-06-13",
    Lokasi: "Kraton",
    Grup: "Grup Ali",
    Jenis: "produksi",
    Pekerjaan: "",
    Jam: "",
    Orang: "",
    Kg_Produksi: "5000",
    Jenis_Pupuk: "Granul",
    Merek_Pupuk: "Buah Ndaru",
    Sopir: "",
    Nopol: "",
    Jenis_Truk: "",
    Jenis_Muatan: "",
    Merek_Muatan: "",
    Kg_Angkut: "",
    Link_Foto_Kerja: "",
    Link_Surat_Jalan: "",
    Link_Foto_Truk: "",
    Gaji: "200000",
    Status_Pembayaran: "Belum Lunas"
  },
  {
    ID: "L-1723450000003",
    Tanggal: "2026-06-14",
    Lokasi: "Tongas",
    Grup: "Grup Budi",
    Jenis: "angkut",
    Pekerjaan: "",
    Jam: "",
    Orang: "",
    Kg_Produksi: "",
    Jenis_Pupuk: "",
    Merek_Pupuk: "",
    Sopir: "Slamet Jati",
    Nopol: "N 8922 UK",
    Jenis_Truk: "Colt Diesel",
    Jenis_Muatan: "Granul",
    Merek_Muatan: "Ziraea",
    Kg_Angkut: "8000",
    Link_Foto_Kerja: "",
    Link_Surat_Jalan: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600",
    Link_Foto_Truk: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=600",
    Gaji: "120000",
    Status_Pembayaran: "Lunas"
  }
];

// Helper to load/save fallback database
function getLocalLaporan(): any[] {
  if (!fs.existsSync(LAPORAN_FALLBACK_PATH)) {
    fs.writeFileSync(LAPORAN_FALLBACK_PATH, JSON.stringify(DEFAULT_LAPORAN, null, 2));
  }
  return JSON.parse(fs.readFileSync(LAPORAN_FALLBACK_PATH, "utf-8"));
}

function saveLocalLaporan(data: any[]) {
  fs.writeFileSync(LAPORAN_FALLBACK_PATH, JSON.stringify(data, null, 2));
}

function getLocalUsers(): any[] {
  if (!fs.existsSync(USERS_FALLBACK_PATH)) {
    fs.writeFileSync(USERS_FALLBACK_PATH, JSON.stringify(DEFAULT_USERS, null, 2));
  }
  return JSON.parse(fs.readFileSync(USERS_FALLBACK_PATH, "utf-8"));
}

function saveLocalUsers(data: any[]) {
  fs.writeFileSync(USERS_FALLBACK_PATH, JSON.stringify(data, null, 2));
}

// --- GOOGLE OAUTH UTILS ---

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
}

// Get access token, refreshing if expired and refresh token is found
async function getGoogleAccessToken(): Promise<string | null> {
  if (!fs.existsSync(CREDENTIALS_PATH)) return null;
  const raw = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
  if (!raw) return null;
  let tokenData: TokenData;
  try {
    tokenData = JSON.parse(raw);
  } catch (err) {
    return null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables");
    return tokenData.access_token; // attempt to use current anyway
  }

  // If expired or expiring in next 60 seconds, refresh it
  if (tokenData.expiry_date && Date.now() >= tokenData.expiry_date - 60000) {
    if (!tokenData.refresh_token) {
      console.warn("Google API access token expired and no refresh token available.");
      return tokenData.access_token;
    }
    console.log("Refreshing Google OAuth token...");
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokenData.refresh_token,
          grant_type: "refresh_token",
        }).toString(),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Failed to refresh Google OAuth token:", errText);
        return tokenData.access_token; // fallback
      }

      const fresh: any = await response.json();
      tokenData.access_token = fresh.access_token;
      if (fresh.expires_in) {
        tokenData.expiry_date = Date.now() + fresh.expires_in * 1000;
      }
      // Save updated credentials
      fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(tokenData, null, 2));
      console.log("Google OAuth token refreshed successfully.");
    } catch (err) {
      console.error("Error refreshing Google OAuth token:", err);
    }
  }

  return tokenData.access_token;
}

// Ensure remote spreadsheet and folders exist. Sets up environment spreadsheet if not specified
async function getDriveResources(accessToken: string): Promise<{ spreadsheetId: string; folderId: string }> {
  let spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || "";
  let folderId = "";

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  // 1. Find or create Folder for Photo Upload
  try {
    const qFolder = encodeURIComponent("name = 'Laporan Foto CV Gulma Gemilang' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    const resFolder = await fetch(`https://www.googleapis.com/drive/v3/files?q=${qFolder}&fields=files(id,name)`, { headers });
    const dataFolder: any = await resFolder.json();
    if (dataFolder.files && dataFolder.files.length > 0) {
      folderId = dataFolder.files[0].id;
    } else {
      // Create folder
      const createFolderRes = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: "Laporan Foto CV Gulma Gemilang",
          mimeType: "application/vnd.google-apps.folder",
        }),
      });
      const folderData: any = await createFolderRes.json();
      folderId = folderData.id;

      // Make folder readable by anyone with the link (so visual documentation photos are public to owner and managers)
      await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
      });
    }
  } catch (err) {
    console.error("Error checking/creating Drive Folder:", err);
  }

  // 2. Find or create Spreadsheet
  try {
    if (!spreadsheetId) {
      const qSheet = encodeURIComponent("name = 'Laporan Harian CV Gulma Gemilang' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
      const resSheet = await fetch(`https://www.googleapis.com/drive/v3/files?q=${qSheet}&fields=files(id,name)`, { headers });
      const dataSheet: any = await resSheet.json();
      if (dataSheet.files && dataSheet.files.length > 0) {
        spreadsheetId = dataSheet.files[0].id;
      } else {
        // Create Spreadsheet
        const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
          method: "POST",
          headers,
          body: JSON.stringify({
            properties: { title: "Laporan Harian CV Gulma Gemilang" },
          }),
        });
        const sheetData: any = await createRes.json();
        spreadsheetId = sheetData.spreadsheetId;

        // Add headers for worksheets "Laporan" and "Grup_Mandor"
        // Google sheets automatically creates a first grid sheet 'Sheet1'. We will rename this grid sheet to 'Laporan' and append 'Grup_Mandor'
        const firstSheetId = sheetData.sheets?.[0]?.properties?.sheetId || 0;

        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/:batchUpdate`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            requests: [
              {
                updateSheetProperties: {
                  properties: { sheetId: firstSheetId, title: "Laporan" },
                  fields: "title",
                },
              },
              {
                addSheet: {
                  properties: { title: "Grup_Mandor" },
                },
              },
            ],
          }),
        });

        // Seed worksheets templates with headings
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Laporan!A1:V1?valueInputOption=RAW`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            values: [[
              "ID", "Tanggal", "Lokasi", "Grup", "Jenis", "Pekerjaan", "Jam", "Orang", 
              "Kg_Produksi", "Jenis_Pupuk", "Merek_Pupuk", "Sopir", "Nopol", "Jenis_Truk", 
              "Jenis_Muatan", "Merek_Muatan", "Kg_Angkut", "Link_Foto_Kerja", "Link_Surat_Jalan", 
              "Link_Foto_Truk", "Gaji", "Status_Pembayaran"
            ]],
          }),
        });

        // Seed defaults users to Grup_Mandor
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Grup_Mandor!A1:E1?valueInputOption=RAW`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            values: [["Username", "Nama", "Password", "Role", "Grup"]],
          }),
        });

        // Populate users
        const userRows = DEFAULT_USERS.map((u) => [u.username, u.nama, u.password, u.role, u.grup]);
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Grup_Mandor!A2:E${userRows.length+1}?valueInputOption=RAW`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            values: userRows,
          }),
        });
      }
    }
  } catch (err) {
    console.error("Error creating/acquiring Spreadsheet:", err);
  }

  return { spreadsheetId, folderId };
}

// Convert a row list array of arrays to list of objects using the header row
function parseSheetRows(values: any[][]): any[] {
  if (!values || values.length <= 1) return [];
  const headers = values[0];
  const items: any[] = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length === 0 || row.every(cell => cell === "")) continue;
    const obj: any = {};
    headers.forEach((h, idx) => {
      obj[h.replace(/\s+/g, "_")] = row[idx] !== undefined ? String(row[idx]) : "";
    });
    items.push(obj);
  }
  return items;
}

// --- API WORKSPACE HANDLERS ---

async function fetchFromSheet(sheetName: string): Promise<any[]> {
  // 1. Try SQL Server first
  const pool = await getMssqlPool();
  if (pool) {
    try {
      const tableName = sheetName === "Laporan" ? "Laporan" : "Grup_Mandor";
      console.log(`Executing SQL Server query: SELECT * FROM ${tableName}`);
      const result = await pool.request().query(`SELECT * FROM ${tableName}`);
      return result.recordset;
    } catch (err) {
      console.error(`Error querying ${sheetName} from SQL Server database:`, err);
    }
  }

  // 2. Fall back to Google Sheets or Local storage
  const token = await getGoogleAccessToken();
  if (!token) {
    // Falls back to local json file
    if (sheetName === "Laporan") return getLocalLaporan();
    return getLocalUsers();
  }

  try {
    const { spreadsheetId } = await getDriveResources(token);
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:Z5000`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Google Sheets responded with ${response.status}`);
    }

    const data: any = await response.json();
    return parseSheetRows(data.values);
  } catch (err) {
    console.error(`Error reading ${sheetName} from Google Sheets. Using local fallback.`, err);
    if (sheetName === "Laporan") return getLocalLaporan();
    return getLocalUsers();
  }
}

async function writeToSheet(sheetName: string, items: any[]) {
  // 1. Try SQL Server first
  const pool = await getMssqlPool();
  if (pool) {
    try {
      const tableName = sheetName === "Laporan" ? "Laporan" : "Grup_Mandor";
      console.log(`Overwriting SQL Server table: ${tableName} with ${items.length} records`);
      
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      try {
        // Truncate existing rows to synchronize full state
        await transaction.request().query(`TRUNCATE TABLE ${tableName}`);
        
        if (sheetName === "Laporan") {
          for (const item of items) {
            await transaction.request()
              .input("ID", sql.NVarChar, item.ID || `L-${Date.now()}-${Math.round(Math.random()*1000)}`)
              .input("Tanggal", sql.NVarChar, item.Tanggal || "")
              .input("Lokasi", sql.NVarChar, item.Lokasi || "")
              .input("Grup", sql.NVarChar, item.Grup || "")
              .input("Jenis", sql.NVarChar, item.Jenis || "")
              .input("Pekerjaan", sql.NVarChar, item.Pekerjaan || "")
              .input("Jam", sql.NVarChar, item.Jam || "")
              .input("Orang", sql.NVarChar, item.Orang || "")
              .input("Kg_Produksi", sql.NVarChar, item.Kg_Produksi || "")
              .input("Jenis_Pupuk", sql.NVarChar, item.Jenis_Pupuk || "")
              .input("Merek_Pupuk", sql.NVarChar, item.Merek_Pupuk || "")
              .input("Sopir", sql.NVarChar, item.Sopir || "")
              .input("Nopol", sql.NVarChar, item.Nopol || "")
              .input("Jenis_Truk", sql.NVarChar, item.Jenis_Truk || "")
              .input("Jenis_Muatan", sql.NVarChar, item.Jenis_Muatan || "")
              .input("Merek_Muatan", sql.NVarChar, item.Merek_Muatan || "")
              .input("Kg_Angkut", sql.NVarChar, item.Kg_Angkut || "")
              .input("Link_Foto_Kerja", sql.NVarChar, item.Link_Foto_Kerja || "")
              .input("Link_Surat_Jalan", sql.NVarChar, item.Link_Surat_Jalan || "")
              .input("Link_Foto_Truk", sql.NVarChar, item.Link_Foto_Truk || "")
              .input("Gaji", sql.NVarChar, String(item.Gaji || "0"))
              .input("Status_Pembayaran", sql.NVarChar, item.Status_Pembayaran || "Belum Lunas")
              .query(`
                INSERT INTO Laporan (
                  ID, Tanggal, Lokasi, Grup, Jenis, Pekerjaan, Jam, Orang, 
                  Kg_Produksi, Jenis_Pupuk, Merek_Pupuk, Sopir, Nopol, Jenis_Truk, 
                  Jenis_Muatan, Merek_Muatan, Kg_Angkut, Link_Foto_Kerja, Link_Surat_Jalan, 
                  Link_Foto_Truk, Gaji, Status_Pembayaran
                ) VALUES (
                  @ID, @Tanggal, @Lokasi, @Grup, @Jenis, @Pekerjaan, @Jam, @Orang, 
                  @Kg_Produksi, @Jenis_Pupuk, @Merek_Pupuk, @Sopir, @Nopol, @Jenis_Truk, 
                  @Jenis_Muatan, @Merek_Muatan, @Kg_Angkut, @Link_Foto_Kerja, @Link_Surat_Jalan, 
                  @Link_Foto_Truk, @Gaji, @Status_Pembayaran
                )
              `);
          }
        } else {
          // Grup_Mandor
          for (const item of items) {
            await transaction.request()
              .input("Username", sql.NVarChar, item.Username || item.username || "")
              .input("Nama", sql.NVarChar, item.Nama || item.nama || "")
              .input("Password", sql.NVarChar, item.Password || item.password || "")
              .input("Role", sql.NVarChar, item.Role || item.role || "mandor")
              .input("Grup", sql.NVarChar, item.Grup || item.grup || "")
              .query(`
                INSERT INTO Grup_Mandor (Username, Nama, Password, Role, Grup)
                VALUES (@Username, @Nama, @Password, @Role, @Grup)
              `);
          }
        }
        await transaction.commit();
        return; // Success, skip sheet writing
      } catch (innerErr) {
        await transaction.rollback();
        throw innerErr;
      }
    } catch (err) {
      console.error(`Error saving ${sheetName} to SQL Server database, falling back:`, err);
    }
  }

  // 2. Fall back to Google Sheets / local json
  const token = await getGoogleAccessToken();
  if (!token) {
    if (sheetName === "Laporan") saveLocalLaporan(items);
    else saveLocalUsers(items);
    return;
  }

  try {
    const { spreadsheetId } = await getDriveResources(token);
    const headers = sheetName === "Laporan"
      ? [
          "ID", "Tanggal", "Lokasi", "Grup", "Jenis", "Pekerjaan", "Jam", "Orang", 
          "Kg_Produksi", "Jenis_Pupuk", "Merek_Pupuk", "Sopir", "Nopol", "Jenis_Truk", 
          "Jenis_Muatan", "Merek_Muatan", "Kg_Angkut", "Link_Foto_Kerja", "Link_Surat_Jalan", 
          "Link_Foto_Truk", "Gaji", "Status_Pembayaran"
        ]
      : ["Username", "Nama", "Password", "Role", "Grup"];

    const values = [headers];
    items.forEach((item) => {
      const row = headers.map((h) => {
        const val = item[h];
        return val !== undefined ? String(val) : "";
      });
      values.push(row);
    });

    // Clear previous rows to overwrite properly
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:Z5000?valueInputOption=RAW`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    });
  } catch (err) {
    console.error(`Error writing ${sheetName} to Google Sheets. Updating local fallback.`, err);
    if (sheetName === "Laporan") saveLocalLaporan(items);
    else saveLocalUsers(items);
  }
}

// Upload base64 image to Google Drive folder and get public link
async function uploadToGoogleDrive(base64: string, filename: string, mimeType: string): Promise<string> {
  const token = await getGoogleAccessToken();
  if (!token) {
    // Unsplash simulation fallback if Google is not connected
    return `https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600&local-simulated=${encodeURIComponent(filename)}`;
  }

  try {
    const { folderId } = await getDriveResources(token);
    const metadata = {
      name: filename,
      parents: folderId ? [folderId] : [],
    };

    const boundary = "foo_bar_baz";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const buffer = Buffer.from(base64, "base64");

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n` +
      "Content-Transfer-Encoding: base64\r\n\r\n" +
      base64 +
      closeDelimiter;

    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webContentLink,webViewLink", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      throw new Error(`Google Upload APIs responded with status ${response.status}`);
    }

    const fileData: any = await response.json();
    const fileId = fileData.id;

    // Set permission so that anyone with the link can view (allows users to click links on dashboard and see photos)
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    });

    // We can construct direct viewing URLs or webViewLinks
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } catch (err) {
    console.error("Error uploading to Google Drive. Returning simulated link.", err);
    return `https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600&err=${encodeURIComponent(String(err))}`;
  }
}

// --- ENDPOINTS ---

// Google OAuth Authorization Initiate
app.get(["/api/google-url", "/api/auth/google-url"], (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(400).json({ error: "Google Client ID is not configured in .env files yet." });
  }

  const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/auth/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email"
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl });
});

// Google OAuth Handler Redirect callback
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/auth/callback`;

  if (!code || !clientId || !clientSecret) {
    return res.send(`
      <html>
        <body>
          <h2>Autentikasi gagal</h2>
          <p>Parameter Google Client ID, secret, atau kode otorisasi tidak ditemukan.</p>
          <button onclick="window.close()">Tutup Jendela</button>
        </body>
      </html>
    `);
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: String(code),
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Token request returned status ${response.status}`);
    }

    const data: any = await response.json();
    const tokenData: TokenData = {
      access_token: data.access_token,
      expiry_date: Date.now() + (data.expires_in || 3600) * 1000,
    };
    if (data.refresh_token) {
      tokenData.refresh_token = data.refresh_token;
    }

    // Save token data safely
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(tokenData, null, 2));

    // Send postMessage to parent window and close popup
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #e6f4ee; color: #1a7f5a;">
          <h2>🦉 Koneksi Berhasil!</h2>
          <p>Aplikasi Anda sekarang sukses terintegrasi dengan Google Drive dan Google Sheets.</p>
          <p>Halaman ini akan menutup secara otomatis...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              setTimeout(() => { window.close(); }, 1500);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    res.status(500).send(`
      <html>
        <body>
          <h2>Gagal menukar kode otorisasi</h2>
          <p>${err.message || err}</p>
          <button onclick="window.close()">Tutup</button>
        </body>
      </html>
    `);
  }
});

// Google Integration Status API
app.get("/api/google-status", async (req, res) => {
  const isSetup = fs.existsSync(CREDENTIALS_PATH);
  const clientIdSet = !!process.env.GOOGLE_CLIENT_ID;
  const clientSecretSet = !!process.env.GOOGLE_CLIENT_SECRET;

  if (!isSetup) {
    return res.json({
      connected: false,
      configured: clientIdSet && clientSecretSet,
      message: "Google OAuth belum dihubungkan. Klik 'Hubungkan Google' di menu Dashboard untuk mengaktifkan sinkronisasi real-time.",
    });
  }

  const token = await getGoogleAccessToken();
  if (!token) {
    return res.json({
      connected: false,
      configured: clientIdSet && clientSecretSet,
      message: "Koneksi Google ada tetapi tidak valid / gagal disegarkan kembali.",
    });
  }

  try {
    const { spreadsheetId, folderId } = await getDriveResources(token);
    res.json({
      connected: true,
      configured: true,
      spreadsheetId,
      folderId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
    });
  } catch (err) {
    res.json({
      connected: true,
      configured: true,
      message: "Terhubung, gagal mengambil sumber daya Drive: " + String(err),
    });
  }
});

// Clean credentials (Disconnect Google)
app.post("/api/google-disconnect", (req, res) => {
  if (fs.existsSync(CREDENTIALS_PATH)) {
    fs.unlinkSync(CREDENTIALS_PATH);
  }
  res.json({ ok: true, message: "Koneksi Google berhasil diputuskan." });
});

// Login Employee Group
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ ok: false, msg: "Lengkapi username dan sandi." });
  }

  try {
    const users = await fetchFromSheet("Grup_Mandor");
    const found = users.find((u) => {
      const uName = String(u.Username || u.username || "").trim();
      const uPass = String(u.Password || u.password || "").trim();
      return uName.toLowerCase() === String(username).trim().toLowerCase() && uPass === String(password).trim();
    });

    if (found) {
      return res.json({
        ok: true,
        username: found.Username || found.username,
        nama: found.Nama || found.nama,
        role: found.Role || found.role || "mandor",
        grup: found.Grup || found.grup,
      });
    }

    return res.json({ ok: false, msg: "Username atau password salah." });
  } catch (err) {
    console.error("Login API error:", err);
    return res.json({ ok: false, msg: "Koneksi ke database Sheets bermasalah." });
  }
});

// Get User Groups List
app.get("/api/users", async (req, res) => {
  try {
    const users = await fetchFromSheet("Grup_Mandor");
    res.json({ ok: true, data: users });
  } catch (err) {
    res.json({ ok: false, msg: "Gagal mengambil daftar pengguna." });
  }
});

// Save / Edit User Group (Owner Only)
app.post("/api/user-save", async (req, res) => {
  const { user } = req.body;
  if (!user || !user.username) {
    return res.json({ ok: false, msg: "Format data pengguna tidak valid." });
  }

  try {
    const users = await fetchFromSheet("Grup_Mandor");
    const idx = users.findIndex((u) => u.Username?.toLowerCase() === user.username.toLowerCase());
    const payload = {
      Username: user.username,
      Nama: user.nama,
      Password: user.password,
      Role: "mandor",
      Grup: user.grup,
    };

    if (idx !== -1) {
      // Edit
      users[idx] = payload;
    } else {
      // Add
      users.push(payload);
    }

    await writeToSheet("Grup_Mandor", users);
    res.json({ ok: true, msg: "Grup berhasil disimpan ke dalam sistem." });
  } catch (err) {
    res.json({ ok: false, msg: "Gagal menulis pengguna ke Sheets." });
  }
});

// Delete User Group (Owner Only)
app.post("/api/user-delete", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.json({ ok: false, msg: "Data tidak lengkap." });

  try {
    const users = await fetchFromSheet("Grup_Mandor");
    const updated = users.filter((u) => u.Username?.toLowerCase() !== username.toLowerCase());
    await writeToSheet("Grup_Mandor", updated);
    res.json({ ok: true, msg: "Grup berhasil dihapus." });
  } catch (err) {
    res.json({ ok: false, msg: "Gagal menghapus grup dari Sheets." });
  }
});

// Get Daily Reports Database
app.get("/api/reports", async (req, res) => {
  try {
    const reports = await fetchFromSheet("Laporan");
    res.json({ ok: true, data: reports });
  } catch (err) {
    res.json({ ok: false, msg: "Gagal mengambil laporan." });
  }
});

// Save report with auto-uploading images to Google Drive
app.post("/api/reports/save", async (req, res) => {
  const { entry, photos } = req.body;
  if (!entry) return res.json({ ok: false, msg: "Data laporan tidak boleh kosong." });

  try {
    const reports = await fetchFromSheet("Laporan");

    // Initialize photo links
    let linkKerja = "";
    let linkSj = "";
    let linkTruk = "";

    // Upload base64 photos to Drive if supplied
    if (photos) {
      if (photos.kerja && photos.kerja.length > 0) {
        const urls = [];
        for (let i = 0; i < photos.kerja.length; i++) {
          const url = await uploadToGoogleDrive(photos.kerja[i].base64, `Photo_Kerja_${entry.grup}_${entry.tanggal}_${i+1}.jpg`, "image/jpeg");
          urls.push(url);
        }
        linkKerja = urls.join(" | ");
      }
      if (photos.sj && photos.sj.length > 0) {
        const urls = [];
        for (let i = 0; i < photos.sj.length; i++) {
          const url = await uploadToGoogleDrive(photos.sj[i].base64, `Surat_Jalan_${entry.grup}_${entry.tanggal}_${i+1}.jpg`, "image/jpeg");
          urls.push(url);
        }
        linkSj = urls.join(" | ");
      }
      if (photos.truk && photos.truk.length > 0) {
        const urls = [];
        for (let i = 0; i < photos.truk.length; i++) {
          const url = await uploadToGoogleDrive(photos.truk[i].base64, `Photo_Truk_${entry.grup}_${entry.tanggal}_${i+1}.jpg`, "image/jpeg");
          urls.push(url);
        }
        linkTruk = urls.join(" | ");
      }
    }

    const payload = {
      ID: `L-${Date.now()}`,
      Tanggal: entry.tanggal,
      Lokasi: entry.lokasi,
      Grup: entry.grup,
      Jenis: entry.jenis,
      Pekerjaan: entry.pekerjaan || "",
      Jam: entry.jam || "",
      Orang: entry.orang || "",
      Kg_Produksi: entry.kgProduksi || "",
      Jenis_Pupuk: entry.jenisPupuk || "",
      Merek_Pupuk: entry.merekPupuk || "",
      Sopir: entry.sopir || "",
      Nopol: entry.nopol || "",
      Jenis_Truk: entry.jenisTruk || "",
      Jenis_Muatan: entry.jenisMuatan || "",
      Merek_Muatan: entry.merekMuatan || "",
      Kg_Angkut: entry.kgAngkut || "",
      Link_Foto_Kerja: linkKerja || entry.linkFotoKerja || "",
      Link_Surat_Jalan: linkSj || entry.linkSuratJalan || "",
      Link_Foto_Truk: linkTruk || entry.linkFotoTruk || "",
      Gaji: String(entry.gaji || 0),
      Status_Pembayaran: "Belum Lunas", // Always starts as Belum Lunas
    };

    reports.push(payload);
    await writeToSheet("Laporan", reports);
    res.json({ ok: true, msg: "Laporan harian berhasil disimpan dengan aman." });
  } catch (err: any) {
    console.error("Save report error:", err);
    res.json({ ok: false, msg: "Gagal menyimpan laporan: " + err.message });
  }
});

// Delete report (Owner only)
app.post("/api/reports/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.json({ ok: false, msg: "ID tidak valid." });

  try {
    const reports = await fetchFromSheet("Laporan");
    const filtered = reports.filter((r) => r.ID !== id);
    await writeToSheet("Laporan", filtered);
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, msg: "Gagal menghapus laporan." });
  }
});

// Mark payroll ranges as paid ("Lunasi Slip Gaji")
app.post("/api/reports/lunasi", async (req, res) => {
  const { grup, upToDate, idList } = req.body;
  if (!grup) return res.json({ ok: false, msg: "Grup wajib ditentukan." });

  try {
    const reports = await fetchFromSheet("Laporan");
    let changedCount = 0;

    const updated = reports.map((row) => {
      // 1. If we have a list of exact IDs, match those
      if (idList && Array.isArray(idList)) {
        if (idList.includes(row.ID) && row.Grup === grup && row.Status_Pembayaran !== "Lunas") {
          row.Status_Pembayaran = "Lunas";
          changedCount++;
        }
      } 
      // 2. Otherwise match by dates
      else if (row.Grup === grup && row.Status_Pembayaran !== "Lunas") {
        if (!upToDate || row.Tanggal <= upToDate) {
          row.Status_Pembayaran = "Lunas";
          changedCount++;
        }
      }
      return row;
    });

    if (changedCount > 0) {
      await writeToSheet("Laporan", updated);
    }
    res.json({ ok: true, count: changedCount, msg: `Sukses melunasi slip gaji (${changedCount} laporan).` });
  } catch (err) {
    console.error("Payment status modification error:", err);
    res.json({ ok: false, msg: "Gagal melunasi slip pembayaran." });
  }
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
