import { FlowArrow, ShieldCheck } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type {
  ConnectionProtocol,
  ServiceConnection,
} from "@/types/architecture";

type ConnectionInspectorProps = {
  connection: ServiceConnection;
  sourceName: string;
  targetName: string;
  onProtocolChange: (protocol: ConnectionProtocol) => void;
  onEncryptedChange: (encrypted: boolean) => void;
  onDelete: (connectionId: string) => void;
};

const protocolOptions: { value: ConnectionProtocol; label: string }[] = [
  { value: "https", label: "HTTPS" },
  { value: "http", label: "HTTP" },
  { value: "grpc", label: "gRPC" },
  { value: "tcp", label: "TCP" },
  { value: "websocket", label: "WebSocket" },
];

const fieldControlClassName =
  "h-7 w-full rounded-[3px] border border-[#d5d5cf] bg-[#fbfbf9] px-2 text-[10px] text-[#2e2e2a] outline-none transition-colors hover:border-[#bcbcb5] focus:border-[#6d6d67] focus:bg-white focus:ring-1 focus:ring-[#6d6d67]/10";

function ConnectionInspectorSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[#e7e7e2] py-3.5">
      <h3 className="mb-3 text-[9px] font-semibold uppercase tracking-[0.11em] text-[#777770]">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ConnectionEndpoint({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <p className="mb-1 text-[9px] font-medium text-[#74746d]">{label}</p>
      <p className="truncate border-l border-[#d5d5cf] py-0.5 pl-2 text-[10px] text-[#353531]">
        {name}
      </p>
    </div>
  );
}

export function ConnectionInspector({
  connection,
  sourceName,
  targetName,
  onProtocolChange,
  onEncryptedChange,
  onDelete,
}: ConnectionInspectorProps) {
  const encryptionIsProtocolDefined =
    connection.protocol === "https" || connection.protocol === "http";

  return (
    <aside
      aria-label="Connection inspector"
      className="min-h-0 overflow-y-auto border-l border-[#dfdfda] bg-white"
    >
      <div className="flex h-11 items-center justify-between border-b border-[#e7e7e2] px-3.5">
        <h2 className="text-[11px] font-semibold">Connection inspector</h2>
        <span className="border border-[#deded8] bg-[#f7f7f4] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#777770]">
          In memory
        </span>
      </div>

      <form className="px-3.5" onSubmit={(event) => event.preventDefault()}>
        <div className="flex items-start gap-3 border-b border-[#e7e7e2] py-3.5">
          <span className="mt-0.5 text-[#4f4f4a]">
            <FlowArrow size={19} weight="regular" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold">
              {sourceName} to {targetName}
            </p>
            <p className="mt-1 font-mono text-[8px] text-[#85857e]">
              {connection.id}
            </p>
          </div>
        </div>

        <ConnectionInspectorSection title="Connection">
          <ConnectionEndpoint label="Source" name={sourceName} />
          <ConnectionEndpoint label="Target" name={targetName} />
        </ConnectionInspectorSection>

        <ConnectionInspectorSection title="Network">
          <div>
            <label
              htmlFor="connection-protocol"
              className="mb-1 block text-[9px] font-medium text-[#74746d]"
            >
              Protocol
            </label>
            <select
              id="connection-protocol"
              value={connection.protocol}
              onChange={(event) =>
                onProtocolChange(event.target.value as ConnectionProtocol)
              }
              className={fieldControlClassName}
            >
              {protocolOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <label
            className={`flex min-h-6 items-center justify-between gap-3 text-[10px] text-[#3f3f3a] ${
              encryptionIsProtocolDefined
                ? "cursor-default"
                : "cursor-pointer"
            }`}
          >
            <span>Encrypted</span>
            <input
              type="checkbox"
              checked={connection.encrypted}
              disabled={encryptionIsProtocolDefined}
              onChange={(event) => onEncryptedChange(event.target.checked)}
              className="h-3.5 w-3.5 shrink-0 accent-[#33332f] disabled:cursor-default"
            />
          </label>
        </ConnectionInspectorSection>

        <div className="flex gap-2.5 py-3.5 text-[9px] leading-3.5 text-[#85857e]">
          <ShieldCheck
            className="mt-0.5 shrink-0 text-[#666660]"
            size={14}
            weight="bold"
            aria-hidden="true"
          />
          <p>Changes apply immediately to this in-memory connection.</p>
        </div>

        <div className="border-t border-[#e7e7e2] py-3.5">
          <button
            type="button"
            onClick={() => onDelete(connection.id)}
            className="text-[9px] font-medium text-[#91403d] hover:text-[#6f2e2c]"
          >
            Delete connection
          </button>
        </div>
      </form>
    </aside>
  );
}
