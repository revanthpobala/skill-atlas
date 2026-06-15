'use client';

import { useEffect, useState, useRef } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { Search, ChevronRight, Activity } from 'lucide-react';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const nodes = useGraphStore(state => state.nodes);
  const setSelectedNode = useGraphStore(state => state.setSelectedNode);

  const skills = nodes.filter(n => !n.data.isAsset);
  
  const filteredSkills = query === '' 
    ? [] 
    : skills.filter(n => 
        (n.data.label as string).toLowerCase().includes(query.toLowerCase()) || 
        (n.data.description as string)?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10); // Limit to 10 results

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
    setIsOpen(false);
  };

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredSkills.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && filteredSkills.length > 0) {
      e.preventDefault();
      handleSelect(filteredSkills[selectedIndex].id);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="command-palette-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh'
      }}
      onClick={(e) => {
        if ((e.target as HTMLDivElement).className === 'command-palette-backdrop') {
          setIsOpen(false);
        }
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '600px',
          background: 'rgba(22, 27, 34, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onKeyDown={handleModalKeyDown}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Search size={20} color="#8b949e" style={{ marginRight: '12px' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search skills (e.g., gl-recon)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#c9d1d9',
              fontSize: '1.2rem'
            }}
          />
          <div style={{ fontSize: '0.7rem', color: '#8b949e', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>ESC to close</div>
        </div>

        {filteredSkills.length > 0 && (
          <div style={{ padding: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {filteredSkills.map((node, i) => (
              <div
                key={node.id}
                onClick={() => handleSelect(node.id)}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  background: selectedIndex === i ? 'rgba(88, 166, 255, 0.15)' : 'transparent',
                  color: selectedIndex === i ? '#58a6ff' : '#c9d1d9',
                  transition: 'background 0.1s ease'
                }}
              >
                <Activity size={16} style={{ marginRight: '12px', color: selectedIndex === i ? '#58a6ff' : '#8b949e' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{node.data.label as string}</div>
                  {(node.data.description as string) && (
                    <div style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {node.data.description as string}
                    </div>
                  )}
                </div>
                {selectedIndex === i && <ChevronRight size={16} color="#58a6ff" />}
              </div>
            ))}
          </div>
        )}
        
        {query !== '' && filteredSkills.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#8b949e', fontSize: '0.9rem' }}>
            No skills found matching "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
