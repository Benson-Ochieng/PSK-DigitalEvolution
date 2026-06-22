# Architectural Decision Records (ADRs)

This document lists the significant architectural decisions, reasons, and trade-offs made during the PetStore Kenya backend development.

---

## ADR 1: PIN-Based Session Cookie Authentication

### Context
Loki (distributor) requires administrative access to monitor competitor prices, update products, and manage order statuses. We need a simple, zero-maintenance admin gate without introducing database tables, OAuth systems, or third-party email setups.

### Decision
We implemented a **PIN-based session cookie validation**:
1. An admin PIN (`ADMIN_PIN`) is set as a secure environment variable.
2. The user types this PIN at `/admin/login`. On validation, a cookie `admin_pin` is set with `HttpOnly` and `SameSite=Lax`.
3. Loaders under `/admin/*` verify the cookie value matches the environment variable.

### Consequences
- **Pros**:
  - Extremely simple to configure and deploy (no dependencies, no database lookups).
  - Highly secure for local/private usage.
- **Cons**:
  - Does not support individual user audit logs (every admin shares the same credential).
  - Changing the PIN requires restarting the application (to reload the environment variables).

---

## ADR 2: Bundle-Safe Programmatic Database Migrations

### Context
When building a containerized Next.js/React Router application, referencing external SQL files via relative paths (like `fs.readFileSync`) often fails in production because build tools (like Vite) bundle JavaScript but omit raw SQL directories.

### Decision
We write migrations inside a TypeScript file (`app/db/migrations.ts`) exporting structured objects with SQL query strings. The database pool initializer runs these migrations programmatically using a dedicated helper (`app/db/migrate.server.ts`).

### Consequences
- **Pros**:
  - 100% bundle-safe. The database setup scripts are compiled directly into the application code bundle.
  - No need to configure Docker copy-steps or volume mounts for SQL files.
  - Safe, transactional execution on pool startup.
- **Cons**:
  - Large SQL seeds or changesets can make the TS file large.

---

## ADR 3: Styling Isolation for Admin Panel via Vanilla CSS

### Context
The main PetStore Kenya storefront uses a distinctive "Neo-brutalist kraft paper" design. The admin dashboard has different needs (complex grids, analytical cards, data tables) and benefits from a dark mode layout. Using conflicting tailwind utility classes or overriding theme configurations can bleed styles between the storefront and admin panel.

### Decision
We isolated the admin dashboard styling inside a standalone CSS stylesheet (`app/admin.css`) imported exclusively at the root layout of the admin panel (`app/routes/admin.tsx`).

### Consequences
- **Pros**:
  - Clean separation: Storefront styling remains completely untouched.
  - Simpler CSS rule inheritance since all admin components are nested inside the admin layout.
- **Cons**:
  - Style properties must be maintained in vanilla CSS rather than utility classes.
- **Visuals**:
  - Implemented a premium dark neo-brutalist design matching the brand aesthetic.

---

## ADR 4: Auto-Detecting and Configurable Database SSL

### Context
In cloud-managed production environments, PostgreSQL databases usually require SSL connections (often with self-signed certs requiring `rejectUnauthorized: false`). However, local Docker environments or private network companion databases do not support or require SSL. If we hardcode SSL for all production mode runs, deployments using local/companion DBs fail.

### Decision
We implemented a multi-tiered auto-detection configuration:
1. If `DATABASE_URL` contains local patterns (`localhost`, `127.0.0.1`, `host.docker.internal`, or our container host `petstore-db`), or if `sslmode=disable` is appended to the connection string, SSL is disabled.
2. If `DATABASE_SSL` is set to `false`, or `PGSSLMODE` is set to `disable` in environment variables, SSL is disabled.
3. Otherwise, for production runs, we default to `{ rejectUnauthorized: false }`.

### Consequences
- **Pros**:
  - Runs out of the box on Render, Neon, Supabase (which require SSL), as well as local production Docker containers and custom self-hosted environments.
  - Zero manual config required for standard deployments.
- **Cons**:
  - Requires developers to be aware of the keywords that trigger auto-disablement if they want to override manually.
