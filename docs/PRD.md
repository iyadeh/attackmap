# Product Requirements Document — AttackMap

## 1. Product Overview

**Product Name:** AttackMap  
**Product Type:** Web Application  
**Category:** Application Security / Security Architecture / Threat Modeling  
**Primary Goal:** Membantu developer dan security engineer memvisualisasikan arsitektur aplikasi serta mengidentifikasi potensi attack surface dan security misconfiguration secara cepat.

AttackMap memungkinkan pengguna membangun diagram arsitektur aplikasi melalui visual canvas. Setiap komponen sistem dapat memiliki atribut keamanan seperti exposure, authentication, authorization, encryption, dan data sensitivity.

Berdasarkan konfigurasi tersebut, AttackMap menjalankan rule-based security analysis untuk menemukan potensi risiko, memberikan severity, risk score, dan rekomendasi mitigasi.

AttackMap bukan vulnerability scanner dan tidak melakukan active exploitation terhadap sistem pengguna.

---

# 2. Problem Statement

Developer sering membuat architecture diagram yang hanya menggambarkan hubungan antar-service tanpa menjelaskan implikasi keamanannya.

Threat modeling juga sering dilakukan menggunakan spreadsheet, dokumen, atau whiteboard yang:

- sulit dipelihara;
- mudah menjadi stale;
- tidak terhubung langsung dengan architecture diagram;
- membutuhkan pengetahuan security cukup tinggi;
- tidak memberikan feedback langsung ketika arsitektur berubah.

AttackMap mencoba menggabungkan:

**Architecture Diagram + Attack Surface Analysis + Security Findings**

dalam satu workspace visual.

---

# 3. Product Vision

AttackMap menjadi alat sederhana bagi developer untuk menjawab pertanyaan:

> “Jika sistem saya dibangun seperti ini, bagian mana yang paling berisiko?”

Aplikasi harus membuat threat modeling terasa seperti bagian alami dari architecture design, bukan aktivitas security terpisah.

---

# 4. Target Users

## Primary User

### Software Developer

Developer yang sedang mendesain atau membangun aplikasi dan ingin memahami implikasi security dari architecture decision mereka.

Kebutuhan utama:

- membuat architecture diagram;
- melihat service yang exposed ke internet;
- memahami risiko konfigurasi;
- mendapatkan rekomendasi security.

---

## Secondary User

### Security Engineer

Security engineer yang ingin melakukan quick architecture review.

Kebutuhan utama:

- melihat attack surface;
- menemukan risky service;
- melihat security findings;
- mengidentifikasi sensitive data flow.

---

## Secondary User

### Software Architect

Architect yang ingin mengevaluasi architecture design dari perspektif security.

Kebutuhan utama:

- memvisualisasikan system boundaries;
- melihat trust relationships;
- mengidentifikasi high-risk architecture decisions.

---

# 5. Product Principles

AttackMap harus mengikuti prinsip berikut.

### Visual First

Architecture harus menjadi pusat experience.

Pengguna seharusnya memahami sistem melalui diagram sebelum membaca findings.

### Security Without Noise

Jangan menghasilkan terlalu banyak findings.

Setiap finding harus:

- relevan;
- actionable;
- mudah dipahami.

### Explain the Risk

AttackMap tidak hanya mengatakan bahwa sesuatu berbahaya.

Setiap finding harus menjelaskan:

- apa risikonya;
- mengapa finding muncul;
- apa dampaknya;
- bagaimana mitigasinya.

### Developer Friendly

Bahasa yang digunakan harus mudah dipahami developer tanpa memerlukan background pentesting.

### Architecture-Aware

Risk harus muncul berdasarkan hubungan dan konfigurasi antar-service, bukan hanya checklist statis.

---

# 6. Scope

## MVP Scope

Versi pertama AttackMap harus memungkinkan pengguna:

1. membuat project;
2. membuat architecture diagram;
3. menambahkan service;
4. menghubungkan service;
5. mengatur security properties;
6. menjalankan automatic risk analysis;
7. melihat findings;
8. melihat risk score;
9. membaca rekomendasi mitigasi.

---

# 7. Out of Scope — MVP

Fitur berikut tidak termasuk MVP:

- vulnerability scanning;
- penetration testing;
- port scanning;
- network discovery;
- source code scanning;
- dependency scanning;
- cloud account integration;
- AWS architecture import;
- Kubernetes import;
- Terraform parsing;
- automatic architecture discovery;
- AI-generated threat modeling;
- collaboration realtime;
- team organization;
- SSO;
- CI/CD integration;
- Jira integration;
- GitHub integration.

Fitur tersebut dapat dipertimbangkan setelah MVP stabil.

---

# 8. Core User Flow

## First-Time User Flow

User membuka AttackMap.

↓

User membuat project.

↓

User memasukkan nama sistem.

Contoh:

`VaultShare Production Architecture`

↓

User masuk ke architecture workspace.

↓

User menambahkan beberapa service.

Contoh:

- Web Application
- API Gateway
- Authentication Service
- REST API
- PostgreSQL

↓

User menghubungkan service.

Contoh:

`Internet → Web App → API → Database`

↓

User mengatur security properties pada setiap service.

↓

AttackMap menjalankan security analysis.

↓

Risk score dan findings diperbarui.

↓

User memilih finding.

↓

User membaca penjelasan dan rekomendasi mitigasi.

---

# 9. Information Architecture

Primary navigation:

```text
AttackMap
├── /projects                        (Project List & Creation)
└── /projects/[projectId]            (Project Workspace)
      ├── [Tab] Architecture        (Canvas, Component Palette, Inspectors)
      ├── [Tab] Overview            (Security Posture Summary & Priority Risks)
      └── [Tab] Findings            (Findings List, Severity Filters & Triage)
```

Untuk MVP, workspace menggunakan **Single-Page Workspace dengan Tab Switcher** di dalam route `/projects/[projectId]`.

Navigasi antar-tab (`Architecture`, `Overview`, `Findings`) tidak me-reload atau me-unmount halaman, sehingga instance dan state visual canvas `@xyflow/react` (posisi zoom, pan, seleksi node) tetap terjaga secara live.

Main header navigation:

```text
AttackMap  /  [Project Name]  [Persistence Status]  [Security Score]  [Tabs: Architecture | Overview | Findings]
```

---

# 10. Project Dashboard

Halaman project dashboard menampilkan ringkasan kondisi security sistem.

## Required Information

### Project Name

Contoh:

`VaultShare Production`

### Security Score

Range:

`0 – 100`

Contoh:

`74 / 100`

### Statistics

Tampilkan:

- total services;
- total connections;
- total findings;
- critical findings;
- high findings;
- publicly exposed services.

Contoh:

```text
Services      12
Connections   18
Findings      14
Critical      2
Public        4
```

---

# 11. Architecture Canvas

Architecture Canvas adalah fitur utama AttackMap.

Canvas harus memungkinkan pengguna membangun diagram sistem melalui node dan connection.

Recommended library:

**React Flow**

---

# 12. Node Types

MVP harus mendukung node berikut.

## External

### Internet

Representasi external/public network.

---

## Application

### Web Application

Contoh:

- Next.js;
- React;
- Vue;
- Svelte.

---

### Mobile Application

Contoh:

- Android;
- iOS;
- React Native.

---

## Backend

### API

Contoh:

- REST API;
- GraphQL API;
- gRPC Service.

---

### API Gateway

Contoh:

- Kong;
- NGINX;
- AWS API Gateway.

---

### Backend Service

Generic backend/microservice.

---

## Identity

### Authentication Service

Contoh:

- Auth0;
- Keycloak;
- custom OIDC provider.

---

## Data

### Database

Contoh:

