import { useState, useRef } from 'react';
import { Phone, ArrowRight, CheckCircle2, Store, Lock } from 'lucide-react';
import { REGISTER_URL, webLinkBusiness, verifyOwnerPin, updateOwnerBusiness } from '../api.js';
import { useNav } from '../App.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/* Proper WhatsApp brand SVG icon */
function WhatsAppIcon({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function PinBoxes({ value, onChange, disabled }) {
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const digits = (value || '    ').split('').slice(0, 4);

  const handleChange = (idx, e) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = [...digits]; arr[idx] = ch;
    onChange(arr.join('').trimEnd());
    if (ch && idx < 3) refs[idx + 1].current?.focus();
  };
  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs[idx - 1].current?.focus();
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    onChange(text);
    refs[Math.min(text.length, 3)].current?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {[0, 1, 2, 3].map(i => (
        <input
          key={i} ref={refs[i]} type="password" inputMode="numeric" maxLength={1}
          value={digits[i] === ' ' ? '' : (digits[i] || '')}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            width: 52, height: 60, border: '2px solid var(--color-subtle-ash)',
            borderRadius: 12, background: 'var(--color-subtle-ash)',
            fontSize: '1.5rem', fontWeight: 700, textAlign: 'center',
            color: 'var(--color-rich-black)', outline: 'none', transition: 'border-color .15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--color-deep-fern-green)')}
          onBlur={e => (e.target.style.borderColor = 'var(--color-subtle-ash)')}
        />
      ))}
    </div>
  );
}

