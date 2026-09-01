import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type OnNodesChange,
} from "@xyflow/react";
import { getConnectionLabel } from "@/lib/architecture/connection-factory";
import type { ServiceConnection, ServiceNode } from "@/types/architecture";
import {
  ServiceModelContext,
  serviceNodeTypes,
  type ArchitectureNode,
} from "./service-node";

type ArchitectureCanvasProps = {
  servicesById: ReadonlyMap<string, ServiceNode>;
  nodes: ArchitectureNode[];
  connections: ServiceConnection[];
  selectedConnectionId: string | null;
  onNodesChange: OnNodesChange<ArchitectureNode>;
  onSelectService: (serviceId: string) => void;
  onSelectConnection: (connectionId: string) => void;
  onCreateConnection: (source: string, target: string) => void;
  onClearSelection: () => void;
};

export function ArchitectureCanvas({
  servicesById,
  nodes,
  connections,
  selectedConnectionId,
  onNodesChange,
  onSelectService,
  onSelectConnection,
  onCreateConnection,
  onClearSelection,
}: ArchitectureCanvasProps) {
  const edges = useMemo<Edge[]>(
    () =>
      connections.map((connection) => ({
        id: connection.id,
        source: connection.source,
        target: connection.target,
        label: getConnectionLabel(connection),
        labelBgPadding: [5, 2],
        labelBgBorderRadius: 0,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#82827b" },
        selected: connection.id === selectedConnectionId,
      })),
    [connections, selectedConnectionId],
  );

  return (
    <section
      aria-label="Architecture canvas"
      className="flex min-w-0 flex-col bg-[#f8f8f5]"
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#dfdfda] bg-white px-3.5">
        <div>
          <h1 className="text-[11px] font-semibold">Architecture</h1>
          <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#8b8b84]">
            Main environment
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-[9px] text-[#777770]">
          <span>{servicesById.size} services</span>
          <span className="h-3 w-px bg-[#deded8]" />
          <span>{connections.length} connections</span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {nodes.length === 0 ? (
          <div
            role="status"
            className="pointer-events-none absolute left-4 top-4 z-10 max-w-56 border-l border-[#cfcfc9] pl-3"
          >
            <p className="text-[11px] font-medium text-[#4e4e49]">
              Empty architecture
            </p>
            <p className="mt-1 text-[9px] leading-4 text-[#85857e]">
              Add a service from Components to begin modeling.
            </p>
          </div>
        ) : null}
        <ServiceModelContext.Provider value={servicesById}>
          <ReactFlow<ArchitectureNode, Edge>
            nodes={nodes}
            edges={edges}
            nodeTypes={serviceNodeTypes}
            onNodesChange={onNodesChange}
            onNodeClick={(_, node) => onSelectService(node.id)}
            onEdgeClick={(_, edge) => onSelectConnection(edge.id)}
            onConnect={(connection) => {
              if (connection.source && connection.target) {
                onCreateConnection(connection.source, connection.target);
              }
            }}
            isValidConnection={(connection) =>
              connection.source !== connection.target &&
              servicesById.has(connection.source) &&
              servicesById.has(connection.target) &&
              !connections.some(
                (existingConnection) =>
                  existingConnection.source === connection.source &&
                  existingConnection.target === connection.target,
              )
            }
            onPaneClick={onClearSelection}
            nodesConnectable
            edgesFocusable={false}
            edgesReconnectable={false}
            deleteKeyCode={null}
            connectionLineStyle={{ stroke: "#888881", strokeWidth: 1.4 }}
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
  );
}
