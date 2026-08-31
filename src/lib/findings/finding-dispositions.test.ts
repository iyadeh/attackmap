import assert from "node:assert/strict";
import test from "node:test";

import { createArchitectureAutosaveCoordinator } from "../architecture/autosave-coordinator";
import { calculateSecurityScore } from "../risk-engine/scoring";
import type { ArchitectureSnapshot } from "../../types/architecture";
import type { Finding, FindingDisposition } from "../../types/security";

import {
  parseAcceptedRiskInput,
  triageActiveFindings,
} from "./finding-dispositions";

const finding: Finding = {
  id: "AM-006:service:api",
  ruleId: "AM-006",
  title: "Public API without rate limiting",
  severity: "medium",
  description: "Public API has no modeled rate limiting.",
  recommendation: "Add rate limiting.",
  serviceId: "api",
};

const disposition: FindingDisposition = {
  projectId: "00000000-0000-4000-8000-000000000091",
  findingId: finding.id,
  status: "accepted",
  rationale: "Rate limiting is enforced by the upstream gateway.",
  createdAt: new Date("2026-08-31T00:00:00.000Z"),
  updatedAt: new Date("2026-08-31T00:00:00.000Z"),
};

const emptyArchitecture: ArchitectureSnapshot = {
  services: [],
  servicePositions: [],
  connections: [],
};

test("active finding without disposition is open", () => {
  assert.deepEqual(triageActiveFindings([finding], []), [
    { finding, status: "open", disposition: null },
  ]);
});

test("accepted risk input requires and normalizes rationale", () => {
  assert.deepEqual(
    parseAcceptedRiskInput(finding.id, "  Accepted behind gateway controls.  "),
    {
      findingId: finding.id,
      rationale: "Accepted behind gateway controls.",
    },
  );
  assert.throws(
    () => parseAcceptedRiskInput(finding.id, " \n\t "),
    /rationale is invalid/,
  );
  assert.throws(
    () => parseAcceptedRiskInput(finding.id, "x".repeat(1_001)),
    /rationale is invalid/,
  );
});

test("stored dispositions apply only to active findings", () => {
  assert.deepEqual(triageActiveFindings([], [disposition]), []);
  assert.deepEqual(triageActiveFindings([finding], [disposition]), [
    { finding, status: "accepted", disposition },
  ]);
});

test("same stable finding ID regains its accepted disposition", () => {
  const firstAppearance = triageActiveFindings([finding], [disposition]);
  const disappearance = triageActiveFindings([], [disposition]);
  const reappearance = triageActiveFindings(
    [structuredClone(finding)],
    [disposition],
  );

  assert.equal(firstAppearance[0]?.status, "accepted");
  assert.deepEqual(disappearance, []);
  assert.equal(reappearance[0]?.status, "accepted");
});

test("accepted findings remain in raw security score", () => {
  const scoreBeforeAcceptance = calculateSecurityScore([finding]);
  const activeAfterAcceptance = triageActiveFindings(
    [finding],
    [disposition],
  ).map(({ finding: activeFinding }) => activeFinding);

  assert.deepEqual(
    calculateSecurityScore(activeAfterAcceptance),
    scoreBeforeAcceptance,
  );
  assert.equal(scoreBeforeAcceptance.score, 95);
});

test("disposition changes do not dirty architecture autosave", () => {
  let saveCount = 0;
  const coordinator = createArchitectureAutosaveCoordinator({
    initialSnapshot: emptyArchitecture,
    delay: 1_500,
    save: async () => {
      saveCount += 1;
      return true;
    },
    onStatusChange: () => undefined,
  });

  triageActiveFindings([finding], [disposition]);

  assert.equal(coordinator.isDirty(), false);
  assert.equal(coordinator.getStatus(), "saved");
  assert.equal(saveCount, 0);
  coordinator.dispose();
});
