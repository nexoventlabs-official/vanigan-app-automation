import { useEffect, useState } from 'react';
import { Pencil, Image as ImageIcon, X, Sparkles } from 'lucide-react';
import api from '../api';

const CODE_LABEL = { free: 'Free', premium: 'Premium', premium_plus: 'Premium Plus' };

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // current plan being edited
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/plans');
      setPlans(data.plans);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const openEdit = (plan) => {
    setEditing(plan);
    setForm({
      code: plan.code,
      name: plan.name,
      priceLabel: plan.priceLabel || '',
      description: plan.description || '',
      features: (plan.features || []).join('\n'),
      sortOrder: plan.sortOrder ?? 0,
      active: !!plan.active,
      image: plan.image || '',
      imageFile: null,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form?.name) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('priceLabel', form.priceLabel);
      fd.append('description', form.description);
      fd.append('features', form.features);
      fd.append('sortOrder', String(form.sortOrder));
      fd.append('active', String(form.active));
      if (form.imageFile) fd.append('image', form.imageFile);
      await api.put(`/plans/${editing._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditing(null);
      setForm(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Subscription Plans</h1>
        <p className="text-sm text-gray-400 mt-1 font-semibold">
          Free is highlighted as the current plan to all users by default. Upload a tile image, edit the
          price label and features below.
        </p>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p._id} className="card overflow-hidden flex flex-col group hover:border-[#66ff4c]/30 hover:shadow-[0_0_20px_rgba(102,255,76,0.06)] transition-all duration-300">
              <div className="aspect-video bg-gradient-to-br from-[#06080D] to-[#0D1527] relative overflow-hidden flex items-center justify-center border-b border-white/[0.08]">
                {/* Subtle grid pattern background */}
                <div className="absolute inset-0 opacity-15" style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                  backgroundSize: '16px 16px'
                }} />
                
                {/* Radial glowing spotlight */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(102,255,76,0.05)_0%,transparent_70%)]" />

                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#66ff4c]/85 drop-shadow-[0_0_12px_rgba(102,255,76,0.3)] group-hover:scale-110 transition-transform duration-500">
                    <Sparkles size={40} className="stroke-[1.5]" />
                  </div>
                )}
                
                <span
                  className={`absolute top-3 left-3 pill ${
                    p.active 
                      ? 'bg-[#66ff4c]/10 border border-[#66ff4c]/30 text-[#66ff4c] shadow-[0_0_8px_rgba(102,255,76,0.15)]' 
                      : 'bg-white/5 border border-white/10 text-gray-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-[#66ff4c] animate-pulse' : 'bg-gray-500'}`} />
                  {p.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col bg-[#0A0E17]/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-black text-lg text-white group-hover:text-[#66ff4c] transition-colors duration-200">{p.name}</div>
                  <span className="pill bg-white/5 border border-white/[0.08] text-gray-300">{CODE_LABEL[p.code] || p.code}</span>
                </div>
                <div className="text-xl font-black text-[#66ff4c] mt-1.5 tracking-tight">{p.priceLabel || '—'}</div>
                {p.description && (
                  <p className="text-xs text-gray-400 mt-2.5 line-clamp-3 leading-relaxed">{p.description}</p>
                )}
                
                {p.features?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex-1">
                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Included Features</div>
                    <ul className="space-y-2">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <span className="text-[#66ff4c] font-bold select-none">✓</span>
                          <span className="leading-tight">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-5">
                  <button onClick={() => openEdit(p)} className="btn-secondary w-full flex items-center justify-center gap-1.5 !py-2 hover:border-[#66ff4c] hover:text-[#66ff4c] hover:shadow-[0_0_12px_rgba(102,255,76,0.12)] transition-all duration-300">
                    <Pencil size={12} className="stroke-[2.5]" /> Edit Plan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && form && (
        <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
          <form onSubmit={submit} className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#0A0E17' }}>
            <div className="px-6 py-4.5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="font-black text-white text-lg tracking-tight">
                Edit Plan — {CODE_LABEL[form.code]}
              </div>
              <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Price label</label>
                <input
                  className="input"
                  placeholder="e.g. ₹99 / month"
                  value={form.priceLabel}
                  onChange={(e) => setForm({ ...form, priceLabel: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  className="input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Features (one per line)</label>
                <textarea
                  rows={4}
                  className="input"
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Tile image</label>
                {form.image && !form.imageFile && (
                  <img src={form.image} alt="" className="w-full h-32 object-cover rounded-xl mb-3 border border-white/[0.08]" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="input"
                  onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] || null })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Sort order</label>
                  <input
                    type="number"
                    className="input"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-300 mt-7 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#000000] border-white/[0.08] text-[#66ff4c] focus:ring-[#66ff4c]/30"
                  />
                  Show in WhatsApp flow
                </label>
              </div>
            </div>

            <div className="px-6 py-4.5 border-t border-white/[0.08] flex justify-end gap-2 bg-[#06080D]/40">
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Plan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
