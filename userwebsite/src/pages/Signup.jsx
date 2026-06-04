import { useState, useRef, useEffect } from 'react';
import { User, Phone, MapPin, ChevronDown, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { webSignup, webCheckPhone } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNav } from '../App.jsx';

/* ── Sub-categories data ── */
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
  'Courier Services': ['Local Courier','National Courier','International Courier','DTDC','Blue Dart','Professional Couriers'],
};

const CATEGORIES = Object.keys(SUB_CATEGORIES);

/* ── TN Districts (inline – no extra fetch needed) ── */
const TN_DISTRICTS = [
  'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul',
  'Erode','Kallakurichi','Kancheepuram','Kanyakumari','Karur','Krishnagiri','Madurai',
  'Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai',
  'Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi','Thanjavur','Theni',
  'Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupathur','Tiruppur','Tiruvallur',
  'Tiruvannamalai','Tiruvarur','Vellore','Villupuram','Virudhunagar',
];

/* ── 4-digit PIN input boxes ── */
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

/* ── Steps: profile → location → business → pin ── */
export default function Signup() {
  const { login } = useAuth();
  const { navigate } = useNav();

  const [step, setStep] = useState(1); // 1=profile, 2=location, 3=business(optional), 4=pin
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 fields
  const [name, setName]     = useState('');
  const [phone, setPhone]   = useState('');
  const [phoneCheck, setPhoneCheck] = useState(null); // null | 'checking' | 'ok' | 'exists'

  // Step 2 fields
  const [district, setDistrict]   = useState('');
  const [assembly, setAssembly]   = useState('');
  const [assemblies, setAssemblies] = useState([]);

  // Step 3 – business info (optional)
  const [bizName, setBizName]         = useState('');
  const [bizCategory, setBizCategory] = useState('');
  const [bizSubCat, setBizSubCat]     = useState('');
  const [skipBiz, setSkipBiz]         = useState(false);

  // Step 4 – PIN
  const [pin, setPin]               = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError]     = useState('');

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1px solid var(--color-subtle-ash)', borderRadius: 12,
    fontSize: '14px', fontFamily: 'var(--font-pp-neue-montreal)',
    color: 'var(--color-rich-black)', background: 'var(--color-canvas-white)',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
  };
  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 700,
    color: 'var(--color-cool-gray)', textTransform: 'uppercase',
    letterSpacing: '0.07em', marginBottom: 5,
    fontFamily: 'var(--font-pp-neue-montreal)',
  };
  const fieldStyle = { marginBottom: 18 };

  /* Check phone availability after user types */
  const checkPhone = async (digits) => {
    if (digits.length < 10) { setPhoneCheck(null); return; }
    setPhoneCheck('checking');
    try {
      const r = await webCheckPhone(digits);
      setPhoneCheck(r.data.exists ? 'exists' : 'ok');
    } catch { setPhoneCheck(null); }
  };

  /* Fetch full district→assembly map once, then filter locally */
  const [districtMap, setDistrictMap] = useState({});

  useEffect(() => {
    const base = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');
    fetch(`${base}/public/districts`)
      .then(r => r.json())
      .then(data => {
        // Response is { map: { "Chennai": [...], ... } }
        if (data?.map && typeof data.map === 'object') {
          setDistrictMap(data.map);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!district) { setAssemblies([]); setAssembly(''); return; }
    const list = districtMap[district] || [];
    setAssemblies(list);
    setAssembly('');
  }, [district, districtMap]);

  /* Validate step 1 */
  const handleStep1 = (e) => {
    e.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (digits.length < 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    if (phoneCheck === 'exists') { setError('This number is already registered. Please login.'); return; }
    setStep(2);
  };

  /* Validate step 2 */
  const handleStep2 = (e) => {
    e.preventDefault();
    setError('');
    if (!district) { setError('Please select your district.'); return; }
    if (!assembly) { setError('Please select your assembly / area.'); return; }
    setStep(3);
  };

  /* Step 3 – skip or continue to PIN */
  const handleStep3 = (e) => {
    e.preventDefault();
    setStep(4);
  };

  /* Final submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPinError('');
    const cleanPin     = pin.replace(/\D/g, '');
    const cleanConfirm = confirmPin.replace(/\D/g, '');
    if (cleanPin.length < 4)     { setPinError('PIN must be 4 digits.'); return; }
    if (cleanConfirm.length < 4) { setPinError('Please confirm your PIN.'); return; }
    if (cleanPin !== cleanConfirm) { setPinError('PINs do not match.'); return; }

    setLoading(true);
    try {
      const payload = {
        phone:      phone.replace(/\D/g, ''),
        name:       name.trim(),
        district,
        assembly,
        pin:        cleanPin,
        confirmPin: cleanConfirm,
      };
      if (!skipBiz && bizName.trim()) {
        payload.bizName     = bizName.trim();
        payload.bizCategory = bizCategory;
        payload.bizSubCat   = bizSubCat;
      }
      const r = await webSignup(payload);
      login(r.data);
      navigate('home');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Signup failed.';
      if (err?.response?.data?.error === 'phone_exists') {
        setStep(1);
        setError('This number is already registered. Please login instead.');
      } else {
        setPinError(msg);
      }
    } finally { setLoading(false); }
  };

  const steps = ['Profile', 'Location', 'Business', 'PIN'];
  const progressPct = (step / 4) * 100;

  return (
    <div className="container section" style={{ maxWidth: 480 }}>
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('home')}
          style={{ background: 'none', border: 'none', color: 'var(--color-cool-gray)', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-pp-neue-montreal)', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← {step > 1 ? 'Back' : 'Home'}
        </button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--color-rich-black)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <User size={24} style={{ color: 'var(--color-canvas-white)' }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '30px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-rich-black)', marginBottom: 6 }}>Create Account</h1>
        <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', color: 'var(--color-cool-gray)', fontSize: '14px', margin: 0 }}>
          Step {step} of 4 — {steps[step - 1]}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--color-subtle-ash)', borderRadius: 99, marginBottom: 28, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--color-deep-fern-green)', borderRadius: 99, transition: 'width .3s ease' }} />
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 12, padding: '12px 16px', color: '#ef4444', fontSize: '13px', marginBottom: 20, fontFamily: 'var(--font-pp-neue-montreal)' }}>
          ⚠ {error}
        </div>
      )}

      {/* ─── Step 1: Profile ─── */}
      {step === 1 && (
        <div className="card" style={{ padding: 28, background: 'var(--color-canvas-white)', borderRadius: 12, border: '1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '18px', fontWeight: 700, color: 'var(--color-rich-black)', marginBottom: 4 }}>Your Profile</h2>
          <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-cool-gray)', marginBottom: 24 }}>Enter your name and WhatsApp number.</p>
          <form onSubmit={handleStep1}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)}
                placeholder="Your full name" required />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>WhatsApp / Mobile Number *</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputStyle, paddingRight: 38 }}
                  type="tel" inputMode="numeric" maxLength={15}
                  value={phone}
                  onChange={e => { setPhone(e.target.value); checkPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
                  placeholder="10-digit mobile number" required />
                {phoneCheck === 'checking' && (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--color-cool-gray)' }}>…</span>
                )}
                {phoneCheck === 'ok' && (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-deep-fern-green)', fontSize: 16 }}>✓</span>
                )}
                {phoneCheck === 'exists' && (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#ef4444', fontSize: 16 }}>✕</span>
                )}
              </div>
              {phoneCheck === 'exists' && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: 6, fontFamily: 'var(--font-pp-neue-montreal)' }}>
                  Number already registered. <button type="button" onClick={() => navigate('login')} style={{ background: 'none', border: 'none', color: 'var(--color-deep-fern-green)', cursor: 'pointer', fontWeight: 600, fontSize: '12px', padding: 0 }}>Login instead</button>
                </p>
              )}
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ height: 44, borderRadius: 12, fontSize: '14px', fontWeight: 600 }}>
              Continue <ArrowRight size={14} style={{ marginLeft: 4 }} />
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-cool-gray)' }}>
            Already have an account? <button type="button" onClick={() => navigate('login')} style={{ background: 'none', border: 'none', color: 'var(--color-deep-fern-green)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', padding: 0 }}>Login</button>
          </p>
        </div>
      )}

      {/* ─── Step 2: Location ─── */}
      {step === 2 && (
        <div className="card" style={{ padding: 28, background: 'var(--color-canvas-white)', borderRadius: 12, border: '1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '18px', fontWeight: 700, color: 'var(--color-rich-black)', marginBottom: 4 }}>Your Location</h2>
          <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-cool-gray)', marginBottom: 24 }}>Select your district and assembly area.</p>
          <form onSubmit={handleStep2}>
            <div style={fieldStyle}>
              <label style={labelStyle}><MapPin size={11} style={{ marginRight: 4 }} />District *</label>
              <div style={{ position: 'relative' }}>
                <select style={{ ...inputStyle, paddingRight: 36, appearance: 'none', cursor: 'pointer' }}
                  value={district} onChange={e => setDistrict(e.target.value)} required>
                  <option value="">— Select District —</option>
                  {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-cool-gray)' }} />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Assembly / Area *</label>
              <div style={{ position: 'relative' }}>
                <select style={{ ...inputStyle, paddingRight: 36, appearance: 'none', cursor: 'pointer', opacity: !district ? 0.5 : 1 }}
                  value={assembly} onChange={e => setAssembly(e.target.value)} required disabled={!district}>
                  <option value="">— Select Assembly —</option>
                  {assemblies.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-cool-gray)' }} />
              </div>
              {district && assemblies.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--color-cool-gray)', marginTop: 6 }}>Loading areas…</p>
              )}
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ height: 44, borderRadius: 12, fontSize: '14px', fontWeight: 600 }}>
              Continue <ArrowRight size={14} style={{ marginLeft: 4 }} />
            </button>
          </form>
        </div>
      )}

      {/* ─── Step 3: Business (optional) ─── */}
      {step === 3 && (
        <div className="card" style={{ padding: 28, background: 'var(--color-canvas-white)', borderRadius: 12, border: '1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '18px', fontWeight: 700, color: 'var(--color-rich-black)', marginBottom: 4 }}>Your Business <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-cool-gray)' }}>(optional)</span></h2>
          <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-cool-gray)', marginBottom: 24 }}>Tell us about your business to pre-fill the registration form. You can add details later.</p>
          <form onSubmit={handleStep3}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 14px', background: 'var(--color-subtle-ash)', borderRadius: 10 }}>
              <input type="checkbox" id="skip-biz" checked={skipBiz} onChange={e => setSkipBiz(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--color-deep-fern-green)' }} />
              <label htmlFor="skip-biz" style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-rich-black)', cursor: 'pointer', fontWeight: 500 }}>
                I don't have a business / Skip this step
              </label>
            </div>

            {!skipBiz && (
              <>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Business Name</label>
                  <input style={inputStyle} value={bizName} onChange={e => setBizName(e.target.value)}
                    placeholder="Your business name" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Category</label>
                  <div style={{ position: 'relative' }}>
                    <select style={{ ...inputStyle, paddingRight: 36, appearance: 'none', cursor: 'pointer' }}
                      value={bizCategory} onChange={e => { setBizCategory(e.target.value); setBizSubCat(''); }}>
                      <option value="">— Select Category —</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-cool-gray)' }} />
                  </div>
                </div>
                {bizCategory && SUB_CATEGORIES[bizCategory] && (
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Sub-Category</label>
                    <div style={{ position: 'relative' }}>
                      <select style={{ ...inputStyle, paddingRight: 36, appearance: 'none', cursor: 'pointer' }}
                        value={bizSubCat} onChange={e => setBizSubCat(e.target.value)}>
                        <option value="">— Select Sub-Category —</option>
                        {SUB_CATEGORIES[bizCategory].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-cool-gray)' }} />
                    </div>
                  </div>
                )}
              </>
            )}

            <button type="submit" className="btn btn-primary btn-full" style={{ height: 44, borderRadius: 12, fontSize: '14px', fontWeight: 600 }}>
              Continue <ArrowRight size={14} style={{ marginLeft: 4 }} />
            </button>
          </form>
        </div>
      )}

      {/* ─── Step 4: PIN ─── */}
      {step === 4 && (
        <div className="card" style={{ padding: 28, background: 'var(--color-canvas-white)', borderRadius: 12, border: '1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '18px', fontWeight: 700, color: 'var(--color-rich-black)', marginBottom: 4 }}>Set Your PIN</h2>
          <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '13px', color: 'var(--color-cool-gray)', marginBottom: 28 }}>Create a 4-digit security PIN to protect your account. You'll use this PIN to login.</p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ ...labelStyle, textAlign: 'center', display: 'block', marginBottom: 12 }}>Create PIN</label>
              <PinBoxes value={pin} onChange={setPin} disabled={loading} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ ...labelStyle, textAlign: 'center', display: 'block', marginBottom: 12 }}>Confirm PIN</label>
              <PinBoxes value={confirmPin} onChange={setConfirmPin} disabled={loading} />
            </div>
            {pinError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 12, padding: '10px 14px', color: '#ef4444', fontSize: '13px', marginBottom: 16, textAlign: 'center', fontFamily: 'var(--font-pp-neue-montreal)' }}>
                {pinError}
              </div>
            )}
            <div style={{ background: 'var(--color-subtle-ash)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '12px', color: 'var(--color-cool-gray)', lineHeight: 1.5 }}>
              📝 Summary: <strong style={{ color: 'var(--color-rich-black)' }}>{name}</strong> · {phone.replace(/\D/g, '')} · {district}, {assembly}
              {!skipBiz && bizName && ` · ${bizName}`}
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || pin.length < 4 || confirmPin.length < 4}
              style={{ height: 44, borderRadius: 12, fontSize: '14px', fontWeight: 600 }}>
              {loading ? 'Creating Account…' : 'Create Account & Login'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
