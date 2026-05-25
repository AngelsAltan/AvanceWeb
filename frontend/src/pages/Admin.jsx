import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./Admin.module.css";

const ESTADO_OPTS = ["pendiente", "en_tránsito", "entregado"];
const ROL_OPTS    = ["cliente", "admin"];
const MESES       = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const C_ESTADO    = { pendiente:"#f59e0b", "en_tránsito":"#3b82f6", entregado:"#10b981" };
const C_SERVICIO  = { standard:"#2563eb", express:"#f97316" };
const C_PALETTE   = ["#2563eb","#facc15","#1e3a8a","#10b981","#f97316","#8b5cf6","#06b6d4","#ef4444"];

function authHdr() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}
async function api(url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...authHdr(), ...(opts.headers || {}) },
  });
}
const fmtQ = v => `Q${Number(v).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

/* ── Notificaciones (toast) ── */
function useToast() {
  const [toast, setToast] = useState(null);
  const notify = useCallback((msg, type = "success") => {
    setToast({ msg, type, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  return [toast, notify];
}

function Toast({ toast }) {
  if (!toast) return null;
  const esError = toast.type === "error";
  return (
    <div
      key={toast.id}
      className={`${styles.toast} ${esError ? styles.toastError : styles.toastSuccess}`}
      role="status"
    >
      <span className={styles.toastIcon}>{esError ? "✕" : "✓"}</span>
      <span>{toast.msg}</span>
    </div>
  );
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
      <div className={styles.donut} style={{ background: `conic-gradient(${grad})` }}>
        <div className={styles.donutHole}>
          <span className={styles.donutTotal}>{total}</span>
          <span className={styles.donutCaption}>total</span>
        </div>
      </div>
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

/* ── Gauge circular — Tasa de entrega ── */
function GaugeTasa({ valor }) {
  const clamped  = Math.min(Math.max(valor, 0), 100);
  const circunf  = 2 * Math.PI * 52;
  const relleno  = (clamped / 100) * circunf;
  const color    = clamped >= 80 ? "#10b981" : clamped >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className={styles.gaugeWrap}>
      <svg viewBox="0 0 120 120" className={styles.gaugeSvg}>
        <circle cx="60" cy="60" r="52" fill="none" stroke="#eef2fb" strokeWidth="11" />
        <circle cx="60" cy="60" r="52" fill="none"
          stroke={color} strokeWidth="11"
          strokeDasharray={`${relleno} ${circunf}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="56" textAnchor="middle" dominantBaseline="middle"
          fontSize="23" fontWeight="800" fill="#0f172a">{clamped}%</text>
        <text x="60" y="78" textAnchor="middle" fontSize="9" fill="#94a3b8">entregados</text>
      </svg>
    </div>
  );
}

