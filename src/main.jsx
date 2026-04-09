import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import './index.css';
import Login from "./pages/Login";
import DashboardSiswa from "./pages/DashboardSiswa";
import CreateAspirasi from "./pages/CreateAspirasi";
import LandingPage from "./pages/LandingPage";
import DashboardGuru from "./pages/DashboardGuru";
import ProtectedRoute from "./components/ProtectedRoute";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Toaster position="top-right" />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requiredRole="siswa">
              <DashboardSiswa />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard-guru" 
          element={
            <ProtectedRoute requiredRole="guru">
              <DashboardGuru />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/buat-aspirasi" 
          element={
            <ProtectedRoute requiredRole="siswa">
              <CreateAspirasi />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
