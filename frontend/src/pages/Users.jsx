import { useEffect, useState } from 'react';
import { Trash2, Phone, Search } from 'lucide-react';
import api from '../api';

const PLAN_LABEL = { free: 'Free', premium: 'Premium', premium_plus: 'Premium Plus' };
const PLAN_COLOR = {
  free: 'bg-white/5 border border-white/10 text-gray-400',
  premium: 'bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.12)]',
  premium_plus: 'bg-[#66ff4c]/10 border border-[#66ff4c]/30 text-[#66ff4c] shadow-[0_0_8px_rgba(102,255,76,0.12)]',
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">WhatsApp Users</h1>
        <p className="text-sm text-gray-400 mt-1 font-semibold">
          Everyone who has ever interacted with the Vanigan WhatsApp bot.
        </p>
      </div>

      <div className="card p-3.5 flex flex-wrap gap-3 items-center bg-[#0A0E17]/90 border border-white/[0.08]">
        <button
          onClick={() => setTab('registered')}
          className={tab === 'registered' ? 'btn-primary !py-1.5 !px-4.5' : 'btn-secondary !py-1.5 !px-4.5'}
        >
          Registered ({users.length})
        </button>
        <button
          onClick={() => setTab('contacts')}
          className={tab === 'contacts' ? 'btn-primary !py-1.5 !px-4.5' : 'btn-secondary !py-1.5 !px-4.5'}
        >
          All Contacts ({contacts.length})
        </button>
        {tab === 'registered' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadRegistered();
            }}
            className="ml-auto flex gap-2 w-full sm:w-auto mt-2 sm:mt-0"
          >
            <div className="relative flex-1 sm:flex-initial">
              <Search size={14} className="absolute left-3 top-3.5 text-gray-500" />
              <input
                className="input pl-8 w-full sm:w-56"
                placeholder="Search…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button className="btn-primary !py-2.5 !px-4">Go</button>
          </form>
        )}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading…</div>
      ) : tab === 'registered' ? (
        users.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">
            <div className="text-sm font-semibold text-gray-400">No registered users yet.</div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] border-b border-white/[0.08]">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px]">Name</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-48">Phone</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px]">Last filter</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-40">Plan</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-32">Joined</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.08]">
                {users.map((u) => (
                  <tr key={u._id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer duration-200">
                    <td className="px-4 py-3.5 font-black text-white group-hover:text-[#66ff4c] transition-colors duration-200">{u.name || u.profileName || '—'}</td>
                    <td className="px-4 py-3.5 text-gray-300 font-mono text-xs flex items-center gap-1.5">
                      <Phone size={11} className="text-gray-550 stroke-[1.5]" />
                      <span>{u.phone}</span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs font-semibold">
                      {u.lastAssembly ? `${u.lastAssembly}, ${u.lastDistrict}` : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={u.currentPlan}
                        onChange={(e) => setPlan(u._id, e.target.value)}
                        className={`pill border-0 ${PLAN_COLOR[u.currentPlan] || 'bg-white/5'} pr-6 cursor-pointer outline-none focus:ring-1 focus:ring-[#66ff4c]/20`}
                        style={{
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2366ff4c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                          backgroundPosition: 'right 0.35rem center',
                          backgroundSize: '1rem',
                          backgroundRepeat: 'no-repeat'
                        }}
                      >
                        {Object.entries(PLAN_LABEL).map(([k, v]) => (
                          <option key={k} value={k} className="bg-[#0A0E17] text-white">{v}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 font-mono font-bold">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end">
                        <button onClick={() => remove(u._id)} className="p-1.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : contacts.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <div className="text-sm font-semibold text-gray-400">No contacts yet.</div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] border-b border-white/[0.08]">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px]">Profile</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-48">Phone</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px]">Last message</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-48">Last seen</th>
                <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-24"># Msgs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {contacts.map((c) => (
                <tr key={c._id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer duration-200">
                  <td className="px-4 py-3.5 font-black text-white group-hover:text-[#66ff4c] transition-colors duration-200">{c.profileName || '—'}</td>
                  <td className="px-4 py-3.5 text-gray-300 font-mono text-xs">{c.phone}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs font-semibold max-w-xs">
                    <div className="line-clamp-1 leading-relaxed">{c.lastMessage || <span className="text-gray-600 italic">No message recorded</span>}</div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-400 font-mono font-bold">{new Date(c.lastSeenAt).toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-gray-300 font-mono font-bold text-xs">{c.messageCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
