'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SUBJECTS } from '@/lib/constants';
import { useState } from 'react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '☰'}
      </button>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/dashboard" className="sidebar-logo" onClick={() => setIsOpen(false)}>
            <span>Study OS</span>
          </Link>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Main</div>
            <Link href="/dashboard" className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
              <span className="nav-icon">🏠</span> Dashboard
            </Link>
            <Link href="/pomodoro" className={`nav-item ${pathname === '/pomodoro' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
              <span className="nav-icon">⏱️</span> Focus Timer
            </Link>
            <Link href="/pdf-upload" className={`nav-item ${pathname === '/pdf-upload' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
              <span className="nav-icon">📄</span> PDF Intelligence
              <span className="nav-badge">AI</span>
            </Link>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Subjects</div>
            {SUBJECTS.map(subject => (
              <Link 
                key={subject.slug} 
                href={`/subjects/${subject.slug}`}
                className={`nav-item ${pathname.includes(`/subjects/${subject.slug}`) ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="nav-icon">{subject.icon}</span> {subject.name}
              </Link>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Practice Area</div>
            <Link href="/practice/code" className={`nav-item ${pathname === '/practice/code' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
              <span className="nav-icon">💻</span> Code Editor
            </Link>
            <Link href="/practice/sql" className={`nav-item ${pathname === '/practice/sql' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
              <span className="nav-icon">🗄️</span> SQL Compiler
            </Link>
          </div>
        </div>

        {user && (
          <div className="sidebar-footer">
            <div className="sidebar-avatar">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.displayName}</div>
              <div className="sidebar-user-role" style={user.role === 'admin' ? { color: '#EF4444' } : undefined}>
                {user.role === 'admin' ? 'Admin' : 'Student'}
              </div>
            </div>
            <button 
              onClick={() => { logout(); setIsOpen(false); }} 
              className="btn btn-sm" 
              style={{ background: 'transparent', padding: '4px', opacity: 0.5 }}
              title="Logout"
            >
              🚪
            </button>
          </div>
        )}
      </div>
    </>
  );
}
