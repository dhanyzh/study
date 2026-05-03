'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { useAI } from '@/hooks/useAI';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';

const Mermaid = ({ chart }) => {
  const [svg, setSvg] = useState('');
  // Use React's stable per-component ID to avoid collisions (and avoid Math.random during render).
  const reactId = useId();
  const id = useRef(`mermaid-${String(reactId).replace(/[:]/g, '')}`);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: false, 
      theme: 'dark',
      fontFamily: 'Inter, sans-serif'
    });
    
    // Only render if we have chart content
    if (chart) {
      mermaid.render(id.current, chart).then((result) => {
        setSvg(result.svg);
      }).catch(e => {
        console.error('Mermaid render error:', e);
        setSvg(`<div style="color:var(--danger); padding:10px; border:1px solid var(--danger); border-radius:4px;">Mermaid Syntax Error</div>`);
      });
    }
  }, [chart]);

  return <span className="mermaid-wrapper" style={{ display: 'block' }} dangerouslySetInnerHTML={{ __html: svg }} />;
};

export default function AIPanel({ context }) {
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearChat } = useAI();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const msg = input;
    setInput('');
    sendMessage(msg, context);
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <span>✨</span> StudyBot
        </div>
        <button 
          onClick={clearChat} 
          className="btn btn-sm" 
          style={{ background: 'transparent', border: '1px solid var(--border)', fontSize: '0.7rem' }}
          title="Clear Chat"
        >
          Clear
        </button>
      </div>

      <div className="ai-panel-messages">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px', fontSize: '0.85rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👋</div>
            <p>Hi! I&apos;m your AI study assistant.</p>
            <p style={{ marginTop: '10px' }}>Ask me to explain concepts, generate charts, solve doubts, or summarize notes.</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ${msg.role}`}>
            {msg.role === 'assistant' && <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px', fontWeight: 'bold' }}>StudyBot</div>}
            
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match && match[1] === 'mermaid') {
                      return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                    }
                    return !inline ? (
                      <span style={{ display: 'block', background: '#1e1e2e', padding: '12px', borderRadius: '6px', overflowX: 'auto', marginTop: '8px', marginBottom: '8px' }}>
                        <code className={className} {...props}>{children}</code>
                      </span>
                    ) : (
                      <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', fontSize: '0.85em' }} className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
            
          </div>
        ))}
        
        {isLoading && (
          <div className="ai-message assistant">
            <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="ai-panel-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ask for graphs, tables, or math..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          ↑
        </button>
      </form>
    </div>
  );
}
