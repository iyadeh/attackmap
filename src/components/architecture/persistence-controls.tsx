import type { ArchitectureSaveStatus } from "@/lib/architecture/autosave-coordinator";

export type PersistenceStatus = {
  kind: "success" | "neutral" | "error";
  message: string;
};

type PersistenceControlsProps = {
  pendingAction: "save" | "load" | null;
  status: PersistenceStatus | null;
  saveStatus: ArchitectureSaveStatus;
  onSave: () => void;
  onLoad: () => void;
};

export function PersistenceControls({
  pendingAction,
  status,
  saveStatus,
  onSave,
  onLoad,
}: PersistenceControlsProps) {
  const pending = pendingAction !== null;
  const saveStatusPresentation = {
    saved: { kind: "success", message: "Saved" },
    unsaved: { kind: "neutral", message: "Unsaved" },
    saving: { kind: "neutral", message: "Saving…" },
    error: { kind: "error", message: "Save failed" },
  } as const satisfies Record<ArchitectureSaveStatus, PersistenceStatus>;
  const displayedStatus =
    saveStatus === "saved"
      ? (status ?? saveStatusPresentation.saved)
      : saveStatusPresentation[saveStatus];

  return (
    <div className="flex items-center gap-2 border-l border-[#e7e7e2] px-3">
      <button
        type="button"
        onClick={onLoad}
        disabled={pending}
        className="h-7 rounded-[3px] border border-[#d8d8d2] bg-white px-2.5 text-[10px] font-medium text-[#4f4f4a] hover:bg-[#f5f5f1] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {pendingAction === "load" ? "Loading…" : "Load"}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="h-7 rounded-[3px] border border-[#292927] bg-[#292927] px-2.5 text-[10px] font-medium text-white hover:bg-[#3b3b38] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {pendingAction === "save" ? "Saving…" : "Save"}
      </button>
      {displayedStatus ? (
        <span
          role={displayedStatus.kind === "error" ? "alert" : "status"}
          title={displayedStatus.message}
          className={`max-w-[150px] truncate text-[9px] ${
            displayedStatus.kind === "error"
              ? "text-[#913c39]"
              : displayedStatus.kind === "success"
                ? "text-[#667267]"
                : "text-[#777770]"
          }`}
        >
          {displayedStatus.message}
        </span>
      ) : null}
    </div>
  );
}
