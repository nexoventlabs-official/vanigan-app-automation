import { useEffect, useState } from 'react';
import {
  Phone, Mail, Globe, MapPin, Clock, Star, Share2,
  ChevronLeft, Tag, Facebook, Twitter, Instagram,
  Video, Map, Image as ImageIcon, Store, ChevronRight, ChevronLeft as PrevIcon,
} from 'lucide-react';
import { getBusiness, postReview, getStoredPhone, setStoredPhone, getReviewed, markReviewed } from '../api.js';
import { useNav } from '../App.jsx';

/* Proper WhatsApp brand SVG icon */
function WhatsAppIcon({ size = 16, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function BusinessDetail({ params = {} }) {
  const { navigate } = useNav();
  const [biz, setBiz]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [galIdx, setGalIdx]   = useState(0);
  const [galOpen, setGalOpen] = useState(false);

  // Review & Rating State
  const [reviews, setReviews]             = useState([]);
  const [reviewerName, setReviewerName]   = useState('');
  const [reviewPhone, setReviewPhone]     = useState(() => getStoredPhone());
  const [formRating, setFormRating]       = useState(0);
  const [formText, setFormText]           = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    if (!params.id) { setLoading(false); return; }
    getBusiness(params.id)
      .then(r => {
        setBiz(r.data);
        setReviews(r.data.reviews || []);
        /* Check localStorage: has this user already reviewed this business? */
        if (getReviewed().includes(r.data._id?.toString())) setAlreadyReviewed(true);
      })
      .catch(() => setBiz(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!formRating) { setSubmitError('Please select a rating of 1 to 5 stars.'); return; }
    if (!reviewerName.trim()) { setSubmitError('Please enter your name.'); return; }
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);
    try {
      const phone = reviewPhone.replace(/\D/g, '');
      const res = await postReview(biz._id, {
        reviewerName: reviewerName.trim(),
        rating: formRating,
        text: formText.trim(),
        phone,
      });
      if (phone) setStoredPhone(phone);
      markReviewed(biz._id.toString());
      setAlreadyReviewed(true);
      setReviews(prev => [res.data, ...prev]);
      setSubmitSuccess(true);
      setReviewerName('');
      setFormRating(0);
      setFormText('');
      const freshBiz = await getBusiness(biz._id);
      setBiz(freshBiz.data);
    } catch (err) {
      const code = err.response?.data?.error;
      if (code === 'already_reviewed') {
        markReviewed(biz._id.toString());
        setAlreadyReviewed(true);
        setSubmitError('You have already submitted a review for this business.');
      } else {
        setSubmitError(code || 'Failed to submit review.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!biz)    return (
    <div className="container section">
      <div className="empty">
        <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Store size={48} style={{ color: 'var(--muted2)' }} />
        </div>
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
      {/* Cover — outer wrapper allows profile icon to overflow the bottom edge */}
      <div style={{ position: 'relative' }}>
        <div className="biz-cover-container">
          {biz.coverImage ? (
            <>
              {/* Blurred background backdrop */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${biz.coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(15px) brightness(0.85)',
                transform: 'scale(1.1)',
                opacity: 0.45,
                zIndex: 1,
              }} />
              {/* Crisp foreground banner showing full view */}
              <img
                src={biz.coverImage}
                alt={biz.name}
                className="biz-cover-img"
              />
            </>
          ) : (
            <div className="biz-cover-placeholder">
              <Store size={48} style={{ color: 'var(--muted)', opacity: 0.6 }} />
            </div>
          )}
          {/* Back button */}
          <button onClick={() => window.history.length > 1 ? window.history.back() : navigate('list', {})} style={{
            position: 'absolute', top: 16, left: 16,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            border: 'none', color: '#fff', cursor: 'pointer',
            borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '.85rem', fontWeight: 600,
            zIndex: 10,
          }}>
            <ChevronLeft size={16} /> Back
          </button>
          {/* Share */}
          <button onClick={share} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            border: 'none', color: '#fff', cursor: 'pointer',
            borderRadius: 10, padding: '8px', display: 'flex', alignItems: 'center',
            zIndex: 10,
          }}>
            <Share2 size={16} />
          </button>
        </div>
        {biz.image && (
          <img src={biz.image} alt={biz.name} style={{
            position: 'absolute', bottom: -36, left: 24, zIndex: 2,
            width: 80, height: 80, borderRadius: 14, objectFit: 'cover',
            border: '3px solid var(--card)', background: 'var(--card)',
            boxShadow: '0 4px 16px rgba(0,0,0,.35)',
          }} />
        )}
      </div>

      <div className="container" style={{ paddingTop: 0 }}>
        {/* Profile + identity */}
        <div style={{
          display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap',
          padding: '20px 0 24px', paddingTop: biz.image ? 52 : 20, borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.2, flex: 1 }}>{biz.name}</h1>
              <span className={`badge ${biz.active ? 'badge-green' : 'badge-gray'}`}>
                {biz.active ? '✅ Active' : '⏳ Pending'}
              </span>
            </div>

            {/* Ratings Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              {biz.rating > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 1 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={14}
                        fill={star <= Math.round(biz.rating) ? '#fbbf24' : 'none'}
                        stroke={star <= Math.round(biz.rating) ? '#fbbf24' : '#a1a1aa'}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--text)' }}>{biz.rating}</span>
                  <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>({biz.reviewCount || 0} reviews)</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 1 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={14}
                        fill="none"
                        stroke="#e4e4e7"
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>No ratings yet</span>
                </div>
              )}
            </div>

            {biz.category && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '.85rem', color: 'var(--accent)', fontWeight: 600 }}>{biz.category}</span>
                {biz.subCategory && <>
                  <span style={{ color: 'var(--muted2)' }}>›</span>
                  <span style={{ fontSize: '.82rem', color: 'var(--muted)', fontWeight: 500 }}>{biz.subCategory}</span>
                </>}
              </div>
            )}
            {biz.listingCode && (
              <div style={{ marginTop: 8 }}>
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
              className="btn btn-primary" style={{ background: '#25D366', borderColor: '#25D366' }}>
              <WhatsAppIcon size={16} /> WhatsApp
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

        <div className="biz-detail-grid">
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
                <div className="services-grid">
                  {services.map((s, i) => (
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

            {/* Reviews & Ratings Section */}
            <Section title="Reviews & Ratings">
              {/* Write a Review Form — hidden if already reviewed */}
              {alreadyReviewed ? (
                <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#4ade80', fontSize: '.88rem', fontWeight: 600 }}>
                  ✅ You have already reviewed this business. Thank you!
                </div>
              ) : (
              <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <h4 style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: 6 }}>Write a Review</h4>
                <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: 16 }}>Share your experience with this business. Your review helps others make better decisions.</p>
                
                {submitSuccess && (
                  <div className="badge badge-green" style={{ display: 'flex', padding: '10px 14px', borderRadius: 8, fontSize: '.85rem', width: '100%', marginBottom: 16, justifyContent: 'flex-start', lineHeight: 1.4 }}>
                    ✓ Review submitted successfully! Thank you.
                  </div>
                )}
                
                {submitError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '10px 14px', borderRadius: 8, fontSize: '.82rem', marginBottom: 16 }}>
                    ⚠ {submitError}
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="field">
                    <label className="label">Your Name *</label>
                    <input
                      className="input"
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={reviewerName}
                      onChange={e => setReviewerName(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Rating *</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormRating(star)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 2,
                            display: 'inline-flex',
                            transition: 'transform 0.1s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <Star
                            size={22}
                            fill={star <= formRating ? '#fbbf24' : 'none'}
                            stroke={star <= formRating ? '#fbbf24' : '#a1a1aa'}
                          />
                        </button>
                      ))}
                      <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--muted)', marginLeft: 8 }}>
                        {formRating ? `${formRating} Star${formRating !== 1 ? 's' : ''}` : 'Select rating'}
                      </span>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Review Text (Optional)</label>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Tell us what you liked or how they can improve..."
                      value={formText}
                      onChange={e => setFormText(e.target.value)}
                      style={{ resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Your Phone (Optional — prevents duplicate review)</label>
                    <input
                      className="input"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={reviewPhone}
                      onChange={e => setReviewPhone(e.target.value)}
                      maxLength={15}
                      inputMode="numeric"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ alignSelf: 'flex-start', marginTop: 4 }}
                  >
                    {submitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                </form>
              </div>
              )}

              {/* Reviews List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h4 style={{ fontWeight: 600, fontSize: '0.98rem', borderBottom: '1px solid var(--border)', paddingBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 4px' }}>
                  <span>Recent Reviews</span>
                  <span style={{ fontSize: '.82rem', color: 'var(--muted)', fontWeight: 500 }}>{reviews.length} total</span>
                </h4>

                {reviews.length === 0 ? (
                  <p style={{ fontSize: '.85rem', color: 'var(--muted)', fontStyle: 'italic', padding: '12px 0' }}>
                    No reviews yet. Be the first to write a review!
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev._id} style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>
                            {rev.reviewerName || 'Anonymous'}
                          </div>
                          <div style={{ display: 'flex', gap: 1, marginTop: 4 }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                size={12}
                                fill={star <= rev.rating ? '#fbbf24' : 'none'}
                                stroke={star <= rev.rating ? '#fbbf24' : '#d4d4d8'}
                              />
                            ))}
                          </div>
                        </div>
                        <span style={{ fontSize: '.75rem', color: 'var(--muted2)', fontWeight: 500 }}>
                          {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {rev.text && (
                        <p style={{ fontSize: '.85rem', color: 'var(--muted)', lineHeight: 1.5, marginTop: 2 }}>
                          {rev.text}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Section>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Contact */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '.95rem', marginBottom: 14 }}>Contact Info</div>
              {[
                phone && { icon: Phone, label: 'Phone', value: phone, href: `tel:${phone}` },
                biz.whatsappNo && { icon: WhatsAppIcon, label: 'WhatsApp', value: biz.whatsappNo, href: `https://wa.me/91${biz.whatsappNo.replace(/\D/g,'')}` },
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
              {(() => {
                const src = (biz.lat && biz.lng)
                  ? `https://maps.google.com/maps?q=${biz.lat},${biz.lng}&output=embed&z=15`
                  : [biz.name, biz.address, biz.city, biz.district].filter(Boolean).length
                    ? `https://maps.google.com/maps?q=${encodeURIComponent([biz.name, biz.address, biz.city, biz.district].filter(Boolean).join(', '))}&output=embed&z=14`
                    : '';
                return src ? (
                  <iframe src={src} title="Business Location" width="100%" height="220"
                    style={{ border: 0, borderRadius: 10, marginTop: 12, display: 'block' }}
                    allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                ) : null;
              })()}
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
                          padding: '3px 8px', borderRadius: 5, fontSize: '.72rem', fontWeight: 600,
                          background: days.includes(d) ? 'var(--accent)' : 'var(--bg2)',
                          color: days.includes(d) ? '#ffffff' : 'var(--muted)',
                          border: `1px solid ${days.includes(d) ? 'var(--accent)' : 'var(--border)'}`,
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

      {/* Service Details Modal */}
      {selectedService && (
        <div className="dialog-overlay" onClick={() => setSelectedService(null)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <button className="dialog-close" onClick={() => setSelectedService(null)}>
              ✕
            </button>
            <div className="dialog-body">
              {selectedService.image && (
                <div className="dialog-img-wrap">
                  <img src={selectedService.image} alt={selectedService.name} className="dialog-img" />
                </div>
              )}
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
