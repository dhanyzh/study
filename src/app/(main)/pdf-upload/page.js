'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SUBJECTS } from '@/lib/constants';

export default function PDFUpload() {
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState(SUBJECTS[0].slug);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, done, error
  const [result, setResult] = useState(null);
  const [stageText, setStageText] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [errorLog, setErrorLog] = useState([]);
  const { token } = useAuth();

  const countLearningGraphItems = (learningGraph) => {
    if (!learningGraph?.chapters) return { notes: 0, mcqs: 0 };
    const notes = learningGraph.chapters.flatMap((ch) =>
      (ch.topics || []).flatMap((t) => t.notes?.items || [])
    ).length;
    const mcqs = learningGraph.chapters.flatMap((ch) =>
      (ch.topics || []).flatMap((t) => t.mcqs?.items || [])
    ).length;
    return { notes, mcqs };
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !token) return;
    setStatus('uploading');
    setStageText('Uploading PDF');
    setProgressPct(0);
    setErrorLog([]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subjectId', subject);

    try {
      const res = await fetch('/api/pdf/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json().catch(() => null);
      console.log('[PDF Upload] Response:', res.status, data);
      
      if (res.ok) {
        setStatus('processing');
        pollJobStatus(data.upload.jobId, data.upload._id, token);
      } else {
        setStatus('error');
        setStageText(data?.stage || 'upload');
        setProgressPct(0);
        setErrorLog([
          data?.error ? String(data.error) : `Upload failed (${res.status})`,
          data?.details ? String(data.details) : '',
        ].filter(Boolean));
      }
    } catch (err) {
      setStatus('error');
      setStageText('network');
      setProgressPct(0);
      setErrorLog([`Network error: ${err?.message || String(err)}`]);
    }
  };

  const pollJobStatus = async (jobId, uploadId, tokenToUse) => {
    const pollInterval = 3000;
    let attempts = 0;

    // The full pipeline (AI + question generation + routing) can exceed 90s on larger PDFs.
    // Keep polling longer to avoid false "timed out" UX.
    while (attempts < 200) {
      try {
        const res = await fetch(`/api/pdf/status/${jobId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${tokenToUse}` },
        });
        const data = await res.json();

        if (!res.ok) {
          console.error('Status fetch error:', data);
          setErrorLog([
            `Status API failed (${res.status}): ${
              data?.error || data?.message || JSON.stringify(data)
            }`,
          ]);
          setStageText(
            data?.upload?.currentStage ||
              data?.error ||
              data?.message ||
              `Status API error (${res.status})`
          );
          setProgressPct(typeof data?.upload?.progress === 'number' ? data.upload.progress : 0);
          setStatus('error');
          return;
        }

        if (data.upload?.status === 'completed') {
          setResult({
            ...data.upload,
            aiProcessedContent: data.processedContent || data.upload.aiProcessedContent,
            learningGraph: data.learningGraph || null,
          });
          setStageText(data.upload.currentStage || 'Processing complete');
          setProgressPct(data.upload.progress || 100);
          setErrorLog([]);
          setStatus('done');
          return;
        }

        if (data.upload?.status === 'failed') {
          setErrorLog(data.upload?.errorLog || []);
          setStageText(data.upload?.currentStage || 'Processing failed');
          setProgressPct(typeof data.upload?.progress === 'number' ? data.upload.progress : 0);
          setStatus('error');
          return;
        }

        setStatus('processing');
        setStageText(data.upload?.currentStage || '');
        setProgressPct(data.upload?.progress || 0);
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        attempts += 1;
      } catch (err) {
        console.error('Status polling error:', err);
        setErrorLog([`Polling error: ${err?.message || String(err)}`]);
        setStageText('Polling error');
        setProgressPct(0);
        setStatus('error');
        return;
      }
    }

    setErrorLog(['Status polling timed out. Try again.']);
    setStageText('Status polling timed out');
    setProgressPct(0);
    setStatus('error');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>PDF Intelligence Engine</h1>
        <p>Upload a PDF, and StudyOS AI will extract notes, structure chapters, and generate quizzes automatically.</p>
      </div>

      {status === 'idle' && (
        <div className="card">
          <div className="form-group">
            <label className="form-label">Target Subject</label>
            <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECTS.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
          </div>
          
          <div className="upload-zone" onClick={() => document.getElementById('pdf-upload').click()}>
            <div className="upload-zone-icon">📄</div>
            <div className="upload-zone-text">
              {file ? file.name : 'Click or drag a PDF file here to upload'}
            </div>
            <input type="file" id="pdf-upload" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} disabled={!file} onClick={handleUpload}>
            Upload & Analyze
          </button>
        </div>
      )}

      {(status === 'uploading' || status === 'processing') && (
        <div className="card text-center" style={{ padding: '60px' }}>
          <div className="spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px' }}></div>
          <h3>{status === 'uploading' ? 'Uploading PDF...' : 'AI is processing your document...'}</h3>
          {stageText ? (
            <p className="text-secondary" style={{ marginTop: '10px' }}>
              {stageText}
            </p>
          ) : null}
          <div style={{ width: '100%', maxWidth: '520px', margin: '18px auto 0' }}>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
              <div
                style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  background: 'var(--primary)',
                  borderRadius: 999,
                  transition: 'width 300ms ease',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
              <span>{status === 'uploading' ? 'Starting' : 'Working'}</span>
              <span>{progressPct}%</span>
            </div>
          </div>
          <p className="text-secondary" style={{ marginTop: '10px' }}>
            {status === 'processing' ? 'Extracting text, classifying content, and generating MCQs. This might take a minute.' : ''}
          </p>
        </div>
      )}

      {status === 'done' && result && (
        <div className="card">
          <h2 style={{ color: 'var(--success)', marginBottom: '20px' }}>✅ Processing Complete</h2>
          <p><strong>File:</strong> {result.originalName}</p>
          <p><strong>Pages:</strong> {result.pageCount}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
            <div className="stat-card" style={{ padding: '16px' }}>
              <div className="stat-value">{countLearningGraphItems(result?.learningGraph).notes}</div>
              <div className="stat-label">Notes Extracted</div>
            </div>
            <div className="stat-card" style={{ padding: '16px' }}>
              <div className="stat-value">{countLearningGraphItems(result?.learningGraph).mcqs}</div>
              <div className="stat-label">MCQs Generated</div>
            </div>
          </div>
          
          <div style={{ marginTop: '30px' }}>
            <button className="btn btn-primary" onClick={() => setStatus('idle')}>Upload Another</button>
            <button 
              className="btn btn-secondary" 
              style={{ marginLeft: '12px' }}
              onClick={() => {
                // Store full payload for backward compatibility, but also pass uploadId via URL.
                // This enables DB-backed review screens without relying on session storage.
                sessionStorage.setItem('pdfReviewData', JSON.stringify(result));
                sessionStorage.setItem('pdfReviewUploadId', result?._id || '');
                window.location.href = `/pdf-review?uploadId=${encodeURIComponent(result?._id || '')}`;
              }}
            >
              Review Extracted Content
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="card" style={{ borderColor: 'var(--danger)' }}>
          <h3 style={{ color: 'var(--danger)' }}>Upload Failed</h3>
          <p>
            There was an error processing your PDF. See details below (this reflects the exact failing pipeline stage).
          </p>
          <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
            Stage: {stageText || 'Unknown'} • Progress: {progressPct}%
          </div>
          {errorLog?.length ? (
            <div style={{ marginTop: 12, textAlign: 'left' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Error details</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)' }}>
                {errorLog.slice(0, 6).map((e, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    {typeof e === 'string' ? e : e?.message || String(e)}
                  </li>
                ))}
              </ul>
              {errorLog.length > 6 ? (
                <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
                  +{errorLog.length - 6} more…
                </div>
              ) : null}
            </div>
          ) : null}
          <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setStatus('idle')}>Try Again</button>
        </div>
      )}
    </div>
  );
}
