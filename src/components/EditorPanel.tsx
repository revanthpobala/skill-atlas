'use client';

import { useGraphStore } from '@/store/graphStore';
import Editor from '@monaco-editor/react';
import { FileCode, X, BookOpen, Edit3, RotateCcw, Sparkles, Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';

function remarkMentions(options: { mentions: string[] }) {
  return (tree: any) => {
    if (!options.mentions || options.mentions.length === 0) return;
    
    // Sort by length descending to match longest first
    const sortedMentions = [...options.mentions].sort((a, b) => b.length - a.length);
    const regex = new RegExp(`\\b(${sortedMentions.join('|')})\\b`, 'gi');

    visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
      // Don't highlight inside code blocks or existing links
      if (!parent || parent.type === 'code' || parent.type === 'inlineCode' || parent.type === 'link') return;
      
      const text = node.value;
      if (!regex.test(text)) return;
      
      regex.lastIndex = 0;
      const newNodes = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          newNodes.push({ type: 'text', value: text.slice(lastIndex, match.index) });
        }
        
        newNodes.push({
          type: 'link',
          url: `#mention-${match[0]}`,
          children: [{ type: 'text', value: match[0] }]
        });

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < text.length) {
        newNodes.push({ type: 'text', value: text.slice(lastIndex) });
      }

      if (index !== undefined) {
        parent.children.splice(index, 1, ...newNodes);
        return index + newNodes.length; // Skip over the newly inserted nodes
      }
    });
  };
}

