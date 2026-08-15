import React, { useState, useEffect } from 'react';
import { Bell, Menu as MenuIcon, X, User, LogOut, Search } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL, getRestaurantId, parseBool, getStoredPOSSettings } from '../config';

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

      // 1. Initial render from local cache if available
      try {
        const savedSettingsStr = localStorage.getItem('emenu_pos_settings');
        if (savedSettingsStr) {
          applySettings(JSON.parse(savedSettingsStr));
        }
      } catch (e) {
        console.warn('Failed to parse cached POS settings in Header:', e);
      }

      // 2. Always fetch fresh settings from backend API
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

  const isSelfPosBilling = user?.role === 'self-pos-billing' || user?.role === 'self_pos_billing';
  const isStaffUser = user && !user.isGuest;

  return (
    <nav className="navbar sticky top-0 z-50 bg-[#FFFBF8] border-b border-[#F0E6DF]/60">
      <div className="flex min-h-[58px] md:min-h-[64px] w-full items-center justify-between px-4 sm:px-6 py-2">
        {/* LEFT: Logo & Restaurant Title */}
        <div className="logo-section flex items-center min-w-0">
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
            <span className="text-[10px] text-gray-400 font-semibold tracking-wide ml-7 -mt-0.5">
              Smart Restaurant Management
            </span>
          </div>
        </div>

        {/* CENTER: Desktop Navigation Tabs */}
        {isStaffUser && (
          <div className="hidden lg:flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200/50">
            <Link
              to="/"
              className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${currentPath === '/'
                  ? 'bg-white text-[#f05a24] shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              🍔 Menu
            </Link>
            {!isSelfPosBilling && isEnableTables && (
              <Link
                to="/tables"
                className={`text-xs font-bold px-3.5 py-1.5 rounded-md transition-all ${currentPath === '/tables'
                    ? 'bg-white text-[#f05a24] shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                📋 Tables
              </Link>
            )}
            <Link
              to="/history"
              className={`text-xs font-bold px-3.5 py-1.5 rounded-md transition-all ${currentPath === '/history'
                  ? 'bg-white text-[#f05a24] shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              ⏳ History
            </Link>
          </div>
        )}

        {/* RIGHT: Action Icons & Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* User Profile Badge */}
          {isStaffUser && !isSelfPosBilling && (
            <div 
              className="relative group hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/80 transition-all cursor-pointer shadow-2xs"
              title={`Logged in as: ${user?.username || user?.name || user?.phone || user?.user_name || 'Staff User'}`}
            >
              <User size={15} className="text-[#f05a24]" />
              <span className="max-w-[120px] truncate">{user?.username || user?.name || user?.phone || user?.user_name || 'Profile'}</span>
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

          {/* Logout Button */}
          {isStaffUser && onLogout && (
            <button
              onClick={onLogout}
              className="p-2.5 sm:px-3 sm:py-2 bg-[#f05a24] hover:bg-[#d94815] text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
              title="Logout Account"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline text-xs">Logout</span>
            </button>
          )}

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
                  <span className="text-xl">🏠</span>
                  <span className="text-sm font-extrabold text-[#f05a24]">Navigation</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="py-4 space-y-2">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${currentPath === '/'
                      ? 'bg-[#f05a24] text-white shadow-md shadow-[#f05a24]/20'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <span className="text-base">🍔</span> Menu
                </Link>

                {!isSelfPosBilling && isEnableTables && (
                  <Link
                    to="/tables"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${currentPath === '/tables'
                        ? 'bg-[#f05a24] text-white shadow-md shadow-[#f05a24]/20'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <span className="text-base">📋</span> Tables
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
                  <span className="text-base">⏳</span> History
                </Link>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              {user.phone && (
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span>📱</span> Phone: <span className="text-gray-800 font-bold">{user.phone}</span>
                </div>
              )}

              {onLogout && (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition-all cursor-pointer"
                >
                  🚪 Logout Account
                </button>
              )}
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
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Enter Order ID
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. 107 or #107"
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
    </nav>
  );
};

export default Header;
