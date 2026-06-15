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
  useReactFlow,
  Panel
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
  const showOrphansOnly = useGraphStore(state => state.showOrphansOnly);
  const setSelectedNode = useGraphStore(state => state.setSelectedNode);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  const { fitView } = useReactFlow();

  const activeNodeId = selectedNodeId || hoveredNodeId;

  const incomingIds = new Set<string>();
  const outgoingIds = new Set<string>();
  const connectedNodeIds = new Set<string>();

  if (activeNodeId) {
    connectedNodeIds.add(activeNodeId);
    storeEdges.forEach(edge => {
      if (edge.source === activeNodeId) {
        connectedNodeIds.add(edge.target);
        if (activeNodeId === selectedNodeId) outgoingIds.add(edge.target);
      }
      if (edge.target === activeNodeId) {
        connectedNodeIds.add(edge.source);
        if (activeNodeId === selectedNodeId) incomingIds.add(edge.source);
      }
    });
  }

  const incomingNodesSorted = storeNodes.filter(n => incomingIds.has(n.id)).sort((a, b) => a.position.y - b.position.y);
  const outgoingNodesSorted = storeNodes.filter(n => outgoingIds.has(n.id)).sort((a, b) => a.position.y - b.position.y);
  
  const selectedNode = selectedNodeId ? storeNodes.find(n => n.id === selectedNodeId) : null;
  const sx = selectedNode ? selectedNode.position.x : 0;
  const sy = selectedNode ? selectedNode.position.y : 0;

  const displayNodes = storeNodes.map(node => {
    const isFocused = !activeNodeId || connectedNodeIds.has(node.id);
    const isOrphan = (node.data.issues as string[] | undefined)?.includes('orphan');
    let position = node.position;
    let opacity = isFocused ? 1 : 0.4;

    if (showOrphansOnly && !isOrphan) {
      opacity = 0.05;
    }

    if (selectedNodeId && isFocused && node.id !== selectedNodeId) {
      if (incomingIds.has(node.id)) {
        const index = incomingNodesSorted.findIndex(n => n.id === node.id);
        const rows = Math.min(5, Math.max(1, Math.ceil(Math.sqrt(incomingNodesSorted.length))));
        const col = Math.floor(index / rows);
        const row = index % rows;
        position = { 
          x: sx - (col + 1) * 400, 
          y: sy + (row - (rows - 1) / 2) * 160 
        };
      } else if (outgoingIds.has(node.id)) {
        const index = outgoingNodesSorted.findIndex(n => n.id === node.id);
        const rows = Math.min(5, Math.max(1, Math.ceil(Math.sqrt(outgoingNodesSorted.length))));
        const col = Math.floor(index / rows);
        const row = index % rows;
        position = { 
          x: sx + (col + 1) * 400, 
          y: sy + (row - (rows - 1) / 2) * 160 
        };
      }
    }

    return {
      ...node,
      position,
      style: {
        ...node.style,
        opacity,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      },
      zIndex: isFocused ? 50 : 0
    };
  });

  const displayEdges = storeEdges.map(edge => {
    const isGlobalView = !activeNodeId;
    const isFocused = activeNodeId && (connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target));
    let opacity = isGlobalView ? 0.1 : (isFocused ? 1 : 0);
    
    if (showOrphansOnly) {
      opacity = 0;
    }

    return {
      ...edge,
      style: {
        ...edge.style,
        strokeWidth: isFocused ? 2 : 1,
        opacity,
        transition: 'opacity 0.2s ease, stroke-width 0.2s ease'
      },
      animated: isFocused ? Boolean(edge.animated) : false,
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
      panActivationKeyCode={null}
      defaultEdgeOptions={{
        type: 'default',
        style: { strokeWidth: 2, stroke: '#8b949e' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8b949e' }
      }}
      fitView
    >
      <Background color="#30363d" gap={24} size={2} />
      <Controls style={{ display: 'flex', flexDirection: 'row' }} />
      <MiniMap 
        style={{ 
          background: 'rgba(13, 17, 23, 0.8)', 
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
        nodeColor={(node: any) => {
          if (node.data?.isAsset) return '#d29922';
          if ((node.data?.issues as string[])?.includes('error')) return '#f85149';
          return '#58a6ff';
        }}
        maskColor="rgba(0, 0, 0, 0.5)"
        zoomable
        pannable
      />
      <Panel position="top-left" style={{ margin: '16px', color: '#8b949e', fontSize: '0.8rem', background: 'rgba(13, 17, 23, 0.7)', padding: '8px 12px', borderRadius: '6px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.05)' }}>
        {selectedNodeId ? 'Press Esc or click background to clear selection' : 'Scroll to zoom, drag to pan'}
      </Panel>
      <Panel position="top-right" style={{ background: 'rgba(22, 27, 34, 0.8)', border: '1px solid #30363d', borderRadius: '8px', padding: '12px', fontSize: '0.75rem', color: '#8b949e', display: 'flex', flexDirection: 'column', gap: '8px', backdropFilter: 'blur(10px)', marginTop: '16px', marginRight: '16px' }}>
        <div style={{ fontWeight: 600, color: '#c9d1d9', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Edge Legend</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '2px', background: '#58a6ff' }}></div>
          <span>Explicit Dependency</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '2px', background: 'transparent', borderTop: '2px dashed #d29922' }}></div>
          <span>Implicit (Backticks)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '2px', background: 'transparent', borderTop: '2px dashed #8b949e' }}></div>
          <span>Soft Mention</span>
        </div>
      </Panel>
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
