'use client';
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export default function SQLEditor() {
  const [sourceCode, setSourceCode] = useState('-- Sample SQL Query\nSELECT * FROM employees;\n');
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [db, setDb] = useState(null);

  useEffect(() => {
    // Load sql.js dynamically on client side
    const loadSqlJs = async () => {
      try {
        const initSqlJs = (await import('sql.js')).default;
        const SQL = await initSqlJs({
          locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        
        const database = new SQL.Database();
        // Seed some sample data
        database.run(`
          CREATE TABLE employees (id INT, name CHAR, role CHAR, salary INT);
          INSERT INTO employees VALUES (1, 'Alice', 'Engineer', 85000);
          INSERT INTO employees VALUES (2, 'Bob', 'Manager', 95000);
          INSERT INTO employees VALUES (3, 'Charlie', 'Designer', 75000);
        `);
        setDb(database);
        setOutput({ columns: ['Ready'], values: [['SQL Engine initialized with sample table: employees']] });
      } catch (err) {
        console.error('Failed to load SQL.js', err);
        setOutput({ columns: ['Error'], values: [['Failed to load SQL engine.']] });
      }
    };
    loadSqlJs();
  }, []);

  const handleRunCode = () => {
    if (!db || !sourceCode.trim()) return;
    setIsRunning(true);
    
    try {
      // For simple SELECT queries, exec returns the result set
      const result = db.exec(sourceCode);
      if (result.length > 0) {
        setOutput(result[0]); // result[0] has columns and values
      } else {
        setOutput({ columns: ['Success'], values: [['Query executed successfully. No data returned.']] });
      }
    } catch (err) {
      setOutput({ columns: ['Error'], values: [[err.message]] });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>SQL Compiler</h1>
          <p>Practice SQL queries directly in your browser. Sample table `employees` is available.</p>
        </div>
        <button className="btn btn-primary" onClick={handleRunCode} disabled={isRunning || !db}>
          {isRunning ? 'Running...' : '▶ Run Query'}
        </button>
      </div>

      <div className="editor-container">
        <div className="editor-pane">
          <div className="pane-header">SQL Editor</div>
          <div className="pane-body">
            <Editor
              height="100%"
              language="sql"
              theme="vs-dark"
              value={sourceCode}
              onChange={(val) => setSourceCode(val)}
              options={{ minimap: { enabled: false }, fontSize: 14 }}
            />
          </div>
        </div>
        <div className="output-pane">
          <div className="pane-header">Query Results</div>
          <div className="pane-body" style={{ padding: '16px' }}>
            {output && output.columns ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    {output.columns.map((col, i) => (
                      <th key={i} style={{ border: '1px solid var(--border)', padding: '8px', background: 'var(--bg-hover)', textAlign: 'left' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {output.values.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} style={{ border: '1px solid var(--border)', padding: '8px', color: col === 'Error' ? 'var(--danger)' : 'inherit' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="output-text">Output will appear here...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
