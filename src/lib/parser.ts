import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import { visit } from 'unist-util-visit';
import { parse as parseYaml } from 'yaml';
import { Node as XYNode, Edge as XYEdge, MarkerType } from '@xyflow/react';
import { validateSkill } from './validator';

export interface FileData {
  path: string;
  content: string;
}

export interface ParseResult {
  nodes: XYNode[];
  edges: XYEdge[];
}

export function parseSkillLibrary(files: FileData[]): ParseResult {
  const nodes: XYNode[] = [];
  const edges: XYEdge[] = [];
  const fileIdMap = new Map<string, string>(); // path -> nodeId
  let nodeCounter = 0;
  
  // 1. Separate Skills from Assets
  const skillFiles = files.filter(f => /skill\.md$/i.test(f.path));
  const assetFiles = files.filter(f => !/skill\.md$/i.test(f.path));
  
  // Create nodes for Skills
  const parsedDocs: any[] = [];
  const skillNameMap = new Map<string, string>(); // skillName -> nodeId

  skillFiles.forEach((file) => {
    const tree = unified()
      .use(remarkParse)
      .use(remarkFrontmatter)
      .parse(file.content);

    let frontmatter: any = {};
    let firstHeading = '';

    visit(tree, (node: any) => {
      if (node.type === 'yaml' && node.value) {
        try { frontmatter = parseYaml(node.value) || {}; } catch (e) {}
      }
      if (node.type === 'heading' && node.depth === 1 && !firstHeading && node.children && node.children[0]) {
        firstHeading = node.children[0].value || '';
      }
    });

    const pathParts = file.path.split('/');
    const fileName = pathParts.pop()?.replace('.md', '') || file.path;
    const parentDirName = pathParts.pop() || fileName;
    
    const baseIdentity = fileName.toLowerCase() === 'skill' ? parentDirName : fileName;
    const skillName = frontmatter.name || firstHeading || baseIdentity;
    
    let id = skillNameMap.get(skillName);
    let validationResult = validateSkill(frontmatter, file.path, file.content, files);

    const lines = file.content.split('\n').length;
    const words = file.content.trim().split(/\s+/).filter(Boolean).length;
    const chars = file.content.length;
    const tokens = Math.ceil(words * 1.3);

    if (!id) {
      id = `node_${nodeCounter++}`;
      skillNameMap.set(skillName, id);
      
      nodes.push({
        id,
        type: 'custom',
        position: { x: 0, y: 0 },
        data: { 
          label: skillName, 
          path: file.path,
          duplicatePaths: [],
          description: frontmatter.description || '',
          content: file.content,
          isAsset: false,
          assets: [],
          validationErrors: validationResult.errors,
          issues: validationResult.isValid ? [] : ['error'],
          metrics: { lines, words, chars, tokens }
        }
      });
    } else {
      // Deduplicate: Add to duplicatePaths
      const existingNode = nodes.find(n => n.id === id);
      if (existingNode && existingNode.data.duplicatePaths) {
        (existingNode.data.duplicatePaths as string[]).push(file.path);
      }
    }

    fileIdMap.set(file.path, id);
    parsedDocs.push({ id, tree, path: file.path, frontmatter, content: file.content, validationResult });
  });

  const createdAssets = new Map<string, string>(); // path -> nodeId

  // 2. Extract references and create edges
  parsedDocs.forEach((doc) => {
    const sourceId = doc.id;
    let edgeIndex = 0;

    // A. Explicit Frontmatter dependencies (Skill to Skill)
    if (doc.frontmatter.dependencies && Array.isArray(doc.frontmatter.dependencies)) {
      doc.frontmatter.dependencies.forEach((dep: string) => {
        const targetNode = nodes.find(n => n.data.label === dep && !n.data.isAsset);
        if (targetNode && targetNode.id !== sourceId && !edges.find(e => e.source === sourceId && e.target === targetNode.id)) {
          edges.push({
            id: `edge_${sourceId}_${targetNode.id}_${edgeIndex++}`,
            source: sourceId,
            target: targetNode.id,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#58a6ff' },
            style: { stroke: '#58a6ff' }
          });
        }
      });
    }

    // B. Explicit markdown links and implicit backtick references (Skill to Skill)
    visit(doc.tree, (node: any) => {
      if (node.type === 'link' && node.url) {
        const urlSegments = node.url.split('/');
        const targetFilename = urlSegments.pop() || '';
        const targetParentDir = urlSegments.pop() || '';
        
        let targetPathMatch = null;
        if (targetFilename.toLowerCase() === 'skill.md' && targetParentDir) {
           targetPathMatch = parsedDocs.find(d => {
             const dParts = d.path.split('/');
             return dParts.length > 1 && dParts[dParts.length - 2] === targetParentDir;
           });
        } else {
           targetPathMatch = parsedDocs.find(d => d.path.split('/').pop() === targetFilename);
        }

        if (targetPathMatch && targetPathMatch.id !== sourceId) {
          if (!edges.find(e => e.source === sourceId && e.target === targetPathMatch.id)) {
            edges.push({
              id: `edge_${sourceId}_${targetPathMatch.id}_${edgeIndex++}`,
              source: sourceId,
              target: targetPathMatch.id,
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#58a6ff' },
              style: { stroke: '#58a6ff' }
            });
          }
        }
      } else if (node.type === 'inlineCode' && node.value) {
        const targetNode = nodes.find(n => n.data.label === node.value && !n.data.isAsset);
        if (targetNode && targetNode.id !== sourceId) {
          if (!edges.find(e => e.source === sourceId && e.target === targetNode.id)) {
            edges.push({
              id: `edge_${sourceId}_${targetNode.id}_${edgeIndex++}`,
              source: sourceId,
              target: targetNode.id,
              animated: true,
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#d29922' },
              style: { stroke: '#d29922', strokeDasharray: '4,4' }
            });
          }
        }
      }
    });

    // C. Mention Scanning (Skill to Skill based on content)
    nodes.forEach(targetNode => {
      if (targetNode.id === sourceId) return;
      
      const label = targetNode.data.label as string;
      if (!label || label.length < 3) return; // avoid matching very short words like 'go' or 'c'
      
      // Only use regex boundary if label is alphanumeric, to avoid throwing on special chars
      try {
        const regex = new RegExp(`\\b${label}\\b`, 'i');
        if (regex.test(doc.content)) {
          if (!edges.find(e => e.source === sourceId && e.target === targetNode.id)) {
            edges.push({
              id: `edge_${sourceId}_${targetNode.id}_${edgeIndex++}`,
              source: sourceId,
              target: targetNode.id,
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed, color: '#8b949e' },
              style: { strokeDasharray: '2,6', stroke: '#8b949e' }
            });
          }
        }
      } catch (e) {
        // Fallback for names with special characters
        if (doc.content.toLowerCase().includes(label.toLowerCase())) {
          if (!edges.find(e => e.source === sourceId && e.target === targetNode.id)) {
            edges.push({
              id: `edge_${sourceId}_${targetNode.id}_${edgeIndex++}`,
              source: sourceId,
              target: targetNode.id,
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed, color: '#8b949e' },
              style: { strokeDasharray: '2,6', stroke: '#8b949e' }
            });
          }
        }
      }
    });

    // C. Asset / Script Scanning (Skill to Asset)
    // Only link assets that are within the skill's own directory tree
    const skillDir = doc.path.split('/').slice(0, -1).join('/');
    
    assetFiles.forEach(asset => {
      // Must be in the same directory or a subdirectory of the skill
      if (!asset.path.startsWith(skillDir + '/')) return;
      
      const assetFilename = asset.path.split('/').pop();
      if (!assetFilename || assetFilename.startsWith('.') || assetFilename.toLowerCase() === 'readme.md') return; 

      // CRITICAL FIX: The asset must actually be mentioned in the skill's text to be considered a dependency.
      if (!doc.content.includes(assetFilename)) return;

      const nodeData = nodes.find(n => n.id === sourceId)?.data;
      if (nodeData) {
        (nodeData.assets as any[]).push({
          label: assetFilename,
          path: asset.path,
          content: asset.content || 'Content not loaded. Use GitHub direct fetch to view.'
        });
      }
    });
  });

  // D. Validation Engine: Tarjan's Strongly Connected Components & Orphans
  
  // Build adjacency list for Tarjan's
  const adj = new Map<string, string[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    // Only consider explicit dependencies (frontmatter, markdown links, or backtick codes) for cycle detection.
    // Casual text 'mentions' do NOT constitute a strict cyclic dependency.
    if (e.label === 'frontmatter' || e.label === 'link' || e.label === 'implicit') {
      adj.get(e.source)?.push(e.target);
    }
  });

  let index = 0;
  const stack: string[] = [];
  const indices = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const sccs: string[][] = [];

  function strongconnect(v: string) {
    indices.set(v, index);
    lowlink.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    const neighbors = adj.get(v) || [];
    for (const w of neighbors) {
      if (!indices.has(w)) {
        strongconnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
      }
    }

    if (lowlink.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      sccs.push(scc);
    }
  }

  nodes.forEach(n => {
    if (!indices.has(n.id)) {
      strongconnect(n.id);
    }
  });

  // Apply issues to nodes
  const cycleNodes = new Set<string>();
  sccs.forEach(scc => {
    if (scc.length > 1) { // A cycle exists
      scc.forEach(id => cycleNodes.add(id));
    }
  });

  nodes.forEach(n => {
    const issues: string[] = Array.isArray(n.data.issues) ? [...n.data.issues] : [];
    if (cycleNodes.has(n.id)) {
      issues.push('cycle');
      
      const validationErrors = Array.isArray(n.data.validationErrors) ? [...n.data.validationErrors] : [];
      if (!validationErrors.includes("Critical Error: This skill is part of a circular dependency (infinite loop).")) {
        validationErrors.push("Critical Error: This skill is part of a circular dependency (infinite loop).");
      }
      n.data.validationErrors = validationErrors;
      if (!issues.includes('error')) issues.push('error');
    }
    
    // Check for orphans (only applies to skills, not assets)
    let inDegree = 0;
    if (!n.data.isAsset) {
      const isSource = edges.some(e => e.source === n.id && e.label !== 'owns');
      inDegree = edges.filter(e => e.target === n.id).length;
      if (!isSource && inDegree === 0) {
        issues.push('orphan');
      }
    }

    n.data.inDegree = inDegree;

    if (issues.length > 0) {
      n.data.issues = issues;
    }
  });

  // Highlight cyclic edges
  edges.forEach(e => {
    if (cycleNodes.has(e.source) && cycleNodes.has(e.target)) {
      e.style = { stroke: 'var(--accent-danger)', strokeWidth: 3 };
      e.animated = true;
    }
  });

  return { nodes, edges };
}
