'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, AlertCircle, Loader2, Send, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchAIChat } from '@/lib/ai';
import { useGraphStore } from '@/store/graphStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAnalysisModal({ 
  isOpen, 
  onClose, 
  skillName,
  nodeId,
  nodeContent
}: { 
  isOpen: boolean;
  onClose: () => void;
  skillName: string;
  nodeId: string;
  nodeContent: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const updateNodeContent = useGraphStore(state => state.updateNodeContent);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initial Analysis on mount
  useEffect(() => {
    if (isOpen && messages.length === 0 && !loading && !hasStartedRef.current) {
      hasStartedRef.current = true;
      runInitialAnalysis();
    }
  }, [isOpen]);

  const runInitialAnalysis = async () => {
    setLoading(true);
    setError(null);
    const initialPrompt = `Analyze this agentic skill code. Briefly describe what it does, highlight any potential infinite loop or atomicity issues, and propose a clean, specific refactoring if needed. Keep your response concise, using markdown for formatting and code blocks.\n\n\`\`\`\n${nodeContent}\n\`\`\``;
    
    // Optimistically add user prompt to history but don't show the massive code dump in UI
    const updatedMessages: Message[] = [{ role: 'user', content: initialPrompt }, { role: 'assistant', content: '' }];
    setMessages(updatedMessages);

    try {
      await fetchAIChat([{ role: 'user', content: initialPrompt }], (chunk) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIdx = newMessages.length - 1;
          newMessages[lastIdx] = {
            ...newMessages[lastIdx],
            content: newMessages[lastIdx].content + chunk
          };
          return newMessages;
        });
      });
    } catch (e: any) {
      setError(e.message || 'An error occurred during AI analysis.');
      setMessages(prev => prev.slice(0, -1)); // Remove the empty assistant message
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    // Provide context of the current code if the user is asking a follow up
    const contextPrompt = `(Current file state for context:\n\`\`\`\n${nodeContent}\n\`\`\`)\n\n${userMsg}`;
    
    const newHistory: Message[] = [...messages, { role: 'user', content: userMsg }];
    const historyForAPI = [...messages, { role: 'user', content: contextPrompt }];
    
    setMessages([...newHistory, { role: 'assistant', content: '' }]);

    try {
      await fetchAIChat(historyForAPI, (chunk) => {
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: updated[lastIdx].content + chunk
          };
          return updated;
        });
      });
    } catch (e: any) {
      setError(e.message || 'An error occurred during AI request.');
      setMessages(prev => prev.slice(0, -1)); // Remove the empty assistant message
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#0d1117', border: '1px solid var(--panel-border)',
        borderRadius: '12px', width: '800px', maxWidth: '90vw', height: '85vh',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--font-sans)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--panel-border)', background: '#010409', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#58a6ff' }}>
            <Sparkles size={18} />
            AI Copilot: {skillName}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex' }} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Chat Log */}
        <div className="custom-scrollbar" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', flex: 1, background: '#0d1117' }}>
          {messages.map((msg, idx) => {
            // Hide the massive initial context prompt from the UI to keep it clean
            if (idx === 0 && msg.role === 'user') return null;

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '90%',
                  background: msg.role === 'user' ? 'rgba(88, 166, 255, 0.1)' : 'transparent',
                  border: msg.role === 'user' ? '1px solid rgba(88, 166, 255, 0.2)' : 'none',
                  padding: msg.role === 'user' ? '12px 16px' : '0',
                  borderRadius: '8px',
                  color: '#c9d1d9',
                  fontSize: '0.9rem',
                  lineHeight: '1.6'
                }}>
                  {msg.role === 'user' ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  ) : (
                    <div className="markdown-body">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({node, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '');
                            const isCodeBlock = String(children).includes('\\n');
                            
                            if (!isCodeBlock) {
                              return <code className={className} {...props}>{children}</code>;
                            }

                            const codeContent = String(children).replace(/\\n$/, '');

                            return (
                              <div style={{ position: 'relative', marginTop: '16px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161b22', padding: '8px 12px', borderTopLeftRadius: '6px', borderTopRightRadius: '6px', border: '1px solid #30363d', borderBottom: 'none' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#8b949e', textTransform: 'uppercase' }}>{match ? match[1] : 'code'}</span>
                                  <button
                                    onClick={() => updateNodeContent(nodeId, codeContent)}
                                    style={{
                                      background: 'rgba(35, 134, 54, 0.2)',
                                      color: '#3fb950',
                                      border: '1px solid rgba(35, 134, 54, 0.4)',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.7rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(35, 134, 54, 0.3)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(35, 134, 54, 0.2)'}
                                  >
                                    <Check size={12} /> Apply to Editor
                                  </button>
                                </div>
                                <code className={className} style={{ display: 'block', padding: '16px', background: '#010409', border: '1px solid #30363d', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px', overflowX: 'auto' }} {...props}>
                                  {children}
                                </code>
                              </div>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && messages[messages.length - 1]?.role === 'user' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e', fontSize: '0.85rem' }}>
              <Loader2 size={14} className="animate-spin" /> Thinking...
            </div>
          )}

          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(248, 81, 73, 0.1)', color: '#ff7b72', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid rgba(248, 81, 73, 0.2)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ lineHeight: '1.5' }}>{error}</div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--panel-border)', background: '#161b22', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
              placeholder="Ask AI to explain or refactor..."
              disabled={loading}
              style={{
                flex: 1,
                background: '#0d1117',
                border: '1px solid #30363d',
                color: '#c9d1d9',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'var(--font-sans)'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() && !loading ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                color: input.trim() && !loading ? '#fff' : '#8b949e',
                border: 'none',
                padding: '0 16px',
                borderRadius: '8px',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
