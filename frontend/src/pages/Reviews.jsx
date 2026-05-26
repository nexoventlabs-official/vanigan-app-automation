import { useEffect, useState } from 'react';
import { Trash2, Star } from 'lucide-react';
import api from '../api';

const KIND_LABEL = { business: 'Business', organizer: 'Organizer', member: 'Member' };
const KIND_COLOR = {
  business: 'bg-[#66ff4c]/10 border border-[#66ff4c]/30 text-[#66ff4c] shadow-[0_0_8px_rgba(102,255,76,0.12)]',
  organizer: 'bg-[#0095F6]/10 border border-[#0095F6]/30 text-[#0095F6] shadow-[0_0_8px_rgba(0,149,246,0.12)]',
  member: 'bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.12)]',
};

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (kind) params.kind = kind;
      const { data } = await api.get('/reviews', { params });
      setReviews(data.reviews);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const remove = async (id) => {
    if (!confirm('Delete this review?')) return;
    await api.delete(`/reviews/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Reviews</h1>
        <p className="text-sm text-gray-400 mt-1 font-semibold">
          All ratings submitted from the WhatsApp flow.
        </p>
      </div>

      <div className="card p-3.5 flex flex-wrap gap-2 bg-[#0A0E17]/90 border border-white/[0.08]">
        {['', 'business', 'organizer', 'member'].map((k) => (
          <button
            key={k || 'all'}
            onClick={() => setKind(k)}
            className={kind === k ? 'btn-primary !py-1.5 !px-4.5' : 'btn-secondary !py-1.5 !px-4.5'}
          >
            {k ? KIND_LABEL[k] : 'All Reviews'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading…</div>
      ) : reviews.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <Star className="mx-auto mb-3 text-gray-600 stroke-[1.5]" size={40} />
          <div className="text-sm font-semibold text-gray-400">No reviews found yet.</div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] border-b border-white/[0.08]">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-28">Kind</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px]">Target</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-48">Reviewer</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-28">Rating</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px]">Review</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-28">Date</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {reviews.map((r) => (
                <tr key={r._id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer duration-200">
                  <td className="px-4 py-3.5">
                    <span className={`pill ${KIND_COLOR[r.targetKind]}`}>{KIND_LABEL[r.targetKind]}</span>
                  </td>
                  <td className="px-4 py-3.5 font-black text-white group-hover:text-[#66ff4c] transition-colors duration-200">{r.targetName}</td>
                  <td className="px-4 py-3.5">
                    <div className="font-extrabold text-white text-xs">{r.reviewerName || '—'}</div>
                    {r.phone && <div className="text-[10px] text-gray-500 font-mono mt-0.5">{r.phone}</div>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} className={i < r.rating ? 'fill-amber-400 stroke-amber-400' : 'text-gray-700 stroke-[1.5]'} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-300 max-w-xs text-xs font-semibold leading-relaxed">
                    <div className="line-clamp-3">{r.text || <span className="text-gray-600 italic">No comment left</span>}</div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-400 font-mono font-bold">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end">
                      <button onClick={() => remove(r._id)} className="p-1.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all" title="Delete">
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
    </div>
  );
}
