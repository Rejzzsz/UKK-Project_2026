import { useState, useEffect, } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LogOut,
  AlertCircle,
  Eye,
  X,
  UserPlus,
  FolderPlus,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";

const API_BASE_URL = "http://localhost:1337";

const DashboardGuru = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [allAspirasiRaw, setAllAspirasiRaw] = useState([]);
  const [filteredAspirasi, setFilteredAspirasi] = useState([]);
  const [activeStatus, setActiveStatus] = useState(null);
  
  // State untuk form update & filter
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [proofPhotoFile, setProofPhotoFile] = useState(null);
  const [proofPhotoPreview, setProofPhotoPreview] = useState("");
  
  // State untuk memuat detail lengkap
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailLaporanFotoUrl, setDetailLaporanFotoUrl] = useState("");
  const [detailBuktiPerbaikanUrl, setDetailBuktiPerbaikanUrl] = useState("");
  
  const [guruData, setGuruData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // State Modal CRUD Siswa & Kategori
  const [showKategoriModal, setShowKategoriModal] = useState(false);
  const [kategoriName, setKategoriName] = useState("");
  const [showSiswaModal, setShowSiswaModal] = useState(false);
  const [siswaData, setSiswaData] = useState({
    nama: "",
    nis: "",
    kelas: "",
    email: "",
    password: ""
  });
  
  // State Hapus Siswa & Aspirasi
  const [showDeleteSiswaModal, setShowDeleteSiswaModal] = useState(false);
  const [allSiswaForDelete, setAllSiswaForDelete] = useState([]);
  const [isLoadingSiswaDelete, setIsLoadingSiswaDelete] = useState(false);
  const [siswaDirectoryByNis, setSiswaDirectoryByNis] = useState({});
  const [siswaDirectoryByUsername, setSiswaDirectoryByUsername] = useState({});
  const [siswaDeleteCandidate, setSiswaDeleteCandidate] = useState(null);
  const [deletingSiswaId, setDeletingSiswaId] = useState(null);

  const token = localStorage.getItem("token");
  const userType = localStorage.getItem("userType");

  const [stats, setStats] = useState([
    { label: "Pending", count: 0, status: "menunggu", description: "Menunggu Review" },
    { label: "Proses", count: 0, status: "proses", description: "Sedang Ditangani" },
    { label: "Selesai", count: 0, status: "selesai", description: "Telah Terselesaikan" },
  ]);

  // Update Waktu
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Proteksi route & ambil data awal
  useEffect(() => {
    if (userType !== "guru") {
      navigate("/");
      return;
    }
    const guru = localStorage.getItem("guru");
    if (guru) setGuruData(JSON.parse(guru));
    fetchData();
  }, [userType, navigate]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const possibleEndpoints = [
        // Strapi v5 format
        `${API_BASE_URL}/api/input-aspirasis?sort=createdAt:desc`,
        `${API_BASE_URL}/api/input-aspirasis`,
        // Backup
        `${API_BASE_URL}/api/input-aspirasi`,
        `${API_BASE_URL}/api/aspirasis`,
      ];

      let res;
      let workingEndpoint = "";

      for (const endpoint of possibleEndpoints) {
        try {
          console.log("Mencoba endpoint:", endpoint);
          res = await axios.get(endpoint, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          workingEndpoint = endpoint;
          console.log("✅ Endpoint berhasil:", endpoint);
          break;
        } catch (err) {
          console.error("❌ Endpoint gagal:", endpoint, err.response?.status, err.message);
          continue;
        }
      }

      if (!res) throw new Error("No working endpoint found");

      localStorage.setItem("aspirasi_endpoint", workingEndpoint.split("?")[0]);
      const allData = res.data.data || [];
      console.log("📊 Total aspirasi loaded:", allData.length);
      console.log("🔍 Data status breakdown:", allData.map(d => ({ nis: d.attributes?.nis || d.nis, status: d.attributes?.status_aspirasi || d.status_aspirasi || d.attributes?.status || d.status })));
      setAllAspirasiRaw(allData);

      // Fetch directory siswa
      try {
        const siswaDirectoryEndpoints = [
          `${API_BASE_URL}/api/siswas?pagination[pageSize]=500`,
          `${API_BASE_URL}/api/siswas`,
        ];

        let siswaRes = null;
        for (const endpoint of siswaDirectoryEndpoints) {
          try {
            console.log("Mencoba siswa endpoint:", endpoint);
            siswaRes = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            console.log("✅ Siswa endpoint berhasil:", endpoint);
            break;
          } catch (err) { 
            console.error("❌ Siswa endpoint gagal:", endpoint, err.response?.status);
            continue; 
          }
        }

        if (siswaRes) {
          const rows = siswaRes.data?.data || [];
          const byNis = {};
          const byUsername = {};

          for (const row of rows) {
            const attrs = row.attributes || row;
            const siswaRel = attrs || {};
            const nis = String(siswaRel.nis || "").trim();
            const kelas = String(siswaRel.kelas || "-").trim();
            const nama = String(siswaRel.nama || siswaRel.nama_siswa || "-").trim();

            const userRel = siswaRel.user?.data || siswaRel.user || null;
            const username = String(userRel?.username || "").trim();

            const normalized = { nama: nama || "-", nis: nis || "-", kelas: kelas || "-" };

            if (nis) byNis[nis] = normalized;
            if (username) byUsername[username] = normalized;
          }

          setSiswaDirectoryByNis(byNis);
          setSiswaDirectoryByUsername(byUsername);
        }
      } catch (dirErr) {
        setSiswaDirectoryByNis({});
        setSiswaDirectoryByUsername({});
      }

      // Update count per status
      const countByStatus = (target) => {
        return allData.filter((asp) => {
          const item = asp.attributes || asp;
          const statusVal = item.status_aspirasi || item.status;
          return statusVal?.toLowerCase() === target.toLowerCase();
        }).length;
      };

      setStats((prev) => prev.map((s) => ({ ...s, count: countByStatus(s.status) })));
    } catch (err) {
      console.error("❌ Error di fetchData:", err);
      const errorMsg = "Gagal memuat data aspirasi. Pastikan API Strapi berjalan dan collection ada.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const getMediaUrl = (mediaField) => {
    const mediaData = mediaField?.data || mediaField || null;
    const normalizedMedia = Array.isArray(mediaData) ? mediaData[0] : mediaData;
    const rawUrl = mediaData?.url || mediaData?.attributes?.url || "";
    if (!rawUrl && normalizedMedia) {
      const normalizedUrl = normalizedMedia?.url || normalizedMedia?.attributes?.url || "";
      if (normalizedUrl) {
        return normalizedUrl.startsWith("http") ? normalizedUrl : `${API_BASE_URL}${normalizedUrl}`;
      }
    }
    if (!rawUrl) return "";
    return rawUrl.startsWith("http") ? rawUrl : `${API_BASE_URL}${rawUrl}`;
  };

  const resolveSiswaIdentity = (item) => {
    const relRaw = item?.siswa?.data || item?.siswa || null;
    const siswaRel = relRaw?.attributes || relRaw || {};

    let nama = String(siswaRel?.nama || siswaRel?.nama_siswa || item?.nama || "-").trim();
    let nis = String(siswaRel?.nis || item?.nis || "-").trim();
    let kelas = String(siswaRel?.kelas || item?.kelas || "-").trim();

    const userRel = siswaRel?.user?.data || siswaRel?.user || null;
    const username = String(userRel?.username || "").trim();
    const nisKey = String(nis || "").trim();
    const siswaFromDirectory = siswaDirectoryByNis[nisKey] || siswaDirectoryByUsername[username] || siswaDirectoryByUsername[nisKey] || null;

    if (siswaFromDirectory) {
      nama = siswaFromDirectory.nama || nama;
      nis = siswaFromDirectory.nis || nis;
      kelas = siswaFromDirectory.kelas || kelas;
    }

    return { nama: nama || "-", nis: nis || "-", kelas: kelas || "-" };
  };

  const applyAspirasiFilters = (data, status) => {
    const filteredByStatus = data.filter((asp) => {
      const item = asp.attributes || asp;
      const statusVal = item.status_aspirasi || item.status;
      return statusVal?.toLowerCase() === status.toLowerCase();
    });

    const filteredByDate = filteredByStatus.filter((asp) => {
      const createdAt = (asp.attributes || asp).createdAt;
      if (!createdAt) return false;
      const dateObj = new Date(createdAt);

      if (filterMode === "date" && filterDate) {
        const target = new Date(filterDate);
        return (
          dateObj.getFullYear() === target.getFullYear() &&
          dateObj.getMonth() === target.getMonth() &&
          dateObj.getDate() === target.getDate()
        );
      }

      if (filterMode === "month" && filterMonth) {
        const [year, month] = filterMonth.split("-").map(Number);
        return (dateObj.getFullYear() === year && dateObj.getMonth() + 1 === month);
      }
      return true;
    });

    return filteredByDate.sort((a, b) => {
      const dateA = new Date((a.attributes || a).createdAt);
      const dateB = new Date((b.attributes || b).createdAt);
      return dateB - dateA;
    });
  };

  const refreshFilteredAspirasi = (statusToUse = activeStatus) => {
    if (!statusToUse) return;
    setFilteredAspirasi(applyAspirasiFilters(allAspirasiRaw, statusToUse));
  };

  const handleFilterStatus = (status) => {
    if (activeStatus === status) {
      setActiveStatus(null);
      setFilteredAspirasi([]);
    } else {
      setActiveStatus(status);
      setFilteredAspirasi(applyAspirasiFilters(allAspirasiRaw, status));
    }
  };

  useEffect(() => {
    if (activeStatus) {
      refreshFilteredAspirasi(activeStatus);
    }
  }, [filterMode, filterDate, filterMonth, allAspirasiRaw]);

  // AKSI: Create Kategori
  const handleCreateKategori = async () => {
    if (!kategoriName.trim()) {
      toast.error("Nama kategori tidak boleh kosong!");
      return;
    }
    const loadingToast = toast.loading("Membuat kategori...");
    try {
      await axios.post("http://localhost:1337/api/kategoris", { data: { ket_kategori: kategoriName } }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      toast.success("Kategori berhasil dibuat!", { id: loadingToast });
      setKategoriName("");
      setShowKategoriModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Gagal membuat kategori!", { id: loadingToast });
    }
  };

  // AKSI: Create Siswa
  const handleCreateSiswa = async () => {
    const { nama, nis, kelas, email, password } = siswaData;
    if (!nama.trim() || !nis.trim() || !kelas.trim() || !email.trim() || !password.trim()) {
      toast.error("Semua field harus diisi!");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Format email tidak valid!");
      return;
    }
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter!");
      return;
    }

    const loadingToast = toast.loading("Membuat akun siswa...");
    try {
      const siswaRes = await axios.post("http://localhost:1337/api/siswas", { data: { nis: parseInt(nis), kelas: kelas } }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      const newSiswaId = siswaRes.data.data.id;

      const userRes = await axios.post("http://localhost:1337/api/auth/local/register", { username: nama, email: email, password: password });
      const newUserId = userRes.data.user.id;
      const newToken = userRes.data.jwt;

      await axios.put(`http://localhost:1337/api/users/${newUserId}`, { siswa: newSiswaId }, { headers: { Authorization: `Bearer ${newToken}` } });

      toast.success("Akun siswa berhasil dibuat!", { id: loadingToast });
      setSiswaData({ nama: "", nis: "", kelas: "", email: "", password: "" });
      setShowSiswaModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Gagal membuat akun siswa!", { id: loadingToast });
    }
  };

  // AKSI: Update Aspirasi
  const handleUpdate = async (id) => {
    if (!id) {
      toast.error("ID Aspirasi tidak valid!");
      return;
    }
    let loadingToast;
    try {
      if (!feedback.trim() && !proofPhotoFile) {
        toast.error("Isi feedback atau unggah foto bukti perbaikan.");
        return;
      }
      loadingToast = toast.loading("Sedang memproses...");

      let uploadedProofPhotoId = null;
      if (proofPhotoFile) {
        const uploadData = new FormData();
        uploadData.append("files", proofPhotoFile);
        const uploadRes = await axios.post(`${API_BASE_URL}/api/upload`, uploadData, { headers: { Authorization: `Bearer ${token}` } });
        uploadedProofPhotoId = uploadRes.data?.[0]?.id || null;
        console.log("📸 Foto berhasil upload dengan ID:", uploadedProofPhotoId);
      }

      const baseEndpoint = localStorage.getItem("aspirasi_endpoint") || "http://localhost:1337/api/input-aspirasis";
      const updateUrl = `${baseEndpoint}/${id}`;
      const statusValue = (newStatus || "proses").toLowerCase();
      const baseData = { feedback: feedback, status_aspirasi: statusValue };

      const payload = uploadedProofPhotoId
        ? { data: { ...baseData, foto_bukti: [uploadedProofPhotoId] } }
        : { data: baseData };

      console.log("🔄 Update URL:", updateUrl);
      console.log("📤 Payload:", JSON.stringify(payload));
      const response = await axios.put(updateUrl, payload, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      console.log("✅ Update success:", response.data);
      const updateSuccess = true;

      if (!updateSuccess) throw new Error("Semua kombinasi URL dan payload gagal. Cek console untuk detail error.");

      toast.success(`Aspirasi berhasil diperbarui.`, { id: loadingToast });
      fetchData();
      setSelectedDetail(null);
      setFeedback("");
      setNewStatus("");
      setProofPhotoFile(null);
      setProofPhotoPreview("");
    } catch (err) {
      console.error("❌ Full error:", err);
      toast.error(err?.response?.data?.error?.message || err.message || "Data tidak ditemukan atau akses ditolak.", { id: loadingToast });
    }
  };

  const onSelectProofPhoto = (file) => {
    if (!file) {
      setProofPhotoFile(null);
      setProofPhotoPreview("");
      return;
    }
    if (!file.type?.startsWith("image/")) {
      toast.error("File harus berupa gambar.");
      return;
    }
    setProofPhotoFile(file);
    setProofPhotoPreview(URL.createObjectURL(file));
  };



  // AKSI: Fetch data siswa untuk Hapus
  const fetchSiswaForDeleteModal = async () => {
    setIsLoadingSiswaDelete(true);
    try {
      const res = await axios.get("http://localhost:1337/api/siswas?pagination[page]=1&pagination[pageSize]=200&sort=nis:asc", { headers: { Authorization: `Bearer ${token}` } });
      const rows = (res.data?.data || []).map((item) => {
        const attrs = item.attributes || item;
        return { id: item.id, nis: String(attrs?.nis || "").trim(), kelas: String(attrs?.kelas || "-").trim() };
      });
      setAllSiswaForDelete(rows);
    } catch (error) {
      toast.error("Gagal memuat daftar siswa.");
      setAllSiswaForDelete([]);
    } finally {
      setIsLoadingSiswaDelete(false);
    }
  };

  const handleDeleteSiswaAccount = async (siswaItem) => {
    const { nis, id: siswaId } = siswaItem;
    if (!nis || !siswaId) return;
    const loadingToast = toast.loading("Mencari akun siswa...");
    setDeletingSiswaId(String(siswaId));
    try {
      const usersRes = await axios.get("http://localhost:1337/api/users?populate=siswa", { headers: { Authorization: `Bearer ${token}` } });
      const targetUsers = (usersRes.data || []).filter((u) => {
        const sRel = u.siswa;
        const sId = (typeof sRel === "number" && sRel) || sRel?.id || sRel?.data?.id;
        return String(u.username) === nis || String(sId) === String(siswaId);
      });

      let deletedCount = 0;
      for (const user of targetUsers) {
        try {
          await axios.delete(`http://localhost:1337/api/users/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
          deletedCount++;
        } catch (e) {}
      }
      await axios.delete(`http://localhost:1337/api/siswas/${siswaId}`, { headers: { Authorization: `Bearer ${token}` } });
      setAllSiswaForDelete((prev) => prev.filter((item) => item.id !== siswaId));
      toast.success(deletedCount > 0 ? `Data siswa dan ${deletedCount} akun user berhasil dihapus.` : "Data siswa berhasil dihapus.", { id: loadingToast });
    } catch (error) {
      toast.error("Gagal menghapus akun siswa.", { id: loadingToast });
    } finally {
      setDeletingSiswaId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("guru");
    localStorage.removeItem("userType");
    toast.success("Logout berhasil.");
    navigate("/");
  };

  const handleViewDetail = async (aspirasi) => {
    setSelectedDetail(aspirasi);
    setIsLoadingDetail(true);
    setDetailLaporanFotoUrl("");
    setDetailBuktiPerbaikanUrl("");
    setFeedback((aspirasi.attributes || aspirasi).feedback || "");
    setNewStatus((aspirasi.attributes || aspirasi).status_aspirasi || "menunggu");

    try {
      const id = aspirasi?.documentId || aspirasi?.id;
      if (!id) return;
      const base = localStorage.getItem("aspirasi_endpoint") || "http://localhost:1337/api/input-aspirasis";
      const res = await axios.get(`${base}/${id}?publicationState=preview&populate=*`, { headers: { Authorization: `Bearer ${token}` } });
      const fullData = res.data?.data?.attributes || res.data?.data;
      if (fullData) {
        setDetailLaporanFotoUrl(getMediaUrl(fullData.foto_bukti || fullData.foto));
        setDetailBuktiPerbaikanUrl(getMediaUrl(fullData.foto_bukti_perbaikan || fullData.foto_bukti || fullData.foto));
      }
    } catch (err) {
      // fallback jika gagal fetch data full
      const attrs = aspirasi.attributes || aspirasi;
      setDetailLaporanFotoUrl(getMediaUrl(attrs.foto_bukti || attrs.foto));
      setDetailBuktiPerbaikanUrl(getMediaUrl(attrs.foto_bukti_perbaikan || attrs.foto_bukti || attrs.foto));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "pending" || s === "menunggu") return "bg-amber-100 text-amber-700 border-amber-300";
    if (s === "proses") return "bg-blue-100 text-blue-700 border-blue-300";
    if (s === "selesai") return "bg-green-100 text-green-700 border-green-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,900&display=swap');
        * { font-family: 'DM Sans', sans-serif; font-weight: 500; }
        .font-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.03em; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
        .animate-slideUp { animation: slideUp 0.35s ease-out; }
        .animate-slideDown { animation: slideDown 0.35s ease-out; }
      `}</style>

      {/* ── HEADER ── */}
      <header className="relative overflow-hidden bg-zinc-950 px-6 py-10 text-white lg:px-16">
        <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
       
        <div className="container mx-auto flex flex-col justify-between gap-8 md:flex-row md:items-start relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/15 mb-3">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-white/80">Mode Admin</span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl leading-none uppercase">
              DASHBOARD <span className="text-blue-500">GURU</span>
            </h1>
            <p className="mt-2 text-zinc-400 text-sm font-medium">
              {time.toLocaleDateString("id-ID", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>

            {/* Admin Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setShowSiswaModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold transition-all uppercase tracking-wider">
                <UserPlus size={14} /> Tambah Siswa
              </button>
              <button onClick={() => setShowKategoriModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold transition-all uppercase tracking-wider">
                <FolderPlus size={14} /> Kategori
              </button>
              <button 
                onClick={() => { fetchSiswaForDeleteModal(); setShowDeleteSiswaModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
              >
                <Trash2 size={14} /> Hapus Siswa
              </button>
            </div>
          </div>

          {/* TOMBOL LOGOUT LANGSUNG */}
          <div className="relative flex-shrink-0 self-start mt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-rose-400 hover:bg-rose-500/20 transition-colors uppercase font-bold text-sm tracking-wider"
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="container mx-auto px-6 py-12 lg:px-16">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-4 font-bold text-zinc-400">Memuat data...</p>
          </div>
        ) : (
          <>
            {/* ── STATS CARDS ── */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {stats.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleFilterStatus(s.status)}
                  className={`group relative overflow-hidden rounded-[2rem] p-8 text-left transition-all duration-300 ${
                    activeStatus === s.status
                      ? "bg-zinc-950 text-white ring-4 ring-blue-500 shadow-2xl"
                      : "bg-white shadow-sm border-2 border-zinc-100 hover:border-zinc-300"
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-widest mb-2 text-zinc-400">{s.label}</p>
                  <h2 className="font-display text-5xl" style={{ lineHeight: 1 }}>{s.count}</h2>
                  <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-zinc-500">{s.description}</p>
                </button>
              ))}
            </div>

            {/* ── FILTERED LIST ── */}
            {activeStatus && (
              <div className="mt-12 animate-slideDown">
                <div className="flex flex-col gap-4 border-b border-zinc-200 pb-4 mb-8 md:flex-row md:items-center md:justify-between">
                  <h3 className="font-display text-3xl text-zinc-400">
                    STATUS: <span className="text-zinc-950">{activeStatus.toUpperCase()}</span>
                  </h3>
                  
                  {/* Filter Waktu (Logic Guru dipertahankan) */}
                  <div className="flex flex-wrap items-center gap-3">
                    <select 
                      value={filterMode} 
                      onChange={(e) => setFilterMode(e.target.value)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 outline-none"
                    >
                      <option value="all">Semua Waktu</option>
                      <option value="date">Per Tanggal</option>
                      <option value="month">Per Bulan</option>
                    </select>
                    {filterMode === "date" && (
                      <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700" />
                    )}
                    {filterMode === "month" && (
                      <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700" />
                    )}
                    <button
                      onClick={() => { setActiveStatus(null); setFilteredAspirasi([]); }}
                      className="text-sm font-bold text-zinc-400 hover:text-rose-500 ml-2"
                    >
                      TUTUP ?
                    </button>
                  </div>
                </div>

                {filteredAspirasi.length === 0 ? (
                  <div className="text-center py-16">
                    <AlertCircle className="mx-auto text-zinc-200 mb-4" size={48} />
                    <p className="text-zinc-400 font-medium">Belum ada laporan di kategori ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {filteredAspirasi.map((item) => {
                      const data = item.attributes || item;
                      const siswaInfo = resolveSiswaIdentity(data);
                      const kat = data.kategori?.data?.attributes?.ket_kategori || data.kategori?.ket_kategori || "Umum";

                      return (
                        <div key={item.id} className="group flex flex-col sm:flex-row sm:items-center gap-5 rounded-[2rem] bg-white p-6 shadow-sm border-2 border-zinc-100 hover:border-zinc-900 transition-all relative">
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-zinc-900 truncate text-sm">{siswaInfo.nama}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">NIS: {siswaInfo.nis} • KLS: {siswaInfo.kelas}</p>
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getStatusBadge(data.status_aspirasi || data.status)}`}>
                                {data.status_aspirasi || data.status}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black border border-zinc-200 text-zinc-600 bg-zinc-50 uppercase">
                                {kat}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 sm:ml-auto">
                            <button onClick={() => handleViewDetail(item)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white uppercase hover:bg-zinc-800 transition-colors">
                              <Eye size={14} /> Detail
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── MODAL: DETAIL & UPDATE (Sesuai gaya Siswa tapi ada form update) ── */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setSelectedDetail(null)}>
          <div className="w-full max-w-3xl rounded-[2.5rem] bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="bg-zinc-950 text-white px-8 py-7 flex items-center justify-between flex-shrink-0">
              <h2 className="font-display text-3xl leading-none">KELOLA ASPIRASI</h2>
              <button onClick={() => setSelectedDetail(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-8 space-y-6">
              {(() => {
                const item = selectedDetail.attributes || selectedDetail;
                const status = item.status_aspirasi || item.status || "menunggu";
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Kolom Kiri: Detail Laporan */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Status Saat Ini:</span>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase ${getStatusBadge(status)}`}>{status}</span>
                      </div>
                      
                      <div className="bg-slate-50 rounded-2xl p-5 border border-zinc-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Tanggal Laporan</p>
                        <p className="font-bold text-zinc-900 text-sm">{formatDate(item.createdAt)}</p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-5 border border-zinc-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Keterangan Laporan</p>
                        <p className="text-zinc-700 leading-relaxed text-sm">{item.ket || "Tidak ada keterangan"}</p>
                      </div>

                      {detailLaporanFotoUrl && (
                        <div className="bg-slate-50 rounded-2xl p-5 border border-zinc-100 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Foto Laporan</p>
                          <img src={detailLaporanFotoUrl} alt="Bukti" className="w-full max-h-48 object-cover rounded-xl mx-auto" />
                        </div>
                      )}

                      {detailBuktiPerbaikanUrl && (
                        <div className="bg-slate-50 rounded-2xl p-5 border border-zinc-100 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Foto Hasil Perbaikan</p>
                          <img src={detailBuktiPerbaikanUrl} alt="Bukti Perbaikan" className="w-full max-h-48 object-cover rounded-xl mx-auto" />
                        </div>
                      )}
                    </div>

                    {/* Kolom Kanan: Form Update */}
                    <div className="bg-white border-2 border-zinc-100 rounded-3xl p-6 shadow-sm">
                      <h3 className="font-display text-2xl mb-5 text-zinc-900">UPDATE PROGRESS</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Ubah Status</label>
                          <select 
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-zinc-700 outline-none focus:border-zinc-400"
                          >
                            <option value="menunggu">MENUNGGU</option>
                            <option value="proses">PROSES</option>
                            <option value="selesai">SELESAI</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Tanggapan (Feedback)</label>
                          <textarea 
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Tuliskan tindakan yang telah/akan dilakukan..."
                            className="w-full rounded-xl border border-zinc-200 bg-slate-50 px-4 py-3 text-sm font-medium text-zinc-700 outline-none focus:border-zinc-400 min-h-[100px]"
                          ></textarea>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Foto Hasil Perbaikan</label>
                          <label className="cursor-pointer bg-slate-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 px-4 py-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-colors min-h-[120px]">
                            <ImageIcon size={20} className="text-zinc-400" />
                            {proofPhotoFile ? (
                              <span className="text-green-600">{proofPhotoFile.name}</span>
                            ) : detailBuktiPerbaikanUrl ? (
                              <span className="text-zinc-600">Gunakan foto perbaikan saat ini atau upload baru</span>
                            ) : (
                              <span>Upload Foto Baru</span>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => onSelectProofPhoto(e.target.files[0])} />
                          </label>

                          {proofPhotoPreview && (
                            <div className="mt-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Preview Foto Terpilih</p>
                              <img src={proofPhotoPreview} alt="Preview Bukti" className="w-full max-h-48 object-cover rounded-xl" />
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => {
                            const actualId = selectedDetail?.documentId || selectedDetail?.id;
                            console.log("📋 IDs available:", { id: selectedDetail?.id, documentId: selectedDetail?.documentId, using: actualId });
                            handleUpdate(actualId);
                          }}
                          className="w-full mt-2 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider transition-colors"
                        >
                          Simpan Pembaruan
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: TAMBAH KATEGORI ── */}
      {showKategoriModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={() => setShowKategoriModal(false)}>
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 relative animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-3xl mb-6">TAMBAH KATEGORI</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Nama Kategori</label>
                <input 
                  type="text" 
                  value={kategoriName}
                  onChange={(e) => setKategoriName(e.target.value)}
                  placeholder="Misal: Fasilitas Kelas"
                  className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-zinc-400"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowKategoriModal(false)} className="flex-1 py-3 text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl uppercase">Batal</button>
              <button onClick={handleCreateKategori} className="flex-1 py-3 text-sm font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl uppercase">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: TAMBAH SISWA ── */}
      {showSiswaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={() => setShowSiswaModal(false)}>
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 relative animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-3xl mb-6">BUAT AKUN SISWA</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Nama Siswa</label>
                <input type="text" value={siswaData.nama} onChange={(e) => setSiswaData({...siswaData, nama: e.target.value})} className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">NIS</label>
                <input type="text" value={siswaData.nis} onChange={(e) => setSiswaData({...siswaData, nis: e.target.value})} className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Kelas</label>
                <input type="text" value={siswaData.kelas} onChange={(e) => setSiswaData({...siswaData, kelas: e.target.value})} className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Email</label>
                <input type="email" value={siswaData.email} onChange={(e) => setSiswaData({...siswaData, email: e.target.value})} className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Password</label>
                <input type="password" value={siswaData.password} onChange={(e) => setSiswaData({...siswaData, password: e.target.value})} className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowSiswaModal(false)} className="flex-1 py-3 text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl uppercase">Batal</button>
              <button onClick={handleCreateSiswa} className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl uppercase">Daftarkan</button>
            </div>
          </div>
        </div>
      )}



      {/* ── MODAL: HAPUS SISWA LIST & CONFIRM ── */}
      {showDeleteSiswaModal && !siswaDeleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={() => setShowDeleteSiswaModal(false)}>
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 relative animate-slideUp flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
               <h2 className="font-display text-3xl">DAFTAR SISWA (HAPUS)</h2>
               <button onClick={() => setShowDeleteSiswaModal(false)} className="p-2 bg-zinc-100 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2 space-y-3">
              {isLoadingSiswaDelete ? (
                <p className="text-center text-zinc-400 py-10 font-bold">Memuat...</p>
              ) : allSiswaForDelete.length === 0 ? (
                <p className="text-center text-zinc-400 py-10 font-bold">Tidak ada data siswa.</p>
              ) : (
                allSiswaForDelete.map((siswa) => (
                  <div key={siswa.id} className="flex justify-between items-center p-4 border border-zinc-200 rounded-2xl bg-slate-50">
                    <div>
                      <p className="font-bold text-zinc-900">NIS: {siswa.nis}</p>
                      <p className="text-[10px] font-black uppercase text-zinc-500">KLS: {siswa.kelas}</p>
                    </div>
                    <button 
                      onClick={() => setSiswaDeleteCandidate(siswa)}
                      className="px-4 py-2 bg-rose-100 text-rose-600 text-xs font-bold uppercase rounded-xl hover:bg-rose-200"
                    >
                      Hapus
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {siswaDeleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 text-center animate-slideUp">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5 text-rose-500">
                <AlertCircle size={32} />
              </div>
              <h3 className="font-display text-2xl mb-2">HAPUS AKUN SISWA?</h3>
              <p className="text-sm text-zinc-500 mb-8 font-medium">Akun beserta user login NIS {siswaDeleteCandidate.nis} akan dihapus permanen.</p>
              <div className="flex gap-3">
                 <button onClick={() => setSiswaDeleteCandidate(null)} className="flex-1 py-3 text-sm font-bold text-zinc-600 bg-zinc-100 rounded-xl uppercase">Batal</button>
                 <button onClick={() => { handleDeleteSiswaAccount(siswaDeleteCandidate); setSiswaDeleteCandidate(null); }} className="flex-1 py-3 text-sm font-bold text-white bg-rose-600 rounded-xl uppercase">Ya, Hapus</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default DashboardGuru;