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
      background: 'var(--color-canvas-white)',
      borderBottom: '1px solid var(--color-subtle-ash)',
      height: 52, display: 'flex', alignItems: 'center',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Logo */}
        <button onClick={() => go('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="https://vanigan.org/front/images/home/tnvslogo.png" alt="Vanigan" style={{ height: 32 }} />
          <span style={{
            fontFamily: 'var(--font-pp-neue-montreal)',
            fontWeight: 700,
            fontSize: '18px',
            color: 'var(--color-rich-black)',
            letterSpacing: '-0.5px'
          }}>
            Vanigan
          </span>
        </button>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
          {links.map(({ label, page, icon: Icon }) => (
            <button
              key={page}
              onClick={() => go(page)}
              className={`nav-link ${current.name === page ? 'active' : ''}`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
          {/* Pill Accent Button */}
          <button 
            onClick={() => go('add')} 
            className="btn btn-primary btn-sm" 
            style={{
              fontWeight: 500,
              marginLeft: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={14} /> Add Business
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
          position: 'fixed', top: 52, left: 0, right: 0,
          background: 'var(--color-canvas-white)',
          borderBottom: '1px solid var(--color-subtle-ash)',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 99,
        }}>
          {links.map(({ label, page, icon: Icon }) => (
            <button
              key={page}
              onClick={() => go(page)}
              className={`mobile-nav-link ${current.name === page ? 'active' : ''}`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
          <button 
            onClick={() => go('add')} 
            className="btn btn-primary btn-full" 
            style={{
              fontWeight: 500,
              marginTop: 4,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
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
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--color-cool-gray);
          border-radius: var(--radius-buttons);
          transition: all 0.2s ease;
          outline: none;
          font-family: var(--font-pp-neue-montreal);
        }
        .nav-link:hover {
          color: var(--color-rich-black);
          background-color: var(--color-subtle-ash);
        }
        .nav-link.active {
          color: var(--color-rich-black) !important;
          background-color: var(--color-subtle-ash);
          font-weight: 600;
        }
        
        .mobile-nav-link {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-cool-gray);
          border-radius: 8px;
          width: 100%;
          text-align: left;
          transition: all 0.2s ease;
          outline: none;
          font-family: var(--font-pp-neue-montreal);
        }
        .mobile-nav-link:hover, .mobile-nav-link:active {
          color: var(--color-rich-black);
          background-color: var(--color-subtle-ash);
        }
        .mobile-nav-link.active {
          color: var(--color-rich-black) !important;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
