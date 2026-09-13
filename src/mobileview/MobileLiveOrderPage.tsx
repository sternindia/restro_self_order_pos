import React, { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  CalendarDays,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { MobileHeader, MobileFooter } from "../components/mobile";
import { MobileOrderDetailsPage } from "./MobileOrderDetailsPage";

export interface MobileLiveOrder {
  id: string;
  table: string;
  item: string;
  count: string;
  total: string;
  status: string;
  rawOrder?: any;
}



const tabs = ["All", "Dine In", "Takeaway", "Delivery", "Cancelled"];

const formatTableBadge = (tbl: string) => {
  if (!tbl) return "T1";
  const clean = tbl.trim();
  if (/^table\s*#?/i.test(clean)) {
    return clean.replace(/^table\s*#?/i, "T");
  }
  return clean;
};

function StatusBadge({ status }: { status?: string }) {
  const s = (status || "Completed").toLowerCase();
  const isPending = s.includes("pending");
  const isCancelled = s.includes("cancel") || s.includes("reject");

  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff8e6] dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] sm:text-[10.5px] font-normal text-[#d97706] dark:text-amber-400 whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
        Pending
      </span>
    );
  }

  if (isCancelled) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#fee2e2] dark:bg-rose-950/40 px-1.5 py-0.5 text-[10px] sm:text-[10.5px] font-normal text-[#ef4444] dark:text-rose-400 whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#e7faf1] dark:bg-emerald-950/40 px-1.5 py-0.5 text-[10px] sm:text-[10.5px] font-normal text-[#079455] dark:text-emerald-400 whitespace-nowrap">
      <span className="h-1.5 w-1.5 rounded-full bg-[#00b779]" />
      Completed
    </span>
  );
}

interface MobileLiveOrderPageProps {
  orders?: any[];
  loading?: boolean;
  onRefresh?: () => void;
  onSelectOrder?: (order: any) => void;
  onPrintOrder?: (order: any) => void;
  onOpenCalendar?: () => void;
  startDate?: string;
  endDate?: string;
}

