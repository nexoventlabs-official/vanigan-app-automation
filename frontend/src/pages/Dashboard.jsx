import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Users as UsersIcon, 
  UserCircle, 
  Sparkles, 
  Star, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  ChevronDown,
  Globe,
  Layers,
  Calendar
} from 'lucide-react';
import api from '../api';

const cards = [
  { 
    key: 'businesses', 
    label: 'Active Businesses', 
    icon: Briefcase, 
    to: '/businesses', 
    desc: 'Verified listing count in directory',
    trend: '+12.4%'
  },
  { 
    key: 'organizers', 
    label: 'Active Organizers', 
    icon: UsersIcon, 
    to: '/organizers', 
    desc: 'District area coordinators',
    trend: 'Active'
  },
  { 
    key: 'members', 
    label: 'Active Members', 
    icon: UserCircle, 
    to: '/members', 
    desc: 'Association key members',
    trend: 'Active'
  },
  { 
    key: 'plans', 
    label: 'Subscription Plans', 
    icon: Sparkles, 
    to: '/plans', 
    desc: 'Active business tiers',
    trend: '3 Tiers'
  },
  { 
    key: 'reviews', 
    label: 'Reviews', 
    icon: Star, 
    to: '/reviews', 
    desc: 'User ratings & feedback',
    trend: '5 Stars'
  },
  { 
    key: 'users', 
    label: 'WhatsApp Users', 
    icon: ShieldCheck, 
    to: '/users', 
    desc: 'Active chat portal users',
    trend: 'Live'
  },
];

const getAvatarStyle = (name) => {
  const styles = [
    'border-[#66ff4c] text-[#66ff4c] bg-[#66ff4c]/10 shadow-[0_0_10px_rgba(102,255,76,0.15)]',
    'border-blue-400 text-blue-400 bg-blue-400/10 shadow-[0_0_10px_rgba(96,165,250,0.15)]',
    'border-emerald-400 text-emerald-400 bg-emerald-400/10 shadow-[0_0_10px_rgba(52,211,153,0.15)]',
    'border-amber-400 text-amber-400 bg-amber-400/10 shadow-[0_0_10px_rgba(251,191,36,0.15)]',
    'border-rose-400 text-rose-400 bg-rose-400/10 shadow-[0_0_10px_rgba(248,113,113,0.15)]',
    'border-violet-400 text-violet-400 bg-violet-400/10 shadow-[0_0_10px_rgba(167,139,250,0.15)]'
  ];
  const char = (name || '?').charAt(0).toUpperCase();
  const code = char.charCodeAt(0);
  return styles[code % styles.length];
};

