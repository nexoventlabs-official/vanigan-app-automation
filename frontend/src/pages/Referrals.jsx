import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Search, 
  Share2, 
  User, 
  ArrowLeft, 
  ChevronRight, 
  Users, 
  Link as LinkIcon, 
  Calendar,
  Layers,
  Phone,
  Grid,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import api from '../api';

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

export default function Referrals() {
  const { user } = useOutletContext();
  const isSubadmin = user?.username === 'vanigan';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'count'
  const [filterType, setFilterType] = useState('all'); // 'all', 'referred', 'referrers'

  // Fetch referrals from API
  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/referrals')
      .then((r) => {
        setMembers(r.data.members || []);
      })
      .catch((e) => {
        console.error('Failed to load referrals:', e);
      })
      .finally(() => setLoading(false));
  }, []);

  // Quick lookup maps
  const { memberIdMap, referralCodeMap } = useMemo(() => {
    const idMap = new Map();
    const codeMap = new Map();
    members.forEach((m) => {
      if (m.membershipId) idMap.set(m.membershipId, m);
      if (m.referralCode) codeMap.set(m.referralCode, m);
    });
    return { memberIdMap: idMap, referralCodeMap: codeMap };
  }, [members]);

  // Resolve referrer helper
  const resolveReferrer = (referredBy) => {
    if (!referredBy) return null;
    return memberIdMap.get(referredBy) || referralCodeMap.get(referredBy) || null;
  };

  // Find referred children list helper
  const getReferredChildren = (parent) => {
    if (!parent) return [];
    return members.filter((m) => {
      if (!m.referredBy) return false;
      return m.referredBy === parent.membershipId || m.referredBy === parent.referralCode;
    });
  };

  // Processed members list based on filter, search, and sort
  const filteredAndSortedMembers = useMemo(() => {
    let result = [...members];

    // Filter by type
    if (filterType === 'referred') {
      result = result.filter(m => !!m.referredBy);
    } else if (filterType === 'referrers') {
      result = result.filter(m => m.referralCount > 0);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          (m.name || '').toLowerCase().includes(q) ||
          (m.membershipId || '').toLowerCase().includes(q) ||
          (m.phone || '').includes(q) ||
          (m.district || '').toLowerCase().includes(q) ||
          (m.assemblyName || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'count') {
      result.sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
    } else {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return result;
  }, [members, filterType, searchQuery, sortBy]);

  // Selected member object
  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return members.find(m => m.membershipId === selectedMemberId);
  }, [members, selectedMemberId]);

  // Selected member's referrer
  const referrerOfSelected = useMemo(() => {
    if (!selectedMember?.referredBy) return null;
    return resolveReferrer(selectedMember.referredBy);
  }, [selectedMember, memberIdMap, referralCodeMap]);

  // Selected member's downstream referrals
  const downstreamReferrals = useMemo(() => {
    return getReferredChildren(selectedMember);
  }, [selectedMember, members]);

  // Theme-based class helpers
  const textClass = isSubadmin ? 'text-slate-800' : 'text-white';
  const textMutedClass = isSubadmin ? 'text-slate-500' : 'text-gray-400';
  const borderClass = isSubadmin ? 'border-slate-200' : 'border-white/[0.08]';
  const bgCardClass = isSubadmin ? 'bg-white' : 'bg-[#06080D]';
  const bgMainCardClass = isSubadmin ? 'bg-white' : 'bg-[#0A0E17]';
  const activeGreen = isSubadmin ? '#009245' : '#66ff4c';

  return (
    <div className={`p-4 lg:p-6 max-w-7xl mx-auto h-[calc(100vh-80px)] lg:h-[calc(100vh-40px)] flex flex-col gap-6 select-none font-sans`}>
      
      {/* Header section */}
      <div className={`shrink-0 flex items-center justify-between gap-4 flex-wrap border-b ${borderClass} pb-4`}>
        <div>
          <h1 className={`text-2xl font-extrabold ${isSubadmin ? 'text-slate-900' : 'text-white'} flex items-center gap-2`}>
            <Share2 size={24} style={{ color: activeGreen }} />
            References &amp; Networks
          </h1>
          <p className={`text-xs ${textMutedClass} mt-1`}>
            Track member registration referral links and visual downstream invite networks.
          </p>
        </div>
        <div className="flex gap-2">
          <div className={`${isSubadmin ? 'bg-white border-slate-200' : 'bg-[#0A0E17] border-white/[0.08]'} border rounded-lg p-0.5 flex`}>
            <button 
              onClick={() => setSortBy('name')} 
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                sortBy === 'name' 
                  ? isSubadmin ? 'bg-slate-100 text-slate-800 shadow-sm' : 'bg-[#66ff4c]/10 text-[#66ff4c]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Name
            </button>
            <button 
              onClick={() => setSortBy('count')} 
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                sortBy === 'count' 
                  ? isSubadmin ? 'bg-slate-100 text-slate-800 shadow-sm' : 'bg-[#66ff4c]/10 text-[#66ff4c]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Referral Count
            </button>
          </div>
        </div>
      </div>

      {/* Main split pane content */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0 relative">
        
        {/* Left Pane: Members List (hidden on mobile when a member is selected) */}
        <div className={`w-full lg:w-[380px] ${bgCardClass} border ${borderClass} rounded-2xl flex flex-col overflow-hidden shrink-0 ${selectedMemberId ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* List Controls */}
          <div className={`p-4 border-b ${borderClass} space-y-3`}>
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, phone..."
                className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs focus:outline-none ${
                  isSubadmin 
                    ? 'bg-white border-slate-250 text-slate-800 focus:border-[#009245]' 
                    : 'bg-white/5 border-white/10 text-white focus:border-[#66ff4c]'
                }`} 
              />
            </div>
            
            {/* Filters */}
            <div className={`flex gap-1 p-0.5 rounded-lg border ${isSubadmin ? 'bg-slate-100 border-slate-200/50' : 'bg-[#000000]/60 border-white/[0.04]'}`}>
              {['all', 'referrers', 'referred'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 text-center py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-all ${
                    filterType === type 
                      ? isSubadmin ? 'bg-white text-slate-900 border-slate-200 shadow-sm' : 'bg-[#66ff4c]/15 text-[#66ff4c] border border-[#66ff4c]/20' 
                      : 'text-gray-500 hover:text-white border border-transparent'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'referrers' ? 'Referrers' : 'Referred'}
                </button>
              ))}
            </div>
          </div>

          {/* List Container */}
          <div className={`flex-1 overflow-y-auto divide-y ${isSubadmin ? 'divide-slate-100' : 'divide-white/[0.04]'}`}>
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-500 animate-pulse">Loading members database...</div>
            ) : filteredAndSortedMembers.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">No members match filters</div>
            ) : (
              filteredAndSortedMembers.map((m) => {
                const isActive = selectedMemberId === m.membershipId;
                const hasReferrer = !!m.referredBy;
                const referrerObj = resolveReferrer(m.referredBy);
                
                return (
                  <div
                    key={m.membershipId || m._id}
                    onClick={() => setSelectedMemberId(m.membershipId)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all duration-150 ${
                      isSubadmin ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'
                    } ${
                      isActive 
                        ? isSubadmin ? 'bg-slate-100 border-l-4 border-[#009245]' : 'bg-[#66ff4c]/5 border-l-4 border-[#66ff4c]' 
                        : 'border-l-4 border-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    {m.photoUrl ? (
                      <img 
                        src={m.photoUrl} 
                        alt="" 
                        className={`w-9 h-9 rounded-full object-cover border shrink-0 ${isSubadmin ? 'border-slate-200' : 'border-white/10'}`} 
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarStyle(m.name)}`}>
                        {(m.name || 'M').charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Member Text Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-extrabold truncate leading-snug ${isSubadmin ? 'text-slate-900' : 'text-white'}`}>
                          {m.name}
                        </span>
                        {m.isOrganizer && (
                          <span className="px-1 py-0.5 rounded text-[8px] font-black bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-widest shrink-0">
                            Org
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5 flex items-center gap-1.5">
                        <span>{m.membershipId || 'No ID'}</span>
                        {hasReferrer && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                            <span className="text-blue-500 truncate">
                              Ref by: {referrerObj ? referrerObj.name : 'Unknown'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Referral Count Badge */}
                    {m.referralCount > 0 ? (
                      <div className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-black ${
                        isSubadmin ? 'bg-[#009245]/10 border border-[#009245]/20 text-[#009245]' : 'bg-[#66ff4c]/10 border border-[#66ff4c]/20 text-[#66ff4c]'
                      }`}>
                        <Users size={10} className="stroke-[2]" />
                        {m.referralCount}
                      </div>
                    ) : (
                      <div className="shrink-0 text-[10px] text-gray-400 font-mono">0 ref</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Referral Tree / Details Panel */}
        <div className={`flex-1 ${bgMainCardClass} border ${borderClass} rounded-2xl flex flex-col overflow-hidden ${!selectedMemberId ? 'hidden lg:flex justify-center items-center p-8' : 'flex'}`}>
          
          {!selectedMember ? (
            // Empty State
            <div className="text-center space-y-4 max-w-sm">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm border ${
                isSubadmin ? 'bg-slate-50 border-slate-200 text-[#009245]' : 'bg-[#66ff4c]/5 border-[#66ff4c]/25 text-[#66ff4c]'
              }`}>
                <Share2 size={24} className="stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-sm font-extrabold ${isSubadmin ? 'text-slate-800' : 'text-white'}`}>Select a Member</h3>
                <p className={`text-xs ${textMutedClass} leading-relaxed`}>
                  Choose a member from the left list to trace their referrer, invite code, and downstream network of referred members.
                </p>
              </div>
            </div>
          ) : (
            // Selected Member Detailed View
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              
              {/* Mobile Back Button */}
              <div className={`p-4 border-b ${borderClass} flex items-center justify-between shrink-0 lg:hidden`}>
                <button 
                  onClick={() => setSelectedMemberId(null)}
                  className={`flex items-center gap-2 text-xs font-bold ${textMutedClass} hover:text-[#009245] transition`}
                >
                  <ArrowLeft size={16} /> Back to List
                </button>
                <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded ${
                  isSubadmin ? 'text-[#009245] bg-[#009245]/10 border border-[#009245]/20' : 'text-[#66ff4c] bg-[#66ff4c]/10 border border-[#66ff4c]/20'
                }`}>
                  Reference Detail
                </span>
              </div>

              {/* Main Panel Content */}
              <div className="p-6 space-y-6">
                
                {/* 1. Large Profile Hero Section */}
                <div className={`flex items-start gap-5 flex-wrap md:flex-nowrap pb-6 border-b ${borderClass}`}>
                  {/* Big Image/Avatar */}
                  {selectedMember.photoUrl ? (
                    <img 
                      src={selectedMember.photoUrl} 
                      alt={selectedMember.name} 
                      className={`w-20 h-20 rounded-2xl object-cover border-2 shadow-lg ${isSubadmin ? 'border-[#009245]/30' : 'border-[#66ff4c]/30'}`} 
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center font-bold text-3xl shrink-0 ${getAvatarStyle(selectedMember.name)}`}>
                      {(selectedMember.name || 'M').charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Profile Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className={`text-xl font-black tracking-tight truncate ${isSubadmin ? 'text-slate-900' : 'text-white'}`}>
                        {selectedMember.name}
                      </h2>
                      {selectedMember.isOrganizer ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-widest">
                          Organizer
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          isSubadmin ? 'bg-slate-100 border border-slate-200 text-slate-650' : 'bg-white/5 border border-white/10 text-gray-450'
                        }`}>
                          Member
                        </span>
                      )}
                    </div>
                    
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs ${textMutedClass}`}>
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                        <span className={`font-semibold ${isSubadmin ? 'text-slate-800' : 'text-white'}`}>ID:</span>
                        <span className="font-mono">{selectedMember.membershipId || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                        <span className={`font-semibold ${isSubadmin ? 'text-slate-800' : 'text-white'}`}>Phone:</span>
                        <span>{selectedMember.phone || '—'}</span>
                      </div>
                      {selectedMember.district && (
                        <div className="flex items-center gap-2">
                          <Grid size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                          <span className={`font-semibold ${isSubadmin ? 'text-slate-800' : 'text-white'}`}>District:</span>
                          <span>{selectedMember.district}</span>
                        </div>
                      )}
                      {selectedMember.assemblyName && (
                        <div className="flex items-center gap-2">
                          <Layers size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                          <span className={`font-semibold ${isSubadmin ? 'text-slate-800' : 'text-white'}`}>Assembly:</span>
                          <span>{selectedMember.assemblyName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Referral Meta Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Referral Code Card */}
                  <div className={`border rounded-xl p-4 flex flex-col justify-between min-h-[90px] ${
                    isSubadmin ? 'bg-slate-50/50 border-slate-200' : 'bg-[#06080D] border-white/[0.08]'
                  }`}>
                    <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider flex items-center gap-1.5">
                      <LinkIcon size={12} className="text-gray-400" />
                      Referral Code
                    </div>
                    <div className={`text-sm font-extrabold mt-2 font-mono tracking-wide ${isSubadmin ? 'text-slate-800' : 'text-white'}`}>
                      {selectedMember.referralCode || '—'}
                    </div>
                  </div>

                  {/* Referred By Card (Interactive clickable) */}
                  <div className={`border rounded-xl p-4 flex flex-col justify-between min-h-[90px] ${
                    isSubadmin ? 'bg-slate-50/50 border-slate-200' : 'bg-[#06080D] border-white/[0.08]'
                  }`}>
                    <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                      Referred By
                    </div>
                    {referrerOfSelected ? (
                      <div 
                        onClick={() => setSelectedMemberId(referrerOfSelected.membershipId)}
                        className={`group mt-2 flex items-center gap-2 cursor-pointer transition`}
                        title="Click to view referrer"
                      >
                        {referrerOfSelected.photoUrl ? (
                          <img 
                            src={referrerOfSelected.photoUrl} 
                            alt="" 
                            className={`w-6 h-6 rounded-full object-cover border shrink-0 ${isSubadmin ? 'border-slate-200' : 'border-white/10'}`} 
                          />
                        ) : (
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-[9px] shrink-0 ${getAvatarStyle(referrerOfSelected.name)}`}>
                            {(referrerOfSelected.name || 'M').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className={`text-xs font-extrabold truncate transition ${
                            isSubadmin ? 'text-slate-800 group-hover:text-[#009245]' : 'text-white group-hover:text-[#66ff4c]'
                          }`}>{referrerOfSelected.name}</div>
                          <div className="text-[9px] text-gray-450 font-mono mt-0.5 truncate">{referrerOfSelected.membershipId}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic flex items-center gap-1">
                        <HelpCircle size={12} />
                        Joined Direct (No Referrer)
                      </div>
                    )}
                  </div>

                  {/* Referred Count Card */}
                  <div className={`border rounded-xl p-4 flex flex-col justify-between min-h-[90px] ${
                    isSubadmin ? 'bg-slate-50/50 border-slate-200' : 'bg-[#06080D] border-white/[0.08]'
                  }`}>
                    <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider flex items-center gap-1.5">
                      <Users size={12} className="text-gray-400" />
                      Referred Total
                    </div>
                    <div className={`text-xl font-mono font-black mt-2`} style={{ color: activeGreen }}>
                      {selectedMember.referralCount || 0}
                    </div>
                  </div>
                </div>

                {/* 3. Downstream Referred Users List */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                    <Share2 size={13} style={{ color: activeGreen }} />
                    Referred Network ({downstreamReferrals.length})
                  </h3>

                  {downstreamReferrals.length === 0 ? (
                    <div className={`border border-dashed rounded-xl p-8 text-center text-xs text-gray-400 dark:text-gray-500 ${
                      isSubadmin ? 'bg-slate-50/20 border-slate-200' : 'bg-[#06080D] border-white/10'
                    }`}>
                      This member has not referred any other members yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {downstreamReferrals.map((child) => (
                        <div 
                          key={child.membershipId || child._id}
                          onClick={() => setSelectedMemberId(child.membershipId)}
                          className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition duration-150 group ${
                            isSubadmin 
                              ? 'bg-white border-slate-200 hover:bg-[#009245]/5 hover:border-[#009245]/20' 
                              : 'bg-[#06080D] border-white/[0.06] hover:bg-[#66ff4c]/5 hover:border-[#66ff4c]/20'
                          }`}
                        >
                          {/* Child Avatar */}
                          {child.photoUrl ? (
                            <img 
                              src={child.photoUrl} 
                              alt="" 
                              className={`w-9 h-9 rounded-xl object-cover border shrink-0 ${isSubadmin ? 'border-slate-200' : 'border-white/10'}`} 
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarStyle(child.name)}`}>
                              {(child.name || 'M').charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-extrabold truncate transition ${
                              isSubadmin ? 'text-slate-800 group-hover:text-[#009245]' : 'text-white group-hover:text-[#66ff4c]'
                            }`}>{child.name}</div>
                            <div className="text-[9px] text-gray-400 dark:text-gray-500 font-mono mt-0.5 truncate">{child.membershipId}</div>
                          </div>

                          <ChevronRight size={14} className="text-gray-400 dark:text-gray-600 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
