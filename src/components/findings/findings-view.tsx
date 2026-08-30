import { useMemo, useState } from "react";
import type { ServiceConnection, ServiceNode } from "@/types/architecture";
import type {
  Finding,
  FindingSeverity,
  SecurityScoreResult,
} from "@/types/security";

type FindingsViewProps = {
  findings: readonly Finding[];
  services: readonly ServiceNode[];
  connections: readonly ServiceConnection[];
  securityScore: SecurityScoreResult;
};

type FindingContext = {
  servicesById: ReadonlyMap<string, ServiceNode>;
  connectionsById: ReadonlyMap<string, ServiceConnection>;
};

const severityOrder: FindingSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
];

const severityPresentation: Record<
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

function getServiceName(service: ServiceNode | undefined) {
  if (!service) {
    return "Missing service";
  }

  return service.name.trim() || "Unnamed service";
}

function getConnectionName(
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

function getFindingTargetLabel(
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

function SeveritySummary({ result }: { result: SecurityScoreResult }) {
  return (
    <div
      aria-label="Finding severity breakdown"
      aria-live="polite"
      className="flex items-center gap-3 font-mono text-[9px]"
    >
      <span className="text-[#5f5f59]">{result.totalFindings} total</span>
      <span className="h-3 w-px bg-[#deded8]" />
      {severityOrder.map((severity) => {
        const presentation = severityPresentation[severity];

        return (
          <span key={severity} className="flex items-center gap-1">
            <span
              className={`uppercase tracking-[0.06em] ${presentation.textClassName}`}
            >
              {presentation.label}
            </span>
            <span className="text-[#5f5f59]">
              {result.severityCounts[severity]}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function FindingList({
  findings,
  selectedFindingId,
  context,
  onSelect,
}: {
  findings: readonly Finding[];
  selectedFindingId: string;
  context: FindingContext;
  onSelect: (findingId: string) => void;
}) {
  return (
    <div className="min-h-0 overflow-y-auto border-r border-[#dfdfda] bg-[#fbfbf9]">
      {findings.map((finding) => {
        const presentation = severityPresentation[finding.severity];
        const selected = finding.id === selectedFindingId;

        return (
          <button
            key={finding.id}
            type="button"
            onClick={() => onSelect(finding.id)}
            aria-pressed={selected}
            className={`relative block w-full border-b border-[#e7e7e2] px-4 py-3 text-left transition-colors ${
              selected
                ? "bg-white"
                : "bg-transparent hover:bg-[#f5f5f1]"
            }`}
          >
            <span
              className={`absolute inset-y-0 left-0 w-0.5 ${
                selected ? presentation.lineClassName : "bg-transparent"
              }`}
            />
            <span className="flex items-center justify-between gap-3">
              <span
                className={`font-mono text-[8px] font-semibold uppercase tracking-[0.08em] ${presentation.textClassName}`}
              >
                {presentation.label}
              </span>
              <span className="font-mono text-[8px] text-[#96968f]">
                {finding.ruleId}
              </span>
            </span>
            <span className="mt-1.5 block text-[11px] font-semibold text-[#30302d]">
              {finding.title}
            </span>
            <span className="mt-1 block truncate text-[9px] text-[#686862]">
              {getFindingTargetLabel(finding, context)}
            </span>
            <span className="mt-1.5 block text-[9px] leading-4 text-[#85857e]">
              {finding.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FindingDetail({
  finding,
  context,
}: {
  finding: Finding;
  context: FindingContext;
}) {
  const presentation = severityPresentation[finding.severity];
  const service = finding.serviceId
    ? context.servicesById.get(finding.serviceId)
    : undefined;
  const connection = finding.connectionId
    ? context.connectionsById.get(finding.connectionId)
    : undefined;

  return (
    <aside
      aria-label="Finding detail"
      className="min-h-0 overflow-y-auto bg-white"
    >
      <div className="flex h-11 items-center justify-between border-b border-[#e7e7e2] px-5">
        <h2 className="text-[11px] font-semibold">Finding detail</h2>
        <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-[#85857e]">
          {finding.ruleId}
        </span>
      </div>

      <div className="max-w-[720px] px-5">
        <div className="border-b border-[#e7e7e2] py-5">
          <p
            className={`font-mono text-[9px] font-semibold uppercase tracking-[0.09em] ${presentation.textClassName}`}
          >
            {presentation.label}
          </p>
          <h3 className="mt-2 text-[16px] font-semibold tracking-[-0.02em] text-[#292926]">
            {finding.title}
          </h3>
        </div>

        <section className="border-b border-[#e7e7e2] py-4">
          <h4 className="mb-3 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#777770]">
            Affected architecture
          </h4>
          <div className="space-y-3">
            {connection ? (
              <div>
                <p className="text-[9px] font-medium text-[#74746d]">
                  Connection
                </p>
                <p className="mt-1 text-[11px] font-medium text-[#343431]">
                  {getConnectionName(connection, context.servicesById)}
                </p>
                <p className="mt-1 font-mono text-[8px] text-[#92928b]">
                  {connection.id}
                </p>
              </div>
            ) : null}
            {finding.serviceId ? (
              <div>
                <p className="text-[9px] font-medium text-[#74746d]">
                  Service
                </p>
                <p className="mt-1 text-[11px] font-medium text-[#343431]">
                  {getServiceName(service)}
                </p>
                <p className="mt-1 font-mono text-[8px] text-[#92928b]">
                  {finding.serviceId}
                </p>
              </div>
            ) : null}
            {!finding.connectionId && !finding.serviceId ? (
              <p className="text-[11px] text-[#343431]">Architecture</p>
            ) : null}
          </div>
        </section>

        <section className="border-b border-[#e7e7e2] py-4">
          <h4 className="mb-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#777770]">
            Description
          </h4>
          <p className="text-[11px] leading-5 text-[#484843]">
            {finding.description}
          </p>
        </section>

        <section className="py-4">
          <h4 className="mb-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#777770]">
            Recommendation
          </h4>
          <p className="text-[11px] leading-5 text-[#484843]">
            {finding.recommendation}
          </p>
        </section>
      </div>
    </aside>
  );
}

export function FindingsView({
  findings,
  services,
  connections,
  securityScore,
}: FindingsViewProps) {
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(
    null,
  );
  const context = useMemo<FindingContext>(
    () => ({
      servicesById: new Map(
        services.map((service) => [service.id, service] as const),
      ),
      connectionsById: new Map(
        connections.map((connection) => [connection.id, connection] as const),
      ),
    }),
    [connections, services],
  );
  const selectedFinding =
    findings.find((finding) => finding.id === selectedFindingId) ??
    findings[0] ??
    null;

  return (
    <section
      aria-label="Security findings"
      className="flex min-h-0 flex-1 flex-col bg-[#f8f8f5]"
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#dfdfda] bg-white px-4">
        <div>
          <h1 className="text-[11px] font-semibold">Security findings</h1>
          <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#8b8b84]">
            Live model analysis
          </p>
        </div>
        <SeveritySummary result={securityScore} />
      </div>

      {selectedFinding ? (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(360px,0.82fr)_minmax(0,1.18fr)]">
          <FindingList
            findings={findings}
            selectedFindingId={selectedFinding.id}
            context={context}
            onSelect={setSelectedFindingId}
          />
          <FindingDetail finding={selectedFinding} context={context} />
        </div>
      ) : (
        <div className="min-h-0 flex-1 bg-white px-6 py-8">
          <div className="max-w-[520px] border-l border-[#cfcfc9] pl-4">
            <p className="text-[12px] font-medium text-[#3e3e39]">
              No security findings detected for the current architecture.
            </p>
            <p className="mt-1.5 text-[9px] leading-4 text-[#85857e]">
              Analysis covers the current deterministic AttackMap rules and
              modeled configuration only.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