/* ── Barras comparativas de ingresos ── */
function IngresosBars({ totales, express }) {
  const standard = Math.max(totales - express, 0);
  const max      = Math.max(totales, 1);
  const items    = [
    { label: "Estándar", valor: standard, color: "#4361ee" },
    { label: "Express",  valor: express,  color: "#f97316" },
  ];
  return (
    <div className={styles.ingrWrap}>
      <p className={styles.ingrTotal}>{fmtQ(totales)}</p>
      <p className={styles.ingrSub}>ingresos totales</p>
      <div className={styles.ingrBars}>
        {items.map(({ label, valor, color }) => (
          <div key={label} className={styles.ingrRow}>
            <div className={styles.ingrMeta}>
              <span className={styles.ingrDot} style={{ background: color }} />
              <span className={styles.ingrLabel}>{label}</span>
              <span className={styles.ingrAmt}>{fmtQ(valor)}</span>
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

/* ── Estado de envíos con progreso ── */
function EstadoWidget({ pendientes, transito, entregados }) {
  const total = pendientes + transito + entregados || 1;
  const items = [
    { label: "Pendientes",  valor: pendientes, color: "#f59e0b", bg: "#fef3c7", txt: "#92400e" },
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
        </div>
      ))}
    </div>
  );
}

/* ── Vista General · Bento Grid ── */
function Dashboard({ stats }) {
  if (!stats) return <div className={styles.loading}>Cargando métricas...</div>;

  const mesPorMes = Object.fromEntries(
    stats.por_mes.map(d => [`${MESES[d.mes]} ${d.anio}`, d.total])
  );

  const kpis = [
    { label: "Clientes",        value: stats.total_usuarios,    accent: "#2563eb" },
    { label: "Envíos totales",  value: stats.total_envios,      accent: "#10b981" },
    { label: "Ingresos",        value: fmtQ(stats.ingresos_totales ?? 0), accent: "#1e3a8a" },
    { label: "Ticket promedio", value: fmtQ(stats.ticket_promedio ?? 0),  accent: "#facc15" },
    { label: "Peso total",      value: `${Number(stats.peso_total ?? 0).toLocaleString("es-GT")} lbs`, accent: "#64748b" },
    { label: "Ingresos express",value: fmtQ(stats.ingresos_express ?? 0),  accent: "#f97316" },
  ];

  return (
    <div className={styles.bento}>
      {kpis.map(k => (
        <div key={k.label} className={`${styles.bentoCard} ${styles.kpiTile}`}>
          <span className={styles.kpiDot} style={{ background: k.accent }} />
          <p className={styles.kpiTileLabel}>{k.label}</p>
          <p className={styles.kpiTileValue}>{k.value}</p>
        </div>
      ))}

      <div className={`${styles.bentoCard} ${styles.c2x2}`}>
        <h3 className={styles.cardTitle}>Envíos por mes</h3>
        {stats.por_mes.length === 0
          ? <p className={styles.empty}>Sin datos aún</p>
          : <BarChart data={mesPorMes} colores={C_PALETTE} />}
      </div>

      <div className={`${styles.bentoCard} ${styles.c1x2}`}>
        <h3 className={styles.cardTitle}>Tasa de entrega</h3>
        <GaugeTasa valor={stats.tasa_entrega ?? 0} />
      </div>

      <div className={`${styles.bentoCard} ${styles.c1x2}`}>
        <h3 className={styles.cardTitle}>Estado de envíos</h3>
        <EstadoWidget
          pendientes={stats.envios_pendientes ?? 0}
          transito={stats.envios_transito ?? 0}
          entregados={stats.envios_entregados ?? 0}
        />
      </div>

      <div className={`${styles.bentoCard} ${styles.c2x1}`}>
        <h3 className={styles.cardTitle}>Distribución de ingresos</h3>
        <IngresosBars totales={stats.ingresos_totales ?? 0} express={stats.ingresos_express ?? 0} />
      </div>

      <div className={`${styles.bentoCard} ${styles.c2x2}`}>
        <h3 className={styles.cardTitle}>Top destinos</h3>
        {Object.keys(stats.por_region).length === 0
          ? <p className={styles.empty}>Sin datos aún</p>
          : <BarChart data={stats.por_region} colores={C_PALETTE} />}
      </div>

      <div className={`${styles.bentoCard} ${styles.c2x1}`}>
        <h3 className={styles.cardTitle}>Estado de envíos</h3>
        <DonutChart data={stats.por_estado} colores={C_ESTADO} />
      </div>

      <div className={`${styles.bentoCard} ${styles.c2x1}`}>
        <h3 className={styles.cardTitle}>Tipo de servicio</h3>
        <DonutChart data={stats.por_servicio} colores={C_SERVICIO} />
      </div>
    </div>
  );
}

/* ── Estado vacío del panel de detalle ── */
function EmptyDetail({ texto }) {
  return (
    <div className={styles.detailEmpty}>
      <div className={styles.detailEmptyIcon} aria-hidden>◧</div>
      <p>{texto}</p>
    </div>
  );
}

/* ── Logística de Envíos · Split-Pane ── */
function LogisticaEnvios({ notify }) {
  const [envios,   setEnvios]   = useState([]);
  const [sel,      setSel]      = useState(null);
  const [form,     setForm]     = useState({});
  const [q,        setQ]        = useState("");
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);

  const load = useCallback(async () => {
    const r = await api("/api/admin/envios");
    if (r.ok) setEnvios(await r.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  const seleccionar = (e) => {
    setSel(e);
    setForm({ destino: e.destino, peso: e.peso, tipo_servicio: e.tipo_servicio, estado: e.estado, costo_estimado: e.costo_estimado });
    setError("");
  };
  const chg = e => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async () => {
    setCargando(true); setError("");
    const r = await api(`/api/admin/envios/${sel.id}`, { method: "PUT", body: JSON.stringify(form) });
    const d = await r.json();
    setCargando(false);
    if (!r.ok) { setError(d.error || "Error al guardar"); notify(d.error || "Error al guardar", "error"); return; }
    await load();
    setSel(s => ({ ...s, ...d }));
    notify(`Envío ${sel.codigo_guia} actualizado correctamente`);
  };

  const eliminar = async () => {
    if (!confirm("¿Eliminar este envío?")) return;
    const codigo = sel.codigo_guia;
    const r = await api(`/api/admin/envios/${sel.id}`, { method: "DELETE" });
    if (!r.ok) { notify("No se pudo eliminar el envío", "error"); return; }
    setSel(null);
    load();
    notify(`Envío ${codigo} eliminado`);
  };

  const filtrados = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return envios;
    return envios.filter(e =>
      e.codigo_guia?.toLowerCase().includes(t) ||
      e.destino?.toLowerCase().includes(t) ||
      e.usuario_nombre?.toLowerCase().includes(t)
    );
  }, [envios, q]);

  const estadoClass = { pendiente: styles.badgePendiente, "en_tránsito": styles.badgeTransito, entregado: styles.badgeEntregado };

  return (
    <div className={`${styles.split} ${sel ? styles.splitDetailOpen : ""}`}>
      {/* Lista */}
      <div className={styles.listPane}>
        <div className={styles.listSearch}>
          <input
            placeholder="Buscar por código, destino o cliente..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div className={styles.listCount}>{filtrados.length} envíos</div>
        <div className={styles.listScroll}>
          {filtrados.map(e => (
            <button
              key={e.id}
              className={`${styles.itemCard} ${sel?.id === e.id ? styles.itemActive : ""}`}
              onClick={() => seleccionar(e)}
            >
              <div className={styles.itemTop}>
                <strong>{e.codigo_guia}</strong>
                <span className={`${styles.badge} ${estadoClass[e.estado] || ""}`}>
                  {e.estado.replace("_", " ")}
                </span>
              </div>
              <div className={styles.itemDest}>{e.destino}</div>
              <div className={styles.itemMeta}>
                <span>{e.usuario_nombre}</span>
                <span className={styles.itemPrice}>{fmtQ(e.costo_estimado)}</span>
              </div>
            </button>
          ))}
          {filtrados.length === 0 && <p className={styles.empty}>Sin resultados.</p>}
        </div>
      </div>

      {/* Detalle */}
      <div className={styles.detailPane}>
        {!sel ? (
          <EmptyDetail texto="Selecciona un envío de la lista para ver y editar sus detalles." />
        ) : (
          <div className={styles.detailInner}>
            <button className={styles.backBtn} onClick={() => setSel(null)}>← Volver</button>
            <div className={styles.detailHeader}>
              <div>
                <p className={styles.detailEyebrow}>Envío</p>
                <h2 className={styles.detailTitle}>{sel.codigo_guia}</h2>
                <p className={styles.detailSub}>
                  {sel.usuario_nombre} · {new Date(sel.creado_en).toLocaleDateString("es-GT")}
                </p>
              </div>
              <span className={`${styles.badge} ${estadoClass[sel.estado] || ""} ${styles.badgeLg}`}>
                {sel.estado.replace("_", " ")}
              </span>
            </div>

            {error && <div className={styles.formError}>{error}</div>}

            <div className={styles.formGrid}>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>Destino</label>
                <input name="destino" value={form.destino} onChange={chg} />
              </div>
              <div className={styles.field}>
                <label>Peso (lbs)</label>
                <input name="peso" type="number" step="0.1" value={form.peso} onChange={chg} />
              </div>
              <div className={styles.field}>
                <label>Servicio</label>
                <select name="tipo_servicio" value={form.tipo_servicio} onChange={chg}>
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Estado</label>
                <select name="estado" value={form.estado} onChange={chg}>
                  {ESTADO_OPTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Costo estimado (Q)</label>
                <input name="costo_estimado" type="number" step="0.01" value={form.costo_estimado} onChange={chg} />
              </div>
            </div>

            <div className={styles.detailActions}>
              <button className={styles.btnDanger} onClick={eliminar}>Eliminar</button>
              <button className={styles.btnPrimary} onClick={guardar} disabled={cargando}>
                {cargando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Control de Usuarios · Split-Pane ── */
function ControlUsuarios({ notify }) {
  const [usuarios, setUsuarios] = useState([]);
  const [sel,      setSel]      = useState(null);   // objeto usuario | "nuevo" | null
  const [form,     setForm]     = useState({});
  const [claveAdmin, setClaveAdmin] = useState("");
  const [q,        setQ]        = useState("");
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);

  const load = useCallback(async () => {
    const r = await api("/api/admin/usuarios");
    if (r.ok) setUsuarios(await r.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  const nuevo = () => {
    setSel("nuevo");
    setForm({ nombre: "", correo: "", telefono: "", direccion: "", rol: "cliente", password: "" });
    setClaveAdmin("");
    setError("");
  };
  const seleccionar = (u) => {
    setSel(u);
    setForm({ nombre: u.nombre, correo: u.correo, telefono: u.telefono || "", direccion: u.direccion || "", rol: u.rol, password: "" });
    setClaveAdmin("");
    setError("");
  };
  const chg = e => setForm({ ...form, [e.target.name]: e.target.value });

  const esNuevo = sel === "nuevo";
  const rolBloqueado = !esNuevo && sel?.rol === "admin";          // un admin no puede degradarse
  const pideClave = form.rol === "admin" && (esNuevo || sel?.rol !== "admin"); // promover a admin requiere clave

  const guardar = async () => {
    setCargando(true); setError("");
    const url    = esNuevo ? "/api/admin/usuarios" : `/api/admin/usuarios/${sel.id}`;
    const method = esNuevo ? "POST" : "PUT";
    const r = await api(url, { method, body: JSON.stringify({ ...form, clave_admin: claveAdmin }) });
    const d = await r.json();
    setCargando(false);
    if (!r.ok) { setError(d.error || "Error al guardar"); notify(d.error || "Error al guardar", "error"); return; }
    notify(esNuevo ? `Usuario ${d.nombre} creado correctamente` : `Usuario ${d.nombre} actualizado correctamente`);
    await load();
    setSel(d);
    setForm(f => ({ ...f, password: "" }));
    setClaveAdmin("");
  };

  const eliminar = async () => {
    if (esNuevo) return;
    if (!confirm("¿Eliminar este usuario?")) return;
    const nombre = sel.nombre;
    const r = await api(`/api/admin/usuarios/${sel.id}`, { method: "DELETE" });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      notify(d.error || "No se pudo eliminar el usuario", "error");
      return;
    }
    setSel(null);
    load();
    notify(`Usuario ${nombre} eliminado`);
  };

  const filtrados = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return usuarios;
    return usuarios.filter(u =>
      u.nombre?.toLowerCase().includes(t) ||
      u.correo?.toLowerCase().includes(t)
    );
  }, [usuarios, q]);

  return (
    <div className={`${styles.split} ${sel ? styles.splitDetailOpen : ""}`}>
      {/* Lista */}
      <div className={styles.listPane}>
        <div className={styles.listSearch}>
          <input
            placeholder="Buscar usuario..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button className={styles.btnNew} onClick={nuevo}>+ Nuevo</button>
        </div>
        <div className={styles.listCount}>{filtrados.length} usuarios</div>
        <div className={styles.listScroll}>
          {filtrados.map(u => (
            <button
              key={u.id}
              className={`${styles.itemCard} ${styles.userItem} ${sel?.id === u.id ? styles.itemActive : ""}`}
              onClick={() => seleccionar(u)}
            >
              <div className={styles.avatar}>{(u.nombre || "?").charAt(0).toUpperCase()}</div>
              <div className={styles.itemBody}>
                <div className={styles.itemTop}>
                  <strong>{u.nombre}</strong>
                  <span className={`${styles.badge} ${u.rol === "admin" ? styles.badgeAdmin : styles.badgeCliente}`}>
                    {u.rol}
                  </span>
                </div>
                <div className={styles.itemMetaSmall}>{u.correo}</div>
              </div>
            </button>
          ))}
          {filtrados.length === 0 && <p className={styles.empty}>Sin resultados.</p>}
        </div>
      </div>

      {/* Detalle */}
      <div className={styles.detailPane}>
        {!sel ? (
          <EmptyDetail texto="Selecciona un usuario o pulsa + Nuevo para crear uno." />
        ) : (
          <div className={styles.detailInner}>
            <button className={styles.backBtn} onClick={() => setSel(null)}>← Volver</button>
            <div className={styles.detailHeader}>
              <div className={styles.avatarLg}>
                {esNuevo ? "+" : (sel.nombre || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={styles.detailEyebrow}>{esNuevo ? "Nuevo registro" : "Usuario"}</p>
                <h2 className={styles.detailTitle}>{esNuevo ? "Crear usuario" : sel.nombre}</h2>
                {!esNuevo && (
                  <p className={styles.detailSub}>
                    Registrado el {new Date(sel.creado_en).toLocaleDateString("es-GT")}
                  </p>
                )}
              </div>
            </div>

            {error && <div className={styles.formError}>{error}</div>}

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Nombre *</label>
                <input name="nombre" value={form.nombre} onChange={chg} />
              </div>
              <div className={styles.field}>
                <label>Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={chg} />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>Correo *</label>
                <input name="correo" type="email" value={form.correo} onChange={chg} />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>Dirección</label>
                <input name="direccion" value={form.direccion} onChange={chg} />
              </div>
              <div className={styles.field}>
                <label>Rol</label>
                <select name="rol" value={form.rol} onChange={chg} disabled={rolBloqueado}>
                  {ROL_OPTS.map(r => <option key={r}>{r}</option>)}
                </select>
                {rolBloqueado && (
                  <span className={styles.fieldHint}>El rol de administrador no puede cambiarse.</span>
                )}
              </div>
              <div className={styles.field}>
                <label>{esNuevo ? "Contraseña *" : "Nueva contraseña"}</label>
                <input
                  name="password" type="password" value={form.password} onChange={chg}
                  placeholder={esNuevo ? "" : "Dejar vacío para no cambiar"}
                />
              </div>
              {pideClave && (
                <div className={`${styles.field} ${styles.fieldFull} ${styles.fieldClave}`}>
                  <label>🔑 Clave de autorización *</label>
                  <input
                    type="password"
                    value={claveAdmin}
                    onChange={e => setClaveAdmin(e.target.value)}
                    placeholder="Requerida para otorgar el rol de administrador"
                  />
                  <span className={styles.fieldHint}>
                    Solo el jefe posee esta clave. Sin ella no se puede crear ni promover a un administrador.
                  </span>
                </div>
              )}
            </div>

            <div className={styles.detailActions}>
              {!esNuevo && sel.rol === "admin" && (
                <span className={styles.protectedNote}>🔒 Cuenta protegida</span>
              )}
              {!esNuevo && sel.rol !== "admin" && (
                <button className={styles.btnDanger} onClick={eliminar}>Eliminar</button>
              )}
              <button className={styles.btnPrimary} onClick={guardar} disabled={cargando}>
                {cargando ? "Guardando..." : esNuevo ? "Crear usuario" : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Admin principal ── */
const TABS = [
  { id: "dashboard", label: "Vista General"       },
  { id: "envios",    label: "Logística de Envíos" },
  { id: "usuarios",  label: "Control de Usuarios" },
];

export default function Admin() {
  const [tab,   setTab]   = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [toast, notify]   = useToast();

  const loadStats = useCallback(async () => {
    const r = await api("/api/admin/stats");
    if (r.ok) setStats(await r.json());
  }, []);
  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandDot} />
          SkyShip <span className={styles.brandLight}>Admin</span>
        </div>
        <nav className={styles.segmented}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.segItem} ${tab === t.id ? styles.segActive : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className={styles.topRight} />
      </header>

      <main className={styles.canvas}>
        {tab === "dashboard" && <Dashboard stats={stats} />}
        {tab === "envios"    && <LogisticaEnvios notify={notify} />}
        {tab === "usuarios"  && <ControlUsuarios notify={notify} />}
      </main>

      <Toast toast={toast} />
    </div>
  );
}
