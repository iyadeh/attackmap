export type FindingSeverity = "critical" | "high" | "medium" | "low";

export type SecurityScoreCategory =
  | "strong"
  | "good"
  | "moderate"
  | "high-risk"
  | "critical-risk";

export type SeverityCounts = Record<FindingSeverity, number>;

export type SecurityScoreResult = {
  score: number;
  category: SecurityScoreCategory;
  totalFindings: number;
  severityCounts: SeverityCounts;
};

export type Finding = {
  id: string;
  ruleId: string;
  title: string;
  severity: FindingSeverity;
  description: string;
  recommendation: string;
  serviceId?: string;
  connectionId?: string;
};

export type FindingDispositionStatus = "open" | "accepted";

export type FindingDisposition = {
  projectId: string;
  findingId: string;
  status: "accepted";
  rationale: string;
  createdAt: Date;
  updatedAt: Date;
};
