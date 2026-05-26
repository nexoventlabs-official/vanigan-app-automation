import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Phone, Mail, Globe, MapPin,
  Clock, Tag, ExternalLink, Image as ImageIcon, CheckCircle, XCircle, X,
} from 'lucide-react';
import api from '../api';
import DistrictAssemblySelect from '../components/DistrictAssemblySelect.jsx';

const CATEGORIES = [
  'Emart','Hospitals','Transport','Electricals','Education','Sports',
  'Real Estate','Spa and Facial','Digital Products','Anything on Hire',
  'Automobile','B2B','Banquets','Bills & Recharge','Books',
  'Cabs & Car rentals','Caterers','Civil Contractors','Courier',
  'Daily Needs','Art & Artists','Doctor','Jobs','Jewellery','Labs',
  'Language Classes','Bank','Medical','Modular Kitchen','Home Service',
  'Packers and Movers','Party','Personal Care','Pest Control',
  'Pet and Pet Care','Play School','Sports Goods','Training Institute',
  'Transporters','Travel','Wedding','Auditor','Advocate','Cinema',
  'Printing Services','Textiles','Photo Studio','Online service',
  'Manufacturer','Export Import','Retailer and Stationery','Engineering',
  'Distributor','Organic Products','Hotel and Restaurant',
  'Online Ticket Booking','Advertising','Food Stall','IT And Software',
  'All Shops','Repairs','Home Appliance','Demand Service',
  'Spices','Butcher shop','TOURISM','Construction Materials','Insurance',
  'Customs House','Shopping','Hostel and Mansion','AGRICULTURE','RELIGIOUS',
];

