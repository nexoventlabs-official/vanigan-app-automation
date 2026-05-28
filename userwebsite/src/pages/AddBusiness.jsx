import { useState } from 'react';
import { Phone, ArrowRight, CheckCircle2, Store } from 'lucide-react';
import { REGISTER_URL } from '../api.js';
import { useNav } from '../App.jsx';

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
