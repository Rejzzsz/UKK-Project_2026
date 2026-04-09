import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  const userType = localStorage.getItem("userType");
  const token = localStorage.getItem("token");

  // Jika tidak ada token, redirect ke login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Jika role tidak sesuai, redirect ke dashboard sesuai role
  if (requiredRole && userType !== requiredRole) {
    if (userType === "siswa") {
      return <Navigate to="/dashboard" replace />;
    } else if (userType === "guru") {
      return <Navigate to="/dashboard-guru" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
