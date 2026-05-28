import { useState, useEffect } from 'react';
import { Phone, RefreshCw, Store, Trash2, ExternalLink, MessageCircle, Globe, MapPin, Mail, Clock, Tag, Map } from 'lucide-react';
import { getBusinesses, REGISTER_URL } from '../api.js';
import { useNav } from '../App.jsx';

const LS_KEY = 'vanigan_my_business';

export default function MyBusiness() {
  const { navigate } = useNav();
  const [phone, setPhone]   = useState('');
  const [error, setError]   = useState('');
  const [biz, setBiz]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const lookup = async (ph) => {
    const digits = ph.replace(/\D/g, '');
    if (digits.length < 10) { setError('Enter a valid 10-digit number'); return; }
    setError(''); setLoading(true); setNotFound(false);
    try {
      const r = await getBusinesses({ ownerPhone: digits });
      const list = r.data.businesses || [];
      if (list.length === 0) { setNotFound(true); setBiz(null); localStorage.removeItem(LS_KEY); }
      else {
        const found = list[0];
        setBiz(found);
        localStorage.setItem(LS_KEY, JSON.stringify(found));
      }
    } catch {
      setError('Could not connect. Please try again.');
    } finally { setLoading(false); }
  };

  const handleFind = (e) => {
    e.preventDefault();
    lookup(phone);
  };

  const refresh = () => {
    if (biz?.phone || biz?.ownerPhone) lookup(biz.phone || biz.ownerPhone);
  };

  const clear = () => {
    setBiz(null);
    localStorage.removeItem(LS_KEY);
    setNotFound(false);
    setPhone('');
  };

  if (biz) return <BusinessView biz={biz} navigate={navigate} onRefresh={refresh} onClear={clear} loading={loading} />;

  return (
    <div className="container section" style={{ maxWidth: 480 }}>
      <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '.85rem', marginBottom: 20 }}>
        ← Back
      </button>

      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(0,149,246,.12)', border: '1px solid rgba(0,149,246,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Store size={28} style={{ color: 'var(--accent)' }} />
      </div>

      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 8 }}>My Business</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32 }}>
        Enter your registered WhatsApp number to view your business listing.
      </p>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>Find Your Business</div>
        <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: 16 }}>Use the same number you registered with.</p>
        <form onSubmit={handleFind}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Registered Phone Number</label>
            <input
              className="input" type="tel" value={phone}
              onChange={e => { setPhone(e.target.value); setError(''); setNotFound(false); }}
              placeholder="10-digit mobile number" maxLength={15} inputMode="numeric"
            />
            {error    && <p style={{ color: '#f87171', fontSize: '.78rem', marginTop: 4 }}>{error}</p>}
            {notFound && <p style={{ color: '#fb923c', fontSize: '.78rem', marginTop: 4 }}>No registered business found for this number.</p>}
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Searching…' : 'Find My Business'}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginBottom: 8 }}>Don't have a listing yet?</p>
        <button onClick={() => navigate('add')} className="btn btn-outline btn-sm">Add Your Business</button>
      </div>
    </div>
  );
}

