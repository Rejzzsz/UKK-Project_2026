# 🚀 Panduan Setup Project UKK 2026 (React & Strapi)

Repositori ini berisi panduan instalasi lengkap untuk project UKK 2026 yang menggunakan **React (Vite)** untuk Frontend dan **Strapi (MySQL)** untuk Backend.

---

## 🧩 1. Persiapan Ekstensi VS Code
Sebelum mulai *coding*, sangat disarankan untuk menginstal ekstensi berikut di Visual Studio Code agar proses *development* lebih cepat:
- **ES7 React/Redux/GraphQL/React-Native snippets** (Kumpulan *snippets* untuk React dengan standar ES6/ES7)
- **codex**

---

## 🛠️ 2. Persiapan Environment (Node.js & NVM)
Project ini membutuhkan **Node.js versi 22.14.0**. Kita akan menggunakan NVM (Node Version Manager) untuk mempermudah pengaturan versi.

1. Download dan jalankan file instalasi `nvm-setup.exe`.
2. Selesaikan proses instalasi sampai akhir.
3. **Penting:** Tutup dan buka ulang terminal / Command Prompt (CMD) kamu.
4. Instal dan aktifkan Node.js versi 22.14.0 dengan menjalankan perintah berikut:
   ```bash
   nvm install 22.14.0
   nvm use 22.14.0


   # 1. Buat project Vite dengan template React
npm create vite@latest UKK_2026 --template react

# 2. Masuk ke folder project
cd UKK_2026

# 3. Instal dependensi bawaan
npm install

# 4. Instal React Router DOM untuk navigasi halaman
npm install react-router-dom
