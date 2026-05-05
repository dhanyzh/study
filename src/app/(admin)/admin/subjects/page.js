'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useCallback } from 'react';

export default function AdminSubjects() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '', icon: '📚', color: '#6C63FF', description: '', order: 0 });
  const [chapterForm, setChapterForm] = useState({ title: '', slug: '', description: '', order: 0 });
  const [topicForm, setTopicForm] = useState({ title: '', slug: '', order: 0, noteContent: '' });

  const api = useCallback(async (path, opts = {}) => {
    const res = await fetch(path, {
      ...opts,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
    });
    return res;
  }, [token]);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await api('/api/admin/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
      } else {
        setError('Failed to load subjects.');
      }
    } catch {
      setError('Could not connect.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchChapters = useCallback(async (subjectId) => {
    try {
      const res = await api(`/api/admin/chapters?subjectId=${subjectId}`);
      if (res.ok) {
        const data = await res.json();
        setChapters(data.chapters || []);
      }
    } catch { /* ignore */ }
  }, [api]);

  useEffect(() => { if (token) fetchSubjects(); }, [token, fetchSubjects]);
  useEffect(() => { if (expandedSubject) fetchChapters(expandedSubject); }, [expandedSubject, fetchChapters]);

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    const method = editingSubject ? 'PATCH' : 'POST';
    const body = editingSubject ? { subjectId: editingSubject._id, ...formData } : formData;
    try {
      const res = await api('/api/admin/subjects', { method, body: JSON.stringify(body) });
      if (res.ok) {
        fetchSubjects();
        setShowForm(false);
        setEditingSubject(null);
        setFormData({ name: '', slug: '', icon: '📚', color: '#6C63FF', description: '', order: 0 });
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save subject.');
      }
    } catch { setError('Network error.'); }
  };

  const handleDeleteSubject = async (subjectId, name) => {
    if (!confirm(`Delete "${name}" and ALL its chapters, topics, notes, and quizzes? This cannot be undone!`)) return;
    try {
      const res = await api(`/api/admin/subjects?subjectId=${subjectId}`, { method: 'DELETE' });
      if (res.ok) fetchSubjects();
    } catch { setError('Failed to delete.'); }
  };

  const handleChapterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/api/admin/chapters', {
        method: 'POST',
        body: JSON.stringify({ subjectId: expandedSubject, ...chapterForm }),
      });
      if (res.ok) {
        fetchChapters(expandedSubject);
        fetchSubjects();
        setShowChapterForm(false);
        setChapterForm({ title: '', slug: '', description: '', order: 0 });
      }
    } catch { setError('Failed to create chapter.'); }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!confirm('Delete this chapter and all its topics?')) return;
    try {
      const res = await api(`/api/admin/chapters?chapterId=${chapterId}`, { method: 'DELETE' });
      if (res.ok) { fetchChapters(expandedSubject); fetchSubjects(); }
    } catch { setError('Failed to delete chapter.'); }
  };

  const handleTopicSubmit = async (e, chapterId) => {
    e.preventDefault();
    try {
      const res = await api('/api/admin/topics', {
        method: 'POST',
        body: JSON.stringify({ chapterId, ...topicForm }),
      });
      if (res.ok) {
        fetchChapters(expandedSubject);
        fetchSubjects();
        setShowTopicForm(null);
        setTopicForm({ title: '', slug: '', order: 0, noteContent: '' });
      }
    } catch { setError('Failed to create topic.'); }
  };

  const startEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, slug: subject.slug, icon: subject.icon, color: subject.color, description: subject.description, order: subject.order });
    setShowForm(true);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>📚 Subject Management</h1>
          <p>{subjects.length} subject{subjects.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingSubject(null); setFormData({ name: '', slug: '', icon: '📚', color: '#6C63FF', description: '', order: 0 }); }}>
          {showForm ? '✕ Cancel' : '➕ Add Subject'}
        </button>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: '16px' }}>⚠️ {error} <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px' }}>✕</button></div>}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', animation: 'fadeUp 0.3s ease' }}>
          <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>{editingSubject ? '✏️ Edit Subject' : '➕ New Subject'}</h3>
          <form onSubmit={handleSubjectSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="input" placeholder="e.g. Physics" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value, slug: formData.slug || e.target.value.toLowerCase().replace(/\s+/g, '-') })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Slug</label>
                <input className="input" placeholder="e.g. physics" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Icon (emoji)</label>
                <input className="input" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer' }} />
                  <input className="input" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                </div>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description</label>
                <input className="input" placeholder="Brief description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Order</label>
                <input className="input" type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary">{editingSubject ? 'Save Changes' : 'Create Subject'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingSubject(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Subjects Grid */}
      <div className="subjects-grid">
        {subjects.map((subject) => (
          <div key={subject._id} className="card" style={{ '--card-color': subject.color, position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setExpandedSubject(expandedSubject === subject._id ? null : subject._id)}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: subject.color }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{subject.icon}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>{subject.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{subject.description}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                <button className="btn btn-sm btn-secondary" onClick={() => startEdit(subject)} title="Edit">✏️</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteSubject(subject._id, subject.name)} title="Delete" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>🗑️</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>📖 {subject.chapterCount || 0} chapters</span>
              <span>📝 {subject.topicCount || 0} topics</span>
              <span>❓ {subject.quizCount || 0} quizzes</span>
            </div>
            {expandedSubject === subject._id && <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--accent)' }}>▼ Expanded</div>}
          </div>
        ))}
      </div>

      {/* Expanded Subject — Chapters & Topics */}
      {expandedSubject && (
        <div style={{ marginTop: '24px', animation: 'fadeUp 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Chapters for: {subjects.find(s => s._id === expandedSubject)?.name}
            </h2>
            <button className="btn btn-sm btn-primary" onClick={() => setShowChapterForm(!showChapterForm)}>
              {showChapterForm ? '✕ Cancel' : '➕ Add Chapter'}
            </button>
          </div>

          {showChapterForm && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <form onSubmit={handleChapterSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="input" placeholder="Chapter title" value={chapterForm.title} onChange={e => setChapterForm({ ...chapterForm, title: e.target.value, slug: chapterForm.slug || e.target.value.toLowerCase().replace(/\s+/g, '-') })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Slug</label>
                    <input className="input" value={chapterForm.slug} onChange={e => setChapterForm({ ...chapterForm, slug: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Order</label>
                    <input className="input" type="number" value={chapterForm.order} onChange={e => setChapterForm({ ...chapterForm, order: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>Create Chapter</button>
              </form>
            </div>
          )}

          <div className="chapters-list">
            {chapters.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                No chapters yet. Click &quot;Add Chapter&quot; to get started.
              </div>
            ) : (
              chapters.map((ch) => (
                <div key={ch._id} className="chapter-card">
                  <div className="chapter-header">
                    <span>📖 {ch.title} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({ch.topicCount || 0} topics)</span></span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => setShowTopicForm(showTopicForm === ch._id ? null : ch._id)}>
                        {showTopicForm === ch._id ? '✕' : '➕ Topic'}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteChapter(ch._id)} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>🗑️</button>
                    </div>
                  </div>

                  {showTopicForm === ch._id && (
                    <div style={{ padding: '0 20px 16px' }}>
                      <form onSubmit={(e) => handleTopicSubmit(e, ch._id)}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '10px' }}>
                          <div className="form-group">
                            <label className="form-label">Title</label>
                            <input className="input" placeholder="Topic title" value={topicForm.title} onChange={e => setTopicForm({ ...topicForm, title: e.target.value, slug: topicForm.slug || e.target.value.toLowerCase().replace(/\s+/g, '-') })} required />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Slug</label>
                            <input className="input" value={topicForm.slug} onChange={e => setTopicForm({ ...topicForm, slug: e.target.value })} required />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Order</label>
                            <input className="input" type="number" value={topicForm.order} onChange={e => setTopicForm({ ...topicForm, order: parseInt(e.target.value) || 0 })} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Note Content (Markdown)</label>
                          <textarea className="textarea" placeholder="# Topic Notes&#10;Write notes in Markdown..." value={topicForm.noteContent} onChange={e => setTopicForm({ ...topicForm, noteContent: e.target.value })} rows={4} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm">Create Topic</button>
                      </form>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
