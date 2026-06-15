import { useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Node,
  Edge,
  ReactFlowProvider,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, Network } from 'lucide-react';
import dagre from 'dagre';
import { useGraphStore } from '@/store/graphStore';
import SkillNode from './SkillNode';

const nodeTypes = { custom: SkillNode };

interface SkillFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNodeId: string;
}

function FocusGraph({ selectedNodeId }: { selectedNodeId: string }) {
  const storeNodes = useGraphStore(state => state.nodes);
  const storeEdges = useGraphStore(state => state.edges);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    // 1. Identify connected nodes
    const connectedNodeIds = new Set<string>();
    connectedNodeIds.add(selectedNodeId);

    const relevantEdges: Edge[] = [];
    storeEdges.forEach(edge => {
      if (edge.source === selectedNodeId) {
        connectedNodeIds.add(edge.target);
        relevantEdges.push(edge);
      }
      if (edge.target === selectedNodeId) {
        connectedNodeIds.add(edge.source);
        relevantEdges.push(edge);
      }
    });

    const relevantNodes = storeNodes.filter(n => connectedNodeIds.has(n.id));

    // 2. Custom Rectangle Layout (Grid)
    const incoming = storeEdges.filter(e => e.target === selectedNodeId && e.source !== selectedNodeId).map(e => e.source);
    const outgoing = storeEdges.filter(e => e.source === selectedNodeId && e.target !== selectedNodeId).map(e => e.target);

    const layoutedNodes: Node[] = [];
    
    // Add center node
    const centerNode = storeNodes.find(n => n.id === selectedNodeId);
    if (centerNode) {
      layoutedNodes.push({
        ...centerNode,
        position: { x: 0, y: 0 },
        style: { ...centerNode.style, opacity: 1, boxShadow: '0 0 0 4px rgba(88, 166, 255, 0.4)' },
        zIndex: 50
      });
    }

    // Function to layout a group of nodes in a dense rectangle
    const layoutRectangle = (nodeIds: string[], startX: number, direction: 'left' | 'right') => {
      // Remove duplicates and center node just in case
      const uniqueIds = Array.from(new Set(nodeIds)).filter(id => id !== selectedNodeId);
      
      const rows = Math.min(6, Math.max(1, Math.ceil(Math.sqrt(uniqueIds.length))));
      const cols = Math.ceil(uniqueIds.length / rows);
      
      uniqueIds.forEach((id, index) => {
        const node = storeNodes.find(n => n.id === id);
        if (!node) return;

        const col = Math.floor(index / rows);
        const row = index % rows;

        const xOffset = direction === 'left' ? -(col + 1) * 350 : (col + 1) * 350;
        const yOffset = (row - (rows - 1) / 2) * 160;

        layoutedNodes.push({
          ...node,
          position: { x: startX + xOffset, y: yOffset },
          style: { ...node.style, opacity: 1 },
          zIndex: 50
        });
      });
    };

    layoutRectangle(incoming, 0, 'left');
    layoutRectangle(outgoing, 0, 'right');

    const layoutedEdges = relevantEdges.map(edge => {
      return {
        ...edge,
        style: {
          ...edge.style,
          strokeWidth: 2,
          opacity: 1
        },
        animated: edge.animated,
        zIndex: 10
      };
    });

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [selectedNodeId, storeNodes, storeEdges, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      defaultEdgeOptions={{
        type: 'default',
        style: { strokeWidth: 2, stroke: '#8b949e' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8b949e' }
      }}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      nodesConnectable={false}
      nodesDraggable={false}
    >
      <Background color="#30363d" gap={20} size={1} />
      <Controls style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }} />
    </ReactFlow>
  );
}

export default function SkillFocusModal({ isOpen, onClose, selectedNodeId }: SkillFocusModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(13, 17, 23, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }}>
      <div style={{
        background: '#0d1117',
        border: '1px solid #30363d',
        borderRadius: '12px',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '1px solid #30363d',
          background: '#161b22'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c9d1d9', fontWeight: 600 }}>
            <Network size={18} color="#58a6ff" />
            <span>Local Dependency Map</span>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8b949e',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
              borderRadius: '4px'
            }}
            onMouseOver={e => e.currentTarget.style.color = '#c9d1d9'}
            onMouseOut={e => e.currentTarget.style.color = '#8b949e'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Graph Area */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlowProvider>
            <FocusGraph selectedNodeId={selectedNodeId} />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
