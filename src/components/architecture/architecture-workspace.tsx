"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useNodesState,
  type Edge,
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
  Graph,
  Key,
  ShieldCheck,
} from "@phosphor-icons/react";

type ServiceType = "web" | "gateway" | "api" | "database";
type Exposure = "public" | "private" | "internal";

type ServiceNodeData = {
  name: string;
  serviceType: ServiceType;
  serviceLabel: string;
  technology: string;
  exposure: Exposure;
  protocol: "HTTPS" | "TCP/TLS";
  authentication: string;
  authorization: string;
};

type ArchitectureServiceNode = Node<ServiceNodeData, "service">;

type PaletteIcon =
  | "internet"
  | "web"
  | "gateway"
  | "api"
  | "auth"
  | "database"
  | "storage";

const initialNodes: ArchitectureServiceNode[] = [
  {
    id: "web-application",
    type: "service",
    position: { x: 0, y: 150 },
    ariaLabel: "Web Application service",
    data: {
      name: "Web Application",
      serviceType: "web",
      serviceLabel: "Application",
      technology: "Next.js",
      exposure: "public",
      protocol: "HTTPS",
      authentication: "Session",
      authorization: "Application rules",
    },
  },
  {
    id: "api-gateway",
    type: "service",
    position: { x: 290, y: 150 },
    selected: true,
    ariaLabel: "API Gateway service",
    data: {
      name: "API Gateway",
      serviceType: "gateway",
      serviceLabel: "Gateway",
      technology: "Kong",
      exposure: "public",
      protocol: "HTTPS",
      authentication: "None",
      authorization: "None",
    },
  },
  {
    id: "rest-api",
    type: "service",
    position: { x: 580, y: 150 },
    ariaLabel: "REST API service",
    data: {
      name: "REST API",
      serviceType: "api",
      serviceLabel: "Backend",
      technology: "Go",
      exposure: "internal",
      protocol: "HTTPS",
      authentication: "JWT",
      authorization: "RBAC",
    },
  },
  {
    id: "postgresql",
    type: "service",
    position: { x: 870, y: 150 },
    ariaLabel: "PostgreSQL database service",
    data: {
      name: "PostgreSQL",
      serviceType: "database",
      serviceLabel: "Data store",
      technology: "PostgreSQL 16",
      exposure: "private",
      protocol: "TCP/TLS",
      authentication: "Password + TLS",
      authorization: "Database roles",
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "web-to-gateway",
    source: "web-application",
    target: "api-gateway",
    label: "HTTPS",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#8c8c86" },
  },
  {
    id: "gateway-to-api",
    source: "api-gateway",
    target: "rest-api",
    label: "HTTPS",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#8c8c86" },
  },
  {
    id: "api-to-database",
    source: "rest-api",
    target: "postgresql",
    label: "TCP/TLS",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#8c8c86" },
  },
];

const paletteSections: {
  label: string;
  services: { name: string; icon: PaletteIcon }[];
}[] = [
  {
    label: "Entry points",
    services: [
      { name: "Internet", icon: "internet" },
      { name: "Web application", icon: "web" },
    ],
  },
  {
    label: "Services",
    services: [
      { name: "API gateway", icon: "gateway" },
      { name: "REST API", icon: "api" },
      { name: "Auth service", icon: "auth" },
    ],
  },
  {
    label: "Data",
    services: [
      { name: "Database", icon: "database" },
      { name: "Object storage", icon: "storage" },
    ],
  },
];

function ServiceIcon({ type, size = 17 }: { type: PaletteIcon; size?: number }) {
  const iconProps = { size, weight: "bold" as const, "aria-hidden": true };

  switch (type) {
    case "internet":
      return <GlobeHemisphereWest {...iconProps} />;
    case "web":
      return <Browser {...iconProps} />;
    case "gateway":
      return <FlowArrow {...iconProps} />;
    case "api":
      return <BracketsCurly {...iconProps} />;
    case "auth":
      return <Key {...iconProps} />;
    case "database":
      return <Database {...iconProps} />;
    case "storage":
      return <Cloud {...iconProps} />;
  }
}

function ServiceNodeCard({ data, selected }: NodeProps<ArchitectureServiceNode>) {
  return (
    <div
      className={`relative border bg-white transition-colors ${
        selected
          ? "border-[#33332f] ring-1 ring-[#33332f]/10"
          : "border-[#d8d8d2] hover:border-[#adada6]"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className="!h-2 !w-2 !border-2 !border-white !bg-[#8b8b84]"
      />

      <div className="flex items-center gap-2.5 border-b border-[#ecece8] px-3 py-2.5">
        <span className="text-[#51514c]">
          <ServiceIcon type={data.serviceType} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold tracking-[-0.01em] text-[#242421]">
            {data.name}
          </p>
          <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.09em] text-[#878780]">
            {data.serviceLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 font-mono text-[9px] text-[#6d6d67]">
        <span>{data.protocol}</span>
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 ${
              data.exposure === "public" ? "bg-[#a55b3d]" : "bg-[#66806a]"
            }`}
          />
          {data.exposure}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        className="!h-2 !w-2 !border-2 !border-white !bg-[#8b8b84]"
      />
    </div>
  );
}

const nodeTypes: NodeTypes = { service: ServiceNodeCard };

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-[#e7e7e2] py-4">
      <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777770]">
        {title}
      </h3>
      <dl className="space-y-2.5">{children}</dl>
    </section>
  );
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-start gap-3 text-[11px] leading-4">
      <dt className="text-[#81817a]">{label}</dt>
      <dd className="break-words text-[#2e2e2a]">{value}</dd>
    </div>
  );
}

