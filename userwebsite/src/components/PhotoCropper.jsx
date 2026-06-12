import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

/*
  Card photo dimensions (TNVS exact): 137 × 136 px
  Aspect ratio: 137/136 ≈ 1.0074  — essentially square with tiny portrait lean.
  We use exactly 137/136 so the cropped image matches the card slot perfectly.
*/
const CROP_ASPECT = 137 / 136;

/* ── getCroppedImg — draw the crop area onto a canvas and return a Blob + dataURL ── */
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  // Output at 2× the card slot size for sharpness: 274×272
  const OUT_W = 274;
  const OUT_H = 272;
  canvas.width  = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, OUT_W, OUT_H,
  );
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      },
      'image/jpeg',
      0.95,
    );
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* ── PhotoCropper modal ── */
export default function PhotoCropper({ imageSrc, onDone, onCancel }) {
  const [crop, setCrop]           = useState({ x: 0, y: 0 });
  const [zoom, setZoom]           = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [processing, setProcessing]   = useState(false);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedArea) return;
    setProcessing(true);
    try {
      const result = await getCroppedImg(imageSrc, croppedArea);
      // Convert blob to File so it can be sent as FormData
      const file = new File([result.blob], 'photo.jpg', { type: 'image/jpeg' });
      onDone({ file, previewUrl: result.url });
    } catch (e) {
      console.error('Crop failed:', e);
    }
    setProcessing(false);
  };

  return (
    /* Fullscreen overlay */
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>

      {/* Header */}
      <div style={{
        width: '100%', maxWidth: 480,
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
            Crop Your Photo
          </p>
          <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: 11, fontFamily: 'Arial, sans-serif' }}>
            Drag to reposition · Pinch or scroll to zoom · Ratio locked to card size (137×136)
          </p>
        </div>
        <button onClick={onCancel} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
          borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
        }}>✕ Cancel</button>
      </div>

      {/* Crop area */}
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: 480,
        height: 360,
        background: '#111',
      }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={CROP_ASPECT}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          cropShape="rect"
          showGrid={true}
          style={{
            containerStyle: { borderRadius: 0 },
            cropAreaStyle: {
              border: '2px solid #009245',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
            },
          }}
        />
      </div>

      {/* Zoom slider */}
      <div style={{ width: '100%', maxWidth: 480, padding: '16px 20px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#64748b', fontSize: 16 }}>🔍−</span>
          <input
            type="range" min={1} max={3} step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#009245' }}
          />
          <span style={{ color: '#64748b', fontSize: 16 }}>🔍+</span>
        </div>
      </div>

      {/* Guide note */}
      <div style={{
        width: '100%', maxWidth: 480,
        padding: '0 20px 14px',
      }}>
        <div style={{
          background: 'rgba(0,146,69,0.12)', border: '1px solid rgba(0,146,69,0.3)',
          borderRadius: 10, padding: '10px 14px',
          color: '#4ade80', fontSize: 12, fontFamily: 'Arial, sans-serif', lineHeight: 1.5,
        }}>
          💡 Frame your face clearly — this photo will appear on your membership card.
          Keep head centred and some space around the shoulders.
        </div>
      </div>

      {/* Apply button */}
      <div style={{ width: '100%', maxWidth: 480, padding: '0 20px 24px' }}>
        <button
          onClick={handleApply}
          disabled={processing}
          style={{
            width: '100%', height: 48, borderRadius: 12, border: 'none',
            background: processing ? '#475569' : 'linear-gradient(135deg, #009245 0%, #006d34 100%)',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          {processing ? 'Processing…' : '✅ Use This Crop'}
        </button>
      </div>

    </div>
  );
}