- PostgreSQL;
- MySQL;
- MongoDB.

---

### Cache

Contoh:

- Redis.

---

### Object Storage

Contoh:

- S3;
- MinIO.

---

## Infrastructure

### Message Queue

Contoh:

- RabbitMQ;
- Kafka.

---

### Third-Party Service

Contoh:

- Stripe;
- SendGrid;
- external API.

---

# 13. Node Data Model

Setiap architecture node minimal memiliki:

```ts
type ServiceNode = {
  id: string
  projectId: string

  name: string

  type:
    | "web"
    | "mobile"
    | "api"
    | "gateway"
    | "backend"
    | "auth"
    | "database"
    | "cache"
    | "storage"
    | "queue"
    | "third_party"

  technology?: string

  exposure:
    | "public"
    | "private"
    | "internal"

  authentication:
    | "none"
    | "session"
    | "jwt"
    | "oauth2"
    | "oidc"
    | "api_key"
    | "mtls"

  authorization:
    | "none"
    | "rbac"
    | "abac"
    | "acl"
    | "policy"

  encryptionInTransit: boolean

  encryptionAtRest?: boolean

  rateLimiting?: boolean

  sensitiveData: boolean

  dataClassification?:
    | "public"
    | "internal"
    | "confidential"
    | "restricted"
}
```

Tidak semua properties harus ditampilkan untuk semua service types.

---

# 14. Node Interaction

Ketika node diklik, buka detail panel di sisi kanan.

Panel menampilkan:

```text
REST API

General
Name
Technology
Service Type

Network
Exposure
Protocol

Security
Authentication
Authorization
Rate Limiting
Encryption

Data
Sensitive Data
Classification
```

Semua field harus editable.

Setiap perubahan harus menyebabkan risk analysis dijalankan ulang.

---

# 15. Connections

User dapat membuat connection antar-node.

Contoh:

```text
Web Application
      ↓
API Gateway
      ↓
REST API
      ↓
PostgreSQL
```

Setiap edge minimal memiliki:

```ts
type ServiceConnection = {
  id: string

  source: string
  target: string

  protocol?:
    | "https"
    | "http"
    | "grpc"
    | "tcp"
    | "websocket"

  encrypted: boolean
}
```

---

# 16. Attack Surface Model

AttackMap menggunakan konfigurasi arsitektur untuk menentukan attack surface.

Attack surface adalah service yang dapat diakses oleh source yang kurang dipercaya.

Contoh:

```text
Internet
   ↓
Frontend
   ↓
API
```

Frontend dan API dapat dianggap sebagai bagian dari external attack surface.

---

# 17. Risk Engine

MVP menggunakan deterministic rule-based engine.

Tidak menggunakan AI.

Risk engine menerima:

```text
Architecture
+
Service Configuration
+
Connections
```

dan menghasilkan:

```text
Security Findings
+
Service Risk Score
+
Project Risk Score
```

---

# 18. Security Rule Structure

Setiap rule mengikuti struktur:

```ts
type SecurityRule = {
  id: string

  title: string

  description: string

  severity:
    | "critical"
    | "high"
    | "medium"
    | "low"

  category: string

  evaluate: (
    service: ServiceNode,
    context: ArchitectureContext
  ) => boolean

  recommendation: string

  references?: SecurityReference[]
}
```

---

# 19. Initial Security Rules

MVP memiliki 10 aturan keamanan deterministik aktif (`AM-001` s/d `AM-010`).

Setiap rule memiliki ID unik stabil (`AM-xxx`) dan menghasilkan deterministic finding.

### Active MVP Rules Baseline:

