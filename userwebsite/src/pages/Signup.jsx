import { useState, useRef, useEffect, useCallback } from 'react';
import { User, Phone, ArrowRight, Upload, Camera } from 'lucide-react';
import {
  memberCheckPhone, memberLookupEpic, memberSendOtp, memberVerifyOtp,
  memberUploadPhoto, memberSignup,
} from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNav } from '../App.jsx';

/* ── Sub-categories ── */
const SUB_CATEGORIES = {
  'Hospitals & Clinics': ['Multi-specialty Hospitals','Dental Clinics','Eye Hospitals','Orthopaedic Hospitals','Maternity Hospitals',"Children's Hospitals",'ENT Clinics','Mental Health Hospitals','Veterinary Hospitals','Nursing Homes'],
  'Transport': ['Cab Services','Bus Tickets','Bike Services','Travels & Tour Operators','Vehicle Transport','All Vehicle Service Centres','Drivers on Hire'],
  'Education': ['Pre-KG & Child Care','Schools','Colleges & Universities','Tuition Centres','Engineering & Medical Colleges','Music, Art & Language Classes','Yoga Classes'],
  'Real Estate': ['Plots & Lands','Independent Houses','Villas','Buy / Sell / Rent','PG, Hostels & Rooms','Real Estate Agents & Builders'],
  'Hotels & Restaurants': ['5-Star & 3-Star Hotels','Veg & Non-Veg Restaurants','Fast Food & Biryani Shops','Coffee Shops & Cafes','Dhaba & Tandoori','Resorts & Guest Houses'],
  'Electricals & Electronics': ['Electrical Shops','Electronics Showrooms','Electricians','Plumbing & Water Treatment','Solar Power Plants','Hardware Stores'],
  'Automobile': ['Car & Bike Sales','Auto Parts & Accessories','Vehicle Tyres & Batteries','Wash, Polish & Detailing'],
  'Textiles & Garments': ['Ladies Wear',"Men's Wear",'Kids Wear','Handloom & Fabrics','Ready-made Garment Retailers'],
  'Daily Needs': ['Grocery & Supermarkets','Fruits & Vegetable Shops','Bakeries & Milk Shops','Fish & Meat Shops','Juice Bars & Drinking Water'],
  'Digital & IT Products': ['Computer Sales & Service','Laptop Sales & Service','CCTV & Security Systems','Mobile Repairs','Software Solutions'],
  'Banking & Finance': ['Home Loans','Personal & Car Loans','Business & Educational Loans','Insurance Agents','LIC Agency'],
  'Doctors': ['General Physicians','Dentists','Dermatologists','Gynaecologists','Paediatricians','Orthopaedic Specialists'],
  'Jewellery': ['Jewellery Showrooms','Gold & Diamond Stores','Handmade Jewellery'],
  'Agriculture': ['Seeds & Trees','Fertilizers & Organic Products','Vegetables & Fruits','Agricultural Equipment'],
  'Other': ['Other Services'],
};

const CATEGORIES = Object.keys(SUB_CATEGORIES);
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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
      {[0,1,2,3].map(i => (
        <input key={i} ref={refs[i]} type="password" inputMode="numeric" maxLength={1}
          value={digits[i] === ' ' ? '' : (digits[i] || '')}
          onChange={e => handleChange(i, e)} onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste}
          disabled={disabled}
          style={{ width:52,height:60,border:'2px solid var(--color-subtle-ash)',borderRadius:12,
            background:'var(--color-subtle-ash)',fontSize:'1.5rem',fontWeight:700,textAlign:'center',
            color:'var(--color-rich-black)',outline:'none',transition:'border-color .15s' }}
          onFocus={e=>(e.target.style.borderColor='var(--color-deep-fern-green)')}
          onBlur={e=>(e.target.style.borderColor='var(--color-subtle-ash)')} />
      ))}
    </div>
  );
}

