'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useCallback } from 'react';

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        setError('Failed to load users.');
      }
    } catch {
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token, fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      }
    } catch {
      setError('Failed to update role.');
    } finally {
      setActionLoading('');
    }
  };

  const handleDelete = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== userId));
      }
    } catch {
      setError('Failed to delete user.');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1>👥 User Management</h1>
        <p>{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-hover)' }}>
              <th style={thStyle}>User</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Last Login</th>
              <th style={thStyle}>Actions</th>
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
              users.map((u) => (
                <tr key={u._id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: u.role === 'admin' ? 'linear-gradient(135deg, #EF4444, #F59E0B)' : 'linear-gradient(135deg, var(--accent), var(--info))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.78rem', color: '#fff', flexShrink: 0,
                      }}>
                        {(u.displayName || u.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.displayName || u.username}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{u.email || '—'}</span>
                  </td>
                  <td style={tdStyle}>
                    <select
                      value={u.role || 'student'}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      disabled={actionLoading === u._id}
                      style={{
                        padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
                        background: u.role === 'admin' ? 'rgba(239,68,68,0.1)' : 'rgba(108,99,255,0.1)',
                        color: u.role === 'admin' ? '#EF4444' : 'var(--accent)',
                        border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(u._id, u.username)}
                      disabled={actionLoading === u._id}
                      style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                    >
                      {actionLoading === u._id ? '...' : '🗑️ Delete'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '12px 16px' };
