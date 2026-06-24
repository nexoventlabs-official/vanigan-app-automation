import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw, Pencil, Trash2, Image as ImageIcon, X, Eye } from 'lucide-react';
import api from '../api';
import CardModal from '../components/CardModal.jsx';


export default function Organizers() {
  const navigate   = useNavigate();
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [q,        setQ]        = useState('');
  const [selectedCardMember, setSelectedCardMember] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);

  const LIMIT = 100;
  const totalPages = Math.ceil(total / LIMIT);

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

  // When clicking an organizer row, look up their business by ownerPhone
  const handleRowClick = async (org) => {
    if (!org.phone) return;
    try {
      const phone = String(org.phone).replace(/\D/g, '');
      const r = await api.get('/businesses', { params: { ownerPhone: phone, limit: 1 } });
      const biz = r.data.items?.[0];
      if (biz?._id) {
        navigate(`/businesses/${biz._id}`);
      } else {
        alert(`No business listing found for ${org.name}`);
      }
    } catch {
      alert('Could not find business. Please try again.');
    }
  };

  const handleViewCard = async (org) => {
    if (!org.phone) return;
    setCardLoading(true);
    try {
      const phone = String(org.phone).replace(/\D/g, '');
      const r = await api.get('/member-auth/me', { params: { phone } });
      if (r.data?.member) {
        setSelectedCardMember({ ...r.data.member, isOrganizer: true, bizCategory: org.role || 'Organizer' });
      } else {
        alert('Could not find membership profile for this organizer.');
      }
    } catch (err) {
      alert('Failed to load card details: ' + (err?.response?.data?.error || err.message));
    } finally {
      setCardLoading(false);
    }
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
        <button onClick={() => navigate('/directorg')} className="btn-primary"><Plus size={16} /> + Add Organizer</button>
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

      {/* Pagination controls at top */}
      {!loading && items.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-sm text-gray-400 py-1">
          <span>
            Showing <strong className="text-white">{(page - 1) * LIMIT + 1}</strong> - <strong className="text-white">{Math.min(page * LIMIT, total)}</strong> of <strong className="text-white">{total}</strong> organizers
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => load(page - 1, q)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition text-xs font-semibold"
            >
              ← Prev
            </button>
            <span className="text-xs font-semibold">Page {page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => load(page + 1, q)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition text-xs font-semibold"
            >
              Next →
            </button>
          </div>
        </div>
      )}

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
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1.5 justify-end items-center">
                      <button
                        onClick={() => handleViewCard(it)}
                        className="p-1.5 rounded-xl hover:bg-white/[0.04] text-gray-400 hover:text-[#66ff4c] transition-all"
                        title="View Card"
                      >
                        <Eye size={13} />
                      </button>
                      <button onClick={() => navigate(`/directorg?editPhone=${it.phone}`)} className="p-1.5 rounded-xl hover:bg-white/[0.04] text-gray-400 hover:text-[#66ff4c] transition-all" title="Edit"><Pencil size={13} /></button>
                      <button onClick={e => remove(it._id, e)} className="p-1.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all" title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls at bottom */}
      {!loading && items.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-sm text-gray-400 mt-4">
          <span>
            Showing <strong className="text-white">{(page - 1) * LIMIT + 1}</strong> - <strong className="text-white">{Math.min(page * LIMIT, total)}</strong> of <strong className="text-white">{total}</strong> organizers
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => load(page - 1, q)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition text-xs font-semibold"
            >
              ← Prev
            </button>
            <span className="text-xs font-semibold">Page {page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => load(page + 1, q)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition text-xs font-semibold"
            >
              Next →
            </button>
          </div>
        </div>
      )}


      {selectedCardMember && (
        <CardModal member={selectedCardMember} onClose={() => setSelectedCardMember(null)} />
      )}

      {cardLoading && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="animate-spin text-4xl mb-4 text-[#66ff4c]">⟳</div>
          <p className="text-white text-sm font-semibold">Loading card details...</p>
        </div>
      )}
    </div>
  );
}
