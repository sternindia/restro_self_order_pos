import React, { useState, useEffect } from 'react';
import { ShoppingCart, BellRing, PhoneCall, Search, PlusCircle } from 'lucide-react';
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


  const SteamingPotSVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <path d="M7 3.5C7 2.5 8 2 8 1.5M12 3.5C12 2.5 13 2 13 1.5M16 3.5C16 2.5 17 2 17 1.5" stroke="#f05a24" strokeWidth="2" strokeLinecap="round"/>
      <path d="M4 10C4 8.89543 4.89543 8 6 8H18C19.1046 8 20 8.89543 20 10V11C20 15.4183 16.4183 19 12 19C7.58172 19 4 15.4183 4 11V10Z" fill="#F05A24" fillOpacity="0.18" stroke="#f05a24" strokeWidth="2"/>
      <path d="M2 10.5H22" stroke="#f05a24" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  const SkewersSVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <circle cx="7" cy="7" r="3.2" fill="#F05A24" fillOpacity="0.2" stroke="#f05a24" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3.2" fill="#F05A24" fillOpacity="0.2" stroke="#f05a24" strokeWidth="2"/>
      <circle cx="17" cy="17" r="3.2" fill="#F05A24" fillOpacity="0.2" stroke="#f05a24" strokeWidth="2"/>
      <path d="M3 3L21 21" stroke="#f05a24" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  const CurryBowlSVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <path d="M3 11C3 9.89543 3.89543 9 5 9H19C20.1046 9 21 9.89543 21 11V12C21 16.4183 17.4183 20 13 20H11C6.58172 20 3 16.4183 3 12V11Z" fill="#F05A24" fillOpacity="0.18" stroke="#f05a24" strokeWidth="2"/>
      <path d="M1 11H3M21 11H23" stroke="#f05a24" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 6C8 5 9 4.5 9 4M15 6C15 5 16 4.5 16 4" stroke="#f05a24" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );

  const DrinkSVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <path d="M6 8L8.2 20H15.8L18 8H6Z" fill="#F05A24" fillOpacity="0.18" stroke="#f05a24" strokeWidth="2"/>
      <path d="M5 8H19" stroke="#f05a24" strokeWidth="2" strokeLinecap="round"/>
      <path d="M15 2L11 8" stroke="#f05a24" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  const CutleryFilterSVG = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <path d="M6 2V10M10 2V10M6 6H10M8 10V22" stroke="#F05A24" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M16 2V7C16 9 18 10 18 10V22" stroke="#F05A24" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );

  const getCategoryIcon = (name: string = '') => {
    const n = name.toLowerCase();
    if (n.includes('biryani') || n.includes('rice') || n.includes('pulao')) return <SteamingPotSVG />;
    if (n.includes('starter') || n.includes('tikka') || n.includes('kebab') || n.includes('snack') || n.includes('appetizer')) return <SkewersSVG />;
    if (n.includes('curry') || n.includes('main') || n.includes('gravy') || n.includes('dal') || n.includes('paneer')) return <CurryBowlSVG />;
    if (n.includes('drink') || n.includes('beverage') || n.includes('juice') || n.includes('shake') || n.includes('tea') || n.includes('coffee')) return <DrinkSVG />;
    return <SteamingPotSVG />;
  };

  const MenuSection = ({ title, items }: { title: string; items: any[] }) => (
    <section 
      id={`category-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} 
      className="mx-3 sm:mx-6 mt-4 rounded-2xl bg-white p-4 sm:p-5 border border-[#F0E6DF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] scroll-mt-20"
    >
      {/* Category Header with Dynamic Realistic Vector SVG Icon */}
      <div className="flex flex-col mb-3 w-max">
        <div className="flex items-center gap-2">
          {getCategoryIcon(title)}
          <h2 className="text-base sm:text-lg font-extrabold text-[#1A1A1A] tracking-tight">{title}</h2>
        </div>
        <div className="h-[2.5px] bg-[#f05a24] rounded-full w-full mt-0.5"></div>
      </div>

      {/* Item List (Directly inside section card, NO double inner box) */}
      <div className="divide-y divide-gray-100">
        {items.map((item) => {
          const dietaryType = getDietaryType(item);
          const priceNum = parseFloat(item.price || '0');
          const qty = getQuantityInCart(item.item_id);
          return (
            <div key={item.item_id} className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1">
              <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                <div className="flex-shrink-0">
                  {dietaryType === 'Veg' && (
                    <div className="w-4 h-4 border-2 border-[#00B074] flex items-center justify-center p-0.5 rounded-sm bg-white" title="Veg">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00B074]"></span>
                    </div>
                  )}
                  {dietaryType === 'Non-Veg' && (
                    <div className="w-4 h-4 border-2 border-[#E53935] flex items-center justify-center p-0.5 rounded-sm bg-white" title="Non-Veg">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E53935]"></span>
                    </div>
                  )}
                  {dietaryType === 'Egg' && (
                    <div className="w-4 h-4 border-2 border-[#FFB300] flex items-center justify-center p-0.5 rounded-sm bg-white" title="Egg">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFB300]"></span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1E1F24] leading-snug">{item.item_name}</h3>
                  <p className="text-xs font-bold text-[#f05a24] mt-0.5">₹{priceNum.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex-shrink-0">
                {qty > 0 ? (
                  <div className="flex items-center border border-[#f05a24]/40 rounded-xl overflow-hidden bg-[#FFF0E6]/60 shadow-2xs">
                    <button
                      onClick={() => removeFromCart(item)}
                      className="px-2.5 py-1.5 text-[#f05a24] hover:bg-[#f05a24] hover:text-white transition-colors font-black cursor-pointer text-xs"
                    >
                      −
                    </button>
                    <span className="px-2 py-1.5 text-xs font-black text-[#1E1F24] min-w-[18px] text-center bg-white">
                      {qty}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="px-2.5 py-1.5 text-[#f05a24] hover:bg-[#f05a24] hover:text-white transition-colors font-black cursor-pointer text-xs"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(item)}
                    className="flex items-center justify-center gap-1 min-w-[72px] px-3.5 py-1.5 rounded-xl bg-[#FFF0E6] hover:bg-[#f05a24] text-[#f05a24] hover:text-white border border-[#f05a24]/30 hover:border-[#f05a24] text-xs font-extrabold tracking-wide transition-all shadow-2xs active:scale-95 cursor-pointer group"
                  >
                    <span>ADD</span>
                    <span className="text-sm font-bold leading-none group-hover:scale-110 transition-transform">+</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="index-body min-h-screen bg-[#FAF6F0] pb-24 md:pb-28">
      <Header onLogout={onLogout} />

      {/* Search Bar */}
      <div className="relative mx-3 sm:mx-6 mt-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search for dishes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm text-gray-900 outline-none focus:border-[#f05a24] focus:ring-2 focus:ring-[#f05a24]/20 shadow-2xs transition-all"
        />
      </div>

      {/* Filter Toggle Buttons matching reference image */}
      <div className="flex items-center gap-2.5 px-3 sm:px-6 mt-4 overflow-x-auto select-none no-scrollbar py-1">
        <button
          onClick={() => { setDietaryFilter('ALL'); setSpecialFilter('ALL'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${dietaryFilter === 'ALL' && specialFilter === 'ALL'
              ? 'bg-[#1E1F24] text-white border-[#1E1F24] shadow-xs'
              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
        >
          <CutleryFilterSVG /> All Items
        </button>

        <button
          onClick={() => setDietaryFilter(dietaryFilter === 'VEG' ? 'ALL' : 'VEG')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${dietaryFilter === 'VEG'
              ? 'bg-[#1E1F24] text-white border-[#1E1F24] shadow-xs'
              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span> Veg Only
        </button>

        <button
          onClick={() => setDietaryFilter(dietaryFilter === 'NON_VEG' ? 'ALL' : 'NON_VEG')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${dietaryFilter === 'NON_VEG'
              ? 'bg-[#1E1F24] text-white border-[#1E1F24] shadow-xs'
              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span> Non-Veg
        </button>

        <button
          onClick={() => setDietaryFilter(dietaryFilter === 'EGG' ? 'ALL' : 'EGG')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${dietaryFilter === 'EGG'
              ? 'bg-[#1E1F24] text-white border-[#1E1F24] shadow-xs'
              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span> Egg
        </button>

        <button
          onClick={() => setSpecialFilter(specialFilter === 'SPECIAL' ? 'ALL' : 'SPECIAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${specialFilter === 'SPECIAL'
              ? 'bg-[#1E1F24] text-white border-[#1E1F24] shadow-xs'
              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
        >
          <span>⭐</span> Bestsellers
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#f05a24]"></div>
          <p className="text-gray-500 mt-3 text-xs font-bold">Loading menu from API...</p>
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
            <div className="text-center py-20 text-gray-500 text-xs font-semibold">
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
            className="fixed bottom-20 right-4 z-40 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white font-bold text-xs p-3 md:px-4 md:py-2.5 rounded-full shadow-xl flex items-center justify-center gap-2 border border-amber-400/80 transition-all cursor-pointer animate-float-glow"
            title="Call Waiter"
          >
            <PhoneCall size={18} className="animate-pulse flex-shrink-0" />
            <span className="hidden md:inline font-extrabold tracking-wide">Call Waiter</span>
          </button>
        );
      })()}

      {/* FLOATING BOTTOM BAR WITH MENU & CART PILLS */}
      <div className="fixed bottom-3 left-3 right-3 z-40 flex items-center justify-between gap-3 max-w-md mx-auto">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200/90 text-gray-900 font-extrabold text-xs sm:text-sm py-3 px-5 rounded-2xl shadow-xl active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-base font-black">☰</span>
          <span>Menu</span>
        </button>

        <Link
          to="/cart"
          className="flex-[1.4] flex items-center justify-between bg-[#f05a24] hover:bg-[#d94815] text-white font-extrabold text-xs sm:text-sm py-3 px-5 rounded-2xl shadow-xl shadow-[#f05a24]/30 active:scale-95 transition-all no-underline"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} />
            <span>Cart</span>
          </div>
          <span className="bg-white text-[#f05a24] text-[11px] font-black h-5.5 min-w-[22px] px-1.5 rounded-full shadow-xs flex items-center justify-center">
            {totalCartCount}
          </span>
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
                <div className="w-8 h-8 rounded-full bg-[#f05a24]/10 border border-[#f05a24]/20 flex items-center justify-center text-[#f05a24] font-bold">
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
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-[#f05a24]/10 hover:border-[#f05a24]/30 border border-gray-100 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base group-hover:scale-110 transition-transform">🍽️</span>
                      <span className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-[#f05a24]">
                        {category.category_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 shadow-2xs">
                        {count} {count === 1 ? 'item' : 'items'}
                      </span>
                      <span className="text-gray-400 text-xs font-bold group-hover:text-[#f05a24]">→</span>
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
