import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, BellRing, PhoneCall, Search, SlidersHorizontal, 
  Heart, Utensils, ShoppingBag, LayoutGrid, MoreHorizontal, 
  X, BarChart3, UtensilsCrossed, Package, Users, User, 
  Settings, HelpCircle, Info, ChevronRight, Plus, Minus, ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('emenu_favorites');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      localStorage.setItem('emenu_favorites', JSON.stringify(next));
      return next;
    });
  };

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


  const ShipWheelSVG = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="1" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="23" />
      <line x1="1" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="19.78" y1="4.22" x2="17.66" y2="6.34" />
      <line x1="6.34" y1="17.66" x2="4.22" y2="19.78" />
    </svg>
  );

  const SteamingPotSVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <path d="M7 3.5C7 2.5 8 2 8 1.5M12 3.5C12 2.5 13 2 13 1.5M16 3.5C16 2.5 17 2 17 1.5" stroke="#f05a24" strokeWidth="2" strokeLinecap="round"/>
      <path d="M4 10C4 8.89543 4.89543 8 6 8H18C19.1046 8 20 8.89543 20 10V11C20 15.4183 16.4183 19 12 19C7.58172 19 4 15.4183 4 11V10Z" fill="#F05A24" fillOpacity="0.18" stroke="#f05a24" strokeWidth="2"/>
      <path d="M2 10.5H22" stroke="#f05a24" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  const CutleryFilterSVG = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <path d="M6 2V10M10 2V10M6 6H10M8 10V22" stroke="#F05A24" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M16 2V7C16 9 18 10 18 10V22" stroke="#F05A24" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );

  const getItemImage = (item: any, categoryName: string = ''): string => {
    if (item.image_url && item.image_url.startsWith('http')) return item.image_url;
    if (item.image && item.image.startsWith('http')) return item.image;

    const name = (item.item_name || '').toLowerCase();
    const cat = categoryName.toLowerCase();

    // Biryani matches reference image closely
    if (name.includes('veg biryani') || (cat.includes('biryani') && name.includes('veg'))) {
      return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80';
    }
    if (name.includes('chicken biryani') || name.includes('non veg biryani') || name.includes('mutton biryani')) {
      return 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80';
    }
    if (name.includes('egg biryani')) {
      return 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80';
    }
    if (name.includes('biryani') || cat.includes('biryani') || name.includes('pulao') || name.includes('rice')) {
      return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80';
    }

    // Starters / Tikka
    if (name.includes('paneer tikka')) {
      return 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=80';
    }
    if (name.includes('chicken tikka') || name.includes('kebab') || name.includes('tandoori') || name.includes('wings')) {
      return 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80';
    }
    if (cat.includes('starter') || name.includes('roll') || name.includes('crispy') || name.includes('fries') || name.includes('pakora')) {
      return 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&auto=format&fit=crop&q=80';
    }

    // Curries / Main Course
    if (name.includes('butter chicken') || name.includes('chicken curry') || name.includes('mutton curry')) {
      return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80';
    }
    if (name.includes('paneer') || name.includes('dal') || name.includes('curry') || name.includes('masala') || cat.includes('main')) {
      return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&auto=format&fit=crop&q=80';
    }

    // Breads / Naan
    if (name.includes('naan') || name.includes('roti') || name.includes('paratha') || name.includes('kulcha') || cat.includes('bread')) {
      return 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80';
    }

    // Chinese / Noodles
    if (name.includes('noodle') || name.includes('fried rice') || name.includes('manchurian') || name.includes('momo') || cat.includes('chinese')) {
      return 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80';
    }

    // Beverages / Drinks
    if (name.includes('shake') || name.includes('juice') || name.includes('mojito') || name.includes('lassi') || name.includes('soda') || cat.includes('drink') || cat.includes('beverage')) {
      return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80';
    }
    if (name.includes('coffee') || name.includes('tea') || name.includes('chai')) {
      return 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80';
    }

    // Desserts
    if (name.includes('jamun') || name.includes('halwa') || name.includes('ice cream') || name.includes('cake') || name.includes('sweet') || cat.includes('dessert')) {
      return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80';
    }

    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';
  };

  const getCategoryThumbnail = (categoryName: string = ''): string => {
    const c = categoryName.toLowerCase();
    if (c.includes('biryani')) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=120&auto=format&fit=crop&q=80';
    if (c.includes('starter') || c.includes('snack') || c.includes('appetizer')) return 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=120&auto=format&fit=crop&q=80';
    if (c.includes('main') || c.includes('curry') || c.includes('gravy')) return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=120&auto=format&fit=crop&q=80';
    if (c.includes('beverage') || c.includes('drink') || c.includes('juice')) return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=120&auto=format&fit=crop&q=80';
    if (c.includes('dessert') || c.includes('sweet') || c.includes('ice')) return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=120&auto=format&fit=crop&q=80';
    if (c.includes('chinese') || c.includes('noodle')) return 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=120&auto=format&fit=crop&q=80';
    if (c.includes('bread') || c.includes('roti') || c.includes('naan')) return 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=120&auto=format&fit=crop&q=80';
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=80';
  };

  const MenuSection = ({ title, items }: { title: string; items: any[] }) => (
    <section 
      id={`category-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} 
      className="mx-3 sm:mx-6 mt-6 scroll-mt-24"
    >
      {/* Category Section Header matching reference image: Title on Left, "View All >" on Right */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base sm:text-xl font-black text-gray-900 tracking-tight">{title}</h2>
        <button 
          type="button"
          onClick={() => {
            setActiveCategory(title);
            const el = document.getElementById(`category-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="text-xs sm:text-sm font-bold text-gray-700 hover:text-[#f05a24] flex items-center gap-0.5 cursor-pointer transition-colors"
        >
          <span>View All</span>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* 2-Column Grid on Mobile / Small Screen (Matching Reference Mockup!) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {items.map((item) => {
          const dietaryType = getDietaryType(item);
          const priceNum = parseFloat(item.price || '0');
          const qty = getQuantityInCart(item.item_id);
          const isFav = !!favorites[item.item_id];
          const dishImg = getItemImage(item, title);

          return (
            <div 
              key={item.item_id} 
              className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col group"
            >
              {/* Dish Image with Overlays */}
              <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
                <img 
                  src={dishImg} 
                  alt={item.item_name} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Top-Left Dietary Badge */}
                <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-xs p-1 rounded-md shadow-xs flex items-center justify-center">
                  {dietaryType === 'Veg' && (
                    <div className="w-3.5 h-3.5 border-2 border-emerald-600 flex items-center justify-center rounded-xs bg-white" title="Veg">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                    </div>
                  )}
                  {dietaryType === 'Non-Veg' && (
                    <div className="w-3.5 h-3.5 border-2 border-rose-600 flex items-center justify-center rounded-xs bg-white" title="Non-Veg">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-600"></div>
                    </div>
                  )}
                  {dietaryType === 'Egg' && (
                    <div className="w-3.5 h-3.5 border-2 border-amber-500 flex items-center justify-center rounded-xs bg-white" title="Egg">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    </div>
                  )}
                </div>

                {/* Top-Right Favorite Heart Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.item_id);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-xs text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xs"
                  title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart 
                    size={14} 
                    className={isFav ? "fill-rose-500 text-rose-500" : "text-white"} 
                  />
                </button>
              </div>

              {/* Dish Info & Add Action */}
              <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between gap-1.5">
                <div>
                  <h3 
                    className="text-xs sm:text-sm font-extrabold text-gray-900 leading-snug line-clamp-1 group-hover:text-[#f05a24] transition-colors" 
                    title={item.item_name}
                  >
                    {item.item_name}
                  </h3>
                </div>

                <div className="flex items-center justify-between gap-1 pt-1">
                  <span className="text-xs sm:text-sm font-black text-gray-950 tracking-tight">
                    ₹{priceNum.toFixed(0)}
                  </span>

                  {qty > 0 ? (
                    <div className="flex items-center bg-[#f05a24] text-white rounded-full px-1 py-0.5 shadow-xs">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item)}
                        className="w-5 h-5 flex items-center justify-center text-xs font-black cursor-pointer hover:opacity-80 active:scale-90"
                      >
                        −
                      </button>
                      <span className="text-[11px] font-black px-1 min-w-[16px] text-center">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        className="w-5 h-5 flex items-center justify-center text-xs font-black cursor-pointer hover:opacity-80 active:scale-90"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      className="w-7 h-7 rounded-full bg-[#f05a24] hover:bg-[#d94815] text-white flex items-center justify-center font-black text-base shadow-xs active:scale-90 transition-all cursor-pointer"
                      title="Add to cart"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="index-body min-h-screen bg-[#F8FAFC] pb-28 md:pb-28">
      <Header onLogout={onLogout} />

      {/* Search Bar & Filter Button (Matching Reference Mockup) */}
      <div className="flex items-center gap-2 mx-3 sm:mx-6 mt-3 sm:mt-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search for dishes, drinks, SKUs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-gray-900 outline-none focus:border-[#f05a24] focus:ring-2 focus:ring-[#f05a24]/20 shadow-2xs transition-all placeholder:text-gray-400"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex-shrink-0 shadow-2xs ${
            showFilters || dietaryFilter !== 'ALL' || specialFilter !== 'ALL'
              ? 'bg-[#f05a24] text-white border-[#f05a24]'
              : 'bg-white text-gray-700 border-slate-200 hover:text-[#f05a24] hover:border-[#f05a24]'
          }`}
          title="Toggle Filters"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Category Horizontal Carousel (Matching Reference Mockup: All | Biryani | Starters | Main Course | Beverages...) */}
      <div className="flex items-center gap-2.5 px-3 sm:px-6 mt-3 overflow-x-auto select-none no-scrollbar py-1.5">
        {/* "All" Card */}
        <button
          type="button"
          onClick={() => {
            setActiveCategory('ALL');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center min-w-[68px] w-[70px] h-[78px] rounded-2xl p-1.5 transition-all cursor-pointer flex-shrink-0 text-center select-none ${
            activeCategory === 'ALL'
              ? 'bg-[#f05a24] text-white shadow-md shadow-[#f05a24]/25 scale-102'
              : 'bg-white text-gray-800 border border-slate-200/90 hover:bg-slate-50 shadow-2xs'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1 ${activeCategory === 'ALL' ? 'text-white' : 'text-[#f05a24]'}`}>
            <ShipWheelSVG />
          </div>
          <span className="text-[11px] font-extrabold tracking-tight">
            All
          </span>
        </button>

        {/* Categories from backend */}
        {categories.map((cat: any) => {
          const isSelected = activeCategory === cat.category_id || activeCategory === cat.category_name;
          const thumb = getCategoryThumbnail(cat.category_name);
          const catAnchorId = `category-${cat.category_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

          return (
            <button
              key={cat.category_id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.category_name);
                setTimeout(() => {
                  const el = document.getElementById(catAnchorId);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
              }}
              className={`flex flex-col items-center justify-center min-w-[68px] w-[70px] h-[78px] rounded-2xl p-1.5 transition-all cursor-pointer flex-shrink-0 text-center select-none ${
                isSelected
                  ? 'bg-[#f05a24] text-white shadow-md shadow-[#f05a24]/25 scale-102'
                  : 'bg-white text-gray-800 border border-slate-200/90 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center mb-1 bg-slate-100 flex-shrink-0">
                <img 
                  src={thumb} 
                  alt={cat.category_name} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] font-extrabold tracking-tight truncate w-full px-0.5">
                {cat.category_name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expandable Filter Toggle Buttons */}
      {showFilters && (
        <div className="flex items-center gap-2 px-3 sm:px-6 mt-2 overflow-x-auto select-none no-scrollbar py-1 animate-in fade-in slide-in-from-top-2">
          <button
            type="button"
            onClick={() => { setDietaryFilter('ALL'); setSpecialFilter('ALL'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
              dietaryFilter === 'ALL' && specialFilter === 'ALL'
                ? 'bg-[#121417] text-white border-[#121417] shadow-xs'
                : 'bg-white text-gray-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CutleryFilterSVG /> All Items
          </button>

          <button
            type="button"
            onClick={() => setDietaryFilter(dietaryFilter === 'VEG' ? 'ALL' : 'VEG')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
              dietaryFilter === 'VEG'
                ? 'bg-[#121417] text-white border-[#121417] shadow-xs'
                : 'bg-white text-gray-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Veg Only
          </button>

          <button
            type="button"
            onClick={() => setDietaryFilter(dietaryFilter === 'NON_VEG' ? 'ALL' : 'NON_VEG')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
              dietaryFilter === 'NON_VEG'
                ? 'bg-[#121417] text-white border-[#121417] shadow-xs'
                : 'bg-white text-gray-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Non-Veg
          </button>

          <button
            type="button"
            onClick={() => setDietaryFilter(dietaryFilter === 'EGG' ? 'ALL' : 'EGG')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
              dietaryFilter === 'EGG'
                ? 'bg-[#121417] text-white border-[#121417] shadow-xs'
                : 'bg-white text-gray-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Egg
          </button>

          <button
            type="button"
            onClick={() => setSpecialFilter(specialFilter === 'SPECIAL' ? 'ALL' : 'SPECIAL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
              specialFilter === 'SPECIAL'
                ? 'bg-[#121417] text-white border-[#121417] shadow-xs'
                : 'bg-white text-gray-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>⭐</span> Bestsellers
          </button>
        </div>
      )}

      {/* Menu Sections Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#f05a24]"></div>
          <p className="text-gray-500 mt-3 text-xs font-bold">Loading dishes from API...</p>
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
              No items found matching your search.
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
            className="fixed bottom-24 right-4 z-40 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white font-bold text-xs p-3 md:px-4 md:py-2.5 rounded-full shadow-xl flex items-center justify-center gap-2 border border-amber-400/80 transition-all cursor-pointer animate-float-glow"
            title="Call Waiter"
          >
            <PhoneCall size={18} className="animate-pulse flex-shrink-0" />
            <span className="hidden md:inline font-extrabold tracking-wide">Call Waiter</span>
          </button>
        );
      })()}

      {/* Floating Cart Order Pill (on mobile when items in cart) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-16 left-3 right-3 z-40 max-w-md mx-auto md:hidden">
          <Link
            to="/cart"
            className="flex items-center justify-between bg-[#f05a24] hover:bg-[#d94815] text-white font-black text-xs sm:text-sm py-2.5 px-4 rounded-2xl shadow-xl shadow-[#f05a24]/30 active:scale-98 transition-all no-underline"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} />
              <span>View Order ({totalCartCount} {totalCartCount === 1 ? 'item' : 'items'})</span>
            </div>
            <div className="flex items-center gap-1 font-black">
              <span>View Cart</span>
              <ArrowRight size={14} />
            </div>
          </Link>
        </div>
      )}

      {/* FIXED BOTTOM MOBILE NAVIGATION BAR (Matching Mockup Left Screen) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-4 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
        {/* Menu Tab */}
        <button
          type="button"
          onClick={() => {
            setActiveCategory('ALL');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl bg-orange-50 text-[#f05a24] font-extrabold transition-all cursor-pointer"
        >
          <Utensils size={18} />
          <span className="text-[10px] mt-0.5 font-black">Menu</span>
        </button>

        {/* Orders Tab */}
        <Link
          to="/cart"
          className="relative flex flex-col items-center justify-center py-1 px-3 rounded-xl text-gray-500 hover:text-gray-900 font-bold transition-all no-underline"
        >
          <div className="relative">
            <ShoppingBag size={18} />
            {totalCartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#f05a24] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {totalCartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-extrabold">Orders</span>
        </Link>

        {/* Tables Tab */}
        <Link
          to="/tables"
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-gray-500 hover:text-gray-900 font-bold transition-all no-underline"
        >
          <LayoutGrid size={18} />
          <span className="text-[10px] mt-0.5 font-extrabold">Tables</span>
        </Link>

        {/* More Tab (Highlighted in Red in User Mockup!) */}
        <button
          type="button"
          onClick={() => setIsMoreSheetOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-gray-500 hover:text-gray-900 font-bold transition-all cursor-pointer"
        >
          <MoreHorizontal size={18} />
          <span className="text-[10px] mt-0.5 font-extrabold">More</span>
        </button>
      </div>

      {/* DESKTOP FLOATING BOTTOM BAR WITH QUICK MENU & CART */}
      <div className="hidden md:flex fixed bottom-4 left-6 right-6 z-40 items-center justify-between gap-3 max-w-md mx-auto">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-slate-200 text-gray-900 font-extrabold text-xs sm:text-sm py-3 px-5 rounded-2xl shadow-xl active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-base font-black">☰</span>
          <span>Categories</span>
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

      {/* "MORE OPTIONS" BOTTOM SHEET (Matching Right Screen in Mockup) */}
      {isMoreSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs p-0 animate-fade-in"
          onClick={() => setIsMoreSheetOpen(false)}
        >
          <div
            className="w-full sm:max-w-md max-h-[85vh] bg-white rounded-t-3xl p-5 shadow-2xl space-y-3 animate-slide-up flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull Handle Pill */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto flex-shrink-0"></div>

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-lg font-black text-gray-900 tracking-tight">More Options</h3>
              <button
                onClick={() => setIsMoreSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Options List */}
            <div className="overflow-y-auto pr-1 space-y-1 divide-y divide-slate-100 no-scrollbar flex-1">
              {/* 1. Reports */}
              <Link
                to="/history"
                onClick={() => setIsMoreSheetOpen(false)}
                className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors group no-underline"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#f05a24] transition-colors">Reports</h4>
                    <p className="text-xs text-gray-400 font-medium">View sales, orders and analytics</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* 2. Menu Management */}
              <Link
                to="/manage-menu"
                onClick={() => setIsMoreSheetOpen(false)}
                className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors group no-underline"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                    <UtensilsCrossed size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#f05a24] transition-colors">Menu Management</h4>
                    <p className="text-xs text-gray-400 font-medium">Add, edit or manage menu items</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* 3. Stocks */}
              <Link
                to="/stock"
                onClick={() => setIsMoreSheetOpen(false)}
                className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors group no-underline"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                    <Package size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#f05a24] transition-colors">Stocks</h4>
                    <p className="text-xs text-gray-400 font-medium">Manage inventory and stock items</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* 4. Customers */}
              <div
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  navigate('/history');
                }}
                className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#f05a24] transition-colors">Customers</h4>
                    <p className="text-xs text-gray-400 font-medium">View and manage customers</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
              </div>

              {/* 5. Staff */}
              <div
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  navigate('/settings');
                }}
                className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#f05a24] transition-colors">Staff</h4>
                    <p className="text-xs text-gray-400 font-medium">Manage staff and roles</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
              </div>

              {/* 6. Settings */}
              <Link
                to="/settings"
                onClick={() => setIsMoreSheetOpen(false)}
                className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors group no-underline"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#f05a24] transition-colors">Settings</h4>
                    <p className="text-xs text-gray-400 font-medium">App, printer and outlet settings</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* 7. Help & Support */}
              <div
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  setIsCallWaiterOpen(true);
                }}
                className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center shrink-0">
                    <HelpCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#f05a24] transition-colors">Help & Support</h4>
                    <p className="text-xs text-gray-400 font-medium">FAQ, contact support</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
              </div>

              {/* 8. About */}
              <div
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  alert("Tischly POS v2.0 - Smart Next-Gen Restaurant Management System.\nLicensed to Big Ben Restaurant.");
                }}
                className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Info size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#f05a24] transition-colors">About</h4>
                    <p className="text-xs text-gray-400 font-medium">App version, licenses and info</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
        </div>
      )}

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
            <div className="flex items-center justify-between border-b border-[#F0E6DF] pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#FFF0E6] border border-[#f05a24]/20 flex items-center justify-center text-[#f05a24] shadow-2xs">
                  <SteamingPotSVG />
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
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-[#FFF0E6]/60 border border-[#F0E6DF] hover:border-[#f05a24]/40 transition-all cursor-pointer group text-left shadow-2xs active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FFF0E6] flex items-center justify-center shrink-0 group-hover:bg-[#f05a24] transition-colors">
                        {getCategoryThumbnail(category.category_name) ? (
                          <img src={getCategoryThumbnail(category.category_name)} alt={category.category_name} className="w-full h-full object-cover rounded-md" />
                        ) : (
                          <SteamingPotSVG />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-gray-900 group-hover:text-[#f05a24] transition-colors">
                        {category.category_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold text-[#f05a24] bg-[#FFF0E6] px-2.5 py-0.5 rounded-full border border-[#f05a24]/20 shadow-2xs">
                        {count} {count === 1 ? 'item' : 'items'}
                      </span>
                      <span className="text-[#f05a24] text-xs font-bold group-hover:translate-x-0.5 transition-transform">→</span>
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
