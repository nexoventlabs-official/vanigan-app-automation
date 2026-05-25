import { useEffect, useState } from 'react';
import { Trash2, Star } from 'lucide-react';
import api from '../api';

const KIND_LABEL = { business: 'Business', organizer: 'Organizer', member: 'Member' };
const KIND_COLOR = {
  business: 'bg-brand-50 text-brand-700',
  organizer: 'bg-emerald-50 text-emerald-700',
  member: 'bg-blue-50 text-blue-700',
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Reviews</h1>
        <p className="text-sm text-gray-600">
          All ratings submitted from the WhatsApp flow.
        </p>
      </div>

      <div className="card p-3 flex flex-wrap gap-2">
        {['', 'business', 'organizer', 'member'].map((k) => (
          <button
            key={k || 'all'}
            onClick={() => setKind(k)}
            className={`btn ${kind === k ? 'bg-brand-600 text-white' : 'bg-white text-brand-700 border border-brand-200'}`}
          >
            {k ? KIND_LABEL[k] : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading…</div>
      ) : reviews.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <Star className="mx-auto mb-3 text-gray-300" size={40} />
          No reviews yet.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-brand-800 text-left">
              <tr>
                <th className="px-4 py-3">Kind</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Reviewer</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-3">
                    <span className={`pill ${KIND_COLOR[r.targetKind]}`}>{KIND_LABEL[r.targetKind]}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{r.targetName}</td>
                  <td className="px-4 py-3">
                    <div>{r.reviewerName || '—'}</div>
                    <div className="text-xs text-gray-500">{r.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-amber-500">
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs">
                    <div className="line-clamp-3">{r.text}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove(r._id)} className="btn-danger !py-1 !px-2">
                      <Trash2 size={14} />
                    </button>
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