function BusinessView({ biz, navigate, onRefresh, onClear, loading }) {
  const phone    = biz.phone || biz.whatsappNo || '';
  const services = (biz.services || []).filter(s => s.name);
  const gallery  = (biz.galleryImages || []).filter(g => g.url);
  const days     = biz.openDays ? biz.openDays.split(',').map(d => d.trim()) : [];

  return (
    <div>
      {/* Cover */}
      <div style={{ height: 180, background: 'var(--bg2)', overflow: 'hidden', position: 'relative' }}>
        {biz.coverImage ? (
          <img src={biz.coverImage} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' }}>
            <Store size={48} style={{ color: 'var(--muted)', opacity: 0.6 }} />
          </div>
        )}
      </div>

      <div className="container" style={{ paddingTop: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '20px 0 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {biz.image && (
            <img src={biz.image} alt={biz.name} style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', border: '3px solid var(--border2)', flexShrink: 0, marginTop: -36, background: 'var(--card)' }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{biz.name}</h1>
                {biz.category && (
                  <div style={{ color: 'var(--accent)', fontSize: '.83rem', fontWeight: 700, marginTop: 4 }}>
                    {biz.category}{biz.subCategory && ` › ${biz.subCategory}`}
                  </div>
                )}
                {biz.listingCode && <div style={{ marginTop: 6 }}><span className="badge badge-blue"># {biz.listingCode}</span></div>}
              </div>
              <span className={`badge ${biz.active ? 'badge-green' : 'badge-gray'}`}>
                {biz.active ? '✅ Active' : '⏳ Pending Review'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignSelf: 'flex-start', marginTop: 8 }}>
            <button onClick={onRefresh} disabled={loading} className="btn btn-ghost btn-sm" title="Refresh">
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'Updating…' : 'Refresh'}
            </button>
            <button onClick={onClear} className="btn btn-ghost btn-sm" title="Remove cached business" style={{ color: '#f87171' }}>
              <Trash2 size={14} /> Remove
            </button>
          </div>
        </div>

        {/* Not active notice */}
        {!biz.active && (
          <div style={{ background: 'rgba(251,146,60,.08)', border: '1px solid rgba(251,146,60,.2)', borderRadius: 12, padding: '14px 16px', margin: '20px 0', color: '#fb923c', fontSize: '.88rem' }}>
            ⏳ Your business is pending review. Our team will activate it shortly. You'll receive a WhatsApp confirmation.
          </div>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => navigate('detail', { id: biz._id })} className="btn btn-primary btn-sm">
            <ExternalLink size={14} /> View Public Listing
          </button>
          {phone && (
            <a href={`https://wa.me/91${phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
              <MessageCircle size={14} /> WhatsApp Preview
            </a>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, paddingTop: 24 }}>
          <div>
            {/* Description */}
            {biz.description && (
              <InfoSection title="About">
                <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '.9rem' }}>{biz.description}</p>
              </InfoSection>
            )}

            {/* Services */}
            {services.length > 0 && (
              <InfoSection title={`Services (${services.length})`}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                  {services.map((s, i) => (
                    <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                      {s.image && <img src={s.image} alt={s.name} style={{ width: '100%', height: 80, objectFit: 'cover' }} />}
                      <div style={{ padding: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{s.name}</div>
                        {s.price && <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: '.82rem', marginTop: 2 }}>₹ {s.price}</div>}
                        {s.detail && <div style={{ color: 'var(--muted)', fontSize: '.76rem', marginTop: 3 }}>{s.detail}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </InfoSection>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <InfoSection title={`Gallery (${gallery.length})`}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                  {gallery.map((g, i) => (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: 'var(--bg2)' }}>
                      <img src={g.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </InfoSection>
            )}

            {/* FAQ */}
            {biz.infoQuestion && (
              <InfoSection title="FAQ">
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}><span style={{ color: 'var(--accent)' }}>Q.</span> {biz.infoQuestion}</div>
                  {biz.infoAnswer && <div style={{ color: 'var(--muted)', fontSize: '.9rem' }}><span style={{ color: 'var(--green)' }}>A.</span> {biz.infoAnswer}</div>}
                </div>
              </InfoSection>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SideCard title="Contact Info">
              {[
                phone          && { icon: Phone,         label: 'Phone',     value: phone },
                biz.whatsappNo && { icon: MessageCircle, label: 'WhatsApp',  value: biz.whatsappNo },
                biz.landline   && { icon: Phone,         label: 'Landline',  value: biz.landline },
                biz.email      && { icon: Mail,          label: 'Email',     value: biz.email },
                biz.website    && { icon: Globe,         label: 'Website',   value: biz.website },
              ].filter(Boolean).map((r, i) => <InfoRow key={i} {...r} />)}
            </SideCard>

            <SideCard title="Location">
              {[
                biz.address          && { icon: MapPin, label: 'Address',     value: biz.address },
                biz.assembly         && { icon: MapPin, label: 'Assembly',    value: biz.assembly },
                biz.district         && { icon: MapPin, label: 'District',    value: biz.district },
                biz.city             && { icon: MapPin, label: 'City',        value: biz.city },
                biz.pincode          && { icon: MapPin, label: 'Pincode',     value: biz.pincode },
                biz.serviceLocations && { icon: Tag,    label: 'Service Areas', value: biz.serviceLocations },
              ].filter(Boolean).map((r, i) => <InfoRow key={i} {...r} />)}
            </SideCard>

            {(days.length > 0 || biz.openTime) && (
              <SideCard title="Business Hours">
                {days.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div className="info-label" style={{ marginBottom: 6 }}>Open Days</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                        <span key={d} style={{
                          padding: '2px 7px', borderRadius: 5, fontSize: '.72rem', fontWeight: 600,
                          background: days.includes(d) ? 'rgba(0,149,246,.12)' : 'rgba(0,0,0,.03)',
                          color: days.includes(d) ? 'var(--accent)' : 'var(--muted2)',
                          border: `1px solid ${days.includes(d) ? 'rgba(0,149,246,.3)' : 'var(--border)'}`,
                        }}>{d}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(biz.openTime || biz.closeTime) && (
                  <div style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
                    <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {biz.openTime || '—'} – {biz.closeTime || '—'}
                  </div>
                )}
              </SideCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoSection({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontWeight: 800, fontSize: '.95rem', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>{title}</h3>
      {children}
    </div>
  );
}

function SideCard({ title, children }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ fontWeight: 800, fontSize: '.88rem', marginBottom: 12 }}>{title}</div>
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
        <div className="info-value" style={{ fontSize: '.83rem' }}>{value}</div>
      </div>
    </div>
  );
}
