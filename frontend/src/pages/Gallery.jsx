import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Plus, Trash2, Upload, X, CalendarDays, ImageIcon,
  Pencil, ChevronDown, ChevronUp, Eye, EyeOff,
} from 'lucide-react';
import api from '../api';

/* ── helpers ── */
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const initForm = () => ({
  eventName: '',
  description: '',
  eventDate: '',
  files: [],
  previews: [],
});

export default function Gallery() {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]         = useState(initForm());
  const [saving, setSaving]     = useState(false);
  const [expanded, setExpanded] = useState({}); // eventId → bool
  const [editEvt, setEditEvt]   = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uploadingTo, setUploadingTo] = useState(null); // eventId being appended to
  const fileInputRef = useRef(null);
  const appendInputs = useRef({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/gallery/all');
      setEvents(data.events);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── create form file picker ── */
  const onPickFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const previews = selected.map((f) => URL.createObjectURL(f));
    setForm((prev) => ({
      ...prev,
      files:    [...prev.files, ...selected],
      previews: [...prev.previews, ...previews],
    }));
    e.target.value = '';
  };

  const removePreview = (idx) => {
    URL.revokeObjectURL(form.previews[idx]);
    setForm((prev) => ({
      ...prev,
      files:    prev.files.filter((_, i) => i !== idx),
      previews: prev.previews.filter((_, i) => i !== idx),
    }));
  };

  /* ── submit new event ── */
  const submitCreate = async (e) => {
    e.preventDefault();
    if (!form.eventName.trim()) return;
    if (!form.eventDate) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('eventName',   form.eventName.trim());
      fd.append('description', form.description.trim());
      fd.append('eventDate',   form.eventDate);
      form.files.forEach((f) => fd.append('images', f));
      await api.post('/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowCreate(false);
      setForm(initForm());
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── toggle expand ── */
  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  /* ── toggle active ── */
  const toggleActive = async (event) => {
    try {
      await api.put(`/gallery/${event._id}`, { active: !event.active });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  /* ── delete event ── */
  const deleteEvent = async (event) => {
    if (!confirm(`Delete event "${event.eventName}" and all its images? This cannot be undone.`)) return;
    try {
      await api.delete(`/gallery/${event._id}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  /* ── delete single image ── */
  const deleteImage = async (eventId, publicId) => {
    if (!confirm('Remove this image?')) return;
    try {
      await api.delete(`/gallery/${eventId}/images/${encodeURIComponent(publicId)}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  /* ── append images to existing event ── */
  const onAppendFiles = async (eventId, files) => {
    if (!files?.length) return;
    setUploadingTo(eventId);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('images', f));
      await api.post(`/gallery/${eventId}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setUploadingTo(null);
    }
  };

  /* ── edit event metadata ── */
  const openEdit = (event) => {
    setEditEvt(event._id);
    setEditForm({
      eventName:   event.eventName,
      description: event.description || '',
      eventDate:   event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '',
    });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/gallery/${editEvt}`, editForm);
      setEditEvt(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Event Gallery</h1>
          <p className="text-sm text-gray-400 mt-1 font-semibold">
            Create events and upload gallery images. Published events are visible to the public.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} className="stroke-[2.5]" /> New Event
        </button>
      </div>

      {/* ── Event list ── */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading…</div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center text-gray-500 flex flex-col items-center gap-3">
          <ImageIcon size={40} className="text-gray-700" />
          <p className="font-semibold">No events yet. Create your first gallery event.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((evt) => (
            <div
              key={evt._id}
              className="card overflow-hidden bg-[#0A0E17]/60 border border-white/[0.08]"
            >
              {/* Event header row */}
              <div className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleExpand(evt._id)}
                    className="text-gray-400 hover:text-white transition-colors shrink-0"
                  >
                    {expanded[evt._id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <div className="min-w-0">
                    <div className="font-black text-white text-base leading-tight truncate">
                      {evt.eventName}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] text-gray-400 font-semibold">
                        <CalendarDays size={11} /> {fmt(evt.eventDate)}
                      </span>
                      <span className="text-[11px] text-gray-500 font-semibold">
                        {evt.images?.length || 0} image{evt.images?.length !== 1 ? 's' : ''}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          evt.active
                            ? 'bg-[#66ff4c]/10 border border-[#66ff4c]/20 text-[#66ff4c]'
                            : 'bg-white/5 border border-white/10 text-gray-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${evt.active ? 'bg-[#66ff4c] animate-pulse' : 'bg-gray-500'}`} />
                        {evt.active ? 'Published' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Add more images */}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={(el) => (appendInputs.current[evt._id] = el)}
                    onChange={(e) => {
                      onAppendFiles(evt._id, e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => appendInputs.current[evt._id]?.click()}
                    disabled={uploadingTo === evt._id}
                    className="btn-secondary !py-1.5 !px-3 flex items-center gap-1.5 text-xs"
                  >
                    {uploadingTo === evt._id ? (
                      <span className="animate-pulse">Uploading…</span>
                    ) : (
                      <><Upload size={11} /> Add Images</>
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(evt)}
                    className="btn-secondary !py-1.5 !px-3 flex items-center gap-1.5 text-xs"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    onClick={() => toggleActive(evt)}
                    title={evt.active ? 'Hide from public' : 'Publish to public'}
                    className="btn-secondary !py-1.5 !px-2.5 text-xs"
                  >
                    {evt.active ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                  <button
                    onClick={() => deleteEvent(evt)}
                    className="btn !py-1.5 !px-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Description strip */}
              {evt.description && (
                <div className="px-5 pb-3 text-xs text-gray-400 font-semibold leading-relaxed">
                  {evt.description}
                </div>
              )}

              {/* Images grid (collapsible) */}
              {expanded[evt._id] && (
                <div className="px-5 pb-5 pt-2 border-t border-white/[0.05]">
                  {!evt.images?.length ? (
                    <p className="text-xs text-gray-600 py-4 text-center">No images yet — click "Add Images" above.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-3">
                      {evt.images.map((img) => (
                        <div
                          key={img.publicId}
                          className="group relative aspect-square rounded-lg overflow-hidden border border-white/[0.07] bg-[#06080D]"
                        >
                          <img
                            src={img.url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={() => deleteImage(evt._id, img.publicId)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create Event Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <form
            onSubmit={submitCreate}
            className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0A0E17]"
          >
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="font-black text-white text-lg">Create New Gallery Event</div>
              <button type="button" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="label">Event Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Annual Tamil Business Summit 2025"
                  value={form.eventName}
                  onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Event Date *</label>
                <input
                  type="date"
                  className="input"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  className="input"
                  placeholder="Brief description of the event…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Image picker */}
              <div>
                <label className="label">Gallery Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={onPickFiles}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary flex items-center gap-2 !py-2"
                >
                  <Upload size={14} className="stroke-[2.5]" /> Select Images
                </button>

                {form.previews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                    {form.previews.map((src, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-lg overflow-hidden border border-white/[0.08] bg-[#06080D] group"
                      >
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePreview(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {form.files.length} file{form.files.length !== 1 ? 's' : ''} selected. Max 20 at a time.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.08] flex justify-end gap-2 bg-[#06080D]/40">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Edit Event Metadata Modal ── */}
      {editEvt && (
        <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <form
            onSubmit={submitEdit}
            className="card w-full max-w-md bg-[#0A0E17]"
          >
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="font-black text-white text-lg">Edit Event</div>
              <button type="button" onClick={() => setEditEvt(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">Event Name *</label>
                <input
                  className="input"
                  value={editForm.eventName}
                  onChange={(e) => setEditForm({ ...editForm, eventName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Event Date *</label>
                <input
                  type="date"
                  className="input"
                  value={editForm.eventDate}
                  onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  className="input"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.08] flex justify-end gap-2 bg-[#06080D]/40">
              <button type="button" onClick={() => setEditEvt(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
