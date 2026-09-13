import React, { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  X,
  Plus,
  Minus,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MobileFooter } from "../components/mobile";

interface FoodItem {
  id: string | number;
  name: string;
  category: string;
  price: number;
  type: "veg" | "nonveg" | "egg";
  image: string;
  description?: string;
}

const initialFoods: FoodItem[] = [
  {
    id: 1,
    name: "Paneer Tikka",
    category: "Starters",
    price: 399,
    type: "veg",
    image:
      "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=300&q=90",
  },
  {
    id: 2,
    name: "Paneer Butter Masala",
    category: "Main Course",
    price: 349,
    type: "veg",
    image:
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=300&q=90",
  },
  {
    id: 3,
    name: "Paneer Lababdar",
    category: "Main Course",
    price: 349,
    type: "veg",
    image:
      "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=300&q=90",
  },
  {
    id: 4,
    name: "Paneer Sandwich",
    category: "Snacks",
    price: 250,
    type: "veg",
    image:
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=300&q=90",
  },
  {
    id: 5,
    name: "Veg Biryani",
    category: "Biryani",
    price: 299,
    type: "veg",
    image:
      "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=300&q=90",
  },
  {
    id: 6,
    name: "Non Veg Biryani",
    category: "Biryani",
    price: 499,
    type: "nonveg",
    image:
      "https://images.unsplash.com/photo-1563379091339-03246963d51a?auto=format&fit=crop&w=300&q=90",
  },
  {
    id: 7,
    name: "Egg Biryani - Full",
    category: "Biryani",
    price: 299,
    type: "egg",
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=300&q=90",
  },
];

const defaultRecentSearches = ["Paneer", "Biryani", "Chicken Tikka"];

