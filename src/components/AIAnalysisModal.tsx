'use client';

import { X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AIAnalysisModal({ 
  isOpen, 
  onClose, 
  skillName,
  aiSuggestion,
  aiLoading,
  aiError
}: { 
  isOpen: boolean;
  onClose: () => void;
  skillName: string;
  aiSuggestion: string | null;
  aiLoading: boolean;
  aiError: string | null;
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#0d1117', border: '1px solid var(--panel-border)',
        borderRadius: '12px', width: '700px', maxWidth: '90vw', maxHeight: '85vh',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--font-sans)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--panel-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#58a6ff' }}>
            <Sparkles size={18} />
            AI Analysis: {skillName}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="custom-scrollbar" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
          {aiLoading && !aiSuggestion && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#8b949e', padding: '40px 0' }}>
              <Loader2 size={32} className="animate-spin" />
              <p>Analyzing skill dependencies and logic...</p>
            </div>
          )}

          {aiError && (
             <div style={{ padding: '12px 16px', background: 'rgba(248, 81, 73, 0.1)', color: '#ff7b72', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid rgba(248, 81, 73, 0.2)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
               <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
               <div style={{ lineHeight: '1.5' }}>{aiError}</div>
             </div>
          )}

          {aiSuggestion && (
            <div className="markdown-body" style={{ color: '#c9d1d9', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiSuggestion}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
