import { useState, useRef } from 'react';
import { memberVerifyCard } from '../api.js';
import { Card3D } from './MemberCard.jsx';
import { useNav } from '../App.jsx';

/* ── 4-digit PIN boxes (same style as Login) ── */
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
          key={i}
          ref={refs[i]}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] === ' ' ? '' : (digits[i] || '')}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            width: 56, height: 64,
            border: '2px solid var(--color-subtle-ash)',
            borderRadius: 14,
            background: 'var(--color-canvas-white)',
            fontSize: '1.6rem', fontWeight: 700, textAlign: 'center',
            color: 'var(--color-rich-black)', outline: 'none',
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            fontFamily: 'var(--font-pp-neue-montreal)',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--color-deep-fern-green)';
            e.target.style.boxShadow = '0 0 0 4px rgba(34,197,94,0.12)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--color-subtle-ash)';
            e.target.style.boxShadow = 'none';
          }}
        />
      ))}
    </div>
  );
}

/* ── Member detail row ── */
function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div style={{
        fontSize: '10px', fontWeight: 700,
        color: 'var(--color-cool-gray)',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2,
        fontFamily: 'var(--font-pp-neue-montreal)',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '13px', fontWeight: 600,
        color: 'var(--color-rich-black)',
        wordBreak: 'break-word',
        fontFamily: 'var(--font-pp-neue-montreal)',
      }}>
        {value}
      </div>
    </div>
  );
}