function FoodTypeIcon({ type }: { type: "veg" | "nonveg" | "egg" }) {
  const styles = {
    veg: "border-[#16a34a] bg-[#16a34a]",
    nonveg: "border-[#ef233c] bg-[#ef233c]",
    egg: "border-[#f59e0b] bg-[#f59e0b]",
  };

  return (
    <span
      className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border-[2px] bg-white shadow-2xs ${styles[type]}`}
    >
      <span className="h-[6px] w-[6px] rounded-full bg-white" />
    </span>
  );
}

export const MobileSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("pane");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<"all" | "veg" | "nonveg" | "egg">("all");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem("emenu_recent_searches");
      return saved ? JSON.parse(saved) : defaultRecentSearches;
    } catch {
      return defaultRecentSearches;
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

  // Listen to cart changes
  useEffect(() => {
    const handleCartSync = () => {
      try {
        const saved = localStorage.getItem("emenu_cart");
        setCart(saved ? JSON.parse(saved) : {});
      } catch {}
    };
    window.addEventListener("emenu_cart_updated", handleCartSync);
    return () => window.removeEventListener("emenu_cart_updated", handleCartSync);
  }, []);

  const addToCart = (food: FoodItem) => {
    const itemId = String(food.id);
    const newCart = { ...cart };
    if (newCart[itemId]) {
      newCart[itemId].quantity += 1;
    } else {
      newCart[itemId] = {
        id: itemId,
        name: food.name,
        price: food.price,
        quantity: 1,
        isVeg: food.type === "veg",
        image: food.image,
      };
    }
    setCart(newCart);
    localStorage.setItem("emenu_cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("emenu_cart_updated"));
  };

  const removeFromCart = (food: FoodItem) => {
    const itemId = String(food.id);
    const newCart = { ...cart };
    if (newCart[itemId]) {
      if (newCart[itemId].quantity > 1) {
        newCart[itemId].quantity -= 1;
      } else {
        delete newCart[itemId];
      }
      setCart(newCart);
      localStorage.setItem("emenu_cart", JSON.stringify(newCart));
      window.dispatchEvent(new Event("emenu_cart_updated"));
    }
  };

  const handleSelectRecentSearch = (item: string) => {
    setQuery(item);
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    try {
      sessionStorage.setItem("emenu_recent_searches", JSON.stringify([]));
    } catch {}
  };

  // Merge backend menu items with sample foods if available
  const allFoods = useMemo(() => {
    try {
      const savedUser = localStorage.getItem("emenu_user");
      const userObj = savedUser ? JSON.parse(savedUser) : null;
      const rid = userObj?.restaurant_id || 9;
      const cached = sessionStorage.getItem(`emenu_cached_menu_${rid}`);
      if (cached) {
        const categories = JSON.parse(cached);
        const apiFoods: FoodItem[] = [];
        categories.forEach((cat: any) => {
          (cat.items || []).forEach((item: any) => {
            const rawType = (item.type || item.item_type || "").toLowerCase();
            const type: "veg" | "nonveg" | "egg" = rawType.includes("non")
              ? "nonveg"
              : rawType.includes("egg")
              ? "egg"
              : "veg";
            apiFoods.push({
              id: String(item.item_id || item.id),
              name: item.item_name || item.name,
              category: cat.category_name || "Dishes",
              price: parseFloat(item.price || "0"),
              type,
              image:
                item.image_url ||
                item.image ||
                (typeof document !== "undefined" && document.documentElement.classList.contains("dark")
                  ? "/images/dark_default_image.png"
                  : "/images/default_image.png"),
              description: item.description || "",
            });
          });
        });
        if (apiFoods.length > 0) {
          // Merge unique by name
          const seen = new Set(initialFoods.map((f) => f.name.toLowerCase()));
          const extra = apiFoods.filter((f) => !seen.has(f.name.toLowerCase()));
          return [...initialFoods, ...extra];
        }
      }
    } catch {}
    return initialFoods;
  }, []);

  const filteredFoods = useMemo(() => {
    return allFoods.filter((food) => {
      const q = query.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        food.name.toLowerCase().includes(q) ||
        food.category.toLowerCase().includes(q);

      const matchesType = selectedType === "all" || food.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [allFoods, query, selectedType]);

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#16161d] flex justify-center">
      {/* MOBILE APP CONTAINER */}
      <div className="relative w-full max-w-md min-h-screen bg-[#faf9f7] dark:bg-[#16161d] overflow-hidden flex flex-col justify-between">
        <div className="flex-1">
          {/* ================= HEADER ================= */}
          <header className="sticky top-0 z-30 bg-[#faf9f7]/95 dark:bg-[#1a1a22]/95 backdrop-blur-md px-3.5 pb-2.5 pt-3 border-b border-slate-200/60 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              {/* Back */}
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-800 dark:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800 active:scale-95 transition cursor-pointer"
                aria-label="Go Back"
              >
                <ArrowLeft size={20} strokeWidth={2.2} />
              </button>

              {/* Search Bar */}
              <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] px-3 shadow-[0_1px_4px_rgba(16,24,40,0.03)] focus-within:border-[#ff5520] transition">
                <Search size={17} className="shrink-0 text-[#667085] dark:text-zinc-400" />

                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search dishes, drinks, SKUs..."
                  className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[#101828] dark:text-white outline-none placeholder:text-[#98a2b3] dark:placeholder:text-zinc-500"
                />

                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-[#98a2b3] dark:text-zinc-500 hover:text-[#667085] dark:hover:text-zinc-300 p-0.5 active:scale-90 transition cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Filter Button */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition cursor-pointer active:scale-95 ${
                  showFilters || selectedType !== "all"
                    ? "border-[#ff5520] bg-[#fff4ed] dark:bg-[#ff5a1f]/20 text-[#ff5520]"
                    : "border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] text-[#344054] dark:text-zinc-300"
                }`}
                aria-label="Toggle Filter"
              >
                <SlidersHorizontal size={17} />
              </button>
            </div>
          </header>

          {/* ================= FILTER BAR ================= */}
          {showFilters && (
            <div className="border-b border-slate-200/70 dark:border-zinc-800 bg-[#f4f2ee] dark:bg-[#1f1f28] px-4 py-2.5 animate-in fade-in duration-150">
              <p className="mb-1.5 text-[11.5px] font-bold text-[#344054] dark:text-zinc-300">
                Food Type
              </p>

              <div className="flex gap-2">
                {[
                  ["all", "All"],
                  ["veg", "Veg"],
                  ["nonveg", "Non-Veg"],
                  ["egg", "Egg"],
                ].map(([value, label]) => {
                  const active = selectedType === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedType(value as any)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition cursor-pointer active:scale-95 ${
                        active
                          ? "border-[#ff5520] bg-[#fff4ed] dark:bg-[#ff5a1f]/20 text-[#ff5520]"
                          : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#2a2a35] text-[#475467] dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= CONTENT ================= */}
          <main className="px-3.5 pb-24">
            {/* Search result heading */}
            {query ? (
              <div className="flex items-center justify-between py-3 border-b border-slate-200/60 dark:border-zinc-800 mb-1">
                <div>
                  <h1 className="text-[16px] font-extrabold text-[#101828] dark:text-white">
                    Search Results
                  </h1>
                  <p className="text-[11px] text-[#667085] dark:text-zinc-400">
                    {filteredFoods.length} items found
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-[11.5px] font-semibold text-[#ff5520] hover:text-[#e04800] cursor-pointer active:scale-95 transition"
                >
                  Clear
                </button>
              </div>
            ) : (
              /* Recent Searches */
              <section className="pt-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-extrabold text-[#101828] dark:text-white">
                    Recent Searches
                  </h2>

                  {recentSearches.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearRecentSearches}
                      className="text-[11px] font-semibold text-[#ff5520] hover:text-[#e04800] cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="mt-2 space-y-0.5">
                  {recentSearches.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSelectRecentSearch(item)}
                      className="flex w-full items-center gap-2.5 border-b border-slate-200/60 dark:border-zinc-800/80 py-2.5 text-left active:bg-slate-100/60 dark:active:bg-[#2a2a35] px-1 rounded-lg transition cursor-pointer"
                    >
                      <Search size={15} className="text-[#98a2b3] dark:text-zinc-500 shrink-0" />
                      <span className="flex-1 text-[12.5px] text-[#475467] dark:text-zinc-300 font-medium">
                        {item}
                      </span>
                      <ChevronRight size={15} className="text-[#98a2b3] dark:text-zinc-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ================= RESULT LIST ================= */}
            {query && (
              <div className="divide-y divide-slate-200/70 dark:divide-zinc-800/80">
                {filteredFoods.map((food) => {
                  const qty = cart[String(food.id)]?.quantity || 0;

                  return (
                    <div
                      key={food.id}
                      onClick={() =>
                        navigate(`/product/${food.id}`, { state: { item: food } })
                      }
                      className="flex items-center gap-3 py-2.5 cursor-pointer active:bg-slate-100/40 dark:active:bg-[#2a2a35]/60 px-1 rounded-xl transition"
                    >
                      {/* Image */}
                      <div className="relative h-[56px] w-[56px] shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800">
                        <img
                          src={food.image}
                          alt={food.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/default_image.png";
                          }}
                        />

                        {/* Food type indicator */}
                        <div className="absolute left-1 top-1 rounded-[3px] bg-white p-[1.5px] shadow-2xs">
                          <FoodTypeIcon type={food.type} />
                        </div>
                      </div>

                      {/* Information */}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[13px] font-bold text-[#101828] dark:text-zinc-200">
                          {food.name}
                        </h3>

                        <p className="text-[10.5px] text-[#667085] dark:text-zinc-400">
                          {food.category}
                        </p>

                        <p className="mt-0.5 text-[13px] font-extrabold text-[#101828] dark:text-white">
                          ₹{food.price}
                        </p>
                      </div>

                      {/* Add Button or Stepper */}
                      {qty > 0 ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex h-7 items-center rounded-lg border border-[#ff5520] bg-white dark:bg-[#2a2a35] shadow-2xs overflow-hidden shrink-0"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromCart(food);
                            }}
                            className="flex h-full w-6 items-center justify-center text-[#ff5520] hover:bg-[#fff2ea] dark:hover:bg-zinc-700 active:bg-[#ffe5d6] dark:active:bg-zinc-600 transition cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} strokeWidth={2.8} />
                          </button>
                          <span className="flex h-full min-w-[20px] items-center justify-center text-[12px] font-black text-[#ff5520] border-x border-[#ff5520]/20 bg-[#fffbf9] dark:bg-[#1f1f28] px-1 select-none">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(food);
                            }}
                            className="flex h-full w-6 items-center justify-center text-[#ff5520] hover:bg-[#fff2ea] dark:hover:bg-zinc-700 active:bg-[#ffe5d6] dark:active:bg-zinc-600 transition cursor-pointer"
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
                            addToCart(food);
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ff5520] text-white shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer hover:bg-[#e04800]"
                          aria-label="Add to cart"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Empty State */}
                {filteredFoods.length === 0 && (
                  <div className="flex flex-col items-center py-14 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4ed] dark:bg-[#ff5a1f]/20 text-[#ff5520]">
                      <Search size={24} />
                    </div>

                    <h3 className="mt-3 text-[14px] font-bold text-[#101828] dark:text-white">
                      No items found
                    </h3>

                    <p className="mt-0.5 text-[11.5px] text-[#667085] dark:text-zinc-400">
                      Try searching for another dish or check your spelling
                    </p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* ================= UNIFIED BOTTOM FOOTER ================= */}
        <MobileFooter />
      </div>
    </div>
  );
};

export default MobileSearchPage;
