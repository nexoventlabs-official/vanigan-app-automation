import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Phone, Mail, Globe, MapPin,
  Clock, Tag, ExternalLink, Image as ImageIcon, CheckCircle, XCircle, X,
} from 'lucide-react';
import api from '../api';
import DistrictAssemblySelect from '../components/DistrictAssemblySelect.jsx';

const EXTRA_FIELDS = [
  { name: 'category',         label: 'Category',                      placeholder: 'e.g. Restaurant, Grocery, Textile' },
  { name: 'subCategory',      label: 'Sub-Category',                  placeholder: 'e.g. Fast Food, Wholesale' },
  { name: 'address',          label: 'Address',                       type: 'textarea' },
  { name: 'landmark',         label: 'Landmark / How to Reach',       placeholder: 'Near bus stand, opp. post office' },
  { name: 'serviceLocations', label: 'Service Locations',             placeholder: 'Areas you serve (optional)' },
  { name: 'city',             label: 'City',                          placeholder: 'e.g. Chennai' },
  { name: 'pincode',          label: 'Pincode',                       placeholder: '6-digit PIN' },
  { name: 'lat',              label: 'Location (GPS)',                type: 'latlng' },
  { name: 'lng',              label: '_lng',                          type: '_latlng_pair' },
  { name: 'phone',            label: 'Primary Phone',                 placeholder: '10-digit number' },
  { name: 'whatsappNo',       label: 'WhatsApp Number',               placeholder: 'If different from primary' },
  { name: 'landline',         label: 'Landline',                      placeholder: 'STD code + number' },
  { name: 'phone2',           label: 'Alternate Phone',               placeholder: 'Optional' },
  { name: 'email',            label: 'Email',                         type: 'email' },
  { name: 'website',          label: 'Website',                       type: 'url', placeholder: 'https://...' },
  { name: 'fbLink',           label: 'Facebook Page Link',            type: 'url', placeholder: 'https://facebook.com/...' },
  { name: 'twitterLink',      label: 'Twitter / X Link',              type: 'url', placeholder: 'https://twitter.com/...' },
  { name: 'googleMap',        label: 'Google Maps Link',              type: 'url', placeholder: 'https://maps.google.com/...' },
  { name: 'videoUrl',         label: 'Video URL (YouTube etc.)',      type: 'url', placeholder: 'https://youtube.com/...' },
  { name: 'openDays',         label: 'Opening Days',                  type: 'dayspicker' },
  { name: 'openTime',         label: 'Opening Time',                  type: 'time' },
  { name: 'closeTime',        label: 'Closing Time',                  type: 'time' },
  { name: 'coverImage',       label: 'Cover / Banner Image',          type: 'coverimage' },
  { name: 'galleryImages',    label: 'Gallery Images',                type: 'gallery' },
  { name: 'services',         label: 'Services / Products (up to 6)', type: 'services' },
  { name: 'infoQuestion',     label: 'FAQ Question',                  placeholder: 'Common question about your business' },
  { name: 'infoAnswer',       label: 'FAQ Answer',                    type: 'textarea' },
  { name: 'listingCode',      label: 'Listing Code',                  placeholder: 'Legacy code (optional)' },
  { name: 'ownerPhone',       label: 'Owner Phone (internal)',        placeholder: 'For WhatsApp auto-register flow' },
];

const BLANK = {
  name: '', description: '', district: '', assembly: '', active: true,
  imageFile: null, image: '',
  _coverFile: null, coverImage: '',
  galleryImages: [], _galleryFiles: [], _galleryToRemove: [],
  services: Array.from({ length: 6 }, () => ({ name: '', price: '', detail: '', image: '', imagePublicId: '', _file: null })),
  category: '', subCategory: '', address: '', landmark: '', serviceLocations: '',
  city: '', pincode: '', lat: '', lng: '',
  phone: '', whatsappNo: '', landline: '', phone2: '', email: '', website: '',
  fbLink: '', twitterLink: '', googleMap: '', videoUrl: '',
  openDays: '', openTime: '', closeTime: '',
  infoQuestion: '', infoAnswer: '', listingCode: '', ownerPhone: '',
};

