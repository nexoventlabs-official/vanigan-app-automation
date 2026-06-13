import { useState, useRef } from 'react';

import { memberLogin as apiMemberLogin, memberCheckPhone, webLogin, webCheckPhone } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNav } from '../App.jsx';

/* ── 4-digit PIN boxes ── */
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
        <input key={i} ref={refs[i]} type="password" inputMode="numeric" maxLength={1}
          value={digits[i] === ' ' ? '' : (digits[i] || '')}
          onChange={e => handleChange(i, e)} onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste}
          disabled={disabled}
          style={{ width:52,height:60,border:'2px solid var(--color-subtle-ash)',borderRadius:12,
            background:'var(--color-canvas-white)',fontSize:'1.5rem',fontWeight:700,textAlign:'center',
            color:'var(--color-rich-black)',outline:'none',transition:'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--color-deep-fern-green)';
            e.target.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.12)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--color-subtle-ash)';
            e.target.style.boxShadow = 'none';
          }} />
      ))}
    </div>
  );
}

export default function Login() {
  const { memberLogin, login } = useAuth();
  const { navigate, goBack } = useNav();

  const [step, setStep]     = useState('phone'); // 'phone' | 'pin'
  const [phone, setPhone]   = useState('');
  const [pin, setPin]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  // Which account type the phone belongs to
  const [accountType, setAccountType] = useState(null); // 'member' | 'legacy' | null

  const inputStyle = {
    width:'100%',padding:'11px 14px',border:'1px solid var(--color-subtle-ash)',borderRadius:12,
    fontSize:'14px',fontFamily:'var(--font-pp-neue-montreal)',color:'var(--color-rich-black)',
    background:'var(--color-canvas-white)',outline:'none',boxSizing:'border-box',transition:'border-color .15s',
  };
  const labelStyle = {
    display:'block',fontSize:'11px',fontWeight:700,color:'var(--color-cool-gray)',
    textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:5,
    fontFamily:'var(--font-pp-neue-montreal)',
  };

  const handlePhoneStep = async (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Enter a valid 10-digit number.'); return; }
    setError('');
    setLoading(true);
    try {
      // Check member first
      const mCheck = await memberCheckPhone(digits);
      if (mCheck.data.exists) {
        setAccountType('member');
        setStep('pin');
        setLoading(false);
        return;
      }
      // Fall back to legacy web-auth
      const wCheck = await webCheckPhone(digits);
      if (wCheck.data.exists) {
        setAccountType('legacy');
        setStep('pin');
        setLoading(false);
        return;
      }
      setError('No account found for this number. Please sign up.');
    } catch {
      setError('Could not check account. Please try again.');
    } finally { setLoading(false); }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    const cleanPin = pin.replace(/\D/g, '');
    if (cleanPin.length < 4) { setError('Enter your 4-digit PIN.'); return; }
    setError(''); setLoading(true);
    try {
      const digits = phone.replace(/\D/g, '');
      if (accountType === 'member') {
        const r = await apiMemberLogin(digits, cleanPin);
        memberLogin(r.data);
        navigate('home');
      } else {
        const r = await webLogin(digits, cleanPin);
        login(r.data);
        navigate('home');
      }
    } catch (err) {
      const code = err?.response?.data?.error;
      const msg  = err?.response?.data?.message;
      if (code === 'no_account') setError(msg || 'No account found. Please sign up.');
      else if (code === 'wrong_pin') setError('Incorrect PIN. Please try again.');
      else setError(msg || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      padding: '24px 20px',
      boxSizing: 'border-box',
    }} className="login-bg-container">
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Back */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <button className="btn-back" onClick={() => step === 'pin' ? setStep('phone') : goBack()}>
            <svg height="16" width="16" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024"><path d="M874.690416 495.52477c0 11.2973-9.168824 20.466124-20.466124 20.466124l-604.773963 0 188.083679 188.083679c7.992021 7.992021 7.992021 20.947078 0 28.939099-4.001127 3.990894-9.240455 5.996574-14.46955 5.996574-5.239328 0-10.478655-1.995447-14.479783-5.996574l-223.00912-223.00912c-3.837398-3.837398-5.996574-9.046027-5.996574-14.46955 0-5.433756 2.159176-10.632151 5.996574-14.46955l223.019353-223.029586c7.992021-7.992021 20.957311-7.992021 28.949332 0 7.992021 8.002254 7.992021 20.957311 0 28.949332l-188.073446 188.073446 604.753497 0C865.521592 475.058646 874.690416 484.217237 874.690416 495.52477z"></path></svg>
            <span>{step === 'pin' ? 'Back' : 'Home'}</span>
          </button>
        </div>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ width:48,height:48,borderRadius:12,background:'var(--color-rich-black)',
            display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:12 }}>
            <i className="fa-solid fa-right-to-bracket" style={{ fontSize: 20, color: 'var(--color-canvas-white)' }} />
          </div>
          <h1 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'28px',fontWeight:700,
            letterSpacing:'-0.02em',color:'var(--color-rich-black)',marginBottom:6 }}>Welcome Back</h1>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',color:'var(--color-cool-gray)',fontSize:'14px',margin:0 }}>
            {step === 'phone' ? 'Enter your registered mobile number.'
              : `Enter your PIN for ${phone.replace(/\D/g,'').slice(0,3)}…${phone.replace(/\D/g,'').slice(-3)}`}
          </p>
        </div>

        {error && (
          <div style={{ background:'#fef2f2',border:'1px solid #fee2e2',borderRadius:12,
            padding:'12px 16px',color:'#ef4444',fontSize:'13px',marginBottom:20,
            fontFamily:'var(--font-pp-neue-montreal)' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} /> {error}
          </div>
        )}

        {step === 'phone' && (
          <div className="premium-card">
            <form onSubmit={handlePhoneStep}>
              <div style={{ marginBottom:20 }}>
                <label className="premium-label"><i className="fa-solid fa-phone" style={{ fontSize: 10 }} />Mobile Number *</label>
                <input className="premium-input" type="tel" inputMode="numeric" maxLength={10}
                  value={phone} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setPhone(val); setError(''); }}
                  placeholder="10-digit mobile number" required />
              </div>
              <button type="submit" disabled={loading || phone.replace(/\D/g, '').length !== 10} className="btn btn-primary btn-full"
                style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600 }}>
                {loading ? 'Checking…' : 'Continue →'}
              </button>
            </form>
            <p style={{ textAlign:'center',marginTop:20,fontFamily:'var(--font-pp-neue-montreal)',
              fontSize:'13px',color:'var(--color-cool-gray)' }}>
              New to Vanigan? <button type="button" onClick={() => navigate('signup')}
                style={{ background:'none',border:'none',color:'var(--color-deep-fern-green)',cursor:'pointer',
                  fontWeight:600,fontSize:'13px',padding:0 }}>Sign Up</button>
            </p>
          </div>
        )}

        {step === 'pin' && (
          <div className="premium-card">
            <div style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',
              color:'var(--color-cool-gray)',marginBottom:24,textAlign:'center',
              display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
              <i className="fa-solid fa-lock" /> Enter your 4-digit security PIN
            </div>
            <form onSubmit={handlePinSubmit}>
              <div style={{ marginBottom:24 }}>
                <PinBoxes value={pin} onChange={setPin} disabled={loading} />
              </div>
              <button type="submit" className="btn btn-primary btn-full"
                disabled={loading || pin.replace(/\D/g,'').length < 4}
                style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600 }}>
                {loading ? 'Logging in…' : 'Login'}
              </button>
            </form>
            <p style={{ textAlign:'center',marginTop:20,fontFamily:'var(--font-pp-neue-montreal)',
              fontSize:'13px',color:'var(--color-cool-gray)' }}>
              Don't have an account? <button type="button" onClick={() => navigate('signup')}
                style={{ background:'none',border:'none',color:'var(--color-deep-fern-green)',cursor:'pointer',
                  fontWeight:600,fontSize:'13px',padding:0 }}>Sign Up</button>
            </p>
          </div>
        )}
      </div>

      <style>{`
        .login-bg-container {
          background-image: url('/hero-bg.svg');
        }
        @media (max-width: 768px) {
          .login-bg-container {
            background-image: url('/hero-bg-mobile.svg') !important;
          }
        }
        .premium-card {
          padding: 32px;
          background: var(--color-canvas-white);
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .premium-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid var(--color-subtle-ash);
          border-radius: 12px;
          font-size: 14px;
          font-family: var(--font-pp-neue-montreal);
          color: var(--color-rich-black);
          background: var(--color-canvas-white);
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .premium-input:hover {
          border-color: #cbd5e1;
        }

        .premium-input:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
        }

        .premium-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-cool-gray);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
          font-family: var(--font-pp-neue-montreal);
        }

        .btn-primary {
          background: #22c55e !important;
          border-color: #22c55e !important;
          color: #fff !important;
        }

        .btn-primary:hover {
          background: #16a34a !important;
          border-color: #16a34a !important;
        }

        .btn-primary:disabled {
          background: #22c55e !important;
          border-color: #22c55e !important;
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }
      `}</style>
    </div>
  );
}
