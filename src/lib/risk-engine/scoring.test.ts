import assert from "node:assert/strict";
import test from "node:test";
import type {
  Finding,
  FindingSeverity,
  SecurityScoreCategory,
} from "@/types/security";
import { calculateSecurityScore } from "./scoring";

function finding(severity: FindingSeverity, sequence = 1): Finding {
  return {
    id: `finding-${severity}-${sequence}`,
    ruleId: `TEST-${sequence}`,
    title: "Test finding",
    severity,
    description: "Test description.",
    recommendation: "Test recommendation.",
    serviceId: `service-${sequence}`,
  };
}

function findingsFor(severities: FindingSeverity[]) {
  return severities.map((severity, index) => finding(severity, index + 1));
}

test("no findings returns a strong score of 100", () => {
  assert.deepEqual(calculateSecurityScore([]), {
    score: 100,
    category: "strong",
    totalFindings: 0,
    severityCounts: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
  });
});

const singleSeverityCases: {
  severity: FindingSeverity;
  expectedScore: number;
  expectedCategory: SecurityScoreCategory;
}[] = [
  { severity: "critical", expectedScore: 80, expectedCategory: "good" },
  { severity: "high", expectedScore: 90, expectedCategory: "strong" },
  { severity: "medium", expectedScore: 95, expectedCategory: "strong" },
  { severity: "low", expectedScore: 98, expectedCategory: "strong" },
];

for (const testCase of singleSeverityCases) {
  test(`one ${testCase.severity} finding produces ${testCase.expectedScore}`, () => {
    const result = calculateSecurityScore([finding(testCase.severity)]);

    assert.equal(result.score, testCase.expectedScore);
    assert.equal(result.category, testCase.expectedCategory);
    assert.equal(result.totalFindings, 1);
    assert.equal(result.severityCounts[testCase.severity], 1);
  });
}

test("mixed severities apply every deduction and count", () => {
  assert.deepEqual(
    calculateSecurityScore(
      findingsFor(["critical", "high", "medium", "low"]),
    ),
    {
      score: 63,
      category: "moderate",
      totalFindings: 4,
      severityCounts: {
        critical: 1,
        high: 1,
        medium: 1,
        low: 1,
      },
    },
  );
});

test("score never drops below zero", () => {
  const result = calculateSecurityScore(
    findingsFor([
      "critical",
      "critical",
      "critical",
      "critical",
      "critical",
      "critical",
    ]),
  );

  assert.equal(result.score, 0);
  assert.equal(result.category, "critical-risk");
});

const categoryBoundaryCases: {
  expectedScore: number;
  expectedCategory: SecurityScoreCategory;
  severities: FindingSeverity[];
}[] = [
  { expectedScore: 90, expectedCategory: "strong", severities: ["high"] },
  {
    expectedScore: 89,
    expectedCategory: "good",
    severities: ["medium", "low", "low", "low"],
  },
  {
    expectedScore: 75,
    expectedCategory: "good",
    severities: ["critical", "medium"],
  },
  {
    expectedScore: 74,
    expectedCategory: "moderate",
    severities: ["critical", "low", "low", "low"],
  },
  {
    expectedScore: 50,
    expectedCategory: "moderate",
    severities: ["critical", "critical", "high"],
  },
  {
    expectedScore: 49,
    expectedCategory: "high-risk",
    severities: [
      "critical",
      "critical",
      "medium",
      "low",
      "low",
      "low",
    ],
  },
  {
    expectedScore: 25,
    expectedCategory: "high-risk",
    severities: ["critical", "critical", "critical", "high", "medium"],
  },
  {
    expectedScore: 24,
    expectedCategory: "critical-risk",
    severities: [
      "critical",
      "critical",
      "critical",
      "high",
      "low",
      "low",
      "low",
    ],
  },
];

for (const testCase of categoryBoundaryCases) {
  test(`${testCase.expectedScore} is categorized as ${testCase.expectedCategory}`, () => {
    const result = calculateSecurityScore(findingsFor(testCase.severities));

    assert.equal(result.score, testCase.expectedScore);
    assert.equal(result.category, testCase.expectedCategory);
  });
}

test("does not mutate findings", () => {
  const findings = findingsFor(["critical", "medium", "low"]);
  const before = structuredClone(findings);

  calculateSecurityScore(findings);

  assert.deepEqual(findings, before);
});

test("repeated evaluation returns the same result", () => {
  const findings = findingsFor(["high", "medium", "low"]);

  assert.deepEqual(
    calculateSecurityScore(findings),
    calculateSecurityScore(findings),
  );
});