const EXTRA_FIELDS = [
  { name: 'category', label: 'Category', type: 'select', options: CATEGORIES },
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
  { name: 'social',           label: 'Social Media Links',           type: 'social' },
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

const SOCIAL_IDS = ['fbLink', 'twitterLink', 'instaLink', 'googleMap', 'videoUrl'];

const BLANK = {
  name: '', description: '', district: '', assembly: '', active: true,
  imageFile: null, image: '',
  _coverFile: null, coverImage: '',
  galleryImages: [], _galleryFiles: [], _galleryToRemove: [],
  services: [],
  _shownSocial: [],
  category: '', subCategory: '', address: '', landmark: '', serviceLocations: '',
  city: '', pincode: '', lat: '', lng: '',
  phone: '', whatsappNo: '', landline: '', phone2: '', email: '', website: '',
  fbLink: '', twitterLink: '', instaLink: '', googleMap: '', videoUrl: '',
  openDays: '', openTime: '', closeTime: '',
  infoQuestion: '', infoAnswer: '', listingCode: '', ownerPhone: '',
};

function CropModal({ file, aspect, onDone, onClose }) {
  const imgRef = useRef(null);
  const cropperRef = useRef(null);

  useEffect(() => {
    let objUrl;
    const init = async () => {
      objUrl = URL.createObjectURL(file);
      if (!window.Cropper) {
        if (!document.querySelector('link[href*="cropperjs"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css';
          document.head.appendChild(link);
        }
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (imgRef.current) {
        imgRef.current.src = objUrl;
        cropperRef.current = new window.Cropper(imgRef.current, {
          aspectRatio: aspect,
          viewMode: 1,
          autoCropArea: 0.9,
          movable: true,
          zoomable: true,
          rotatable: false,
        });
      }
    };
    init();
    return () => {
      cropperRef.current?.destroy();
      cropperRef.current = null;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [file, aspect]);

  const handleCrop = () => {
    if (!cropperRef.current) return;
    cropperRef.current.getCroppedCanvas({ maxWidth: 1200, maxHeight: 1200 }).toBlob(
      (blob) => { if (blob) onDone(new File([blob], file.name, { type: 'image/jpeg' })); },
      'image/jpeg', 0.9
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-4 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Crop Image</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <div className="bg-black rounded-lg overflow-hidden" style={{ maxHeight: '60vh' }}>
          <img ref={imgRef} alt="crop source" style={{ display: 'block', maxWidth: '100%' }} />
        </div>
        <div className="flex gap-3 mt-4">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="button" onClick={handleCrop} className="btn-primary flex-1">✓ Crop &amp; Use</button>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <Icon size={15} className="text-brand-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        {label && <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>}
        <div className="text-sm text-gray-700 break-words">
          {children ?? <span className="text-gray-300 italic text-xs">—</span>}
        </div>
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
  const [cropTarget, setCropTarget] = useState(null); // { file, aspect, field }

  const openCrop = (file, aspect, field) => { if (file) setCropTarget({ file, aspect, field }); };
  const onCropDone = (croppedFile) => {
    if (!cropTarget) return;
    const { field } = cropTarget;
    if (field === 'listing') setForm((f) => ({ ...f, imageFile: croppedFile }));
    else if (field === 'cover') setForm((f) => ({ ...f, _coverFile: croppedFile }));
    else if (field.startsWith('svc-')) {
      const idx = parseInt(field.split('-')[1], 10);
      setForm((f) => { const svcs = [...f.services]; svcs[idx] = { ...svcs[idx], _file: croppedFile }; return { ...f, services: svcs }; });
    }
    setCropTarget(null);
  };

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
      next.services = Array.isArray(biz.services)
        ? biz.services.slice(0, 6).map((s) => ({ name: '', price: '', detail: '', image: '', imagePublicId: '', _file: null, ...s, _file: null }))
        : [];
      SOCIAL_IDS.forEach((k) => { next[k] = biz[k] || ''; });
      next._shownSocial = SOCIAL_IDS.filter((k) => biz[k]);
    }
    setForm(next);
    setShowForm(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!form.name) { alert('Name is required.'); return; }
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
      EXTRA_FIELDS.forEach((f) => {
        const t = f.type || '';
        if (['coverimage', 'gallery', 'services', '_latlng_pair', 'social'].includes(t)) return;
        fd.append(f.name, form[f.name] ?? '');
      });
      SOCIAL_IDS.forEach((k) => fd.append(k, form[k] || ''));
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

  const SPLATFORMS_DETAIL = [
    { id: 'fbLink', label: 'Facebook', icon: '📞' },
    { id: 'twitterLink', label: 'Twitter / X', icon: '𝕏' },
    { id: 'instaLink', label: 'Instagram', icon: '📸' },
    { id: 'googleMap', label: 'Google Maps', icon: '🗺️' },
    { id: 'videoUrl', label: 'YouTube', icon: '▶️' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Crop Modal */}
      {cropTarget && (
        <CropModal file={cropTarget.file} aspect={cropTarget.aspect}
          onDone={onCropDone} onClose={() => setCropTarget(null)} />
      )}
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
        <div className="h-44 bg-gradient-to-r from-brand-800 to-brand-600 relative">
          {biz.coverImage
            ? <img src={biz.coverImage} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
            : biz.image && <img src={biz.image} alt={biz.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4 flex items-end gap-4">
            <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white flex-shrink-0">
              {biz.image
                ? <img src={biz.image} alt={biz.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300"><ImageIcon size={26} /></div>
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
          {biz.category && <span className="flex items-center gap-1 pill bg-orange-50 text-orange-700 text-xs"><Tag size={11} /> {biz.category}</span>}
          {biz.subCategory && <span className="pill bg-orange-50 text-orange-600 text-xs">{biz.subCategory}</span>}
          {biz.district && <span className="pill bg-blue-50 text-blue-700 text-xs">{biz.district}</span>}
          {biz.assembly && <span className="pill bg-blue-50 text-blue-600 text-xs">{biz.assembly}</span>}
        </div>

        {/* Body — two column */}
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="p-5 space-y-0">
            <Field icon={MapPin} label="Address">
              {biz.address ? <><div>{biz.address}</div>{biz.landmark && <div className="text-gray-400 text-xs mt-1">📍 {biz.landmark}</div>}</> : null}
            </Field>
            <Field icon={MapPin} label="City / Pincode">
              {[biz.city, biz.pincode].filter(Boolean).join(', ') || null}
            </Field>
            <Field icon={MapPin} label="Service Locations">{biz.serviceLocations || null}</Field>
            <Field icon={Phone} label="Primary Phone">
              {biz.phone ? <a href={`tel:${biz.phone}`} className="font-medium text-brand-700 hover:underline">{biz.phone}</a> : null}
            </Field>
            <Field icon={Phone} label="Alternate Phone">{biz.phone2 || null}</Field>
            <Field icon={Phone} label="WhatsApp">{biz.whatsappNo || null}</Field>
            <Field icon={Phone} label="Landline">{biz.landline || null}</Field>
            <Field icon={Mail} label="Email">
              {biz.email ? <a href={`mailto:${biz.email}`} className="text-brand-700 hover:underline">{biz.email}</a> : null}
            </Field>
            <Field icon={Globe} label="Website">
              {biz.website ? <a href={biz.website} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline flex items-center gap-1 truncate">{biz.website} <ExternalLink size={12} /></a> : null}
            </Field>
          </div>
          <div className="p-5 space-y-0">
            <Field icon={Clock} label="Opening Hours">
              {(biz.openDays || biz.openTime || biz.closeTime) ? (
                <div>
                  {biz.openDays && <div className="flex flex-wrap gap-1 mb-1.5">{biz.openDays.split(',').map(d=>d.trim()).filter(Boolean).map(d=><span key={d} className="pill bg-gray-100 text-gray-600 text-xs">{d}</span>)}</div>}
                  {(biz.openTime || biz.closeTime) && <div className="font-medium">{biz.openTime||'—'} – {biz.closeTime||'—'}</div>}
                </div>
              ) : null}
            </Field>
            <Field icon={MapPin} label="GPS Location">
              {biz.lat && biz.lng ? <a href={`https://maps.google.com/?q=${biz.lat},${biz.lng}`} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline flex items-center gap-1">View on Google Maps <ExternalLink size={12} /></a> : null}
            </Field>
            <Field icon={Tag} label="Listing Code">{biz.listingCode || null}</Field>
            <Field icon={Phone} label="Owner / WhatsApp Reg">{biz.ownerPhone || null}</Field>
            <Field icon={Clock} label="Registered on">
              {biz.createdAt ? new Date(biz.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : null}
            </Field>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">About</h2>
        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {biz.description || <span className="text-gray-300 italic">—</span>}
        </p>
      </div>

      {/* Social media */}
      <div className="card p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Social &amp; Media</h2>
        {SPLATFORMS_DETAIL.some(p => biz[p.id]) ? (
          <div className="flex flex-wrap gap-2">
            {SPLATFORMS_DETAIL.filter(p => biz[p.id]).map(p => (
              <a key={p.id} href={biz[p.id]} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm font-medium text-brand-700 hover:bg-brand-50 transition">
                <span>{p.icon}</span> {p.label}
              </a>
            ))}
          </div>
        ) : <span className="text-gray-300 italic text-sm">—</span>}
      </div>

      {/* Gallery */}
      <div className="card p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Gallery ({(biz.galleryImages||[]).length})</h2>
        {(biz.galleryImages||[]).length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {biz.galleryImages.map((img, i) => (
              <img key={i} src={img.url} alt="" className="w-full aspect-square object-cover rounded-xl border border-gray-100" />
            ))}
          </div>
        ) : <span className="text-gray-300 italic text-sm">—</span>}
      </div>

      {/* Services */}
      <div className="card p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Services / Products ({(biz.services||[]).length})</h2>
        {(biz.services||[]).length > 0 ? (
          <div className="space-y-3">
            {biz.services.map((s, i) => (
              <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                {s.image && <img src={s.image} alt={s.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-200" />}
                <div className="min-w-0">
                  <div className="font-medium text-sm">{s.name || <span className="text-gray-300">—</span>}</div>
                  {s.price && <div className="text-xs font-semibold text-brand-700 mt-0.5">₹{s.price}</div>}
                  {s.detail && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{s.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : <span className="text-gray-300 italic text-sm">—</span>}
      </div>

      {/* FAQ */}
      <div className="card p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">FAQ</h2>
        {(biz.infoQuestion || biz.infoAnswer) ? (
          <div>
            {biz.infoQuestion && <div className="font-medium text-sm mb-1">{biz.infoQuestion}</div>}
            {biz.infoAnswer && <div className="text-sm text-gray-600 whitespace-pre-line">{biz.infoAnswer}</div>}
          </div>
        ) : <span className="text-gray-300 italic text-sm">—</span>}
      </div>

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

                if (f.type === 'coverimage') {
                  const coverPrev = form._coverFile ? URL.createObjectURL(form._coverFile) : form.coverImage || null;
                  return (
                    <div key={f.name}>
                      <label className="label">{f.label} <span className="text-gray-400 font-normal text-xs">(banner ratio ~5:1)</span></label>
                      {coverPrev && <img src={coverPrev} alt="cover" className="w-full rounded-lg mb-2 object-cover" style={{height:'80px'}} />}
                      <input type="file" accept="image/*" className="input"
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) openCrop(file, 896/176, 'cover'); e.target.value = ''; }} />
                    </div>
                  );
                }

                if (f.type === 'gallery') {
                  const GALLERY_MAX = 3;
                  const existingCount = (form.galleryImages || []).length;
                  const newCount = (form._galleryFiles || []).length;
                  const totalCount = existingCount + newCount;
                  const canAdd = totalCount < GALLERY_MAX;
                  return (
                    <div key={f.name}>
                      <label className="label">{f.label} <span className="text-gray-400 font-normal text-xs">(max {GALLERY_MAX} images, {totalCount}/{GALLERY_MAX})</span></label>
                      {existingCount > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {form.galleryImages.map((img, idx) => (
                            <div key={idx} className="relative">
                              <img src={img.url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
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
                      {newCount > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {form._galleryFiles.map((file, idx) => (
                            <div key={idx} className="relative">
                              <img src={URL.createObjectURL(file)} alt="" className="w-16 h-16 object-cover rounded-lg border border-green-300" />
                              <button type="button"
                                onClick={() => setForm((prev) => ({ ...prev, _galleryFiles: prev._galleryFiles.filter((_, i) => i !== idx) }))}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none">
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {canAdd ? (
                        <input type="file" accept="image/*" multiple className="input"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const slots = GALLERY_MAX - totalCount;
                            setForm((prev) => ({ ...prev, _galleryFiles: [...(prev._galleryFiles || []), ...files.slice(0, slots)] }));
                            e.target.value = '';
                          }} />
                      ) : (
                        <div className="text-xs text-amber-600 font-medium py-2">⚠️ Gallery limit reached ({GALLERY_MAX} images max). Remove one to add more.</div>
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
                            <div className="flex-1">
                              <label className="text-xs font-semibold text-gray-600 mb-1 block">Photo <span className="text-red-500">*</span></label>
                              <input type="file" accept="image/*" className="input text-xs w-full"
                                onChange={(e) => { const file = e.target.files?.[0]; if (file) openCrop(file, 1, `svc-${i}`); e.target.value = ''; }} />
                            </div>
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
                <label className="label">Listing Image <span className="text-gray-400 font-normal text-xs">(1:1 square)</span></label>
                {(form.imageFile ? URL.createObjectURL(form.imageFile) : form.image) && (
                  <img src={form.imageFile ? URL.createObjectURL(form.imageFile) : form.image} alt="" className="w-24 h-24 object-cover rounded-xl mb-2" />
                )}
                <input type="file" accept="image/*" className="input"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) openCrop(file, 1, 'listing'); e.target.value = ''; }} />
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
