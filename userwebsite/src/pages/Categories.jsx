import { useEffect, useState } from 'react';
import { Search, Store, ChevronRight } from 'lucide-react';
import { getCategories } from '../api.js';
import { useNav } from '../App.jsx';

export default function Categories() {
  const { navigate } = useNav();
  const [items, setItems]   = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(r => setItems(r.data.images || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? items.filter(c => c.category.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="container section">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => navigate('home')} style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-cool-gray)',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: 'var(--font-pp-neue-montreal)',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          ← Back
        </button>
        <h1 className="section-title" style={{ fontSize: '32px', fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, letterSpacing: '-0.015em' }}>All Categories</h1>
        <p className="section-sub">Browse all {items.length} business categories</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 32 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-cool-gray)' }} />
        <input
          className="input" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filter categories…"
          style={{ paddingLeft: 38, fontFamily: 'var(--font-pp-neue-montreal)', height: 40 }}
        />
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Search size={44} style={{ color: 'var(--color-subtle-ash)' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700 }}>No categories found</h3>
        </div>
      ) : (
        <div className="grid-5">
          {filtered.map(cat => (
            <button
              key={cat.category}
              onClick={() => navigate('list', { category: cat.category })}
              style={{
                background: 'var(--color-canvas-white)',
                border: '1px solid var(--color-subtle-ash)',
                borderRadius: 'var(--radius-cards)',
                overflow: 'hidden',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all .2s',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-rich-black)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-subtle-ash)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ aspectRatio: '1', background: 'var(--color-subtle-ash)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Store size={28} style={{ color: 'var(--color-cool-gray)' }} />
                )}
              </div>
              <div style={{ padding: '12px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, width: '100%' }}>
                <span style={{
                  fontFamily: 'var(--font-pp-neue-montreal)',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: 'var(--color-rich-black)',
                  lineHeight: 1.3,
                  textAlign: 'left'
                }}>
                  {cat.category}
                </span>
                <ChevronRight size={13} style={{ color: 'var(--color-cool-gray)', flexShrink: 0 }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
