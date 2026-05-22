import { useState, useEffect, useCallback } from "react";
import styles from "./Admin.module.css";

const ESTADO_OPTS = ["pendiente", "en_tránsito", "entregado"];
const ROL_OPTS    = ["cliente", "admin"];
const MESES       = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const C_ESTADO    = { pendiente:"#f59e0b", "en_tránsito":"#3b82f6", entregado:"#10b981" };
const C_SERVICIO  = { standard:"#6366f1", express:"#f97316" };
const C_PALETTE   = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899"];

/* ── SVG icon paths ────────────────────────────────────────────────────────── */
const ICONS = {
  users:     "M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  package:   "M20 7l-8-4-8 4v10l8 4 8-4V7zm-8 1.18L15.76 10 12 11.82 8.24 10 12 8.18zM6 18.18V12l5 2.5v6.35L6 18.18zm8 2.85V14.5l5-2.5v6.18l-5 2.5z",
  money:     "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z",
  chart:     "M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z",
  weight:    "M12 3c-1.2 0-2.1.9-2.1 2.1 0 .78.43 1.46 1.05 1.82V9H7L5 20h14L17 9h-4V6.92c.62-.36 1.05-1.04 1.05-1.82C14.05 3.9 13.2 3 12 3z",
  lightning: "M7 2v11h3v9l7-12h-4l4-8z",
  dashboard: "M3 3h8v8H3zm0 10h8v8H3zm10 0h8v8h-8zm0-10h8v8h-8z",
  person:    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z",
  truck:     "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
};

function Icon({ name, size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={styles.navIcon}>
      <path d={ICONS[name]} />
    </svg>
  );
}

/* ── KPI definitions ─────────────────────────────────────────────────────────── */
const KPI_DEFS = [
  { key:"total_usuarios",   label:"Clientes",        icon:"users",     iconColor:"#3b82f6", iconBg:"#eff6ff",  fmt: v => v },
  { key:"total_envios",     label:"Total de envíos", icon:"package",   iconColor:"#10b981", iconBg:"#f0fdf4",  fmt: v => v },
  { key:"ingresos_totales", label:"Ingresos",        icon:"money",     iconColor:"#8b5cf6", iconBg:"#faf5ff",  fmt: v => `Q${v.toLocaleString("es-GT",{minimumFractionDigits:2})}` },
  { key:"ticket_promedio",  label:"Ticket promedio", icon:"chart",     iconColor:"#e11d48", iconBg:"#fff1f2",  fmt: v => `Q${v.toFixed(2)}` },
  { key:"peso_total",       label:"Peso total",      icon:"weight",    iconColor:"#64748b", iconBg:"#f8fafc",  fmt: v => `${v.toLocaleString()} lbs` },
  { key:"ingresos_express", label:"Express",         icon:"lightning", iconColor:"#f97316", iconBg:"#fff7ed",  fmt: v => `Q${v.toLocaleString("es-GT",{minimumFractionDigits:2})}` },
];

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "usuarios",  label: "Usuarios",  icon: "person"    },
  { id: "envios",    label: "Envíos",    icon: "truck"     },
];

function authHdr() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}
async function api(url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...authHdr(), ...(opts.headers || {}) },
  });
}

