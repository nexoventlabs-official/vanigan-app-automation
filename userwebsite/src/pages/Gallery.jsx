import { useEffect, useState } from 'react';
import api from '../api';
import { CalendarDays, Images, X, ChevronLeft, ChevronRight } from 'lucide-react';

/* ── helpers ── */
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

export default function Gallery() {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  // lightbox state
  const [lightbox, setLightbox] = useState(null); // { images: [], idx: number }

  useEffect(() => {
    api
      .get('/api/gallery')
      .then(({ data }) => setEvents(data.events || []))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, []);

  const openLightbox = (images, idx) => setLightbox({ images, idx });
  const closeLightbox = () => setLightbox(null);
  const prevImg = () =>
    setLightbox((lb) => ({ ...lb, idx: (lb.idx - 1 + lb.images.length) % lb.images.length }));
  const nextImg = () =>
    setLightbox((lb) => ({ ...lb, idx: (lb.idx + 1) % lb.images.length }));

  // keyboard nav for lightbox
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') nextImg();
      if (e.key === 'ArrowLeft')  prevImg();
      if (e.key === 'Escape')     closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas-white)' }}>
      {/* ── Hero banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
        borderBottom: '1px solid var(--color-subtle-ash)',
        padding: '48px 0 36px',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'var(--color-deep-fern-green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Images size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-pp-neue-montreal)',
                fontSize: 'clamp(26px, 5vw, 42px)',
                fontWeight: 800,
                color: 'var(--color-rich-black)',
                lineHeight: 1.15,
                margin: 0,
              }}>
                Event Gallery
              </h1>
              <p style={{
                fontSize: 15,
                color: 'var(--color-cool-gray)',
                marginTop: 4,
                fontWeight: 600,
              }}>
                Moments from our events and gatherings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container section">
        {loading && (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {events.map((evt) => (
              <section key={evt._id}>
                {/* Event heading */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  gap: 16, flexWrap: 'wrap', marginBottom: 20,
                  paddingBottom: 16, borderBottom: '1px solid var(--color-subtle-ash)',
                }}>
                  <div>
                    <h2 style={{
                      fontFamily: 'var(--font-pp-neue-montreal)',
                      fontSize: 'clamp(18px, 3vw, 24px)',
                      fontWeight: 800,
                      color: 'var(--color-rich-black)',
                      margin: 0,
                      lineHeight: 1.2,
                    }}>
                      {evt.eventName}
                    </h2>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
                      fontSize: 13, color: 'var(--color-cool-gray)', fontWeight: 600,
                    }}>
                      <CalendarDays size={13} />
                      {fmt(evt.eventDate)}
                    </div>
                    {evt.description && (
                      <p style={{
                        marginTop: 8, fontSize: 14, color: 'var(--color-cool-gray)',
                        fontWeight: 600, maxWidth: 640, lineHeight: 1.5,
                      }}>
                        {evt.description}
                      </p>
                    )}
                  </div>
                  <span className="badge badge-green" style={{ flexShrink: 0 }}>
                    {evt.images?.length || 0} photo{evt.images?.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Image grid */}
                {!evt.images?.length ? (
                  <p style={{ color: 'var(--color-cool-gray)', fontSize: 13 }}>No photos for this event yet.</p>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 12,
                  }}>
                    {evt.images.map((img, idx) => (
                      <button
                        key={img.publicId}
                        onClick={() => openLightbox(evt.images, idx)}
                        style={{
                          all: 'unset', cursor: 'pointer',
                          aspectRatio: '1',
                          borderRadius: 10,
                          overflow: 'hidden',
                          display: 'block',
                          border: '1px solid var(--color-subtle-ash)',
                          position: 'relative',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.03)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        aria-label={`View photo ${idx + 1} of ${evt.eventName}`}
                      >
                        <img
                          src={img.url}
                          alt={`${evt.eventName} photo ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>
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
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.18s ease-out',
          }}
          aria-modal="true"
          role="dialog"
          aria-label="Image lightbox"
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            aria-label="Close lightbox"
          >
            <X size={20} />
          </button>

          {/* Prev */}
          {lightbox.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImg(); }}
              style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              aria-label="Previous image"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Image */}
          <img
            src={lightbox.images[lightbox.idx].url}
            alt={`Photo ${lightbox.idx + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 'min(90vw, 960px)',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: 8,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              userSelect: 'none',
            }}
          />

          {/* Next */}
          {lightbox.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImg(); }}
              style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              aria-label="Next image"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Counter */}
          {lightbox.images.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '4px 16px',
              color: '#fff', fontSize: 13, fontWeight: 600,
            }}>
              {lightbox.idx + 1} / {lightbox.images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
