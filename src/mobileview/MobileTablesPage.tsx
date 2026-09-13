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
  time?: string;
}

const TableWithChairsIcon = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Top chair back */}
    <path d="M8.5 4.5h7" />
    {/* Table rectangle */}
    <rect x="7" y="7" width="10" height="8.5" rx="1.5" />
    {/* Left chair */}
    <path d="M4.5 9a1 1 0 0 1 1-1h1v6.5h-1a1 1 0 0 1-1-1V9Z" />
    {/* Right chair */}
    <path d="M17.5 8h1a1 1 0 0 1 1 1v4.5a1 1 0 0 1-1 1h-1V8Z" />
    {/* Bottom legs */}
    <path d="M9 15.5v3.5M15 15.5v3.5" />
  </svg>
);

const defaultMockTables: MobileTable[] = [
  { table_id: 1, table_number: "T1", capacity: 2, status: "Available", current_session: null },
  { table_id: 2, table_number: "T2", capacity: 2, status: "Available", current_session: null },
  { table_id: 3, table_number: "T3", capacity: 4, status: "Occupied", current_session: null, time: "00:42" },
  { table_id: 4, table_number: "T4", capacity: 4, status: "Available", current_session: null },
  { table_id: 5, table_number: "T5", capacity: 6, status: "Available", current_session: null },
  { table_id: 6, table_number: "T6", capacity: 6, status: "Occupied", current_session: null, time: "01:15" },
  { table_id: 7, table_number: "T7", capacity: 4, status: "Available", current_session: null },
  { table_id: 8, table_number: "T8", capacity: 4, status: "Available", current_session: null },
  { table_id: 9, table_number: "T9", capacity: 8, status: "Reserved", current_session: null },
  { table_id: 10, table_number: "T10", capacity: 2, status: "Available", current_session: null },
  { table_id: 11, table_number: "T11", capacity: 4, status: "Available", current_session: null },
  { table_id: 12, table_number: "T12", capacity: 4, status: "Available", current_session: null },
];

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

  const displayTables = tables && tables.length > 0 ? tables : defaultMockTables;

  const availableCount = displayTables.filter(
    (t) => t.status === "Available"
  ).length;

  const occupiedCount = displayTables.filter(
    (t) => t.status === "Occupied" || t.status === "Busy"
  ).length;

  const filteredTables = displayTables.filter((table) => {
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

  const formatTableNumber = (val: string | number) => {
    const s = String(val || '').trim();
    // Replaces 'Table #1' or 'Table #01' or '#1' with 'Table 1' or clean format without '#'
    if (/^table\s*#\s*(\d+)$/i.test(s)) {
      const num = s.replace(/[^0-9]/g, '');
      return `Table ${num}`;
    }
    if (/^#\s*(\d+)$/.test(s)) {
      return `Table ${s.replace(/[^0-9]/g, '')}`;
    }
    return s.replace('#', '');
  };

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
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#16161d] text-[#111827] dark:text-white font-sans pb-28 transition-colors">
      {/* =====================================================
          TOP HEADER
      ===================================================== */}
      <header className="sticky top-0 z-30 bg-[#faf9f7]/95 dark:bg-[#1a1a22]/95 backdrop-blur-md px-3 sm:px-4 py-2.5 border-b border-slate-200/60 dark:border-zinc-800 transition-colors">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Back Arrow + Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-800 dark:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 active:scale-95 transition cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft size={20} strokeWidth={2.2} />
            </button>

            <h1 className="text-[17px] sm:text-[18px] font-normal tracking-tight text-slate-900 dark:text-white whitespace-nowrap truncate">
              Select Table
            </h1>
          </div>

          {/* Right Action Icons: Refresh / Add / Search */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-800 dark:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 active:scale-95 transition cursor-pointer"
              aria-label="Refresh"
              title="Refresh Tables"
            >
              <RotateCw size={17} className={loading ? "animate-spin text-[#ff5a1f]" : ""} />
            </button>

            {isAdmin && onOpenAddTable && (
              <button
                type="button"
                onClick={onOpenAddTable}
                className="flex h-[32px] w-[32px] sm:h-[34px] sm:w-[34px] items-center justify-center rounded-full bg-[#ff5a1f] hover:bg-[#e04d18] text-white shadow-xs active:scale-95 transition cursor-pointer"
                aria-label="Add Table"
                title="Add New Table"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`flex h-9 w-9 items-center justify-center rounded-full active:scale-95 transition cursor-pointer ${
                isSearchOpen
                  ? "bg-[#ff5a1f] text-white"
                  : "text-slate-800 dark:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800"
              }`}
              aria-label="Search"
            >
              <Search size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Search Bar (Toggled) */}
        {isSearchOpen && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-white dark:bg-[#1f1f28] px-3 py-2 border border-slate-200 dark:border-zinc-800 shadow-2xs animate-in fade-in duration-150">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search table number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-normal text-slate-800 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500 bg-transparent"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-0.5 cursor-pointer"
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
      <div className="flex gap-2 overflow-x-auto px-3.5 sm:px-4 py-2.5 no-scrollbar">
        {/* ALL */}
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`flex h-[34px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-normal transition cursor-pointer active:scale-95 ${
            activeFilter === "all"
              ? "border-[#ff7a38]/30 bg-[#fff2eb] dark:bg-[#ff7a38]/20 text-[#ff5a1f] shadow-xs"
              : "border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] text-slate-600 dark:text-zinc-300 hover:border-slate-300"
          }`}
        >
          All ({displayTables.length})
        </button>

        {/* AVAILABLE */}
        <button
          type="button"
          onClick={() => setActiveFilter("available")}
          className={`flex h-[34px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-normal transition cursor-pointer active:scale-95 ${
            activeFilter === "available"
              ? "border-[#00b779]/30 bg-[#ebfbf5] dark:bg-[#00b779]/20 text-[#008f5b] dark:text-[#00d08a] shadow-xs"
              : "border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] text-slate-600 dark:text-zinc-300 hover:border-slate-300"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-[#00b779]" />
          Available ({availableCount})
        </button>

        {/* OCCUPIED */}
        <button
          type="button"
          onClick={() => setActiveFilter("occupied")}
          className={`flex h-[34px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-normal transition cursor-pointer active:scale-95 ${
            activeFilter === "occupied"
              ? "border-[#ef4444]/30 bg-[#fff0f3] dark:bg-[#ef4444]/20 text-[#ef4444] shadow-xs"
              : "border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] text-slate-600 dark:text-zinc-300 hover:border-slate-300"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
          Occupied ({occupiedCount})
        </button>
      </div>

      {/* =====================================================
          TABLE GRID (3 Columns on Mobile)
      ===================================================== */}
      <main className="px-3.5 sm:px-4 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <RotateCw size={24} className="animate-spin text-[#ff5a1f]" />
            <span className="text-xs font-normal">Loading tables...</span>
          </div>
        ) : error && displayTables.length === 0 ? (
          <div className="py-14 text-center text-xs font-normal text-red-500">
            {error}
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="py-16 text-center text-xs font-normal text-slate-400">
            No tables found matching your filter.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {filteredTables.map((table) => {
              const isSelected = selectedTable === table.table_number;
              const isOccupied = table.status === "Occupied" || table.status === "Busy";
              const isReserved = table.status === "Reserved";
              const isDirty = table.status === "Dirty";

              const timeStr = isOccupied
                ? (table as any).time || (getMinutesElapsed ? getMinutesElapsed(table.current_session?.updated_at) : "00:42")
                : null;

              return (
                <button
                  key={table.table_id}
                  type="button"
                  onClick={() => handleTableCardClick(table)}
                  className={`relative flex min-h-[122px] flex-col items-center justify-center rounded-2xl border px-2 py-3 transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "border-[1.5px] border-[#ff7a38] bg-[#fff5ee] dark:bg-[#ff5a1f]/10 dark:border-[#ff5a1f] shadow-xs"
                      : "border-slate-200/60 bg-white dark:bg-[#1f1f28] dark:border-zinc-800 hover:border-[1.5px] hover:border-[#ff7a38] hover:bg-[#fff5ee] dark:hover:bg-[#2a2a35] dark:hover:border-[#ff7a38] hover:shadow-xs"
                  } ${
                    isReserved ? "opacity-75" : "active:scale-[0.98]"
                  }`}
                >
                  {/* STATUS DOT */}
                  <span
                    className={`absolute right-2.5 top-2.5 h-2 w-2 rounded-full ${
                      table.status === "Available"
                        ? "bg-[#00b779]"
                        : isOccupied
                        ? "bg-[#ef4444]"
                        : isDirty
                        ? "bg-[#f59e0b]"
                        : "bg-[#9ca3af]"
                    }`}
                  />

                  {/* TABLE ICON */}
                  <div className="mb-1.5 flex h-7 w-7 items-center justify-center text-slate-800 dark:text-zinc-200">
                    <TableWithChairsIcon className="w-6 h-6" />
                  </div>

                  {/* TABLE NUMBER */}
                  <span className="text-[14px] font-normal text-slate-900 dark:text-white tracking-tight truncate max-w-[85px]">
                    {formatTableNumber(table.table_number)}
                  </span>

                  {/* SEATS */}
                  <span className="mt-0.5 text-[11px] font-normal text-slate-500 dark:text-zinc-400">
                    {table.capacity} Seats
                  </span>

                  {/* OCCUPIED TIMER */}
                  {isOccupied && timeStr && (
                    <span className="mt-2 rounded-[5px] bg-[#fff0f2] dark:bg-rose-950/40 px-2 py-0.5 text-[10px] font-normal text-[#ef4444] dark:text-rose-400 truncate max-w-[80px]">
                      {timeStr}
                    </span>
                  )}

                  {/* RESERVED */}
                  {isReserved && (
                    <span className="mt-2 rounded-[5px] bg-[#f1f5f9] dark:bg-zinc-800 px-2.5 py-0.5 text-[10px] font-normal text-slate-500 dark:text-zinc-400">
                      Reserved
                    </span>
                  )}

                  {/* DIRTY */}
                  {isDirty && (
                    <span className="mt-2 rounded-[5px] bg-[#fffbeb] dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-normal text-amber-700 dark:text-amber-400">
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
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#1a1a22] px-4 py-3 border-t border-slate-100 dark:border-zinc-800 max-w-md mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] animate-in slide-in-from-bottom-2 duration-150">
          <button
            type="button"
            onClick={handleConfirmTable}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-[#ff5a1f] hover:bg-[#e04d18] text-[14px] font-normal text-white shadow-[0_2px_8px_rgba(255,90,31,0.25)] transition active:scale-[0.98] cursor-pointer"
          >
            Confirm Table ({formatTableNumber(selectedTable)})
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
            className="w-full max-w-md rounded-t-[24px] bg-white dark:bg-[#1f1f28] p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-150 border-t border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-normal text-slate-900 dark:text-white">
                  {formatTableNumber(activeActionTable.table_number)} Details
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-400 font-normal">
                  {activeActionTable.capacity} Seats &bull; Server:{" "}
                  {activeActionTable.current_session?.staff_name || "Staff"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveActionTable(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-normal text-lg p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {activeActionTable.current_session && (
              <div className="rounded-xl bg-slate-50 dark:bg-[#2a2a35] p-3 flex justify-between items-center text-xs font-normal border border-slate-200/70 dark:border-zinc-700">
                <span className="text-slate-600 dark:text-zinc-300 font-normal">Total Bill Amount</span>
                <span className="text-base font-semibold text-slate-900 dark:text-white">
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
                className="flex items-center justify-center gap-1.5 h-11 bg-[#121417] dark:bg-zinc-800 text-white rounded-xl text-xs font-normal active:scale-95 transition cursor-pointer hover:bg-zinc-700"
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
                className="flex items-center justify-center gap-1.5 h-11 bg-emerald-600 text-white rounded-xl text-xs font-normal active:scale-95 transition cursor-pointer shadow-xs hover:bg-emerald-500"
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
              className="w-full flex items-center justify-center gap-1.5 h-10 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-normal active:scale-95 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              <Receipt size={14} /> Open Menu for Table
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          COMMON MOBILE FOOTER (Bottom Nav)
      ===================================================== */}
      {!selectedTable && <MobileFooter activeTab="tables" />}
    </div>
  );
};

export default MobileTablesPage;