export default function Dashboard() {
  const [data, setData] = useState({ stats: {}, recentReviews: [], recentUsers: [] });
  const [loading, setLoading] = useState(true);
  const [dateTimeStr, setDateTimeStr] = useState('');

  useEffect(() => {
    const d = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setDateTimeStr(d.toLocaleDateString('en-US', options));

    api
      .get('/dashboard/stats')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col gap-8 select-none font-sans pb-12 pt-6">

      {/* Grid: 6-Card Stats Panel (Horizontal Premium Dark Boxes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ key, label, icon: Icon, to, trend }) => (
          <Link 
            key={key} 
            to={to} 
            className="group bg-[#06080D] border border-white/[0.08] rounded-xl px-5 py-4 transition-colors duration-200 flex items-center justify-between hover:border-[#66ff4c]"
            style={{
              boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)'
            }}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Thin Line-Art Icon */}
              <Icon 
                size={18} 
                className="text-gray-400 shrink-0 stroke-[1.5]" 
              />
              
              {/* Card Label */}
              <span className="font-extrabold text-[13px] text-white tracking-wide truncate">
                {label.replace('Active ', '')}
              </span>
              
              {/* Muted Blue Pill/Badge next to Title */}
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-[#0B1528] border border-[#162D4A] text-blue-400 uppercase tracking-widest leading-none shrink-0 font-sans">
                {trend === 'Active' || trend === 'Live' ? 'UI' : trend}
              </span>
            </div>

            {/* Glowing Stat Count on Right */}
            <div className="text-lg font-black text-white tracking-tight shrink-0 font-mono">
              {loading ? '…' : (data.stats[key] ?? 0).toLocaleString()}
            </div>
          </Link>
        ))}
      </div>

      {/* Split Columns: Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Feedback Block (2/3 Width) */}
        <div className="lg:col-span-2 bg-[#0A0E17]/90 border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden shadow-xl" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0) 100%), #0A0E17',
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)'
        }}>
          <div className="px-5 py-4.5 border-b border-white/[0.08] flex items-center justify-between">
            <div className="font-extrabold text-sm text-white tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
              Recent Ratings &amp; Reviews
            </div>
            <Link to="/reviews" className="text-xs font-bold text-[#66ff4c] hover:underline inline-flex items-center gap-1">
              View All <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex-1 flex flex-col justify-center min-h-[300px]">
            {!data.recentReviews?.length ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#66ff4c]/5 text-[#66ff4c] border border-[#66ff4c]/20 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(102,255,76,0.08)]">
                  <Star size={18} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-400">All Quiet Here</div>
                  <p className="text-[11px] text-gray-500 max-w-[200px] mx-auto">No custom directory reviews have been submitted recently.</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.08] flex-1">
                {data.recentReviews.map((r) => (
                  <li key={r._id} className="p-5 hover:bg-white/[0.01] border-b border-white/[0.04] last:border-none transition duration-200 group/item">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-xs text-white group-hover/item:text-[#66ff4c] transition-colors duration-200">{r.reviewerName || 'WhatsApp User'}</div>
                      <div className="flex gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={10} className={i < r.rating ? 'fill-amber-400 stroke-amber-400' : 'text-gray-700 stroke-[1.5]'} />
                        ))}
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                      <span className="text-[#66ff4c] font-black">{r.targetKind}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-800" />
                      <span>{r.phone || 'Anonymous'}</span>
                    </div>
                    {r.text && (
                      <div className="text-xs text-gray-300 mt-2.5 p-3.5 bg-[#000000]/40 rounded-xl border border-white/[0.08] group-hover/item:border-[#66ff4c]/20 leading-relaxed font-semibold transition duration-200">
                        {r.text}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent WhatsApp registrations block (1/3 Width) */}
        <div className="bg-[#0A0E17]/90 border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden shadow-xl" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0) 100%), #0A0E17',
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)'
        }}>
          <div className="px-5 py-4.5 border-b border-white/[0.08] flex items-center justify-between">
            <div className="font-extrabold text-sm text-white tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
              Live Signups
            </div>
            <Link to="/users" className="text-xs font-bold text-[#66ff4c] hover:underline inline-flex items-center gap-1">
              View All <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex-1 flex flex-col justify-center min-h-[300px]">
            {!data.recentUsers?.length ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#66ff4c]/5 text-[#66ff4c] border border-[#66ff4c]/20 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(102,255,76,0.08)]">
                  <UserCircle size={18} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-400">No Registrations</div>
                  <p className="text-[11px] text-gray-550 max-w-[200px] mx-auto">No WhatsApp member accounts joined the directory recently.</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.08] flex-1">
                {data.recentUsers.map((u) => {
                  const name = u.name || u.profileName || u.phone;
                  const planKey = (u.currentPlan || 'free').toLowerCase();
                  const PLAN_BADGES = {
                    free: 'bg-white/5 border border-white/10 text-gray-400 shadow-sm',
                    premium: 'bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.12)]',
                    premium_plus: 'bg-[#66ff4c]/10 border border-[#66ff4c]/30 text-[#66ff4c] shadow-[0_0_8px_rgba(102,255,76,0.12)]',
                  };
                  const badgeClass = PLAN_BADGES[planKey] || PLAN_BADGES.free;
                  return (
                    <li key={u._id} className="px-5 py-3.5 flex items-center gap-3.5 hover:bg-white/[0.02] border-b border-white/[0.04] last:border-none transition duration-200 group/item">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarStyle(name)}`}>
                        {(name).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-xs text-white truncate group-hover/item:text-[#66ff4c] transition-colors duration-200">{name}</div>
                        <div className="text-[9px] text-gray-500 font-bold mt-0.5">{u.phone}</div>
                      </div>
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-xl text-[9px] font-black border uppercase tracking-widest ${badgeClass}`}>
                          {u.currentPlan || 'free'}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
