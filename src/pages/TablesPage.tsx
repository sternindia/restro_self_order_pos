import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCw,
  Plus,
  CreditCard,
  Check,
  X,
  Layers,
  Users as UsersIcon,
  Search,
  Grid2X2,
  Eye,
  Clock3,
  UserRound,
  MoreVertical,
  Armchair,
  Table2,
  BarChart3,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';
import { API_BASE_URL, getRestaurantId } from '../config';
import { toast } from 'react-toastify';
import DesktopLayout from '../components/DesktopLayout';
import MobileTablesPage from '../mobileview/MobileTablesPage';

interface TableSession {
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

interface Table {
  table_id: number | string;
  table_number: string;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Busy' | 'Dirty' | 'Reserved';
  current_session: TableSession | null;
  updated_at?: string;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; dot: string; bg: string; text: string }> = {
    occupied: {
      label: 'Occupied',
      dot: 'bg-red-500',
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-500 dark:text-red-400',
    },
    available: {
      label: 'Available',
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    reserved: {
      label: 'Reserved',
      dot: 'bg-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
    },
    dirty: {
      label: 'Needs Cleaning',
      dot: 'bg-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      text: 'text-orange-600 dark:text-orange-400',
    },
  };

  const item = config[status] || config.available;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${item.bg} ${item.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
}

interface TableCardProps {
  table: Table;
  onSelect: (tableNumber: string) => void;
  onAddItems: (tableNumber: string) => void;
  onPayNow: (tableNumber: string) => void;
  onMarkCleaned: (tableNumber: string) => void;
  elapsed: string;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

function TableCard({
  table,
  onSelect,
  onAddItems,
  onPayNow,
  onMarkCleaned,
  elapsed,
  isMenuOpen,
  onToggleMenu,
}: TableCardProps) {
  const normStatus = (table.status || '').toLowerCase() === 'busy' ? 'occupied' : (table.status || '').toLowerCase();
  const occupied = normStatus === 'occupied';
  const available = normStatus === 'available';
  const reserved = normStatus === 'reserved';
  const dirty = normStatus === 'dirty';

  const server = table.current_session?.staff_name || 'Staff';
  const customer =
    table.current_session?.customer_name ||
    (table.current_session?.guest_count ? `${table.current_session.guest_count} Guests` : 'Walk-in');
  const total = `₹${(table.current_session?.current_total || 0).toFixed(2)}`;
  const reservedFor = table.current_session?.customer_name || 'Rahul Mehta';
  const time = table.current_session?.updated_at
    ? new Date(table.current_session.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '7:00 PM';
  const note = table.current_session?.active_order_id
    ? `Order #${table.current_session.active_order_id}`
    : 'Table Reservation';

  const formatTitle = (tableNumber: string | number) => {
    const str = String(tableNumber || '').trim();
    if (/^(\d+)$/.test(str)) {
      return `Table ${str.padStart(2, '0')}`;
    }
    if (/^table\s*#?(\d+)$/i.test(str)) {
      const num = str.replace(/[^0-9]/g, '');
      return `Table ${num.padStart(2, '0')}`;
    }
    return str || 'Table';
  };

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border bg-white dark:bg-[#18181b]
        shadow-[0_1px_6px_rgba(15,23,42,0.04)]
        transition hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)]
        flex flex-col justify-between
        ${
          occupied
            ? 'border-red-100 dark:border-red-900/40'
            : reserved
            ? 'border-amber-200 dark:border-amber-900/40'
            : dirty
            ? 'border-orange-200 dark:border-orange-900/40'
            : 'border-emerald-100 dark:border-emerald-900/40'
        }
      `}
    >
      {/* Colored top section */}
      <div
        className={`
          relative px-3.5 py-2.5 border-b border-slate-100/80 dark:border-zinc-800
          ${
            occupied
              ? 'bg-gradient-to-r from-red-50/70 to-white dark:from-red-950/20 dark:to-transparent'
              : reserved
              ? 'bg-gradient-to-r from-amber-50/70 to-white dark:from-amber-950/20 dark:to-transparent'
              : dirty
              ? 'bg-gradient-to-r from-orange-50/70 to-white dark:from-orange-950/20 dark:to-transparent'
              : 'bg-gradient-to-r from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-transparent'
          }
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 text-[#071B34] dark:text-zinc-200">
              <Armchair size={24} strokeWidth={1.7} />
            </div>

            <div>
              <StatusBadge status={normStatus} />

              <h3 className="mt-1 text-[16px] font-semibold tracking-tight text-[#071B34] dark:text-white">
                {formatTitle(table.table_number)}
              </h3>

              <p className="text-[13px] font-normal text-slate-400 dark:text-zinc-400">
                {table.capacity} Seats
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu();
              }}
              className="rounded-lg p-1 text-[#071B34] dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 top-7 z-30 w-44 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-xl py-1 text-xs font-normal animate-in fade-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    onToggleMenu();
                    onSelect(table.table_number);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Eye size={14} className="text-slate-500" />
                  <span>View Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleMenu();
                    onAddItems(table.table_number);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Plus size={14} className="text-[#ff4b1f]" />
                  <span>Add Items</span>
                </button>
                {occupied && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleMenu();
                      onPayNow(table.table_number);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-zinc-800 font-medium"
                  >
                    <CreditCard size={14} />
                    <span>Mark as Paid</span>
                  </button>
                )}
                {(dirty || reserved) && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleMenu();
                      onMarkCleaned(table.table_number);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-zinc-800 font-medium"
                  >
                    <Check size={14} />
                    <span>Mark as Available</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card content */}
      {occupied && (
        <div className="px-3.5 py-2.5 flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[11px] font-normal text-slate-400 dark:text-zinc-500">Server</p>
              <p className="mt-0.5 flex items-center gap-1 text-[12px] font-normal text-[#12304D] dark:text-zinc-200 truncate">
                <UserRound size={12} className="shrink-0 text-slate-400" />
                <span className="truncate">{server}</span>
              </p>
            </div>

            <div>
              <p className="text-[11px] font-normal text-slate-400 dark:text-zinc-500">Customer</p>
              <p className="mt-0.5 text-[12px] font-normal text-[#12304D] dark:text-zinc-200 truncate">
                {customer}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-normal text-slate-400 dark:text-zinc-500">Elapsed</p>
              <p className="mt-0.5 flex items-center gap-1 text-[12px] font-normal text-[#12304D] dark:text-zinc-200">
                <Clock3 size={12} className="shrink-0 text-slate-400" />
                {elapsed}
              </p>
            </div>
          </div>

          <div className="my-2 h-px bg-slate-100 dark:bg-zinc-800" />

          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#12304D] dark:text-zinc-300">
              Total
            </span>

            <span className="text-[17px] font-bold text-[#071B34] dark:text-white">
              {total}
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSelect(table.table_number)}
              className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-zinc-900 text-[12px] font-medium text-red-500 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer active:scale-98"
            >
              <Eye size={14} />
              View Order
            </button>

            <button
              type="button"
              onClick={() => onAddItems(table.table_number)}
              className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#ff4b1f] text-[12px] font-medium text-white shadow-xs transition hover:bg-[#ed3f16] cursor-pointer active:scale-98"
            >
              <Plus size={15} />
              Add Items
            </button>
          </div>
        </div>
      )}

