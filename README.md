# SkyShip Express

Plataforma web para gestión de envíos internacionales. Permite a los clientes cotizar y registrar envíos, y a los administradores gestionar usuarios, envíos y visualizar métricas del negocio.

---

## Tecnologías utilizadas

### Frontend
- **React 19** + **Vite** — SPA con hot-reload en desarrollo
- **React Router v7** — Rutas protegidas con `ProtectedRoute`
- **CSS Modules** — Estilos encapsulados por componente, sin colisiones
- **country-state-city** — Selector de países y departamentos/estados

### Backend
- **Flask 3.1.1** — API REST con patrón factory (`create_app()`)
- **Flask-JWT-Extended** — Autenticación con tokens JWT en `localStorage`
- **Flask-SQLAlchemy** — ORM para modelos de base de datos
- **Flask-CORS** — Permitir peticiones desde el frontend en desarrollo
- **Werkzeug** — Hash seguro de contraseñas con `generate_password_hash`

### Base de datos
- **MySQL** en **AWS RDS** (región `us-east-2`)
- Tablas: `users`, `shipments`, `contacts`

### Infraestructura
- **AWS Elastic Beanstalk** — Despliegue del backend Flask
- **AWS Amplify** — Despliegue del frontend React
- **Vite proxy** — `/api` → `http://localhost:5000` en desarrollo local

---

## Estructura del proyecto

```
aeropaq22/
├── backend/
│   ├── app.py              # Factory Flask, registra blueprints, seed admin
│   ├── extensions.py       # Instancias de db y jwt
│   ├── models.py           # Modelos: User, Shipment, Contact
│   ├── requirements.txt
│   ├── .env                # (excluido de git) DATABASE_URL, JWT_SECRET_KEY
│   └── routes/
│       ├── auth.py         # /api/auth/register, /login, /me
│       ├── envios.py       # /api/envios (GET, POST) — autenticado
│       ├── admin.py        # /api/admin/* — solo admin
│       └── contact.py      # /api/contact (POST) — público
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Hero, Services, Cotizador, Contact, Footer
│   │   ├── pages/          # Home, Login, Register, Envios, Admin
│   │   ├── context/        # AuthContext (usuario, token, login, logout)
│   │   └── router/         # AppRouter con ProtectedRoute
│   └── vite.config.js      # Proxy /api
└── .gitignore
```

---

## Cómo correr el proyecto localmente

### 1. Backend

```bash
cd backend
# Crea .env con:
# DATABASE_URL=mysql+pymysql://usuario:password@host/db
# JWT_SECRET_KEY=clave-secreta

py -m pip install -r requirements.txt
py app.py
# Corre en http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# Corre en http://localhost:5173
# Las peticiones /api se proxean al backend automáticamente
```

### 3. Build para producción

```bash
cd frontend
npm run deploy
# Genera el build y copia a backend/static/
# Luego desde la carpeta backend/: eb deploy
```

---

## Credenciales de prueba

| Rol           | Correo              | Contraseña   |
|---------------|---------------------|--------------|
| Administrador | admin@skyship.com   | Admin123456! |
| Cliente       | Registrarse en /register | —       |

> El administrador se crea automáticamente al iniciar el backend si no existe.

---

## Funcionalidades principales

### Clientes
- Registro con validación de contraseña (8+ caracteres, mayúscula, número, carácter especial)
- Cotizador de envíos: selección de ruta, país, departamento, peso, servicio y adicionales
- Historial de envíos con código de guía y estado en tiempo real
- Formulario de contacto conectado a la base de datos

### Administrador
- Dashboard con 6 KPIs: clientes, envíos totales, ingresos, ticket promedio, peso total, ingresos express
- 3 widgets visuales: gauge de tasa de entrega, comparación de ingresos estándar/express, desglose por estado
- Gráficas: envíos por mes, top destinos, distribución por estado, distribución por servicio
- CRUD completo de usuarios (crear, editar, eliminar)
- CRUD de envíos (editar estado, eliminar)

---

## Decisiones técnicas

- **JWT en localStorage**: Simplicidad para un proyecto académico. En producción se recomendaría `httpOnly cookies`.
- **Costo calculado en frontend**: El cotizador calcula el costo con toda la lógica (ruta, extras, factor express) y envía `costo_estimado` al backend. Esto evita duplicar la lógica de negocio.
- **Sin librería de gráficas**: Todos los visuales (donut, barras, gauge) están hechos con CSS puro (`conic-gradient`) y SVG inline para mantener el bundle ligero.
- **country-state-city**: Paquete npm para obtener países y estados sin llamadas a APIs externas.
- **Proxy Vite**: Permite desarrollar frontend y backend por separado sin problemas de CORS. En producción el frontend se sirve como archivos estáticos desde Flask, eliminando la necesidad del proxy.
