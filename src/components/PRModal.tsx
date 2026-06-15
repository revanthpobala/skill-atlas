'use client';

import { useState } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { X, GitPullRequest, Loader2 } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';

const GithubIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export default function PRModal({ 
  repoUrl, 
  onClose 
}: { 
  repoUrl: string; 
  onClose: () => void;
}) {
  const stagedChanges = useGraphStore(state => state.stagedChanges);
  const { data: session, status } = useSession();
  
  const [title, setTitle] = useState('Update Skills via Skill Atlas Editor');
  const [branchName, setBranchName] = useState(`update-skills-${Date.now()}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          title,
          branchName,
          stagedChanges
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Pull Request');
      }

      setSuccessUrl(data.url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create Pull Request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fileCount = Object.keys(stagedChanges).length;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#0d1117',
        border: '1px solid var(--panel-border)',
        borderRadius: '12px',
        width: '450px',
        maxWidth: '90vw',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--panel-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--foreground)' }}>
            <GitPullRequest size={18} color="#58a6ff" />
            Create Pull Request
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {status === 'loading' ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Loader2 size={24} className="animate-spin" color="#8b949e" /></div>
          ) : !session ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 0' }}>
              <div style={{ color: '#8b949e', fontSize: '0.9rem', textAlign: 'center' }}>
                You must authenticate with GitHub to create a Pull Request.
              </div>
              <button 
                onClick={() => signIn('github')}
                style={{
                  background: '#238636',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <GithubIcon size={18} />
                Sign in with GitHub
              </button>
            </div>
          ) : successUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 0' }}>
              <div style={{ color: '#3fb950', fontSize: '1.2rem', fontWeight: 600 }}>Pull Request Created!</div>
              <a href={successUrl} target="_blank" rel="noopener noreferrer" style={{
                background: '#238636',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600
              }}>
                View on GitHub
              </a>
            </div>
          ) : (
            <>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>
                You are about to commit <strong>{fileCount} modified file{fileCount !== 1 ? 's' : ''}</strong> as <span style={{ color: 'var(--foreground)' }}>{session.user?.name || session.user?.email}</span>.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#8b949e', fontWeight: 600 }}>PR Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ background: '#010409', border: '1px solid var(--panel-border)', padding: '8px 12px', borderRadius: '6px', color: '#fff', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#8b949e', fontWeight: 600 }}>Branch Name</label>
                <input 
                  type="text" 
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  style={{ background: '#010409', border: '1px solid var(--panel-border)', padding: '8px 12px', borderRadius: '6px', color: '#fff', outline: 'none' }}
                />
              </div>

              {error && (
                <div style={{ color: '#f85149', fontSize: '0.8rem', padding: '8px', background: 'rgba(248, 81, 73, 0.1)', borderRadius: '6px', border: '1px solid rgba(248, 81, 73, 0.4)' }}>
                  {error}
                </div>
              )}

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !title || !branchName}
                style={{
                  background: '#238636',
                  color: '#fff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: (isSubmitting || !title || !branchName) ? 'not-allowed' : 'pointer',
                  opacity: (isSubmitting || !title || !branchName) ? 0.6 : 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px'
                }}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <GitPullRequest size={16} />}
                {isSubmitting ? 'Pushing Commit & Creating PR...' : 'Create Pull Request'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
