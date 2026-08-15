import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, Receipt, Plus, CreditCard, Check, Clock } from 'lucide-react';
import { API_BASE_URL } from '../config';
import Header from '../components/Header';
import TableStatusBadge from '../components/TableStatusBadge';

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

const TablesPage: React.FC = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnableTables, setIsEnableTables] = useState<boolean>(true);
  const fetchedRef = React.useRef(false);

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

  return (
    <div className="min-h-screen bg-[#FAF6F0] font-sans pb-[3vh]">
      <Header />

      <div className="mt-5 px-[3%] py-5 max-w-[1400px] mx-auto box-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 m-0">Table Status</h2>
          <button 
            onClick={fetchTables} 
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#F0E6DF] rounded-[8px] shadow-2xs hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {!isEnableTables ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#F0E6DF] shadow-xs max-w-md mx-auto my-6">
            <div className="text-5xl mb-3">🪑</div>
            <h3 className="text-lg font-black text-gray-900 mb-1">Tables Management Disabled</h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
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
          <div className="text-center py-10 font-bold text-[#f05a24]">Loading tables...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 py-3 sm:py-5">
            {tables.map((table) => {
              return (
                <div 
                  key={table.table_id} 
                  className="relative bg-white rounded-2xl p-2.5 sm:p-5 shadow-xs hover:shadow-md border border-[#F0E6DF] flex flex-col gap-2 transition-all duration-200 cursor-pointer overflow-hidden"
                  onClick={() => handleTableSelect(table.table_number)}
                >
                  <div className="absolute top-0 right-0">
                    <TableStatusBadge status={table.status} variant="corner" />
                  </div>

                  {/* Table Header */}
                  <div className="text-left pt-1 sm:pt-0 border-b border-gray-100/80 pb-1.5">
                    <h3 className="text-xs xs:text-sm sm:text-xl font-black text-gray-900 leading-tight truncate pr-14 sm:pr-20">
                      {table.table_number}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-400 font-bold mt-0.5">
                      {table.capacity} Seats
                    </p>
                  </div>

                  {/* Occupied Session Box */}
                  {table.status === 'Occupied' && table.current_session && (
                    <div className="bg-[#FAF6F0]/70 rounded-xl p-1.5 sm:p-2.5 flex flex-col gap-0.5 sm:gap-1 text-[10px] sm:text-xs border border-[#F0E6DF]">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Server</span>
                        <span className="font-bold text-gray-800 truncate max-w-[65px] sm:max-w-none">{table.current_session.staff_name || 'Staff'}</span>
                      </div>
                      <div className="flex justify-between items-center text-amber-600 font-bold">
                        <span className="flex items-center gap-1"><Clock size={10} className="shrink-0" /> Elapsed</span>
                        <span>{getMinutesElapsed(table.current_session.updated_at)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 mt-0.5">
                        <span className="text-gray-500 font-medium">Total</span>
                        <span className="font-black text-[#f05a24] text-xs sm:text-base">
                          ₹{(table.current_session.current_total || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {table.status === 'Dirty' && (
                    <div className="bg-rose-50/60 rounded-xl p-1.5 text-center text-[10px] sm:text-xs text-rose-600 font-extrabold border border-rose-100">
                      Needs Cleaning
                    </div>
                  )}

                  {table.status === 'Reserved' && table.current_session && (
                    <div className="bg-purple-50/60 rounded-xl p-1.5 flex flex-col gap-0.5 text-[10px] sm:text-xs border border-purple-100">
                      <div className="flex items-center gap-1 text-purple-700 font-semibold">
                        <Clock size={10} className="shrink-0" /> 7:30 PM
                      </div>
                      <div className="font-bold text-purple-900 truncate">
                        {table.current_session.customer_name || 'Reserved'}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons with Compact Height & Modern Radius for Mobile */}
                  <div className="flex gap-1.5 sm:gap-2 mt-auto pt-1 w-full" onClick={(e) => e.stopPropagation()}>
                    {table.status === 'Available' && (
                      <button className="w-full px-2 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black cursor-pointer flex items-center justify-center gap-1 transition-all duration-200 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-95" onClick={() => handleAddItems(table.table_number)}>
                        <Receipt size={12} /> OPEN TAB
                      </button>
                    )}

                    {table.status === 'Occupied' && (
                      <div className="grid grid-cols-2 gap-1.5 w-full">
                        <button className="px-1.5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black cursor-pointer flex items-center justify-center gap-1 transition-all duration-200 bg-[#f05a24] hover:bg-[#d94815] text-white shadow-2xs active:scale-95" onClick={() => handleAddItems(table.table_number)}>
                          <Plus size={11} /> <span className="truncate">ADD</span>
                        </button>
                        <button className="px-1.5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black cursor-pointer flex items-center justify-center gap-1 transition-all duration-200 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-95" onClick={() => handlePayNow(table.table_number)}>
                          <CreditCard size={11} /> <span className="truncate">PAID</span>
                        </button>
                      </div>
                    )}

                    {table.status === 'Dirty' && (
                      <button className="w-full px-2 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black cursor-pointer flex items-center justify-center gap-1 transition-all duration-200 bg-slate-600 hover:bg-slate-700 text-white shadow-2xs active:scale-95" onClick={() => handleMarkCleaned(table.table_number)}>
                        <Check size={12} /> CLEANED
                      </button>
                    )}

                    {table.status === 'Reserved' && (
                      <button className="w-full px-2 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black cursor-pointer flex items-center justify-center gap-1 transition-all duration-200 bg-[#f05a24] hover:bg-[#d94815] text-white shadow-2xs active:scale-95" onClick={() => handleMarkArrived(table.table_number)}>
                        <Check size={12} /> ARRIVED
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TablesPage;
