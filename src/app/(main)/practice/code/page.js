'use client';
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useAuth } from '@/context/AuthContext';

export default function CodeEditor() {
  const { token } = useAuth();
  const [language, setLanguage] = useState('javascript');
  const [sourceCode, setSourceCode] = useState('// Write your JS code here\nconsole.log("Hello, Study OS!");');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const defaultCodes = {
    javascript: '// Write your JS code here\nconsole.log("Hello, Study OS!");',
    python: '# Write your Python code here\nprint("Hello, Study OS!")',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, Study OS!";\n    return 0;\n}',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Study OS!");\n    }\n}'
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setSourceCode(defaultCodes[lang] || '');
  };

  const handleRunCode = async () => {
    if (!token || !sourceCode.trim()) return;
    setIsRunning(true);
    setOutput('Running...');

    try {
      const res = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sourceCode, language })
      });
      const data = await res.json();
      
      if (res.ok) {
        setOutput(data.stdout || data.stderr || 'Code executed successfully with no output.');
      } else {
        setOutput(`Error: ${data.error}`);
      }
    } catch (err) {
      setOutput('Failed to connect to execution server.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Code Compiler</h1>
          <p>Write, compile, and run DSA code in your browser.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select className="language-select" value={language} onChange={handleLanguageChange}>
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3</option>
            <option value="cpp">C++ (GCC)</option>
            <option value="java">Java</option>
          </select>
          <button className="btn btn-primary" onClick={handleRunCode} disabled={isRunning}>
            {isRunning ? 'Running...' : '▶ Run Code'}
          </button>
        </div>
      </div>

      <div className="editor-container">
        <div className="editor-pane">
          <div className="pane-header">Editor</div>
          <div className="pane-body">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={sourceCode}
              onChange={(val) => setSourceCode(val)}
              options={{ minimap: { enabled: false }, fontSize: 14 }}
            />
          </div>
        </div>
        <div className="output-pane">
          <div className="pane-header">Output Console</div>
          <div className="pane-body">
            <div className="output-text" style={{ color: output.includes('Error') ? 'var(--danger)' : 'var(--text-primary)' }}>
              {output || 'Output will appear here...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
