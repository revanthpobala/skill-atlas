import { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { X, Settings2, Key, Globe, Cpu, AlertCircle } from 'lucide-react';

export default function AISettingsModal({ onClose }: { onClose: () => void }) {
  const store = useSettingsStore();

  const [provider, setProvider] = useState(store.aiProvider);
  const [openaiKey, setOpenaiKey] = useState(store.openaiKey);
  const [openaiModel, setOpenaiModel] = useState(store.openaiModel);
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState(store.openaiBaseUrl);
  const [anthropicKey, setAnthropicKey] = useState(store.anthropicKey);
  const [anthropicModel, setAnthropicModel] = useState(store.anthropicModel);
  const [anthropicBaseUrl, setAnthropicBaseUrl] = useState(store.anthropicBaseUrl);
  const [geminiKey, setGeminiKey] = useState(store.geminiKey);
  const [geminiModel, setGeminiModel] = useState(store.geminiModel);
  const [geminiBaseUrl, setGeminiBaseUrl] = useState(store.geminiBaseUrl);

  const handleSave = () => {
    store.setAIProvider(provider);
    store.setOpenaiKey(openaiKey);
    store.setOpenaiModel(openaiModel);
    store.setOpenaiBaseUrl(openaiBaseUrl);
    store.setAnthropicKey(anthropicKey);
    store.setAnthropicModel(anthropicModel);
    store.setAnthropicBaseUrl(anthropicBaseUrl);
    store.setGeminiKey(geminiKey);
    store.setGeminiModel(geminiModel);
    store.setGeminiBaseUrl(geminiBaseUrl);
    onClose();
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid #30363d',
    color: '#c9d1d9',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    outline: 'none',
    marginTop: '6px'
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#8b949e',
    marginTop: '16px'
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div style={{
        background: '#161b22', width: '500px', borderRadius: '12px', border: '1px solid #30363d',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #30363d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#e6edf3' }}>
            <Settings2 size={18} color="#8b949e" />
            AI Provider Settings
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '70vh' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <button
              onClick={() => setProvider('openai')}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: `1px solid ${provider === 'openai' ? '#58a6ff' : '#30363d'}`,
                background: provider === 'openai' ? 'rgba(88, 166, 255, 0.1)' : 'transparent',
                color: provider === 'openai' ? '#58a6ff' : '#8b949e', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              OpenAI / Compatible
            </button>
            <button
              onClick={() => setProvider('anthropic')}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: `1px solid ${provider === 'anthropic' ? '#d29922' : '#30363d'}`,
                background: provider === 'anthropic' ? 'rgba(210, 153, 34, 0.1)' : 'transparent',
                color: provider === 'anthropic' ? '#d29922' : '#8b949e', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              Anthropic
            </button>
            <button
              onClick={() => setProvider('gemini')}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: `1px solid ${provider === 'gemini' ? '#a371f7' : '#30363d'}`,
                background: provider === 'gemini' ? 'rgba(163, 113, 247, 0.1)' : 'transparent',
                color: provider === 'gemini' ? '#a371f7' : '#8b949e', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              Gemini
            </button>
          </div>

          {provider === 'openai' && (
            <div>
              <div style={labelStyle}><Key size={14} /> API Key</div>
              <input type="password" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} placeholder="sk-..." style={inputStyle} />
              
              <div style={labelStyle}><Cpu size={14} /> Model</div>
              <input type="text" value={openaiModel} onChange={e => setOpenaiModel(e.target.value)} placeholder="gpt-4o" style={inputStyle} />
              
              <div style={labelStyle}><Globe size={14} /> Base URL</div>
              <input type="text" value={openaiBaseUrl} onChange={e => setOpenaiBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" style={inputStyle} />
            </div>
          )}

          {provider === 'anthropic' && (
            <div>
              <div style={{ padding: '12px', background: 'rgba(210, 153, 34, 0.1)', border: '1px solid rgba(210, 153, 34, 0.4)', borderRadius: '6px', color: '#d29922', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '16px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div><strong>CORS Warning:</strong> Anthropic natively blocks browser requests. You must use a CORS proxy URL in the Base URL field below, or run a browser extension to bypass CORS.</div>
              </div>

              <div style={labelStyle}><Key size={14} /> API Key</div>
              <input type="password" value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} placeholder="sk-ant-..." style={inputStyle} />
              
              <div style={labelStyle}><Cpu size={14} /> Model</div>
              <input type="text" value={anthropicModel} onChange={e => setAnthropicModel(e.target.value)} placeholder="claude-3-5-sonnet-20241022" style={inputStyle} />
              
              <div style={labelStyle}><Globe size={14} /> Base URL (CORS Proxy)</div>
              <input type="text" value={anthropicBaseUrl} onChange={e => setAnthropicBaseUrl(e.target.value)} placeholder="https://api.anthropic.com" style={inputStyle} />
            </div>
          )}

          {provider === 'gemini' && (
            <div>
              <div style={labelStyle}><Key size={14} /> API Key</div>
              <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="AIzaSy..." style={inputStyle} />
              
              <div style={labelStyle}><Cpu size={14} /> Model</div>
              <input type="text" value={geminiModel} onChange={e => setGeminiModel(e.target.value)} placeholder="gemini-flash-latest" style={inputStyle} />
              
              <div style={labelStyle}><Globe size={14} /> Base URL</div>
              <input type="text" value={geminiBaseUrl} onChange={e => setGeminiBaseUrl(e.target.value)} placeholder="https://generativelanguage.googleapis.com" style={inputStyle} />
            </div>
          )}

          <div style={{ marginTop: '24px', fontSize: '0.75rem', color: '#8b949e', textAlign: 'center' }}>
            Keys are stored securely in your browser's local storage and never sent to our servers.
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #30363d', background: 'transparent', color: '#c9d1d9', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Cancel</button>
          <button onClick={handleSave} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#238636', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