export default function VerifyCard({ params = {} }) {
  const { navigate } = useNav();
  const membershipId = (params.id || '').toUpperCase().trim();

  const [pin, setPin]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [member, setMember]   = useState(null); // verified member data

  const handleVerify = async () => {
    if (pin.length < 4) { setError('Please enter your 4-digit PIN.'); return; }
    if (!membershipId)  { setError('Invalid QR code — no membership ID found.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await memberVerifyCard(membershipId, pin);
      setMember(res.data.member);
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === 'wrong_pin')  setError('Incorrect PIN. Please try again.');
      else if (code === 'not_found') setError('Membership ID not found. Please check the card.');
      else setError(err?.response?.data?.message || 'Verification failed. Please try again.');
    }
    setLoading(false);
  };

  /* ── Verified view ── */
  if (member) {
    return (
      <div className="container section" style={{ maxWidth: 500, paddingTop: 24 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
          <h1 style={{
            fontFamily: 'var(--font-pp-neue-montreal)',
            fontSize: '22px', fontWeight: 700,
            color: 'var(--color-rich-black)', marginBottom: 4,
          }}>
            {member.isOrganizer ? 'Verified Organizer' : 'Verified Member'}
          </h1>
          <p style={{
            fontFamily: 'var(--font-pp-neue-montreal)',
            fontSize: '13px', color: 'var(--color-cool-gray)', margin: 0,
          }}>
            Tamilnadu Vanigargalin Sangamam
          </p>
        </div>

        {/* 3D Card with flip, download & share */}
        <Card3D member={member} />

        {/* Member details */}
        <div style={{
          marginTop: 28,
          background: 'var(--color-canvas-white)',
          border: '1px solid var(--color-subtle-ash)',
          borderRadius: 14, padding: '20px 20px',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-pp-neue-montreal)',
            fontSize: '11px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--color-cool-gray)', marginBottom: 16,
          }}>
            {member.isOrganizer ? 'Organizer Details' : 'Member Details'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <DetailRow label="Name"         value={member.name} />
            <DetailRow label="Membership ID" value={member.membershipId} />
            <DetailRow label="District"     value={member.district} />
            <DetailRow label="Assembly"     value={member.assemblyName} />
            <DetailRow label="Zone"         value={member.zone} />
            <DetailRow label="Blood Group"  value={member.bloodGroup} />
            <DetailRow label="Date of Birth" value={member.dob} />
            <DetailRow label="Age"          value={member.age ? String(member.age) : ''} />
            <DetailRow label="EPIC No."     value={member.epicNo || ''} />
            <DetailRow label="Gender"       value={member.gender} />
          </div>

          {/* Verified badge */}
          <div style={{
            marginTop: 18,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px',
            background: 'var(--color-mint-green-glow)',
            borderRadius: 10,
            border: '1px solid var(--color-deep-fern-green)',
          }}>
            <span style={{ fontSize: 18 }}>🪪</span>
            <span style={{
              fontFamily: 'var(--font-pp-neue-montreal)',
              fontSize: '12px', fontWeight: 600,
              color: 'var(--color-deep-fern-green)',
            }}>
              {member.isOrganizer ? 'This is an authentic Vanigan organizer card' : 'This is an authentic Vanigan membership card'}
            </span>
          </div>
        </div>

        {/* Join Vanigan CTA */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            onClick={() => navigate('signup')}
            className="btn btn-primary btn-full"
            style={{ height: 46, borderRadius: 12, fontWeight: 600 }}
          >
            Join Vanigan — Sign Up Free
          </button>
        </div>

        <p style={{
          textAlign: 'center', marginTop: 16,
          fontFamily: 'var(--font-pp-neue-montreal)',
          fontSize: '11px', color: 'var(--color-cool-gray)', lineHeight: 1.5,
        }}>
          💡 Use Download Card for a high-quality image of both sides.
        </p>
      </div>
    );
  }

  /* ── PIN entry view ── */
  return (
    <div className="container section" style={{ maxWidth: 420, paddingTop: 32 }}>

      {/* Card icon + title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🪪</div>
        <h1 style={{
          fontFamily: 'var(--font-pp-neue-montreal)',
          fontSize: '24px', fontWeight: 700,
          color: 'var(--color-rich-black)', marginBottom: 6,
        }}>
          Verify Card
        </h1>
        <p style={{
          fontFamily: 'var(--font-pp-neue-montreal)',
          fontSize: '13px', color: 'var(--color-cool-gray)', lineHeight: 1.5,
        }}>
          Enter the card PIN to view details
        </p>
      </div>

      {/* Membership ID badge */}
      {membershipId ? (
        <div style={{
          background: 'var(--color-mint-green-glow)',
          border: '2px solid var(--color-deep-fern-green)',
          borderRadius: 12, padding: '12px 20px',
          textAlign: 'center', marginBottom: 28,
        }}>
          <div style={{
            fontFamily: 'var(--font-pp-neue-montreal)',
            fontSize: '10px', fontWeight: 700,
            color: 'var(--color-cool-gray)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
          }}>
            Card ID
          </div>
          <div style={{
            fontFamily: 'var(--font-pp-neue-montreal)',
            fontSize: '20px', fontWeight: 800,
            color: 'var(--color-deep-fern-green)', letterSpacing: '0.05em',
          }}>
            {membershipId}
          </div>
        </div>
      ) : (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 12, padding: '14px 18px',
          textAlign: 'center', marginBottom: 28,
          fontFamily: 'var(--font-pp-neue-montreal)',
          fontSize: '13px', color: '#dc2626',
        }}>
          ⚠️ Invalid QR code — no membership ID detected.
        </div>
      )}

      {/* PIN input card */}
      <div style={{
        background: 'var(--color-canvas-white)',
        border: '1px solid var(--color-subtle-ash)',
        borderRadius: 16, padding: '28px 24px',
      }}>
        <p style={{
          fontFamily: 'var(--font-pp-neue-montreal)',
          fontSize: '13px', fontWeight: 600,
          color: 'var(--color-rich-black)',
          textAlign: 'center', marginBottom: 20,
        }}>
          Enter 4-digit Card PIN
        </p>

        <PinBoxes value={pin} onChange={setPin} disabled={loading || !membershipId} />

        {error && (
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 10,
            fontFamily: 'var(--font-pp-neue-montreal)',
            fontSize: '13px', color: '#dc2626', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || pin.length < 4 || !membershipId}
          style={{
            width: '100%', height: 48, marginTop: 20,
            background: pin.length === 4 && !loading
              ? 'linear-gradient(135deg,#009245 0%,#006d34 100%)'
              : 'var(--color-subtle-ash)',
            color: pin.length === 4 && !loading ? '#fff' : 'var(--color-cool-gray)',
            border: 'none', borderRadius: 12,
            fontFamily: 'var(--font-pp-neue-montreal)',
            fontSize: '15px', fontWeight: 700,
            cursor: pin.length === 4 && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Verifying…' : 'Verify Card'}
        </button>
      </div>

      <p style={{
        textAlign: 'center', marginTop: 20,
        fontFamily: 'var(--font-pp-neue-montreal)',
        fontSize: '12px', color: 'var(--color-cool-gray)', lineHeight: 1.5,
      }}>
        The PIN is known only to the cardholder. This page is for verifying an authentic Vanigan card.
      </p>
    </div>
  );
}
