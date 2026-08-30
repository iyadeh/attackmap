import type {
  Finding,
  FindingSeverity,
  SecurityScoreCategory,
  SecurityScoreResult,
  SeverityCounts,
} from "@/types/security";

const severityDeductions: Readonly<Record<FindingSeverity, number>> = {
  critical: 20,
  high: 10,
  medium: 5,
  low: 2,
};

function getScoreCategory(score: number): SecurityScoreCategory {
  if (score >= 90) {
    return "strong";
  }

  if (score >= 75) {
    return "good";
  }

  if (score >= 50) {
    return "moderate";
  }

  if (score >= 25) {
    return "high-risk";
  }

  return "critical-risk";
}

export function calculateSecurityScore(
  findings: readonly Finding[],
): SecurityScoreResult {
  const severityCounts: SeverityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  let totalDeduction = 0;

  for (const finding of findings) {
    severityCounts[finding.severity] += 1;
    totalDeduction += severityDeductions[finding.severity];
  }

  const score = Math.max(0, 100 - totalDeduction);

  return {
    score,
    category: getScoreCategory(score),
    totalFindings: findings.length,
    severityCounts,
  };
}
