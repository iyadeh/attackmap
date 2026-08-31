import assert from "node:assert/strict";
import test from "node:test";

import { triageActiveFindings } from "../findings/finding-dispositions";
import { calculateSecurityScore } from "../risk-engine/scoring";
import type {
  ServiceConnection,
  ServiceNode,
} from "../../types/architecture";
import type {
  Finding,
  FindingDisposition,
} from "../../types/security";

import { deriveProjectSecurityOverview } from "./project-security-overview";

const services: ServiceNode[] = [
  {
    id: "api",
    name: "REST API",
    type: "api",
    technology: "Go",
    exposure: "public",
    protocol: "https",
    authentication: "none",
    authorization: "none",
    encryptionInTransit: true,
    rateLimiting: false,
    sensitiveData: false,
    dataClassification: "internal",
  },
  {
    id: "database",
    name: "Primary database",
    type: "database",
    technology: "PostgreSQL 17",
    exposure: "private",
    protocol: "tcp_tls",
    authentication: "mtls",
    authorization: "acl",
    encryptionInTransit: true,
    encryptionAtRest: true,
    rateLimiting: false,
    sensitiveData: true,
    dataClassification: "restricted",
  },
];

const connections: ServiceConnection[] = [
  {
    id: "api-to-database",
    source: "api",
    target: "database",
    protocol: "tcp",
    encrypted: true,
  },
];

function createFinding(
  id: string,
  severity: Finding["severity"],
): Finding {
  return {
    id,
    ruleId: id.split(":")[0] ?? id,
    title: `Finding ${id}`,
    severity,
    description: "Technical condition remains active.",
    recommendation: "Update architecture controls.",
    serviceId: "api",
  };
}

const findings: Finding[] = [
  createFinding("AM-001:service:api", "critical"),
  createFinding("AM-002:service:api", "high"),
  createFinding("AM-003:service:api", "high"),
  createFinding("AM-004:service:api", "medium"),
  createFinding("AM-005:service:api", "low"),
  createFinding("AM-006:service:api", "low"),
];

const disposition: FindingDisposition = {
  projectId: "00000000-0000-4000-8000-000000000090",
  findingId: findings[1]?.id ?? "",
  status: "accepted",
  rationale: "Compensating control exists upstream.",
  createdAt: new Date("2026-08-31T00:00:00.000Z"),
  updatedAt: new Date("2026-08-31T00:00:00.000Z"),
};

test("overview reuses active severity, disposition, and architecture counts", () => {
  const score = calculateSecurityScore(findings);
  const summary = deriveProjectSecurityOverview(
    services,
    connections,
    triageActiveFindings(findings, [disposition]),
    score,
  );

  assert.deepEqual(summary.securityScore.severityCounts, {
    critical: 1,
    high: 2,
    medium: 1,
    low: 2,
  });
  assert.deepEqual(summary.dispositionCounts, { open: 5, accepted: 1 });
  assert.deepEqual(summary.architectureCounts, {
    services: 2,
    connections: 1,
  });
});

test("accepted finding remains in severity counts and raw score", () => {
  const score = calculateSecurityScore(findings);
  const summary = deriveProjectSecurityOverview(
    services,
    connections,
    triageActiveFindings(findings, [disposition]),
    score,
  );

  assert.equal(summary.securityScore.totalFindings, findings.length);
  assert.equal(summary.securityScore.severityCounts.high, 2);
  assert.equal(summary.securityScore.score, score.score);
});

test("priority findings preserve deterministic engine ordering", () => {
  const summary = deriveProjectSecurityOverview(
    services,
    connections,
    triageActiveFindings(findings, [disposition]),
    calculateSecurityScore(findings),
  );

  assert.deepEqual(
    summary.priorityFindings.map(({ finding }) => finding.id),
    findings.slice(0, 5).map((finding) => finding.id),
  );
});

test("empty project produces stable empty overview", () => {
  const score = calculateSecurityScore([]);

  assert.deepEqual(deriveProjectSecurityOverview([], [], [], score), {
    securityScore: {
      score: 100,
      category: "strong",
      totalFindings: 0,
      severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
    },
    dispositionCounts: { open: 0, accepted: 0 },
    architectureCounts: { services: 0, connections: 0 },
    priorityFindings: [],
  });
});

test("overview derivation does not mutate inputs", () => {
  const triagedFindings = triageActiveFindings(findings, [disposition]);
  const score = calculateSecurityScore(findings);
  const before = structuredClone({
    services,
    connections,
    triagedFindings,
    score,
  });

  deriveProjectSecurityOverview(
    services,
    connections,
    triagedFindings,
    score,
  );

  assert.deepEqual(
    { services, connections, triagedFindings, score },
    before,
  );
});
