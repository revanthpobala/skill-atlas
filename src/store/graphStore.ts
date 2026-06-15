import { create } from 'zustand';
import { Node as XYNode, Edge as XYEdge } from '@xyflow/react';
import { parseSkillLibrary, FileData } from '@/lib/parser';
import dagre from 'dagre';

interface GraphState {
  nodes: XYNode[];
  edges: XYEdge[];
  selectedNodeId: string | null;
  selectedAssetPath: string | null;
  stagedChanges: Record<string, string>; // path -> content
  loadFiles: (files: FileData[]) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedAsset: (path: string | null) => void;
  updateNodeContent: (id: string, newContent: string) => void;
  discardChanges: (path: string) => void;
}

const getLayoutedElements = (nodes: XYNode[], edges: XYEdge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', ranksep: 200, nodesep: 40 });

  const connectedNodes = nodes.filter(n => !(n.data.issues as any[])?.includes('orphan'));
  const orphanNodes = nodes.filter(n => (n.data.issues as any[])?.includes('orphan'));

  connectedNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 280, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  let maxDagreY = 0;

  const layoutedConnected = connectedNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const x = nodeWithPosition.x - 140;
    const y = nodeWithPosition.y - 60;
    if (y > maxDagreY) maxDagreY = y;
    return {
      ...node,
      position: { x, y },
    };
  });

  const columns = 5;
  const gridSpacingX = 320;
  const gridSpacingY = 160;
  const startY = Math.max(maxDagreY + 300, 0);

  const layoutedOrphans = orphanNodes.map((node, i) => {
    const row = Math.floor(i / columns);
    const col = i % columns;
    return {
      ...node,
      position: {
        x: col * gridSpacingX,
        y: startY + row * gridSpacingY
      }
    };
  });

  return { layoutedNodes: [...layoutedConnected, ...layoutedOrphans], layoutedEdges: edges };
};

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedAssetPath: null,
  stagedChanges: {},

  loadFiles: (files: FileData[]) => {
    const { nodes, edges } = parseSkillLibrary(files);
    
    // Restore staged changes into loaded nodes if they exist
    const { stagedChanges } = get();
    const restoredNodes = nodes.map(n => {
      if (stagedChanges[n.data.path as string]) {
        return {
          ...n,
          data: {
            ...n.data,
            content: stagedChanges[n.data.path as string],
            isModified: true
          }
        };
      }
      return n;
    });

    const { layoutedNodes, layoutedEdges } = getLayoutedElements(restoredNodes, edges);
    set({ nodes: layoutedNodes, edges: layoutedEdges, selectedNodeId: null, selectedAssetPath: null });
  },

  setSelectedNode: (id: string | null) => {
    set({ selectedNodeId: id, selectedAssetPath: null });
  },

  setSelectedAsset: (path: string | null) => {
    set({ selectedAssetPath: path });
  },

  updateNodeContent: (id: string, newContent: string) => {
    const { nodes, stagedChanges } = get();
    const targetNode = nodes.find(n => n.id === id);
    if (!targetNode) return;

    const path = targetNode.data.path as string;
    const newStagedChanges = { ...stagedChanges, [path]: newContent };

    const updatedNodes = nodes.map(n => 
      n.id === id ? { ...n, data: { ...n.data, content: newContent, isModified: true } } : n
    );

    set({ nodes: updatedNodes, stagedChanges: newStagedChanges });
  },

  discardChanges: (path: string) => {
    const { stagedChanges } = get();
    const newStagedChanges = { ...stagedChanges };
    delete newStagedChanges[path];
    set({ stagedChanges: newStagedChanges });
    // Note: Re-loading files from source would be needed to revert the graph content visually,
    // but the backend state is cleared.
  }
}));
