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
    <div className="container section" style={{ maxWidth: 520 }}>
      <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '.85rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Back
      </button>

      {/* Icon */}
      <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--bg2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Store size={28} style={{ color: 'var(--text)' }} />
      </div>

      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Add Your Business</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32, lineHeight: 1.6 }}>
        List your business on Vanigan for free. Get discovered by customers in your area and across Tamil Nadu.
      </p>

      {/* Benefits */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {[
          'Free business listing',
          'Reach customers via WhatsApp',
          'Add photos, services & contact details',
          'Get customer reviews',
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: '.88rem' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
            {item}
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 16 }}>Enter Your WhatsApp Number</div>
        <p style={{ fontSize: '.83rem', color: 'var(--muted)', marginBottom: 16 }}>
          This will be your primary contact number for your business listing.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label className="label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />WhatsApp / Mobile Number</label>
            <input
              className="input"
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError(''); }}
              placeholder="Enter 10-digit mobile number"
              maxLength={15}
              inputMode="numeric"
            />
            {error && <p style={{ color: '#f87171', fontSize: '.78rem', marginTop: 4 }}>{error}</p>}
          </div>
          <button type="submit" className="btn btn-primary btn-full">
            Continue to Registration <ArrowRight size={16} />
          </button>
        </form>
        <p style={{ fontSize: '.75rem', color: 'var(--muted2)', marginTop: 14, textAlign: 'center' }}>
          The registration form will open in a new tab. After submitting, come back here.
        </p>
      </div>

      {/* WhatsApp alternative */}
      <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ color: 'var(--muted2)', fontSize: '.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>OR</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <a
        href="https://wa.me/919791659816?text=Hi%2C%20I%20want%20to%20add%20my%20business%20to%20Vanigan"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          width: '100%', padding: '12px 20px',
          background: '#25D366', color: '#fff',
          border: 'none', borderRadius: 10, cursor: 'pointer',
          fontSize: '.9rem', fontWeight: 700, textDecoration: 'none',
          boxShadow: '0 2px 12px rgba(37,211,102,0.25)',
          transition: 'all .15s ease-in-out',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1ebe5d'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#25D366'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <WhatsAppIcon size={20} />
        Add Business via WhatsApp
      </a>
      <p style={{ fontSize: '.74rem', color: 'var(--muted2)', textAlign: 'center', marginTop: 8 }}>
        Chat with us on WhatsApp to register your business
      </p>

      {/* Already registered link */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginBottom: 8 }}>Already registered your business?</p>
        <button onClick={() => navigate('my')} className="btn btn-outline btn-sm">
          View My Business
        </button>
      </div>
    </div>
  );
}
