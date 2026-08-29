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

Projects
Project Workspace
  ├── Architecture
  ├── Findings
  └── Overview
```

Untuk MVP, navigation sebaiknya sederhana.

Main sidebar:

```text
AttackMap

Projects

Current Project
Overview
Architecture
Findings

Settings
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

MVP harus memiliki minimal 10–15 security rules.

## Rule 1

### Public Database Exposure

Condition:

```text
type = database
AND
exposure = public
```

Severity:

**Critical**

Finding:

`Database exposed to public network`

Recommendation:

Restrict database access to private/internal networks.

---

## Rule 2

### Public API Without Authentication

Condition:

```text
type = API
AND
exposure = public
AND
authentication = none
```

Severity:

**Critical**

---

## Rule 3

### Missing Authorization

Condition:

```text
type = API
AND
authentication != none
AND
authorization = none
```

Severity:

**High**

---

## Rule 4

### Sensitive Data Without Encryption

Condition:

```text
sensitiveData = true
AND
encryptionInTransit = false
```

Severity:

**High**

---

## Rule 5

### Database Without Encryption At Rest

Condition:

```text
type = database
AND
sensitiveData = true
AND
encryptionAtRest = false
```

Severity:

**High**

---

## Rule 6

### Public API Without Rate Limiting

Condition:

```text
type = API
AND
exposure = public
AND
rateLimiting = false
```

Severity:

**Medium**

---

## Rule 7

### HTTP Communication

Condition:

```text
connection.protocol = http
```

Severity:

**Medium**

---

## Rule 8

### Public Object Storage

Condition:

```text
type = storage
AND
exposure = public
AND
sensitiveData = true
```

Severity:

**Critical**

---

## Rule 9

### Internal Service Publicly Exposed

Condition:

```text
type = backend
AND
exposure = public
```

Severity:

**Medium**

---

## Rule 10

### Sensitive Third-Party Data Flow

Condition:

```text
sensitive data
→
third party
```

Severity:

**Medium**

Finding:

`Sensitive data is shared with a third-party service`

---

## Rule 11

### Public Authentication Service Without Rate Limiting

Severity:

**High**

---

## Rule 12

### Authentication Over Unencrypted Channel

Severity:

**Critical**

---

# 20. Findings

Findings page menampilkan seluruh risk yang ditemukan.

## Finding Structure

```ts
type Finding = {
  id: string

  projectId: string
  nodeId?: string
  connectionId?: string

  ruleId: string

  title: string

  severity:
    | "critical"
    | "high"
    | "medium"
    | "low"

  description: string

  impact: string

  recommendation: string

  status:
    | "open"
    | "accepted"
    | "resolved"

  references?: {
    name: string
    url?: string
  }[]
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

References

OWASP API Security
Broken Object Level Authorization
```

---

# 23. Finding Status

User dapat mengubah status finding.

### Open

Risk belum ditangani.

### Accepted

User memahami risk tetapi memutuskan menerima risk tersebut.

### Resolved

Architecture sudah diperbaiki sehingga rule tidak lagi terpenuhi.

Jika underlying configuration berubah sehingga finding tidak lagi valid, AttackMap dapat otomatis menandainya sebagai resolved.

---

# 24. Risk Scoring

AttackMap menggunakan score:

```text
0 – 100
```

Semakin tinggi score, semakin baik security posture sistem.

Default:

`100`

Setiap finding mengurangi score.

Contoh weighting:

```text
Critical = -20
High     = -10
Medium   = -5
Low      = -2
```

Score minimum:

`0`

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

Architecture harus tersimpan ke database.

Minimal entities:

```text
Project
ServiceNode
ServiceConnection
Finding
```

Suggested relational structure:

```text
Project
  │
  ├── ServiceNode
  │
  ├── ServiceConnection
  │
  └── Finding
```

---

# 33. Recommended Tech Stack

## Framework

Next.js

## Language

TypeScript

## Styling

Tailwind CSS

## Architecture Canvas

React Flow

## Database

PostgreSQL

## ORM

Drizzle ORM

## Validation

Zod

## Icons

Lucide

---

# 34. Suggested Application Structure

```text
src/

app/
  projects/
  project/
    [id]/
      overview/
      architecture/
      findings/

components/

  architecture/
    architecture-canvas.tsx
    service-node.tsx
    connection-edge.tsx
    service-panel.tsx

  findings/
    finding-list.tsx
    finding-card.tsx
    finding-detail.tsx

  dashboard/
    security-score.tsx
    finding-summary.tsx

lib/

  risk-engine/
    engine.ts
    rules.ts
    scoring.ts

  db/
    schema.ts

types/

  architecture.ts
  security.ts
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

## Phase 4 — Findings UI

Implement:

- finding list;
- severity filter;
- finding detail;
- recommendations.

---

## Phase 5 — Persistence

Tambahkan:

- PostgreSQL;
- Drizzle;
- project persistence;
- architecture persistence.

---

## Phase 6 — Polish

Tambahkan:

- empty states;
- loading states;
- keyboard UX;
- confirmation dialogs;
- responsive behavior;
- error states.

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