import { useState, useEffect, useRef } from 'react';
import {
  Phone, RefreshCw, Store, Trash2, ExternalLink,
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
const LS_PIN_KEY   = 'vanigan_owner_pin_ok'; // just flag, not actual PIN

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
            width: 52, height: 60, border: '2px solid var(--border)', borderRadius: 12,
            background: '#fff', fontSize: '1.6rem', fontWeight: 900, textAlign: 'center',
            color: 'var(--text)', outline: 'none', transition: 'border-color .15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Main export — multi-step flow
   Step 1: enter phone
   Step 2: enter PIN (or no-pin message)
   Step 3: business view (with edit)
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

  /* ── Step 1: Find business by phone ── */
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

  /* ── Step 2: Verify PIN ── */
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

  /* ── Render steps ── */
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
    <div className="container section" style={{ maxWidth: 480 }}>
      <button onClick={() => navigate('home')}
        style={{ background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:'.85rem',marginBottom:20 }}>
        ← Back
      </button>

      <div style={{ width:64,height:64,borderRadius:12,background:'var(--bg2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20 }}>
        <Store size={28} style={{ color:'var(--text)' }} />
      </div>

      <h1 style={{ fontSize:'1.8rem',fontWeight:700,letterSpacing:'-0.02em',marginBottom:8 }}>My Business</h1>

      {/* ── Step 1: Phone ── */}
      {step === 'phone' && (
        <>
          <p style={{ color:'var(--muted)',marginBottom:32 }}>
            Enter your registered WhatsApp number to access your business listing.
          </p>
          <div className="card" style={{ padding:24 }}>
            <div style={{ fontWeight:600,marginBottom:4 }}>Find Your Business</div>
            <p style={{ fontSize:'.82rem',color:'var(--muted)',marginBottom:16 }}>Use the same number you registered with.</p>
            <form onSubmit={handlePhoneSubmit}>
              <div className="field" style={{ marginBottom:14 }}>
                <label className="label"><Phone size={12} style={{ display:'inline',marginRight:4 }} />Registered Phone Number</label>
                <input className="input" type="tel" value={phone}
                  onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                  placeholder="10-digit mobile number" maxLength={15} inputMode="numeric" />
                {phoneError && <p style={{ color:'#f87171',fontSize:'.78rem',marginTop:4 }}>{phoneError}</p>}
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Searching…' : 'Continue'}
              </button>
            </form>
          </div>
          <div style={{ textAlign:'center',marginTop:24 }}>
            <p style={{ color:'var(--muted)',fontSize:'.85rem',marginBottom:8 }}>Don't have a listing yet?</p>
            <button onClick={() => navigate('add')} className="btn btn-outline btn-sm">Add Your Business</button>
          </div>
        </>
      )}

      {/* ── Step 2: PIN ── */}
      {step === 'pin' && (
        <>
          <p style={{ color:'var(--muted)',marginBottom:32 }}>
            {bizName ? <>Business found: <strong style={{ color:'var(--text)' }}>{bizName}</strong>. Enter your 4-digit PIN to continue.</> : 'Enter your 4-digit security PIN.'}
          </p>
          {!hasPin ? (
            <div className="card" style={{ padding:24,textAlign:'center' }}>
              <div style={{ fontSize:'2rem',marginBottom:12 }}>🔐</div>
              <p style={{ fontWeight:700,marginBottom:8 }}>No PIN Set Yet</p>
              <p style={{ color:'var(--muted)',fontSize:'.85rem',marginBottom:20 }}>
                You haven't set a security PIN for this business. Please complete the registration by setting a PIN first.
              </p>
              <a href={REGISTER_URL(phone.replace(/\D/g,''))} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-full">
                Set PIN via Registration Form
              </a>
              <button onClick={() => { setStep('phone'); setPin(''); setPinError(''); }} style={{ background:'none',border:'none',color:'var(--muted)',cursor:'pointer',marginTop:14,fontSize:'.84rem' }}>
                ← Back
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding:24 }}>
              <div style={{ fontWeight:600,marginBottom:4,textAlign:'center' }}>🔐 Enter Your PIN</div>
              <p style={{ fontSize:'.82rem',color:'var(--muted)',marginBottom:20,textAlign:'center' }}>
                Enter the 4-digit PIN you set during registration.
              </p>
              <form onSubmit={handlePinSubmit}>
                <div style={{ marginBottom:20 }}>
                  <PinInput value={pin} onChange={setPin} disabled={loading} />
                  {pinError && <p style={{ color:'#f87171',fontSize:'.8rem',marginTop:10,textAlign:'center' }}>{pinError}</p>}
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading || pin.replace(/\D/g,'').length < 4}>
                  {loading ? 'Verifying…' : 'Verify & View My Business'}
                </button>
              </form>
              <button onClick={() => { setStep('phone'); setPin(''); setPinError(''); }}
                style={{ background:'none',border:'none',color:'var(--muted)',cursor:'pointer',marginTop:14,fontSize:'.84rem',width:'100%',textAlign:'center' }}>
                ← Back
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
              <div style={{ position:'absolute',inset:0,backgroundImage:`url(${biz.coverImage})`,backgroundSize:'cover',backgroundPosition:'center',filter:'blur(15px) brightness(0.85)',transform:'scale(1.1)',opacity:0.45,zIndex:1 }} />
              <img src={biz.coverImage} alt={biz.name} className="biz-cover-img" />
            </>
          ) : (
            <div className="biz-cover-placeholder"><Store size={48} style={{ color:'var(--muted)',opacity:0.6 }} /></div>
          )}
        </div>
        {biz.image && (
          <img src={biz.image} alt={biz.name} style={{ position:'absolute',bottom:-32,left:24,width:76,height:76,borderRadius:14,objectFit:'cover',border:'3px solid var(--card)',background:'var(--card)',boxShadow:'0 4px 14px rgba(0,0,0,.35)',zIndex:2 }} />
        )}
      </div>

      <div className="container" style={{ paddingTop:0 }}>
        {/* Header */}
        <div style={{ display:'flex',gap:16,alignItems:'flex-start',padding:'20px 0 20px',paddingTop:biz.image?48:20,borderBottom:'1px solid var(--border)',flexWrap:'wrap' }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex',alignItems:'flex-start',gap:10,flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <h1 style={{ fontSize:'1.4rem',fontWeight:900 }}>{biz.name}</h1>
                <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:4 }}>
                  {biz.rating > 0 ? (
                    <div style={{ display:'flex',alignItems:'center',gap:4 }}>
                      <div style={{ display:'flex',gap:1 }}>
                        {[1,2,3,4,5].map(star => (<Star key={star} size={12} fill={star<=Math.round(biz.rating)?'#fbbf24':'none'} stroke={star<=Math.round(biz.rating)?'#fbbf24':'#a1a1aa'} />))}
                      </div>
                      <span style={{ fontSize:'.8rem',fontWeight:700 }}>{biz.rating}</span>
                      <span style={{ fontSize:'.75rem',color:'var(--muted)' }}>({biz.reviewCount||0} reviews)</span>
                    </div>
                  ) : (
                    <span style={{ fontSize:'.75rem',color:'var(--muted)' }}>No ratings yet</span>
                  )}
                </div>
                {biz.category && <div style={{ color:'var(--accent)',fontSize:'.83rem',fontWeight:600,marginTop:6 }}>{biz.category}{biz.subCategory&&` › ${biz.subCategory}`}</div>}
                {biz.listingCode && <div style={{ marginTop:6 }}><span className="badge badge-blue"># {biz.listingCode}</span></div>}
              </div>
              <span className={`badge ${biz.active?'badge-green':'badge-gray'}`}>{biz.active?'✅ Active':'⏳ Pending Review'}</span>
            </div>
          </div>
          <div style={{ display:'flex',gap:8,marginLeft:'auto',alignSelf:'flex-start',marginTop:8,flexWrap:'wrap' }}>
            <button onClick={onEdit} className="btn btn-outline btn-sm"><Edit3 size={14} /> Edit Business</button>
            <button onClick={onRefresh} disabled={loading} className="btn btn-ghost btn-sm"><RefreshCw size={14} style={{ animation:loading?'spin 1s linear infinite':'none' }} />{loading?'Updating…':'Refresh'}</button>
            <button onClick={onClear} className="btn btn-ghost btn-sm" style={{ color:'#f87171' }}><Trash2 size={14} /> Logout</button>
          </div>
        </div>

        {!biz.active && (
          <div style={{ background:'rgba(251,146,60,.08)',border:'1px solid rgba(251,146,60,.2)',borderRadius:12,padding:'14px 16px',margin:'20px 0',color:'#fb923c',fontSize:'.88rem' }}>
            ⏳ Your business is pending review. Our team will activate it shortly.
          </div>
        )}

        <div style={{ display:'flex',gap:10,flexWrap:'wrap',padding:'16px 0',borderBottom:'1px solid var(--border)' }}>
          <button onClick={() => navigate('detail', { id: biz._id })} className="btn btn-primary btn-sm"><ExternalLink size={14} /> View Public Listing</button>
          {phone && <a href={`https://wa.me/91${phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ color: '#25D366' }}><WhatsAppIcon size={14} /> WhatsApp Preview</a>}
        </div>

        <div className="biz-detail-grid">
          <div>
            {biz.description && <InfoSection title="About"><p style={{ color:'var(--muted)',lineHeight:1.7,fontSize:'.9rem' }}>{biz.description}</p></InfoSection>}
            {services.length > 0 && (
              <InfoSection title={`Services (${services.length})`}>
                <div className="services-grid">
                  {services.map((s,i) => (
                    <div key={i} className="service-card" onClick={() => setSelectedService(s)}>
                      {s.image && <img src={s.image} alt={s.name} className="service-card-img" />}
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
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:8 }}>
                  {gallery.map((g,i) => (<div key={i} style={{ aspectRatio:'1',borderRadius:8,overflow:'hidden',background:'var(--bg2)' }}><img src={g.url} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} /></div>))}
                </div>
              </InfoSection>
            )}
            {biz.infoQuestion && (
              <InfoSection title="FAQ">
                <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:14 }}>
                  <div style={{ fontWeight:700,marginBottom:6 }}><span style={{ color:'var(--accent)' }}>Q.</span> {biz.infoQuestion}</div>
                  {biz.infoAnswer && <div style={{ color:'var(--muted)',fontSize:'.9rem' }}><span style={{ color:'var(--green)' }}>A.</span> {biz.infoAnswer}</div>}
                </div>
              </InfoSection>
            )}
            <InfoSection title={`Customer Reviews (${(biz.reviews||[]).length})`}>
              {!biz.reviews||biz.reviews.length===0 ? (
                <p style={{ fontSize:'.85rem',color:'var(--muted)',fontStyle:'italic',padding:'12px 0' }}>No reviews yet. Share your listing to get ratings!</p>
              ) : biz.reviews.map(rev => (
                <div key={rev._id} style={{ background:'var(--bg)',border:'1px solid var(--border)',borderRadius:12,padding:16,marginBottom:12 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8 }}>
                    <div><div style={{ fontWeight:700,fontSize:'.9rem' }}>{rev.reviewerName||'Anonymous'}</div>
                      <div style={{ display:'flex',gap:1,marginTop:4 }}>{[1,2,3,4,5].map(s=><Star key={s} size={12} fill={s<=rev.rating?'#fbbf24':'none'} stroke={s<=rev.rating?'#fbbf24':'#d4d4d8'} />)}</div>
                    </div>
                    <span style={{ fontSize:'.75rem',color:'var(--muted2)' }}>{new Date(rev.createdAt).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}</span>
                  </div>
                  {rev.text && <p style={{ fontSize:'.85rem',color:'var(--muted)',lineHeight:1.5,marginTop:8 }}>{rev.text}</p>}
                </div>
              ))}
            </InfoSection>
          </div>

          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            <SideCard title="Contact Info">
              {[phone&&{icon:Phone,label:'Phone',value:phone},biz.whatsappNo&&{icon:WhatsAppIcon,label:'WhatsApp',value:biz.whatsappNo},biz.landline&&{icon:Phone,label:'Landline',value:biz.landline},biz.email&&{icon:Mail,label:'Email',value:biz.email},biz.website&&{icon:Globe,label:'Website',value:biz.website}].filter(Boolean).map((r,i)=><InfoRow key={i} {...r} />)}
            </SideCard>
            <SideCard title="Location">
              {[biz.address&&{icon:MapPin,label:'Address',value:biz.address},biz.city&&{icon:MapPin,label:'City',value:biz.city},biz.pincode&&{icon:MapPin,label:'Pincode',value:biz.pincode},biz.serviceLocations&&{icon:Tag,label:'Service Areas',value:biz.serviceLocations}].filter(Boolean).map((r,i)=><InfoRow key={i} {...r} />)}
            </SideCard>
            {(days.length > 0 || biz.openTime) && (
              <SideCard title="Business Hours">
                {days.length > 0 && <div style={{ display:'flex',flexWrap:'wrap',gap:4,marginBottom:10 }}>
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (<span key={d} style={{ padding:'3px 8px',borderRadius:5,fontSize:'.72rem',fontWeight:600,background:days.includes(d)?'var(--accent)':'var(--bg2)',color:days.includes(d)?'#fff':'var(--muted)',border:`1px solid ${days.includes(d)?'var(--accent)':'var(--border)'}` }}>{d}</span>))}
                </div>}
                {(biz.openTime||biz.closeTime) && <div style={{ color:'var(--muted)',fontSize:'.85rem' }}><Clock size={12} style={{ display:'inline',marginRight:4 }} />{biz.openTime||'—'} – {biz.closeTime||'—'}</div>}
              </SideCard>
            )}
          </div>
        </div>
      </div>

      {selectedService && (
        <div className="dialog-overlay" onClick={() => setSelectedService(null)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <button className="dialog-close" onClick={() => setSelectedService(null)}>✕</button>
            <div className="dialog-body">
              {selectedService.image && <div className="dialog-img-wrap"><img src={selectedService.image} alt={selectedService.name} className="dialog-img" /></div>}
              <div className="dialog-info">
                <h3 className="dialog-title">{selectedService.name}</h3>
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

function EditBusiness({ biz, ownerPhone, pin, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

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
    setSaving(true); setError('');

    const fd = new FormData();
    fd.append('ownerPhone', ownerPhone);
    fd.append('pin', pin);
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

  const inputStyle = { width:'100%',padding:'8px 12px',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:'.88rem',fontFamily:'inherit',outline:'none',background:'#fff',boxSizing:'border-box' };
  const labelStyle = { display:'block',fontSize:'.72rem',fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5 };
  const fieldStyle = { marginBottom:16 };
  const sectionStyle = { fontWeight:800,fontSize:'.8rem',color:'var(--accent)',textTransform:'uppercase',letterSpacing:'.07em',margin:'24px 0 12px',paddingBottom:8,borderBottom:'2px solid var(--border)' };

  return (
    <div className="container section" style={{ maxWidth:600 }}>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:24 }}>
        <button onClick={onCancel} style={{ background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:'.85rem',display:'flex',alignItems:'center',gap:4 }}>← Back</button>
        <h1 style={{ fontSize:'1.5rem',fontWeight:900,flex:1 }}>Edit Business</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding:24 }}>
          <p style={sectionStyle}>Basic Info</p>
          <div style={fieldStyle}><label style={labelStyle}>Business Name *</label><input style={inputStyle} value={form.name} onChange={e => setField('name', e.target.value)} required /></div>
          <div style={fieldStyle}><label style={labelStyle}>Category</label>
            <select style={inputStyle} value={form.category} onChange={e => setField('category', e.target.value)}>
              <option value="">— Select —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={fieldStyle}><label style={labelStyle}>Sub-Category</label><input style={inputStyle} value={form.subCategory} onChange={e => setField('subCategory', e.target.value)} placeholder="Sub-category if applicable" /></div>
          <div style={fieldStyle}><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle,resize:'vertical' }} rows={3} value={form.description} onChange={e => setField('description', e.target.value)} /></div>

          <p style={sectionStyle}>Location</p>
          <div style={fieldStyle}><label style={labelStyle}>Address *</label><textarea style={{ ...inputStyle,resize:'vertical' }} rows={2} value={form.address} onChange={e => setField('address', e.target.value)} /></div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16 }}>
            <div><label style={labelStyle}>City</label><input style={inputStyle} value={form.city} onChange={e => setField('city', e.target.value)} /></div>
            <div><label style={labelStyle}>Pincode</label><input style={inputStyle} value={form.pincode} onChange={e => setField('pincode', e.target.value)} maxLength={6} inputMode="numeric" /></div>
          </div>
          <div style={fieldStyle}><label style={labelStyle}>Landmark</label><input style={inputStyle} value={form.landmark} onChange={e => setField('landmark', e.target.value)} /></div>
          <div style={fieldStyle}><label style={labelStyle}>Service Locations</label><input style={inputStyle} value={form.serviceLocations} onChange={e => setField('serviceLocations', e.target.value)} /></div>

          <p style={sectionStyle}>Contact</p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16 }}>
            <div><label style={labelStyle}>Primary Phone</label><input style={inputStyle} value={form.phone} onChange={e => setField('phone', e.target.value)} type="tel" /></div>
            <div><label style={labelStyle}>WhatsApp No</label><input style={inputStyle} value={form.whatsappNo} onChange={e => setField('whatsappNo', e.target.value)} type="tel" /></div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16 }}>
            <div><label style={labelStyle}>Landline</label><input style={inputStyle} value={form.landline} onChange={e => setField('landline', e.target.value)} /></div>
            <div><label style={labelStyle}>Alt Phone</label><input style={inputStyle} value={form.phone2} onChange={e => setField('phone2', e.target.value)} type="tel" /></div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16 }}>
            <div><label style={labelStyle}>Email</label><input style={inputStyle} value={form.email} onChange={e => setField('email', e.target.value)} type="email" /></div>
            <div><label style={labelStyle}>Website</label><input style={inputStyle} value={form.website} onChange={e => setField('website', e.target.value)} type="url" /></div>
          </div>

          <p style={sectionStyle}>Social Media</p>
          {[['fbLink','Facebook'],['twitterLink','Twitter / X'],['instaLink','Instagram'],['googleMap','Google Maps'],['videoUrl','YouTube']].map(([k,l]) => (
            <div key={k} style={fieldStyle}><label style={labelStyle}>{l}</label><input style={inputStyle} value={form[k]} onChange={e => setField(k, e.target.value)} type="url" placeholder="https://..." /></div>
          ))}

          <p style={sectionStyle}>Hours</p>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Opening Days</label>
            <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginTop:4 }}>
              {DAYS.map(d => (
                <button key={d} type="button" onClick={() => toggleDay(d)} style={{ padding:'5px 12px',borderRadius:20,fontSize:'.78rem',fontWeight:600,border:`1px solid ${openDays.includes(d)?'var(--accent)':'var(--border)'}`,background:openDays.includes(d)?'var(--accent)':'transparent',color:openDays.includes(d)?'#fff':'var(--muted)',cursor:'pointer',transition:'all .15s' }}>{d}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16 }}>
            <div><label style={labelStyle}>Open Time</label><input style={inputStyle} type="time" value={form.openTime} onChange={e => setField('openTime', e.target.value)} /></div>
            <div><label style={labelStyle}>Close Time</label><input style={inputStyle} type="time" value={form.closeTime} onChange={e => setField('closeTime', e.target.value)} /></div>
          </div>

          <p style={sectionStyle}>FAQ</p>
          <div style={fieldStyle}><label style={labelStyle}>Question</label><input style={inputStyle} value={form.infoQuestion} onChange={e => setField('infoQuestion', e.target.value)} /></div>
          <div style={fieldStyle}><label style={labelStyle}>Answer</label><textarea style={{ ...inputStyle,resize:'vertical' }} rows={2} value={form.infoAnswer} onChange={e => setField('infoAnswer', e.target.value)} /></div>

          <p style={sectionStyle}>Images</p>
          {/* Profile photo */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Profile Photo</label>
            {profilePreview && <img src={profilePreview} alt="profile" style={{ width:80,height:80,objectFit:'cover',borderRadius:10,border:'1px solid var(--border)',marginBottom:8,display:'block' }} />}
            <label style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',border:'1.5px dashed var(--border)',borderRadius:8,cursor:'pointer',fontSize:'.83rem',color:'var(--muted)' }}>
              <Camera size={14} /> {profilePreview ? 'Change Photo' : 'Upload Photo'}
              <input type="file" accept="image/*" onChange={handleProfileChange} style={{ display:'none' }} />
            </label>
          </div>
          {/* Cover image */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Cover / Banner Image</label>
            {coverPreview && <img src={coverPreview} alt="cover" style={{ width:'100%',height:100,objectFit:'cover',borderRadius:10,border:'1px solid var(--border)',marginBottom:8,display:'block' }} />}
            <label style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',border:'1.5px dashed var(--border)',borderRadius:8,cursor:'pointer',fontSize:'.83rem',color:'var(--muted)' }}>
              <Camera size={14} /> {coverPreview ? 'Change Cover' : 'Upload Cover'}
              <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display:'none' }} />
            </label>
          </div>
          {/* Gallery */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Gallery Images</label>
            <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginBottom:8 }}>
              {existingGallery.map(g => (
                <div key={g.publicId} style={{ position:'relative' }}>
                  <img src={g.url} alt="" style={{ width:72,height:72,objectFit:'cover',borderRadius:8,border:'1px solid var(--border)' }} />
                  <button type="button" onClick={() => removeExistingGallery(g.publicId)} style={{ position:'absolute',top:-6,right:-6,width:20,height:20,borderRadius:'50%',background:'#ef4444',border:'none',color:'#fff',cursor:'pointer',fontSize:'.7rem',display:'flex',alignItems:'center',justifyContent:'center' }}><X size={10} /></button>
                </div>
              ))}
              {galleryPreviews.map((p,i) => (<img key={i} src={p} alt="" style={{ width:72,height:72,objectFit:'cover',borderRadius:8,border:'1px solid var(--border)' }} />))}
            </div>
            <label style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',border:'1.5px dashed var(--border)',borderRadius:8,cursor:'pointer',fontSize:'.83rem',color:'var(--muted)' }}>
              <Plus size={14} /> Add Gallery Photos
              <input type="file" accept="image/*" multiple onChange={handleGalleryChange} style={{ display:'none' }} />
            </label>
          </div>

          <p style={sectionStyle}>Services / Products</p>
          {services.map((s, i) => (
            <div key={i} style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:16,marginBottom:12 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
                <span style={{ fontWeight:700,fontSize:'.82rem' }}>Service {i+1}</span>
                <button type="button" onClick={() => removeService(i)} style={{ background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:'.75rem',fontWeight:700 }}>✕ Remove</button>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10 }}>
                <div><label style={labelStyle}>Name</label><input style={inputStyle} value={s.name} onChange={e => updateService(i,'name',e.target.value)} /></div>
                <div><label style={labelStyle}>Price (₹)</label><input style={inputStyle} value={s.price} onChange={e => updateService(i,'price',e.target.value)} /></div>
              </div>
              <div style={{ marginBottom:10 }}><label style={labelStyle}>Details</label><textarea style={{ ...inputStyle,resize:'vertical' }} rows={2} value={s.detail} onChange={e => updateService(i,'detail',e.target.value)} /></div>
              <div>
                <label style={labelStyle}>Service Photo</label>
                {s.newImagePreview && <img src={s.newImagePreview} alt="" style={{ width:60,height:60,objectFit:'cover',borderRadius:8,border:'1px solid var(--border)',marginBottom:6,display:'block' }} />}
                <label style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',border:'1.5px dashed var(--border)',borderRadius:8,cursor:'pointer',fontSize:'.8rem',color:'var(--muted)' }}>
                  <Camera size={12} /> {s.newImagePreview ? 'Change' : 'Upload'}
                  <input type="file" accept="image/*" onChange={e => handleServiceImage(i, e)} style={{ display:'none' }} />
                </label>
              </div>
            </div>
          ))}
          {services.length < 6 && (
            <button type="button" onClick={addService} style={{ width:'100%',padding:10,border:'1.5px dashed var(--border)',borderRadius:10,background:'transparent',color:'var(--muted)',cursor:'pointer',fontSize:'.85rem',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
              <Plus size={14} /> Add Service
            </button>
          )}

          {error && <div style={{ background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:10,padding:'12px 16px',color:'#ef4444',fontSize:'.85rem',marginTop:16 }}>{error}</div>}

          <div style={{ display:'flex',gap:10,marginTop:24 }}>
            <button type="button" onClick={onCancel} className="btn btn-outline" style={{ flex:1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex:2 }} disabled={saving}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
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
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontWeight:800,fontSize:'.95rem',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border)' }}>{title}</h3>
      {children}
    </div>
  );
}

function SideCard({ title, children }) {
  return (
    <div className="card" style={{ padding:14 }}>
      <div style={{ fontWeight:800,fontSize:'.88rem',marginBottom:12 }}>{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="info-row">
      <Icon size={14} className="info-icon" />
      <div>
        <div className="info-label">{label}</div>
        <div className="info-value" style={{ fontSize:'.83rem' }}>{value}</div>
      </div>
    </div>
  );
}