/* ── OTP boxes ── */
function OtpBoxes({ value, onChange, disabled }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const digits = (value || '      ').split('').slice(0, 6);
  const handleChange = (idx, e) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = [...digits]; arr[idx] = ch;
    onChange(arr.join('').trimEnd());
    if (ch && idx < 5) refs[idx + 1].current?.focus();
  };
  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs[idx - 1].current?.focus();
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(text);
    refs[Math.min(text.length, 5)].current?.focus();
  };
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[0,1,2,3,4,5].map(i => (
        <input key={i} ref={refs[i]} type="tel" inputMode="numeric" maxLength={1}
          value={digits[i] === ' ' ? '' : (digits[i] || '')}
          onChange={e => handleChange(i, e)} onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste}
          disabled={disabled}
          style={{ width:44,height:52,border:'2px solid var(--color-subtle-ash)',borderRadius:10,
            background:'var(--color-subtle-ash)',fontSize:'1.25rem',fontWeight:700,textAlign:'center',
            color:'var(--color-rich-black)',outline:'none',transition:'border-color .15s' }}
          onFocus={e=>(e.target.style.borderColor='var(--color-deep-fern-green)')}
          onBlur={e=>(e.target.style.borderColor='var(--color-subtle-ash)')} />
      ))}
    </div>
  );
}

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
const fieldStyle = { marginBottom:18 };

