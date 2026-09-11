import React, { useState, useEffect } from "react";
import {
  Bell,
  BellRing,
  ArrowLeft,
  X,
  Clock,
  HelpCircle,
  Info,
  User,
  Table2,
  BarChart3,
  Utensils,
  Package,
  Settings,
  LogOut,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../../config";

export interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onLogout?: () => void;
  onOpenDrawer?: () => void;
  onOpenCallWaiter?: () => void;
  hideNotification?: boolean;
  hideProfile?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  onLogout: _onLogout,
  onOpenDrawer,
  onOpenCallWaiter,
  hideNotification = false,
  hideProfile = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [waiterAlertMsg, setWaiterAlertMsg] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>("Big Ben Restaurant");

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
  const isStaffUser = !!userObj && !isGuestUser;
  const isWaiter = roleAlias === "waiter";
  const isAdmin =
    roleAlias === "admin" || roleAlias === "super_admin" || roleAlias === "owner";

  // Check if tables are enabled
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

  const currentTable = sessionStorage.getItem("emenu_table") || "1";

  // Fetch restaurant info from cache / settings
  useEffect(() => {
    try {
      const savedSettingsStr = localStorage.getItem("emenu_pos_settings");
      if (savedSettingsStr) {
        const s = JSON.parse(savedSettingsStr);
        const name = s?.restaurant_info?.name || s?.restaurant_name;
        if (name) setRestaurantName(name);
      }
    } catch {}
  }, []);

  // Listen to global open events from footer or other components
  useEffect(() => {
    const handleDrawerEvent = () => setIsDrawerOpen(true);
    const handleCallWaiterEvent = () => setIsCallWaiterOpen(true);

    window.addEventListener("open-mobile-drawer", handleDrawerEvent);
    window.addEventListener("open-mobile-call-waiter", handleCallWaiterEvent);

    return () => {
      window.removeEventListener("open-mobile-drawer", handleDrawerEvent);
      window.removeEventListener("open-mobile-call-waiter", handleCallWaiterEvent);
    };
  }, []);

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

  const handleRequestAssistance = (type: string) => {
    setWaiterAlertMsg(`Request "${type}" sent to waiter for Table #${currentTable}!`);
    setTimeout(() => {
      setWaiterAlertMsg(null);
      setIsCallWaiterOpen(false);
    }, 2000);
  };

  const triggerOpenDrawer = () => {
    if (onOpenDrawer) {
      onOpenDrawer();
    } else {
      setIsDrawerOpen(true);
    }
  };

  const triggerOpenCallWaiter = () => {
    if (onOpenCallWaiter) {
      onOpenCallWaiter();
    } else {
      setIsCallWaiterOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white px-3 sm:px-4 py-2 border-b border-slate-100/80 backdrop-blur">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* LEFT SIDE */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            {showBack ? (
              <button
                type="button"
                onClick={onBack ? onBack : () => navigate(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer shrink-0"
                aria-label="Go Back"
              >
                <ArrowLeft size={20} />
              </button>
            ) : null}

            {/* Logo + Restaurant / Page Title */}
            <div
              className="flex items-center gap-1.5 sm:gap-2 min-w-0 cursor-pointer"
              onClick={() => {
                if (!showBack) navigate("/");
              }}
            >
              {!showBack && (
                <div className="flex h-9 w-9 sm:h-[42px] sm:w-[42px] shrink-0 items-center justify-center">
                  <span className="text-2xl sm:text-[34px] leading-none">🧑‍🍳</span>
                </div>
              )}

              <div className="flex flex-col min-w-0">
                <h1 className="whitespace-nowrap text-base sm:text-[23px] font-extrabold leading-snug sm:leading-[25px] tracking-tight text-[#111827] truncate">
                  {title ? (
                    title
                  ) : (
                    <>
                      Tisch<span className="text-[#ff5722]">ly</span> POS
                    </>
                  )}
                </h1>
                <p className="text-[10.5px] sm:text-[12px] font-medium leading-tight text-[#64748b] truncate">
                  {subtitle || restaurantName}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notification / Call Waiter */}
            {!hideNotification && (
              <button
                type="button"
                onClick={triggerOpenCallWaiter}
                className="relative flex h-9 w-9 sm:h-[42px] sm:w-[42px] items-center justify-center rounded-full text-[#111827] active:scale-95 cursor-pointer hover:bg-slate-50 transition"
                aria-label="Notifications"
                title="Table Assistance / Notifications"
              >
                <Bell className="w-6 h-6 sm:w-[27px] sm:h-[27px]" strokeWidth={2} />
                <span className="absolute right-1 top-1 h-2 w-2 sm:h-[9px] sm:w-[9px] rounded-full border-[1.5px] sm:border-[2px] border-white bg-[#ff5722]" />
              </button>
            )}

            {/* Profile Avatar */}
            {!hideProfile && (
              <button
                type="button"
                onClick={() => {
                  if (isAdmin) {
                    navigate("/settings");
                  } else if (isStaffUser) {
                    triggerOpenDrawer();
                  } else {
                    navigate("/login");
                  }
                }}
                className="flex h-9 w-9 sm:h-[44px] sm:w-[44px] items-center justify-center rounded-full bg-[#f1f3f5] text-xs sm:text-[15px] font-semibold text-[#172033] active:scale-95 cursor-pointer hover:bg-slate-200 transition"
                aria-label="Profile"
                title={userObj?.username || (isAdmin ? "Admin" : isWaiter ? "Waiter" : "Staff Login")}
              >
                {userObj?.username
                  ? userObj.username.slice(0, 2).toUpperCase()
                  : isAdmin
                  ? "AD"
                  : isWaiter
                  ? "WA"
                  : "AK"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Call Waiter Assistance Modal */}
      {isCallWaiterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150"
          onClick={() => setIsCallWaiterOpen(false)}
        >
          <div
            className="w-full max-w-[360px] rounded-2xl bg-white p-5 text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BellRing size={18} className="text-[#ff5a1f]" /> Table #{currentTable} Assistance
              </h3>
              <button
                onClick={() => setIsCallWaiterOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-500 text-left font-medium">
              Select what you need and a server will assist you shortly:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
              <button
                onClick={() => handleRequestAssistance("Call Waiter")}
                className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition"
              >
                <span className="text-xl">🔔</span> Call Waiter
              </button>
              <button
                onClick={() => handleRequestAssistance("Water Bottle")}
                className="p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition"
              >
                <span className="text-xl">💧</span> Extra Water
              </button>
              <button
                onClick={() => handleRequestAssistance("Cutlery & Plates")}
                className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition"
              >
                <span className="text-xl">🍽️</span> Cutlery & Plates
              </button>
              <button
                onClick={() => handleRequestAssistance("Bill Request")}
                className="p-3 bg-purple-50 text-purple-800 rounded-xl border border-purple-200 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition"
              >
                <span className="text-xl">🧾</span> Request Bill
              </button>
            </div>
            {waiterAlertMsg && (
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
                {waiterAlertMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Sheet "More Options" Modal */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-[28px] p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Handle bar & Header */}
            <div className="space-y-3">
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    More Options
                  </h2>
                  {isStaffUser && (
                    <span className="text-[11px] font-bold text-[#ff5722] bg-[#fff1eb] px-2 py-0.5 rounded-full border border-[#ff5722]/20 inline-block mt-0.5">
                      {userObj?.role_name || (isAdmin ? "Admin" : isWaiter ? "Waiter" : "Staff")}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Close"
                >
                  <X size={22} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* List of Options filtered by role */}
            <div className="space-y-1 divide-y divide-slate-100">
              {(isGuestUser
                ? [
                    {
                      id: "track",
                      title: "Track Order",
                      subtitle: "View your order live preparation status",
                      icon: <Clock size={21} />,
                      colorClass: "bg-blue-50 text-blue-600",
                      path: "/track-order",
                    },
                    {
                      id: "call_waiter",
                      title: "Call Waiter",
                      subtitle: "Request cutlery, water or assistance",
                      icon: <BellRing size={21} />,
                      colorClass: "bg-amber-50 text-amber-600",
                      onClick: () => {
                        setIsDrawerOpen(false);
                        setIsCallWaiterOpen(true);
                      },
                    },
                    {
                      id: "login",
                      title: "Staff Login",
                      subtitle: "Log in as waiter, cashier or admin",
                      icon: <User size={21} />,
                      colorClass: "bg-purple-50 text-purple-600",
                      path: "/login",
                    },
                    {
                      id: "help",
                      title: "Help & Support",
                      subtitle: "Need help? Ask restaurant staff",
                      icon: <HelpCircle size={21} />,
                      colorClass: "bg-rose-50 text-rose-500",
                      onClick: () => alert("Please ask our staff for assistance."),
                    },
                    {
                      id: "about",
                      title: "About",
                      subtitle: "Tischly POS e-Menu",
                      icon: <Info size={21} />,
                      colorClass: "bg-indigo-50 text-indigo-600",
                      onClick: () => alert("Tischly POS e-Menu v1.0.0"),
                    },
                  ]
                : isWaiter
                ? [
                    {
                      id: "history",
                      title: "Order History",
                      subtitle: "View placed orders, bills & receipts",
                      icon: <Clock size={21} />,
                      colorClass: "bg-blue-50 text-blue-600",
                      path: "/history",
                    },
                    ...(isEnableTables
                      ? [
                          {
                            id: "tables",
                            title: "Tables Overview",
                            subtitle: "Manage dine-in seating and occupied tables",
                            icon: <Table2 size={21} />,
                            colorClass: "bg-emerald-50 text-emerald-600",
                            path: "/tables",
                          },
                        ]
                      : []),
                    {
                      id: "help",
                      title: "Help & Support",
                      subtitle: "Waiter assistance & staff guide",
                      icon: <HelpCircle size={21} />,
                      colorClass: "bg-rose-50 text-rose-500",
                      onClick: () =>
                        alert("For support contact your restaurant administrator."),
                    },
                    {
                      id: "about",
                      title: "About",
                      subtitle: "Tischly POS Waiter Module",
                      icon: <Info size={21} />,
                      colorClass: "bg-indigo-50 text-indigo-600",
                      onClick: () => alert("Tischly POS Waiter Module v1.0.0"),
                    },
                  ]
                : [
                    {
                      id: "reports",
                      title: "Reports",
                      subtitle: "View sales, orders and analytics",
                      icon: <BarChart3 size={21} />,
                      colorClass: "bg-red-50 text-red-500",
                      path: "/dashboard",
                    },
                    {
                      id: "menu_mgmt",
                      title: "Menu Management",
                      subtitle: "Add, edit or manage menu items",
                      icon: <Utensils size={21} />,
                      colorClass: "bg-emerald-50 text-emerald-600",
                      path: "/manage-menu",
                    },
                    {
                      id: "stocks",
                      title: "Stocks",
                      subtitle: "Manage inventory and stock items",
                      icon: <Package size={21} />,
                      colorClass: "bg-amber-50 text-amber-600",
                      path: "/stock",
                    },
                    {
                      id: "history",
                      title: "Order History",
                      subtitle: "All restaurant orders & past bills",
                      icon: <Clock size={21} />,
                      colorClass: "bg-blue-50 text-blue-600",
                      path: "/history",
                    },
                    ...(isEnableTables
                      ? [
                          {
                            id: "tables",
                            title: "Tables",
                            subtitle: "Manage dine-in tables",
                            icon: <Table2 size={21} />,
                            colorClass: "bg-cyan-50 text-cyan-600",
                            path: "/tables",
                          },
                        ]
                      : []),
                    {
                      id: "settings",
                      title: "Settings",
                      subtitle: "App, printer and outlet settings",
                      icon: <Settings size={21} />,
                      colorClass: "bg-slate-100 text-slate-700",
                      path: "/settings",
                    },
                    {
                      id: "help",
                      title: "Help & Support",
                      subtitle: "FAQ, contact support",
                      icon: <HelpCircle size={21} />,
                      colorClass: "bg-rose-50 text-rose-500",
                      onClick: () => alert("Contact support at support@tischlypos.com"),
                    },
                    {
                      id: "about",
                      title: "About",
                      subtitle: "App version, licenses and info",
                      icon: <Info size={21} />,
                      colorClass: "bg-indigo-50 text-indigo-600",
                      onClick: () => alert("Tischly POS v1.0.0"),
                    },
                  ]
              ).map((opt: any) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    setIsDrawerOpen(false);
                    if (opt.onClick) {
                      opt.onClick();
                    } else if (opt.path) {
                      navigate(opt.path);
                    }
                  }}
                  className="flex items-center gap-3.5 py-3 px-2 rounded-xl hover:bg-slate-50 cursor-pointer active:scale-98 transition group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${opt.colorClass}`}
                  >
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#ff5722] transition-colors leading-tight">
                      {opt.title}
                    </h4>
                    <p className="text-[11.5px] text-slate-500 truncate mt-0.5">
                      {opt.subtitle}
                    </p>
                  </div>
                  <div className="text-slate-400 group-hover:text-slate-600 text-sm font-bold">
                    &rarr;
                  </div>
                </div>
              ))}

              {/* Logout Option for Staff / Admin */}
              {isStaffUser && (
                <div
                  onClick={() => {
                    setIsDrawerOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3.5 py-3 px-2 rounded-xl hover:bg-rose-50 cursor-pointer active:scale-98 transition group"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-rose-50 text-rose-600">
                    <LogOut size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-rose-600 leading-tight">Logout</h4>
                    <p className="text-[11.5px] text-slate-500 truncate mt-0.5">
                      End your session and sign out
                    </p>
                  </div>
                  <div className="text-rose-400 group-hover:text-rose-600 text-sm font-bold">
                    &rarr;
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileHeader;
