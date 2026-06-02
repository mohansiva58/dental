# DentalSync — Dental Clinic Management System

A full-stack dental clinic management system for staff (receptionists, doctors, administrators) to manage patients, OP records, treatments, invoices, follow-ups, and reporting.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/dental-clinic run dev` — run the frontend (port 23961, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run seed` — seed demo data (runs once; skips if users exist)
- Required env: `DATABASE_URL` — Postgres connection string

## Demo Credentials

| Username | Password | Role |
|---|---|---|
| admin | admin123 | Administrator |
| receptionist | recept123 | Receptionist |
| doctor | doctor123 | Doctor |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter routing, shadcn/ui components, Tailwind CSS
- API: Express 5 + cookie-parser (session via in-memory Map with cookie)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Charts: recharts

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas (backend validation)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks (frontend data fetching)
- `lib/db/src/schema/` — Drizzle table definitions (users, patients, op-records, revisits, diagnoses, prescriptions, treatments, invoices, followups)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, users, patients, op-records, clinical, invoices, followups, dashboard, notifications, reports)
- `artifacts/dental-clinic/src/pages/` — 14 React page components
- `artifacts/dental-clinic/src/components/layout.tsx` — sidebar navigation (role-gated)
- `artifacts/dental-clinic/src/lib/auth.tsx` — AuthProvider + useAuth hook

## Architecture decisions

- Session auth uses an in-memory Map (token → userId) with httpOnly cookies — suitable for demo/single-instance; replace with DB-backed sessions for production
- OP records auto-expire 15 days after creation (checked at query time, not via DB job)
- Numeric DB columns (cost, subtotal, total) stored as `text/numeric` in Postgres — must convert `number → String()` on insert
- All API hooks imported from `@workspace/api-client-react` (generated); never use relative paths for hooks
- Role-gating on frontend routes: `administrator` only for Reports and User Management; `doctor` and `administrator` for Doctor Workspace

## Product

- **Login**: Role-based auth with demo credentials shown on screen
- **Dashboard**: Stats widgets, recent patients, today's OP entries
- **Patients**: Searchable list, register new patients, full patient detail with tabbed clinical history
- **OP Records**: Outpatient registrations (15-day validity), revisit tracking, diagnoses
- **Doctor Workspace**: Patient search + quick-add for diagnoses, prescriptions, treatments, follow-ups
- **Treatments**: Cross-patient treatment list with status updates
- **Invoices**: Billing with payment status tracking, line items
- **Follow-ups**: Scheduled appointment tracking with overdue indicators
- **Notifications**: Aggregated alerts for overdue follow-ups, pending treatments, unpaid invoices
- **Reports**: Daily and monthly reports with bar/line charts (admin only)
- **User Management**: Staff account creation and role/status management (admin only)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck` — the libs must be built first for @workspace/db exports to resolve
- After changing OpenAPI spec, run codegen: `pnpm --filter @workspace/api-spec run codegen`
- DB push can fail on column conflicts — use `pnpm --filter @workspace/db run push-force`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
