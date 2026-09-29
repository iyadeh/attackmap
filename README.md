# AttackMap

> **Developer-focused application security architecture tool with deterministic risk analysis and security scoring.**

AttackMap is an interactive modeling canvas designed for developers, architects, and security engineers. Instead of relying on static spreadsheets or disconnected diagrams, AttackMap evaluates your application's architecture declaratively and deterministically—flagging structural attack surfaces, calculating an objective security score, and managing risk acceptance in real time.

---

## ⚡ Key Capabilities

* **Interactive Architecture Canvas:** Pan, zoom, and model complex cloud systems with directed edges and protocol-aware connections powered by `@xyflow/react`.
* **Deterministic Risk Engine:** Pure, functional rule evaluation without AI or external probes. Given the same architecture, it always produces the same findings and stable IDs.
* **10 Active Security Baseline Rules:** Instant detection of unauthenticated public APIs, unencrypted transit data, sensitive storage exposures, missing rate limits, and more (`AM-001`–`AM-010`).
* **Objective Technical Scoring (0–100):** Deduction-based scoring reflecting raw technical posture. Accepting a business risk records rationale without artificially inflating the technical score.
* **Finding Triage & Accepted Risk:** Document risk acceptance with mandatory rationales (1–1000 characters) stored in PostgreSQL, with full *Reopen* and *Implicit Auto-Resolve* support.
* **Transactional Snapshot Persistence:** Atomic PostgreSQL saves via Drizzle ORM. Node visual positions (X/Y), properties, and connections persist together in isolated transactions.
* **Debounced Autosave Coordinator:** Background autosave with a 1500ms debounce window, JSON fingerprint diffing, request coalescing, and generation tracking to eliminate race conditions.
* **Compact Security Overview:** Real-time derived posture summaries, severity distributions, and top 5 priority risks for quick executive review.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) with React Compiler enabled |
| **Language** | [TypeScript 5 (Strict Mode)](https://www.typescriptlang.org/) |
| **UI Library** | [React 19](https://react.dev/) |
| **Canvas & Graphs** | [@xyflow/react 12](https://reactflow.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) (Industrial warm monochrome palette) |
| **Database & Driver** | [PostgreSQL](https://www.postgresql.org/) via [`postgres`](https://github.com/porsager/postgres) |
| **ORM & Migrations** | [Drizzle ORM](https://orm.drizzle.team/) & Drizzle Kit |
| **Iconography** | [Phosphor Icons (`@phosphor-icons/react`)](https://phosphoricons.com/) |
| **Validation** | Native hand-written typed parsers (strict dependency discipline, zero Zod) |
| **Test Runner** | Native Node.js Test Runner (`node --test`) |

---

## 📋 Prerequisites

Before running the application locally, ensure you have:

* **Node.js:** `v20.x` or `v22.x` (LTS recommended)
* **Package Manager:** [`pnpm`](https://pnpm.io/) (`>= 9.x` or `11.x`)
* **PostgreSQL:** Running instance (`14+` or `16+`) on `localhost:5432`

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/<YOUR_USERNAME>/attackmap.git
cd attackmap
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory (you can copy `.env.example` as a template):

```bash
cp .env.example .env.local
```

Configure your PostgreSQL database connection string in `.env.local`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/attackmap
```

*(Ensure the target database exists in your PostgreSQL instance before running migrations).*

### 4. Run Database Migrations

Apply the Drizzle SQL migrations to provision the relational schema (`projects`, `services`, `service_connections`, and `finding_dispositions`):

```bash
pnpm db:migrate
```

### 5. Start the Development Server

```bash
pnpm dev
```

Open your browser and navigate to:
```text
http://localhost:3000
```
*(The root route `/` will automatically redirect to `/projects` where you can create or open an architecture workspace).*

---

## 🧪 Testing & Quality Gates

AttackMap maintains test suites using the native Node.js test runner:

```bash
# Run all unit tests (Risk engine, scoring, mapper, schema, autosave, triage, overview)
pnpm test

# Run isolated module tests
pnpm test:autosave     # Test autosave debounce, queue coalescing, and generation guards
pnpm test:findings     # Test finding triage and acceptance rationale validation
pnpm test:overview     # Test security overview metrics and priority ranking
pnpm test:persistence  # Test Drizzle schema mapping and referential integrity

# Run database integration tests (Requires active PostgreSQL instance)
pnpm test:persistence:integration

# Type check & linting
pnpm lint
pnpm build
```

---

## 🛡️ Deterministic Rules Reference

AttackMap evaluates 10 active deterministic rules out of the box:

| Rule ID | Severity | Title | Detection Condition |
|:---:|:---:|---|---|
| **`AM-001`** | **Critical** (-20) | Public database exposure | Database service directly exposed to the public network |
| **`AM-002`** | **Critical** (-20) | Public API without authentication | API endpoint publicly exposed with `authentication: "none"` |
| **`AM-003`** | **High** (-10) | Missing authorization | Authenticated API, Gateway, or Backend without authorization controls |
| **`AM-004`** | **High** (-10) | Sensitive service without encryption in transit | Service handling sensitive data without TLS/HTTPS |
| **`AM-005`** | **High** (-10) | Sensitive database without encryption at rest | Database storing sensitive data with `encryptionAtRest: false` |
| **`AM-006`** | **Medium** (-5) | Public API without rate limiting | Public API or Gateway with `rateLimiting: false` |
| **`AM-007`** | **Medium** (-5) | Unencrypted HTTP connection | Connection using cleartext HTTP protocol |
| **`AM-008`** | **High** (-10) | Sensitive data over unencrypted connection | Cleartext connection where source or target handles sensitive data |
| **`AM-009`** | **Critical** (-20) | Public sensitive object storage | Object storage bucket exposed publicly with sensitive data |
| **`AM-010`** | **High** (-10) | Public authentication service without rate limiting | Authentication service exposed publicly without rate limiting |

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── actions.ts                       # Server Actions (Client/Server persistence boundary)
│   ├── layout.tsx                       # Root layout & Geist typography injection
│   ├── page.tsx                         # Redirect root '/' -> '/projects'
│   └── projects/
│       ├── page.tsx                     # Project listing view & creation form
│       └── [projectId]/
│           ├── page.tsx                 # Workspace page (Architecture, Overview, Findings)
│           └── not-found.tsx            # Custom 404 for invalid project UUIDs
├── components/
│   ├── architecture/                    # Canvas, ServiceNode, Palette, Inspectors, Controls
│   ├── findings/                        # Findings view, detail panel, rationale form, badge
│   ├── overview/                        # Security posture dashboard, priority findings
│   └── projects/                        # Project list card, rename/delete controls
├── lib/
│   ├── architecture/                    # Autosave coordinator, service/connection factories
│   ├── db/                              # Drizzle schema, DB client, snapshot mappers, persistence
│   ├── findings/                        # Triage left-join logic, rationale validator
│   ├── overview/                        # Overview metric calculations
│   └── risk-engine/                     # Deterministic rule definitions, engine, scoring
└── types/
    ├── architecture.ts                  # Project, ServiceNode, ServiceConnection contracts
    └── security.ts                      # Finding, FindingDisposition, ScoreResult contracts
```

---

## 🔒 Security Principles

1. **No Active Scanning / Exploitation:** AttackMap never performs network scans, port knocking, active probes, or credential stuffing. It is strictly an architectural threat modeling tool.
2. **Deterministic & Verifiable:** Rule evaluations are pure functions without non-deterministic LLM calls or hidden heuristics. The same model always yields the exact same findings.
3. **Defense-in-Depth Persistence:** Relational integrity constraints (foreign keys with cascade deletion, composite primary keys, and checks) prevent orphan edges and self-loops.
