import React, { useState, useEffect } from "react";
import { 
  Hammer, 
  Package, 
  Truck, 
  Camera, 
  CheckCircle, 
  RefreshCw, 
  Printer, 
  Users, 
  Trash2, 
  Edit, 
  Plus, 
  LogOut, 
  Lock, 
  Shield, 
  Sparkles, 
  Coins, 
  PlusCircle, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  Sheet, 
  FolderOpen, 
  Network, 
  UserPlus, 
  FileCheck,
  Check
} from "lucide-react";
import { jsPDF } from "jspdf";
import { ReportEntry, UserAccount, GoogleStatus } from "./types";
// @ts-ignore
import logoOwl from "./assets/images/logo_owl_1781561733481.jpg";

const DEFAULT_DROPDOWNS = {
  lokasi: [
    { value: "Tongas", label: "Gudang Tongas" },
    { value: "Kraton", label: "Kraton Production Mill" }
  ],
  aktivitas: [
    { value: "Bersih-bersih Gudang", label: "Bersih-bersih Gudang" },
    { value: "Proses Rebagging", label: "Proses Rebagging" },
    { value: "Perbaikan Mesin", label: "Perbaikan Mesin" },
    { value: "Pembangunan Fasilitas", label: "Pembangunan Fasilitas" }
  ],
  pupukJenis: [
    { value: "Granul", label: "Organik Granul (Butiran)" },
    { value: "Remah", label: "Organik Remah (Curah)" },
    { value: "Cair", label: "Hayati Cair (Pupuk Cair)" }
  ],
  pupukMerek: [
    { value: "Buah Ndaru", label: "Buah Ndaru Premium" },
    { value: "Ziraea", label: "Ziraea Eco-Friendly" },
    { value: "JE (Java Excellent)", label: "JE (Java Excellent)" },
    { value: "Polos", label: "Karung Polos (Tanpa Merek)" }
  ],
  trukJenis: [
    { value: "Colt Diesel", label: "Colt Diesel" },
    { value: "Fuso", label: "Fuso Ragasa" },
    { value: "Tronton", label: "Tronton Engkel" },
    { value: "Gandeng", label: "Gandeng Cargo" }
  ],
  trukMuatan: [
    { value: "Granul", label: "Granul Pack" },
    { value: "Remah", label: "Remah Curah" },
    { value: "Bahan Baku", label: "Kotoran / Baku" }
  ]
};

