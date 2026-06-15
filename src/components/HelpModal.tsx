import { X, HelpCircle, GitBranch, PenLine, Cpu, Search, Sparkles } from 'lucide-react';

export default function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div style={{
        background: '#161b22', width: '600px', borderRadius: '12px', border: '1px solid #30363d',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #30363d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#e6edf3' }}>
            <HelpCircle size={18} color="#58a6ff" />
            How to Use Skill Atlas
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh', color: '#c9d1d9', fontSize: '0.9rem', lineHeight: '1.6' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <GitBranch size={20} color="#3fb950" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#e6edf3', display: 'block', marginBottom: '4px' }}>1. Ingestion & Visualizing</strong>
                Paste your GitHub repository URL into the ingestion bar and click <strong>Ingest</strong>. Skill Atlas will securely fetch, parse, and render all your agentic markdown skills as an interactive map. Scroll to zoom and drag to pan. Click any skill node to view its contents in the Editor.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <PenLine size={20} color="#d29922" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#e6edf3', display: 'block', marginBottom: '4px' }}>2. Editing & Committing</strong>
                When you click a node, switch to the <strong>Edit</strong> tab in the IDE panel to modify the skill's logic. Modified skills will glow <span style={{ color: '#d29922', fontWeight: 'bold' }}>yellow</span> in the graph. Once you are done making changes, use the <strong>Staged Changes</strong> box in the Sidebar to review and automatically create a Pull Request.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Sparkles size={20} color="#a371f7" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#e6edf3', display: 'block', marginBottom: '4px' }}>3. AI Assistance</strong>
                Click the Gear icon in the top left to configure your API key (stored locally). In Edit mode, type instructions into the floating command bar (e.g. "Refactor this logic") to have the AI write code live into the editor. You can also analyze nodes for architecture bottlenecks from the <strong>Node Context</strong> menu.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Search size={20} color="#58a6ff" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#e6edf3', display: 'block', marginBottom: '4px' }}>4. Navigation Shortcuts</strong>
                Press <kbd style={{ background: '#30363d', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid #484f58' }}>Cmd</kbd> + <kbd style={{ background: '#30363d', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid #484f58' }}>K</kbd> to open the global fuzzy finder to jump directly to any skill. Click the target icon next to a skill's name in the index to immediately focus the camera on it.
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.02)' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', background: '#238636', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Got it</button>
        </div>
      </div>
    </div>
  );
}
