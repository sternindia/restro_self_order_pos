import React, { useState, useEffect } from 'react';
import { Bell, Menu as MenuIcon, X, User, LogOut, Search, UtensilsCrossed, Utensils, Grid, Clock, Settings, Compass } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL, getRestaurantId, parseBool } from '../config';

interface HeaderProps {
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackInputId, setTrackInputId] = useState('');
  const savedUser = localStorage.getItem('emenu_user');
  const user = savedUser ? JSON.parse(savedUser) : null;

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackInputId.trim()) return;
    const cleanId = trackInputId.replace(/^#/i, '').trim();
    setIsTrackModalOpen(false);
    setTrackInputId('');
    navigate(`/track-order?id=${cleanId}`);
  };

  const [restaurantName, setRestaurantName] = useState<string>('RESTAURANT');
  const [isEnableTables, setIsEnableTables] = useState<boolean>(true);

  useEffect(() => {
    const fetchRestaurantInfo = async () => {
      const applySettings = (settings: any) => {
        if (!settings) return;
        const name = settings?.restaurant_info?.name || settings?.restaurant_name || 'RESTAURANT';
        setRestaurantName(name);

        const enableTablesVal =
          settings?.hardware_and_preferences?.is_enable_tables ??
          settings?.is_enable_tables ??
          settings?.isEnableTables;

        setIsEnableTables(parseBool(enableTablesVal, false));
      };

      try {
        const savedSettingsStr = localStorage.getItem('emenu_pos_settings');
        if (savedSettingsStr) {
          applySettings(JSON.parse(savedSettingsStr));
        }
      } catch (e) {
        console.warn('Failed to parse cached POS settings in Header:', e);
      }

      try {
        const rid = getRestaurantId();
        const res = await fetch(`${API_BASE_URL}/settings/pos/${rid}`);
        if (res.ok) {
          const data = await res.json();
          const settings = data?.data || data;
          localStorage.setItem('emenu_pos_settings', JSON.stringify(settings));
          applySettings(settings);
        }
      } catch (e) {
        console.error('Failed to fetch restaurant header info:', e);
      }
    };
    fetchRestaurantInfo();
  }, []);

  const location = useLocation();
  const currentPath = location.pathname;

  const table = React.useMemo(() => {
    const queryParams = new URLSearchParams(location.search);
    const urlTable = queryParams.get('table') || queryParams.get('table_number') || '';
    if (urlTable) {
      const clean = String(urlTable).replace(/[^0-9]/g, '');
      sessionStorage.setItem('emenu_table', clean || urlTable);
      return clean || urlTable;
    }
    const stored = sessionStorage.getItem('emenu_table') || '';
    if (!stored || stored.toLowerCase().includes('walk-in')) return '';
    const cleanStored = String(stored).replace(/[^0-9]/g, '');
    return cleanStored || stored;
  }, [location.search, location.pathname]);

  const displayTable = React.useMemo(() => {
    if (!table || table.toLowerCase().includes('walk-in')) return '';
    const clean = String(table).replace(/[^0-9]/g, '');
    return clean ? `Table #${clean}` : table;
  }, [table]);

  const roleAlias = (user?.role_alias || user?.role || '').toLowerCase();
  const isWaiter = roleAlias === 'waiter';
  const isGuestUser = user?.isGuest || roleAlias === 'guest_user' || roleAlias === 'guest';
  const isSelfPosBilling = roleAlias === 'self_billing_pos' || roleAlias === 'self_pos_billing' || roleAlias === 'self-pos-billing' || roleAlias === 'super_admin' || roleAlias === 'admin';
  const isStaffUser = user && !isGuestUser;
  const displayRole = user?.role_name || (
    roleAlias === 'super_admin' ? 'Super Admin' : 
    roleAlias === 'admin' ? 'Admin' : 
    roleAlias === 'waiter' ? 'Waiter' : 
    roleAlias === 'self_billing_pos' ? 'POS Billing' : ''
  );

  const handleLogoutClick = () => {
    localStorage.removeItem('emenu_user');
    localStorage.removeItem('emenu_cart');
    localStorage.removeItem('emenu_last_order');
    localStorage.removeItem('emenu_token');
    sessionStorage.clear();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 sm:h-18 w-full items-center justify-between bg-[#FFFBF8] px-3 sm:px-8 shadow-xs border-b border-[#F0E6DF] select-none">
        {/* LEFT: Restaurant Logo & Table Status */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity min-w-0"
        >
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xl sm:text-2xl flex-shrink-0">🧑‍🍳</span>
              <span className="text-lg sm:text-xl font-black text-black tracking-tight truncate uppercase">
                {restaurantName}
              </span>
              {displayTable && !isSelfPosBilling && isEnableTables && (
                <span className="bg-[#e8f8f0] text-[#2ecc71] border border-[#2ecc71]/20 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                  {displayTable}
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-700 font-bold tracking-wide ml-7 -mt-0.5">
              Smart Restaurant Management
            </span>
          </div>
        </div>

        {/* CENTER: Desktop Navigation Tabs with real SVG icons */}
        {isStaffUser && (
          <div className="hidden lg:flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl border border-gray-200">
            <Link
              to="/"
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${currentPath === '/'
                  ? 'bg-white text-[#f05a24] shadow-2xs'
                  : 'text-gray-800 hover:text-gray-950 font-extrabold'
                }`}
            >
              <Utensils size={14} />
              <span>Menu</span>
            </Link>
            {isWaiter && isEnableTables && (
              <Link
                to="/tables"
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-md transition-all ${currentPath === '/tables'
                    ? 'bg-white text-[#f05a24] shadow-2xs'
                    : 'text-gray-800 hover:text-gray-950 font-extrabold'
                  }`}
              >
                <Grid size={14} />
                <span>Tables</span>
              </Link>
            )}
            <Link
              to="/history"
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-md transition-all ${currentPath === '/history'
                  ? 'bg-white text-[#f05a24] shadow-2xs'
                  : 'text-gray-800 hover:text-gray-950 font-extrabold'
                }`}
            >
              <Clock size={14} />
              <span>History</span>
            </Link>
            {(roleAlias === 'super_admin' || roleAlias === 'admin') && (
              <Link
                to="/settings"
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-md transition-all ${currentPath === '/settings'
                    ? 'bg-white text-[#f05a24] shadow-2xs'
                    : 'text-gray-800 hover:text-gray-950 font-extrabold'
                  }`}
              >
                <Settings size={14} />
                <span>Settings</span>
              </Link>
            )}
          </div>
        )}

        {/* RIGHT: Action Icons & Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* User Profile Badge */}
          {isStaffUser && (
            <div 
              className="relative group hidden sm:flex items-center gap-2 text-xs font-bold text-gray-800 bg-[#FAF6F0] hover:bg-[#FFF0E6] px-3 py-1.5 rounded-xl border border-[#F0E6DF] transition-all cursor-pointer shadow-2xs"
              title={`Logged in as: ${user?.username || user?.name || user?.user_name || 'Staff User'}`}
            >
              <User size={15} className="text-[#f05a24]" />
              <span className="max-w-[110px] truncate font-extrabold">{user?.username || user?.name || user?.user_name || 'Staff'}</span>
              {displayRole && (
                <span className="bg-[#f05a24] text-white text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">
                  {displayRole}
                </span>
              )}
            </div>
          )}

          {/* Track Order Button (Visible ONLY for Guest Customers) */}
          {!isStaffUser && (
            <button
              onClick={() => setIsTrackModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#f05a24] bg-[#f05a24]/10 hover:bg-[#f05a24]/20 px-3 py-1.5 rounded-xl border border-[#f05a24]/30 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Track your order status"
            >
              <Search size={14} className="text-[#f05a24]" />
              <span className="hidden xs:inline">Track Order</span>
            </button>
          )}

          <button id="notification-btn" className="p-2 text-gray-700 hover:text-[#f05a24] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer" title="Notifications">
            <Bell size={20} />
          </button>

          {/* Logout Button (Hidden on small mobile screens, visible on desktop/sm+) */}
          <button
            onClick={handleLogoutClick}
            className="hidden sm:flex p-2.5 sm:px-3 sm:py-2 bg-[#f05a24] hover:bg-[#d94815] text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 items-center justify-center gap-1.5 flex-shrink-0"
            title="Logout Account"
          >
            <LogOut size={18} />
            <span className="text-xs">Logout</span>
          </button>

          {/* 3-BAR HAMBURGER TOGGLE BUTTON */}
          {isStaffUser && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex lg:hidden p-2 rounded-xl border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 transition-all cursor-pointer"
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* MOBILE & TABLET RIGHT SLIDE-OVER DRAWER */}
      {isMobileMenuOpen && isStaffUser && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Right Slide Drawer Panel */}
          <div className="relative w-[280px] max-w-[80vw] h-full bg-white shadow-2xl z-50 flex flex-col justify-between p-5 transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Compass size={18} className="text-[#f05a24]" />
                  <span className="text-sm font-extrabold text-[#f05a24]">Navigation</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Links with real Lucide React SVG Icons */}
              <div className="py-4 space-y-2">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${currentPath === '/'
                      ? 'bg-[#f05a24] text-white shadow-md shadow-[#f05a24]/20'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Utensils size={18} />
                  <span>Menu</span>
                </Link>

                {isWaiter && isEnableTables && (
                  <Link
                    to="/tables"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${currentPath === '/tables'
                        ? 'bg-[#f05a24] text-white shadow-md shadow-[#f05a24]/20'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <Grid size={18} />
                    <span>Tables</span>
                  </Link>
                )}

                <Link
                  to="/history"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${currentPath === '/history'
                      ? 'bg-[#f05a24] text-white shadow-md shadow-[#f05a24]/20'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Clock size={18} />
                  <span>History</span>
                </Link>

                {(roleAlias === 'super_admin' || roleAlias === 'admin') && (
                  <Link
                    to="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${currentPath === '/settings'
                        ? 'bg-[#f05a24] text-white shadow-md shadow-[#f05a24]/20'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              {/* User Profile Card */}
              <div className="bg-[#FAF6F0] p-3 rounded-2xl border border-[#F0E6DF] space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#f05a24] text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
                    <User size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-black text-gray-900 truncate">
                        {user?.username || user?.name || user?.user_name || 'Admin'}
                      </p>
                      {displayRole && (
                        <span className="bg-[#f05a24]/10 text-[#f05a24] border border-[#f05a24]/20 text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase shrink-0">
                          {displayRole}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-semibold text-gray-600 truncate mt-0.5">
                      {user?.phone ? `📱 ${user.phone}` : (user?.email || 'Logged In')}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogoutClick();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#FFF0E6] hover:bg-[#f05a24] text-[#f05a24] hover:text-white font-extrabold text-xs rounded-xl border border-[#f05a24]/30 transition-all cursor-pointer shadow-2xs active:scale-98 group"
              >
                <LogOut size={16} className="text-[#f05a24] group-hover:text-white transition-colors" />
                <span>Logout Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRACK ORDER MODAL FOR GUEST CUSTOMERS */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setIsTrackModalOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#f05a24]/10 flex items-center justify-center text-[#f05a24]">
                  <Search size={16} />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Track Order Status</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsTrackModalOpen(false)} 
                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleTrackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Enter Order ID
                </label>
                <input 
                  type="text"
                  placeholder="e.g. 1042 or 987654"
                  value={trackInputId}
                  onChange={(e) => setTrackInputId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a24]/40 focus:border-[#f05a24]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTrackModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#f05a24] hover:bg-[#d94815] rounded-xl shadow-md shadow-[#f05a24]/20 transition-all cursor-pointer"
                >
                  Track Order →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
