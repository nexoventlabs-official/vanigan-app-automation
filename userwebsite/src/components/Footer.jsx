import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { useNav } from '../App.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Footer() {
  const { navigate } = useNav();
  const { isLoggedIn, business } = useAuth();
  const canAddBusiness = !isLoggedIn || !business;

  const go = (page) => {
    navigate(page);
  };

  return (
    <footer style={{
      backgroundColor: 'var(--color-subtle-ash)',
      backgroundImage: "url('/footer-bg.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
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
              5/79, Perumal Koil Street,<br />
              Sadanandapuram, Thandalam,<br />
              Tamil Nadu 600128
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
            {canAddBusiness && <li><button onClick={() => go('add')}>Request a Listing</button></li>}
          </ul>
        </div>

        {/* Column 3: Useful Links */}
        <div>
          <h4 className="footer-title">Useful Link</h4>
          <ul className="footer-links">
            <li><button onClick={() => go('home')}>Directory Policy</button></li>
            <li><button onClick={() => go('home')}>Returns & Refunds</button></li>
            <li><button onClick={() => go('terms')}>Terms & Conditions</button></li>
            <li><button onClick={() => go('privacy')}>Privacy Policy</button></li>
          </ul>
        </div>

        {/* Column 4: Social Circle & Play Store */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Social Icons */}
          <div>
            <h4 className="footer-title" style={{ marginBottom: 12 }}>Our Social Circle</h4>
            <ul className="social-wrapper">
              <li className="icon facebook">
                <span className="tooltip">Facebook</span>
                <svg
                  viewBox="0 0 320 512"
                  height="1.2em"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"
                  ></path>
                </svg>
              </li>
              <li className="icon twitter">
                <span className="tooltip">Twitter</span>
                <svg
                  height="1.8em"
                  fill="currentColor"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                  className="twitter"
                >
                  <path
                    d="M42,12.429c-1.323,0.586-2.746,0.977-4.247,1.162c1.526-0.906,2.7-2.351,3.251-4.058c-1.428,0.837-3.01,1.452-4.693,1.776C34.967,9.884,33.05,9,30.926,9c-4.08,0-7.387,3.278-7.387,7.32c0,0.572,0.067,1.129,0.193,1.67c-6.138-0.308-11.582-3.226-15.224-7.654c-0.64,1.082-1,2.349-1,3.686c0,2.541,1.301,4.778,3.285,6.096c-1.211-0.037-2.351-0.374-3.349-0.914c0,0.022,0,0.055,0,0.086c0,3.551,2.547,6.508,5.923,7.181c-0.617,0.169-1.269,0.263-1.941,0.263c-0.477,0-0.942-0.054-1.392-0.135c0.94,2.902,3.667,5.023,6.898,5.086c-2.528,1.96-5.712,3.134-9.174,3.134c-0.598,0-1.183-0.034-1.761-0.104C9.268,36.786,13.152,38,17.321,38c13.585,0,21.017-11.156,21.017-20.834c0-0.317-0.01-0.633-0.025-0.945C39.763,15.197,41.013,13.905,42,12.429"
                  ></path>
                </svg>
              </li>
              <li className="icon instagram">
                <span className="tooltip">Instagram</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="1.2em"
                  fill="currentColor"
                  className="bi bi-instagram"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"
                  ></path>
                </svg>
              </li>
            </ul>
          </div>

          {/* Play Store button */}
          <div>
            <h4 className="footer-title" style={{ marginBottom: 12 }}>We Are In Play Store</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <a 
                className="playstore-button" 
                href="https://play.google.com/store/apps/details?id=io.vanigan.ai&pcampaignid=web_share"
                target="_blank"
                rel="noreferrer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="icon" viewBox="0 0 512 512">
                  <path d="M99.617 8.057a50.191 50.191 0 00-38.815-6.713l230.932 230.933 74.846-74.846L99.617 8.057zM32.139 20.116c-6.441 8.563-10.148 19.077-10.148 30.199v411.358c0 11.123 3.708 21.636 10.148 30.199l235.877-235.877L32.139 20.116zM464.261 212.087l-67.266-37.637-81.544 81.544 81.548 81.548 67.273-37.64c16.117-9.03 25.738-25.442 25.738-43.908s-9.621-34.877-25.749-43.907zM291.733 279.711L60.815 510.629c3.786.891 7.639 1.371 11.492 1.371a50.275 50.275 0 0027.31-8.07l266.965-149.372-74.849-74.847z"></path>
                </svg>
                <span className="texts">
                  <span className="text-1">GET IT ON</span>
                  <span className="text-2">Google Play</span>
                </span>
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
        .social-wrapper {
          display: inline-flex;
          list-style: none;
          height: auto;
          width: 100%;
          padding: 0;
          margin: 0;
          font-family: 'Poppins', sans-serif;
          justify-content: flex-start;
        }

        .social-wrapper .icon {
          position: relative;
          background: #fff;
          border-radius: 50%;
          margin-right: 10px;
          margin-top: 5px;
          margin-bottom: 5px;
          width: 38px;
          height: 38px;
          font-size: 14px;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .social-wrapper .tooltip {
          position: absolute;
          top: 0;
          font-size: 12px;
          background: #fff;
          color: #fff;
          padding: 4px 8px;
          border-radius: 5px;
          box-shadow: 0 10px 10px rgba(0, 0, 0, 0.1);
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          white-space: nowrap;
        }

        .social-wrapper .tooltip::before {
          position: absolute;
          content: "";
          height: 6px;
          width: 6px;
          background: #fff;
          bottom: -3px;
          left: 50%;
          transform: translate(-50%) rotate(45deg);
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .social-wrapper .icon:hover .tooltip {
          top: -38px;
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        .social-wrapper .icon:hover span,
        .social-wrapper .icon:hover .tooltip {
          text-shadow: 0px -1px 0px rgba(0, 0, 0, 0.1);
        }

        .social-wrapper .facebook:hover,
        .social-wrapper .facebook:hover .tooltip,
        .social-wrapper .facebook:hover .tooltip::before {
          background: #1877f2;
          color: #fff;
        }

        .social-wrapper .twitter:hover,
        .social-wrapper .twitter:hover .tooltip,
        .social-wrapper .twitter:hover .tooltip::before {
          background: #1da1f2;
          color: #fff;
        }

        .social-wrapper .instagram:hover,
        .social-wrapper .instagram:hover .tooltip,
        .social-wrapper .instagram:hover .tooltip::before {
          background: #e4405f;
          color: #fff;
        }

        .playstore-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #000;
          border-radius: 9999px;
          background-color: rgba(0, 0, 0, 1);
          padding: 0.625rem 1.5rem;
          text-align: center;
          color: rgba(255, 255, 255, 1);
          outline: 0;
          transition: all  .2s ease;
          text-decoration: none;
          font-family: 'Poppins', sans-serif;
        }

        .playstore-button:hover {
          background-color: transparent;
          color: rgba(0, 0, 0, 1);
        }

        .playstore-button .icon {
          height: 1.5rem;
          width: 1.5rem;
        }

        .playstore-button .texts {
          margin-left: 1rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1;
        }

        .playstore-button .text-1 {
          margin-bottom: 0.25rem;
          font-size: 0.75rem;
          line-height: 1rem;
          color: rgba(255, 255, 255, 0.7);
          transition: color .2s ease;
        }

        .playstore-button:hover .text-1 {
          color: rgba(0, 0, 0, 0.7);
        }

        .playstore-button .text-2 {
          font-weight: 600;
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
