import { create } from 'zustand';
import { Node as XYNode, Edge as XYEdge } from '@xyflow/react';
import { parseSkillLibrary, FileData } from '@/lib/parser';
import dagre from 'dagre';

interface GraphState {
  nodes: XYNode[];
  edges: XYEdge[];
  selectedNodeId: string | null;
  selectedAssetPath: string | null;
  isEditorOpen: boolean;
  stagedChanges: Record<string, string>; // path -> content
  showOrphansOnly: boolean;
  loadFiles: (files: FileData[]) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedAsset: (path: string | null) => void;
  setIsEditorOpen: (isOpen: boolean) => void;
  updateNodeContent: (id: string, newContent: string) => void;
  discardChanges: (path: string) => void;
  toggleShowOrphans: () => void;
}

const getLayoutedElements = (nodes: XYNode[], edges: XYEdge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', ranksep: 250, nodesep: 80 });

  const connectedNodes = nodes.filter(n => !(n.data.issues as any[])?.includes('orphan'));
  const orphanNodes = nodes.filter(n => (n.data.issues as any[])?.includes('orphan'));

  connectedNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 280, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const columnsMap = new Map<number, typeof connectedNodes>();
  connectedNodes.forEach(node => {
    const pos = dagreGraph.node(node.id);
    const x = Math.round(pos.x);
    if (!columnsMap.has(x)) columnsMap.set(x, []);
    columnsMap.get(x)!.push(node);
  });

  let maxGridY = 0;
  const layoutedConnected: any[] = [];
  const sortedXs = Array.from(columnsMap.keys()).sort((a, b) => a - b);
  
  sortedXs.forEach((x, colIndex) => {
    const colNodes = columnsMap.get(x)!;
    colNodes.sort((a, b) => dagreGraph.node(a.id).y - dagreGraph.node(b.id).y);
    
    colNodes.forEach((node, rowIndex) => {
      const gridX = colIndex * 450;
      const gridY = rowIndex * 160;
      if (gridY > maxGridY) maxGridY = gridY;
      
      layoutedConnected.push({
        ...node,
        position: { x: gridX, y: gridY }
      });
    });
  });

  const columns = 5;
  const gridSpacingX = 320;
  const gridSpacingY = 160;
  const startY = Math.max(maxGridY + 300, 0);

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
  isEditorOpen: false,
  stagedChanges: {},
  showOrphansOnly: false,

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
    set({ nodes: layoutedNodes, edges: layoutedEdges, selectedNodeId: null, selectedAssetPath: null, isEditorOpen: false });
  },

  setSelectedNode: (id: string | null) => {
    set({ selectedNodeId: id, selectedAssetPath: null, isEditorOpen: id !== null });
  },

  setSelectedAsset: (path: string | null) => {
    set({ selectedAssetPath: path, isEditorOpen: path !== null });
  },

  setIsEditorOpen: (isOpen: boolean) => {
    set({ isEditorOpen: isOpen });
  },

  updateNodeContent: (id: string, newContent: string) => {
    const { nodes, stagedChanges } = get();
    const targetNode = nodes.find(n => n.id === id);
    if (!targetNode) return;

    const path = targetNode.data.path as string;
    const newStagedChanges = { ...stagedChanges, [path]: newContent };

    const updatedNodes = nodes.map(n => 
      n.id === id ? { 
        ...n, 
        data: { 
          ...n.data, 
          content: newContent,
          originalContent: n.data.originalContent !== undefined ? n.data.originalContent : n.data.content,
          isModified: true 
        } 
      } : n
    );

    set({ nodes: updatedNodes, stagedChanges: newStagedChanges });
  },

  discardChanges: (path: string) => {
    const { stagedChanges, nodes } = get();
    const newStagedChanges = { ...stagedChanges };
    delete newStagedChanges[path];
    
    const updatedNodes = nodes.map(n => {
       if (n.data.path === path) {
         return {
           ...n,
           data: {
             ...n.data,
             content: n.data.originalContent !== undefined ? n.data.originalContent : n.data.content,
             isModified: false
           }
         };
       }
       return n;
    });

    set({ stagedChanges: newStagedChanges, nodes: updatedNodes });
  },

  toggleShowOrphans: () => {
    set(state => ({ showOrphansOnly: !state.showOrphansOnly }));
  }
}));
