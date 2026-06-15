'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGraphStore } from '@/store/graphStore';
import SkillNode from '@/components/SkillNode';

const nodeTypes = {
  custom: SkillNode,
};

function GraphInner() {
  const storeNodes = useGraphStore(state => state.nodes);
  const storeEdges = useGraphStore(state => state.edges);
  const selectedNodeId = useGraphStore(state => state.selectedNodeId);
  const setSelectedNode = useGraphStore(state => state.setSelectedNode);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  const { fitView } = useReactFlow();

  const activeNodeId = selectedNodeId || hoveredNodeId;

  const connectedNodeIds = new Set<string>();
  if (activeNodeId) {
    connectedNodeIds.add(activeNodeId);
    storeEdges.forEach(edge => {
      if (edge.source === activeNodeId) connectedNodeIds.add(edge.target);
      if (edge.target === activeNodeId) connectedNodeIds.add(edge.source);
    });
  }

  const displayNodes = storeNodes.map(node => {
    const isFocused = !activeNodeId || connectedNodeIds.has(node.id);
    return {
      ...node,
      style: {
        ...node.style,
        opacity: isFocused ? 1 : 0.4,
        transition: 'opacity 0.2s ease'
      }
    };
  });

  const displayEdges = storeEdges.map(edge => {
    const isFocused = !activeNodeId || (connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target));
    return {
      ...edge,
      style: {
        ...edge.style,
        strokeWidth: isFocused ? 2 : 1,
        opacity: isFocused ? 1 : 0.15,
        transition: 'opacity 0.2s ease, stroke-width 0.2s ease'
      },
      animated: isFocused && edge.animated,
      zIndex: isFocused ? 10 : 0
    };
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(displayNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(displayEdges);

  useEffect(() => {
    setNodes(displayNodes);
    setEdges(displayEdges);
  }, [storeNodes, storeEdges, selectedNodeId, setNodes, setEdges]);

  // Force fitView when new data arrives
  useEffect(() => {
    if (storeNodes.length > 0 && !selectedNodeId) {
      setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
    }
  }, [storeNodes.length, fitView, selectedNodeId]);

  // Center on selected node
  const { setCenter } = useReactFlow();
  useEffect(() => {
    if (selectedNodeId) {
      const node = storeNodes.find(n => n.id === selectedNodeId);
      if (node) {
        const width = node.data.isAsset ? 180 : 280;
        const height = node.data.isAsset ? 60 : 120;
        const x = node.position.x + width / 2;
        const y = node.position.y + height / 2;
        setCenter(x, y, { zoom: 1, duration: 800 });
      }
    }
  }, [selectedNodeId, storeNodes, setCenter]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds: any) => addEdge(params as any, eds) as any),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
      onNodeMouseLeave={() => setHoveredNodeId(null)}
      onPaneClick={() => setSelectedNode(null)}
      defaultEdgeOptions={{
        type: 'smoothstep',
        style: { strokeWidth: 2, stroke: '#8b949e' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8b949e' }
      }}
      fitView
    >
      <Background color="#30363d" gap={20} size={1} />
      <Controls style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }} />
      <MiniMap 
        nodeColor={(node: Node) => {
          if (node.data?.isAsset) return '#30363d';
          if ((node.data?.issues as any[])?.includes('cycle')) return '#f85149';
          if ((node.data?.issues as any[])?.includes('error')) return '#da3633';
          if ((node.data?.issues as any[])?.includes('orphan')) return '#d29922';
          return '#58a6ff';
        }}
        maskColor="rgba(13, 17, 23, 0.7)"
        style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}
      />
    </ReactFlow>
  );
}

export default function SkillGraph() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--background)' }}>
      <ReactFlowProvider>
        <GraphInner />
      </ReactFlowProvider>
    </div>
  );
}
