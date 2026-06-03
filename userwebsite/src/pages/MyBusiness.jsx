import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, RefreshCw, Store, LogOut, ExternalLink,
  Globe, MapPin, Mail, Clock, Tag, Map, Star, Edit3, X, Plus,
  ChevronDown, ChevronUp, Save, Camera,
} from 'lucide-react';


/* Proper WhatsApp brand SVG icon */
function WhatsAppIcon({ size = 14, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
import {
  checkOwnerPhone, verifyOwnerPin, updateOwnerBusiness,
  getBusiness, REGISTER_URL, setStoredPhone,
} from '../api.js';
import { useNav } from '../App.jsx';

const LS_KEY       = 'vanigan_my_business';
const LS_PHONE_KEY = 'vanigan_owner_phone';

/* ──────────────────────────────────────────────────────────
   PinInput — 4 separate digit boxes
────────────────────────────────────────────────────────── */
function PinInput({ value, onChange, disabled }) {
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const digits = (value || '    ').split('').slice(0, 4);

  const handleChange = (idx, e) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = [...digits];
    arr[idx] = ch;
    onChange(arr.join('').trimEnd());
    if (ch && idx < 3) refs[idx + 1].current?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
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
          key={i} ref={refs[i]}
          type="password" inputMode="numeric" maxLength={1}
          value={digits[i] === ' ' ? '' : (digits[i] || '')}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            width: 52, height: 60, border: '1px solid var(--color-subtle-ash)', borderRadius: 12,
            background: 'var(--color-subtle-ash)', fontSize: '1.6rem', fontWeight: 700, textAlign: 'center',
            color: 'var(--color-rich-black)', outline: 'none', transition: 'border-color .15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--color-deep-fern-green)')}
          onBlur={e => (e.target.style.borderColor = 'var(--color-subtle-ash)')}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Main export — multi-step flow
────────────────────────────────────────────────────────── */
export default function MyBusiness() {
  const { navigate } = useNav();

  /* step: 'phone' | 'pin' | 'view' */
  const [step, setStep]         = useState('phone');
  const [phone, setPhone]       = useState('');
  const [bizName, setBizName]   = useState('');
  const [hasPin, setHasPin]     = useState(false);
  const [pin, setPin]           = useState('');
  const [pinError, setPinError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [biz, setBiz]           = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; }
  });
  const [editing, setEditing]   = useState(false);

  /* On mount — if cached biz, go straight to PIN step */
  useEffect(() => {
    const cachedPhone = localStorage.getItem(LS_PHONE_KEY);
    const cachedBiz   = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; } })();
    if (cachedBiz?._id && cachedPhone) {
      setPhone(cachedPhone);
      setBizName(cachedBiz.name || '');
      setHasPin(true);
      setStep('pin');
    }
  }, []);

  /* Find business by phone */
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setPhoneError('Enter a valid 10-digit number'); return; }
    setPhoneError(''); setLoading(true);
    try {
      const r = await checkOwnerPhone(digits);
      const { found, hasPin: hp, name } = r.data;
      if (!found) {
        setPhoneError('No registered business found for this number.');
        setLoading(false); return;
      }
      setBizName(name || '');
      setHasPin(hp);
      localStorage.setItem(LS_PHONE_KEY, digits);
      setStep('pin');
    } catch {
      setPhoneError('Could not connect. Please try again.');
    } finally { setLoading(false); }
  };

  /* Verify PIN */
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (pin.replace(/\D/g, '').length < 4) { setPinError('Enter your 4-digit PIN'); return; }
    setPinError(''); setLoading(true);
    try {
      const digits = phone.replace(/\D/g, '');
      const r = await verifyOwnerPin(digits, pin.replace(/\D/g, ''));
      const data = r.data;
      setBiz(data);
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      setStoredPhone(digits);
      setStep('view');
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === 'wrong_pin') setPinError('Incorrect PIN. Please try again.');
      else if (code === 'no_pin_set') setPinError('No PIN has been set for this business yet. Please complete registration.');
      else setPinError('Could not verify. Please try again.');
    } finally { setLoading(false); }
  };

  const refresh = async () => {
    if (!biz?._id) return;
    setLoading(true);
    try {
      const r = await getBusiness(biz._id);
      setBiz(r.data);
      localStorage.setItem(LS_KEY, JSON.stringify(r.data));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const clear = () => {
    setBiz(null); setStep('phone'); setPhone(''); setPin('');
    setBizName(''); setPinError(''); setPhoneError('');
    localStorage.removeItem(LS_KEY); localStorage.removeItem(LS_PHONE_KEY);
  };

  /* Render steps */
  if (step === 'view' && biz) {
    if (editing) return (
      <EditBusiness
        biz={biz} ownerPhone={phone.replace(/\D/g, '')} pin={pin.replace(/\D/g, '')}
        onSave={(updated) => { setBiz(updated); localStorage.setItem(LS_KEY, JSON.stringify(updated)); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
    return (
      <BusinessView biz={biz} navigate={navigate} onRefresh={refresh}
        onClear={clear} loading={loading} onEdit={() => setEditing(true)} />
    );
  }

  return (
    <div className="container section" style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => navigate('home')}
          style={{ background:'none',border:'none',color:'var(--color-cool-gray)',cursor:'pointer',fontSize:'14px',fontFamily:'var(--font-pp-neue-montreal)',display:'flex',alignItems:'center',gap:4 }}>
          ← Back to Home
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width:56,height:56,borderRadius:'12px',background:'var(--color-rich-black)',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:16 }}>
          <Store size={24} style={{ color:'var(--color-canvas-white)' }} />
        </div>
        <h1 style={{ fontSize:'32px',fontFamily:'var(--font-pp-neue-montreal)',fontWeight:700,letterSpacing:'-0.015em',color:'var(--color-rich-black)',marginBottom:8 }}>My Business</h1>
        <p style={{ fontFamily:'var(--font-pp-neue-montreal)',color:'var(--color-cool-gray)',fontSize:'14px',lineHeight:1.5 }}>
          Merchant Dashboard & Management Portal
        </p>
      </div>

      {/* Step 1: Phone */}
      {step === 'phone' && (
        <>
          <div className="card" style={{ padding:32,background:'var(--color-canvas-white)',borderRadius:'12px',border:'1px solid var(--color-subtle-ash)' }}>
            <div style={{ fontFamily:'var(--font-pp-neue-montreal)',fontWeight:600,color:'var(--color-rich-black)',fontSize:'16px',marginBottom:4 }}>Find Your Listing</div>
            <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',color:'var(--color-cool-gray)',marginBottom:24 }}>Enter your registered WhatsApp number to verify ownership.</p>
            <form onSubmit={handlePhoneSubmit}>
              <div className="field" style={{ marginBottom:20 }}>
                <label className="label" style={{ display:'flex',alignItems:'center',gap:4,fontWeight:600,color:'var(--color-cool-gray)',fontFamily:'var(--font-pp-neue-montreal)' }}><Phone size={12} /> Registered Phone Number</label>
                <input className="input" type="tel" value={phone}
                  onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                  placeholder="10-digit mobile number" maxLength={15} inputMode="numeric" style={{ height: 42, borderRadius: 12, background: 'var(--color-canvas-white)', border: '1px solid var(--color-subtle-ash)' }} />
                {phoneError && <p style={{ color:'#ef4444',fontSize:'12px',marginTop:6,fontFamily:'var(--font-pp-neue-montreal)' }}>{phoneError}</p>}
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ borderRadius:'12px',height:42,fontSize:'14px',fontWeight:500 }}>
                {loading ? 'Searching…' : 'Continue'}
              </button>
            </form>
          </div>
          <div style={{ textAlign:'center',marginTop:24,fontFamily:'var(--font-pp-neue-montreal)' }}>
            <p style={{ color:'var(--color-rich-black)',fontSize:'14px',marginBottom:12 }}>Don't have a listing yet?</p>
            <button onClick={() => navigate('add')} className="btn btn-outline btn-sm" style={{ paddingInline:20, borderRadius: '12px' }}>Add Your Business</button>
          </div>
        </>
      )}

      {/* Step 2: PIN */}
      {step === 'pin' && (
        <>
          {!hasPin ? (
            <div className="card" style={{ padding:32,textAlign:'center',background:'var(--color-canvas-white)',borderRadius:'12px',border:'1px solid var(--color-subtle-ash)' }}>
              <div style={{ fontSize:'2.5rem',marginBottom:16 }}>🔐</div>
              <h2 style={{ fontWeight:700,fontFamily:'var(--font-pp-neue-montreal)',letterSpacing:'-0.01em',color:'var(--color-rich-black)',fontSize:'20px',marginBottom:8 }}>No Security PIN Set Yet</h2>
              <p style={{ fontFamily:'var(--font-pp-neue-montreal)',color:'var(--color-cool-gray)',fontSize:'14px',marginBottom:24,lineHeight:1.5 }}>
                You haven't set a security PIN for <strong style={{ color:'var(--color-rich-black)' }}>{bizName}</strong>. Please complete your registration by setting a 4-digit PIN first.
              </p>
              <a href={REGISTER_URL(phone.replace(/\D/g,''))} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-full" style={{ borderRadius:'12px',height:42,display:'inline-flex',alignItems:'center',justifyContent:'center',textDecoration:'none' }}>
                Set PIN via Registration Form
              </a>
              <button onClick={() => { setStep('phone'); setPin(''); setPinError(''); }} style={{ background:'none',border:'none',color:'var(--color-cool-gray)',cursor:'pointer',marginTop:20,fontSize:'13px',fontFamily:'var(--font-pp-neue-montreal)',textDecoration:'underline' }}>
                ← Go back to phone number
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding:32,background:'var(--color-canvas-white)',borderRadius:'12px',border:'1px solid var(--color-subtle-ash)' }}>
              <div style={{ fontFamily:'var(--font-pp-neue-montreal)',fontWeight:600,color:'var(--color-rich-black)',fontSize:'16px',marginBottom:4,textAlign:'center' }}>🔐 Enter Security PIN</div>
              <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',color:'var(--color-cool-gray)',marginBottom:24,textAlign:'center',lineHeight:1.4 }}>
                Enter the 4-digit PIN for <strong style={{ color:'var(--color-rich-black)' }}>{bizName}</strong>.
              </p>
              <form onSubmit={handlePinSubmit}>
                <div style={{ marginBottom:24 }}>
                  <PinInput value={pin} onChange={setPin} disabled={loading} />
                  {pinError && <p style={{ color:'#ef4444',fontSize:'13px',marginTop:12,textAlign:'center',fontFamily:'var(--font-pp-neue-montreal)' }}>{pinError}</p>}
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading || pin.replace(/\D/g,'').length < 4} style={{ borderRadius:'12px',height:42,fontSize:'14px',fontWeight:500 }}>
                  {loading ? 'Verifying…' : 'Access Merchant Dashboard'}
                </button>
              </form>
              <button onClick={() => { setStep('phone'); setPin(''); setPinError(''); }}
                style={{ background:'none',border:'none',color:'var(--color-cool-gray)',cursor:'pointer',marginTop:20,fontSize:'13px',width:'100%',textAlign:'center',fontFamily:'var(--font-pp-neue-montreal)',textDecoration:'underline' }}>
                ← Go back to phone number
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   BusinessView — full listing display with Edit button
────────────────────────────────────────────────────────── */
function BusinessView({ biz, navigate, onRefresh, onClear, loading, onEdit }) {
  const phone    = biz.phone || biz.whatsappNo || '';
  const services = (biz.services || []).filter(s => s.name);
  const gallery  = (biz.galleryImages || []).filter(g => g.url);
  const days     = biz.openDays ? biz.openDays.split(',').map(d => d.trim()) : [];
  const [selectedService, setSelectedService] = useState(null);

  return (
    <div>
      {/* Cover */}
      <div style={{ position:'relative' }}>
        <div className="biz-cover-container">
          {biz.coverImage ? (
            <>
              <div style={{ position:'absolute',inset:0,backgroundImage:`url(${biz.coverImage})`,backgroundSize:'cover',backgroundPosition:'center',filter:'blur(12px) brightness(0.9)',transform:'scale(1.1)',opacity:0.3,zIndex:1 }} />
              <img src={biz.coverImage} alt={biz.name} className="biz-cover-img" />
            </>
          ) : (
            <div className="biz-cover-placeholder"><Store size={48} style={{ color:'var(--color-cool-gray)',opacity:0.6 }} /></div>
          )}
        </div>
        {biz.image && (
          <img src={biz.image} alt={biz.name} style={{ position:'absolute',bottom:-32,left:24,width:76,height:76,borderRadius:12,objectFit:'cover',border:'1px solid var(--color-subtle-ash)',background:'var(--color-canvas-white)',boxShadow:'none',zIndex:2 }} />
        )}
      </div>

      <div className="container" style={{ paddingTop:0 }}>
        {/* Header */}
        <div style={{ display:'flex',gap:16,alignItems:'flex-start',padding:'24px 0 24px',paddingTop:biz.image?48:24,borderBottom:'1px solid var(--color-subtle-ash)',flexWrap:'wrap' }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex',alignItems:'flex-start',gap:10,flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                  <h1 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'32px',fontWeight:700,letterSpacing:'-0.015em',color:'var(--color-rich-black)',lineHeight:1.2, margin: 0 }}>{biz.name}</h1>
                  <span className={`badge ${biz.active ? 'badge-green' : 'badge-gray'}`} style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{biz.active ? 'Active' : 'Pending'}</span>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:4,fontFamily:'var(--font-pp-neue-montreal)' }}>
                  {biz.rating > 0 ? (
                    <div style={{ display:'flex',alignItems:'center',gap:4 }}>
                      <div style={{ display:'flex',gap:1 }}>
                        {[1,2,3,4,5].map(star => (<Star key={star} size={12} fill="var(--color-leafy-green)" stroke="var(--color-leafy-green)" />))}
                      </div>
                      <span style={{ fontSize:'13px',fontWeight:600,color:'var(--color-rich-black)' }}>{biz.rating.toFixed(1)}</span>
                      <span style={{ fontSize:'12px',color:'var(--color-cool-gray)' }}>({biz.reviewCount||0} reviews)</span>
                    </div>
                  ) : (
                    <span style={{ fontSize:'12px',color:'var(--color-cool-gray)' }}>No ratings yet</span>
                  )}
                </div>
                {biz.category && <div style={{ fontFamily:'var(--font-pp-neue-montreal)',color:'var(--color-deep-fern-green)',fontSize:'13px',fontWeight:500,marginTop:6 }}>{biz.category}{biz.subCategory&&` › ${biz.subCategory}`}</div>}
                {biz.listingCode && <div style={{ marginTop:6 }}><span className="badge badge-blue"># {biz.listingCode}</span></div>}
              </div>
            </div>
          </div>
          <div style={{ display:'flex',gap:8,marginLeft:'auto',alignSelf:'center',flexWrap:'wrap',fontFamily:'var(--font-pp-neue-montreal)' }}>
            <button onClick={onEdit} className="btn btn-outline btn-sm" style={{ paddingInline: 16, borderRadius: '12px', borderWidth: 1, borderColor: 'var(--color-rich-black)', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Edit3 size={12} /> Edit Listing</button>
            <button onClick={onRefresh} disabled={loading} className="btn btn-outline btn-sm" style={{ paddingInline: 14, borderRadius: '12px', borderColor: 'var(--color-subtle-ash)', fontSize: '12px', color: 'var(--color-cool-gray)', display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={12} style={{ animation:loading?'spin 1s linear infinite':'none' }} />{loading?'Refreshing…':'Refresh'}</button>
            <button onClick={onClear} className="btn btn-outline btn-sm" style={{ paddingInline: 14, borderRadius: '12px', borderColor: '#fca5a5', background: 'transparent', color: '#dc2626', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}><LogOut size={12} /> Logout</button>
          </div>
        </div>

        {!biz.active && (
          <div style={{ background:'var(--color-melon-tint)',border:'1px solid var(--color-light-peach)',borderRadius:12,padding:'14px 16px',margin:'20px 0',color:'var(--color-terra-cotta)',fontSize:'14px',fontFamily:'var(--font-pp-neue-montreal)',fontWeight:500 }}>
            ⏳ Your business is pending review. Our team will activate it shortly.
          </div>
        )}

        <div style={{ background: 'var(--color-canvas-white)', border: '1px solid var(--color-subtle-ash)', borderRadius: '12px', padding: '16px 20px', margin: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, fontFamily: 'var(--font-pp-neue-montreal)' }}>
          <div>
            <h4 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-cool-gray)', marginBottom: 2 }}>Public Quick Access</h4>
            <p style={{ fontSize: '12px', color: 'var(--color-cool-gray)', margin: 0 }}>View your business listing as customers see it or preview on WhatsApp</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('detail', { id: biz._id })} className="btn btn-primary btn-sm" style={{ paddingInline: 16, borderRadius: '12px' }}><ExternalLink size={13} /> View Public Listing</button>
            {phone && <a href={`https://wa.me/91${phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ color: 'var(--color-rich-black)', paddingInline: 16, borderColor: 'var(--color-subtle-ash)', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}><WhatsAppIcon size={14} style={{ marginRight:4, color: 'var(--color-deep-fern-green)' }} /> WhatsApp Preview</a>}
          </div>
        </div>

        <div className="biz-detail-grid">
          <div>
            {biz.description && <InfoSection title="About"><p style={{ color:'var(--color-slate)',lineHeight:1.7,fontSize:'14px',fontFamily:'var(--font-sf-pro-text)' }}>{biz.description}</p></InfoSection>}
            {services.length > 0 && (
              <InfoSection title={`Services (${services.length})`}>
                <div className="services-grid">
                  {services.map((s,i) => (
                    <div key={i} className="service-card" onClick={() => setSelectedService(s)}>
                      {s.image && <img src={s.image} alt={s.name} className="service-card-img" style={{ objectFit: 'cover', background: 'var(--color-fog)' }} />}
                      <div className="service-card-content">
                        <div className="service-card-title">{s.name}</div>
                        {s.price && <div className="service-card-price">₹ {s.price}</div>}
                        {s.detail && <div className="service-card-detail">{s.detail}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </InfoSection>
            )}
            {gallery.length > 0 && (
              <InfoSection title={`Gallery (${gallery.length})`}>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:12 }}>
                  {gallery.map((g,i) => (<div key={i} style={{ aspectRatio:'1',borderRadius:'var(--radius-cards)',overflow:'hidden',background:'var(--color-snow)',border:'1px solid var(--border)' }}><img src={g.url} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} /></div>))}
                </div>
              </InfoSection>
            )}
            {biz.infoQuestion && (
              <InfoSection title="FAQ">
                <div style={{ background:'var(--color-canvas-white)',border:'1px solid var(--color-subtle-ash)',borderRadius:'12px',padding:20,fontFamily:'var(--font-pp-neue-montreal)' }}>
                  <div style={{ fontWeight:600,marginBottom:6,fontSize:'15px',color:'var(--color-rich-black)' }}><span style={{ color:'var(--color-rich-black)',fontWeight:700 }}>Q.</span> {biz.infoQuestion}</div>
                  {biz.infoAnswer && <div style={{ color:'var(--color-cool-gray)',fontSize:'14px' }}><span style={{ color:'var(--color-deep-fern-green)',fontWeight:700 }}>A.</span> {biz.infoAnswer}</div>}
                </div>
              </InfoSection>
            )}
            <InfoSection title={`Customer Reviews (${(biz.reviews||[]).length})`}>
              {!biz.reviews || biz.reviews.length === 0 ? (
                <div style={{ background: 'var(--color-canvas-white)', border: '1px dashed var(--color-subtle-ash)', borderRadius: '12px', padding: '24px', textAlign: 'center', fontFamily: 'var(--font-pp-neue-montreal)', color: 'var(--color-cool-gray)', fontSize: '13px' }}>
                  No reviews yet. Share your listing link to get ratings!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {biz.reviews.map(rev => (
                    <div key={rev._id} style={{ background: 'var(--color-canvas-white)', border: '1px solid var(--color-subtle-ash)', borderLeft: '4px solid var(--color-deep-fern-green)', borderRadius: 12, padding: 20, fontFamily: 'var(--font-pp-neue-montreal)', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-rich-black)' }}>{rev.reviewerName||'Anonymous'}</div>
                          <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} size={11} fill="var(--color-leafy-green)" stroke="var(--color-leafy-green)" />
                            ))}
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-cool-gray)', fontFamily: 'var(--font-pp-neue-montreal)' }}>
                          {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {rev.text && (
                        <p style={{ fontSize: '14px', color: 'var(--color-cool-gray)', lineHeight: 1.6, fontStyle: 'italic', fontFamily: 'var(--font-pp-neue-montreal)', margin: 0, paddingLeft: 4 }}>
                          “{rev.text}”
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </InfoSection>
          </div>

          <div style={{ display:'flex',flexDirection:'column',gap:24 }}>
            <SideCard title="Contact Info">
              {[phone&&{icon:Phone,label:'Phone',value:phone},biz.whatsappNo&&{icon:WhatsAppIcon,label:'WhatsApp',value:biz.whatsappNo},biz.landline&&{icon:Phone,label:'Landline',value:biz.landline},biz.email&&{icon:Mail,label:'Email',value:biz.email},biz.website&&{icon:Globe,label:'Website',value:biz.website}].filter(Boolean).map((r,i)=><InfoRow key={i} {...r} />)}
            </SideCard>
            <SideCard title="Location">
              {[biz.address&&{icon:MapPin,label:'Address',value:biz.address},biz.city&&{icon:MapPin,label:'City',value:biz.city},biz.pincode&&{icon:MapPin,label:'Pincode',value:biz.pincode},biz.serviceLocations&&{icon:Tag,label:'Service Areas',value:biz.serviceLocations}].filter(Boolean).map((r,i)=><InfoRow key={i} {...r} />)}
            </SideCard>
            {(days.length > 0 || biz.openTime) && (
              <SideCard title="Operating Hours">
                {days.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 16, textAlign: 'center', fontFamily: 'var(--font-pp-neue-montreal)' }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => {
                      const isActive = days.includes(d);
                      return (
                        <div key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: isActive ? 'var(--color-rich-black)' : 'var(--color-cool-gray)', textTransform: 'uppercase', marginBottom: 4 }}>{d[0]}</span>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? 'var(--color-deep-fern-green)' : 'transparent', border: isActive ? 'none' : '1px solid var(--color-subtle-ash)' }} />
                        </div>
                      );
                    })}
                  </div>
                )}
                {(biz.openTime || biz.closeTime) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-subtle-ash)', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--color-subtle-ash)', fontSize: '13px', color: 'var(--color-rich-black)', fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 500 }}>
                    <Clock size={13} style={{ color: 'var(--color-cool-gray)' }} />
                    <span>{biz.openTime || '—'} – {biz.closeTime || '—'}</span>
                  </div>
                )}
              </SideCard>
            )}
          </div>
        </div>

      </div>

      {selectedService && (
        <div className="dialog-overlay" onClick={() => setSelectedService(null)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--color-snow)', borderRadius: 'var(--radius-cards)' }}>
            <button className="dialog-close" onClick={() => setSelectedService(null)}>✕</button>
            <div className="dialog-body">
              {selectedService.image && <div className="dialog-img-wrap" style={{ background: 'var(--color-snow)', borderBottom: '1px solid var(--border)' }}><img src={selectedService.image} alt={selectedService.name} className="dialog-img" /></div>}
              <div className="dialog-info" style={{ fontFamily: 'var(--font-sf-pro-text)' }}>
                <h3 className="dialog-title" style={{ fontFamily: 'var(--font-sf-pro-display)', fontSize: '20px', fontWeight: 700 }}>{selectedService.name}</h3>
                {selectedService.price && <div className="dialog-price">₹ {selectedService.price}</div>}
                {selectedService.detail && <p className="dialog-desc">{selectedService.detail}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   EditBusiness — full edit form with image upload
────────────────────────────────────────────────────────── */
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const CATEGORIES = ['Hospitals & Clinics','Transport','Electricals & Electronics','Education','Sports','Real Estate','Spa & Beauty','Digital & IT Products','Hire Services','Automobile','B2B Services','Banquets & Event Halls','Bills & Recharge','Caterers','Civil Contractors','Daily Needs','Doctors','Jobs','Jewellery','Labs & Diagnostics','Banking & Finance','Packers & Movers','Wedding Services','Hotels & Restaurants','Repairs','IT & Software','Construction Materials','Pest Control','Agriculture','Printing Services','Textiles & Garments','Travel & Tourism','Home Appliances','Demand Services','Religious','Organic Products','Advertising','Insurance','Advocate & Legal','Courier Services'];

const SUB_CATEGORIES = {
  'Hospitals & Clinics': ['Multi-specialty Hospitals','Dental Clinics','Eye Hospitals','Orthopaedic Hospitals','Maternity Hospitals',"Children's Hospitals",'ENT Clinics','Mental Health Hospitals','Veterinary Hospitals','Nursing Homes','Blood Banks','Home Nursing Services'],
  'Transport': ['Cab Services','Bus Tickets','Bike Services','Travels & Tour Operators','Vehicle Transport','All Vehicle Service Centres','Drivers on Hire'],
  'Electricals & Electronics': ['Electrical Shops','Electronics Showrooms','Electricians','Plumbing & Water Treatment','Electric Wholesalers','Solar Power Plants','GPS Vehicle Tracking','Hardware Stores'],
  'Education': ['Pre-KG & Child Care','Schools','Colleges & Universities','Tuition Centres','Engineering & Medical Colleges','Music, Art & Language Classes','Yoga Classes','Study Abroad Consultants'],
  'Sports': ['Sports Kit Shops','Swimming Clubs','Cycling','Trophies & Shields','Sports Coaching','Fitness Centres'],
  'Real Estate': ['Plots & Lands','Independent Houses','Villas','Buy / Sell / Rent','PG, Hostels & Rooms','Real Estate Agents & Builders'],
  'Spa & Beauty': ['Spas (Men / Women / Unisex)','Beauty Parlours','Saloons','Facial Services','Bridegroom Makeup','Herbal & Wellness Products'],
  'Digital & IT Products': ['Computer Sales & Service','Laptop Sales & Service','CCTV & Security Systems','Mobile Repairs','Networking & UPS','Software Solutions'],
  'Hire Services': ['Vehicles on Hire (Car/Bus/Bike)','Event Equipment (DJ/Sound/Projector)','Furniture & Appliances on Hire','Costumes & Formal Wear on Hire','Construction Equipment on Hire','Cooking & Catering Staff on Hire'],
  'Automobile': ['Car & Bike Sales','Auto Parts & Accessories','Vehicle Tyres & Batteries','Vehicle Body Building','Wash, Polish & Detailing','Helmet & Riding Gear'],
  'B2B Services': ['Chemicals & Industrial Supplies','Packaging Machines & Products','Electrical & Electronics Components','Healthcare & Medical Supplies','IT, Telecom & Networking','HR, Training & Recruitment'],
  'Banquets & Event Halls': ['5-Star Banquet Halls','AC Banquet Halls','Non-AC Banquet Halls','Lawns for Events','Party Halls on Rent','Wedding Halls'],
  'Bills & Recharge': ['Mobile Prepaid & Postpaid','DTH Recharge','Electricity Bills','Gas & Water Bills','Broadband & Cable TV','Insurance & Fastag'],
  'Caterers': ['South Indian Caterers','North Indian Caterers','Multi-cuisine Caterers','Wedding Caterers','Party & Birthday Caterers','Veg / Non-Veg Specialists'],
  'Civil Contractors': ['Building & Construction','Electrical Contractors','Plumbing & Pipeline','Interior & Flooring','Painting & Waterproofing','Borewell & Drilling'],
  'Daily Needs': ['Grocery & Supermarkets','Fruits & Vegetable Shops','Bakeries & Milk Shops','Fish & Meat Shops','Juice Bars & Drinking Water','Dry Fruits & Pooja Items'],
  'Doctors': ['General Physicians','Dentists & Dental Surgeons','Dermatologists & Skin Doctors','Gynaecologists & Obstetricians','Paediatricians','Orthopaedic & Spine Specialists','Neurologists & Psychiatrists','Eye Specialists & Surgeons'],
  'Jobs': ['IT Industry','BPO & Call Centres','Bank & Finance','Marketing & Sales','Part-time & Work-from-Home','HR & Manpower Services'],
  'Jewellery': ['Jewellery Showrooms','Handmade Jewellery','Jewellery on Hire','Jewellery Making Classes','Jewellery Manufacturers','Gold & Diamond Stores'],
  'Labs & Diagnostics': ['Blood Testing Labs','Scan Centres (MRI/X-Ray)','Health Check-up Labs','Pregnancy Testing','Home Visit Labs','Water Testing Labs'],
  'Banking & Finance': ['Home Loans','Personal & Car Loans','Business & Educational Loans','Insurance Agents','Share Market & Crypto','LIC Agency'],
  'Packers & Movers': ['Local Movers','National Transport','International Movers','Automobile Transport','Commercial Goods Movers','Household Goods Movers'],
  'Wedding Services': ['Bridal Makeup & Mehendi','Decorators & Florists','Wedding Photographers','Caterers & Sweet Shops','DJ, Sound & Music Bands','Wedding Cards & Event Organisers'],
  'Hotels & Restaurants': ['5-Star & 3-Star Hotels','Veg & Non-Veg Restaurants','Fast Food & Biryani Shops','Coffee Shops & Cafes','Dhaba & Tandoori','Resorts & Guest Houses'],
  'Repairs': ['AC & Refrigerator Repair','Mobile & Laptop Repair','Washing Machine Repair','TV & Home Theatre Repair','Two-Wheeler & Car Repair','CCTV & Generator Repair'],
  'IT & Software': ['Software Development Companies','Mobile App Developers','IT Consultants & Solutions','Computer Networking','POS & Sales Software','Software Training Institutes'],
  'Construction Materials': ['Cement, Sand & Bricks','Iron Rods & Steel','Tiles, Granite & Mosaic','Paints & Hardware','PVC, Doors & Windows','Glass & Aluminium Work'],
  'Pest Control': ['Cockroach Control','Mosquito Control','Termite Control','Rat & Rodent Control','Ant & Spider Control','Residential & Commercial Pest Control'],
  'Agriculture': ['Seeds & Trees','Fertilizers & Organic Products','Vegetables & Fruits','Agricultural Equipment','Millets & Grains','Nursery & Cattle'],
  'Printing Services': ['Digital Printing','Printing Press','Textile Printing','Flex & Banner Printing','Stickers & Labels','Books & Stationery Printing'],
  'Textiles & Garments': ['Ladies Wear',"Men's Wear",'Kids Wear','Handloom & Fabrics','Home Furnishing','Ready-made Garment Retailers'],
  'Travel & Tourism': ['Travel Agents','Tour Packages (Domestic & International)','Bus & Tempo Traveller Hire','Hotels & Resorts','Tourist Guides','Online Ticket Booking'],
  'Home Appliances': ['TV Showrooms','AC Showrooms','Furniture Showrooms','Water Purifiers','Cookware & Steel Items','Electronics Showrooms'],
  'Demand Services': ['Electricians & Plumbers','Carpenters & Masons','Painters & Interior Decorators','Housekeeping Services','Security Services','Gardening & Landscaping'],
  'Religious': ['Religious Trusts & Organisations','Religious Book Dealers','Religious Product Dealers','Religious Audio & DVD Dealers','Temple Construction','Pooja Item Shops'],
  'Organic Products': ['Organic Food & Dairy','Organic Skincare','Organic Oils','Fertilizers & Agro Centres','Fresh & Preserved Vegetables','Nattu Koli Pannai'],
  'Advertising': ['Social Media Advertising','Digital & Display Advertising','Printing & Outdoor Advertising','TV & Broadcasting Media','Native Advertising','Branding & Marketing'],
  'Insurance': ['Life Insurance (LIC)','Health Insurance','Vehicle Insurance (Car & Bike)','Travel Insurance','Business Insurance','Insurance Agents'],
  'Advocate & Legal': ['Property Case Advocates','Criminal Case Advocates','Family Dispute Advocates','Consumer Court Advocates','Notary & Documentation','High Court & District Court'],
  'Courier Services': ['Local Courier','National Courier','International Courier','DTDC','Blue Dart','Professional Couriers']
};

function EditBusiness({ biz, ownerPhone, pin, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [newPin, setNewPin]         = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');

  /* form state */
  const [form, setForm] = useState({
    name:             biz.name || '',
    description:      biz.description || '',
    category:         biz.category || '',
    subCategory:      biz.subCategory || '',
    address:          biz.address || '',
    landmark:         biz.landmark || '',
    serviceLocations: biz.serviceLocations || '',
    city:             biz.city || '',
    pincode:          biz.pincode || '',
    phone:            biz.phone || '',
    whatsappNo:       biz.whatsappNo || '',
    landline:         biz.landline || '',
    phone2:           biz.phone2 || '',
    email:            biz.email || '',
    website:          biz.website || '',
    fbLink:           biz.fbLink || '',
    twitterLink:      biz.twitterLink || '',
    instaLink:        biz.instaLink || '',
    googleMap:        biz.googleMap || '',
    videoUrl:         biz.videoUrl || '',
    openTime:         biz.openTime || '',
    closeTime:        biz.closeTime || '',
    infoQuestion:     biz.infoQuestion || '',
    infoAnswer:       biz.infoAnswer || '',
  });
  const [openDays, setOpenDays] = useState(
    biz.openDays ? biz.openDays.split(',').map(d => d.trim()).filter(Boolean) : []
  );

  /* images */
  const [profileFile,  setProfileFile]  = useState(null);
  const [profilePreview, setProfilePreview] = useState(biz.image || '');
  const [coverFile,    setCoverFile]    = useState(null);
  const [coverPreview, setCoverPreview] = useState(biz.coverImage || '');
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [galleryToRemove, setGalleryToRemove] = useState([]);
  const [existingGallery, setExistingGallery] = useState(biz.galleryImages || []);

  /* services */
  const [services, setServices] = useState(
    (biz.services && biz.services.length > 0)
      ? biz.services.slice(0, 6).map(s => ({ ...s, newImage: null, newImagePreview: s.image || '' }))
      : []
  );

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleDay = (d) => setOpenDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  /* image helpers */
  const handleProfileChange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setProfileFile(f);
    const reader = new FileReader();
    reader.onload = ev => setProfilePreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleCoverChange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setCoverFile(f);
    const reader = new FileReader();
    reader.onload = ev => setCoverPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    setGalleryFiles(f => [...f, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setGalleryPreviews(p => [...p, ev.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removeExistingGallery = (publicId) => {
    setGalleryToRemove(prev => [...prev, publicId]);
    setExistingGallery(prev => prev.filter(g => g.publicId !== publicId));
  };

  const updateService = (i, key, value) => setServices(prev => {
    const arr = [...prev]; arr[i] = { ...arr[i], [key]: value }; return arr;
  });

  const handleServiceImage = (i, e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => updateService(i, 'newImagePreview', ev.target.result);
    reader.readAsDataURL(f);
    updateService(i, 'newImage', f);
  };

  const addService = () => {
    if (services.length >= 6) return;
    setServices(prev => [...prev, { name:'', price:'', detail:'', image:'', imagePublicId:'', newImage:null, newImagePreview:'' }]);
  };

  const removeService = (i) => setServices(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Business name is required.'); return; }

    // Validate PIN change if user filled any new pin boxes
    const cleanNew     = newPin.replace(/\D/g,'');
    const cleanConfirm = confirmPin.replace(/\D/g,'');
    if (cleanNew || cleanConfirm) {
      if (cleanNew.length < 4)     { setPinChangeError('New PIN must be 4 digits.'); return; }
      if (cleanConfirm.length < 4) { setPinChangeError('Please confirm your new PIN.'); return; }
      if (cleanNew !== cleanConfirm) { setPinChangeError('New PINs do not match.'); return; }
    }
    setPinChangeError('');

    setSaving(true); setError('');

    const fd = new FormData();
    fd.append('ownerPhone', ownerPhone);
    fd.append('pin', pin);
    if (cleanNew && cleanNew === cleanConfirm) fd.append('newPin', cleanNew);
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('openDays', openDays.join(','));
    if (galleryToRemove.length) fd.append('galleryToRemove', galleryToRemove.join(','));

    if (profileFile) fd.append('image', profileFile);
    if (coverFile)   fd.append('coverImageFile', coverFile);
    galleryFiles.forEach(f => fd.append('galleryFiles', f));

    services.forEach((s, i) => {
      fd.append(`service${i+1}Name`,   s.name   || '');
      fd.append(`service${i+1}Price`,  s.price  || '');
      fd.append(`service${i+1}Detail`, s.detail || '');
      if (s.newImage) fd.append(`service${i+1}Image`, s.newImage);
    });

    try {
      const r = await updateOwnerBusiness(biz._id, fd);
      onSave(r.data.item);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Could not save changes. Please try again.';
      setError(msg);
    } finally { setSaving(false); }
  };

  const inputStyle = { width:'100%',padding:'10px 14px',border:'1px solid var(--color-subtle-ash)',borderRadius:12,color:'var(--color-rich-black)',fontSize:'14px',fontFamily:'var(--font-pp-neue-montreal)',outline:'none',background:'var(--color-canvas-white)',boxSizing:'border-box',transition:'border-color 0.15s ease, background-color 0.15s ease' };
  const labelStyle = { display:'block',fontSize:'12px',fontWeight:600,color:'var(--color-cool-gray)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5,fontFamily:'var(--font-pp-neue-montreal)' };
  const fieldStyle = { marginBottom:20 };
  const sectionStyle = { fontFamily: 'var(--font-pp-neue-montreal)', fontWeight:700,fontSize:'20px',color:'var(--color-rich-black)',margin:'32px 0 16px',paddingBottom:8,borderBottom:'1px solid var(--color-subtle-ash)' };

  return (
    <div className="container section" style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--color-graphite)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-sf-pro-text)' }}>← Cancel</button>
        <h1 style={{ fontFamily: 'var(--font-sf-pro-display)', fontSize: '28px', fontWeight: 700, letterSpacing: 'var(--tracking-heading-sm)', color: 'var(--color-ink)', flex: 1 }}>Edit Business</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Card 1: Basic Info */}
        <div className="card" style={{ padding: 32, background: 'var(--color-snow)', marginBottom: 24, borderRadius: 'var(--radius-cards)', border: '1px solid var(--border)' }}>
          <div className="card-header" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, color: 'var(--color-azure)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Section 1 of 8</span>
            <h2 style={{ fontFamily: 'var(--font-sf-pro-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>Basic Info</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-graphite)', margin: 0 }}>Modify your business name, category and description</p>
          </div>
          <div style={fieldStyle}><label style={labelStyle}>Business Name *</label><input style={inputStyle} value={form.name} onChange={e => setField('name', e.target.value)} required /></div>
          <div style={fieldStyle}><label style={labelStyle}>Category</label>
            <select style={inputStyle} value={form.category} onChange={e => { setField('category', e.target.value); setField('subCategory', ''); }}>
              <option value="">— Select Category —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {form.category && SUB_CATEGORIES[form.category] && (
            <div style={fieldStyle}>
              <label style={labelStyle}>Sub-Category</label>
              <select style={inputStyle} value={form.subCategory} onChange={e => setField('subCategory', e.target.value)}>
                <option value="">— Select Sub-Category —</option>
                {SUB_CATEGORIES[form.category].map(sc => <option key={sc} value={sc}>{sc}</option>)}
              </select>
            </div>
          )}
          <div style={fieldStyle}><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={form.description} onChange={e => setField('description', e.target.value)} /></div>
        </div>

        {/* Card 2: Location */}
        <div className="card" style={{ padding: 32, background: 'var(--color-snow)', marginBottom: 24, borderRadius: 'var(--radius-cards)', border: '1px solid var(--border)' }}>
          <div className="card-header" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, color: 'var(--color-azure)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Section 2 of 8</span>
            <h2 style={{ fontFamily: 'var(--font-sf-pro-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>Location &amp; Address</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-graphite)', margin: 0 }}>Update your physical location details</p>
          </div>
          <div style={fieldStyle}><label style={labelStyle}>Address *</label><textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={form.address} onChange={e => setField('address', e.target.value)} required /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div><label style={labelStyle}>City</label><input style={inputStyle} value={form.city} onChange={e => setField('city', e.target.value)} /></div>
            <div><label style={labelStyle}>Pincode</label><input style={inputStyle} value={form.pincode} onChange={e => setField('pincode', e.target.value)} maxLength={6} inputMode="numeric" /></div>
          </div>
          <div style={fieldStyle}><label style={labelStyle}>Landmark</label><input style={inputStyle} value={form.landmark} onChange={e => setField('landmark', e.target.value)} /></div>
          <div style={fieldStyle}><label style={labelStyle}>Service Locations</label><input style={inputStyle} value={form.serviceLocations} onChange={e => setField('serviceLocations', e.target.value)} /></div>
        </div>

        {/* Card 3: Contact Info */}
        <div className="card" style={{ padding: 32, background: 'var(--color-snow)', marginBottom: 24, borderRadius: 'var(--radius-cards)', border: '1px solid var(--border)' }}>
          <div className="card-header" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, color: 'var(--color-azure)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Section 3 of 8</span>
            <h2 style={{ fontFamily: 'var(--font-sf-pro-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>Contact Details</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-graphite)', margin: 0 }}>Update phone numbers, email, and website</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div><label style={labelStyle}>Primary Phone</label><input style={{ ...inputStyle, background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed', borderColor: '#e5e7eb' }} value={form.phone} readOnly type="tel" /></div>
            <div><label style={labelStyle}>WhatsApp No</label><input style={inputStyle} value={form.whatsappNo} onChange={e => setField('whatsappNo', e.target.value)} type="tel" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div><label style={labelStyle}>Landline</label><input style={inputStyle} value={form.landline} onChange={e => setField('landline', e.target.value)} /></div>
            <div><label style={labelStyle}>Alt Phone</label><input style={inputStyle} value={form.phone2} onChange={e => setField('phone2', e.target.value)} type="tel" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div><label style={labelStyle}>Email</label><input style={inputStyle} value={form.email} onChange={e => setField('email', e.target.value)} type="email" /></div>
            <div><label style={labelStyle}>Website</label><input style={inputStyle} value={form.website} onChange={e => setField('website', e.target.value)} type="url" /></div>
          </div>
        </div>

        {/* Card 4: Social Links */}
        <div className="card" style={{ padding: 32, background: 'var(--color-snow)', marginBottom: 24, borderRadius: 'var(--radius-cards)', border: '1px solid var(--border)' }}>
          <div className="card-header" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, color: 'var(--color-azure)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Section 4 of 8</span>
            <h2 style={{ fontFamily: 'var(--font-sf-pro-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>Social Links</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-graphite)', margin: 0 }}>Add links to your social media profiles</p>
          </div>
          {[['fbLink', 'Facebook'], ['twitterLink', 'Twitter / X'], ['instaLink', 'Instagram'], ['googleMap', 'Google Maps'], ['videoUrl', 'YouTube']].map(([k, l]) => (
            <div key={k} style={fieldStyle}><label style={labelStyle}>{l}</label><input style={inputStyle} value={form[k]} onChange={e => setField(k, e.target.value)} type="url" placeholder="https://..." /></div>
          ))}
        </div>

        {/* Card 5: Hours */}
        <div className="card" style={{ padding: 32, background: 'var(--color-snow)', marginBottom: 24, borderRadius: 'var(--radius-cards)', border: '1px solid var(--border)' }}>
          <div className="card-header" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, color: 'var(--color-azure)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Section 5 of 8</span>
            <h2 style={{ fontFamily: 'var(--font-sf-pro-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>Operating Hours</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-graphite)', margin: 0 }}>Specify opening days and timing schedules</p>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Opening Days</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, fontFamily: 'var(--font-sf-pro-text)' }}>
              {DAYS.map(d => (
                <button key={d} type="button" onClick={() => toggleDay(d)} style={{ padding: '5px 12px', borderRadius: 'var(--radius-buttons)', fontSize: '12px', fontWeight: 500, border: `1px solid ${openDays.includes(d) ? 'var(--color-ink)' : 'var(--border)'}`, background: openDays.includes(d) ? 'var(--color-ink)' : 'transparent', color: openDays.includes(d) ? 'var(--color-snow)' : 'var(--color-graphite)', cursor: 'pointer', transition: 'all .15s' }}>{d}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div><label style={labelStyle}>Open Time</label><input style={inputStyle} type="time" value={form.openTime} onChange={e => setField('openTime', e.target.value)} /></div>
            <div><label style={labelStyle}>Close Time</label><input style={inputStyle} type="time" value={form.closeTime} onChange={e => setField('closeTime', e.target.value)} /></div>
          </div>
        </div>

        {/* Card 6: Services */}
        <div className="card" style={{ padding: 32, background: 'var(--color-snow)', marginBottom: 24, borderRadius: 'var(--radius-cards)', border: '1px solid var(--border)' }}>
          <div className="card-header" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, color: 'var(--color-azure)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Section 6 of 8</span>
            <h2 style={{ fontFamily: 'var(--font-sf-pro-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>Services &amp; Products</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-graphite)', margin: 0 }}>List key services/products offered (max 6)</p>
          </div>
          {services.map((s, i) => (
            <div key={i} style={{ background: 'var(--color-fog)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontFamily: 'var(--font-sf-pro-text)' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-ink)' }}>Service {i + 1}</span>
                <button type="button" onClick={() => removeService(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>✕ Remove</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div><label style={labelStyle}>Name</label><input style={inputStyle} value={s.name} onChange={e => updateService(i, 'name', e.target.value)} /></div>
                <div><label style={labelStyle}>Price (₹)</label><input style={inputStyle} value={s.price} onChange={e => updateService(i, 'price', e.target.value)} /></div>
              </div>
              <div style={{ marginBottom: 10 }}><label style={labelStyle}>Details</label><textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={s.detail} onChange={e => updateService(i, 'detail', e.target.value)} /></div>
              <div>
                <label style={labelStyle}>Service Photo</label>
                {s.newImagePreview && <img src={s.newImagePreview} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 6, display: 'block' }} />}
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', border: '1px dashed var(--border)', borderRadius: 12, cursor: 'pointer', fontSize: '12px', color: 'var(--color-graphite)', fontFamily: 'var(--font-sf-pro-text)' }}>
                  <Camera size={12} /> {s.newImagePreview ? 'Change Photo' : 'Upload Photo'}
                  <input type="file" accept="image/*" onChange={e => handleServiceImage(i, e)} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          ))}
          {services.length < 6 && (
            <button type="button" onClick={addService} style={{ width: '100%', padding: 12, border: '1px dashed var(--border)', borderRadius: 12, background: 'transparent', color: 'var(--color-graphite)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-sf-pro-text)' }}>
              <Plus size={14} /> Add Service / Product
            </button>
          )}
        </div>

        {/* Card 7: Media */}
        <div className="card" style={{ padding: 32, background: 'var(--color-snow)', marginBottom: 24, borderRadius: 'var(--radius-cards)', border: '1px solid var(--border)' }}>
          <div className="card-header" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, color: 'var(--color-azure)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Section 7 of 8</span>
            <h2 style={{ fontFamily: 'var(--font-sf-pro-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>Business Media</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-graphite)', margin: 0 }}>Manage logos, wide banners, and photos</p>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Profile Photo (Logo)</label>
            {profilePreview && <img src={profilePreview} alt="profile" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 8, display: 'block' }} />}
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px dashed var(--border)', borderRadius: 12, cursor: 'pointer', fontSize: '13px', color: 'var(--color-graphite)', fontFamily: 'var(--font-sf-pro-text)' }}>
              <Camera size={14} /> {profilePreview ? 'Change Photo' : 'Upload Photo'}
              <input type="file" accept="image/*" onChange={handleProfileChange} style={{ display: 'none' }} />
            </label>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Cover / Banner Image</label>
            {coverPreview && <img src={coverPreview} alt="cover" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 8, display: 'block' }} />}
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px dashed var(--border)', borderRadius: 12, cursor: 'pointer', fontSize: '13px', color: 'var(--color-graphite)', fontFamily: 'var(--font-sf-pro-text)' }}>
              <Camera size={14} /> {coverPreview ? 'Change Cover' : 'Upload Cover'}
              <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
            </label>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Gallery Images</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {existingGallery.map(g => (
                <div key={g.publicId} style={{ position: 'relative' }}>
                  <img src={g.url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }} />
                  <button type="button" onClick={() => removeExistingGallery(g.publicId)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} /></button>
                </div>
              ))}
              {galleryPreviews.map((p, i) => (<img key={i} src={p} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }} />))}
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px dashed var(--border)', borderRadius: 12, cursor: 'pointer', fontSize: '13px', color: 'var(--color-graphite)', fontFamily: 'var(--font-sf-pro-text)' }}>
              <Plus size={14} /> Add Gallery Photos
              <input type="file" accept="image/*" multiple onChange={handleGalleryChange} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Card 8: FAQ & Submission */}
        {/* Card 8: FAQ & Submission */}
        <div className="card" style={{ padding: 32, background: 'var(--color-snow)', marginBottom: 32, borderRadius: 'var(--radius-cards)', border: '1px solid var(--border)' }}>
          <div className="card-header" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, color: 'var(--color-azure)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Section 8 of 9</span>
            <h2 style={{ fontFamily: 'var(--font-sf-pro-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>FAQ</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-graphite)', margin: 0 }}>Add a frequently asked question about your business</p>
          </div>
          <div style={fieldStyle}><label style={labelStyle}>Question</label><input style={inputStyle} value={form.infoQuestion} onChange={e => setField('infoQuestion', e.target.value)} /></div>
          <div style={{ ...fieldStyle, marginBottom: 0 }}><label style={labelStyle}>Answer</label><textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={form.infoAnswer} onChange={e => setField('infoAnswer', e.target.value)} /></div>
        </div>

        {/* Card 9: PIN & Submission */}
        <div className="card" style={{ padding: 32, background: 'var(--color-snow)', marginBottom: 32, borderRadius: 'var(--radius-cards)', border: '1px solid var(--border)' }}>
          <div className="card-header" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, color: 'var(--color-azure)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Section 9 of 9</span>
            <h2 style={{ fontFamily: 'var(--font-sf-pro-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>Security PIN</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-graphite)', margin: 0 }}>Update your 4-digit security PIN (optional)</p>
          </div>

          <div style={{ background: 'var(--color-canvas-white)', border: '1px solid var(--color-subtle-ash)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>New PIN <span style={{ color: 'var(--color-cool-gray)', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(leave blank to keep current)</span></div>
            <PinInput value={newPin} onChange={setNewPin} disabled={saving} />
          </div>

          <div style={{ background: 'var(--color-canvas-white)', border: '1px solid var(--color-subtle-ash)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>Confirm New PIN</div>
            <PinInput value={confirmPin} onChange={setConfirmPin} disabled={saving} />
            {pinChangeError && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: 10, textAlign: 'center', fontFamily: 'var(--font-pp-neue-montreal)' }}>{pinChangeError}</p>}
          </div>

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 12, padding: '12px 16px', color: '#ef4444', fontSize: '13px', marginBottom: 20, fontFamily: 'var(--font-sf-pro-text)' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, fontFamily: 'var(--font-sf-pro-text)' }}>
            <button type="button" onClick={onCancel} className="btn btn-outline" style={{ flex: 1, borderRadius: 'var(--radius-buttons)', height: 42 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: 'var(--radius-buttons)', height: 42 }} disabled={saving}>
              <Save size={15} style={{ marginRight: 4 }} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ── Shared helper components ── */
function InfoSection({ title, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h3 style={{
        fontFamily: 'var(--font-pp-neue-montreal)',
        fontWeight: 600,
        fontSize: '22px',
        letterSpacing: '-0.015em',
        color: 'var(--color-rich-black)',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottom: '1px solid var(--color-subtle-ash)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>{title}</h3>
      {children}
    </div>
  );
}

function SideCard({ title, children }) {
  return (
    <div className="card" style={{ padding: 24, background: 'var(--color-canvas-white)', marginBottom: 24, border: '1px solid var(--color-subtle-ash)', borderRadius: '12px' }}>
      <div style={{
        fontFamily: 'var(--font-pp-neue-montreal)',
        fontWeight: 700,
        fontSize: '11px',
        color: 'var(--color-cool-gray)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: '1px solid var(--color-subtle-ash)'
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid var(--color-subtle-ash)',
    }} className="info-row-item">
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '12px',
        background: 'var(--color-subtle-ash)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 2
      }}>
        <Icon size={13} style={{ color: 'var(--color-rich-black)' }} />
      </div>
      <div style={{ fontFamily: 'var(--font-pp-neue-montreal)', flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-cool-gray)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '13px', color: 'var(--color-rich-black)', fontWeight: 500, wordBreak: 'break-all', whiteSpace: 'normal', lineHeight: 1.4 }}>{value}</div>
      </div>
    </div>
  );
}