| Rule ID | Title | Severity | Target | Condition Summary |
|---|---|---|---|---|
| **AM-001** | Public database exposure | Critical | Service | `database` dengan `exposure = public` |
| **AM-002** | Public API without authentication | Critical | Service | `api` publik dengan `authentication = none` |
| **AM-003** | Missing authorization | High | Service | `api`/`backend`/`gateway` berautentikasi tanpa otorisasi |
| **AM-004** | Sensitive service without encryption in transit | High | Service | `sensitiveData = true` dengan `encryptionInTransit = false` |
| **AM-005** | Sensitive database without encryption at rest | High | Service | `database` sensitif dengan `encryptionAtRest = false` |
| **AM-006** | Public API without rate limiting | Medium | Service | `api`/`gateway` publik tanpa `rateLimiting` |
| **AM-007** | Unencrypted HTTP connection | Medium | Connection | `protocol = http` dan `encrypted = false` |
| **AM-008** | Sensitive data over unencrypted connection | High | Connection | Connection unencrypted melibatkan service sensitif |
| **AM-009** | Public sensitive object storage | Critical | Service | `storage` publik yang menangani `sensitiveData` |
| **AM-010** | Public authentication service without rate limiting | High | Service | `auth` publik tanpa `rateLimiting` |

---

### Planned / Backlog Rules:

Aturan berikut direncanakan untuk iterasi pasca-baseline:

* **Rule 9 (Planned): Internal Service Publicly Exposed**  
  `type = backend AND exposure = public` (Severity: Medium)
* **Rule 10 (Planned): Sensitive Third-Party Data Flow**  
  Arsitektur mendeteksi data flow sensitif menuju service bertipe `third_party` (Severity: Medium)
* **Rule 12 (Planned): Authentication Over Unencrypted Channel**  
  Trafik menuju `auth` service melewati connection yang tidak terenkripsi (Severity: Critical — sebagian termitigasi oleh AM-007 & AM-008)

---

# 20. Findings

Findings page menampilkan seluruh risk yang ditemukan oleh deterministic risk engine.

## Finding Structure (Pure Derived State)

Findings dihitung secara dinamis saat runtime dari services dan connections (tidak disimpan sebagai tabel statis di database):

```ts
type Finding = {
  id: string              // Deterministic: {ruleId}:{service|connection}:{targetId}
  ruleId: string          // AM-001 s/d AM-010
  title: string
  severity: "critical" | "high" | "medium" | "low"
  description: string
  recommendation: string
  serviceId?: string      // ID service yang terdampak (bila relevan)
  connectionId?: string   // ID connection yang terdampak (bila relevan)
}
```

---

# 21. Findings Page

Layout contoh:

```text
Security Findings

14 Findings

Critical  2
High      4
Medium    6
Low       2


Severity   Finding                      Service
----------------------------------------------------
CRITICAL   Public database exposure     PostgreSQL
HIGH       Missing authorization        REST API
MEDIUM     Missing rate limiting        API Gateway
```

---

# 22. Finding Detail

Ketika finding dipilih:

```text
HIGH

Missing Authorization Control

Affected Service
REST API

Why this matters

The service requires authentication but does not
define an authorization mechanism.

An authenticated user may potentially access
resources belonging to other users.

Recommendation

Implement resource-level authorization using RBAC,
ABAC, or policy-based access control.
```

---

# 23. Finding Dispositions & Triage

User dapat melakukan triage terhadap temuan keamanan.

### Open (Default)
Risk aktif dan belum ditangani. Ini adalah status default untuk semua temuan yang dihasilkan oleh engine.

### Accepted Risk
User memahami risiko teknis tetapi secara sadar memutuskan menerima risiko tersebut untuk sementara atau karena konteks operasional tertentu.
* Mewajibkan pengisian **Acceptance Rationale** (alasan penerimaan risiko non-kosong, 1–1000 karakter).
* Disimpan secara persisten di database tabel `finding_dispositions` berdasarkan `(projectId, findingId)`.
* User dapat melakukan **Reopen** sewaktu-waktu untuk mengembalikan status finding menjadi Open.

