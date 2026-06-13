import { useState, useEffect } from 'react';
import { Search, Users, MapPin, Store, ChevronRight, Phone } from 'lucide-react';
import { useNav } from '../App.jsx';
import api from '../api.js';

function BlueTick({ size = 13 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.358.275C14.77 2.515 13.498 1.5 12 1.5s-2.77 1.015-3.412 2.285c-.417-.175-.878-.275-1.358-.275-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.358-.275.642 1.27 1.914 2.285 3.412 2.285s2.77-1.015 3.412-2.285c.417.175.878.275 1.358.275 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" fill="#0095F6"/>
      <path d="M9.78 16.72l-3.86-3.86 1.41-1.41 2.45 2.45 6.18-6.18 1.41 1.41-7.59 7.59z" fill="white"/>
    </svg>
  );
}

export default function MemberList() {
  const { navigate } = useNav();
  const [members, setMembers] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [q,       setQ]       = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (pg = 1, query = q) => {
    setLoading(true);
    try {
      const r = await api.get('/api/public/members', { params: { page: pg, q: query } });
      if (pg === 1) setMembers(r.data.members || []);
      else setMembers(prev => [...prev, ...(r.data.members || [])]);
      setTotal(r.data.total || 0);
      setPage(pg);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1, ''); }, []);

  const handleSearch = (e) => { e.preventDefault(); load(1, q); };

  return (
    <div className="container section" style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-rich-black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} style={{ color: 'var(--color-canvas-white)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--color-rich-black)' }}>
            Members
          </h1>
        </div>
        <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-cool-gray)' }}>
          {total} registered Vanigan members
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-cool-gray)' }} />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search by name, district…"
            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, border: '1px solid var(--color-subtle-ash)', borderRadius: 12, fontSize: '13px', fontFamily: 'var(--font-pp-neue-montreal)', outline: 'none', background: 'var(--color-canvas-white)', color: 'var(--color-rich-black)', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-sm" style={{ borderRadius: 12, paddingInline: 16 }}>Search</button>
      </form>

      {/* List */}
      {loading && members.length === 0 ? (
        <div className="spinner-wrap"><div className="loader"></div></div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-cool-gray)', fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '14px' }}>
          No members found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {members.map(m => (
            <div
              key={m._id}
              onClick={() => m.business?._id && navigate('detail', { id: m.business._id })}
              style={{ background: 'var(--color-canvas-white)', border: '1px solid var(--color-subtle-ash)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: m.business?._id ? 'pointer' : 'default', transition: 'border-color .2s, box-shadow .2s' }}
              onMouseEnter={e => { if (m.business?._id) { e.currentTarget.style.borderColor = 'var(--color-deep-fern-green)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-subtle-ash)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Avatar */}
              <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, background: m.photoUrl ? 'transparent' : 'var(--color-rich-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid var(--color-subtle-ash)' }}>
                {m.photoUrl
                  ? <img src={m.photoUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-pp-neue-montreal)' }}>{(m.name || 'M').charAt(0).toUpperCase()}</span>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, fontSize: '14px', color: 'var(--color-rich-black)' }}>{m.name}</span>
                  {m.hasEpic && <BlueTick size={13} />}
                </div>
                {m.membershipId && (
                  <div style={{ fontSize: '11px', color: 'var(--color-deep-fern-green)', fontWeight: 700, fontFamily: 'var(--font-pp-neue-montreal)', marginBottom: 2 }}>{m.membershipId}</div>
                )}
                {(m.assemblyName || m.district) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: 'var(--color-cool-gray)', fontFamily: 'var(--font-pp-neue-montreal)' }}>
                    <MapPin size={11} />
                    {[m.assemblyName, m.district].filter(Boolean).join(', ')}
                  </div>
                )}
                {m.business && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'var(--color-deep-fern-green)', fontWeight: 600, fontFamily: 'var(--font-pp-neue-montreal)', marginTop: 3 }}>
                    <Store size={11} /> {m.business.name}
                  </div>
                )}
              </div>

              {m.business?._id && <ChevronRight size={16} style={{ color: 'var(--color-cool-gray)', flexShrink: 0 }} />}

              {/* Call button */}
              {m.phone && (
                <a
                  href={`tel:${m.phone}`}
                  onClick={e => e.stopPropagation()}
                  title={`Call ${m.name}`}
                  style={{
                    flexShrink: 0,
                    width: 36, height: 36,
                    borderRadius: '50%',
                    background: 'var(--color-deep-fern-green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff',
                    textDecoration: 'none',
                    transition: 'opacity .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <Phone size={15} strokeWidth={2.2} />
                </a>
              )}
            </div>
          ))}

          {/* Load more */}
          {members.length < total && (
            <button onClick={() => load(page + 1, q)} disabled={loading}
              className="btn btn-outline" style={{ borderRadius: 12, marginTop: 8 }}>
              {loading ? 'Loading…' : `Load more (${total - members.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
