import { createContext, useContext } from "react";
import {
  Handle,
  Position,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import {
  BracketsCurly,
  Browser,
  Cloud,
  Database,
  FlowArrow,
  GlobeHemisphereWest,
  Key,
} from "@phosphor-icons/react";
import type { ServiceNode, ServiceType } from "@/types/architecture";

export type ArchitectureNodeData = { serviceId: string };
export type ArchitectureNode = Node<ArchitectureNodeData, "service">;
export type ServiceIconType = ServiceType;

export const serviceTypeLabels: Record<ServiceType, string> = {
  internet: "Internet",
  web: "Web application",
  mobile: "Mobile application",
  api: "API",
  gateway: "API gateway",
  backend: "Backend service",
  auth: "Authentication service",
  database: "Database",
  cache: "Cache",
  storage: "Object storage",
  queue: "Message queue",
  third_party: "Third-party service",
};

const protocolLabels = {
  https: "HTTPS",
  tcp_tls: "TCP/TLS",
} as const;

export const ServiceModelContext = createContext<ReadonlyMap<string, ServiceNode>>(
  new Map(),
);

export function ServiceIcon({
  type,
  size = 17,
}: {
  type: ServiceIconType;
  size?: number;
}) {
  const iconProps = { size, weight: "bold" as const, "aria-hidden": true };

  switch (type) {
    case "internet":
      return <GlobeHemisphereWest {...iconProps} />;
    case "web":
    case "mobile":
      return <Browser {...iconProps} />;
    case "gateway":
    case "queue":
      return <FlowArrow {...iconProps} />;
    case "api":
    case "backend":
      return <BracketsCurly {...iconProps} />;
    case "auth":
      return <Key {...iconProps} />;
    case "database":
    case "cache":
      return <Database {...iconProps} />;
    case "storage":
    case "third_party":
      return <Cloud {...iconProps} />;
  }
}

function ServiceNodeComponent({ data, selected }: NodeProps<ArchitectureNode>) {
  const servicesById = useContext(ServiceModelContext);
  const service = servicesById.get(data.serviceId);

  if (!service) {
    return null;
  }

  return (
    <div
      className={`relative border bg-white transition-colors ${
        selected
          ? "border-[#33332f] ring-1 ring-[#33332f]/10"
          : "border-[#d4d4ce] hover:border-[#a9a9a2]"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable
        className="!h-2 !w-2 !cursor-crosshair !border-2 !border-white !bg-[#85857e]"
      />

      <div className="flex items-center gap-2.5 border-b border-[#e9e9e4] px-3 py-3">
        <span className="text-[#4d4d48]">
          <ServiceIcon type={service.type} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold tracking-[-0.01em] text-[#242421]">
            {service.name || "Unnamed service"}
          </p>
          <p className="mt-0.5 truncate text-[9px] font-medium uppercase tracking-[0.09em] text-[#7e7e77]">
            {serviceTypeLabels[service.type]}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 font-mono text-[9px] text-[#62625c]">
        <span>{protocolLabels[service.protocol]}</span>
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 ${
              service.exposure === "public" ? "bg-[#a55b3d]" : "bg-[#66806a]"
            }`}
          />
          {service.exposure}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable
        className="!h-2 !w-2 !cursor-crosshair !border-2 !border-white !bg-[#85857e]"
      />
    </div>
  );
}

export const serviceNodeTypes: NodeTypes = {
  service: ServiceNodeComponent,
};
