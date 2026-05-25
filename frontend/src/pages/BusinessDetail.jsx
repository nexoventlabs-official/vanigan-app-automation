import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Phone, Mail, Globe, MapPin,
  Clock, Tag, ExternalLink, Image as ImageIcon, CheckCircle, XCircle,
} from 'lucide-react';
import api from '../api';

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

  useEffect(() => {
    api.get(`/businesses/${id}`)
      .then(({ data }) => setBiz(data.item))
      .catch(() => navigate('/businesses', { replace: true }))
      .finally(() => setLoading(false));
  }, [id]);

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
          <button onClick={() => navigate('/businesses', { state: { editId: id } })} className="btn-secondary gap-2">
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
    </div>
  );
}
