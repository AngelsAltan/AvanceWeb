import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./Envios.module.css";

const COSTO_BASE = 150;
const COSTO_LB = 18;

function calcularCosto(peso, tipo) {
  const c = COSTO_BASE + (parseFloat(peso) || 0) * COSTO_LB;
  return tipo === "express" ? (c * 1.5).toFixed(2) : c.toFixed(2);
}

export default function Envios() {
  const { usuario } = useAuth();
  const token = localStorage.getItem("token");
  const [envios, setEnvios] = useState([]);
  const [form, setForm] = useState({ destino: "", peso: "", tipo_servicio: "standard" });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const fetchEnvios = async () => {
    const res = await fetch("/api/envios", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setEnvios(await res.json());
  };

  useEffect(() => { fetchEnvios(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setExito("");
    setCargando(true);
    try {
      const res = await fetch("/api/envios", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, peso: parseFloat(form.peso) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al crear envío"); return; }
      setExito(`Envío creado: ${data.codigo_guia}`);
      setForm({ destino: "", peso: "", tipo_servicio: "standard" });
      fetchEnvios();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const costo = calcularCosto(form.peso, form.tipo_servicio);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Mis Envíos</h1>
        <p>Bienvenido, {usuario?.nombre}. Gestiona tus envíos aquí.</p>
      </div>

      <div className={styles.grid}>
        {/* Formulario */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Nuevo Envío</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            {exito && <div className={styles.success}>{exito}</div>}

            <div className={styles.field}>
              <label>Destino</label>
              <input name="destino" value={form.destino} onChange={handleChange} placeholder="Ciudad, País" required />
            </div>
            <div className={styles.field}>
              <label>Peso (lbs)</label>
              <input type="number" name="peso" value={form.peso} onChange={handleChange} min="0.1" step="0.1" required />
            </div>
            <div className={styles.field}>
              <label>Tipo de servicio</label>
              <select name="tipo_servicio" value={form.tipo_servicio} onChange={handleChange}>
                <option value="standard">Standard</option>
                <option value="express">Express</option>
              </select>
            </div>

            {form.peso && (
              <div className={styles.costo}>
                Costo estimado: Q{costo}
              </div>
            )}

            <button type="submit" className={styles.btn} disabled={cargando}>
              {cargando ? "Creando..." : "Crear envío"}
            </button>
          </form>
        </div>

        {/* Tabla */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Historial de Envíos</h2>
          <div className={styles.tableWrapper}>
            {envios.length === 0 ? (
              <p className={styles.empty}>Aún no tienes envíos registrados.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Destino</th>
                    <th>Peso</th>
                    <th>Servicio</th>
                    <th>Costo</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {envios.map((e) => (
                    <tr key={e.id}>
                      <td><strong>{e.codigo_guia}</strong></td>
                      <td>{e.destino}</td>
                      <td>{e.peso} lbs</td>
                      <td style={{ textTransform: "capitalize" }}>{e.tipo_servicio}</td>
                      <td>Q{e.costo_estimado.toFixed(2)}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[e.estado]}`}>
                          {e.estado.replace("_", " ")}
                        </span>
                      </td>
                      <td>{new Date(e.creado_en).toLocaleDateString("es-GT")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
