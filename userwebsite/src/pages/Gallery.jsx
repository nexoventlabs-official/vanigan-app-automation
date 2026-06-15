import { useState, useEffect, useCallback } from "react";
import { Images, X, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api.js";

/* ── Simple image lightbox (no event details) ── */
function Lightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const prev = useCallback(
    () => setIdx((i) => (i - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(
    () => setIdx((i) => (i + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        <X size={18} />
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Image */}
      <img
        src={images[idx].url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          objectFit: "contain",
          borderRadius: 8,
          userSelect: "none",
          display: "block",
        }}
      />

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 20,
            padding: "4px 14px",
            color: "rgba(255,255,255,0.85)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

export default function Gallery() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null); // { images, idx }

  useEffect(() => {
    api
      .get("/api/gallery")
      .then(({ data }) => setEvents(data.events || []))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, []);

  /* Flatten all images from all events into a single array */
  const allImages = events.flatMap((evt) => evt.images || []);

  const openLightbox = (idx) => setLightbox({ images: allImages, idx });
  const closeLightbox = () => setLightbox(null);

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* Hero */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)",
          borderBottom: "1px solid var(--color-subtle-ash)",
          padding: "44px 0 32px",
        }}
      >
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "var(--color-deep-fern-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Images size={24} color="#fff" />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-pp-neue-montreal)",
                  fontSize: "clamp(24px, 5vw, 40px)",
                  fontWeight: 800,
                  color: "var(--color-rich-black)",
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                Gallery
              </h1>
              {!loading && allImages.length > 0 && (
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--color-cool-gray)",
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {allImages.length} photo{allImages.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: "36px 24px" }}>
        {loading && (
          <div className="spinner-wrap">
            <div className="loader"></div>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 12,
              padding: "16px 20px",
              color: "#991b1b",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && allImages.length === 0 && (
          <div className="empty">
            <div className="empty-icon">
              <Images size={40} />
            </div>
            <h3>No gallery photos yet</h3>
            <p style={{ fontSize: 14, marginTop: 6 }}>Check back soon.</p>
          </div>
        )}

        {!loading && allImages.length > 0 && (
          <div style={{ columns: "4 180px", columnGap: 12 }}>
            {allImages.map((img, i) => (
              <button
                key={img.publicId || i}
                onClick={() => openLightbox(i)}
                style={{
                  all: "unset",
                  cursor: "zoom-in",
                  display: "block",
                  breakInside: "avoid",
                  marginBottom: 12,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid var(--color-subtle-ash)",
                  background: "#fff",
                  transition: "transform .18s ease, box-shadow .18s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 24px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <img
                  src={img.url}
                  alt=""
                  style={{ width: "100%", height: "auto", display: "block" }}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          startIdx={lightbox.idx}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}
