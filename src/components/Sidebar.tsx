'use client';

import { useGraphStore } from '@/store/graphStore';
import { FileData } from '@/lib/parser';
import { useRef, useState, useEffect } from 'react';
import { FolderUp, GitBranch, Activity, Layers, Code2, Loader2, GitPullRequest, AlertCircle, RefreshCw, CheckCircle2, ArrowRight, ArrowLeft, Search, Compass, ChevronDown, Network, Settings2, Sparkles, Info, HelpCircle } from 'lucide-react';
import { fetchGithubRepo } from '@/lib/github';
import PRModal from './PRModal';
import DiagnosticModal from './DiagnosticModal';
import DependencyListModal from './DependencyListModal';
import AISettingsModal from './AISettingsModal';
import AboutModal from './AboutModal';
import HelpModal from './HelpModal';
import SkillAtlasLogo from './Logo';
import { fetchAISuggestions } from '@/lib/ai';
import { useSession, signIn, signOut } from 'next-auth/react';

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
  const showOrphansOnly = useGraphStore(state => state.showOrphansOnly);
  const toggleShowOrphans = useGraphStore(state => state.toggleShowOrphans);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [githubUrl, setGithubUrl] = useState('');
  const [isLoadingGit, setIsLoadingGit] = useState(false);
  const [error, setError] = useState('');
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [diagnosticNodeId, setDiagnosticNodeId] = useState<string | null>(null);
  const [isIngestionOpen, setIsIngestionOpen] = useState(true);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isIndexOpen, setIsIndexOpen] = useState(true);
  const [isErrorsOpen, setIsErrorsOpen] = useState(true);
  const [isCyclesOpen, setIsCyclesOpen] = useState(true);
  const [isOrphansOpen, setIsOrphansOpen] = useState(false);
  const [isValidOpen, setIsValidOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiError, setAiError] = useState('');

  const [fetchStatus, setFetchStatus] = useState('Connecting to GitHub API...');
  const [fetchProgress, setFetchProgress] = useState(0);

  useEffect(() => {
    if (isLoadingGit) {
      setFetchProgress(10);
      setFetchStatus('Connecting to GitHub API...');
      
      const t1 = setTimeout(() => { setFetchProgress(30); setFetchStatus('Fetching repository tree...'); }, 600);
      const t2 = setTimeout(() => { setFetchProgress(60); setFetchStatus('Downloading markdown blobs...'); }, 1500);
      const t3 = setTimeout(() => { setFetchProgress(85); setFetchStatus('Parsing agentic skills...'); }, 3500);
      const t4 = setTimeout(() => { setFetchProgress(95); setFetchStatus('Building dependency graph...'); }, 5000);
      
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    } else {
      setFetchProgress(0);
    }
  }, [isLoadingGit]);

  useEffect(() => {
    setAiSuggestion('');
    setAiError('');
  }, [selectedNodeId]);

  const handleAIAnalyze = async () => {
    if (!selectedNodeId) return;
    const node = nodes.find(n => n.id === selectedNodeId);
    if (!node || !node.data.content) return;

    setAiLoading(true);
    setAiSuggestion('');
    setAiError('');

    try {
      await fetchAISuggestions(node.data.content as string, (chunk) => {
        setAiSuggestion(prev => prev + chunk);
      });
    } catch (e: any) {
      setAiError(e.message || 'An error occurred during AI analysis.');
    } finally {
      setAiLoading(false);
    }
  };

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

  const { data: session } = useSession();

  const handleGithubLoad = async () => {
    if (!githubUrl) return;
    setIsLoadingGit(true);
    setError('');
    try {
      // @ts-ignore - session.accessToken is injected via callbacks
      const token = session?.accessToken as string | undefined;
      const files = await fetchGithubRepo(githubUrl, token);
      if (files.length === 0) {
        setError('No markdown files found in the repository.');
      } else {
        loadFiles(files);
      }
    } catch (e: any) {
      if (e.message.includes('please sign in first')) {
        setError(e.message);
      } else {
        setError(e.message || 'Failed to load repository.');
      }
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
        <h1 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.02em', flex: 1 }}>
          Skill Atlas
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {stagedCount > 0 && githubUrl && (
            <button 
              onClick={() => setIsPRModalOpen(true)}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#d29922', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(210,153,34,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              title={`${stagedCount} Staged Changes`}
            >
              <GitPullRequest size={18} />
              <div style={{ position: 'absolute', top: '2px', right: '2px', background: '#d29922', color: '#0d1117', fontSize: '0.6rem', fontWeight: 'bold', width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0d1117' }}>
                {stagedCount}
              </div>
            </button>
          )}
          <button 
            onClick={() => setIsAISettingsOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px', transition: 'background 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            title="AI Settings"
          >
            <Settings2 size={18} />
          </button>
        </div>
      </div>
      
      <section style={{ marginBottom: '2.5rem' }}>
        <button 
          onClick={() => setIsIngestionOpen(!isIngestionOpen)} 
          style={{ width: '100%', background: 'none', border: 'none', padding: 0, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', outline: 'none' }}
        >
          <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <Code2 size={14} /> Ingestion Sources
          </h2>
          <ChevronDown size={14} color="#8b949e" style={{ transform: isIngestionOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </button>
        {isIngestionOpen && (
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
              placeholder="e.g. anthropic/skills" 
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
            {isLoadingGit && (
              <div style={{ marginTop: '16px', background: 'rgba(22, 27, 34, 0.5)', border: '1px solid #30363d', borderRadius: '6px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8b949e', marginBottom: '8px' }}>
                  <span>{fetchStatus}</span>
                  <span>{fetchProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: '#30363d', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${fetchProgress}%`, height: '100%', background: '#58a6ff', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div style={{ color: 'var(--accent-danger)', fontSize: '0.8rem', padding: '8px', backgroundColor: 'rgba(218, 54, 51, 0.1)', borderRadius: '6px', border: '1px solid var(--accent-danger)', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>{error}</div>
              {error.includes('sign in') && !session && (
                <button 
                  onClick={() => signIn('github')}
                  style={{ ...btnStyle, justifyContent: 'center', backgroundColor: '#238636', color: '#fff', border: 'none', padding: '6px' }}
                >
                  Sign In with GitHub
                </button>
              )}
            </div>
          )}
        </div>
        )}
      </section>

      



      {nodes.length > 0 && !selectedNodeId && (
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: '0px' }}>
          <button 
            onClick={() => setIsIndexOpen(!isIndexOpen)} 
            style={{ width: '100%', background: 'none', border: 'none', padding: 0, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', outline: 'none' }}
          >
            <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Compass size={14} /> Skill Explorer
            </h2>
            <ChevronDown size={14} color="#8b949e" style={{ transform: isIndexOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
          {isIndexOpen && (
            <>
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

          <div style={{ marginBottom: '16px', paddingRight: '8px' }}>
            <button
              onClick={toggleShowOrphans}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${showOrphansOnly ? 'rgba(210, 153, 34, 0.4)' : '#30363d'}`,
                background: showOrphansOnly ? 'rgba(210, 153, 34, 0.1)' : 'rgba(22, 27, 34, 0.5)',
                color: showOrphansOnly ? '#d29922' : '#8b949e',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={14} />
                Highlight Orphans
              </div>
              <div style={{ 
                width: '32px', 
                height: '18px', 
                background: showOrphansOnly ? '#d29922' : '#30363d', 
                borderRadius: '9px',
                position: 'relative',
                transition: 'background 0.2s ease'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: showOrphansOnly ? '16px' : '2px',
                  width: '14px',
                  height: '14px',
                  background: '#fff',
                  borderRadius: '50%',
                  transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px', overflowX: 'hidden' }} className="custom-scrollbar">
            
            {/* Invalid Skills */}
            {(() => {
              const invalid = nodes.filter(n => !n.data.isAsset && (n.data.issues as string[] | undefined)?.includes('error') && (n.data.label as string).toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => (a.data.label as string).localeCompare(b.data.label as string));
              if (invalid.length === 0) return null;
              return (
                <div style={{ marginBottom: '8px' }}>
                  <button onClick={() => setIsErrorsOpen(!isErrorsOpen)} style={{ width: '100%', background: 'none', border: 'none', padding: 0, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', outline: 'none' }}>
                    <h3 style={{ fontSize: '0.7rem', color: '#f85149', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> Invalid Skills ({invalid.length})</h3>
                    <ChevronDown size={14} color="#f85149" style={{ transform: isErrorsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </button>
                  {isErrorsOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {invalid.map(node => (
                        <div key={node.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '4px', background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.2)' }}>
                          <div onClick={() => setSelectedNode(node.id)} style={{ fontSize: '0.8rem', cursor: 'pointer', color: '#ff7b72', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {node.data.label as string}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setDiagnosticNodeId(node.id); }} style={{ background: 'none', border: 'none', color: '#ff7b72', cursor: 'pointer', padding: '2px', display: 'flex' }} title="View diagnostics">
                            <AlertCircle size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Cycles */}
            {(() => {
              const cycles = nodes.filter(n => !n.data.isAsset && (n.data.issues as string[] | undefined)?.includes('cycle') && (n.data.label as string).toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => (a.data.label as string).localeCompare(b.data.label as string));
              if (cycles.length === 0) return null;
              return (
                <div style={{ marginBottom: '8px' }}>
                  <button onClick={() => setIsCyclesOpen(!isCyclesOpen)} style={{ width: '100%', background: 'none', border: 'none', padding: 0, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', outline: 'none' }}>
                    <h3 style={{ fontSize: '0.7rem', color: '#f85149', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={12} /> Cyclic Dependencies ({cycles.length})</h3>
                    <ChevronDown size={14} color="#f85149" style={{ transform: isCyclesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </button>
                  {isCyclesOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {cycles.map(node => (
                        <div key={node.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '4px', background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.2)' }}>
                          <div onClick={() => setSelectedNode(node.id)} style={{ fontSize: '0.8rem', cursor: 'pointer', color: '#ff7b72', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {node.data.label as string}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setDiagnosticNodeId(node.id); }} style={{ background: 'none', border: 'none', color: '#ff7b72', cursor: 'pointer', padding: '2px', display: 'flex' }} title="View diagnostics">
                            <AlertCircle size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                <div style={{ marginBottom: '8px' }}>
                  <button onClick={() => setIsValidOpen(!isValidOpen)} style={{ width: '100%', background: 'none', border: 'none', padding: 0, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', outline: 'none' }}>
                    <h3 style={{ fontSize: '0.7rem', color: '#3fb950', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> Healthy Skills ({healthy.length})</h3>
                    <ChevronDown size={14} color="#3fb950" style={{ transform: isValidOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </button>
                  {isValidOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {healthy.map(node => (
                        <div key={node.id} onClick={() => setSelectedNode(node.id)} style={{ padding: '6px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', color: 'var(--foreground)', border: '1px solid rgba(255,255,255,0.05)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                          {node.data.label as string}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
            </>
          )}
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
                  
                  {isFocusModalOpen && selectedNodeId && (
                    <DependencyListModal
                      isOpen={isFocusModalOpen}
                      onClose={() => setIsFocusModalOpen(false)}
                      selectedNodeId={selectedNodeId}
                    />
                  )}
                  <button 
                    onClick={() => setIsFocusModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'rgba(88, 166, 255, 0.1)',
                      color: '#58a6ff',
                      border: '1px solid rgba(88, 166, 255, 0.2)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginTop: '8px'
                    }}
                  >
                    <Network size={14} /> View Mapping List
                  </button>

                  {/* AI Integration */}
                  <div style={{ marginTop: '8px' }}>
                    <button 
                      onClick={handleAIAnalyze}
                      disabled={aiLoading}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #238636, #2ea043)',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        cursor: aiLoading ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        opacity: aiLoading ? 0.7 : 1,
                        transition: 'opacity 0.2s',
                        boxShadow: '0 4px 12px rgba(35, 134, 54, 0.3)'
                      }}
                    >
                      {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {aiLoading ? 'Analyzing Skill...' : 'Analyze Skill with AI'}
                    </button>
                    
                    {aiError && (
                      <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(248, 81, 73, 0.1)', color: '#ff7b72', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid rgba(248, 81, 73, 0.2)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ lineHeight: '1.4' }}>{aiError}</div>
                      </div>
                    )}

                    {aiSuggestion && (
                      <div style={{ marginTop: '12px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#58a6ff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sparkles size={14} /> AI Suggestions
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#c9d1d9', lineHeight: '1.5', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-geist-mono), monospace' }}>
                          {aiSuggestion}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Meta Information / Metrics */}
                  {node.data.metrics && (
                    <div style={{ marginTop: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '12px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8b949e', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Meta Information</span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: '0.65rem', color: '#8b949e', textTransform: 'uppercase', marginBottom: '2px' }}>Lines</div>
                          <div style={{ fontSize: '1rem', color: '#c9d1d9', fontWeight: 600 }}>{(node.data.metrics as any).lines}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: '0.65rem', color: '#8b949e', textTransform: 'uppercase', marginBottom: '2px' }}>Words</div>
                          <div style={{ fontSize: '1rem', color: '#c9d1d9', fontWeight: 600 }}>{(node.data.metrics as any).words}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: '0.65rem', color: '#8b949e', textTransform: 'uppercase', marginBottom: '2px' }}>Tokens</div>
                          <div style={{ fontSize: '1rem', color: '#c9d1d9', fontWeight: 600 }}>~{(node.data.metrics as any).tokens}</div>
                        </div>
                      </div>

                      {/* Suggestions for improvement */}
                      {(node.data.metrics as any).tokens > 5000 || (node.data.metrics as any).lines > 800 ? (
                        <div style={{ background: 'rgba(210, 153, 34, 0.1)', border: '1px solid rgba(210, 153, 34, 0.2)', padding: '8px 10px', borderRadius: '4px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <AlertCircle size={14} color="#d29922" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ fontSize: '0.75rem', color: '#d29922', lineHeight: '1.4' }}>
                            <strong>Needs Improvement:</strong> This skill is too large. Anthropic guidelines strongly recommend highly atomic, composable skills. Consider splitting this into multiple smaller skills to improve agent reliability.
                          </div>
                        </div>
                      ) : (node.data.metrics as any).lines < 10 ? (
                        <div style={{ background: 'rgba(88, 166, 255, 0.1)', border: '1px solid rgba(88, 166, 255, 0.2)', padding: '8px 10px', borderRadius: '4px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <AlertCircle size={14} color="#58a6ff" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ fontSize: '0.75rem', color: '#58a6ff', lineHeight: '1.4' }}>
                            <strong>Stub Skill:</strong> This skill is exceptionally short. Ensure it contains enough explicit instructions for the agent to execute it properly.
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: 'rgba(46, 160, 67, 0.1)', border: '1px solid rgba(46, 160, 67, 0.2)', padding: '8px 10px', borderRadius: '4px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <Activity size={14} color="#3fb950" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ fontSize: '0.75rem', color: '#3fb950', lineHeight: '1.4' }}>
                            <strong>Optimal Size:</strong> This skill falls within the ideal token limits for maximum agentic reliability.
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '8px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8b949e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Locations ({1 + (node.data.duplicatePaths as string[] || []).length})</div>
                    <div style={{ fontSize: '0.75rem', color: '#c9d1d9', wordBreak: 'break-all', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#58a6ff', flexShrink: 0 }}>•</span>
                        <span>{node.data.path as string}</span>
                      </div>
                      {(node.data.duplicatePaths as string[] || []).map((p, i) => (
                        <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ color: '#58a6ff', flexShrink: 0 }}>•</span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
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

      <section style={{ marginTop: '24px', borderTop: '1px solid var(--panel-border)', paddingTop: '16px' }}>
        <button 
          onClick={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)} 
          style={{ width: '100%', background: 'none', border: 'none', padding: 0, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', outline: 'none' }}
        >
          <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <Activity size={14} /> Diagnostics
          </h2>
          <ChevronDown size={14} color="#8b949e" style={{ transform: isDiagnosticsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </button>
        {isDiagnosticsOpen && (
          <>
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

        </>
        )}
      </section>



      {isPRModalOpen && (
        <PRModal repoUrl={githubUrl} onClose={() => setIsPRModalOpen(false)} />
      )}
      
      {diagnosticNodeId && (
        <DiagnosticModal node={nodes.find(n => n.id === diagnosticNodeId)!} onClose={() => setDiagnosticNodeId(null)} />
      )}
      
      {isAISettingsOpen && (
        <AISettingsModal onClose={() => setIsAISettingsOpen(false)} />
      )}

      {isAboutOpen && (
        <AboutModal onClose={() => setIsAboutOpen(false)} />
      )}

      {isHelpOpen && (
        <HelpModal onClose={() => setIsHelpOpen(false)} />
      )}

      {/* Footer Links */}
      <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
        <button 
          onClick={() => setIsHelpOpen(true)}
          style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'color 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#c9d1d9'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#8b949e'}
        >
          <HelpCircle size={14} /> How to Use
        </button>
        <button 
          onClick={() => setIsAboutOpen(true)}
          style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'color 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#c9d1d9'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#8b949e'}
        >
          <Info size={14} /> About Skill Atlas
        </button>
      </div>
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