export default function AddBusiness() {
  const { navigate } = useNav();
  const { isLoggedIn, user, updateBusiness } = useAuth();

  // For non-logged-in users
  const [phone, setPhone]   = useState('');
  const [error, setError]   = useState('');
  const [regSent, setRegSent] = useState(false);

  // For logged-in users — PIN confirmation after form redirect
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [pin, setPin]       = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  const userPhone = isLoggedIn ? user.phone : '';

  /* Build pre-fill options from logged-in user's profile */
  const prefillOpts = isLoggedIn ? {
    bizName:     user.bizName     || '',
    category:    user.bizCategory || '',
    subCategory: user.bizSubCat   || '',
    district:    user.district    || '',
    assembly:    user.assembly    || '',
  } : {};

  /* Non-logged-in: open registration form in new tab */
  const handleSubmit = (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setError('');
    window.open(REGISTER_URL(digits), '_blank', 'noopener,noreferrer');
    setRegSent(true);
  };

  /* Logged-in: open registration form pre-filled with user's phone + profile data */
  const handleLoggedInRegister = () => {
    window.open(REGISTER_URL(userPhone, prefillOpts), '_blank', 'noopener,noreferrer');
    setShowPinConfirm(true);
  };

  /* Logged-in: after registration, verify PIN and link business */
  const handlePinConfirm = async (e) => {
    e.preventDefault();
    const cleanPin = pin.replace(/\D/g, '');
    if (cleanPin.length < 4) { setPinError('Enter your 4-digit PIN.'); return; }
    setPinError(''); setPinLoading(true);
    try {
      // Verify PIN returns the business if correct
      const r = await verifyOwnerPin(userPhone, cleanPin);
      const biz = r.data;
      // Link business to user account
      if (biz?._id) {
        await webLinkBusiness(userPhone, biz._id).catch(() => {});
        updateBusiness(biz);
      }
      setPinSuccess(true);
      setTimeout(() => navigate('my'), 1500);
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === 'wrong_pin') setPinError('Incorrect PIN. Please try again.');
      else if (code === 'no_business') setPinError('No business found. Please complete the registration form first.');
      else if (code === 'no_pin_set') setPinError('Please complete the registration form and set your PIN.');
      else setPinError('Could not verify. Please try again.');
    } finally { setPinLoading(false); }
  };

  /* ── Logged-in user UI ── */
  if (isLoggedIn) {
    if (pinSuccess) {
      return (
        <div className="container section" style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '24px', fontWeight: 700, color: 'var(--color-rich-black)', marginBottom: 8 }}>Business Linked!</h2>
          <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', color: 'var(--color-cool-gray)', fontSize: '14px' }}>Redirecting to your dashboard…</p>
        </div>
      );
    }

    if (showPinConfirm) {
      return (
        <div className="container section" style={{ maxWidth: 480 }}>
          <button onClick={() => setShowPinConfirm(false)}
            style={{ background: 'none', border: 'none', color: 'var(--color-cool-gray)', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-pp-neue-montreal)', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Back
          </button>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--color-rich-black)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Lock size={24} style={{ color: 'var(--color-canvas-white)' }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-rich-black)', marginBottom: 8 }}>Confirm with PIN</h1>
            <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', color: 'var(--color-cool-gray)', fontSize: '14px', lineHeight: 1.5 }}>
              After completing the registration form, enter your PIN to link the business to your account.
            </p>
          </div>
          <div className="card" style={{ padding: 28, background: 'var(--color-canvas-white)', borderRadius: 12, border: '1px solid var(--color-subtle-ash)' }}>
            <form onSubmit={handlePinConfirm}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '12px', fontWeight: 700, color: 'var(--color-cool-gray)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, textAlign: 'center' }}>
                  Enter Your Account PIN
                </label>
                <PinBoxes value={pin} onChange={setPin} disabled={pinLoading} />
                {pinError && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: 12, textAlign: 'center', fontFamily: 'var(--font-pp-neue-montreal)' }}>{pinError}</p>}
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={pinLoading || pin.replace(/\D/g,'').length < 4}
                style={{ height: 44, borderRadius: 12, fontSize: '14px', fontWeight: 600 }}>
                {pinLoading ? 'Verifying…' : 'Verify & Link Business'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 16, fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '12px', color: 'var(--color-cool-gray)', lineHeight: 1.5 }}>
              Haven't filled the registration form yet?{' '}
              <button type="button" onClick={handleLoggedInRegister}
                style={{ background: 'none', border: 'none', color: 'var(--color-deep-fern-green)', cursor: 'pointer', fontWeight: 600, fontSize: '12px', padding: 0 }}>
                Open form again
              </button>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="container section" style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button onClick={() => navigate('home')}
            style={{ background: 'none', border: 'none', color: 'var(--color-cool-gray)', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-pp-neue-montreal)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
            ← Back to Home
          </button>
        </div>

        <div style={{ textAlign: 'left', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-deep-fern-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Store size={24} style={{ color: 'var(--color-canvas-white)' }} />
          </div>
          <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-rich-black)', marginBottom: 8 }}>
            Add Your Business
          </h1>
          <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', color: 'var(--color-cool-gray)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
            Hi <strong style={{ color: 'var(--color-rich-black)' }}>{user?.name}</strong>! Your WhatsApp number <strong style={{ color: 'var(--color-rich-black)' }}>{userPhone}</strong> is pre-filled. Complete the form and then enter your PIN here to link it to your account.
          </p>
        </div>

        {/* Pre-fill info */}
        <div style={{ background: 'var(--color-mint-green-glow)', border: '1px solid var(--color-muted-sage)', borderRadius: 12, padding: '14px 16px', marginBottom: 24, fontFamily: 'var(--font-pp-neue-montreal)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-deep-fern-green)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Pre-filled Info</div>
          <div style={{ fontSize: '13px', color: 'var(--color-rich-black)', marginBottom: 2 }}>📱 WhatsApp: <strong>{userPhone}</strong></div>
          {user?.name && <div style={{ fontSize: '13px', color: 'var(--color-rich-black)', marginBottom: 2 }}>👤 Name: <strong>{user.name}</strong></div>}
          {user?.district && <div style={{ fontSize: '13px', color: 'var(--color-rich-black)', marginBottom: 2 }}>📍 Location: <strong>{user.district}{user.assembly ? `, ${user.assembly}` : ''}</strong></div>}
          {user?.bizCategory && <div style={{ fontSize: '13px', color: 'var(--color-rich-black)', marginBottom: 2 }}>🏷️ Category: <strong>{user.bizCategory}{user.bizSubCat ? ` → ${user.bizSubCat}` : ''}</strong></div>}
        </div>

        {/* Benefits */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 28, padding: '20px', background: 'var(--color-melon-tint)', border: '1px solid rgba(113,80,57,0.15)', borderRadius: 12 }}>
          {['Free business listing', 'Reach customers via WhatsApp', 'Add photos & services', 'Get customer reviews'].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-terra-cotta)', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-pp-neue-montreal)' }}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--color-canvas-white)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--color-terra-cotta)', flexShrink: 0 }}>✓</span>
              {item}
            </div>
          ))}
        </div>

        <button onClick={handleLoggedInRegister} className="btn btn-primary btn-full"
          style={{ height: 44, borderRadius: 12, fontSize: '14px', fontWeight: 600, marginBottom: 12 }}>
          Open Registration Form <ArrowRight size={14} style={{ marginLeft: 4 }} />
        </button>
        <p style={{ fontSize: '12px', color: 'var(--color-cool-gray)', textAlign: 'center', fontFamily: 'var(--font-pp-neue-montreal)', lineHeight: 1.4 }}>
          The form opens in a new tab. After submitting, come back here and enter your PIN.
        </p>
      </div>
    );
  }

  /* ── Non-logged-in user UI ── */
  if (regSent) {
    return (
      <div className="container section" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '22px', fontWeight: 700, color: 'var(--color-rich-black)', marginBottom: 8 }}>Registration Form Opened</h2>
          <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '14px', color: 'var(--color-cool-gray)', lineHeight: 1.6 }}>
            Complete the form in the new tab. Once done, <strong>sign up</strong> to access your business dashboard.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => navigate('signup')} className="btn btn-primary btn-full" style={{ height: 44, borderRadius: 12 }}>Create Account to Manage Business</button>
          <button onClick={() => navigate('my')} className="btn btn-outline btn-full" style={{ height: 44, borderRadius: 12 }}>Access My Business</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section" style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => navigate('home')}
          style={{ background:'none',border:'none',color:'var(--color-cool-gray)',cursor:'pointer',fontSize:'14px',fontFamily:'var(--font-pp-neue-montreal)',display:'flex',alignItems:'center',gap:4,fontWeight:500 }}>
          ← Back to Home
        </button>
      </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 32, padding: '24px', background: 'var(--color-melon-tint)', border: '1px solid rgba(113, 80, 57, 0.15)', borderRadius: '12px', fontFamily: 'var(--font-pp-neue-montreal)' }}>
        {['Free business listing', 'Reach customers via WhatsApp', 'Add photos & services', 'Get customer reviews'].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-terra-cotta)', fontSize: '13px', fontWeight: 600 }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--color-canvas-white)', border: '1px solid rgba(113, 80, 57, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-terra-cotta)', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>✓</span>
            {item}
          </div>
        ))}
      </div>

      {/* Sign up nudge for non-logged-in */}
      <div style={{ background: 'var(--color-subtle-ash)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontFamily: 'var(--font-pp-neue-montreal)' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-rich-black)', marginBottom: 2 }}>Better experience with an account</div>
          <div style={{ fontSize: '12px', color: 'var(--color-cool-gray)' }}>Sign up to auto-fill your details and manage your listing easily.</div>
        </div>
        <button onClick={() => navigate('signup')} className="btn btn-outline btn-sm" style={{ borderRadius: 10, whiteSpace: 'nowrap' }}>Sign Up Free</button>
      </div>

      <div className="card" style={{ padding: 28, background: 'var(--color-canvas-white)', borderRadius: '12px', border: '1px solid var(--color-subtle-ash)', marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-cool-gray)', marginBottom: 4 }}>
          Register Your Number
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--color-cool-gray)', marginBottom: 20, fontFamily: 'var(--font-pp-neue-montreal)', lineHeight: 1.4 }}>
          Enter your WhatsApp number. We'll open the business registration form with it pre-filled.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 20 }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontFamily: 'var(--font-pp-neue-montreal)', color: 'var(--color-cool-gray)', marginBottom: 6 }}>
              <Phone size={12} /> WhatsApp / Mobile Number
            </label>
            <input
              className="input" type="tel" value={phone}
              onChange={e => { setPhone(e.target.value); setError(''); }}
              placeholder="Enter 10-digit mobile number" maxLength={15} inputMode="numeric"
              style={{ height: 44, borderRadius: '12px', background: 'var(--color-canvas-white)', border: '1px solid var(--color-subtle-ash)', fontSize: '14px', fontFamily: 'var(--font-pp-neue-montreal)', color: 'var(--color-rich-black)' }}
            />
            {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: 6, fontFamily: 'var(--font-pp-neue-montreal)' }}>{error}</p>}
          </div>
          <button type="submit" className="btn btn-primary btn-full" style={{ height: 44, borderRadius: '12px', fontSize: '14px', fontWeight: 600 }}>
            Continue to Registration <ArrowRight size={14} style={{ marginLeft: 4 }} />
          </button>
        </form>
        <p style={{ fontSize: '11px', color: 'var(--color-cool-gray)', marginTop: 14, textAlign: 'center', fontFamily: 'var(--font-pp-neue-montreal)', lineHeight: 1.4 }}>
          * The registration form opens in a new tab.
        </p>
      </div>

      <div style={{ margin: '8px 0 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--color-subtle-ash)' }} />
        <span style={{ color: 'var(--color-cool-gray)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap', fontFamily: 'var(--font-pp-neue-montreal)' }}>OR REGISTER VIA CHAT</span>
        <div style={{ flex: 1, height: 1, background: 'var(--color-subtle-ash)' }} />
      </div>

      <a
        href="https://wa.me/919791659816?text=Hi%2C%20I%20want%20to%20add%20my%20business%20to%20Vanigan"
        target="_blank" rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 20px', background: 'transparent', color: 'var(--color-deep-fern-green)', border: '1px solid var(--color-deep-fern-green)', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 600, textDecoration: 'none', transition: 'all .15s ease' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-mint-green-glow)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <WhatsAppIcon size={16} style={{ color: 'var(--color-deep-fern-green)' }} />
        Register Business via WhatsApp Chat
      </a>

      <div style={{ textAlign: 'center', marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--color-subtle-ash)' }}>
        <p style={{ color: 'var(--color-rich-black)', fontSize: '14px', marginBottom: 12, fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 500 }}>Already registered your business?</p>
        <button onClick={() => navigate('my')} className="btn btn-outline btn-sm" style={{ paddingInline: 24, borderRadius: '12px' }}>
          Access Merchant Dashboard
        </button>
      </div>
    </div>
  );
}
