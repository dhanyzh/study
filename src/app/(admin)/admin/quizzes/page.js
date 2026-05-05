'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useCallback } from 'react';

export default function AdminQuizzes() {
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [filterSubject, setFilterSubject] = useState('');
  const [total, setTotal] = useState(0);

  const [formData, setFormData] = useState({
    subjectId: '', topicId: '', question: '',
    options: ['', '', '', ''], correctAnswer: 0,
    explanation: '', difficulty: 'medium',
  });

  const api = useCallback(async (path, opts = {}) => {
    return fetch(path, {
      ...opts,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
    });
  }, [token]);

  const fetchQuizzes = useCallback(async () => {
    try {
      const url = filterSubject ? `/api/admin/quizzes?subjectId=${filterSubject}` : '/api/admin/quizzes';
      const res = await api(url);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
        setTotal(data.total || 0);
      } else {
        setError('Failed to load quizzes.');
      }
    } catch {
      setError('Could not connect.');
    } finally {
      setLoading(false);
    }
  }, [api, filterSubject]);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await api('/api/admin/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
      }
    } catch { /* ignore */ }
  }, [api]);

  useEffect(() => { if (token) { fetchSubjects(); fetchQuizzes(); } }, [token, fetchSubjects, fetchQuizzes]);

  const resetForm = () => {
    setFormData({ subjectId: '', topicId: '', question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', difficulty: 'medium' });
    setEditingQuiz(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanOptions = formData.options.filter(o => o.trim());
    if (cleanOptions.length < 2) { setError('At least 2 options required.'); return; }

    const method = editingQuiz ? 'PATCH' : 'POST';
    const body = editingQuiz
      ? { quizId: editingQuiz._id, ...formData, options: cleanOptions }
      : { ...formData, options: cleanOptions };

    try {
      const res = await api('/api/admin/quizzes', { method, body: JSON.stringify(body) });
      if (res.ok) {
        fetchQuizzes();
        setShowForm(false);
        resetForm();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save quiz.');
      }
    } catch { setError('Network error.'); }
  };

  const handleDelete = async (quizId) => {
    if (!confirm('Delete this quiz question?')) return;
    try {
      const res = await api(`/api/admin/quizzes?quizId=${quizId}`, { method: 'DELETE' });
      if (res.ok) fetchQuizzes();
    } catch { setError('Failed to delete.'); }
  };

  const startEdit = (quiz) => {
    setEditingQuiz(quiz);
    const opts = [...(quiz.options || [])];
    while (opts.length < 4) opts.push('');
    setFormData({
      subjectId: quiz.subjectId || '', topicId: quiz.topicId || '',
      question: quiz.question, options: opts,
      correctAnswer: quiz.correctAnswer, explanation: quiz.explanation || '',
      difficulty: quiz.difficulty || 'medium',
    });
    setShowForm(true);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>❓ Quiz Management</h1>
          <p>{total} quiz question{total !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); resetForm(); }}>
          {showForm ? '✕ Cancel' : '➕ Add Question'}
        </button>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: '16px' }}>⚠️ {error} <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px' }}>✕</button></div>}

      {/* Filter */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by subject:</span>
        <select
          className="input"
          style={{ width: 'auto', padding: '8px 14px' }}
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => (
            <option key={s._id} value={s._id}>{s.icon} {s.name}</option>
          ))}
        </select>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', animation: 'fadeUp 0.3s ease' }}>
          <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>{editingQuiz ? '✏️ Edit Question' : '➕ New Question'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <select className="input" value={formData.subjectId} onChange={e => setFormData({ ...formData, subjectId: e.target.value })} required>
                  <option value="">Select subject...</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="input" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                  <option value="easy">🟢 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🔴 Hard</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Question *</label>
              <textarea className="textarea" placeholder="Enter the question..." value={formData.question} onChange={e => setFormData({ ...formData, question: e.target.value })} required rows={3} />
            </div>

            <div className="form-group">
              <label className="form-label">Options * (minimum 2)</label>
              {formData.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={formData.correctAnswer === i}
                    onChange={() => setFormData({ ...formData, correctAnswer: i })}
                    style={{ accentColor: 'var(--accent)' }}
                    title="Mark as correct answer"
                  />
                  <input
                    className="input"
                    placeholder={`Option ${i + 1}${i < 2 ? ' (required)' : ' (optional)'}`}
                    value={opt}
                    onChange={e => {
                      const newOpts = [...formData.options];
                      newOpts[i] = e.target.value;
                      setFormData({ ...formData, options: newOpts });
                    }}
                    required={i < 2}
                  />
                  {formData.correctAnswer === i && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700, whiteSpace: 'nowrap' }}>✓ Correct</span>
                  )}
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Explanation (shown after answering)</label>
              <textarea className="textarea" placeholder="Why this answer is correct..." value={formData.explanation} onChange={e => setFormData({ ...formData, explanation: e.target.value })} rows={2} />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary">{editingQuiz ? 'Save Changes' : 'Create Question'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Quiz List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {quizzes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
            No quizzes found. {filterSubject ? 'Try clearing the filter or ' : ''}Click &quot;Add Question&quot; to create one.
          </div>
        ) : (
          quizzes.map((quiz, idx) => (
            <div key={quiz._id} className="card" style={{ animation: `fadeUp 0.3s ease ${idx * 0.03}s both` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700,
                      background: quiz.difficulty === 'hard' ? 'rgba(239,68,68,0.1)' : quiz.difficulty === 'easy' ? 'rgba(46,204,113,0.1)' : 'rgba(245,158,11,0.1)',
                      color: quiz.difficulty === 'hard' ? '#EF4444' : quiz.difficulty === 'easy' ? '#10B981' : '#F59E0B',
                    }}>
                      {quiz.difficulty}
                    </span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      {subjects.find(s => s._id === quiz.subjectId)?.name || 'Unknown'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '10px' }}>{quiz.question}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {quiz.options?.map((opt, i) => (
                      <div key={i} style={{
                        padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem',
                        background: i === quiz.correctAnswer ? 'rgba(46,204,113,0.1)' : 'var(--bg-primary)',
                        border: `1px solid ${i === quiz.correctAnswer ? 'var(--success)' : 'var(--border)'}`,
                        color: i === quiz.correctAnswer ? 'var(--success)' : 'var(--text-secondary)',
                        fontWeight: i === quiz.correctAnswer ? 600 : 400,
                      }}>
                        {i === quiz.correctAnswer ? '✓ ' : ''}{opt}
                      </div>
                    ))}
                  </div>
                  {quiz.explanation && (
                    <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      💡 {quiz.explanation}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => startEdit(quiz)}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(quiz._id)} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>🗑️</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
