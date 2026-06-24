import { useEffect, useState } from 'react';
import { ShieldAlert, Plus, Trash2, RefreshCw } from 'lucide-react';
import api from '../api';

export default function Wings() {
  const [wings, setWings] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/wings');
      setWings(res.data.wings || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load wings list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/wings', { name: name.trim() });
      setName('');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add wing.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, nameVal) => {
    if (!confirm(`Delete wing "${nameVal}"? This might affect new organizer selections.`)) return;
    setError('');
    try {
      await api.delete(`/wings/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete wing.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-[#66ff4c]" />
            Organizer Wings List
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-semibold">
            Manage the wings and subdivisions available for organizers in the Direct Creator form.
          </p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Add Form */}
        <div className="md:col-span-4 card p-5 space-y-4">
          <h2 className="text-lg font-bold text-white">Add New Wing</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="label">Wing Name *</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Youth Wing"
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full btn-primary py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> Add Wing
            </button>
          </form>
        </div>

        {/* List Table */}
        <div className="md:col-span-8 card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Loading wings…</div>
          ) : wings.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No wings added yet. Add one on the left.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] border-b border-white/[0.08]">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px] w-12">#</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-400 uppercase tracking-widest text-[9px]">Name</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.08]">
                {wings.map((it, idx) => (
                  <tr key={it._id} className="hover:bg-white/[0.01]">
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-white">{it.name}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(it._id, it.name)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
