import { useEffect, useRef, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Upload,
  X,
  ImageIcon,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "../api";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function Gallery() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [uploadingTo, setUploadingTo] = useState(null);
  const fileInputRef = useRef(null);
  const appendInputs = useRef({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/gallery/all");
      setEvents(data.events);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ── file picker for new upload ── */
  const onPickFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setPreviews((prev) => [
      ...prev,
      ...selected.map((f) => URL.createObjectURL(f)),
    ]);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removePreview = (idx) => {
    URL.revokeObjectURL(previews[idx]);
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetUpload = () => {
    previews.forEach((p) => URL.revokeObjectURL(p));
    setFiles([]);
    setPreviews([]);
    setShowUpload(false);
  };

  /* ── submit: auto-generate event label + today's date ── */
  const submitUpload = async (e) => {
    e.preventDefault();
    if (!files.length) {
      alert("Please select at least one image.");
      return;
    }
    setSaving(true);
    try {
      const today = new Date();
      const label = `Gallery ${today.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
      const fd = new FormData();
      fd.append("eventName", label);
      fd.append("eventDate", today.toISOString().split("T")[0]);
      fd.append("description", "");
      files.forEach((f) => fd.append("images", f));
      await api.post("/gallery", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      resetUpload();
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

  /* ── delete entire batch ── */
  const deleteBatch = async (event) => {
    if (
      !confirm(
        `Delete this batch (${event.images?.length || 0} photos)? This cannot be undone.`,
      )
    )
      return;
    try {
      await api.delete(`/gallery/${event._id}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  /* ── delete single image ── */
  const deleteImage = async (eventId, publicId) => {
    if (!confirm("Remove this photo?")) return;
    try {
      await api.delete(
        `/gallery/${eventId}/images/${encodeURIComponent(publicId)}`,
      );
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  /* ── append images to existing batch ── */
  const onAppendFiles = async (eventId, fileList) => {
    if (!fileList?.length) return;
    setUploadingTo(eventId);
    try {
      const fd = new FormData();
      Array.from(fileList).forEach((f) => fd.append("images", f));
      await api.post(`/gallery/${eventId}/images`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setUploadingTo(null);
    }
  };

  /* ── total photo count ── */
  const totalPhotos = events.reduce(
    (sum, e) => sum + (e.images?.length || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Gallery
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-semibold">
            {totalPhotos} photo{totalPhotos !== 1 ? "s" : ""} across{" "}
            {events.length} upload{events.length !== 1 ? "s" : ""}. Published
            batches are visible to the public.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} className="stroke-[2.5]" /> Upload Photos
        </button>
      </div>

      {/* ── Batch list ── */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading…</div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center text-gray-500 flex flex-col items-center gap-3">
          <ImageIcon size={40} className="text-gray-700" />
          <p className="font-semibold">
            No photos yet. Click "Upload Photos" to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((evt) => (
            <div
              key={evt._id}
              className="card overflow-hidden bg-[#0A0E17]/60 border border-white/[0.08]"
            >
              {/* Batch header */}
              <div className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleExpand(evt._id)}
                    className="text-gray-400 hover:text-white transition-colors shrink-0"
                  >
                    {expanded[evt._id] ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="font-black text-white text-base leading-tight">
                      {fmt(evt.createdAt || evt.eventDate)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[11px] text-gray-400 font-semibold">
                        {evt.images?.length || 0} photo
                        {evt.images?.length !== 1 ? "s" : ""}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          evt.active
                            ? "bg-[#66ff4c]/10 border border-[#66ff4c]/20 text-[#66ff4c]"
                            : "bg-white/5 border border-white/10 text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${evt.active ? "bg-[#66ff4c] animate-pulse" : "bg-gray-500"}`}
                        />
                        {evt.active ? "Published" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={(el) => (appendInputs.current[evt._id] = el)}
                    onChange={(e) => {
                      onAppendFiles(evt._id, e.target.files);
                      e.target.value = "";
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
                      <>
                        <Upload size={11} /> Add Photos
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => toggleActive(evt)}
                    title={
                      evt.active ? "Hide from public" : "Publish to public"
                    }
                    className="btn-secondary !py-1.5 !px-2.5 text-xs"
                  >
                    {evt.active ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                  <button
                    onClick={() => deleteBatch(evt)}
                    className="btn !py-1.5 !px-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Images grid (collapsible) */}
              {expanded[evt._id] && (
                <div className="px-5 pb-5 pt-2 border-t border-white/[0.05]">
                  {!evt.images?.length ? (
                    <p className="text-xs text-gray-600 py-4 text-center">
                      No photos yet — click "Add Photos" above.
                    </p>
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

      {/* ── Upload Photos Modal ── */}
      {showUpload && (
        <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <form
            onSubmit={submitUpload}
            className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0A0E17]"
          >
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="font-black text-white text-lg">
                Upload Gallery Photos
              </div>
              <button
                type="button"
                onClick={resetUpload}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
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
                className="btn-secondary flex items-center gap-2 !py-3 w-full justify-center border-dashed"
              >
                <Upload size={16} className="stroke-[2.5]" />
                {files.length
                  ? `${files.length} photo${files.length !== 1 ? "s" : ""} selected — click to add more`
                  : "Select Photos"}
              </button>

              {previews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {previews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden border border-white/[0.08] bg-[#06080D] group"
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                      />
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

              <p className="text-xs text-gray-500">
                {files.length} file{files.length !== 1 ? "s" : ""} selected. Max
                20 per upload. Max 10 MB per file.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.08] flex justify-end gap-2 bg-[#06080D]/40">
              <button
                type="button"
                onClick={resetUpload}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving || !files.length}
              >
                {saving
                  ? "Uploading…"
                  : `Upload ${files.length || ""} Photo${files.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