      {available && (
        <div className="px-3.5 py-3 flex-1 flex flex-col items-center justify-center gap-1">
          <div className="text-slate-200 dark:text-zinc-700">
            <Armchair size={28} strokeWidth={1.5} />
          </div>

          <p className="text-[12px] font-normal text-slate-400 dark:text-zinc-500">
            No active order
          </p>

          <button
            type="button"
            onClick={() => onAddItems(table.table_number)}
            className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#ff4b1f] text-[12px] font-medium text-white transition hover:bg-[#ed3f16] shadow-xs cursor-pointer active:scale-98"
          >
            <Table2 size={14} />
            Open Table
          </button>
        </div>
      )}

      {reserved && (
        <div className="px-3.5 py-2.5 flex-1 flex flex-col justify-between">
          <div className="space-y-1.5 text-[12px]">
            <div className="flex">
              <div className="flex w-[120px] items-center gap-2 text-[#17466c] dark:text-zinc-400 font-normal">
                <UserRound size={13} />
                Reserved For
              </div>

              <span className="font-medium text-[#071B34] dark:text-zinc-100 truncate">
                {reservedFor}
              </span>
            </div>

            <div className="flex">
              <div className="flex w-[120px] items-center gap-2 text-[#17466c] dark:text-zinc-400 font-normal">
                <Clock3 size={13} />
                Time
              </div>

              <span className="font-medium text-[#071B34] dark:text-zinc-100">
                {time}
              </span>
            </div>

            <div className="flex">
              <div className="flex w-[120px] items-center gap-2 text-[#17466c] dark:text-zinc-400 font-normal">
                <ClipboardList size={13} />
                Note
              </div>

              <span className="font-medium text-[#071B34] dark:text-zinc-100 truncate">
                {note}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onMarkCleaned(table.table_number)}
            className="mt-2.5 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[12px] font-medium text-orange-500 dark:text-amber-400 transition hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer active:scale-98"
          >
            <Check size={14} />
            Mark as Available
          </button>
        </div>
      )}

      {dirty && (
        <div className="px-3.5 py-2.5 flex-1 flex flex-col justify-between">
          <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-normal text-center border border-orange-200 dark:border-orange-900/40 text-[12px]">
            Needs Cleaning
          </div>

          <button
            type="button"
            onClick={() => onMarkCleaned(table.table_number)}
            className="mt-2.5 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[12px] font-medium text-orange-600 dark:text-orange-400 transition hover:bg-orange-100 cursor-pointer active:scale-98"
          >
            <Check size={14} />
            Mark as Cleaned
          </button>
        </div>
      )}
    </div>
  );
}

