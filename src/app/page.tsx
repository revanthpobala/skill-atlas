'use client';

import SkillGraph from '@/components/SkillGraph';
import Sidebar from '@/components/Sidebar';
import EditorPanel from '@/components/EditorPanel';
import CommandPalette from '@/components/CommandPalette';
import { useGraphStore } from '@/store/graphStore';
import { useState, useEffect } from 'react';

export default function Home() {
  const selectedNodeId = useGraphStore(state => state.selectedNodeId);
  const selectedAssetPath = useGraphStore(state => state.selectedAssetPath);
  const isEditorOpen = useGraphStore(state => state.isEditorOpen);
  const [editorWidth, setEditorWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 1200) {
        setEditorWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    } else {
      document.body.style.userSelect = 'auto';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing]);

  return (
    <main style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--background)', overflow: 'hidden' }}>
      <CommandPalette />
      <Sidebar />
      <section style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <SkillGraph />
        </div>
        {(selectedNodeId || selectedAssetPath) && isEditorOpen && (
          <>
            <div 
              style={{
                width: '6px',
                cursor: 'col-resize',
                backgroundColor: isResizing ? 'var(--accent-primary)' : 'transparent',
                transition: 'background-color 0.2s',
                zIndex: 10,
                marginLeft: '-3px',
                marginRight: '-3px'
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
              onMouseLeave={(e) => {
                if (!isResizing) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            />
            <div style={{ width: `${editorWidth}px`, borderLeft: '1px solid var(--panel-border)', height: '100%', overflow: 'hidden' }}>
              <EditorPanel />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
