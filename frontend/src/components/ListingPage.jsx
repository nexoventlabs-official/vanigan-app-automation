import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Pencil, Trash2, Image as ImageIcon, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api';
import DistrictAssemblySelect from './DistrictAssemblySelect.jsx';
import SUB_CATEGORIES from '../data/subCategories.js';

/**
 * Reusable CRUD UI for Business / Organizer / Member listings.
 *
 * Props:
 *   title         page title (e.g. "Businesses")
 *   resource      API resource segment (e.g. "businesses")
 *   extraFields   array of { name, label, type, placeholder } for type-specific fields
 *   defaultDescription  short helper line shown under the title
 */
function CropModal({ file, aspect, onDone, onClose }) {
  const imgRef = useRef(null);
  const cropperRef = useRef(null);
  useEffect(() => {
    let objUrl;
    const init = async () => {
      objUrl = URL.createObjectURL(file);
      if (!window.Cropper) {
        if (!document.querySelector('link[href*="cropperjs"]')) {
          const link = document.createElement('link'); link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css';
          document.head.appendChild(link);
        }
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js';
          script.onload = resolve; document.head.appendChild(script);
        });
      }
      if (imgRef.current) {
        imgRef.current.src = objUrl;
        cropperRef.current = new window.Cropper(imgRef.current, { aspectRatio: aspect, viewMode: 1, autoCropArea: 0.9 });
      }
    };
    init();
    return () => { cropperRef.current?.destroy(); cropperRef.current = null; if (objUrl) URL.revokeObjectURL(objUrl); };
  }, [file, aspect]);
  const handleCrop = () => {
    if (!cropperRef.current) return;
    cropperRef.current.getCroppedCanvas({ maxWidth: 1200, maxHeight: 1200 }).toBlob(
      (blob) => { if (blob) onDone(new File([blob], file.name, { type: 'image/jpeg' })); }, 'image/jpeg', 0.9
    );
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-4 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Crop Image</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <div className="bg-black rounded-lg overflow-hidden" style={{ maxHeight: '60vh' }}>
          <img ref={imgRef} alt="crop" style={{ display: 'block', maxWidth: '100%' }} />
        </div>
        <div className="flex gap-3 mt-4">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="button" onClick={handleCrop} className="btn-primary flex-1">✓ Crop &amp; Use</button>
        </div>
      </div>
    </div>
  );
}

