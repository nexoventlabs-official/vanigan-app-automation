import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, Trash2, AlertTriangle, MoreVertical, TrendingUp, X } from 'lucide-react';
import api from '../api';

/* ── Blue tick SVG ── */
function BlueTick({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.941.1-1.358.275C14.77 2.515 13.498 1.5 12 1.5s-2.77 1.015-3.412 2.285c-.417-.175-.878-.275-1.358-.275-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .941-.1 1.358-.275.642 1.27 1.914 2.285 3.412 2.285s2.77-1.015 3.412-2.285c.417.175.878.275 1.358.275 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" fill="#0095F6"/>
      <path d="M9.78 16.72l-3.86-3.86 1.41-1.41 2.45 2.45 6.18-6.18 1.41 1.41-7.59 7.59z" fill="white"/>
    </svg>
  );
}

/* ── Delete Confirm Modal ── */
function DeleteModal({ member, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Delete Member</h3>
            <p className="text-sm text-gray-400">This cannot be undone</p>
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-5 text-sm text-gray-300 space-y-1.5">
          <p className="font-semibold text-white mb-2">Will permanently delete:</p>
          {[
            `Member profile & card (${member.membershipId})`,
            `Business listing${member.business ? ` (${member.business.name})` : ' (none)'} + all images`,
            'All reviews & ratings written or received',
            'Following & saved lists from other members',
            'Profile photo from Cloudinary',
          ].map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              <span>{line}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition text-sm font-medium">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting…</>
              : <><Trash2 size={14} /> Delete Everything</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Promote Confirm Modal ── */
function PromoteModal({ member, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} className="text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Promote to Organizer</h3>
            <p className="text-sm text-gray-400">{member.name} · {member.membershipId}</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 mb-5 leading-relaxed">
          This will create an <strong className="text-white">Organizer</strong> entry for this member using their name, photo, district and assembly. They will appear in the Organizers list. Their member profile stays unchanged.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition text-sm font-medium">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white transition text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Promoting…</>
              : <><TrendingUp size={14} /> Promote</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 3-dot Action Menu ── */
function ActionMenu({ member, onDelete, onPromote }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition"
        title="Actions"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 bg-gray-900 border border-white/10 rounded-xl shadow-2xl py-1 min-w-[150px]">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onPromote(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-green-400 hover:bg-white/5 transition text-left"
          >
            <TrendingUp size={14} /> Promote
          </button>
          <div className="my-1 border-t border-white/[0.06]" />
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition text-left"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function Members() {
  const navigate = useNavigate();
  const [members, setMembers]       = useState([]);
  const [total,   setTotal]         = useState(0);
  const [page,    setPage]          = useState(1);
  const [q,       setQ]             = useState('');
  const [loading, setLoading]       = useState(true);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [promoteTarget, setPromoteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const LIMIT = 50;

  const load = useCallback(async (pageNum = 1, query = q) => {
    setLoading(true);
    try {
      const r = await api.get('/member-auth/admin-list', { params: { page: pageNum, limit: LIMIT, q: query } });
      setMembers(r.data.members || []);
      setTotal(r.data.total || 0);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => { load(1, ''); }, []);

  const handleSearch = (e) => { e.preventDefault(); load(1, q); };

  const handleMemberClick = (m) => {
    if (m.business?._id) navigate(`/businesses/${m.business._id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/member-auth/admin-delete/${deleteTarget.phone}`);
      setMembers(prev => prev.filter(m => m.phone !== deleteTarget.phone));
      setTotal(prev => prev - 1);
      setDeleteTarget(null);
    } catch (err) {
      alert('Delete failed: ' + (err?.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromoteConfirm = async () => {
    if (!promoteTarget) return;
    setActionLoading(true);
    try {
      await api.post(`/member-auth/admin-promote/${promoteTarget.phone}`);
      setPromoteTarget(null);
      alert(`${promoteTarget.name} has been promoted to Organizer!`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err.message;
      alert('Promote failed: ' + msg);
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Members</h1>
          <p className="text-sm text-gray-400 mt-1">{total} registered members</p>
        </div>
        <button onClick={() => load(page, q)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-5 text-xs text-gray-400 flex-wrap">
        <div className="flex items-center gap-1.5"><BlueTick size={13} /><span>EPIC Verified + Business PIN Set</span></div>
        <div className="flex items-center gap-1.5"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-semibold border border-yellow-500/20">Pending</span><span>Phone only signup</span></div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search name, phone, membership ID…"
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500" />
        </div>
        <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg font-medium transition">Search</button>
      </form>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 text-sm">Loading members…</div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 text-gray-500 text-sm">No members found.</div>
      ) : (
        <>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Member', 'Location', 'Phone', 'Business', 'Status', 'Joined', 'Actions'].map((h, i) => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === 1 ? 'hidden sm:table-cell' : i === 2 || i === 5 ? 'hidden md:table-cell' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {members.map(m => (
                  <tr key={m._id} onClick={() => handleMemberClick(m)}
                    className={`group transition ${m.business?._id ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'}`}>

                    {/* Member */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gray-700 flex items-center justify-center border border-white/10">
                          {m.photoUrl
                            ? <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                            : <span className="text-white text-sm font-bold">{(m.name || 'U').charAt(0).toUpperCase()}</span>
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white text-sm">{m.name}</span>
                            {m.verified && <BlueTick size={13} />}
                          </div>
                          {m.membershipId && <div className="text-xs text-brand-400 font-mono mt-0.5">{m.membershipId}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="text-gray-300 text-xs">
                        {m.assemblyName && <div>{m.assemblyName}</div>}
                        {m.district     && <div className="text-gray-500">{m.district}</div>}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-400 text-xs font-mono">{m.phone}</span>
                    </td>

                    {/* Business */}
                    <td className="px-4 py-3">
                      {m.business
                        ? <div className="flex items-center gap-1.5 text-green-300 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                            <span className="truncate max-w-[140px]">{m.business.name}</span>
                          </div>
                        : <span className="text-gray-600 text-xs italic">No business</span>
                      }
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {m.verified
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20"><BlueTick size={11} /> Verified</span>
                        : m.hasEpic
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold border border-purple-500/20">EPIC linked</span>
                          : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-semibold border border-yellow-500/20">Pending</span>
                      }
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-500 text-xs">
                        {new Date(m.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <ActionMenu
                        member={m}
                        onDelete={() => setDeleteTarget(m)}
                        onPromote={() => setPromoteTarget(m)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
              <span>{total} total</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => load(page - 1, q)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 transition text-xs">← Prev</button>
                <span className="text-xs">Page {page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => load(page + 1, q)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 transition text-xs">Next →</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {deleteTarget && (
        <DeleteModal member={deleteTarget} onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)} loading={actionLoading} />
      )}
      {promoteTarget && (
        <PromoteModal member={promoteTarget} onConfirm={handlePromoteConfirm}
          onCancel={() => setPromoteTarget(null)} loading={actionLoading} />
      )}
    </div>
  );
}
