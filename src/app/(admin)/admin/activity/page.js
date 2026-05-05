'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useCallback } from 'react';

export default function AdminActivity() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers((data.users || []).sort((a, b) => new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0)));
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch {
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token) fetchData(); }, [token, fetchData]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><div className="spinner"></div></div>;
  }

  const now = new Date();
  const onlineThreshold = 15 * 60 * 1000; // 15 minutes
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const onlineUsers = users.filter(u => u.lastLogin && (now - new Date(u.lastLogin)) < onlineThreshold);
  const todayUsers = users.filter(u => u.lastLogin && new Date(u.lastLogin) >= todayStart);

  const getTimeAgo = (date) => {
    if (!date) return 'Never';
    const diff = now - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1>📈 Activity Monitor</h1>
        <p>Track platform usage and user activity in real-time</p>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}

      {/* Activity Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-value">{onlineUsers.length}</div>
          <div className="stat-label">Online Now</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{todayUsers.length}</div>
          <div className="stat-label">Active Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats?.activeUsers || 0}</div>
          <div className="stat-label">Active This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats?.totalUsers || 0}</div>
          <div className="stat-label">Total Users</div>
        </div>
      </div>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
            Online Now
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {onlineUsers.map(u => (
              <div key={u._id} className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: u.role === 'admin' ? 'linear-gradient(135deg, #EF4444, #F59E0B)' : 'linear-gradient(135deg, var(--accent), var(--info))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.8rem', color: '#fff', position: 'relative',
                }}>
                  {(u.displayName || u.username).charAt(0).toUpperCase()}
                  <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', border: '2px solid var(--bg-card)' }}></span>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.displayName || u.username}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--success)' }}>● Active</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Activity Log */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>📋 Login History</h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)' }}>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Last Login</th>
                <th style={thStyle}>Time Ago</th>
                <th style={thStyle}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users found. Database may be unavailable.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isOnline = u.lastLogin && (now - new Date(u.lastLogin)) < onlineThreshold;
                  const isToday = u.lastLogin && new Date(u.lastLogin) >= todayStart;

                  return (
                    <tr key={u._id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: u.role === 'admin' ? 'linear-gradient(135deg, #EF4444, #F59E0B)' : 'linear-gradient(135deg, var(--accent), var(--info))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.75rem', color: '#fff', flexShrink: 0,
                          }}>
                            {(u.displayName || u.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{u.displayName || u.username}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '2px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700,
                          background: u.role === 'admin' ? 'rgba(239,68,68,0.1)' : 'rgba(108,99,255,0.1)',
                          color: u.role === 'admin' ? '#EF4444' : 'var(--accent)',
                        }}>
                          {u.role || 'student'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700,
                          background: isOnline ? 'rgba(16,185,129,0.1)' : isToday ? 'rgba(245,158,11,0.1)' : 'rgba(156,163,175,0.1)',
                          color: isOnline ? '#10B981' : isToday ? '#F59E0B' : 'var(--text-muted)',
                        }}>
                          {isOnline ? '🟢 Online' : isToday ? '🟡 Today' : '⚪ Offline'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.8rem', color: isOnline ? 'var(--success)' : 'var(--text-muted)' }}>
                          {getTimeAgo(u.lastLogin)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform Health */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>🩺 Platform Health</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Subjects', value: stats?.totalSubjects || 0, icon: '📚', color: '#4ECDC4' },
            { label: 'Chapters', value: stats?.totalChapters || 0, icon: '📖', color: '#6C63FF' },
            { label: 'Topics', value: stats?.totalTopics || 0, icon: '📝', color: '#FF6B6B' },
            { label: 'Quizzes', value: stats?.totalQuizzes || 0, icon: '❓', color: '#2ECC71' },
            { label: 'Notes', value: stats?.totalNotes || 0, icon: '📄', color: '#FFE66D' },
          ].map((item, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px' }}>
              <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '10px 16px' };
