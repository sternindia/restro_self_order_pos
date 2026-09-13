import React, { useState, useEffect } from "react";
import { Utensils, ShoppingCart, ShoppingBag, Table2, Clock, MoreHorizontal, ClipboardList } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export interface MobileFooterProps {
  activeTab?: "menu" | "orders" | "cart" | "tables" | "history" | "more" | "dashboard" | "settings" | "inventory" | string;
  onMenuClick?: () => void;
  onOpenDrawer?: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

function NavItem({ icon, label, active = false, badge, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 cursor-pointer transition active:scale-95 ${
        active
          ? "bg-[#fff1eb] dark:bg-[#ff5722]/15 text-[#ff5722]"
          : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white"
      }`}
    >
      <div className="relative flex items-center justify-center">
        {icon}
        {typeof badge === "number" && badge > 0 && (
          <span className="absolute -right-2.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#ff5722] px-1 text-[10px] font-black text-white shadow-xs">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className={`text-[10px] ${active ? "font-bold" : "font-semibold"}`}>{label}</span>
    </button>
  );
}

export const MobileFooter: React.FC<MobileFooterProps> = ({
  activeTab: customActiveTab,
  onMenuClick,
  onOpenDrawer,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Load User & Role
  const userObj = (() => {
    try {
      const saved = localStorage.getItem("emenu_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const roleAlias = (userObj?.role_alias || userObj?.role || "").toLowerCase();
  const pathname = location.pathname;

  // Determine active tab automatically from pathname if not explicitly passed
  const currentTab =
    customActiveTab ||
    (pathname === "/" || pathname === "/menu"
      ? "menu"
      : pathname === "/cart"
      ? "cart"
      : pathname === "/tables"
      ? "tables"
      : pathname === "/history"
      ? "history"
      : pathname === "/live-order"
      ? "live-order"
      : pathname === "/dashboard" || pathname === "/stock" || pathname === "/manage-menu" || pathname === "/settings"
      ? "more"
      : undefined);

  // Exact parity with desktop Header.tsx logic
  const isGuestUser =
    !userObj || userObj?.isGuest || roleAlias === "guest_user" || roleAlias === "guest";
  const isStaffUser = !!userObj && !isGuestUser;
  const isWaiter = isStaffUser && roleAlias === "waiter";
  const isAdmin =
    isStaffUser &&
    (roleAlias === "admin" || roleAlias === "super_admin" || roleAlias === "owner");

  // Check if tables are enabled in settings
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

  // Cart count live state
  const [cartCount, setCartCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("emenu_cart");
      if (!saved) return 0;
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object") return 0;
      return (Object.values(parsed) as any[]).reduce<number>(
        (sum: number, item: any) => sum + (Number(item?.quantity) || 0),
        0
      );
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const saved = localStorage.getItem("emenu_cart");
        if (!saved) {
          setCartCount(0);
          return;
        }
        const parsed = JSON.parse(saved);
        if (!parsed || typeof parsed !== "object") {
          setCartCount(0);
          return;
        }
        const total = (Object.values(parsed) as any[]).reduce<number>(
          (sum: number, item: any) => sum + (Number(item?.quantity) || 0),
          0
        );
        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    };

    window.addEventListener("emenu_cart_updated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("emenu_cart_updated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);


  const handleOpenMore = () => {
    if (onOpenDrawer) {
      onOpenDrawer();
    } else {
      window.dispatchEvent(new Event("open-mobile-drawer"));
    }
  };

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-slate-200/70 dark:border-zinc-800 bg-[#faf9f7]/95 dark:bg-[#1a1a22]/95 px-3 pb-2 pt-1.5 backdrop-blur-md md:hidden transition-colors">
      <div
        className={`grid ${
          isGuestUser
            ? "grid-cols-2 max-w-[260px] mx-auto"
            : isWaiter
            ? isEnableTables
              ? "grid-cols-4"
              : "grid-cols-3 max-w-[300px] mx-auto"
            : isEnableTables
            ? "grid-cols-4"
            : "grid-cols-3 max-w-[300px] mx-auto"
        }`}
      >
        {/* Menu Tab */}
        <NavItem
          icon={<Utensils size={21} />}
          label="Menu"
          active={currentTab === "menu"}
          onClick={() => {
            if (onMenuClick) {
              onMenuClick();
            } else if (pathname === "/" || pathname === "/menu") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              navigate("/");
            }
          }}
        />

        {/* Cart Tab */}
        <NavItem
          icon={<ShoppingCart size={21} />}
          label="Cart"
          badge={cartCount}
          active={currentTab === "cart" || currentTab === "orders"}
          onClick={() => navigate("/cart")}
        />

        {/* Tables Tab — only if enabled & staff */}
        {isStaffUser && isEnableTables && (
          <NavItem
            icon={<Table2 size={21} />}
            label="Tables"
            active={currentTab === "tables"}
            onClick={() => navigate("/tables")}
          />
        )}

        {/* More — for all staff (opens drawer with History, Live, Contact, etc.) */}
        {isStaffUser && (
          <button
            type="button"
            onClick={handleOpenMore}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 cursor-pointer transition active:scale-95 ${
              currentTab === "more" ||
              currentTab === "history" ||
              currentTab === "live-order" ||
              currentTab === "dashboard" ||
              currentTab === "settings" ||
              currentTab === "inventory" ||
              currentTab === "stock" ||
              currentTab === "manage-menu"
                ? "bg-[#fff1eb] dark:bg-[#ff5722]/15 text-[#ff5722]"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            <MoreHorizontal size={23} />
            <span className="text-[10px] font-semibold">More</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default MobileFooter;