/* ── Steps:
   1 = EPIC choice (have EPIC / no EPIC)
   2 = EPIC lookup (if hasEpic)
   3 = Mobile number (WhatsApp)
   4 = OTP verification
   5 = Personal details (DOB, blood group, address, photo)
   6 = Business info (optional)
   7 = PIN setup + confirm
   8 = Success
── */
export default function Signup() {
  const { memberLogin } = useAuth();
  const { navigate } = useNav();

  const [step, setStep]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Step 1 — EPIC choice
  const [hasEpic, setHasEpic]   = useState(null); // true | false

  // Step 2 — EPIC lookup result
  const [epicInput, setEpicInput]   = useState('');
  const [epicData, setEpicData]     = useState(null); // voter data from DB
  const [epicLookupDone, setEpicLookupDone] = useState(false);

  // Step 3 — phone
  const [phone, setPhone]       = useState('');
  const [phoneCheck, setPhoneCheck] = useState(null); // null|'checking'|'ok'|'exists'

  // Manual name/district/assembly (for no-EPIC path)
  const [manualName, setManualName] = useState('');
  const [manualDistrict, setManualDistrict] = useState('');
  const [manualAssembly, setManualAssembly] = useState('');
  const [assemblies, setAssemblies] = useState([]);
  const [districtMap, setDistrictMap] = useState({});

  // Step 4 — OTP
  const [otp, setOtp]           = useState('');
  const [otpSent, setOtpSent]   = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Step 5 — personal details
  const [dob, setDob]           = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [photoFile, setPhotoFile]   = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoUrl, setPhotoUrl]     = useState('');
  const [photoPublicId, setPhotoPublicId] = useState('');
  const photoRef = useRef();

  // Step 6 — business
  const [bizName, setBizName]   = useState('');
  const [bizCategory, setBizCategory] = useState('');
  const [bizSubCat, setBizSubCat] = useState('');
  const [skipBiz, setSkipBiz]   = useState(false);

  // Step 7 — PIN
  const [pin, setPin]           = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Final member data after signup
  const [signedMember, setSignedMember] = useState(null);

  /* ── Load district map ── */
  useEffect(() => {
    const base = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');
    fetch(`${base}/public/districts`).then(r => r.json()).then(data => {
      if (data?.map && typeof data.map === 'object') setDistrictMap(data.map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!manualDistrict) { setAssemblies([]); setManualAssembly(''); return; }
    setAssemblies(districtMap[manualDistrict] || []);
    setManualAssembly('');
  }, [manualDistrict, districtMap]);

  /* ── OTP cooldown timer ── */
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  /* ── Derived: name from EPIC or manual ── */
  const memberName  = epicData?.name || manualName;
  const memberDistrict = epicData?.district || manualDistrict;
  const memberAssembly = epicData?.assembly_name || manualAssembly;
  const memberZone  = epicData?.zone || '';

  /* ── Phone availability check ── */
  const checkPhone = async (digits) => {
    if (digits.length < 10) { setPhoneCheck(null); return; }
    setPhoneCheck('checking');
    try {
      const r = await memberCheckPhone(digits);
      setPhoneCheck(r.data.exists ? 'exists' : 'ok');
    } catch { setPhoneCheck(null); }
  };

  /* ── Calculate age from DOB ── */
  const calcAge = (dobStr) => {
    if (!dobStr) return '';
    try {
      const d = new Date(dobStr);
      if (isNaN(d.getTime())) return '';
      const today = new Date();
      let age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
      return age > 0 ? `${age} years` : '';
    } catch { return ''; }
  };

  /* ── Step handlers ── */
  const handleEpicChoice = (choice) => {
    setHasEpic(choice);
    setError('');
    setStep(2);
  };

  const handleEpicLookup = async (e) => {
    e.preventDefault();
    setError('');
    if (!epicInput.trim()) { setError('Enter your EPIC number.'); return; }
    setLoading(true);
    try {
      const r = await memberLookupEpic(epicInput.trim());
      setEpicData(r.data.voter);
      setEpicLookupDone(true);
      setError('');
    } catch (err) {
      const msg = err?.response?.data?.message || 'EPIC not found.';
      setError(msg);
    } finally { setLoading(false); }
  };

  const handleStep2Continue = (e) => {
    e?.preventDefault();
    setError('');
    if (hasEpic) {
      if (!epicLookupDone) { setError('Please validate your EPIC first.'); return; }
    } else {
      if (!manualName.trim()) { setError('Please enter your name.'); return; }
      if (!manualDistrict) { setError('Please select your district.'); return; }
      if (!manualAssembly) { setError('Please select your assembly.'); return; }
    }
    setStep(3);
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    if (phoneCheck === 'exists') { setError('This number is already registered. Please login.'); return; }
    // Send OTP
    setLoading(true);
    try {
      await memberSendOtp(digits);
      setOtpSent(true);
      setOtpCooldown(60);
      setStep(4);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (otpCooldown > 0) return;
    const digits = phone.replace(/\D/g, '');
    setLoading(true);
    try {
      await memberSendOtp(digits);
      setOtpCooldown(60);
      setError('');
    } catch (err) {
      setError('Failed to resend OTP.');
    } finally { setLoading(false); }
  };

  const handleStep4 = async (e) => {
    e.preventDefault();
    setError('');
    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length < 6) { setError('Enter the 6-digit OTP.'); return; }
    setLoading(true);
    try {
      await memberVerifyOtp(phone.replace(/\D/g, ''), cleanOtp);
      setStep(5);
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setPhotoUrl('');
    setPhotoPublicId('');
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('photo', photoFile);
      fd.append('phone', phone.replace(/\D/g, ''));
      const r = await memberUploadPhoto(fd);
      setPhotoUrl(r.data.url);
      setPhotoPublicId(r.data.publicId);
    } catch (err) {
      setError('Photo upload failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleStep5 = async (e) => {
    e.preventDefault();
    setError('');
    if (!dob) { setError('Date of birth is required.'); return; }
    if (!bloodGroup) { setError('Please select your blood group.'); return; }
    if (!businessAddress.trim()) { setError('Business address is required.'); return; }
    // Upload photo if selected but not yet uploaded
    if (photoFile && !photoUrl) {
      await handlePhotoUpload();
      if (!photoUrl) { setError('Please wait for photo upload to complete.'); return; }
    }
    setStep(6);
  };

  const handleStep6 = (e) => { e.preventDefault(); setStep(7); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanPin = pin.replace(/\D/g, '');
    const cleanConfirm = confirmPin.replace(/\D/g, '');
    if (cleanPin.length < 4) { setError('PIN must be 4 digits.'); return; }
    if (cleanPin !== cleanConfirm) { setError('PINs do not match.'); return; }

    // If photo was selected but not uploaded yet, upload now
    let finalPhotoUrl = photoUrl;
    let finalPhotoPublicId = photoPublicId;
    if (photoFile && !finalPhotoUrl) {
      setLoading(true);
      try {
        const fd = new FormData();
        fd.append('photo', photoFile);
        fd.append('phone', phone.replace(/\D/g, ''));
        const r = await memberUploadPhoto(fd);
        finalPhotoUrl = r.data.url;
        finalPhotoPublicId = r.data.publicId;
        setPhotoUrl(finalPhotoUrl);
        setPhotoPublicId(finalPhotoPublicId);
      } catch {
        setError('Photo upload failed. Please try again.');
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      // Convert HTML date input (YYYY-MM-DD) to DD/MM/YYYY
      const dobFormatted = dob
        ? dob.split('-').reverse().join('/')
        : '';

      const payload = {
        hasEpic: !!hasEpic,
        epicNo:   hasEpic ? epicInput.trim().toUpperCase() : '',
        name:     memberName,
        phone:    phone.replace(/\D/g, ''),
        secondaryPhone: epicData?.mobile || '',
        district: memberDistrict,
        assemblyName: memberAssembly,
        assemblyNo:   epicData?.assembly_no || '',
        zone:     memberZone,
        dob:      dobFormatted,
        bloodGroup,
        gender:   epicData?.gender || '',
        businessAddress: businessAddress.trim(),
        photoUrl: finalPhotoUrl,
        photoPublicId: finalPhotoPublicId,
        bizName:     (!skipBiz && bizName.trim()) ? bizName.trim() : '',
        bizCategory: bizCategory || '',
        bizSubCat:   bizSubCat   || '',
        pin:        cleanPin,
        confirmPin: cleanConfirm,
      };

      const r = await memberSignup(payload);
      const sessionData = { member: r.data.member, business: r.data.business };
      memberLogin(sessionData);
      setSignedMember(r.data.member);
      setStep(8);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Signup failed.';
      if (err?.response?.data?.error === 'phone_exists') {
        setStep(3);
        setError('This number is already registered. Please login instead.');
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  const TN_DISTRICTS = [
    'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul',
    'Erode','Kallakurichi','Kancheepuram','Kanyakumari','Karur','Krishnagiri','Madurai',
    'Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai',
    'Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi','Thanjavur','Theni',
    'Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupathur','Tiruppur','Tiruvallur',
    'Tiruvannamalai','Tiruvarur','Vellore','Villupuram','Virudhunagar',
  ];

  const totalSteps = 7;
  const progressPct = (step / totalSteps) * 100;
  const stepLabels = ['EPIC', 'EPIC/Profile', 'Mobile', 'OTP', 'Details', 'Business', 'PIN'];

  /* ── Render ── */
  return (
    <div className="container section" style={{ maxWidth:480 }}>
      {/* Back */}
      {step < 8 && (
        <div style={{ display:'flex',alignItems:'center',marginBottom:24 }}>
          <button onClick={() => { if (step > 1) setStep(s => s - 1); else navigate('home'); setError(''); }}
            style={{ background:'none',border:'none',color:'var(--color-cool-gray)',cursor:'pointer',
              fontSize:'14px',fontFamily:'var(--font-pp-neue-montreal)',display:'flex',alignItems:'center',gap:4 }}>
            ← {step > 1 ? 'Back' : 'Home'}
          </button>
        </div>
      )}

      {/* Header */}
      {step < 8 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ width:56,height:56,borderRadius:12,background:'var(--color-rich-black)',
            display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:16 }}>
            <User size={24} style={{ color:'var(--color-canvas-white)' }} />
          </div>
          <h1 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'28px',fontWeight:700,
            letterSpacing:'-0.02em',color:'var(--color-rich-black)',marginBottom:6 }}>
            Create Membership
          </h1>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',color:'var(--color-cool-gray)',fontSize:'14px',margin:0 }}>
            Step {Math.min(step, 7)} of {totalSteps} — {stepLabels[step - 1] || ''}
          </p>
        </div>
      )}

      {/* Progress */}
      {step < 8 && (
        <div style={{ height:4,background:'var(--color-subtle-ash)',borderRadius:99,marginBottom:24,overflow:'hidden' }}>
          <div style={{ height:'100%',width:`${Math.min(progressPct,100)}%`,
            background:'var(--color-deep-fern-green)',borderRadius:99,transition:'width .3s ease' }} />
        </div>
      )}

      {error && (
        <div style={{ background:'#fef2f2',border:'1px solid #fee2e2',borderRadius:12,
          padding:'12px 16px',color:'#ef4444',fontSize:'13px',marginBottom:20,
          fontFamily:'var(--font-pp-neue-montreal)' }}>
          ⚠ {error}
        </div>
      )}

      {/* ───── Step 1: EPIC Choice ───── */}
      {step === 1 && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',
          borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,
            color:'var(--color-rich-black)',marginBottom:8 }}>Do you have an EPIC card?</h2>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',color:'var(--color-cool-gray)',marginBottom:28 }}>
            EPIC (Electoral Photo Identity Card) helps us verify your voter details automatically.
          </p>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            <button onClick={() => handleEpicChoice(true)}
              style={{ padding:'16px 20px',border:'2px solid var(--color-deep-fern-green)',borderRadius:12,
                background:'var(--color-mint-green-glow)',cursor:'pointer',textAlign:'left',
                fontFamily:'var(--font-pp-neue-montreal)' }}>
              <div style={{ fontWeight:700,fontSize:'15px',color:'var(--color-deep-fern-green)',marginBottom:4 }}>
                ✅ Yes, I have an EPIC card
              </div>
              <div style={{ fontSize:'12px',color:'var(--color-cool-gray)' }}>
                Your name, district and assembly will be auto-filled from the voter database.
              </div>
            </button>
            <button onClick={() => handleEpicChoice(false)}
              style={{ padding:'16px 20px',border:'1px solid var(--color-subtle-ash)',borderRadius:12,
                background:'var(--color-canvas-white)',cursor:'pointer',textAlign:'left',
                fontFamily:'var(--font-pp-neue-montreal)' }}>
              <div style={{ fontWeight:600,fontSize:'15px',color:'var(--color-rich-black)',marginBottom:4 }}>
                ❌ I don't have an EPIC card
              </div>
              <div style={{ fontSize:'12px',color:'var(--color-cool-gray)' }}>
                No problem — you can fill in your details manually.
              </div>
            </button>
          </div>
          <p style={{ textAlign:'center',marginTop:24,fontFamily:'var(--font-pp-neue-montreal)',
            fontSize:'13px',color:'var(--color-cool-gray)' }}>
            Already have an account? <button type="button" onClick={() => navigate('login')}
              style={{ background:'none',border:'none',color:'var(--color-deep-fern-green)',cursor:'pointer',
                fontWeight:600,fontSize:'13px',padding:0 }}>Login</button>
          </p>
        </div>
      )}

      {/* ───── Step 2: EPIC lookup OR manual name/location ───── */}
      {step === 2 && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',
          borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          {hasEpic ? (
            <>
              <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,
                color:'var(--color-rich-black)',marginBottom:4 }}>Enter Your EPIC Number</h2>
              <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',
                color:'var(--color-cool-gray)',marginBottom:24 }}>
                Your EPIC number is printed on your voter ID card (e.g., TN1234567).
              </p>
              <form onSubmit={handleEpicLookup}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>EPIC Number *</label>
                  <input style={{ ...inputStyle,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600 }}
                    value={epicInput} onChange={e => { setEpicInput(e.target.value.toUpperCase()); setEpicLookupDone(false); setEpicData(null); setError(''); }}
                    placeholder="e.g. TN1234567" maxLength={15} />
                </div>
                <button type="submit" disabled={loading || !epicInput.trim()}
                  className="btn btn-primary btn-full" style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600 }}>
                  {loading ? 'Searching…' : 'Validate EPIC'}
                </button>
              </form>

              {epicLookupDone && epicData && (
                <div style={{ marginTop:20,padding:'16px',background:'var(--color-mint-green-glow)',
                  border:'1px solid var(--color-muted-sage)',borderRadius:12,
                  fontFamily:'var(--font-pp-neue-montreal)' }}>
                  <div style={{ fontSize:'12px',fontWeight:700,color:'var(--color-deep-fern-green)',
                    textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10 }}>
                    ✅ Voter Found
                  </div>
                  <div style={{ display:'grid',gap:6 }}>
                    <div style={{ fontSize:'13px',color:'var(--color-rich-black)' }}>
                      <strong>Name:</strong> {epicData.name}
                    </div>
                    <div style={{ fontSize:'13px',color:'var(--color-rich-black)' }}>
                      <strong>Assembly:</strong> {epicData.assembly_name}
                    </div>
                    <div style={{ fontSize:'13px',color:'var(--color-rich-black)' }}>
                      <strong>District:</strong> {epicData.district}
                    </div>
                    {epicData.zone && (
                      <div style={{ fontSize:'13px',color:'var(--color-rich-black)' }}>
                        <strong>Zone:</strong> {epicData.zone}
                      </div>
                    )}
                    {epicData.mobile && (
                      <div style={{ fontSize:'12px',color:'var(--color-cool-gray)',marginTop:4 }}>
                        📱 Voter DB mobile: {epicData.mobile} (will be saved as secondary)
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={handleStep2Continue}
                    className="btn btn-primary btn-full"
                    style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600,marginTop:16 }}>
                    Continue with this data <ArrowRight size={14} style={{ marginLeft:4 }} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,
                color:'var(--color-rich-black)',marginBottom:4 }}>Your Profile</h2>
              <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',
                color:'var(--color-cool-gray)',marginBottom:24 }}>
                Enter your name and location details.
              </p>
              <form onSubmit={handleStep2Continue}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Full Name *</label>
                  <input style={inputStyle} value={manualName}
                    onChange={e => setManualName(e.target.value)} placeholder="Your full name" required />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>District *</label>
                  <select style={{ ...inputStyle,paddingRight:36,appearance:'none',cursor:'pointer' }}
                    value={manualDistrict} onChange={e => setManualDistrict(e.target.value)} required>
                    <option value="">— Select District —</option>
                    {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Assembly / Area *</label>
                  <select style={{ ...inputStyle,paddingRight:36,appearance:'none',cursor:'pointer',opacity:!manualDistrict?0.5:1 }}
                    value={manualAssembly} onChange={e => setManualAssembly(e.target.value)}
                    required disabled={!manualDistrict}>
                    <option value="">— Select Assembly —</option>
                    {assemblies.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-full"
                  style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600 }}>
                  Continue <ArrowRight size={14} style={{ marginLeft:4 }} />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* ───── Step 3: Mobile Number ───── */}
      {step === 3 && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',
          borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,
            color:'var(--color-rich-black)',marginBottom:4 }}>WhatsApp Number</h2>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',
            color:'var(--color-cool-gray)',marginBottom:24 }}>
            This will be your primary login number. We'll send an OTP to verify.
          </p>
          <form onSubmit={handleStep3}>
            <div style={fieldStyle}>
              <label style={labelStyle}><Phone size={11} style={{ marginRight:4 }} />Mobile / WhatsApp Number *</label>
              <div style={{ position:'relative' }}>
                <input style={{ ...inputStyle,paddingRight:38 }} type="tel" inputMode="numeric" maxLength={15}
                  value={phone}
                  onChange={e => { setPhone(e.target.value); checkPhone(e.target.value.replace(/\D/g,'')); setError(''); }}
                  placeholder="10-digit mobile number" required />
                {phoneCheck === 'checking' && <span style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--color-cool-gray)' }}>…</span>}
                {phoneCheck === 'ok' && <span style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'var(--color-deep-fern-green)',fontSize:16 }}>✓</span>}
                {phoneCheck === 'exists' && <span style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'#ef4444',fontSize:16 }}>✕</span>}
              </div>
              {phoneCheck === 'exists' && (
                <p style={{ color:'#ef4444',fontSize:'12px',marginTop:6,fontFamily:'var(--font-pp-neue-montreal)' }}>
                  Number already registered. <button type="button" onClick={() => navigate('login')}
                    style={{ background:'none',border:'none',color:'var(--color-deep-fern-green)',cursor:'pointer',fontWeight:600,fontSize:'12px',padding:0 }}>
                    Login instead
                  </button>
                </p>
              )}
            </div>
            <button type="submit" disabled={loading || phoneCheck === 'exists'}
              className="btn btn-primary btn-full" style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600 }}>
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        </div>
      )}

      {/* ───── Step 4: OTP Verification ───── */}
      {step === 4 && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',
          borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,
            color:'var(--color-rich-black)',marginBottom:4 }}>Verify OTP</h2>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',
            color:'var(--color-cool-gray)',marginBottom:8 }}>
            Enter the 6-digit OTP sent to <strong>{phone.replace(/\D/g,'').slice(0,3)}…{phone.replace(/\D/g,'').slice(-3)}</strong>
          </p>
          <form onSubmit={handleStep4} style={{ marginTop:24 }}>
            <div style={{ marginBottom:24 }}>
              <OtpBoxes value={otp} onChange={setOtp} disabled={loading} />
            </div>
            <button type="submit" disabled={loading || otp.replace(/\D/g,'').length < 6}
              className="btn btn-primary btn-full" style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600 }}>
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
          </form>
          <div style={{ textAlign:'center',marginTop:16,fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',color:'var(--color-cool-gray)' }}>
            Didn't receive OTP?{' '}
            <button type="button" onClick={handleResendOtp} disabled={otpCooldown > 0 || loading}
              style={{ background:'none',border:'none',color:'var(--color-deep-fern-green)',cursor: otpCooldown > 0 ? 'default' : 'pointer',
                fontWeight:600,fontSize:'13px',padding:0,opacity: otpCooldown > 0 ? 0.5 : 1 }}>
              {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}

      {/* ───── Step 5: Personal Details ───── */}
      {step === 5 && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',
          borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,
            color:'var(--color-rich-black)',marginBottom:4 }}>Personal Details</h2>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',
            color:'var(--color-cool-gray)',marginBottom:24 }}>
            Fill in your profile information for the membership card.
          </p>
          <form onSubmit={handleStep5}>
            {/* DOB */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Date of Birth *</label>
              <input type="date" style={inputStyle} value={dob}
                onChange={e => setDob(e.target.value)} required max={new Date().toISOString().split('T')[0]} />
              {dob && <p style={{ fontSize:'12px',color:'var(--color-deep-fern-green)',marginTop:4,fontFamily:'var(--font-pp-neue-montreal)' }}>
                Age: {calcAge(dob)}
              </p>}
            </div>
            {/* Blood Group */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Blood Group *</label>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
                {BLOOD_GROUPS.map(bg => (
                  <button type="button" key={bg} onClick={() => setBloodGroup(bg)}
                    style={{ padding:'10px 0',borderRadius:10,border: bloodGroup === bg
                      ? '2px solid var(--color-deep-fern-green)'
                      : '1px solid var(--color-subtle-ash)',
                      background: bloodGroup === bg ? 'var(--color-mint-green-glow)' : 'var(--color-canvas-white)',
                      color: bloodGroup === bg ? 'var(--color-deep-fern-green)' : 'var(--color-rich-black)',
                      fontWeight: bloodGroup === bg ? 700 : 500,
                      fontSize:'14px',cursor:'pointer',fontFamily:'var(--font-pp-neue-montreal)' }}>
                    {bg}
                  </button>
                ))}
              </div>
            </div>
            {/* Business Address */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Business Address *</label>
              <textarea style={{ ...inputStyle,minHeight:80,resize:'vertical' }}
                value={businessAddress} onChange={e => setBusinessAddress(e.target.value)}
                placeholder="Your business / home address" required />
            </div>
            {/* Photo */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Profile Photo</label>
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:12 }}>
                {photoPreview ? (
                  <div style={{ position:'relative' }}>
                    <img src={photoPreview} alt="Preview"
                      style={{ width:100,height:100,borderRadius:12,objectFit:'cover',
                        border:'3px solid var(--color-deep-fern-green)' }} />
                    {photoUrl && (
                      <span style={{ position:'absolute',bottom:-8,right:-8,background:'var(--color-deep-fern-green)',
                        color:'#fff',borderRadius:'50%',width:22,height:22,display:'flex',
                        alignItems:'center',justifyContent:'center',fontSize:12 }}>✓</span>
                    )}
                  </div>
                ) : (
                  <div style={{ width:100,height:100,borderRadius:12,border:'2px dashed var(--color-subtle-ash)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    background:'var(--color-subtle-ash)' }}>
                    <Camera size={32} style={{ color:'var(--color-cool-gray)' }} />
                  </div>
                )}
                <input ref={photoRef} type="file" accept="image/*" style={{ display:'none' }}
                  onChange={handlePhotoSelect} />
                <div style={{ display:'flex',gap:8 }}>
                  <button type="button" onClick={() => photoRef.current?.click()}
                    style={{ padding:'8px 16px',border:'1px solid var(--color-subtle-ash)',borderRadius:10,
                      background:'var(--color-canvas-white)',cursor:'pointer',fontSize:'13px',
                      fontFamily:'var(--font-pp-neue-montreal)',display:'flex',alignItems:'center',gap:6 }}>
                    <Upload size={14} /> {photoPreview ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {photoFile && !photoUrl && (
                    <button type="button" onClick={handlePhotoUpload} disabled={loading}
                      style={{ padding:'8px 16px',border:'none',borderRadius:10,
                        background:'var(--color-deep-fern-green)',color:'#fff',
                        cursor:'pointer',fontSize:'13px',fontFamily:'var(--font-pp-neue-montreal)' }}>
                      {loading ? 'Uploading…' : 'Upload Now'}
                    </button>
                  )}
                </div>
                <p style={{ fontSize:'11px',color:'var(--color-cool-gray)',textAlign:'center',
                  fontFamily:'var(--font-pp-neue-montreal)',margin:0 }}>
                  Photo will appear on your membership card
                </p>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn btn-primary btn-full" style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600 }}>
              Continue <ArrowRight size={14} style={{ marginLeft:4 }} />
            </button>
          </form>
        </div>
      )}

      {/* ───── Step 6: Business Info (optional) ───── */}
      {step === 6 && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',
          borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,
            color:'var(--color-rich-black)',marginBottom:4 }}>
            Your Business <span style={{ fontSize:'12px',fontWeight:400,color:'var(--color-cool-gray)' }}>(optional)</span>
          </h2>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',
            color:'var(--color-cool-gray)',marginBottom:20 }}>
            Pre-fill your business details for easy listing later.
          </p>
          <form onSubmit={handleStep6}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16,
              padding:'12px 14px',background:'var(--color-subtle-ash)',borderRadius:10 }}>
              <input type="checkbox" id="skip-biz" checked={skipBiz} onChange={e => setSkipBiz(e.target.checked)}
                style={{ width:16,height:16,cursor:'pointer',accentColor:'var(--color-deep-fern-green)' }} />
              <label htmlFor="skip-biz" style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',
                color:'var(--color-rich-black)',cursor:'pointer',fontWeight:500 }}>
                Skip — I don't have a business right now
              </label>
            </div>
            {!skipBiz && (
              <>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Business Name</label>
                  <input style={inputStyle} value={bizName} onChange={e => setBizName(e.target.value)} placeholder="Your business name" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Category</label>
                  <select style={{ ...inputStyle,paddingRight:36,appearance:'none',cursor:'pointer' }}
                    value={bizCategory} onChange={e => { setBizCategory(e.target.value); setBizSubCat(''); }}>
                    <option value="">— Select Category —</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {bizCategory && SUB_CATEGORIES[bizCategory] && (
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Sub-Category</label>
                    <select style={{ ...inputStyle,paddingRight:36,appearance:'none',cursor:'pointer' }}
                      value={bizSubCat} onChange={e => setBizSubCat(e.target.value)}>
                      <option value="">— Select Sub-Category —</option>
                      {SUB_CATEGORIES[bizCategory].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}
            <button type="submit" className="btn btn-primary btn-full"
              style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600 }}>
              Continue <ArrowRight size={14} style={{ marginLeft:4 }} />
            </button>
          </form>
        </div>
      )}

      {/* ───── Step 7: PIN ───── */}
      {step === 7 && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',
          borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,
            color:'var(--color-rich-black)',marginBottom:4 }}>Set Your PIN</h2>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',
            color:'var(--color-cool-gray)',marginBottom:28 }}>
            Create a 4-digit security PIN to protect your account.
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:24 }}>
              <label style={{ ...labelStyle,textAlign:'center',display:'block',marginBottom:12 }}>Create PIN</label>
              <PinBoxes value={pin} onChange={setPin} disabled={loading} />
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ ...labelStyle,textAlign:'center',display:'block',marginBottom:12 }}>Confirm PIN</label>
              <PinBoxes value={confirmPin} onChange={setConfirmPin} disabled={loading} />
            </div>
            {/* Summary */}
            <div style={{ background:'var(--color-subtle-ash)',borderRadius:10,padding:'12px 14px',
              marginBottom:20,fontFamily:'var(--font-pp-neue-montreal)',fontSize:'12px',
              color:'var(--color-cool-gray)',lineHeight:1.6 }}>
              📝 <strong style={{ color:'var(--color-rich-black)' }}>{memberName}</strong>
              {' · '}{phone.replace(/\D/g,'')}
              {memberDistrict && ` · ${memberDistrict}`}
              {memberAssembly && `, ${memberAssembly}`}
              {bloodGroup && ` · Blood: ${bloodGroup}`}
            </div>
            <button type="submit" disabled={loading || pin.length < 4 || confirmPin.length < 4}
              className="btn btn-primary btn-full"
              style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600 }}>
              {loading ? 'Creating Account…' : '🎉 Complete Membership'}
            </button>
          </form>
        </div>
      )}

      {/* ───── Step 8: Success ───── */}
      {step === 8 && signedMember && (
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'4rem',marginBottom:16 }}>🎉</div>
          <h1 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'28px',fontWeight:700,
            color:'var(--color-rich-black)',marginBottom:8 }}>Welcome to Vanigan!</h1>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'15px',
            color:'var(--color-cool-gray)',marginBottom:24 }}>
            Your membership is active. ID:{' '}
            <strong style={{ color:'var(--color-deep-fern-green)',fontSize:'18px' }}>
              {signedMember.membershipId}
            </strong>
          </p>
          <div style={{ background:'var(--color-mint-green-glow)',border:'1px solid var(--color-muted-sage)',
            borderRadius:12,padding:20,marginBottom:28,fontFamily:'var(--font-pp-neue-montreal)' }}>
            <p style={{ fontSize:'13px',color:'var(--color-deep-fern-green)',fontWeight:600,margin:0 }}>
              🪪 Your membership card has been generated! View it from "My Card" in the menu.
            </p>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            <button onClick={() => navigate('membercard')}
              className="btn btn-primary btn-full" style={{ height:48,borderRadius:12,fontSize:'15px',fontWeight:700 }}>
              🪪 View My Membership Card
            </button>
            <button onClick={() => navigate('home')}
              className="btn btn-outline btn-full" style={{ height:44,borderRadius:12,fontSize:'14px' }}>
              Go to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
