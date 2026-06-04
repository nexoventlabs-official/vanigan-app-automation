import { useState } from 'react';
import { Store, Plus, User, Menu, X, Grid3X3, LogOut, LogIn } from 'lucide-react';
import { useNav } from '../App.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { navigate, current } = useNav();
  const { isLoggedIn, user, business, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const go = (name, params = {}) => { navigate(name, params); setOpen(false); setShowUserMenu(false); };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    go('home');
  };

  const canAddBusiness = isLoggedIn && !business;

  /* Nav links — only show My Business if logged in */
  const links = [
    { label: 'Home',       page: 'home',       icon: Store },
    { label: 'Categories', page: 'categories', icon: Grid3X3 },
    ...(isLoggedIn ? [{ label: 'My Business', page: 'my', icon: User }] : []),
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
            fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700,
            fontSize: '18px', color: 'var(--color-rich-black)', letterSpacing: '-0.5px'
          }}>
            Vanigan
          </span>
        </button>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
          {links.map(({ label, page, icon: Icon }) => (
            <button key={page} onClick={() => go(page)}
              className={`nav-link ${current.name === page ? 'active' : ''}`}>
              <Icon size={14} />
              {label}
            </button>
          ))}

          {isLoggedIn ? (
            <>
              {canAddBusiness && (
                <button onClick={() => go('add')} className="btn btn-primary btn-sm"
                  style={{ fontWeight: 500, marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={14} /> Add Business
                </button>
              )}
              {/* User avatar with dropdown */}
              <div style={{ position: 'relative', marginLeft: 4 }}>
                <button onClick={() => setShowUserMenu(v => !v)}
                  style={{
                    background: 'var(--color-rich-black)', border: 'none', cursor: 'pointer',
                    width: 34, height: 34, borderRadius: '50%', display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', color: 'var(--color-canvas-white)',
                    fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', fontWeight: 700,
                    letterSpacing: '-0.5px',
                  }}>
                  {(user?.name || 'U').slice(0, 1).toUpperCase()}
                </button>
                {showUserMenu && (
                  <div style={{
                    position: 'absolute', top: 42, right: 0, minWidth: 180,
                    background: 'var(--color-canvas-white)', border: '1px solid var(--color-subtle-ash)',
                    borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 200, padding: 8,
                  }}>
                    <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--color-subtle-ash)', marginBottom: 4 }}>
                      <div style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', fontWeight: 600, color: 'var(--color-rich-black)' }}>{user?.name || 'User'}</div>
                      <div style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '11px', color: 'var(--color-cool-gray)' }}>{user?.phone}</div>
                    </div>
                    <button onClick={() => go('my')}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-rich-black)', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-subtle-ash)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <User size={13} /> My Business
                    </button>
                    <button onClick={handleLogout}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: '#dc2626', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <LogOut size={13} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => go('login')} className="nav-link" style={{ marginLeft: 8 }}>
                <LogIn size={14} /> Login
              </button>
              <button onClick={() => go('signup')} className="btn btn-primary btn-sm"
                style={{ fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <User size={14} /> Sign Up
              </button>
            </>
          )}
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
            <button key={page} onClick={() => go(page)}
              className={`mobile-nav-link ${current.name === page ? 'active' : ''}`}>
              <Icon size={16} /> {label}
            </button>
          ))}

          {isLoggedIn ? (
            <>
              {canAddBusiness && (
                <button onClick={() => go('add')} className="btn btn-primary btn-full"
                  style={{ fontWeight: 500, marginTop: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Plus size={16} /> Add Business
                </button>
              )}
              <div style={{ borderTop: '1px solid var(--color-subtle-ash)', paddingTop: 8, marginTop: 4 }}>
                <div style={{ padding: '8px 12px', fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-cool-gray)' }}>
                  Logged in as <strong style={{ color: 'var(--color-rich-black)' }}>{user?.name}</strong>
                </div>
                <button onClick={handleLogout} className="mobile-nav-link" style={{ color: '#dc2626' }}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => go('login')} className="mobile-nav-link">
                <LogIn size={16} /> Login
              </button>
              <button onClick={() => go('signup')} className="btn btn-primary btn-full"
                style={{ fontWeight: 500, marginTop: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <User size={16} /> Sign Up Free
              </button>
            </>
          )}
        </div>
      )}

      <style>{`
        .nav-link {
          background: transparent; border: none; cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; font-size: 13px; font-weight: 500;
          color: var(--color-cool-gray); border-radius: var(--radius-buttons);
          transition: all 0.2s ease; outline: none;
          font-family: var(--font-pp-neue-montreal);
        }
        .nav-link:hover { color: var(--color-rich-black); background-color: var(--color-subtle-ash); }
        .nav-link.active { color: var(--color-rich-black) !important; background-color: var(--color-subtle-ash); font-weight: 600; }
        .mobile-nav-link {
          background: transparent; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 12px;
          padding: 10px 16px; font-size: 14px; font-weight: 500;
          color: var(--color-cool-gray); border-radius: 8px;
          width: 100%; text-align: left; transition: all 0.2s ease; outline: none;
          font-family: var(--font-pp-neue-montreal);
        }
        .mobile-nav-link:hover, .mobile-nav-link:active { color: var(--color-rich-black); background-color: var(--color-subtle-ash); }
        .mobile-nav-link.active { color: var(--color-rich-black) !important; font-weight: 600; }
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
