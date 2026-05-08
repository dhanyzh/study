'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import InteractiveQuiz from '@/components/InteractiveQuiz';
import MarkdownRenderer from '@/components/MarkdownRenderer';

export default function TopicPage({ params }) {
  const { slug, chapterSlug, topicSlug } = use(params);
  const searchParams = useSearchParams();
  const topicId = searchParams.get('id');
  
  const [activeTab, setActiveTab] = useState('notes'); // notes, quiz, code
  const [notes, setNotes] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    async function fetchData() {
      if (!topicId || !token) return;
      try {
        const [notesRes, quizRes] = await Promise.all([
          fetch(`/api/notes?topicId=${topicId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/quizzes?topicId=${topicId}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const notesData = await notesRes.json();
        const quizData = await quizRes.json();
        
        setNotes(notesData.notes || []);
        setQuizzes(quizData.quizzes || []);

        const subjectIdForProgress = quizData.quizzes?.[0]?.subjectId || topicId;
        
        // Mark progress as notesRead
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ topicId, subjectId: subjectIdForProgress, notesRead: true })
        });
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [topicId, token]);

  // Create a nicely formatted title from slug
  const topicTitle = topicSlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div>
      <div className="breadcrumb">
        <Link href={`/subjects/${slug}`}>Subject</Link> / <Link href={`/subjects/${slug}`}>{chapterSlug.replace(/-/g, ' ')}</Link> / <span>{topicTitle}</span>
      </div>

      <h1 style={{ margin: '16px 0 8px', fontSize: '1.6rem' }}>{topicTitle}</h1>

      <div className="tabs">
        <button className={`tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>📝 Notes</button>
        <button className={`tab ${activeTab === 'quiz' ? 'active' : ''}`} onClick={() => setActiveTab('quiz')}>🧠 Practice Quiz ({quizzes.length})</button>
        {slug === 'dsa' && (
          <button className={`tab ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')}>💻 Code Practice</button>
        )}
      </div>

      {loading ? (
        <div className="skeleton-container">
          <div className="skeleton skeleton-card" style={{ height: '300px', marginBottom: '16px' }}></div>
          <div className="skeleton skeleton-card" style={{ height: '200px' }}></div>
        </div>
      ) : activeTab === 'notes' ? (
        <div className="notes-content">
          {notes.length > 0 ? (
            notes.map((n, i) => (
              <div key={n._id || i} className="card" style={{ marginBottom: 16, padding: '24px 28px' }}>
                {n.source === 'pdf' && (
                  <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: 6, 
                    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: 'rgba(78, 205, 196, 0.15)', color: '#4ECDC4', marginBottom: 12,
                  }}>
                    📄 From PDF
                  </div>
                )}
                <MarkdownRenderer content={n.content} />
              </div>
            ))
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--text-secondary)' }}>No notes available for this topic yet.</p>
            </div>
          )}
        </div>
      ) : activeTab === 'quiz' ? (
        <div style={{ marginTop: 14 }}>
          {quizzes.length > 0 ? (
            <InteractiveQuiz title={`${topicTitle} Quiz`} questions={quizzes} />
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--text-secondary)' }}>No quizzes available for this topic yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <h3>Code Practice</h3>
          <p>Go to the main <Link href="/practice/code">Code Editor</Link> for this feature.</p>
        </div>
      )}
    </div>
  );
}
