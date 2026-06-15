export interface ReportEntry {
  ID: string;
  Tanggal: string;
  Lokasi: string;
  Grup: string;
  Jenis: "harian" | "produksi" | "angkut" | string;
  Pekerjaan?: string;
  Jam?: string;
  Orang?: string;
  Kg_Produksi?: string;
  Jenis_Pupuk?: string;
  Merek_Pupuk?: string;
  Sopir?: string;
  Nopol?: string;
  Jenis_Truk?: string;
  Jenis_Muatan?: string;
  Merek_Muatan?: string;
  Kg_Angkut?: string;
  Link_Foto_Kerja?: string;
  Link_Surat_Jalan?: string;
  Link_Foto_Truk?: string;
  Gaji: string;
  Status_Pembayaran: "Lunas" | "Belum Lunas" | string;
}

export interface UserAccount {
  username: string;
  nama: string;
  password?: string;
  role: "owner" | "mandor" | string;
  grup: string;
}

export interface GoogleStatus {
  connected: boolean;
  configured: boolean;
  spreadsheetId?: string;
  folderId?: string;
  spreadsheetUrl?: string;
  folderUrl?: string;
  message?: string;
}
