import React, { useState, useEffect } from 'react';
import { Bell, Menu as MenuIcon, X, User, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { API_BASE_URL, getRestaurantId, parseBool, getStoredPOSSettings } from '../config';

interface HeaderProps {
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const savedUser = localStorage.getItem('emenu_user');
  const user = savedUser ? JSON.parse(savedUser) : null;

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
    <nav className="navbar sticky top-0 z-50 bg-white shadow-sm border-b border-gray-150">
      <div className="flex min-h-[54px] md:min-h-[60px] w-full items-center justify-between px-3 sm:px-6 py-1 md:py-2">
        {/* LEFT: Logo & Restaurant Title */}
        <div className="logo-section flex items-center min-w-0">
          <span className="logo text-lg sm:text-xl mr-1.5 flex-shrink-0">🏠</span>
          <div className="shop-name text-sm sm:text-base md:text-lg font-extrabold text-[#0077b6] flex items-center gap-1.5 min-w-0 truncate">
            <span className="truncate uppercase">{restaurantName}</span>
            {displayTable && !isSelfPosBilling && isEnableTables && (
              <span className="bg-[#e8f8f0] text-[#2ecc71] border border-[#2ecc71]/20 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                {displayTable}
              </span>
            )}
          </div>
        </div>

        {/* CENTER: Desktop Navigation Tabs */}
        {isStaffUser && (
          <div className="hidden lg:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <Link
              to="/"
              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${currentPath === '/'
                  ? 'bg-white text-[#0077b6] shadow-xs'
                  : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              🍔 Menu
            </Link>
            {!isSelfPosBilling && isEnableTables && (
              <Link
                to="/tables"
                className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${currentPath === '/tables'
                    ? 'bg-white text-[#0077b6] shadow-[#0077b6]/20'
                    : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                📋 Tables
              </Link>
            )}
            <Link
              to="/history"
              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${currentPath === '/history'
                  ? 'bg-white text-[#0077b6] shadow-xs'
                  : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              ⏳ History
            </Link>
          </div>
        )}

        {/* RIGHT: User Profile, Logout Icon, Notifications & 3-Bar Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* User Profile Badge */}
          {isStaffUser && !isSelfPosBilling && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200/80 px-2.5 py-1 rounded-full border border-gray-200/60 transition-colors cursor-pointer">
              <User size={15} className="text-[#0077b6]" />
              <span>Profile</span>
            </div>
          )}



          <button id="notification-btn" className="text-gray-700 hover:text-[#0077b6] transition-colors cursor-pointer p-1" title="Notifications">
            <Bell size={18} />
          </button>

          {/* Logout Button (Visible ONLY for Staff/Logged-in Users) */}
          {isStaffUser && onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-full border border-rose-200/80 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Logout Account"
            >
              <LogOut size={15} className="text-rose-600" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}

          {/* 3-BAR HAMBURGER TOGGLE BUTTON */}
          {isStaffUser && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex lg:hidden p-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
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
                  <span className="text-sm font-extrabold text-[#0077b6]">Navigation</span>
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
                      ? 'bg-[#0077b6] text-white shadow-md'
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
                        ? 'bg-[#0077b6] text-white shadow-md'
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
                      ? 'bg-[#0077b6] text-white shadow-md'
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
    </nav>
  );
};

export default Header;
