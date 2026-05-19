import React from 'react';
import { Bell, Search } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <nav className="navbar sticky top-0 z-50 flex h-[10vh] w-full items-center justify-between bg-white px-[3%] py-[1.5%] shadow-md">
      <div className="logo-section flex items-center">
        <div className="logo flex items-center text-xl">🏠</div>
        <div className="shop-name ml-[5px] text-[20px] font-bold text-[#0077b6]">
          BIG BEN RESTAURANT
        </div>
      </div>
      <div className="icons flex gap-[15px] text-[20px]">
        <button id="notification-btn" className="text-black transition-colors hover:text-[#0077b6]">
          <Bell size={20} />
        </button>
        <button id="search-btn" className="text-black transition-colors hover:text-[#0077b6]">
          <Search size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Header;