export default function ListingPage({ title, resource, extraFields = [], defaultDescription, detailPath, searchPlaceholder }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingEditRef = useRef(location.state?.editId || null);
  const blank = useMemo(() => {
    const base = {
      name: '',
      description: '',
      district: '',
      assembly: '',
      active: true,
      imageFile: null,
      image: '',
      _coverFile: null,
      coverImage: '',
      galleryImages: [],
      _galleryFiles: [],
      _galleryToRemove: [],
      services: [],
      _shownSocial: [],
    };
    extraFields.forEach((f) => {
      const t = f.type || '';
      if (['coverimage', 'gallery', 'services', '_latlng_pair', 'social'].includes(t)) return;
      if (!(f.name in base)) base[f.name] = '';
    });
    if (extraFields.some((f) => f.type === 'social')) {
      base.fbLink = ''; base.twitterLink = ''; base.googleMap = ''; base.videoUrl = ''; base.instaLink = '';
    }
    return base;
  }, [extraFields]);

  const PAGE_SIZE = 100;

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ district: '', assembly: '', q: '' });
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cropTarget, setCropTarget] = useState(null);

  const openCrop = useCallback((file, aspect, field) => { if (file) setCropTarget({ file, aspect, field }); }, []);
  const onCropDone = useCallback((croppedFile) => {
    setCropTarget((prev) => {
      if (!prev) return null;
      const { field } = prev;
      if (field === 'listing') setForm((f) => ({ ...f, imageFile: croppedFile }));
      else if (field === 'cover') setForm((f) => ({ ...f, _coverFile: croppedFile }));
      else if (field.startsWith('svc-')) {
        const idx = parseInt(field.split('-')[1], 10);
        setForm((f) => { const svcs = [...f.services]; svcs[idx] = { ...svcs[idx], _file: croppedFile }; return { ...f, services: svcs }; });
      }
      return null;
    });
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async (pg = page) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: PAGE_SIZE };
      if (filter.district) params.district = filter.district;
      if (filter.assembly) params.assembly = filter.assembly;
      if (filter.q) params.q = filter.q;
      const { data } = await api.get(`/${resource}`, { params });
      setItems(data.items || []);
      setTotal(data.total ?? data.items?.length ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, page, resource]);

  useEffect(() => { load(1); setPage(1); }, [filter.district, filter.assembly]);

  const submitFilter = (e) => { e?.preventDefault?.(); setPage(1); load(1); };

  const goPage = (p) => { const np = Math.min(Math.max(1, p), totalPages); setPage(np); load(np); };

  const openCreate = () => {
    setForm(blank);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (it) => {
    const next = { ...blank };
    Object.keys(next).forEach((k) => {
      if (['imageFile', '_coverFile', '_galleryFiles', '_galleryToRemove'].includes(k)) return;
      if (k === 'services' || k === 'galleryImages') return;
      if (it[k] !== undefined) next[k] = it[k];
    });
    next.image = it.image || '';
    next.coverImage = it.coverImage || '';
    next.galleryImages = Array.isArray(it.galleryImages) ? it.galleryImages : [];
    next.services = Array.isArray(it.services)
      ? it.services.slice(0, 6).map((s) => ({ name: '', price: '', detail: '', image: '', imagePublicId: '', ...s, _file: null }))
      : [];
    const SOCIAL_IDS = ['fbLink', 'twitterLink', 'googleMap', 'videoUrl', 'instaLink'];
    SOCIAL_IDS.forEach((k) => { next[k] = it[k] || ''; });
    next._shownSocial = SOCIAL_IDS.filter((k) => it[k]);
    setForm(next);
    setEditingId(it._id);
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      alert('Name is required.');
      return;
    }
    const missingImg = (form.services || []).findIndex((s) => (s.name || s.price || s.detail) && !s.image && !s._file);
    if (missingImg !== -1) {
      alert(`Service ${missingImg + 1} is missing an image. Each service must have a photo.`);
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
      extraFields.forEach((f) => {
        const t = f.type || '';
        if (['coverimage', 'gallery', 'services', '_latlng_pair', 'social'].includes(t)) return;
        fd.append(f.name, form[f.name] ?? '');
      });
      if (extraFields.some((f) => f.type === 'social')) {
        ['fbLink', 'twitterLink', 'googleMap', 'videoUrl', 'instaLink'].forEach((k) => fd.append(k, form[k] || ''));
      }
      if (form.imageFile) fd.append('image', form.imageFile);
      if (form._coverFile) fd.append('coverImageFile', form._coverFile);
      (form._galleryFiles || []).forEach((file) => fd.append('galleryFiles', file));
      if ((form._galleryToRemove || []).length) fd.append('galleryToRemove', form._galleryToRemove.join(','));
      (form.services || []).forEach((s, i) => {
        fd.append(`service${i + 1}Name`,   s.name   || '');
        fd.append(`service${i + 1}Price`,  s.price  || '');
        fd.append(`service${i + 1}Detail`, s.detail || '');
        if (s._file) fd.append(`service${i + 1}Image`, s._file);
      });

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
      await load(page);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (loading || !pendingEditRef.current) return;
    const editId = pendingEditRef.current;
    pendingEditRef.current = null;
    navigate(location.pathname, { replace: true, state: {} });
    api.get(`/${resource}/${editId}`)
      .then(({ data }) => { if (data.item) openEdit(data.item); })
      .catch(() => {});
  }, [loading]);

  const remove = async (id) => {
    if (!confirm('Delete this listing?')) return;
    await api.delete(`/${resource}/${id}`);
    load(page);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{title}</h1>
          <p className="text-sm text-gray-400 mt-1 font-semibold">
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
            <Search size={14} className="absolute left-3 top-3.5 text-gray-500" />
            <input
              className="input pl-8"
              placeholder={searchPlaceholder || 'Search by name…'}
              value={filter.q}
              onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn-primary">Search</button>
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

      {/* Stats bar */}
      {!loading && total > 0 && (
        <div className="text-sm text-gray-500">
          Showing <strong>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}</strong> of <strong>{total.toLocaleString()}</strong> {title.toLowerCase()}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          No {title.toLowerCase()} found. Click <strong>New {title.replace(/s$/, '')}</strong> to create one.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] border-b border-white/[0.08]">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-8">#</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-10"></th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px]">Name</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] hidden md:table-cell">District / Assembly</th>
                {resource !== 'businesses' && <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] hidden lg:table-cell">Phone</th>}
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] hidden lg:table-cell">Category</th>
                {resource !== 'businesses' && <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px]">Status</th>}
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {items.map((it, idx) => (
                <tr 
                  key={it._id} 
                  className="group hover:bg-white/[0.02] transition-colors cursor-pointer duration-200" 
                  onClick={() => navigate(`/${detailPath || resource}/${it._id}`)}
                >
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                    {it.image ? (
                      <img src={it.image} alt="" className="w-8 h-8 rounded-lg object-cover border border-white/[0.06]" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-gray-500">
                        <ImageIcon size={14} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className={`font-extrabold text-white text-sm group-hover:text-[#66ff4c] transition-colors duration-250 flex items-center flex-wrap gap-1.5 ${resource === 'businesses' ? '' : 'truncate max-w-[180px]'}`}>
                      <span>{it.name}</span>
                      {resource === 'businesses' && (
                        it.active ? (
                          <svg viewBox="0 0 24 24" width="16" height="16" className="inline-block shrink-0 align-middle select-none" fill="currentColor" title="Verified active business">
                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.358.275C14.77 2.515 13.498 1.5 12 1.5s-2.77 1.015-3.412 2.285c-.417-.175-.878-.275-1.358-.275-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.358-.275.642 1.27 1.914 2.285 3.412 2.285s2.77-1.015 3.412-2.285c.417.175.878.275 1.358.275 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" fill="#0095F6"/>
                            <path d="M9.78 16.72l-3.86-3.86 1.41-1.41 2.45 2.45 6.18-6.18 1.41 1.41-7.59 7.59z" fill="white"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="16" height="16" className="inline-block shrink-0 align-middle select-none animate-[pulse_3s_infinite]" fill="currentColor" title="Pending review">
                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.358.275C14.77 2.515 13.498 1.5 12 1.5s-2.77 1.015-3.412 2.285c-.417-.175-.878-.275-1.358-.275-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.358-.275.642 1.27 1.914 2.285 3.412 2.285s2.77-1.015 3.412-2.285c.417.175.878.275 1.358.275 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" fill="#F59E0B"/>
                            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 9c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm.5-4H10V9h1v2h1.5v1z" fill="white"/>
                          </svg>
                        )
                      )}
                    </div>
                    {it.address && <div className={`text-xs text-gray-400 mt-0.5 ${resource === 'businesses' ? '' : 'truncate max-w-[180px]'}`}>{it.address}</div>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-300 text-xs font-semibold">
                    {[it.district, it.assembly].filter(Boolean).join(' / ') || '—'}
                  </td>
                  {resource !== 'businesses' && <td className="px-4 py-3 hidden lg:table-cell text-gray-300 text-xs font-semibold">{it.phone || '—'}</td>}
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-400 text-xs font-semibold">{it.category || '—'}</td>
                  {resource !== 'businesses' && (
                    <td className="px-4 py-3">
                      <span className={`pill text-[9px] font-black uppercase tracking-widest ${
                        it.active 
                          ? 'bg-[#66ff4c]/10 border border-[#66ff4c]/30 text-[#66ff4c] shadow-[0_0_8px_rgba(102,255,76,0.12)]' 
                          : 'bg-white/5 border border-white/10 text-gray-500'
                      }`}>
                        {it.active ? 'Active' : 'Off'}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(it)} className="p-1.5 rounded-xl hover:bg-white/[0.04] text-gray-400 hover:text-[#66ff4c] transition-all" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => remove(it._id)} className="p-1.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => goPage(1)} disabled={page === 1} className="btn-secondary !px-2 !py-1 text-xs disabled:opacity-40">«</button>
            <button onClick={() => goPage(page - 1)} disabled={page === 1} className="btn-secondary !px-2 !py-1 text-xs disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            {/* Page number pills — show up to 5 around current page */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              return start + i;
            }).map((p) => (
              <button
                key={p}
                onClick={() => goPage(p)}
                className={`w-8 h-7 text-xs rounded font-medium transition ${p === page ? 'bg-brand-700 text-white' : 'btn-secondary'}`}
              >
                {p}
              </button>
            ))}
            <button onClick={() => goPage(page + 1)} disabled={page === totalPages} className="btn-secondary !px-2 !py-1 text-xs disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
            <button onClick={() => goPage(totalPages)} disabled={page === totalPages} className="btn-secondary !px-2 !py-1 text-xs disabled:opacity-40">»</button>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {cropTarget && (
        <CropModal file={cropTarget.file} aspect={cropTarget.aspect}
          onDone={onCropDone} onClose={() => setCropTarget(null)} />
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
          <form onSubmit={submit} className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#0A0E17' }}>
            <div className="px-6 py-4.5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="font-black text-white text-lg tracking-tight">
                {editingId ? `Edit ${title.replace(/s$/, '')}` : `New ${title.replace(/s$/, '')}`}
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white transition-colors">
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

              {extraFields.map((f) => {
                if (f.type === '_latlng_pair') return null; // rendered by latlng partner

                if (f.type === 'textarea') return (
                  <div key={f.name}>
                    <label className="label">{f.label}</label>
                    <textarea rows={2} className="input" placeholder={f.placeholder || ''}
                      value={form[f.name] || ''}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                  </div>
                );

                if (f.type === 'dayspicker') return (
                  <div key={f.name}>
                    <label className="label">{f.label}</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => {
                        const days = (form[f.name] || '').split(',').map(x => x.trim()).filter(Boolean);
                        const checked = days.includes(d);
                        return (
                          <label key={d} className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer border transition ${checked ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'}`}>
                            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => {
                              const next = [...days];
                              e.target.checked ? next.push(d) : next.splice(next.indexOf(d), 1);
                              setForm({ ...form, [f.name]: next.join(',') });
                            }} />
                            {d}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );

                if (f.type === 'coverimage') {
                  const coverPrev = form._coverFile ? URL.createObjectURL(form._coverFile) : form.coverImage || null;
                  return (
                    <div key={f.name}>
                      <label className="label">{f.label} <span className="text-gray-400 font-normal text-xs">(banner ~5:1)</span></label>
                      {coverPrev && <img src={coverPrev} alt="cover" className="w-full rounded-lg mb-2 object-cover" style={{ height: '80px' }} />}
                      <input type="file" accept="image/*" className="input"
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) openCrop(file, 896 / 176, 'cover'); e.target.value = ''; }} />
                    </div>
                  );
                }

                if (f.type === 'gallery') {
                  const GALLERY_MAX = 3;
                  const existingCount = (form.galleryImages || []).length;
                  const newCount = (form._galleryFiles || []).length;
                  const totalCount = existingCount + newCount;
                  return (
                    <div key={f.name}>
                      <label className="label">{f.label} <span className="text-gray-400 font-normal text-xs">({totalCount}/{GALLERY_MAX} max)</span></label>
                      {existingCount > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {form.galleryImages.map((img, idx) => (
                            <div key={idx} className="relative">
                              <img src={img.url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                              <button type="button"
                                onClick={() => setForm((prev) => ({ ...prev, galleryImages: prev.galleryImages.filter((_, i) => i !== idx), _galleryToRemove: [...(prev._galleryToRemove || []), img.publicId].filter(Boolean) }))}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {newCount > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {form._galleryFiles.map((file, idx) => (
                            <div key={idx} className="relative">
                              <img src={URL.createObjectURL(file)} alt="" className="w-16 h-16 object-cover rounded-lg border border-green-300" />
                              <button type="button"
                                onClick={() => setForm((prev) => ({ ...prev, _galleryFiles: prev._galleryFiles.filter((_, i) => i !== idx) }))}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {totalCount < GALLERY_MAX ? (
                        <input type="file" accept="image/*" multiple className="input"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const slots = GALLERY_MAX - totalCount;
                            setForm((prev) => ({ ...prev, _galleryFiles: [...(prev._galleryFiles || []), ...files.slice(0, slots)] }));
                            e.target.value = '';
                          }} />
                      ) : (
                        <div className="text-xs text-amber-600 font-medium py-2">⚠️ Limit reached ({GALLERY_MAX} max). Remove one to add more.</div>
                      )}
                    </div>
                  );
                }

                if (f.type === 'social') {
                  const SPLATFORMS = [
                    {
                      id: 'fbLink', label: 'Facebook', placeholder: 'https://facebook.com/...',
                      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2" className="shrink-0"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    },
                    {
                      id: 'twitterLink', label: 'Twitter / X', placeholder: 'https://twitter.com/...',
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0" style={{
                          background: '#000000',
                          borderRadius: '3px',
                          padding: '2px',
                          boxSizing: 'border-box'
                        }}>
                          <path fill="#ffffff" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      )
                    },
                    {
                      id: 'instaLink', label: 'Instagram', placeholder: 'https://instagram.com/...',
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0" style={{
                          background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
                          borderRadius: '3px',
                          padding: '1.8px',
                          boxSizing: 'border-box'
                        }}>
                          <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#ffffff" strokeWidth="2" />
                          <circle cx="12" cy="12" r="4.5" fill="none" stroke="#ffffff" strokeWidth="2" />
                          <circle cx="17.5" cy="6.5" r="1.5" fill="#ffffff" />
                        </svg>
                      )
                    },
                    {
                      id: 'googleMap', label: 'Google Maps', placeholder: 'https://maps.google.com/...',
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 92.3 132.3" className="shrink-0">
                          <path fill="#1a73e8" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"/>
                          <path fill="#ea4335" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"/>
                          <path fill="#4285f4" d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3"/>
                          <path fill="#fbbc04" d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3"/>
                          <path fill="#34a853" d="M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2"/>
                        </svg>
                      )
                    },
                    {
                      id: 'videoUrl', label: 'YouTube', placeholder: 'https://youtube.com/...',
                      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000" className="shrink-0"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
                    },
                  ];
                  const shown = form._shownSocial || [];
                  const available = SPLATFORMS.filter((p) => !shown.includes(p.id));
                  return (
                    <div key="social">
                      <label className="label">{f.label}</label>
                      <div className="space-y-2 mb-2">
                        {shown.map((pid) => {
                          const p = SPLATFORMS.find((x) => x.id === pid);
                          if (!p) return null;
                          return (
                            <div key={pid} className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 w-28 shrink-0">
                                {p.icon}
                                <span>{p.label}</span>
                              </span>
                              <input type="url" className="input text-sm flex-1" placeholder={p.placeholder}
                                value={form[pid] || ''}
                                onChange={(e) => setForm({ ...form, [pid]: e.target.value })} />
                              <button type="button" onClick={() => setForm({ ...form, [pid]: '', _shownSocial: shown.filter((x) => x !== pid) })}
                                className="text-red-400 hover:text-red-600 text-xl leading-none px-1">×</button>
                            </div>
                          );
                        })}
                      </div>
                      {available.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {available.map((p) => (
                            <button key={p.id} type="button"
                              onClick={() => setForm({ ...form, _shownSocial: [...shown, p.id] })}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold border border-brand-400 text-brand-700 rounded-full bg-white hover:bg-brand-50 transition">
                              <span>+</span> {p.icon} <span>{p.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                if (f.type === 'services') return (
                  <div key={f.name}>
                    <label className="label">{f.label}</label>
                    <div className="space-y-2 mb-2">
                      {(form.services || []).map((s, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50/50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Service {i + 1}</span>
                            <button type="button" onClick={() => setForm({ ...form, services: form.services.filter((_, j) => j !== i) })}
                              className="text-xs text-red-500 hover:text-red-700 font-semibold">✕ Remove</button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input className="input text-sm" placeholder="Name" value={s.name || ''}
                              onChange={(e) => { const svcs = [...form.services]; svcs[i] = { ...svcs[i], name: e.target.value }; setForm({ ...form, services: svcs }); }} />
                            <input className="input text-sm" placeholder="Price (₹)" value={s.price || ''}
                              onChange={(e) => { const svcs = [...form.services]; svcs[i] = { ...svcs[i], price: e.target.value }; setForm({ ...form, services: svcs }); }} />
                          </div>
                          <textarea rows={2} className="input text-sm" placeholder="Details / Description" value={s.detail || ''}
                            onChange={(e) => { const svcs = [...form.services]; svcs[i] = { ...svcs[i], detail: e.target.value }; setForm({ ...form, services: svcs }); }} />
                          <div className="flex items-center gap-2">
                            {(s._file ? URL.createObjectURL(s._file) : s.image) && (
                              <img src={s._file ? URL.createObjectURL(s._file) : s.image} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                            )}
                            <label className="text-xs font-semibold text-gray-600">Photo <span className="text-red-500">*</span></label>
                            <input type="file" accept="image/*" className="input text-xs flex-1"
                              onChange={(e) => { const file = e.target.files?.[0]; if (file) openCrop(file, 1, `svc-${i}`); e.target.value = ''; }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {(form.services || []).length < 6 && (
                      <button type="button"
                        onClick={() => setForm({ ...form, services: [...(form.services || []), { name: '', price: '', detail: '', image: '', imagePublicId: '', _file: null }] })}
                        className="w-full py-2 text-sm font-semibold text-brand-700 border border-dashed border-brand-400 rounded-lg bg-brand-50/40 hover:bg-brand-50 transition">
                        + Add Service
                      </button>
                    )}
                  </div>
                );

                if (f.type === 'latlng') return (
                  <div key={f.name}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="label mb-0">{f.label}</label>
                      <button type="button" className="text-xs text-brand-700 font-medium flex items-center gap-1 hover:underline animate-pulse"
                        onClick={() => {
                          if (!navigator.geolocation) return alert('Geolocation not supported');
                          navigator.geolocation.getCurrentPosition(
                            (pos) => setForm((prev) => ({ ...prev, lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) })),
                            () => alert('Location access denied')
                          );
                        }}>
                        <svg width="12" height="12" viewBox="0 0 92.3 132.3" className="shrink-0">
                          <path fill="#1a73e8" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"/>
                          <path fill="#ea4335" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"/>
                          <path fill="#4285f4" d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3"/>
                          <path fill="#fbbc04" d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3"/>
                          <path fill="#34a853" d="M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2"/>
                        </svg>
                        <span>Use current location</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input" placeholder="Latitude" value={form.lat || ''}
                        onChange={(e) => setForm({ ...form, lat: e.target.value })} />
                      <input className="input" placeholder="Longitude" value={form.lng || ''}
                        onChange={(e) => setForm({ ...form, lng: e.target.value })} />
                    </div>
                  </div>
                );

                if (f.type === 'select') return (
                  <div key={f.name}>
                    <label className="label">{f.label}</label>
                    <select className="input" value={form[f.name] || ''}
                      onChange={(e) => {
                        const next = { ...form, [f.name]: e.target.value };
                        if (f.name === 'category') next.subCategory = '';
                        setForm(next);
                      }}>
                      <option value="">— Select —</option>
                      {(f.options || []).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                );

                if (f.type === 'subcat') {
                  const opts = SUB_CATEGORIES[form.category] || [];
                  if (!opts.length) return (
                    <div key={f.name}>
                      <label className="label">{f.label}</label>
                      <input type="text" className="input" placeholder="e.g. Fast Food, Wholesale"
                        value={form[f.name] || ''}
                        onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                    </div>
                  );
                  return (
                    <div key={f.name}>
                      <label className="label">{f.label}</label>
                      <select className="input" value={form[f.name] || ''}
                        onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                        <option value="">— Select Sub-Category —</option>
                        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  );
                }

                return (
                  <div key={f.name}>
                    <label className="label">{f.label}</label>
                    <input type={f.type || 'text'} className="input" placeholder={f.placeholder || ''}
                      value={form[f.name] || ''}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                  </div>
                );
              })}

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
                <label className="label">Listing Image <span className="text-gray-400 font-normal text-xs">(1:1 square)</span></label>
                {(form.imageFile ? URL.createObjectURL(form.imageFile) : form.image) && (
                  <img src={form.imageFile ? URL.createObjectURL(form.imageFile) : form.image} alt="" className="w-24 h-24 object-cover rounded-xl mb-2" />
                )}
                <input type="file" accept="image/*" className="input"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) openCrop(file, 1, 'listing'); e.target.value = ''; }} />
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
