export type PersistenceStatus = {
  kind: "success" | "neutral" | "error";
  message: string;
};

type PersistenceControlsProps = {
  pendingAction: "save" | "load" | null;
  status: PersistenceStatus | null;
  onSave: () => void;
  onLoad: () => void;
};

export function PersistenceControls({
  pendingAction,
  status,
  onSave,
  onLoad,
}: PersistenceControlsProps) {
  const pending = pendingAction !== null;

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
      {status ? (
        <span
          role={status.kind === "error" ? "alert" : "status"}
          title={status.message}
          className={`max-w-[150px] truncate text-[9px] ${
            status.kind === "error"
              ? "text-[#913c39]"
              : status.kind === "success"
                ? "text-[#667267]"
                : "text-[#777770]"
          }`}
        >
          {status.message}
        </span>
      ) : null}
    </div>
  );
}
