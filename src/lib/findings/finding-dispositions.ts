import type {
  Finding,
  FindingDisposition,
  FindingDispositionStatus,
} from "../../types/security";

export const MAX_FINDING_ID_LENGTH = 256;
export const MAX_ACCEPTED_RISK_RATIONALE_LENGTH = 1_000;

export type AcceptedRiskInput = {
  findingId: string;
  rationale: string;
};

export type FindingTriage = {
  finding: Finding;
  status: FindingDispositionStatus;
  disposition: FindingDisposition | null;
};

export type FindingDispositionCounts = Record<
  FindingDispositionStatus,
  number
>;

function parseFindingId(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_FINDING_ID_LENGTH ||
    value.includes("\u0000")
  ) {
    throw new Error("Invalid finding ID.");
  }

  return value;
}

export function parseAcceptedRiskInput(
  findingIdInput: unknown,
  rationaleInput: unknown,
): AcceptedRiskInput {
  const findingId = parseFindingId(findingIdInput);

  if (typeof rationaleInput !== "string") {
    throw new Error("Accepted risk rationale is required.");
  }

  const rationale = rationaleInput.trim();

  if (
    rationale.length === 0 ||
    rationale.length > MAX_ACCEPTED_RISK_RATIONALE_LENGTH ||
    rationale.includes("\u0000")
  ) {
    throw new Error("Accepted risk rationale is invalid.");
  }

  return { findingId, rationale };
}

export function parseDispositionFindingId(value: unknown): string {
  return parseFindingId(value);
}

export function triageActiveFindings(
  findings: readonly Finding[],
  dispositions: readonly FindingDisposition[],
): FindingTriage[] {
  const dispositionsByFindingId = new Map(
    dispositions.map((disposition) => [disposition.findingId, disposition]),
  );

  return findings.map((finding) => {
    const disposition = dispositionsByFindingId.get(finding.id) ?? null;

    return {
      finding,
      status: disposition ? "accepted" : "open",
      disposition,
    };
  });
}

export function getFindingDispositionCounts(
  triagedFindings: readonly FindingTriage[],
): FindingDispositionCounts {
  const counts: FindingDispositionCounts = {
    open: 0,
    accepted: 0,
  };

  for (const { status } of triagedFindings) {
    counts[status] += 1;
  }

  return counts;
}
