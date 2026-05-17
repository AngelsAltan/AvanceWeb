import { useState, useEffect, useCallback } from "react";
import styles from "./Admin.module.css";

const ESTADO_OPTS = ["pendiente", "en_tránsito", "entregado"];
const ROL_OPTS    = ["cliente", "admin"];
const MESES       = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const C_ESTADO    = { pendiente:"#f59e0b", "en_tránsito":"#3b82f6", entregado:"#10b981" };
const C_SERVICIO  = { standard:"#4361ee", express:"#f97316" };
const C_PALETTE   = ["#4361ee","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899"];

// KPIs que se muestran como tarjetas numéricas simples
const KPI_DEFS = [
  { key:"total_usuarios",   label:"Clientes registrados", color:"kpiBlue",   fmt: v => v },
  { key:"total_envios",     label:"Total de envíos",      color:"kpiGreen",  fmt: v => v },
  { key:"ingresos_totales", label:"Ingresos totales",     color:"kpiPurple", fmt: v => `Q${v.toLocaleString("es-GT",{minimumFractionDigits:2})}` },
  { key:"ticket_promedio",  label:"Ticket promedio",      color:"kpiRed",    fmt: v => `Q${v.toFixed(2)}` },
  { key:"peso_total",       label:"Peso total enviado",   color:"kpiSlate",  fmt: v => `${v.toLocaleString()} lbs` },
  { key:"ingresos_express", label:"Ingresos express",     color:"kpiOrange", fmt: v => `Q${v.toLocaleString("es-GT",{minimumFractionDigits:2})}` },
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

/* ── Gráfico de barras horizontal ── */
function BarChart({ data, colores }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className={styles.barChart}>
      {entries.map(([label, val], i) => (
        <div key={label} className={styles.barRow}>
          <span className={styles.barLabel}>{label.replace(/_/g, " ")}</span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{
                width: `${(val / max) * 100}%`,
                background: Array.isArray(colores)
                  ? colores[i % colores.length]
                  : (colores[label] || "#4361ee"),
              }}
            />
          </div>
          <span className={styles.barValue}>{val}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Donut chart ── */
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
            <span style={{ textTransform: "capitalize" }}>{s.k.replace(/_/g, " ")}</span>
            <strong>{s.v}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Widget 1: Gauge circular — Tasa de entrega ── */
function GaugeTasa({ valor }) {
  const clamped  = Math.min(Math.max(valor, 0), 100);
  const circunf  = 2 * Math.PI * 52;          // radio 52
  const relleno  = (clamped / 100) * circunf;
  const color    = clamped >= 80 ? "#10b981" : clamped >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className={styles.gaugeWrap}>
      <svg viewBox="0 0 120 120" className={styles.gaugeSvg}>
        {/* fondo */}
        <circle cx="60" cy="60" r="52" fill="none" stroke="#f0f4ff" strokeWidth="10" />
        {/* progreso */}
        <circle cx="60" cy="60" r="52" fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${relleno} ${circunf}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="58" textAnchor="middle" dominantBaseline="middle"
          fontSize="22" fontWeight="800" fill="#1a1a2e">{clamped}%</text>
        <text x="60" y="78" textAnchor="middle" fontSize="9" fill="#6b7280">entregados</text>
      </svg>
      <p className={styles.gaugeLabel}>Tasa de entrega</p>
    </div>
  );
}

/* ── Widget 2: Barras comparativas de ingresos ── */
function IngresosBars({ totales, express }) {
  const standard = Math.max(totales - express, 0);
  const max      = Math.max(totales, 1);
  const fmt      = v => `Q${v.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
  const items    = [
    { label: "Estándar", valor: standard, color: "#4361ee" },
    { label: "Express",  valor: express,  color: "#f97316" },
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
              <div className={styles.ingrFill}
                style={{ width: `${(valor / max) * 100}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Widget 3: Estado de envíos con progreso ── */
function EstadoWidget({ pendientes, transito, entregados }) {
  const total = pendientes + transito + entregados || 1;
  const items = [
    { label: "Pendientes", valor: pendientes, color: "#f59e0b", bg: "#fef3c7", txt: "#92400e" },
    { label: "En tránsito", valor: transito,   color: "#3b82f6", bg: "#dbeafe", txt: "#1e40af" },
    { label: "Entregados",  valor: entregados,  color: "#10b981", bg: "#d1fae5", txt: "#065f46" },
  ];
  return (
    <div className={styles.estadoWrap}>
      {items.map(({ label, valor, color, bg, txt }) => (
        <div key={label} className={styles.estadoItem}>
          <div className={styles.estadoTop}>
            <span className={styles.estadoBadge} style={{ background: bg, color: txt }}>{label}</span>
            <span className={styles.estadoNum}>{valor}</span>
          </div>
          <div className={styles.estadoTrack}>
            <div className={styles.estadoFill}
              style={{ width: `${(valor / total) * 100}%`, background: color }} />
          </div>
          <span className={styles.estadoPct}>{((valor / total) * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

/* ── Dashboard ── */
function Dashboard({ stats }) {
  if (!stats) return <div className={styles.loading}>Cargando métricas...</div>;

  const mesPorMes = Object.fromEntries(
    stats.por_mes.map(d => [`${MESES[d.mes]} ${d.anio}`, d.total])
  );

  return (
    <>
      {/* KPIs numéricos */}
      <div className={styles.kpiGrid}>
        {KPI_DEFS.map(({ key, label, color, fmt }) => (
          <div key={key} className={`${styles.kpiCard} ${styles[color]}`}>
            <div>
              <p className={styles.kpiLabel}>{label}</p>
              <p className={styles.kpiValue}>{fmt(stats[key] ?? 0)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Widgets visuales */}
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

/* ── Modal genérico ── */
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

/* ── CRUD Usuarios ── */
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
    setForm({ nombre: "", correo: "", telefono: "", direccion: "", rol: "cliente", password: "" });
    setError("");
    setModal("crear");
  };

  const abrirEditar = (u) => {
    setForm({ nombre: u.nombre, correo: u.correo, telefono: u.telefono || "", direccion: u.direccion || "", rol: u.rol, password: "" });
    setError("");
    setModal(u);
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
    await api(`/api/admin/usuarios/${id}`, { method: "DELETE" });
    load();
  };

  const chg = e => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Usuarios ({usuarios.length})</h2>
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
                <td>{u.id}</td>
                <td>{u.nombre}</td>
                <td>{u.correo}</td>
                <td>{u.telefono || "—"}</td>
                <td>
                  <span className={`${styles.badge} ${u.rol === "admin" ? styles.badgeAdmin : styles.badgeCliente}`}>
                    {u.rol}
                  </span>
                </td>
                <td>{new Date(u.creado_en).toLocaleDateString("es-GT")}</td>
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

/* ── CRUD Envíos ── */
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
    setForm({ destino: e.destino, peso: e.peso, tipo_servicio: e.tipo_servicio, estado: e.estado, costo_estimado: e.costo_estimado });
    setError("");
    setModal(e);
  };

  const cerrar = () => setModal(null);

  const guardar = async () => {
    setError(""); setCargando(true);
    const r = await api(`/api/admin/envios/${modal.id}`, { method: "PUT", body: JSON.stringify(form) });
    const d = await r.json();
    setCargando(false);
    if (!r.ok) { setError(d.error || "Error al guardar"); return; }
    cerrar(); load();
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este envío?")) return;
    await api(`/api/admin/envios/${id}`, { method: "DELETE" });
    load();
  };

  const chg = e => setForm({ ...form, [e.target.name]: e.target.value });

  const estadoClass = { pendiente: styles.badgePendiente, "en_tránsito": styles.badgeTransito, entregado: styles.badgeEntregado };

  return (
    <div>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Envíos ({envios.length})</h2>
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
                <td><strong>{e.codigo_guia}</strong></td>
                <td>{e.usuario_nombre}</td>
                <td>{e.destino}</td>
                <td>{e.peso} lbs</td>
                <td style={{ textTransform: "capitalize" }}>{e.tipo_servicio}</td>
                <td>
                  <span className={`${styles.badge} ${estadoClass[e.estado] || ""}`}>
                    {e.estado.replace("_", " ")}
                  </span>
                </td>
                <td>Q{Number(e.costo_estimado).toFixed(2)}</td>
                <td>{new Date(e.creado_en).toLocaleDateString("es-GT")}</td>
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
        <Modal titulo={`Editar envío — ${modal.codigo_guia}`} onClose={cerrar}>
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
              <button className={styles.btnSave}   onClick={guardar} disabled={cargando}>
                {cargando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Admin principal ── */
const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "usuarios",  label: "Usuarios"  },
  { id: "envios",    label: "Envios"    },
];

export default function Admin() {
  const [tab,          setTab]          = useState("dashboard");
  const [stats,        setStats]        = useState(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  const loadStats = useCallback(async () => {
    const r = await api("/api/admin/stats");
    if (r.ok) setStats(await r.json());
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const cambiarTab = (id) => {
    setTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className={styles.page}>
      {/* Botón hamburger — solo visible en mobile */}
      <button
        className={styles.hamburger}
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Abrir menú"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* Overlay que cierra el sidebar al tocar fuera */}
      {sidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        <div className={styles.sidebarBrand}>
          SkyShip Admin
        </div>
        {TABS.map(t => (
          <button key={t.id}
            className={`${styles.sidebarLink} ${tab === t.id ? styles.active : ""}`}
            onClick={() => cambiarTab(t.id)}>
            {t.label}
          </button>
        ))}
      </aside>

      <main className={styles.content}>
        <h1 className={styles.pageTitle}>
          {tab === "dashboard" && "Dashboard"}
          {tab === "usuarios"  && "Gestión de Usuarios"}
          {tab === "envios"    && "Gestión de Envíos"}
        </h1>
        {tab === "dashboard" && <Dashboard stats={stats} />}
        {tab === "usuarios"  && <GestionUsuarios />}
        {tab === "envios"    && <GestionEnvios />}
      </main>
    </div>
  );
}
