import { useEffect, useState } from 'react';
import { Search, Store, ChevronRight } from 'lucide-react';
import { getCategories } from '../api.js';
import { useNav } from '../App.jsx';

export default function Categories() {
  const { navigate, goBack } = useNav();
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
        <button onClick={goBack} style={{
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
        <div className="grid-5" style={{ gap: '24px 20px' }}>
          {filtered.map(cat => (
            <div
              key={cat.category}
              onClick={() => navigate('list', { category: cat.category })}
              className="category-card-wrapper"
            >
              {/* Neomorphic Card with Full-Bleed Image */}
              <div className="button-container">
                {cat.imageUrl ? (
                  <img 
                    src={cat.imageUrl} 
                    alt={cat.category} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      display: 'block',
                      position: 'relative',
                      zIndex: 0
                    }} 
                  />
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%', 
                    width: '100%',
                    background: 'var(--color-subtle-ash)',
                    position: 'relative',
                    zIndex: 0
                  }}>
                    <Store size={36} style={{ color: 'var(--color-cool-gray)' }} />
                  </div>
                )}
              </div>

              {/* Category Title Text - Outside at the Bottom */}
              <div className="category-title-outside">
                {cat.category}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        /* Parent Card Wrapper */
        .category-card-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          width: 100%;
          outline: none;
          text-decoration: none;
        }

        /* Button Container with Clean Shadow (No Gloss or White Overlay) */
        .button-container {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: var(--color-canvas-white);
          border-radius: 30px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          border: 1px solid var(--color-subtle-ash);
          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease,
            border-color 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          outline: none;
        }

        /* Trigger card hover when parent is hovered */
        .category-card-wrapper:hover .button-container {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
          border-color: rgba(0, 0, 0, 0.08);
        }

        /* Active press state */
        .category-card-wrapper:active .button-container {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
        }

        /* Outside Category Title Style */
        .category-title-outside {
          margin-top: 14px;
          font-family: var(--font-pp-neue-montreal), 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: var(--color-rich-black);
          line-height: 1.35;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: center;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          transition: color 0.2s ease;
        }

        /* Hover title color shift to branding green */
        .category-card-wrapper:hover .category-title-outside {
          color: #22c55e;
        }
      `}</style>
    </div>
  );
}
