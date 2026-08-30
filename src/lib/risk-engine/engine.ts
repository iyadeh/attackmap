import type { ServiceConnection, ServiceNode } from "@/types/architecture";
import type { Finding, FindingSeverity } from "@/types/security";
import {
  securityRules,
  type SecurityRule,
  type SecurityRuleMatch,
} from "./rules";

const severityPriority: Record<FindingSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function getTargetKey(match: SecurityRuleMatch) {
  return "connectionId" in match
    ? `connection:${match.connectionId}`
    : `service:${match.serviceId}`;
}

function createFinding(
  rule: SecurityRule,
  match: SecurityRuleMatch,
): Finding {
  const finding: Finding = {
    id: `${rule.id}:${getTargetKey(match)}`,
    ruleId: rule.id,
    title: rule.title,
    severity: rule.severity,
    description: rule.description,
    recommendation: rule.recommendation,
  };

  if (match.serviceId !== undefined) {
    finding.serviceId = match.serviceId;
  }

  if ("connectionId" in match) {
    finding.connectionId = match.connectionId;
  }

  return finding;
}

function compareText(left: string, right: string) {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function compareFindings(left: Finding, right: Finding) {
  const severityDifference =
    severityPriority[left.severity] - severityPriority[right.severity];

  if (severityDifference !== 0) {
    return severityDifference;
  }

  const ruleDifference = compareText(left.ruleId, right.ruleId);

  return ruleDifference !== 0
    ? ruleDifference
    : compareText(left.id, right.id);
}

export function analyzeArchitecture(
  services: readonly ServiceNode[],
  connections: readonly ServiceConnection[],
): Finding[] {
  const context = {
    services,
    connections,
    servicesById: new Map(
      services.map((service) => [service.id, service] as const),
    ),
  };
  const findingsById = new Map<string, Finding>();

  for (const rule of securityRules) {
    for (const match of rule.evaluate(context)) {
      const finding = createFinding(rule, match);

      if (!findingsById.has(finding.id)) {
        findingsById.set(finding.id, finding);
      }
    }
  }

  return [...findingsById.values()].sort(compareFindings);
}
