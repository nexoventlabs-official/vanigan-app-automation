import { useEffect, useState } from 'react';
import api from '../api';
import { CalendarDays, Images, X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

/* ── helpers ── */
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

/* ══════════════════════════════════════════════
   EVENT DETAIL VIEW
   ══════════════════════════════════════════════ */
function EventDetail({ event, onBack }) {
  const [lightbox, setLightbox] = useState(null); // { idx }

  const openLightbox = (idx) => setLightbox({ idx });
  const closeLightbox = () => setLightbox(null);
  const prev = () =>
    setLightbox((lb) => ({ idx: (lb.idx - 1 + event.images.length) % event.images.length }));
  const next = () =>
    setLightbox((lb) => ({ idx: (lb.idx + 1) % event.images.length }));

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'Escape')     closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);

  // lock body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightbox]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas-white)' }}>
      {/* ── Top banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
        borderBottom: '1px solid var(--color-subtle-ash)',
        padding: '36px 0 28px',
      }}>
        <div className="container">
          {/* Back button */}
          <button
            onClick={onBack}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 700, color: 'var(--color-deep-fern-green)',
              marginBottom: 16,
              transition: 'opacity .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <ArrowLeft size={15} /> Back to Gallery
          </button>

          <h1 style={{
            fontFamily: 'var(--font-pp-neue-montreal)',
            fontSize: 'clamp(22px, 4vw, 36px)',
            fontWeight: 800,
            color: 'var(--color-rich-black)',
            lineHeight: 1.15,
            margin: '0 0 10px',
          }}>
            {event.eventName}
          </h1>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--color-cool-gray)', fontWeight: 600,
          }}>
            <CalendarDays size={13} />
            {fmt(event.eventDate)}
            <span style={{ margin: '0 4px', color: 'var(--color-subtle-ash)' }}>·</span>
            <span>{event.images?.length || 0} photo{event.images?.length !== 1 ? 's' : ''}</span>
          </div>

          {event.description && (
            <p style={{
              marginTop: 12, fontSize: 15, color: 'var(--color-cool-gray)',
              fontWeight: 600, maxWidth: 680, lineHeight: 1.6,
            }}>
              {event.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Images grid ── */}
      <div className="container section">
        {!event.images?.length ? (
          <div className="empty">
            <div className="empty-icon"><Images size={36} /></div>
            <h3>No photos yet</h3>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 14,
          }}>
            {event.images.map((img, idx) => (
              <button
                key={img.publicId}
                onClick={() => openLightbox(idx)}
                style={{
                  all: 'unset', cursor: 'zoom-in',
                  aspectRatio: '1',
                  borderRadius: 10,
                  overflow: 'hidden',
                  display: 'block',
                  border: '1px solid var(--color-subtle-ash)',
                  transition: 'transform .2s ease, box-shadow .2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                aria-label={`View photo ${idx + 1}`}
              >
                <img
                  src={img.url}
                  alt={`${event.eventName} – photo ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.93)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn .18s ease-out',
          }}
          role="dialog" aria-modal="true" aria-label="Photo viewer"
        >
          {/* Close */}
          <button onClick={closeLightbox} aria-label="Close"
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10,
            }}>
            <X size={20} />
          </button>

          {/* Prev */}
          {event.images.length > 1 && (
            <button onClick={e => { e.stopPropagation(); prev(); }} aria-label="Previous"
              style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10,
              }}>
              <ChevronLeft size={22} />
            </button>
          )}

          <img
            src={event.images[lightbox.idx].url}
            alt={`Photo ${lightbox.idx + 1}`}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 'min(90vw, 960px)', maxHeight: '85vh',
              objectFit: 'contain', borderRadius: 8,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              userSelect: 'none',
            }}
          />

          {/* Next */}
          {event.images.length > 1 && (
            <button onClick={e => { e.stopPropagation(); next(); }} aria-label="Next"
              style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10,
              }}>
              <ChevronRight size={22} />
            </button>
          )}

          {/* Counter */}
          {event.images.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '4px 16px',
              color: '#fff', fontSize: 13, fontWeight: 600,
            }}>
              {lightbox.idx + 1} / {event.images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   EVENT CARD (shown on listing page)
   ══════════════════════════════════════════════ */
function EventCard({ event, onClick }) {
  const cover = event.images?.[0]?.url || null;
  const count = event.images?.length || 0;

  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column',
        background: 'var(--color-canvas-white)',
        border: '1px solid var(--color-subtle-ash)',
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.10)';
        e.currentTarget.style.borderColor = 'var(--color-deep-fern-green)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--color-subtle-ash)';
      }}
      aria-label={`View ${event.eventName}`}
    >
      {/* Cover image */}
      <div style={{
        width: '100%', aspectRatio: '16/10',
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        overflow: 'hidden', position: 'relative', flexShrink: 0,
      }}>
        {cover ? (
          <img
            src={cover}
            alt={event.eventName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-deep-fern-green)',
          }}>
            <Images size={36} strokeWidth={1.5} />
          </div>
        )}

        {/* Photo count badge */}
        {count > 0 && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            borderRadius: 20, padding: '3px 10px',
            color: '#fff', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Images size={11} /> {count} photo{count !== 1 ? 's' : ''}
          </div>
        )}

        {/* Mini strip of up to 3 extra thumbnails */}
        {event.images?.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            display: 'flex', gap: 2, height: 42,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.35))',
          }}>
            {event.images.slice(1, 4).map((img, i) => (
              <div key={i} style={{
                flex: 1, overflow: 'hidden',
                opacity: 0.85,
              }}>
                <img
                  src={img.url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{
          fontFamily: 'var(--font-pp-neue-montreal)',
          fontSize: 15, fontWeight: 800,
          color: 'var(--color-rich-black)',
          lineHeight: 1.25,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {event.eventName}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 12, color: 'var(--color-cool-gray)', fontWeight: 600,
        }}>
          <CalendarDays size={12} /> {fmt(event.eventDate)}
        </div>
        {event.description && (
          <p style={{
            fontSize: 13, color: 'var(--color-cool-gray)', fontWeight: 600,
            lineHeight: 1.5, marginTop: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {event.description}
          </p>
        )}
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════
   MAIN GALLERY PAGE
   ══════════════════════════════════════════════ */
export default function Gallery() {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [selected, setSelected] = useState(null); // selected event object

  useEffect(() => {
    api
      .get('/api/gallery')
      .then(({ data }) => setEvents(data.events || []))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, []);

  // scroll to top when opening/closing detail
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selected]);

  /* ── Detail view ── */
  if (selected) {
    return <EventDetail event={selected} onBack={() => setSelected(null)} />;
  }

  /* ── Listing view ── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas-white)' }}>
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
        borderBottom: '1px solid var(--color-subtle-ash)',
        padding: '48px 0 36px',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'var(--color-deep-fern-green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Images size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-pp-neue-montreal)',
                fontSize: 'clamp(26px, 5vw, 42px)',
                fontWeight: 800,
                color: 'var(--color-rich-black)',
                lineHeight: 1.15, margin: 0,
              }}>
                Event Gallery
              </h1>
              <p style={{ fontSize: 15, color: 'var(--color-cool-gray)', marginTop: 4, fontWeight: 600 }}>
                Moments from our events and gatherings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container section">
        {loading && (
          <div className="spinner-wrap"><div className="spinner" /></div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 12, padding: '16px 20px',
            color: '#991b1b', fontSize: 14, fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="empty">
            <div className="empty-icon"><Images size={40} /></div>
            <h3>No gallery events yet</h3>
            <p style={{ fontSize: 14, marginTop: 6 }}>Check back soon for event photos.</p>
          </div>
        )}

        {!loading && events.length > 0 && (
          <>
            <p style={{ fontSize: 13, color: 'var(--color-cool-gray)', fontWeight: 600, marginBottom: 24 }}>
              {events.length} event{events.length !== 1 ? 's' : ''} · Click an event to view all photos
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}>
              {events.map((evt) => (
                <EventCard
                  key={evt._id}
                  event={evt}
                  onClick={() => setSelected(evt)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
