import type {
  ServiceConnection,
  ServiceNode,
} from "../../types/architecture";
import type { SecurityScoreResult } from "../../types/security";
import {
  getFindingDispositionCounts,
  type FindingDispositionCounts,
  type FindingTriage,
} from "../findings/finding-dispositions";

const PRIORITY_FINDING_LIMIT = 5;

export type ProjectSecurityOverviewSummary = {
  securityScore: SecurityScoreResult;
  dispositionCounts: FindingDispositionCounts;
  architectureCounts: {
    services: number;
    connections: number;
  };
  priorityFindings: FindingTriage[];
};

export function deriveProjectSecurityOverview(
  services: readonly ServiceNode[],
  connections: readonly ServiceConnection[],
  triagedFindings: readonly FindingTriage[],
  securityScore: SecurityScoreResult,
): ProjectSecurityOverviewSummary {
  return {
    securityScore,
    dispositionCounts: getFindingDispositionCounts(triagedFindings),
    architectureCounts: {
      services: services.length,
      connections: connections.length,
    },
    priorityFindings: triagedFindings.slice(0, PRIORITY_FINDING_LIMIT),
  };
}
