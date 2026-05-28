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
      background: 'rgba(3,7,18,0.92)', backdropFilter: 'blur(14px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      height: 64, display: 'flex', alignItems: 'center',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Logo */}
        <button onClick={() => go('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="https://vanigan.org/front/images/home/tnvslogo.png" alt="Vanigan" style={{ height: 36 }} />
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>Vanigan</span>
        </button>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
          {links.map(({ label, page, icon: Icon }) => (
            <button key={page} onClick={() => go(page)} className="btn btn-ghost btn-sm"
              style={{ color: current.name === page ? 'var(--accent)' : 'var(--muted)' }}>
              <Icon size={15} />
              {label}
            </button>
          ))}
          <button onClick={() => go('add')} className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}>
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
          background: 'rgba(10,15,30,0.98)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 99,
        }}>
          {links.map(({ label, page, icon: Icon }) => (
            <button key={page} onClick={() => go(page)} className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', color: current.name === page ? 'var(--accent)' : 'var(--text)' }}>
              <Icon size={16} /> {label}
            </button>
          ))}
          <button onClick={() => go('add')} className="btn btn-primary btn-full" style={{ marginTop: 4 }}>
            <Plus size={16} /> Add Business
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
