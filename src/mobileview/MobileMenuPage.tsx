import React, { useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Utensils,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { MobileHeader, MobileFooter } from "../components/mobile";

const ShipWheelSVG = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className={className}
  >
    <circle cx="12" cy="12" r="3" />
    <path
      d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Fallback Default Categories
const defaultCategories = [
  { name: "All", icon: <ShipWheelSVG /> },
  { name: "Biryani", image: "/images/cat_biryani.png" },
  { name: "Starters", image: "/images/cat_starters.png" },
  { name: "Main Course", image: "/images/cat_main_course.png" },
  { name: "Beverages", image: "/images/cat_beverages.png" },
];

const defaultMenuItems = [
  {
    id: "m1",
    name: "Veg Biryani",
    price: 299,
    type: "Veg",
    category: "Biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "m2",
    name: "Non Veg Biryani",
    price: 499,
    type: "Non-Veg",
    category: "Biryani",
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "m3",
    name: "Egg Biryani - Half",
    price: 199,
    type: "Egg",
    category: "Biryani",
    image: "https://images.unsplash.com/photo-1603105037880-880cd4edfb5d?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "m4",
    name: "Egg Biryani - Full",
    price: 299,
    type: "Egg",
    category: "Biryani",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80",
  },
];

const getDietaryType = (item: any): "Veg" | "Non-Veg" | "Egg" => {
  const nameLower = (item.item_name || item.name || "").toLowerCase();
  const info = (item.dietary_info || item.type || "").toLowerCase();

  if (nameLower.includes("egg") || info.includes("egg")) return "Egg";
  if (
    nameLower.includes("non veg") ||
    nameLower.includes("non-veg") ||
    nameLower.includes("chicken") ||
    nameLower.includes("mutton") ||
    nameLower.includes("fish") ||
    info === "non-veg" ||
    info === "non veg"
  ) {
    return "Non-Veg";
  }
  return "Veg";
};

const getItemImageFallback = (item: any, categoryName: string): string => {
  if (item.image_url) return item.image_url;
  if (item.image) return item.image;
  const c = (categoryName || "").toLowerCase();
  if (c.includes("biryani")) return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80";
  if (c.includes("starter") || c.includes("tikka")) return "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=80";
  return "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80";
};

const getCategoryThumbnail = (categoryName: string): string => {
  const c = categoryName.toLowerCase();
  if (c.includes("biryani")) return "/images/cat_biryani.png";
  if (c.includes("starter") || c.includes("tikka")) return "/images/cat_starters.png";
  if (c.includes("main")) return "/images/cat_main_course.png";
  if (c.includes("beverage") || c.includes("drink")) return "/images/cat_beverages.png";
  return "/images/cat_biryani.png";
};

function FoodCard({
  item,
  quantity = 0,
  onAdd,
  onRemove,
  isFavorite = false,
  onToggleFavorite,
}: {
  item: any;
  quantity?: number;
  onAdd?: () => void;
  onRemove?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      {/* Image Area */}
      <div className="relative h-30 sm:h-30 w-full overflow-hidden bg-slate-100">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80";
          }}
        />

        {/* FSSAI Dietary Badge */}
        <div className="absolute left-2 top-2 z-10">
          <div
            className={`flex h-4.5 w-4.5 items-center justify-center rounded-[3px] border-[1.5px] bg-white shadow-xs ${
              item.type === "Veg"
                ? "border-[#00B074]"
                : item.type === "Non-Veg"
                ? "border-[#E53935]"
                : "border-[#FF9800]"
            }`}
          >
            <div
              className={`h-1.5 w-1.5 rounded-full ${
                item.type === "Veg"
                  ? "bg-[#00B074]"
                  : item.type === "Non-Veg"
                  ? "bg-[#E53935]"
                  : "bg-[#FF9800]"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Card Info Area */}
      <div className="p-2 sm:p-2.5 flex flex-col justify-between flex-1 gap-1">
        <h3
          className="text-[13px] sm:text-sm font-bold text-slate-800 leading-tight line-clamp-1"
          title={item.name}
        >
          {item.name}
        </h3>

        <div className="flex items-center justify-between pt-0">
          <span className="text-[14.5px] sm:text-[15px] font-extrabold text-slate-900">
            ₹{item.price}
          </span>

          {quantity > 0 ? (
            <div className="flex items-center gap-1.5 bg-[#ff5200] text-white rounded-full px-2 py-0.5 shadow-sm">
              <button
                type="button"
                onClick={onRemove}
                className="w-4 h-4 flex items-center justify-center text-xs font-black active:scale-90 cursor-pointer"
              >
                −
              </button>
              <span className="text-xs font-extrabold min-w-[12px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={onAdd}
                className="w-4 h-4 flex items-center justify-center text-xs font-black active:scale-90 cursor-pointer"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff5200] hover:bg-[#e04800] text-white shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer"
              title="Add to cart"
            >
              <Plus size={17} strokeWidth={2.8} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MobileMenuPage({ onLogout: _onLogout }: { onLogout?: () => void }) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [dietaryFilter, setDietaryFilter] = useState<"ALL" | "VEG" | "NON_VEG" | "EGG">("ALL");

  const userObj = (() => {
    try {
      const saved = localStorage.getItem("emenu_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const roleAlias = (userObj?.role_alias || userObj?.role || "").toLowerCase();
  const isGuestUser = !userObj || userObj?.isGuest || roleAlias === "guest_user" || roleAlias === "guest";
  const isStaffUser = !!userObj && !isGuestUser;
  const isWaiter = roleAlias === "waiter";
  const isAdmin = roleAlias === "admin" || roleAlias === "super_admin" || roleAlias === "owner";

  // Check if tables are enabled in settings
  const isEnableTables = (() => {
    try {
      const cachedSettingsStr = localStorage.getItem("emenu_pos_settings");
      if (cachedSettingsStr) {
        const s = JSON.parse(cachedSettingsStr);
        const val = s?.hardware_and_preferences?.is_enable_tables ?? s?.is_enable_tables ?? s?.isEnableTables;
        if (val === false || val === "false" || val === 0 || val === "0") return false;
      }
    } catch {}
    return true;
  })();

  const handleLogout = () => {
    localStorage.removeItem("emenu_user");
    localStorage.removeItem("emenu_cart");
    localStorage.removeItem("emenu_last_order");
    localStorage.removeItem("emenu_token");
    sessionStorage.clear();
    if (_onLogout) {
      _onLogout();
    } else {
      window.location.href = "/login";
    }
  };
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("emenu_favorites");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [cart, setCart] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem("emenu_cart");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      localStorage.setItem("emenu_favorites", JSON.stringify(next));
      return next;
    });
  };

  const saveCart = (newCart: Record<string, any>) => {
    setCart(newCart);
    localStorage.setItem("emenu_cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("emenu_cart_updated"));
  };

  const addToCart = (item: any) => {
    const itemId = String(item.id || item.item_id);
    const newCart = { ...cart };
    if (newCart[itemId]) {
      newCart[itemId].quantity += 1;
    } else {
      newCart[itemId] = {
        id: itemId,
        name: item.name || item.item_name,
        price: parseFloat(item.price || "0"),
        quantity: 1,
        isVeg: item.type === "Veg" || getDietaryType(item) === "Veg",
        image: item.image_url || item.image || item.item_image || "",
      };
    }
    saveCart(newCart);
  };

  const removeFromCart = (item: any) => {
    const itemId = String(item.id || item.item_id);
    const newCart = { ...cart };
    if (newCart[itemId]) {
      if (newCart[itemId].quantity > 1) {
        newCart[itemId].quantity -= 1;
      } else {
        delete newCart[itemId];
      }
      saveCart(newCart);
    }
  };

  const getQuantityInCart = (itemId: string) => {
    return cart[itemId]?.quantity || 0;
  };

  useEffect(() => {
    const loadMenuAndSession = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams(window.location.search);
        const urlTable = queryParams.get("table") || queryParams.get("table_number");
        if (urlTable) {
          const clean = String(urlTable).replace(/[^0-9]/g, "");
          sessionStorage.setItem("emenu_table", clean || urlTable);
        }

        const savedUser = localStorage.getItem("emenu_user");
        const userObj = savedUser ? JSON.parse(savedUser) : null;
        const restaurantId = userObj?.restaurant_id || userObj?.restaurent_id || 9;

        const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
        let cachedCategories: any[] = [];
        const cachedMenuStr = sessionStorage.getItem(`emenu_cached_menu_${restaurantId}`);
        const cachedMenuTimeStr = sessionStorage.getItem(`emenu_cached_menu_time_${restaurantId}`);
        const isCacheValid =
          cachedMenuStr &&
          cachedMenuTimeStr &&
          Date.now() - parseInt(cachedMenuTimeStr, 10) < FIFTEEN_MINUTES_MS;

        if (isCacheValid) {
          try {
            cachedCategories = JSON.parse(cachedMenuStr);
          } catch {}
        }

        const menuRes = cachedCategories.length > 0
          ? null
          : await fetch(`${API_BASE_URL}/menus/${restaurantId}`).catch(() => null);

        if (cachedCategories.length > 0) {
          setCategories(cachedCategories);
        } else if (menuRes && menuRes.ok) {
          const menuData = await menuRes.json();
          const fetchedCats = menuData.categories || [];
          setCategories(fetchedCats);
          sessionStorage.setItem(`emenu_cached_menu_${restaurantId}`, JSON.stringify(fetchedCats));
          sessionStorage.setItem(`emenu_cached_menu_time_${restaurantId}`, String(Date.now()));
        }
      } catch (err) {
        console.error("Error loading menu:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMenuAndSession();
  }, []);

  useEffect(() => {
    const handleCartSync = () => {
      const saved = localStorage.getItem("emenu_cart");
      if (saved) {
        try {
          setCart(JSON.parse(saved));
        } catch {}
      } else {
        setCart({});
      }
    };
    window.addEventListener("emenu_cart_updated", handleCartSync);
    return () => window.removeEventListener("emenu_cart_updated", handleCartSync);
  }, []);

  const hasApiCategories = categories && categories.length > 0;

  const carouselCategories: Array<{ name: string; image?: string; icon?: React.ReactNode }> = [
    { name: "All", icon: <ShipWheelSVG /> },
    ...(hasApiCategories
      ? categories.map((c) => ({
          name: c.category_name,
          image: getCategoryThumbnail(c.category_name),
        }))
      : defaultCategories
          .filter((c) => c.name !== "All")
          .map((c) => ({
            name: c.name,
            image: c.image || getCategoryThumbnail(c.name),
          }))),
  ];

  let sectionsToRender: Array<{ title: string; items: any[] }> = [];

  if (hasApiCategories) {
    sectionsToRender = categories
      .map((cat: any) => {
        const items = (cat.items || []).filter((item: any) => {
          const name = item.item_name || "";
          const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
          const type = getDietaryType(item);

          let matchesDietary = true;
          if (dietaryFilter === "VEG") matchesDietary = type === "Veg";
          if (dietaryFilter === "NON_VEG") matchesDietary = type === "Non-Veg";
          if (dietaryFilter === "EGG") matchesDietary = type === "Egg";

          return matchesSearch && matchesDietary;
        });

        return {
          title: cat.category_name,
          items: items.map((it: any) => ({
            id: String(it.item_id),
            name: it.item_name,
            price: parseFloat(it.price || "0"),
            type: getDietaryType(it),
            description: it.description || "",
            image: getItemImageFallback(it, cat.category_name),
          })),
        };
      })
      .filter((cat) => cat.items.length > 0);
  } else {
    const filteredDefaults = defaultMenuItems.filter((it) => {
      const matchesSearch = it.name.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesDietary = true;
      if (dietaryFilter === "VEG") matchesDietary = it.type === "Veg";
      if (dietaryFilter === "NON_VEG") matchesDietary = it.type === "Non-Veg";
      if (dietaryFilter === "EGG") matchesDietary = it.type === "Egg";
      return matchesSearch && matchesDietary;
    });

    const groups: Record<string, any[]> = {};
    filteredDefaults.forEach((it) => {
      if (!groups[it.category]) groups[it.category] = [];
      groups[it.category].push(it);
    });

    sectionsToRender = Object.keys(groups).map((title) => ({
      title,
      items: groups[title],
    }));
  }

  const visibleSections =
    activeCategory === "All"
      ? sectionsToRender
      : sectionsToRender.filter((sec) => sec.title === activeCategory);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-x-hidden">
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#F8FAFC] overflow-x-hidden">
        {/* Common Mobile Header */}
        <MobileHeader onLogout={_onLogout} />

        {/* Content Section */}
        <section className="px-3 sm:px-4 pb-24 pt-2 space-y-2.5">
          {/* Search & Filter Row */}
          <div className="flex gap-2">
            <div className="flex h-9.5 flex-1 items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 shadow-xs">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search for dishes, drinks, SKUs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-[12.5px] font-normal text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-9.5 w-9.5 items-center justify-center rounded-xl border shadow-xs cursor-pointer transition ${
                showFilters || dietaryFilter !== "ALL"
                  ? "border-[#ff5200] bg-orange-50 text-[#ff5200]"
                  : "border-slate-100 bg-white text-slate-600"
              }`}
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>

          {showFilters && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar animate-in fade-in duration-150">
              {/* All Items */}
              <button
                type="button"
                onClick={() => setDietaryFilter("ALL")}
                className={`flex h-[38px] shrink-0 items-center gap-2 px-4 rounded-full text-[13px] font-normal border transition cursor-pointer whitespace-nowrap shadow-2xs ${
                  dietaryFilter === "ALL"
                    ? "bg-[#1e2229] text-white border-[#1e2229] shadow-sm"
                    : "bg-white text-slate-800 border-slate-200/90 hover:border-slate-300"
                }`}
              >
                <Utensils size={15} className="text-[#ff5200] shrink-0" strokeWidth={1.8} />
                <span>All Items</span>
              </button>

              {/* Veg Only */}
              <button
                type="button"
                onClick={() => setDietaryFilter(dietaryFilter === "VEG" ? "ALL" : "VEG")}
                className={`flex h-[38px] shrink-0 items-center gap-2 px-4 rounded-full text-[13px] font-normal border transition cursor-pointer whitespace-nowrap shadow-2xs ${
                  dietaryFilter === "VEG"
                    ? "bg-[#1e2229] text-white border-[#1e2229] shadow-sm"
                    : "bg-white text-slate-800 border-slate-200/90 hover:border-slate-300"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[#00b074] shrink-0" />
                <span>Veg Only</span>
              </button>

              {/* Non-Veg */}
              <button
                type="button"
                onClick={() => setDietaryFilter(dietaryFilter === "NON_VEG" ? "ALL" : "NON_VEG")}
                className={`flex h-[38px] shrink-0 items-center gap-2 px-4 rounded-full text-[13px] font-normal border transition cursor-pointer whitespace-nowrap shadow-2xs ${
                  dietaryFilter === "NON_VEG"
                    ? "bg-[#1e2229] text-white border-[#1e2229] shadow-sm"
                    : "bg-white text-slate-800 border-slate-200/90 hover:border-slate-300"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444] shrink-0" />
                <span>Non-Veg</span>
              </button>

              {/* Egg Only */}
              <button
                type="button"
                onClick={() => setDietaryFilter(dietaryFilter === "EGG" ? "ALL" : "EGG")}
                className={`flex h-[38px] shrink-0 items-center gap-2 px-4 rounded-full text-[13px] font-normal border transition cursor-pointer whitespace-nowrap shadow-2xs ${
                  dietaryFilter === "EGG"
                    ? "bg-[#1e2229] text-white border-[#1e2229] shadow-sm"
                    : "bg-white text-slate-800 border-slate-200/90 hover:border-slate-300"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff9800] shrink-0" />
                <span>Egg Only</span>
              </button>
            </div>
          )}

          {/* Category Carousel Tiles - Compact Height & Full Width */}
          <div className="flex gap-2 w-full pb-0.5 overflow-x-auto no-scrollbar">
            {carouselCategories.map((category) => {
              const isActive = activeCategory === category.name;
              return (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.name);
                    if (category.name === "All") {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                      const el = document.getElementById(
                        `cat-${category.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
                      );
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className={`flex h-[66px] min-w-[66px] px-1.5 pt-1.5 pb-1 shrink-0 flex-col items-center justify-between rounded-2xl border cursor-pointer transition active:scale-95 ${
                    isActive
                      ? "border-[#ff5a1f] bg-[#ff5a1f] text-white shadow-[0_4px_12px_rgba(255,90,31,0.22)]"
                      : "border-slate-200/70 bg-white text-[#111827] shadow-xs hover:border-slate-300"
                  }`}
                >
                  <div className="flex h-[36px] w-[36px] sm:h-[40px] sm:w-[40px] items-center justify-center">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="max-h-full max-w-full object-contain drop-shadow-xs"
                      />
                    ) : (
                      <ShipWheelSVG
                        className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 ${isActive ? "text-white" : "text-[#ff5a1f]"}`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[10.5px] sm:text-[11px] font-bold text-center tracking-tight truncate max-w-[62px] leading-tight pb-0.5 ${
                      isActive ? "text-white" : "text-[#111827]"
                    }`}
                  >
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category Sections & Dish Cards Grid (2 Columns Grid) */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ff5200]"></div>
              <p className="text-slate-400 mt-3 text-xs font-semibold">
                Loading menu items...
              </p>
            </div>
          ) : visibleSections.length > 0 ? (
            visibleSections.map((sec) => (
              <section key={sec.title} className="space-y-3 pt-1">
                {/* Category Section Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    {sec.title}
                  </h2>
                  <button
                    onClick={() => setActiveCategory(sec.title)}
                    className="flex items-center gap-0.5 text-[12.5px] font-semibold text-slate-500 hover:text-[#ff5200] cursor-pointer"
                  >
                    View All <ChevronRight size={14} />
                  </button>
                </div>

          {/* 2 Column Dishes Grid matching reference screenshot */}
          <div className="grid grid-cols-2 gap-2.5">
                  {sec.items.map((item) => (
                    <FoodCard
                      key={item.id}
                      item={item}
                      quantity={getQuantityInCart(item.id)}
                      onAdd={() => addToCart(item)}
                      onRemove={() => removeFromCart(item)}
                      isFavorite={!!favorites[item.id]}
                      onToggleFavorite={() => toggleFavorite(item.id)}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs font-medium">
              No menu items found matching your filters.
            </div>
          )}
        </section>

        {/* Common Mobile Bottom Navigation */}
        <MobileFooter
          onMenuClick={() => {
            setActiveCategory("All");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    </main>
  );
}
