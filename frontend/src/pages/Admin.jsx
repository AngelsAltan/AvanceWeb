import { useState, useEffect, useCallback } from "react";
import styles from "./Admin.module.css";

const ESTADO_OPTS = ["pendiente", "en_tránsito", "entregado"];
const ROL_OPTS = ["cliente", "admin"];
const COLORES_ESTADO = { pendiente: "#f59e0b", en_tránsito: "#3b82f6", entregado: "#10b981" };
const COLORES_SERVICIO = { standard: "#4361ee", express: "#f97316" };

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...authHeader(), ...(opts.headers || {}) },
  });
  return res;
}

// ── Stats / charts ─────────────────────────────────────────────────────────

function DonutChart({ data, colores }) {
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  if (!total) return <p className={styles.empty}>Sin datos</p>;

  let acumulado = 0;
  const segmentos = Object.entries(data).map(([key, val]) => {
    const pct = (val / total) * 100;
    const color = colores[key] || "#9ca3af";
    const inicio = acumulado;
    acumulado += pct;
    return { key, val, pct, color, inicio };
  });

  const gradient = segmentos
    .map((s) => `${s.color} ${s.inicio}% ${s.inicio + s.pct}%`)
    .join(", ");

  return (
    <div className={styles.donutWrap}>
      <div
        className={styles.donut}
        style={{ background: `conic-gradient(${gradient})` }}
      />
      <div className={styles.donutLegend}>
        {segmentos.map((s) => (
          <div key={s.key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: s.color }} />
            <span style={{ textTransform: "capitalize" }}>{s.key.replace("_", " ")}</span>
            <strong>{s.val}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...Object.values(data), 1);
  return (
    <div className={styles.barChart}>
      {Object.entries(data).map(([label, val]) => (
        <div key={label} className={styles.barRow}>
          <span className={styles.barLabel} style={{ textTransform: "capitalize" }}>
            {label.replace("_", " ")}
          </span>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${(val / max) * 100}%` }} />
          </div>
          <span className={styles.barValue}>{val}</span>
        </div>
      ))}
    </div>
  );
}

function MesChart({ datos }) {
  if (!datos.length) return <p className={styles.empty}>Sin datos</p>;
  const max = Math.max(...datos.map((d) => d.total), 1);
  const meses = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return (
    <div className={styles.barChart}>
      {datos.map((d) => (
        <div key={`${d.anio}-${d.mes}`} className={styles.barRow}>
          <span className={styles.barLabel}>{meses[d.mes]} {d.anio}</span>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${(d.total / max) * 100}%` }} />
          </div>
          <span className={styles.barValue}>{d.total}</span>
        </div>
      ))}
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

function Dashboard({ stats }) {
  if (!stats) return <div className={styles.loading}>Cargando métricas...</div>;
  return (
    <>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Usuarios</div>
          <div className={styles.statValue}>{stats.total_usuarios}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Envíos</div>
          <div className={styles.statValue}>{stats.total_envios}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Ingresos</div>
          <div className={styles.statValue}>Q{stats.ingresos_totales.toLocaleString()}</div>
        </div>
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Envíos por mes</h3>
          <MesChart datos={stats.por_mes} />
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Por estado</h3>
          <DonutChart data={stats.por_estado} colores={COLORES_ESTADO} />
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Por tipo de servicio</h3>
          <DonutChart data={stats.por_servicio} colores={COLORES_SERVICIO} />
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Distribución de estados</h3>
          <BarChart data={stats.por_estado} />
        </div>
      </div>
    </>
  );
}

// ── Tabla Usuarios ─────────────────────────────────────────────────────────

function TablaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const fetch_ = useCallback(async () => {
    const res = await apiFetch("/api/admin/usuarios");
    if (res.ok) setUsuarios(await res.json());
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const startEdit = (u) => { setEditId(u.id); setEditData({ nombre: u.nombre, correo: u.correo, telefono: u.telefono, rol: u.rol, password: "" }); };
  const cancelEdit = () => setEditId(null);

  const saveEdit = async (id) => {
    const res = await apiFetch(`/api/admin/usuarios/${id}`, { method: "PUT", body: JSON.stringify(editData) });
    if (res.ok) { setEditId(null); fetch_(); }
  };

  const del = async (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    await apiFetch(`/api/admin/usuarios/${id}`, { method: "DELETE" });
    fetch_();
  };

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Usuarios ({usuarios.length})</h2>
      </div>
      <div className={styles.tableWrapper}>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Rol</th><th>Registrado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) =>
              editId === u.id ? (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td><input className={styles.inlineInput} value={editData.nombre} onChange={(e) => setEditData({ ...editData, nombre: e.target.value })} /></td>
                  <td><input className={styles.inlineInput} value={editData.correo} onChange={(e) => setEditData({ ...editData, correo: e.target.value })} /></td>
                  <td><input className={styles.inlineInput} value={editData.telefono} onChange={(e) => setEditData({ ...editData, telefono: e.target.value })} /></td>
                  <td>
                    <select className={styles.inlineSelect} value={editData.rol} onChange={(e) => setEditData({ ...editData, rol: e.target.value })}>
                      {ROL_OPTS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>{new Date(u.creado_en).toLocaleDateString("es-GT")}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.btnSave} onClick={() => saveEdit(u.id)}>Guardar</button>
                      <button className={styles.btnCancel} onClick={cancelEdit}>Cancelar</button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.nombre}</td>
                  <td>{u.correo}</td>
                  <td>{u.telefono || "—"}</td>
                  <td><span className={`${styles.badge} ${styles[u.rol]}`}>{u.rol}</span></td>
                  <td>{new Date(u.creado_en).toLocaleDateString("es-GT")}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.btnEdit} onClick={() => startEdit(u)}>Editar</button>
                      <button className={styles.btnDelete} onClick={() => del(u.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
        {usuarios.length === 0 && <p className={styles.empty}>No hay usuarios.</p>}
      </div>
    </div>
  );
}

// ── Tabla Envíos ───────────────────────────────────────────────────────────

function TablaEnvios() {
  const [envios, setEnvios] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const fetch_ = useCallback(async () => {
    const res = await apiFetch("/api/admin/envios");
    if (res.ok) setEnvios(await res.json());
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const startEdit = (e) => {
    setEditId(e.id);
    setEditData({ destino: e.destino, peso: e.peso, tipo_servicio: e.tipo_servicio, estado: e.estado, costo_estimado: e.costo_estimado });
  };
  const cancelEdit = () => setEditId(null);

  const saveEdit = async (id) => {
    const res = await apiFetch(`/api/admin/envios/${id}`, { method: "PUT", body: JSON.stringify(editData) });
    if (res.ok) { setEditId(null); fetch_(); }
  };

  const del = async (id) => {
    if (!confirm("¿Eliminar este envío?")) return;
    await apiFetch(`/api/admin/envios/${id}`, { method: "DELETE" });
    fetch_();
  };

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Envíos ({envios.length})</h2>
      </div>
      <div className={styles.tableWrapper}>
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Usuario</th><th>Destino</th><th>Peso</th><th>Servicio</th><th>Estado</th><th>Costo</th><th>Fecha</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {envios.map((e) =>
              editId === e.id ? (
                <tr key={e.id}>
                  <td>{e.codigo_guia}</td>
                  <td>{e.usuario_nombre}</td>
                  <td><input className={styles.inlineInput} value={editData.destino} onChange={(ev) => setEditData({ ...editData, destino: ev.target.value })} /></td>
                  <td><input type="number" className={styles.inlineInput} value={editData.peso} onChange={(ev) => setEditData({ ...editData, peso: parseFloat(ev.target.value) })} /></td>
                  <td>
                    <select className={styles.inlineSelect} value={editData.tipo_servicio} onChange={(ev) => setEditData({ ...editData, tipo_servicio: ev.target.value })}>
                      <option value="standard">Standard</option>
                      <option value="express">Express</option>
                    </select>
                  </td>
                  <td>
                    <select className={styles.inlineSelect} value={editData.estado} onChange={(ev) => setEditData({ ...editData, estado: ev.target.value })}>
                      {ESTADO_OPTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><input type="number" className={styles.inlineInput} value={editData.costo_estimado} onChange={(ev) => setEditData({ ...editData, costo_estimado: parseFloat(ev.target.value) })} /></td>
                  <td>{new Date(e.creado_en).toLocaleDateString("es-GT")}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.btnSave} onClick={() => saveEdit(e.id)}>Guardar</button>
                      <button className={styles.btnCancel} onClick={cancelEdit}>Cancelar</button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={e.id}>
                  <td><strong>{e.codigo_guia}</strong></td>
                  <td>{e.usuario_nombre}</td>
                  <td>{e.destino}</td>
                  <td>{e.peso} lbs</td>
                  <td style={{ textTransform: "capitalize" }}>{e.tipo_servicio}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[e.estado]}`}>
                      {e.estado.replace("_", " ")}
                    </span>
                  </td>
                  <td>Q{Number(e.costo_estimado).toFixed(2)}</td>
                  <td>{new Date(e.creado_en).toLocaleDateString("es-GT")}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.btnEdit} onClick={() => startEdit(e)}>Editar</button>
                      <button className={styles.btnDelete} onClick={() => del(e.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
        {envios.length === 0 && <p className={styles.empty}>No hay envíos.</p>}
      </div>
    </div>
  );
}

// ── Admin principal ────────────────────────────────────────────────────────

const TABS = [
  { id: "dashboard", label: "📊 Dashboard" },
  { id: "usuarios", label: "👥 Usuarios" },
  { id: "envios", label: "📦 Envíos" },
];

export default function Admin() {
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiFetch("/api/admin/stats").then((r) => r.ok && r.json().then(setStats));
  }, []);

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarTitle}>SkyShip Admin</p>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`${styles.sidebarLink} ${tab === t.id ? styles.active : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </aside>

      <main className={styles.content}>
        {tab === "dashboard" && (
          <>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <Dashboard stats={stats} />
          </>
        )}
        {tab === "usuarios" && (
          <>
            <h1 className={styles.pageTitle}>Gestión de Usuarios</h1>
            <TablaUsuarios />
          </>
        )}
        {tab === "envios" && (
          <>
            <h1 className={styles.pageTitle}>Gestión de Envíos</h1>
            <TablaEnvios />
          </>
        )}
      </main>
    </div>
  );
}