### Implicit Auto-Resolve
Jika arsitektur atau konfigurasi diperbaiki sehingga aturan keamanan tidak lagi terpenuhi, finding tersebut secara otomatis tidak lagi dihasilkan oleh risk engine. Tidak diperlukan mutasi status manual untuk "resolved".

---

# 24. Risk Scoring

AttackMap menggunakan score:

```text
0 – 100
```

Semakin tinggi score, semakin baik security posture sistem.

Default:

`100`

Setiap finding aktif mengurangi score:

```text
Critical = -20
High     = -10
Medium   = -5
Low      = -2
```

Score minimum:

`0`

### Prinsip Raw Technical Score
Security Score merefleksikan **postur keamanan teknis riil**. Mengubah status finding menjadi *Accepted Risk* mendokumentasikan keputusan manajemen risiko, tetapi **TIDAK mengurangi pengurangan penalti score** (score tetap dihitung dari total seluruh active technical findings).

---

# 25. Service Risk Score

Setiap service memiliki individual score.

Contoh:

```text
REST API

Risk Score

62 / 100

1 Critical
2 High
3 Medium
```

Ini membantu user menentukan service yang paling membutuhkan perhatian.

---

# 26. Project Risk Score

Project score dihitung berdasarkan seluruh active findings.

Contoh:

```text
Security Score

74 / 100

Moderate Risk
```

Score category:

```text
90–100  Strong
75–89   Good
50–74   Moderate
25–49   High Risk
0–24    Critical Risk
```

---

# 27. Visual Risk Indicators

Node pada architecture canvas harus memiliki visual indicator berdasarkan severity tertinggi.

Contoh:

```text
PostgreSQL

CRITICAL
```

atau badge kecil:

```text
2 Findings
```

Jangan membuat keseluruhan canvas terlalu colorful.

Risk indicator harus jelas tetapi tetap restrained.

---

# 28. Overview Page

Overview menampilkan:

### Security Score

### Architecture Summary

- service count;
- exposed service count;
- sensitive data service count.

### Findings Breakdown

```text
Critical
High
Medium
Low
```

### Highest Risk Services

Contoh:

```text
PostgreSQL      42
REST API        58
API Gateway     71
```

### Attack Surface

Daftar public-facing services.

---

# 29. Empty State

Project baru harus memiliki empty state yang membantu user mulai.

Contoh:

```text
Map your architecture

Add services and connect them to understand
your application's attack surface.

[ Add First Service ]
```

Optional starter templates dapat ditambahkan kemudian.

---

# 30. Project Management

User dapat:

- create project;
- rename project;
- delete project;
- open project.

Project memiliki:

```ts
type Project = {
  id: string

  name: string
  description?: string

  createdAt: Date
  updatedAt: Date
}
```

---

# 31. Authentication

Untuk MVP portfolio version, authentication bersifat optional.

Versi paling sederhana dapat menggunakan:

- local development user;
- single-user environment.

Jika authentication digunakan:

- email/password;
atau
- GitHub OAuth.

Authentication bukan core feature AttackMap.

---

# 32. Persistence

Arsitektur dan data project tersimpan ke PostgreSQL menggunakan snapshot transaction.

Minimal entities:

```text
Project
ServiceNode            (mencakup metadata keamanan dan koordinat visual positionX/Y)
ServiceConnection
FindingDisposition     (triage status 'accepted' dan rationale)
```

Relational structure:

```text
projects
  │  (id: uuid PK)
  ├── services
  │     (PK: project_id + id, FK: project_id -> projects.id CASCADE)
  ├── service_connections
  │     (PK: project_id + id, FK: project_id -> projects.id CASCADE, FK -> services CASCADE)
  └── finding_dispositions
        (PK: project_id + finding_id, FK: project_id -> projects.id CASCADE)
```

> **Catatan Arsitektur:** Tabel `findings` tidak disimpan secara persisten di database. Temuan keamanan (*findings*) adalah *pure derived state* yang dievaluasi ulang secara deterministik dari node dan connection setiap kali arsitektur berubah. Database hanya menyimpan keputusan penanganan risiko manusia (`finding_dispositions`) beserta alasannya.

