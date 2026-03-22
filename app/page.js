'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import './globals.css';

const LS_THEME     = 'toolbox_theme';
const LS_COMPACT   = 'toolbox_compact';
const LS_FAVORITES = 'toolbox_favorites';
const LS_ORDER     = 'toolbox_order';

const THEMES = {
  light: {
    bg:               'linear-gradient(135deg, #dbeafe 0%, #eff6ff 40%, #e0f2fe 100%)',
    blob1:            'radial-gradient(ellipse at 20% 20%, rgba(147,197,253,0.55) 0%, transparent 60%)',
    blob2:            'radial-gradient(ellipse at 80% 70%, rgba(196,181,253,0.45) 0%, transparent 55%)',
    blob3:            'radial-gradient(ellipse at 55% 10%, rgba(125,211,252,0.40) 0%, transparent 50%)',
    cardBg:           'rgba(255,255,255,0.55)',
    cardHover:        'rgba(255,255,255,0.80)',
    cardBorder:       '1px solid rgba(255,255,255,0.80)',
    cardShadow:       '0 2px 12px rgba(59,130,246,0.08)',
    cardShadowHover:  '0 8px 32px rgba(59,130,246,0.14)',
    cardRearrange:    'rgba(255,255,255,0.75)',
    cardRearrangeBorder: '1px solid rgba(59,130,246,0.40)',
    letter:           '#1D6FCC',
    title:            '#0F2942',
    desc:             '#4A6A8A',
    header:           '#0F2942',
    headerBg:         'rgba(240,247,255,0.60)',
    border:           'rgba(255,255,255,0.50)',
    toggle:           '#4A90D9',
    rearrangeBannerBg:'rgba(59,130,246,0.10)',
    favIconInactive:  'rgba(59,130,246,0.25)',
    favIconActive:    '#E05C5C',
    favIconHover:     'rgba(59,130,246,0.55)',
    filterBtnActiveBg:'rgba(59,130,246,0.12)',
  },
  dark: {
    bg:               'linear-gradient(135deg, #0a0f1e 0%, #121212 45%, #0c1a14 100%)',
    blob1:            'radial-gradient(ellipse at 15% 25%, rgba(30,58,138,0.55) 0%, transparent 60%)',
    blob2:            'radial-gradient(ellipse at 85% 65%, rgba(6,78,59,0.45) 0%, transparent 55%)',
    blob3:            'radial-gradient(ellipse at 60% 5%,  rgba(14,116,144,0.35) 0%, transparent 50%)',
    cardBg:           'rgba(255,255,255,0.06)',
    cardHover:        'rgba(255,255,255,0.11)',
    cardBorder:       '1px solid rgba(255,255,255,0.10)',
    cardShadow:       '0 2px 12px rgba(0,0,0,0.35)',
    cardShadowHover:  '0 8px 32px rgba(0,0,0,0.50)',
    cardRearrange:    'rgba(255,255,255,0.10)',
    cardRearrangeBorder: '1px solid rgba(56,189,248,0.35)',
    letter:           '#38BDF8',
    title:            '#E8F4FF',
    desc:             '#6A8FAA',
    header:           '#C8E0F4',
    headerBg:         'rgba(10,15,30,0.55)',
    border:           'rgba(255,255,255,0.08)',
    toggle:           '#38BDF8',
    rearrangeBannerBg:'rgba(56,189,248,0.08)',
    favIconInactive:  'rgba(56,189,248,0.22)',
    favIconActive:    '#F87171',
    favIconHover:     'rgba(56,189,248,0.55)',
    filterBtnActiveBg:'rgba(56,189,248,0.12)',
  },
};

const HEART = 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';

function applyUserOrder(tools, userOrder) {
  if (!userOrder.length) return tools;
  const map      = Object.fromEntries(tools.map(t => [String(t.id), t]));
  const orderSet = new Set(userOrder);
  const ordered  = userOrder.map(id => map[id]).filter(Boolean);
  const newOnes  = tools.filter(t => !orderSet.has(String(t.id)));
  return [...ordered, ...newOnes];
}

