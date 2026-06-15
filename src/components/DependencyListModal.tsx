import { useGraphStore } from '@/store/graphStore';
import { X, Network, ArrowRight, ArrowLeft, Database, Boxes } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DependencyListModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNodeId: string;
}

export default function DependencyListModal({ isOpen, onClose, selectedNodeId }: DependencyListModalProps) {
  const nodes = useGraphStore(state => state.nodes);
  const edges = useGraphStore(state => state.edges);
  const setSelectedNode = useGraphStore(state => state.setSelectedNode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setMounted(true), 10);
    } else {
      setMounted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const node = nodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  const incoming = edges
    .filter(e => e.target === selectedNodeId)
    .map(e => nodes.find(n => n.id === e.source))
    .filter(Boolean) as typeof nodes;

  const outgoing = edges
    .filter(e => e.source === selectedNodeId)
    .map(e => nodes.find(n => n.id === e.target))
    .filter(Boolean) as typeof nodes;

  const uniqueIncoming = Array.from(new Map(incoming.map(n => [n.id, n])).values());
  const uniqueOutgoing = Array.from(new Map(outgoing.map(n => [n.id, n])).values());

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(12px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.3s ease'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, rgba(22, 27, 34, 0.95), rgba(13, 17, 23, 0.98))',
        border: '1px solid rgba(88, 166, 255, 0.2)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '900px',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset',
        transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'transparent',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(88, 166, 255, 0.5), transparent)' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: '10px', 
              background: 'linear-gradient(135deg, #1f6feb, #3b82f6)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
            }}>
              <Network size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '2px' }}>
                Dependency Mapping
              </div>
              <div style={{ fontSize: '1.4rem', color: '#ffffff', fontWeight: 700, letterSpacing: '-0.02em' }}>
                {node.data.label as string}
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#c9d1d9',
              cursor: 'pointer',
              display: 'flex',
              padding: '8px',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'rotate(90deg)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#c9d1d9';
              e.currentTarget.style.transform = 'rotate(0deg)';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: 'rgba(13, 17, 23, 0.3)' }}>
          
          {/* Incoming Column */}
          <div style={{ width: '50%', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              padding: '20px 32px', 
              background: 'linear-gradient(to right, rgba(46, 160, 67, 0.05), transparent)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3fb950', fontWeight: 600, letterSpacing: '0.02em' }}>
                <ArrowRight size={18} /> 
                <span>Incoming Dependencies</span>
              </div>
              <div style={{ background: 'rgba(46, 160, 67, 0.15)', color: '#3fb950', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                {uniqueIncoming.length}
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }} className="custom-scrollbar">
              {uniqueIncoming.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8b949e', gap: '12px' }}>
                  <Database size={32} opacity={0.3} />
                  <span style={{ fontSize: '0.9rem' }}>No incoming dependencies</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {uniqueIncoming.map((n, i) => (
                    <button
                      key={n.id}
                      onClick={() => { setSelectedNode(n.id); onClose(); }}
                      style={{
                        background: 'linear-gradient(145deg, rgba(35, 134, 54, 0.05), rgba(22, 27, 34, 0.4))',
                        border: '1px solid rgba(46, 160, 67, 0.2)',
                        borderLeft: '4px solid #3fb950',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        transform: 'translateY(0)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        animation: `slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both`
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(46, 160, 67, 0.4) inset';
                        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(35, 134, 54, 0.1), rgba(22, 27, 34, 0.6))';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(35, 134, 54, 0.05), rgba(22, 27, 34, 0.4))';
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: '#ffffff' }}>{n.data.label as string}</div>
                      <div style={{ color: '#8b949e', fontSize: '0.85rem', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {n.data.description as string || n.data.path as string}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Outgoing Column */}
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              padding: '20px 32px', 
              background: 'linear-gradient(to right, rgba(88, 166, 255, 0.05), transparent)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#58a6ff', fontWeight: 600, letterSpacing: '0.02em' }}>
                <ArrowLeft size={18} /> 
                <span>Outgoing Dependencies</span>
              </div>
              <div style={{ background: 'rgba(88, 166, 255, 0.15)', color: '#58a6ff', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                {uniqueOutgoing.length}
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }} className="custom-scrollbar">
              {uniqueOutgoing.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8b949e', gap: '12px' }}>
                  <Boxes size={32} opacity={0.3} />
                  <span style={{ fontSize: '0.9rem' }}>No outgoing dependencies</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {uniqueOutgoing.map((n, i) => (
                    <button
                      key={n.id}
                      onClick={() => { setSelectedNode(n.id); onClose(); }}
                      style={{
                        background: 'linear-gradient(145deg, rgba(31, 111, 235, 0.05), rgba(22, 27, 34, 0.4))',
                        border: '1px solid rgba(88, 166, 255, 0.2)',
                        borderLeft: '4px solid #58a6ff',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        transform: 'translateY(0)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        animation: `slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s both`
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(88, 166, 255, 0.4) inset';
                        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(31, 111, 235, 0.1), rgba(22, 27, 34, 0.6))';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(31, 111, 235, 0.05), rgba(22, 27, 34, 0.4))';
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: '#ffffff' }}>{n.data.label as string}</div>
                      <div style={{ color: '#8b949e', fontSize: '0.85rem', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {n.data.description as string || n.data.path as string}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
