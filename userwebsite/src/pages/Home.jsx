import { useEffect, useState } from 'react';
import { Search, ArrowRight, Plus, Grid3X3, Store, MapPin } from 'lucide-react';
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
      {/* ── Hero Split Section (Canva Design) ── */}
      <section style={{
        background: '#ffffff',
        padding: '80px 0 64px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '400px',
          height: '400px',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(24,24,27,0.04) 0%, transparent 75%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-100px',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(251,191,36,0.06) 0%, transparent 75%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 5 }}>
          <div className="hero-split-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '40px',
            alignItems: 'center',
          }}>
            
            {/* Left Content Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
              <h1 style={{
                fontSize: 'clamp(2rem, 5.5vw, 3.6rem)',
                fontWeight: 900,
                lineHeight: 1.15,
                color: 'var(--text)',
                textAlign: 'left',
                letterSpacing: '-1px'
              }}>
                Discover Trusted<br />
                <span style={{
                  background: 'linear-gradient(90deg, var(--accent) 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Businesses</span> Across TN
              </h1>
              
              <p style={{
                fontSize: '1.05rem',
                color: 'var(--muted)',
                lineHeight: 1.6,
                maxWidth: '540px',
                textAlign: 'left',
                margin: '4px 0 8px'
              }}>
                Connecting buyers and sellers across all districts of Tamil Nadu. Find local services, registered merchants, and direct wholesale B2B contacts.
              </p>

              {/* Canva Search bar layout */}
              <form onSubmit={handleSearch} style={{
                width: '100%',
                maxWidth: '560px',
                display: 'flex',
                gap: '8px',
                background: '#ffffff',
                padding: '6px',
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={20} style={{ position: 'absolute', left: 14, color: 'var(--muted2)' }} />
                  <input
                    className="input"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Try searching 'Garments', 'Hotels', 'Construction'..."
                    style={{
                      paddingLeft: 44,
                      height: 48,
                      fontSize: '.95rem',
                      border: 'none',
                      background: 'none',
                      outline: 'none',
                      width: '100%'
                    }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{
                  height: 48,
                  paddingInline: 24,
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '.95rem'
                }}>
                  Search
                </button>
              </form>

              {/* Quick Tags / Chips underneath search */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '.78rem', color: 'var(--muted2)', fontWeight: 600 }}>Popular:</span>
                {[
                  'Garments', 'Hotels', 'Garages', 'Computers', 'Organic Stores'
                ].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => navigate('list', { search: tag })}
                    style={{
                      background: 'rgba(0, 149, 246, 0.05)',
                      border: '1px solid rgba(0, 149, 246, 0.12)',
                      padding: '4px 12px',
                      borderRadius: '100px',
                      fontSize: '.75rem',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none',
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = 'rgba(0, 149, 246, 0.1)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = 'rgba(0, 149, 246, 0.05)';
                      e.target.style.transform = 'none';
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>

            </div>

            {/* Right Graphic Column */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }} className="hero-graphic-wrap">
              {/* Soft decorative shadow disc behind image */}
              <div style={{
                position: 'absolute',
                width: '80%',
                height: '80%',
                borderRadius: '50%',
                background: 'rgba(0, 149, 246, 0.04)',
                filter: 'blur(40px)',
                zIndex: 1,
              }} />
              <img
                src="/hero_illustration.png"
                alt="Tamil Nadu Directory Showcase"
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  objectFit: 'contain',
                  zIndex: 2,
                  filter: 'drop-shadow(0 15px 30px rgba(0, 149, 246, 0.1))',
                  animation: 'heroFloat 5s ease-in-out infinite',
                }}
              />
            </div>

          </div>
        </div>

        {/* CSS tags */}
        <style>{`
          @keyframes heroFloat {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-12px) rotate(1.5deg); }
            100% { transform: translateY(0px) rotate(0deg); }
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
              max-width: 320px !important;
              margin: 0 auto !important;
            }
          }
        `}</style>
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
        <section className="section" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
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

      {/* ── YouTube Videos Section ── */}
      <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="badge badge-blue" style={{ marginBottom: 12 }}>
              தமிழ்நாடு வணிகர்களின் சங்கமம்
            </div>
            <h2 className="section-title">The Most Trusted Portal for Local Businesses</h2>
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
                <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: '.92rem', lineHeight: 1.3, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {video.title}
                    </h3>
                    <p style={{ fontSize: '.78rem', color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                      {video.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WhatsApp Connect Section ── */}
      <section className="section" style={{ padding: '64px 0', background: 'linear-gradient(180deg, #ffffff 0%, #f4fbf7 100%)', borderTop: '1px solid var(--border)' }}>
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
                background: '#e8f9f0',
                color: '#15803d',
                padding: '6px 14px',
                borderRadius: '50px',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.451L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 2.01 14.113.993 11.486.993c-5.438 0-9.863 4.37-9.867 9.8-.001 1.73.457 3.419 1.323 4.908l-.98 3.577 3.69-.958zm12.39-5.464c-.307-.154-1.817-.897-2.097-.998-.28-.103-.483-.154-.686.154-.203.308-.785.998-.962 1.194-.177.197-.355.22-.662.066-.307-.154-1.3-.478-2.473-1.523-.913-.814-1.53-1.82-1.708-2.128-.178-.308-.019-.475.135-.628.138-.138.307-.359.46-.539.154-.18.206-.308.308-.513.102-.206.05-.385-.025-.539-.075-.154-.687-1.657-.941-2.272-.247-.597-.5-.516-.686-.525-.178-.008-.38-.01-.583-.01-.203 0-.533.077-.812.384-.28.308-1.068 1.046-1.068 2.552 0 1.506 1.096 2.961 1.248 3.166.153.206 2.158 3.302 5.228 4.618.73.313 1.299.5 1.743.642.733.233 1.401.2 1.929.121.588-.087 1.817-.743 2.071-1.46.254-.718.254-1.333.178-1.46-.076-.128-.279-.205-.586-.359z"/>
                </svg>
                WhatsApp Chat
              </div>
              
              <h2 style={{
                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                fontWeight: 900,
                lineHeight: 1.2,
                color: 'var(--text)',
                textAlign: 'left',
                letterSpacing: '-0.5px'
              }}>
                Have Questions? <br />
                <span style={{ color: '#25D366' }}>Chat With Us</span> Instantly
              </h2>
              
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '520px', textAlign: 'left' }}>
                Listing your business, verifying your details, or generating leads on Vanigan is simple. Scan the QR code to message our support team on WhatsApp directly. We are online and ready to assist you.
              </p>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                margin: '8px 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a' }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600 }}>100% Free Consultation & Guidance</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a' }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600 }}>Quick Verification & Listing Approval</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a' }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600 }}>Direct Access to Verified Buyers & Sellers</span>
                </div>
              </div>
              
              <a
                href="https://wa.me/919791659816?text=Hi"
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#25D366',
                  color: '#ffffff',
                  fontWeight: 700,
                  padding: '12px 28px',
                  borderRadius: '12px',
                  fontSize: '.92rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                  transition: 'all 0.2s',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '8px',
                  textDecoration: 'none'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.45)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 211, 102, 0.3)';
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
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '14px'
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: '#25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.451L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 2.01 14.113.993 11.486.993c-5.438 0-9.863 4.37-9.867 9.8-.001 1.73.457 3.419 1.323 4.908l-.98 3.577 3.69-.958zm12.39-5.464c-.307-.154-1.817-.897-2.097-.998-.28-.103-.483-.154-.686.154-.203.308-.785.998-.962 1.194-.177.197-.355.22-.662.066-.307-.154-1.3-.478-2.473-1.523-.913-.814-1.53-1.82-1.708-2.128-.178-.308-.019-.475.135-.628.138-.138.307-.359.46-.539.154-.18.206-.308.308-.513.102-.206.05-.385-.025-.539-.075-.154-.687-1.657-.941-2.272-.247-.597-.5-.516-.686-.525-.178-.008-.38-.01-.583-.01-.203 0-.533.077-.812.384-.28.308-1.068 1.046-1.068 2.552 0 1.506 1.096 2.961 1.248 3.166.153.206 2.158 3.302 5.228 4.618.73.313 1.299.5 1.743.642.733.233 1.401.2 1.929.121.588-.087 1.817-.743 2.071-1.46.254-.718.254-1.333.178-1.46-.076-.128-.279-.205-.586-.359z"/>
                    </svg>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.2 }}>Vanigan Support</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Active Online</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Embed */}
                <div style={{
                  padding: '8px',
                  background: '#ffffff',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https%3A%2F%2Fwa.me%2F919791659816%3Ftext%3DHi"
                    alt="WhatsApp QR Code"
                    style={{ width: '180px', height: '180px', objectFit: 'contain' }}
                  />
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textAlign: 'center' }}>
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
        {biz.rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Star size={11} fill="#fbbf24" stroke="#fbbf24" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text)' }}>{biz.rating}</span>
            <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>({biz.reviewCount || 0})</span>
          </div>
        )}
        {biz.address && (
          <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} style={{ flexShrink: 0 }} />
            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {biz.address}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
