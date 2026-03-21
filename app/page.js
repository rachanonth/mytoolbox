'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import './globals.css';

const SKY = [
  ['#0b0c2a','rgba(255,255,255,0.07)','rgba(255,255,255,0.12)','#7b9fff','#e0e8ff','#8090c0','#c0ccff'],
  ['#0d1030','rgba(255,255,255,0.07)','rgba(255,255,255,0.12)','#7b9fff','#e0e8ff','#8090c0','#c0ccff'],
  ['#1a1060','rgba(255,255,255,0.09)','rgba(255,255,255,0.14)','#a084e8','#e8e0ff','#9080c0','#ccc0ff'],
  ['#e87840','rgba(255,255,255,0.88)','rgba(255,255,255,1.0)','#b84020','#2a1810','#7a5040','#3a2010'],
  ['#74b8e0','rgba(255,255,255,0.88)','rgba(255,255,255,1.0)','#1a5a8a','#0a2a4a','#3a6a8a','#0a2040'],
  ['#4aa8e8','rgba(255,255,255,0.90)','rgba(255,255,255,1.0)','#0a4a80','#0a2040','#2a5a80','#081830'],
  ['#2e9ae0','rgba(255,255,255,0.90)','rgba(255,255,255,1.0)','#083a70','#081830','#1a4a70','#061020'],
  ['#4aaade','rgba(255,255,255,0.90)','rgba(255,255,255,1.0)','#0a4a80','#0a2040','#2a5a80','#081830'],
  ['#e8a840','rgba(255,255,255,0.88)','rgba(255,255,255,1.0)','#7a3010','#2a1008','#8a5020','#2a1008'],
  ['#d05030','rgba(255,255,255,0.88)','rgba(255,255,255,1.0)','#6a2010','#200808','#703020','#200808'],
  ['#3a1860','rgba(255,255,255,0.10)','rgba(255,255,255,0.15)','#c090ff','#e8d8ff','#9070c0','#d0c0ff'],
  ['#160a38','rgba(255,255,255,0.08)','rgba(255,255,255,0.12)','#8880d0','#d8d0ff','#8070b0','#c0b8ff'],
];

function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

function lerpHex(a, b, t) {
  const [r1,g1,b1] = hexToRgb(a), [r2,g2,b2] = hexToRgb(b);
  const r = Math.round(r1+(r2-r1)*t), g = Math.round(g1+(g2-g1)*t), bl = Math.round(b1+(b2-b1)*t);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`;
}

function getSkyTheme() {
  const mins = new Date().getHours() * 60 + new Date().getMinutes();
  const idx = Math.floor(mins / 120) % 12;
  const next = (idx + 1) % 12;
  const t = (mins % 120) / 120;
  const c = SKY[idx], n = SKY[next];
  return {
    bg:         lerpHex(c[0], n[0], t),
    cardBg:     t < 0.5 ? c[1] : n[1],
    cardHover:  t < 0.5 ? c[2] : n[2],
    letter:     t < 0.5 ? c[3] : n[3],
    title:      t < 0.5 ? c[4] : n[4],
    desc:       t < 0.5 ? c[5] : n[5],
    header:     t < 0.5 ? c[6] : n[6],
  };
}

export default function Home() {
  const [tools, setTools] = useState(null);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    setTheme(getSkyTheme());
  }, []);

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

  if (!theme) return null;

  return (
    <div style={{ background: theme.bg, minHeight: '100vh' }}>
      <header>
        <h1 style={{ color: theme.header }}>KMP Toolbox</h1>
        <Link href="/admin" className="settings-icon" title="Admin">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </Link>
      </header>

      <main>
        <div className="grid">
          {error ? (
            <div className="state-msg" style={{ color: theme.desc }}>{error}</div>
          ) : tools === null ? (
            <div className="state-msg" style={{ color: theme.desc }}>Loading...</div>
          ) : tools.length === 0 ? (
            <div className="state-msg" style={{ color: theme.desc }}>
              No tools yet. <Link href="/admin" style={{ color: theme.letter }}>Add some in admin.</Link>
            </div>
          ) : tools.map(t => (
            <a
              key={t.id}
              className="card"
              href={t.url || '#'}
              target={t.url ? '_blank' : undefined}
              rel="noopener noreferrer"
              style={{ background: theme.cardBg }}
              onMouseEnter={e => e.currentTarget.style.background = theme.cardHover}
              onMouseLeave={e => e.currentTarget.style.background = theme.cardBg}
            >
              <div className="card-letter" style={{ color: theme.letter }}>
                {(t.title || '?').charAt(0).toUpperCase()}
              </div>
              <div className="card-title" style={{ color: theme.title }}>{t.title}</div>
              <div className="card-desc"  style={{ color: theme.desc  }}>{t.description || ''}</div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
