'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useCallback } from 'react';

const PERMISSIONS = [
  { id: 'manage_users', label: 'Manage Users', description: 'View and delete student users' },
  { id: 'manage_content', label: 'Manage Content', description: 'Upload and edit study notes/PDFs' },
  { id: 'manage_quizzes', label: 'Manage Quizzes', description: 'Create and modify quiz questions' },
  { id: 'view_analytics', label: 'View Analytics', description: 'Access system-wide usage statistics' },
];

export default function AdminManagement() {
  const { user, token } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    password: '',
    displayName: '',
    email: '',
    role: 'admin',
    permissions: [],
  });
  const [addLoading, setAddLoading] = useState(false);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/admins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      } else {
        setError('Failed to load admins.');
      }
    } catch {
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && user?.role === 'super_admin') {
      fetchAdmins();
    }
  }, [token, user, fetchAdmins]);

  const togglePermission = (permId) => {
    setNewAdmin(prev => {
      const perms = prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: perms };
    });
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(newAdmin),
      });

      if (res.ok) {
        const data = await res.json();
        setAdmins(prev => [data.admin, ...prev]);
        setShowAddForm(false);
        setNewAdmin({ username: '', password: '', displayName: '', email: '', role: 'admin', permissions: [] });
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create admin.');
      }
    } catch {
      setError('Connection error.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;
    
    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAdmins(prev => prev.filter(a => a._id !== adminId));
      }
    } catch {
      setError('Delete failed.');
    }
  };

  const handleUpdatePermissions = async (adminId, perms) => {
    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ permissions: perms }),
      });
      if (res.ok) {
        setAdmins(prev => prev.map(a => a._id === adminId ? { ...a, permissions: perms } : a));
      }
    } catch {
      setError('Update failed.');
    }
  };

  if (user?.role !== 'super_admin') {
    return <div className="auth-error">Access Denied. Super Admin only.</div>;
  }

  if (loading) return <div className="spinner" style={{ margin: '80px auto' }}></div>;

  return (
    <div>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>🛡️ Admin Management</h1>
          <p>Control system access levels and permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ New Admin'}
        </button>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: '24px' }}>⚠️ {error}</div>}

      {showAddForm && (
        <div className="card" style={{ marginBottom: '32px', borderLeft: '4px solid var(--accent)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Create New Administrator</h2>
          <form onSubmit={handleCreateAdmin}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label className="form-label">Username</label>
                <input 
                  type="text" className="form-input" required 
                  value={newAdmin.username} onChange={e => setNewAdmin({...newAdmin, username: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label">Password</label>
                <input 
                  type="password" className="form-input" required 
                  value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label">Display Name</label>
                <input 
                  type="text" className="form-input" 
                  value={newAdmin.displayName} onChange={e => setNewAdmin({...newAdmin, displayName: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label">Role</label>
                <select 
                  className="form-input" 
                  value={newAdmin.role} onChange={e => setNewAdmin({...newAdmin, role: e.target.value})}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">Permissions (for Admin role)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {PERMISSIONS.map(p => (
                  <label key={p.id} style={{ 
                    display: 'flex', alignItems: 'center', gap: '10px', 
                    padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', cursor: 'pointer' 
                  }}>
                    <input 
                      type="checkbox" 
                      checked={newAdmin.permissions.includes(p.id)}
                      onChange={() => togglePermission(p.id)}
                    />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={addLoading}>
              {addLoading ? 'Creating...' : 'Create Admin Account'}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-hover)' }}>
              <th style={thStyle}>Admin</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Permissions</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a._id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600 }}>{a.displayName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{a.username}</div>
                </td>
                <td style={tdStyle}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
                    background: a.role === 'super_admin' ? '#EF4444' : 'var(--accent)', color: '#fff'
                  }}>
                    {a.role.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td style={tdStyle}>
                  {a.role === 'super_admin' ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Full Access</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {PERMISSIONS.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            const newPerms = a.permissions.includes(p.id)
                              ? a.permissions.filter(x => x !== p.id)
                              : [...a.permissions, p.id];
                            handleUpdatePermissions(a._id, newPerms);
                          }}
                          style={{
                            padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)',
                            fontSize: '0.65rem', background: a.permissions.includes(p.id) ? 'rgba(108,99,255,0.1)' : 'transparent',
                            color: a.permissions.includes(p.id) ? 'var(--accent)' : 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
                <td style={tdStyle}>
                  <button 
                    className="btn btn-sm btn-danger" 
                    onClick={() => handleDeleteAdmin(a._id)}
                    disabled={a._id === user.userId}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)' };
const tdStyle = { padding: '12px 16px' };
