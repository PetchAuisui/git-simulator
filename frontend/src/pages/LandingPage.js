import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-content">
          <h1 className="logo">🔧 Git Simulator</h1>
          <div className="nav-buttons">
            <button 
              className="nav-btn login"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
            <button 
              className="nav-btn register"
              onClick={() => navigate('/register')}
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h2>Learn Git Commands in Real Time</h2>
          <p>
            Git Simulator is a web-based learning platform where you can practice git commands 
            in a safe, isolated environment. Each user gets their own repositories and terminal.
          </p>
          <div className="hero-buttons">
            <button 
              className="btn btn-primary btn-large"
              onClick={() => navigate('/register')}
            >
              Get Started Free
            </button>
            <button 
              className="btn btn-secondary btn-large"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="terminal-preview">
            <div className="terminal-header">
              <span>~/git-simulator</span>
            </div>
            <div className="terminal-body">
              <p>$ git init my-project</p>
              <p className="success">✓ Initialized empty Git repository</p>
              <p>$ git add .</p>
              <p>$ git commit -m "Initial commit"</p>
              <p className="success">✓ [master 1a2b3c4] Initial commit</p>
              <p>$ git branch -a</p>
              <p className="info">* master</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Use Git Simulator?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Learn Git Basics</h3>
            <p>
              Master fundamental git commands like init, add, commit, branch, merge, and more 
              in an interactive learning environment.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Isolated Environments</h3>
            <p>
              Each user gets completely isolated git repositories. Your work is private and 
              separate from other users on the platform.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Real Git Backend</h3>
            <p>
              Uses actual git under the hood. Not a simulation—this is real git, so you'll 
              learn exactly how git works in production.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💻</div>
            <h3>Web Terminal</h3>
            <p>
              Full terminal access to your repositories. Type any git command freely and see 
              real-time results and feedback.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🌳</div>
            <h3>Branch Management</h3>
            <p>
              Create, switch, and manage multiple branches easily. Experiment with workflows 
              without affecting your main code.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>File Editor</h3>
            <p>
              No need to install additional tools. Edit files directly in the browser and 
              commit changes right away.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create Account</h3>
            <p>Sign up with a username and password to get started</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Initialize Repository</h3>
            <p>Create a new git repository from the terminal</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Practice Commands</h3>
            <p>Type git commands and learn through real feedback</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Master Git</h3>
            <p>Build confidence with branches, commits, and workflows</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Ready to Master Git?</h2>
        <p>Start learning git today, free and at your own pace.</p>
        <button 
          className="btn btn-primary btn-large"
          onClick={() => navigate('/register')}
        >
          Create Free Account
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2024 Git Simulator. Built for learning git fundamentals.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
