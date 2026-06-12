import { useState, useEffect } from 'react';
import { Search, Star, MapPin, Store, ChevronRight, Phone } from 'lucide-react';
import { useNav } from '../App.jsx';
import api from '../api.js';

export default function OrganizerList() {
  const { navigate } = useNav();
  const [organizers, setOrganizers] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [q,          setQ]          = useState('');
  const [loading,    setLoading]    = useState(true);

  const load = async (pg = 1, query = q) => {
    setLoading(true);
    try {
      const r = await api.get('/api/public/organizers', { params: { page: pg, q: query } });
      if (pg === 1) setOrganizers(r.data.organizers || []);
      else setOrganizers(prev => [...prev, ...(r.data.organizers || [])]);
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
            <Star size={20} style={{ color: 'var(--color-canvas-white)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--color-rich-black)' }}>
            Organizers
          </h1>
        </div>
        <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-cool-gray)' }}>
          {total} community organizers
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-cool-gray)' }} />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search by name, role, district…"
            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, border: '1px solid var(--color-subtle-ash)', borderRadius: 12, fontSize: '13px', fontFamily: 'var(--font-pp-neue-montreal)', outline: 'none', background: 'var(--color-canvas-white)', color: 'var(--color-rich-black)', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-sm" style={{ borderRadius: 12, paddingInline: 16 }}>Search</button>
      </form>

      {/* List */}
      {loading && organizers.length === 0 ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : organizers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-cool-gray)', fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '14px' }}>
          No organizers found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {organizers.map(o => (
            <div
              key={o._id}
              onClick={() => o.business?._id && navigate('detail', { id: o.business._id })}
              style={{ background: 'var(--color-canvas-white)', border: '1px solid var(--color-subtle-ash)', borderRadius: 14, padding: '16px', cursor: o.business?._id ? 'pointer' : 'default', transition: 'border-color .2s, box-shadow .2s' }}
              onMouseEnter={e => { if (o.business?._id) { e.currentTarget.style.borderColor = 'var(--color-deep-fern-green)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-subtle-ash)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Avatar */}
                <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: o.image ? 'transparent' : 'var(--color-rich-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid var(--color-subtle-ash)' }}>
                  {o.image
                    ? <img src={o.image} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-pp-neue-montreal)' }}>{(o.name || 'O').charAt(0).toUpperCase()}</span>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, fontSize: '15px', color: 'var(--color-rich-black)', marginBottom: 2 }}>{o.name}</div>
                  {o.role && (
                    <div style={{ fontSize: '12px', color: 'var(--color-deep-fern-green)', fontWeight: 600, fontFamily: 'var(--font-pp-neue-montreal)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{o.role}</div>
                  )}
                  {(o.assembly || o.district) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: 'var(--color-cool-gray)', fontFamily: 'var(--font-pp-neue-montreal)' }}>
                      <MapPin size={11} /> {[o.assembly, o.district].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {o.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: 'var(--color-cool-gray)', fontFamily: 'var(--font-pp-neue-montreal)', marginTop: 2 }}>
                      <Phone size={11} /> {o.phone}
                    </div>
                  )}
                </div>

                {o.business?._id && <ChevronRight size={16} style={{ color: 'var(--color-cool-gray)', flexShrink: 0 }} />}
              </div>

              {/* Business badge */}
              {o.business && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--color-subtle-ash)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {o.business.image && (
                    <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-subtle-ash)' }}>
                      <img src={o.business.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 600, fontSize: '13px', color: 'var(--color-rich-black)' }}>{o.business.name}</div>
                    {o.business.category && <div style={{ fontSize: '11px', color: 'var(--color-deep-fern-green)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{o.business.category}</div>}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Load more */}
          {organizers.length < total && (
            <button onClick={() => load(page + 1, q)} disabled={loading}
              className="btn btn-outline" style={{ borderRadius: 12, marginTop: 8 }}>
              {loading ? 'Loading…' : `Load more (${total - organizers.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
