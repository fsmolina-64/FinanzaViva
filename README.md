# 🌱 FinanzaViva

Plataforma de educación financiera gamificada. Aprende finanzas jugando con un tablero multijugador estilo Monopoly, quizzes con recompensas, gestor contable personal y sistema de perfil con progresión.

---

## 🚀 Instalación rápida

### Opción A — Proyecto nuevo desde cero

```bash
# 1. Crea el proyecto Angular (si no tienes uno)
ng new finanza-viva --standalone --routing --style css

# 2. Reemplaza todo el contenido de src/ con los archivos del ZIP
# 3. Copia también: angular.json, package.json, tsconfig*.json

# 4. Instala dependencias
npm install

# 5. Levanta el servidor
ng serve
```

### Opción B — Sobre tu proyecto FinanzaPro existente

```bash
# 1. Copia todo el contenido de src/ encima de tu src/ actual
# 2. Reemplaza angular.json (cambia "finanzas-piensa" por "finanza-viva" en el nombre del proyecto)
# 3. El package.json es idéntico — no necesitas reinstalar
ng serve
```

Abre **http://localhost:4200** → pantalla de Login/Registro.

---

## 📁 Estructura del proyecto

```
src/
├── index.html                   ← Sin márgenes, fonts preloaded
├── styles.css                   ← Paleta esmeralda global, tokens CSS
├── main.ts
└── app/
    ├── app.ts                   ← Root component
    ├── app.config.ts            ← APP_INITIALIZER restaura sesión al refrescar
    ├── app.routes.ts            ← Rutas + AuthGuard + GuestGuard
    │
    ├── services/
    │   ├── auth.service.ts      ← Login/Registro/Logout con localStorage
    │   ├── profile.service.ts   ← Perfil, monedas, XP, nivel, logros
    │   ├── finanzas.service.ts  ← Registro contable, totales, balance
    │   └── game.service.ts      ← Motor del tablero (24 casillas, propiedades, rentas)
    │
    ├── shared/nav/              ← Top navbar fija (4 archivos)
    │
    ├── auth/                    ← Login + Registro split-panel (4 archivos)
    ├── home/                    ← Dashboard principal (4 archivos)
    ├── tablero/                 ← Tablero multijugador animado (4 archivos)
    ├── academia/                ← Quizzes aleatorios 6 temas (4 archivos)
    ├── finanzas/                ← Gestor contable (4 archivos)
    └── perfil/                  ← Perfil editable (4 archivos)
```

---

## 🎨 Paleta de colores

| Token           | Valor       | Uso                         |
|----------------|-------------|-----------------------------|
| `--primary`    | `#10B981`   | Verde esmeralda — color firma |
| `--secondary`  | `#8B5CF6`   | Violeta — XP y academia     |
| `--accent`     | `#F59E0B`   | Ámbar — monedas y premios   |
| `--bg`         | `#F0FDF6`   | Fondo principal verde claro |
| `--surface`    | `#FFFFFF`   | Tarjetas y paneles          |
| `--danger`     | `#EF4444`   | Egresos, alertas            |

---

## 🗺️ Rutas disponibles

| Ruta         | Pantalla            | Protegida |
|-------------|---------------------|-----------|
| `/auth`     | Login / Registro    | Solo invitados |
| `/home`     | Dashboard           | ✅ Auth |
| `/tablero`  | Tablero Monopoly    | ✅ Auth |
| `/academia` | Quizzes financieros | ✅ Auth |
| `/finanzas` | Gestor contable     | ✅ Auth |
| `/perfil`   | Mi perfil           | ✅ Auth |

---

## 🎮 Funcionalidades principales

### 🔑 Autenticación
- Login y Registro con email + contraseña
- Sesión persistida en `localStorage`
- Guards que protegen todas las rutas privadas
- Redirección automática al refrescar página

### 🎲 El Tablero
- Soporte para **2 o 3 jugadores** con fichas y colores independientes
- **24 casillas** tipo Monopoly: propiedades, eventos, impuestos, bonos, suerte, cárcel
- **Movimiento animado** casilla por casilla (340ms por paso)
- Modal de evento aparece **solo al terminar el recorrido**
- **Sistema de propiedades**: comprar y cobrar renta a otros jugadores
- Eventos de suerte aleatorios (12 diferentes)

### 🎓 La Academia
- **6 temas**: Presupuesto, Ahorro, Inversión, Deuda, Crédito, Impuestos
- **5 preguntas por tema**, mezcladas aleatoriamente en cada intento
- **+150 monedas y +40 XP** por respuesta correcta
- Reintento ilimitado con nuevas preguntas cada vez

### 💳 Mis Finanzas
- Registro de **Ingresos y Egresos** con fecha, categoría y concepto
- **Balance por día, mes y total acumulado**
- Navegación mensual con flecha
- Filtros por tipo de movimiento
- Persistencia individual por usuario en `localStorage`

### 👤 Mi Perfil
- Editor de nombre, fecha de nacimiento, bio e intereses (hasta 5)
- **12 avatares emoji** seleccionables
- Estadísticas en vivo: monedas, XP, nivel, quizzes completados
- **6 logros** desbloqueables con indicador visual
- Barra de progreso de nivel (cada 300 XP)

---

## 💾 Persistencia de datos

Todo se guarda en `localStorage` con claves por usuario:

| Clave                        | Contenido                   |
|-----------------------------|------------------------------|
| `fv_users`                  | Todos los usuarios registrados |
| `fv_session`                | Sesión activa actual         |
| `fv_profile_{email}`        | Perfil del usuario           |
| `fv_movs_{email}`           | Movimientos financieros      |

> **Próximo paso**: reemplazar `localStorage` por llamadas a tu API/backend.

---

## 🧪 Tests

```bash
ng test
```

Cada componente tiene su archivo `.spec.ts` con pruebas unitarias básicas.

---

## 📦 Stack tecnológico

- **Angular 21** — Standalone Components, Signals, Control Flow (`@if`, `@for`)
- **TypeScript 5.9** — Tipado estricto
- **CSS Variables** — Tokens de diseño centralizados en `styles.css`
- **Google Fonts** — Plus Jakarta Sans + Space Grotesk
- **localStorage** — Persistencia local (sin backend)
- **Vitest** — Test runner
