import { X, Info, Shield, Code, Globe } from 'lucide-react';

export default function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div style={{
        background: '#161b22', width: '550px', borderRadius: '12px', border: '1px solid #30363d',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #30363d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#e6edf3' }}>
            <Info size={18} color="#58a6ff" />
            About Skill Atlas
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh', color: '#c9d1d9', fontSize: '0.9rem', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '16px' }}>
            <strong>Skill Atlas</strong> is a visual IDE and diagnostic tool built specifically for agentic codebases. It parses Markdown-based skill libraries and renders them as an interactive dependency graph, allowing you to visualize and edit how your autonomous agents are wired together.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Shield size={20} color="#3fb950" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#e6edf3', display: 'block', marginBottom: '4px' }}>100% Client-Side & Private</strong>
                Skill Atlas operates completely within your browser. We do not have a backend database. When you ingest a local folder or a GitHub repository, all parsing and graph rendering happens locally on your machine. Your proprietary skills never leave your computer.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Code size={20} color="#d29922" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#e6edf3', display: 'block', marginBottom: '4px' }}>Open Source</strong>
                The entire Skill Atlas engine is open-source. You can inspect the parser, the React Flow layout engine, and the Monaco Editor integration directly on <a href="https://github.com/revanthpobala/skill-atlas" target="_blank" rel="noopener noreferrer" style={{ color: '#58a6ff', textDecoration: 'none' }}>GitHub</a>.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Globe size={20} color="#a371f7" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#e6edf3', display: 'block', marginBottom: '4px' }}>Bring Your Own Key (BYOK) AI</strong>
                Our AI analyzer runs entirely in the browser. By inputting your own API key in the settings, Skill Atlas contacts OpenAI or Anthropic directly from your client. We do not proxy your keys or log your prompts.
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.02)' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #30363d', background: 'transparent', color: '#c9d1d9', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Close</button>
        </div>
      </div>
    </div>
  );
}