const TablesPage: React.FC = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnableTables, setIsEnableTables] = useState<boolean>(true);
  const fetchedRef = React.useRef(false);

  // Desktop filter and view states
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [showStats, setShowStats] = useState<boolean>(false);
  const [activeMenuTable, setActiveMenuTable] = useState<string | number | null>(null);

  // Add Table state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTableNum, setNewTableNum] = useState<string>('');
  const [newTableCap, setNewTableCap] = useState<string>('4');
  const [newTableFloor, setNewTableFloor] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Role check: Only admin & super_admin can add tables
  const savedUser = localStorage.getItem('emenu_user');
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const roleAlias = (currentUser?.role_alias || currentUser?.role || '').toLowerCase();
  const isAdmin = roleAlias === 'admin' || roleAlias === 'super_admin';

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const savedUser = localStorage.getItem('emenu_user');
      const userObj = savedUser ? JSON.parse(savedUser) : null;
      const restaurantId = userObj?.restaurant_id || userObj?.restaurent_id || 9;

      const parseBool = (val: any, defaultVal: boolean = true) => {
        if (val === undefined || val === null) return defaultVal;
        if (typeof val === 'boolean') return val;
        if (typeof val === 'number') return val === 1;
        if (typeof val === 'string') {
          const low = val.trim().toLowerCase();
          if (low === 'true' || low === '1') return true;
          if (low === 'false' || low === '0') return false;
        }
        return !!val;
      };

      // 1. Parse cached POS settings to determine if tables are enabled
      let enableTables = true;
      const cachedSettingsStr = localStorage.getItem('emenu_pos_settings');
      if (cachedSettingsStr) {
        try {
          const settings = JSON.parse(cachedSettingsStr);
          const enableTablesVal =
            settings?.hardware_and_preferences?.is_enable_tables ??
            settings?.is_enable_tables ??
            settings?.isEnableTables;
          enableTables = parseBool(enableTablesVal, false);
          setIsEnableTables(enableTables);
        } catch { }
      }

      // If tables are disabled in settings, skip calling backend table/order endpoints
      if (!enableTables) {
        setTables([]);
        setLoading(false);
        return;
      }

      // 2. Fetch tables and active orders in parallel from backend API
      const [tablesRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tables/${restaurantId}`),
        fetch(`${API_BASE_URL}/orders/${restaurantId}`).catch(() => null)
      ]);

      if (!tablesRes.ok) {
        throw new Error(`HTTP error! Status: ${tablesRes.status}`);
      }

      const data = await tablesRes.json();

      let orderHistory: any[] = [];
      if (ordersRes && ordersRes.ok) {
        try {
          const ordersData = await ordersRes.json();
          orderHistory = Array.isArray(ordersData)
            ? ordersData
            : (ordersData && Array.isArray(ordersData.data) ? ordersData.data : []);
        } catch (e) {
          console.warn("Failed to parse orders response:", e);
        }
      }

      let list: any[] = [];
      if (data && data.status === true && Array.isArray(data.data)) {
        const hasSections = data.data.length > 0 && data.data[0].tables;
        if (hasSections) {
          data.data.forEach((sec: any) => {
            if (sec && sec.tables) list.push(...sec.tables);
          });
        } else {
          list = data.data;
        }
      } else if (data) {
        if (data.tables && data.tables.length > 0) {
          list = data.tables;
        } else if (data.sections && data.sections.length > 0) {
          data.sections.forEach((sec: any) => {
            if (sec && sec.tables) list.push(...sec.tables);
          });
        }
      }

      // Compute table status dynamically from backend API data:
      // If table has a PENDING order in backend orderHistory -> Occupied with session details
      // Otherwise -> Available
      const mappedList: Table[] = list.map((item: any) => {
        const cleanTableNum = String(item.table_name || item.table_number || item.table_id || '').replace(/[^0-9]/g, '');
        const cleanTableId = String(item.table_id || '').replace(/[^0-9]/g, '');

        const activeOrder = orderHistory.find((oh: any) => {
          const statusStr = String(oh.order_status || oh.status || '').toUpperCase();
          if (statusStr === 'COMPLETED' || statusStr === 'CANCELLED' || statusStr === 'PAID') return false;

          const cleanOrderTableNum = String(oh.table_name || oh.table_number || '').replace(/[^0-9]/g, '');
          const orderTableId = String(oh.table_number_id || '');

          return (cleanTableNum && cleanOrderTableNum && cleanTableNum === cleanOrderTableNum) ||
            (cleanTableId && orderTableId && cleanTableId === orderTableId);
        });

        const statusRaw = String(item.status || 'Available').toUpperCase();
        const isOccupied = statusRaw === 'OCCUPIED' || !!activeOrder;

        if (isOccupied) {
          const orderTime = activeOrder ? (activeOrder.created_at || activeOrder.updated_at || activeOrder.time) : item.updated_at;
          const itemsList = activeOrder?.items || item.current_session?.items || [];
          const computedItemsTotal = itemsList.reduce((s: number, i: any) => s + (parseFloat(i.price || i.unit_price || 0) * parseInt(i.qty || i.quantity || 1)), 0);
          const totalAmount = activeOrder ? (activeOrder.total || activeOrder.bill?.grand_total || computedItemsTotal) : (item.current_session?.current_total || item.current_session?.total_amount || computedItemsTotal || 0);

          return {
            table_id: item.table_id || item.table_number,
            table_number: item.table_name || item.table_number || `#${item.table_id}`,
            capacity: Number(item.capacity) || 4,
            status: 'Occupied',
            current_session: {
              active_order_id: String(activeOrder?.order_id || item.current_session?.active_order_id || 'N/A'),
              order_status: activeOrder?.order_status || activeOrder?.status || item.current_session?.order_status || 'PENDING',
              staff_name: activeOrder?.staff_name || activeOrder?.guest_name || item.current_session?.staff_name || 'Customer',
              updated_at: orderTime,
              created_at: orderTime,
              current_total: Number(totalAmount),
              total_items: itemsList.reduce((s: number, i: any) => s + (parseInt(i.quantity || i.qty) || 1), 0)
            },
            updated_at: item.updated_at
          };
        }

        return {
          table_id: item.table_id || item.table_number,
          table_number: item.table_name || item.table_number || `#${item.table_id}`,
          capacity: Number(item.capacity) || 4,
          status: 'Available',
          current_session: null,
          updated_at: item.updated_at
        };
      });

      setTables(mappedList);
    } catch (err: any) {
      console.error('Failed to fetch live tables data:', err);
      setError(err.message || 'Failed to load tables.');
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchTables();
  }, []);

  useEffect(() => {
    if (!loading && !isEnableTables) {
      navigate('/', { replace: true });
    }
  }, [loading, isEnableTables, navigate]);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuTable(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleTableSelect = (tableNumber: string) => {
    const cleanNum = String(tableNumber).replace(/[^0-9]/g, '');
    sessionStorage.setItem('emenu_table', cleanNum || tableNumber);
    localStorage.removeItem('emenu_cart');
    navigate(`/?table=${cleanNum || encodeURIComponent(tableNumber)}`);
  };

  const handleSeatGuests = (tableNumber: string) => {
    handleAddItems(tableNumber);
  };

  const handleOpenTab = (tableNumber: string) => {
    handleAddItems(tableNumber);
  };

  const handleAddItems = (tableNumber: string) => {
    const cleanNum = String(tableNumber).replace(/[^0-9]/g, '');
    sessionStorage.setItem('emenu_table', cleanNum || tableNumber);
    localStorage.removeItem('emenu_cart');
    navigate(`/?table=${cleanNum || encodeURIComponent(tableNumber)}`);
  };

  const handlePayNow = async (tableNumber: string) => {
    const tableObj = tables.find(t => t.table_number === tableNumber);
    const activeOrd = tableObj?.current_session?.active_order_id;
    const tableIdNum = tableObj?.table_id ? parseInt(String(tableObj.table_id)) : null;

    if (activeOrd) {
      try {
        const updatePayload = {
          order_status: 'COMPLETED',
          table_number_id: tableIdNum
        };
        let response = await fetch(`${API_BASE_URL}/order/update-status/${activeOrd}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });

        if (!response.ok) {
          await fetch(`${API_BASE_URL}/order/update-status/${activeOrd}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
          });
        }
      } catch (err) {
        console.warn('Failed to update status on server:', err);
      }
      localStorage.removeItem('emenu_last_order');
    }

    // Refresh live status from backend API
    await fetchTables();
  };

  const handleMarkCleaned = (_tableNumber: string) => {
    fetchTables();
  };

  const handleMarkArrived = (_tableNumber: string) => {
    fetchTables();
  };

  // Prevent linter warnings for helper functions available for future card actions
  void handleSeatGuests;
  void handleOpenTab;
  void handleMarkCleaned;
  void handleMarkArrived;

  const parseUtcDate = (val?: string) => {
    if (!val) return new Date();
    let str = String(val).trim();
    if (str.includes(' ') && !str.includes('T')) {
      str = str.replace(' ', 'T');
    }
    if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
      str += 'Z';
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date(val) : d;
  };

  const getMinutesElapsed = (dateString?: string) => {
    if (!dateString) return '1s';
    const date = parseUtcDate(dateString);
    if (isNaN(date.getTime())) return '1s';

    let diffMs = Date.now() - date.getTime();
    if (diffMs < 0) diffMs = 0;

    const secs = Math.max(1, Math.floor(diffMs / 1000));
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  const formatTableTitle = (tableNumber: string | number) => {
    const str = String(tableNumber || '').trim();
    if (/^(\d+)$/.test(str)) {
      return `Table ${str.padStart(2, '0')}`;
    }
    if (/^table\s*#?(\d+)$/i.test(str)) {
      const num = str.replace(/[^0-9]/g, '');
      return `Table ${num.padStart(2, '0')}`;
    }
    return str || 'Table';
  };

  const getNormalizedStatus = (st: string) => {
    const low = (st || '').toLowerCase();
    if (low === 'occupied' || low === 'busy') return 'occupied';
    if (low === 'reserved') return 'reserved';
    if (low === 'dirty') return 'dirty';
    return 'available';
  };

  const counts = {
    all: tables.length,
    available: tables.filter((t) => getNormalizedStatus(t.status) === 'available').length,
    occupied: tables.filter((t) => getNormalizedStatus(t.status) === 'occupied').length,
    reserved: tables.filter((t) => getNormalizedStatus(t.status) === 'reserved' || getNormalizedStatus(t.status) === 'dirty').length,
  };

  const filteredTables = tables.filter((table) => {
    const norm = getNormalizedStatus(table.status);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'available' && norm === 'available') ||
      (filter === 'occupied' && norm === 'occupied') ||
      (filter === 'reserved' && (norm === 'reserved' || norm === 'dirty'));

    const searchLow = search.toLowerCase().trim();
    if (!searchLow) return matchesFilter;

    const title = formatTableTitle(table.table_number).toLowerCase();
    const server = (table.current_session?.staff_name || '').toLowerCase();
    const cust = (table.current_session?.customer_name || '').toLowerCase();
    const id = String(table.table_id).toLowerCase();

    return (
      matchesFilter &&
      (title.includes(searchLow) ||
        server.includes(searchLow) ||
        cust.includes(searchLow) ||
        id.includes(searchLow))
    );
  });

  const handleAddTable = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newTableNum.trim();
    if (!cleanName) {
      toast.warning('Please enter a table name or number.');
      return;
    }

    try {
      setIsSubmitting(true);
      const savedUser = localStorage.getItem('emenu_user');
      const userObj = savedUser ? JSON.parse(savedUser) : null;
      const restaurantId = userObj?.restaurant_id || userObj?.restaurent_id || getRestaurantId() || 9;

      const payload: any = {
        restaurent_id: parseInt(String(restaurantId), 10),
        restaurant_id: parseInt(String(restaurantId), 10),
        table_name: cleanName,
        capacity: parseInt(newTableCap, 10) || 4
      };
      if (newTableFloor.trim()) {
        payload.floor = newTableFloor.trim();
      }

      const response = await fetch(`${API_BASE_URL}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || `Failed to create table (HTTP ${response.status})`);
      }

      toast.success(data?.message || 'Table created successfully!');
      setShowAddModal(false);
      setNewTableNum('');
      setNewTableCap('4');
      setNewTableFloor('');
      await fetchTables();
    } catch (err: any) {
      console.error('Failed to create table:', err);
      toast.error(err.message || 'Failed to add table.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* MOBILE VIEW (< md) */}
      <div className="block md:hidden">
        <MobileTablesPage
          tables={tables as any}
          loading={loading}
          error={error}
          onSelectTable={handleTableSelect}
          onAddItems={handleAddItems}
          onPayNow={handlePayNow}
          onMarkCleaned={handleMarkCleaned}
          onRefresh={fetchTables}
          isAdmin={isAdmin}
          onOpenAddTable={() => setShowAddModal(true)}
          getMinutesElapsed={getMinutesElapsed}
        />
      </div>

      {/* DESKTOP VIEW (>= md) */}
      <div className="hidden md:block">
        <DesktopLayout activePage="Tables">
          <section className="px-5 py-4 flex-1">
            {/* Page Heading */}
            <div className="mb-3.5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-[27px] font-bold tracking-tight text-[#071B34] dark:text-white">
                  Tables
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStats(!showStats)}
                  className={`flex h-[36px] items-center gap-1.5 rounded-xl border px-3 text-[13px] font-medium shadow-xs transition cursor-pointer active:scale-95 ${
                    showStats
                      ? 'border-orange-300 bg-[#fff0ea] dark:bg-zinc-800 text-[#ff4b1f]'
                      : 'border-[#e9e4df] dark:border-zinc-800 bg-white dark:bg-[#18181b] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <BarChart3 size={15} />
                  <span>Stats</span>
                </button>

                <button
                  type="button"
                  onClick={fetchTables}
                  className="flex h-[36px] items-center gap-1.5 rounded-xl border border-[#e9e4df] dark:border-zinc-800 bg-white dark:bg-[#18181b] px-3 text-[13px] font-medium shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition cursor-pointer active:scale-95"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin text-[#ff4b1f]' : ''} />
                  <span>Refresh</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="flex h-[36px] items-center gap-1.5 rounded-xl bg-[#ff4b1f] px-3.5 text-[13px] font-medium text-white shadow-xs hover:bg-[#ed3f16] transition cursor-pointer active:scale-95"
                  >
                    <Plus size={16} />
                    <span>Add Table</span>
                  </button>
                )}
              </div>
            </div>

            {/* Optional Stats Banner */}
            {showStats && (
              <div className="mb-3.5 grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-2xl bg-white dark:bg-[#18181b] border border-[#eee9e4] dark:border-zinc-800 shadow-[0_1px_4px_rgba(15,23,42,0.03)] animate-in fade-in slide-in-from-top-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
                  <p className="text-[11px] font-normal text-slate-400 dark:text-zinc-400">Total Tables</p>
                  <p className="text-xl font-bold text-[#071B34] dark:text-white mt-0.5">{counts.all}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                  <p className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">Available Tables</p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{counts.available}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
                  <p className="text-[11px] font-normal text-red-600 dark:text-red-400">Occupied Tables</p>
                  <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-0.5">{counts.occupied}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                  <p className="text-[11px] font-normal text-amber-600 dark:text-amber-400">Total Floor Value</p>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                    ₹{tables.reduce((sum, t) => sum + (t.current_session?.current_total || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Status / Search Bar */}
            <div className="mb-3.5 flex flex-wrap gap-2.5 items-center justify-between rounded-xl border border-[#eee9e4] dark:border-zinc-800 bg-white dark:bg-[#18181b] px-3 py-1.5 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
              <div className="flex flex-wrap gap-1.5">
                {[
                  ['all', `All (${counts.all})`],
                  ['available', `Available (${counts.available})`],
                  ['occupied', `Occupied (${counts.occupied})`],
                  ['reserved', `Reserved (${counts.reserved})`],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`
                      flex h-[34px] items-center gap-1.5 rounded-lg px-3
                      text-[12px] font-medium transition cursor-pointer active:scale-98
                      ${
                        filter === key
                          ? 'border border-orange-200 dark:border-orange-500/40 bg-[#fff0ea] dark:bg-[#ff4b1f]/15 text-[#ff4b1f]'
                          : 'border border-transparent bg-white dark:bg-transparent text-[#173653] dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                      }
                    `}
                  >
                    {key === 'available' && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    )}

                    {key === 'occupied' && (
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                    )}

                    {key === 'reserved' && (
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                    )}

                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative w-[240px]">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
                  />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search table number..."
                    className="h-[34px] w-full rounded-lg border border-[#e8e9eb] dark:border-zinc-700 bg-transparent pl-9 pr-3 text-[12px] text-[#071B34] dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-orange-200 font-normal"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    toast.info(`Showing ${filteredTables.length} tables on floor`);
                  }}
                  className="flex h-[34px] items-center gap-1.5 rounded-lg border border-[#e8e9eb] dark:border-zinc-700 px-3 text-[12px] font-medium text-[#173653] dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  <Grid2X2 size={15} />
                  <span>Floor View</span>
                </button>
              </div>
            </div>

            {/* Table Grid Content */}
            {!isEnableTables ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-[#18181b] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs max-w-md mx-auto my-6">
                <div className="text-5xl mb-3">🪑</div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Tables Management Disabled</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5 leading-relaxed">
                  Table management is currently turned off in your restaurant POS Control Settings.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#f05a24] hover:bg-[#d94815] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                >
                  Go to Menu View →
                </button>
              </div>
            ) : error ? (
              <div className="text-center py-10 font-bold text-red-500">{error}</div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw size={32} className="animate-spin text-[#ff4b1f] mb-3" />
                <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">Loading tables...</p>
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] py-20">
                <Table2 className="mb-3 text-slate-300 dark:text-zinc-600" size={42} />
                <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
                  No tables found
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTables.map((table) => (
                  <TableCard
                    key={table.table_id}
                    table={table}
                    onSelect={handleTableSelect}
                    onAddItems={handleAddItems}
                    onPayNow={handlePayNow}
                    onMarkCleaned={handleMarkCleaned}
                    elapsed={getMinutesElapsed(table.current_session?.updated_at || table.updated_at)}
                    isMenuOpen={activeMenuTable === table.table_id}
                    onToggleMenu={() => setActiveMenuTable(activeMenuTable === table.table_id ? null : table.table_id)}
                  />
                ))}
              </div>
            )}
          </section>
        </DesktopLayout>
      </div>

      {/* Add New Table Modal (Available for both Mobile & Desktop) */}
      {isAdmin && showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => !isSubmitting && setShowAddModal(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#18181b] rounded-2xl p-6 shadow-2xl border border-[#F0E6DF] dark:border-zinc-800 space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0E6] dark:bg-[#ff5a1f]/20 text-[#f05a24] flex items-center justify-center text-xl font-black">
                  🪑
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">Add New Table</h3>
                  {/* <p className="text-xs text-gray-400 dark:text-zinc-400 font-medium">Create a table for table ordering & reservations</p> */}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-1.5">
                  Table Name or Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table #4 or VIP-1"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#27272a] text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a24]/30 focus:border-[#f05a24] transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-1.5">
                  Capacity (Seats) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <UsersIcon size={16} />
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={newTableCap}
                    onChange={(e) => setNewTableCap(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm font-semibold border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#27272a] text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a24]/30 focus:border-[#f05a24] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-1.5">
                  Floor / Section <span className="text-gray-400 dark:text-zinc-500 font-medium">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <Layers size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Ground Floor, Rooftop, First Floor"
                    value={newTableFloor}
                    onChange={(e) => setNewTableFloor(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm font-semibold border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#27272a] text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a24]/30 focus:border-[#f05a24] transition-all"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTableNum.trim()}
                  className="flex-1 py-2.5 px-4 bg-[#f05a24] hover:bg-[#d94815] text-white text-xs font-black rounded-xl shadow-md shadow-[#f05a24]/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw size={14} className="animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>+ Add Table</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TablesPage;
