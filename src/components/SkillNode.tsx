import { Handle, Position } from '@xyflow/react';
import { FileText, AlertCircle, RefreshCw, PenLine, Code2, CheckCircle2 } from 'lucide-react';

export default function SkillNode({ data }: any) {
  const isOrphan = data.issues?.includes('orphan');
  const hasError = data.issues?.includes('error');
  const hasCycle = data.issues?.includes('cycle');
  const isModified = data.isModified;
  const assetCount = data.assets?.length || 0;
  const inDegree = data.inDegree || 0;
  const isCore = inDegree >= 2;

  const isHealthy = !hasError && !hasCycle && !isOrphan && !isModified;

  const getBorderColor = () => {
    if (isModified) return '#d29922';
    if (hasCycle || hasError) return '#f85149';
    if (isOrphan) return '#d29922';
    return '#238636'; // GitHub green
  };

  const getBoxShadow = () => {
    if (isModified || isOrphan) return '0 0 16px rgba(210, 153, 34, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)';
    if (hasCycle || hasError) return '0 0 16px rgba(248, 81, 73, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)';
    if (isCore) return '0 0 24px rgba(88, 166, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)';
    if (isHealthy) return '0 0 16px rgba(35, 134, 54, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)';
    return '0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)';
  };

  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: '12px',
      background: 'linear-gradient(145deg, #1e242c, #161b22)',
      border: `1px solid ${getBorderColor()}`,
      boxShadow: getBoxShadow(),
      color: 'var(--foreground)',
      width: '280px',
      height: '120px',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      boxSizing: 'border-box'
    }}
    className={`skill-node-container ${isModified ? 'node-modified' : ''}`}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#8b949e', border: 'none', width: '8px', height: '8px' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ 
          padding: '6px', 
          borderRadius: '8px', 
          background: (isModified || isOrphan) ? 'rgba(210, 153, 34, 0.1)' : (hasCycle || hasError) ? 'rgba(248, 81, 73, 0.1)' : 'rgba(35, 134, 54, 0.1)',
          color: (isModified || isOrphan) ? '#d29922' : (hasCycle || hasError) ? '#f85149' : '#3fb950',
          display: 'flex'
        }}>
          <FileText size={16} />
        </div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '-0.01em', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{data.label}</span>
          {isCore && (
            <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: 'rgba(88, 166, 255, 0.15)', color: '#79c0ff', borderRadius: '12px', border: '1px solid rgba(88, 166, 255, 0.3)', fontWeight: 700, letterSpacing: '0.05em' }}>
              CORE
            </span>
          )}
        </div>
        {isModified && (
          <div title="Uncommitted changes" style={{ color: '#d29922', display: 'flex' }}>
            <PenLine size={14} />
          </div>
        )}
      </div>

      {data.description && (
        <div style={{ fontSize: '0.75rem', color: '#8b949e', lineHeight: 1.4, marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {data.description}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: getBorderColor() }}>
          {hasCycle && <><RefreshCw size={12} /> <span>Cyclic Dependency</span></>}
          {hasError && !hasCycle && <><AlertCircle size={12} /> <span>Validation Error</span></>}
          {isOrphan && !hasCycle && !hasError && <><AlertCircle size={12} /> <span>Orphan Skill</span></>}
          {isHealthy && <><CheckCircle2 size={12} color="#3fb950" /> <span style={{ color: '#3fb950' }}>Valid Skill</span></>}
        </div>
        
        {assetCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#8b949e', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
            <Code2 size={10} />
            <span>{assetCount} Asset{assetCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={{ background: (hasCycle || hasError) ? '#f85149' : (isModified || isOrphan) ? '#d29922' : '#238636', border: 'none', width: '8px', height: '8px' }} />
    </div>
  );
}
