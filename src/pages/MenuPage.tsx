import React, { useState, useEffect } from 'react';
import { ShoppingCart, BellRing, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { API_BASE_URL } from '../config';

const getDietaryType = (item: any): 'Veg' | 'Non-Veg' | 'Egg' => {
  const nameLower = (item.item_name || '').toLowerCase();
  const info = (item.dietary_info || '').toLowerCase();

  if (nameLower.includes('egg') || info.includes('egg')) {
    return 'Egg';
  }
  if (
    nameLower.includes('non veg') ||
    nameLower.includes('non-veg') ||
    nameLower.includes('chicken') ||
    nameLower.includes('mutton') ||
    nameLower.includes('fish') ||
    nameLower.includes('prawn') ||
    info === 'non-veg' ||
    info === 'non veg'
  ) {
    return 'Non-Veg';
  }
  return 'Veg';
};

const MenuPage: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [waiterAlertMsg, setWaiterAlertMsg] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG' | 'EGG'>('ALL');
  const [specialFilter, setSpecialFilter] = useState<'ALL' | 'SPECIAL'>('ALL');

  const [cart, setCart] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('emenu_cart');
    return saved ? JSON.parse(saved) : {};
  });

  // Fetch menus and merge active table session orders into cart
  useEffect(() => {
    const loadMenuAndSession = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams(window.location.search);
        const urlTable = queryParams.get('table') || queryParams.get('table_number');
        if (urlTable) {
          const clean = String(urlTable).replace(/[^0-9]/g, '');
          sessionStorage.setItem('emenu_table', clean || urlTable);
        } else {
          sessionStorage.removeItem('emenu_table');
        }

        const savedUser = localStorage.getItem('emenu_user');
        const userObj = savedUser ? JSON.parse(savedUser) : null;
        const restaurantId = userObj?.restaurant_id || userObj?.restaurent_id || 9;

        // Check if menu is cached in sessionStorage and less than 15 minutes old (15 * 60 * 1000 = 900000ms)
        const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
        let cachedCategories: any[] = [];
        const cachedMenuStr = sessionStorage.getItem(`emenu_cached_menu_${restaurantId}`);
        const cachedMenuTimeStr = sessionStorage.getItem(`emenu_cached_menu_time_${restaurantId}`);
        const isCacheValid = cachedMenuStr && cachedMenuTimeStr && (Date.now() - parseInt(cachedMenuTimeStr, 10)) < FIFTEEN_MINUTES_MS;

        if (isCacheValid) {
          try {
            cachedCategories = JSON.parse(cachedMenuStr);
          } catch (e) {
            // invalid cache
          }
        }

        // Load active session order only if table is scanned
        const currentTable = sessionStorage.getItem('emenu_table') || '';

        // Fetch menus (if not valid in 15min cache) and active orders (only if table scanned) in parallel
        const [menuRes, ordersRes] = await Promise.all([
          cachedCategories.length > 0 ? null : fetch(`${API_BASE_URL}/menus/${restaurantId}`),
          currentTable ? fetch(`${API_BASE_URL}/orders/${restaurantId}`).catch(() => null) : null
        ]);

        if (cachedCategories.length > 0) {
          setCategories(cachedCategories);
        } else if (menuRes && menuRes.ok) {
          const menuData = await menuRes.json();
          const fetchedCats = menuData.categories || [];
          setCategories(fetchedCats);
          sessionStorage.setItem(`emenu_cached_menu_${restaurantId}`, JSON.stringify(fetchedCats));
          sessionStorage.setItem(`emenu_cached_menu_time_${restaurantId}`, String(Date.now()));
        }

        if (currentTable && ordersRes && ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const rawOrders = Array.isArray(ordersData)
            ? ordersData
            : (ordersData && Array.isArray(ordersData.data) ? ordersData.data : []);

          const cleanTableName = String(currentTable).replace(/[^0-9]/g, '');
          const activeOrder = rawOrders.find((o: any) => {
            const cleanOrderTable = String(o.table_name || '').replace(/[^0-9]/g, '');
            const isUnpaid = o.bill?.payment_status?.toUpperCase() !== 'PAID';
            const isPending = o.order_status?.toUpperCase() === 'PENDING';
            return cleanOrderTable !== '' && cleanOrderTable === cleanTableName && isUnpaid && isPending;
          });

          if (activeOrder && activeOrder.items?.length > 0) {
            const activeCart: Record<string, any> = {};
            activeOrder.items.forEach((item: any) => {
              activeCart[item.menu_item_id] = {
                id: item.menu_item_id,
                name: item.name,
                price: parseFloat(item.unit_price || item.price || '0'),
                quantity: parseInt(item.quantity) || 1,
                isVeg: item.notes?.includes('Veg') || true,
                notes: (item.notes && !item.notes.includes('Session Order')) ? item.notes : '',
                isExisting: true
              };
            });

            // Merge with local storage cart (if any new items were added in this render session)
            const saved = localStorage.getItem('emenu_cart');
            const localCart = saved ? JSON.parse(saved) : {};
            const mergedCart = { ...activeCart, ...localCart };

            setCart(mergedCart);
            localStorage.setItem('emenu_cart', JSON.stringify(mergedCart));
          } else {
            const saved = localStorage.getItem('emenu_cart');
            if (saved) {
              try {
                setCart(JSON.parse(saved));
              } catch {}
            }
          }
        } else {
          const saved = localStorage.getItem('emenu_cart');
          if (saved) {
            try {
              setCart(JSON.parse(saved));
            } catch {}
          }
        }
      } catch (err) {
        console.error('Error loading menu and session:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMenuAndSession();
  }, []);

  useEffect(() => {
    const handleCartSync = () => {
      const saved = localStorage.getItem('emenu_cart');
      if (saved) {
        try {
          setCart(JSON.parse(saved));
        } catch {}
      } else {
        setCart({});
      }
    };
    window.addEventListener('emenu_cart_updated', handleCartSync);
    return () => window.removeEventListener('emenu_cart_updated', handleCartSync);
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
        isVeg: getDietaryType(item) === 'Veg'
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

  const currentTable = sessionStorage.getItem('emenu_table') || '1';

  const handleRequestAssistance = (type: string) => {
    setWaiterAlertMsg(`Request "${type}" sent to waiter for Table #${currentTable}!`);
    setTimeout(() => {
      setWaiterAlertMsg(null);
      setIsCallWaiterOpen(false);
    }, 2000);
  };

  // Filter logic for categories and items based on search query, Veg/Non-Veg/Egg, and Chef Special
  const filteredCategories = categories.map(cat => {
    const items = (cat.items || []).filter((item: any) => {
      const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());

      const type = getDietaryType(item);
      let matchesDietary = true;
      if (dietaryFilter === 'VEG') matchesDietary = (type === 'Veg');
      if (dietaryFilter === 'NON_VEG') matchesDietary = (type === 'Non-Veg');
      if (dietaryFilter === 'EGG') matchesDietary = (type === 'Egg');

      let matchesSpecial = true;
      if (specialFilter === 'SPECIAL') {
        const nameLower = item.item_name.toLowerCase();
        matchesSpecial = item.is_special || item.is_bestseller ||
          nameLower.includes('special') || nameLower.includes('kofta') || nameLower.includes('tikka') || nameLower.includes('butter');
      }

      return matchesSearch && matchesDietary && matchesSpecial;
    });
    return { ...cat, items };
  }).filter(cat => cat.items.length > 0);


  const MenuSection = ({ title, items }: { title: string; items: any[] }) => (
    <section 
      id={`category-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} 
      className="menu ml-[2.5vw] mt-[3vh] w-[95%] rounded-[10px] bg-white p-[15px] shadow-md scroll-mt-20"
    >
      <h2 className="section-heading mb-[2.5%] mt-[1%] text-left text-base md:text-[20px] font-bold text-black">
        {title}
      </h2>
      {items.map((item) => {
        const dietaryType = getDietaryType(item);
        const priceNum = parseFloat(item.price || '0');
        const qty = getQuantityInCart(item.item_id);
        return (
          <div key={item.item_id} className="item flex items-center justify-between border-t border-[#ddd] py-[12px] last:border-b-0">
            <div className="iconplusitem flex w-[80%] items-center">
              <div className="flex-shrink-0">
                {dietaryType === 'Veg' && (
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-emerald-600 flex items-center justify-center p-0.5 rounded-sm bg-white" title="Veg">
                    <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-emerald-600"></span>
                  </div>
                )}
                {dietaryType === 'Non-Veg' && (
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-rose-600 flex items-center justify-center p-0.5 rounded-sm bg-white" title="Non-Veg">
                    <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-rose-600"></span>
                  </div>
                )}
                {dietaryType === 'Egg' && (
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-amber-500 flex items-center justify-center p-0.5 rounded-sm bg-white" title="Egg">
                    <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-amber-500"></span>
                  </div>
                )}
              </div>
              <div className="nameplusprice ml-4">
                <div className="name mb-[3%] w-auto max-w-[50vw] text-sm md:text-[16px] font-bold text-gray-900">
                  {item.item_name}
                </div>
                <div className="price text-xs md:text-[15px] font-medium md:font-normal text-gray-500 md:text-[#555]">
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
    <div className="index-body min-h-screen bg-[#f8f8f8] pb-[12vh]">
      <Header onLogout={onLogout} />

      <input
        placeholder="Search here.."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input ml-[2.5vw] mt-[10px] w-[95%] rounded-[10px] border border-[#888] p-[10px] outline-none focus:border-[#0077b6] bg-white text-sm"
      />

      {/* Filter Toggle Buttons */}
      <div className="flex items-center gap-2 px-[2.5vw] mt-3 overflow-x-auto select-none no-scrollbar py-1">
        <button
          onClick={() => { setDietaryFilter('ALL'); setSpecialFilter('ALL'); }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${dietaryFilter === 'ALL' && specialFilter === 'ALL'
              ? 'bg-[#0077b6] text-white border-[#0077b6] shadow-sm'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
        >
          🍽️ All Items
        </button>

        <button
          onClick={() => setDietaryFilter(dietaryFilter === 'VEG' ? 'ALL' : 'VEG')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${dietaryFilter === 'VEG'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
            }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Veg Only
        </button>

        <button
          onClick={() => setDietaryFilter(dietaryFilter === 'NON_VEG' ? 'ALL' : 'NON_VEG')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${dietaryFilter === 'NON_VEG'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
            }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Non-Veg
        </button>

        <button
          onClick={() => setDietaryFilter(dietaryFilter === 'EGG' ? 'ALL' : 'EGG')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${dietaryFilter === 'EGG'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
            }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400"></span> Egg
        </button>

        <button
          onClick={() => setSpecialFilter(specialFilter === 'SPECIAL' ? 'ALL' : 'SPECIAL')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${specialFilter === 'SPECIAL'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
            }`}
        >
          ⭐ Bestsellers
        </button>
      </div>

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
              No items found matching your filter selection.
            </div>
          )}
        </>
      )}

      {/* Floating Call Waiter Button - Only visible for Guest Customers */}
      {(() => {
        const savedUser = localStorage.getItem('emenu_user');
        const currentUser = savedUser ? JSON.parse(savedUser) : null;
        const isGuestCustomer = !currentUser || currentUser.isGuest === true;
        if (!isGuestCustomer) return null;
        return (
          <button
            onClick={() => setIsCallWaiterOpen(true)}
            className="fixed bottom-14 md:bottom-[10vh] right-4 md:right-5 z-40 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white font-bold text-xs p-3 md:px-4 md:py-2.5 rounded-full shadow-xl flex items-center justify-center gap-2 border border-amber-400/80 transition-all cursor-pointer animate-float-glow"
            title="Call Waiter"
          >
            <PhoneCall size={18} className="animate-pulse flex-shrink-0" />
            <span className="hidden md:inline font-extrabold tracking-wide">Call Waiter</span>
          </button>
        );
      })()}

      <div className="footer-index fixed bottom-0 left-0 right-0 z-40 flex h-11 md:h-14 w-full items-center shadow-[0_-2px_5px_rgba(0,0,0,0.1)] bg-white">
        <div className="menu-btn-section flex h-full w-1/2 items-center justify-center bg-white">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="menu-btn flex cursor-pointer items-center justify-center rounded-[25px] bg-black px-[16px] py-[5px] md:px-[20px] md:py-[8px] text-[13px] md:text-[15px] font-bold text-white hover:bg-[#333] transition-all"
          >
            ☰ Menu
          </button>
        </div>
        <Link to="/cart" className="cart flex h-full w-1/2 items-center justify-center bg-[#0077b6] text-white no-underline shadow-md">
          <ShoppingCart size={16} className="md:w-[18px] md:h-[18px]" />
          <span className="cart-text ml-1.5 mr-2 text-[13px] md:text-[15px] font-bold text-white">Cart</span>
          {totalCartCount > 0 && (
            <div className="count-bg flex h-[18px] w-[18px] md:h-[22px] md:w-[22px] items-center justify-center rounded-full bg-red-600">
              <span className="cart-count text-[10px] md:text-[12px] font-bold text-white">{totalCartCount}</span>
            </div>
          )}
        </Link>
      </div>

      {/* Modal for Call Waiter */}
      {isCallWaiterOpen && (
        <div className="modal fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsCallWaiterOpen(false)}>
          <div
            className="w-full max-w-[360px] rounded-2xl bg-white p-5 text-center shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <BellRing size={18} className="text-amber-500" /> Assistance for Table #{currentTable}
              </h3>
              <button onClick={() => setIsCallWaiterOpen(false)} className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer">
                &times;
              </button>
            </div>

            <p className="text-xs text-gray-500 text-left font-medium">Select what you need and a server will arrive shortly:</p>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-700">
              <button
                onClick={() => handleRequestAssistance("Call Waiter")}
                className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-200 flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="text-xl">🔔</span> Call Waiter
              </button>

              <button
                onClick={() => handleRequestAssistance("Water Bottle")}
                className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl border border-blue-200 flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="text-xl">💧</span> Extra Water
              </button>

              <button
                onClick={() => handleRequestAssistance("Cutlery & Plates")}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="text-xl">🍽️</span> Cutlery & Plates
              </button>

              <button
                onClick={() => handleRequestAssistance("Bill Request")}
                className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl border border-purple-200 flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="text-xl">🧾</span> Request Bill
              </button>
            </div>

            {waiterAlertMsg && (
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold animate-in fade-in">
                {waiterAlertMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal / Bottom Sheet for Category Quick Jump */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 animate-fade-in" 
          onClick={() => setIsMenuOpen(false)}
        >
          <div 
            className="w-full sm:max-w-[380px] max-h-[75vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-2xl space-y-4 animate-slide-up flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0077b6]/10 border border-[#0077b6]/20 flex items-center justify-center text-[#0077b6] font-bold">
                  📋
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">Menu Categories</h3>
                  <p className="text-[11px] text-gray-500 font-medium">Select a category to jump directly</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)} 
                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 cursor-pointer transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Category Quick Jump List */}
            <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[50vh] no-scrollbar">
              {filteredCategories.map((category: any) => {
                const count = category.items ? category.items.length : 0;
                const catId = `category-${category.category_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                return (
                  <button
                    key={category.category_id}
                    onClick={() => {
                      setIsMenuOpen(false);
                      setTimeout(() => {
                        const el = document.getElementById(catId);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-[#0077b6]/10 hover:border-[#0077b6]/30 border border-gray-100 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base group-hover:scale-110 transition-transform">🍽️</span>
                      <span className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-[#0077b6]">
                        {category.category_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 shadow-2xs">
                        {count} {count === 1 ? 'item' : 'items'}
                      </span>
                      <span className="text-gray-400 text-xs font-bold group-hover:text-[#0077b6]">→</span>
                    </div>
                  </button>
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
