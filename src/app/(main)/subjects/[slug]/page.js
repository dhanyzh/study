'use client';
import { useMemo, useState, useEffect, use } from 'react';
import Link from 'next/link';
import { SUBJECTS } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import ChemistryModule1Quiz from '@/components/ChemistryModule1Quiz';
import InteractiveQuiz from '@/components/InteractiveQuiz';
import MarkdownRenderer from '@/components/MarkdownRenderer';

export default function SubjectPage({ params }) {
  const { slug } = use(params);
  const [activeTab, setActiveTab] = useState('chapters'); // chapters | notes | quizzes | exams
  const [chapters, setChapters] = useState([]);
  const [dbSubjectId, setDbSubjectId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  
  const subject = SUBJECTS.find(s => s.slug === slug);

  useEffect(() => {
    async function fetchChapters() {
      try {
        const res = await fetch(`/api/subjects`);
        const data = await res.json();
        
        if (data.subjects && Array.isArray(data.subjects)) {
          const dbSubject = data.subjects.find(s => s.slug === slug);
          
          if (dbSubject) {
            setDbSubjectId(dbSubject._id);
            const chapRes = await fetch(`/api/chapters?subjectId=${dbSubject._id}`);
            const { chapters: dbChapters } = await chapRes.json();
          
          // Fetch topics for each chapter
          const chaptersWithTopics = await Promise.all(dbChapters.map(async (chap) => {
            const topRes = await fetch(`/api/topics?chapterId=${chap._id}`);
            const { topics } = await topRes.json();
            return { ...chap, topics };
          }));
          
          setChapters(chaptersWithTopics);
          }
        }
      } catch (err) {
        console.error('Failed to load subject data', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (token) fetchChapters();
  }, [slug, token]);

  useEffect(() => {
    async function fetchTabData() {
      if (!dbSubjectId) return;
      try {
        if (activeTab === 'notes') {
          const res = await fetch(`/api/notes?subjectId=${dbSubjectId}&limit=200`);
          const data = await res.json();
          setNotes(Array.isArray(data.notes) ? data.notes : []);
        }
        if (activeTab === 'quizzes') {
          const res = await fetch(`/api/quizzes?subjectId=${dbSubjectId}&limit=50`);
          const data = await res.json();
          setQuizzes(Array.isArray(data.quizzes) ? data.quizzes : []);
        }
        if (activeTab === 'exams') {
          const res = await fetch(`/api/exams?subjectId=${dbSubjectId}`);
          const data = await res.json();
          setExams(Array.isArray(data.exams) ? data.exams : []);
        }
      } catch (e) {
        console.error('Failed to load tab data', e);
      }
    }
    fetchTabData();
  }, [activeTab, dbSubjectId]);

  const notesByTopic = useMemo(() => {
    const map = new Map();
    for (const n of notes) {
      const t = n?.topicId;
      const key = t?._id || n.topicId || 'unknown';
      if (!map.has(key)) map.set(key, { topic: t, items: [] });
      map.get(key).items.push(n);
    }
    return Array.from(map.values());
  }, [notes]);

  const topicRouteById = useMemo(() => {
    const map = new Map();
    for (const ch of chapters || []) {
      for (const t of ch.topics || []) {
        map.set(String(t._id), { chapterSlug: ch.slug, topicSlug: t.slug });
      }
    }
    return map;
  }, [chapters]);

  if (!subject) return <div>Subject not found.</div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link> / <span>{subject.name}</span>
      </div>
      
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontSize: '3rem' }}>{subject.icon}</div>
        <div>
          <h1 style={{ color: subject.color }}>{subject.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{subject.description}</p>
        </div>
      </div>

      <div className="tabs" style={{ marginTop: 10 }}>
        <button className={`tab ${activeTab === 'chapters' ? 'active' : ''}`} onClick={() => setActiveTab('chapters')}>
          Chapters
        </button>
        <button className={`tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
          Notes {notes.length ? `(${notes.length})` : ''}
        </button>
        <button className={`tab ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>
          Quiz {quizzes.length ? `(${quizzes.length})` : ''}
        </button>
        <button className={`tab ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => setActiveTab('exams')}>
          Exams {exams.length ? `(${exams.length})` : ''}
        </button>
      </div>

      {loading ? (
        <div className="spinner" style={{ margin: '40px auto' }}></div>
      ) : activeTab === 'chapters' ? (
        chapters.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            No content available for this subject yet.
          </div>
        ) : (
          <div className="chapters-list">
            {chapters.map(chapter => (
              <div key={chapter._id} className="chapter-card">
                <div className="chapter-header">
                  {chapter.title}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {chapter.topics.length} topics
                  </span>
                </div>
                <div className="chapter-topics">
                  {chapter.topics.map(topic => (
                    <Link 
                      key={topic._id} 
                      href={`/subjects/${slug}/${chapter.slug}/${topic.slug}?id=${topic._id}`}
                      className="topic-item"
                    >
                      <div className="check"></div>
                      {topic.title}
                      {topic.videoUrl && <span style={{ marginLeft: 'auto', fontSize: '1.2rem' }}>▶️</span>}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'notes' ? (
        <div style={{ marginTop: 14 }}>
          {slug === 'chemistry' && (
            <>
              <a
                href="/uploads/chemistry-module1.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 22px', marginBottom: 16, cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(78,205,196,0.1), rgba(108,99,255,0.1))',
                  border: '1px solid rgba(78,205,196,0.25)',
                  textDecoration: 'none', color: 'inherit',
                }}
              >
                <span style={{ fontSize: '2rem' }}>📄</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Module 1: Materials Chemistry for Computing Systems</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>Original PDF — Click to view or download</div>
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--info)', fontSize: '0.85rem', fontWeight: 600 }}>View PDF ↗</span>
              </a>

              <a
                href="/uploads/chemistry-module3.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 22px', marginBottom: 16, cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(255,107,107,0.1), rgba(108,99,255,0.1))',
                  border: '1px solid rgba(255,107,107,0.25)',
                  textDecoration: 'none', color: 'inherit',
                }}
              >
                <span style={{ fontSize: '2rem' }}>📄</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Module 3: Nanotechnology</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>Original PDF — Click to view or download</div>
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--info)', fontSize: '0.85rem', fontWeight: 600 }}>View PDF ↗</span>
              </a>
            </>
          )}
          {notesByTopic.length === 0 ? (
            <div className="card" style={{ color: 'var(--text-secondary)', padding: 24 }}>No notes yet for this subject.</div>
          ) : (
            notesByTopic.map((group, idx) => (
              <div key={String(group?.topic?._id || idx)} className="card" style={{ marginBottom: 14, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                    📌 {group?.topic?.title || 'Unknown topic'}
                    <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 8 }}>({group.items.length} note{group.items.length > 1 ? 's' : ''})</span>
                  </div>
                  {(() => {
                    const route = topicRouteById.get(String(group?.topic?._id || ''));
                    const chapterSlug = route?.chapterSlug || '';
                    const topicSlug = route?.topicSlug || group?.topic?.slug || '';
                    const topicId = group?.topic?._id || '';
                    if (!chapterSlug || !topicSlug || !topicId) return null;
                    return (
                      <Link
                        href={`/subjects/${slug}/${chapterSlug}/${topicSlug}?id=${encodeURIComponent(topicId)}`}
                        style={{ color: 'var(--accent-light)', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        Open full notes →
                      </Link>
                    );
                  })()}
                </div>
                {group.items.slice(0, 2).map((n) => (
                  <div key={String(n._id)} style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8 }}>
                    {n.source === 'pdf' && (
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                        fontSize: 10, fontWeight: 600, marginBottom: 8,
                        background: 'rgba(78,205,196,0.15)', color: '#4ECDC4',
                      }}>📄 From PDF</span>
                    )}
                    <div style={{ maxHeight: 200, overflow: 'hidden', position: 'relative' }}>
                      <MarkdownRenderer content={String(n.content || '').slice(0, 800)} />
                      {String(n.content || '').length > 800 && (
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
                          background: 'linear-gradient(transparent, var(--bg-card))',
                        }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'quizzes' ? (
        <div className="card" style={{ marginTop: 14, padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
          {quizzes.length === 0 ? (
            slug === 'chemistry' ? <ChemistryModule1Quiz /> : <div className="card" style={{ padding: 24 }}><div style={{ color: 'var(--text-secondary)' }}>No quizzes yet for this subject.</div></div>
          ) : (
            <InteractiveQuiz title={`${subject.name} Quizzes`} questions={quizzes} />
          )}
        </div>
      ) : (
        <div className="card" style={{ marginTop: 14 }}>
          {exams.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>No exams yet for this subject.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {exams.map((ex) => (
                <div key={String(ex._id)} className="card" style={{ padding: 12, background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontWeight: 800 }}>{ex.title}</div>
                  <div style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
                    {Array.isArray(ex.mcqs) ? `${ex.mcqs.length} MCQs` : 'MCQs'} • {Array.isArray(ex.descriptiveQuestions) ? `${ex.descriptiveQuestions.length} descriptive` : 'descriptive'} • {ex.duration || 45} min
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
