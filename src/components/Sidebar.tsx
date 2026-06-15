'use client';

import { useGraphStore } from '@/store/graphStore';
import { FileData } from '@/lib/parser';
import { useRef, useState } from 'react';
import { FolderUp, GitBranch, Activity, Layers, Code2, Loader2, GitPullRequest, AlertCircle, RefreshCw, CheckCircle2, ArrowRight, ArrowLeft, Search, Compass } from 'lucide-react';
import { fetchGithubRepo } from '@/lib/github';
import PRModal from './PRModal';
import SkillAtlasLogo from './Logo';

export default function Sidebar() {
  const loadFiles = useGraphStore(state => state.loadFiles);
  const nodes = useGraphStore(state => state.nodes);
  const edges = useGraphStore(state => state.edges);
  const stagedChanges = useGraphStore(state => state.stagedChanges);
  const selectedNodeId = useGraphStore(state => state.selectedNodeId);
  const selectedAssetPath = useGraphStore(state => state.selectedAssetPath);
  const setSelectedNode = useGraphStore(state => state.setSelectedNode);
  const setSelectedAsset = useGraphStore(state => state.setSelectedAsset);
  const updateNodeContent = useGraphStore(state => state.updateNodeContent);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [githubUrl, setGithubUrl] = useState('');
  const [isLoadingGit, setIsLoadingGit] = useState(false);
  const [error, setError] = useState('');
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const stagedCount = Object.keys(stagedChanges).length;

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileDataPromises: Promise<FileData | null>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isBinary = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'pdf', 'mp4', 'ico', 'zip'].includes(ext || '');

      if (!isBinary) {
        fileDataPromises.push(
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const content = e.target?.result as string;
              resolve({
                // @ts-ignore
                path: file.webkitRelativePath || file.name,
                content
              });
            };
            reader.onerror = () => resolve(null);
            reader.readAsText(file);
          })
        );
      } else {
        // Just record the path for binary files so they can be referenced as assets, but without content
        fileDataPromises.push(
          Promise.resolve({
            // @ts-ignore
            path: file.webkitRelativePath || file.name,
            content: 'Binary file viewing not supported.'
          })
        );
      }
    }

    const loadedFiles = (await Promise.all(fileDataPromises)).filter(Boolean) as FileData[];
    if (loadedFiles.length > 0) {
      loadFiles(loadedFiles);
      setError('');
    }
  };

  const handleGithubLoad = async () => {
    if (!githubUrl) return;
    setIsLoadingGit(true);
    setError('');
    try {
      const files = await fetchGithubRepo(githubUrl);
      if (files.length === 0) {
        setError('No markdown files found in the repository.');
      } else {
        loadFiles(files);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load repository.');
    } finally {
      setIsLoadingGit(false);
    }
  };

  return (
    <aside style={{ 
      width: 320, 
      borderRight: '1px solid var(--panel-border)',
      backgroundColor: 'var(--panel-bg)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem',
      overflowY: 'auto',
      zIndex: 10,
      boxShadow: '4px 0 24px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem' }}>
        <div style={{ padding: '8px', background: 'linear-gradient(135deg, var(--accent-primary), #3b82f6)', borderRadius: '10px', color: '#fff', boxShadow: '0 4px 12px rgba(88, 166, 255, 0.4)' }}>
          <SkillAtlasLogo size={22} />
        </div>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
          Skill Atlas
        </h1>
      </div>
      
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8b949e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Code2 size={14} /> Ingestion Sources
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button style={btnStyle} onClick={() => fileInputRef.current?.click()}>
            <FolderUp size={16} color="var(--accent-primary)" />
            <span>Select Local Folder</span>
          </button>
          <input 
            type="file" 
            // @ts-ignore
            webkitdirectory="true" 
            directory="true" 
            multiple 
            ref={fileInputRef} 
            onChange={handleFolderUpload}
            style={{ display: 'none' }} 
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>Or ingest via GitHub URL:</span>
            <input 
              type="text" 
              placeholder="e.g. conorluddy/ios-simulator-skill" 
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--panel-border)',
                color: 'var(--foreground)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button 
              style={{ ...btnStyle, justifyContent: 'center', backgroundColor: githubUrl ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)', color: githubUrl ? '#fff' : 'var(--foreground)', opacity: githubUrl ? 1 : 0.5, border: 'none' }}
              onClick={handleGithubLoad}
              disabled={!githubUrl || isLoadingGit}
            >
              {isLoadingGit ? <Loader2 size={16} className="animate-spin" /> : <GitBranch size={16} />}
              <span>{isLoadingGit ? 'Loading...' : 'Fetch Repository'}</span>
            </button>
          </div>

          {error && (
            <div style={{ color: 'var(--accent-danger)', fontSize: '0.8rem', padding: '8px', backgroundColor: 'rgba(218, 54, 51, 0.1)', borderRadius: '6px', border: '1px solid var(--accent-danger)', marginTop: '8px' }}>
              {error}
            </div>
          )}
        </div>
      </section>

      <section style={{ flex: 1 }}>
        <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8b949e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={14} /> Diagnostics
        </h2>
        {nodes.length === 0 ? (
          <div style={{ color: '#8b949e', fontSize: '0.85rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px dashed var(--panel-border)', textAlign: 'center' }}>
            Awaiting repository ingest.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={statBoxStyle}>
              <span style={{ color: '#8b949e', fontSize: '0.85rem' }}>Total Skills</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--foreground)' }}>{nodes.length}</strong>
            </div>
            <div style={statBoxStyle}>
              <span style={{ color: '#8b949e', fontSize: '0.85rem' }}>Total Edges</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--foreground)' }}>{edges.length}</strong>
            </div>
          </div>
        )}

        {stagedCount > 0 && githubUrl && (
          <div style={{ marginTop: '24px' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d29922', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GitPullRequest size={14} /> Staged Changes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ ...statBoxStyle, borderColor: 'rgba(210, 153, 34, 0.4)', background: 'rgba(210, 153, 34, 0.1)' }}>
                <span style={{ color: '#d29922', fontSize: '0.85rem' }}>Modified Files</span>
                <strong style={{ fontSize: '1.2rem', color: '#d29922' }}>{stagedCount}</strong>
              </div>
              <button 
                style={{ ...btnStyle, justifyContent: 'center', backgroundColor: '#238636', color: '#fff', border: 'none' }}
                onClick={() => setIsPRModalOpen(true)}
              >
                Review & Create PR
              </button>
            </div>
          </div>
        )}
      </section>

      {nodes.length > 0 && !selectedNodeId && (
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: '24px' }}>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8b949e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} /> Diagnostic Index
          </h2>
          <div style={{ position: 'relative', marginBottom: '16px', paddingRight: '8px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
            <input 
              type="text" 
              placeholder="Search skills..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '6px 10px 6px 30px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: 'var(--foreground)', fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px', overflowX: 'hidden' }} className="custom-scrollbar">
            
            {/* Invalid Skills */}
            {(() => {
              const invalid = nodes.filter(n => !n.data.isAsset && (n.data.issues as string[] | undefined)?.includes('error') && (n.data.label as string).toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => (a.data.label as string).localeCompare(b.data.label as string));
              if (invalid.length === 0) return null;
              return (
                <div>
                  <h3 style={{ fontSize: '0.7rem', color: '#f85149', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> Invalid Skills ({invalid.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {invalid.map(node => (
                      <div key={node.id} onClick={() => setSelectedNode(node.id)} style={{ padding: '6px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(248, 81, 73, 0.1)', color: '#ff7b72', border: '1px solid rgba(248, 81, 73, 0.2)' }}>
                        {node.data.label as string}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Cycles */}
            {(() => {
              const cycles = nodes.filter(n => !n.data.isAsset && (n.data.issues as string[] | undefined)?.includes('cycle') && (n.data.label as string).toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => (a.data.label as string).localeCompare(b.data.label as string));
              if (cycles.length === 0) return null;
              return (
                <div>
                  <h3 style={{ fontSize: '0.7rem', color: '#f85149', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={12} /> Cyclic Dependencies ({cycles.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {cycles.map(node => (
                      <div key={node.id} onClick={() => setSelectedNode(node.id)} style={{ padding: '6px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(248, 81, 73, 0.1)', color: '#ff7b72', border: '1px solid rgba(248, 81, 73, 0.2)' }}>
                        {node.data.label as string}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Orphans */}
            {(() => {
              const orphans = nodes.filter(n => !n.data.isAsset && (n.data.issues as string[] | undefined)?.includes('orphan') && (n.data.label as string).toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => (a.data.label as string).localeCompare(b.data.label as string));
              if (orphans.length === 0) return null;
              return (
                <div>
                  <h3 style={{ fontSize: '0.7rem', color: '#d29922', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> Orphan Skills ({orphans.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {orphans.map(node => (
                      <div key={node.id} onClick={() => setSelectedNode(node.id)} style={{ padding: '6px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(210, 153, 34, 0.1)', color: '#e3b341', border: '1px solid rgba(210, 153, 34, 0.2)' }}>
                        {node.data.label as string}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Healthy */}
            {(() => {
              const healthy = nodes.filter(n => !n.data.isAsset && (!(n.data.issues as string[] | undefined) || (n.data.issues as string[]).length === 0) && (n.data.label as string).toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => (a.data.label as string).localeCompare(b.data.label as string));
              if (healthy.length === 0) return null;
              return (
                <div>
                  <h3 style={{ fontSize: '0.7rem', color: '#3fb950', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> Healthy Skills ({healthy.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {healthy.map(node => (
                      <div key={node.id} onClick={() => setSelectedNode(node.id)} style={{ padding: '6px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', color: 'var(--foreground)', border: '1px solid rgba(255,255,255,0.05)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                        {node.data.label as string}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {selectedNodeId && (
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: '24px', borderTop: '1px solid var(--panel-border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} /> Node Context
            </h2>
            <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: '#58a6ff', fontSize: '0.7rem', cursor: 'pointer' }}>Back to Index</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="custom-scrollbar">
            {(() => {
              const node = nodes.find(n => n.id === selectedNodeId);
              if (!node) return null;

              const incoming = edges.filter(e => e.target === selectedNodeId && e.label !== 'owns').map(e => nodes.find(n => n.id === e.source)).filter(Boolean);
              const outgoing = edges.filter(e => e.source === selectedNodeId && e.label !== 'owns').map(e => nodes.find(n => n.id === e.target)).filter(Boolean);
              const assets = node.data.assets || [];

              return (
                <>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)', wordBreak: 'break-word', lineHeight: '1.4' }}>
                    {node.data.label as string}
                  </div>

                  {(node.data.issues as string[] | undefined)?.includes('error') && (
                    <div style={{ padding: '8px 12px', background: 'rgba(248, 81, 73, 0.1)', color: '#ff7b72', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(248, 81, 73, 0.2)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <AlertCircle size={14} /> Failed Validation
                      </div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.9, lineHeight: 1.4 }}>
                        According to Anthropic's Skill Rules, this skill is invalid because it violates the following required structural guidelines:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '16px', listStyleType: 'disc', marginBottom: '8px' }}>
                        {(node.data.validationErrors as string[] || []).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                      {(node.data.validationErrors as string[] || []).some(e => e.includes('kebab-case')) && (
                        <button 
                          onClick={() => {
                            const content = node.data.content as string;
                            const match = content.match(/^name:\s*(.+)$/m);
                            if (match) {
                              const oldName = match[1];
                              const fixedName = oldName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                              const newContent = content.replace(`name: ${oldName}`, `name: ${fixedName}`);
                              updateNodeContent(node.id, newContent);
                            }
                          }}
                          style={{
                            background: '#238636',
                            color: '#fff',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            alignSelf: 'flex-start'
                          }}
                        >
                          Auto-Fix Name
                        </button>
                      )}
                    </div>
                  )}

                  {(node.data.issues as string[] | undefined)?.includes('cycle') && (
                    <div style={{ padding: '8px 12px', background: 'rgba(248, 81, 73, 0.1)', color: '#ff7b72', border: '1px solid rgba(248, 81, 73, 0.2)', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <RefreshCw size={14} /> Cyclic Dependency
                      </div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.9, lineHeight: 1.4 }}>
                        This skill is trapped in a cyclic dependency loop. According to the Anthropic Skill Rules, skills must form a directed acyclic graph (DAG). Circular dependencies cause infinite reasoning loops and must be broken down into hierarchical, acyclic structures.
                      </div>
                    </div>
                  )}

                  {(node.data.issues as string[] | undefined)?.includes('orphan') && (
                    <div style={{ padding: '8px 12px', background: 'rgba(210, 153, 34, 0.1)', color: '#d29922', border: '1px solid rgba(210, 153, 34, 0.2)', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <AlertCircle size={14} /> Orphan Skill
                      </div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.9, lineHeight: 1.4 }}>
                        This skill is completely isolated. It neither references any other skills, nor is it referenced by any other skills. According to the Anthropic Skill Rules, skills should be highly composable and discoverable. Consider integrating this skill into your ecosystem by linking it where relevant.
                      </div>
                    </div>
                  )}

                  {incoming.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '0.7rem', color: '#8b949e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowRight size={12} /> Referred By ({incoming.length})</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {incoming.map(n => n && (
                          <div key={n.id} onClick={() => setSelectedNode(n.id)} style={{ padding: '6px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(88, 166, 255, 0.1)', color: '#79c0ff', border: '1px solid rgba(88, 166, 255, 0.2)' }}>
                            {n.data.label as string}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {outgoing.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '0.7rem', color: '#8b949e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowLeft size={12} /> Refers To ({outgoing.length})</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {outgoing.map(n => n && (
                          <div key={n.id} onClick={() => setSelectedNode(n.id)} style={{ padding: '6px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', color: 'var(--foreground)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {n.data.label as string}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(assets) && assets.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '0.7rem', color: '#8b949e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Code2 size={12} /> Bundled Assets ({assets.length})</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {assets.map((asset: any, i: number) => (
                          <div 
                            key={i} 
                            onClick={() => setSelectedAsset(asset.path)}
                            style={{ 
                              padding: '6px 10px', 
                              borderRadius: '4px', 
                              fontSize: '0.8rem', 
                              background: selectedAssetPath === asset.path ? 'rgba(88, 166, 255, 0.15)' : '#0d1117', 
                              color: selectedAssetPath === asset.path ? '#58a6ff' : '#8b949e', 
                              border: `1px solid ${selectedAssetPath === asset.path ? 'rgba(88, 166, 255, 0.3)' : '#30363d'}`, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap',
                              cursor: 'pointer'
                            }} 
                            title={asset.path}
                          >
                            {asset.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </section>
      )}


      {isPRModalOpen && (
        <PRModal repoUrl={githubUrl} onClose={() => setIsPRModalOpen(false)} />
      )}
    </aside>
  );
}

const btnStyle = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--panel-border)',
  color: 'var(--foreground)',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const statBoxStyle = {
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  padding: '0.75rem 1rem',
  background: 'rgba(0,0,0,0.2)',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.05)'
};
