import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  PlusCircle,
  ShoppingCart,
  Table2,
  Package,
  Settings,
  Search,
  Filter,
  Plus,
  ChevronRight,
  LogOut,
  BellRing,
  Check,
  LayoutGrid,
  LayoutList,
  Sun,
  Moon,
  ShoppingBag,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useTheme } from "../context/ThemeContext";
import MobileMenuPage from "../mobileview/MobileMenuPage";

const ShipWheelSVG = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className={className}
  >
    <circle cx="12" cy="12" r="5" strokeWidth="2" />
    <circle cx="12" cy="12" r="9" strokeWidth="2" />
    <line x1="12" y1="3" x2="12" y2="7" strokeWidth="2" />
    <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" />
    <line x1="3" y1="12" x2="7" y2="12" strokeWidth="2" />
    <line x1="17" y1="12" x2="21" y2="12" strokeWidth="2" />
    <line x1="5.6" y1="5.6" x2="8.5" y2="8.5" strokeWidth="2" />
    <line x1="15.5" y1="15.5" x2="18.4" y2="18.4" strokeWidth="2" />
    <line x1="5.6" y1="18.4" x2="8.5" y2="15.5" strokeWidth="2" />
    <line x1="15.5" y1="8.5" x2="18.4" y2="5.6" strokeWidth="2" />
  </svg>
);

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
  return "";
};

const getDietaryType = (item: any): "veg" | "nonveg" | "egg" => {
  const nameLower = (item.item_name || item.name || "").toLowerCase();
  const info = (item.dietary_info || item.type || "").toLowerCase();

  if (nameLower.includes("egg") || info.includes("egg")) {
    return "egg";
  }
  if (
    nameLower.includes("non veg") ||
    nameLower.includes("non-veg") ||
    nameLower.includes("chicken") ||
    nameLower.includes("mutton") ||
    nameLower.includes("fish") ||
    nameLower.includes("prawn") ||
    info === "non-veg" ||
    info === "nonveg" ||
    info === "non veg"
  ) {
    return "nonveg";
  }
  return "veg";
};

const getItemImageFallback = (item: any, _categoryName: string = ""): string => {
  if (item.image_url && typeof item.image_url === "string" && item.image_url.startsWith("http"))
    return item.image_url;
  if (item.image && typeof item.image === "string" && item.image.startsWith("http"))
    return item.image;
  return "";
};

function FoodTypeIcon({ type, className = "" }: { type: string; className?: string }) {
  const normType = (type || "").toLowerCase().replace(/[^a-z]/g, "");
  const isVeg = normType === "veg";
  const isEgg = normType === "egg";
  const borderColor = isVeg ? "border-[#00B074]" : isEgg ? "border-[#FF9800]" : "border-[#E53935]";
  const dotColor = isVeg ? "bg-[#00B074]" : isEgg ? "bg-[#FF9800]" : "bg-[#E53935]";

  return (
    <div
      className={`flex h-4 w-4 items-center justify-center rounded-[3px] border-[1.5px] bg-white dark:bg-[#1f1f28] shadow-xs shrink-0 ${borderColor} ${className}`}
      title={isVeg ? "Veg" : isEgg ? "Egg" : "Non-Veg"}
    >
      <div className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
    </div>
  );
}