export const MobileLiveOrderPage: React.FC<MobileLiveOrderPageProps> = ({
  orders: liveOrders,
  loading: _loading,
  onRefresh: _onRefresh,
  onSelectOrder,
  onPrintOrder,
  onOpenCalendar,
  startDate,
  endDate,
}) => {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [showFilterPills, setShowFilterPills] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any>(null);

  const savedUser = typeof window !== 'undefined' ? localStorage.getItem('emenu_user') : null;
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const roleAlias = (currentUser?.role_alias || currentUser?.role || '').toLowerCase();
  const isSuperAdmin = roleAlias === 'super_admin' || roleAlias === 'admin';
  const isSelfPosBilling = roleAlias === 'self_billing_pos' || roleAlias === 'self_pos_billing' || roleAlias === 'self-pos-billing' || isSuperAdmin;

  // Map live orders directly without fallback to fake mock data
  const displayOrders: MobileLiveOrder[] = useMemo(() => {
    if (Array.isArray(liveOrders)) {
      return liveOrders.map((ord: any) => {
        const items = ord.items || [];
        const firstItem = items[0]?.name || "Dishes";
        const itemCount = items.reduce(
          (sum: number, it: any) => sum + (Number(it.quantity) || 1),
          0
        );

        return {
          id: `#${ord.order_id || ord.id}`,
          table: ord.table_name || ord.table_number_id || "Walk-In",
          item: items.length > 1 ? `${items.length} items` : firstItem,
          count: items.length > 1 ? "" : `${itemCount} item`,
          total: `₹${(ord.bill?.grand_total || ord.total || 0).toFixed(2)}`,
          status: isSelfPosBilling ? "Completed" : (ord.resolved_status || ord.order_status || "Completed"),
          rawOrder: ord,
        };
      });
    }
    return [];
  }, [liveOrders, isSelfPosBilling]);

  const filteredOrders = useMemo(() => {
    const value = search.toLowerCase().trim();

    return displayOrders.filter((order) => {
      // Tab filter
      if (activeTab !== "All") {
        if (activeTab === "Cancelled" && order.status.toLowerCase() !== "cancelled") {
          return false;
        }
        const ordType = (order.rawOrder?.order_meta?.order_type || order.rawOrder?.order_type || "").toLowerCase();
        if (activeTab === "Dine In" && ordType && !ordType.includes("dine")) return false;
        if (activeTab === "Takeaway" && ordType && !ordType.includes("take")) return false;
        if (activeTab === "Delivery" && ordType && !ordType.includes("deliv")) return false;
      }

      if (!value) return true;

      return (
        order.id.toLowerCase().includes(value) ||
        order.table.toLowerCase().includes(value) ||
        order.item.toLowerCase().includes(value)
      );
    });
  }, [displayOrders, search, activeTab]);

  const dateRangeText = useMemo(() => {
    if (startDate && endDate) {
      return `${startDate} - ${endDate}`;
    }
    if (startDate) {
      return `From ${startDate}`;
    }
    return "01 Sep 2026 - 10 Sep 2026";
  }, [startDate, endDate]);

  if (selectedOrderDetail) {
    return (
      <MobileOrderDetailsPage
        order={selectedOrderDetail}
        onBack={() => setSelectedOrderDetail(null)}
        onPrint={onPrintOrder}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#16161d] text-slate-900 dark:text-white font-sans w-full max-w-full overflow-x-hidden">
      {/* Mobile App Container */}
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#faf9f7] dark:bg-[#16161d] overflow-x-hidden flex flex-col justify-between">
        {/* Common Mobile Header */}
        <MobileHeader />

        {/* =====================================================
            MAIN CONTENT (Tight spacing, zero scrollbar overflow)
        ===================================================== */}
        <main className="min-h-0 flex-1 overflow-y-auto px-2 sm:px-2.5 pb-24">
         



          {/* =================================================
              ORDER LIST TABLE (Fluid flex row with Status column)
          ================================================= */}
          <section className="mt-2.5 overflow-hidden rounded-xl border border-[#eaecf0] dark:border-zinc-800 bg-white dark:bg-[#1f1f28] shadow-xs">
            {/* Header Row */}
            <div className="flex items-center gap-1 px-2 py-2 border-b border-[#eaecf0] dark:border-zinc-800 bg-[#fff8f3] dark:bg-[#2a2a35] text-[10px] font-normal uppercase tracking-wider text-[#475467] dark:text-zinc-400">
              <span className="w-[34px] shrink-0 text-left">#</span>
              <span className="w-[28px] shrink-0 text-center">Table</span>
              <span className="flex-1 min-w-0 px-1">Items</span>
              <span className="shrink-0 w-[56px] text-right">Total</span>
              <span className="shrink-0 w-[70px] text-center">Status</span>
              <span className="w-5 shrink-0" />
            </div>

            {/* Order Rows */}
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => {
                    const target = order.rawOrder || order;
                    setSelectedOrderDetail(target);
                    onSelectOrder?.(target);
                  }}
                  className="flex items-center gap-1 px-2 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-[#2a2a35]/70 active:bg-[#fff9f5] dark:active:bg-[#2a2a35] transition cursor-pointer"
                >
                  {/* Order ID */}
                  <span className="w-[34px] shrink-0 text-[11px] font-normal text-[#101828] dark:text-zinc-200">
                    {order.id}
                  </span>

                  {/* Table Badge */}
                  <span className="w-[28px] shrink-0 inline-flex items-center justify-center rounded-md bg-[#e7faf1] dark:bg-emerald-950/40 py-0.5 text-[10.5px] font-normal text-[#079455] dark:text-emerald-400">
                    {formatTableBadge(order.table)}
                  </span>

                  {/* Item Description */}
                  <div className="min-w-0 flex-1 px-1">
                    <p className="truncate text-[11.5px] font-normal text-[#101828] dark:text-zinc-200 leading-tight">
                      {order.item}
                    </p>
                    {order.count ? (
                      <p className="mt-0.5 text-[9.5px] text-[#667085] dark:text-zinc-400 leading-none font-normal">
                        {order.count}
                      </p>
                    ) : null}
                  </div>

                  {/* Total */}
                  <span className="shrink-0 w-[56px] text-[11px] font-normal text-[#101828] dark:text-white text-right">
                    {order.total}
                  </span>

                  {/* Status Badge */}
                  <div className="shrink-0 w-[70px] flex justify-center">
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Chevron Right (>) Arrow */}
                  <div className="w-5 shrink-0 flex items-center justify-end">
                    <ChevronRight size={16} className="text-[#667085] dark:text-zinc-500" />
                  </div>
                </div>
              ))}
            </div>

            {filteredOrders.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Search size={22} className="mx-auto text-[#98a2b3] dark:text-zinc-500" />
                <p className="mt-2 text-xs font-semibold text-[#344054] dark:text-zinc-400">
                  No orders found
                </p>
              </div>
            )}
          </section>
        </main>

        {/* Common Mobile Bottom Navigation */}
        <MobileFooter activeTab="live-order" />
      </div>
    </div>
  );
};

export default MobileLiveOrderPage;
