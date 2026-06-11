import { useEffect, useState } from 'react';
import api from '../api';
import { CalendarDays, Images, X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

/* ══════════════════════════════════════════════════════
   LIGHTBOX
   ══════════════════════════════════════════════════════ */
function Lightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      role="dialog" aria-modal="true"
    >
      {/* Close */}
      <button onClick={onClose} aria-label="Close"
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 42, height: 42, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 10,
        }}>
        <X size={20} />
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous"
          style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            width: 46, height: 46, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10,
          }}>
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image — full contain, no crop */}
      <img
        src={images[idx].url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 'min(92vw, 1100px)',
          maxHeight: '90vh',
          objectFit: 'contain',
          borderRadius: 6,
          userSelect: 'none',
          display: 'block',
        }}
      />

      {/* Next */}
      {images.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next"
          style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            width: 46, height: 46, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10,
          }}>
          <ChevronRight size={24} />
        </button>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 20, padding: '4px 16px',
          color: '#fff', fontSize: 13, fontWeight: 700,
        }}>
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   EVENT DETAIL PAGE
   ══════════════════════════════════════════════════════ */
function EventDetail({ event, onBack }) {
  const [lightbox, setLightbox] = useState(null); // idx

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* ── Header bar ── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid var(--color-subtle-ash)',
        padding: '20px 0',
        position: 'sticky', top: 52, zIndex: 50,
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            onClick={onBack}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 700, color: 'var(--color-deep-fern-green)',
              padding: '6px 12px 6px 8px',
              border: '1.5px solid var(--color-deep-fern-green)',
              borderRadius: 8,
              transition: 'background .15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ArrowLeft size={14} /> Gallery
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontFamily: 'var(--font-pp-neue-montreal)',
              fontSize: 'clamp(17px, 3vw, 24px)',
              fontWeight: 800,
              color: 'var(--color-rich-black)',
              margin: 0,
              lineHeight: 1.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {event.eventName}
            </h1>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-cool-gray)', fontWeight: 600 }}>
                <CalendarDays size={12} /> {fmt(event.eventDate)}
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-cool-gray)', fontWeight: 600 }}>
                {event.images?.length || 0} photo{event.images?.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Description ── */}
      {event.description && (
        <div style={{ background: '#f0fdf4', borderBottom: '1px solid #d1fae5', padding: '16px 0' }}>
          <div className="container">
            <p style={{
              fontSize: 14, color: 'var(--color-cool-gray)', fontWeight: 600,
              lineHeight: 1.65, margin: 0, maxWidth: 760,
            }}>
              {event.description}
            </p>
          </div>
        </div>
      )}

      {/* ── Images ── */}
      <div className="container" style={{ padding: '32px 24px' }}>
        {!event.images?.length ? (
          <div className="empty">
            <div className="empty-icon"><Images size={36} /></div>
            <h3>No photos yet</h3>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {event.images.map((img, idx) => (
              <button
                key={img.publicId}
                onClick={() => setLightbox(idx)}
                style={{
                  all: 'unset', cursor: 'zoom-in',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#f5f5f5',
                  border: '1px solid var(--color-subtle-ash)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  /* No fixed aspect-ratio — image drives its own height */
                  transition: 'transform .2s ease, box-shadow .2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.13)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                aria-label={`View photo ${idx + 1}`}
              >
                {/* Full image — no crop, width 100%, height auto */}
                <img
                  src={img.url}
                  alt={`${event.eventName} – ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox
          images={event.images}
          startIdx={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   GALLERY LISTING — images only, no card UI
   ══════════════════════════════════════════════════════ */
export default function Gallery() {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api
      .get('/api/gallery')
      .then(({ data }) => setEvents(data.events || []))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selected]);

  /* Detail view */
  if (selected) {
    return <EventDetail event={selected} onBack={() => setSelected(null)} />;
  }

  /* ── flatten all images with their parent event ── */
  const allImages = events.flatMap((evt) =>
    (evt.images || []).map((img) => ({ ...img, event: evt }))
  );

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)',
        borderBottom: '1px solid var(--color-subtle-ash)',
        padding: '44px 0 32px',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
                fontSize: 'clamp(24px, 5vw, 40px)',
                fontWeight: 800, color: 'var(--color-rich-black)',
                lineHeight: 1.15, margin: 0,
              }}>
                Event Gallery
              </h1>
              <p style={{ fontSize: 14, color: 'var(--color-cool-gray)', marginTop: 4, fontWeight: 600 }}>
                Click any photo to view the full event
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: '36px 24px' }}>
        {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 12, padding: '16px 20px',
            color: '#991b1b', fontSize: 14, fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        {!loading && !error && allImages.length === 0 && (
          <div className="empty">
            <div className="empty-icon"><Images size={40} /></div>
            <h3>No gallery photos yet</h3>
            <p style={{ fontSize: 14, marginTop: 6 }}>Check back soon.</p>
          </div>
        )}

        {!loading && allImages.length > 0 && (
          <div style={{
            columns: '4 200px',   /* masonry-like multi-column */
            columnGap: 14,
          }}>
            {allImages.map((item, i) => (
              <button
                key={`${item.event._id}-${item.publicId}`}
                onClick={() => setSelected(item.event)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'block',
                  breakInside: 'avoid',
                  marginBottom: 14,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid var(--color-subtle-ash)',
                  background: '#fff',
                  position: 'relative',
                  transition: 'transform .2s ease, box-shadow .2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.13)';
                  e.currentTarget.querySelector('.img-overlay').style.opacity = '1';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.querySelector('.img-overlay').style.opacity = '0';
                }}
                aria-label={`View event: ${item.event.eventName}`}
              >
                {/* Full image — no crop */}
                <img
                  src={item.url}
                  alt={item.event.eventName}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                  loading="lazy"
                />

                {/* Hover overlay with event name */}
                <div
                  className="img-overlay"
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, transparent 55%)',
                    opacity: 0,
                    transition: 'opacity .2s ease',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    padding: '12px 12px 10px',
                    borderRadius: 10,
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-pp-neue-montreal)',
                    fontWeight: 800, fontSize: 13,
                    color: '#fff', lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {item.event.eventName}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600,
                  }}>
                    <CalendarDays size={10} /> {fmt(item.event.eventDate)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
