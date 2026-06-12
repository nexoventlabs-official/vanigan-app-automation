import { useState, useEffect } from 'react';
import { Store, Plus, User, Menu, X, Grid3X3, LogOut, LogIn, Images, CreditCard, Users, Star } from 'lucide-react';
import { useNav } from '../App.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { navigate, current } = useNav();
  const { isLoggedIn, user, business, logout, member } = useAuth();
  const [open, setOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    { label: 'Gallery',    page: 'gallery',    icon: Images },
    ...(isLoggedIn ? [
      { label: 'Members',    page: 'members',    icon: Users },
      { label: 'Organizers', page: 'organizers', icon: Star },
      { label: 'My Profile',  page: 'profile',   icon: User },
      { label: 'My Business', page: 'my',        icon: Store },
    ] : []),
  ];

  const isHome = current.name === 'home';
  const showBg = !isHome || scrolled;

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: showBg ? 'rgba(255, 255, 255, 0.75)' : 'transparent',
      backdropFilter: showBg ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: showBg ? 'blur(12px)' : 'none',
      borderBottom: showBg ? '1px solid var(--color-subtle-ash)' : '1px solid transparent',
      transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease',
      height: 52, display: 'flex', alignItems: 'center',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
        {/* Logo */}
        <button onClick={() => go('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="Vanigan" style={{ height: 32 }} />
          <span style={{
            fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700,
            fontSize: '18px', color: 'var(--color-rich-black)', letterSpacing: '-0.5px'
          }}>
            Vanigan
          </span>
        </button>

        {/* Centered Desktop Navigation */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }} className="desktop-nav">
          <button
            onClick={() => go('home')}
            className={`uiverse-nav-btn ${current.name === 'home' ? 'active' : ''}`}
            style={{ '--clr': current.name === 'home' ? '#22c55e' : '#000000' }}
          >
            <span className="uiverse-nav-btn-decor"></span>
            <div className="uiverse-nav-btn-content">
              <div className="uiverse-nav-btn-icon">
                <Store size={16} color="#ffffff" />
              </div>
              <span className="uiverse-nav-btn-text">Home</span>
            </div>
          </button>
          
          <button
            onClick={() => go('categories')}
            className={`uiverse-nav-btn ${current.name === 'categories' ? 'active' : ''}`}
            style={{ '--clr': current.name === 'categories' ? '#22c55e' : '#000000' }}
          >
            <span className="uiverse-nav-btn-decor"></span>
            <div className="uiverse-nav-btn-content">
              <div className="uiverse-nav-btn-icon">
                <Grid3X3 size={16} color="#ffffff" />
              </div>
              <span className="uiverse-nav-btn-text">Categories</span>
            </div>
          </button>

          <button
            onClick={() => go('gallery')}
            className={`uiverse-nav-btn ${current.name === 'gallery' ? 'active' : ''}`}
            style={{ '--clr': current.name === 'gallery' ? '#22c55e' : '#000000' }}
          >
            <span className="uiverse-nav-btn-decor"></span>
            <div className="uiverse-nav-btn-content">
              <div className="uiverse-nav-btn-icon">
                <Images size={16} color="#ffffff" />
              </div>
              <span className="uiverse-nav-btn-text">Gallery</span>
            </div>
          </button>

          {isLoggedIn && (
            <>
              <button
                onClick={() => go('members')}
                className={`uiverse-nav-btn ${current.name === 'members' ? 'active' : ''}`}
                style={{ '--clr': current.name === 'members' ? '#22c55e' : '#000000' }}
              >
                <span className="uiverse-nav-btn-decor"></span>
                <div className="uiverse-nav-btn-content">
                  <div className="uiverse-nav-btn-icon">
                    <Users size={16} color="#ffffff" />
                  </div>
                  <span className="uiverse-nav-btn-text">Members</span>
                </div>
              </button>

              <button
                onClick={() => go('organizers')}
                className={`uiverse-nav-btn ${current.name === 'organizers' ? 'active' : ''}`}
                style={{ '--clr': current.name === 'organizers' ? '#22c55e' : '#000000' }}
              >
                <span className="uiverse-nav-btn-decor"></span>
                <div className="uiverse-nav-btn-content">
                  <div className="uiverse-nav-btn-icon">
                    <Star size={16} color="#ffffff" />
                  </div>
                  <span className="uiverse-nav-btn-text">Organizers</span>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Right Desktop Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
          {isLoggedIn ? (
            <>
              {canAddBusiness && (
                <button onClick={() => go('add')} className="btn btn-primary btn-sm"
                  style={{ fontWeight: 500, marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={14} /> Add Business
                </button>
              )}
              {/* Membership Card — only for members (new signup) */}
              {member && (
                <button onClick={() => go('membercard')} className="btn btn-outline btn-sm"
                  style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontWeight: 600, borderColor: 'var(--color-deep-fern-green)',
                    color: 'var(--color-deep-fern-green)' }}>
                  <CreditCard size={14} /> My Card
                </button>
              )}
              {/* Logout button */}
              <button className="logout-btn" onClick={handleLogout} style={{ marginLeft: 8 }}>
                <div className="sign">
                  <svg viewBox="0 0 512 512">
                    <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
                  </svg>
                </div>
                <div className="text">Logout</div>
              </button>

              {/* User avatar with dropdown */}
              <div style={{ position: 'relative', marginLeft: 8 }}>
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
                    <button onClick={() => go('profile')}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-rich-black)', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-subtle-ash)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <User size={13} /> My Profile
                    </button>
                    <button onClick={() => go('my')}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-rich-black)', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-subtle-ash)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <User size={13} /> My Business
                    </button>
                    {member && (
                      <button onClick={() => go('membercard')}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-deep-fern-green)', fontWeight: 600, transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-subtle-ash)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <CreditCard size={13} /> My Membership Card
                      </button>
                    )}
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
              <button onClick={() => go('login')} className="nav-uiverse-btn" style={{ marginLeft: 8 }}>
                <LogIn size={14} /> Login
              </button>
              <button onClick={() => go('signup')} className="nav-uiverse-btn" style={{ marginLeft: 8 }}>
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
                {member && (
                  <button onClick={() => go('membercard')} className="mobile-nav-link"
                    style={{ color: 'var(--color-deep-fern-green)', fontWeight: 600 }}>
                    <CreditCard size={16} /> My Membership Card
                  </button>
                )}
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
        .nav-uiverse-btn {
          background-color: white;
          color: black;
          border-radius: 10em;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 16px;
          cursor: pointer;
          transition: all 0.25s ease-in-out;
          border: 1.5px solid black;
          box-shadow: 0 0 0 0 black;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          outline: none;
          font-family: var(--font-pp-neue-montreal);
        }

        .nav-uiverse-btn:hover {
          transform: translateY(-2px) translateX(-1px);
          box-shadow: 2px 3px 0 0 black;
          background-color: white;
          color: black;
        }

        .nav-uiverse-btn:active {
          transform: translateY(1px) translateX(0.5px);
          box-shadow: 0 0 0 0 black;
        }

        .uiverse-nav-btn {
          text-decoration: none;
          line-height: 1;
          border-radius: 1.5rem;
          overflow: hidden;
          position: relative;
          box-shadow: 10px 10px 20px rgba(0,0,0,.02);
          background-color: #fff;
          color: #121212;
          border: 1px solid var(--color-subtle-ash);
          cursor: pointer;
          font-family: var(--font-pp-neue-montreal);
          padding: 0;
          height: 38px;
          display: inline-flex;
          align-items: center;
          transition: border-color 0.3s;
        }

        .uiverse-nav-btn-decor {
          position: absolute;
          inset: 0;
          background-color: var(--clr);
          transform: translateX(-100%);
          transition: transform .3s ease;
          z-index: 0;
        }

        .uiverse-nav-btn-content {
          display: flex;
          align-items: center;
          font-weight: 600;
          position: relative;
          z-index: 1;
          overflow: hidden;
          height: 100%;
        }

        .uiverse-nav-btn-icon {
          width: 38px;
          height: 38px;
          background-color: var(--clr);
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .uiverse-nav-btn-text {
          display: inline-block;
          transition: color .2s;
          padding: 2px 1.25rem 2px;
          padding-left: .75rem;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          max-width: 150px;
          font-size: 13px;
        }

        .uiverse-nav-btn:hover .uiverse-nav-btn-text {
          color: #fff;
        }

        .uiverse-nav-btn:hover .uiverse-nav-btn-decor {
          transform: translate(0);
        }

        /* Active styling */
        .uiverse-nav-btn.active .uiverse-nav-btn-text {
          color: #fff;
        }
        .uiverse-nav-btn.active .uiverse-nav-btn-decor {
          transform: translate(0);
        }

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

        .logout-btn {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: 34px;
          height: 34px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition-duration: .3s;
          box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.15);
          background-color: rgb(255, 65, 65);
          padding: 0;
          outline: none;
          flex-shrink: 0;
        }

        .logout-btn .sign {
          width: 100%;
          transition-duration: .3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logout-btn .sign svg {
          width: 14px;
        }

        .logout-btn .sign svg path {
          fill: white;
        }

        .logout-btn .text {
          position: absolute;
          right: 0%;
          width: 0%;
          opacity: 0;
          color: white;
          font-size: 11px;
          font-weight: 600;
          transition-duration: .3s;
          font-family: var(--font-pp-neue-montreal), sans-serif;
          white-space: nowrap;
        }

        .logout-btn:hover {
          width: 95px;
          border-radius: 40px;
          transition-duration: .3s;
        }

        .logout-btn:hover .sign {
          width: 30%;
          transition-duration: .3s;
          padding-left: 10px;
        }

        .logout-btn:hover .text {
          opacity: 1;
          width: 70%;
          transition-duration: .3s;
          padding-right: 8px;
        }

        .logout-btn:active {
          transform: translate(1px ,1px);
        }

        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
