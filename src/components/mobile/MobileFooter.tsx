import React, { useState, useEffect } from "react";
import { Utensils, ShoppingBag, Table2, Clock, MoreHorizontal } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export interface MobileFooterProps {
  activeTab?: "menu" | "orders" | "tables" | "history" | "more";
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
          ? "bg-[#fff1eb] text-[#ff5722]"
          : "text-slate-500 hover:text-slate-800"
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
  const isGuestUser =
    !userObj || userObj?.isGuest || roleAlias === "guest_user" || roleAlias === "guest";
  const isWaiter = roleAlias === "waiter";
  const isAdmin =
    roleAlias === "admin" || roleAlias === "super_admin" || roleAlias === "owner";

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

  // Determine active tab automatically from pathname if not explicitly passed
  const pathname = location.pathname;
  const currentTab =
    customActiveTab ||
    (pathname === "/" || pathname === "/menu"
      ? "menu"
      : pathname === "/cart"
      ? "orders"
      : pathname === "/tables"
      ? "tables"
      : pathname === "/history"
      ? "history"
      : undefined);

  const handleOpenMore = () => {
    if (onOpenDrawer) {
      onOpenDrawer();
    } else {
      window.dispatchEvent(new Event("open-mobile-drawer"));
    }
  };

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-slate-100 bg-white/95 px-3 pb-2 pt-1.5 backdrop-blur md:hidden">
      <div
        className={`grid ${
          isGuestUser
            ? "grid-cols-2 max-w-[260px] mx-auto"
            : isWaiter
            ? isEnableTables
              ? "grid-cols-4"
              : "grid-cols-3 max-w-[340px] mx-auto"
            : "grid-cols-4"
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

        {/* Orders / Cart Tab */}
        <NavItem
          icon={<ShoppingBag size={21} />}
          label="Orders"
          badge={cartCount}
          active={currentTab === "orders"}
          onClick={() => navigate("/cart")}
        />

        {/* Waiter Navigation Tabs */}
        {isWaiter && (
          <>
            {isEnableTables && (
              <NavItem
                icon={<Table2 size={21} />}
                label="Tables"
                active={currentTab === "tables"}
                onClick={() => navigate("/tables")}
              />
            )}
            <NavItem
              icon={<Clock size={21} />}
              label="History"
              active={currentTab === "history"}
              onClick={() => navigate("/history")}
            />
          </>
        )}

        {/* Admin Navigation Tabs */}
        {isAdmin && (
          <>
            {isEnableTables ? (
              <NavItem
                icon={<Table2 size={21} />}
                label="Tables"
                active={currentTab === "tables"}
                onClick={() => navigate("/tables")}
              />
            ) : (
              <NavItem
                icon={<Clock size={21} />}
                label="History"
                active={currentTab === "history"}
                onClick={() => navigate("/history")}
              />
            )}
            <button
              type="button"
              onClick={handleOpenMore}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 cursor-pointer transition active:scale-95 ${
                currentTab === "more"
                  ? "bg-[#fff1eb] text-[#ff5722]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <MoreHorizontal size={23} />
              <span className="text-[10px] font-semibold">More</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default MobileFooter;
