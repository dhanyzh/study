'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const ADMIN_NAV = [
  { href: '/admin', icon: '📊', label: 'Dashboard' },
  { href: '/admin/users', icon: '👥', label: 'Users' },
  { href: '/admin/subjects', icon: '📚', label: 'Subjects' },
  { href: '/admin/quizzes', icon: '❓', label: 'Quizzes' },
  { href: '/admin/activity', icon: '📈', label: 'Activity' },
];

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/admin" className="sidebar-logo" onClick={() => setSidebarOpen(false)}>
            <span>🛡️ Admin Panel</span>
          </Link>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Administration</div>
            {ADMIN_NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span> {item.label}
              </Link>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Quick Links</div>
            <Link href="/dashboard" className="nav-item" onClick={() => setSidebarOpen(false)}>
              <span className="nav-icon">🏠</span> Student View
            </Link>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-avatar" style={{ background: 'linear-gradient(135deg, #EF4444, #F59E0B)' }}>
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.displayName}</div>
            <div className="sidebar-user-role" style={{ color: '#EF4444' }}>Admin</div>
          </div>
          <button 
            onClick={() => { logout(); setSidebarOpen(false); }} 
            className="btn btn-sm" 
            style={{ background: 'transparent', padding: '4px', opacity: 0.5 }}
            title="Logout"
          >
            🚪
          </button>
        </div>
      </div>

      <main className="main-content" style={{ marginRight: 0 }}>
        {children}
      </main>
    </div>
  );
}
