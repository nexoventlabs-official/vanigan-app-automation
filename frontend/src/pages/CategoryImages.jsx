import { useEffect, useRef, useState, useCallback } from 'react';
import { Upload, Trash2, Image as ImageIcon, CheckCircle2, X } from 'lucide-react';
import api from '../api';

export default function CategoryImages() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(null);   // category currently uploading
  const [crop, setCrop]         = useState(null);   // { category, objectUrl }
  const imgRef  = useRef(null);
  const cropRef = useRef(null);
  const inputs  = useRef({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/category-images');
      setItems(data.images);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Open file picker for a category */
  const onPick = (category) => inputs.current[category]?.click();

  /* File chosen → show crop modal */
  const onFileChosen = (category, file) => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCrop({ category, objectUrl });
  };

  /* After crop modal mounts, initialise Cropper (CDN) */
  useEffect(() => {
    if (!crop || !imgRef.current) return;
    let objUrl = crop.objectUrl;
    const init = async () => {
      if (!window.Cropper) {
        if (!document.querySelector('link[href*="cropperjs"]')) {
          const link = document.createElement('link'); link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css';
          document.head.appendChild(link);
        }
        await new Promise((resolve) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js';
          s.onload = resolve; document.head.appendChild(s);
        });
      }
      if (imgRef.current) {
        imgRef.current.src = objUrl;
        cropRef.current = new window.Cropper(imgRef.current, { aspectRatio: 1, viewMode: 1, autoCropArea: 1 });
      }
    };
    init();
    return () => { cropRef.current?.destroy(); cropRef.current = null; };
  }, [crop]);

  /* Cancel crop */
  const cancelCrop = () => {
    if (crop?.objectUrl) URL.revokeObjectURL(crop.objectUrl);
    setCrop(null);
    if (cropRef.current) { cropRef.current.destroy(); cropRef.current = null; }
  };

  /* Apply crop & upload */
  const applyCrop = () => {
    if (!cropRef.current) return;
    const canvas = cropRef.current.getCroppedCanvas({ width: 400, height: 400, imageSmoothingQuality: 'high' });
    canvas.toBlob(async (blob) => {
      const { category } = crop;
      cancelCrop();
      setBusy(category);
      try {
        const fd = new FormData();
        fd.append('image', blob, 'category.jpg');
        await api.post(`/category-images/${encodeURIComponent(category)}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        await load();
      } catch (err) {
        alert(err.response?.data?.error || err.message);
      } finally {
        setBusy(null);
      }
    }, 'image/jpeg', 0.92);
  };

  /* Remove image */
  const onRemove = async (category) => {
    if (!confirm(`Remove image for "${category}"?`)) return;
    try {
      await api.delete(`/category-images/${encodeURIComponent(category)}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Category Images</h1>
        <p className="text-sm text-gray-400 mt-1 font-semibold">
          Upload a square (1:1) image for each business category. These images appear in the
          WhatsApp flow category selection screen.
        </p>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading…</div>
      ) : (
        <div className="card overflow-hidden bg-[#0A0E17]/60 border border-white/[0.08] shadow-2xl">
          <div className="px-5 py-3 bg-white/[0.02] border-b border-white/[0.08] font-bold text-xs uppercase tracking-wider text-gray-300">
            All Categories — {items.length} total
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-5">
            {items.map((item) => (
              <div
                key={item.category}
                className="bg-[#06080D]/40 border border-white/[0.06] rounded-xl p-3 flex flex-col group hover:border-[#66ff4c]/30 hover:shadow-[0_0_12px_rgba(102,255,76,0.04)] transition-all duration-300"
              >
                {/* Square image preview */}
                <div className="aspect-square bg-gradient-to-br from-[#06080D] to-[#0D1527] rounded-lg overflow-hidden flex items-center justify-center mb-3 border border-white/[0.08] relative">
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '12px 12px',
                  }} />
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ImageIcon size={28} className="text-gray-600 stroke-[1.5]" />
                  )}
                </div>

                <div className="text-xs font-black text-white group-hover:text-[#66ff4c] transition-colors leading-snug mb-2 line-clamp-2">
                  {item.category}
                </div>

                <div className="mt-auto flex gap-1.5">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={(el) => (inputs.current[item.category] = el)}
                    className="hidden"
                    onChange={(e) => onFileChosen(item.category, e.target.files?.[0])}
                    onClick={(e) => { e.target.value = ''; }}
                  />
                  <button
                    onClick={() => onPick(item.category)}
                    disabled={!!busy}
                    className="btn-primary !py-1.5 flex-1 flex items-center justify-center gap-1 text-xs"
                  >
                    {busy === item.category ? (
                      <span className="animate-pulse">Uploading…</span>
                    ) : (
                      <>
                        <Upload size={11} className="stroke-[2.5]" />
                        {item.imageUrl ? 'Replace' : 'Upload'}
                      </>
                    )}
                  </button>
                  {item.imageUrl && (
                    <button
                      onClick={() => onRemove(item.category)}
                      disabled={!!busy}
                      className="btn bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 !py-1.5 !px-2.5 transition-all duration-300"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>

                {item.imageUrl && (
                  <div className="mt-2 inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded-md bg-[#66ff4c]/10 border border-[#66ff4c]/20 text-[#66ff4c] text-[9px] font-extrabold uppercase tracking-wider">
                    <CheckCircle2 size={9} className="stroke-[2.5]" /> Set
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Crop modal ── */}
      {crop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A0E17] border border-white/[0.12] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
              <div className="font-extrabold text-white text-sm">Crop to 1:1 Square</div>
              <button onClick={cancelCrop} className="text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-4" style={{ maxHeight: '60vh', overflow: 'hidden' }}>
              <img
                ref={imgRef}
                src={crop.objectUrl}
                alt="crop"
                style={{ display: 'block', maxWidth: '100%' }}
              />
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-white/[0.08]">
              <button
                onClick={cancelCrop}
                className="btn flex-1 bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08]"
              >
                Cancel
              </button>
              <button onClick={applyCrop} className="btn-primary flex-1">
                Use This Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
