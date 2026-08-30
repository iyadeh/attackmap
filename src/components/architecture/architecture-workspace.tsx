"use client";

import { useMemo, useRef, useState } from "react";
import { useNodesState } from "@xyflow/react";
import { Graph } from "@phosphor-icons/react";
import {
  createService,
  type CreatableServiceType,
} from "@/lib/architecture/service-factory";
import type { ServiceNode } from "@/types/architecture";
import { ArchitectureCanvas } from "./architecture-canvas";
import { ComponentPalette } from "./component-palette";
import {
  initialEdges,
  initialNodes,
  initialServices,
} from "./mock-architecture";
import {
  ServiceInspector,
  type ServiceChangeHandler,
} from "./service-inspector";
import type { ArchitectureNode } from "./service-node";

function getNewNodePosition(index: number) {
  const column = index % 4;
  const row = Math.floor(index / 4);

  return {
    x: column * 290,
    y: 330 + row * 150,
  };
}

export function ArchitectureWorkspace() {
  const [services, setServices] = useState<ServiceNode[]>(initialServices);
  const [nodes, setNodes, onNodesChange] =
    useNodesState<ArchitectureNode>(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    "api-gateway",
  );
  const nextServiceSequence = useRef(initialServices.length + 1);
  const nextPlacementIndex = useRef(0);

  const servicesById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  );
  const selectedService = selectedServiceId
    ? (servicesById.get(selectedServiceId) ?? null)
    : null;

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
    setServices((currentServices) =>
      currentServices.filter((service) => service.id !== serviceId),
    );
    setNodes((currentNodes) =>
      currentNodes.filter((node) => node.id !== serviceId),
    );
    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) => edge.source !== serviceId && edge.target !== serviceId,
      ),
    );
    setSelectedServiceId((currentSelection) =>
      currentSelection === serviceId ? null : currentSelection,
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

        <nav
          aria-label="Project sections"
          className="flex h-full items-center gap-5 px-3"
        >
          <span className="flex h-full items-center border-b-2 border-[#292927] text-[11px] font-medium">
            Architecture
          </span>
          <span className="text-[11px] text-[#8a8a84]">Overview</span>
          <span className="text-[11px] text-[#8a8a84]">Findings</span>
        </nav>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[190px_minmax(0,1fr)_278px]">
        <ComponentPalette onCreateService={addService} />
        <ArchitectureCanvas
          servicesById={servicesById}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onSelectService={setSelectedServiceId}
          onClearSelection={() => setSelectedServiceId(null)}
        />
        <ServiceInspector
          key={selectedService?.id ?? "no-selection"}
          service={selectedService}
          onChange={updateSelectedService}
          onDelete={deleteService}
        />
      </div>
    </main>
  );
}
