import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users as UsersIcon, UserCircle, Sparkles, Star, ShieldCheck } from 'lucide-react';
import api from '../api';

const cards = [
  { key: 'businesses', label: 'Active Businesses', icon: Briefcase, to: '/businesses', color: 'bg-brand-100 text-brand-700' },
  { key: 'organizers', label: 'Active Organizers', icon: UsersIcon, to: '/organizers', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'members', label: 'Active Members', icon: UserCircle, to: '/members', color: 'bg-blue-100 text-blue-700' },
  { key: 'plans', label: 'Subscription Plans', icon: Sparkles, to: '/plans', color: 'bg-amber-100 text-amber-700' },
  { key: 'reviews', label: 'Reviews', icon: Star, to: '/reviews', color: 'bg-rose-100 text-rose-700' },
  { key: 'users', label: 'WhatsApp Users', icon: ShieldCheck, to: '/users', color: 'bg-slate-100 text-slate-700' },
];

export default function Dashboard() {
  const [data, setData] = useState({ stats: {}, recentReviews: [], recentUsers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Dashboard</h1>
        <p className="text-sm text-gray-600">Overview of your Vanigan WhatsApp directory.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ key, label, icon: Icon, to, color }) => (
          <Link key={key} to={to} className="card p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{label}</div>
                <div className="text-3xl font-bold text-brand-900 mt-1">
                  {loading ? '…' : data.stats[key] ?? 0}
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={22} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 font-semibold text-brand-800">
            Recent Reviews
          </div>
          {!data.recentReviews?.length ? (
            <div className="p-6 text-sm text-gray-500 text-center">No reviews yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recentReviews.map((r) => (
                <li key={r._id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{r.reviewerName || 'WhatsApp user'}</div>
                    <span className="text-amber-500 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {r.targetKind} · {r.phone || 'anon'}
                  </div>
                  {r.text && <div className="text-sm text-gray-700 mt-1 line-clamp-2">{r.text}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 font-semibold text-brand-800">
            Recent WhatsApp Users
          </div>
          {!data.recentUsers?.length ? (
            <div className="p-6 text-sm text-gray-500 text-center">No users yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recentUsers.map((u) => (
                <li key={u._id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-medium">
                    {(u.name || u.profileName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{u.name || u.profileName || u.phone}</div>
                    <div className="text-xs text-gray-500">{u.phone}</div>
                  </div>
                  <span className="pill bg-brand-50 text-brand-700">{u.currentPlan}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
