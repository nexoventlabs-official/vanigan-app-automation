import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw, Pencil, Trash2, Image as ImageIcon, X } from 'lucide-react';
import api from '../api';
import DistrictAssemblySelect from '../components/DistrictAssemblySelect.jsx';

const BLANK = { name: '', description: '', role: '', district: '', assembly: '', phone: '', email: '', active: true, imageFile: null, image: '' };

export default function Organizers() {
  const navigate   = useNavigate();
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [q,        setQ]        = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(BLANK);
  const [editingId,setEditingId]= useState(null);
  const [saving,   setSaving]   = useState(false);

  const LIMIT = 100;

  const load = useCallback(async (pg = 1, query = q) => {
    setLoading(true);
    try {
      const r = await api.get('/organizers', { params: { page: pg, limit: LIMIT, q: query } });
      setItems(r.data.items || []);
      setTotal(r.data.total || 0);
      setPage(pg);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [q]);

  useEffect(() => { load(); }, []);

  // When clicking an organizer row, look up their business by phone
  const handleRowClick = async (org) => {
    if (!org.phone) return;
    try {
      const r = await api.get('/businesses', { params: { q: org.phone, limit: 1 } });
      const biz = r.data.items?.[0];
      if (biz?._id) navigate(`/businesses/${biz._id}`);
    } catch { /* no business found, do nothing */ }
  };

  const openCreate = () => { setForm(BLANK); setEditingId(null); setShowForm(true); };
  const openEdit = (it) => {
    setForm({ ...BLANK, ...it, imageFile: null });
    setEditingId(it._id);
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name) { alert('Name is required.'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      ['name','description','role','district','assembly','phone','email'].forEach(k => fd.append(k, form[k] || ''));
      fd.append('active', String(form.active));
      if (form.imageFile) fd.append('image', form.imageFile);
      const opts = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editingId) await api.put(`/organizers/${editingId}`, fd, opts);
      else           await api.post('/organizers', fd, opts);
      setShowForm(false);
      load(page);
    } catch (err) { alert(err.response?.data?.error || err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this organizer?')) return;
    await api.delete(`/organizers/${id}`);
    load(page);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Organizers</h1>
          <p className="text-sm text-gray-400 mt-1 font-semibold">{total} organizers · click a row to view their business</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> New Organizer</button>
      </div>

      {/* Search */}
      <form onSubmit={e => { e.preventDefault(); load(1, q); }} className="card p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-3.5 text-gray-500" />
            <input className="input pl-8" placeholder="Search by name…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary">Search</button>
          <button type="button" onClick={() => { setQ(''); load(1, ''); }} className="btn-secondary">Clear</button>
        </div>
      </form>

      {/* Table */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">No organizers yet. Click <strong>New Organizer</strong> to create one.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] border-b border-white/[0.08]">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-8">#</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-10"></th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px]">Name</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] hidden md:table-cell">Location</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] hidden lg:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px]">Status</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {items.map((it, idx) => (
                <tr key={it._id} onClick={() => handleRowClick(it)}
                  className="group hover:bg-white/[0.02] transition-colors cursor-pointer duration-200">
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{(page - 1) * LIMIT + idx + 1}</td>
                  <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                    {it.image
                      ? <img src={it.image} alt="" className="w-8 h-8 rounded-lg object-cover border border-white/[0.06]" />
                      : <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-gray-500"><ImageIcon size={14} /></div>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-white text-sm group-hover:text-[#66ff4c] transition-colors">{it.name}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">{it.role || '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-300 text-xs font-semibold">
                    {[it.district, it.assembly].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-300 text-xs">{it.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`pill text-[9px] font-black uppercase tracking-widest ${it.active ? 'bg-[#66ff4c]/10 border border-[#66ff4c]/30 text-[#66ff4c]' : 'bg-white/5 border border-white/10 text-gray-500'}`}>
                      {it.active ? 'Active' : 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(it)} className="p-1.5 rounded-xl hover:bg-white/[0.04] text-gray-400 hover:text-[#66ff4c] transition-all" title="Edit"><Pencil size={13} /></button>
                      <button onClick={e => remove(it._id, e)} className="p-1.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all" title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#0A0E17' }}>
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="font-black text-white text-lg">{editingId ? 'Edit Organizer' : 'New Organizer'}</div>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="label">Name *</label>
                <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="label">Role</label>
                <input className="input" placeholder="e.g. Cluster Lead" value={form.role} onChange={e => setForm({...form, role: e.target.value})} />
              </div>
              <DistrictAssemblySelect required district={form.district} assembly={form.assembly}
                onChange={({district, assembly}) => setForm(f => ({...f, district, assembly}))} />
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea rows={2} className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div>
                <label className="label">Photo</label>
                {form.image && !form.imageFile && <img src={form.image} alt="" className="w-16 h-16 rounded-lg object-cover mb-2 border" />}
                <input type="file" accept="image/*" className="input" onChange={e => setForm({...form, imageFile: e.target.files?.[0] || null})} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="activeChk" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} />
                <label htmlFor="activeChk" className="text-sm text-gray-300">Active</label>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
