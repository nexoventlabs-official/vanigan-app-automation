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
    { label: 'Home',       page: 'home',       iconClass: 'fa-solid fa-store' },
    { label: 'Categories', page: 'categories', iconClass: 'fa-solid fa-table-cells' },
    { label: 'Gallery',    page: 'gallery',    iconClass: 'fa-solid fa-images' },
    ...(isLoggedIn ? [
      { label: 'Members',    page: 'members',    iconClass: 'fa-solid fa-users' },
      { label: 'Organizers', page: 'organizers', iconClass: 'fa-solid fa-star' },
      { label: 'My Profile',  page: 'profile',   iconClass: 'fa-solid fa-user' },
      { label: 'My Business', page: 'my',        iconClass: 'fa-solid fa-store' },
    ] : []),
  ];

  const desktopLinks = links.filter(l => l.page !== 'profile' && l.page !== 'my');

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
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flexWrap: 'nowrap',
          overflow: 'hidden',
        }} className="desktop-nav">
          {desktopLinks.map(({ label, page, iconClass }) => (
            <button
              key={page}
              onClick={() => go(page)}
              className={`nav-tab ${current.name === page ? 'active' : ''}`}
            >
              <i className={`${iconClass} nav-tab-icon`} />
              <span className="nav-tab-text">{label}</span>
              <span className="nav-tab-dot"></span>
            </button>
          ))}
        </div>

        {/* Right Desktop Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
          {isLoggedIn ? (
            <>
              {canAddBusiness && (
                <button onClick={() => go('add')} className="btn btn-primary btn-sm"
                  style={{ fontWeight: 500, marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <i className="fa-solid fa-plus" /> Add Business
                </button>
              )}
              {/* Membership Card — only for members (new signup) */}
              {member && (
                <button onClick={() => go('membercard')} className="my-card-btn">
                  <i className="fa-solid fa-id-card" /> My Card
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
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-rich-black)', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-subtle-ash)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <i className="fa-solid fa-user" style={{ fontSize: 13, width: 14, color: 'var(--color-cool-gray)' }} /> My Profile
                    </button>
                    <button onClick={() => go('my')}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-rich-black)', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-subtle-ash)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <i className="fa-solid fa-store" style={{ fontSize: 13, width: 14, color: 'var(--color-cool-gray)' }} /> My Business
                    </button>
                    <button onClick={() => go('members')}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-rich-black)', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-subtle-ash)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <i className="fa-solid fa-users" style={{ fontSize: 13, width: 14, color: 'var(--color-cool-gray)' }} /> Members
                    </button>
                    <button onClick={() => go('organizers')}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-rich-black)', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-subtle-ash)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <i className="fa-solid fa-star" style={{ fontSize: 13, width: 14, color: 'var(--color-cool-gray)' }} /> Organizers
                    </button>
                    {member && (
                      <button onClick={() => go('membercard')}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-deep-fern-green)', fontWeight: 600, transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-subtle-ash)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <i className="fa-solid fa-id-card" style={{ fontSize: 13, width: 14 }} /> My Membership Card
                      </button>
                    )}
                    <button onClick={handleLogout}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: '#dc2626', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <i className="fa-solid fa-right-from-bracket" style={{ fontSize: 13, width: 14 }} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => go('login')} className="btn-login" style={{ marginLeft: 8 }}>
                <i className="fa-solid fa-right-to-bracket" /> Login
              </button>
              <button onClick={() => go('signup')} className="btn-signup" style={{ marginLeft: 8 }}>
                <i className="fa-solid fa-user-plus" /> Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <label className="burger" htmlFor="burger">
          <input
            type="checkbox"
            id="burger"
            checked={open}
            onChange={(e) => setOpen(e.target.checked)}
          />
          <span></span>
          <span></span>
          <span></span>
        </label>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          position: 'fixed', top: 52, left: 0, right: 0,
          background: 'var(--color-canvas-white)',
          borderBottom: '1px solid var(--color-subtle-ash)',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 99,
        }}>
          {links.map(({ label, page, iconClass }) => (
            <button key={page} onClick={() => go(page)}
              className={`mobile-nav-link ${current.name === page ? 'active' : ''}`}>
              <i className={iconClass} style={{ width: 18, textAlign: 'center' }} /> {label}
            </button>
          ))}

          {isLoggedIn ? (
            <>
              {canAddBusiness && (
                <button onClick={() => go('add')} className="btn btn-primary btn-full"
                  style={{ fontWeight: 500, marginTop: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <i className="fa-solid fa-plus" /> Add Business
                </button>
              )}
              <div style={{ borderTop: '1px solid var(--color-subtle-ash)', paddingTop: 8, marginTop: 4 }}>
                <div style={{ padding: '8px 12px', fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-cool-gray)' }}>
                  Logged in as <strong style={{ color: 'var(--color-rich-black)' }}>{user?.name}</strong>
                </div>
                {member && (
                  <button onClick={() => go('membercard')} className="mobile-nav-link"
                    style={{ color: 'var(--color-deep-fern-green)', fontWeight: 600 }}>
                    <i className="fa-solid fa-id-card" style={{ width: 18, textAlign: 'center' }} /> My Membership Card
                  </button>
                )}
                <button onClick={handleLogout} className="mobile-nav-link" style={{ color: '#dc2626' }}>
                  <i className="fa-solid fa-right-from-bracket" style={{ width: 18, textAlign: 'center' }} /> Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => go('login')} className="mobile-nav-link">
                <i className="fa-solid fa-right-to-bracket" style={{ width: 18, textAlign: 'center' }} /> Login
              </button>
              <button onClick={() => go('signup')} className="btn btn-primary btn-full"
                style={{ fontWeight: 500, marginTop: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <i className="fa-solid fa-user-plus" /> Sign Up Free
              </button>
            </>
          )}
        </div>
      )}

      <style>{`
        .nav-tab {
          background: transparent;
          border: none;
          cursor: pointer;
          position: relative;
          padding: 8px 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--color-cool-gray);
          font-family: var(--font-pp-neue-montreal);
          font-size: 14px;
          font-weight: 500;
          border-radius: 99px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          user-select: none;
        }

        .nav-tab-icon {
          font-size: 15px;
          width: 15px;
          height: 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s ease;
          color: var(--color-cool-gray);
        }

        .nav-tab-text {
          transition: color 0.3s ease;
        }

        /* Hover state */
        .nav-tab:hover {
          color: var(--color-rich-black);
          background-color: rgba(34, 197, 94, 0.05);
        }

        .nav-tab:hover .nav-tab-icon {
          color: #22c55e;
          transform: translateY(-2px);
        }

        /* Active state */
        .nav-tab.active {
          color: #22c55e;
          background-color: rgba(34, 197, 94, 0.08);
          font-weight: 600;
        }

        .nav-tab.active .nav-tab-icon {
          color: #22c55e;
          transform: translateY(0) scale(1.1);
        }

        /* Active dot indicator */
        .nav-tab-dot {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%) scale(0);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: #22c55e;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-tab.active .nav-tab-dot {
          transform: translateX(-50%) scale(1);
        }

        .btn-login {
          background: transparent;
          color: var(--color-rich-black);
          border: none;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          outline: none;
          font-family: var(--font-pp-neue-montreal);
          border-radius: 99px;
        }

        .btn-login:hover {
          background-color: rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }

        .btn-signup {
          background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
          color: white;
          border: none;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 20px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          outline: none;
          font-family: var(--font-pp-neue-montreal);
        }

        .btn-signup:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
          background: linear-gradient(135deg, #25d366 0%, #16a34a 100%);
        }

        .btn-signup:active {
          transform: translateY(0);
          box-shadow: 0 4px 10px rgba(34, 197, 94, 0.2);
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

        .burger {
          position: relative;
          width: 30px;
          height: 22px;
          background: transparent;
          cursor: pointer;
          display: none;
        }

        .burger input {
          display: none;
        }

        .burger span {
          display: block;
          position: absolute;
          height: 3px;
          width: 100%;
          background: black;
          border-radius: 9px;
          opacity: 1;
          left: 0;
          transform: rotate(0deg);
          transition: .25s ease-in-out;
        }

        .burger span:nth-of-type(1) {
          top: 0px;
          transform-origin: left center;
        }

        .burger span:nth-of-type(2) {
          top: 50%;
          transform: translateY(-50%);
          transform-origin: left center;
        }

        .burger span:nth-of-type(3) {
          top: 100%;
          transform-origin: left center;
          transform: translateY(-100%);
        }

        .burger input:checked ~ span:nth-of-type(1) {
          transform: rotate(45deg);
          top: 0px;
          left: 4px;
        }

        .burger input:checked ~ span:nth-of-type(2) {
          width: 0%;
          opacity: 0;
        }

        .burger input:checked ~ span:nth-of-type(3) {
          transform: rotate(-45deg);
          top: 20px;
          left: 4px;
        }

        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .burger { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
