import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Minus,
  X,
  ChevronRight,
  LayoutGrid,
  List,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { MobileHeader, MobileFooter } from "../components/mobile";
import { useTheme } from "../context/ThemeContext";

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
  { name: "Biryani", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=120&auto=format&fit=crop&q=80" },
  { name: "Starters", image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=120&auto=format&fit=crop&q=80" },
  { name: "Main Course", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=120&auto=format&fit=crop&q=80" },
  { name: "Beverages", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=120&auto=format&fit=crop&q=80" },
  { name: "Desserts", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=120&auto=format&fit=crop&q=80" },
  { name: "Breads", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80" },
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

const getItemImageFallback = (item: any, _categoryName: string): string => {
  if (item.image_url && typeof item.image_url === "string" && item.image_url.trim()) return item.image_url;
  if (item.image && typeof item.image === "string" && item.image.trim()) return item.image;
  return "";
};

const getCategoryThumbnail = (categoryName: string): string => {
  const c = categoryName.toLowerCase();
  if (c.includes("biryani")) return "/images/categories/cat_biryani.jpg";
  if (c.includes("starter") || c.includes("snack") || c.includes("appetizer")) return "/images/categories/cat_starters.jpg";
  if (c.includes("main") || c.includes("curry") || c.includes("gravy") || c.includes("handi") || c.includes("kofta")) return "/images/categories/cat_main_course.jpg";
  if (c.includes("rice") && c.includes("fried")) return "/images/categories/cat_fried_rice.jpg";
  if (c.includes("rice") || c.includes("pulav") || c.includes("pulao")) return "/images/categories/cat_rice_pulav.jpg";
  if (c.includes("soft drink") || c.includes("cola") || c.includes("soda")) return "/images/categories/cat_soft_drinks.jpg";
  if (c.includes("drink") || c.includes("beverage") || c.includes("juice") || c.includes("tea") || c.includes("coffee") || c.includes("shake")) return "/images/categories/cat_drinks.jpg";
  if (c.includes("dessert") || c.includes("sweet") || c.includes("ice cream") || c.includes("cake")) return "/images/categories/cat_desserts.jpg";
  if (c.includes("salad")) return "/images/categories/cat_salads.jpg";
  if (c.includes("soup")) return "/images/categories/cat_soups.jpg";
  if (c.includes("bread") || c.includes("roti") || c.includes("naan") || c.includes("chapati") || c.includes("paratha")) return "/images/categories/cat_breads.jpg";
  if (c.includes("chicken") || c.includes("mutton") || c.includes("fish") || c.includes("seafood") || c.includes("prawn")) return "/images/categories/cat_chicken.jpg";
  if (c.includes("paneer") || c.includes("veg")) return "/images/categories/cat_paneer.jpg";
  return "";
};

function FoodTypeIcon({ type }: { type: string }) {
  const t = (type || "").toLowerCase();
  const isVeg = t === "veg";
  const isEgg = t === "egg";
  const borderColor = isVeg ? "border-[#00B074]" : isEgg ? "border-[#FF9800]" : "border-[#E53935]";
  const dotColor = isVeg ? "bg-[#00B074]" : isEgg ? "bg-[#FF9800]" : "bg-[#E53935]";

  return (
    <div
      className={`flex h-3.5 w-3.5 items-center justify-center rounded-[2.5px] border-[1.5px] bg-white shadow-2xs shrink-0 ${borderColor}`}
      title={isVeg ? "Veg" : isEgg ? "Egg" : "Non-Veg"}
    >
      <div className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
    </div>
  );
}

function FoodCard({
  item,
  quantity = 0,
  onAdd,
  onRemove,
  isFavorite: _isFavorite = false,
  onToggleFavorite: _onToggleFavorite,
  onClickCard,
}: {
  item: any;
  quantity?: number;
  onAdd?: () => void;
  onRemove?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onClickCard?: () => void;
}) {
  const { defaultImage } = useTheme();

  return (
    <div
      onClick={onClickCard}
      className="relative overflow-hidden rounded-2xl border border-slate-100/80 dark:border-zinc-800/90 bg-white dark:bg-[#1f1f28] shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer active:scale-99"
    >
      {/* Image Area */}
      <div className="relative h-30 sm:h-30 w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
        <img
          src={item.image || defaultImage}
          alt={item.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />

        {/* FSSAI Dietary Badge */}
        <div className="absolute left-2 top-2 z-10">
          <FoodTypeIcon type={item.type} />
        </div>
      </div>

      {/* Card Info Area */}
      <div className="p-2 sm:p-2.5 flex flex-col justify-between flex-1 gap-1">
        <h3
          className="text-[13px] sm:text-sm font-medium text-slate-800 dark:text-white leading-tight line-clamp-1"
          title={item.name}
        >
          {item.name}
        </h3>

        <div className="flex items-center justify-between pt-0">
          <span className="text-[13.5px] sm:text-[14px] font-medium text-slate-900 dark:text-white">
            ₹{item.price}
          </span>

          {quantity > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex h-7 items-center rounded-lg border border-[#ff5200] bg-white dark:bg-[#2a2a35] shadow-2xs overflow-hidden shrink-0"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.();
                }}
                className="flex h-full w-6 items-center justify-center text-[#ff5200] hover:bg-[#fff2ea] dark:hover:bg-zinc-700 active:bg-[#ffe5d6] transition cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus size={12} strokeWidth={2.5} />
              </button>
              <span className="flex h-full min-w-[20px] items-center justify-center text-[12px] font-medium text-[#ff5200] border-x border-[#ff5200]/20 bg-[#fffbf9] dark:bg-[#1f1f28] px-1 select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd?.();
                }}
                className="flex h-full w-6 items-center justify-center text-[#ff5200] hover:bg-[#fff2ea] dark:hover:bg-zinc-700 active:bg-[#ffe5d6] transition cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus size={12} strokeWidth={2.8} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdd?.();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff5200] hover:bg-[#e04800] text-white shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Add to cart"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FoodListItem({
  item,
  quantity = 0,
  onAdd,
  onRemove,
  isFavorite: _isFavorite,
  onToggleFavorite: _onToggleFavorite,
  onClickCard,
}: {
  item: any;
  quantity?: number;
  onAdd?: () => void;
  onRemove?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onClickCard?: () => void;
}) {
  const { defaultImage } = useTheme();

  return (
    <div
      onClick={onClickCard}
      className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] shadow-xs hover:shadow-sm transition cursor-pointer active:scale-[0.99]"
    >
      {/* Food Thumbnail with authentic FSSAI Badge */}
      <div className="relative h-16 w-16 sm:h-[68px] sm:w-[68px] shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800">
        <img
          src={item.image || defaultImage}
          alt={item.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
        <div className="absolute left-1.5 top-1.5 rounded-[3px] bg-white p-[1px] shadow-2xs z-10">
          <FoodTypeIcon type={item.type} />
        </div>
      </div>

      {/* Item info */}
      <div className="min-w-0 flex-1 pr-1">
        <h3
          className="text-[13px] sm:text-sm font-medium text-slate-800 dark:text-white leading-tight line-clamp-1"
          title={item.name}
        >
          {item.name}
        </h3>
        {item.category && (
          <p className="text-[10.5px] text-slate-400 dark:text-zinc-400 truncate mt-0.5">
            {item.category}
          </p>
        )}
        <p className="mt-1 text-[13.5px] sm:text-sm font-semibold text-slate-900 dark:text-white">
          ₹{item.price}
        </p>
      </div>

      {/* Add Button or Stepper */}
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        {quantity > 0 ? (
          <div className="flex h-7 items-center rounded-lg border border-[#ff5200] bg-white dark:bg-[#2a2a35] shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className="flex h-full w-6 items-center justify-center text-[#ff5200] hover:bg-[#fff2ea] dark:hover:bg-zinc-700 active:bg-[#ffe5d6] transition cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus size={12} strokeWidth={2.5} />
            </button>
            <span className="flex h-full min-w-[20px] items-center justify-center text-[12px] font-medium text-[#ff5200] border-x border-[#ff5200]/20 bg-[#fffbf9] dark:bg-[#1f1f28] px-1 select-none">
              {quantity}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdd?.();
              }}
              className="flex h-full w-6 items-center justify-center text-[#ff5200] hover:bg-[#fff2ea] dark:hover:bg-zinc-700 active:bg-[#ffe5d6] transition cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus size={12} strokeWidth={2.8} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd?.();
            }}
            className="flex h-7 px-3 items-center justify-center gap-1 rounded-lg bg-[#ff5200] text-white text-xs font-medium shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer hover:bg-[#e04800]"
            aria-label="Add to cart"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Add</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function MobileMenuPage({ onLogout: _onLogout }: { onLogout?: () => void }) {
  const navigate = useNavigate();
  const { defaultImage } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dietaryFilter, setDietaryFilter] = useState<"ALL" | "VEG" | "NON_VEG" | "EGG">("ALL");

  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    try {
      const saved = localStorage.getItem("emenu_view_mode");
      return saved === "list" || saved === "grid" ? saved : "grid";
    } catch {
      return "grid";
    }
  });
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Close view dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        viewDropdownRef.current &&
        !viewDropdownRef.current.contains(event.target as Node)
      ) {
        setShowViewDropdown(false);
      }
    };
    if (showViewDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showViewDropdown]);
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
          } catch { }
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
        } catch { }
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

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return sectionsToRender.flatMap((sec) =>
      sec.items.map((it) => ({
        ...it,
        category: sec.title,
      }))
    );
  }, [searchQuery, sectionsToRender]);

  return (
    <div className="h-screen h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-[#faf9f7] dark:bg-[#16161d] text-slate-900 dark:text-white font-sans transition-colors">
      {/* ================= FIXED TOP APP HEADER, FILTERS & CATEGORIES ================= */}
      <div className="shrink-0 z-20 w-full bg-[#faf9f7] dark:bg-[#16161d] border-b border-slate-200/70 dark:border-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-colors">
        {/* Common Mobile Header */}
        <MobileHeader onLogout={_onLogout} />

        {/* Search, Filter & Categories Controls Container */}
        <div className="px-3 sm:px-4 pt-1 pb-2 space-y-2">
          {/* Search & Filter Row */}
          <div className="flex gap-2">
            <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] px-3 shadow-[0_1px_4px_rgba(16,24,40,0.03)] focus-within:border-[#ff5200] transition">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search dishes, drinks, SKUs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-[12.5px] font-normal text-slate-800 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-0.5 active:scale-90 transition cursor-pointer shrink-0"
                  aria-label="Clear Search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-xs cursor-pointer transition active:scale-95 ${
                showFilters || dietaryFilter !== "ALL"
                  ? "border-[#ff5200] bg-[#fff4ed] dark:bg-[#ff5200]/20 text-[#ff5200]"
                  : "border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] text-slate-600 dark:text-zinc-300"
              }`}
              aria-label="Toggle Filter"
            >
              <SlidersHorizontal size={17} />
            </button>

            {/* View Mode Selector Button - Icon only */}
            <div className="relative shrink-0" ref={viewDropdownRef}>
              <button
                type="button"
                onClick={() => setShowViewDropdown(!showViewDropdown)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-xs cursor-pointer transition active:scale-95 ${
                  showViewDropdown
                    ? "border-[#ff5200] bg-[#fff4ed] dark:bg-[#ff5200]/20 text-[#ff5200]"
                    : "border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] text-slate-700 dark:text-zinc-300 hover:border-slate-300"
                }`}
                aria-label="Select View"
                title={viewMode === "grid" ? "Grid View" : "List View"}
              >
                {viewMode === "grid" ? (
                  <LayoutGrid size={18} className="text-[#ff5200]" />
                ) : (
                  <List size={18} className="text-[#ff5200]" />
                )}
              </button>

              {/* View Dropdown Menu */}
              {showViewDropdown && (
                <div className="absolute right-0 top-12 z-40 min-w-[136px] rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                  <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-400 select-none">
                    Select View
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("grid");
                      localStorage.setItem("emenu_view_mode", "grid");
                      setShowViewDropdown(false);
                    }}
                    className={`flex w-full items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition ${
                      viewMode === "grid"
                        ? "bg-[#fff4ed] dark:bg-[#ff5200]/20 text-[#ff5200]"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <LayoutGrid size={15} />
                    <span>Grid View</span>
                    {viewMode === "grid" && (
                      <Check size={14} className="ml-auto text-[#ff5200]" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("list");
                      localStorage.setItem("emenu_view_mode", "list");
                      setShowViewDropdown(false);
                    }}
                    className={`flex w-full items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition ${
                      viewMode === "list"
                        ? "bg-[#fff4ed] dark:bg-[#ff5200]/20 text-[#ff5200]"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <List size={15} />
                    <span>List View</span>
                    {viewMode === "list" && (
                      <Check size={14} className="ml-auto text-[#ff5200]" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Food Type Filter Bar (if open) */}
          {showFilters && (
            <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#1f1f28] p-2.5 shadow-2xs space-y-1.5 animate-in fade-in duration-150">
              <p className="text-[11.5px] font-medium text-slate-700 dark:text-zinc-200">Food Type</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {[
                  ["ALL", "All"],
                  ["VEG", "Veg"],
                  ["NON_VEG", "Non-Veg"],
                  ["EGG", "Egg"],
                ].map(([val, label]) => {
                  const active = dietaryFilter === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDietaryFilter(val as any)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition cursor-pointer active:scale-95 ${
                        active
                          ? "border-[#ff5200] bg-[#fff4ed] dark:bg-[#ff5200]/20 text-[#ff5200]"
                          : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#2a2a35] text-[#475467] dark:text-zinc-300 hover:border-slate-300"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category Carousel Tiles (shown when not searching) */}
          {searchQuery.trim() === "" && (
            <div className="flex gap-1.5 w-full pb-0.5 overflow-x-auto no-scrollbar">
              {carouselCategories.map((category) => {
                const isActive = activeCategory === category.name;
                return (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category.name);
                      if (category.name === "All") {
                        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                      } else {
                        const el = document.getElementById(
                          `cat-${category.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
                        );
                        if (el && scrollContainerRef.current) {
                          const targetY = el.offsetTop - 8;
                          scrollContainerRef.current.scrollTo({ top: targetY, behavior: "smooth" });
                        }
                      }
                    }}
                    className={`flex flex-col items-center justify-center min-w-[62px] h-[64px] sm:h-[68px] px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                      isActive
                        ? "bg-[#ff5a1f] text-white border-[#ff5a1f] shadow-xs"
                        : "bg-white dark:bg-[#1f1f28] text-slate-700 dark:text-zinc-300 border-slate-100 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="h-[30px] w-[30px] sm:h-[32px] sm:w-[32px] shrink-0 flex items-center justify-center">
                      {category.image ? (
                        <div className={`h-full w-full rounded-lg overflow-hidden border transition-all ${isActive ? "border-white/50" : "border-slate-200/70 dark:border-zinc-700/60"}`}>
                          <img
                            src={category.image || defaultImage}
                            alt={category.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = defaultImage;
                            }}
                          />
                        </div>
                      ) : (
                        <ShipWheelSVG
                          className={`w-5.5 h-5.5 sm:w-6 sm:h-6 shrink-0 ${isActive ? "text-white" : "text-[#ff5a1f]"}`}
                        />
                      )}
                    </div>
                    <span
                      className={`text-[10px] sm:text-[10.5px] font-medium text-center tracking-tight whitespace-nowrap leading-tight pt-0.5 px-0.5 ${
                        isActive ? "text-white" : "text-[#111827] dark:text-zinc-200"
                      }`}
                    >
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= SCROLLABLE DISHES LIST ================= */}
      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 pt-2.5 pb-24 space-y-3 no-scrollbar"
      >
        {/* ================= SEARCH RESULTS VIEW OR REGULAR CATEGORY VIEW ================= */}
        {searchQuery.trim() !== "" ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-[15px] font-semibold text-[#101828] dark:text-white">
                  Search Results
                </h2>
                <p className="text-[11px] text-[#667085] dark:text-zinc-400">
                  {searchResults.length} items found
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="text-[12px] font-medium text-[#ff5200] hover:text-[#e04800] active:scale-95 transition cursor-pointer"
              >
                Clear
              </button>
            </div>

            {searchResults.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {searchResults.map((food) => (
                    <FoodCard
                      key={food.id}
                      item={food}
                      quantity={getQuantityInCart(food.id)}
                      onAdd={() => addToCart(food)}
                      onRemove={() => removeFromCart(food)}
                      isFavorite={!!favorites[food.id]}
                      onToggleFavorite={() => toggleFavorite(food.id)}
                      onClickCard={() =>
                        navigate(`/product/${food.id}`, { state: { item: food } })
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((food) => (
                    <FoodListItem
                      key={food.id}
                      item={food}
                      quantity={getQuantityInCart(food.id)}
                      onAdd={() => addToCart(food)}
                      onRemove={() => removeFromCart(food)}
                      onClickCard={() =>
                        navigate(`/product/${food.id}`, { state: { item: food } })
                      }
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4ed] text-[#ff5200]">
                  <Search size={24} />
                </div>
                <h3 className="mt-3 text-[14px] font-bold text-[#101828]">
                  No items found
                </h3>
                <p className="mt-0.5 text-[11.5px] text-[#667085]">
                  Try searching for another dish
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Category Sections & Dish Cards */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ff5200]"></div>
                <p className="text-slate-400 mt-3 text-xs font-normal">
                  Loading menu items...
                </p>
              </div>
            ) : visibleSections.length > 0 ? (
              visibleSections.map((sec) => (
                <section
                  key={sec.title}
                  id={`cat-${sec.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                  className="space-y-2 pt-0.5"
                >
                  {/* Category Section Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                      {sec.title}
                    </h2>
                    <button
                      onClick={() => setActiveCategory(sec.title)}
                      className="flex items-center gap-0.5 text-[12.5px] font-medium text-slate-500 dark:text-zinc-400 hover:text-[#ff5200] cursor-pointer"
                    >
                      View All <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Dishes: Grid or List view according to viewMode */}
                  {viewMode === "grid" ? (
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
                          onClickCard={() => navigate(`/product/${item.id}`, { state: { item } })}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sec.items.map((item) => (
                        <FoodListItem
                          key={item.id}
                          item={item}
                          quantity={getQuantityInCart(item.id)}
                          onAdd={() => addToCart(item)}
                          onRemove={() => removeFromCart(item)}
                          onClickCard={() => navigate(`/product/${item.id}`, { state: { item } })}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs font-medium">
                No menu items found matching your filters.
              </div>
            )}
          </>
        )}
      </main>

      {/* Common Mobile Bottom Navigation */}
      <MobileFooter
        onMenuClick={() => {
          setActiveCategory("All");
          scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}
