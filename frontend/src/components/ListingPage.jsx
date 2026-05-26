import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Pencil, Trash2, Image as ImageIcon, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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

export default function ListingPage({ title, resource, extraFields = [], defaultDescription, detailPath }) {
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
      ? it.services.slice(0, 6).map((s) => ({ name: '', price: '', detail: '', image: '', imagePublicId: '', _file: null, ...s, _file: null }))
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
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 w-8">#</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 w-10"></th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 hidden md:table-cell">District / Assembly</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 hidden lg:table-cell">Phone</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 hidden lg:table-cell">Category</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-2.5 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((it, idx) => (
                <tr key={it._id} className="hover:bg-orange-50/40 transition-colors cursor-pointer" onClick={() => navigate(`/${detailPath || resource}/${it._id}`)}>
                  <td className="px-4 py-2 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    {it.image ? (
                      <img src={it.image} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-300">
                        <ImageIcon size={14} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium text-brand-900 truncate max-w-[180px]">{it.name}</div>
                    {it.address && <div className="text-xs text-gray-400 truncate max-w-[180px]">{it.address}</div>}
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell text-gray-600 text-xs">
                    {[it.district, it.assembly].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="px-4 py-2 hidden lg:table-cell text-gray-600 text-xs">{it.phone || '—'}</td>
                  <td className="px-4 py-2 hidden lg:table-cell text-gray-500 text-xs">{it.category || '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`pill text-xs ${it.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {it.active ? 'Active' : 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(it)} className="p-1.5 rounded hover:bg-brand-50 text-brand-700" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => remove(it._id)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete">
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
                    { id: 'fbLink',      label: 'Facebook',    placeholder: 'https://facebook.com/...' },
                    { id: 'twitterLink', label: 'Twitter / X', placeholder: 'https://twitter.com/...' },
                    { id: 'instaLink',   label: 'Instagram',   placeholder: 'https://instagram.com/...' },
                    { id: 'googleMap',   label: 'Google Maps', placeholder: 'https://maps.google.com/...' },
                    { id: 'videoUrl',    label: 'YouTube',     placeholder: 'https://youtube.com/...' },
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
                              <span className="text-xs font-semibold text-gray-500 w-24 shrink-0">{p.label}</span>
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
                              className="px-3 py-1 text-xs font-semibold border border-brand-400 text-brand-700 rounded-full bg-white hover:bg-brand-50 transition">
                              + {p.label}
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
                      <button type="button" className="text-xs text-brand-700 font-medium flex items-center gap-1 hover:underline"
                        onClick={() => {
                          if (!navigator.geolocation) return alert('Geolocation not supported');
                          navigator.geolocation.getCurrentPosition(
                            (pos) => setForm((prev) => ({ ...prev, lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) })),
                            () => alert('Location access denied')
                          );
                        }}>
                        📍 Use current location
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
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                      <option value="">— Select —</option>
                      {(f.options || []).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                );

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
