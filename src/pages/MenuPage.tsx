import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  isVeg: boolean;
}

const MenuPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const hotBeverages: MenuItem[] = [
    { id: 1, name: 'Hot Tea', price: 30, isVeg: true },
    { id: 2, name: 'Coffee', price: 50, isVeg: false },
  ];

  const coldBeverages: MenuItem[] = [
    { id: 3, name: 'Ice-cream', price: 30, isVeg: true },
    { id: 4, name: 'Cold Coffee', price: 50, isVeg: false },
    { id: 5, name: 'Ice-cream', price: 30, isVeg: true },
    { id: 6, name: 'Ice-cream', price: 30, isVeg: true },
    { id: 7, name: 'Ice-cream', price: 30, isVeg: true },
  ];

  const menuItems = [
    { name: 'One Tea (Separate)', price: 30 },
    { name: 'Coffee', price: 50 },
    { name: 'Hot Chocolate', price: 100 },
    { name: 'Bournvita Milk', price: 100 },
    { name: 'Cold Coffee', price: 100 },
    { name: 'Cold Coffee With Ice Cream', price: 120 },
    { name: 'Green Tea', price: 40 },
    { name: 'Masala Tea', price: 50 },
    { name: 'Black Coffee', price: 60 },
    { name: 'Milkshake', price: 150 },
    { name: 'Soft Drink', price: 50 },
  ];

  const MenuSection = ({ title, items }: { title: string; items: MenuItem[] }) => (
    <section className="menu ml-[2.5vw] mt-[3vh] w-[95%] rounded-[10px] bg-white p-[15px] shadow-md">
      <h2 className="section-heading mb-[2.5%] mt-[1%] text-left text-[20px] font-bold text-black">
        {title}
      </h2>
      {items.map((item) => (
        <div key={item.id} className="item flex items-center justify-between border-t border-[#ddd] py-[12px] last:border-b-0">
          <div className="iconplusitem flex w-[80%] items-center">
            <div className="flex-shrink-0">
              <img 
                src={item.isVeg ? "/images/veg.png" : "/images/nonVeg.png"} 
                alt={item.isVeg ? "Veg" : "Non-Veg"} 
                className="h-[20px] w-[20px]"
              />
            </div>
            <div className="nameplusprice ml-[4%]">
              <div className="name mb-[3%] w-auto max-w-[50vw] text-[16px] font-bold">
                {item.name}
              </div>
              <div className="price text-[15px] text-[#555]">
                {item.price.toFixed(2)} Rs
              </div>
            </div>
          </div>
          <div>
            <Link to="/order-info">
              <button className="add-btn cursor-pointer rounded-[5px] bg-[#0077b6] px-[15px] py-[8px] font-light text-white transition-opacity hover:opacity-90">
                Add
              </button>
            </Link>
          </div>
        </div>
      ))}
    </section>
  );

  return (
    <div className="index-body min-h-screen bg-[#f8f8f8] pb-[10vh]">
      <Header />
      
      <input 
        placeholder="Search here.." 
        className="search-input ml-[2.5vw] mt-[10px] w-[95%] rounded-[10px] border border-[#888] p-[10px] outline-none focus:border-[#0077b6]"
      />

      <MenuSection title="Hot Beverages" items={hotBeverages} />
      <MenuSection title="Cold Beverages" items={coldBeverages} />

      <div className="footer-index fixed bottom-0 z-40 flex w-screen items-center shadow-[0_-2px_5px_rgba(0,0,0,0.1)]">
        <div className="menu-btn-section flex h-[8vh] w-[50vw] items-center justify-center bg-white pl-[2vw] pt-[1.5vh]">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="menu-btn flex cursor-pointer items-center rounded-[25px] bg-black px-[20px] py-[10px] text-[16px] text-white hover:bg-[#333]"
          >
            ☰ Menu
          </button>
        </div>
        <Link to="/cart" className="cart flex h-[8vh] w-[50vw] items-center justify-center bg-[#0077b6] text-white no-underline shadow-md">
          <ShoppingCart size={20} />
          <span className="cart-text ml-[5px] mr-[1vw] text-[16px] text-white">Cart</span>
          <div className="count-bg flex h-[24px] w-[24px] items-center justify-center rounded-full bg-red-600">
            <span className="cart-count text-[14px] text-white">2</span>
          </div>
        </Link>
      </div>

      {/* Modal for Menu */}
      {isMenuOpen && (
        <div className="modal fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="modal-content relative mt-[20vh] w-full max-w-[400px] overflow-hidden rounded-[10px] bg-white p-[2vh] shadow-[0_5px_5px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <span 
              className="close absolute right-4 top-2 cursor-pointer text-[22px]" 
              onClick={() => setIsMenuOpen(false)}
            >
              &times;
            </span>
            <div className="modal-menu-list max-h-[40vh] overflow-y-auto pr-[10px]">
              {menuItems.map((item, index) => (
                <p key={index} className="p-[8px] text-[17px] border-b border-gray-100 last:border-0">
                  {item.name} - {item.price.toFixed(2)} Rs
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
