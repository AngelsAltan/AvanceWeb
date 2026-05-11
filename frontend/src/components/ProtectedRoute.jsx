import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { usuario, cargando } = useAuth();

  if (cargando) return <div className="loading">Cargando...</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (adminOnly && usuario.rol !== "admin") return <Navigate to="/envios" replace />;

  return children;
}
