'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function PDFReview() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const uploadIdFromQuery = searchParams?.get('uploadId');

  const [data] = useState(() => {
    if (typeof window === 'undefined') return null;
    const storedData = sessionStorage.getItem('pdfReviewData');
    if (!storedData) return null;
    try {
      return JSON.parse(storedData);
    } catch {
      return null;
    }
  });

  const uploadId = uploadIdFromQuery || data?._id || null;

  const [activeTab, setActiveTab] = useState('notes'); // local viewer tab (notes vs mcqs)

  const [proposals, setProposals] = useState([]);
  const [moderating, setModerating] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(null);

  const [results, setResults] = useState(null);
  const [draftGraph, setDraftGraph] = useState(null);
  const [dirty, setDirty] = useState(false);

  const [viewMode, setViewMode] = useState('enhanced'); // raw | enhanced
  const [notesEditMode, setNotesEditMode] = useState(false);
  const [savingGraph, setSavingGraph] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  const dragTopicRef = useRef(null);

  function cloneGraph(graph) {
    if (!graph) return null;
    return JSON.parse(JSON.stringify(graph));
  }

  function findTopicPath(graph, topicId) {
    if (!graph?.chapters?.length || !topicId) return null;
    for (let chIdx = 0; chIdx < graph.chapters.length; chIdx++) {
      const topics = graph.chapters[chIdx]?.topics || [];
      for (let tIdx = 0; tIdx < topics.length; tIdx++) {
        if (topics[tIdx]?.id === topicId) return { chIdx, tIdx };
      }
    }
    return null;
  }

  const learningGraph = draftGraph || results?.learningGraph || data?.learningGraph;
  const chapters = useMemo(() => learningGraph?.chapters ?? [], [learningGraph]);

  const allTopics = useMemo(() => {
    const topics = [];
    for (const ch of chapters) {
      for (const t of ch?.topics || []) topics.push({ chapter: ch, topic: t });
    }
    return topics;
  }, [chapters]);

  // Default to first topic when the user hasn't explicitly selected one yet.
  const activeTopicId = selectedTopicId ?? allTopics[0]?.topic?.id ?? null;

  useEffect(() => {
    if (!token || !uploadId) return;
    let cancelled = false;

    async function loadResultsAndGraph() {
      try {
        const res = await fetch(`/api/pdf/results/${uploadId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || cancelled) return;

        setResults(json);
        setDraftGraph(json?.learningGraph || null);
        setDirty(false);
        setNotesEditMode(false);
      } catch (e) {
        console.error('Failed to load results:', e);
      }
    }

    loadResultsAndGraph();

    return () => {
      cancelled = true;
    };
  }, [token, uploadId]);

  useEffect(() => {
    async function loadProposals() {
      if (!token || !uploadId) return;
      try {
        const res = await fetch(`/api/pdf/proposals/${uploadId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok) setProposals(json.proposals || []);
      } catch (e) {
        console.error('Failed to load proposals:', e);
      }
    }
    loadProposals();
  }, [token, uploadId]);

  const selectedTopic = useMemo(() => {
    if (!activeTopicId) return null;
    for (const ch of chapters) {
      for (const t of ch?.topics || []) {
        if (t?.id === activeTopicId) return t;
      }
    }
    return null;
  }, [chapters, activeTopicId]);

  const notes = useMemo(() => selectedTopic?.notes?.items ?? [], [selectedTopic]);
  const formattedNotes = useMemo(
    () =>
      notes.map((note, idx) => ({
        id: note.id || note._id || `${idx}`,
        title: note.title || `Note ${idx + 1}`,
        content: note.content || '',
        summary: note.summary || '',
      })),
    [notes]
  );

  const approvedMcqProposal = useMemo(() => {
    if (!activeTopicId) return null;
    return proposals.find(
      (p) =>
        p?.scope === 'topic' &&
        p?.targetId === activeTopicId &&
        p?.contentType === 'mcq' &&
        p?.status === 'approved'
    );
  }, [proposals, activeTopicId]);

  const approvedMcqs = approvedMcqProposal?.payload?.items || selectedTopic?.mcqs?.items || [];

  const pendingTopicProposals = useMemo(() => {
    if (!activeTopicId) return [];
    return proposals
      .filter(
        (p) =>
          p?.scope === 'topic' &&
          p?.targetId === activeTopicId &&
          p?.status === 'pending' &&
          ['mcq', 'descriptive_question', 'formula', 'code', 'table', 'notes'].includes(p?.contentType)
      )
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [proposals, activeTopicId]);

  async function reloadProposals() {
    if (!token || !uploadId) return;
    const res = await fetch(`/api/pdf/proposals/${uploadId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.ok) setProposals(json.proposals || []);
  }

  async function moderateProposal(proposalId, action) {
    if (!token || !uploadId) return;
    setModerating(true);
    try {
      const res = await fetch(`/api/pdf/moderate/${uploadId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decisions: [{ proposalId, action }] }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Moderation failed:', err);
        return;
      }

      await reloadProposals();
    } finally {
      setModerating(false);
    }
  }

  async function reloadFromServer() {
    if (!token || !uploadId) return;
    const res = await fetch(`/api/pdf/results/${uploadId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const json = await res.json().catch(() => null);
    if (!json) return;
    setResults(json);
    setDraftGraph(cloneGraph(json?.learningGraph || null));
    setDirty(false);
    setNotesEditMode(false);
  }

  function handleTopicDragStart(chIdx, tIdx) {
    dragTopicRef.current = { chIdx, tIdx };
  }

  function handleTopicDrop(toChIdx, toTIdx) {
    if (!draftGraph || !dragTopicRef.current) return;
    const { chIdx: fromChIdx, tIdx: fromTIdx } = dragTopicRef.current;
    if (fromChIdx !== toChIdx) return;
    if (fromTIdx === toTIdx) return;

    const next = cloneGraph(draftGraph);
    const topics = next.chapters[toChIdx].topics;
    const [moved] = topics.splice(fromTIdx, 1);
    topics.splice(toTIdx, 0, moved);

    dragTopicRef.current = null;
    setDraftGraph(next);
    setDirty(true);
    setNotesEditMode(false);
  }

  function mergePrevTopicIntoSelected() {
    if (!draftGraph || !activeTopicId) return;
    const path = findTopicPath(draftGraph, activeTopicId);
    if (!path) return;

    const next = cloneGraph(draftGraph);
    const topics = next.chapters[path.chIdx].topics;
    if (path.tIdx <= 0) return;

    const prev = topics[path.tIdx - 1];
    const curr = topics[path.tIdx];
    curr.notes = curr.notes || { proposalId: null, items: [] };
    curr.notes.items = [...(curr.notes.items || []), ...(prev?.notes?.items || [])];

    topics.splice(path.tIdx - 1, 1);
    setDraftGraph(next);
    setDirty(true);
    setNotesEditMode(false);
  }

  function splitSelectedNotes() {
    if (!draftGraph || !activeTopicId) return;
    const path = findTopicPath(draftGraph, activeTopicId);
    if (!path) return;

    const next = cloneGraph(draftGraph);
    const topics = next.chapters[path.chIdx].topics;
    const topic = topics[path.tIdx];
    const notes = topic?.notes?.items || [];
    if (notes.length < 2) return;

    const mid = Math.ceil(notes.length / 2);
    const firstNotes = notes.slice(0, mid);
    const secondNotes = notes.slice(mid);

    const newTopicId = `topic_local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

    topic.notes.items = firstNotes;

    const newTopic = {
      id: newTopicId,
      title: `${topic.title} (part 2)`,
      notes: { proposalId: null, items: secondNotes },
      mcqs: { proposalId: null, items: [] },
      descriptive_questions: { proposalId: null, items: [] },
      formulas: { proposalId: null, items: [] },
      code_snippets: { proposalId: null, items: [] },
      tables: { proposalId: null, items: [] },
    };

    topics.splice(path.tIdx + 1, 0, newTopic);
    setDraftGraph(next);
    setDirty(true);
    setSelectedTopicId(newTopicId);
    setNotesEditMode(false);
  }

  function updateNoteContent(noteId, newContent) {
    if (!draftGraph || !activeTopicId) return;
    const path = findTopicPath(draftGraph, activeTopicId);
    if (!path) return;

    const next = cloneGraph(draftGraph);
    const topic = next.chapters[path.chIdx].topics[path.tIdx];
    topic.notes = topic.notes || { proposalId: null, items: [] };
    topic.notes.items = (topic.notes.items || []).map((n) =>
      n?.id === noteId ? { ...n, content: newContent } : n
    );

    setDraftGraph(next);
    setDirty(true);
  }

  async function saveDraftGraphToDB() {
    if (!token || !uploadId || !draftGraph) return;
    if (savingGraph) return;

    setSavingGraph(true);
    try {
      const res = await fetch(`/api/pdf/revisions/${uploadId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graph: draftGraph,
          reason: 'ui-moderation-editor',
          targetId: activeTopicId || 'graph',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to apply revisions');
      }

      await reloadFromServer();
      await reloadProposals();
    } finally {
      setSavingGraph(false);
    }
  }

  async function regenerateTopicMCQs() {
    if (!token || !uploadId || !activeTopicId) return;
    if (dirty) {
      alert('Please apply changes before regenerating MCQs.');
      return;
    }
    setRegenLoading(true);
    try {
      const res = await fetch(`/api/pdf/regenerate/${uploadId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scope: 'topic',
          targetId: activeTopicId,
          targetCount: 80,
        }),
      });

      if (!res.ok) throw new Error('Regeneration request failed');

      await reloadFromServer();
      await reloadProposals();
    } catch (e) {
      console.error('Regenerate failed:', e);
    } finally {
      setRegenLoading(false);
    }
  }

  if (!uploadId) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
        <h2>No data found</h2>
        <p>Please upload a PDF first.</p>
        <Link href="/pdf-upload">
          <button className="btn btn-primary">Go back to PDF Upload</button>
        </Link>
      </div>
    );
  }

  if (!learningGraph) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  }

  const fileName =
    results?.upload?.originalName || data?.originalName || 'Untitled PDF';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>Moderate & Review</h1>
        <p>File: {fileName}</p>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 18 }}>
          <aside style={{ borderRight: '1px solid var(--border)', paddingRight: 10 }}>
            <div style={{ fontWeight: 800, marginBottom: 12 }}>Topic Tree</div>

            {chapters.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>No learning graph found yet.</div>
            ) : (
              chapters.map((ch, chIdx) => (
                <div key={ch.id} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>{ch.title}</div>
                  {(ch.topics || []).map((t, tIdx) => {
                    const isActive = t?.id === activeTopicId;
                    return (
                      <button
                        key={t.id}
                        className="btn"
                        draggable
                        onDragStart={() => handleTopicDragStart(chIdx, tIdx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleTopicDrop(chIdx, tIdx);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          marginBottom: 6,
                          borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                          background: isActive ? 'rgba(108, 99, 255, 0.12)' : 'transparent',
                        }}
                        onClick={() => setSelectedTopicId(t.id)}
                      >
                        {t.title}
                      </button>
                    );
                  })}
                </div>
              ))
            )}

            {pendingTopicProposals.length > 0 ? (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Pending Proposals</div>
                {pendingTopicProposals.slice(0, 6).map((p) => (
                  <div
                    key={p._id}
                    style={{
                      padding: 10,
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>
                      {p.contentType.replace(/_/g, ' ')}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>
                      Status: {p.status}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-primary"
                        disabled={moderating}
                        onClick={() => moderateProposal(p._id, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-secondary"
                        disabled={moderating}
                        onClick={() => moderateProposal(p._id, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 18, color: 'var(--text-secondary)' }}>No pending proposals.</div>
            )}
          </aside>

          <main>
            {selectedTopic ? (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{selectedTopic.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {pendingTopicProposals.length > 0
                    ? `${pendingTopicProposals.length} pending proposal(s)`
                    : 'All proposals approved for this topic (or none created).'}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                  <button
                    className="btn"
                    onClick={() => setViewMode((v) => (v === 'raw' ? 'enhanced' : 'raw'))}
                    style={{ padding: '8px 10px' }}
                  >
                    View: {viewMode === 'raw' ? 'Raw' : 'Enhanced'}
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => setNotesEditMode((m) => !m)}
                    style={{ padding: '8px 10px' }}
                    disabled={savingGraph}
                  >
                    {notesEditMode ? 'Exit notes edit' : 'Edit notes'}
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={mergePrevTopicIntoSelected}
                    style={{ padding: '8px 10px' }}
                    disabled={!draftGraph || !activeTopicId || savingGraph}
                    title="Merge previous topic notes into this topic (local draft)"
                  >
                    Merge with previous
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={splitSelectedNotes}
                    style={{ padding: '8px 10px' }}
                    disabled={!draftGraph || !activeTopicId || savingGraph}
                    title="Split topic notes into a new topic (local draft)"
                  >
                    Split topic
                  </button>

                  {dirty ? (
                    <button
                      className="btn btn-primary"
                      onClick={saveDraftGraphToDB}
                      disabled={savingGraph}
                      style={{ padding: '8px 10px' }}
                    >
                      {savingGraph ? 'Applying…' : 'Apply changes'}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)' }}>Select a topic to review.</div>
            )}

            <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
              <button
                onClick={() => setActiveTab('notes')}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  background: activeTab === 'notes' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'notes' ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderRadius: '4px 4px 0 0',
                  fontWeight: activeTab === 'notes' ? 700 : 400,
                }}
              >
                Notes ({formattedNotes.length})
              </button>
              <button
                onClick={() => setActiveTab('mcqs')}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  background: activeTab === 'mcqs' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'mcqs' ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderRadius: '4px 4px 0 0',
                  fontWeight: activeTab === 'mcqs' ? 700 : 400,
                }}
              >
                MCQs ({approvedMcqs.length})
              </button>
            </div>

            {activeTab === 'notes' && (
              <div>
                {formattedNotes.length > 0 ? (
                  formattedNotes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        marginBottom: 20,
                        padding: 16,
                        backgroundColor: 'rgba(100, 100, 255, 0.05)',
                        borderRadius: 8,
                      }}
                    >
                      <h4 style={{ marginBottom: 8 }}>{note.title}</h4>

                      {viewMode === 'enhanced' && note.summary ? (
                        <div style={{ marginBottom: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
                          <strong>Summary:</strong> {note.summary}
                        </div>
                      ) : null}

                      {notesEditMode ? (
                        <textarea
                          value={note.content}
                          onChange={(e) => updateNoteContent(note.id, e.target.value)}
                          style={{
                            width: '100%',
                            minHeight: 140,
                            padding: 12,
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            background: 'transparent',
                            color: 'var(--text)',
                            outline: 'none',
                            resize: 'vertical',
                          }}
                        />
                      ) : (
                        <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                          {note.content}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No notes extracted</p>
                )}

                {dirty && !notesEditMode ? (
                  <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={reloadFromServer}
                      disabled={savingGraph}
                    >
                      Discard changes
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            {activeTab === 'mcqs' && (
              <div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={regenerateTopicMCQs}
                    disabled={regenLoading || dirty}
                    title={dirty ? 'Apply changes before regenerating.' : 'Regenerate MCQs for this topic'}
                  >
                    {regenLoading ? 'Regenerating…' : 'Regenerate MCQs for this topic'}
                  </button>
                </div>

                {approvedMcqs.length > 0 ? (
                  approvedMcqs.map((mcq, idx) => (
                    <div
                      key={`${mcq.id || 'mcq'}-${idx}`}
                      style={{
                        marginBottom: 24,
                        padding: 16,
                        backgroundColor: 'rgba(100, 100, 255, 0.05)',
                        borderRadius: 8,
                      }}
                    >
                      <h4 style={{ marginBottom: 12 }}>Question {idx + 1}</h4>
                      <p style={{ marginBottom: 12, fontWeight: 600 }}>{mcq.question}</p>
                      <div style={{ marginLeft: 20 }}>
                        {mcq.options?.map((option, optIdx) => (
                          <div
                            key={optIdx}
                            style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}
                          >
                            <input
                              type="radio"
                              name={`mcq-${activeTopicId}-${idx}`}
                              value={optIdx}
                              checked={mcq.correctAnswer === optIdx}
                              disabled
                              readOnly
                              style={{ marginRight: 8, cursor: 'pointer' }}
                            />
                            <span style={{ cursor: 'default', flex: 1 }}>{option}</span>
                            {mcq.correctAnswer === optIdx ? (
                              <span style={{ color: 'var(--success)', fontWeight: 700, marginLeft: 8 }}>✓</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      {viewMode === 'enhanced' ? (
                        <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: '0.9em' }}>
                          <strong>Explanation:</strong> {mcq.explanation}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p>No MCQs generated</p>
                )}
              </div>
            )}

            <div style={{ marginTop: 30, display: 'flex', gap: 12 }}>
              <Link href="/pdf-upload" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary">Upload Another PDF</button>
              </Link>
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <button className="btn btn-secondary">Back to Dashboard</button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
