import type {
  SecurityScoreCategory,
  SecurityScoreResult,
} from "@/types/security";

type SecurityScoreStatusProps = {
  result: SecurityScoreResult;
};

export const securityScoreCategoryPresentation: Record<
  SecurityScoreCategory,
  { label: string; className: string }
> = {
  strong: { label: "Strong", className: "text-[#4c665a]" },
  good: { label: "Good", className: "text-[#5b6c4e]" },
  moderate: { label: "Moderate", className: "text-[#80651f]" },
  "high-risk": { label: "High risk", className: "text-[#955027]" },
  "critical-risk": {
    label: "Critical risk",
    className: "text-[#913c39]",
  },
};

export function SecurityScoreStatus({ result }: SecurityScoreStatusProps) {
  const presentation = securityScoreCategoryPresentation[result.category];

  return (
    <div
      aria-label={`Security score ${result.score} out of 100, ${presentation.label}`}
      aria-live="polite"
      className="flex h-full shrink-0 items-center gap-2 border-l border-[#e7e7e2] px-3"
    >
      <span className="text-[9px] text-[#777770]">Security score</span>
      <span className="font-mono text-[10px] font-semibold text-[#343431]">
        {result.score}
        <span className="font-normal text-[#96968f]">/100</span>
      </span>
      <span
        className={`font-mono text-[8px] font-semibold uppercase tracking-[0.07em] ${presentation.className}`}
      >
        {presentation.label}
      </span>
    </div>
  );
}
