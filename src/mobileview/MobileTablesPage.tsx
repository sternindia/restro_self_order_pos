import React, { useState } from "react";
import {
  ArrowLeft,
  Search,
  Utensils,
  Plus,
  RotateCw,
  CreditCard,
  Receipt,
  Check,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MobileFooter } from "../components/mobile";

export interface MobileTableSession {
  active_order_id?: string;
  staff_id?: number;
  staff_name?: string;
  guest_count?: number;
  updated_at?: string;
  total_items?: number;
  current_total?: number;
  reservation_id?: number;
  customer_name?: string;
}

export interface MobileTable {
  table_id: number | string;
  table_number: string;
  capacity: number;
  status: "Available" | "Occupied" | "Busy" | "Dirty" | "Reserved";
  current_session: MobileTableSession | null;
  updated_at?: string;
}

interface MobileTablesPageProps {
  tables: MobileTable[];
  loading: boolean;
  error: string | null;
  onSelectTable: (tableNumber: string) => void;
  onAddItems: (tableNumber: string) => void;
  onPayNow: (tableNumber: string) => Promise<void>;
  onMarkCleaned: (tableNumber: string) => void;
  onRefresh: () => void;
  isAdmin: boolean;
  onOpenAddTable?: () => void;
  getMinutesElapsed: (dateString?: string) => string;
}

