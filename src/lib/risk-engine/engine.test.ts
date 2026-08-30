import assert from "node:assert/strict";
import test from "node:test";
import type { ServiceConnection, ServiceNode } from "@/types/architecture";
import { analyzeArchitecture } from "./engine";
import { securityRules } from "./rules";

function service(overrides: Partial<ServiceNode> = {}): ServiceNode {
  return {
    id: "service-1",
    name: "Service",
    type: "web",
    technology: "Test",
    exposure: "internal",
    protocol: "https",
    authentication: "none",
    authorization: "none",
    encryptionInTransit: true,
    encryptionAtRest: true,
    rateLimiting: true,
    sensitiveData: false,
    dataClassification: "internal",
    ...overrides,
  };
}

function connection(
  overrides: Partial<ServiceConnection> = {},
): ServiceConnection {
  return {
    id: "connection-1",
    source: "source",
    target: "target",
    protocol: "https",
    encrypted: true,
    ...overrides,
  };
}

type RuleCase = {
  ruleId: string;
  vulnerableServices: ServiceNode[];
  vulnerableConnections?: ServiceConnection[];
  safeServices: ServiceNode[];
  safeConnections?: ServiceConnection[];
};

const ruleCases: RuleCase[] = [
  {
    ruleId: "AM-001",
    vulnerableServices: [service({ type: "database", exposure: "public" })],
    safeServices: [service({ type: "database", exposure: "private" })],
  },
  {
    ruleId: "AM-002",
    vulnerableServices: [
      service({
        type: "api",
        exposure: "public",
        authentication: "none",
      }),
    ],
    safeServices: [
      service({
        type: "api",
        exposure: "public",
        authentication: "jwt",
        authorization: "rbac",
      }),
    ],
  },
  {
    ruleId: "AM-003",
    vulnerableServices: [
      service({
        type: "backend",
        authentication: "jwt",
        authorization: "none",
      }),
    ],
    safeServices: [
      service({
        type: "backend",
        authentication: "jwt",
        authorization: "policy",
      }),
    ],
  },
  {
    ruleId: "AM-004",
    vulnerableServices: [
      service({ sensitiveData: true, encryptionInTransit: false }),
    ],
    safeServices: [
      service({ sensitiveData: true, encryptionInTransit: true }),
    ],
  },
  {
    ruleId: "AM-005",
    vulnerableServices: [
      service({
        type: "database",
        sensitiveData: true,
        encryptionAtRest: false,
      }),
    ],
    safeServices: [
      service({
        type: "database",
        sensitiveData: true,
        encryptionAtRest: true,
      }),
    ],
  },
  {
    ruleId: "AM-006",
    vulnerableServices: [
      service({ type: "gateway", exposure: "public", rateLimiting: false }),
    ],
    safeServices: [
      service({ type: "gateway", exposure: "public", rateLimiting: true }),
    ],
  },
  {
    ruleId: "AM-007",
    vulnerableServices: [],
    vulnerableConnections: [
      connection({ protocol: "http", encrypted: false }),
    ],
    safeServices: [],
    safeConnections: [connection({ protocol: "http", encrypted: true })],
  },
  {
    ruleId: "AM-008",
    vulnerableServices: [
      service({ id: "source", sensitiveData: true }),
      service({ id: "target" }),
    ],
    vulnerableConnections: [
      connection({ protocol: "tcp", encrypted: false }),
    ],
    safeServices: [service({ id: "source" }), service({ id: "target" })],
    safeConnections: [connection({ protocol: "tcp", encrypted: false })],
  },
  {
    ruleId: "AM-009",
    vulnerableServices: [
      service({ type: "storage", exposure: "public", sensitiveData: true }),
    ],
    safeServices: [
      service({ type: "storage", exposure: "private", sensitiveData: true }),
    ],
  },
  {
    ruleId: "AM-010",
    vulnerableServices: [
      service({ type: "auth", exposure: "public", rateLimiting: false }),
    ],
    safeServices: [
      service({ type: "auth", exposure: "public", rateLimiting: true }),
    ],
  },
];

