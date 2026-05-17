import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

const reglas = [
  { id: "len",     label: "Mínimo 8 caracteres",       test: (p) => p.length >= 8 },
  { id: "upper",   label: "Al menos una mayúscula",     test: (p) => /[A-Z]/.test(p) },
  { id: "number",  label: "Al menos un número",         test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "Al menos un carácter especial (!@#$...)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "", correo: "", telefono: "", direccion: "", password: "",
  });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "password") setPwTouched(true);
  };

  const resultados = useMemo(() => reglas.map((r) => ({ ...r, ok: r.test(form.password) })), [form.password]);
  const pwValida = resultados.every((r) => r.ok);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pwValida) { setError("La contraseña no cumple los requisitos"); return; }
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
            <input
              type="password" name="password"
              value={form.password} onChange={handleChange}
              required
            />
            {pwTouched && (
              <ul className={styles.pwRules}>
                {resultados.map((r) => (
                  <li key={r.id} className={r.ok ? styles.pwOk : styles.pwFail}>
                    {r.ok ? "✓" : "✗"} {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit" className={styles.btn} disabled={cargando || !pwValida}>
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