/* ── Gráfico de barras horizontal ─────────────────────────────────────────── */
function BarChart({ data, colores }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className={styles.barChart}>
      {entries.map(([label, val], i) => (
        <div key={label} className={styles.barRow}>
          <span className={styles.barLabel}>{label.replace(/_/g, " ")}</span>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{
              width: `${(val / max) * 100}%`,
              background: Array.isArray(colores) ? colores[i % colores.length] : (colores[label] || "#6366f1"),
            }} />
          </div>
          <span className={styles.barValue}>{val}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Donut chart ──────────────────────────────────────────────────────────── */
function DonutChart({ data, colores }) {
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  if (!total) return <p className={styles.empty}>Sin datos aún</p>;
  let acc = 0;
  const segs = Object.entries(data).map(([k, v]) => {
    const pct = (v / total) * 100;
    const color = colores[k] || "#9ca3af";
    const start = acc;
    acc += pct;
    return { k, v, color, start, pct };
  });
  const grad = segs.map(s => `${s.color} ${s.start}% ${s.start + s.pct}%`).join(",");
  return (
    <div className={styles.donutWrap}>
      <div className={styles.donut} style={{ background: `conic-gradient(${grad})` }} />
      <div className={styles.donutLegend}>
        {segs.map(s => (
          <div key={s.k} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: s.color }} />
            <span style={{ textTransform:"capitalize" }}>{s.k.replace(/_/g," ")}</span>
            <strong style={{ marginLeft:"auto", paddingLeft:"0.5rem" }}>{s.v}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Gauge — Tasa de entrega ──────────────────────────────────────────────── */
function GaugeTasa({ valor }) {
  const clamped = Math.min(Math.max(valor, 0), 100);
  const circunf = 2 * Math.PI * 52;
  const relleno = (clamped / 100) * circunf;
  const color   = clamped >= 80 ? "#10b981" : clamped >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className={styles.gaugeWrap}>
      <svg viewBox="0 0 120 120" className={styles.gaugeSvg}>
        <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle cx="60" cy="60" r="52" fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${relleno} ${circunf}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="56" textAnchor="middle" dominantBaseline="middle"
          fontSize="22" fontWeight="800" fill="#0d0d1a">{clamped}%</text>
        <text x="60" y="76" textAnchor="middle" fontSize="9" fill="#94a3b8">entregados</text>
      </svg>
      <p className={styles.gaugeLabel}>Tasa de entrega</p>
    </div>
  );
}

/* ── Barras de ingresos ───────────────────────────────────────────────────── */
function IngresosBars({ totales, express }) {
  const standard = Math.max(totales - express, 0);
  const max = Math.max(totales, 1);
  const fmt = v => `Q${v.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
  const items = [
    { label:"Estándar", valor:standard, color:"#6366f1" },
    { label:"Express",  valor:express,  color:"#f97316" },
  ];
  return (
    <div className={styles.ingrWrap}>
      <p className={styles.ingrTotal}>{fmt(totales)}</p>
      <p className={styles.ingrSub}>ingresos totales</p>
      <div className={styles.ingrBars}>
        {items.map(({ label, valor, color }) => (
          <div key={label} className={styles.ingrRow}>
            <div className={styles.ingrMeta}>
              <span className={styles.ingrDot} style={{ background: color }} />
              <span className={styles.ingrLabel}>{label}</span>
              <span className={styles.ingrAmt}>{fmt(valor)}</span>
            </div>
            <div className={styles.ingrTrack}>
              <div className={styles.ingrFill} style={{ width:`${(valor/max)*100}%`, background:color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Estado de envíos ─────────────────────────────────────────────────────── */
function EstadoWidget({ pendientes, transito, entregados }) {
  const total = pendientes + transito + entregados || 1;
  const items = [
    { label:"Pendientes",  valor:pendientes, color:"#f59e0b", bg:"#fef3c7", txt:"#92400e" },
    { label:"En tránsito", valor:transito,   color:"#3b82f6", bg:"#dbeafe", txt:"#1e40af" },
    { label:"Entregados",  valor:entregados, color:"#10b981", bg:"#d1fae5", txt:"#065f46" },
  ];
  return (
    <div className={styles.estadoWrap}>
      {items.map(({ label, valor, color, bg, txt }) => (
        <div key={label} className={styles.estadoItem}>
          <div className={styles.estadoTop}>
            <span className={styles.estadoBadge} style={{ background:bg, color:txt }}>{label}</span>
            <span className={styles.estadoNum}>{valor}</span>
          </div>
          <div className={styles.estadoTrack}>
            <div className={styles.estadoFill} style={{ width:`${(valor/total)*100}%`, background:color }} />
          </div>
          <span className={styles.estadoPct}>{((valor/total)*100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

/* ── Dashboard ────────────────────────────────────────────────────────────── */
function Dashboard({ stats }) {
  if (!stats) return (
    <div className={styles.loading}>
      <div className={styles.loadingSpinner} />
      <span>Cargando métricas...</span>
    </div>
  );

  const mesPorMes = Object.fromEntries(
    stats.por_mes.map(d => [`${MESES[d.mes]} ${d.anio}`, d.total])
  );

  return (
    <>
      {/* KPIs */}
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Métricas generales</h2>
      </div>
      <div className={styles.kpiGrid}>
        {KPI_DEFS.map(({ key, label, icon, iconColor, iconBg, fmt }) => (
          <div key={key} className={styles.kpiCard}>
            <div className={styles.kpiIconWrap} style={{ background: iconBg }}>
              <Icon name={icon} size={22} color={iconColor} />
            </div>
            <div className={styles.kpiBody}>
              <p className={styles.kpiLabel}>{label}</p>
              <p className={styles.kpiValue}>{fmt(stats[key] ?? 0)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Widgets visuales */}
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Rendimiento</h2>
      </div>
      <div className={styles.widgetRow}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Tasa de entrega</h3>
          <GaugeTasa valor={stats.tasa_entrega ?? 0} />
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Distribución de ingresos</h3>
          <IngresosBars totales={stats.ingresos_totales ?? 0} express={stats.ingresos_express ?? 0} />
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Estado de envíos</h3>
          <EstadoWidget
            pendientes={stats.envios_pendientes ?? 0}
            transito={stats.envios_transito ?? 0}
            entregados={stats.envios_entregados ?? 0}
          />
        </div>
      </div>

      {/* Gráficas */}
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Análisis</h2>
      </div>
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Envíos por mes</h3>
          {stats.por_mes.length === 0
            ? <p className={styles.empty}>Sin datos aún</p>
            : <BarChart data={mesPorMes} colores={C_PALETTE} />}
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Top destinos</h3>
          {Object.keys(stats.por_region).length === 0
            ? <p className={styles.empty}>Sin datos aún</p>
            : <BarChart data={stats.por_region} colores={C_PALETTE} />}
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Estado de envíos</h3>
          <DonutChart data={stats.por_estado} colores={C_ESTADO} />
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Tipo de servicio</h3>
          <DonutChart data={stats.por_servicio} colores={C_SERVICIO} />
        </div>
      </div>
    </>
  );
}

/* ── Modal genérico ───────────────────────────────────────────────────────── */
function Modal({ titulo, onClose, children }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{titulo}</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── CRUD Usuarios ────────────────────────────────────────────────────────── */
function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({});
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);

  const load = useCallback(async () => {
    const r = await api("/api/admin/usuarios");
    if (r.ok) setUsuarios(await r.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const abrirCrear = () => {
    setForm({ nombre:"", correo:"", telefono:"", direccion:"", rol:"cliente", password:"" });
    setError(""); setModal("crear");
  };
  const abrirEditar = (u) => {
    setForm({ nombre:u.nombre, correo:u.correo, telefono:u.telefono||"", direccion:u.direccion||"", rol:u.rol, password:"" });
    setError(""); setModal(u);
  };
  const cerrar = () => setModal(null);

  const guardar = async () => {
    setError(""); setCargando(true);
    const url    = modal === "crear" ? "/api/admin/usuarios" : `/api/admin/usuarios/${modal.id}`;
    const method = modal === "crear" ? "POST" : "PUT";
    const r = await api(url, { method, body: JSON.stringify(form) });
    const d = await r.json();
    setCargando(false);
    if (!r.ok) { setError(d.error || "Error al guardar"); return; }
    cerrar(); load();
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    await api(`/api/admin/usuarios/${id}`, { method:"DELETE" });
    load();
  };

  const chg = e => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <span className={styles.tableTitle}>Usuarios ({usuarios.length})</span>
        <button className={styles.btnNew} onClick={abrirCrear}>+ Nuevo usuario</button>
      </div>
      <div className={styles.tableWrapper}>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>Correo</th><th>Teléfono</th>
              <th>Rol</th><th>Registrado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <td style={{ color:"#94a3b8", fontSize:"0.8rem" }}>#{u.id}</td>
                <td><strong>{u.nombre}</strong></td>
                <td>{u.correo}</td>
                <td>{u.telefono || "—"}</td>
                <td>
                  <span className={`${styles.badge} ${u.rol === "admin" ? styles.badgeAdmin : styles.badgeCliente}`}>
                    {u.rol}
                  </span>
                </td>
                <td style={{ color:"#94a3b8" }}>{new Date(u.creado_en).toLocaleDateString("es-GT")}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.btnEdit}   onClick={() => abrirEditar(u)}>Editar</button>
                    <button className={styles.btnDelete} onClick={() => eliminar(u.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {usuarios.length === 0 && <p className={styles.empty}>No hay usuarios registrados.</p>}
      </div>

      {modal && (
        <Modal titulo={modal === "crear" ? "Nuevo usuario" : "Editar usuario"} onClose={cerrar}>
          {error && <div className={styles.modalError}>{error}</div>}
          <div className={styles.modalForm}>
            <div className={styles.modalRow}>
              <div className={styles.mField}>
                <label>Nombre *</label>
                <input name="nombre" value={form.nombre} onChange={chg} />
              </div>
              <div className={styles.mField}>
                <label>Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={chg} />
              </div>
            </div>
            <div className={styles.mField}>
              <label>Correo *</label>
              <input name="correo" type="email" value={form.correo} onChange={chg} />
            </div>
            <div className={styles.mField}>
              <label>Dirección</label>
              <input name="direccion" value={form.direccion} onChange={chg} />
            </div>
            <div className={styles.modalRow}>
              <div className={styles.mField}>
                <label>Rol</label>
                <select name="rol" value={form.rol} onChange={chg}>
                  {ROL_OPTS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className={styles.mField}>
                <label>{modal === "crear" ? "Contraseña *" : "Nueva contraseña"}</label>
                <input name="password" type="password" value={form.password} onChange={chg}
                  placeholder={modal !== "crear" ? "Dejar vacío para no cambiar" : ""} />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={cerrar}>Cancelar</button>
              <button className={styles.btnSave} onClick={guardar} disabled={cargando}>
                {cargando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── CRUD Envíos ──────────────────────────────────────────────────────────── */
function GestionEnvios() {
  const [envios,   setEnvios]   = useState([]);
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({});
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);

  const load = useCallback(async () => {
    const r = await api("/api/admin/envios");
    if (r.ok) setEnvios(await r.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const abrirEditar = (e) => {
    setForm({ destino:e.destino, peso:e.peso, tipo_servicio:e.tipo_servicio, estado:e.estado, costo_estimado:e.costo_estimado });
    setError(""); setModal(e);
  };
  const cerrar = () => setModal(null);

  const guardar = async () => {
    setError(""); setCargando(true);
    const r = await api(`/api/admin/envios/${modal.id}`, { method:"PUT", body:JSON.stringify(form) });
    const d = await r.json();
    setCargando(false);
    if (!r.ok) { setError(d.error || "Error al guardar"); return; }
    cerrar(); load();
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este envío?")) return;
    await api(`/api/admin/envios/${id}`, { method:"DELETE" });
    load();
  };

  const chg = e => setForm({ ...form, [e.target.name]: e.target.value });
  const estadoClass = { pendiente:styles.badgePendiente, "en_tránsito":styles.badgeTransito, entregado:styles.badgeEntregado };

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <span className={styles.tableTitle}>Envíos ({envios.length})</span>
      </div>
      <div className={styles.tableWrapper}>
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Cliente</th><th>Destino</th><th>Peso</th>
              <th>Servicio</th><th>Estado</th><th>Costo</th><th>Fecha</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {envios.map(e => (
              <tr key={e.id}>
                <td><strong style={{ color:"#6366f1" }}>{e.codigo_guia}</strong></td>
                <td>{e.usuario_nombre}</td>
                <td>{e.destino}</td>
                <td>{e.peso} lbs</td>
                <td style={{ textTransform:"capitalize" }}>{e.tipo_servicio}</td>
                <td>
                  <span className={`${styles.badge} ${estadoClass[e.estado] || ""}`}>
                    {e.estado.replace("_"," ")}
                  </span>
                </td>
                <td><strong>Q{Number(e.costo_estimado).toFixed(2)}</strong></td>
                <td style={{ color:"#94a3b8" }}>{new Date(e.creado_en).toLocaleDateString("es-GT")}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.btnEdit}   onClick={() => abrirEditar(e)}>Editar</button>
                    <button className={styles.btnDelete} onClick={() => eliminar(e.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {envios.length === 0 && <p className={styles.empty}>No hay envíos registrados.</p>}
      </div>

      {modal && (
        <Modal titulo={`Editar — ${modal.codigo_guia}`} onClose={cerrar}>
          {error && <div className={styles.modalError}>{error}</div>}
          <div className={styles.modalForm}>
            <div className={styles.mField}>
              <label>Destino</label>
              <input name="destino" value={form.destino} onChange={chg} />
            </div>
            <div className={styles.modalRow}>
              <div className={styles.mField}>
                <label>Peso (lbs)</label>
                <input name="peso" type="number" step="0.1" value={form.peso} onChange={chg} />
              </div>
              <div className={styles.mField}>
                <label>Servicio</label>
                <select name="tipo_servicio" value={form.tipo_servicio} onChange={chg}>
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                </select>
              </div>
            </div>
            <div className={styles.modalRow}>
              <div className={styles.mField}>
                <label>Estado</label>
                <select name="estado" value={form.estado} onChange={chg}>
                  {ESTADO_OPTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className={styles.mField}>
                <label>Costo estimado (Q)</label>
                <input name="costo_estimado" type="number" step="0.01" value={form.costo_estimado} onChange={chg} />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={cerrar}>Cancelar</button>
              <button className={styles.btnSave} onClick={guardar} disabled={cargando}>
                {cargando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Admin principal ──────────────────────────────────────────────────────── */
export default function Admin() {
  const [tab,         setTab]         = useState("dashboard");
  const [stats,       setStats]       = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadStats = useCallback(async () => {
    const r = await api("/api/admin/stats");
    if (r.ok) setStats(await r.json());
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const cambiarTab = (id) => { setTab(id); setSidebarOpen(false); };

  const tabTitles = { dashboard: "Dashboard", usuarios: "Gestión de Usuarios", envios: "Gestión de Envíos" };
  const today = new Date().toLocaleDateString("es-GT", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  return (
    <div className={styles.page}>
      {/* Hamburger mobile */}
      <button className={styles.hamburger} onClick={() => setSidebarOpen(o => !o)} aria-label="Menú">
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        <div className={styles.sidebarAccent} />
        <div className={styles.sidebarBrand}>
          <div className={styles.brandMark}>S</div>
          <div className={styles.brandName}>SkyShip Express</div>
          <div className={styles.brandSub}>Panel de control</div>
        </div>

        <div className={styles.sidebarSection}>Navegación</div>
        {TABS.map(t => (
          <button key={t.id}
            className={`${styles.sidebarLink} ${tab === t.id ? styles.active : ""}`}
            onClick={() => cambiarTab(t.id)}>
            <Icon name={t.icon} size={18} color="currentColor" />
            {t.label}
          </button>
        ))}

        <div className={styles.sidebarFooter}>v1.0 · SkyShip Express</div>
      </aside>

      {/* Main */}
      <main className={styles.content}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <span className={styles.topbarTitle}>
              {tab === "dashboard" && <><span>Sky</span>Ship Dashboard</>}
              {tab === "usuarios"  && "Gestión de Usuarios"}
              {tab === "envios"    && "Gestión de Envíos"}
            </span>
            <span className={styles.topbarSub}>{today}</span>
          </div>
          <div className={styles.topbarRight}>
            <span className={styles.topbarBadge}>Admin</span>
          </div>
        </div>

        <div className={styles.inner}>
          {tab === "dashboard" && <Dashboard stats={stats} />}
          {tab === "usuarios"  && <GestionUsuarios />}
          {tab === "envios"    && <GestionEnvios />}
        </div>
      </main>
    </div>
  );
}