for (const ruleCase of ruleCases) {
  test(`${ruleCase.ruleId} produces a finding for its vulnerable case`, () => {
    const findings = analyzeArchitecture(
      ruleCase.vulnerableServices,
      ruleCase.vulnerableConnections ?? [],
    );

    assert.ok(findings.some((finding) => finding.ruleId === ruleCase.ruleId));
  });

  test(`${ruleCase.ruleId} ignores its representative safe case`, () => {
    const findings = analyzeArchitecture(
      ruleCase.safeServices,
      ruleCase.safeConnections ?? [],
    );

    assert.equal(
      findings.some((finding) => finding.ruleId === ruleCase.ruleId),
      false,
    );
  });
}

test("returns no findings for an empty architecture", () => {
  assert.deepEqual(analyzeArchitecture([], []), []);
});

test("uses the ten stable unique rule IDs", () => {
  const ruleIds = securityRules.map((rule) => rule.id);

  assert.deepEqual(ruleIds, [
    "AM-001",
    "AM-002",
    "AM-003",
    "AM-004",
    "AM-005",
    "AM-006",
    "AM-007",
    "AM-008",
    "AM-009",
    "AM-010",
  ]);
  assert.equal(new Set(ruleIds).size, ruleIds.length);
});

test("does not treat unknown encryption at rest as explicitly disabled", () => {
  const database = service({
    type: "database",
    sensitiveData: true,
    encryptionAtRest: undefined,
  });

  assert.equal(
    analyzeArchitecture([database], []).some(
      (finding) => finding.ruleId === "AM-005",
    ),
    false,
  );
});

test("deduplicates findings for repeated rule targets", () => {
  const publicDatabase = service({
    id: "database",
    type: "database",
    exposure: "public",
  });
  const unencryptedHttp = connection({
    id: "http-connection",
    protocol: "http",
    encrypted: false,
  });
  const findings = analyzeArchitecture(
    [publicDatabase, publicDatabase],
    [unencryptedHttp, unencryptedHttp],
  );

  assert.equal(
    findings.filter((finding) => finding.ruleId === "AM-001").length,
    1,
  );
  assert.equal(
    findings.filter((finding) => finding.ruleId === "AM-007").length,
    1,
  );
});

test("handles missing connection endpoints safely", () => {
  const staleConnection = connection({
    source: "missing-source",
    target: "missing-target",
    protocol: "tcp",
    encrypted: false,
  });

  assert.deepEqual(analyzeArchitecture([], [staleConnection]), []);
});

test("returns stable IDs and ordering independent of input order", () => {
  const services = [
    service({
      id: "gateway",
      type: "gateway",
      exposure: "public",
      rateLimiting: false,
    }),
    service({
      id: "auth",
      type: "auth",
      exposure: "public",
      rateLimiting: false,
    }),
    service({
      id: "storage",
      type: "storage",
      exposure: "public",
      sensitiveData: true,
    }),
  ];

  const first = analyzeArchitecture(services, []);
  const second = analyzeArchitecture([...services].reverse(), []);

  assert.deepEqual(second, first);
  assert.deepEqual(
    first.map((finding) => finding.id),
    [
      "AM-009:service:storage",
      "AM-010:service:auth",
      "AM-006:service:gateway",
    ],
  );
});

test("does not mutate service or connection inputs", () => {
  const services = [
    service({
      id: "database",
      type: "database",
      exposure: "public",
      sensitiveData: true,
      encryptionAtRest: false,
    }),
  ];
  const connections = [
    connection({
      id: "stale-http",
      source: "database",
      target: "missing",
      protocol: "http",
      encrypted: false,
    }),
  ];
  const servicesBefore = structuredClone(services);
  const connectionsBefore = structuredClone(connections);

  analyzeArchitecture(services, connections);

  assert.deepEqual(services, servicesBefore);
  assert.deepEqual(connections, connectionsBefore);
});

test("findings contain rule metadata and affected domain IDs", () => {
  const [finding] = analyzeArchitecture(
    [service({ id: "database", type: "database", exposure: "public" })],
    [],
  );

  assert.deepEqual(finding, {
    id: "AM-001:service:database",
    ruleId: "AM-001",
    title: "Public database exposure",
    severity: "critical",
    description:
      "The database is directly exposed to the public network, increasing the risk of unauthorized access to stored data.",
    recommendation:
      "Restrict database access to private or internal networks and allow only required application services to connect.",
    serviceId: "database",
  });
});
