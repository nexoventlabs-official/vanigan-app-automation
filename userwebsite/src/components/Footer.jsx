import { Headphones, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { useNav } from '../App.jsx';

export default function Footer() {
  const { navigate } = useNav();

  const go = (page) => {
    navigate(page);
  };

  return (
    <footer style={{
      backgroundColor: 'var(--color-subtle-ash)',
      borderTop: '1px solid var(--color-subtle-ash)',
      padding: '80px 0 48px',
      color: 'var(--color-cool-gray)',
      fontSize: '13px',
      fontFamily: 'var(--font-pp-neue-montreal)',
      position: 'relative'
    }}>
      <div className="container footer-grid" style={{ position: 'relative', zIndex: 2 }}>
        {/* Column 1: Brand & Contact & Address */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-pp-neue-montreal)',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              color: 'var(--color-rich-black)',
              marginBottom: 12
            }}>
              VANIGAN
            </h2>
            
            {/* Customer Support */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 8px' }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1px solid var(--color-subtle-ash)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-rich-black)',
                background: 'var(--color-canvas-white)',
                flexShrink: 0
              }}>
                <Headphones size={18} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-cool-gray)', fontWeight: 500 }}>
                  24x7 Customer Support
                </div>
                <a href="tel:+918680085737" style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-rich-black)',
                  textDecoration: 'none',
                  transition: 'color .2s'
                }} className="footer-tel">
                  +91 8680085737
                </a>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-pp-neue-montreal)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.8px',
              color: 'var(--color-rich-black)',
              textTransform: 'uppercase',
              marginBottom: 8
            }}>
              Address
            </h4>
            <p style={{ color: 'var(--color-cool-gray)', lineHeight: 1.6, maxWidth: 300 }}>
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
              <a href="#" className="social-btn"><Facebook size={15} /></a>
              <a href="#" className="social-btn"><Twitter size={15} /></a>
              <a href="#" className="social-btn"><Instagram size={15} /></a>
              <a href="#" className="social-btn"><Youtube size={15} /></a>
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
                style={{ display: 'inline-block', borderRadius: 4, overflow: 'hidden', height: 32, border: '1px solid var(--border)' }}
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                  alt="Get it on Google Play" 
                  style={{ height: '100%', display: 'block' }} 
                />
              </a>
              <a 
                href="#" 
                style={{ display: 'inline-block', borderRadius: 4, overflow: 'hidden', height: 32, border: '1px solid var(--border)' }}
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
          font-family: var(--font-pp-neue-montreal);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          color: var(--color-rich-black);
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
          color: var(--color-cool-gray);
          cursor: pointer;
          font-size: 13px;
          line-height: 1.43;
          font-family: var(--font-pp-neue-montreal);
          text-align: left;
          transition: all 0.2s;
        }
        .footer-links button:hover {
          color: var(--color-rich-black);
          transform: translateX(2px);
        }
        .footer-tel:hover {
          color: var(--color-deep-fern-green) !important;
        }
        .social-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-canvas-white);
          border: 1px solid var(--color-subtle-ash);
          color: var(--color-cool-gray);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.2s;
        }
        .social-btn:hover {
          background: var(--color-rich-black);
          color: var(--color-canvas-white);
          border-color: var(--color-rich-black);
          transform: translateY(-2px);
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
