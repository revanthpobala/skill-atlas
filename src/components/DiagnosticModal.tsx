'use client';

import { X, AlertCircle, RefreshCw, Info, Activity } from 'lucide-react';
import { Node as XYNode } from '@xyflow/react';

export default function DiagnosticModal({ node, onClose }: { node: XYNode; onClose: () => void }) {
  const issues = (node.data.issues as string[]) || [];
  const validationErrors = (node.data.validationErrors as any[]) || [];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#0d1117', border: '1px solid var(--panel-border)',
        borderRadius: '12px', width: '500px', maxWidth: '90vw',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--font-sans)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--panel-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--foreground)' }}>
            <Activity size={18} color="#58a6ff" />
            Diagnostic Report
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--foreground)', marginBottom: '4px' }}>{node.data.label as string}</h3>
            <p style={{ fontSize: '0.85rem', color: '#8b949e', margin: 0 }}>{node.data.path as string}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {issues.includes('error') && (
              <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.3)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff7b72', fontSize: '0.9rem', margin: '0 0 12px 0', fontWeight: 600 }}>
                  <AlertCircle size={16} /> Schema Validation Failed
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#ff7b72', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {validationErrors.map((err: any, idx: number) => (
                    <li key={idx}><strong>{err.path || 'Root'}:</strong> {err.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {issues.includes('cycle') && (
              <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.3)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff7b72', fontSize: '0.9rem', margin: '0 0 8px 0', fontWeight: 600 }}>
                  <RefreshCw size={16} /> Cyclic Dependency Detected
                </h4>
                <p style={{ color: '#ff7b72', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                  This skill is caught in an infinite loop. It explicitly depends on another skill (via frontmatter or markdown link), which in turn explicitly depends back on this skill. 
                  <br /><br />
                  <strong>How to fix:</strong> Trace the red animated edges in the graph and remove the circular reference.
                </p>
              </div>
            )}

            {issues.includes('orphan') && (
              <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(210, 153, 34, 0.1)', border: '1px solid rgba(210, 153, 34, 0.3)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d29922', fontSize: '0.9rem', margin: '0 0 8px 0', fontWeight: 600 }}>
                  <Info size={16} /> Orphan Skill
                </h4>
                <p style={{ color: '#d29922', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                  This skill is loaded in the workspace, but no other skill explicitly references it, nor does it reference any other skills. It exists in complete isolation.
                  <br /><br />
                  <strong>Recommendation:</strong> If this is intended as a standalone entry point, you can ignore this warning. Otherwise, link it to related skills.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
