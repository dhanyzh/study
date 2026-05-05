'use client';
import Link from 'next/link';

export default function LandingPage() {

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="logo">
          <span className="logo-icon">✨</span>
          <span className="logo-text">Study OS</span>
        </div>
        <div className="nav-actions">
          <Link href="/login" className="btn btn-primary">Log In</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="badge">🚀 The Future of Learning is Here</div>
          <h1 className="hero-title">
            Your All-in-One <br />
            <span className="gradient-text">Study Workspace</span>
          </h1>
          <p className="hero-subtitle">
            Eliminate app switching. Learn, code, quiz, and get AI assistance — all in one beautifully unified platform.
          </p>
          <div className="hero-buttons">
            <Link href="/login" className="btn btn-primary btn-lg pulse-hover">Access Platform</Link>
          </div>
          
          <div className="hero-stats">
            <div className="stat"><strong>5+</strong> Built-in Subjects</div>
            <div className="stat"><strong>24/7</strong> AI Tutor</div>
            <div className="stat"><strong>100%</strong> Focus</div>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="hero-visual">
          <div className="glass-mockup">
            <div className="mockup-header">
              <div className="dots"><span></span><span></span><span></span></div>
            </div>
            <div className="mockup-body">
              <div className="mockup-sidebar"></div>
              <div className="mockup-content">
                <div className="mockup-block block-1"></div>
                <div className="mockup-row">
                  <div className="mockup-block block-2"></div>
                  <div className="mockup-block block-3"></div>
                </div>
              </div>
              <div className="mockup-ai"></div>
            </div>
          </div>
          
          {/* Floating UI Elements */}
          <div className="floating-card float-1">
            <div className="float-icon">💻</div>
            <div className="float-text">Live Code Compiler</div>
          </div>
          <div className="floating-card float-2">
            <div className="float-icon">📄</div>
            <div className="float-text">Smart PDF Analysis</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon bg-purple">🧮</div>
            <h3>Code Compiler</h3>
            <p>Write and execute DSA code directly in the browser with our Monaco integration.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon bg-cyan">📄</div>
            <h3>PDF Intelligence</h3>
            <p>Upload a PDF and watch our AI extract notes and generate practice quizzes automatically.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon bg-yellow">✨</div>
            <h3>StudyBot AI</h3>
            <p>Context-aware AI tutor that knows exactly what topic you are reading and answers doubts instantly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon bg-green">⏱️</div>
            <h3>Focus Timer</h3>
            <p>Built-in Pomodoro timer to track your sessions and ensure you stay productive without burning out.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
