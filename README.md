# PharmaStock

A hospital pharmacy app: departments order drugs from the pharmacy, the pharmacy
manages the drug catalog, receives incoming stock and processes orders. Approving
an order deducts stock inside a database transaction, and every stock change is
recorded in a movement ledger.

**Stack:** React (Vite) · Express · PostgreSQL · Sequelize · JWT auth

## Backend architecture

The backend follows clean architecture: dependencies point inward, and each layer
only knows the one below it. Wiring happens once, in the composition root.

```
backend/src/
├── domain/               # Business rules — pure, no framework imports
│   ├── errors.js         #   typed errors (Validation, Forbidden, Conflict, …)
│   ├── orderPolicy.js    #   status transitions, edit/ownership rules
│   ├── stockPolicy.js    #   movement types, sufficient-stock rule
│   └── lineItems.js      #   shared { drugId, quantity } validation
├── application/          # Use cases — orchestrate repositories + policies
│   ├── authService.js
│   ├── drugService.js
│   ├── orderService.js   #   place / list / edit / approve / reject / fulfill
│   └── stockService.js   #   receive stock, list the movement ledger
├── infrastructure/       # Technical detail — Sequelize, bcrypt, JWT
│   ├── database/         #   connection + models (tables)
│   ├── repositories/     #   all query/locking logic, unitOfWork (transactions)
│   └── security/         #   passwordHasher, tokenService
├── interfaces/http/      # Delivery — Express app, routes, controllers,
│   │                     #   auth middleware, domain-error → HTTP mapping
├── container.js          # Composition root: wires the layers together
└── server.js             # Entry point
```

Services receive repositories through constructor injection and throw domain
errors; the HTTP layer maps `error.status` to the response code. Transactions are
exposed to services through a `unitOfWork.run(...)` wrapper so business code never
imports Sequelize.

## Data model

| Table | Purpose |
|---|---|
| `users` | `role` is `department` or `pharmacy`; department users carry a `departmentName` |
| `drugs` | Catalog with `code`, `stock`, `minStock` (low-stock threshold), `unit` |
| `orders` | One request from a department: `pending → approved → fulfilled`, or `rejected` / `cancelled` |
| `order_details` | Line items: order × drug × quantity |
| `stock_movements` | Ledger of stock changes: `in` (received) / `out` (order approved), with `balanceAfter` and a `reference` |

## Order flow

1. **Department** browses the catalog, builds a cart, sends an order (`pending`).
2. While the order is still `pending`, the department can **edit** it — change
   quantities, add/remove drugs, rewrite the note — or **cancel** it entirely.
3. **Pharmacy** approves (stock is checked and deducted transactionally, `out`
   movements are written to the ledger) or rejects with a reason.
4. When the drugs are handed over, pharmacy marks the order `fulfilled`.

## Incoming stock flow

Pharmacy records supplier deliveries on the **Receive stock** page: pick drugs,
enter quantities and an optional supplier/invoice reference. Submitting increments
inventory and writes `in` movements. The same page shows the full stock ledger
(`in` and `out`, newest first, with the resulting balance per line).

## Run with Docker (one command)

Each part ships its own image — Postgres, the API ([backend/Dockerfile](backend/Dockerfile))
and the web app ([frontend/Dockerfile](frontend/Dockerfile), a multi-stage build whose
nginx serves the compiled bundle and proxies `/api` to the backend):

```bash
cp backend/.env.example backend/.env   # first run only — configures the whole stack
docker compose up -d --build
```

The stack is configured entirely by [backend/.env](backend/.env.example) — the same
file local development uses (database credentials, JWT secret). Inside Docker only
`DB_HOST` is overridden to point at the `db` service.

Then open **http://localhost:8080** — the only port the stack binds on the host.
The API and Postgres live on a private compose network (`pharmastock`); nginx in
the web container proxies `/api` to the backend, which waits for Postgres to be
healthy and seeds the demo data (idempotent) before starting. Stop everything
with `docker compose down` (add `-v` to also wipe the database volume).

## Local development setup

Requires Node 18+ and a running PostgreSQL. The dockerized `db` service can
double as your dev database: uncomment its `ports: 5432:5432` mapping in
[docker-compose.yml](docker-compose.yml) (it is off by default so the stack
binds a single port). If the full dockerized stack is running, also stop its
API and web containers first: `docker compose stop backend frontend`.

```bash
# 1. Database
docker compose up -d db       # after uncommenting its ports — or: createdb pharmastock

# 2. Backend
cd backend
cp .env.example .env          # adjust DB credentials + JWT_SECRET
npm install
npm run seed                  # demo users + drug catalog
npm run dev                   # API on http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                   # app on http://localhost:5173
```

The Vite dev server proxies `/api` to the backend, so no CORS config is needed
during development.

### Demo accounts (seeded automatically in Docker, or via `npm run seed`; password: `password123`)

| Email | Role |
|---|---|
| `pharmacy@hospital.test` | Pharmacy |
| `er@hospital.test` | Department — Emergency Room |
| `icu@hospital.test` | Department — ICU |

You can also register new accounts from the login screen (pick Department or Pharmacy).

## API overview

| Method & path | Who | What |
|---|---|---|
| `POST /api/auth/register` | anyone | Create account (role + department name) |
| `POST /api/auth/login` | anyone | Get a JWT |
| `GET /api/drugs?search=` | both roles | Browse catalog |
| `POST /api/drugs` · `PUT /api/drugs/:id` · `DELETE /api/drugs/:id` | pharmacy | Manage catalog |
| `POST /api/orders` | department | Place an order (`{ note, items: [{ drugId, quantity }] }`) |
| `GET /api/orders` | both | Pharmacy sees all; a department sees its own |
| `PUT /api/orders/:id` | department | Edit own order while still `pending` (same body as place) |
| `POST /api/orders/:id/cancel` | department | Cancel own order while still `pending` |
| `PATCH /api/orders/:id/status` | pharmacy | `approved` / `rejected` (needs `rejectionReason`) / `fulfilled` |
| `POST /api/stock/in` | pharmacy | Receive stock (`{ items, reference?, note? }`) — adds to inventory |
| `GET /api/stock/movements?drugId=&type=` | pharmacy | Stock ledger, newest first |

## Styling template

All design tokens live in [frontend/src/styles/theme.css](frontend/src/styles/theme.css) —
palette, type scale, spacing, radii, and the reusable primitives (`.stamp` status
chips, `.tearline` dashed separators, `.mono` label text, `.btn`, `.field`, `.card`).
Component-level layout is in [frontend/src/styles/app.css](frontend/src/styles/app.css).
Change tokens in `theme.css` and the whole app follows.
