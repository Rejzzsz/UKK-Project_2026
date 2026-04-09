import { useNavigate } from "react-router-dom";
import {
  Plus,
  LogOut,
  AlertCircle,
  ArrowRight,
  Eye,
  X,
  MapPin,
  FileText,
  Calendar,
  Info,
  User,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:1337";

const DashboardSiswa = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [allAspirasiRaw, setAllAspirasiRaw] = useState([]);
  const [filteredAspirasi, setFilteredAspirasi] = useState([]);
  const [activeStatus, setActiveStatus] = useState(null);
  const [filterMode, setFilterMode] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [siswaData, setSiswaData] = useState(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  const [stats, setStats] = useState([
    {
      label: "Pending",
      count: 0,
      status: "menunggu",
      description: "Menunggu Review",
    },
    {
      label: "Proses",
      count: 0,
      status: "proses",
      description: "Sedang Ditangani",
    },
    {
      label: "Selesai",
      count: 0,
      status: "selesai",
      description: "Telah Terselesaikan",
    },
  ]);

  const normalizeSiswa = (raw) => {
    const rawValue = raw?.data || raw;
    const attrs = rawValue?.attributes || rawValue || {};
    return {
      id: rawValue?.id || attrs?.id || null,
      documentId: rawValue?.documentId || attrs?.documentId || null,
      nis: attrs?.nis || "",
      kelas: attrs?.kelas || "",
      nama: attrs?.nama || "Siswa",
      foto_profile: attrs?.foto_profile || null,
    };
  };

  const getProfileImageUrl = (foto) => {
    const media =
      foto?.data?.attributes ||
      foto?.data ||
      foto?.attributes ||
      foto ||
      null;
    const rawUrl = media?.url;
    if (!rawUrl) return "";
    return rawUrl.startsWith("http") ? rawUrl : `${API_BASE_URL}${rawUrl}`;
  };

  const getMediaUrl = (mediaField) => {
    const mediaData = mediaField?.data || mediaField || null;
    const normalizedMedia = Array.isArray(mediaData) ? mediaData[0] : mediaData;
    const rawUrl = mediaData?.url || mediaData?.attributes?.url || "";
    if (!rawUrl && normalizedMedia) {
      const normalizedUrl =
        normalizedMedia?.url || normalizedMedia?.attributes?.url || "";
      if (normalizedUrl)
        return normalizedUrl.startsWith("http")
          ? normalizedUrl
          : `${API_BASE_URL}${normalizedUrl}`;
    }
    if (!rawUrl) return "";
    return rawUrl.startsWith("http") ? rawUrl : `${API_BASE_URL}${rawUrl}`;
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const storedSiswaData = localStorage.getItem("siswaData");
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    const parsedUser =
      storedUser && storedUser !== "undefined" && storedUser !== "null"
        ? JSON.parse(storedUser)
        : null;

    const mergeWithUser = (profile) => {
      if (!parsedUser) return profile;
      return {
        ...profile,
        nama: profile?.nama && profile.nama !== "Siswa" ? profile.nama : parsedUser?.username || "Siswa",
      };
    };

    const fetchSiswaProfile = async () => {
      if (!parsedUser?.id || !storedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/siswas?filters[user][id]=${parsedUser.id}&populate=*`,
          { headers: { Authorization: `Bearer ${storedToken}` } }
        );
        const first = res?.data?.data?.[0] || null;
        const normalized = mergeWithUser(normalizeSiswa(first));
        setSiswaData(normalized);
        if (normalized.nis) {
          fetchAspirasiData(normalized.nis);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Gagal ambil profil siswa", err);
        setLoading(false);
      }
    };

    if (storedSiswaData && storedSiswaData !== "undefined" && storedSiswaData !== "null") {
      try {
        const parsed = JSON.parse(storedSiswaData);
        const normalized = mergeWithUser(normalizeSiswa(parsed));
        setSiswaData(normalized);
        if (normalized.nis) {
          fetchAspirasiData(normalized.nis);
        } else {
          fetchSiswaProfile();
        }
      } catch (e) {
        console.error("Gagal membaca data login", e);
        localStorage.removeItem("siswaData");
        navigate("/");
      }
    } else {
      if (storedSiswaData === "undefined" || storedSiswaData === "null") {
        localStorage.removeItem("siswaData");
      }
      fetchSiswaProfile();
    }
    return () => clearInterval(timer);
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAspirasiData = async (nisLogin) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/input-aspirasis?populate=*`
      );
      const allData = response.data.data || [];
      const myAspirasi = allData.filter((asp) => {
        const item = asp.attributes || asp;
        return String(item.nis || "") === String(nisLogin || "");
      });
      setAllAspirasiRaw(myAspirasi);
      setStats((prev) =>
        prev.map((s) => ({
          ...s,
          count: myAspirasi.filter((asp) => {
            const item = asp.attributes || asp;
            const statusVal = item.status_aspirasi || item.status;
            return statusVal?.toLowerCase() === s.status.toLowerCase();
          }).length,
        }))
      );
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterStatus = (status) => {
    if (activeStatus === status) {
      setActiveStatus(null);
      setFilteredAspirasi([]);
      setFilterMode("all");
      setFilterDate("");
      setFilterMonth("");
    } else {
      setActiveStatus(status);
      setFilterMode("all");
      setFilterDate("");
      setFilterMonth("");
      setFilteredAspirasi(applyAspirasiFilters(allAspirasiRaw, status, "all", "", ""));
    }
  };

  const applyAspirasiFilters = (data, status, mode = filterMode, date = filterDate, month = filterMonth) => {
    const filteredByStatus = data.filter((asp) => {
      const item = asp.attributes || asp;
      const statusVal = item.status_aspirasi || item.status;
      return statusVal?.toLowerCase() === status.toLowerCase();
    });

    const filteredByDate = filteredByStatus.filter((asp) => {
      const item = asp.attributes || asp;
      const createdAt = item.createdAt ? new Date(item.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return false;

      if (mode === "date" && date) {
        const target = new Date(date);
        return (
          createdAt.getFullYear() === target.getFullYear() &&
          createdAt.getMonth() === target.getMonth() &&
          createdAt.getDate() === target.getDate()
        );
      }

      if (mode === "month" && month) {
        const [year, monthIndex] = month.split("-").map(Number);
        return createdAt.getFullYear() === year && createdAt.getMonth() + 1 === monthIndex;
      }

      return true;
    });

    return filteredByDate.sort((a, b) => {
      const dateA = new Date((a.attributes || a).createdAt);
      const dateB = new Date((b.attributes || b).createdAt);
      return dateB - dateA;
    });
  };

  useEffect(() => {
    if (!activeStatus) return;
    const filtered = applyAspirasiFilters(allAspirasiRaw, activeStatus);
    setFilteredAspirasi(filtered);
  }, [activeStatus, filterMode, filterDate, filterMonth, allAspirasiRaw]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "menunggu") return "bg-amber-100 text-amber-700 border-amber-300";
    if (s === "proses") return "bg-blue-100 text-blue-700 border-blue-300";
    if (s === "selesai") return "bg-green-100 text-green-700 border-green-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("siswaData");
    localStorage.removeItem("userType");
    navigate("/");
  };

  if (!siswaData) return null;

  const profileImageUrl = getProfileImageUrl(siswaData?.foto_profile);

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
              <span className="text-xs font-semibold text-white/80">Sistem Online</span>
            </div>

            {/* Mengecilkan judul utama dari 8xl ke 6xl */}
            <h1 className="font-display text-5xl md:text-6xl leading-none uppercase">
              DASHBOARD <span className="text-blue-500">SISWA</span>
            </h1>
            <p className="mt-2 text-zinc-400 text-sm font-medium">
              {time.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            <div className="mt-5 inline-flex flex-wrap items-center gap-5 bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-3">
              <div className="w-11 h-11 rounded-xl border-2 border-white/50 overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Foto profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-zinc-400" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Nama</p>
                <p className="font-bold text-white leading-none">{siswaData.nama}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">NIS</p>
                <p className="font-bold text-white leading-none font-mono">{siswaData.nis || "-"}</p>
              </div>
            </div>
          </div>

          <div className="relative flex-shrink-0 self-start mt-1" ref={accountMenuRef}>
            <button
              onClick={() => setAccountMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-zinc-600" />
                )}
              </div>
              <span className="font-semibold text-sm text-zinc-900">{siswaData.nama}</span>
              <ChevronDown size={16} className={`text-zinc-600 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {accountMenuOpen && (
              <div className="absolute right-0 mt-3 w-48 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl z-50 animate-slideDown">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-4 text-sm font-bold text-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="container mx-auto px-6 py-12 lg:px-16">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-4 font-bold text-zinc-400">Memuat data...</p>
          </div>
        ) : (
          <>
            {/* ── STATS CARDS (Gambar dihapus, Font dikecilkan) ── */}
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
                  <p className="text-xs font-black uppercase tracking-widest mb-2 text-zinc-400">
                    {s.label}
                  </p>
                  {/* Mengecilkan angka statistik dari 7xl ke 5xl */}
                  <h2 className="font-display text-5xl" style={{ lineHeight: 1 }}>
                    {s.count}
                  </h2>
                  <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    {s.description}
                  </p>
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
      <input
        type="date"
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
      />
    )}

    {filterMode === "month" && (
      <input
        type="month"
        value={filterMonth}
        onChange={(e) => setFilterMonth(e.target.value)}
        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
      />
    )}

    <button
      onClick={() => {
        setFilterMode("all");
        setFilterDate("");
        setFilterMonth("");
      }}
      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
    >
      Reset
    </button>
    <button
      onClick={() => {
        setActiveStatus(null);
        setFilteredAspirasi([]);
        setFilterMode("all");
        setFilterDate("");
        setFilterMonth("");
      }}
      className="text-sm font-bold text-zinc-400 hover:text-rose-500"
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
                      return (
                        <div key={item.id} className="group flex items-center gap-5 rounded-[2rem] bg-white p-6 shadow-sm border-2 border-zinc-100 hover:border-zinc-900 transition-all">
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-900 group-hover:bg-zinc-950 group-hover:text-white transition-colors">
                            <FileText size={22} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getStatusBadge(data.status_aspirasi || data.status)}`}>
                                {data.status_aspirasi || data.status}
                              </span>
                            </div>
                            <h5 className="font-bold text-zinc-900 truncate">{data.lokasi || "Lokasi tidak diisi"}</h5>
                          </div>
                          <button onClick={() => setSelectedDetail(item)} className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white uppercase hover:bg-zinc-900 transition-colors">
                            <Eye size={14} /> Detail
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── CTA ── */}
            <section className="mt-20 rounded-[3rem] bg-zinc-950 p-12 text-center text-white lg:p-20 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="font-display text-5xl md:text-6xl uppercase leading-none">
                  ADA KELUHAN <span className="text-blue-500">BARU?</span>
                </h2>
                <p className="mt-4 text-zinc-400 text-sm font-medium max-w-md mx-auto leading-relaxed">
                  Sampaikan aspirasimu sekarang untuk perbaikan bersama.
                </p>
                <button
                  onClick={() => navigate("/buat-aspirasi")}
                  className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-white px-10 py-5 font-black text-zinc-900 hover:bg-zinc-900 hover:text-white transition-all text-sm uppercase"
                >
                  <Plus size={20} /> Buat Laporan <ArrowRight size={20} />
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      {/* ── DETAIL MODAL ── */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setSelectedDetail(null)}>
          <div className="w-full max-w-2xl rounded-[2.5rem] bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="bg-zinc-950 text-white px-8 py-7 flex items-center justify-between flex-shrink-0">
              <h2 className="font-display text-3xl leading-none">DETAIL ASPIRASI</h2>
              <button onClick={() => setSelectedDetail(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-8 space-y-5">
              {(() => {
                const item = selectedDetail.attributes || selectedDetail;
                const status = item.status_aspirasi || item.status || "pending";
                const fotoLaporanUrl = getMediaUrl(item.foto_bukti) || getMediaUrl(item.foto);
                return (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Status:</span>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase ${getStatusBadge(status)}`}>{status}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-2xl p-5 border border-zinc-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Lokasi Kejadian</p>
                        <p className="font-bold text-zinc-900">{item.lokasi || "Tidak disebutkan"}</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-5 border border-zinc-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Tanggal Laporan</p>
                        <p className="font-bold text-zinc-900 text-sm">{formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-5 border border-zinc-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Keterangan Detail</p>
                      <p className="text-zinc-700 leading-relaxed text-sm">{item.ket || "Tidak ada keterangan"}</p>
                    </div>
                    {fotoLaporanUrl && (
                      <div className="bg-slate-50 rounded-2xl p-5 border border-zinc-100 text-center">
                        <img src={fotoLaporanUrl} alt="Bukti" className="w-full max-h-64 object-cover rounded-xl mx-auto" />
                      </div>
                    )}
                    {item.feedback && (
                      <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1">Feedback Guru</p>
                        <p className="text-zinc-700 text-sm">{item.feedback}</p>
                      </div>
                    )}
<button onClick={() => setSelectedDetail(null)} className="w-full py-4 rounded-xl bg-zinc-950 text-white font-bold text-sm uppercase">Tutup</button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSiswa;

                 










