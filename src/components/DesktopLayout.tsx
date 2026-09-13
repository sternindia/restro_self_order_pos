import React, { useState, useMemo } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  PlusCircle,
  ClipboardList,
  ShoppingCart,
  Table2,
  Package,
  Settings,
  LogOut,
  BellRing,
  Sun,
  Moon,
  Clock,
  User,
  PhoneCall,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

interface DesktopLayoutProps {
  activePage?:
    | "Dashboard"
    | "Menu"
    | "Add Menu"
    | "Orders"
    | "Cart"
    | "Tables"
    | "History"
    | "Inventory"
    | "Settings"
    | string;
  activeTab?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  onLogout?: () => void;
}

export default function DesktopLayout({
  activePage = "",
  activeTab,
  headerLeft,
  headerRight,
  children,
  onLogout,
}: DesktopLayoutProps) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [waiterAlertMsg, setWaiterAlertMsg] = useState<string | null>(null);

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
  const currentTable = sessionStorage.getItem("emenu_table") || "1";

  const handleRequestAssistance = (type: string) => {
    setWaiterAlertMsg(`Request "${type}" sent to waiter for Table #${currentTable}!`);
    setTimeout(() => {
      setWaiterAlertMsg(null);
      setIsCallWaiterOpen(false);
    }, 2000);
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

  // Role-based sidebar items matching mobile view
  const sidebarItems = useMemo(() => {
    if (isGuestUser) {
      return [
        { label: "Menu", icon: UtensilsCrossed, path: "/menu" },
        { label: "Cart", icon: ShoppingCart, path: "/cart" },
        { label: "Contact Us", icon: PhoneCall, path: "/contact" },
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
        { label: "Live Orders", icon: ClipboardList, path: "/live-order" },
        { label: "Contact Us", icon: PhoneCall, path: "/contact" },
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
      { label: "Live Orders", icon: ClipboardList, path: "/live-order" },
      { label: "Inventory", icon: Package, path: "/stock" },
      { label: "Settings", icon: Settings, path: "/settings" },
      { label: "Contact Us", icon: PhoneCall, path: "/contact" },
    ];
  }, [isGuestUser, isWaiter, isEnableTables]);

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#121318] text-[#101d35] dark:text-[#f8fafc] transition-colors">
      <div className="flex min-h-screen">
        {/* ================= SIDEBAR ================= */}
        <aside className="fixed left-0 top-0 z-30 flex h-screen w-[200px] flex-col border-r border-[#eee5df] dark:border-[#262834] bg-white dark:bg-[#1a1b24] transition-colors">
          {/* Logo */}
          <div className="flex h-[72px] items-center px-5 border-b border-[#f0ebe7] dark:border-[#262834]">
            <div className="flex items-center gap-3">
              <span className="text-[24px]">👨‍🍳</span>
              <div className="leading-tight">
                <div className="text-[17px] font-bold tracking-[-0.5px]">
                  Tisch<span className="text-[#ff5520]">ly</span>
                </div>
                <p className="text-[11px] font-normal text-[#718096] dark:text-[#94a3b8] truncate max-w-[125px]">
                  {restaurantName}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const currentActive = (activePage || activeTab || "").toLowerCase();
              const itemLabelLow = item.label.toLowerCase();
              const active =
                itemLabelLow === currentActive ||
                (itemLabelLow === "cart" && currentActive === "orders") ||
                (itemLabelLow === "orders" && currentActive === "cart");

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
                      ? "bg-[#fff0e8] dark:bg-[#ff5520]/15 text-[#ff5520] font-semibold"
                      : "text-[#3f4c61] dark:text-[#94a3b8] hover:bg-[#f8f8f8] dark:hover:bg-[#232532] hover:text-[#101d35] dark:hover:text-white"
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
            <div className="border-t border-[#eee5df] dark:border-[#262834] p-3.5">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ffb7a1] dark:border-[#3a3e50] px-3.5 py-2.5 text-[12px] font-medium text-[#ff5520] hover:bg-[#fff0e8] dark:hover:bg-[#252836] transition cursor-pointer active:scale-98"
              >
                <LogOut size={16} className="shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="ml-[200px] min-h-screen flex-1 flex flex-col">
          {/* Top Sticky Header */}
          <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#eee5df] dark:border-[#262834] bg-white/95 dark:bg-[#1a1b24]/95 px-7 backdrop-blur transition-colors">
            {/* Left Header content */}
            <div className="flex items-center gap-3">
              {headerLeft || (
                <h1 className="text-xl font-bold tracking-tight text-[#101d35] dark:text-white">
                  {activePage}
                </h1>
              )}
            </div>

            {/* Right Header Area */}
            <div className="flex items-center gap-3.5">
              {headerRight}

              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 dark:border-[#2f3242] bg-white dark:bg-[#20222e] text-slate-700 dark:text-[#cbd5e1] hover:border-slate-300 dark:hover:border-[#3c4054] transition cursor-pointer active:scale-95"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <Sun size={18} className="text-amber-400" />
                ) : (
                  <Moon size={18} className="text-slate-600 dark:text-zinc-300" />
                )}
              </button>

              {/* Call Waiter Bell */}
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
                    <p className="text-[12px] font-medium text-[#101d35] dark:text-white">
                      {userName}
                    </p>
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

          {/* Children Page Body */}
          <div className="flex-1 flex flex-col">{children}</div>
        </main>
      </div>

      {/* Call Waiter Modal */}
      {isCallWaiterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
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
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Need assistance? Tap an option below to alert your server:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Call Server", icon: "🙋‍♂️" },
                { label: "Water Refill", icon: "💧" },
                { label: "Request Cutlery", icon: "🍴" },
                { label: "Request Bill", icon: "🧾" },
              ].map((act) => (
                <button
                  key={act.label}
                  type="button"
                  onClick={() => handleRequestAssistance(act.label)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 hover:bg-[#fff0e8] dark:hover:bg-[#ff5200]/20 hover:border-[#ff5200] text-slate-700 dark:text-zinc-300 hover:text-[#ff5722] transition cursor-pointer text-xs font-medium active:scale-95"
                >
                  <span className="text-xl">{act.icon}</span>
                  <span>{act.label}</span>
                </button>
              ))}
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
}
