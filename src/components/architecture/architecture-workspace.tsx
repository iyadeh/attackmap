"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
import type {
  AuthenticationMethod,
  AuthorizationModel,
  DataClassification,
  ServiceExposure,
  ServiceNode,
  ServiceType,
} from "@/types/architecture";

type ArchitectureNodeData = { serviceId: string };
type ArchitectureNode = Node<ArchitectureNodeData, "service">;
type ServiceIconType = ServiceType | "internet";
type EditableServiceField = Exclude<keyof ServiceNode, "id">;

const serviceTypeLabels: Record<ServiceType, string> = {
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

const serviceTypeOptions = Object.entries(serviceTypeLabels) as [
  ServiceType,
  string,
][];

const exposureLabels: Record<ServiceExposure, string> = {
  public: "Public",
  private: "Private",
  internal: "Internal",
};

const exposureOptions = Object.entries(exposureLabels) as [
  ServiceExposure,
  string,
][];

const authenticationLabels: Record<AuthenticationMethod, string> = {
  none: "None",
  session: "Session",
  jwt: "JWT",
  oauth2: "OAuth 2.0",
  oidc: "OIDC",
  api_key: "API key",
  mtls: "mTLS",
};

const authenticationOptions = Object.entries(authenticationLabels) as [
  AuthenticationMethod,
  string,
][];

const authorizationLabels: Record<AuthorizationModel, string> = {
  none: "None",
  rbac: "RBAC",
  abac: "ABAC",
  acl: "ACL",
  policy: "Policy based",
};

const authorizationOptions = Object.entries(authorizationLabels) as [
  AuthorizationModel,
  string,
][];

const dataClassificationLabels: Record<DataClassification, string> = {
  public: "Public",
  internal: "Internal",
  confidential: "Confidential",
  restricted: "Restricted",
};

const dataClassificationOptions = Object.entries(dataClassificationLabels) as [
  DataClassification,
  string,
][];

const protocolLabels = {
  https: "HTTPS",
  tcp_tls: "TCP/TLS",
} as const;

const initialServices: ServiceNode[] = [
  {
    id: "web-application",
    name: "Web Application",
    type: "web",
    technology: "Next.js",
    exposure: "public",
    protocol: "https",
    authentication: "session",
    authorization: "policy",
    encryptionInTransit: true,
    rateLimiting: true,
    sensitiveData: false,
    dataClassification: "public",
  },
  {
    id: "api-gateway",
    name: "API Gateway",
    type: "gateway",
    technology: "Kong",
    exposure: "public",
    protocol: "https",
    authentication: "none",
    authorization: "none",
    encryptionInTransit: true,
    rateLimiting: false,
    sensitiveData: false,
    dataClassification: "internal",
  },
  {
    id: "rest-api",
    name: "REST API",
    type: "api",
    technology: "Go",
    exposure: "internal",
    protocol: "https",
    authentication: "jwt",
    authorization: "rbac",
    encryptionInTransit: true,
    rateLimiting: true,
    sensitiveData: true,
    dataClassification: "confidential",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    type: "database",
    technology: "PostgreSQL 16",
    exposure: "private",
    protocol: "tcp_tls",
    authentication: "mtls",
    authorization: "acl",
    encryptionInTransit: true,
    rateLimiting: false,
    sensitiveData: true,
    dataClassification: "restricted",
  },
];

const initialNodes: ArchitectureNode[] = [
  {
    id: "web-application",
    type: "service",
    position: { x: 0, y: 150 },
    data: { serviceId: "web-application" },
  },
  {
    id: "api-gateway",
    type: "service",
    position: { x: 290, y: 150 },
    selected: true,
    data: { serviceId: "api-gateway" },
  },
  {
    id: "rest-api",
    type: "service",
    position: { x: 580, y: 150 },
    data: { serviceId: "rest-api" },
  },
  {
    id: "postgresql",
    type: "service",
    position: { x: 870, y: 150 },
    data: { serviceId: "postgresql" },
  },
];

const initialEdges: Edge[] = [
  {
    id: "web-to-gateway",
    source: "web-application",
    target: "api-gateway",
    label: "HTTPS",
    labelBgPadding: [5, 2],
    labelBgBorderRadius: 0,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#82827b" },
  },
  {
    id: "gateway-to-api",
    source: "api-gateway",
    target: "rest-api",
    label: "HTTPS",
    labelBgPadding: [5, 2],
    labelBgBorderRadius: 0,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#82827b" },
  },
  {
    id: "api-to-database",
    source: "rest-api",
    target: "postgresql",
    label: "TCP/TLS",
    labelBgPadding: [5, 2],
    labelBgBorderRadius: 0,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#82827b" },
  },
];

const paletteSections: {
  label: string;
  services: { name: string; icon: ServiceIconType }[];
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

const ServiceModelContext = createContext<ReadonlyMap<string, ServiceNode>>(
  new Map(),
);

const fieldControlClassName =
  "h-7 w-full rounded-[3px] border border-[#d5d5cf] bg-[#fbfbf9] px-2 text-[10px] text-[#2e2e2a] outline-none transition-colors hover:border-[#bcbcb5] focus:border-[#6d6d67] focus:bg-white focus:ring-1 focus:ring-[#6d6d67]/10";

function ServiceIcon({ type, size = 17 }: { type: ServiceIconType; size?: number }) {
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

function ServiceNodeCard({ data, selected }: NodeProps<ArchitectureNode>) {
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
        isConnectable={false}
        className="!h-2 !w-2 !border-2 !border-white !bg-[#85857e]"
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
        isConnectable={false}
        className="!h-2 !w-2 !border-2 !border-white !bg-[#85857e]"
      />
    </div>
  );
}

const nodeTypes: NodeTypes = { service: ServiceNodeCard };

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-[#e7e7e2] py-3.5">
      <h3 className="mb-3 text-[9px] font-semibold uppercase tracking-[0.11em] text-[#777770]">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function InspectorField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-[9px] font-medium text-[#74746d]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function InspectorToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-6 cursor-pointer items-center justify-between gap-3 text-[10px] text-[#3f3f3a]">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 shrink-0 accent-[#33332f]"
      />
    </label>
  );
}

export function ArchitectureWorkspace() {
  const [services, setServices] = useState<ServiceNode[]>(initialServices);
  const [nodes, , onNodesChange] = useNodesState<ArchitectureNode>(initialNodes);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    "api-gateway",
  );

  const servicesById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  );
  const selectedService = selectedServiceId
    ? (servicesById.get(selectedServiceId) ?? null)
    : null;

  function updateSelectedService<Field extends EditableServiceField>(
    field: Field,
    value: ServiceNode[Field],
  ) {
    if (!selectedServiceId) {
      return;
    }

    setServices((currentServices) =>
      currentServices.map((service) =>
        service.id === selectedServiceId
          ? { ...service, [field]: value }
          : service,
      ),
    );
  }

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
              <span>{services.length} services</span>
              <span className="h-3 w-px bg-[#deded8]" />
              <span>{initialEdges.length} connections</span>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <ServiceModelContext.Provider value={servicesById}>
              <ReactFlow<ArchitectureNode, Edge>
                nodes={nodes}
                edges={initialEdges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onNodeClick={(_, node) => setSelectedServiceId(node.id)}
                onPaneClick={() => setSelectedServiceId(null)}
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
            </ServiceModelContext.Provider>
          </div>
        </section>

        <aside
          aria-label="Service inspector"
          className="min-h-0 overflow-y-auto border-l border-[#dfdfda] bg-white"
        >
          <div className="flex h-11 items-center justify-between border-b border-[#e7e7e2] px-3.5">
            <h2 className="text-[11px] font-semibold">Service inspector</h2>
            <span className="border border-[#deded8] bg-[#f7f7f4] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#777770]">
              In memory
            </span>
          </div>

          {selectedService ? (
            <form
              className="px-3.5"
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="flex items-start gap-3 border-b border-[#e7e7e2] py-3.5">
                <span className="mt-0.5 text-[#4f4f4a]">
                  <ServiceIcon type={selectedService.type} size={19} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold">
                    {selectedService.name || "Unnamed service"}
                  </p>
                  <p className="mt-1 font-mono text-[8px] text-[#85857e]">
                    {selectedService.id}
                  </p>
                </div>
              </div>

              <PanelSection title="General">
                <InspectorField label="Name" htmlFor="service-name">
                  <input
                    id="service-name"
                    type="text"
                    value={selectedService.name}
                    onChange={(event) =>
                      updateSelectedService("name", event.target.value)
                    }
                    autoComplete="off"
                    className={fieldControlClassName}
                  />
                </InspectorField>
                <InspectorField label="Service type" htmlFor="service-type">
                  <select
                    id="service-type"
                    value={selectedService.type}
                    onChange={(event) =>
                      updateSelectedService(
                        "type",
                        event.target.value as ServiceType,
                      )
                    }
                    className={fieldControlClassName}
                  >
                    {serviceTypeOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </InspectorField>
                <InspectorField label="Technology" htmlFor="service-technology">
                  <input
                    id="service-technology"
                    type="text"
                    value={selectedService.technology}
                    onChange={(event) =>
                      updateSelectedService("technology", event.target.value)
                    }
                    autoComplete="off"
                    spellCheck={false}
                    className={fieldControlClassName}
                  />
                </InspectorField>
              </PanelSection>

              <PanelSection title="Network">
                <InspectorField label="Exposure" htmlFor="service-exposure">
                  <select
                    id="service-exposure"
                    value={selectedService.exposure}
                    onChange={(event) =>
                      updateSelectedService(
                        "exposure",
                        event.target.value as ServiceExposure,
                      )
                    }
                    className={fieldControlClassName}
                  >
                    {exposureOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </InspectorField>
              </PanelSection>

              <PanelSection title="Security">
                <InspectorField
                  label="Authentication"
                  htmlFor="service-authentication"
                >
                  <select
                    id="service-authentication"
                    value={selectedService.authentication}
                    onChange={(event) =>
                      updateSelectedService(
                        "authentication",
                        event.target.value as AuthenticationMethod,
                      )
                    }
                    className={fieldControlClassName}
                  >
                    {authenticationOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </InspectorField>
                <InspectorField
                  label="Authorization"
                  htmlFor="service-authorization"
                >
                  <select
                    id="service-authorization"
                    value={selectedService.authorization}
                    onChange={(event) =>
                      updateSelectedService(
                        "authorization",
                        event.target.value as AuthorizationModel,
                      )
                    }
                    className={fieldControlClassName}
                  >
                    {authorizationOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </InspectorField>
                <div className="border-t border-[#eeeeea] pt-2">
                  <InspectorToggle
                    label="Encryption in transit"
                    checked={selectedService.encryptionInTransit}
                    onChange={(checked) =>
                      updateSelectedService("encryptionInTransit", checked)
                    }
                  />
                  <InspectorToggle
                    label="Rate limiting"
                    checked={selectedService.rateLimiting}
                    onChange={(checked) =>
                      updateSelectedService("rateLimiting", checked)
                    }
                  />
                </div>
              </PanelSection>

              <PanelSection title="Data">
                <InspectorToggle
                  label="Handles sensitive data"
                  checked={selectedService.sensitiveData}
                  onChange={(checked) =>
                    updateSelectedService("sensitiveData", checked)
                  }
                />
                <InspectorField
                  label="Data classification"
                  htmlFor="service-data-classification"
                >
                  <select
                    id="service-data-classification"
                    value={selectedService.dataClassification}
                    onChange={(event) =>
                      updateSelectedService(
                        "dataClassification",
                        event.target.value as DataClassification,
                      )
                    }
                    className={fieldControlClassName}
                  >
                    {dataClassificationOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </InspectorField>
              </PanelSection>

              <div className="flex gap-2.5 py-3.5 text-[9px] leading-3.5 text-[#85857e]">
                <ShieldCheck
                  className="mt-0.5 shrink-0 text-[#666660]"
                  size={14}
                  weight="bold"
                  aria-hidden="true"
                />
                <p>Changes apply immediately to this in-memory architecture.</p>
              </div>
            </form>
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
