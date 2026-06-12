import { useState, useRef, useEffect } from 'react';
import { User, Phone, ArrowRight, Upload, Camera } from 'lucide-react';
import {
  memberCheckPhone, memberLookupEpic, memberSendOtp, memberVerifyOtp,
  memberUploadPhoto, memberSignup,
} from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNav } from '../App.jsx';

/* ── Blood groups ── */
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const TN_DISTRICTS = [
  'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul',
  'Erode','Kallakurichi','Kancheepuram','Kanyakumari','Karur','Krishnagiri','Madurai',
  'Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai',
  'Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi','Thanjavur','Theni',
  'Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupathur','Tiruppur','Tiruvallur',
  'Tiruvannamalai','Tiruvarur','Vellore','Villupuram','Virudhunagar',
];

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
    <div style={{ display:'flex',gap:10,justifyContent:'center' }}>
      {[0,1,2,3].map(i => (
        <input key={i} ref={refs[i]} type="password" inputMode="numeric" maxLength={1}
          value={digits[i]===' '?'':(digits[i]||'')}
          onChange={e=>handleChange(i,e)} onKeyDown={e=>handleKeyDown(i,e)} onPaste={handlePaste}
          disabled={disabled}
          style={{width:52,height:60,border:'2px solid var(--color-subtle-ash)',borderRadius:12,
            background:'var(--color-subtle-ash)',fontSize:'1.5rem',fontWeight:700,textAlign:'center',
            color:'var(--color-rich-black)',outline:'none',transition:'border-color .15s'}}
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
    <div style={{display:'flex',gap:8,justifyContent:'center'}}>
      {[0,1,2,3,4,5].map(i=>(
        <input key={i} ref={refs[i]} type="tel" inputMode="numeric" maxLength={1}
          value={digits[i]===' '?'':(digits[i]||'')}
          onChange={e=>handleChange(i,e)} onKeyDown={e=>handleKeyDown(i,e)} onPaste={handlePaste}
          disabled={disabled}
          style={{width:44,height:52,border:'2px solid var(--color-subtle-ash)',borderRadius:10,
            background:'var(--color-subtle-ash)',fontSize:'1.25rem',fontWeight:700,textAlign:'center',
            color:'var(--color-rich-black)',outline:'none',transition:'border-color .15s'}}
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
  textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:5,fontFamily:'var(--font-pp-neue-montreal)',
};
const fieldStyle = { marginBottom:18 };

/*
  STEPS — EPIC path:
    1 → EPIC choice
    2 → EPIC lookup  (has EPIC)
    3 → Mobile number
    4 → OTP verify
    5 → Personal details (DOB, blood, address, photo)
    6 → PIN
    7 → Success

  NO-EPIC path:
    1 → EPIC choice
    2 → Name + Mobile + District + Assembly  (no EPIC)
    3 → OTP verify
    4 → Personal details (DOB, blood, address, photo)
    5 → PIN
    6 → Success
*/
export default function Signup() {
  const { memberLogin } = useAuth();
  const { navigate } = useNav();

  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Step 1
  const [hasEpic, setHasEpic] = useState(null);

  // EPIC path — step 2
  const [epicInput, setEpicInput]         = useState('');
  const [epicData, setEpicData]           = useState(null);
  const [epicLookupDone, setEpicLookupDone] = useState(false);

  // No-EPIC path — step 2 (combined profile + phone)
  const [manualName, setManualName]       = useState('');
  const [manualPhone, setManualPhone]     = useState('');
  const [manualPhoneCheck, setManualPhoneCheck] = useState(null);
  const [manualDistrict, setManualDistrict] = useState('');
  const [manualAssembly, setManualAssembly] = useState('');
  const [assemblies, setAssemblies]       = useState([]);
  const [districtMap, setDistrictMap]     = useState({});

  // EPIC path — step 3 (phone)
  const [phone, setPhone]           = useState('');
  const [phoneCheck, setPhoneCheck] = useState(null);

  // OTP
  const [otp, setOtp]                 = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Personal details
  const [dob, setDob]                   = useState('');
  const [bloodGroup, setBloodGroup]     = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [photoFile, setPhotoFile]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoUrl, setPhotoUrl]         = useState('');
  const [photoPublicId, setPhotoPublicId] = useState('');
  const photoRef = useRef();

  // PIN
  const [pin, setPin]             = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Final
  const [signedMember, setSignedMember] = useState(null);

  /* ── Load district map for no-EPIC path ── */
  useEffect(() => {
    const base = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');
    fetch(`${base}/public/districts`).then(r => r.json()).then(data => {
      if (data?.map) setDistrictMap(data.map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!manualDistrict) { setAssemblies([]); setManualAssembly(''); return; }
    setAssemblies(districtMap[manualDistrict] || []);
    setManualAssembly('');
  }, [manualDistrict, districtMap]);

  /* ── OTP cooldown ── */
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  /* ── Derived ── */
  // The phone we OTP-verify depends on path
  const activePhone = hasEpic ? phone : manualPhone;
  const memberName     = epicData?.name       || manualName;
  const memberDistrict = epicData?.district   || manualDistrict;
  const memberAssembly = epicData?.assembly_name || manualAssembly;
  const memberZone     = epicData?.zone       || '';

  /* ── Phone check helpers ── */
  const checkPhone = async (digits, setter) => {
    if (digits.length < 10) { setter(null); return; }
    setter('checking');
    try {
      const r = await memberCheckPhone(digits);
      setter(r.data.exists ? 'exists' : 'ok');
    } catch { setter(null); }
  };

  /* ── Age from DOB ── */
  const calcAge = (dobStr) => {
    if (!dobStr) return '';
    try {
      const d = new Date(dobStr);
      const today = new Date();
      let age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
      return age > 0 ? `${age} years` : '';
    } catch { return ''; }
  };

  /* ── Send OTP helper ── */
  const sendOtp = async (digits) => {
    await memberSendOtp(digits);
    setOtpCooldown(60);
  };

  /* ─────────────── HANDLERS ─────────────── */

  const handleEpicChoice = (choice) => {
    setHasEpic(choice); setError(''); setStep(2);
  };

  /* EPIC path: validate EPIC */
  const handleEpicLookup = async (e) => {
    e.preventDefault();
    setError('');
    if (!epicInput.trim()) { setError('Enter your EPIC number.'); return; }
    setLoading(true);
    try {
      const r = await memberLookupEpic(epicInput.trim());
      setEpicData(r.data.voter);
      setEpicLookupDone(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'EPIC not found. Please check and try again.');
    } finally { setLoading(false); }
  };

  /* EPIC path: step 2 → 3 (go to mobile number entry) */
  const handleEpicContinue = () => {
    setError('');
    if (!epicLookupDone) { setError('Please validate your EPIC first.'); return; }
    setStep(3);
  };

  /* EPIC path: step 3 (phone) → send OTP → step 4 */
  const handleEpicPhoneStep = async (e) => {
    e.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    if (phoneCheck === 'exists') { setError('This number is already registered. Please login.'); return; }
    setLoading(true);
    try {
      await sendOtp(digits);
      setStep(4);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  };

  /* No-EPIC path: step 2 (name + phone + district + assembly) → send OTP → step 3 */
  const handleNoEpicProfileStep = async (e) => {
    e.preventDefault();
    setError('');
    if (!manualName.trim()) { setError('Please enter your full name.'); return; }
    const digits = manualPhone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    if (manualPhoneCheck === 'exists') { setError('This number is already registered. Please login.'); return; }
    if (!manualDistrict) { setError('Please select your district.'); return; }
    if (!manualAssembly) { setError('Please select your assembly.'); return; }
    setLoading(true);
    try {
      await sendOtp(digits);
      setStep(3); // OTP step for no-EPIC path
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  };

  /* OTP verify — both paths */
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setError('');
    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length < 6) { setError('Enter the 6-digit OTP.'); return; }
    setLoading(true);
    try {
      await memberVerifyOtp(activePhone.replace(/\D/g, ''), cleanOtp);
      // After OTP: EPIC → step 5 (personal), No-EPIC → step 4 (personal)
      setStep(hasEpic ? 5 : 4);
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (otpCooldown > 0) return;
    setLoading(true);
    try {
      await sendOtp(activePhone.replace(/\D/g, ''));
      setError('');
    } catch { setError('Failed to resend OTP.'); }
    finally { setLoading(false); }
  };

  /* Photo select */
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUrl(''); setPhotoPublicId('');
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('photo', photoFile);
      fd.append('phone', activePhone.replace(/\D/g, ''));
      const r = await memberUploadPhoto(fd);
      setPhotoUrl(r.data.url);
      setPhotoPublicId(r.data.publicId);
    } catch { setError('Photo upload failed. Please try again.'); }
    finally { setLoading(false); }
  };

  /* Personal details → PIN */
  const handlePersonalStep = async (e) => {
    e.preventDefault();
    setError('');
    if (!dob) { setError('Date of birth is required.'); return; }
    if (!bloodGroup) { setError('Please select your blood group.'); return; }
    if (!businessAddress.trim()) { setError('Business address is required.'); return; }
    if (photoFile && !photoUrl) {
      await handlePhotoUpload();
    }
    // EPIC path: step 5 → 6 (PIN), No-EPIC path: step 4 → 5 (PIN)
    setStep(hasEpic ? 6 : 5);
  };

  /* Final submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanPin = pin.replace(/\D/g, '');
    const cleanConfirm = confirmPin.replace(/\D/g, '');
    if (cleanPin.length < 4) { setError('PIN must be 4 digits.'); return; }
    if (cleanPin !== cleanConfirm) { setError('PINs do not match.'); return; }

    let finalPhotoUrl = photoUrl;
    let finalPhotoPublicId = photoPublicId;
    if (photoFile && !finalPhotoUrl) {
      setLoading(true);
      try {
        const fd = new FormData();
        fd.append('photo', photoFile);
        fd.append('phone', activePhone.replace(/\D/g, ''));
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
      const dobFormatted = dob ? dob.split('-').reverse().join('/') : '';
      const payload = {
        hasEpic: !!hasEpic,
        epicNo:          hasEpic ? epicInput.trim().toUpperCase() : '',
        name:            memberName,
        phone:           activePhone.replace(/\D/g, ''),
        secondaryPhone:  epicData?.mobile || '',
        district:        memberDistrict,
        assemblyName:    memberAssembly,
        assemblyNo:      epicData?.assembly_no || '',
        zone:            memberZone,
        dob:             dobFormatted,
        bloodGroup,
        gender:          epicData?.gender || '',
        businessAddress: businessAddress.trim(),
        photoUrl:        finalPhotoUrl,
        photoPublicId:   finalPhotoPublicId,
        // No-EPIC members: no business pre-fill during signup
        bizName:     '',
        bizCategory: '',
        bizSubCat:   '',
        pin:         cleanPin,
        confirmPin:  cleanConfirm,
      };

      const r = await memberSignup(payload);
      memberLogin({ member: r.data.member, business: r.data.business });
      setSignedMember(r.data.member);
      // EPIC → step 7 success, No-EPIC → step 6 success
      setStep(hasEpic ? 7 : 6);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Signup failed.';
      if (err?.response?.data?.error === 'phone_exists') {
        setStep(hasEpic ? 3 : 2);
        setError('This number is already registered. Please login instead.');
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  /* ── Step labels per path ── */
  // EPIC: 1=Choice, 2=EPIC, 3=Mobile, 4=OTP, 5=Details, 6=PIN, 7=Done  (total 6 visible)
  // No-EPIC: 1=Choice, 2=Profile, 3=OTP, 4=Details, 5=PIN, 6=Done  (total 5 visible)
  const epicStepLabel  = ['', 'EPIC Choice', 'EPIC Verify', 'Mobile', 'OTP', 'Details', 'PIN'];
  const noEpicStepLabel= ['', 'EPIC Choice', 'Profile',    'OTP',    'Details', 'PIN', ''];
  const stepLabel = hasEpic === false ? noEpicStepLabel[step] || '' : epicStepLabel[step] || '';
  const totalSteps = hasEpic ? 6 : 5;
  const currentStepNum = Math.min(step, totalSteps);
  const progressPct = (currentStepNum / totalSteps) * 100;

  const successStep = hasEpic ? 7 : 6;

  /* ── Render ── */
  return (
    <div className="container section" style={{ maxWidth:480 }}>

      {/* Back */}
      {step < successStep && (
        <div style={{ display:'flex',alignItems:'center',marginBottom:24 }}>
          <button onClick={() => { if (step > 1) setStep(s => s - 1); else navigate('home'); setError(''); }}
            style={{ background:'none',border:'none',color:'var(--color-cool-gray)',cursor:'pointer',
              fontSize:'14px',fontFamily:'var(--font-pp-neue-montreal)',display:'flex',alignItems:'center',gap:4 }}>
            ← {step > 1 ? 'Back' : 'Home'}
          </button>
        </div>
      )}

      {/* Header */}
      {step < successStep && (
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
            {stepLabel ? `Step ${currentStepNum} of ${totalSteps} — ${stepLabel}` : ''}
          </p>
        </div>
      )}

      {/* Progress */}
      {step < successStep && (
        <div style={{ height:4,background:'var(--color-subtle-ash)',borderRadius:99,marginBottom:24,overflow:'hidden' }}>
          <div style={{ height:'100%',width:`${progressPct}%`,background:'var(--color-deep-fern-green)',
            borderRadius:99,transition:'width .3s ease' }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background:'#fef2f2',border:'1px solid #fee2e2',borderRadius:12,
          padding:'12px 16px',color:'#ef4444',fontSize:'13px',marginBottom:20,
          fontFamily:'var(--font-pp-neue-montreal)' }}>⚠ {error}</div>
      )}

      {/* ════════════ STEP 1 — EPIC Choice ════════════ */}
      {step === 1 && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,color:'var(--color-rich-black)',marginBottom:8 }}>
            Do you have an EPIC card?
          </h2>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',color:'var(--color-cool-gray)',marginBottom:28 }}>
            EPIC (Voter ID) helps us auto-fill your name, district and assembly from the voter database.
          </p>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            <button onClick={() => handleEpicChoice(true)}
              style={{ padding:'16px 20px',border:'2px solid var(--color-deep-fern-green)',borderRadius:12,
                background:'var(--color-mint-green-glow)',cursor:'pointer',textAlign:'left',fontFamily:'var(--font-pp-neue-montreal)' }}>
              <div style={{ fontWeight:700,fontSize:'15px',color:'var(--color-deep-fern-green)',marginBottom:4 }}>
                ✅ Yes, I have an EPIC / Voter ID card
              </div>
              <div style={{ fontSize:'12px',color:'var(--color-cool-gray)' }}>
                Name, district and assembly auto-filled from voter database.
              </div>
            </button>
            <button onClick={() => handleEpicChoice(false)}
              style={{ padding:'16px 20px',border:'1px solid var(--color-subtle-ash)',borderRadius:12,
                background:'var(--color-canvas-white)',cursor:'pointer',textAlign:'left',fontFamily:'var(--font-pp-neue-montreal)' }}>
              <div style={{ fontWeight:600,fontSize:'15px',color:'var(--color-rich-black)',marginBottom:4 }}>
                ❌ I don't have an EPIC card
              </div>
              <div style={{ fontSize:'12px',color:'var(--color-cool-gray)' }}>
                Fill in your details manually. You can link your EPIC later from your account.
              </div>
            </button>
          </div>
          <p style={{ textAlign:'center',marginTop:24,fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',color:'var(--color-cool-gray)' }}>
            Already have an account?{' '}
            <button type="button" onClick={() => navigate('login')}
              style={{ background:'none',border:'none',color:'var(--color-deep-fern-green)',cursor:'pointer',fontWeight:600,fontSize:'13px',padding:0 }}>
              Login
            </button>
          </p>
        </div>
      )}

      {/* ════════════ STEP 2 — EPIC path: EPIC lookup ════════════ */}
      {step === 2 && hasEpic && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,color:'var(--color-rich-black)',marginBottom:4 }}>
            Enter Your EPIC Number
          </h2>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',color:'var(--color-cool-gray)',marginBottom:24 }}>
            Printed on your Voter ID card (e.g., TN1234567).
          </p>
          <form onSubmit={handleEpicLookup}>
            <div style={fieldStyle}>
              <label style={labelStyle}>EPIC Number *</label>
              <input style={{ ...inputStyle,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600 }}
                value={epicInput}
                onChange={e => { setEpicInput(e.target.value.toUpperCase()); setEpicLookupDone(false); setEpicData(null); setError(''); }}
                placeholder="e.g. TN1234567" maxLength={15} />
            </div>
            <button type="submit" disabled={loading || !epicInput.trim()}
              className="btn btn-primary btn-full" style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600 }}>
              {loading ? 'Searching…' : 'Validate EPIC'}
            </button>
          </form>

          {epicLookupDone && epicData && (
            <div style={{ marginTop:20,padding:16,background:'var(--color-mint-green-glow)',
              border:'1px solid var(--color-muted-sage)',borderRadius:12,fontFamily:'var(--font-pp-neue-montreal)' }}>
              <div style={{ fontSize:'12px',fontWeight:700,color:'var(--color-deep-fern-green)',
                textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10 }}>✅ Voter Found</div>
              <div style={{ display:'grid',gap:5 }}>
                {[
                  ['Name',     epicData.name],
                  ['Assembly', epicData.assembly_name],
                  ['District', epicData.district],
                  ['Zone',     epicData.zone],
                ].filter(([,v])=>v).map(([k,v]) => (
                  <div key={k} style={{ fontSize:'13px',color:'var(--color-rich-black)' }}>
                    <strong>{k}:</strong> {v}
                  </div>
                ))}
                {epicData.mobile && (
                  <div style={{ fontSize:'12px',color:'var(--color-cool-gray)',marginTop:4 }}>
                    📱 Voter DB mobile: {epicData.mobile} (saved as secondary)
                  </div>
                )}
              </div>
              <button type="button" onClick={handleEpicContinue}
                className="btn btn-primary btn-full"
                style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600,marginTop:16 }}>
                Continue <ArrowRight size={14} style={{ marginLeft:4 }} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════ STEP 2 — No-EPIC path: Profile + Phone + Location ════════════ */}
      {step === 2 && !hasEpic && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,color:'var(--color-rich-black)',marginBottom:4 }}>
            Your Profile
          </h2>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',color:'var(--color-cool-gray)',marginBottom:24 }}>
            Enter your name, WhatsApp number and location.
          </p>
          <form onSubmit={handleNoEpicProfileStep}>
            {/* Name */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={manualName}
                onChange={e => setManualName(e.target.value)}
                placeholder="Your full name" required />
            </div>

            {/* Phone */}
            <div style={fieldStyle}>
              <label style={labelStyle}><Phone size={11} style={{ marginRight:4 }} />WhatsApp / Mobile Number *</label>
              <div style={{ position:'relative' }}>
                <input style={{ ...inputStyle,paddingRight:38 }} type="tel" inputMode="numeric" maxLength={15}
                  value={manualPhone}
                  onChange={e => { setManualPhone(e.target.value); checkPhone(e.target.value.replace(/\D/g,''), setManualPhoneCheck); setError(''); }}
                  placeholder="10-digit mobile number" required />
                {manualPhoneCheck === 'checking' && <span style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--color-cool-gray)' }}>…</span>}
                {manualPhoneCheck === 'ok'       && <span style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'var(--color-deep-fern-green)',fontSize:16 }}>✓</span>}
                {manualPhoneCheck === 'exists'   && <span style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'#ef4444',fontSize:16 }}>✕</span>}
              </div>
              {manualPhoneCheck === 'exists' && (
                <p style={{ color:'#ef4444',fontSize:'12px',marginTop:6,fontFamily:'var(--font-pp-neue-montreal)' }}>
                  Already registered.{' '}
                  <button type="button" onClick={() => navigate('login')}
                    style={{ background:'none',border:'none',color:'var(--color-deep-fern-green)',cursor:'pointer',fontWeight:600,fontSize:'12px',padding:0 }}>
                    Login instead
                  </button>
                </p>
              )}
            </div>

            {/* District */}
            <div style={fieldStyle}>
              <label style={labelStyle}>District *</label>
              <select style={{ ...inputStyle,paddingRight:36,appearance:'none',cursor:'pointer' }}
                value={manualDistrict} onChange={e => setManualDistrict(e.target.value)} required>
                <option value="">— Select District —</option>
                {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Assembly */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Assembly / Area *</label>
              <select style={{ ...inputStyle,paddingRight:36,appearance:'none',cursor:'pointer',opacity:!manualDistrict?0.5:1 }}
                value={manualAssembly} onChange={e => setManualAssembly(e.target.value)}
                required disabled={!manualDistrict}>
                <option value="">— Select Assembly —</option>
                {assemblies.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading || manualPhoneCheck === 'exists'}
              className="btn btn-primary btn-full" style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600 }}>
              {loading ? 'Sending OTP…' : 'Send OTP & Continue'}
            </button>
          </form>
        </div>
      )}

      {/* ════════════ STEP 3 — EPIC path: Mobile number ════════════ */}
      {step === 3 && hasEpic && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,color:'var(--color-rich-black)',marginBottom:4 }}>
            WhatsApp Number
          </h2>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',color:'var(--color-cool-gray)',marginBottom:24 }}>
            Enter your primary WhatsApp number. We'll send an OTP to verify.
          </p>
          <form onSubmit={handleEpicPhoneStep}>
            <div style={fieldStyle}>
              <label style={labelStyle}><Phone size={11} style={{ marginRight:4 }} />Mobile / WhatsApp *</label>
              <div style={{ position:'relative' }}>
                <input style={{ ...inputStyle,paddingRight:38 }} type="tel" inputMode="numeric" maxLength={15}
                  value={phone}
                  onChange={e => { setPhone(e.target.value); checkPhone(e.target.value.replace(/\D/g,''), setPhoneCheck); setError(''); }}
                  placeholder="10-digit mobile number" required />
                {phoneCheck === 'checking' && <span style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--color-cool-gray)' }}>…</span>}
                {phoneCheck === 'ok'       && <span style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'var(--color-deep-fern-green)',fontSize:16 }}>✓</span>}
                {phoneCheck === 'exists'   && <span style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'#ef4444',fontSize:16 }}>✕</span>}
              </div>
              {phoneCheck === 'exists' && (
                <p style={{ color:'#ef4444',fontSize:'12px',marginTop:6,fontFamily:'var(--font-pp-neue-montreal)' }}>
                  Already registered.{' '}
                  <button type="button" onClick={() => navigate('login')}
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

      {/* ════════════ OTP step — EPIC=4, NoEPIC=3 ════════════ */}
      {((hasEpic && step === 4) || (!hasEpic && step === 3)) && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,color:'var(--color-rich-black)',marginBottom:4 }}>
            Verify OTP
          </h2>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',color:'var(--color-cool-gray)',marginBottom:8 }}>
            Enter the 6-digit OTP sent to{' '}
            <strong>{activePhone.replace(/\D/g,'').slice(0,3)}…{activePhone.replace(/\D/g,'').slice(-3)}</strong>
          </p>
          <form onSubmit={handleOtpVerify} style={{ marginTop:24 }}>
            <div style={{ marginBottom:24 }}>
              <OtpBoxes value={otp} onChange={setOtp} disabled={loading} />
            </div>
            <button type="submit" disabled={loading || otp.replace(/\D/g,'').length < 6}
              className="btn btn-primary btn-full" style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600 }}>
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
          </form>
          <div style={{ textAlign:'center',marginTop:16,fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',color:'var(--color-cool-gray)' }}>
            Didn't receive?{' '}
            <button type="button" onClick={handleResendOtp} disabled={otpCooldown > 0 || loading}
              style={{ background:'none',border:'none',color:'var(--color-deep-fern-green)',cursor:otpCooldown > 0 ? 'default' : 'pointer',
                fontWeight:600,fontSize:'13px',padding:0,opacity:otpCooldown > 0 ? 0.5 : 1 }}>
              {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}

      {/* ════════════ Personal details — EPIC=5, NoEPIC=4 ════════════ */}
      {((hasEpic && step === 5) || (!hasEpic && step === 4)) && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,color:'var(--color-rich-black)',marginBottom:4 }}>
            Personal Details
          </h2>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',color:'var(--color-cool-gray)',marginBottom:24 }}>
            This information appears on your membership card.
          </p>
          <form onSubmit={handlePersonalStep}>
            {/* DOB */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Date of Birth *</label>
              <input type="date" style={inputStyle} value={dob}
                onChange={e => setDob(e.target.value)} required
                max={new Date().toISOString().split('T')[0]} />
              {dob && <p style={{ fontSize:'12px',color:'var(--color-deep-fern-green)',marginTop:4,fontFamily:'var(--font-pp-neue-montreal)' }}>
                Age: {calcAge(dob)}
              </p>}
            </div>

            {/* Blood group */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Blood Group *</label>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
                {BLOOD_GROUPS.map(bg => (
                  <button type="button" key={bg} onClick={() => setBloodGroup(bg)}
                    style={{ padding:'10px 0',borderRadius:10,
                      border: bloodGroup === bg ? '2px solid var(--color-deep-fern-green)' : '1px solid var(--color-subtle-ash)',
                      background: bloodGroup === bg ? 'var(--color-mint-green-glow)' : 'var(--color-canvas-white)',
                      color: bloodGroup === bg ? 'var(--color-deep-fern-green)' : 'var(--color-rich-black)',
                      fontWeight: bloodGroup === bg ? 700 : 500,
                      fontSize:'14px',cursor:'pointer',fontFamily:'var(--font-pp-neue-montreal)' }}>
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* Address */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Business / Home Address *</label>
              <textarea style={{ ...inputStyle,minHeight:80,resize:'vertical' }}
                value={businessAddress} onChange={e => setBusinessAddress(e.target.value)}
                placeholder="Your business or home address" required />
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
                    display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-subtle-ash)' }}>
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
                    <Upload size={14} /> {photoPreview ? 'Change' : 'Upload Photo'}
                  </button>
                  {photoFile && !photoUrl && (
                    <button type="button" onClick={handlePhotoUpload} disabled={loading}
                      style={{ padding:'8px 16px',border:'none',borderRadius:10,
                        background:'var(--color-deep-fern-green)',color:'#fff',
                        cursor:'pointer',fontSize:'13px',fontFamily:'var(--font-pp-neue-montreal)' }}>
                      {loading ? 'Uploading…' : 'Upload'}
                    </button>
                  )}
                </div>
                <p style={{ fontSize:'11px',color:'var(--color-cool-gray)',textAlign:'center',
                  fontFamily:'var(--font-pp-neue-montreal)',margin:0 }}>
                  Appears on your membership card
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

      {/* ════════════ PIN — EPIC=6, NoEPIC=5 ════════════ */}
      {((hasEpic && step === 6) || (!hasEpic && step === 5)) && (
        <div className="card" style={{ padding:28,background:'var(--color-canvas-white)',borderRadius:12,border:'1px solid var(--color-subtle-ash)' }}>
          <h2 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'18px',fontWeight:700,color:'var(--color-rich-black)',marginBottom:4 }}>
            Set Your PIN
          </h2>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'13px',color:'var(--color-cool-gray)',marginBottom:28 }}>
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
              {' · '}{activePhone.replace(/\D/g,'')}
              {memberDistrict && ` · ${memberDistrict}`}
              {memberAssembly && `, ${memberAssembly}`}
              {bloodGroup && ` · ${bloodGroup}`}
            </div>
            <button type="submit" disabled={loading || pin.length < 4 || confirmPin.length < 4}
              className="btn btn-primary btn-full"
              style={{ height:44,borderRadius:12,fontSize:'14px',fontWeight:600 }}>
              {loading ? 'Creating Account…' : '🎉 Complete Membership'}
            </button>
          </form>
        </div>
      )}

      {/* ════════════ SUCCESS — EPIC=7, NoEPIC=6 ════════════ */}
      {step === successStep && signedMember && (
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'4rem',marginBottom:16 }}>🎉</div>
          <h1 style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'28px',fontWeight:700,
            color:'var(--color-rich-black)',marginBottom:8 }}>Welcome to Vanigan!</h1>
          <p style={{ fontFamily:'var(--font-pp-neue-montreal)',fontSize:'15px',
            color:'var(--color-cool-gray)',marginBottom:24 }}>
            Membership ID:{' '}
            <strong style={{ color:'var(--color-deep-fern-green)',fontSize:'18px' }}>
              {signedMember.membershipId}
            </strong>
          </p>

          {!hasEpic && (
            <div style={{ background:'#fffbeb',border:'1px solid #fde68a',borderRadius:12,
              padding:16,marginBottom:20,fontFamily:'var(--font-pp-neue-montreal)',
              fontSize:'13px',color:'#92400e',lineHeight:1.6 }}>
              💡 <strong>Tip:</strong> You registered without an EPIC card. You can link your EPIC later
              from <strong>My Business → Link EPIC</strong> to upgrade your profile with voter-verified details
              and get a regenerated membership card.
            </div>
          )}

          <div style={{ background:'var(--color-mint-green-glow)',border:'1px solid var(--color-muted-sage)',
            borderRadius:12,padding:16,marginBottom:24,fontFamily:'var(--font-pp-neue-montreal)' }}>
            <p style={{ fontSize:'13px',color:'var(--color-deep-fern-green)',fontWeight:600,margin:0 }}>
              🪪 Your membership card is ready! View it from "My Card" in the menu.
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
