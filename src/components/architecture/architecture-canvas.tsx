import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type OnNodesChange,
} from "@xyflow/react";
import type { ServiceNode } from "@/types/architecture";
import {
  ServiceModelContext,
  serviceNodeTypes,
  type ArchitectureNode,
} from "./service-node";

type ArchitectureCanvasProps = {
  servicesById: ReadonlyMap<string, ServiceNode>;
  nodes: ArchitectureNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<ArchitectureNode>;
  onSelectService: (serviceId: string) => void;
  onClearSelection: () => void;
};

export function ArchitectureCanvas({
  servicesById,
  nodes,
  edges,
  onNodesChange,
  onSelectService,
  onClearSelection,
}: ArchitectureCanvasProps) {
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
          <span>{edges.length} connections</span>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ServiceModelContext.Provider value={servicesById}>
          <ReactFlow<ArchitectureNode, Edge>
            nodes={nodes}
            edges={edges}
            nodeTypes={serviceNodeTypes}
            onNodesChange={onNodesChange}
            onNodeClick={(_, node) => onSelectService(node.id)}
            onPaneClick={onClearSelection}
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
  );
}
