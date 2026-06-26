import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users as UsersIcon,
  UserPlus,
  UserCircle,
  Star,
  Sparkles,
  Image as ImageIcon,
  ShieldCheck,
  Shield,
  ShieldAlert,
  LogOut,
  Menu,
  LayoutGrid,
  Images,
  Share2,
} from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/referrals', label: 'References', icon: Share2 },
  { to: '/businesses', label: 'Businesses', icon: Briefcase },
  { to: '/organizers', label: 'Organizers', icon: UsersIcon },
  { to: '/directorg', label: 'Direct Organizer', icon: UserPlus },
  { to: '/postings', label: 'Organizer Roles', icon: Shield },
  { to: '/wings', label: 'Organizer Wings', icon: ShieldAlert },
  { to: '/members', label: 'Members', icon: UserCircle },
  { to: '/plans', label: 'Subscription Plans', icon: Sparkles },
  { to: '/reviews', label: 'Reviews', icon: Star },
  { to: '/flow-images', label: 'Flow Images', icon: ImageIcon },
  { to: '/category-images', label: 'Category Images', icon: LayoutGrid },
  { to: '/gallery', label: 'Event Gallery', icon: Images },
  { to: '/users', label: 'WhatsApp Users', icon: ShieldCheck },
];

export default function Layout({ user, setAuth }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem('vn_token');
    setAuth(null);
    nav('/login');
  };

  return (
    <div className={`min-h-screen flex ${user?.username === 'vanigan' ? 'subadmin-theme' : 'bg-[#000000]'}`}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 text-white flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{
          backgroundColor: '#000000',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div 
          className="px-5 py-6 flex items-center gap-1.5"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          <img
            src="/logo.png"
            alt="TNVS Logo"
            className="w-14 h-14 object-contain"
            style={{ filter: 'drop-shadow(0 0 10px rgba(102, 255, 76, 0.35))' }}
          />
          <div>
            <div className="font-extrabold text-white text-lg tracking-tight leading-tight">Vanigan</div>
            <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Directory Admin</div>
          </div>
        </div>

        <nav className="flex-1 py-6 space-y-1.5 px-4 overflow-y-auto" style={{ backgroundColor: '#000000' }}>
          {(() => {
            let items = NAV;
            if (user?.username === 'vanigan') {
              const order = ['/', '/referrals', '/members', '/organizers', '/directorg', '/businesses'];
              items = order.map(path => NAV.find(item => item.to === path)).filter(Boolean);
            }
            return items;
          })().map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all duration-200 relative group font-semibold ${
                  isActive
                    ? 'text-[#66ff4c] bg-[#66ff4c]/10 border-l-[3px] border-[#66ff4c] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="px-3 py-2 mb-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
            Admin: <span className="text-white font-extrabold normal-case">{user?.username}</span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.03] transition-all font-semibold"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/75 z-20 lg:hidden backdrop-blur-sm transition-all"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-[#000000] lg:pl-64">
        <header className="bg-[#000000] border-b border-gray-800/60 px-4 py-3.5 flex items-center justify-between sticky top-0 z-10 lg:hidden">
          <button onClick={() => setOpen(true)} className="p-2 -ml-2 text-white hover:text-[#66ff4c] transition-colors">
            <Menu size={22} />
          </button>
          <div className="font-black text-sm text-white tracking-widest uppercase">Vanigan Console</div>
          <div className="w-8" />
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden bg-[#000000]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
