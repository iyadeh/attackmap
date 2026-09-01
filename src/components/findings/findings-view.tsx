import { useMemo, useState, type FormEvent } from "react";
import {
  getFindingDispositionCounts,
  MAX_ACCEPTED_RISK_RATIONALE_LENGTH,
  type FindingTriage,
} from "@/lib/findings/finding-dispositions";
import type { ServiceConnection, ServiceNode } from "@/types/architecture";
import type { SecurityScoreResult } from "@/types/security";
import {
  findingSeverityOrder,
  findingSeverityPresentation,
  getConnectionName,
  getFindingTargetLabel,
  getServiceName,
  type FindingContext,
} from "./finding-presentation";

type FindingsViewProps = {
  triagedFindings: readonly FindingTriage[];
  services: readonly ServiceNode[];
  connections: readonly ServiceConnection[];
  securityScore: SecurityScoreResult;
  onAcceptRisk: (
    findingId: string,
    rationale: string,
  ) => Promise<FindingDispositionMutationResult>;
  onReopen: (findingId: string) => Promise<FindingDispositionMutationResult>;
};

type FindingDispositionMutationResult =
  | { ok: true }
  | { ok: false; error: string };

function SeveritySummary({
  result,
  openCount,
  acceptedCount,
}: {
  result: SecurityScoreResult;
  openCount: number;
  acceptedCount: number;
}) {
  return (
    <div
      aria-label="Finding severity breakdown"
      aria-live="polite"
      className="flex items-center gap-3 font-mono text-[9px]"
    >
      <span className="text-[#5f5f59]">{result.totalFindings} total</span>
      <span className="h-3 w-px bg-[#deded8]" />
      {findingSeverityOrder.map((severity) => {
        const presentation = findingSeverityPresentation[severity];

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
      <span className="h-3 w-px bg-[#deded8]" />
      <span className="text-[#5f5f59]">Open {openCount}</span>
      <span className="text-[#667267]">Accepted risk {acceptedCount}</span>
    </div>
  );
}

function FindingList({
  triagedFindings,
  selectedFindingId,
  context,
  onSelect,
}: {
  triagedFindings: readonly FindingTriage[];
  selectedFindingId: string;
  context: FindingContext;
  onSelect: (findingId: string) => void;
}) {
  return (
    <div className="min-h-0 overflow-y-auto border-r border-[#dfdfda] bg-[#fbfbf9]">
      {triagedFindings.map(({ finding, status }) => {
        const presentation = findingSeverityPresentation[finding.severity];
        const selected = finding.id === selectedFindingId;
        const targetLabel = getFindingTargetLabel(finding, context);

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
              <span className="flex items-center gap-2 font-mono text-[8px]">
                <span
                  className={
                    status === "accepted"
                      ? "text-[#667267]"
                      : "text-[#7f7f78]"
                  }
                >
                  {status === "accepted" ? "Accepted risk" : "Open"}
                </span>
                <span className="text-[#96968f]">{finding.ruleId}</span>
              </span>
            </span>
            <span
              title={finding.title}
              className="mt-1.5 line-clamp-2 block text-[11px] font-semibold text-[#30302d]"
            >
              {finding.title}
            </span>
            <span
              title={targetLabel}
              className="mt-1 block truncate text-[9px] text-[#686862]"
            >
              {targetLabel}
            </span>
            <span className="mt-1.5 line-clamp-2 block text-[9px] leading-4 text-[#85857e]">
              {finding.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FindingDetail({
  triage,
  context,
  onAcceptRisk,
  onReopen,
}: {
  triage: FindingTriage;
  context: FindingContext;
  onAcceptRisk: FindingsViewProps["onAcceptRisk"];
  onReopen: FindingsViewProps["onReopen"];
}) {
  const { finding, disposition, status } = triage;
  const [accepting, setAccepting] = useState(false);
  const [rationale, setRationale] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "accept" | "reopen" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const presentation = findingSeverityPresentation[finding.severity];
  const service = finding.serviceId
    ? context.servicesById.get(finding.serviceId)
    : undefined;
  const connection = finding.connectionId
    ? context.connectionsById.get(finding.connectionId)
    : undefined;
  const rationaleErrorId = `accepted-risk-error-${finding.id}`;

  async function submitAcceptance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedRationale = rationale.trim();

    if (!normalizedRationale) {
      setError("Rationale is required.");
      return;
    }

    setError(null);
    setPendingAction("accept");
    try {
      const result = await onAcceptRisk(finding.id, normalizedRationale);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setAccepting(false);
      setRationale("");
    } catch {
      setError("Could not accept risk.");
    } finally {
      setPendingAction(null);
    }
  }

  async function reopen() {
    setError(null);
    setPendingAction("reopen");
    try {
      const result = await onReopen(finding.id);

      if (!result.ok) {
        setError(result.error);
      }
    } catch {
      setError("Could not reopen finding.");
    } finally {
      setPendingAction(null);
    }
  }

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
          <h3 className="mt-2 break-words text-[16px] font-semibold tracking-[-0.02em] text-[#292926]">
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
                <p className="mt-1 break-all font-mono text-[8px] text-[#92928b]">
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
                <p className="mt-1 break-all font-mono text-[8px] text-[#92928b]">
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
          <p className="break-words text-[11px] leading-5 text-[#484843]">
            {finding.description}
          </p>
        </section>

        <section className="border-b border-[#e7e7e2] py-4">
          <h4 className="mb-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#777770]">
            Recommendation
          </h4>
          <p className="break-words text-[11px] leading-5 text-[#484843]">
            {finding.recommendation}
          </p>
        </section>

        <section className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#777770]">
                Disposition
              </h4>
              <p
                className={`mt-1.5 font-mono text-[9px] font-medium ${
                  status === "accepted"
                    ? "text-[#667267]"
                    : "text-[#666660]"
                }`}
              >
                {status === "accepted" ? "Accepted risk" : "Open"}
              </p>
            </div>

            {status === "accepted" ? (
              <button
                type="button"
                onClick={reopen}
                disabled={pendingAction !== null}
                className="text-[9px] font-medium text-[#555550] hover:text-[#292927] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {pendingAction === "reopen" ? "Reopening…" : "Reopen"}
              </button>
            ) : !accepting ? (
              <button
                type="button"
                onClick={() => {
                  setAccepting(true);
                  setError(null);
                }}
                className="h-7 rounded-[3px] border border-[#292927] bg-[#292927] px-2.5 text-[9px] font-medium text-white hover:bg-[#3b3b38]"
              >
                Accept risk
              </button>
            ) : null}
          </div>

          {status === "accepted" && disposition ? (
            <div className="mt-3 border-l border-[#cfcfc9] pl-3">
              <p className="text-[9px] font-medium text-[#74746d]">
                Rationale
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-5 text-[#484843]">
                {disposition.rationale}
              </p>
            </div>
          ) : null}

          {status === "open" && accepting ? (
            <form onSubmit={submitAcceptance} className="mt-3">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor={`accepted-risk-rationale-${finding.id}`}
                  className="text-[9px] font-medium text-[#666660]"
                >
                  Acceptance rationale
                </label>
                <span className="font-mono text-[8px] text-[#92928b]">
                  {rationale.length}/{MAX_ACCEPTED_RISK_RATIONALE_LENGTH}
                </span>
              </div>
              <textarea
                id={`accepted-risk-rationale-${finding.id}`}
                value={rationale}
                onChange={(event) => setRationale(event.target.value)}
                maxLength={MAX_ACCEPTED_RISK_RATIONALE_LENGTH}
                rows={3}
                disabled={pendingAction !== null}
                autoFocus
                aria-invalid={Boolean(error)}
                aria-describedby={error ? rationaleErrorId : undefined}
                placeholder="Document why this risk is acceptable."
                className="mt-1.5 block w-full resize-none rounded-[3px] border border-[#d8d8d2] bg-white px-2.5 py-2 text-[10px] leading-4 text-[#343431] outline-none placeholder:text-[#a0a099] focus:border-[#777770] disabled:bg-[#f5f5f1]"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={pendingAction !== null}
                  className="h-7 rounded-[3px] border border-[#292927] bg-[#292927] px-2.5 text-[9px] font-medium text-white hover:bg-[#3b3b38] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {pendingAction === "accept" ? "Accepting…" : "Accept risk"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccepting(false);
                    setError(null);
                  }}
                  disabled={pendingAction !== null}
                  className="text-[9px] font-medium text-[#666660] hover:text-[#343431] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {error ? (
            <p
              id={rationaleErrorId}
              role="alert"
              className="mt-2 text-[9px] text-[#913c39]"
            >
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </aside>
  );
}

export function FindingsView({
  triagedFindings,
  services,
  connections,
  securityScore,
  onAcceptRisk,
  onReopen,
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
    triagedFindings.find(
      ({ finding }) => finding.id === selectedFindingId,
    ) ??
    triagedFindings[0] ??
    null;
  const dispositionCounts = getFindingDispositionCounts(triagedFindings);

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
        <SeveritySummary
          result={securityScore}
          openCount={dispositionCounts.open}
          acceptedCount={dispositionCounts.accepted}
        />
      </div>

      {selectedFinding ? (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(360px,0.82fr)_minmax(0,1.18fr)]">
          <FindingList
            triagedFindings={triagedFindings}
            selectedFindingId={selectedFinding.finding.id}
            context={context}
            onSelect={setSelectedFindingId}
          />
          <FindingDetail
            key={selectedFinding.finding.id}
            triage={selectedFinding}
            context={context}
            onAcceptRisk={onAcceptRisk}
            onReopen={onReopen}
          />
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