export const MobileTablesPage: React.FC<MobileTablesPageProps> = ({
  tables,
  loading,
  error,
  onSelectTable,
  onAddItems,
  onPayNow,
  onMarkCleaned,
  onRefresh,
  isAdmin,
  onOpenAddTable,
  getMinutesElapsed,
}) => {
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "available" | "occupied">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeActionTable, setActiveActionTable] = useState<MobileTable | null>(null);

  const availableCount = tables.filter(
    (t) => t.status === "Available"
  ).length;

  const occupiedCount = tables.filter(
    (t) => t.status === "Occupied" || t.status === "Busy"
  ).length;

  const filteredTables = tables.filter((table) => {
    // Filter status
    if (activeFilter === "available" && table.status !== "Available") return false;
    if (activeFilter === "occupied" && table.status !== "Occupied" && table.status !== "Busy") return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const num = String(table.table_number).toLowerCase();
      if (!num.includes(q)) return false;
    }

    return true;
  });

  const handleTableCardClick = (table: MobileTable) => {
    if (table.status === "Occupied" || table.status === "Busy") {
      setActiveActionTable(table);
      return;
    }

    if (table.status === "Dirty") {
      onMarkCleaned(table.table_number);
      return;
    }

    if (table.status === "Reserved") {
      return;
    }

    // Toggle select
    if (selectedTable === table.table_number) {
      setSelectedTable(null);
    } else {
      setSelectedTable(table.table_number);
    }
  };

  const handleConfirmTable = () => {
    if (!selectedTable) return;
    onSelectTable(selectedTable);
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#111827] font-sans pb-28">
      {/* =====================================================
          TOP HEADER
      ===================================================== */}
      <header className="sticky top-0 z-30 bg-[#faf9f7]/95 backdrop-blur-md px-[18px] pb-[10px] pt-[14px] border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          {/* Back */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-[40px] w-[40px] items-center justify-center rounded-full text-slate-800 hover:bg-slate-200/60 active:scale-95 transition cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={24} strokeWidth={2.2} />
          </button>

          {/* Title */}
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-slate-900">
            Select Table
          </h1>

          {/* Right Action Icons: Refresh / Add / Search */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRefresh}
              className="flex h-[40px] w-[40px] items-center justify-center rounded-full text-slate-800 hover:bg-slate-200/60 active:scale-95 transition cursor-pointer"
              aria-label="Refresh"
              title="Refresh Tables"
            >
              <RotateCw size={19} className={loading ? "animate-spin text-[#ff5a1f]" : ""} />
            </button>

            {isAdmin && onOpenAddTable && (
              <button
                type="button"
                onClick={onOpenAddTable}
                className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#ff5a1f] text-white shadow-xs active:scale-95 transition cursor-pointer"
                aria-label="Add Table"
                title="Add New Table"
              >
                <Plus size={19} strokeWidth={2.5} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`flex h-[40px] w-[40px] items-center justify-center rounded-full active:scale-95 transition cursor-pointer ${
                isSearchOpen ? "bg-[#ff5a1f] text-white" : "text-slate-800 hover:bg-slate-200/60"
              }`}
              aria-label="Search"
            >
              <Search size={21} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Search Bar (Toggled) */}
        {isSearchOpen && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-white px-3 py-2 border border-slate-200 shadow-2xs animate-in fade-in duration-150">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search table number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400 bg-transparent"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </header>

      {/* =====================================================
          FILTERS
      ===================================================== */}
      <div className="flex gap-[8px] overflow-x-auto px-[18px] py-[14px] no-scrollbar">
        {/* ALL */}
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`flex h-[34px] shrink-0 items-center gap-[6px] rounded-full border px-[14px] text-[12px] font-semibold transition cursor-pointer active:scale-95 ${
            activeFilter === "all"
              ? "border-[#ff5a1f] bg-[#fff0e9] text-[#ff5a1f] shadow-xs"
              : "border-[#e8e8e8] bg-white text-[#4b5563]"
          }`}
        >
          All ({tables.length})
        </button>

        {/* AVAILABLE */}
        <button
          type="button"
          onClick={() => setActiveFilter("available")}
          className={`flex h-[34px] shrink-0 items-center gap-[6px] rounded-full border px-[14px] text-[12px] font-semibold transition cursor-pointer active:scale-95 ${
            activeFilter === "available"
              ? "border-[#00a86b] bg-[#edfff7] text-[#008f5b] shadow-xs"
              : "border-[#e8e8e8] bg-white text-[#4b5563]"
          }`}
        >
          <span className="h-[7px] w-[7px] rounded-full bg-[#00b779]" />
          Available ({availableCount})
        </button>

        {/* OCCUPIED */}
        <button
          type="button"
          onClick={() => setActiveFilter("occupied")}
          className={`flex h-[34px] shrink-0 items-center gap-[6px] rounded-full border px-[14px] text-[12px] font-semibold transition cursor-pointer active:scale-95 ${
            activeFilter === "occupied"
              ? "border-[#ff304f] bg-[#fff0f3] text-[#e91e3f] shadow-xs"
              : "border-[#e8e8e8] bg-white text-[#4b5563]"
          }`}
        >
          <span className="h-[7px] w-[7px] rounded-full bg-[#ff304f]" />
          Occupied ({occupiedCount})
        </button>
      </div>

      {/* =====================================================
          TABLE GRID (3 Columns on Mobile)
      ===================================================== */}
      <main className="px-[18px] pb-[90px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <RotateCw size={24} className="animate-spin text-[#ff5a1f]" />
            <span className="text-xs font-bold">Loading tables...</span>
          </div>
        ) : error ? (
          <div className="py-14 text-center text-xs font-bold text-red-500">
            {error}
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="py-16 text-center text-xs font-medium text-slate-400">
            No tables found matching your filter.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[10px]">
            {filteredTables.map((table) => {
              const isSelected = selectedTable === table.table_number;
              const isOccupied = table.status === "Occupied" || table.status === "Busy";
              const isReserved = table.status === "Reserved";
              const isDirty = table.status === "Dirty";

              const timeStr = isOccupied
                ? getMinutesElapsed(table.current_session?.updated_at)
                : null;

              return (
                <button
                  key={table.table_id}
                  type="button"
                  onClick={() => handleTableCardClick(table)}
                  className={`relative flex min-h-[116px] flex-col items-center justify-center rounded-[12px] border bg-white px-[6px] py-[12px] transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "border-[#ff5a1f] bg-[#fffaf7] shadow-[0_3px_12px_rgba(255,90,31,0.12)] ring-1 ring-[#ff5a1f]"
                      : "border-[#e8e8e8] shadow-2xs hover:border-slate-300"
                  } ${
                    isReserved ? "opacity-60" : "active:scale-[0.97]"
                  }`}
                >
                  {/* STATUS DOT */}
                  <span
                    className={`absolute right-[8px] top-[8px] h-[8px] w-[8px] rounded-full ${
                      table.status === "Available"
                        ? "bg-[#00b779]"
                        : isOccupied
                        ? "bg-[#ff304f]"
                        : isDirty
                        ? "bg-[#f59e0b]"
                        : "bg-[#a5a5a5]"
                    }`}
                  />

                  {/* TABLE ICON */}
                  <div
                    className={`mb-[6px] flex h-[28px] w-[28px] items-center justify-center ${
                      isSelected ? "text-[#ff5a1f]" : "text-[#273244]"
                    }`}
                  >
                    <Utensils size={20} strokeWidth={1.8} />
                  </div>

                  {/* TABLE NUMBER */}
                  <span
                    className={`text-[13px] font-bold truncate max-w-[85px] ${
                      isSelected ? "text-[#ff5a1f]" : "text-[#172033]"
                    }`}
                  >
                    {table.table_number}
                  </span>

                  {/* SEATS */}
                  <span className="mt-[2px] text-[10px] font-medium text-[#64748b]">
                    {table.capacity} Seats
                  </span>

                  {/* OCCUPIED TIMER */}
                  {isOccupied && timeStr && (
                    <span className="mt-[5px] rounded-[5px] bg-[#fff1f3] px-[6px] py-[2px] text-[9px] font-semibold text-[#ff304f] truncate max-w-[80px]">
                      {timeStr}
                    </span>
                  )}

                  {/* RESERVED */}
                  {isReserved && (
                    <span className="mt-[5px] rounded-[5px] bg-[#f1f1f1] px-[7px] py-[2px] text-[9px] font-medium text-[#737373]">
                      Reserved
                    </span>
                  )}

                  {/* DIRTY */}
                  {isDirty && (
                    <span className="mt-[5px] rounded-[5px] bg-[#fffbeb] px-[6px] py-[2px] text-[9px] font-semibold text-amber-700">
                      Clean
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* =====================================================
          BOTTOM CONFIRM BUTTON (If table selected)
      ===================================================== */}
      {selectedTable && (
        <div className="fixed bottom-[58px] left-0 right-0 z-30 bg-white/95 px-[18px] pb-[12px] pt-[10px] backdrop-blur-md border-t border-slate-200/80 max-w-md mx-auto animate-in slide-in-from-bottom-2 duration-150">
          <button
            type="button"
            onClick={handleConfirmTable}
            className="flex h-[48px] w-full items-center justify-center rounded-[13px] bg-[#ff5a1f] text-[15px] font-bold text-white shadow-[0_6px_18px_rgba(255,90,31,0.22)] transition active:scale-[0.98] cursor-pointer"
          >
            Confirm Table ({selectedTable})
          </button>
        </div>
      )}

      {/* =====================================================
          OCCUPIED TABLE ACTION MODAL (Bottom Sheet)
      ===================================================== */}
      {activeActionTable && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs p-0 animate-in fade-in"
          onClick={() => setActiveActionTable(null)}
        >
          <div
            className="w-full max-w-md rounded-t-[24px] bg-white p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {activeActionTable.table_number} Details
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {activeActionTable.capacity} Seats &bull; Server:{" "}
                  {activeActionTable.current_session?.staff_name || "Staff"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveActionTable(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {activeActionTable.current_session && (
              <div className="rounded-xl bg-slate-50 p-3 flex justify-between items-center text-xs font-bold border border-slate-200/70">
                <span className="text-slate-600">Total Bill Amount</span>
                <span className="text-base font-black text-slate-900">
                  ₹{(activeActionTable.current_session.current_total || 0).toFixed(2)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const num = activeActionTable.table_number;
                  setActiveActionTable(null);
                  onAddItems(num);
                }}
                className="flex items-center justify-center gap-1.5 h-11 bg-[#121417] text-white rounded-xl text-xs font-bold active:scale-95 transition cursor-pointer"
              >
                <Plus size={15} /> Add Dishes
              </button>
              <button
                type="button"
                onClick={async () => {
                  const num = activeActionTable.table_number;
                  setActiveActionTable(null);
                  await onPayNow(num);
                }}
                className="flex items-center justify-center gap-1.5 h-11 bg-emerald-600 text-white rounded-xl text-xs font-bold active:scale-95 transition cursor-pointer shadow-sm"
              >
                <CreditCard size={15} /> Mark Paid
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const num = activeActionTable.table_number;
                setActiveActionTable(null);
                onSelectTable(num);
              }}
              className="w-full flex items-center justify-center gap-1.5 h-10 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold active:scale-95 transition cursor-pointer hover:bg-slate-50"
            >
              <Receipt size={14} /> Open Menu for Table
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          COMMON MOBILE FOOTER (Bottom Nav)
      ===================================================== */}
      <MobileFooter activeTab="tables" />
    </div>
  );
};

export default MobileTablesPage;
