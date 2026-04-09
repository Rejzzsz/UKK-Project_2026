import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Send, MapPin, FileText, Tag, CheckCircle, Sparkles, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:1337';

const AspirasiForm = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [siswaData, setSiswaData] = useState(null);
  const [formData, setFormData] = useState({
    lokasi: '',
    kategori: '',
    ket: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotoAspirasiFile, setFotoAspirasiFile] = useState(null);
  const [fotoAspirasiPreview, setFotoAspirasiPreview] = useState('');

  // --- LOGIC AREA (ASLI) ---
  useEffect(() => {
    const storedSiswaData = localStorage.getItem('siswaData');
    if (storedSiswaData) {
      const parsedData = JSON.parse(storedSiswaData);
      setSiswaData(parsedData);
    } else {
      toast.error('Silakan login kembali.');
      navigate('/');
    }

    axios.get(`${API_BASE_URL}/api/kategoris`)
      .then(res => setCategories(res.data.data))
      .catch(err => {
        console.error(err);
        toast.error('Gagal memuat kategori.');
      });
  }, [navigate]);

  const onSelectFotoAspirasi = (file) => {
    if (!file) {
      setFotoAspirasiFile(null);
      setFotoAspirasiPreview('');
      return;
    }
    if (!file.type?.startsWith('image/')) {
      toast.error('File harus berupa gambar.');
      return;
    }
    setFotoAspirasiFile(file);
    setFotoAspirasiPreview(URL.createObjectURL(file));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const rawToken = localStorage.getItem('token');    const token = rawToken && rawToken !== 'undefined' && rawToken !== 'null' ? rawToken : null;
    let uploadedImageId = null;
    if (!token) {
      toast.error('Sesi login habis. Silakan login ulang.');
      setIsSubmitting(false);
      navigate('/login');
      return;
    }

    // 1. Upload foto dulu jika ada (dan ambil ID-nya)
    if (fotoAspirasiFile) {
      const uploadData = new FormData();
      uploadData.append('files', fotoAspirasiFile);
      const uploadRes = await axios.post(`${API_BASE_URL}/api/upload`, uploadData, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      uploadedImageId = uploadRes.data?.[0]?.id || null;
    }

    const kategoriId = formData.kategori ? Number(formData.kategori) : null;
    const siswaId = siswaData?.id;

    const payload = {
      data: {
        nis: String(siswaData?.nis || ""),
        kelas: String(siswaData?.kelas || ""),
        lokasi: formData.lokasi,
        ket: formData.ket,
        status_aspirasi: "menunggu",
        publishedAt: new Date().toISOString(),
        kategori: kategoriId,
        siswa: siswaId,
        ...(uploadedImageId ? { foto_bukti: uploadedImageId } : {}),
      },
    };

    console.log("Sending payload:", payload);

    await axios.post(`${API_BASE_URL}/api/input-aspirasis`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    toast.success('Aspirasi berhasil dikirim!');
    setTimeout(() => navigate('/dashboard'), 1000);
  } catch (error) {
    console.error('Create aspirasi error:', error?.response?.data || error);
    const serverMsg =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      null;
    toast.error(serverMsg ? `Gagal: ${serverMsg}` : 'Gagal mengirim aspirasi');
  } finally {
    setIsSubmitting(false);
  }
};

  // --- UI AREA (DESIGN V4 STYLE) ---
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-900/5 rounded-full blur-[120px]"></div>
      </div>

      <main className="relative z-10 container mx-auto px-6 py-6 max-w-2xl">
        {/* Navigation */}
        <button
          onClick={() => navigate('/dashboard')}
          className="group mb-6 inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-2.5 font-bold shadow-sm transition-all hover:bg-zinc-950 hover:text-white"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Kembali
        </button>

        {/* Hero Section */}
        <div className="mb-6">
          <h1 className="text-4xl font-black tracking-tighter italic md:text-6xl" style={{ fontFamily: 'Bebas Neue' }}>
            NEW <span className="text-blue-600">REPORT</span>
          </h1>
          <p className="mt-2 text-zinc-500 font-medium">Sampaikan keluhan atau saran Anda untuk sekolah yang lebih baik.</p>

          {siswaData && (
            <div className="mt-6 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              <span className="rounded-lg bg-zinc-200 px-3 py-1 text-zinc-600">NIS: {siswaData?.nis || siswaData?.attributes?.nis}</span>
              <span className="rounded-lg bg-zinc-200 px-3 py-1 text-zinc-600">Kelas: {siswaData?.kelas || siswaData?.attributes?.kelas}</span>
            </div>
          )}
        </div>

        {/* Main Form Card */}
        <div className="rounded-[2.5rem] bg-white p-4 shadow-lg shadow-zinc-200/40 md:p-6 border border-zinc-100">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Input Lokasi */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                <MapPin size={14} className="text-blue-600" /> Lokasi Kejadian
              </label>
              <input
                type="text"
                required
                value={formData.lokasi}
                placeholder="Misal: Kantin, Lab Komputer 1, atau Lapangan..."
                className="w-full rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-3 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
              />
            </div>

            {/* Row Kategori */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                <Tag size={14} className="text-blue-600" /> Kategori Aspirasi
              </label>
              <select
                required
                value={formData.kategori}
                className="w-full appearance-none rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-3 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:bg-white cursor-pointer"
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
              >
                <option value="">Pilih Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.attributes?.ket_kategori || cat.ket_kategori || 'Kategori Umum'}
                  </option>
                ))}
              </select>
            </div>

            {/* Keterangan */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                <FileText size={14} className="text-blue-600" /> Penjelasan Detail
              </label>
              <textarea
                required
                value={formData.ket}
                rows="4"
                placeholder="Ceritakan apa yang terjadi secara lengkap..."
                className="w-full rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-3 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white resize-none"
                onChange={(e) => setFormData({ ...formData, ket: e.target.value })}
              ></textarea>
            </div>

            {/* Image Upload Area */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                <ImageIcon size={14} className="text-blue-600" /> Foto Bukti (Opsional)
              </label>

              {!fotoAspirasiPreview ? (
                <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-zinc-200 bg-zinc-50 transition-all hover:border-blue-500 hover:bg-blue-50">
                  <ImageIcon size={32} className="text-zinc-300 group-hover:text-blue-500" />
                  <span className="mt-2 text-sm font-bold text-zinc-500">Upload Gambar</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onSelectFotoAspirasi(e.target.files?.[0])} />
                </label>
              ) : (
                <div className="relative group overflow-hidden rounded-[2rem] border-2 border-zinc-100">
                  <img src={fotoAspirasiPreview} className="h-40 w-full object-cover" alt="Preview" />
                  <button
                    type="button"
                    onClick={() => onSelectFotoAspirasi(null)}
                    className="absolute top-4 right-4 rounded-full bg-zinc-950/80 p-2 text-white backdrop-blur-md transition-transform hover:scale-110"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.lokasi || !formData.kategori || !formData.ket}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-blue-600 py-3 text-base font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1 hover:bg-zinc-950 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
              ) : (
                <>
                  KIRIM LAPORAN <Send size={20} className="group-hover:translate-x-2 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>

          </form>
        </div>

      </main>

      {/* Font & Animation Setup */}
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@500;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: slideUp 0.6s ease-out; }
      `}</style>
    </div>
  );
};

export default AspirasiForm;


