# Tailor-App — Frontend

React admin dashboard and public tracking page for the Tailor-App stitching management system. Built with Vite, React 18, Tailwind CSS, and Zustand.

See the [top-level README](../README.md) for a project overview, or the [backend README](../backend-tailor-app/README.md) for the API it consumes.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Folder Structure](#folder-structure)
3. [Setup](#setup)
4. [Environment Variables](#environment-variables)
5. [Scripts](#scripts)
6. [Routes & Pages](#routes--pages)
7. [State Management](#state-management)
8. [API Client](#api-client)
9. [PDF Generation](#pdf-generation)
10. [Styling](#styling)
11. [Deployment](#deployment)

---

## Tech Stack

| Concern | Package |
|---|---|
| Framework | react ^18.2.0 |
| Bundler / dev server | vite ^5.0.8 |
| Routing | react-router-dom ^6.21.1 |
| State | zustand ^4.4.7 (with persistence) |
| HTTP | axios ^1.6.2 |
| Styling | tailwindcss ^3.4.0, postcss, autoprefixer |
| Icons | @heroicons/react ^2.1.1 |
| Toasts | react-hot-toast ^2.4.1 |
| Charts | recharts ^3.8.1 |
| Dates | date-fns ^3.0.6 |
| PDF | jspdf ^2.5.1, jspdf-autotable ^3.8.1 |

---

## Folder Structure

```
frontend-tailor-app/
├── index.html
├── vite.config.js             ← dev server (5173) + /api proxy
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── src/
    ├── main.jsx               ← React entry, Router + Toaster provider
    ├── App.jsx                ← Route table + ProtectedRoute
    ├── index.css              ← Tailwind base + custom styles
    ├── components/
    │   ├── layout/
    │   │   └── AdminLayout.jsx
    │   └── ui/                ← Reusable UI primitives
    ├── pages/
    │   ├── admin/             ← Protected dashboard pages
    │   │   ├── LoginPage.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── OrdersList.jsx
    │   │   ├── CreateOrder.jsx
    │   │   ├── OrderDetails.jsx
    │   │   ├── InvoicePage.jsx
    │   │   ├── CustomersList.jsx
    │   │   ├── CustomerDetail.jsx
    │   │   ├── CalendarPage.jsx
    │   │   ├── InventoryPage.jsx
    │   │   ├── PurchasesPage.jsx
    │   │   ├── SalesPage.jsx
    │   │   └── BusinessOverview.jsx
    │   └── customer/
    │       └── TrackingPage.jsx   ← PUBLIC, no auth
    ├── services/
    │   └── api.js             ← axios instance + endpoint wrappers
    ├── store/
    │   ├── authStore.js       ← login, logout, token, user
    │   └── themeStore.js      ← dark mode toggle
    └── utils/
        ├── helpers.js
        └── pdfGenerator.js    ← invoice PDF
```

---

## Setup

```bash
cd frontend-tailor-app
npm install
cp .env.example .env   # if present; otherwise create .env manually
```

Ensure the backend is running on `http://localhost:5000` (or set `VITE_API_BASE_URL` to wherever it lives).

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (with `/api`) | `/api` (proxied to `localhost:5000` in dev) |

> Vite only exposes variables prefixed with `VITE_` to the client bundle.

---

## Scripts

```bash
npm run dev       # dev server on http://localhost:5173 (hot reload)
npm run build     # production build -> dist/
npm run preview   # serve the production build locally
```

---

## Routes & Pages

### Public
| Path | Component | Description |
|---|---|---|
| `/track/:trackingId` | `TrackingPage` | Customer order tracking. No login required. |

### Admin (wrapped by `ProtectedRoute`)
| Path | Component | Description |
|---|---|---|
| `/admin/login` | `LoginPage` | Admin sign-in. |
| `/admin/dashboard` | `Dashboard` | KPIs, upcoming deadlines, charts. |
| `/admin/orders` | `OrdersList` | Search and filter all orders. |
| `/admin/orders/new` | `CreateOrder` | Create a new order (customer + items + measurements). |
| `/admin/orders/:id` | `OrderDetails` | View / edit order, update item status, upload cloth images. |
| `/admin/orders/:id/invoice` | `InvoicePage` | View invoice, record payments, export PDF. |
| `/admin/customers` | `CustomersList` | Browse customers. |
| `/admin/customers/:id` | `CustomerDetail` | Customer profile + saved measurement profiles. |
| `/admin/calendar` | `CalendarPage` | Calendar of trials and delivery dates. |
| `/admin/inventory` | `InventoryPage` | Products, stock levels, low-stock alerts. |
| `/admin/purchases` | `PurchasesPage` | Supplier purchases and payment tracking. |
| `/admin/sales` | `SalesPage` | Retail / wholesale product sales. |
| `/admin/business` | `BusinessOverview` | Combined analytics and reports. |

`ProtectedRoute` checks for a token in the Zustand auth store; if missing or expired, it redirects to `/admin/login`.

---

## State Management

### `authStore.js` (Zustand + persist)

Persists to `localStorage` under the key `tailor-auth`.

| Field / Action | Purpose |
|---|---|
| `user` | Currently logged-in user object |
| `token` | JWT string (also attached to Axios requests) |
| `loading` | UI flag during login |
| `login(email, password)` | Calls `POST /auth/login`, stores token + user |
| `logout()` | Clears token + user |
| `initAuth()` | Restores token from storage on app load |

### `themeStore.js`
Handles light / dark mode toggle and persists the preference.

---

## API Client

`src/services/api.js` exposes a single Axios instance plus grouped wrappers.

- **Base URL**: `import.meta.env.VITE_API_BASE_URL || '/api'`
- **Request interceptor**: pulls the JWT from `localStorage` and sets `Authorization: Bearer <token>`.
- **Response interceptor**: on `401`, clears auth state and redirects to `/admin/login`.

Exported wrappers:

```js
authAPI       // login, me, changePassword
customerAPI   // list, get, create, update, remove, measurement profile CRUD
orderAPI      // list, get, create, update, remove, item status/measurements/image, stats, deadlines, chartData
invoiceAPI    // list, get, create, recordPayment
supplierAPI   // CRUD
productAPI    // CRUD
purchaseAPI   // list, get, create, remove, recordPayment, stats, businessChart
saleAPI       // list, get, create, remove, recordPayment, stats
trackingAPI   // getByTrackingId (public)
```

---

## PDF Generation

Invoice PDFs are generated client-side with `jsPDF` + `jspdf-autotable`. See `src/utils/pdfGenerator.js`. The **InvoicePage** exposes a download button that renders the current invoice to a `.pdf` file.

---

## Styling

- Tailwind CSS 3 with the default preset, extended via `tailwind.config.js`.
- Heroicons for all icons — imported per component to keep bundle size small.
- Global styles and CSS variables live in `src/index.css`.
- Dark mode is class-based and toggled via `themeStore`.

---

## Deployment

### Static hosts (Vercel / Netlify / Cloudflare Pages / S3)

```bash
npm run build
# upload ./dist as static files
```

Set the build-time env var `VITE_API_BASE_URL` to your deployed backend, e.g. `https://tailor-api.yourdomain.com/api`.

### SPA routing
Because the app uses React Router, your static host must return `index.html` for unknown paths. On Vercel and Netlify this works out of the box. For Nginx, add:

```nginx
location / {
  try_files $uri /index.html;
}
```

### Local preview of the production build
```bash
npm run build
npm run preview
```