function formatExposure(exposure: Exposure) {
  return exposure.charAt(0).toUpperCase() + exposure.slice(1);
}

export function ArchitectureWorkspace() {
  const [nodes, , onNodesChange] =
    useNodesState<ArchitectureServiceNode>(initialNodes);
  const [selectedServiceId, setSelectedServiceId] = useState("api-gateway");

  const selectedService = useMemo(
    () => nodes.find((node) => node.id === selectedServiceId) ?? null,
    [nodes, selectedServiceId],
  );

  return (
    <main className="flex h-dvh min-w-[1100px] flex-col overflow-hidden bg-[#f5f5f2] text-[#242421]">
      <header className="flex h-12 shrink-0 items-center border-b border-[#dfdfda] bg-white px-3">
        <div className="flex w-[178px] items-center gap-2.5 border-r border-[#e7e7e2]">
          <span className="grid h-6 w-6 place-items-center bg-[#242421] text-white">
            <Graph size={15} weight="bold" aria-hidden="true" />
          </span>
          <span className="text-[13px] font-semibold tracking-[-0.02em]">
            AttackMap
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 px-4 text-[11px]">
          <span className="truncate text-[#73736d]">Projects</span>
          <span className="text-[#b5b5af]">/</span>
          <span className="truncate font-medium text-[#343431]">
            VaultShare Production
          </span>
        </div>

        <nav aria-label="Project sections" className="flex h-full items-center gap-5 px-3">
          <span className="flex h-full items-center border-b-2 border-[#292927] text-[11px] font-medium">
            Architecture
          </span>
          <span className="text-[11px] text-[#8a8a84]">Overview</span>
          <span className="text-[11px] text-[#8a8a84]">Findings</span>
        </nav>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[190px_minmax(0,1fr)_278px]">
        <aside
          aria-label="Component palette"
          className="min-h-0 overflow-y-auto border-r border-[#dfdfda] bg-[#fafaf8]"
        >
          <div className="border-b border-[#e7e7e2] px-3.5 py-3">
            <h2 className="text-[11px] font-semibold">Components</h2>
            <p className="mt-1 text-[9px] leading-3.5 text-[#85857e]">
              Service types for this architecture
            </p>
          </div>

          <div className="px-2 py-2.5">
            {paletteSections.map((section) => (
              <section key={section.label} className="mb-3.5 last:mb-0">
                <h3 className="px-1.5 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8b8b84]">
                  {section.label}
                </h3>
                <div className="space-y-0.5">
                  {section.services.map((service) => (
                    <div
                      key={service.name}
                      className="flex items-center gap-2.5 border border-transparent px-2 py-1.5 text-[10px] text-[#4f4f4a]"
                    >
                      <span className="text-[#666660]">
                        <ServiceIcon type={service.icon} size={15} />
                      </span>
                      <span>{service.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </aside>

        <section aria-label="Architecture canvas" className="flex min-w-0 flex-col bg-[#f8f8f5]">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#dfdfda] bg-white px-3.5">
            <div>
              <h1 className="text-[11px] font-semibold">Architecture</h1>
              <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#8b8b84]">
                Main environment
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-[9px] text-[#777770]">
              <span>4 services</span>
              <span className="h-3 w-px bg-[#deded8]" />
              <span>3 connections</span>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <ReactFlow<ArchitectureServiceNode, Edge>
              nodes={nodes}
              edges={initialEdges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onNodeClick={(_, node) => setSelectedServiceId(node.id)}
              onPaneClick={() => setSelectedServiceId("")}
              nodesConnectable={false}
              edgesFocusable={false}
              edgesReconnectable={false}
              deleteKeyCode={null}
              minZoom={0.4}
              maxZoom={1.5}
              fitView
              fitViewOptions={{ padding: 0.24, maxZoom: 1 }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={18}
                size={1}
                color="#d7d7d1"
              />
              <Controls position="bottom-left" showInteractive={false} />
            </ReactFlow>
          </div>
        </section>

        <aside
          aria-label="Service inspector"
          className="min-h-0 overflow-y-auto border-l border-[#dfdfda] bg-white"
        >
          <div className="flex h-11 items-center justify-between border-b border-[#e7e7e2] px-3.5">
            <h2 className="text-[11px] font-semibold">Service inspector</h2>
            <span className="border border-[#deded8] bg-[#f7f7f4] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#777770]">
              Mock data
            </span>
          </div>

          {selectedService ? (
            <div className="px-3.5">
              <div className="flex items-start gap-3 border-b border-[#e7e7e2] py-4">
                <span className="mt-0.5 text-[#4f4f4a]">
                  <ServiceIcon type={selectedService.data.serviceType} size={19} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold">
                    {selectedService.data.name}
                  </p>
                  <p className="mt-1 font-mono text-[8px] text-[#85857e]">
                    {selectedService.id}
                  </p>
                </div>
              </div>

              <PanelSection title="General">
                <InspectorRow
                  label="Service type"
                  value={selectedService.data.serviceLabel}
                />
                <InspectorRow
                  label="Technology"
                  value={selectedService.data.technology}
                />
              </PanelSection>

              <PanelSection title="Network">
                <InspectorRow
                  label="Exposure"
                  value={formatExposure(selectedService.data.exposure)}
                />
                <InspectorRow
                  label="Protocol"
                  value={selectedService.data.protocol}
                />
              </PanelSection>

              <PanelSection title="Security">
                <InspectorRow
                  label="Authentication"
                  value={selectedService.data.authentication}
                />
                <InspectorRow
                  label="Authorization"
                  value={selectedService.data.authorization}
                />
              </PanelSection>

              <div className="flex gap-2.5 py-4 text-[9px] leading-3.5 text-[#85857e]">
                <ShieldCheck
                  className="mt-0.5 shrink-0 text-[#666660]"
                  size={14}
                  weight="bold"
                  aria-hidden="true"
                />
                <p>Select any service to inspect its current configuration.</p>
              </div>
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-[11px] font-medium text-[#4e4e49]">
                No service selected
              </p>
              <p className="mt-1.5 text-[9px] leading-4 text-[#85857e]">
                Select a node on the canvas to inspect its configuration.
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