function MenuCard({
  item,
  onAdd,
  onRemove,
  quantity = 0,
  isFavorite: _isFavorite = false,
  onToggleFavorite: _onToggleFavorite,
  onClickCard,
}: {
  item: any;
  onAdd: (item: any) => void;
  onRemove?: (item: any) => void;
  quantity?: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onClickCard?: () => void;
}) {
  const { defaultImage } = useTheme();

  return (
    <div
      onClick={onClickCard}
      className="group overflow-hidden rounded-[14px] border border-[#eee2d8] dark:border-zinc-800 bg-white dark:bg-[#1f1f28] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between cursor-pointer"
    >
      {/* Image with Category Badge & Food Type Icon */}
      <div className="relative h-[135px] sm:h-[140px] overflow-hidden bg-slate-100 dark:bg-zinc-800">
        <img
          src={item.image || defaultImage}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />

        {/* Category Badge on Image */}
        {item.category && (
          <span className="absolute left-2.5 top-2.5 z-10 inline-flex items-center rounded-md bg-white/95 dark:bg-[#1f1f28]/95 px-2 py-0.5 text-[10px] font-medium text-[#ff5722] shadow-xs border border-orange-100/80 dark:border-zinc-700/80 backdrop-blur-xs select-none">
            {item.category}
          </span>
        )}

        {/* Food Type Icon on Image */}
        <div className="absolute right-2.5 top-2.5 z-10">
          <FoodTypeIcon type={item.type} />
        </div>
      </div>

      {/* Content - Compact without extra unused space */}
      <div className="p-3">
        <h3
          className="truncate text-[13.5px] sm:text-[14px] font-medium text-[#101d35] dark:text-white leading-tight"
          title={item.name}
        >
          {item.name}
        </h3>

        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[14px] sm:text-[14.5px] font-semibold text-[#101d35] dark:text-white">
            ₹{typeof item.price === "number" ? item.price.toFixed(2) : parseFloat(item.price || 0).toFixed(2)}
          </span>

          <div onClick={(e) => e.stopPropagation()}>
            {quantity > 0 ? (
              <div className="flex h-7 items-center rounded-lg border border-[#ff5722] bg-white dark:bg-[#2a2a35] overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => onRemove?.(item)}
                  className="flex h-full w-6 items-center justify-center text-[#ff5722] hover:bg-[#fff0e8] dark:hover:bg-zinc-700 transition cursor-pointer font-semibold text-xs"
                  aria-label="decrease"
                >
                  -
                </button>
                <span className="flex h-full min-w-[20px] items-center justify-center text-xs font-semibold text-[#ff5722] px-1 bg-[#fffbf9] dark:bg-[#1f1f28]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  className="flex h-full w-6 items-center justify-center text-[#ff5722] hover:bg-[#fff0e8] dark:hover:bg-zinc-700 transition cursor-pointer font-semibold text-xs"
                  aria-label="increase"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAdd(item)}
                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-[#ff5722] text-white transition hover:bg-[#ef4817] cursor-pointer shadow-xs active:scale-95"
                aria-label="add"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
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
  onClickCard,
}: {
  item: any;
  quantity?: number;
  onAdd: (item: any) => void;
  onRemove?: (item: any) => void;
  onClickCard?: () => void;
}) {
  const { defaultImage } = useTheme();

  return (
    <div
      onClick={onClickCard}
      className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] shadow-xs hover:shadow-md transition cursor-pointer active:scale-[0.99]"
    >
      {/* Food Thumbnail with FSSAI Badge */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800">
        <img
          src={item.image || defaultImage}
          alt={item.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
        <div className="absolute right-2 top-2 z-10">
          <FoodTypeIcon type={item.type} />
        </div>
      </div>

      {/* Item info */}
      <div className="min-w-0 flex-1 pr-2">
        <div className="flex items-center gap-2">
          {item.category && (
            <span className="inline-flex rounded-md bg-[#fff0e8] dark:bg-[#ff5200]/20 px-2 py-0.5 text-[10.5px] font-medium text-[#ff5722]">
              {item.category}
            </span>
          )}
        </div>
        <h3
          className="text-[14.5px] font-medium text-slate-800 dark:text-white leading-tight truncate mt-1"
          title={item.name}
        >
          {item.name}
        </h3>
        <p className="mt-1 text-[14px] font-semibold text-slate-900 dark:text-white">
          ₹{typeof item.price === "number" ? item.price.toFixed(2) : parseFloat(item.price || 0).toFixed(2)}
        </p>
      </div>

      {/* Actions */}
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        {quantity > 0 ? (
          <div className="flex h-8 items-center rounded-lg border border-[#ff5722] bg-white dark:bg-[#2a2a35] shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => onRemove?.(item)}
              className="flex h-full w-7 items-center justify-center text-[#ff5722] hover:bg-[#fff0e8] dark:hover:bg-zinc-700 transition cursor-pointer font-semibold text-xs"
              aria-label="decrease"
            >
              -
            </button>
            <span className="flex h-full min-w-[22px] items-center justify-center text-xs font-semibold text-[#ff5722] border-x border-[#ff5722]/20 bg-[#fffbf9] dark:bg-[#1f1f28] px-1 select-none">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onAdd(item)}
              className="flex h-full w-7 items-center justify-center text-[#ff5722] hover:bg-[#fff0e8] dark:hover:bg-zinc-700 transition cursor-pointer font-semibold text-xs"
              aria-label="increase"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(item)}
            className="flex h-8 px-3.5 items-center justify-center gap-1 rounded-lg bg-[#ff5200] hover:bg-[#e04800] text-white text-xs font-medium shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Add to cart"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Add</span>
          </button>
        )}
      </div>
    </div>
  );
}

const DesktopMenuPage: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { isDark, toggleTheme, defaultImage } = useTheme();

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<"ALL" | "VEG" | "NON_VEG" | "EGG">("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [waiterAlertMsg, setWaiterAlertMsg] = useState<string | null>(null);

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

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    };
    if (showFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showFilterDropdown]);

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

  const userObj = (() => {
    try {
      const saved = localStorage.getItem("emenu_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const roleAlias = (userObj?.role_alias || userObj?.role || "").toLowerCase();
  const isGuestUser =
    !userObj || userObj?.isGuest || roleAlias === "guest_user" || roleAlias === "guest";
  const isStaffUser = !!userObj && !isGuestUser;
  const isWaiter = isStaffUser && roleAlias === "waiter";
  const isAdmin =
    isStaffUser &&
    (roleAlias === "admin" || roleAlias === "super_admin" || roleAlias === "owner");

  const isEnableTables = (() => {
    try {
      const cachedSettingsStr = localStorage.getItem("emenu_pos_settings");
      if (cachedSettingsStr) {
        const s = JSON.parse(cachedSettingsStr);
        const val =
          s?.hardware_and_preferences?.is_enable_tables ??
          s?.is_enable_tables ??
          s?.isEnableTables;
        if (val === false || val === "false" || val === 0 || val === "0") return false;
      }
    } catch {}
    return true;
  })();

  const restaurantName = userObj?.restaurant_name || "Big Ben Restaurant";
  const userName = isGuestUser
    ? "Guest User"
    : userObj?.name || userObj?.username || userObj?.phone || "Staff";
  const userInitials = isGuestUser
    ? "GU"
    : userName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "ST";
  const userRole = isGuestUser
    ? "Guest"
    : userObj?.role_name || (isAdmin ? "Admin" : isWaiter ? "Waiter" : "Staff");

  // Load menu from backend
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
          } catch {
            // ignore
          }
        }

        const currentTable = sessionStorage.getItem("emenu_table") || "";
        const [menuRes, ordersRes] = await Promise.all([
          cachedCategories.length > 0 ? null : fetch(`${API_BASE_URL}/menus/${restaurantId}`),
          currentTable ? fetch(`${API_BASE_URL}/orders/${restaurantId}`).catch(() => null) : null,
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
            : ordersData && Array.isArray(ordersData.data)
            ? ordersData.data
            : [];

          const cleanTableName = String(currentTable).replace(/[^0-9]/g, "");
          const activeOrder = rawOrders.find((o: any) => {
            const cleanOrderTable = String(o.table_name || "").replace(/[^0-9]/g, "");
            const isUnpaid = o.bill?.payment_status?.toUpperCase() !== "PAID";
            const isPending = o.order_status?.toUpperCase() === "PENDING";
            return (
              cleanOrderTable !== "" &&
              cleanOrderTable === cleanTableName &&
              isUnpaid &&
              isPending
            );
          });

          if (activeOrder && activeOrder.items?.length > 0) {
            const activeCart: Record<string, any> = {};
            activeOrder.items.forEach((item: any) => {
              activeCart[item.menu_item_id] = {
                id: String(item.menu_item_id),
                name: item.name,
                price: parseFloat(item.unit_price || item.price || "0"),
                quantity: parseInt(item.quantity) || 1,
                isVeg: item.notes?.includes("Veg") || true,
                image: item.image || item.image_url || "",
                isExisting: true,
              };
            });

            const saved = localStorage.getItem("emenu_cart");
            const localCart = saved ? JSON.parse(saved) : {};
            const mergedCart = { ...activeCart, ...localCart };
            setCart(mergedCart);
            localStorage.setItem("emenu_cart", JSON.stringify(mergedCart));
          }
        }
      } catch (err) {
        console.error("Error loading desktop menu:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMenuAndSession();
  }, []);

  // Listen for cart synchronization
  useEffect(() => {
    const handleCartSync = () => {
      const saved = localStorage.getItem("emenu_cart");
      if (saved) {
        try {
          setCart(JSON.parse(saved));
        } catch {
          // ignore
        }
      } else {
        setCart({});
      }
    };
    window.addEventListener("emenu_cart_updated", handleCartSync);
    return () => window.removeEventListener("emenu_cart_updated", handleCartSync);
  }, []);

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
      const rawImg = item.image || item.image_url || "";
      const cleanedImg = rawImg.includes("default_image.png") ? "" : rawImg;
      newCart[itemId] = {
        id: itemId,
        name: item.name || item.item_name,
        price: typeof item.price === "number" ? item.price : parseFloat(item.price || "0"),
        quantity: 1,
        isVeg: item.type === "veg",
        image: cleanedImg,
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

  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cart]);

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      localStorage.setItem("emenu_favorites", JSON.stringify(next));
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("emenu_user");
    localStorage.removeItem("emenu_cart");
    localStorage.removeItem("emenu_last_order");
    localStorage.removeItem("emenu_token");
    sessionStorage.clear();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = "/login";
    }
  };

  const currentTable = sessionStorage.getItem("emenu_table") || "1";

  const handleRequestAssistance = (type: string) => {
    setWaiterAlertMsg(`Request "${type}" sent to waiter for Table #${currentTable}!`);
    setTimeout(() => {
      setWaiterAlertMsg(null);
      setIsCallWaiterOpen(false);
    }, 2000);
  };

  // Flatten items for category views
  const allItems = useMemo(() => {
    return categories.flatMap((cat) =>
      (cat.items || []).map((it: any) => ({
        id: String(it.item_id || it.id),
        name: it.item_name || it.name,
        price: parseFloat(it.price || "0"),
        type: getDietaryType(it),
        category: cat.category_name,
        image: getItemImageFallback(it, cat.category_name),
        raw: it,
      }))
    );
  }, [categories]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const categoryMatch =
        activeCategory === "All" || item.category === activeCategory;

      const searchMatch = item.name.toLowerCase().includes(search.toLowerCase());

      const dietaryMatch =
        dietaryFilter === "ALL" ||
        (dietaryFilter === "VEG" && item.type === "veg") ||
        (dietaryFilter === "NON_VEG" && item.type === "nonveg") ||
        (dietaryFilter === "EGG" && item.type === "egg");

      return categoryMatch && searchMatch && dietaryMatch;
    });
  }, [allItems, activeCategory, search, dietaryFilter]);

  // Category tiles matching mobile design
  const categoryTabs = useMemo(() => {
    const list: Array<{ name: string; image?: string }> = [{ name: "All" }];
    categories.forEach((cat) => {
      if ((cat.items || []).length > 0) {
        list.push({
          name: cat.category_name,
          image: cat.image || getCategoryThumbnail(cat.category_name),
        });
      }
    });
    return list;
  }, [categories]);

  const groupedItems = useMemo(() => {
    return categoryTabs
      .filter((cat) => cat.name !== "All")
      .map((cat) => ({
        ...cat,
        items: filteredItems.filter((item) => item.category === cat.name),
      }))
      .filter((group) => group.items.length > 0);
  }, [categoryTabs, filteredItems]);

  const sidebarItems = useMemo(() => {
    if (isGuestUser) {
      return [
        { label: "Menu", icon: UtensilsCrossed, path: "/menu" },
        { label: "Cart", icon: ShoppingCart, path: "/cart" },
      ];
    }

    if (isWaiter) {
      return [
        { label: "Menu", icon: UtensilsCrossed, path: "/menu" },
        { label: "Cart", icon: ShoppingCart, path: "/cart" },
        ...(isEnableTables
          ? [{ label: "Tables", icon: Table2, path: "/tables" }]
          : []),
        { label: "History", icon: Clock, path: "/history" },
      ];
    }

    // Admin / Super Admin / Owner
    return [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { label: "Menu", icon: UtensilsCrossed, path: "/menu" },
      { label: "Add Menu", icon: PlusCircle, path: "/manage-menu" },
      { label: "Cart", icon: ShoppingCart, path: "/cart" },
      ...(isEnableTables
        ? [{ label: "Tables", icon: Table2, path: "/tables" }]
        : []),
      { label: "History", icon: Clock, path: "/history" },
      { label: "Inventory", icon: Package, path: "/stock" },
      { label: "Settings", icon: Settings, path: "/settings" },
    ];
  }, [isGuestUser, isWaiter, isEnableTables]);

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#16161d] text-[#101d35] dark:text-white transition-colors">
      <div className="flex min-h-screen">
        {/* ================= SIDEBAR ================= */}
        <aside className="fixed left-0 top-0 z-30 flex h-screen w-[200px] flex-col border-r border-[#eee5df] dark:border-zinc-800 bg-white dark:bg-[#1f1f28] transition-colors">
          {/* Logo */}
          <div className="flex h-[72px] items-center px-5 border-b border-[#f0ebe7] dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="text-[24px]">👨‍🍳</span>
              <div className="leading-tight">
                <div className="text-[17px] font-bold tracking-[-0.5px]">
                  Tisch<span className="text-[#ff5722]">ly</span>
                </div>
                <p className="text-[11px] font-normal text-[#718096] dark:text-zinc-400 truncate max-w-[125px]">
                  {restaurantName}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = item.label === "Menu";

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (item.path) {
                      navigate(item.path);
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium transition cursor-pointer ${
                    active
                      ? "bg-[#fff0e8] dark:bg-[#ff5200]/20 text-[#ff5722] font-semibold"
                      : "text-[#3f4c61] dark:text-zinc-400 hover:bg-[#f8f8f8] dark:hover:bg-zinc-800/60 hover:text-[#101d35] dark:hover:text-white"
                  }`}
                >
                  <Icon size={18} className="shrink-0" strokeWidth={active ? 2 : 1.8} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout - only for staff who actually logged in */}
          {isStaffUser && (
            <div className="border-t border-[#eee5df] dark:border-zinc-800 p-3.5">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ffb7a1] dark:border-zinc-700 px-3.5 py-2.5 text-[12px] font-medium text-[#ff5722] hover:bg-[#fff0e8] dark:hover:bg-zinc-800 transition cursor-pointer active:scale-98"
              >
                <LogOut size={16} className="shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </aside>

        {/* ================= MAIN ================= */}
        <main className="ml-[200px] min-h-screen flex-1 flex flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#eee5df] dark:border-zinc-800 bg-white/95 dark:bg-[#1f1f28]/95 px-7 backdrop-blur transition-colors">
            {/* Search and Filters */}
            <div className="flex items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative w-[320px] xl:w-[360px]">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7a8799] dark:text-zinc-400"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for dishes, drinks, SKUs..."
                  className="h-10 w-full rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-[#fafafa] dark:bg-[#2a2a35] pl-10 pr-3.5 text-[12px] text-[#172238] dark:text-white outline-none transition focus:border-[#ff8a66] focus:ring-2 focus:ring-[#ff5722]/10"
                />
              </div>

              {/* Dietary Filter Button (outside search bar) */}
              <div className="relative shrink-0" ref={filterDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-xs cursor-pointer transition active:scale-95 ${
                    dietaryFilter !== "ALL" || showFilterDropdown
                      ? "border-[#ff5200] bg-[#fff4ed] dark:bg-[#ff5200]/20 text-[#ff5200]"
                      : "border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700"
                  }`}
                  title="Filter by dietary preference"
                  aria-label="Filter"
                >
                  <Filter
                    size={17}
                    className={
                      dietaryFilter !== "ALL" || showFilterDropdown
                        ? "text-[#ff5200]"
                        : "text-slate-600 dark:text-zinc-300"
                    }
                  />
                </button>

                {/* Dietary Filter Dropdown */}
                {showFilterDropdown && (
                  <div className="absolute left-0 top-12 z-30 min-w-[170px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] p-2 shadow-xl animate-in fade-in zoom-in-95">
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                      Dietary Preference
                    </p>
                    {(["ALL", "VEG", "NON_VEG", "EGG"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => {
                          setDietaryFilter(filter);
                          setShowFilterDropdown(false);
                        }}
                        className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                          dietaryFilter === filter
                            ? "bg-[#fff0e8] dark:bg-[#ff5200]/20 text-[#ff5722]"
                            : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <span>
                          {filter === "ALL"
                            ? "All Items"
                            : filter === "VEG"
                            ? "Veg Only"
                            : filter === "NON_VEG"
                            ? "Non-Veg"
                            : "Egg"}
                        </span>
                        {dietaryFilter === filter && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Mode Selector Button (Icon only) */}
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
                    <LayoutList size={18} className="text-[#ff5200]" />
                  )}
                </button>

                {/* View Dropdown Menu */}
                {showViewDropdown && (
                  <div className="absolute left-0 top-12 z-40 min-w-[136px] rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
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
                      <LayoutList size={15} />
                      <span>List View</span>
                      {viewMode === "list" && (
                        <Check size={14} className="ml-auto text-[#ff5200]" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Header Area: Dark Mode, Call Waiter & Profile */}
            <div className="flex items-center gap-3.5">
              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700 transition cursor-pointer active:scale-95"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <Sun size={18} className="text-amber-400" />
                ) : (
                  <Moon size={18} className="text-slate-600 dark:text-zinc-300" />
                )}
              </button>

              {/* Call Waiter / Notification Bell */}
              <button
                type="button"
                onClick={() => setIsCallWaiterOpen(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] text-[#19253a] dark:text-zinc-300 hover:text-[#ff5722] hover:border-slate-300 transition cursor-pointer"
                title="Call Waiter / Assistance"
              >
                <span className="absolute 2.5 top-2.5 h-2 w-2 rounded-full bg-[#ff5722]" />
                <BellRing size={18} />
              </button>

              {/* User Profile - only for logged in staff */}
              {isStaffUser ? (
                <div className="flex items-center gap-2 select-none pl-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f3f5] dark:bg-zinc-800 text-[12px] font-semibold text-[#101d35] dark:text-white">
                    {userInitials}
                  </div>

                  <div className="leading-tight">
                    <p className="text-[12px] font-medium text-[#101d35] dark:text-white">{userName}</p>
                    <span className="text-[8px] font-semibold uppercase text-[#ff5722]">
                      {userRole}
                    </span>
                  </div>
                </div>
              ) : currentTable ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e8f8f0] dark:bg-emerald-500/15 border border-[#2ecc71]/25 text-[#2ecc71] text-xs font-bold">
                  <span>Table #{currentTable}</span>
                </div>
              ) : null}
            </div>
          </header>

          {/* Page Body */}
          <section className="px-7 py-6 flex-1">
            {/* Page title */}
            <div className="mb-5">
              <h1 className="text-[23px] font-bold tracking-tight text-[#101d35] dark:text-white">
                Menu
              </h1>

              <p className="mt-0.5 text-[12.5px] font-normal text-[#6d7b91] dark:text-zinc-400">
                Manage dishes, categories, prices and availability
              </p>
            </div>

            {/* Category tabs matching mobile design */}
            <div className="mb-7 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categoryTabs.map((category) => {
                const active = activeCategory === category.name;

                return (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => setActiveCategory(category.name)}
                    className={`flex flex-col items-center justify-center min-w-[64px] sm:min-w-[68px] h-[64px] sm:h-[68px] px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                      active
                        ? "bg-[#ff5a1f] text-white border-[#ff5a1f] shadow-xs"
                        : "bg-white dark:bg-[#1f1f28] text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="h-[30px] w-[30px] sm:h-[32px] sm:w-[32px] shrink-0 flex items-center justify-center">
                      {category.image ? (
                        <div
                          className={`h-full w-full rounded-lg overflow-hidden border transition-all ${
                            active
                              ? "border-white/50"
                              : "border-slate-200/70 dark:border-zinc-700/60"
                          }`}
                        >
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
                          className={`w-5.5 h-5.5 sm:w-6 sm:h-6 shrink-0 ${
                            active ? "text-white" : "text-[#ff5a1f]"
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`text-[10px] sm:text-[10.5px] font-medium text-center tracking-tight whitespace-nowrap leading-tight pt-0.5 px-0.5 ${
                        active ? "text-white" : "text-[#111827] dark:text-zinc-200"
                      }`}
                    >
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ff5722]"></div>
                <p className="text-slate-400 mt-3 text-xs font-medium">
                  Loading menu items...
                </p>
              </div>
            ) : activeCategory === "All" ? (
              /* ================= GROUPED MENU ================= */
              groupedItems.length > 0 ? (
                groupedItems.map((group) => (
                  <div key={group.name} className="mb-8">
                    <div className="mb-3.5 flex items-center justify-between">
                      <h2 className="text-[17px] font-semibold text-[#101d35] dark:text-white tracking-tight">
                        {group.name}
                      </h2>

                      <button
                        type="button"
                        onClick={() => setActiveCategory(group.name)}
                        className="flex items-center gap-1 text-[11.5px] font-medium text-slate-500 dark:text-zinc-400 hover:text-[#ff5722] transition cursor-pointer"
                      >
                        View All
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    {viewMode === "grid" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                        {group.items.map((item) => (
                          <MenuCard
                            key={item.id}
                            item={item}
                            quantity={getQuantityInCart(item.id)}
                            onAdd={addToCart}
                            onRemove={removeFromCart}
                            isFavorite={!!favorites[item.id]}
                            onToggleFavorite={() => toggleFavorite(item.id)}
                            onClickCard={() => navigate(`/product/${item.id}`, { state: { item: item.raw } })}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {group.items.map((item) => (
                          <FoodListItem
                            key={item.id}
                            item={item}
                            quantity={getQuantityInCart(item.id)}
                            onAdd={addToCart}
                            onRemove={removeFromCart}
                            onClickCard={() => navigate(`/product/${item.id}`, { state: { item: item.raw } })}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-[#ddd3cc] dark:border-zinc-800 bg-white dark:bg-[#1f1f28]">
                  <div className="text-center">
                    <Search size={30} className="mx-auto mb-2.5 text-[#b7b0aa]" />
                    <h3 className="font-medium text-[#101d35] dark:text-white">No menu items found</h3>
                    <p className="mt-1 text-xs text-[#7b8798] dark:text-zinc-400">
                      Try another search or category.
                    </p>
                  </div>
                </div>
              )
            ) : (
              /* Single Category View */
              <div>
                <div className="mb-3.5 flex items-center justify-between">
                  <h2 className="text-[17px] font-semibold text-[#101d35] dark:text-white tracking-tight">
                    {activeCategory}
                  </h2>

                  <span className="text-[11.5px] font-medium text-slate-400">
                    {filteredItems.length} items
                  </span>
                </div>

                {filteredItems.length > 0 ? (
                  viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                      {filteredItems.map((item) => (
                        <MenuCard
                          key={item.id}
                          item={item}
                          quantity={getQuantityInCart(item.id)}
                          onAdd={addToCart}
                          onRemove={removeFromCart}
                          isFavorite={!!favorites[item.id]}
                          onToggleFavorite={() => toggleFavorite(item.id)}
                          onClickCard={() => navigate(`/product/${item.id}`, { state: { item: item.raw } })}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      {filteredItems.map((item) => (
                        <FoodListItem
                          key={item.id}
                          item={item}
                          quantity={getQuantityInCart(item.id)}
                          onAdd={addToCart}
                          onRemove={removeFromCart}
                          onClickCard={() => navigate(`/product/${item.id}`, { state: { item: item.raw } })}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-[#ddd3cc] dark:border-zinc-800 bg-white dark:bg-[#1f1f28]">
                    <div className="text-center">
                      <Search size={30} className="mx-auto mb-2.5 text-[#b7b0aa]" />
                      <h3 className="font-medium text-[#101d35] dark:text-white">No menu items found</h3>
                      <p className="mt-1 text-xs text-[#7b8798] dark:text-zinc-400">
                        Try another search or category.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Floating Cart Indicator */}
      {totalCartCount > 0 && (
        <div
          onClick={() => navigate("/cart")}
          className="fixed bottom-6 right-7 flex items-center gap-2 rounded-full bg-[#ff5722] px-4 py-2.5 text-sm font-medium text-white shadow-xl cursor-pointer hover:bg-[#ef4817] active:scale-95 transition z-30 select-none"
        >
          <ShoppingBag size={17} />
          <span>Cart</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#ff5722] text-[11px] font-semibold">
            {totalCartCount}
          </span>
        </div>
      )}

      {/* Assistance / Call Waiter Modal */}
      {isCallWaiterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
          onClick={() => setIsCallWaiterOpen(false)}
        >
          <div
            className="w-full max-w-[360px] rounded-2xl bg-white dark:bg-[#1f1f28] p-5 text-center shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b dark:border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BellRing size={18} className="text-amber-500" /> Assistance for Table #{currentTable}
              </h3>
              <button
                type="button"
                onClick={() => setIsCallWaiterOpen(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-zinc-400 text-left font-medium">
              Select what you need and a server will arrive shortly:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-700 dark:text-zinc-300">
              <button
                type="button"
                onClick={() => handleRequestAssistance("Call Waiter")}
                className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-200 flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="text-xl">🔔</span> Call Waiter
              </button>

              <button
                type="button"
                onClick={() => handleRequestAssistance("Water Bottle")}
                className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl border border-blue-200 flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="text-xl">💧</span> Extra Water
              </button>

              <button
                type="button"
                onClick={() => handleRequestAssistance("Cutlery & Plates")}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="text-xl">🍽️</span> Cutlery & Plates
              </button>

              <button
                type="button"
                onClick={() => handleRequestAssistance("Bill Request")}
                className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl border border-purple-200 flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="text-xl">🧾</span> Request Bill
              </button>
            </div>

            {waiterAlertMsg && (
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-medium animate-in fade-in">
                {waiterAlertMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function MenuPage({ onLogout }: { onLogout?: () => void }) {
  return (
    <>
      <div className="block md:hidden">
        <MobileMenuPage onLogout={onLogout} />
      </div>

      <div className="hidden md:block">
        <DesktopMenuPage onLogout={onLogout} />
      </div>
    </>
  );
}