export default function EditorPanel() {
  const selectedNodeId = useGraphStore(state => state.selectedNodeId);
  const nodes = useGraphStore(state => state.nodes);
  const updateNodeContent = useGraphStore(state => state.updateNodeContent);
  const setSelectedNode = useGraphStore(state => state.setSelectedNode);
  const setIsEditorOpen = useGraphStore(state => state.setIsEditorOpen);
  const discardChanges = useGraphStore(state => state.discardChanges);
  const selectedAssetPath = useGraphStore(state => state.selectedAssetPath);
  const setSelectedAsset = useGraphStore(state => state.setSelectedAsset);
  
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', borderLeft: '1px solid var(--panel-border)' }}>
        Select a node to view or edit
      </div>
    );
  }

  // Find selected asset if there is one
  const selectedAsset = selectedAssetPath ? (selectedNode.data.assets as any[])?.find(a => a.path === selectedAssetPath) : null;

  const currentPath = selectedAsset ? selectedAsset.path : (selectedNode.data.path as string);
  const content = selectedAsset ? selectedAsset.content : (selectedNode.data.content as string || '');
  const isModified = selectedAsset ? false : (selectedNode.data.isModified as boolean);
  const isMarkdown = currentPath.toLowerCase().endsWith('.md');
  const isNotebook = currentPath.toLowerCase().endsWith('.ipynb');

  let notebookCells: any[] = [];
  if (isNotebook) {
    try {
      const parsed = JSON.parse(content);
      notebookCells = parsed.cells || [];
    } catch (e) {}
  }

  const handleDiscard = () => {
    if (confirm('Discard uncommitted changes to this file?')) {
      discardChanges(currentPath);
    }
  };

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateRows: '40px minmax(0, 1fr)', borderLeft: '1px solid var(--panel-border)', backgroundColor: '#0d1117', boxShadow: '-8px 0 24px rgba(0,0,0,0.3)' }}>
      {/* IDE Tab Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: '#010409',
        borderBottom: '1px solid var(--panel-border)',
        height: '40px',
        paddingRight: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 16px',
          background: '#0d1117',
          borderRight: '1px solid var(--panel-border)',
          borderTop: '2px solid var(--accent-primary)',
          height: '100%',
          cursor: 'pointer'
        }}>
          <FileCode size={14} color={isModified ? '#d29922' : 'var(--accent-primary)'} />
          <span style={{ fontSize: '0.85rem', color: isModified ? '#d29922' : 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
            {currentPath}
          </span>
          <button 
            onClick={() => setIsEditorOpen(false)}
            style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex', marginLeft: '8px', padding: '2px', borderRadius: '4px' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isModified && (
            <button
              onClick={handleDiscard}
              title="Discard changes"
              style={{ background: 'none', border: 'none', color: '#d29922', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '4px' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(210,153,34,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <RotateCcw size={14} />
            </button>
          )}

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px' }}>
            <button
              onClick={() => setMode('view')}
              style={{
                background: mode === 'view' ? 'var(--panel-border)' : 'transparent',
                color: mode === 'view' ? 'var(--foreground)' : '#8b949e',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              <BookOpen size={12} /> View
            </button>
            <button
              onClick={() => setMode('edit')}
              style={{
                background: mode === 'edit' ? 'var(--panel-border)' : 'transparent',
                color: mode === 'edit' ? 'var(--foreground)' : '#8b949e',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              <Edit3 size={12} /> Edit
            </button>
          </div>
        </div>
      </div>

      <div style={{ overflowY: 'auto', position: 'relative' }}>
        {mode === 'view' && isMarkdown ? (
          <div style={{ padding: '24px', color: 'var(--foreground)', lineHeight: '1.6', fontFamily: 'var(--font-sans)', fontSize: '0.95rem' }}>
            <div className="markdown-body" style={{ maxWidth: '800px', margin: '0 auto' }}>
              {(() => {
                const edges = useGraphStore.getState().edges;
                const references = edges
                  .filter(e => e.source === selectedNodeId && e.label !== 'owns')
                  .map(e => nodes.find(n => n.id === e.target)?.data.label as string)
                  .filter(Boolean);
                
                return (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, [remarkMentions, { mentions: references }]]}
                    components={{
                      a: ({node, href, children, ...props}) => {
                        if (href?.startsWith('#mention-')) {
                          const targetSkillName = decodeURIComponent(href.replace('#mention-', ''));
                          const targetNode = nodes.find(n => n.data.label === targetSkillName);
                          return (
                            <span 
                              onClick={(e) => {
                                e.preventDefault();
                                if (targetNode) setSelectedNode(targetNode.id);
                              }}
                              style={{ background: 'rgba(88, 166, 255, 0.2)', color: '#79c0ff', padding: '0 4px', borderRadius: '4px', fontWeight: 600, cursor: targetNode ? 'pointer' : 'default', transition: 'background 0.2s' }}
                              onMouseEnter={(e) => { if (targetNode) e.currentTarget.style.background = 'rgba(88, 166, 255, 0.3)'; }}
                              onMouseLeave={(e) => { if (targetNode) e.currentTarget.style.background = 'rgba(88, 166, 255, 0.2)'; }}
                              title={targetNode ? `Navigate to ${targetSkillName}` : undefined}
                            >
                              {children}
                            </span>
                          );
                        }
                        return <a href={href} {...props}>{children}</a>;
                      }
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                );
              })()}
            </div>
          </div>
        ) : mode === 'view' && isNotebook ? (
          <div style={{ padding: '24px', color: 'var(--foreground)', lineHeight: '1.6', fontFamily: 'var(--font-sans)', fontSize: '0.95rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {notebookCells.length === 0 && (
                 <div style={{ color: '#8b949e', fontStyle: 'italic' }}>Invalid or empty notebook file.</div>
               )}
               {notebookCells.map((cell, idx) => {
                  const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';
                  if (cell.cell_type === 'markdown') {
                    return (
                      <div key={idx} className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
                      </div>
                    );
                  } else if (cell.cell_type === 'code') {
                    return (
                      <div key={idx} style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', overflow: 'hidden' }}>
                         <div style={{ padding: '6px 12px', background: '#161b22', borderBottom: '1px solid #30363d', fontSize: '0.75rem', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}>
                            <span>In [{cell.execution_count || ' '}]:</span>
                            <span>Python</span>
                         </div>
                         <pre style={{ margin: 0, padding: '12px 16px', overflowX: 'auto', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: '#c9d1d9', background: 'transparent' }}>
                           <code>{source}</code>
                         </pre>
                      </div>
                    );
                  }
                  return null;
               })}
            </div>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Editor
                height="100%"
              language={
                currentPath.toLowerCase().endsWith('.py') ? 'python' :
                currentPath.toLowerCase().endsWith('.js') || currentPath.toLowerCase().endsWith('.jsx') ? 'javascript' :
                currentPath.toLowerCase().endsWith('.ts') || currentPath.toLowerCase().endsWith('.tsx') ? 'typescript' :
                currentPath.toLowerCase().endsWith('.json') ? 'json' :
                currentPath.toLowerCase().endsWith('.html') ? 'html' :
                currentPath.toLowerCase().endsWith('.css') ? 'css' :
                currentPath.toLowerCase().endsWith('.yml') || currentPath.toLowerCase().endsWith('.yaml') ? 'yaml' :
                currentPath.toLowerCase().endsWith('.sh') || currentPath.toLowerCase().endsWith('.bash') ? 'shell' :
                'markdown'
              }
              theme="vs-dark"
              value={content}
              onChange={(value) => {
                if (!selectedAsset) {
                  updateNodeContent(selectedNode.id, value || '');
                }
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                lineHeight: 24,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                readOnly: mode === 'view' || !!selectedAsset
              }}
            />
              {selectedAsset && mode === 'edit' && (
                <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#8b949e', backdropFilter: 'blur(4px)' }}>
                  Assets are Read-Only
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
