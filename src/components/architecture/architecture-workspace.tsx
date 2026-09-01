"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useNodesState } from "@xyflow/react";
import { Graph } from "@phosphor-icons/react";
import {
  acceptFindingRiskAction,
  loadArchitectureAction,
  reopenFindingAction,
} from "@/app/actions";
import {
  canCreateServiceConnection,
  createServiceConnection,
  getEncryptionAfterProtocolChange,
} from "@/lib/architecture/connection-factory";
import {
  createService,
  type CreatableServiceType,
} from "@/lib/architecture/service-factory";
import { triageActiveFindings } from "@/lib/findings/finding-dispositions";
import { deriveProjectSecurityOverview } from "@/lib/overview/project-security-overview";
import { analyzeArchitecture } from "@/lib/risk-engine/engine";
import { calculateSecurityScore } from "@/lib/risk-engine/scoring";
import type {
  ArchitectureSnapshot,
  ConnectionProtocol,
  Project,
  ProjectArchitecture,
  ServiceNode,
  ServicePosition,
} from "@/types/architecture";
import type { FindingDisposition } from "@/types/security";
import { FindingsView } from "../findings/findings-view";
import { SecurityScoreStatus } from "../findings/security-score-status";
import { ProjectSecurityOverview } from "../overview/project-security-overview";
import { CurrentProjectControls } from "../projects/current-project-controls";
import { ArchitectureCanvas } from "./architecture-canvas";
import { ComponentPalette } from "./component-palette";
import { ConnectionInspector } from "./connection-inspector";
import {
  PersistenceControls,
  type PersistenceStatus,
} from "./persistence-controls";
import {
  ServiceInspector,
  type ServiceChangeHandler,
} from "./service-inspector";
import type { ArchitectureNode } from "./service-node";
import { useArchitectureAutosave } from "./use-architecture-autosave";

function getNewNodePosition(index: number) {
  const column = index % 4;
  const row = Math.floor(index / 4);

  return {
    x: column * 290,
    y: 330 + row * 150,
  };
}

function createArchitectureNodes(
  servicePositions: ServicePosition[],
): ArchitectureNode[] {
  return servicePositions.map((position) => ({
    id: position.serviceId,
    type: "service",
    position: { x: position.x, y: position.y },
    data: { serviceId: position.serviceId },
  }));
}

function getLoadedArchitectureSnapshot(
  architecture: ProjectArchitecture,
): ArchitectureSnapshot {
  return {
    services: architecture.services,
    servicePositions: architecture.servicePositions,
    connections: architecture.connections,
  };
}

type ArchitectureWorkspaceProps = {
  initialArchitecture: ProjectArchitecture;
  initialFindingDispositions: FindingDisposition[];
};

