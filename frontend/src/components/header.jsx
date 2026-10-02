import React from 'react';

export default function Header() {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="app-header">
      <a href="#" className="brand-logo">
        <span className="brand-mark">/</span>
        <span className="brand-name">Short-URL</span>
      </a>

      <nav className="nav-menu">
        <button className="nav-link" onClick={() => scrollToSection('shortener')}>
          ย่อลิงก์
        </button>
        <button className="nav-link" onClick={() => scrollToSection('stats')}>
          สถิติ
        </button>
        <button className="nav-link" onClick={() => scrollToSection('history')}>
          ประวัติ
        </button>
      </nav>
    </header>
  );
}
