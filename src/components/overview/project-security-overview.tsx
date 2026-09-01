import { useMemo } from "react";

import type { ProjectSecurityOverviewSummary } from "@/lib/overview/project-security-overview";
import type { ServiceConnection, ServiceNode } from "@/types/architecture";
import {
  findingSeverityOrder,
  findingSeverityPresentation,
  getFindingTargetLabel,
  type FindingContext,
} from "../findings/finding-presentation";
import { securityScoreCategoryPresentation } from "../findings/security-score-status";

type ProjectSecurityOverviewProps = {
  summary: ProjectSecurityOverviewSummary;
  services: readonly ServiceNode[];
  connections: readonly ServiceConnection[];
};

export function ProjectSecurityOverview({
  summary,
  services,
  connections,
}: ProjectSecurityOverviewProps) {
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
  const scorePresentation =
    securityScoreCategoryPresentation[summary.securityScore.category];

  return (
    <section
      aria-label="Project security overview"
      className="flex min-h-0 flex-1 flex-col bg-[#f8f8f5]"
    >
      <div className="flex h-11 shrink-0 items-center border-b border-[#dfdfda] bg-white px-4">
        <div>
          <h1 className="text-[11px] font-semibold">Security overview</h1>
          <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#8b8b84]">
            Current modeled posture
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        <div className="grid grid-cols-[1.1fr_1.45fr_0.9fr_0.9fr] border-b border-[#dfdfda]">
          <section className="border-r border-[#e7e7e2] px-5 py-4">
            <h2 className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#777770]">
              Security posture
            </h2>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-[24px] font-semibold tracking-[-0.04em] text-[#292926]">
                {summary.securityScore.score}
              </span>
              <span className="font-mono text-[9px] text-[#96968f]">/100</span>
            </div>
            <p
              className={`mt-1 font-mono text-[8px] font-semibold uppercase tracking-[0.08em] ${scorePresentation.className}`}
            >
              {scorePresentation.label}
            </p>
            <p className="mt-2 text-[9px] text-[#6f6f69]">
              {summary.securityScore.totalFindings} active{" "}
              {summary.securityScore.totalFindings === 1
                ? "finding"
                : "findings"}
            </p>
          </section>

          <section className="border-r border-[#e7e7e2] px-5 py-4">
            <h2 className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#777770]">
              Severity
            </h2>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {findingSeverityOrder.map((severity) => {
                const presentation = findingSeverityPresentation[severity];

                return (
                  <div key={severity}>
                    <p
                      className={`font-mono text-[8px] font-semibold uppercase tracking-[0.07em] ${presentation.textClassName}`}
                    >
                      {presentation.label}
                    </p>
                    <p className="mt-1.5 font-mono text-[16px] font-semibold text-[#343431]">
                      {summary.securityScore.severityCounts[severity]}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="border-r border-[#e7e7e2] px-5 py-4">
            <h2 className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#777770]">
              Disposition
            </h2>
            <dl className="mt-3 space-y-2.5 text-[10px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#666660]">Open</dt>
                <dd className="font-mono font-semibold text-[#343431]">
                  {summary.dispositionCounts.open}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#667267]">Accepted risk</dt>
                <dd className="font-mono font-semibold text-[#343431]">
                  {summary.dispositionCounts.accepted}
                </dd>
              </div>
            </dl>
          </section>

          <section className="px-5 py-4">
            <h2 className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#777770]">
              Architecture
            </h2>
            <dl className="mt-3 space-y-2.5 text-[10px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#666660]">Services</dt>
                <dd className="font-mono font-semibold text-[#343431]">
                  {summary.architectureCounts.services}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#666660]">Connections</dt>
                <dd className="font-mono font-semibold text-[#343431]">
                  {summary.architectureCounts.connections}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section>
          <div className="flex h-10 items-center justify-between border-b border-[#e7e7e2] px-5">
            <h2 className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#777770]">
              Priority findings
            </h2>
            <span className="font-mono text-[8px] text-[#92928b]">
              Highest active priority
            </span>
          </div>

          {summary.priorityFindings.length > 0 ? (
            <div>
              {summary.priorityFindings.map(({ finding, status }) => {
                const presentation =
                  findingSeverityPresentation[finding.severity];
                const targetLabel = getFindingTargetLabel(finding, context);

                return (
                  <div
                    key={finding.id}
                    className="grid min-h-14 grid-cols-[88px_minmax(0,1fr)_120px_84px] items-center border-b border-[#e7e7e2] px-5 py-2.5"
                  >
                    <span
                      className={`font-mono text-[8px] font-semibold uppercase tracking-[0.07em] ${presentation.textClassName}`}
                    >
                      {presentation.label}
                    </span>
                    <div className="min-w-0 pr-5">
                      <p
                        title={finding.title}
                        className="truncate text-[11px] font-semibold text-[#30302d]"
                      >
                        {finding.title}
                      </p>
                      <p
                        title={targetLabel}
                        className="mt-0.5 truncate text-[9px] text-[#777770]"
                      >
                        {targetLabel}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-[8px] ${
                        status === "accepted"
                          ? "text-[#667267]"
                          : "text-[#6f6f69]"
                      }`}
                    >
                      {status === "accepted" ? "Accepted risk" : "Open"}
                    </span>
                    <span className="text-right font-mono text-[8px] text-[#96968f]">
                      {finding.ruleId}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-8">
              <div className="max-w-[520px] border-l border-[#cfcfc9] pl-4">
                <p className="text-[12px] font-medium text-[#3e3e39]">
                  No active security findings detected.
                </p>
                <p className="mt-1.5 text-[9px] leading-4 text-[#85857e]">
                  Overview reflects current deterministic AttackMap rules and
                  modeled configuration only.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
