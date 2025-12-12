'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // init theme from localStorage or system
    const saved = typeof window !== 'undefined' ? localStorage.getItem('rb-theme') : null;
    if (saved) setTheme(saved);
    else {
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('rb-theme', theme);
      // notify other parts of app
      window.dispatchEvent(new CustomEvent('rb:theme', { detail: theme }));
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  return (
    <header className="cb-header">
      <div className="cb-header-inner">
        <div className="cb-left">
          <Link href="/" className="cb-brand">
            <div className="cb-logo">RB</div>
            <div className="cb-brand-text">
              <div className="cb-title">Recon Bro</div>
              <div className="cb-sub">AI Automation Chatbot</div>
            </div>
          </Link>
        </div>

        <nav className={`cb-nav ${open ? 'open' : ''}`}>
          <Link href="/" className="cb-nav-link">Home</Link>
          <Link href="/docs" className="cb-nav-link">Docs</Link>
          <button className="cb-theme-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </nav>

        <div className="cb-right">
          <button className="cb-hamburger" onClick={() => setOpen((o) => !o)} aria-label="menu">
            <span className="cb-ham-line" />
            <span className="cb-ham-line" />
            <span className="cb-ham-line" />
          </button>
        </div>
      </div>
    </header>
  );
}
