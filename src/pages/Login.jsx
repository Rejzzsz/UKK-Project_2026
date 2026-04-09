import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

const AuthPage = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState("siswa");
  const [formData, setFormData] = useState({
    identifier: "", 
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Handler untuk Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (loginType === "siswa") {
        const nisValue = formData.identifier.trim();
        
        // Validasi: NIS harus berupa angka
        if (!/^\d+$/.test(nisValue)) {
          throw new Error("NIS harus berupa angka!");
        }

        const siswaSearch = await axios.get(
          `http://localhost:1337/api/siswas?filters[nis][$eq]=${encodeURIComponent(nisValue)}&populate=user`
        );

        const siswaRecord = siswaSearch?.data?.data?.[0];
        const directUser = siswaRecord?.attributes?.user || siswaRecord?.user;
        const siswaUser =
          directUser?.data?.attributes ||
          directUser?.attributes ||
          directUser ||
          null;

        if (!siswaRecord || !siswaUser) {
          throw new Error("NIS tidak ditemukan");
        }

        const identifier = siswaUser.username || siswaUser.email;
        if (!identifier) {
          throw new Error("Akun siswa tidak lengkap");
        }

        const response = await axios.post(
          "http://localhost:1337/api/auth/local",
          {
            identifier,
            password: formData.password,
          },
        );

        const userDetail = await axios.get(
          "http://localhost:1337/api/users/me?populate=siswa",
          {
            headers: { Authorization: `Bearer ${response.data.jwt}` },
          },
        );

        const siswaPayload =
          userDetail?.data?.siswa ??
          userDetail?.data?.siswa?.data ??
          userDetail?.data?.siswa?.attributes ??
          userDetail?.data ??
          response?.data?.user ??
          null;

        localStorage.setItem("token", response.data.jwt);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("siswaData", JSON.stringify(siswaPayload));
        localStorage.setItem("userType", "siswa");

        toast.success(`Selamat datang, ${response.data.user.username}!`);
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        // Login Guru - validasi bahwa input bukan NIS
        const guruInput = formData.identifier.trim();
        
        // Validasi: guru tidak boleh login dengan NIS (semua angka)
        if (/^\d+$/.test(guruInput)) {
          throw new Error("Periksa kembali Email dan Password anda.");
        }

        // Cek apakah input adalah email atau username
        if (!guruInput.includes("@") && guruInput.length < 3) {
          throw new Error("Masukkan email atau username yang valid!");
        }

        // Login Guru cukup lewat auth/local agar tidak tergantung collection "gurus"
        const authRes = await axios.post("http://localhost:1337/api/auth/local", {
          identifier: formData.identifier,
          password: formData.password,
        });

        let guruProfile = authRes.data.user;
        try {
          const userDetail = await axios.get("http://localhost:1337/api/users/me", {
            headers: { Authorization: `Bearer ${authRes.data.jwt}` },
          });
          guruProfile = userDetail.data || authRes.data.user;
        } catch (profileErr) {
          console.warn("Gagal ambil detail guru dari /users/me, pakai data auth.", {
            status: profileErr?.response?.status,
            message: profileErr?.message,
          });
        }

        const guruName = guruProfile?.nama || guruProfile?.username || "Guru";
        localStorage.setItem("token", authRes.data.jwt);
        localStorage.setItem("user", JSON.stringify(authRes.data.user));
        localStorage.setItem("userType", "guru");
        localStorage.setItem("guru", JSON.stringify(guruProfile));

        toast.success(`Selamat datang, Bapak/Ibu ${guruName}!`);
        setTimeout(() => navigate("/dashboard-guru"), 1500);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err?.message || "Gagal masuk. Periksa kembali NIS/Email dan Password anda.";
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden">
      <button
        onClick={() => navigate("/")}
        className="absolute left-6 top-6 rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800"
      >
        Back
      </button>

      {/* Main Container */}
      <div className="relative w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Form Login */}
          <div className="p-8 flex flex-col justify-center">
            {/* Header Form */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-1">
                Selamat Datang
              </h2>
              <p className="text-gray-500 text-center text-sm">
                Masuk sebagai Siswa atau Guru
              </p>
            </div>

            {/* Login Type Selector */}
            <div className="mb-5">
              <div className="flex gap-3">
                <button
                  onClick={() => setLoginType("siswa")}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                    loginType === "siswa"
                      ? "from-black to bg-gray-800 text-white shadow-lg "
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Siswa
                </button>
                <button
                  onClick={() => setLoginType("guru")}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                    loginType === "guru"
                      ? "from-black to bg-gray-800 text-white shadow-lg "
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Guru
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 animate-shake">
                <div>
                  <p className="text-xs font-semibold text-red-800">
                    Login Gagal
                  </p>
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                  {loginType === "siswa" ? "NIS Siswa" : "Email Guru"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.identifier}
                  placeholder={
                    loginType === "siswa" ? "Masukkan NIS (angka)" : "Masukkan email atau username"
                  }
                  pattern={loginType === "siswa" ? "[0-9]+" : undefined}
                  title={loginType === "siswa" ? "NIS harus berupa angka" : "Email atau username"}
                  className={`w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-4 transition-all outline-none ${
                    loginType === "siswa"
                      ? "focus:border-blue-500 focus:ring-blue-100"
                      : "focus:border-green-500 focus:ring-green-100"
                  }`}
                  onChange={(e) =>
                    setFormData({ ...formData, identifier: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  placeholder="Masukkan password"
                  className={`w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-4 transition-all outline-none ${
                    loginType === "siswa"
                      ? "focus:border-blue-500 focus:ring-blue-100"
                      : "focus:border-green-500 focus:ring-green-100"
                  }`}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`group w-full bg-gradient-to-r ${
                  loginType === "siswa"
                    ? "from-black to-gray-600 hover:from-black hover:to-gray-700"
                    : "from-black to-gray-600 hover:from-black hover:to-gray-700"
                } disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 text-sm rounded-2xl transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none flex items-center justify-center gap-3 relative overflow-hidden`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                    <span className="relative">
                      {`Masuk sebagai ${loginType === "siswa" ? "Siswa" : "Guru"}`}
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-gray-600">
              Akun siswa dibuat oleh guru/admin melalui panel pengelolaan.
            </div>
          </div>
        </div>

        {/* Bottom info */}
        <div className="text-center mt-8 text-white text-sm">
          <p>© 2026 Suara Siswa • Transparansi • Akuntabilitas • Perubahan</p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;700&family=Crimson+Pro:wght@400;600&display=swap');
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.8s ease-out 0.3s both;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

      `}</style>
    </div>
  );
};

export default AuthPage;

