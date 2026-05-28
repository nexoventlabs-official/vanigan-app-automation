import { useEffect, useState } from 'react';
import { Search, ArrowRight, Plus, Grid3X3, Store } from 'lucide-react';
import { getCategories, getBusinesses } from '../api.js';
import { useNav } from '../App.jsx';

export default function Home() {
  const { navigate } = useNav();
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured]     = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      getCategories().catch(() => ({ data: { images: [] } })),
      getBusinesses({ page: 1 }).catch(() => ({ data: { businesses: [] } })),
    ]).then(([catRes, bizRes]) => {
      setCategories(catRes.data.images || []);
      setFeatured((bizRes.data.businesses || []).slice(0, 6));
    }).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate('list', { search: search.trim() });
  };

  const featuredCats = categories.filter(c => c.imageUrl).slice(0, 4);
  const showCats = featuredCats.length > 0 ? featuredCats : categories.slice(0, 4);

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{
        background: 'linear-gradient(135deg, #030712 0%, #0a1628 50%, #030712 100%)',
        padding: '60px 0 48px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.4,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0,149,246,0.2) 0%, transparent 70%)',
        }} />
        <div className="container" style={{ position: 'relative' }}>
          <div className="badge badge-blue" style={{ marginBottom: 16, display: 'inline-flex' }}>
            🏪 Tamil Nadu Business Directory
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem,5vw,3rem)', fontWeight: 900, lineHeight: 1.2, marginBottom: 16 }}>
            Discover Businesses<br />
            <span style={{ color: 'var(--accent)' }}>Across Tamil Nadu</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--muted)', maxWidth: 480, margin: '0 auto 32px' }}>
            Find local businesses, services and products in your area.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ maxWidth: 520, margin: '0 auto 32px', display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)' }} />
              <input
                className="input" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search businesses, services…"
                style={{ paddingLeft: 42, height: 48, fontSize: '1rem', borderRadius: 12 }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 48, paddingInline: 20, borderRadius: 12 }}>
              Search
            </button>
          </form>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('categories')} className="btn btn-outline btn-lg">
              <Grid3X3 size={18} /> Browse Categories
            </button>
            <button onClick={() => navigate('add')} className="btn btn-primary btn-lg">
              <Plus size={18} /> Add Your Business
            </button>
          </div>
        </div>
      </section>

      {/* ── Featured Categories ── */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <h2 className="section-title">Browse by Category</h2>
              <p className="section-sub">Find businesses in popular categories</p>
            </div>
            <button onClick={() => navigate('categories')} className="btn btn-ghost btn-sm">
              Show All <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : (
            <div className="grid-4">
              {showCats.map(cat => (
                <CategoryCard key={cat.category} cat={cat} onClick={() => navigate('list', { category: cat.category })} />
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button onClick={() => navigate('categories')} className="btn btn-outline">
              View All {categories.length} Categories <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Featured Businesses ── */}
      {featured.length > 0 && (
        <section className="section" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <div>
                <h2 className="section-title">Featured Businesses</h2>
                <p className="section-sub">Explore listed businesses</p>
              </div>
              <button onClick={() => navigate('list', {})} className="btn btn-ghost btn-sm">
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid-3">
              {featured.map(biz => (
                <BizCard key={biz._id} biz={biz} onClick={() => navigate('detail', { id: biz._id })} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Add Business Banner ── */}
      <section className="section">
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,149,246,0.12), rgba(0,149,246,0.04))',
            border: '1px solid rgba(0,149,246,0.25)', borderRadius: 20,
            padding: '40px 32px', display: 'flex', flexWrap: 'wrap',
            gap: 24, alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>
                📣 List Your Business for Free
              </h2>
              <p style={{ color: 'var(--muted)', maxWidth: 420 }}>
                Get discovered by thousands of customers in your district. Add your business details and go live today.
              </p>
            </div>
            <button onClick={() => navigate('add')} className="btn btn-primary btn-lg">
              <Plus size={18} /> Add Your Business
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CategoryCard({ cat, onClick }) {
  return (
    <div className="card card-hover" onClick={onClick} style={{ textAlign: 'center' }}>
      <div style={{
        aspectRatio: '1', background: 'var(--bg2)', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {cat.imageUrl ? (
          <img src={cat.imageUrl} alt={cat.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Store size={32} style={{ color: 'var(--muted2)' }} />
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--text)', lineHeight: 1.3 }}>
          {cat.category}
        </div>
      </div>
    </div>
  );
}

function BizCard({ biz, onClick }) {
  return (
    <div className="card card-hover" onClick={onClick}>
      <div style={{ height: 100, background: 'var(--bg2)', overflow: 'hidden', position: 'relative' }}>
        {biz.image ? (
          <img src={biz.image} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={28} style={{ color: 'var(--muted2)' }} />
          </div>
        )}
        {biz.active && (
          <div className="badge badge-green" style={{ position: 'absolute', top: 8, right: 8 }}>Active</div>
        )}
      </div>
      <div style={{ padding: '14px' }}>
        <div style={{ fontWeight: 800, fontSize: '.95rem', marginBottom: 4 }}>{biz.name}</div>
        {biz.category && <div style={{ fontSize: '.78rem', color: 'var(--accent)', fontWeight: 600 }}>{biz.category}</div>}
        {biz.address && (
          <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            📍 {biz.address}
          </div>
        )}
      </div>
    </div>
  );
}
