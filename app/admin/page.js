'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import '../globals.css';

export default function Admin() {
  const [locked, setLocked] = useState(true);
  const [code, setCode] = useState('');
  const [lockError, setLockError] = useState('');
  const [cfg, setCfg] = useState(null);
  const [unlocking, setUnlocking] = useState(false);

  const [tools, setTools] = useState([]);
  const [listMsg, setListMsg] = useState('');

  const [editId, setEditId] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving] = useState(false);

  const dragIdx = useRef(null);

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setCfg);
  }, []);

  function api(path, method = 'GET', body) {
    return fetch(`${cfg.SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: cfg.SUPABASE_KEY,
        Authorization: `Bearer ${cfg.SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: body ? JSON.stringify(body) : undefined,
    }).then(async r => {
      if (!r.ok) throw new Error(await r.text());
      const t = await r.text();
      return t ? JSON.parse(t) : null;
    });
  }

  async function loadTools() {
    setListMsg('Loading...');
    try {
      const data = await api('tools?select=*&order=sort_order.asc,created_at.asc');
      setTools(data);
      setListMsg('');
    } catch (e) {
      setListMsg('Error: ' + e.message);
    }
  }

  async function unlock() {
    if (unlocking) return;
    setUnlocking(true);
    setLockError('');
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.ok) {
        setLocked(false);
        loadTools();
      } else {
        setLockError(data.error || 'Incorrect code.');
        setCode('');
      }
    } catch {
      setLockError('Network error. Try again.');
    } finally {
      setUnlocking(false);
    }
  }

  async function saveItem() {
    if (!title.trim()) { setFormErr('Title is required.'); return; }
    setSaving(true); setFormErr(''); setFormMsg('Saving...');
    try {
      if (!editId) {
        const maxOrder = tools.length ? Math.max(...tools.map(t => t.sort_order || 0)) : -1;
        await api('tools', 'POST', { title, url, description: desc, sort_order: maxOrder + 1 });
      } else {
        await api(`tools?id=eq.${editId}`, 'PATCH', { title, url, description: desc });
      }
      setFormMsg('Saved.');
      cancelEdit();
      await loadTools();
    } catch (e) {
      setFormErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  function editItem(t) {
    setEditId(t.id);
    setTitle(t.title || '');
    setUrl(t.url || '');
    setDesc(t.description || '');
    setFormMsg(''); setFormErr('');
  }

  function cancelEdit() {
    setEditId(''); setTitle(''); setUrl(''); setDesc('');
    setFormMsg(''); setFormErr('');
  }

  async function deleteItem(t) {
    if (!confirm(`Delete "${t.title}"?`)) return;
    try {
      await api(`tools?id=eq.${t.id}`, 'DELETE');
      await loadTools();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  async function onDrop(toIdx) {
    if (dragIdx.current === null || dragIdx.current === toIdx) return;
    const reordered = [...tools];
    const [moved] = reordered.splice(dragIdx.current, 1);
    reordered.splice(toIdx, 0, moved);
    setTools(reordered);
    dragIdx.current = null;
    try {
      await Promise.all(reordered.map((t, i) => api(`tools?id=eq.${t.id}`, 'PATCH', { sort_order: i })));
    } catch (e) {
      alert('Error saving order: ' + e.message);
      await loadTools();
    }
  }

  if (locked) {
    return (
      <div style={{ background: '#dff0da', minHeight: '100vh' }}>
        <header className="admin-header">
          <h1 style={{ color: '#1a2e1a' }}>KMP Toolbox / admin</h1>
          <Link href="/">back to site</Link>
        </header>
        <div className="lock-screen">
          <label>Access code</label>
          <input
            type="password"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && unlock()}
            placeholder="••••••"
            autoComplete="off"
          />
          <div className="lock-error">{lockError}</div>
          <button className="btn btn-primary" onClick={unlock} disabled={unlocking}>
            {unlocking ? 'Checking...' : 'Enter'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#dff0da', minHeight: '100vh' }}>
      <header className="admin-header">
        <h1 style={{ color: '#1a2e1a' }}>KMP Toolbox / admin</h1>
        <Link href="/">back to site</Link>
      </header>

      <main>
        {/* Form */}
        <div className="form-card">
          <div className="section-title">{editId ? 'Edit tool' : 'Add tool'}</div>
          <div className="form-row">
            <label>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. JSON Formatter" />
          </div>
          <div className="form-row">
            <label>URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Short description" />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" disabled={saving} onClick={saveItem}>Save</button>
            {editId && <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>}
            {formMsg && <span className="form-msg">{formMsg}</span>}
            {formErr && <span className="form-err">{formErr}</span>}
          </div>
        </div>

        {/* Tool list */}
        <div className="section-title">Tools</div>
        <div className="tool-list">
          {listMsg ? (
            <div className="empty-list">{listMsg}</div>
          ) : tools.length === 0 ? (
            <div className="empty-list">No tools yet. Add one above.</div>
          ) : tools.map((t, i) => (
            <div
              key={t.id}
              className="tool-item"
              draggable
              onDragStart={() => { dragIdx.current = i; }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(i)}
            >
              <span className="drag-handle" title="Drag to reorder">⠿</span>
              <div className="tool-letter">{(t.title || '?').charAt(0).toUpperCase()}</div>
              <div className="tool-info">
                <div className="tool-title">{t.title}</div>
                <div className="tool-url">{t.url}</div>
              </div>
              <div className="tool-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => editItem(t)}>Edit</button>
                <button className="btn btn-danger" onClick={() => deleteItem(t)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