function Field({ icon: Icon, label, children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <Icon size={16} className="text-brand-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        {label && <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>}
        <div className="text-sm text-gray-700 break-words">{children}</div>
      </div>
    </div>
  );
}

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [biz, setBiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/businesses/${id}`)
      .then(({ data }) => setBiz(data.item))
      .catch(() => navigate('/businesses', { replace: true }))
      .finally(() => setLoading(false));
  }, [id]);

  const openEdit = () => {
    const next = { ...BLANK };
    if (biz) {
      Object.keys(next).forEach((k) => {
        if (['imageFile', '_coverFile', '_galleryFiles', '_galleryToRemove'].includes(k)) return;
        if (k === 'services' || k === 'galleryImages') return;
        if (biz[k] !== undefined) next[k] = biz[k];
      });
      next.image = biz.image || '';
      next.coverImage = biz.coverImage || '';
      next.galleryImages = Array.isArray(biz.galleryImages) ? biz.galleryImages : [];
      if (Array.isArray(biz.services) && biz.services.length) {
        const svcs = Array.from({ length: 6 }, () => ({ name: '', price: '', detail: '', image: '', imagePublicId: '', _file: null }));
        biz.services.forEach((s, i) => { if (i < 6) svcs[i] = { ...svcs[i], ...s, _file: null }; });
        next.services = svcs;
      }
    }
    setForm(next);
    setShowForm(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!form.name) { alert('Name is required.'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description || '');
      fd.append('district', form.district);
      fd.append('assembly', form.assembly);
      fd.append('active', String(form.active));
      EXTRA_FIELDS.forEach((f) => {
        const t = f.type || '';
        if (['coverimage', 'gallery', 'services', '_latlng_pair'].includes(t)) return;
        fd.append(f.name, form[f.name] ?? '');
      });
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
      const { data } = await api.put(`/businesses/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBiz(data.item);
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this business listing?')) return;
    setDeleting(true);
    await api.delete(`/businesses/${id}`).catch(() => {});
    navigate('/businesses', { replace: true });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-brand-700 animate-pulse">Loading…</div>
  );
  if (!biz) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => navigate('/businesses')} className="btn-secondary gap-2">
          <ArrowLeft size={16} /> Back to Businesses
        </button>
        <div className="flex gap-2">
          <button onClick={openEdit} className="btn-secondary gap-2">
            <Pencil size={15} /> Edit
          </button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger gap-2">
            <Trash2 size={15} /> {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div className="card overflow-hidden">
        {/* Cover / banner area */}
        <div className="h-36 bg-gradient-to-r from-brand-800 to-brand-600 relative">
          {biz.image && (
            <img src={biz.image} alt={biz.name}
              className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
          <div className="absolute bottom-0 left-0 p-5 flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white flex-shrink-0">
              {biz.image
                ? <img src={biz.image} alt={biz.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300"><ImageIcon size={28} /></div>
              }
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-white drop-shadow">{biz.name}</h1>
              {biz.listingCode && <div className="text-xs text-white/70 mt-0.5">{biz.listingCode}</div>}
            </div>
          </div>
          <div className="absolute top-3 right-4 flex items-center gap-2">
            {biz.active
              ? <span className="flex items-center gap-1 text-xs font-semibold bg-green-500 text-white px-2.5 py-1 rounded-full"><CheckCircle size={12} /> Active</span>
              : <span className="flex items-center gap-1 text-xs font-semibold bg-gray-400 text-white px-2.5 py-1 rounded-full"><XCircle size={12} /> Inactive</span>
            }
          </div>
        </div>

        {/* Quick chips row */}
        <div className="px-5 pt-4 pb-3 flex flex-wrap gap-2 border-b border-gray-100">
          {biz.category && (
            <span className="flex items-center gap-1 pill bg-orange-50 text-orange-700 text-xs">
              <Tag size={11} /> {biz.category}
            </span>
          )}
          {biz.district && (
            <span className="pill bg-blue-50 text-blue-700 text-xs">{biz.district}</span>
          )}
          {biz.assembly && (
            <span className="pill bg-blue-50 text-blue-600 text-xs">{biz.assembly}</span>
          )}
        </div>

        {/* Body — two column on large screens */}
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">

          {/* Left column */}
          <div className="p-5 space-y-0">
            <Field icon={MapPin} label="Address">
              <div>{biz.address}</div>
              {biz.landmark && <div className="text-gray-400 text-xs mt-1">📍 {biz.landmark}</div>}
            </Field>

            <Field icon={Phone} label="Contact">
              <div className="space-y-1">
                {biz.phone && (
                  <a href={`tel:${biz.phone}`} className="block font-medium text-brand-700 hover:underline">{biz.phone}</a>
                )}
                {biz.phone2 && (
                  <a href={`tel:${biz.phone2}`} className="block text-gray-500 hover:text-brand-700">{biz.phone2}</a>
                )}
              </div>
            </Field>

            <Field icon={Mail} label="Email">
              {biz.email && (
                <a href={`mailto:${biz.email}`} className="text-brand-700 hover:underline">{biz.email}</a>
              )}
            </Field>

            <Field icon={Globe} label="Website">
              {biz.website && (
                <a href={biz.website} target="_blank" rel="noreferrer"
                  className="text-brand-700 hover:underline flex items-center gap-1 truncate">
                  {biz.website} <ExternalLink size={12} />
                </a>
              )}
            </Field>
          </div>

          {/* Right column */}
          <div className="p-5 space-y-0">
            <Field icon={Clock} label="Opening Hours">
              {(biz.openDays || biz.openTime || biz.closeTime) && (
                <div>
                  {biz.openDays && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {biz.openDays.split(',').map(d => d.trim()).filter(Boolean).map(d => (
                        <span key={d} className="pill bg-gray-100 text-gray-600 text-xs">{d}</span>
                      ))}
                    </div>
                  )}
                  {(biz.openTime || biz.closeTime) && (
                    <div className="font-medium">{biz.openTime || '—'} – {biz.closeTime || '—'}</div>
                  )}
                </div>
              )}
            </Field>

            {biz.lat && biz.lng && (
              <Field icon={MapPin} label="Location">
                <a href={`https://maps.google.com/?q=${biz.lat},${biz.lng}`}
                  target="_blank" rel="noreferrer"
                  className="text-brand-700 hover:underline flex items-center gap-1">
                  View on Google Maps <ExternalLink size={12} />
                </a>
                <div className="text-xs text-gray-400 mt-0.5">{biz.lat}, {biz.lng}</div>
              </Field>
            )}

            {biz.ownerPhone && (
              <Field icon={Phone} label="Registered by (WhatsApp)">
                <span className="text-gray-600">{biz.ownerPhone}</span>
              </Field>
            )}

            {biz.createdAt && (
              <Field icon={Clock} label="Registered on">
                {new Date(biz.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Field>
            )}
          </div>
        </div>
      </div>

      {/* Description card */}
      {biz.description && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">About</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{biz.description}</p>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={submitEdit} className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="font-semibold text-brand-800">Edit Business</div>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="label">Name *</label>
                <input className="input" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>

              <DistrictAssemblySelect required
                district={form.district} assembly={form.assembly}
                onChange={({ district, assembly }) => setForm((f) => ({ ...f, district, assembly }))} />

              {EXTRA_FIELDS.map((f) => {
                if (f.type === '_latlng_pair') return null;

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

                if (f.type === 'coverimage') return (
                  <div key={f.name}>
                    <label className="label">{f.label}</label>
                    {form.coverImage && !form._coverFile && (
                      <img src={form.coverImage} alt="cover" className="w-full h-24 object-cover rounded-lg mb-2" />
                    )}
                    <input type="file" accept="image/*" className="input"
                      onChange={(e) => setForm({ ...form, _coverFile: e.target.files?.[0] || null })} />
                  </div>
                );

                if (f.type === 'gallery') return (
                  <div key={f.name}>
                    <label className="label">{f.label}</label>
                    {(form.galleryImages || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {form.galleryImages.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img src={img.url} alt="" className="w-16 h-16 object-cover rounded border" />
                            <button type="button"
                              onClick={() => setForm((prev) => ({
                                ...prev,
                                galleryImages: prev.galleryImages.filter((_, i) => i !== idx),
                                _galleryToRemove: [...(prev._galleryToRemove || []), img.publicId].filter(Boolean),
                              }))}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none">
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {(form._galleryFiles || []).length > 0 && (
                      <div className="text-xs text-green-700 mb-1">{form._galleryFiles.length} new file(s) queued</div>
                    )}
                    <input type="file" accept="image/*" multiple className="input"
                      onChange={(e) => setForm((prev) => ({ ...prev, _galleryFiles: [...(prev._galleryFiles || []), ...Array.from(e.target.files || [])] }))} />
                  </div>
                );

                if (f.type === 'services') return (
                  <div key={f.name}>
                    <label className="label">{f.label}</label>
                    <div className="space-y-2">
                      {(form.services || []).map((s, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50/50">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Service {i + 1}</div>
                          <div className="grid grid-cols-2 gap-2">
                            <input className="input text-sm" placeholder="Name" value={s.name || ''}
                              onChange={(e) => { const svcs = [...form.services]; svcs[i] = { ...svcs[i], name: e.target.value }; setForm({ ...form, services: svcs }); }} />
                            <input className="input text-sm" placeholder="Price (₹)" value={s.price || ''}
                              onChange={(e) => { const svcs = [...form.services]; svcs[i] = { ...svcs[i], price: e.target.value }; setForm({ ...form, services: svcs }); }} />
                          </div>
                          <textarea rows={2} className="input text-sm" placeholder="Details / Description" value={s.detail || ''}
                            onChange={(e) => { const svcs = [...form.services]; svcs[i] = { ...svcs[i], detail: e.target.value }; setForm({ ...form, services: svcs }); }} />
                          <div className="flex items-center gap-2">
                            {s.image && !s._file && <img src={s.image} alt="" className="w-10 h-10 object-cover rounded" />}
                            <input type="file" accept="image/*" className="input text-xs"
                              onChange={(e) => { const svcs = [...form.services]; svcs[i] = { ...svcs[i], _file: e.target.files?.[0] || null }; setForm({ ...form, services: svcs }); }} />
                          </div>
                        </div>
                      ))}
                    </div>
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
                        }}>📍 Use current location</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input" placeholder="Latitude" value={form.lat || ''}
                        onChange={(e) => setForm({ ...form, lat: e.target.value })} />
                      <input className="input" placeholder="Longitude" value={form.lng || ''}
                        onChange={(e) => setForm({ ...form, lng: e.target.value })} />
                    </div>
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
                <textarea rows={4} className="input" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div>
                <label className="label">Listing Image</label>
                {form.image && !form.imageFile && (
                  <img src={form.image} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <input type="file" accept="image/*" className="input"
                  onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] || null })} />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Show this listing in the WhatsApp flow
              </label>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
