import { Headphones, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { useNav } from '../App.jsx';

export default function Footer() {
  const { navigate } = useNav();

  const go = (page) => {
    navigate(page);
  };

  return (
    <footer style={{
      backgroundColor: 'rgba(0, 0, 0, 0.71)',
      backgroundImage: 'url("/map.png")',
      backgroundPosition: 'center center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '56px 0 40px',
      color: '#f8fafc',
      fontSize: '.85rem',
      fontFamily: 'inherit',
      position: 'relative'
    }}>
      <div className="container footer-grid" style={{ position: 'relative', zIndex: 2 }}>
        {/* Column 1: Brand & Contact & Address */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.5px', color: '#ffffff', marginBottom: 12 }}>
              VANIGAN
            </h2>
            
            {/* Customer Support */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 8px' }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)', flexShrink: 0
              }}>
                <Headphones size={20} />
              </div>
              <div>
                <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                  24x7 Hours Customer Support
                </div>
                <a href="tel:+918680085737" style={{
                  fontSize: '1.05rem', fontWeight: 800, color: '#ffffff',
                  textDecoration: 'none', transition: 'color .2s'
                }} onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                   onMouseLeave={e => e.target.style.color = '#ffffff'}>
                  +91 8680085737
                </a>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 style={{ fontSize: '.78rem', fontWeight: 800, letterSpacing: '0.8px', color: '#ffffff', textTransform: 'uppercase', marginBottom: 8 }}>
              Address
            </h4>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: 300 }}>
              26N, Bharathi Nagar, Near Palayapudur,<br />
              Periyanaickenpalayam, Coimbatore,<br />
              Tamil Nadu - 641020
            </p>
          </div>
        </div>

        {/* Column 2: Know Us */}
        <div>
          <h4 className="footer-title">Know Us</h4>
          <ul className="footer-links">
            <li><button onClick={() => go('home')}>About Us</button></li>
            <li><button onClick={() => go('home')}>Contact Us</button></li>
            <li><button onClick={() => go('categories')}>Categories</button></li>
            <li><button onClick={() => go('add')}>Request a Listing</button></li>
          </ul>
        </div>

        {/* Column 3: Useful Links */}
        <div>
          <h4 className="footer-title">Useful Link</h4>
          <ul className="footer-links">
            <li><button onClick={() => go('home')}>Directory Policy</button></li>
            <li><button onClick={() => go('home')}>Returns & Refunds</button></li>
            <li><button onClick={() => go('home')}>Terms & Conditions</button></li>
            <li><button onClick={() => go('home')}>Privacy Policy</button></li>
          </ul>
        </div>

        {/* Column 4: Social Circle & Play Store */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Social Icons */}
          <div>
            <h4 className="footer-title" style={{ marginBottom: 12 }}>Our Social Circle</h4>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="#" className="social-btn"><Facebook size={16} /></a>
              <a href="#" className="social-btn"><Twitter size={16} /></a>
              <a href="#" className="social-btn"><Instagram size={16} /></a>
              <a href="#" className="social-btn"><Youtube size={16} /></a>
            </div>
          </div>

          {/* Play Store buttons */}
          <div>
            <h4 className="footer-title" style={{ marginBottom: 12 }}>We Are In Play Store</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <a 
                href="https://play.google.com/store/apps/details?id=io.vanigan.ai&pcampaignid=web_share" 
                target="_blank" 
                rel="noreferrer" 
                style={{ display: 'inline-block', borderRadius: 6, overflow: 'hidden', height: 38, border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                  alt="Get it on Google Play" 
                  style={{ height: '100%', display: 'block' }} 
                />
              </a>
              <a 
                href="#" 
                style={{ display: 'inline-block', borderRadius: 6, overflow: 'hidden', height: 38, border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                  alt="Download on the App Store" 
                  style={{ height: '100%', display: 'block' }} 
                />
              </a>
            </div>
          </div>
        </div>

        {/* Column 5: Information */}
        <div>
          <h4 className="footer-title">Information</h4>
          <ul className="footer-links">
            <li><button onClick={() => go('home')}>Home</button></li>
            <li><button onClick={() => go('my')}>My Business</button></li>
          </ul>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 2.2fr 1.2fr 1.2fr 2fr 1.2fr;
          gap: 40px;
        }
        .footer-title {
          font-size: .8rem;
          font-weight: 800;
          letter-spacing: '0.8px';
          color: #ffffff;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .footer-links button {
          background: none;
          border: none;
          padding: 0;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          font-size: .83rem;
          font-family: inherit;
          text-align: left;
          transition: all 0.2s;
        }
        .footer-links button:hover {
          color: var(--accent);
          transform: translateX(2px);
        }
        .social-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.2s;
        }
        .social-btn:hover {
          background: var(--accent);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 149, 246, 0.25);
        }
        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
          }
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
}