export default function App() {
  // --- AUTH STATE ---
  const [session, setSession] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem("gg_session");
    return saved ? JSON.parse(saved) : null;
  });
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- GOOGLE WORKSPACE STATUS STATE ---
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>({ connected: false, configured: false });
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // --- APP NAVIGATION ---
  const [activeTab, setActiveTab] = useState<"form" | "rekap" | "user">("form");
  const [adminSubTab, setAdminSubTab] = useState<"users" | "dropdowns" | "history">("users");

  // --- DROPDOWN MANAGE STATES ---
  const [dropdowns, setDropdowns] = useState<typeof DEFAULT_DROPDOWNS>(DEFAULT_DROPDOWNS);

  const [selectedCategory, setSelectedCategory] = useState<keyof typeof DEFAULT_DROPDOWNS>("lokasi");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [editingOptionIdx, setEditingOptionIdx] = useState<number | null>(null);
  const [editOptionValue, setEditOptionValue] = useState("");
  const [editOptionLabel, setEditOptionLabel] = useState("");

  // --- SLIP PRINT HISTORY ---
  const [slipHistory, setSlipHistory] = useState<any[]>([]);

  // --- DATA LISTS ---
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // --- INTAKE FORM STATE ---
  const [fTanggal, setFTanggal] = useState(() => new Date().toISOString().split("T")[0]);
  const [fLokasi, setFLokasi] = useState("");
  const [jenisSelected, setJenisSelected] = useState<"harian" | "produksi" | "angkut" | "">("");

  // Harian Detail
  const [hJenis, setHJenis] = useState("");
  const [hLainnya, setHLainnya] = useState("");
  const [hJam, setHJam] = useState("8");
  const [hOrang, setHOrang] = useState("1");
  const [hFotoFiles, setHFotoFiles] = useState<{ name: string; base64: string; type: string }[]>([]);

  // Produksi Detail
  const [pJenis, setPJenis] = useState("");
  const [pMerek, setPMerek] = useState("");
  const [pKg, setPKg] = useState("");

  // Angkut Detail
  const [aSopir, setASopir] = useState("");
  const [aNopol, setANopol] = useState("");
  const [aTruk, setATruk] = useState("");
  const [aMuatan, setAMuatan] = useState("");
  const [aMerek, setAMerek] = useState("");
  const [aKg, setAKg] = useState("");
  const [aSjFiles, setASjFiles] = useState<{ name: string; base64: string; type: string }[]>([]);
  const [aFotoTrukFiles, setAFotoTrukFiles] = useState<{ name: string; base64: string; type: string }[]>([]);

  // Form Submitting feedback
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState("");

  // --- FILTER STATE ---
  const [filterGrup, setFilterGrup] = useState("");
  const [filterDari, setFilterDari] = useState("");
  const [filterSampai, setFilterSampai] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // --- MODAL STATE ---
  const [mOpen, setMOpen] = useState(false);
  const [mMode, setMMode] = useState<"add" | "edit">("add");
  const [mUsername, setMUsername] = useState("");
  const [mNama, setMNama] = useState("");
  const [mPassword, setMPassword] = useState("");

  // --- TOAST NOTIFICATIONS ---
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  // --- PRINT PAYROLL MODIFICATION STATE ---
  const [isUpdatingPayroll, setIsUpdatingPayroll] = useState(false);

  // --- LIFECYCLES ---
  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    checkGoogleStatus();
  }, [session]);

  useEffect(() => {
    if (session) {
      loadReports();
      if (session.role === "owner") {
        loadUsers();
        loadHistory();
      }
    }
  }, [session, activeTab]);

  // Listen popup message from Google OAuth successfully callback
  useEffect(() => {
    const handleOAuthCallback = (event: MessageEvent) => {
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        triggerToast("✓ Akun Google sukses terhubung! Menyinkronkan...");
        checkGoogleStatus();
        loadReports();
        if (session?.role === "owner") {
          loadUsers();
        }
      }
    };
    window.addEventListener("message", handleOAuthCallback);
    return () => window.removeEventListener("message", handleOAuthCallback);
  }, [session]);

  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // --- API CALLS ---
  const checkGoogleStatus = async () => {
    try {
      const res = await fetch("/api/google-status");
      if (res.ok) {
        const status = await res.json();
        setGoogleStatus(status);
      }
    } catch (err) {
      console.error("Gagal memeriksa integrasi Google:", err);
    }
  };

  const loadDropdowns = async () => {
    try {
      const res = await fetch("/api/dropdowns");
      if (res.ok) {
        const body = await res.json();
        const list = body.data || [];
        if (list.length > 0) {
          const newDropdowns = {
            lokasi: list.filter((i: any) => (i.Kategori || i.kategori) === "lokasi").map((i: any) => ({ value: i.Value || i.value, label: i.Label || i.label })),
            aktivitas: list.filter((i: any) => (i.Kategori || i.kategori) === "aktivitas").map((i: any) => ({ value: i.Value || i.value, label: i.Label || i.label })),
            pupukJenis: list.filter((i: any) => (i.Kategori || i.kategori) === "pupukJenis").map((i: any) => ({ value: i.Value || i.value, label: i.Label || i.label })),
            pupukMerek: list.filter((i: any) => (i.Kategori || i.kategori) === "pupukMerek").map((i: any) => ({ value: i.Value || i.value, label: i.Label || i.label })),
            trukJenis: list.filter((i: any) => (i.Kategori || i.kategori) === "trukJenis").map((i: any) => ({ value: i.Value || i.value, label: i.Label || i.label })),
            trukMuatan: list.filter((i: any) => (i.Kategori || i.kategori) === "trukMuatan").map((i: any) => ({ value: i.Value || i.value, label: i.Label || i.label })),
          };
          setDropdowns(newDropdowns);
        } else {
          // Sync current default dropdowns to have seed on sheet
          await syncDropdownsWithSheets(DEFAULT_DROPDOWNS);
        }
      }
    } catch (err) {
      console.error("Gagal memuat dropdown dari Google Sheets:", err);
    }
  };

  const syncDropdownsWithSheets = async (nextDropdowns: typeof DEFAULT_DROPDOWNS) => {
    try {
      const items: any[] = [];
      Object.keys(nextDropdowns).forEach((cat) => {
        const list = (nextDropdowns as any)[cat] || [];
        list.forEach((opt: any) => {
          items.push({
            Kategori: cat,
            Value: opt.value,
            Label: opt.label,
          });
        });
      });

      const res = await fetch("/api/dropdowns/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        setDropdowns(nextDropdowns);
      } else {
        triggerToast("Gagal menyinkronkan menu pilihan ke Google Sheets.", "error");
      }
    } catch (err) {
      console.error("Error saving dropdowns:", err);
      triggerToast("Koneksi gagal menyinkronkan data drop-down.", "error");
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const body = await res.json();
        setSlipHistory(body.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat histori slip:", err);
    }
  };

  const disconnectGoogle = async () => {
    if (!window.confirm("Apakah Anda yakin ingin memutuskan integrasi dengan Google? Seluruh data akan kembali disimpan secara lokal.")) {
      return;
    }
    try {
      const res = await fetch("/api/google-disconnect", { method: "POST" });
      if (res.ok) {
        triggerToast("Google diputuskan. Beralih ke database lokal.");
        checkGoogleStatus();
        loadReports();
      }
    } catch (err) {
      triggerToast("Gagal memutuskan koneksi.", "error");
    }
  };

  const connectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await fetch("/api/google-url");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal memperoleh tautan otorisasi.");
      }
      const data = await res.json();
      const popup = window.open(data.url, "google_oauth_popup", "width=600,height=700");
      if (!popup) {
        alert("Harap izinkan popup di browser Anda untuk melanjutkan integrasi Google.");
      }
    } catch (err: any) {
      alert("Error Google OAuth: " + err.message);
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const body = await res.json();
        setReports(body.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat laporan:", err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const body = await res.json();
        setUsers(body.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat pengguna:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // --- ACTIONS ---
  const doLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginUser.trim() || !loginPass) {
      setLoginError("Mohon lengkapi username dan password.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser.trim(), password: loginPass }),
      });

      if (!res.ok) {
        setLoginError("Gagal terhubung ke modul otentikasi.");
        setIsLoggingIn(false);
        return;
      }

      const body = await res.json();
      if (body.ok) {
        const userSession: UserAccount = {
          username: body.username,
          nama: body.nama,
          role: body.role,
          grup: body.grup,
        };
        setSession(userSession);
        localStorage.setItem("gg_session", JSON.stringify(userSession));
        triggerToast(`Selamat datang, ${body.nama}!`);
      } else {
        setLoginError(body.msg || "Username atau password salah.");
      }
    } catch (err) {
      setLoginError("Gagal berinteraksi dengan server.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const doLogout = () => {
    if (window.confirm("Keluar dari aplikasi harian?")) {
      setSession(null);
      localStorage.removeItem("gg_session");
      setLoginUser("");
      setLoginPass("");
      triggerToast("Sukses keluar.");
    }
  };

  // --- IMAGE HELPERS WITH COMPRESSION ---
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<{ name: string; base64: string; type: string }[]>>) => {
    const files = e.target.files;
    if (!files) return;

    const list: { name: string; base64: string; type: string }[] = [];
    const readPromises = Array.from(files).map((file: any) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            // Set maximum dimensions for compression
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            // Maintain aspect ratio
            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // Compress as JPEG with 0.7 quality (70%)
              const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
              const base64 = dataUrl.split(",")[1];
              list.push({
                name: file.name.replace(/\.[^/.]+$/, "") + ".jpg", // Change extension to jpg
                base64: base64,
                type: "image/jpeg",
              });
            } else {
              // Fallback to original base64 if canvas context is not available
              const result = reader.result as string;
              const base64 = result.split(",")[1];
              list.push({
                name: file.name,
                base64: base64,
                type: file.type,
              });
            }
            resolve();
          };
          img.onerror = () => {
            // Fallback for non-image or loading failures
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            list.push({
              name: file.name,
              base64: base64,
              type: file.type,
            });
            resolve();
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(() => {
      setter(list);
    });
  };

  const calculateIntakeWage = (): number => {
    if (jenisSelected === "harian") {
      const rate = hJam === "8" ? 80000 : 40000;
      return rate * (parseInt(hOrang) || 1);
    }
    if (jenisSelected === "produksi") {
      const kgNum = parseFloat(pKg) || 0;
      return Math.round(kgNum * 40); // Rp 40 per kg
    }
    if (jenisSelected === "angkut") {
      const kgNum = parseFloat(aKg) || 0;
      return Math.round(kgNum * 15); // Rp 15 per kg
    }
    return 0;
  };

  const handleSaveReport = async () => {
    if (!fLokasi) {
      triggerToast("⚠ Kolom lokasi wajib diisi.", "error");
      return;
    }
    if (!jenisSelected) {
      triggerToast("⚠ Pilih salah satu jenis pekerjaan harian.", "error");
      return;
    }

    const payloadEntry: any = {
      tanggal: fTanggal,
      lokasi: fLokasi,
      grup: session?.grup || "Grup Mandor",
      jenis: jenisSelected,
      gaji: calculateIntakeWage(),
    };

    const photosPayload: any = {};

    if (jenisSelected === "harian") {
      const activeWork = hJenis === "Lainnya" ? hLainnya : hJenis;
      if (!activeWork) {
        triggerToast("⚠ Jenis pekerjaan harian wajib dipilih/diisi.", "error");
        return;
      }
      payloadEntry.pekerjaan = activeWork;
      payloadEntry.jam = hJam;
      payloadEntry.orang = hOrang;
      photosPayload.kerja = hFotoFiles;
    } else if (jenisSelected === "produksi") {
      if (!pJenis || !pMerek || !pKg) {
        triggerToast("⚠ Harap isi jenis pupuk, merek, dan total kg produksi.", "error");
        return;
      }
      payloadEntry.jenisPupuk = pJenis;
      payloadEntry.merekPupuk = pMerek;
      payloadEntry.kgProduksi = pKg;
    } else if (jenisSelected === "angkut") {
      if (!aSopir || !aNopol || !aTruk || !aMuatan || !aKg) {
        triggerToast("⚠ Harap isi data supir, nopol, truk, jenis muatan, dan total kg.", "error");
        return;
      }
      payloadEntry.sopir = aSopir;
      payloadEntry.nopol = aNopol;
      payloadEntry.jenisTruk = aTruk;
      payloadEntry.jenisMuatan = aMuatan;
      payloadEntry.merekMuatan = aMerek;
      payloadEntry.kgAngkut = aKg;
      photosPayload.sj = aSjFiles;
      photosPayload.truk = aFotoTrukFiles;
    }

    setIsSavingReport(true);
    setUploadStatusMsg(photosPayload.kerja?.length || photosPayload.sj?.length || photosPayload.truk?.length ? "⏳ Mengupload foto ke Google Drive..." : "Saving...");

    try {
      const res = await fetch("/api/reports/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry: payloadEntry,
          photos: photosPayload,
        }),
      });

      if (!res.ok) {
        throw new Error("Penyimpanan gagal diidentifikasi.");
      }

      const body = await res.json();
      if (body.ok) {
        triggerToast("✓ Laporan harian tersimpan sukses!");
        resetForm();
        loadReports();
      } else {
        triggerToast("Gagal menyimpan: " + body.msg, "error");
      }
    } catch (err) {
      triggerToast("Gagal berkomunikasi dengan server harian.", "error");
    } finally {
      setIsSavingReport(false);
      setUploadStatusMsg("");
    }
  };

  const resetForm = () => {
    setFTanggal(new Date().toISOString().split("T")[0]);
    setFLokasi("");
    setJenisSelected("");
    setHJenis("");
    setHLainnya("");
    setHJam("8");
    setHOrang("1");
    setHFotoFiles([]);
    setPJenis("");
    setPMerek("");
    setPKg("");
    setASopir("");
    setANopol("");
    setATruk("");
    setAMuatan("");
    setAMerek("");
    setAKg("");
    setASjFiles([]);
    setAFotoTrukFiles([]);
  };

  // Delete operational report item (Owner only)
  const handleDeleteReport = async (item: ReportEntry) => {
    if (!window.confirm(`Hapus laporan dari ${item.Grup} pada tanggal ${item.Tanggal}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/reports/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.ID }),
      });

      if (res.ok) {
        triggerToast("Laporan terhapus.");
        loadReports();
      } else {
        triggerToast("Gagal menghapus laporan.", "error");
      }
    } catch (err) {
      triggerToast("Komunikasi gagal.", "error");
    }
  };

  // --- MANAJEMEN USER METHODS ---
  const handleOpenUserModal = (mode: "add" | "edit", selectedUser?: UserAccount) => {
    setMMode(mode);
    if (mode === "edit" && selectedUser) {
      setMUsername(selectedUser.username);
      setMNama(selectedUser.nama);
      setMPassword(selectedUser.password || "");
    } else {
      setMUsername("");
      setMNama("");
      setMPassword("");
    }
    setMOpen(true);
  };

  const handleSaveUser = async () => {
    if (!mUsername.trim() || !mNama.trim() || !mPassword.trim()) {
      triggerToast("Semua kolom pengguna wajib diisi.", "error");
      return;
    }

    try {
      const res = await fetch("/api/user-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            username: mUsername.trim().toLowerCase(),
            nama: mNama.trim(),
            password: mPassword.trim(),
            grup: mNama.trim(), // sync group name with display name
          },
        }),
      });

      if (res.ok) {
        const body = await res.json();
        if (body.ok) {
          triggerToast(body.msg);
          setMOpen(false);
          loadUsers();
        } else {
          triggerToast("Gagal: " + body.msg, "error");
        }
      }
    } catch (err) {
      triggerToast("Gagal menghubungi server.", "error");
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!window.confirm(`Yakin ingin menghapus mandor akun @${username}?`)) return;

    try {
      const res = await fetch("/api/user-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (res.ok) {
        triggerToast("Akun dikurangi sukses.");
        loadUsers();
      } else {
        triggerToast("Gagal menghapus user.", "error");
      }
    } catch (err) {
      triggerToast("Kesalahan server.", "error");
    }
  };

  // --- DROPDOWN CRUD FUNCTIONS ---
  const handleAddOption = async (category: keyof typeof DEFAULT_DROPDOWNS) => {
    if (!newOptionValue.trim() || !newOptionLabel.trim()) {
      triggerToast("⚠ Harap isi Kode (Value) dan Label Pilihan.", "error");
      return;
    }
    const exists = dropdowns[category].some((opt) => opt.value.toLowerCase() === newOptionValue.trim().toLowerCase());
    if (exists) {
      triggerToast("⚠ Pilihan dengan Kode tersebut sudah ada.", "error");
      return;
    }
    const updatedOptions = [...dropdowns[category], { value: newOptionValue.trim(), label: newOptionLabel.trim() }];
    const nextDropdowns = { ...dropdowns, [category]: updatedOptions };
    
    await syncDropdownsWithSheets(nextDropdowns);
    setNewOptionValue("");
    setNewOptionLabel("");
    triggerToast("✓ Berhasil menambah pilihan baru ke Google Sheets!");
  };

  const handleStartEditOption = (category: keyof typeof DEFAULT_DROPDOWNS, idx: number) => {
    const item = dropdowns[category][idx];
    setEditingOptionIdx(idx);
    setEditOptionValue(item.value);
    setEditOptionLabel(item.label);
  };

  const handleSaveEditOption = async (category: keyof typeof DEFAULT_DROPDOWNS, idx: number) => {
    if (!editOptionValue.trim() || !editOptionLabel.trim()) {
      triggerToast("⚠ Nama Kode dan Label tidak boleh kosong.", "error");
      return;
    }
    const updatedOptions = [...dropdowns[category]];
    updatedOptions[idx] = { value: editOptionValue.trim(), label: editOptionLabel.trim() };
    const nextDropdowns = { ...dropdowns, [category]: updatedOptions };
    
    await syncDropdownsWithSheets(nextDropdowns);
    setEditingOptionIdx(null);
    triggerToast("✓ Berhasil menyimpan perubahan ke Google Sheets!");
  };

  const handleDeleteOption = async (category: keyof typeof DEFAULT_DROPDOWNS, idx: number) => {
    const confirm = window.confirm(`Hapus pilihan "${dropdowns[category][idx].label}" dari dropdown?`);
    if (!confirm) return;
    const updatedOptions = dropdowns[category].filter((_, i) => i !== idx);
    const nextDropdowns = { ...dropdowns, [category]: updatedOptions };
    
    await syncDropdownsWithSheets(nextDropdowns);
    triggerToast("✓ Berhasil menghapus pilihan.");
  };

  // --- FILTERS LOGIC ---
  const filteredReports = reports.filter((item) => {
    // Group restriction for mandor - they can only see their own group records
    if (session?.role === "mandor") {
      if (item.Grup !== session.grup) return false;
    } else {
      // Owner can filter by group
      if (filterGrup && item.Grup !== filterGrup) return false;
    }

    if (filterDari && item.Tanggal < filterDari) return false;
    if (filterSampai && item.Tanggal > filterSampai) return false;
    if (filterStatus && item.Status_Pembayaran !== filterStatus) return false;

    return true;
  });

  // KPI Calculations
  const totalEntries = filteredReports.length;
  const kgProduksiTotal = filteredReports
    .filter((item) => item.Jenis === "produksi")
    .reduce((acc, curr) => acc + (parseFloat(curr.Kg_Produksi || "0")), 0);
  const kgAngkutTotal = filteredReports
    .filter((item) => item.Jenis === "angkut")
    .reduce((acc, curr) => acc + (parseFloat(curr.Kg_Angkut || "0")), 0);
  const totalGajiFiltered = filteredReports.reduce((acc, curr) => acc + (parseFloat(curr.Gaji || "0")), 0);

  // Groups and dates boundaries in selection
  const uniqueGroups = Array.from(new Set(reports.map((r) => r.Grup))).filter(Boolean);

  // --- CETAK SLIP GAJI & LUNASI ---
  // The system automatically fetches unpaid salaries, aggregates them, generates a beautiful PDF, 
  // and marks the status as Lunas (Paid) so no double payment can occur in the business.
  const handleCetakSlipGajiDanLunasi = async () => {
    // Determine target group
    const targetGroup = session?.role === "mandor" ? session.grup : filterGrup;
    if (!targetGroup) {
      triggerToast("⚠ Harap pilih satu Grup / Mandor di filter sebelum mencetak slip gaji.", "error");
      return;
    }

    // Unpaid reports for this specific group
    const unpaidItems = filteredReports.filter(
      (item) => item.Grup === targetGroup && item.Status_Pembayaran !== "Lunas"
    );

    if (unpaidItems.length === 0) {
      triggerToast(`Tidak ada tunggakan gaji yang belum dibayarkan untuk ${targetGroup}.`, "error");
      return;
    }

    const confirmPrint = window.confirm(
      `Cetak Slip Gaji untuk ${targetGroup}?\n\n` +
      `- Jumlah Kerja: ${unpaidItems.length} hari kerja\n` +
      `- Total Hak Gaji: Rp ${(unpaidItems.reduce((a, b) => a + (parseFloat(b.Gaji) || 0), 0)).toLocaleString("id-ID")}\n\n` +
      `Sistem akan mengunduh slip PDF dan mengunci status pembayaran ke LUNAS secara otomatis.`
    );

    if (!confirmPrint) return;

    setIsUpdatingPayroll(true);

    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.onload = async () => {
      await generatePdfWithLogo(logoImg);
    };
    logoImg.onerror = async () => {
      console.warn("Falling back to generating PDF without corporate logo...");
      await generatePdfWithLogo(null);
    };
    logoImg.src = logoOwl;
  };

  const generatePdfWithLogo = async (imgElement: HTMLImageElement | null) => {
    const targetGroup = session?.role === "mandor" ? session.grup : filterGrup;
    const unpaidItems = filteredReports.filter(
      (item) => item.Grup === targetGroup && item.Status_Pembayaran !== "Lunas"
    );

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const primaryColor = [26, 127, 90]; // #1A7F5A - CV Gulma Gemilang Emerald
      const accentColor = [201, 150, 45]; // #C9962D - CV Gold
      const darkColor = [30, 30, 30];
      const lightGray = [240, 240, 240];

      // Header block
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 45, "F");

      // Draw Owl Logo inside header
      if (imgElement) {
        try {
          doc.addImage(imgElement, "JPEG", 15, 10, 22, 22);
        } catch (e) {
          console.warn("Failed to render logo within PDF payload: ", e);
        }
      }

      // Title CV (nested side by side from the logo template)
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("CV GULMA GEMILANG", 42, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("Produksi Pupuk Organik Premium & Jasa Distribusi Agrobisnis", 42, 24);
      doc.text("Tongas, Probolinggo, Jawa Timur - Indonesia | Telp: +62 853-8564-6533", 42, 29);

      // Label "SLIP GAJI"
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(145, 12, 53, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("SLIP PEKERJAAN", 148, 18.5);

      // Receipt general info metadata
      const docNo = `GG-${Date.now()}`;
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`No. Dokumen: ${docNo}`, 145, 27);
      doc.text(`Waktu Cetak: ${new Date().toLocaleString("id-ID")}`, 145, 31);
      doc.text("Status: LUNAS / REKONSILIASI", 145, 35);

      // Section Metadata penerima
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("INFORMASI PEROLEHAN GAJI:", 15, 56);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Penerima Upah (Grup) :", 15, 63);
      doc.setFont("helvetica", "bold");
      doc.text(targetGroup, 55, 63);

      doc.setFont("helvetica", "normal");
      doc.text("Penanggung Jawab      :", 15, 68);
      doc.text(session?.nama || "Admin Perusahaan", 55, 68);

      const dates = unpaidItems.map((u) => u.Tanggal).sort();
      const rangeText = dates.length > 0 
        ? `${dates[0]} s.d. ${dates[dates.length - 1]}`
        : "-";

      doc.text("Rentang Periode      :", 15, 73);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(rangeText, 55, 73);

      // Table line headers
      let y = 85;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, y, 180, 8, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("Tgl Kerja", 17, y + 5.5);
      doc.text("Lokasi", 37, y + 5.5);
      doc.text("Komparasi / Jenis Kerja", 57, y + 5.5);
      doc.text("Keterangan Kuantitatif", 102, y + 5.5);
      doc.text("Upah Gaji", 170, y + 5.5);

      // Populate row items
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);

      unpaidItems.forEach((row, i) => {
        // Draw stripes simple backgrounds
        if (i % 2 === 1) {
          doc.setFillColor(248, 249, 248);
          doc.rect(15, y, 180, 8, "F");
        }

        doc.text(row.Tanggal, 17, y + 5.5);
        doc.text(row.Lokasi, 37, y + 5.5);

        // Compute narrative
        let desc = "";
        let details = "";
        if (row.Jenis === "harian") {
          desc = row.Pekerjaan || "Pekerjaan Biasa";
          details = `${row.Jam} jam / ${row.Orang} orang`;
        } else if (row.Jenis === "produksi") {
          desc = `Produksi ${row.Jenis_Pupuk} (${row.Merek_Pupuk})`;
          details = `${parseFloat(row.Kg_Produksi || "0").toLocaleString("id-ID")} kg (Rp 40/kg)`;
        } else if (row.Jenis === "angkut") {
          desc = `Angkutan Colt/Truk (${row.Jenis_Muatan})`;
          details = `${parseFloat(row.Kg_Angkut || "0").toLocaleString("id-ID")} kg (Rp 15/kg)`;
        }

        doc.text(desc.substring(0, 30), 57, y + 5.5);
        doc.text(details, 102, y + 5.5);
        
        const upah = parseFloat(row.Gaji) || 0;
        doc.text(`Rp ${upah.toLocaleString("id-ID")}`, 170, y + 5.5);

        y += 8;

        // Check overflow for A4 page
        if (y > 240) {
          doc.addPage();
          y = 20;
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.rect(15, y, 180, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.text("Lanjutan Slip Gaji...", 17, y + 5.5);
          y += 8;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(40, 40, 40);
        }
      });

      // Total summary highlight box
      y += 5;
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(15, y, 195, y);

      y += 3;
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(110, y, 85, 20, "F");

      const totalHarianGaji = unpaidItems.reduce((a, b) => a + (parseFloat(b.Gaji) || 0), 0);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Total Tanggungan:", 115, y + 8);
      doc.setFontSize(10);
      doc.text("LUNAS / NIL", 115, y + 14);

      doc.setFontSize(13);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`Rp ${totalHarianGaji.toLocaleString("id-ID")}`, 148, y + 11);

      // Legal disclaimer
      y += 28;
      doc.setTextColor(90, 90, 90);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.text("* Bukti pembayaran sah yang diterbitkan otomatis secara realtime oleh sistem sinkronisasi CV Gulma Gemilang.", 15, y);
      doc.text("  Setiap perubahan data terekam aman menggunakan teknologi Google Sheets & Drive API.", 15, y + 3.5);

      // Signature area
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text("Penerima Gaji / Mandor", 25, y);
      doc.text("Pemberi Upah / Admin", 145, y);

      y += 18;
      doc.setFont("helvetica", "bold");
      doc.text(targetGroup, 25, y);
      doc.text("CV GULMA GEMILANG", 145, y);

      // Save PDF to client download
      doc.save(`Slip_Gaji_${targetGroup.replace(/\s+/g, "_")}_${fTanggal}.pdf`);

      // Save history record of this slip to Google Sheets
      const newHistoryItem = {
        id: docNo,
        grup: targetGroup,
        tanggal: new Date().toISOString(),
        gaji: totalHarianGaji,
        jumlahKerja: unpaidItems.length,
        adminPass: session?.nama || "Admin Perusahaan"
      };
      
      try {
        await fetch("/api/history/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item: newHistoryItem }),
        });
        loadHistory();
      } catch (err) {
        console.error("Gagal menyimpan histori slip ke Sheets:", err);
      }

      // 2. Call backend route to flag items as PAID (Lunas)
      const idList = unpaidItems.map((u) => u.ID);
      const res = await fetch("/api/reports/lunasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grup: targetGroup,
          idList,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        triggerToast(`✓ Status berhasil diubah menjadi Lunas (${result.count} data)!`);
        loadReports();
      } else {
        triggerToast("Gagal menyimpan tanda Lunas otomatis ke database.", "error");
      }
    } catch (err: any) {
      console.error(err);
      triggerToast("Proses pelunasan gaji mengalami kendala.", "error");
    } finally {
      setIsUpdatingPayroll(false);
    }
  };

  // --- LOGIN SCREEN ---
  if (!session) {
    return (
      <div className="min-h-screen bg-[#F5F6F4] flex flex-col items-center justify-center p-4">
        <form onSubmit={doLogin} className="bg-white rounded-2xl shadow-md border border-[#E3E5E2] p-8 w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <img 
              src={logoOwl} 
              alt="Logo CV Gulma_Gemilang" 
              className="w-20 h-20 object-contain mb-3 drop-shadow rounded-full bg-white border border-[#E3E5E2] p-1 animate-pulse" 
              referrerPolicy="no-referrer"
            />
            <h1 className="text-2xl font-bold font-serif text-[#1A7F5A] tracking-tight">CV Gulma Gemilang</h1>
            <p className="text-xs text-[#6B7068] mt-1 text-center">Sistem Laporan Hasil Kerja & Manajemen Slip Gaji Harian</p>
          </div>

          {loginError && (
            <div className="bg-red-50 text-red-600 border border-red-200 text-xs py-2.5 px-3 rounded-lg mb-4 text-center font-medium">
              {loginError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#6B7068] mb-1.5 uppercase tracking-wider">Username</label>
              <input 
                type="text" 
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="Contoh: owner atau hasan"
                className="w-full text-sm bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-4 py-3 text-[#1A1C18] focus:border-[#1A7F5A] focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6B7068] mb-1.5 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="Maukkan sandi Anda"
                className="w-full text-sm bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-4 py-3 text-[#1A1C18] focus:border-[#1A7F5A] focus:bg-white outline-none transition"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-[#1A7F5A] text-white font-semibold py-3.5 rounded-xl hover:bg-[#0F5C40] transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Masuk ke Aplikasi
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E3E5E2] text-center">
            <span className="text-[11px] text-[#6B7068] leading-relaxed block">
              <b>Saran Coba:</b> owner (Sandi: owner123) untuk Dashboard Admin atau hasan (Sandi: hasan123) untuk Mandor.
            </span>
          </div>
        </form>
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-[#F5F6F4] text-[#1A1C18] pb-12 flex flex-col font-sans">
      
      {/* HEADER BAR */}
      <header className="bg-[#1A7F5A] text-white px-4 md:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between shadow-sm sticky top-0 z-[40]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-inner border border-white/20">
            <img 
              src={logoOwl} 
              alt="Owl Logo" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="font-bold text-base md:text-lg tracking-tight font-serif">CV GULMA GEMILANG</h2>
            <p className="text-[10px] text-white/70">Sistem Laporan & Slip Gaji Terintegrasi Google</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 sm:mt-0">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/20 font-bold px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {session.role === "owner" ? "⭐ OWNER" : ` Mandor: ${session.nama}`}
            </span>
            <span className="text-xs text-white/70 font-medium hidden md:inline">
              ({session.grup})
            </span>
          </div>
          <button 
            onClick={doLogout} 
            className="text-white/80 hover:text-white bg-red-800/40 hover:bg-red-850 border border-white/20 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </div>
      </header>

      {/* GOOGLE CLOUD INTEGRATION COMPONENT */}
      <div className="bg-white border-b border-[#E3E5E2] py-2.5 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-1 w-7 h-7 bg-[#FBF3E2] rounded-lg text-[#C9962D] hidden sm:flex items-center justify-center font-bold">
            G
          </span>
          <div>
            <div className="font-semibold text-gray-800 flex items-center gap-1.5">
              <span>Status Google Integration:</span>
              {googleStatus.connected ? (
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Connected via Sheets & Drive
                </span>
              ) : (
                <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  Fallback Mode (Local Storage)
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {googleStatus.connected 
                ? "Seluruh data operasional, akun karyawan, dan berkas foto tersinkron otomatis ke Google Drive & Sheets Anda."
                : "Menggunakan penyimpanan lokal. Aktifkan otentikasi Google Workspace untuk menikmati sinkronisasi tak berbatas."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {session.role === "owner" ? (
            googleStatus.connected ? (
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <a 
                  href={googleStatus.spreadsheetUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-[11px] font-bold transition"
                >
                  <Sheet className="w-3.5 h-3.5" />
                  Buka Sheets
                </a>
                <a 
                  href={googleStatus.folderUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-[#FBF3E2] hover:bg-[#F3E3C3] text-[#A6781D] border border-[#E8C55A] px-3 py-1.5 rounded-lg text-[11px] font-bold transition"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Buka Drive
                </a>
                <button 
                  onClick={disconnectGoogle}
                  className="p-1 px-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectGoogle}
                disabled={isConnectingGoogle}
                className="w-full sm:w-auto bg-[#1A7F5A] hover:bg-[#0F5C40] text-white px-4 py-1.5 rounded-lg text-[11px] font-bold shadow-sm cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                {isConnectingGoogle ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Menghubungkan...
                  </>
                ) : (
                  <>
                    <Network className="w-3.5 h-3.5" />
                    Hubungkan Google Drive & Sheets (OAuth)
                  </>
                )}
              </button>
            )
          ) : (
            <span className="text-[11px] text-gray-400 italic">
              {googleStatus.connected ? "✓ Terhubung dengan cloud admin." : "Hubungi owner utama untuk sinkronisasi Google cloud."}
            </span>
          )}
        </div>
      </div>

      {/* SEGMENT TAB NAVIGATION BAR */}
      <div className="bg-[#FFFFFF] border-b border-[#E3E5E2] flex px-4 md:px-8 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button 
          onClick={() => setActiveTab("form")}
          className={`px-5 py-4 border-b-2 font-semibold text-xs md:text-sm flex items-center gap-2 cursor-pointer transition duration-150 ${activeTab === "form" ? "border-[#1A7F5A] text-[#1A7F5A]" : "border-transparent text-[#6B7068] hover:text-[#1A1C18]"}`}
        >
          <PlusCircle className="w-4 h-4" />
          Input Laporan Kerja
        </button>
        <button 
          onClick={() => setActiveTab("rekap")}
          className={`px-5 py-4 border-b-2 font-semibold text-xs md:text-sm flex items-center gap-2 cursor-pointer transition duration-150 ${activeTab === "rekap" ? "border-[#1A7F5A] text-[#1A7F5A]" : "border-transparent text-[#6B7068] hover:text-[#1A1C18]"}`}
        >
          <Coins className="w-4 h-4" />
          Rekap Kerja & Cetak Slip Gaji {filteredReports.filter(u => u.Status_Pembayaran !== "Lunas").length > 0 && (
            <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-[9px] font-bold">
              {filteredReports.filter(u => u.Status_Pembayaran !== "Lunas").length}
            </span>
          )}
        </button>
        
        {session.role === "owner" && (
          <button 
            onClick={() => setActiveTab("user")}
            className={`px-5 py-4 border-b-2 font-semibold text-xs md:text-sm flex items-center gap-2 cursor-pointer transition duration-150 ${activeTab === "user" ? "border-[#1A7F5A] text-[#1A7F5A]" : "border-transparent text-[#6B7068] hover:text-[#1A1C18]"}`}
          >
            <Users className="w-4 h-4" />
            Atur Grup & Mandor
          </button>
        )}
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto w-full px-4 mt-6 flex-1">
        
        {/* TAB 1: INPUT LAPORAN */}
        {activeTab === "form" && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-[#FFFFFF] border border-[#E3E5E2] rounded-2xl shadow-sm p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A7F5A] border-b border-[#E3E5E2] pb-2 mb-4 flex items-center justify-between">
                <span>Informasi Umum</span>
                <span className="font-sans font-bold normal-case text-[#6B7068] text-[11px] bg-[#E6F4EE] px-2.5 py-0.5 rounded-full">
                  Mandor: {session.nama}
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B7068] mb-1">Tanggal Kegiatan</label>
                  <input 
                    type="date"
                    value={fTanggal}
                    onChange={(e) => setFTanggal(e.target.value)}
                    className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-3 py-2 text-sm text-[#1A1C18] focus:border-[#1A7F5A] focus:bg-white outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7068] mb-1">Lokasi Kerja</label>
                  <select
                    value={fLokasi}
                    onChange={(e) => setFLokasi(e.target.value)}
                    className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-3 py-2 text-sm text-[#1A1C18] focus:border-[#1A7F5A] focus:bg-white outline-none transition"
                  >
                    <option value="">— Pilih Lokasi —</option>
                    {dropdowns.lokasi.map((opt: any, idx: number) => (
                      <option key={idx} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SELECTION CARD JENIS PEKERJAAN */}
            <div className="bg-[#FFFFFF] border border-[#E3E5E2] rounded-2xl shadow-sm p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A7F5A] border-b border-[#E3E5E2] pb-2 mb-4">
                Pilih Jenis Pekerjaan <span className="text-red-500">*</span>
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setJenisSelected("harian")}
                  className={`border-2 rounded-xl p-3 text-center transition flex flex-col items-center justify-center cursor-pointer ${jenisSelected === "harian" ? "border-[#1A7F5A] bg-[#E6F4EE]" : "border-[#E3E5E2] bg-[#F5F6F4] hover:bg-gray-50"}`}
                >
                  <Hammer className={`w-6 h-6 mb-1 ${jenisSelected === "harian" ? "text-[#1A7F5A]" : "text-[#6B7068]"}`} />
                  <span className="text-[11px] font-bold text-gray-800 tracking-tight leading-tight">Kerja Harian</span>
                </button>

                <button
                  type="button"
                  onClick={() => setJenisSelected("produksi")}
                  className={`border-2 rounded-xl p-3 text-center transition flex flex-col items-center justify-center cursor-pointer ${jenisSelected === "produksi" ? "border-[#1A7F5A] bg-[#E6F4EE]" : "border-[#E3E5E2] bg-[#F5F6F4] hover:bg-gray-50"}`}
                >
                  <Package className={`w-6 h-6 mb-1 ${jenisSelected === "produksi" ? "text-[#1A7F5A]" : "text-[#6B7068]"}`} />
                  <span className="text-[11px] font-bold text-gray-800 tracking-tight leading-tight">Produksi Pupuk</span>
                </button>

                <button
                  type="button"
                  onClick={() => setJenisSelected("angkut")}
                  className={`border-2 rounded-xl p-3 text-center transition flex flex-col items-center justify-center cursor-pointer ${jenisSelected === "angkut" ? "border-[#1A7F5A] bg-[#E6F4EE]" : "border-[#E3E5E2] bg-[#F5F6F4] hover:bg-gray-50"}`}
                >
                  <Truck className={`w-6 h-6 mb-1 ${jenisSelected === "angkut" ? "text-[#1A7F5A]" : "text-[#6B7068]"}`} />
                  <span className="text-[11px] font-bold text-gray-800 tracking-tight leading-tight">Pengangkutan</span>
                </button>
              </div>

              {/* DETAILS INPUT */}
              {jenisSelected === "harian" && (
                <div className="mt-5 pt-5 border-t border-[#E3E5E2] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#6B7068] mb-1">Aktivitas Kerja</label>
                      <select
                        value={hJenis}
                        onChange={(e) => setHJenis(e.target.value)}
                        className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-3 py-2 text-sm text-[#1A1C18] focus:border-[#1A7F5A] focus:bg-white outline-none transition"
                      >
                        <option value="">— Pilih Aktivitas —</option>
                        {dropdowns.aktivitas.map((opt: any, idx: number) => (
                          <option key={idx} value={opt.value}>{opt.label}</option>
                        ))}
                        <option value="Lainnya">Lainnya (Tulis Baru...)</option>
                      </select>
                    </div>
                    {hJenis === "Lainnya" && (
                      <div>
                        <label className="block text-xs font-medium text-[#6B7068] mb-1">Pekerjaan Lainnya</label>
                        <input 
                          type="text"
                          value={hLainnya}
                          onChange={(e) => setHLainnya(e.target.value)}
                          placeholder="Masukkan rincian..."
                          className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-3 py-2 text-sm focus:border-[#1A7F5A] outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#6B7068] mb-1">Durasi Kerja</label>
                      <select
                        value={hJam}
                        onChange={(e) => setHJam(e.target.value)}
                        className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-3 py-2 text-sm text-[#1A1C18] focus:border-[#1A7F5A] outline-none"
                      >
                        <option value="8">Full (8 jam kerja)</option>
                        <option value="4">Setengah (4 jam kerja)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7068] mb-1">Jumlah Orang</label>
                      <input 
                        type="number"
                        value={hOrang}
                        onChange={(e) => setHOrang(e.target.value)}
                        min="1"
                        className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-3 py-2 text-sm text-[#1A1C18] focus:border-[#1A7F5A] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6B7068] mb-1.5">Foto Dokumentasi Kerja (Maks 3)</label>
                    <div className="border-2 border-dashed border-[#E3E5E2] rounded-xl p-4 text-center hover:border-[#1A7F5A] transition relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={(e) => onFileChange(e, setHFotoFiles)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Camera className="w-8 h-8 text-[#6B7068] mx-auto mb-1.5" />
                      <span className="text-xs text-[#6B7068] block">Klik untuk ambil gambar / unggah foto kerja</span>
                    </div>

                    {hFotoFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 mt-3">
                        {hFotoFiles.map((file, i) => (
                          <div key={i} className="relative w-16 h-16 border border-[#E3E5E2] rounded-lg overflow-hidden">
                            <img src={`data:${file.type};base64,${file.base64}`} className="w-full h-full object-cover" alt="Preview Kerja" />
                            <span className="absolute bottom-0 right-0 bg-[#1A7F5A] text-white font-bold text-[9px] px-1 rounded-tl">
                              {i+1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {jenisSelected === "produksi" && (
                <div className="mt-5 pt-5 border-t border-[#E3E5E2] space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#6B7068] mb-1">Jenis Pupuk</label>
                      <select
                        value={pJenis}
                        onChange={(e) => setPJenis(e.target.value)}
                        className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-3 py-2 text-sm focus:border-[#1A7F5A] outline-none"
                      >
                        <option value="">— Pilih Pupuk —</option>
                        {dropdowns.pupukJenis.map((opt: any, idx: number) => (
                          <option key={idx} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7068] mb-1">Merek Bag / Karung</label>
                      <select
                        value={pMerek}
                        onChange={(e) => setPMerek(e.target.value)}
                        className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-3 py-2 text-sm focus:border-[#1A7F5A] outline-none"
                      >
                        <option value="">— Pilih Merek Bag —</option>
                        {dropdowns.pupukMerek.map((opt: any, idx: number) => (
                          <option key={idx} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6B7068] mb-1">Volume Pupuk yang Dikemas (kg)</label>
                    <input 
                      type="number"
                      value={pKg}
                      onChange={(e) => setPKg(e.target.value)}
                      placeholder="Contoh: 1500 (untuk 1.5 ton)"
                      className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-4 py-2.5 text-sm focus:border-[#1A7F5A] focus:bg-white outline-none transition"
                    />
                  </div>
                </div>
              )}

              {jenisSelected === "angkut" && (
                <div className="mt-5 pt-5 border-t border-[#E3E5E2] space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#6B7068] mb-1">Nama Supir</label>
                      <input 
                        type="text"
                        value={aSopir}
                        onChange={(e) => setASopir(e.target.value)}
                        placeholder="Supir pengangkut..."
                        className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-3 py-2 text-sm focus:border-[#1A7F5A] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7068] mb-1">Nomor Polisi Truk</label>
                      <input 
                        type="text"
                        value={aNopol}
                        onChange={(e) => setANopol(e.target.value)}
                        placeholder="N 1234 XY"
                        className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-3 py-2 text-sm focus:border-[#1A7F5A] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#6B7068] mb-1">Jenis Truk</label>
                      <select
                        value={aTruk}
                        onChange={(e) => setATruk(e.target.value)}
                        className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-2 py-2 text-xs focus:border-[#1A7F5A] outline-none"
                      >
                        <option value="">— Jenis —</option>
                        {dropdowns.trukJenis.map((opt: any, idx: number) => (
                          <option key={idx} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7068] mb-1">Muatan</label>
                      <select
                        value={aMuatan}
                        onChange={(e) => setAMuatan(e.target.value)}
                        className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-2 py-2 text-xs focus:border-[#1A7F5A] outline-none"
                      >
                        <option value="">— Muatan —</option>
                        {dropdowns.trukMuatan.map((opt: any, idx: number) => (
                          <option key={idx} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7068] mb-1">Merek</label>
                      <select
                        value={aMerek}
                        onChange={(e) => setAMerek(e.target.value)}
                        className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-2 py-2 text-xs focus:border-[#1A7F5A] outline-none"
                      >
                        <option value="">— Merek —</option>
                        {dropdowns.pupukMerek.map((opt: any, idx: number) => (
                          <option key={idx} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6B7068] mb-1">Total Berat Timbangan Jembatan (kg)</label>
                    <input 
                      type="number"
                      value={aKg}
                      onChange={(e) => setAKg(e.target.value)}
                      placeholder="Contoh: 12400 (untuk 12.4 Ton)"
                      className="w-full bg-[#F5F6F4] border-2 border-[#E3E5E2] rounded-xl px-4 py-2 text-sm focus:border-[#1A7F5A] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#6B7068] mb-1">File Surat Jalan (SJT)</label>
                      <div className="border border-dashed border-[#E3E5E2] bg-gray-50 rounded-xl p-3 text-center relative hover:border-[#1A7F5A] transition">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => onFileChange(e, setASjFiles)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <FileCheck className="w-5 h-5 text-[#6B7068] mx-auto mb-1" />
                        <span className="text-[10px] text-[#6B7068] block">Lampirkan Surat Jalan</span>
                      </div>
                      {aSjFiles.length > 0 && (
                        <div className="mt-2 flex gap-1.5 items-center">
                          <Check className="w-3.5 h-3.5 text-[#1A7F5A]" />
                          <span className="text-[10px] text-gray-600 truncate max-w-[150px]">{aSjFiles[0].name}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#6B7068] mb-1">Foto Belakang Truk (Sertakan NoPol)</label>
                      <div className="border border-dashed border-[#E3E5E2] bg-gray-50 rounded-xl p-3 text-center relative hover:border-[#1A7F5A] transition">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => onFileChange(e, setAFotoTrukFiles)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Camera className="w-5 h-5 text-[#6B7068] mx-auto mb-1" />
                        <span className="text-[10px] text-[#6B7068] block">Potret Sisi Truk</span>
                      </div>
                      {aFotoTrukFiles.length > 0 && (
                        <div className="mt-2 flex gap-1.5 items-center">
                          <Check className="w-3.5 h-3.5 text-[#1A7F5A]" />
                          <span className="text-[10px] text-gray-600 truncate max-w-[150px]">{aFotoTrukFiles[0].name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ESTIMATOR WAGE BOX */}
            {jenisSelected && (
              <div className="bg-[#E6F4EE] border border-dashed border-[#A8D8C0] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#1A7F5A]">Estimasi Ongkos / Gaji Harian</h4>
                  <p className="text-[10px] text-[#6B7068] mt-0.5">
                    {jenisSelected === "harian" && `Rp 80.000 (8 jam) / Rp 40.000 (4 jam) dikali ${hOrang} orang.`}
                    {jenisSelected === "produksi" && "Dihitung berasaskan hasil kemas: Rp 40 per kg."}
                    {jenisSelected === "angkut" && "Berdasarkan berat bersih timbangan: Rp 15 per kg."}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-[#1A7F5A] block">
                    Rp {calculateIntakeWage().toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}

            {/* SAVE FORM BUTTON */}
            <button
              onClick={handleSaveReport}
              disabled={isSavingReport || !jenisSelected}
              className="w-full bg-[#1A7F5A] hover:bg-[#0F5C40] text-white py-4 rounded-xl font-bold transition duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSavingReport ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {uploadStatusMsg || "Mengunggah..."}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Simpan Laporan Harian
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 2: REKAP OPERASIONAL & SLIP GAJI */}
        {activeTab === "rekap" && (
          <div className="space-y-6">
            
            {/* ACTION DIRECTIVE & SINKRONISASI RAPID BUTTONS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFFFFF] border border-[#E3E5E2] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="bg-[#E6F4EE] p-2 rounded-xl text-[#1A7F5A]">
                  <Printer className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-gray-800 leading-tight">Pengelolaan Gaji Borongan Mandor</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Filter data kerja mandor terlebih dahulu untuk mengaktifkan cetak slip gaji.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadReports}
                  disabled={isLoadingReports}
                  className="flex-1 sm:flex-none border border-[#A8D8C0] bg-[#E6F4EE] text-[#1A7F5A] px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition hover:bg-[#D5EFE3] cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReports ? "animate-spin" : ""}`} />
                  Segarkan
                </button>

                <button
                  onClick={handleCetakSlipGajiDanLunasi}
                  disabled={isUpdatingPayroll || isLoadingReports}
                  className="flex-1 sm:flex-none bg-[#C9962D] hover:bg-[#A87B1D] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Slip Gaji & Lunasi
                </button>
              </div>
            </div>

            {/* MASTER FILTERS BARCARD */}
            <div className="bg-[#FFFFFF] border border-[#E3E5E2] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="text-xs font-bold text-[#1A7F5A] uppercase tracking-wider mb-2">Filter Seleksi Data Laporan</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Owners can see all groups filer */}
                {session.role === "owner" ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7068] mb-1">Pilih Mandor / Grup</label>
                    <select
                      value={filterGrup}
                      onChange={(e) => setFilterGrup(e.target.value)}
                      className="w-full text-xs bg-[#F5F6F4] border border-[#E3E5E2] rounded-lg px-2.5 py-2 text-gray-800 outline-none focus:border-[#1A7F5A] focus:bg-white"
                    >
                      <option value="">Semua Mandor / Grup</option>
                      {uniqueGroups.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7068] mb-1">Pembatasan Grup</label>
                    <input 
                      type="text" 
                      value={session.grup} 
                      disabled 
                      className="w-full text-xs bg-gray-100 border border-[#E3E5E2] rounded-lg px-2.5 py-2 text-gray-500 font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B7068] mb-1">Mulai Kegiatan</label>
                  <input 
                    type="date"
                    value={filterDari}
                    onChange={(e) => setFilterDari(e.target.value)}
                    className="w-full text-xs bg-[#F5F6F4] border border-[#E3E5E2] rounded-lg px-2.5 py-2 text-gray-800 outline-none focus:border-[#1A7F5A] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B7068] mb-1">Sampai Waktu</label>
                  <input 
                    type="date"
                    value={filterSampai}
                    onChange={(e) => setFilterSampai(e.target.value)}
                    className="w-full text-xs bg-[#F5F6F4] border border-[#E3E5E2] rounded-lg px-2.5 py-2 text-gray-800 outline-none focus:border-[#1A7F5A] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B7068] mb-1">Metode Status Upah</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full text-xs bg-[#F5F6F4] border border-[#E3E5E2] rounded-lg px-2.5 py-2 text-gray-800 outline-none focus:border-[#1A7F5A] focus:bg-white"
                  >
                    <option value="">Semua Lunas / Belum</option>
                    <option value="Belum Lunas">Belum Lunas (Tunggakan)</option>
                    <option value="Lunas">Lunas (Paid)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* NUMERICAL ANALYTICS METRICS DASHBOARD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white border border-[#E3E5E2] rounded-xl p-4 shadow-xs text-center">
                <span className="text-[10px] font-bold text-[#6B7068] uppercase tracking-wider block">Total Kegiatan</span>
                <span className="text-xl md:text-2xl font-extrabold text-[#1A1C18] mt-1 block">
                  {totalEntries} <span className="text-[11px] font-normal text-[#6B7068]">entri</span>
                </span>
              </div>

              <div className="bg-white border border-[#E3E5E2] rounded-xl p-4 shadow-xs text-center border-l-4 border-l-[#1A7F5A]">
                <span className="text-[10px] font-bold text-[#1A7F5A] uppercase tracking-wider block">Produksi Pupuk</span>
                <span className="text-xl md:text-2xl font-extrabold text-[#1A7F5A] mt-1 block">
                  {kgProduksiTotal.toLocaleString("id-ID")} <span className="text-[11px] font-normal">kg</span>
                </span>
              </div>

              <div className="bg-white border border-[#E3E5E2] rounded-xl p-4 shadow-xs text-center border-l-4 border-l-[#C9962D]">
                <span className="text-[10px] font-bold text-[#C9962D] uppercase tracking-wider block">Pengangkutan Keluar</span>
                <span className="text-xl md:text-2xl font-extrabold text-[#C9962D] mt-1 block">
                  {kgAngkutTotal.toLocaleString("id-ID")} <span className="text-[11px] font-normal">kg</span>
                </span>
              </div>

              <div className="bg-[#E6F0FB] border border-[#B8D7FA] rounded-xl p-4 shadow-xs text-center">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Total Kewajiban Gaji</span>
                <span className="text-xl md:text-2xl font-extrabold text-blue-800 mt-1 block">
                  Rp {totalGajiFiltered.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* REPORTS LOGS FEED LIST */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-[#1A7F5A] text-lg">Catatan & Log Aktivitas Mandor</h3>

              {isLoadingReports ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-150">
                  <RefreshCw className="w-10 h-10 animate-spin text-[#1A7F5A] mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Membaca log operasional...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-[#E3E5E2] text-gray-500">
                  <span className="text-4xl block mb-2">📁</span>
                  <p className="text-sm font-semibold">Belum ada laporan kegiatan terekam</p>
                  <p className="text-xs text-gray-400 mt-1">Gunakan tab input atau ubah filter pencarian di atas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReports.map((item) => {
                    const upah = parseFloat(item.Gaji) || 0;
                    return (
                      <div 
                        key={item.ID}
                        className="bg-white border border-[#E3E5E2] rounded-xl shadow-xs overflow-hidden hover:border-gray-300 transition duration-150"
                      >
                        {/* Group / Mandor Header Bar */}
                        <div className="bg-[#F5F6F4] px-4 py-2.5 flex items-center justify-between border-b border-[#E3E5E2]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-emerald-800 bg-[#E6F4EE] px-2.5 py-0.5 rounded-full">
                              {item.Grup || "Mandor"}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              ID: {item.ID}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {item.Status_Pembayaran === "Lunas" ? (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Paid
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                                Unpaid
                              </span>
                            )}

                            {session.role === "owner" && (
                              <button 
                                onClick={() => handleDeleteReport(item)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Content description log */}
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            {/* Type description indicator */}
                            <div className="flex items-center gap-2">
                              {item.Jenis === "harian" && (
                                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                  <Hammer className="w-3 h-3" /> Harian Kerja
                                </span>
                              )}
                              {item.Jenis === "produksi" && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                  <Package className="w-3 h-3" /> Kemas Pupuk
                                </span>
                              )}
                              {item.Jenis === "angkut" && (
                                <span className="bg-[#FBF3E2] text-[#A6781D] text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                  <Truck className="w-3 h-3" /> Distribusi
                                </span>
                              )}

                              <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                                <Calendar className="w-3.5 h-3.5" /> {item.Tanggal}
                              </span>
                              <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                                <MapPin className="w-3.5 h-3.5" /> {item.Lokasi}
                              </span>
                            </div>

                            {/* Main Narration Body */}
                            <p className="text-sm font-semibold text-gray-800">
                              {item.Jenis === "harian" && `${item.Pekerjaan}`}
                              {item.Jenis === "produksi" && `Kemas Pupuk ${item.Jenis_Pupuk} Merek ${item.Merek_Pupuk}`}
                              {item.Jenis === "angkut" && `Sopir: ${item.Sopir} / Nopol: ${item.Nopol} (${item.Jenis_Truk})`}
                            </p>

                            {/* Additional parameters */}
                            <p className="text-xs text-gray-500">
                              {item.Jenis === "harian" && `Durasi: ${item.Jam} jam · Karyawan Terlibat: ${item.Orang} orang.`}
                              {item.Jenis === "produksi" && `Total Berat Hasil Produksi: ${parseFloat(item.Kg_Produksi || "0").toLocaleString("id-ID")} kg.`}
                              {item.Jenis === "angkut" && `Muatan: ${item.Jenis_Muatan} Merek ${item.Merek_Muatan} · Berat: ${parseFloat(item.Kg_Angkut || "0").toLocaleString("id-ID")} kg.`}
                            </p>

                            {/* PHOTO DOWNLOAD / SHARING LINKS BUTTONS */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {item.Link_Foto_Kerja && item.Link_Foto_Kerja.split(" | ").map((link, j) => (
                                <a key={j} href={link} target="_blank" rel="noreferrer" className="bg-[#E6F4EE] text-[#1A7F5A] text-[10px] font-bold px-2.5 py-1 rounded inline-flex items-center gap-1 hover:underline">
                                  <Camera className="w-3 h-3" /> Foto Kerja {j+1}
                                </a>
                              ))}
                              {item.Link_Surat_Jalan && item.Link_Surat_Jalan.split(" | ").map((link, j) => (
                                <a key={j} href={link} target="_blank" rel="noreferrer" className="bg-[#F6F6F6] text-gray-700 border border-gray-250 text-[10px] font-bold px-2.5 py-1 rounded inline-flex items-center gap-1 hover:underline">
                                  <FileCheck className="w-3 h-3" /> Surat Jalan {j+1}
                                </a>
                              ))}
                              {item.Link_Foto_Truk && item.Link_Foto_Truk.split(" | ").map((link, j) => (
                                <a key={j} href={link} target="_blank" rel="noreferrer" className="bg-[#FBF3E2] text-[#A6781D] text-[10px] font-bold px-2.5 py-1 rounded inline-flex items-center gap-1 hover:underline">
                                  <Truck className="w-3 h-3" /> Foto Truk {j+1}
                                </a>
                              ))}
                            </div>
                          </div>

                          <div className="text-right bg-gray-50 md:bg-transparent -mx-4 -mb-4 p-3 md:p-0 border-t border-gray-100 md:border-0">
                            <span className="text-[10px] text-gray-400 block font-medium">Beban Upah</span>
                            <span className="text-lg font-black text-[#1A7F5A]">
                              Rp {upah.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MANAJEMEN USER */}
        {activeTab === "user" && session.role === "owner" && (
          <div className="space-y-6 max-w-2xl mx-auto pb-12 animate-fade-in">
            {/* Sub-nav inside Tab 3 */}
            <div className="flex border-b border-[#E3E5E2] pb-0.5 whitespace-nowrap overflow-x-auto gap-2 scrollbar-none">
              <button 
                onClick={() => setAdminSubTab("users")}
                className={`pb-3.5 px-3 font-semibold text-xs transition relative cursor-pointer ${adminSubTab === "users" ? "text-[#1A7F5A] font-bold" : "text-gray-500 hover:text-gray-900"}`}
              >
                {adminSubTab === "users" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A7F5A] rounded-full" />
                )}
                Atur Akun Mandor
              </button>
              <button 
                onClick={() => setAdminSubTab("dropdowns")}
                className={`pb-3.5 px-3 font-semibold text-xs transition relative cursor-pointer ${adminSubTab === "dropdowns" ? "text-[#1A7F5A] font-bold" : "text-gray-500 hover:text-gray-900"}`}
              >
                {adminSubTab === "dropdowns" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A7F5A] rounded-full" />
                )}
                Kelola Dropdown Pilihan
              </button>
              <button 
                onClick={() => setAdminSubTab("history")}
                className={`pb-3.5 px-3 font-semibold text-xs transition relative cursor-pointer ${adminSubTab === "history" ? "text-[#1A7F5A] font-bold" : "text-gray-500 hover:text-gray-900"}`}
              >
                {adminSubTab === "history" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A7F5A] rounded-full" />
                )}
                Histori Slip GG & Rekap
              </button>
            </div>

            {/* SUB-TAB 1: MANAGING MANDOR ACCOUNTS */}
            {adminSubTab === "users" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-gray-950">Daftar Akun Mandor</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Daftar akun mandor aktif yang melapor ke sistem.</p>
                  </div>
                  
                  <button 
                    onClick={() => handleOpenUserModal("add")}
                    className="bg-[#1A7F5A] hover:bg-[#0F5C40] text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Mandor
                  </button>
                </div>

                {isLoadingUsers ? (
                  <div className="text-center py-10 bg-white rounded-2xl border border-[#E3E5E2]">
                    <RefreshCw className="w-7 h-7 animate-spin text-[#1A7F5A] mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Membaca daftar mandor...</p>
                  </div>
                ) : (
                  <div className="bg-white border border-[#E3E5E2] rounded-2xl shadow-sm divide-y divide-[#E3E5E2] overflow-hidden">
                    {users.map((item) => (
                      <div key={item.username} className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-gray-800">{item.nama}</h4>
                          <p className="text-xs text-[#6B7068] mt-0.5">
                            Username: <span className="font-semibold text-gray-700">@{item.username}</span> · Grup: <span className="font-semibold text-gray-700">{item.grup || item.nama}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.username === "owner" ? (
                            <span className="text-[10px] font-extrabold bg-[#FBF3E2] text-[#A6781D] px-2.5 py-1 rounded">
                              Primary Owner
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenUserModal("edit", item)}
                                className="p-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-[11px] font-medium transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Ganti Sandi
                              </button>
                              <button
                                onClick={() => handleDeleteUser(item.username)}
                                className="p-1.5 border border-red-150 text-red-650 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 animate-pulse" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: MANAGING DROPDOWNS */}
            {adminSubTab === "dropdowns" && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="font-serif font-bold text-lg text-gray-950">Atur Dropdown Berkas</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Kelola isi menu drop-down yang muncul pada formulir laporan operasional mandor.</p>
                </div>

                {/* Dropdown Tab Picker Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: "lokasi", label: "Lokasi Kerja" },
                    { key: "aktivitas", label: "Aktivitas Harian" },
                    { key: "pupukJenis", label: "Jenis Pupuk" },
                    { key: "pupukMerek", label: "Merek (Pupuk & Truk)" },
                    { key: "trukJenis", label: "Jenis Truk" },
                    { key: "trukMuatan", label: "Muatan Truk" }
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => {
                        setSelectedCategory(cat.key as any);
                        setEditingOptionIdx(null);
                      }}
                      className={`px-2.5 py-2 text-left rounded-xl border text-[11px] font-bold transition flex flex-col justify-between cursor-pointer ${selectedCategory === cat.key ? "border-[#1A7F5A] bg-[#E6F4EE] text-[#1A7F5A]" : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"}`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-[9px] font-normal text-gray-400 mt-1">({dropdowns[cat.key as keyof typeof DEFAULT_DROPDOWNS]?.length || 0} pilihan)</span>
                    </button>
                  ))}
                </div>

                {/* Option Entries Table List */}
                <div className="bg-white border border-[#E3E5E2] rounded-2xl shadow-sm p-5 space-y-4">
                  <div className="border-b border-[#E3E5E2] pb-2">
                    <h4 className="font-serif font-bold text-sm text-[#1A7F5A] capitalize">
                      Menu Pilihan: {selectedCategory.replace(/([A-Z])/g, " $1")}
                    </h4>
                  </div>

                  <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1">
                    {dropdowns[selectedCategory].length === 0 ? (
                      <p className="text-center py-6 text-xs text-gray-400 font-medium">Belum ada pilihan pada kategori ini.</p>
                    ) : (
                      dropdowns[selectedCategory].map((opt, idx) => {
                        const isEditing = editingOptionIdx === idx;
                        return (
                          <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            {isEditing ? (
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Value/Kode (ID)"
                                  value={editOptionValue}
                                  onChange={(e) => setEditOptionValue(e.target.value)}
                                  className="border border-[#E3E5E2] bg-[#F5F6F4] rounded-lg px-2 py-1 text-xs outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Nama Tampilan (Text)"
                                  value={editOptionLabel}
                                  onChange={(e) => setEditOptionLabel(e.target.value)}
                                  className="border border-[#E3E5E2] bg-[#F5F6F4] rounded-lg px-2 py-1 text-xs outline-none"
                                />
                              </div>
                            ) : (
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-gray-800">{opt.label}</span>
                                <span className="text-[10px] text-gray-400 ml-1.5 font-mono">({opt.value})</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1 shrink-0">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEditOption(selectedCategory, idx)}
                                    className="bg-[#1A7F5A] text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer hover:bg-[#0F5C40]"
                                  >
                                    Simpan
                                  </button>
                                  <button
                                    onClick={() => setEditingOptionIdx(null)}
                                    className="border border-gray-300 text-gray-700 px-2 py-1 rounded text-[10px] font-bold cursor-pointer hover:bg-gray-50"
                                  >
                                    Batal
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEditOption(selectedCategory, idx)}
                                    className="p-1 border border-gray-100 text-gray-500 rounded hover:bg-gray-50 cursor-pointer"
                                    title="Ubah nama"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOption(selectedCategory, idx)}
                                    className="p-1 border border-red-50 text-red-550 rounded hover:bg-red-50 cursor-pointer"
                                    title="Hapus pilihan"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Option Sub-Form */}
                  <div className="pt-4 border-t border-[#E3E5E2] space-y-2.5 bg-[#FAFBF9] -mx-5 -mb-5 p-5 rounded-b-2xl">
                    <h5 className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Tambah Pilihan Baru</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="ID/Value (Contoh: jepara_c)"
                        value={newOptionValue}
                        onChange={(e) => setNewOptionValue(e.target.value)}
                        className="bg-white border border-[#E3E5E2] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#1A7F5A]"
                      />
                      <input
                        type="text"
                        placeholder="Nama Tampilan (Contoh: Jepara Custom)"
                        value={newOptionLabel}
                        onChange={(e) => setNewOptionLabel(e.target.value)}
                        className="bg-white border border-[#E3E5E2] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#1A7F5A]"
                      />
                    </div>
                    <button
                      onClick={() => handleAddOption(selectedCategory)}
                      className="w-full bg-[#1A7F5A] hover:bg-[#0F5C40] text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Simpan Pilihan Baru ke Kategori ini
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: SLIP HISTORY LOG */}
            {adminSubTab === "history" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-gray-950">Histori Rekap Gaji (GG)</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Daftar slip gaji berkas yang berhasil diunduh dan diproses ke status Lunas.</p>
                  </div>

                  {slipHistory.length > 0 && (
                    <button
                      onClick={() => {
                        const confirm = window.confirm("Hapus semua histori rekaman cetakan lokal?");
                        if (confirm) {
                          setSlipHistory([]);
                          localStorage.removeItem("gg_slip_history");
                          triggerToast("Histori rekap dibersihkan.");
                        }
                      }}
                      className="border border-red-200 text-red-650 hover:bg-red-50 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition"
                    >
                      Dosa / Bersihkan Log
                    </button>
                  )}
                </div>

                <div className="bg-white border border-[#E3E5E2] rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
                  {slipHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <FileCheck className="w-10 h-10 mx-auto mb-2.5 opacity-40" />
                      <p className="text-xs font-semibold">Belum ada slip gaji yang dicetak.</p>
                      <p className="text-[10px] mt-0.5">Setiap pencetakan akan otomatis direkam aman di panel monitor ini.</p>
                    </div>
                  ) : (
                    slipHistory.map((item, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-gray-50 transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-[#1A7F5A]">{item.id}</span>
                            <span className="bg-[#E6F4EE] text-[#1A7F5A] text-[9px] font-bold px-1.5 py-0.5 rounded">Lunas</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Penerima: <span className="font-bold text-gray-800">{item.grup}</span> · 
                            Jumlah: <span className="font-medium text-gray-700">{item.jumlahKerja} baris kerja</span>
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Dicetak: {new Date(item.tanggal).toLocaleString("id-ID")} oleh {item.adminPass}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block font-medium">Total Terbayar</span>
                          <span className="text-[13px] font-bold text-gray-900 block">Rp {item.gaji?.toLocaleString("id-ID") || "0"}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL EDIT / TAMBAH USER */}
      {mOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[999] animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#E3E5E2] max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="font-serif font-black text-base text-[#1A7F5A]">
              {mMode === "add" ? "Tambah Mandor Baru" : "Edit Kata Sandi Mandor"}
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Username (Untuk Login)</label>
                <input 
                  type="text"
                  value={mUsername}
                  onChange={(e) => setMUsername(e.target.value)}
                  disabled={mMode === "edit"}
                  placeholder="Contoh: agus"
                  className="w-full text-xs bg-[#F5F6F4] border border-[#E3E5E2] rounded-lg px-3 py-2 text-gray-800 focus:bg-white outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Mandor / Kelompok</label>
                <input 
                  type="text"
                  value={mNama}
                  onChange={(e) => setMNama(e.target.value)}
                  placeholder="Contoh: Grup Mandor Agus"
                  className="w-full text-xs bg-[#F5F6F4] border border-[#E3E5E2] rounded-lg px-3 py-2 text-gray-800 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kata Sandi Akun</label>
                <input 
                  type="text"
                  value={mPassword}
                  onChange={(e) => setMPassword(e.target.value)}
                  placeholder="Ganti sandi login..."
                  className="w-full text-xs bg-[#F5F6F4] border border-[#E3E5E2] rounded-lg px-3 py-2 text-gray-800 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveUser}
                className="flex-1 bg-[#1A7F5A] hover:bg-[#0F5C40] text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Simpan Akun
              </button>
              <button
                onClick={() => setMOpen(false)}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SYSTEM TOAST */}
      <div 
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-full px-5 py-3 shadow-lg flex items-center gap-2.5 text-xs font-medium z-[999] transition duration-300 pointer-events-none ${showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ background: toastType === "error" ? "#D94F3D" : "#1A7F5A" }}
      >
        <span>{toastMsg}</span>
      </div>

    </div>
  );
}
