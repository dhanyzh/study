'use client';
import { useAuth } from '@/context/AuthContext';
import { SUBJECTS } from '@/lib/constants';
import Link from 'next/link';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="dashboard-header">
        <h1>Welcome back, {user?.displayName}</h1>
        <p>What are we learning today?</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">3 Days</div>
          <div className="stat-label">Current Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">12.5h</div>
          <div className="stat-label">Time Spent (This Week)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">85%</div>
          <div className="stat-label">Avg Quiz Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">14</div>
          <div className="stat-label">Topics Completed</div>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: '40px' }}>
        <h2>Your Subjects</h2>
      </div>

      <div className="subjects-grid">
        {SUBJECTS.map((subject) => (
          <Link href={`/subjects/${subject.slug}`} key={subject.slug} className="subject-card" style={{ '--card-color': subject.color }}>
            <div className="subject-card-icon">{subject.icon}</div>
            <div className="subject-card-name">{subject.name}</div>
            <div className="subject-card-desc">{subject.description}</div>
            <div className="subject-card-meta">
              <span>0% Completed</span>
              <span>•</span>
              <span style={{ color: subject.color, fontWeight: 'bold' }}>Continue →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
