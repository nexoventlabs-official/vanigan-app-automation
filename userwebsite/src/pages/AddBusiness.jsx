import { useState } from 'react';
import { Phone, ArrowRight, CheckCircle2, Store } from 'lucide-react';
import { REGISTER_URL } from '../api.js';
import { useNav } from '../App.jsx';

/* Proper WhatsApp brand SVG icon */
function WhatsAppIcon({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function AddBusiness() {
  const { navigate } = useNav();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setError('');
    const url = REGISTER_URL(digits);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="container section" style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => navigate('home')}
          style={{ background:'none',border:'none',color:'var(--color-cool-gray)',cursor:'pointer',fontSize:'14px',fontFamily:'var(--font-pp-neue-montreal)',display:'flex',alignItems:'center',gap:4,fontWeight:500 }}>
          ← Back to Home
        </button>
      </div>

      {/* Icon */}
      <div style={{ textAlign: 'left', marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-deep-fern-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Store size={24} style={{ color: 'var(--color-canvas-white)' }} />
        </div>
        <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-rich-black)', marginBottom: 8 }}>
          Add Your Business
        </h1>
        <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', color: 'var(--color-cool-gray)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
          List your business on Vanigan for free. Get discovered by customers in your area and across Tamil Nadu.
        </p>
      </div>

      {/* Benefits Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px 20px',
        marginBottom: 32,
        padding: '24px',
        background: 'var(--color-melon-tint)',
        border: '1px solid rgba(113, 80, 57, 0.15)',
        borderRadius: '12px',
        fontFamily: 'var(--font-pp-neue-montreal)'
      }}>
        {[
          'Free business listing',
          'Reach customers via WhatsApp',
          'Add photos & services',
          'Get customer reviews',
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-terra-cotta)', fontSize: '13px', fontWeight: 600 }}>
            <span style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'var(--color-canvas-white)',
              border: '1px solid rgba(113, 80, 57, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-terra-cotta)',
              fontSize: '10px',
              fontWeight: 700,
              flexShrink: 0
            }}>✓</span>
            {item}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="card" style={{ padding: 28, background: 'var(--color-canvas-white)', borderRadius: '12px', border: '1px solid var(--color-subtle-ash)', marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-cool-gray)', marginBottom: 4 }}>
          Register Your Number
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--color-cool-gray)', marginBottom: 20, fontFamily: 'var(--font-pp-neue-montreal)', lineHeight: 1.4 }}>
          This will be your primary contact number for your business listing.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 20 }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontFamily: 'var(--font-pp-neue-montreal)', color: 'var(--color-cool-gray)', marginBottom: 6 }}>
              <Phone size={12} /> WhatsApp / Mobile Number
            </label>
            <input
              className="input"
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError(''); }}
              placeholder="Enter 10-digit mobile number"
              maxLength={15}
              inputMode="numeric"
              style={{ height: 44, borderRadius: '12px', background: 'var(--color-canvas-white)', border: '1px solid var(--color-subtle-ash)', fontSize: '14px', fontFamily: 'var(--font-pp-neue-montreal)', color: 'var(--color-rich-black)' }}
            />
            {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: 6, fontFamily: 'var(--font-pp-neue-montreal)' }}>{error}</p>}
          </div>
          <button type="submit" className="btn btn-primary btn-full" style={{ height: 44, borderRadius: '12px', fontSize: '14px', fontWeight: 600 }}>
            Continue to Registration <ArrowRight size={14} style={{ marginLeft: 4 }} />
          </button>
        </form>
        <p style={{ fontSize: '11px', color: 'var(--color-cool-gray)', marginTop: 14, textAlign: 'center', fontFamily: 'var(--font-pp-neue-montreal)', lineHeight: 1.4, margin: '14px 0 0' }}>
          * The registration form will open in a new tab. After submitting, come back here to view your listing.
        </p>
      </div>

      {/* WhatsApp alternative */}
      <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--color-subtle-ash)' }} />
        <span style={{ color: 'var(--color-cool-gray)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap', fontFamily: 'var(--font-pp-neue-montreal)' }}>OR REGISTER VIA CHAT</span>
        <div style={{ flex: 1, height: 1, background: 'var(--color-subtle-ash)' }} />
      </div>

      <a
        href="https://wa.me/919791659816?text=Hi%2C%20I%20want%20to%20add%20my%20business%20to%20Vanigan"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '12px 20px',
          background: 'transparent', color: 'var(--color-deep-fern-green)',
          border: '1px solid var(--color-deep-fern-green)', borderRadius: '12px', cursor: 'pointer',
          fontSize: '13px', fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 600, textDecoration: 'none',
          transition: 'all .15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-mint-green-glow)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <WhatsAppIcon size={16} style={{ color: 'var(--color-deep-fern-green)' }} />
        Register Business via WhatsApp Chat
      </a>
      <p style={{ fontSize: '12px', color: 'var(--color-cool-gray)', textAlign: 'center', marginTop: 8, fontFamily: 'var(--font-pp-neue-montreal)' }}>
        Chat with our support team on WhatsApp to list your business directly.
      </p>

      {/* Already registered link */}
      <div style={{ textAlign: 'center', marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--color-subtle-ash)' }}>
        <p style={{ color: 'var(--color-rich-black)', fontSize: '14px', marginBottom: 12, fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 500 }}>Already registered your business?</p>
        <button onClick={() => navigate('my')} className="btn btn-outline btn-sm" style={{ paddingInline: 24, borderRadius: '12px' }}>
          Access Merchant Dashboard
        </button>
      </div>
    </div>
  );
}
