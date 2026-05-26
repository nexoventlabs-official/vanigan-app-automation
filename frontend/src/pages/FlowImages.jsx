import { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import api from '../api';

const GROUP_LABELS = {
  welcome_headers: 'Welcome Message Headers (per Plan)',
  banners: 'Welcome Flow Banner',
  service_icons: 'Service Selection Icons',
  sub_banners: 'Sub-Screen Banners',
  plan_icons: 'Subscription Plan Icons (fallbacks)',
};

export default function FlowImages() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState(null);
  const inputs = useRef({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/flow-images');
      setItems(data.images);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const onPick = (key) => inputs.current[key]?.click();

  const onUpload = async (key, file) => {
    if (!file) return;
    setUploadingKey(key);
    try {
      const fd = new FormData();
      fd.append('image', file);
      await api.post(`/flow-images/${key}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setUploadingKey(null);
    }
  };

  const onClear = async (key) => {
    if (!confirm('Remove this image?')) return;
    await api.delete(`/flow-images/${key}`);
    load();
  };

  const groups = items.reduce((acc, it) => {
    (acc[it.group] = acc[it.group] || []).push(it);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Flow Images</h1>
        <p className="text-sm text-gray-400 mt-1 font-semibold">
          Upload banner & icon images used by the WhatsApp chatbot and flow screens.
          Changes go live within ~10 minutes (image cache).
        </p>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading…</div>
      ) : (
        Object.keys(GROUP_LABELS).map((gkey) => {
          const group = groups[gkey] || [];
          if (!group.length) return null;
          return (
            <div key={gkey} className="card overflow-hidden bg-[#0A0E17]/60 border border-white/[0.08] shadow-2xl">
              <div className="px-5 py-3 bg-white/[0.02] border-b border-white/[0.08] font-bold text-xs uppercase tracking-wider text-gray-300">
                {GROUP_LABELS[gkey]}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-5">
                {group.map((item) => (
                  <div key={item.key} className="bg-[#06080D]/40 border border-white/[0.06] rounded-xl p-4 flex flex-col group hover:border-[#66ff4c]/30 hover:shadow-[0_0_12px_rgba(102,255,76,0.04)] transition-all duration-300">
                    <div className="aspect-video bg-gradient-to-br from-[#06080D] to-[#0D1527] rounded-lg overflow-hidden flex items-center justify-center mb-3.5 border border-white/[0.08] relative">
                      {/* Subtle pattern overlay */}
                      <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                        backgroundSize: '12px 12px'
                      }} />
                      {item.url ? (
                        <img src={item.url} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <ImageIcon size={32} className="text-gray-600 stroke-[1.5] group-hover:scale-110 transition-transform duration-500" />
                      )}
                    </div>
                    
                    <div className="text-sm font-black text-white group-hover:text-[#66ff4c] transition-colors duration-200 line-clamp-2 leading-snug">{item.label}</div>
                    <div className="text-[10px] font-mono font-bold text-gray-500 mt-1">key: {item.key}</div>
                    
                    <div className="mt-4 flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => (inputs.current[item.key] = el)}
                        className="hidden"
                        onChange={(e) => onUpload(item.key, e.target.files?.[0])}
                      />
                      <button
                        onClick={() => onPick(item.key)}
                        disabled={uploadingKey === item.key}
                        className="btn-primary !py-2 flex-1 flex items-center justify-center gap-1.5"
                      >
                        {uploadingKey === item.key ? (
                          'Uploading…'
                        ) : item.url ? (
                          <>
                            <Upload size={13} className="stroke-[2.5]" /> Replace
                          </>
                        ) : (
                          <>
                            <Upload size={13} className="stroke-[2.5]" /> Upload
                          </>
                        )}
                      </button>
                      {item.url && (
                        <button onClick={() => onClear(item.key)} className="btn bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 !py-2 !px-3.5 transition-all duration-300">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    {item.url && (
                      <div className="mt-3.5 inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded-md bg-[#66ff4c]/10 border border-[#66ff4c]/20 text-[#66ff4c] text-[10px] font-extrabold uppercase tracking-wider">
                        <CheckCircle2 size={10} className="stroke-[2.5]" /> Uploaded
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