export function ArchitectureWorkspace({
  initialArchitecture,
  initialFindingDispositions,
}: ArchitectureWorkspaceProps) {
  const initialSnapshot = useMemo(
    () => getLoadedArchitectureSnapshot(initialArchitecture),
    [initialArchitecture],
  );
  const [project, setProject] = useState<Project>(initialArchitecture.project);
  const [activeView, setActiveView] = useState<
    "architecture" | "overview" | "findings"
  >("architecture");
  const [services, setServices] = useState<ServiceNode[]>(
    initialArchitecture.services,
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<ArchitectureNode>(
    createArchitectureNodes(initialArchitecture.servicePositions),
  );
  const [connections, setConnections] = useState(initialArchitecture.connections);
  const [findingDispositions, setFindingDispositions] = useState(
    initialFindingDispositions,
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  const [pendingPersistenceAction, setPendingPersistenceAction] = useState<
    "save" | "load" | null
  >(null);
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus | null>(null);
  const [, startPersistenceTransition] = useTransition();
  const nextServiceSequence = useRef(services.length + 1);
  const nextConnectionSequence = useRef(connections.length + 1);
  const nextPlacementIndex = useRef(initialArchitecture.services.length);

  const servicesById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  );
  const architectureSnapshot = useMemo<ArchitectureSnapshot>(
    () => ({
      services,
      servicePositions: nodes.flatMap((node) =>
        servicesById.has(node.id)
          ? [
              {
                serviceId: node.id,
                x: node.position.x,
                y: node.position.y,
              },
            ]
          : [],
      ),
      connections,
    }),
    [connections, nodes, services, servicesById],
  );
  const {
    status: autosaveStatus,
    saveNow: saveArchitectureNow,
    pause: pauseAutosave,
    reset: resetAutosave,
    resume: resumeAutosave,
  } = useArchitectureAutosave(
    project.id,
    initialSnapshot,
    architectureSnapshot,
  );
  const selectedService = selectedServiceId
    ? (servicesById.get(selectedServiceId) ?? null)
    : null;
  const selectedConnection = selectedConnectionId
    ? (connections.find(
        (connection) => connection.id === selectedConnectionId,
      ) ?? null)
    : null;
  const serviceIds = useMemo(
    () => new Set(servicesById.keys()),
    [servicesById],
  );
  const findings = useMemo(
    () => analyzeArchitecture(services, connections),
    [connections, services],
  );
  const securityScore = useMemo(
    () => calculateSecurityScore(findings),
    [findings],
  );
  const triagedFindings = useMemo(
    () => triageActiveFindings(findings, findingDispositions),
    [findingDispositions, findings],
  );
  const overviewSummary = useMemo(
    () =>
      deriveProjectSecurityOverview(
        services,
        connections,
        triagedFindings,
        securityScore,
      ),
    [connections, securityScore, services, triagedFindings],
  );

  const updateSelectedService: ServiceChangeHandler = (field, value) => {
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
  };

  function addService(type: CreatableServiceType) {
    let sequence = nextServiceSequence.current;
    let service = createService(type, sequence);

    while (servicesById.has(service.id)) {
      sequence += 1;
      service = createService(type, sequence);
    }

    const node: ArchitectureNode = {
      id: service.id,
      type: "service",
      position: getNewNodePosition(nextPlacementIndex.current),
      selected: true,
      data: { serviceId: service.id },
    };

    nextServiceSequence.current = sequence + 1;
    nextPlacementIndex.current += 1;

    setServices((currentServices) => [...currentServices, service]);
    setNodes((currentNodes) => [
      ...currentNodes.map((currentNode) => ({
        ...currentNode,
        selected: false,
      })),
      node,
    ]);
    setSelectedServiceId(service.id);
  }

  function deleteService(serviceId: string) {
    const selectedConnectionIsIncident = connections.some(
      (connection) =>
        connection.id === selectedConnectionId &&
        (connection.source === serviceId || connection.target === serviceId),
    );

    setServices((currentServices) =>
      currentServices.filter((service) => service.id !== serviceId),
    );
    setNodes((currentNodes) =>
      currentNodes.filter((node) => node.id !== serviceId),
    );
    setConnections((currentConnections) =>
      currentConnections.filter(
        (connection) =>
          connection.source !== serviceId && connection.target !== serviceId,
      ),
    );
    setSelectedServiceId((currentSelection) =>
      currentSelection === serviceId ? null : currentSelection,
    );
    if (selectedConnectionIsIncident) {
      setSelectedConnectionId(null);
    }
  }

  function addConnection(source: string, target: string) {
    if (
      !canCreateServiceConnection(
        source,
        target,
        serviceIds,
        connections,
      )
    ) {
      return;
    }

    let sequence = nextConnectionSequence.current;
    let connection = createServiceConnection(source, target, sequence);

    while (
      connections.some(
        (existingConnection) => existingConnection.id === connection.id,
      )
    ) {
      sequence += 1;
      connection = createServiceConnection(source, target, sequence);
    }

    nextConnectionSequence.current = sequence + 1;
    setConnections((currentConnections) => [
      ...currentConnections,
      connection,
    ]);
  }

  function deleteConnection(connectionId: string) {
    setConnections((currentConnections) =>
      currentConnections.filter(
        (connection) => connection.id !== connectionId,
      ),
    );
    setSelectedConnectionId((currentSelection) =>
      currentSelection === connectionId ? null : currentSelection,
    );
  }

  function updateSelectedConnectionProtocol(protocol: ConnectionProtocol) {
    if (!selectedConnectionId) {
      return;
    }

    setConnections((currentConnections) =>
      currentConnections.map((connection) =>
        connection.id === selectedConnectionId
          ? {
              ...connection,
              protocol,
              encrypted: getEncryptionAfterProtocolChange(
                protocol,
                connection.encrypted,
              ),
            }
          : connection,
      ),
    );
  }

  function updateSelectedConnectionEncryption(encrypted: boolean) {
    if (!selectedConnectionId) {
      return;
    }

    setConnections((currentConnections) =>
      currentConnections.map((connection) =>
        connection.id === selectedConnectionId
          ? { ...connection, encrypted }
          : connection,
      ),
    );
  }

  function selectService(serviceId: string) {
    setSelectedServiceId(serviceId);
    setSelectedConnectionId(null);
  }

  function selectConnection(connectionId: string) {
    setSelectedConnectionId(connectionId);
    setSelectedServiceId(null);
  }

  function clearSelection() {
    setSelectedServiceId(null);
    setSelectedConnectionId(null);
  }

  async function acceptFindingRisk(findingId: string, rationale: string) {
    const result = await acceptFindingRiskAction(
      project.id,
      findingId,
      rationale,
    );

    if (result.ok) {
      setFindingDispositions((currentDispositions) => [
        ...currentDispositions.filter(
          (disposition) => disposition.findingId !== findingId,
        ),
        result.disposition,
      ]);
    }

    return result;
  }

  async function reopenFindingRisk(findingId: string) {
    const result = await reopenFindingAction(project.id, findingId);

    if (result.ok) {
      setFindingDispositions((currentDispositions) =>
        currentDispositions.filter(
          (disposition) => disposition.findingId !== findingId,
        ),
      );
    }

    return result;
  }

  function saveArchitecture() {
    setPersistenceStatus(null);
    setPendingPersistenceAction("save");
    startPersistenceTransition(async () => {
      try {
        const saved = await saveArchitectureNow(architectureSnapshot);

        setPersistenceStatus(
          saved
            ? { kind: "success", message: "Saved." }
            : {
                kind: "error",
                message: "Save failed. Current work kept.",
              },
        );
      } catch {
        setPersistenceStatus({
          kind: "error",
          message: "Save failed. Current work kept.",
        });
      } finally {
        setPendingPersistenceAction(null);
      }
    });
  }

  function loadArchitecture() {
    setPersistenceStatus(null);
    setPendingPersistenceAction("load");
    startPersistenceTransition(async () => {
      try {
        await pauseAutosave();
        const result = await loadArchitectureAction(project.id);

        if (!result.ok) {
          resumeAutosave();
          setPersistenceStatus({
            kind: "error",
            message: "Load failed. Current work kept.",
          });
          return;
        }

        if (!result.architecture) {
          resumeAutosave();
          setPersistenceStatus({
            kind: "neutral",
            message: "Project no longer exists. Current work kept.",
          });
          return;
        }

        resetAutosave(getLoadedArchitectureSnapshot(result.architecture));
        setProject(result.architecture.project);
        setServices(result.architecture.services);
        setNodes(
          createArchitectureNodes(result.architecture.servicePositions),
        );
        setConnections(result.architecture.connections);
        setSelectedServiceId(null);
        setSelectedConnectionId(null);
        nextPlacementIndex.current = result.architecture.services.length;
        setPersistenceStatus({ kind: "success", message: "Loaded." });
      } catch {
        resumeAutosave();
        setPersistenceStatus({
          kind: "error",
          message: "Load failed. Current work kept.",
        });
      } finally {
        setPendingPersistenceAction(null);
      }
    });
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
          <Link href="/projects" className="truncate text-[#73736d] hover:text-[#343431]">
            Projects
          </Link>
          <span className="text-[#b5b5af]">/</span>
          <span
            title={project.name}
            className="truncate font-medium text-[#343431]"
          >
            {project.name}
          </span>
          <CurrentProjectControls project={project} onRenamed={setProject} />
        </div>

        <PersistenceControls
          pendingAction={pendingPersistenceAction}
          status={persistenceStatus}
          saveStatus={autosaveStatus}
          onSave={saveArchitecture}
          onLoad={loadArchitecture}
        />

        <SecurityScoreStatus result={securityScore} />

        <nav
          aria-label="Project sections"
          className="flex h-full items-center gap-5 px-3"
        >
          <button
            type="button"
            onClick={() => setActiveView("architecture")}
            aria-current={activeView === "architecture" ? "page" : undefined}
            className={`flex h-full items-center border-b-2 text-[11px] ${
              activeView === "architecture"
                ? "border-[#292927] font-medium text-[#292927]"
                : "border-transparent text-[#8a8a84] hover:text-[#555550]"
            }`}
          >
            Architecture
          </button>
          <button
            type="button"
            onClick={() => setActiveView("overview")}
            aria-current={activeView === "overview" ? "page" : undefined}
            className={`flex h-full items-center border-b-2 text-[11px] ${
              activeView === "overview"
                ? "border-[#292927] font-medium text-[#292927]"
                : "border-transparent text-[#8a8a84] hover:text-[#555550]"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveView("findings")}
            aria-current={activeView === "findings" ? "page" : undefined}
            className={`flex h-full items-center border-b-2 text-[11px] ${
              activeView === "findings"
                ? "border-[#292927] font-medium text-[#292927]"
                : "border-transparent text-[#8a8a84] hover:text-[#555550]"
            }`}
          >
            Findings
          </button>
        </nav>
      </header>

      <div
        className={`min-h-0 flex-1 grid-cols-[190px_minmax(0,1fr)_278px] ${
          activeView === "architecture" ? "grid" : "hidden"
        }`}
      >
        <ComponentPalette onCreateService={addService} />
        <ArchitectureCanvas
          servicesById={servicesById}
          nodes={nodes}
          connections={connections}
          selectedConnectionId={selectedConnectionId}
          onNodesChange={onNodesChange}
          onSelectService={selectService}
          onSelectConnection={selectConnection}
          onCreateConnection={addConnection}
          onClearSelection={clearSelection}
        />
        {selectedConnection ? (
          <ConnectionInspector
            key={selectedConnection.id}
            connection={selectedConnection}
            sourceName={
              servicesById.get(selectedConnection.source)?.name ??
              "Missing service"
            }
            targetName={
              servicesById.get(selectedConnection.target)?.name ??
              "Missing service"
            }
            onProtocolChange={updateSelectedConnectionProtocol}
            onEncryptedChange={updateSelectedConnectionEncryption}
            onDelete={deleteConnection}
          />
        ) : (
          <ServiceInspector
            key={selectedService?.id ?? "no-selection"}
            service={selectedService}
            onChange={updateSelectedService}
            onDelete={deleteService}
          />
        )}
      </div>

      {activeView === "overview" ? (
        <ProjectSecurityOverview
          summary={overviewSummary}
          services={services}
          connections={connections}
        />
      ) : null}

      {activeView === "findings" ? (
        <FindingsView
          triagedFindings={triagedFindings}
          services={services}
          connections={connections}
          securityScore={securityScore}
          onAcceptRisk={acceptFindingRisk}
          onReopen={reopenFindingRisk}
        />
      ) : null}
    </main>
  );
}
