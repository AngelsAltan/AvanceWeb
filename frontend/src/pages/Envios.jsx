import { useState, useEffect, useMemo } from "react";
import { Country, State } from "country-state-city";
import { useAuth } from "../context/AuthContext";
import styles from "./Envios.module.css";

const paisesPermitidos = [
  "GT","AR","BZ","BO","BR","CA","CL","CO","CR","CU",
  "EC","SV","US","HN","MX","NI","PA","PY","PE","DO","UY","VE",
];

function calcularCotizacion(ruta, peso, servicio, extras) {
  let base = 0;
  let tiempo = "";

  if (ruta === "misma_ciudad")        { base = 25;  tiempo = "1 a 2 días hábiles"; }
  else if (ruta === "otro_departamento") { base = 45;  tiempo = "2 a 4 días hábiles"; }
  else                                { base = 150; tiempo = "5 a 10 días hábiles"; }

  const costoPeso    = peso * 18;
  const factorServicio = servicio === "express" ? 1.5 : 1;

  if (servicio === "express") {
    tiempo = ruta === "internacional" ? "3 a 5 días hábiles" : "Menos de 24 horas";
  }

  let costoExtras = 0;
  if (extras.includes("recoleccion")) costoExtras += 15;
  if (extras.includes("seguro"))      costoExtras += 50;

  const total = (base + costoPeso) * factorServicio + costoExtras;
  return {
    base: base.toFixed(2),
    peso: costoPeso.toFixed(2),
    extras: costoExtras.toFixed(2),
    total: total.toFixed(2),
    tiempo,
  };
}