---

# 33. Tech Stack

## Framework
Next.js (App Router, React Compiler enabled)

## Language
TypeScript (Strict Mode)

## Styling
Tailwind CSS v4 (Industrial warm monochrome palette)

## Architecture Canvas
`@xyflow/react` (React Flow v12)

## Database
PostgreSQL (via `postgres` driver)

## ORM
Drizzle ORM & Drizzle Kit

## Validation
Hand-written Typed Parsers & Invariant Mappers (tanpa dependensi eksternal, sesuai prinsip *strict dependency discipline*)

## Icons
Phosphor Icons (`@phosphor-icons/react` — bobot Bold/Technical)

---

# 34. Application Structure

```text
src/

app/
  actions.ts                     // Server Actions (Client/Server boundary)
  layout.tsx                     // Root layout, Geist fonts, global CSS
  page.tsx                       // Redirect -> /projects
  projects/
    page.tsx                     // Project list & creation
    [projectId]/
      page.tsx                   // Workspace page (Architecture, Overview, Findings tabs)
      not-found.tsx              // 404 handler for invalid project IDs

components/
  architecture/                  // Canvas, ServiceNode, Palette, Inspectors, Autosave
  findings/                      // Findings view, detail, disposition form, score badge
  overview/                      // Security posture summary, priority findings list
  projects/                      // Project list view, rename/delete controls

lib/
  risk-engine/                   // Deterministic evaluation engine, rules (AM-001..AM-010), scoring
  architecture/                  // Autosave coordinator, service factory, connection factory
  db/                            // Drizzle schema, client, snapshot mappers, persistence modules
  findings/                      // Finding triage logic, rationale validator
  overview/                      // Overview metrics & priority ranking calculator

types/
  architecture.ts                // Project, ServiceNode, ServiceConnection, Snapshot domain types
  security.ts                    // Finding, FindingDisposition, SecurityScoreResult types
```

---

# 35. Risk Engine Architecture

Risk engine sebaiknya dipisahkan dari UI.

Contoh:

```text
Architecture State
       │
       ▼
Risk Engine
       │
       ├── Node Rules
       ├── Edge Rules
       └── Architecture Rules
       │
       ▼
Findings
       │
       ▼
Risk Scoring
```

Dengan pemisahan ini risk engine dapat diuji menggunakan unit test tanpa membutuhkan UI.

---

# 36. Rule Categories

Rules dapat dikelompokkan menjadi:

### Network Exposure

Contoh:

- database publicly exposed;
- internal service publicly exposed.

### Authentication

Contoh:

- public API without authentication.

### Authorization

Contoh:

- missing authorization.

### Encryption

Contoh:

- sensitive traffic without TLS.

### Data Protection

Contoh:

- sensitive database without encryption.

### Abuse Protection

Contoh:

- missing rate limiting.

### Third-Party Risk

Contoh:

- sensitive information shared externally.

---

# 37. UX Requirements

Architecture canvas harus:

- support zoom;
- support pan;
- support drag;
- support connecting nodes;
- support deleting nodes;
- support deleting connections.

Canvas interaction harus terasa cepat.

User tidak boleh memerlukan refresh untuk melihat risk update.

---

# 38. Design Direction

AttackMap harus terlihat seperti professional developer/security tooling.

Inspirasi visual:

- Linear;
- GitHub;
- Cloudflare Dashboard;
- Datadog;
- Sentry;
- modern infrastructure tooling.

Visual style:

- dark or neutral interface;
- dense tetapi readable;
- clear hierarchy;
- restrained colors;
- monospace hanya untuk technical metadata;
- security severity sebagai accent, bukan keseluruhan design language.

Hindari:

