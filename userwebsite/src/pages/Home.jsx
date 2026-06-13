import { useEffect, useState } from 'react';
import { Search, ArrowRight, Plus, Grid3X3, Store, MapPin, Star } from 'lucide-react';
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
      getBusinesses({ sort: 'rating', page: 1 }).catch(() => ({ data: { businesses: [] } })),
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
      {/* ── Hero Section (Full View with Corner Blobs) ── */}
      <section className="hero-section" style={{
        minHeight: '100vh',
        marginTop: '-64px',
        paddingTop: '80px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 5, width: '100%' }}>
          <div className="hero-split-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '40px',
            alignItems: 'center',
          }}>
            {/* Left Content Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
              <h1 style={{
                fontFamily: 'var(--font-sf-pro-display)',
                fontSize: 'clamp(2.5rem, 5.8vw, 4rem)',
                fontWeight: 700,
                lineHeight: 1.05,
                color: 'var(--color-ink)',
                textAlign: 'left',
                letterSpacing: '-0.022em',
                fontFeatureSettings: '"lnum" on, "pnum" on'
              }}>
                Discover trusted <span style={{ color: 'var(--color-azure)' }}>local businesses</span> across Tamil Nadu.
              </h1>
              
              <p style={{
                fontFamily: 'var(--font-sf-pro-text)',
                fontSize: '20px',
                color: 'var(--color-graphite)',
                lineHeight: 1.54,
                maxWidth: '540px',
                textAlign: 'left',
                margin: '4px 0 8px',
                fontWeight: 400,
                letterSpacing: '-0.01em'
              }}>
                Connecting buyers and sellers across all districts of Tamil Nadu. Find local services, registered merchants, and direct wholesale B2B contacts.
              </p>

              {/* Minimal Search Bar */}
              <form onSubmit={handleSearch} style={{
                width: '100%',
                maxWidth: '560px',
                display: 'flex',
                gap: '8px',
                background: 'var(--color-parchment-white)',
                padding: '6px',
                borderRadius: 'var(--radius-buttons)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={20} style={{ position: 'absolute', left: 14, color: 'var(--color-muted-text-gray)' }} />
                  <input
                    className="input"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Try searching 'Garments', 'Hotels', 'Construction'..."
                    style={{
                      paddingLeft: 44,
                      height: 48,
                      fontSize: '15px',
                      border: 'none',
                      background: 'none',
                      outline: 'none',
                      width: '100%',
                      fontFamily: 'var(--font-sohne)'
                    }}
                  />
                </div>
                <button type="submit" className="search-hero-btn">
                  Search
                </button>
              </form>

              {/* Quick Tags / Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontFamily: 'var(--font-sohne)', fontSize: '13px', color: 'var(--color-muted-text-gray)', fontWeight: 500 }}>Popular:</span>
                {[
                  'Garments', 'Hotels', 'Garages', 'Computers', 'Organic Stores'
                ].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => navigate('list', { search: tag })}
                    style={{
                      background: 'var(--color-parchment-white)',
                      border: '1px solid var(--border)',
                      padding: '4px 14px',
                      borderRadius: 'var(--radius-pillbuttons)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-sohne)',
                      fontWeight: 400,
                      color: 'var(--color-inkwell-black)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none',
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = 'rgba(25, 25, 25, 0.04)';
                      e.target.style.borderColor = 'var(--color-charcoal-black)';
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = 'var(--color-parchment-white)';
                      e.target.style.borderColor = 'var(--border)';
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>

            </div>

            {/* Right Graphic Column */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="hero-graphic-wrap">
              <img
                src="/hero.svg"
                alt="Illustration"
                style={{
                  width: '100%',
                  maxWidth: '460px',
                  height: 'auto',
                  objectFit: 'contain',
                }}
              />
            </div>
          </div>
        </div>

        {/* CSS mockup layout */}
        <style>{`
          /* Category Show All Button from Uiverse */
          .show-all-uiverse-btn {
            line-height: 1;
            text-decoration: none;
            display: inline-flex;
            border: none;
            cursor: pointer;
            align-items: center;
            gap: 0.5rem;
            background-color: var(--clr);
            color: #fff;
            border-radius: 10rem;
            font-weight: 600;
            padding: 0.5rem 1.1rem;
            padding-left: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: background-color 0.3s;
            font-family: var(--font-sohne), sans-serif;
            font-size: 12px;
            outline: none;
          }

          .show-all-btn-icon-wrapper {
            flex-shrink: 0;
            width: 20px;
            height: 20px;
            position: relative;
            color: var(--clr);
            background-color: #fff;
            border-radius: 50%;
            display: grid;
            place-items: center;
            overflow: hidden;
          }

          .show-all-uiverse-btn:hover {
            background-color: var(--hover-clr);
          }

          .show-all-uiverse-btn:hover .show-all-btn-icon-wrapper {
            color: var(--hover-clr);
          }

          .show-all-btn-icon-svg--copy {
            position: absolute;
            transform: translate(-150%, 150%);
          }

          .show-all-uiverse-btn:hover .show-all-btn-icon-svg:first-child {
            transition: transform 0.3s ease-in-out;
            transform: translate(150%, -150%);
          }

          .show-all-uiverse-btn:hover .show-all-btn-icon-svg--copy {
            transition: transform 0.3s ease-in-out 0.1s;
            transform: translate(0);
          }

          /* Responsive Background for Hero Section */
          .hero-section {
            background-image: url('/hero-bg.svg');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          }

          @media (max-width: 768px) {
            .hero-section {
              background-image: url('/hero-bg-mobile.svg') !important;
            }
          }

          /* Search Button from Uiverse.io by alexroumi */
          .search-hero-btn {
            padding: 15px 25px;
            border: unset;
            border-radius: 15px;
            color: #212121;
            z-index: 1;
            background: #e8e8e8;
            position: relative;
            font-weight: 1000;
            font-size: 17px;
            -webkit-box-shadow: 4px 8px 19px -3px rgba(0,0,0,0.27);
            box-shadow: 4px 8px 19px -3px rgba(0,0,0,0.27);
            transition: all 250ms;
            overflow: hidden;
            cursor: pointer;
            display: inline-block;
            font-family: var(--font-sohne), sans-serif;
          }

          .search-hero-btn::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 0;
            border-radius: 15px;
            background-color: #212121;
            z-index: -1;
            -webkit-box-shadow: 4px 8px 19px -3px rgba(0,0,0,0.27);
            box-shadow: 4px 8px 19px -3px rgba(0,0,0,0.27);
            transition: all 250ms;
          }

          .search-hero-btn:hover {
            color: #e8e8e8;
          }

          .search-hero-btn:hover::before {
            width: 100%;
          }

          /* Devices Showcase Layout */
          .devices-showcase {
            position: relative;
            width: 100%;
            max-width: 440px;
            height: 300px;
            margin: 0 auto;
          }
          
          /* MacBook Laptop */
          .laptop-mockup {
            position: absolute;
            top: 10px;
            left: 10px;
            width: 360px;
            z-index: 2;
            filter: drop-shadow(0 20px 40px rgba(25,25,25,0.06));
          }
          .laptop-screen-bezel {
            background: #191919;
            border-radius: 16px 16px 0 0;
            padding: 8px 8px 10px;
            box-shadow: inset 0 2px 4px rgba(255,255,255,0.1);
          }
          .laptop-screen-display {
            background: var(--color-vellum-background);
            aspect-ratio: 16 / 10;
            border-radius: 4px;
            overflow: hidden;
            position: relative;
            border: 1px solid #191919;
            display: flex;
            flex-direction: column;
          }
          .laptop-web-header {
            height: 18px;
            background: var(--color-parchment-white);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 0 8px;
          }
          .laptop-web-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #e5e5e5;
            border: 0.5px solid var(--border);
          }
          .laptop-web-address {
            flex: 1;
            height: 9px;
            background: var(--color-vellum-background);
            border-radius: 3px;
            border: 1px solid var(--border);
            margin: 0 16px;
          }
          .laptop-web-content {
            flex: 1;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            background: var(--color-vellum-background);
          }
          .laptop-mock-hero {
            height: 32px;
            background: var(--color-charcoal-black);
            border-radius: 4px;
            padding: 6px;
            color: var(--color-parchment-white);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .laptop-mock-card-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }
          .laptop-mock-card {
            background: var(--color-parchment-white);
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 6px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .laptop-mock-card-img {
            height: 18px;
            background: var(--color-vellum-background);
            border-radius: 2px;
          }
          .laptop-mock-card-text {
            height: 3px;
            background: var(--border);
            border-radius: 1.5px;
            width: 80%;
          }
          .laptop-mock-card-text:nth-child(3) {
            width: 50%;
            background: var(--color-story-green);
          }
          .laptop-keyboard-base {
            height: 8px;
            background: #eae6dc;
            border-radius: 0 0 12px 12px;
            position: relative;
          }
          .laptop-keyboard-indent {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 3px;
            background: #cbd5e1;
            border-radius: 0 0 4px 4px;
          }
          
          /* iPhone Phone */
          .phone-mockup {
            position: absolute;
            bottom: -10px;
            left: 240px;
            width: 130px;
            z-index: 10;
            filter: drop-shadow(0 25px 50px rgba(25,25,25,0.1));
          }
          .phone-bezel {
            background: #191919;
            border: 2px solid #191919;
            border-radius: 28px;
            padding: 2.5px;
            box-shadow: 0 0 0 1px #d5d2c6;
          }
          .phone-screen {
            background: var(--color-parchment-white);
            aspect-ratio: 9 / 19;
            border-radius: 25px;
            overflow: hidden;
            position: relative;
            border: none;
            display: flex;
            flex-direction: column;
          }
          .phone-dynamic-island {
            position: absolute;
            top: 6px;
            left: 50%;
            transform: translateX(-50%);
            width: 32px;
            height: 9px;
            background: #191919;
            border-radius: 50px;
            z-index: 20;
          }
          .phone-app-header {
            height: 22px;
            background: var(--color-vellum-background);
            border-bottom: 1px solid var(--border);
            padding: 5px 6px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .phone-app-logo {
            font-size: 0.5rem;
            font-weight: 600;
            color: var(--color-charcoal-black);
            font-family: var(--font-sohne);
            transform: scale(0.95);
          }
          .phone-app-menu {
            width: 7px;
            height: 4px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .phone-app-bar {
            height: 1px;
            background: var(--color-charcoal-black);
            width: 100%;
          }
          .phone-app-content {
            flex: 1;
            padding: 8px 6px;
            background: var(--color-vellum-background);
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          .phone-mock-profile-card {
            background: var(--color-parchment-white);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 5px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .phone-mock-cover {
            height: 36px;
            background: var(--color-charcoal-black);
            border-radius: 3px;
          }
          .phone-mock-avatar {
            width: 22px;
            height: 22px;
            border-radius: 4px;
            background: var(--color-parchment-white);
            margin-top: -14px;
            margin-left: 4px;
            border: 1.5px solid var(--color-parchment-white);
            overflow: hidden;
          }
          .phone-mock-title {
            height: 4px;
            background: var(--color-charcoal-black);
            border-radius: 1.5px;
            width: 70%;
            margin-left: 3px;
          }
          .phone-mock-subtitle {
            height: 2.5px;
            background: var(--color-muted-text-gray);
            border-radius: 1px;
            width: 40%;
            margin-left: 3px;
          }
          .phone-mock-btn-row {
            display: flex;
            gap: 3px;
            margin-top: 2px;
          }
          .phone-mock-btn {
            flex: 1;
            height: 9px;
            background: var(--border);
            border-radius: 2px;
          }
          .phone-mock-btn-green {
            background: var(--color-story-green);
          }
          
          @media (max-width: 900px) {
            .hero-split-grid {
              grid-template-columns: 1fr !important;
              gap: 48px !important;
              text-align: center !important;
            }
            .hero-split-grid div {
              align-items: center !important;
            }
            .hero-split-grid h1, .hero-split-grid p {
              text-align: center !important;
            }
            .hero-graphic-wrap {
              max-width: 440px !important;
              margin: 0 auto !important;
            }
          }
          @media (max-width: 768px) {
            .hero-graphic-wrap {
              display: none !important;
            }
          }

          /* Marquee Category Showcase */
          .marquee-container {
            overflow: hidden;
            white-space: nowrap;
            width: 100%;
            display: flex;
            position: relative;
            padding: 24px 0;
            mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
          }

          .marquee-track {
            display: flex;
            gap: 16px;
            width: max-content;
            animation: marquee-anim 100s linear infinite;
          }

          .marquee-container:hover .marquee-track {
            animation-play-state: paused;
          }

          @keyframes marquee-anim {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-50%, 0, 0);
            }
          }

          .marquee-card {
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            background: var(--color-parchment-white);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          }
          
          .marquee-card:hover {
            border-color: #22c55e;
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(34, 197, 94, 0.08);
          }

          /* Category hover button styling */
          .uiverse-glow-btn {
            color: var(--color-rich-black);
            text-decoration: none;
            font-size: 13px; /* adjusted from 25px to fit the 160px cards perfectly */
            border: none;
            background: none;
            font-weight: 600;
            font-family: 'Poppins', sans-serif;
            margin: 0;
            height: auto;
            padding: 0;
            cursor: pointer;
            position: relative;
            text-transform: uppercase;
            line-height: 1.2;
            display: inline-block;
            white-space: nowrap;
          }

          .uiverse-glow-btn::before {
            margin-left: auto;
          }

          .uiverse-glow-btn::after, .uiverse-glow-btn::before {
            content: '';
            width: 0%;
            height: 2px;
            background: #f44336;
            display: block;
            transition: 0.5s;
          }

          .uiverse-glow-btn:hover::after, .uiverse-glow-btn:hover::before,
          .marquee-card:hover .uiverse-glow-btn::after,
          .marquee-card:hover .uiverse-glow-btn::before {
            width: 100%;
          }

          @media (max-width: 480px) {
            .devices-showcase {
              max-width: 320px !important;
              height: 220px !important;
            }
            .laptop-mockup {
              width: 250px !important;
              left: -15px !important;
              top: 15px !important;
            }
            .phone-mockup {
              width: 96px !important;
              left: 139px !important;
              bottom: -5px !important;
            }
          }
        `}</style>
      </section>

      {/* ── Featured Categories ── */}
      <section className="section" style={{ background: 'var(--color-parchment-white)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <h2 className="section-title">Browse by Category</h2>
              <p className="section-sub">Find businesses in popular categories</p>
            </div>
            <button
              onClick={() => navigate('categories')}
              className="show-all-uiverse-btn"
              style={{ '--clr': '#000000', '--hover-clr': '#22c55e' }}
            >
              <span className="show-all-btn-icon-wrapper">
                <svg
                  viewBox="0 0 14 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="show-all-btn-icon-svg"
                  width="8"
                >
                  <path
                    d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                    fill="currentColor"
                  ></path>
                </svg>

                <svg
                  viewBox="0 0 14 15"
                  fill="none"
                  width="8"
                  xmlns="http://www.w3.org/2000/svg"
                  className="show-all-btn-icon-svg show-all-btn-icon-svg--copy"
                >
                  <path
                    d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                    fill="currentColor"
                  ></path>
                </svg>
              </span>
              Explore All
            </button>
          </div>

          {loading ? (
            <div className="spinner-wrap"><div className="loader"></div></div>
          ) : (
            <div className="marquee-container">
              <div className="marquee-track">
                {/* First Set */}
                {categories.map((cat, idx) => (
                  <MarqueeCategoryCard key={`c1-${cat.category}-${idx}`} cat={cat} onClick={() => navigate('list', { category: cat.category })} />
                ))}
                {/* Second Set (Duplicate for Infinite Loop) */}
                {categories.map((cat, idx) => (
                  <MarqueeCategoryCard key={`c2-${cat.category}-${idx}`} cat={cat} onClick={() => navigate('list', { category: cat.category })} />
                ))}
              </div>
            </div>
          )}


        </div>
      </section>

      {/* ── Featured Businesses ── */}
      {featured.length > 0 && (
        <section className="section" style={{ background: 'var(--color-vellum-background)', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
              <div>
                <h2 className="section-title">Top Rated Businesses</h2>
                <p className="section-sub">Highest rated by customers</p>
              </div>
              <button
                onClick={() => navigate('list', {})}
                className="show-all-uiverse-btn"
                style={{ '--clr': '#000000', '--hover-clr': '#22c55e' }}
              >
                <span className="show-all-btn-icon-wrapper">
                  <svg
                    viewBox="0 0 14 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="show-all-btn-icon-svg"
                    width="8"
                  >
                    <path
                      d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                      fill="currentColor"
                    ></path>
                  </svg>

                  <svg
                    viewBox="0 0 14 15"
                    fill="none"
                    width="8"
                    xmlns="http://www.w3.org/2000/svg"
                    className="show-all-btn-icon-svg show-all-btn-icon-svg--copy"
                  >
                    <path
                      d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </span>
                Explore All
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

      {/* ── YouTube Videos Section ── */}
      <section className="section" style={{ borderTop: '1px solid var(--border)', background: 'var(--color-parchment-white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="badge badge-blue" style={{ marginBottom: 12 }}>
              தமிழ்நாடு வணிகர்களின் சங்கமம்
            </div>
            <h2 className="section-title" style={{ fontSize: '32px' }}>The Most Trusted B2B B2C Merchant Network</h2>
            <p className="section-sub">
              Watch our videos and conference highlights to learn more about the B2B & B2C marketplace community
            </p>
          </div>

          <div className="grid-3">
            {[
              {
                id: 'mhVVWSS_a4s',
                title: 'வாணிகன் App என்றால் என்ன? | What is VANIGAN APP?',
                subtitle: 'Learn how Vanigan App helps local B2B B2C businesses grow across Tamil Nadu.',
              },
              {
                id: 'aJQra51Lwlo',
                title: "Vanigan App - Tamilnadu's Largest B2B Market Place - Promo Video",
                subtitle: 'TNVS Vanigan App promotional B2B marketplace B2C introduction and app features.',
              },
              {
                id: 'XSI0I22Yk3M',
                title: 'தமிழ்நாடு வணிகர்களின் சங்கமம் | வணிகர்களின் கீதம் | Anthem',
                subtitle: 'Official anthem and theme of Tamil Nadu Vanigargalin Sangamam by Yeshwanth Raja.',
              },
              {
                id: 'SZmp6RR9pAM',
                title: 'தமிழ்நாடு வணிகர்கள் சங்கம் சென்னை மற்றும் காஞ்சி மண்டல மாநாடு 2021',
                subtitle: 'Highlights from the Chennai and Kanchipuram regional merchant B2B conference.',
              },
              {
                id: 'yKncEUF8828',
                title: 'மதுரை மண்டல மகாநாட்டில் தலைவர் H.ரபீக் M.A.,LLB., அவர்கள் உரை',
                subtitle: 'Keynote speech by President H. Rafiq at the Madurai B2B B2C merchant conference.',
              },
              {
                id: 'hF_VNO7QA4k',
                title: 'வணிகர்களின் எழுச்சி மாநில மாநாடு | தமிழ்நாடு வணிகர்களின் சங்கமம்',
                subtitle: 'Statewide B2B merchant conference key highlights and community address.',
              },
            ].map(video => (
              <div key={video.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: '#000' }}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ border: 'none', display: 'block' }}
                  />
                </div>
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{
                      fontFamily: 'var(--font-sohne)',
                      fontWeight: 600,
                      fontSize: '15px',
                      lineHeight: 1.3,
                      marginBottom: 8,
                      color: 'var(--color-charcoal-black)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {video.title}
                    </h3>
                    <p style={{
                      fontFamily: 'var(--font-sohne)',
                      fontSize: '13px',
                      color: 'var(--color-muted-text-gray)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.4
                    }}>
                      {video.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WhatsApp Connect Section (Fruitful style) ── */}
      <section className="section" style={{ padding: '64px 0', background: 'var(--color-mint-green-glow)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '48px',
            alignItems: 'center',
            width: '100%',
          }} className="whatsapp-grid">
            
            {/* Left Content Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--color-muted-sage)',
                color: 'var(--color-deep-fern-green)',
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontFamily: 'var(--font-pp-neue-montreal)'
              }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.451L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 2.01 14.113.993 11.486.993c-5.438 0-9.863 4.37-9.867 9.8-.001 1.73.457 3.419 1.323 4.908l-.98 3.577 3.69-.958zm12.39-5.464c-.307-.154-1.817-.897-2.097-.998-.28-.103-.483-.154-.686.154-.203.308-.785.998-.962 1.194-.177.197-.355.22-.662.066-.307-.154-1.3-.478-2.473-1.523-.913-.814-1.53-1.82-1.708-2.128-.178-.308-.019-.475.135-.628.138-.138.307-.359.46-.539.154-.18.206-.308.308-.513.102-.206.05-.385-.025-.539-.075-.154-.687-1.657-.941-2.272-.247-.597-.5-.516-.686-.525-.178-.008-.38-.01-.583-.01-.203 0-.533.077-.812.384-.28.308-1.068 1.046-1.068 2.552 0 1.506 1.096 2.961 1.248 3.166.153.206 2.158 3.302 5.228 4.618.73.313 1.299.5 1.743.642.733.233 1.401.2 1.929.121.588-.087 1.817-.743 2.071-1.46.254-.718.254-1.333.178-1.46-.076-.128-.279-.205-.586-.359z"/>
                </svg>
                WhatsApp Chat
              </div>
              
              <h2 style={{
                fontFamily: 'var(--font-pp-neue-montreal)',
                fontSize: 'clamp(1.8rem, 4.5vw, 2.6rem)',
                fontWeight: 700,
                lineHeight: 1.2,
                color: 'var(--color-rich-black)',
                textAlign: 'left',
                letterSpacing: '-0.019em'
              }}>
                Have questions? <br />
                <span style={{ color: 'var(--color-deep-fern-green)' }}>Chat with us</span> instantly.
              </h2>
              
              <p style={{
                color: 'var(--color-cool-gray)',
                fontSize: '15px',
                lineHeight: 1.6,
                maxWidth: '520px',
                textAlign: 'left',
                fontFamily: 'var(--font-pp-neue-montreal)'
              }}>
                Listing your business, verifying your details, or generating leads on Vanigan is simple. Scan the QR code to message our support team on WhatsApp directly. We are online and ready to assist you.
              </p>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                margin: '8px 0',
                fontFamily: 'var(--font-pp-neue-montreal)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-muted-sage)', color: 'var(--color-deep-fern-green)' }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span style={{ color: 'var(--color-rich-black)', fontSize: '14px', fontWeight: 500 }}>100% Free Consultation & Guidance</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-muted-sage)', color: 'var(--color-deep-fern-green)' }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span style={{ color: 'var(--color-rich-black)', fontSize: '14px', fontWeight: 500 }}>Quick Verification & Listing Approval</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-muted-sage)', color: 'var(--color-deep-fern-green)' }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span style={{ color: 'var(--color-rich-black)', fontSize: '14px', fontWeight: 500 }}>Direct Access to Verified Buyers & Sellers</span>
                </div>
              </div>
              
              {/* Primary Button Style */}
              <a
                href="https://wa.me/919791659816?text=Hi"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{
                  padding: '10px 24px',
                  fontWeight: 500,
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  textDecoration: 'none'
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.451L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 2.01 14.113.993 11.486.993c-5.438 0-9.863 4.37-9.867 9.8-.001 1.73.457 3.419 1.323 4.908l-.98 3.577 3.69-.958zm12.39-5.464c-.307-.154-1.817-.897-2.097-.998-.28-.103-.483-.154-.686.154-.203.308-.785.998-.962 1.194-.177.197-.355.22-.662.066-.307-.154-1.3-.478-2.473-1.523-.913-.814-1.53-1.82-1.708-2.128-.178-.308-.019-.475.135-.628.138-.138.307-.359.46-.539.154-.18.206-.308.308-.513.102-.206.05-.385-.025-.539-.075-.154-.687-1.657-.941-2.272-.247-.597-.5-.516-.686-.525-.178-.008-.38-.01-.583-.01-.203 0-.533.077-.812.384-.28.308-1.068 1.046-1.068 2.552 0 1.506 1.096 2.961 1.248 3.166.153.206 2.158 3.302 5.228 4.618.73.313 1.299.5 1.743.642.733.233 1.401.2 1.929.121.588-.087 1.817-.743 2.071-1.46.254-.718.254-1.333.178-1.46-.076-.128-.279-.205-.586-.359z"/>
                </svg>
                Click to Chat Now
              </a>
            </div>
            
            {/* Right QR Column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '100%',
                maxWidth: '300px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                position: 'relative'
              }}>
                {/* Profile Header Inside QR Card */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  paddingBottom: '14px'
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'var(--color-deep-fern-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-canvas-white)'
                  }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.451L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 2.01 14.113.993 11.486.993c-5.438 0-9.863 4.37-9.867 9.8-.001 1.73.457 3.419 1.323 4.908l-.98 3.577 3.69-.958zm12.39-5.464c-.307-.154-1.817-.897-2.097-.998-.28-.103-.483-.154-.686.154-.203.308-.785.998-.962 1.194-.177.197-.355.22-.662.066-.307-.154-1.3-.478-2.473-1.523-.913-.814-1.53-1.82-1.708-2.128-.178-.308-.019-.475.135-.628.138-.138.307-.359.46-.539.154-.18.206-.308.308-.513.102-.206.05-.385-.025-.539-.075-.154-.687-1.657-.941-2.272-.247-.597-.5-.516-.686-.525-.178-.008-.38-.01-.583-.01-.203 0-.533.077-.812.384-.28.308-1.068 1.046-1.068 2.552 0 1.506 1.096 2.961 1.248 3.166.153.206 2.158 3.302 5.228 4.618.73.313 1.299.5 1.743.642.733.233 1.401.2 1.929.121.588-.087 1.817-.743 2.071-1.46.254-.718.254-1.333.178-1.46-.076-.128-.279-.205-.586-.359z"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'left', fontFamily: 'var(--font-pp-neue-montreal)' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-rich-black)', lineHeight: 1.2 }}>Vanigan Support</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-deep-fern-green)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--color-deep-fern-green)', fontWeight: 500 }}>Active Online</span>
                  </div>
                </div>
              </div>

              {/* QR Code Embed */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&ecc=H&data=https%3A%2F%2Fwa.me%2F919791659816%3Ftext%3DHi&bgcolor=e1fdea"
                  alt="WhatsApp QR Code"
                  style={{ width: '180px', height: '180px', objectFit: 'contain' }}
                />
                {/* Center Business Logo Overlay */}
                <img
                  src="/business_illustration.png"
                  alt="Vanigan Logo"
                  style={{
                    position: 'absolute',
                    width: '42px',
                    height: '42px',
                    objectFit: 'contain',
                    background: 'var(--color-canvas-white)',
                    padding: '4px',
                    borderRadius: '50%',
                    border: '1px solid var(--color-subtle-ash)'
                  }}
                />
              </div>

              <div style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '12px', color: 'var(--color-cool-gray)', fontWeight: 500, textAlign: 'center' }}>
                Scan using phone camera
              </div>
              </div>
            </div>
            
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .whatsapp-grid {
              grid-template-columns: 1fr !important;
              gap: 40px !important;
            }
            .whatsapp-grid div {
              align-items: center;
              text-align: center;
            }
            .whatsapp-grid p {
              text-align: center;
            }
            .whatsapp-grid button, .whatsapp-grid a {
              margin: 0 auto;
            }
          }
        `}</style>
      </section>

    </div>
  );
}

function MarqueeCategoryCard({ cat, onClick }) {
  return (
    <div 
      className="card card-hover marquee-card" 
      onClick={onClick} 
      style={{ 
        width: '160px', 
        flexShrink: 0,
        textAlign: 'center', 
        background: 'var(--color-parchment-white)',
        display: 'inline-block',
        margin: '0 8px'
      }}
    >
      <div style={{
        height: '100px', 
        background: 'var(--color-vellum-background)', 
        overflow: 'hidden',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
      }}>
        {cat.imageUrl ? (
          <img src={cat.imageUrl} alt={cat.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Store size={24} style={{ color: 'var(--color-muted-text-gray)' }} />
        )}
      </div>
      <div style={{ padding: '10px 8px', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
        <button 
          className="uiverse-glow-btn" 
          style={{ width: '100%' }}
        >
          {cat.category}
        </button>
      </div>
    </div>
  );
}

function CategoryCard({ cat, onClick }) {
  return (
    <div className="card card-hover" onClick={onClick} style={{ textAlign: 'center', background: 'var(--color-parchment-white)' }}>
      <div style={{
        aspectRatio: '1', background: 'var(--color-vellum-background)', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {cat.imageUrl ? (
          <img src={cat.imageUrl} alt={cat.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Store size={32} style={{ color: 'var(--color-muted-text-gray)' }} />
        )}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontFamily: 'var(--font-sohne)', fontWeight: 600, fontSize: '14px', color: 'var(--color-charcoal-black)', lineHeight: 1.3 }}>
          {cat.category}
        </div>
      </div>
    </div>
  );
}

function BizCard({ biz, onClick }) {
  const cover   = biz.coverImage || biz.image || '';
  const profile = biz.coverImage && biz.image ? biz.image : '';
  return (
    <div className="card card-hover" onClick={onClick} style={{ background: 'var(--color-parchment-white)' }}>
      <div style={{ height: 110, background: 'var(--color-vellum-background)', overflow: 'visible', position: 'relative' }}>
        <div style={{ height: 110, overflow: 'hidden' }}>
          {cover ? (
            <img src={cover} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={28} style={{ color: 'var(--color-muted-text-gray)' }} />
            </div>
          )}
        </div>
        {biz.active && (
          <div className="badge badge-green" style={{ position: 'absolute', top: 8, right: 8 }}>Active</div>
        )}
        {profile && (
          <img src={profile} alt="" style={{
            position: 'absolute', bottom: -18, left: 14,
            width: 40, height: 40, borderRadius: 0, objectFit: 'cover',
            border: '1px solid var(--border)', background: 'var(--color-parchment-white)'
          }} />
        )}
      </div>
      <div style={{ padding: '16px', paddingTop: profile ? 24 : 16 }}>
        <div style={{ fontFamily: 'var(--font-sohne)', fontWeight: 600, fontSize: '16px', color: 'var(--color-charcoal-black)', marginBottom: 4 }}>
          {biz.name}
        </div>
        {biz.category && <div style={{ fontFamily: 'var(--font-sohne)', fontSize: '13px', color: 'var(--color-story-green)', fontWeight: 500, marginBottom: 4 }}>{biz.category}</div>}
        {biz.avgRating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontFamily: 'var(--font-sohne)' }}>
            <Star size={12} fill="var(--color-story-green)" stroke="var(--color-story-green)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-charcoal-black)' }}>{biz.avgRating.toFixed(1)}</span>
            <span style={{ fontSize: '12px', color: 'var(--color-muted-text-gray)' }}>({biz.reviewCount || 0} reviews)</span>
          </div>
        )}
        {biz.address && (
          <div style={{ fontFamily: 'var(--font-sohne)', fontSize: '13px', color: 'var(--color-muted-text-gray)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={13} style={{ flexShrink: 0 }} />
            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {biz.address}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
