'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import './globals.css';
import DotGrid from './components/DotGrid';

const THEMES = {
  light: {
    bg:               '#F0F7FF',
    cardBg:           '#FFFFFF',
    cardHover:        '#E8F4FF',
    cardBorder:       '1px solid #D0E8FF',
    cardShadow:       '0 1px 4px rgba(59,130,246,0.08)',
    cardShadowHover:  '0 4px 16px rgba(59,130,246,0.15)',
    letter:           '#1D6FCC',
    title:            '#0F2942',
    desc:             '#4A6A8A',
    header:           '#0F2942',
    border:           'rgba(59,130,246,0.15)',
    toggle:           '#4A90D9',
    favIconInactive:  'rgba(59,130,246,0.25)',
    favIconActive:    '#E05C5C',
    favIconHover:     'rgba(59,130,246,0.55)',
    filterBtnActiveBg:'rgba(59,130,246,0.12)',
  },
  dark: {
    bg:               '#121212',
    cardBg:           '#1E1E1E',
    cardHover:        '#252525',
    cardBorder:       '1px solid #2A2A2A',
    cardShadow:       '0 1px 4px rgba(0,0,0,0.4)',
    cardShadowHover:  '0 4px 16px rgba(56,189,248,0.1)',
    letter:           '#38BDF8',
    title:            '#E8F4FF',
    desc:             '#6A8FAA',
    header:           '#C8E0F4',
    border:           'rgba(56,189,248,0.12)',
    toggle:           '#38BDF8',
    favIconInactive:  'rgba(56,189,248,0.22)',
    favIconActive:    '#F87171',
    favIconHover:     'rgba(56,189,248,0.55)',
    filterBtnActiveBg:'rgba(56,189,248,0.12)',
  },
};

const HEART = 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';

export default function Home() {
  const [tools,       setTools]       = useState(null);
  const [error,       setError]       = useState('');
  const [mode,        setMode]        = useState('light');
  const [favorites,   setFavorites]   = useState([]);
  const [showFavOnly, setShowFavOnly] = useState(false);

  // Load persisted preferences
  useEffect(() => {
    setMode(localStorage.getItem('toolbox_theme') || 'light');
    try {
      const saved = localStorage.getItem('toolbox_favorites');
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  function toggleMode() {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem('toolbox_theme', next);
  }

  function toggleFavorite(id) {
    const sid = String(id);
    setFavorites(prev => {
      const next = prev.includes(sid) ? prev.filter(f => f !== sid) : [...prev, sid];
      localStorage.setItem('toolbox_favorites', JSON.stringify(next));
      return next;
    });
  }

  useEffect(() => {
    async function load() {
      try {
        const cfg = await fetch('/api/config').then(r => r.json());
        if (!cfg.SUPABASE_URL) { setError('Config missing.'); return; }
        const res = await fetch(
          `${cfg.SUPABASE_URL}/rest/v1/tools?select=*&order=sort_order.asc,created_at.asc`,
          { headers: { apikey: cfg.SUPABASE_KEY, Authorization: `Bearer ${cfg.SUPABASE_KEY}` } }
        );
        if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
        setTools(await res.json());
      } catch (e) {
        setError(e.message);
      }
    }
    load();
  }, []);

  const t = THEMES[mode];
  const displayedTools = tools && (showFavOnly ? tools.filter(tool => favorites.includes(String(tool.id))) : tools);

  return (
    <div style={{ background: t.bg, minHeight: '100vh', position: 'relative' }}>
      <DotGrid mode={mode} />

      <header style={{ borderBottomColor: t.border }}>
        <h1 style={{ color: t.header }}>KMP Toolbox</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

          {/* Theme toggle */}
          <button onClick={toggleMode} title={mode === 'light' ? 'Switch to Night mode' : 'Switch to Clinical mode'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.toggle, display: 'flex', alignItems: 'center', padding: 0 }}>
            {mode === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1"  x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
          </button>

          {/* Favorites filter toggle */}
          <button onClick={() => setShowFavOnly(p => !p)} title={showFavOnly ? 'Show all tools' : 'Show favorites only'}
            style={{
              background: showFavOnly ? t.filterBtnActiveBg : 'none',
              border: 'none', cursor: 'pointer',
              color: showFavOnly ? t.favIconActive : t.toggle,
              display: 'flex', alignItems: 'center',
              padding: '2px 4px', borderRadius: '4px',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24"
              fill={showFavOnly ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={HEART}/>
            </svg>
          </button>

          {/* Admin */}
          <Link href="/admin" className="settings-icon" title="Admin" style={{ color: t.toggle }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </Link>
        </div>
      </header>

      <main>
        <div className="grid">
          {error ? (
            <div className="state-msg" style={{ color: t.desc }}>{error}</div>
          ) : displayedTools === null ? (
            <div className="state-msg" style={{ color: t.desc }}>Loading...</div>
          ) : displayedTools.length === 0 ? (
            <div className="state-msg" style={{ color: t.desc }}>
              {showFavOnly
                ? <>No favorites yet. Click ♥ on any tool to add it.</>
                : <>No tools yet. <Link href="/admin" style={{ color: t.letter }}>Add some in admin.</Link></>
              }
            </div>
          ) : displayedTools.map(tool => {
            const isFav = favorites.includes(String(tool.id));
            return (
              <a
                key={tool.id}
                className="card"
                href={tool.url || '#'}
                target={tool.url ? '_blank' : undefined}
                rel="noopener noreferrer"
                style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}
                onMouseEnter={e => { e.currentTarget.style.background = t.cardHover; e.currentTarget.style.boxShadow = t.cardShadowHover; }}
                onMouseLeave={e => { e.currentTarget.style.background = t.cardBg;    e.currentTarget.style.boxShadow = t.cardShadow; }}
              >
                {/* Favorite button */}
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(tool.id); }}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '2px', lineHeight: 1, zIndex: 1,
                    color: isFav ? t.favIconActive : t.favIconInactive,
                  }}
                  onMouseEnter={e => { if (!isFav) e.currentTarget.style.color = t.favIconHover; }}
                  onMouseLeave={e => { if (!isFav) e.currentTarget.style.color = t.favIconInactive; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24"
                    fill={isFav ? 'currentColor' : 'none'}
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={HEART}/>
                  </svg>
                </button>

                <div className="card-letter" style={{ color: t.letter }}>{(tool.title || '?').charAt(0).toUpperCase()}</div>
                <div className="card-title"  style={{ color: t.title  }}>{tool.title}</div>
                <div className="card-desc"   style={{ color: t.desc   }}>{tool.description || ''}</div>
              </a>
            );
          })}
        </div>
      </main>
    </div>
  );
}