- gradients;
- neon cyberpunk;
- hacker aesthetic;
- matrix effect;
- glow berlebihan;
- glassmorphism;
- huge dashboard cards;
- decorative charts tanpa value.

AttackMap harus terasa seperti software engineering tool, bukan fictional hacking dashboard.

---

# 39. Severity System

Gunakan empat severity:

```text
Critical
High
Medium
Low
```

Severity harus memiliki distinct visual treatment.

Tetapi jangan bergantung pada warna saja.

Gunakan juga:

- label;
- icon;
- text.

---

# 40. Security References

Findings dapat memiliki mapping ke security standards.

Potential references:

- OWASP Top 10;
- OWASP API Security Top 10;
- CWE;
- NIST principles.

Untuk MVP references bersifat informational.

Jangan mengklaim bahwa AttackMap melakukan full compliance validation.

---

# 41. Error Handling

Aplikasi harus menangani:

### Invalid Connection

Connection terhadap node yang tidak ada harus ditolak.

### Deleted Node

Semua associated edges harus dihapus.

### Failed Persistence

UI harus menampilkan error tanpa kehilangan architecture state jika memungkinkan.

### Analysis Failure

Risk engine failure tidak boleh membuat architecture editor crash.

---

# 42. Performance Requirements

Untuk MVP target:

```text
≤ 50 nodes per project
≤ 100 connections per project
≤ 100 findings
```

Canvas harus tetap interactive pada ukuran tersebut.

Risk analysis harus terasa instant.

Target:

`< 200 ms`

untuk typical architecture.

---

# 43. Accessibility

Minimum accessibility requirements:

- keyboard-accessible controls;
- sufficient contrast;
- clear focus states;
- form labels;
- severity tidak dibedakan hanya berdasarkan warna;
- dialogs dapat ditutup melalui keyboard.

---

# 44. MVP Success Criteria

MVP dianggap berhasil ketika user dapat:

1. membuat project;
2. menambahkan minimal lima service;
3. menghubungkan service tersebut;
4. mengatur security properties;
5. melihat findings muncul otomatis;
6. melihat project security score;
7. memilih finding;
8. memahami penyebab finding;
9. membaca rekomendasi mitigation;
10. menyimpan dan membuka kembali project.

---

# 45. Demo Scenario

Gunakan architecture berikut sebagai default demo/testing scenario:

```text
Internet
   │
   ▼
Web Application
   │
   ▼
API Gateway
   │
   ├───────────────┐
   ▼               ▼
Auth Service     REST API
                   │
                   ▼
               PostgreSQL
```

Configuration:

```text
Web Application
Exposure: Public
HTTPS: Yes

API Gateway
Exposure: Public
Authentication: None
Rate Limiting: No

Auth Service
Exposure: Public
Rate Limiting: No

REST API
Exposure: Public
Authentication: JWT
Authorization: None
Sensitive Data: Yes

PostgreSQL
Exposure: Public
Encryption At Rest: No
Sensitive Data: Yes
```

Expected findings:

```text
CRITICAL
Public database exposure

HIGH
Missing API authorization

HIGH
Sensitive database without encryption

HIGH
Authentication endpoint without rate limiting

MEDIUM
Public API without rate limiting
```

Demo ini harus menunjukkan dengan jelas value proposition AttackMap.

---

# 46. Development Phases

## Phase 1 — UI Shell

Build:

- layout;
- sidebar;
- project page;
- architecture workspace;
- mock nodes;
- detail panel.

Tidak perlu database.

---

## Phase 2 — Interactive Architecture

Implement:

- add node;
- remove node;
- drag node;
- connect node;
- edit properties.

Gunakan in-memory state terlebih dahulu.

---

## Phase 3 — Risk Engine

Implement:

- rule model;
- evaluation engine;
- initial rules;
- finding generation;
- scoring.

Risk engine harus memiliki unit tests.

---

## Phase 4 — Findings UI & Triage

Implement:

