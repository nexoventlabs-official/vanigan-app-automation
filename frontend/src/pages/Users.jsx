import { useEffect, useState } from 'react';
import { Trash2, Phone, Search } from 'lucide-react';
import api from '../api';

const PLAN_LABEL = { free: 'Free', premium: 'Premium', premium_plus: 'Premium Plus' };
const PLAN_COLOR = {
  free: 'bg-gray-100 text-gray-700',
  premium: 'bg-amber-100 text-amber-700',
  premium_plus: 'bg-brand-100 text-brand-700',
};

export default function Users() {
  const [tab, setTab] = useState('registered');
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const loadRegistered = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: q ? { q } : {} });
      setUsers(data.users);
    } finally {
      setLoading(false);
    }
  };
  const loadContacts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/contacts');
      setContacts(data.contacts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'registered') loadRegistered();
    else loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const setPlan = async (id, currentPlan) => {
    await api.patch(`/users/${id}`, { currentPlan });
    loadRegistered();
  };

  const remove = async (id) => {
    if (!confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`);
    loadRegistered();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">WhatsApp Users</h1>
        <p className="text-sm text-gray-600">
          Everyone who has ever interacted with the Vanigan WhatsApp bot.
        </p>
      </div>

      <div className="card p-3 flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setTab('registered')}
          className={`btn ${tab === 'registered' ? 'bg-brand-600 text-white' : 'bg-white text-brand-700 border border-brand-200'}`}
        >
          Registered ({users.length})
        </button>
        <button
          onClick={() => setTab('contacts')}
          className={`btn ${tab === 'contacts' ? 'bg-brand-600 text-white' : 'bg-white text-brand-700 border border-brand-200'}`}
        >
          All Contacts ({contacts.length})
        </button>
        {tab === 'registered' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadRegistered();
            }}
            className="ml-auto flex gap-2"
          >
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-gray-400" />
              <input
                className="input pl-8 w-56"
                placeholder="Search…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button className="btn-secondary">Go</button>
          </form>
        )}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading…</div>
      ) : tab === 'registered' ? (
        users.length === 0 ? (
          <div className="card p-10 text-center text-gray-500">No registered users yet.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-brand-800 text-left">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Last filter</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3 font-medium">{u.name || u.profileName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 flex items-center gap-1"><Phone size={12} />{u.phone}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {u.lastAssembly ? `${u.lastAssembly}, ${u.lastDistrict}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.currentPlan}
                        onChange={(e) => setPlan(u._id, e.target.value)}
                        className={`pill border-0 ${PLAN_COLOR[u.currentPlan] || 'bg-gray-100'} pr-2`}
                      >
                        {Object.entries(PLAN_LABEL).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => remove(u._id)} className="btn-danger !py-1 !px-2">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : contacts.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">No contacts yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-brand-800 text-left">
              <tr>
                <th className="px-4 py-3">Profile</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Last message</th>
                <th className="px-4 py-3">Last seen</th>
                <th className="px-4 py-3"># Msgs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contacts.map((c) => (
                <tr key={c._id}>
                  <td className="px-4 py-3 font-medium">{c.profileName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs"><div className="line-clamp-1">{c.lastMessage}</div></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(c.lastSeenAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">{c.messageCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
