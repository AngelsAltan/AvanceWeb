import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "", correo: "", telefono: "", direccion: "", password: "",
  });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al registrar"); return; }
      login(data.token, data.usuario);
      navigate("/envios");
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.subtitle}>Únete y empieza a gestionar tus envíos</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.field}>
            <label>Nombre completo</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required />
          </div>
          <div className={styles.field}>
            <label>Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} />
          </div>
          <div className={styles.field}>
            <label>Correo electrónico</label>
            <input type="email" name="correo" value={form.correo} onChange={handleChange} required />
          </div>
          <div className={styles.field}>
            <label>Dirección</label>
            <input name="direccion" value={form.direccion} onChange={handleChange} />
          </div>
          <div className={styles.field}>
            <label>Contraseña</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
          </div>
          <button type="submit" className={styles.btn} disabled={cargando}>
            {cargando ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <p className={styles.footer}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
