'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useCallback } from 'react';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentUsers(data.recentUsers || []);
      } else {
        setError('Failed to load stats. Database may be unavailable.');
        // Fallback stats for local mode
        setStats({
          totalUsers: 0, totalSubjects: 0, totalChapters: 0,
          totalTopics: 0, totalQuizzes: 0, totalNotes: 0, activeUsers: 0,
        });
      }
    } catch (err) {
      setError('Could not connect to the server.');
      setStats({
        totalUsers: 0, totalSubjects: 0, totalChapters: 0,
        totalTopics: 0, totalQuizzes: 0, totalNotes: 0, activeUsers: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchStats();
  }, [token, fetchStats]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const statCards = [
    { icon: '👥', value: stats?.totalUsers || 0, label: 'Total Users', color: '#6C63FF' },
    { icon: '📚', value: stats?.totalSubjects || 0, label: 'Subjects', color: '#4ECDC4' },
    { icon: '📖', value: stats?.totalChapters || 0, label: 'Chapters', color: '#FF6B6B' },
    { icon: '📝', value: stats?.totalTopics || 0, label: 'Topics', color: '#FFE66D' },
    { icon: '❓', value: stats?.totalQuizzes || 0, label: 'Quizzes', color: '#2ECC71' },
    { icon: '📄', value: stats?.totalNotes || 0, label: 'Notes', color: '#0EA5E9' },
    { icon: '🟢', value: stats?.activeUsers || 0, label: 'Active (7d)', color: '#10B981' },
  ];

  return (
    <div>
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user?.displayName}. Here&apos;s your platform overview.</p>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {statCards.map((card, i) => (
          <div className="stat-card" key={i} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${Math.min(card.value * 10, 100)}%`, background: card.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {[
            { icon: '➕', label: 'Add Subject', href: '/admin/subjects', desc: 'Create a new subject module', perm: 'manage_content' },
            { icon: '👤', label: 'Manage Users', href: '/admin/users', desc: 'View and manage user accounts', perm: 'manage_users' },
            { icon: '📝', label: 'Add Quiz', href: '/admin/quizzes', desc: 'Create MCQ quiz questions', perm: 'manage_quizzes' },
            { icon: '📈', label: 'View Activity', href: '/admin/activity', desc: 'Monitor platform activity', perm: 'view_analytics' },
            { icon: '🛡️', label: 'Admin Management', href: '/admin/admins', desc: 'Manage system admins', perm: 'super_admin_only' },
          ].filter(action => {
            if (user?.role === 'super_admin') return true;
            if (action.perm === 'super_admin_only') return false;
            return user?.permissions?.includes(action.perm);
          }).map((action, i) => (
            <a key={i} href={action.href} className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{action.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>{action.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{action.desc}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Users */}
      {recentUsers.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>Recent Activity</h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>User</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Role</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: u.role === 'admin' ? 'linear-gradient(135deg, #EF4444, #F59E0B)' : 'linear-gradient(135deg, var(--accent), var(--info))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.75rem', color: '#fff', flexShrink: 0,
                        }}>
                          {(u.displayName || u.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.displayName || u.username}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700,
                        background: u.role === 'super_admin' ? 'rgba(239,68,68,0.2)' : u.role === 'admin' ? 'rgba(108,99,255,0.1)' : 'rgba(16,185,129,0.1)',
                        color: u.role === 'super_admin' ? '#EF4444' : u.role === 'admin' ? 'var(--accent)' : '#10B981',
                      }}>
                        {(u.role || 'user').replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
