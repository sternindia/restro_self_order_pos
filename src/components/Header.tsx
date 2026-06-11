import React from 'react';
import { Bell, Search } from 'lucide-react';

interface HeaderProps {
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const savedUser = localStorage.getItem('emenu_user');
  const user = savedUser ? JSON.parse(savedUser) : null;

  const table = React.useMemo(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlTable = queryParams.get('table') || queryParams.get('table_number');
    if (urlTable) {
      sessionStorage.setItem('emenu_table', urlTable);
      return urlTable;
    }
    return sessionStorage.getItem('emenu_table') || '';
  }, []);

  return (
    <nav className="navbar sticky top-0 z-50 flex h-[10vh] w-full items-center justify-between bg-white px-[3%] py-[1.5%] shadow-md">
      <div className="logo-section flex items-center">
        <div className="logo flex items-center text-xl">🏠</div>
        <div className="shop-name ml-[5px] text-[20px] font-bold text-[#0077b6] flex items-center gap-2">
          BIG BEN RESTAURANT
          {table && (
            <span className="bg-[#e8f8f0] text-[#2ecc71] border border-[#2ecc71]/20 text-[11px] px-2 py-0.5 rounded-full font-bold">
              Table {table}
            </span>
          )}
        </div>
      </div>
      <div className="icons flex items-center gap-[15px] text-[20px]">
        {user && (
          <span className="text-xs text-gray-500 font-semibold">
            📱 {user.phone}
          </span>
        )}
        {onLogout && (
          <button 
            onClick={onLogout}
            className="text-xs font-semibold text-red-500 hover:text-red-750 cursor-pointer border border-red-200 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
          >
            Logout
          </button>
        )}
        <button id="notification-btn" className="text-black transition-colors hover:text-[#0077b6] cursor-pointer">
          <Bell size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Header;
