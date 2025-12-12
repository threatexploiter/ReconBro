// app/layout.js
'use client';
import './globals.css';
import { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem('rb-theme');
    const start = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    setTheme(start);
    document.documentElement.setAttribute('data-theme', start);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('rb-theme', next);
  };

  return (
    <html lang="en" className='hydrated'>
      <body>
        <Header theme={theme} toggleTheme={toggleTheme} />
        <div className="page-wrapper">{children}</div>
        
        <Footer />
      </body>
    </html>
  );
}
