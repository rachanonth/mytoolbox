'use client';
import { useState, useEffect } from 'react';

const LS_KEY = 'toolbox_pwa_dismissed';

// ── Small SVG helpers ────────────────────────────────────────────────────────

function IconShare({ c }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  );
}

function IconPlusBox({ c }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  );
}

function IconCheck({ c }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IconX({ c, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconPhone({ c }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PWAInstallHint({ mode = 'light' }) {
  const isDark = mode === 'dark';

  // null = not ready, 'ios' | 'android'
  const [platform, setPlatform]           = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSModal, setShowIOSModal]   = useState(false);
  const [visible, setVisible]             = useState(false);

  useEffect(() => {
    // Already dismissed?
    if (localStorage.getItem(LS_KEY) === 'true') return;

    // Already installed?
    const isStandalone =
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // iOS Safari detection
    const ua    = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    if (isIOS) {
      setPlatform('ios');
      setVisible(true);
      return;
    }

    // Android/Chrome — wait for the browser event
    function onPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('android');
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(LS_KEY, 'true');
    setVisible(false);
    setShowIOSModal(false);
  }

  async function handleInstall() {
    if (platform === 'android' && deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') dismiss();
    } else if (platform === 'ios') {
      setShowIOSModal(true);
    }
  }

  if (!visible) return null;

  // ── Palette ────────────────────────────────────────────────────────────────
  const accent  = isDark ? '#38BDF8' : '#1D6FCC';
  const textPri = isDark ? '#E8F4FF' : '#0F2942';
  const textSec = isDark ? '#6A8FAA' : '#4A6A8A';
  const pillBg  = isDark ? 'rgba(15,25,50,0.88)' : 'rgba(255,255,255,0.92)';
  const pillBdr = isDark ? 'rgba(56,189,248,0.25)' : 'rgba(59,130,246,0.20)';
  const pillShd = isDark ? '0 4px 20px rgba(0,0,0,0.55)' : '0 4px 20px rgba(59,130,246,0.15)';
  const modalBg = isDark ? '#0f1929' : '#ffffff';
  const stepBg  = isDark ? 'rgba(56,189,248,0.10)' : 'rgba(59,130,246,0.08)';
  const divider = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  const IOS_STEPS = [
    { label: 'Tap the',        bold: 'Share',           icon: <IconShare   c={accent} /> },
    { label: 'Select',         bold: 'Add to Home Screen', icon: <IconPlusBox c={accent} /> },
    { label: 'Tap',            bold: 'Add',             icon: <IconCheck   c={accent} /> },
  ];

  return (
    <>
      {/* ── Floating pill ────────────────────────────────────────────────── */}
      <button
        onClick={handleInstall}
        title="Install App"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '9px 13px 9px 11px',
          borderRadius: '999px',
          border: `1px solid ${pillBdr}`,
          background: pillBg,
          boxShadow: pillShd,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          lineHeight: 1,
        }}
      >
        <IconPhone c={accent} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: textPri, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
          Install App
        </span>
        {/* Dismiss × */}
        <span
          role="button"
          tabIndex={0}
          onClick={e => { e.stopPropagation(); dismiss(); }}
          onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), dismiss())}
          title="Dismiss"
          style={{
            display: 'flex', alignItems: 'center',
            marginLeft: '4px', padding: '2px',
            borderRadius: '50%', cursor: 'pointer',
          }}
        >
          <IconX c={textSec} size={11} />
        </span>
      </button>

      {/* ── iOS instruction modal ─────────────────────────────────────────── */}
      {showIOSModal && (
        <div
          onClick={() => setShowIOSModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1001,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 12px 20px',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: modalBg,
              borderRadius: '16px',
              padding: '20px 20px 16px',
              maxWidth: '340px',
              width: '100%',
              boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: accent }}>
                Add to Home Screen
              </span>
              <button
                onClick={() => setShowIOSModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: textSec }}
              >
                <IconX c={textSec} size={16} />
              </button>
            </div>

            {/* Steps */}
            {IOS_STEPS.map(({ label, bold, icon }, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
                  {/* Step number */}
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: stepBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: accent }}>{idx + 1}</span>
                  </div>
                  {/* Text */}
                  <span style={{ flex: 1, fontSize: '0.82rem', color: textPri }}>
                    {label}&nbsp;<strong style={{ fontWeight: 600 }}>{bold}</strong>
                  </span>
                  {/* Icon */}
                  {icon}
                </div>
                {idx < IOS_STEPS.length - 1 && (
                  <div style={{ height: '1px', background: divider, marginLeft: '38px' }} />
                )}
              </div>
            ))}

            {/* Dismiss */}
            <button
              onClick={dismiss}
              style={{
                marginTop: '16px', width: '100%', padding: '9px',
                background: 'none',
                border: `1px solid ${pillBdr}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem', color: textSec,
                letterSpacing: '0.04em', fontFamily: 'inherit',
              }}
            >
              Don't show again
            </button>
          </div>
        </div>
      )}
    </>
  );
}
