import { useState } from 'react';
import { Store, Plus, User, Menu, X, Grid3X3 } from 'lucide-react';
import { useNav } from '../App.jsx';

export default function Navbar() {
  const { navigate, current } = useNav();
  const [open, setOpen] = useState(false);

  const go = (name, params = {}) => { navigate(name, params); setOpen(false); };

  const links = [
    { label: 'Home',       page: 'home',       icon: Store },
    { label: 'Categories', page: 'categories', icon: Grid3X3 },
    { label: 'My Business',page: 'my',         icon: User },
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: '#ffffff',
      borderBottom: 'none',
      height: 64, display: 'flex', alignItems: 'center',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Logo */}
        <button onClick={() => go('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="https://vanigan.org/front/images/home/tnvslogo.png" alt="Vanigan" style={{ height: 36 }} />
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>Vanigan</span>
        </button>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
          {links.map(({ label, page, icon: Icon }) => (
            <button
              key={page}
              onClick={() => go(page)}
              className={`nav-link ${current.name === page ? 'active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
          <button onClick={() => go('add')} className="btn btn-primary btn-sm" style={{ marginLeft: 12 }}>
            <Plus size={15} /> Add Business
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button onClick={() => setOpen(!open)} className="mobile-menu-btn btn btn-ghost btn-sm"
          style={{ display: 'none' }}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0,
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 99,
        }}>
          {links.map(({ label, page, icon: Icon }) => (
            <button
              key={page}
              onClick={() => go(page)}
              className={`mobile-nav-link ${current.name === page ? 'active' : ''}`}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
          <button onClick={() => go('add')} className="btn btn-primary btn-full" style={{ marginTop: 4 }}>
            <Plus size={16} /> Add Business
          </button>
        </div>
      )}

      <style>{`
        .nav-link {
          background: transparent;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--muted);
          border-radius: 8px;
          transition: all 0.2s ease;
          outline: none;
        }
        .nav-link:hover {
          color: var(--accent);
          background-color: rgba(0, 149, 246, 0.05);
        }
        .nav-link.active {
          color: var(--accent) !important;
        }
        
        .mobile-nav-link {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          font-size: 0.98rem;
          font-weight: 600;
          color: var(--muted);
          border-radius: 8px;
          width: 100%;
          text-align: left;
          transition: all 0.2s ease;
          outline: none;
        }
        .mobile-nav-link:hover, .mobile-nav-link:active {
          color: var(--accent);
          background-color: rgba(0, 149, 246, 0.05);
        }
        .mobile-nav-link.active {
          color: var(--accent) !important;
          background-color: rgba(0, 149, 246, 0.05);
        }

        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
