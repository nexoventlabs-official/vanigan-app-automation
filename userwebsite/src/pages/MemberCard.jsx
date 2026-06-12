import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { useAuth } from '../context/AuthContext.jsx';
import { useNav } from '../App.jsx';

const FRONT_BG = 'https://res.cloudinary.com/dqndhcmu2/image/upload/v1773232516/vanigan/templates/ID_Front.png';
const BACK_BG  = 'https://res.cloudinary.com/dqndhcmu2/image/upload/v1773232519/vanigan/templates/ID_Back.png';

/* ─────────────────────────────────────────────────────────
   CardFront
   display prop: 'interactive' (3D face) | 'capture' (flat clone for html2canvas)
   capture clones use 421×590 (TNVS native size) for max quality
───────────────────────────────────────────────────────── */
function CardFront({ member, display = 'interactive' }) {
  const isCapture = display === 'capture';

  // Sizes scale with card dimensions
  const W = isCapture ? 421 : 320;
  const H = isCapture ? 590 : 480;
  const photoSize  = isCapture ? 137 : 110;
  const nameFSize  = isCapture ? 23  : 18;
  const detailFSize= isCapture ? 16  : 13;
  const idFSize    = isCapture ? 18  : 14;
  const tagFSize   = isCapture ? 10  : 8;

  return (
    <div style={{
      width: W, height: H,
      position: 'relative',
      borderRadius: isCapture ? 0 : 18,
      overflow: 'hidden',
      ...(isCapture ? {} : {
        backfaceVisibility: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }),
    }}>
      {/* Background — <img> tag so html2canvas captures it at full res */}
      <img
        src={FRONT_BG}
        crossOrigin="anonymous"
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'fill',
          display: 'block',
        }}
      />

      {/* Photo */}
      <div style={{
        position: 'absolute', top: '31%', left: '50%',
        transform: 'translateX(-50%)',
        width: photoSize, height: photoSize,
        zIndex: 1,
      }}>
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            crossOrigin="anonymous"
            alt={member.name}
            style={{ width: '100%', height: '100%', borderRadius: isCapture ? 22 : 16, objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            borderRadius: isCapture ? 22 : 16,
            background: 'rgba(0,146,69,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isCapture ? 52 : 40, fontWeight: 700, color: '#009245',
          }}>
            {(member.name || 'M').slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      {/* Text block */}
      <div style={{
        position: 'absolute', top: '57%', left: 0, right: 0, zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: isCapture ? 7 : 5, padding: `0 ${isCapture ? 20 : 14}px`,
      }}>
        <p style={{ margin: 0, fontFamily: 'Arial, sans-serif', fontWeight: 700,
          fontSize: nameFSize, color: '#009245', lineHeight: 1.1,
          textAlign: 'center', wordBreak: 'break-word' }}>
          {(member.name || '').toUpperCase()}
        </p>
        {member.assemblyName && (
          <p style={{ margin: 0, fontFamily: 'Arial, sans-serif', fontWeight: 700,
            fontSize: detailFSize, color: '#111', textAlign: 'center' }}>
            {member.assemblyName}{' '}
            <span style={{ display: 'inline-block', fontSize: tagFSize, fontWeight: 700,
              color: '#fff', background: '#009245', borderRadius: 3,
              padding: '1px 4px', marginLeft: 2, textTransform: 'uppercase' }}>Assm</span>
          </p>
        )}
        {member.district && (
          <p style={{ margin: 0, fontFamily: 'Arial, sans-serif', fontWeight: 700,
            fontSize: detailFSize, color: '#111', textAlign: 'center' }}>
            {member.district}{' '}
            <span style={{ display: 'inline-block', fontSize: tagFSize, fontWeight: 700,
              color: '#fff', background: '#009245', borderRadius: 3,
              padding: '1px 4px', marginLeft: 2, textTransform: 'uppercase' }}>Dist</span>
          </p>
        )}
        {member.zone && (
          <p style={{ margin: 0, fontFamily: 'Arial, sans-serif', fontWeight: 700,
            fontSize: detailFSize, color: '#111', textAlign: 'center' }}>
            {member.zone}
          </p>
        )}
        <p style={{ margin: 0, fontFamily: 'Arial, sans-serif', fontWeight: 700,
          fontSize: idFSize, letterSpacing: '0.3px', color: '#111', marginTop: 2 }}>
          {member.membershipId || 'TNV-000000'}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CardBack
   display prop: 'interactive' | 'capture'
───────────────────────────────────────────────────────── */
function CardBack({ member, display = 'interactive' }) {
  const isCapture = display === 'capture';

  const W = isCapture ? 421 : 320;
  const H = isCapture ? 590 : 480;

  const qrData = member.membershipId || 'TNV-000000';
  // Larger QR for capture card
  const qrSize = isCapture ? 120 : 90;
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize * 2}x${qrSize * 2}&data=${encodeURIComponent(qrData)}`;

  const formatDob = (dob) => {
    if (!dob) return '—';
    if (dob.includes('/')) {
      const [d, m, y] = dob.split('/');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${d} ${months[parseInt(m, 10) - 1] || m} ${y}`;
    }
    try {
      return new Date(dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dob; }
  };

  const addressRaw = member.businessAddress || '—';

  // Scale font sizes and heights with card size
  const scale     = isCapture ? 421 / 320 : 1;
  const labelFs   = Math.round(11 * scale);
  const sepFs     = Math.round(20 * scale);
  const valueFs   = Math.round(13 * scale);
  const addrFs    = Math.round(11 * scale);
  const rowH      = Math.round(20 * scale);
  const addrRowH  = Math.round(76 * scale);
  const signNameFs= Math.round(11 * scale);
  const signSmFs  = Math.round(9  * scale);
  const signW     = Math.round(80 * scale);
  const topPct    = '28%';
  const leftPx    = Math.round(22 * scale);
  const rightPx   = Math.round(20 * scale);
  const btmMT     = Math.round(22 * scale);
  const btmPad    = Math.round(6  * scale);

  const rowBase = {
    display: 'grid', gridTemplateColumns: '46% 6% 48%',
    alignItems: 'start', overflow: 'hidden',
  };

  return (
    <div style={{
      width: W, height: H,
      position: 'relative',
      borderRadius: isCapture ? 0 : 18,
      overflow: 'hidden',
      fontFamily: 'Arial, Helvetica, sans-serif',
      ...(isCapture ? {} : {
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }),
    }}>
      {/* Background — <img> tag for full-res capture */}
      <img
        src={BACK_BG}
        crossOrigin="anonymous"
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'fill',
          display: 'block',
        }}
      />

      {/* Content overlay */}
      <div style={{ position: 'absolute', top: topPct, left: leftPx, right: rightPx, zIndex: 1 }}>

        {/* Details rows */}
        <div>
          <div style={{ ...rowBase, height: rowH }}>
            <div style={{ fontSize: labelFs, fontWeight: 700, textTransform: 'uppercase', color: '#111' }}>DATE OF BIRTH</div>
            <div style={{ fontSize: sepFs, lineHeight: 0.65, textAlign: 'center', fontWeight: 700, color: '#111' }}>:</div>
            <div style={{ fontSize: valueFs, fontWeight: 700, lineHeight: 1.12, color: '#111' }}>{formatDob(member.dob)}</div>
          </div>

          <div style={{ ...rowBase, height: rowH }}>
            <div style={{ fontSize: labelFs, fontWeight: 700, textTransform: 'uppercase', color: '#111' }}>AGE</div>
            <div style={{ fontSize: sepFs, lineHeight: 0.65, textAlign: 'center', fontWeight: 700, color: '#111' }}>:</div>
            <div style={{ fontSize: valueFs, fontWeight: 700, lineHeight: 1.12, color: '#111' }}>{member.age || '—'}</div>
          </div>

          <div style={{ ...rowBase, height: rowH }}>
            <div style={{ fontSize: labelFs, fontWeight: 700, textTransform: 'uppercase', color: '#111' }}>BLOOD GROUP</div>
            <div style={{ fontSize: sepFs, lineHeight: 0.65, textAlign: 'center', fontWeight: 700, color: '#111' }}>:</div>
            <div style={{ fontSize: valueFs, fontWeight: 700, lineHeight: 1.12, color: '#111' }}>{member.bloodGroup || '—'}</div>
          </div>

          {/* ADDRESS — fixed height keeps gap consistent for short/long addresses */}
          <div style={{ ...rowBase, height: addrRowH }}>
            <div style={{ fontSize: labelFs, fontWeight: 700, textTransform: 'uppercase', color: '#111' }}>ADDRESS</div>
            <div style={{ fontSize: sepFs, lineHeight: 0.65, textAlign: 'center', fontWeight: 700, color: '#111' }}>:</div>
            <div style={{ fontSize: addrFs, fontWeight: 700, lineHeight: 1.12, wordBreak: 'break-word', color: '#111' }}>{addressRaw}</div>
          </div>

          <div style={{ ...rowBase, height: rowH, marginTop: 4 }}>
            <div style={{ fontSize: labelFs, fontWeight: 700, textTransform: 'uppercase', color: '#111' }}>CONTACT</div>
            <div style={{ fontSize: sepFs, lineHeight: 0.65, textAlign: 'center', fontWeight: 700, color: '#111' }}>:</div>
            <div style={{ fontSize: valueFs, fontWeight: 700, lineHeight: 1.12, color: '#111' }}>
              <span style={{ background: 'rgba(255,255,255,0.78)', display: 'inline-block', padding: '0 4px' }}>
                {member.phone || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* QR + Signature — pushed down, space-between */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginTop: btmMT, paddingLeft: btmPad, paddingRight: btmPad,
        }}>
          <div>
            <img
              src={qrUrl}
              crossOrigin="anonymous"
              width={qrSize} height={qrSize}
              alt="QR Code"
              style={{ display: 'block' }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <img
              src="/signature.png"
              crossOrigin="anonymous"
              alt="Signature"
              style={{ width: signW, height: 'auto', display: 'block', margin: '0 auto 2px' }}
            />
            <p style={{ margin: '2px 0 0', fontSize: signNameFs, fontWeight: 700, color: '#111', lineHeight: 1.2, textAlign: 'center' }}>
              SENTHIL KUMAR N
            </p>
            <p style={{ margin: 0, fontSize: signSmFs, fontWeight: 700, color: '#111', lineHeight: 1.15, textAlign: 'center' }}>
              Founder &amp; State President
            </p>
            <p style={{ margin: 0, fontSize: signSmFs, fontWeight: 700, color: '#111', lineHeight: 1.15, textAlign: 'center' }}>
              Tamilnadu Vanigargalin Sangamam
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Shared capture logic
   - Uses 421×590 clones (TNVS native card size) + scale:2
     → 842×1180 per card — crisp, true to original dimensions
   - Background uses <img> tag so html2canvas captures it
     at full native resolution (no blurry CSS background issue)
───────────────────────────────────────────────────────── */

// Wait for every <img> inside el to finish loading
function waitImages(el) {
  return new Promise((resolve) => {
    const imgs = Array.from(el.querySelectorAll('img'));
    if (!imgs.length) { resolve(); return; }
    let pending = imgs.length;
    const done = () => { if (--pending === 0) resolve(); };
    imgs.forEach(img => {
      if (img.complete && img.naturalWidth > 0) { done(); return; }
      img.addEventListener('load',  done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
    setTimeout(resolve, 10000); // safety timeout
  });
}

async function buildComboCanvas(frontEl, backEl) {
  const SCALE = 2; // 421*2=842px per side — high quality, reasonable file size

  await waitImages(frontEl);
  await waitImages(backEl);
  await new Promise(r => setTimeout(r, 800)); // let fonts & images settle

  const opts = {
    scale: SCALE,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 15000,
  };

  const frontCanvas = await html2canvas(frontEl, opts);
  await new Promise(r => setTimeout(r, 200));
  const backCanvas  = await html2canvas(backEl, opts);

  // Combine side-by-side (same as TNVS downloadCard('both'))
  const gap    = 60 * SCALE;
  const labelH = 24 * SCALE;
  const combo  = document.createElement('canvas');
  combo.width  = frontCanvas.width + gap + backCanvas.width;
  combo.height = Math.max(frontCanvas.height, backCanvas.height) + labelH;

  const ctx = combo.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, combo.width, combo.height);

  // Labels
  ctx.font      = `bold ${16 * SCALE}px Arial, sans-serif`;
  ctx.fillStyle = '#333333';
  ctx.textAlign = 'center';
  ctx.fillText('Front', frontCanvas.width / 2,                                15 * SCALE);
  ctx.fillText('Back',  frontCanvas.width + gap + backCanvas.width / 2,       15 * SCALE);

  // Cards
  ctx.drawImage(frontCanvas, 0,                       labelH);
  ctx.drawImage(backCanvas,  frontCanvas.width + gap, labelH);

  return combo;
}

/* ─────────────────────────────────────────────────────────
   Card3D — interactive flip card + buttons
───────────────────────────────────────────────────────── */
function Card3D({ member }) {
  const [flipped, setFlipped]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const [rotateX, setRotateX]   = useState(0);
  const [rotateY, setRotateY]   = useState(0);
  const [loading, setLoading]   = useState(false);
  const [loadMsg, setLoadMsg]   = useState('');

  const cardRef  = useRef(null);
  const frontRef = useRef(null);
  const backRef  = useRef(null);
  const lastPos  = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2))  / (rect.width  / 2);
    const dy = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
    setRotateX(-dy * 12); setRotateY(dx * 12);
  };
  const handleMouseLeave = () => { setRotateX(0); setRotateY(0); };

  const handleTouchStart = (e) => {
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setDragging(true);
  };
  const handleTouchMove = (e) => {
    if (!dragging) return;
    const dx = (e.touches[0].clientX - lastPos.current.x) * 0.3;
    const dy = (e.touches[0].clientY - lastPos.current.y) * 0.3;
    setRotateY(v => Math.max(-30, Math.min(30, v + dx)));
    setRotateX(v => Math.max(-20, Math.min(20, v - dy)));
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = () => { setDragging(false); setRotateX(0); setRotateY(0); };

  /* Download — high-quality PNG, both sides side-by-side */
  const handleDownload = useCallback(async () => {
    if (!frontRef.current || !backRef.current) return;
    setLoading(true); setLoadMsg('Generating high-quality card…');
    try {
      const combo = await buildComboCanvas(frontRef.current, backRef.current);
      const uid   = member.membershipId || 'vanigan-card';
      const link  = document.createElement('a');
      link.download = `${uid}_card.png`;
      link.href = combo.toDataURL('image/png', 1.0); // no compression
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Download failed: ' + e.message);
    }
    setLoading(false); setLoadMsg('');
  }, [member]);

  /* Share — Web Share API with file, fallback to download */
  const handleShare = useCallback(async () => {
    if (!frontRef.current || !backRef.current) return;
    setLoading(true); setLoadMsg('Preparing to share…');
    try {
      const combo = await buildComboCanvas(frontRef.current, backRef.current);
      const uid   = member.membershipId || 'vanigan-card';

      if (navigator.canShare) {
        const blob = await new Promise(res => combo.toBlob(res, 'image/png', 1.0));
        const file = new File([blob], `${uid}_card.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: 'Vanigan Membership Card', text: `Membership ID: ${uid}`, files: [file] });
          setLoading(false); setLoadMsg('');
          return;
        }
      }
      // Fallback — download
      const link = document.createElement('a');
      link.download = `${uid}_card.png`;
      link.href = combo.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      if (e.name !== 'AbortError') alert('Share failed: ' + e.message);
    }
    setLoading(false); setLoadMsg('');
  }, [member]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 14, display: 'inline-block',
            animation: 'kspin 1s linear infinite' }}>⟳</div>
          <p style={{ color: '#fff', fontFamily: 'Arial, sans-serif', fontSize: 14, fontWeight: 600 }}>{loadMsg}</p>
          <style>{`@keyframes kspin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/*
        Hidden high-res clones for html2canvas capture.
        421×590 = TNVS native card size.
        Using <img> tags for backgrounds (not CSS backgroundImage)
        so html2canvas captures them at full resolution.
      */}
      <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none', zIndex: -1, opacity: 0 }}>
        <div ref={frontRef} style={{ width: 421, height: 590, position: 'relative', overflow: 'hidden' }}>
          <CardFront member={member} display="capture" />
        </div>
        <div ref={backRef} style={{ width: 421, height: 590, position: 'relative', overflow: 'hidden', marginTop: 20 }}>
          <CardBack member={member} display="capture" />
        </div>
      </div>

      {/* Interactive 3D card (display size 320×480) */}
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

      {/* Download & Share buttons */}
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 320 }}>
        <button onClick={handleDownload} disabled={loading} style={{
          flex: 1, height: 46, borderRadius: 12, border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: 'linear-gradient(135deg, #009245 0%, #006d34 100%)',
          color: '#fff', fontFamily: 'var(--font-pp-neue-montreal)',
          fontSize: '14px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: loading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(0,146,69,0.35)',
        }}>
          ⬇ Download Card
        </button>
        <button onClick={handleShare} disabled={loading} style={{
          flex: 1, height: 46, borderRadius: 12,
          cursor: loading ? 'not-allowed' : 'pointer',
          background: '#fff', color: '#009245', border: '2px solid #009245',
          fontFamily: 'var(--font-pp-neue-montreal)',
          fontSize: '14px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: loading ? 0.7 : 1,
        }}>
          ↑ Share Card
        </button>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────── */
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

      <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-pp-neue-montreal)',
        fontSize: '12px', color: 'var(--color-cool-gray)', lineHeight: 1.5 }}>
        💡 Use Download Card for a high-quality image of both sides.
      </p>
    </div>
  );
}
