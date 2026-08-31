import type { ServiceConnection, ServiceNode } from "@/types/architecture";
import type { Finding, FindingSeverity } from "@/types/security";

export type FindingContext = {
  servicesById: ReadonlyMap<string, ServiceNode>;
  connectionsById: ReadonlyMap<string, ServiceConnection>;
};

export const findingSeverityOrder: FindingSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
];

export const findingSeverityPresentation: Record<
  FindingSeverity,
  { label: string; textClassName: string; lineClassName: string }
> = {
  critical: {
    label: "Critical",
    textClassName: "text-[#913c39]",
    lineClassName: "bg-[#b0524e]",
  },
  high: {
    label: "High",
    textClassName: "text-[#955027]",
    lineClassName: "bg-[#b66a3b]",
  },
  medium: {
    label: "Medium",
    textClassName: "text-[#80651f]",
    lineClassName: "bg-[#a88a39]",
  },
  low: {
    label: "Low",
    textClassName: "text-[#4c665a]",
    lineClassName: "bg-[#668075]",
  },
};

export function getServiceName(service: ServiceNode | undefined) {
  if (!service) {
    return "Missing service";
  }

  return service.name.trim() || "Unnamed service";
}

export function getConnectionName(
  connection: ServiceConnection | undefined,
  servicesById: ReadonlyMap<string, ServiceNode>,
) {
  if (!connection) {
    return "Connection unavailable";
  }

  return `${getServiceName(servicesById.get(connection.source))} to ${getServiceName(
    servicesById.get(connection.target),
  )}`;
}

export function getFindingTargetLabel(
  finding: Finding,
  context: FindingContext,
) {
  if (finding.connectionId) {
    return getConnectionName(
      context.connectionsById.get(finding.connectionId),
      context.servicesById,
    );
  }

  if (finding.serviceId) {
    return getServiceName(context.servicesById.get(finding.serviceId));
  }

  return "Architecture";
}
