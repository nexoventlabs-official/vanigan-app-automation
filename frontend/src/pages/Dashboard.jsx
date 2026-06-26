import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
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
  Calendar,
  Share2,
  Award,
  Clock,
  ChevronRight
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
  const { user } = useOutletContext();
  const isSubadmin = user?.username === 'vanigan';

  const [data, setData] = useState({ 
    stats: {}, 
    recentReviews: [], 
    recentUsers: [],
    topReferrals: [],
    recentMembers: []
  });
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

  const subadminCards = [
    { 
      key: 'subadminMembers', 
      label: 'Total Members', 
      icon: UserCircle, 
      to: '/members', 
      desc: 'Registered association members',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    { 
      key: 'subadminOrganizers', 
      label: 'Total Organizers', 
      icon: UsersIcon, 
      to: '/organizers', 
      desc: 'Active area organizers',
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    { 
      key: 'subadminReferrals', 
      label: 'Total Referrals', 
      icon: Share2, 
      to: '/referrals', 
      desc: 'Joined via invite networks',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
  ];

  if (isSubadmin) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col gap-6 select-none font-sans pb-12 pt-6">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              Vanigan Directory Statistics
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Active Member references, network stats, and system performance overview.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
            <Calendar size={13} className="text-slate-400" />
            {dateTimeStr}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {subadminCards.map(({ key, label, icon: Icon, to, desc, color }) => (
            <Link 
              key={key} 
              to={to} 
              className="group bg-white border border-slate-200/80 rounded-2xl p-5 transition-all duration-200 hover:border-[#009245] hover:shadow-md shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl border ${color} shrink-0`}>
                  <Icon size={20} className="stroke-[2]" />
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                  {loading ? '…' : (data.stats[key] ?? 0).toLocaleString()}
                </div>
              </div>
              <div>
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-1">
                  {label}
                </h3>
                <p className="text-xs text-slate-500 font-semibold truncate">
                  {desc}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Referrals Block */}
          <div className="bg-white border border-slate-200/80 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="font-extrabold text-sm text-slate-850 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse" />
                Top Referrals &amp; Influencers
              </div>
              <Link to="/referrals" className="text-xs font-bold text-[#009245] hover:underline inline-flex items-center gap-1">
                View Network <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex-1 flex flex-col justify-center min-h-[350px] p-2">
              {!data.topReferrals?.length ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center mx-auto shadow-sm">
                    <Award size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-500">No referrals recorded</div>
                    <p className="text-[11px] text-slate-450 max-w-[200px] mx-auto">Invite signs will list active referrers here.</p>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 flex-1">
                  {data.topReferrals.map((r, index) => (
                    <li key={r._id || r.membershipId} className="p-4 hover:bg-slate-50/55 rounded-xl transition duration-150 flex items-center justify-between group/item">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-slate-200 text-slate-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {index + 1}
                        </span>

                        {/* Avatar */}
                        {r.photoUrl ? (
                          <img 
                            src={r.photoUrl} 
                            alt="" 
                            className="w-9 h-9 rounded-full object-cover border border-slate-250 shrink-0" 
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarStyle(r.name)}`}>
                            {(r.name || 'M').charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-slate-900 truncate group-hover/item:text-[#009245] transition-colors">{r.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{r.membershipId || 'No ID'}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-slate-800 font-mono">{r.referralCount} Referred</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">Code: {r.referralCode || '—'}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover/item:text-[#009245] transition-colors" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Recent Members Block */}
          <div className="bg-white border border-slate-200/80 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="font-extrabold text-sm text-slate-850 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)] animate-pulse" />
                Recent Signups
              </div>
              <Link to="/members" className="text-xs font-bold text-[#009245] hover:underline inline-flex items-center gap-1">
                View All Members <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex-1 flex flex-col justify-center min-h-[350px] p-2">
              {!data.recentMembers?.length ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center mx-auto shadow-sm">
                    <Clock size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-500">No members found</div>
                    <p className="text-[11px] text-slate-450 max-w-[200px] mx-auto">New registrations will display here.</p>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 flex-1">
                  {data.recentMembers.map((m) => {
                    const formattedDate = m.createdAt 
                      ? new Date(m.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—';
                    return (
                      <li key={m._id || m.membershipId} className="p-4 hover:bg-slate-50/55 rounded-xl transition duration-150 flex items-center justify-between group/item">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Avatar */}
                          {m.photoUrl ? (
                            <img 
                              src={m.photoUrl} 
                              alt="" 
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" 
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarStyle(m.name)}`}>
                              {(m.name || 'M').charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="font-extrabold text-xs text-slate-900 truncate group-hover/item:text-[#009245] transition-colors">{m.name}</div>
                            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{m.phone}</div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-black text-slate-800 font-mono">{m.membershipId || 'No ID'}</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{formattedDate}</div>
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

  // Admin Dashboard (default layout)
  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col gap-8 select-none font-sans pb-12 pt-6">
      
      {/* Grid: 6-Card Stats Panel */}
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
              
              {/* Badge next to Title */}
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-[#0B1528] border border-[#162D4A] text-blue-400 uppercase tracking-widest leading-none shrink-0 font-sans">
                {trend === 'Active' || trend === 'Live' ? 'UI' : trend}
              </span>
            </div>

            {/* Stat Count on Right */}
            <div className="text-lg font-black text-white tracking-tight shrink-0 font-mono">
              {loading ? '…' : (data.stats[key] ?? 0).toLocaleString()}
            </div>
          </Link>
        ))}
      </div>

      {/* Split Columns: Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Feedback Block */}
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
                  <p className="text-[11px] text-gray-550 max-w-[200px] mx-auto">No directory reviews have been submitted recently.</p>
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
                    <div className="text-[9px] text-gray-550 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
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

        {/* Live Signups Block */}
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
                  <p className="text-[11px] text-gray-550 max-w-[200px] mx-auto">No WhatsApp member accounts joined recently.</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.08] flex-1">
                {data.recentUsers.map((u) => {
                  const name = u.name || u.profileName || u.phone;
                  const planKey = (u.currentPlan || 'free').toLowerCase();
                  const PLAN_BADGES = {
                    free: 'bg-white/5 border border-white/10 text-gray-405 shadow-sm',
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