- finding list;
- severity filter & count summaries;
- finding detail;
- recommendations;
- accepted risk triage workflow (with non-empty rationale & reopen support).

---

## Phase 5 — Persistence & Autosave

Tambahkan:

- PostgreSQL database & Drizzle ORM schema;
- multi-project CRUD management & dynamic routing (`/projects/[projectId]`);
- transactional architecture snapshot save & load;
- debounced project-scoped autosave coordinator.

---

## Phase 6 — Polish & Overview

Tambahkan:

- project security overview (metrics breakdown & top priority findings);
- empty states (empty canvas, empty findings, empty projects);
- persistence status clarity (saved, saving, unsaved, error indicators);
- confirmation dialogs for destructive actions (delete service/connection/project);
- accessibility basics (ARIA labels, live regions, semantic controls);
- copy consistency & overflow handling.

---

# 47. Future Features

Setelah MVP, AttackMap dapat berkembang ke:

### Architecture Templates

Contoh:

- SaaS Application;
- Microservices;
- E-commerce;
- Mobile Backend.

### Trust Boundaries

User dapat menggambar boundary:

```text
Public Network
Private Network
Database Network
Third Party
```

### STRIDE Threat Modeling

Generate threat berdasarkan:

- Spoofing;
- Tampering;
- Repudiation;
- Information Disclosure;
- Denial of Service;
- Elevation of Privilege.

### Data Flow Analysis

Tandai data:

```text
Credentials
PII
Financial
Secrets
Tokens
```

Kemudian trace bagaimana data berpindah.

### Architecture Import

Import dari:

- Terraform;
- Kubernetes;
- Docker Compose.

### Security Report Export

Export:

- PDF;
- Markdown;
- JSON.

### Architecture Snapshot

Simpan versi architecture dari waktu ke waktu.

### Security Diff

Bandingkan:

```text
Architecture v1
vs
Architecture v2
```

dan tampilkan:

```text
New Risks
Resolved Risks
Changed Attack Surface
```

---

# 48. Potential AI Features — Future

AI tidak diperlukan untuk MVP.

Jika ditambahkan kemudian, AI dapat digunakan untuk:

### Architecture Description

User menulis:

“Next.js frontend, Go API, PostgreSQL database, Auth0 authentication.”

AttackMap menghasilkan architecture draft.

### Finding Explanation

AI menjelaskan security finding dalam bahasa yang lebih sederhana.

### Threat Suggestions

AI memberikan possible abuse scenarios.

### Architecture Review

User dapat meminta:

“Review this architecture.”

Namun deterministic rule engine tetap menjadi source of truth untuk security findings.

---

# 49. Portfolio Value

AttackMap harus menunjukkan kemampuan engineering dalam area:

### Frontend Engineering

- complex interactive UI;
- graph visualization;
- state management.

### Backend Engineering

- persistent architecture models;
- structured APIs.

### Software Architecture

- clear domain modeling;
- separation antara UI dan analysis engine.

### Security Engineering

- threat modeling;
- attack surface analysis;
- security controls;
- risk scoring.

### Testing

Risk rules sangat cocok untuk unit testing.

Contoh:

```ts
describe("Public Database Rule", () => {
  it("flags a publicly exposed database", () => {
    // ...
  })

  it("does not flag private databases", () => {
    // ...
  })
})
```

---

# 50. Final MVP Definition

AttackMap MVP adalah aplikasi web di mana developer dapat menggambar architecture diagram, mengatur security properties setiap component, dan secara otomatis mendapatkan attack surface analysis, security findings, risk score, serta rekomendasi mitigasi.

Core loop produk:

```text
Design Architecture
        ↓
Configure Security
        ↓
Analyze Attack Surface
        ↓
Discover Risks
        ↓
Improve Architecture
        ↓
Security Score Improves
```

Jika flow ini terasa jelas dan memuaskan digunakan, maka MVP AttackMap sudah memenuhi tujuan produk.