// ── Pestaña: Nuevo Envío ─────────────────────────────────────────────────────
function NuevoEnvio({ token, onEnviado }) {
  const [ruta,   setRuta]   = useState("");
  const [pais,   setPais]   = useState("");
  const [depto,  setDepto]  = useState("");
  const [peso,   setPeso]   = useState("");
  const [servicio, setServicio] = useState("");
  const [extras, setExtras] = useState([]);
  const [cotizacion, setCotizacion] = useState(null);
  const [error,  setError]  = useState("");
  const [exito,  setExito]  = useState("");
  const [cargando, setCargando] = useState(false);

  const paisesDisponibles = useMemo(
    () => Country.getAllCountries().filter((p) => paisesPermitidos.includes(p.isoCode)),
    []
  );

  const handleRuta = (e) => {
    const val = e.target.value;
    setRuta(val);
    setCotizacion(null);
    setError("");
    if (val === "misma_ciudad")        { setPais("GT"); setDepto("GU"); }
    else if (val === "otro_departamento") { setPais("GT"); setDepto(""); }
    else                               { setPais("");   setDepto(""); }
  };

  const toggleExtra = (val) =>
    setExtras((prev) => prev.includes(val) ? prev.filter((e) => e !== val) : [...prev, val]);

  const handleCotizar = (e) => {
    e.preventDefault();
    setError(""); setExito("");
    if (!ruta || !pais || !depto || !peso || !servicio) {
      setError("Completa todos los campos obligatorios (*)"); return;
    }
    if (parseFloat(peso) <= 0) { setError("El peso debe ser mayor a 0"); return; }
    setCotizacion(calcularCotizacion(ruta, parseFloat(peso), servicio, extras));
  };

  const handleEnviar = async () => {
    if (!cotizacion) return;
    setCargando(true); setError(""); setExito("");
    try {
      const paisNombre  = Country.getCountryByCode(pais)?.name || pais;
      const deptoNombre = State.getStateByCodeAndCountry(depto, pais)?.name || depto;
      const destino     = `${deptoNombre}, ${paisNombre}`;

      const res = await fetch("/api/envios", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          destino,
          peso: parseFloat(peso),
          tipo_servicio: servicio,
          extras,
          ruta,
          costo_estimado: parseFloat(cotizacion.total),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al crear envío"); return; }
      setExito(`✓ Envío creado exitosamente — Código: ${data.codigo_guia}`);
      setRuta(""); setPais(""); setDepto(""); setPeso("");
      setServicio(""); setExtras([]); setCotizacion(null);
      onEnviado();
    } catch { setError("Error de conexión"); }
    finally   { setCargando(false); }
  };

  return (
    <div className={styles.formWrap}>
      {error  && <div className={styles.alert}>{error}</div>}
      {exito  && <div className={styles.success}>{exito}</div>}

      <form onSubmit={handleCotizar} className={styles.form}>
        {/* Ruta */}
        <div className={styles.field}>
          <label className={styles.label}>Ruta: *</label>
          <select value={ruta} onChange={handleRuta} className={styles.select} required>
            <option value="" disabled>Selecciona la ruta</option>
            <option value="misma_ciudad">Misma ciudad</option>
            <option value="otro_departamento">Otro departamento</option>
            <option value="internacional">Internacional</option>
          </select>
        </div>

        {/* País / Departamento */}
        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>País: *</label>
            <select
              value={pais}
              onChange={(e) => { setPais(e.target.value); setDepto(""); setCotizacion(null); }}
              disabled={ruta === "misma_ciudad" || ruta === "otro_departamento"}
              className={styles.select} required
            >
              <option value="">Selecciona país</option>
              {paisesDisponibles.map((p) => (
                <option key={p.isoCode} value={p.isoCode}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              {ruta === "internacional" ? "Estado / Ciudad" : "Departamento"}: *
            </label>
            <select
              value={depto}
              onChange={(e) => { setDepto(e.target.value); setCotizacion(null); }}
              disabled={ruta === "misma_ciudad" || !pais}
              className={styles.select} required
            >
              <option value="">Selecciona opción</option>
              {State.getStatesOfCountry(pais).map((s) => (
                <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Peso */}
        <div className={styles.field}>
          <label className={styles.label}>Peso (lbs): *</label>
          <input
            type="number" step="0.1" min="0.1" value={peso}
            onChange={(e) => { setPeso(e.target.value); setCotizacion(null); }}
            className={styles.input} placeholder="Ej. 5.5" required
          />
        </div>

        {/* Servicio */}
        <div className={styles.field}>
          <label className={styles.label}>Servicio: *</label>
          <select
            value={servicio}
            onChange={(e) => { setServicio(e.target.value); setCotizacion(null); }}
            className={styles.select} required
          >
            <option value="" disabled>Selecciona urgencia</option>
            <option value="standard">Estándar</option>
            <option value="express">Express (+50%)</option>
          </select>
        </div>

        {/* Extras */}
        <div className={styles.field}>
          <label className={styles.label}>Adicionales:</label>
          <div className={styles.extras}>
            <label className={styles.extraItem}>
              <input type="checkbox" checked={extras.includes("recoleccion")}
                onChange={() => { toggleExtra("recoleccion"); setCotizacion(null); }} />
              <span>Recolección (+ Q15.00)</span>
            </label>
            <label className={styles.extraItem}>
              <input type="checkbox" checked={extras.includes("seguro")}
                onChange={() => { toggleExtra("seguro"); setCotizacion(null); }} />
              <span>Seguro (+ Q50.00)</span>
            </label>
          </div>
        </div>

        <button type="submit" className={styles.btnCotizar}>
          Calcular tarifa
        </button>
      </form>

      {/* Ticket de cotización */}
      {cotizacion && (
        <div className={styles.ticket}>
          <h3 className={styles.ticketTitle}>Resumen</h3>
          <div className={styles.ticketRow}><span>Base:</span>   <span>Q {cotizacion.base}</span></div>
          <div className={styles.ticketRow}><span>Peso:</span>   <span>Q {cotizacion.peso}</span></div>
          <div className={styles.ticketRow}><span>Extras:</span> <span>Q {cotizacion.extras}</span></div>
          <div className={styles.ticketTotal}>
            <span>Total estimado:</span><span>Q {cotizacion.total}</span>
          </div>
          <div className={styles.ticketTime}>
            <span>Tiempo estimado:</span>
            <strong>{cotizacion.tiempo}</strong>
          </div>
          <button
            className={styles.btnEnviar}
            onClick={handleEnviar}
            disabled={cargando}
          >
            {cargando ? "Creando envío..." : "Confirmar y crear envío"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Pestaña: Historial ───────────────────────────────────────────────────────
function Historial({ envios }) {
  return (
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
                <td>Q{Number(e.costo_estimado).toFixed(2)}</td>
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
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function Envios() {
  const { usuario } = useAuth();
  const token = localStorage.getItem("token");
  const [tab, setTab] = useState("nuevo");
  const [envios, setEnvios] = useState([]);

  const fetchEnvios = async () => {
    const res = await fetch("/api/envios", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setEnvios(await res.json());
  };

  useEffect(() => { fetchEnvios(); }, []);

  const handleEnviado = () => { fetchEnvios(); setTab("historial"); };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Mis Envíos</h1>
        <p>Bienvenido, {usuario?.nombre}. Gestiona tus envíos aquí.</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "nuevo" ? styles.tabActive : ""}`}
          onClick={() => setTab("nuevo")}
        >
          Nuevo Envío
        </button>
        <button
          className={`${styles.tab} ${tab === "historial" ? styles.tabActive : ""}`}
          onClick={() => setTab("historial")}
        >
          Historial ({envios.length})
        </button>
      </div>

      <div className={styles.tabContent}>
        {tab === "nuevo" && (
          <NuevoEnvio token={token} onEnviado={handleEnviado} />
        )}
        {tab === "historial" && (
          <Historial envios={envios} />
        )}
      </div>
    </div>
  );
}
