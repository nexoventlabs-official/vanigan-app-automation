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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Subscription Plans</h1>
        <p className="text-sm text-gray-600">
          Free is highlighted as the current plan to all users by default. Upload a tile image, edit the
          price label and features below.
        </p>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p._id} className="card overflow-hidden flex flex-col">
              <div className="aspect-video bg-gradient-to-br from-brand-100 to-brand-200 relative">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-500">
                    <Sparkles size={36} />
                  </div>
                )}
                <span
                  className={`absolute top-2 left-2 pill ${
                    p.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {p.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-brand-900">{p.name}</div>
                  <span className="pill bg-brand-50 text-brand-700">{CODE_LABEL[p.code] || p.code}</span>
                </div>
                <div className="text-sm font-medium text-brand-700 mt-1">{p.priceLabel}</div>
                {p.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{p.description}</p>
                )}
                {p.features?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    {p.features.slice(0, 4).map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto pt-3">
                  <button onClick={() => openEdit(p)} className="btn-secondary w-full !py-1.5">
                    <Pencil size={14} /> Edit Plan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && form && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={submit} className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="font-semibold text-brand-800">Edit Plan — {CODE_LABEL[form.code]}</div>
              <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-3">
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
                  <img src={form.image} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="input"
                  onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] || null })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sort order</label>
                  <input
                    type="number"
                    className="input"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm mt-6">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  Show in WhatsApp flow
                </label>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
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
