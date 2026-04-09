import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const HERO_IMAGE = "/50103880-14.jpg";

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:ital,wght@0,700;1,700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.innerHTML = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
      .fu { animation: fadeUp 0.8s ease both; }
      .fu1 { animation: fadeUp 0.8s ease 0.12s both; }
      .fu2 { animation: fadeUp 0.8s ease 0.24s both; }
      .fu3 { animation: fadeUp 0.8s ease 0.36s both; }
      .fr { animation: fadeRight 0.9s ease 0.3s both; }
      .lp-btn-primary:hover { background: #1a4fd6 !important; transform: translateY(-2px) !important; box-shadow: 0 8px 32px rgba(37,99,235,0.35) !important; }
      .lp-btn-ghost:hover { background: #eff4ff !important; border-color: #2563eb !important; color: #2563eb !important; }
      .lp-feature-card:hover { box-shadow: 0 8px 32px rgba(37,99,235,0.10) !important; transform: translateY(-3px) !important; }
      .lp-nav-cta:hover { background: #1a4fd6 !important; }
      .lp-cta-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important; }
      @media (max-width: 900px) {
        .lp-hero-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
        .lp-hero-img { display: none !important; }
        .lp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .lp-feat-grid { grid-template-columns: 1fr !important; }
        .lp-nav { padding: 1rem 1.5rem !important; }
        .lp-section { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  const features = [
    { icon: "/icons/pengaduan.png", title: "Pengaduan Terstruktur", body: "Laporan dengan kategori jelas – fasilitas, pembelajaran, administrasi, atau lingkungan." },
    { icon: "/icons/identitas.png", title: "Identitas Terlindungi", body: "Data pribadi siswa dijaga sepenuhnya. Laporan diproses secara aman." },
    { icon: "/icons/statistic.png", title: "Dashboard Guru & Admin", body: "Panel khusus untuk memantau, merespon, dan menindaklanjuti laporan." },
    { icon: "/icons/status.png", title: "Status Real-time", body: 'Pantau perkembangan laporan langsung dari dashboard secara transparan.' },
    { icon: "/icons/aspirasi.png", title: "Aspirasi & Saran", body: "Siswa bisa menyampaikan ide dan saran untuk kemajuan sekolah." },
    { icon: "/icons/aksesmudah.png", title: "Akses Mudah & Cepat", body: "Cukup gunakan NIS atau email untuk masuk. Antarmuka sederhana." },
  ];

  const steps = [
    { num: "01", title: "Masuk ke Akun Kamu", body: "Login menggunakan NIS (siswa) atau email (guru/admin)." },
    { num: "02", title: "Buat Laporan atau Aspirasi", body: "Pilih kategori, tulis deskripsi, dan sertakan bukti jika ada." },
    { num: "03", title: "Laporan Diteruskan", body: "Sistem otomatis mengarahkan laporan kepada pihak berwenang." },
    { num: "04", title: "Pantau Respons", body: "Ikuti perkembangan laporan dan dapatkan pembaruan keputusan." },
  ];

  const C = {
    blue: "#2563eb", blueDark: "#1d4ed8", blueLight: "#eff6ff",
    blueMid: "#dbeafe", text: "#0f172a", muted: "#64748b",
    border: "#e2e8f0", white: "#ffffff", bg: "#f8faff",
  };

  const sectionHeading = {
    fontFamily: "'Fraunces', serif",
    fontSize: "clamp(2rem, 4vw, 2.8rem)",
    fontWeight: 700, color: C.text, letterSpacing: "-0.5px",
  };

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: "hidden", minHeight: "100vh" }}>
      
      {/* Bagian Hero (Jika kamu ingin menambahkan konten hero silakan di sini) */}
      <header style={{ padding: "3rem 3rem 4rem", minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <div className="lp-hero-grid" style={{
          maxWidth: 1200, margin: "0 auto",
          display: "grid", gridTemplateColumns: "1.1fr 0.9fr",
          gap: "2.5rem", alignItems: "center",
        }}>
          <div>
            <h1 className="fu" style={{ ...sectionHeading, fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)", fontWeight: 800 }}>
              Layanan Pengaduan
              <br />
              & Aspirasi Siswa
            </h1>
            <p className="fu1" style={{ color: C.muted, marginTop: "1rem", fontWeight: 600 }}>
              Suarakan pendapatmu untuk sekolah yang lebih baik.
            </p>
            <button
              className="lp-btn-primary fu2"
              onClick={() => navigate('/login')}
              style={{ marginTop: "2rem", padding: "0.9rem 2rem", background: C.blue, color: C.white, border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", transition: "0.3s" }}
            >
              Mulai Melapor
            </button>
          </div>
          <div className="lp-hero-img fr" style={{ position: "relative" }}>
            <div style={{
              position: "absolute", inset: -18,
              background: `radial-gradient(circle at 70% 30%, ${C.blueMid} 0%, transparent 70%)`,
              borderRadius: 20, zIndex: 0,
            }} />
            <div style={{
              position: "relative", zIndex: 1,
              borderRadius: 18, overflow: "hidden",
              boxShadow: "0 22px 60px rgba(37,99,235,0.18)",
              border: `3px solid ${C.white}`,
              aspectRatio: "4/3",
            }}>
              <img
                src={HERO_IMAGE}
                alt="Siswa di sekolah"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="lp-section" style={{ padding: "6rem 3rem", background: C.white }} id="fitur">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            
            <h2 style={sectionHeading}>Dirancang untuk Kebutuhan Siswa</h2>
          </div>
          <div className="lp-feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
            {features.map((f, i) => (
              <div key={i} className="lp-feature-card" style={{
                background: C.bg, borderRadius: 16, padding: "2rem",
                border: `1px solid ${C.border}`, transition: "all 0.25s",
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: C.blueLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  <img src={f.icon} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "1rem", color: C.text, marginBottom: "0.5rem" }}>{f.title}</h3>
                <p style={{ fontSize: "0.85rem", lineHeight: 1.65, color: C.muted }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="lp-section" style={{ padding: "6rem 3rem", background: C.blueLight, borderTop: `1px solid ${C.blueMid}` }} id="cara-kerja">
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
         
            <h2 style={sectionHeading}>Empat Langkah Menuju Perubahan</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: C.border, borderRadius: 16, overflow: "hidden" }}>
            {steps.map((step, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "72px 1fr",
                gap: "1.5rem", padding: "2rem", background: C.white, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: C.blue,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Fraunces', serif", fontWeight: 700, color: C.white, fontSize: "1.1rem",
                }}>{step.num}</div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "1rem", color: C.text, marginBottom: "0.4rem" }}>{step.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: C.muted, lineHeight: 1.65 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{
        padding: "2rem 3rem", borderTop: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "1rem", background: C.white,
      }}>
        <span style={{ fontWeight: 800, color: C.blue, fontSize: "0.95rem" }}>Pengaduan Sekolah</span>
        <div style={{ fontSize: "0.72rem", color: C.muted }}>
          © 2026 · Transparansi · Akuntabilitas · Perubahan
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;





