export type FindingSeverity = "critical" | "high" | "medium" | "low";

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
