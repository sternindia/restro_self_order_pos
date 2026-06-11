import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const MenuPage: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('emenu_cart');
    return saved ? JSON.parse(saved) : {};
  });

  // Fetch menus from local proxy endpoint
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/menus/9');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Error fetching menu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const saveCart = (newCart: Record<string, any>) => {
    setCart(newCart);
    localStorage.setItem('emenu_cart', JSON.stringify(newCart));
  };

  const addToCart = (item: any) => {
    const newCart = { ...cart };
    if (newCart[item.item_id]) {
      newCart[item.item_id].quantity += 1;
    } else {
      newCart[item.item_id] = {
        id: item.item_id,
        name: item.item_name,
        price: parseFloat(item.price || '0'),
        quantity: 1,
        isVeg: item.dietary_info === 'Veg'
      };
    }
    saveCart(newCart);
  };

  const removeFromCart = (item: any) => {
    const newCart = { ...cart };
    if (newCart[item.item_id]) {
      if (newCart[item.item_id].quantity > 1) {
        newCart[item.item_id].quantity -= 1;
      } else {
        delete newCart[item.item_id];
      }
      saveCart(newCart);
    }
  };

  const getQuantityInCart = (itemId: string) => {
    return cart[itemId]?.quantity || 0;
  };

  const totalCartCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

  // Filter logic for categories and items based on search query
  const filteredCategories = categories.map(cat => {
    const items = (cat.items || []).filter((item: any) => 
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...cat, items };
  }).filter(cat => cat.items.length > 0);

  // Derive flat list of all menu items for the slide menu modal
  const allMenuItems = categories.reduce((acc: any[], cat: any) => {
    return [...acc, ...(cat.items || [])];
  }, []);

  const MenuSection = ({ title, items }: { title: string; items: any[] }) => (
    <section className="menu ml-[2.5vw] mt-[3vh] w-[95%] rounded-[10px] bg-white p-[15px] shadow-md">
      <h2 className="section-heading mb-[2.5%] mt-[1%] text-left text-[20px] font-bold text-black">
        {title}
      </h2>
      {items.map((item) => {
        const isVeg = item.dietary_info === 'Veg';
        const priceNum = parseFloat(item.price || '0');
        const qty = getQuantityInCart(item.item_id);
        return (
          <div key={item.item_id} className="item flex items-center justify-between border-t border-[#ddd] py-[12px] last:border-b-0">
            <div className="iconplusitem flex w-[80%] items-center">
              <div className="flex-shrink-0">
                <img 
                  src={isVeg ? "/images/veg.png" : "/images/nonVeg.png"} 
                  alt={isVeg ? "Veg" : "Non-Veg"} 
                  className="h-[20px] w-[20px]"
                />
              </div>
              <div className="nameplusprice ml-[4%]">
                <div className="name mb-[3%] w-auto max-w-[50vw] text-[16px] font-bold">
                  {item.item_name}
                </div>
                <div className="price text-[15px] text-[#555]">
                  {priceNum.toFixed(2)} Rs
                </div>
              </div>
            </div>
            <div>
              {qty > 0 ? (
                <div className="flex items-center border border-[#0077b6] rounded-[5px] overflow-hidden bg-white">
                  <button 
                    onClick={() => removeFromCart(item)}
                    className="px-[12px] py-[6px] text-[#0077b6] hover:bg-gray-100 transition-colors font-bold cursor-pointer text-sm"
                  >
                    −
                  </button>
                  <span className="px-[8px] py-[6px] text-sm font-bold text-black min-w-[24px] text-center bg-white">
                    {qty}
                  </span>
                  <button 
                    onClick={() => addToCart(item)}
                    className="px-[12px] py-[6px] text-[#0077b6] hover:bg-gray-100 transition-colors font-bold cursor-pointer text-sm"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => addToCart(item)}
                  className="add-btn cursor-pointer rounded-[5px] bg-[#0077b6] px-[20px] py-[8px] font-semibold text-white transition-opacity hover:opacity-90 text-sm"
                >
                  Add
                </button>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );

  return (
    <div className="index-body min-h-screen bg-[#f8f8f8] pb-[10vh]">
      <Header onLogout={onLogout} />
      
      <input 
        placeholder="Search here.." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input ml-[2.5vw] mt-[10px] w-[95%] rounded-[10px] border border-[#888] p-[10px] outline-none focus:border-[#0077b6]"
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0077b6]"></div>
          <p className="text-gray-500 mt-3 text-sm">Loading menu from API...</p>
        </div>
      ) : (
        <>
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <MenuSection 
                key={category.category_id} 
                title={category.category_name} 
                items={category.items || []} 
              />
            ))
          ) : (
            <div className="text-center py-20 text-gray-500">
              No items found matching your search.
            </div>
          )}
        </>
      )}

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
          {totalCartCount > 0 && (
            <div className="count-bg flex h-[24px] w-[24px] items-center justify-center rounded-full bg-red-600">
              <span className="cart-count text-[14px] text-white">{totalCartCount}</span>
            </div>
          )}
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
              {allMenuItems.map((item: any, index: number) => {
                const priceNum = parseFloat(item.price || '0');
                return (
                  <p key={index} className="p-[8px] text-[17px] border-b border-gray-100 last:border-0">
                    {item.item_name} - {priceNum.toFixed(2)} Rs
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