export default function Home() {
  const [tools,       setTools]       = useState(null);
  const [error,       setError]       = useState('');
  const [mode,        setMode]        = useState('light');
  const [favorites,   setFavorites]   = useState([]);
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [compact,     setCompact]     = useState(false);
  const [userOrder,   setUserOrder]   = useState([]);
  const [rearranging, setRearranging] = useState(false);

  const dragIdx     = useRef(null);
  const dragOverIdx = useRef(null);

  useEffect(() => {
    setMode(localStorage.getItem(LS_THEME) || 'light');
    setCompact(localStorage.getItem(LS_COMPACT) === 'true');

    let savedFavs = null, savedOrder = null;
    try { savedFavs  = JSON.parse(localStorage.getItem(LS_FAVORITES)); } catch {}
    try { savedOrder = JSON.parse(localStorage.getItem(LS_ORDER)); }     catch {}
    if (savedFavs)  setFavorites(savedFavs);
    if (savedOrder) setUserOrder(savedOrder);

    async function load() {
      try {
        const cfg = await fetch('/api/config').then(r => r.json());
        if (!cfg.SUPABASE_URL) { setError('Config missing.'); return; }
        const res = await fetch(
          `${cfg.SUPABASE_URL}/rest/v1/tools?select=*&order=sort_order.asc,created_at.asc`,
          { headers: { apikey: cfg.SUPABASE_KEY, Authorization: `Bearer ${cfg.SUPABASE_KEY}` } }
        );
        if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
        const data = await res.json();
        setTools(savedOrder ? applyUserOrder(data, savedOrder) : data);
      } catch (e) {
        setError(e.message);
      }
    }
    load();
  }, []);

  function toggleMode() {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem(LS_THEME, next);
  }

  function toggleCompact() {
    const next = !compact;
    setCompact(next);
    localStorage.setItem(LS_COMPACT, String(next));
  }

  function toggleFavorite(id) {
    const sid = String(id);
    setFavorites(prev => {
      const next = prev.includes(sid) ? prev.filter(f => f !== sid) : [...prev, sid];
      localStorage.setItem(LS_FAVORITES, JSON.stringify(next));
      return next;
    });
  }

  function toggleRearrange() {
    if (!rearranging) setShowFavOnly(false);
    setRearranging(r => !r);
  }

  function resetOrder() {
    setUserOrder([]);
    localStorage.removeItem(LS_ORDER);
  }

  function onDragStart(i) { dragIdx.current = i; }
  function onDragOver(e, i) { e.preventDefault(); dragOverIdx.current = i; }

  function onDrop() {
    const from = dragIdx.current;
    const to   = dragOverIdx.current;
    dragIdx.current = null;
    dragOverIdx.current = null;
    if (from === null || to === null || from === to) return;

    const next = [...tools];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const newOrder = next.map(t => String(t.id));

    setTools(next);
    setUserOrder(newOrder);
    localStorage.setItem(LS_ORDER, JSON.stringify(newOrder));
  }

  const t = THEMES[mode];
  const displayedTools = tools && ((!rearranging && showFavOnly)
    ? tools.filter(tool => favorites.includes(String(tool.id)))
    : tools);

  return (
    <div data-compact={compact} style={{ background: t.bg, minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: t.blob1 }} />
        <div style={{ position: 'absolute', inset: 0, background: t.blob2 }} />
        <div style={{ position: 'absolute', inset: 0, background: t.blob3 }} />
      </div>

      <header style={{ borderBottomColor: t.border, background: t.headerBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', position: 'relative', zIndex: 2 }}>
        <h1 style={{ color: t.header }}>KMP Toolbox</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

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

          {!rearranging && (
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
          )}

          <button onClick={toggleCompact} title={compact ? 'Switch to normal view' : 'Switch to compact view'}
            style={{
              background: compact ? t.filterBtnActiveBg : 'none',
              border: 'none', cursor: 'pointer',
              color: t.toggle, display: 'flex', alignItems: 'center',
              padding: '2px 4px', borderRadius: '4px',
            }}>
            {compact ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="4" height="4"/><rect x="10" y="3" width="4" height="4"/><rect x="17" y="3" width="4" height="4"/>
                <rect x="3" y="10" width="4" height="4"/><rect x="10" y="10" width="4" height="4"/><rect x="17" y="10" width="4" height="4"/>
                <rect x="3" y="17" width="4" height="4"/><rect x="10" y="17" width="4" height="4"/><rect x="17" y="17" width="4" height="4"/>
              </svg>
            )}
          </button>

          <button onClick={toggleRearrange} title={rearranging ? 'Done rearranging' : 'Rearrange tools'}
            style={{
              background: rearranging ? t.filterBtnActiveBg : 'none',
              border: 'none', cursor: 'pointer', color: t.toggle,
              display: 'flex', alignItems: 'center',
              padding: '2px 4px', borderRadius: '4px',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6"  x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6"  x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>

        </div>
      </header>

      {rearranging && (
        <div style={{
          background: t.rearrangeBannerBg,
          borderBottom: `1px solid ${t.border}`,
          padding: '8px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative', zIndex: 2,
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        }}>
          <span style={{ fontSize: '0.78rem', color: t.toggle, letterSpacing: '0.04em' }}>
            Drag cards to reorder
          </span>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {userOrder.length > 0 && (
              <button onClick={resetOrder} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.75rem', color: t.toggle,
                opacity: 0.7, textDecoration: 'underline', padding: 0,
              }}>
                Reset to default
              </button>
            )}
            <button onClick={toggleRearrange} style={{
              background: t.toggle, color: '#fff',
              border: 'none', cursor: 'pointer',
              fontSize: '0.75rem', padding: '4px 14px', borderRadius: '4px',
            }}>
              Done
            </button>
          </div>
        </div>
      )}

      <main style={{ position: 'relative', zIndex: 1 }}>
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
          ) : displayedTools.map((tool, i) => {
            const isFav = favorites.includes(String(tool.id));
            return (
              <a
                key={tool.id}
                className={`card${rearranging ? ' card-rearranging' : ''}`}
                href={rearranging ? undefined : (tool.url || '#')}
                target={!rearranging && tool.url ? '_blank' : undefined}
                rel="noopener noreferrer"
                draggable={rearranging}
                onDragStart={rearranging ? () => onDragStart(i) : undefined}
                onDragOver={rearranging ? (e) => onDragOver(e, i) : undefined}
                onDrop={rearranging ? onDrop : undefined}
                onClick={rearranging ? e => e.preventDefault() : undefined}
                style={{
                  background: rearranging ? t.cardRearrange : t.cardBg,
                  border:     rearranging ? t.cardRearrangeBorder : t.cardBorder,
                  boxShadow:  t.cardShadow,
                  cursor:     rearranging ? 'grab' : undefined,
                }}
                onMouseEnter={!rearranging ? (e => { e.currentTarget.style.background = t.cardHover; e.currentTarget.style.boxShadow = t.cardShadowHover; }) : undefined}
                onMouseLeave={!rearranging ? (e => { e.currentTarget.style.background = t.cardBg;    e.currentTarget.style.boxShadow = t.cardShadow; }) : undefined}
              >
                {rearranging && (
                  <span style={{
                    position: 'absolute', top: '10px', right: '10px',
                    color: t.toggle, opacity: 0.5, lineHeight: 1, fontSize: '1rem',
                    pointerEvents: 'none',
                  }}>⠿</span>
                )}

                {!rearranging && (
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
                )}

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
