import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Phone, Mail, Globe, MapPin,
  Clock, Tag, ExternalLink, Image as ImageIcon, CheckCircle, XCircle, X, Star,
} from 'lucide-react';
import api from '../api';
import DistrictAssemblySelect from '../components/DistrictAssemblySelect.jsx';
import SUB_CATEGORIES from '../data/subCategories.js';

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
  { name: 'subCategory',      label: 'Sub-Category',                  type: 'subcat' },
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
  { name: 'listingCode',      label: 'Listing Code',                  placeholder: 'Auto-generated if blank' },
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#0A0E17] border border-white/[0.08] rounded-2xl p-5 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-white">Crop Image</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-all"><X size={18} /></button>
        </div>
        <div className="bg-black rounded-xl overflow-hidden border border-white/[0.08]" style={{ maxHeight: '60vh' }}>
          <img ref={imgRef} alt="crop source" style={{ display: 'block', maxWidth: '100%' }} />
        </div>
        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="button" onClick={handleCrop} className="btn-primary flex-1">✓ Crop &amp; Use</button>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.06] last:border-0">
      <Icon size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        {label && <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>}
        <div className="text-sm text-gray-200 break-words font-medium">
          {children ?? <span className="text-gray-600 italic text-xs">—</span>}
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
  const [reviews, setReviews] = useState([]);

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
    setLoading(true);
    Promise.all([
      api.get(`/businesses/${id}`),
      api.get('/reviews', { params: { kind: 'business', targetId: id } }).catch(() => ({ data: { reviews: [] } }))
    ])
      .then(([bizRes, revRes]) => {
        setBiz(bizRes.data.item);
        setReviews(revRes.data.reviews || []);
      })
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

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-brand-700 animate-pulse">Loading…</div>
  );
  if (!biz) return null;

  const SPLATFORMS_DETAIL = [
    {
      id: 'fbLink', label: 'Facebook', color: '#1877F2', bg: '#e7f0fd',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    },
    {
      id: 'twitterLink', label: 'Twitter / X', color: '#000000', bg: '#f0f0f0',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" style={{
          background: '#000000',
          borderRadius: '4px',
          padding: '2.5px',
          boxSizing: 'border-box',
          display: 'block'
        }}>
          <path fill="#ffffff" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      id: 'instaLink', label: 'Instagram', color: '#C13584', bg: '#fce4f1',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" style={{
          background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
          borderRadius: '4px',
          padding: '2.2px',
          boxSizing: 'border-box',
          display: 'block'
        }}>
          <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#ffffff" strokeWidth="2" />
          <circle cx="12" cy="12" r="4.5" fill="none" stroke="#ffffff" strokeWidth="2" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="#ffffff" />
        </svg>
      ),
    },
    {
      id: 'googleMap', label: 'Google Maps', color: '#1A73E8', bg: '#e8f0fe',
      icon: (
        <svg width="16" height="16" viewBox="0 0 92.3 132.3">
          <path fill="#1a73e8" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"/>
          <path fill="#ea4335" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"/>
          <path fill="#4285f4" d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3"/>
          <path fill="#fbbc04" d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3"/>
          <path fill="#34a853" d="M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2"/>
        </svg>
      ),
    },
    {
      id: 'videoUrl', label: 'YouTube', color: '#FF0000', bg: '#ffe8e8',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>,
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Crop Modal */}
      {cropTarget && (
        <CropModal file={cropTarget.file} aspect={cropTarget.aspect}
          onDone={onCropDone} onClose={() => setCropTarget(null)} />
      )}

      {/* Main unified layout sheet inspired by Sisyphus Ventures */}
      <div className="w-full bg-[#0A0E17]/30 border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Cover banner & Profile Header */}
        <div className="relative">
          {/* Cover banner */}
          <div className="h-52 bg-gradient-to-r from-[#0B0F19] to-[#06080D] relative border-b border-white/[0.08]">
            {biz.coverImage
              ? <img src={biz.coverImage} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
              : biz.image && <img src={biz.image} alt={biz.name} className="absolute inset-0 w-full h-full object-cover opacity-20" />
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            
            {/* Absolute overlapping round profile logo */}
            <div className="absolute -bottom-12 left-8 z-10 w-28 h-28 rounded-full border-4 border-[#000000] bg-[#0A0E17] shadow-2xl overflow-hidden flex-shrink-0">
              {biz.image
                ? <img src={biz.image} alt={biz.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center bg-black/40 text-gray-600"><ImageIcon size={36} /></div>
              }
            </div>
            
            {/* Active status indicator absolute inside banner */}
            <div className="absolute top-4 right-4 z-10">
              {biz.active
                ? <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-[#66ff4c]/10 text-[#66ff4c] border border-[#66ff4c]/20 px-3 py-1.5 rounded-full"><CheckCircle size={12} /> Active</span>
                : <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-white/[0.04] text-gray-400 border border-white/[0.08] px-3 py-1.5 rounded-full"><XCircle size={12} /> Inactive</span>
              }
            </div>
          </div>

          {/* Under-banner Profile Header Info (Next to logo) */}
          <div className="pt-16 pb-6 px-8 flex justify-between items-start flex-wrap gap-4 border-b border-white/[0.08] bg-[#0A0E17]/60">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-sm flex items-center flex-wrap gap-2">
                <span>{biz.name}</span>
                {biz.active ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" className="inline-block shrink-0 align-middle select-none" fill="currentColor" title="Verified active listing">
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.358.275C14.77 2.515 13.498 1.5 12 1.5s-2.77 1.015-3.412 2.285c-.417-.175-.878-.275-1.358-.275-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.358-.275.642 1.27 1.914 2.285 3.412 2.285s2.77-1.015 3.412-2.285c.417.175.878.275 1.358.275 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" fill="#0095F6"/>
                    <path d="M9.78 16.72l-3.86-3.86 1.41-1.41 2.45 2.45 6.18-6.18 1.41 1.41-7.59 7.59z" fill="white"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" className="inline-block shrink-0 align-middle select-none animate-[pulse_3s_infinite]" fill="currentColor" title="Pending review">
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.358.275C14.77 2.515 13.498 1.5 12 1.5s-2.77 1.015-3.412 2.285c-.417-.175-.878-.275-1.358-.275-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.358-.275.642 1.27 1.914 2.285 3.412 2.285s2.77-1.015 3.412-2.285c.417.175.878.275 1.358.275 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" fill="#F59E0B"/>
                    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 9c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm.5-4H10V9h1v2h1.5v1z" fill="white"/>
                  </svg>
                )}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {biz.listingCode && <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{biz.listingCode}</span>}
                {biz.website && (
                  <>
                    <span className="text-gray-600">•</span>
                    <a href={biz.website} target="_blank" rel="noreferrer" className="text-xs font-bold text-gray-400 hover:text-[#66ff4c] transition-all flex items-center gap-1">
                      {biz.website.replace(/^https?:\/\//, '')} <ExternalLink size={10} />
                    </a>
                  </>
                )}
                {avgRating > 0 && (
                  <>
                    <span className="text-gray-600">•</span>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Star size={11} className="fill-amber-400 stroke-amber-400" />
                      <span>{avgRating.toFixed(1)}</span>
                      <span className="text-gray-500 font-normal">({totalReviews})</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons on the far right */}
            <div className="flex gap-2.5">
              <button onClick={() => navigate('/businesses')} className="btn-secondary gap-2 px-4.5 py-3">
                <ArrowLeft size={15} /> Back
              </button>
              <button onClick={openEdit} className="btn-secondary gap-2 px-4.5 py-3 text-white border-white/[0.08] hover:border-white/[0.15]">
                <Pencil size={14} /> Edit profile
              </button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger gap-2 px-4.5 py-3">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Section Rows (Sisyphus Ventures Style) */}
        <div className="divide-y divide-white/[0.08] bg-[#0E131F]/10">
          
          {/* Row 1: Profile & About Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
            <div className="lg:col-span-1">
              <h2 className="font-bold text-sm text-white uppercase tracking-wider">Company profile</h2>
              <p className="text-xs text-gray-400 leading-relaxed mt-1.5">
                Overview narrative, categorizations, and district assembly regions.
              </p>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="text-sm text-gray-200 whitespace-pre-line leading-relaxed font-medium">
                {biz.description || <span className="text-gray-600 italic">— No description available —</span>}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {biz.category && <span className="flex items-center gap-1.5 pill bg-orange-500/10 text-orange-400 border border-orange-500/20"><Tag size={11} /> {biz.category}</span>}
                {biz.subCategory && <span className="pill bg-orange-500/10 text-orange-300 border border-orange-500/10">{biz.subCategory}</span>}
                {biz.district && <span className="pill bg-blue-500/10 text-blue-400 border border-blue-500/20">{biz.district}</span>}
                {biz.assembly && <span className="pill bg-blue-500/10 text-blue-300 border border-blue-500/10">{biz.assembly}</span>}
              </div>
            </div>
          </div>

          {/* Row 2: Contact Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
            <div className="lg:col-span-1">
              <h2 className="font-bold text-sm text-white uppercase tracking-wider">Contact Coordinates</h2>
              <p className="text-xs text-gray-400 leading-relaxed mt-1.5">
                Address details, phone numbers, online support, and physical locations.
              </p>
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <Field icon={MapPin} label="Address">
                  {biz.address ? <><div>{biz.address}</div>{biz.landmark && <div className="text-gray-400 text-xs mt-1">📍 {biz.landmark}</div>}</> : null}
                </Field>
                <Field icon={MapPin} label="City / Pincode">
                  {[biz.city, biz.pincode].filter(Boolean).join(', ') || null}
                </Field>
                <Field icon={MapPin} label="Service Locations">{biz.serviceLocations || null}</Field>
                <Field icon={Phone} label="Primary Phone">
                  {biz.phone ? <a href={`tel:${biz.phone}`} className="font-bold text-[#66ff4c] hover:underline transition-all">{biz.phone}</a> : null}
                </Field>
                <Field icon={Phone} label="Alternate Phone">{biz.phone2 || null}</Field>
                <Field icon={Phone} label="WhatsApp">{biz.whatsappNo || null}</Field>
                <Field icon={Phone} label="Landline">{biz.landline || null}</Field>
                <Field icon={Mail} label="Email">
                  {biz.email ? <a href={`mailto:${biz.email}`} className="font-bold text-[#66ff4c] hover:underline transition-all">{biz.email}</a> : null}
                </Field>
                <Field icon={Globe} label="Website">
                  {biz.website ? <a href={biz.website} target="_blank" rel="noreferrer" className="font-bold text-[#66ff4c] hover:underline flex items-center gap-1 truncate transition-all">{biz.website} <ExternalLink size={12} /></a> : null}
                </Field>
                <Field icon={Tag} label="Listing Code">{biz.listingCode || null}</Field>
                <Field icon={Phone} label="Owner / WhatsApp Reg">{biz.ownerPhone || null}</Field>
                <Field icon={Clock} label="Registered on">
                  {biz.createdAt ? new Date(biz.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : null}
                </Field>
              </div>
            </div>
          </div>

          {/* Row 3: Operating Hours & GPS coordinates */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
            <div className="lg:col-span-1">
              <h2 className="font-bold text-sm text-white uppercase tracking-wider">Business Schedule</h2>
              <p className="text-xs text-gray-400 leading-relaxed mt-1.5">
                Weekly calendar days, timing range, and geographic coordinates.
              </p>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <Field icon={Clock} label="Opening Hours">
                  {(biz.openDays || biz.openTime || biz.closeTime) ? (
                    <div>
                      {biz.openDays && <div className="flex flex-wrap gap-1.5 mb-2 mt-1">{biz.openDays.split(',').map(d=>d.trim()).filter(Boolean).map(d=><span key={d} className="pill bg-white/[0.04] text-gray-400 border border-white/[0.08]">{d}</span>)}</div>}
                      {(biz.openTime || biz.closeTime) && <div className="font-bold text-gray-200 mt-1">{biz.openTime||'—'} – {biz.closeTime||'—'}</div>}
                    </div>
                  ) : null}
                </Field>
                <Field icon={MapPin} label="GPS Location">
                  {biz.lat && biz.lng ? <a href={`https://maps.google.com/?q=${biz.lat},${biz.lng}`} target="_blank" rel="noreferrer" className="font-bold text-[#66ff4c] hover:underline flex items-center gap-1 transition-all">View on Google Maps <ExternalLink size={12} /></a> : null}
                </Field>
              </div>
            </div>
          </div>

          {/* Row 4: Services / Products portfolio */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
            <div className="lg:col-span-1">
              <h2 className="font-bold text-sm text-white uppercase tracking-wider">Services &amp; Products</h2>
              <p className="text-xs text-gray-400 leading-relaxed mt-1.5">
                Listing of featured services and items catalog with prices.
              </p>
            </div>
            <div className="lg:col-span-2">
              {(biz.services||[]).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {biz.services.map((s, i) => (
                    <div key={i} className="flex gap-3.5 p-3.5 bg-[#000000]/40 rounded-xl border border-white/[0.08] hover:border-white/[0.15] transition-all">
                      {s.image && <img src={s.image} alt={s.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-white/[0.08] bg-[#0A0E17]" />}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-gray-200">{s.name || <span className="text-gray-600">—</span>}</div>
                        {s.price && <div className="text-xs font-bold text-[#66ff4c] mt-1">₹{s.price}</div>}
                        {s.detail && <div className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{s.detail}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <span className="text-gray-600 italic text-sm">— No services added yet —</span>}
            </div>
          </div>

          {/* Row 5: Gallery Visual Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
            <div className="lg:col-span-1">
              <h2 className="font-bold text-sm text-white uppercase tracking-wider">Visual Gallery</h2>
              <p className="text-xs text-gray-400 leading-relaxed mt-1.5">
                Photo album showcase representing product collections or facilities.
              </p>
            </div>
            <div className="lg:col-span-2">
              {(biz.galleryImages||[]).length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {biz.galleryImages.map((img, i) => (
                    <img key={i} src={img.url} alt="" className="w-full aspect-square object-cover rounded-xl border border-white/[0.08] bg-[#0A0E17]" />
                  ))}
                </div>
              ) : <span className="text-gray-600 italic text-sm">— No photos uploaded —</span>}
            </div>
          </div>

          {/* Row 6: Social media channels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
            <div className="lg:col-span-1">
              <h2 className="font-bold text-sm text-white uppercase tracking-wider">Social profiles</h2>
              <p className="text-xs text-gray-400 leading-relaxed mt-1.5">
                Connected external pages, networks, and video channels.
              </p>
            </div>
            <div className="lg:col-span-2">
              {SPLATFORMS_DETAIL.some(p => biz[p.id]) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {SPLATFORMS_DETAIL.filter(p => biz[p.id]).map(p => (
                    <a key={p.id} href={biz[p.id]} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-[#06080D] hover:bg-white/[0.02] hover:border-[#66ff4c] hover:border-white/[0.15] text-xs font-bold uppercase tracking-wider text-gray-200 transition-all">
                      {p.icon} {p.label}
                    </a>
                  ))}
                </div>
              ) : <span className="text-gray-600 italic text-sm">— No social accounts connected —</span>}
            </div>
          </div>

          {/* Row 7: Frequently Asked Questions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
            <div className="lg:col-span-1">
              <h2 className="font-bold text-sm text-white uppercase tracking-wider">Frequently Asked Questions</h2>
              <p className="text-xs text-gray-400 leading-relaxed mt-1.5">
                Helpful details about common queries and answers.
              </p>
            </div>
            <div className="lg:col-span-2">
              {(biz.infoQuestion || biz.infoAnswer) ? (
                <div className="border border-white/[0.08] bg-[#000000]/20 rounded-2xl p-5 space-y-2 max-w-2xl">
                  {biz.infoQuestion && <div className="font-bold text-sm text-gray-200 leading-relaxed">{biz.infoQuestion}</div>}
                  {biz.infoAnswer && <div className="text-sm text-gray-400 whitespace-pre-line leading-relaxed">{biz.infoAnswer}</div>}
                </div>
              ) : <span className="text-gray-600 italic text-sm">— No FAQs configured —</span>}
            </div>
          </div>

          {/* Row 8: Ratings & Reviews */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
            <div className="lg:col-span-1">
              <h2 className="font-bold text-sm text-white uppercase tracking-wider">Ratings &amp; Reviews</h2>
              <p className="text-xs text-gray-400 leading-relaxed mt-1.5">
                Feedbacks and star ratings submitted by WhatsApp chatbot users.
              </p>
              {totalReviews > 0 && (
                <div className="mt-4 p-4 bg-amber-400/5 border border-amber-400/10 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="text-3xl font-black text-white">{avgRating.toFixed(1)}</div>
                  <div className="flex items-center gap-0.5 mt-1.5">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const isFilled = i < Math.round(avgRating);
                      return (
                        <Star key={i} size={15} className={isFilled ? "fill-amber-400 stroke-amber-400" : "text-gray-600"} />
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-2">
                    {totalReviews} Rating{totalReviews !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
            <div className="lg:col-span-2 space-y-4">
              {totalReviews > 0 ? (
                <div className="space-y-3.5">
                  {reviews.map((r) => (
                    <div key={r._id} className="p-4 bg-[#000000]/40 border border-white/[0.08] rounded-xl flex gap-3.5 items-start">
                      <div className="w-9 h-9 rounded-full bg-[#66ff4c]/10 text-[#66ff4c] flex items-center justify-center text-xs font-black uppercase border border-[#66ff4c]/20 flex-shrink-0">
                        {r.reviewerName ? r.reviewerName.charAt(0) : 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="font-bold text-sm text-gray-200">{r.reviewerName || 'Anonymous'}</div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={12} className={i < r.rating ? "fill-amber-400 stroke-amber-400" : "text-gray-700"} />
                            ))}
                          </div>
                        </div>
                        {r.phone && <div className="text-[10px] font-mono text-gray-500 mt-0.5">{r.phone}</div>}
                        {r.text && <div className="text-xs text-gray-300 mt-2 leading-relaxed whitespace-pre-line">{r.text}</div>}
                        {r.createdAt && (
                          <div className="text-[9px] text-gray-500 font-medium mt-2.5">
                            {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <span className="text-gray-600 italic text-sm">— No reviews or ratings yet —</span>}
            </div>
          </div>

        </div>
      </div>

      {/* ── Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={submitEdit} className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-white/[0.08] bg-[#0E131F]/50 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
              <div className="font-bold text-white uppercase tracking-wider text-xs">Edit Business</div>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
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
                          <label key={d} className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all ${checked ? 'bg-[#66ff4c] text-black border-[#66ff4c] shadow-[0_0_8px_rgba(102,255,76,0.2)]' : 'bg-black/60 text-gray-400 border-white/[0.08] hover:border-[#66ff4c]/50'}`}>
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
                      <label className="label">{f.label} <span className="text-gray-400 font-normal normal-case text-xs">(banner ratio ~5:1)</span></label>
                      {coverPrev && <img src={coverPrev} alt="cover" className="w-full rounded-xl mb-2.5 object-cover border border-white/[0.08] bg-[#0A0E17]" style={{height:'80px'}} />}
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
                      <label className="label">{f.label} <span className="text-gray-400 font-normal normal-case text-xs">(max {GALLERY_MAX} images, {totalCount}/{GALLERY_MAX})</span></label>
                      {existingCount > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2.5">
                          {form.galleryImages.map((img, idx) => (
                            <div key={idx} className="relative">
                              <img src={img.url} alt="" className="w-16 h-16 object-cover rounded-xl border border-white/[0.08] bg-[#0A0E17]" />
                              <button type="button"
                                onClick={() => setForm((prev) => ({
                                  ...prev,
                                  galleryImages: prev.galleryImages.filter((_, i) => i !== idx),
                                  _galleryToRemove: [...(prev._galleryToRemove || []), img.publicId].filter(Boolean),
                                }))}
                                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none hover:bg-red-700 transition-all shadow shadow-black/50">
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {newCount > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2.5">
                          {form._galleryFiles.map((file, idx) => (
                            <div key={idx} className="relative">
                              <img src={URL.createObjectURL(file)} alt="" className="w-16 h-16 object-cover rounded-xl border border-[#66ff4c]/40 bg-[#0A0E17]" />
                              <button type="button"
                                onClick={() => setForm((prev) => ({ ...prev, _galleryFiles: prev._galleryFiles.filter((_, i) => i !== idx) }))}
                                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none hover:bg-red-700 transition-all shadow shadow-black/50">
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
                        <div className="text-xs text-amber-500 font-bold py-2 bg-amber-500/5 px-3 border border-amber-500/20 rounded-xl">⚠️ Gallery limit reached ({GALLERY_MAX} images max). Remove one to add more.</div>
                      )}
                    </div>
                  );
                }

                if (f.type === 'services') return (
                  <div key={f.name}>
                    <label className="label">{f.label}</label>
                    <div className="space-y-3 mb-3">
                      {(form.services || []).map((s, i) => (
                        <div key={i} className="border border-white/[0.08] rounded-xl p-4 space-y-3 bg-[#000000]/40">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Service {i + 1}</span>
                            <button type="button" onClick={() => setForm({ ...form, services: form.services.filter((_, j) => j !== i) })}
                              className="text-xs font-bold text-red-400 hover:text-red-500 transition-all">✕ Remove</button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input className="input text-sm" placeholder="Name" value={s.name || ''}
                              onChange={(e) => { const svcs = [...form.services]; svcs[i] = { ...svcs[i], name: e.target.value }; setForm({ ...form, services: svcs }); }} />
                            <input className="input text-sm" placeholder="Price (₹)" value={s.price || ''}
                              onChange={(e) => { const svcs = [...form.services]; svcs[i] = { ...svcs[i], price: e.target.value }; setForm({ ...form, services: svcs }); }} />
                          </div>
                          <textarea rows={2} className="input text-sm" placeholder="Details / Description" value={s.detail || ''}
                            onChange={(e) => { const svcs = [...form.services]; svcs[i] = { ...svcs[i], detail: e.target.value }; setForm({ ...form, services: svcs }); }} />
                          <div className="flex items-center gap-3">
                            {(s._file ? URL.createObjectURL(s._file) : s.image) && (
                              <img src={s._file ? URL.createObjectURL(s._file) : s.image} alt="" className="w-12 h-12 object-cover rounded-xl border border-white/[0.08] bg-[#0A0E17] flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Photo <span className="text-red-500">*</span></label>
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
                        className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-[#66ff4c] border border-dashed border-[#66ff4c]/30 rounded-xl bg-[#66ff4c]/5 hover:bg-[#66ff4c]/10 hover:border-[#66ff4c]/65 transition-all">
                        + Add Service
                      </button>
                    )}
                  </div>
                );

                if (f.type === 'latlng') return (
                  <div key={f.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="label mb-0">{f.label}</label>
                      <button type="button" className="text-xs font-bold uppercase tracking-wider text-[#66ff4c] flex items-center gap-1.5 hover:underline transition-all"
                        onClick={() => {
                          if (!navigator.geolocation) return alert('Geolocation not supported');
                          navigator.geolocation.getCurrentPosition(
                            (pos) => setForm((prev) => ({ ...prev, lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) })),
                            () => alert('Location access denied')
                          );
                        }}>
                        <svg width="12" height="12" viewBox="0 0 92.3 132.3" className="shrink-0 animate-pulse">
                          <path fill="#66ff4c" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"/>
                          <path fill="#52e038" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"/>
                          <path fill="#66ff4c" d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3"/>
                          <path fill="#52e038" d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3"/>
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
                      <div className="space-y-2 mb-2.5">
                        {shown.map((pid) => {
                          const p = SPLATFORMS.find((x) => x.id === pid);
                          if (!p) return null;
                          return (
                            <div key={pid} className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24 shrink-0">{p.label}</span>
                              <input type="url" className="input text-sm flex-1" placeholder={p.placeholder}
                                value={form[pid] || ''}
                                onChange={(e) => setForm({ ...form, [pid]: e.target.value })} />
                              <button type="button" onClick={() => setForm({ ...form, [pid]: '', _shownSocial: shown.filter((x) => x !== pid) })}
                                className="text-red-400 hover:text-red-500 text-xl leading-none px-1 transition-all">×</button>
                            </div>
                          );
                        })}
                      </div>
                      {available.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {available.map((p) => (
                            <button key={p.id} type="button"
                              onClick={() => setForm({ ...form, _shownSocial: [...shown, p.id] })}
                              className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-white/[0.08] text-gray-300 rounded-full bg-[#06080D] hover:bg-white/[0.02] hover:border-white/[0.15] hover:text-white transition-all">
                              + {p.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

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

                const isReadOnly = f.name === 'listingCode' && !!form.listingCode;
                return (
                  <div key={f.name}>
                    <label className="label">{f.label}</label>
                    <input type={f.type || 'text'}
                      className={`input ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder={f.placeholder || ''}
                      readOnly={isReadOnly}
                      value={form[f.name] || ''}
                      onChange={(e) => !isReadOnly && setForm({ ...form, [f.name]: e.target.value })} />
                    {isReadOnly && <p className="text-[10px] text-gray-500 mt-1">Listing code is locked after assignment.</p>}
                  </div>
                );
              })}

              <div>
                <label className="label">Description</label>
                <textarea rows={4} className="input" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div>
                <label className="label">Listing Image <span className="text-gray-400 font-normal normal-case text-xs">(1:1 square)</span></label>
                {(form.imageFile ? URL.createObjectURL(form.imageFile) : form.image) && (
                  <img src={form.imageFile ? URL.createObjectURL(form.imageFile) : form.image} alt="" className="w-24 h-24 object-cover rounded-xl border border-white/[0.08] bg-[#0A0E17] mb-2.5" />
                )}
                <input type="file" accept="image/*" className="input"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) openCrop(file, 1, 'listing'); e.target.value = ''; }} />
              </div>

              <label className="flex items-center gap-2.5 text-sm text-gray-300 cursor-pointer select-none">
                <input type="checkbox" checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-white/[0.08] bg-[#000000]/65 text-[#66ff4c] focus:ring-[#66ff4c]/30" />
                <span>Show this listing in the WhatsApp flow</span>
              </label>
            </div>

            <div className="px-5 py-4 border-t border-white/[0.08] bg-[#0E131F]/50 flex justify-end gap-2 sticky bottom-0 z-10 backdrop-blur-md">
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
