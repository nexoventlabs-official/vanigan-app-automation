import { useState, useEffect } from 'react';
import {
  User, Phone, MapPin, Bookmark, UserPlus, Users,
  Store, ChevronRight, RefreshCw, LogOut, CreditCard,
  Calendar, Droplets, Star,
} from 'lucide-react';
import { getSocialProfile, toggleFollow, toggleSave } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNav } from '../App.jsx';

export default function Profile() {
  const { user, member, isLoggedIn, isMember, logout } = useAuth();
  const { navigate } = useNav();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('saved'); // 'saved' | 'following' | 'info'
  const [actionLoading, setActionLoading] = useState(false);

  const phone = (user?.phone || member?.phone || '').replace(/\D/g, '');

  useEffect(() => {
    if (!isLoggedIn || !phone) { setLoading(false); return; }
    fetchProfile();
  }, [phone, isLoggedIn]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const r = await getSocialProfile(phone);
      setProfile(r.data.profile);
    } catch { setProfile(null); }
    finally { setLoading(false); }
  };

  if (!isLoggedIn) {
    return (
      <div className="container section" style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>👤</div>
        <h2 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, marginBottom: 8 }}>My Profile</h2>
        <p style={{ color: 'var(--color-cool-gray)', fontSize: '14px', marginBottom: 24 }}>Please login to view your profile.</p>
        <button onClick={() => navigate('login')} className="btn btn-primary" style={{ borderRadius: 12, paddingInline: 32 }}>Login</button>
      </div>
    );
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const displayName  = profile?.name || user?.name || 'User';
  const displayPhone = profile?.phone || phone;
  const avatar       = profile?.photoUrl || null;
  const savedList    = profile?.savedList    || [];
  const followingList= profile?.followingList || [];
  const followerCount= profile?.followerCount ?? 0;
  const followerList = profile?.followerList  || [];
  const followingCount = profile?.followingCount ?? 0;
  const savedCount   = profile?.savedCount ?? 0;

  const handleUnfollow = async (bizId) => {
    setActionLoading(bizId);
    try {
      await toggleFollow(phone, bizId);
      setProfile(prev => ({
        ...prev,
        followingList:  prev.followingList.filter(b => b._id !== bizId),
        followingCount: Math.max(0, prev.followingCount - 1),
        following:      (prev.following || []).filter(id => id.toString() !== bizId),
      }));
    } catch { /* ignore */ }
    finally { setActionLoading(false); }
  };

  const handleUnsave = async (bizId) => {
    setActionLoading(bizId);
    try {
      await toggleSave(phone, bizId);
      setProfile(prev => ({
        ...prev,
        savedList:  prev.savedList.filter(b => b._id !== bizId),
        savedCount: Math.max(0, prev.savedCount - 1),
        savedBusinesses: (prev.savedBusinesses || []).filter(id => id.toString() !== bizId),
      }));
    } catch { /* ignore */ }
    finally { setActionLoading(false); }
  };

  return (
    <div className="container section" style={{ maxWidth: 640 }}>

      {/* ── Profile Header Card ── */}
      <div style={{
        background: 'var(--color-canvas-white)',
        border: '1px solid var(--color-subtle-ash)',
        borderRadius: 16, padding: 28, marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: avatar ? 'transparent' : 'var(--color-rich-black)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', border: '2px solid var(--color-subtle-ash)',
          }}>
            {avatar
              ? <img src={avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-pp-neue-montreal)' }}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
            }
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontSize: '22px', fontWeight: 700, color: 'var(--color-rich-black)', letterSpacing: '-0.015em', marginBottom: 4 }}>
              {displayName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-cool-gray)', fontSize: '13px', fontFamily: 'var(--font-pp-neue-montreal)', marginBottom: 6 }}>
              <Phone size={12} /> {displayPhone}
            </div>
            {(profile?.district || profile?.assemblyName) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-cool-gray)', fontSize: '13px', fontFamily: 'var(--font-pp-neue-montreal)', marginBottom: 6 }}>
                <MapPin size={12} />
                {[profile.assemblyName, profile.district].filter(Boolean).join(', ')}
              </div>
            )}
            {isMember && profile?.membershipId && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e1fdea', border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 12px', fontSize: '11px', fontWeight: 700, color: '#166534', fontFamily: 'var(--font-pp-neue-montreal)', letterSpacing: '0.04em' }}>
                <CreditCard size={11} /> {profile.membershipId}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' }}>
            <button onClick={fetchProfile} style={{ background: 'none', border: '1px solid var(--color-subtle-ash)', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', color: 'var(--color-cool-gray)' }}>
              <RefreshCw size={14} />
            </button>
            <button onClick={() => { logout(); navigate('home'); }}
              style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', color: '#dc2626', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-pp-neue-montreal)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'flex', gap: 0, marginTop: 24, borderTop: '1px solid var(--color-subtle-ash)', paddingTop: 20 }}>
          {[
            { label: 'Following',  value: followingCount, icon: UserPlus, tab: 'following' },
            { label: 'Followers',  value: followerCount,  icon: Users,    tab: 'followers' },
            { label: 'Saved',      value: savedCount,     icon: Bookmark, tab: 'saved' },
          ].map((s, i) => (
            <button key={s.label} onClick={() => setTab(s.tab)} style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 4px', textAlign: 'center',
              borderRight: i < 2 ? '1px solid var(--color-subtle-ash)' : 'none',
              borderBottom: tab === s.tab ? '2px solid var(--color-deep-fern-green)' : '2px solid transparent',
              transition: 'border-color .2s',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: tab === s.tab ? 'var(--color-deep-fern-green)' : 'var(--color-rich-black)', fontFamily: 'var(--font-pp-neue-montreal)', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-cool-gray)', fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 500, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Quick links ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {profile?.businessId && (
          <button onClick={() => navigate('my')} className="btn btn-outline btn-sm" style={{ borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Store size={13} /> My Business
          </button>
        )}
        {isMember && (
          <button onClick={() => navigate('membercard')} className="btn btn-outline btn-sm" style={{ borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-deep-fern-green)', borderColor: 'var(--color-deep-fern-green)' }}>
            <CreditCard size={13} /> Membership Card
          </button>
        )}
        <button onClick={() => setTab('info')} className="btn btn-outline btn-sm" style={{ borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, borderColor: tab === 'info' ? 'var(--color-rich-black)' : undefined }}>
          <User size={13} /> Profile Details
        </button>
      </div>

      {/* ── Tab content ── */}

      {/* SAVED */}
      {tab === 'saved' && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, fontSize: '16px', color: 'var(--color-rich-black)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bookmark size={16} /> Saved Businesses
          </h3>
          {savedList.length === 0 ? (
            <EmptyState icon="🔖" title="No saved businesses yet" sub="Tap the Save button on any business to bookmark it here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {savedList.map(biz => (
                <BizCard
                  key={biz._id} biz={biz}
                  actionLabel="Remove"
                  actionColor="#dc2626"
                  actionLoading={actionLoading === biz._id}
                  onAction={() => handleUnsave(biz._id)}
                  onView={() => navigate('detail', { id: biz._id })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* FOLLOWING */}
      {tab === 'following' && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, fontSize: '16px', color: 'var(--color-rich-black)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={16} /> Following
          </h3>
          {followingList.length === 0 ? (
            <EmptyState icon="👥" title="Not following anyone yet" sub="Tap the Follow button on any business to follow it and see it here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {followingList.map(biz => (
                <BizCard
                  key={biz._id} biz={biz}
                  actionLabel="Unfollow"
                  actionColor="var(--color-rich-black)"
                  actionLoading={actionLoading === biz._id}
                  onAction={() => handleUnfollow(biz._id)}
                  onView={() => navigate('detail', { id: biz._id })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* FOLLOWERS */}
      {tab === 'followers' && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, fontSize: '16px', color: 'var(--color-rich-black)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} /> Followers
          </h3>
          {!profile?.businessId ? (
            <EmptyState icon="🏪" title="No business linked" sub="Followers are people who follow your business. List your business first to get followers." />
          ) : followerList.length === 0 ? (
            <EmptyState icon="👥" title="No followers yet" sub="When someone follows your business, they'll appear here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {followerList.map((f, i) => (
                <div key={f._id || i} style={{ background: 'var(--color-canvas-white)', border: '1px solid var(--color-subtle-ash)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: f.photoUrl ? 'transparent' : 'var(--color-rich-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--color-subtle-ash)' }}>
                    {f.photoUrl
                      ? <img src={f.photoUrl} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-pp-neue-montreal)' }}>{(f.name || 'U').charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, fontSize: '14px', color: 'var(--color-rich-black)', marginBottom: 2 }}>{f.name || 'Unknown'}</div>
                    {f.location && <div style={{ fontSize: '12px', color: 'var(--color-cool-gray)', fontFamily: 'var(--font-pp-neue-montreal)' }}>{f.location}</div>}
                    {f.membershipId && (
                      <div style={{ fontSize: '11px', color: 'var(--color-deep-fern-green)', fontWeight: 600, fontFamily: 'var(--font-pp-neue-montreal)', marginTop: 2 }}>{f.membershipId}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROFILE INFO */}
      {tab === 'info' && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, fontSize: '16px', color: 'var(--color-rich-black)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} /> Profile Details
          </h3>
          <div style={{ background: 'var(--color-canvas-white)', border: '1px solid var(--color-subtle-ash)', borderRadius: 14, overflow: 'hidden' }}>
            {[
              { label: 'Full Name',    value: profile?.name },
              { label: 'Phone',        value: profile?.phone },
              { label: 'District',     value: profile?.district },
              { label: 'Assembly',     value: profile?.assemblyName },
              { label: 'Zone',         value: profile?.zone },
              { label: 'Gender',       value: profile?.gender },
              { label: 'Blood Group',  value: profile?.bloodGroup },
              { label: 'Date of Birth',value: profile?.dob },
              { label: 'Age',          value: profile?.age ? `${profile.age} years` : null },
              { label: 'EPIC No.',     value: profile?.epicNo },
              { label: 'Address',      value: profile?.businessAddress },
              { label: 'Followers',    value: `${followerCount} people follow your business` },
            ].filter(r => r.value).map((row, i) => (
              <div key={i} style={{ display: 'flex', padding: '12px 20px', borderBottom: '1px solid var(--color-subtle-ash)', fontFamily: 'var(--font-pp-neue-montreal)' }}>
                <div style={{ width: 130, fontSize: '11px', fontWeight: 700, color: 'var(--color-cool-gray)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0, paddingTop: 2 }}>{row.label}</div>
                <div style={{ fontSize: '14px', color: 'var(--color-rich-black)', fontWeight: 500, flex: 1 }}>{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Business card used in saved/following lists ── */
function BizCard({ biz, actionLabel, actionColor, actionLoading, onAction, onView }) {
  return (
    <div style={{ background: 'var(--color-canvas-white)', border: '1px solid var(--color-subtle-ash)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14, padding: 14, transition: 'border-color .2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-deep-fern-green)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-subtle-ash)'}>
      {/* Thumbnail */}
      <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--color-subtle-ash)', border: '1px solid var(--color-subtle-ash)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {biz.image
          ? <img src={biz.image} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Store size={22} style={{ color: 'var(--color-cool-gray)' }} />
        }
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-pp-neue-montreal)', fontWeight: 700, fontSize: '14px', color: 'var(--color-rich-black)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{biz.name}</div>
        {biz.category && <div style={{ fontSize: '11px', color: 'var(--color-deep-fern-green)', fontWeight: 600, fontFamily: 'var(--font-pp-neue-montreal)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{biz.category}</div>}
        {(biz.assembly || biz.district) && <div style={{ fontSize: '11px', color: 'var(--color-cool-gray)', fontFamily: 'var(--font-pp-neue-montreal)' }}>{[biz.assembly, biz.district].filter(Boolean).join(', ')}</div>}
      </div>
      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button onClick={onView} style={{ background: 'var(--color-rich-black)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-pp-neue-montreal)', display: 'flex', alignItems: 'center', gap: 4 }}>
          View <ChevronRight size={11} />
        </button>
        <button onClick={onAction} disabled={actionLoading} style={{ background: 'none', color: actionColor, border: `1px solid ${actionColor}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-pp-neue-montreal)', opacity: actionLoading ? 0.5 : 1 }}>
          {actionLoading ? '…' : actionLabel}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ background: 'var(--color-canvas-white)', border: '1px dashed var(--color-subtle-ash)', borderRadius: 14, padding: '40px 24px', textAlign: 'center', fontFamily: 'var(--font-pp-neue-montreal)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-rich-black)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: '13px', color: 'var(--color-cool-gray)', lineHeight: 1.6 }}>{sub}</div>
    </div>
  );
}
