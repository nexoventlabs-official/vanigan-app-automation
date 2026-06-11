import { useState, useRef } from 'react';
import { LogIn, Phone } from 'lucide-react';
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
            background:'var(--color-subtle-ash)',fontSize:'1.5rem',fontWeight:700,textAlign:'center',
            color:'var(--color-rich-black)',outline:'none',transition:'border-color .15s' }}
          onFocus={e => (e.target.style.borderColor = 'var(--color-deep-fern-green)')}
          onBlur={e => (e.target.style.borderColor = 'var(--color-subtle-ash)')} />
      ))}
    </div>
  );
}

export default function Login() {
  const { memberLogin, login } = useAuth();
  const { navigate } = useNav();

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
    <div className="container section" style={{ maxWidth: 440 }}>
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => step === 'pin' ? setStep('phone') : navigate('home')}
          style={{ background:'none',border:'none',color:'var(--color-cool-gray)',cursor:'pointer',
            fontSize:'14px',fontFamily:'var(--font-pp-neue-montreal)',display:'flex',alignItems:'center',gap:4 }}>
          ← {step === 'pin' ? 'Back' : 'Home'}
        </button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ width:56,height:56,borderRadius:12,background:'var(--color-rich-black)',
          display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:16 }}>
          <LogIn size={24} style={{ color:'var(--color-canvas-white)' }} />
        </div>
        <h1 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'30px',fontWeight:700,
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
          ⚠ {error}
        </div>
      )}

      {step === 'phone' && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',
          borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <form onSubmit={handlePhoneStep}>
            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}><Phone size={11} style={{ marginRight:4 }} />Mobile Number *</label>
              <input style={inputStyle} type="tel" inputMode="numeric" maxLength={15}
                value={phone} onChange={e => { setPhone(e.target.value); setError(''); }}
                placeholder="10-digit mobile number" required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-full"
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
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',
          borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <div style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',
            color:'var(--color-cool-gray)',marginBottom:24,textAlign:'center' }}>
            🔐 Enter your 4-digit security PIN
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
  );
}
