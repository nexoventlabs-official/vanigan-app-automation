import { useEffect, useState } from 'react';
import {
  Phone, Mail, Globe, MapPin, Clock, Star, Share2,
  ChevronLeft, Tag, MessageCircle, Facebook, Twitter, Instagram,
  Video, Map, Image as ImageIcon, Store, ChevronRight, ChevronLeft as PrevIcon,
} from 'lucide-react';
import { getBusiness } from '../api.js';
import { useNav } from '../App.jsx';

export default function BusinessDetail({ params = {} }) {
  const { navigate } = useNav();
  const [biz, setBiz]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [galIdx, setGalIdx]   = useState(0);
  const [galOpen, setGalOpen] = useState(false);

  useEffect(() => {
    if (!params.id) { setLoading(false); return; }
    getBusiness(params.id)
      .then(r => setBiz(r.data))
      .catch(() => setBiz(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!biz)    return (
    <div className="container section">
      <div className="empty">
        <div className="empty-icon">❌</div>
        <h3>Business not found</h3>
        <button onClick={() => navigate('home')} className="btn btn-primary" style={{ marginTop: 16 }}>Go Home</button>
      </div>
    </div>
  );

  const phone    = biz.phone || biz.whatsappNo || '';
  const gallery  = (biz.galleryImages || []).filter(g => g.url);
  const services = (biz.services || []).filter(s => s.name);
  const days     = biz.openDays ? biz.openDays.split(',').map(d => d.trim()) : [];

  const share = async () => {
    const text = `${biz.name} — ${biz.category || ''} | Vanigan Business Directory`;
    if (navigator.share) {
      await navigator.share({ title: biz.name, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Link copied!');
    }
  };

  return (
    <div>
      {/* Cover */}
      <div style={{ height: 200, background: 'var(--bg2)', overflow: 'hidden', position: 'relative' }}>
        {biz.coverImage ? (
          <img src={biz.coverImage} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
          }}>
            <Store size={48} style={{ color: 'var(--muted)', opacity: 0.6 }} />
          </div>
        )}
        {/* Back button */}
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: 16, left: 16,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          border: 'none', color: '#fff', cursor: 'pointer',
          borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '.85rem', fontWeight: 600,
        }}>
          <ChevronLeft size={16} /> Back
        </button>
        {/* Share */}
        <button onClick={share} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          border: 'none', color: '#fff', cursor: 'pointer',
          borderRadius: 10, padding: '8px', display: 'flex', alignItems: 'center',
        }}>
          <Share2 size={16} />
        </button>
      </div>

      <div className="container" style={{ paddingTop: 0 }}>
        {/* Profile + identity */}
        <div style={{
          display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap',
          padding: '20px 0 24px', borderBottom: '1px solid var(--border)',
        }}>
          {biz.image && (
            <img src={biz.image} alt={biz.name} style={{
              width: 80, height: 80, borderRadius: 14, objectFit: 'cover',
              border: '3px solid var(--border2)', flexShrink: 0,
              marginTop: -48, boxShadow: '0 4px 20px rgba(0,0,0,.08)',
              background: 'var(--card)',
            }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginTop: biz.image ? -8 : 0 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.2, flex: 1 }}>{biz.name}</h1>
              <span className={`badge ${biz.active ? 'badge-green' : 'badge-gray'}`}>
                {biz.active ? '✅ Active' : '⏳ Pending'}
              </span>
            </div>
            {biz.category && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '.85rem', color: 'var(--accent)', fontWeight: 700 }}>{biz.category}</span>
                {biz.subCategory && <>
                  <span style={{ color: 'var(--muted2)' }}>›</span>
                  <span style={{ fontSize: '.82rem', color: 'var(--muted)', fontWeight: 600 }}>{biz.subCategory}</span>
                </>}
              </div>
            )}
            {biz.listingCode && (
              <div style={{ marginTop: 6 }}>
                <span className="badge badge-blue"># {biz.listingCode}</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '20px 0', borderBottom: '1px solid var(--border)' }}>
          {(biz.whatsappNo || phone) && (
            <a href={`https://wa.me/91${(biz.whatsappNo || phone).replace(/\D/g,'')}`}
              target="_blank" rel="noreferrer"
              className="btn btn-primary">
              <MessageCircle size={16} /> WhatsApp
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`} className="btn btn-outline">
              <Phone size={16} /> Call
            </a>
          )}
          {biz.website && (
            <a href={biz.website} target="_blank" rel="noreferrer" className="btn btn-ghost">
              <Globe size={16} /> Website
            </a>
          )}
          {(biz.lat && biz.lng) && (
            <a href={`https://maps.google.com/?q=${biz.lat},${biz.lng}`} target="_blank" rel="noreferrer" className="btn btn-ghost">
              <Map size={16} /> Directions
            </a>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, paddingTop: 24 }}>
          <div>
            {/* Description */}
            {biz.description && (
              <Section title="About">
                <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '.9rem' }}>{biz.description}</p>
              </Section>
            )}

            {/* Services */}
            {services.length > 0 && (
              <Section title="Services & Pricing">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {services.map((s, i) => (
                    <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                      {s.image && <img src={s.image} alt={s.name} style={{ width: '100%', height: 90, objectFit: 'cover' }} />}
                      <div style={{ padding: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{s.name}</div>
                        {s.price && <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: '.85rem', marginTop: 3 }}>₹ {s.price}</div>}
                        {s.detail && <div style={{ color: 'var(--muted)', fontSize: '.78rem', marginTop: 4 }}>{s.detail}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <Section title={`Gallery (${gallery.length})`}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                  {gallery.map((g, i) => (
                    <div key={i} onClick={() => { setGalIdx(i); setGalOpen(true); }}
                      style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: 'var(--bg2)' }}>
                      <img src={g.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .2s' }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* FAQ */}
            {biz.infoQuestion && (
              <Section title="FAQ">
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '1.1rem' }}>Q.</span>
                    {biz.infoQuestion}
                  </div>
                  {biz.infoAnswer && (
                    <div style={{ color: 'var(--muted)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: 'var(--green)', fontWeight: 900, fontSize: '1.1rem' }}>A.</span>
                      {biz.infoAnswer}
                    </div>
                  )}
                </div>
              </Section>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Contact */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '.95rem', marginBottom: 14 }}>Contact Info</div>
              {[
                phone && { icon: Phone, label: 'Phone', value: phone, href: `tel:${phone}` },
                biz.whatsappNo && { icon: MessageCircle, label: 'WhatsApp', value: biz.whatsappNo, href: `https://wa.me/91${biz.whatsappNo.replace(/\D/g,'')}` },
                biz.landline   && { icon: Phone,         label: 'Landline',  value: biz.landline },
                biz.phone2     && { icon: Phone,         label: 'Alt Phone', value: biz.phone2, href: `tel:${biz.phone2}` },
                biz.email      && { icon: Mail,          label: 'Email',     value: biz.email,  href: `mailto:${biz.email}` },
                biz.website    && { icon: Globe,         label: 'Website',   value: biz.website, href: biz.website },
              ].filter(Boolean).map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="info-row">
                    <Icon size={15} className="info-icon" />
                    <div>
                      <div className="info-label">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined}
                          rel="noreferrer" style={{ color: 'var(--accent)', fontSize: '.88rem', textDecoration: 'none', wordBreak: 'break-all' }}>
                          {item.value}
                        </a>
                      ) : (
                        <div className="info-value">{item.value}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Location */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '.95rem', marginBottom: 14 }}>Location</div>
              {[
                biz.address          && { icon: MapPin, label: 'Address',     value: biz.address },
                biz.landmark         && { icon: MapPin, label: 'Landmark',    value: biz.landmark },
                biz.assembly         && { icon: MapPin, label: 'Assembly',    value: biz.assembly },
                biz.district         && { icon: MapPin, label: 'District',    value: biz.district },
                biz.city             && { icon: MapPin, label: 'City',        value: biz.city },
                biz.pincode          && { icon: MapPin, label: 'Pincode',     value: biz.pincode },
                biz.serviceLocations && { icon: Tag,    label: 'Service Areas', value: biz.serviceLocations },
              ].filter(Boolean).map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="info-row">
                    <Icon size={15} className="info-icon" />
                    <div>
                      <div className="info-label">{item.label}</div>
                      <div className="info-value" style={{ fontSize: '.85rem' }}>{item.value}</div>
                    </div>
                  </div>
                );
              })}
              {biz.lat && biz.lng && (
                <a href={`https://maps.google.com/?q=${biz.lat},${biz.lng}`} target="_blank" rel="noreferrer"
                  className="btn btn-outline btn-sm btn-full" style={{ marginTop: 10 }}>
                  <Map size={13} /> Open in Maps
                </a>
              )}
            </div>

            {/* Hours */}
            {(days.length > 0 || biz.openTime || biz.closeTime) && (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 800, fontSize: '.95rem', marginBottom: 14 }}>
                  <Clock size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--accent)' }} />
                  Business Hours
                </div>
                {days.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div className="info-label" style={{ marginBottom: 6 }}>Open Days</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                        <span key={d} style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600,
                           background: days.includes(d) ? 'rgba(0,149,246,.12)' : 'rgba(0,0,0,.03)',
                           color: days.includes(d) ? 'var(--accent)' : 'var(--muted2)',
                           border: `1px solid ${days.includes(d) ? 'rgba(0,149,246,.3)' : 'var(--border)'}`,
                        }}>{d}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(biz.openTime || biz.closeTime) && (
                  <div className="info-row">
                    <Clock size={15} className="info-icon" />
                    <div>
                      <div className="info-label">Timings</div>
                      <div className="info-value">{biz.openTime || '—'} – {biz.closeTime || '—'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Social */}
            {(biz.fbLink || biz.twitterLink || biz.instaLink || biz.videoUrl || biz.googleMap) && (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 800, fontSize: '.95rem', marginBottom: 14 }}>Social & Media</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {biz.fbLink      && <SocialBtn href={biz.fbLink}     icon={Facebook}   label="Facebook" />}
                  {biz.twitterLink && <SocialBtn href={biz.twitterLink} icon={Twitter}   label="Twitter" />}
                  {biz.instaLink   && <SocialBtn href={biz.instaLink}  icon={Instagram}  label="Instagram" />}
                  {biz.videoUrl    && <SocialBtn href={biz.videoUrl}   icon={Video}      label="Video" />}
                  {biz.googleMap   && <SocialBtn href={biz.googleMap}  icon={Map}        label="G Map" />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gallery lightbox */}
      {galOpen && gallery.length > 0 && (
        <div onClick={() => setGalOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <button onClick={e => { e.stopPropagation(); setGalIdx(i => (i - 1 + gallery.length) % gallery.length); }}
            style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PrevIcon size={22} />
          </button>
          <img src={gallery[galIdx]?.url} alt="" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
          <button onClick={e => { e.stopPropagation(); setGalIdx(i => (i + 1) % gallery.length); }}
            style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={22} />
          </button>
          <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,.6)', fontSize: '.85rem' }}>
            {galIdx + 1} / {gallery.length}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .biz-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function SocialBtn({ href, icon: Icon, label }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title={label}>
      <Icon size={14} /> {label}
    </a>
  );
}
