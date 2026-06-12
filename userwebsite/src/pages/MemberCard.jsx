import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNav } from '../App.jsx';

/* ── Card front face ── */
function CardFront({ member, isFlipped }) {
  const FRONT_BG = 'https://res.cloudinary.com/dqndhcmu2/image/upload/v1773232516/vanigan/templates/ID_Front.png';

  return (
    <div style={{
      position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
      borderRadius: 18, overflow: 'hidden',
      backgroundImage: `url(${FRONT_BG})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
    }}>
      {/* Photo */}
      <div style={{
        position: 'absolute', top: '31%', left: '50%',
        transform: 'translateX(-50%)',
        width: 110, height: 110,
      }}>
        {member.photoUrl ? (
          <img src={member.photoUrl} alt={member.name}
            style={{ width: '100%', height: '100%', borderRadius: 16,
              objectFit: 'cover', border: '4px solid #009245' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', borderRadius: 16,
            background: 'rgba(0,146,69,0.15)', border: '4px solid #009245',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, fontWeight: 700, color: '#009245' }}>
            {(member.name || 'M').slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      {/* Text block */}
      <div style={{
        position: 'absolute', top: '57%', left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 5, padding: '0 14px',
      }}>
        <p style={{ margin: 0, fontFamily: 'Arial, sans-serif', fontWeight: 700,
          fontSize: 18, color: '#009245', lineHeight: 1.1, textAlign: 'center',
          wordBreak: 'break-word' }}>
          {(member.name || '').toUpperCase()}
        </p>
        {member.assemblyName && (
          <p style={{ margin: 0, fontFamily: 'Arial, sans-serif', fontWeight: 700,
            fontSize: 13, color: '#111', textAlign: 'center' }}>
            {member.assemblyName}{' '}
            <span style={{ display: 'inline-block', fontSize: 8, fontWeight: 700,
              color: '#fff', background: '#009245', borderRadius: 3,
              padding: '1px 4px', marginLeft: 2, textTransform: 'uppercase' }}>Assm</span>
          </p>
        )}
        {member.district && (
          <p style={{ margin: 0, fontFamily: 'Arial, sans-serif', fontWeight: 700,
            fontSize: 13, color: '#111', textAlign: 'center' }}>
            {member.district}{' '}
            <span style={{ display: 'inline-block', fontSize: 8, fontWeight: 700,
              color: '#fff', background: '#009245', borderRadius: 3,
              padding: '1px 4px', marginLeft: 2, textTransform: 'uppercase' }}>Dist</span>
          </p>
        )}
        {member.zone && (
          <p style={{ margin: 0, fontFamily: 'Arial, sans-serif', fontWeight: 700,
            fontSize: 13, color: '#111', textAlign: 'center' }}>
            {member.zone}
          </p>
        )}
        <p style={{ margin: 0, fontFamily: 'Arial, sans-serif', fontWeight: 700,
          fontSize: 14, letterSpacing: '0.3px', color: '#111', marginTop: 2 }}>
          {member.membershipId || 'TNV-000000'}
        </p>
      </div>
    </div>
  );
}

/* ── Card back face — matches TNVS vanigam-id-card.html exactly ── */
function CardBack({ member }) {
  const BACK_BG = 'https://res.cloudinary.com/dqndhcmu2/image/upload/v1773232519/vanigan/templates/ID_Back.png';
  const qrData  = member.membershipId || 'TNV-000000';
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=96x88&data=${encodeURIComponent(qrData)}`;

  const formatDob = (dob) => {
    if (!dob) return '—';
    if (dob.includes('/')) {
      // DD/MM/YYYY → 01 Jan 1985
      const [d, m, y] = dob.split('/');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const mo = parseInt(m, 10);
      return `${d} ${months[mo - 1] || m} ${y}`;
    }
    try {
      const dt = new Date(dob);
      return dt.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
    } catch { return dob; }
  };

  // Truncate address to ~50 chars to fit the back card layout
  const addressRaw = member.businessAddress || '—';
  const address = addressRaw.length > 52 ? addressRaw.slice(0, 52) + '…' : addressRaw;

  return (
    <div style={{
      position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
      transform: 'rotateY(180deg)',
      borderRadius: 18, overflow: 'hidden',
      backgroundImage: `url(${BACK_BG})`,
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      fontFamily: 'Arial, Helvetica, sans-serif',
    }}>
      {/* back-content: top: 234px on original 590px card = ~39.6% */}
      <div style={{ position: 'absolute', top: '39.6%', left: 22, right: 20 }}>

        {/* back-details: translateY(-60px) equivalent for scaled card */}
        <div style={{ transform: 'translateY(-14px)' }}>

          {/* DATE OF BIRTH */}
          <div style={{ display:'grid', gridTemplateColumns:'46% 6% 48%', alignItems:'start', marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#111' }}>DATE OF BIRTH</div>
            <div style={{ fontSize: 20, lineHeight: 0.65, textAlign: 'center', fontWeight: 700, color: '#111' }}>:</div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.12, color: '#111' }}>{formatDob(member.dob)}</div>
          </div>

          {/* AGE */}
          <div style={{ display:'grid', gridTemplateColumns:'46% 6% 48%', alignItems:'start', marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#111' }}>AGE</div>
            <div style={{ fontSize: 20, lineHeight: 0.65, textAlign: 'center', fontWeight: 700, color: '#111' }}>:</div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.12, color: '#111' }}>{member.age || '—'}</div>
          </div>

          {/* BLOOD GROUP */}
          <div style={{ display:'grid', gridTemplateColumns:'46% 6% 48%', alignItems:'start', marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#111' }}>BLOOD GROUP</div>
            <div style={{ fontSize: 20, lineHeight: 0.65, textAlign: 'center', fontWeight: 700, color: '#111' }}>:</div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.12, color: '#111' }}>{member.bloodGroup || '—'}</div>
          </div>

          {/* ADDRESS — truncated to fit */}
          <div style={{ display:'grid', gridTemplateColumns:'46% 6% 48%', alignItems:'start', marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#111' }}>ADDRESS</div>
            <div style={{ fontSize: 20, lineHeight: 0.65, textAlign: 'center', fontWeight: 700, color: '#111' }}>:</div>
            <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.12, wordBreak: 'break-word', color: '#111' }}>{address}</div>
          </div>

          {/* CONTACT */}
          <div style={{ display:'grid', gridTemplateColumns:'46% 6% 48%', alignItems:'start', marginBottom: 0, marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#111' }}>CONTACT</div>
            <div style={{ fontSize: 20, lineHeight: 0.65, textAlign: 'center', fontWeight: 700, color: '#111' }}>:</div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.12, color: '#111' }}>
              <span style={{ background: 'rgba(255,255,255,0.78)', display: 'inline-block', padding: '0 4px' }}>
                {member.phone || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* bottom section: QR left (40%), Signature right (60%) */}
        <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', alignItems: 'start', marginTop: 6 }}>
          {/* QR Code */}
          <div style={{ paddingLeft: 14 }}>
            <img src={qrUrl} width={72} height={66} alt="QR Code"
              style={{ display: 'block' }} />
          </div>

          {/* Signature */}
          <div style={{ textAlign: 'center', paddingRight: 8, paddingTop: 0 }}>
            <img src="/signature.png" alt="Signature"
              style={{ height: 32, display: 'block', margin: '0 auto 2px' }} />
            <p style={{ margin: 0, fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: 10, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>
              SENTHIL KUMAR N
            </p>
            <p style={{ margin: 0, fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: 8, fontWeight: 700, color: '#111', lineHeight: 1.15 }}>
              Founder &amp; State President
            </p>
            <p style={{ margin: 0, fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: 8, fontWeight: 700, color: '#111', lineHeight: 1.15 }}>
              Tamilnadu Vanigargalin Sangamam
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── 3D Card ── */
function Card3D({ member }) {
  const [flipped, setFlipped]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const [rotateX, setRotateX]   = useState(0);
  const [rotateY, setRotateY]   = useState(0);
  const cardRef = useRef(null);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setRotateX(-dy * 12);
    setRotateY(dx * 12);
  };

  const handleMouseLeave = () => {
    setRotateX(0); setRotateY(0);
  };

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    lastPos.current = { x: t.clientX, y: t.clientY };
    setDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    const dx = (t.clientX - lastPos.current.x) * 0.3;
    const dy = (t.clientY - lastPos.current.y) * 0.3;
    setRotateY(v => Math.max(-30, Math.min(30, v + dx)));
    setRotateX(v => Math.max(-20, Math.min(20, v - dy)));
    lastPos.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = () => {
    setDragging(false);
    setRotateX(0); setRotateY(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {/* Card */}
      <div ref={cardRef}
        style={{ width: 320, height: 480, perspective: '1000px', cursor: 'pointer' }}
        onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        onClick={() => setFlipped(f => !f)}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          transformStyle: 'preserve-3d',
          transition: dragging ? 'none' : 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
          transform: `rotateX(${rotateX}deg) rotateY(${flipped ? 180 + rotateY : rotateY}deg)`,
        }}>
          <CardFront member={member} />
          <CardBack  member={member} />
        </div>
      </div>

      {/* Flip hint */}
      <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '12px',
        color: 'var(--color-cool-gray)', textAlign: 'center', margin: 0 }}>
        {flipped ? '↩ Click card to see front' : '↩ Click card to flip & see back'}
      </p>

      {/* Membership ID badge */}
      <div style={{ background: 'var(--color-mint-green-glow)', border: '2px solid var(--color-deep-fern-green)',
        borderRadius: 12, padding: '12px 24px', textAlign: 'center',
        fontFamily: 'var(--font-pp-neue-montreal)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-cool-gray)',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Membership ID
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-deep-fern-green)',
          letterSpacing: '0.05em' }}>
          {member.membershipId || 'TNV-000000'}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function MemberCard() {
  const { member, isLoggedIn } = useAuth();
  const { navigate } = useNav();

  if (!isLoggedIn || !member) {
    return (
      <div className="container section" style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🪪</div>
        <h1 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '24px', fontWeight: 700,
          color: 'var(--color-rich-black)', marginBottom: 12 }}>Membership Card</h1>
        <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '14px',
          color: 'var(--color-cool-gray)', marginBottom: 24 }}>
          Please log in to view your membership card.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => navigate('login')} className="btn btn-primary btn-full"
            style={{ height: 44, borderRadius: 12 }}>Login</button>
          <button onClick={() => navigate('signup')} className="btn btn-outline btn-full"
            style={{ height: 44, borderRadius: 12 }}>Sign Up & Get Your Card</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section" style={{ maxWidth: 480 }}>
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => navigate('home')}
          style={{ background: 'none', border: 'none', color: 'var(--color-cool-gray)', cursor: 'pointer',
            fontSize: '14px', fontFamily: 'var(--font-pp-neue-montreal)', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Home
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '26px', fontWeight: 700,
          color: 'var(--color-rich-black)', marginBottom: 6 }}>
          My Membership Card
        </h1>
        <p style={{ fontFamily: 'var(--font-pp-neue-montreal)', color: 'var(--color-cool-gray)',
          fontSize: '13px', margin: 0 }}>
          Tamilnadu Vanigargalin Sangamam
        </p>
      </div>

      <Card3D member={member} />

      {/* Member info summary */}
      <div style={{ marginTop: 28, background: 'var(--color-canvas-white)',
        border: '1px solid var(--color-subtle-ash)', borderRadius: 12, padding: 20,
        fontFamily: 'var(--font-pp-neue-montreal)' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'var(--color-cool-gray)', marginBottom: 16 }}>
          Member Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
          {[
            { label: 'Name',     value: member.name },
            { label: 'Phone',    value: member.phone },
            { label: 'District', value: member.district },
            { label: 'Assembly', value: member.assemblyName },
            { label: 'Zone',     value: member.zone },
            { label: 'Blood',    value: member.bloodGroup },
            { label: 'EPIC No.', value: member.epicNo || '—' },
            { label: 'DOB',      value: member.dob || '—' },
          ].filter(r => r.value).map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-cool-gray)',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-rich-black)',
                wordBreak: 'break-word' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Download hint */}
      <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-pp-neue-montreal)',
        fontSize: '12px', color: 'var(--color-cool-gray)', lineHeight: 1.5 }}>
        💡 Tip: Take a screenshot to save your card, or print this page.
      </p>
    </div>
  );
}
