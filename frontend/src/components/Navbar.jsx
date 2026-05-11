import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.links}>
        {!usuario ? (
          <>
            <Link to="/register" className={styles.btnOutline}>Registro</Link>
            <Link to="/login" className={styles.btnPrimary}>Iniciar sesión</Link>
          </>
        ) : (
          <>
            {usuario.rol === "admin" && (
              <Link to="/admin" className={styles.link}>Panel Admin</Link>
            )}
            <Link to="/envios" className={styles.link}>Mis envíos</Link>
            <button onClick={handleLogout} className={styles.btnOutline}>
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
