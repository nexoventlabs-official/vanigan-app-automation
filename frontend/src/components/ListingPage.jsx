import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Image as ImageIcon, X, Search } from 'lucide-react';
import api from '../api';
import DistrictAssemblySelect from './DistrictAssemblySelect.jsx';

/**
 * Reusable CRUD UI for Business / Organizer / Member listings.
 *
 * Props:
 *   title         page title (e.g. "Businesses")
 *   resource      API resource segment (e.g. "businesses")
 *   extraFields   array of { name, label, type, placeholder } for type-specific fields
 *   defaultDescription  short helper line shown under the title
 */
export default function ListingPage({ title, resource, extraFields = [], defaultDescription }) {
  const blank = useMemo(() => {
    const base = {
      name: '',
      description: '',
      district: '',
      assembly: '',
      active: true,
      imageFile: null,
      image: '',
    };
    extraFields.forEach((f) => (base[f.name] = ''));
    return base;
  }, [extraFields]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ district: '', assembly: '', q: '' });
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.district) params.district = filter.district;
      if (filter.assembly) params.assembly = filter.assembly;
      if (filter.q) params.q = filter.q;
      const { data } = await api.get(`/${resource}`, { params });
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.district, filter.assembly]);

  const submitFilter = (e) => {
    e?.preventDefault?.();
    load();
  };

  const openCreate = () => {
    setForm(blank);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (it) => {
    const next = { ...blank };
    Object.keys(next).forEach((k) => {
      if (k === 'imageFile') return;
      if (it[k] !== undefined) next[k] = it[k];
    });
    next.image = it.image || '';
    setForm(next);
    setEditingId(it._id);
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.district || !form.assembly) {
      alert('Name, District and Assembly are required.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description || '');
      fd.append('district', form.district);
      fd.append('assembly', form.assembly);
      fd.append('active', String(form.active));
      extraFields.forEach((f) => fd.append(f.name, form[f.name] || ''));
      if (form.imageFile) fd.append('image', form.imageFile);

      if (editingId) {
        await api.put(`/${resource}/${editingId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post(`/${resource}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setShowForm(false);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this listing?')) return;
    await api.delete(`/${resource}/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">{title}</h1>
          <p className="text-sm text-gray-600">
            {defaultDescription || `${items.length} total — shown in the WhatsApp flow after the user picks a district & assembly.`}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> New {title.replace(/s$/, '')}
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={submitFilter} className="card p-4 space-y-3">
        <DistrictAssemblySelect
          allowEmpty
          district={filter.district}
          assembly={filter.assembly}
          onChange={({ district, assembly }) => setFilter((f) => ({ ...f, district, assembly }))}
        />
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-3 text-gray-400" />
            <input
              className="input pl-8"
              placeholder="Search by name…"
              value={filter.q}
              onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn-secondary">Search</button>
          <button
            type="button"
            onClick={() => {
              setFilter({ district: '', assembly: '', q: '' });
            }}
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
      </form>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          No {title.toLowerCase()} yet. Click <strong>New {title.replace(/s$/, '')}</strong> to create one.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <div key={it._id} className="card overflow-hidden flex flex-col">
              <div className="aspect-video bg-gray-100 relative">
                {it.image ? (
                  <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={32} />
                  </div>
                )}
                <span
                  className={`absolute top-2 left-2 pill ${
                    it.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {it.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="font-semibold text-brand-900">{it.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {it.assembly}, {it.district}
                </div>
                {it.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{it.description}</p>
                )}
                <div className="mt-auto pt-3 flex gap-2">
                  <button onClick={() => openEdit(it)} className="btn-secondary flex-1 !py-1.5">
                    <Pencil size={14} /> Edit
                  </button>
                  <button onClick={() => remove(it._id)} className="btn-danger !py-1.5">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={submit} className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="font-semibold text-brand-800">
                {editingId ? `Edit ${title.replace(/s$/, '')}` : `New ${title.replace(/s$/, '')}`}
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
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

              <DistrictAssemblySelect
                required
                district={form.district}
                assembly={form.assembly}
                onChange={({ district, assembly }) => setForm((f) => ({ ...f, district, assembly }))}
              />

              {extraFields.map((f) => (
                <div key={f.name}>
                  <label className="label">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    className="input"
                    placeholder={f.placeholder || ''}
                    value={form[f.name] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  />
                </div>
              ))}

              <div>
                <label className="label">Description</label>
                <textarea
                  rows={4}
                  className="input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Listing Image</label>
                {form.image && !form.imageFile && (
                  <img src={form.image} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="input"
                  onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] || null })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Square or landscape; shown as the radio-item icon in the WhatsApp flow.
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Show this listing in the WhatsApp flow
              </label>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
