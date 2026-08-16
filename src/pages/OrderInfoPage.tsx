import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL, getRestaurantId } from '../config';

const OrderInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const [posSettings, setPosSettings] = useState<any>({
    taxRate: 5.0,
    serviceCharge: 0.0
  });
  const [isEnableTables, setIsEnableTables] = useState<boolean>(true);

  React.useEffect(() => {
    const fetchPOSSettings = async () => {
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

      const applySettings = (settingsData: any) => {
        if (!settingsData) return;
        const taxRate = parseFloat(settingsData.financials?.tax_rate_percentage ?? settingsData.taxRate ?? 5.0);
        const serviceCharge = parseFloat(settingsData.financials?.service_charge_percentage ?? settingsData.serviceCharge ?? 0.0);
        const enableTablesVal = settingsData?.hardware_and_preferences?.is_enable_tables ?? settingsData?.is_enable_tables ?? settingsData?.isEnableTables;
        
        setPosSettings({ taxRate, serviceCharge });
        setIsEnableTables(parseBool(enableTablesVal, false));
      };

      try {
        const savedSettingsStr = localStorage.getItem('emenu_pos_settings');
        if (savedSettingsStr) {
          applySettings(JSON.parse(savedSettingsStr));
          return;
        }

        const rid = getRestaurantId();
        const res = await fetch(`${API_BASE_URL}/settings/pos/${rid}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            const settingsData = data?.data || data;
            localStorage.setItem('emenu_pos_settings', JSON.stringify(settingsData));
            applySettings(settingsData);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch settings in OrderInfoPage:", e);
      }
    };
    fetchPOSSettings();
  }, []);
  const [guestName, setGuestName] = useState(() => {
    const savedUser = localStorage.getItem('emenu_user');
    if (!savedUser) return '';
    try {
      const parsed = JSON.parse(savedUser);
      return parsed.name || parsed.guest_name || 'Guest';
    } catch {
      return '';
    }
  });
  const [phone, setPhone] = useState(() => {
    const savedUser = localStorage.getItem('emenu_user');
    if (!savedUser) return '';
    try {
      const parsed = JSON.parse(savedUser);
      return parsed.phone || '';
    } catch {
      return '';
    }
  });
  const [loading, setLoading] = useState(false);

  const userObj = React.useMemo(() => {
    const savedUser = localStorage.getItem('emenu_user');
    return savedUser ? JSON.parse(savedUser) : null;
  }, []);

  const isGuestCustomer = !userObj || userObj.isGuest || userObj.role?.toLowerCase() === 'guest';

  const [tableIdFromUrl] = useState(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlTable = queryParams.get('table') || queryParams.get('table_number') || '';
    if (urlTable) {
      const clean = String(urlTable).replace(/[^0-9]/g, '');
      sessionStorage.setItem('emenu_table', clean || urlTable);
      return clean || urlTable;
    }
    return '';
  });

  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlTable = queryParams.get('table') || queryParams.get('table_number') || '';
    if (urlTable) return String(urlTable).replace(/[^0-9]/g, '') || urlTable;
    const stored = sessionStorage.getItem('emenu_table') || '';
    return String(stored).replace(/[^0-9]/g, '') || stored;
  });

  React.useEffect(() => {
    if (tableIdFromUrl) {
      setSelectedTable(tableIdFromUrl);
    }

    const fetchTables = async () => {
      try {
        const savedUser = localStorage.getItem('emenu_user');
        const userObj = savedUser ? JSON.parse(savedUser) : null;
        const restaurantId = userObj?.restaurant_id || userObj?.restaurent_id || 9;

        // Fetch tables and active orders in parallel to accurately calculate availability
        const [tablesRes, ordersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/tables/${restaurantId}`),
          fetch(`${API_BASE_URL}/orders/${restaurantId}`).catch(() => null)
        ]);

        if (!tablesRes.ok) throw new Error('Failed to fetch tables');
        const data = await tablesRes.json();

        let activeOrders: any[] = [];
        if (ordersRes && ordersRes.ok) {
          try {
            const ordersData = await ordersRes.json();
            const rawOrders = Array.isArray(ordersData)
              ? ordersData
              : (ordersData && Array.isArray(ordersData.data) ? ordersData.data : []);

            activeOrders = rawOrders.filter((o: any) => {
              const isUnpaid = o.bill?.payment_status?.toUpperCase() !== 'PAID';
              const isPending = o.order_status?.toUpperCase() === 'PENDING';
              return isUnpaid && isPending;
            });
          } catch (e) {
            console.warn("Failed to parse orders in OrderInfoPage:", e);
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

        // Map live status based on active backend orders
        const mappedList = list.map((item: any) => {
          let normalizedStatus: 'Available' | 'Occupied' | 'Dirty' | 'Reserved' = 'Available';
          const statusUpper = (item.status || '').toUpperCase();
          if (statusUpper === 'OCCUPIED') normalizedStatus = 'Occupied';
          else if (statusUpper === 'DIRTY') normalizedStatus = 'Dirty';
          else if (statusUpper === 'RESERVED') normalizedStatus = 'Reserved';

          const tableNumStr = item.table_name || item.table_number || `#${item.table_id}`;
          const cleanTableNum = String(tableNumStr).replace(/[^0-9]/g, '');

          const hasActiveOrder = activeOrders.some((o: any) => {
            const cleanOrderTable = String(o.table_name || o.table_number || '').replace(/[^0-9]/g, '');
            return (String(o.table_number_id) === String(item.table_id)) ||
              (cleanOrderTable !== '' && cleanOrderTable === cleanTableNum);
          });

          if (hasActiveOrder) {
            normalizedStatus = 'Occupied';
          }

          return {
            ...item,
            table_number: cleanTableNum || item.table_number || item.table_id,
            status: normalizedStatus
          };
        });

        // Filter to only include tables that are TRULY Available
        const availableTables = mappedList.filter((t: any) => t.status === 'Available');

        const finalTables = availableTables.length > 0 ? availableTables : mappedList;
        setTables(finalTables);

        setSelectedTable((prev) => {
          if (prev) return prev;
          if (finalTables.length > 0) {
            const firstNum = String(finalTables[0].table_number || finalTables[0].table_name || finalTables[0].table_id).replace(/[^0-9]/g, '') || finalTables[0].table_number;
            sessionStorage.setItem('emenu_table', firstNum);
            return firstNum;
          }
          return '';
        });
      } catch (err: any) {
        console.error('Failed to fetch tables:', err.message);
        setTables([]);
      }
    };

    fetchTables();
  }, [tableIdFromUrl]);

  // Sync manual table selection to sessionStorage and check for active occupied order ID
  React.useEffect(() => {
    if (selectedTable) {
      sessionStorage.setItem('emenu_table', selectedTable);
      const cleanNum = String(selectedTable).replace(/[^0-9]/g, '');
      const savedLastOrder = localStorage.getItem('emenu_last_order');
      if (savedLastOrder) {
        try {
          const parsed = JSON.parse(savedLastOrder);
          const cleanLastTable = String(parsed.table || '').replace(/[^0-9]/g, '');
          if (cleanLastTable === cleanNum && parsed.order_id) {
            setExistingOrderId(String(parsed.order_id));
            return;
          }
        } catch { }
      }
    }
    setExistingOrderId(null);
  }, [selectedTable]);

  const [cart] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('emenu_cart');
    return saved ? JSON.parse(saved) : {};
  });

  const cartItems = Object.values(cart);
  const subTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceChargeRate = posSettings.serviceCharge || 0.0;
  const serviceChargeAmt = (subTotal * serviceChargeRate) / 100;
  const taxRate = posSettings.taxRate || 5.0;
  const taxAmt = (subTotal * taxRate) / 100;
  const cgstAmt = taxAmt / 2;
  const sgstAmt = taxAmt / 2;
  const total = subTotal + serviceChargeAmt + taxAmt;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast.warning("Your cart is empty!");
      return;
    }

    const targetTableNum = selectedTable || tableIdFromUrl;
    const cleanTableNum = String(targetTableNum).replace(/[^0-9]/g, '');
    if (isEnableTables && (!targetTableNum || !cleanTableNum)) {
      toast.warning("Please select a valid Table Number before placing your order!");
      return;
    }

    if (!guestName.trim() || !phone.trim()) {
      toast.warning("Please enter Guest Name and Phone Number!");
      return;
    }

    setLoading(true);

    const savedUser = localStorage.getItem('emenu_user');
    const userObj = savedUser ? JSON.parse(savedUser) : null;
    const restaurantId = userObj?.restaurant_id || userObj?.restaurent_id || 9;

    const matchingTableObj = tables.find(t => String(t.table_number) === String(cleanTableNum) || String(t.table_id) === String(cleanTableNum));
    const tableNumberId = matchingTableObj ? (parseInt(matchingTableObj.table_id) || null) : null;

    const payloadItems = cartItems.map(item => {
      const parsedId = parseInt(item.id);
      return {
        item_id: !isNaN(parsedId) ? parsedId : item.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        variant_id: null,
        addons: [],
        notes: item.notes || ""
      };
    });

    const orderPayload = {
      order_meta: {
        restaurant_id: restaurantId,
        staff_id: 5,
        staff_name: guestName || "E-Menu Customer",
        order_type: isEnableTables ? "DINE_IN" : "TAKEAWAY",
        table_number: isEnableTables && cleanTableNum ? `Table #${cleanTableNum}` : null,
        table_number_id: isEnableTables ? tableNumberId : null,
        guest_count: 1
      },
      items: payloadItems,
      totals: {
        subtotal: parseFloat(subTotal.toFixed(2)),
        tax: parseFloat(taxAmt.toFixed(2)),
        service_charge: parseFloat(serviceChargeAmt.toFixed(2)),
        discount_amount: 0.00,
        grand_total: parseFloat(total.toFixed(2))
      },
      status: "PENDING",
      created_at: new Date().toISOString()
    };

    try {
      setLoading(true);

      // Pre-check table live availability on backend to prevent concurrent ordering conflicts
      const ordersCheckRes = await fetch(`${API_BASE_URL}/orders/${restaurantId}`).catch(() => null);
      if (ordersCheckRes && ordersCheckRes.ok) {
        const ordersCheckData = await ordersCheckRes.json();
        const rawCheckOrders = Array.isArray(ordersCheckData) ? ordersCheckData : (ordersCheckData?.data || []);
        const isTableOccupiedNow = rawCheckOrders.some((o: any) => {
          const cleanOrderTable = String(o.table_name || o.table_number || o.table_number_id || '').replace(/[^0-9]/g, '');
          const st = (o.order_status || o.status || '').toUpperCase();
          const isActive = st === 'PENDING' || st === 'PREPARING' || st === 'READY' || st === 'CONFIRMED' || st === 'IN_PROGRESS';
          const isUnpaid = (o.bill?.payment_status || o.payment_status || '').toUpperCase() !== 'PAID';
          return cleanOrderTable !== '' && cleanOrderTable === cleanTableNum && isActive && isUnpaid;
        });

        if (isTableOccupiedNow && !existingOrderId) {
          toast.error(`Table #${cleanTableNum} is currently occupied with an active order. Please select an available table.`);
          setLoading(false);
          return;
        }
      }

      const response = await fetch(`${API_BASE_URL}/order/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const orderNum = data.data?.order_id || data.order_id || `#${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const activeTable = selectedTable || tableIdFromUrl || sessionStorage.getItem('emenu_table') || '1';

      localStorage.setItem('emenu_last_order', JSON.stringify({
        order_id: orderNum,
        table: activeTable,
        guest_name: guestName,
        phone: phone,
        items: cartItems,
        subTotal,
        tax: taxAmt,
        serviceCharge: serviceChargeAmt,
        total,
        created_at: new Date().toISOString()
      }));

      localStorage.removeItem('emenu_cart');
      toast.success("Order placed successfully!");
      navigate('/order-number');
    } catch (error: any) {
      console.error("Order creation failed:", error.message);
      toast.error("Failed to place order: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!existingOrderId) return handlePlaceOrder();
    if (cartItems.length === 0) {
      toast.warning("Your cart is empty!");
      return;
    }

    setLoading(true);
    try {
      const payloadItems = cartItems.map(item => ({
        item_id: parseInt(item.id) || item.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        notes: item.notes || ""
      }));

      const updatePayload = {
        order_id: parseInt(existingOrderId),
        items: payloadItems,
        totals: {
          subtotal: parseFloat(subTotal.toFixed(2)),
          tax: parseFloat(taxAmt.toFixed(2)),
          service_charge: parseFloat(serviceChargeAmt.toFixed(2)),
          discount_amount: 0.00,
          grand_total: parseFloat(total.toFixed(2))
        }
      };

      const response = await fetch(`${API_BASE_URL}/order/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const activeTable = selectedTable || tableIdFromUrl || sessionStorage.getItem('emenu_table') || '1';
      localStorage.setItem('emenu_last_order', JSON.stringify({
        order_id: existingOrderId,
        table: activeTable,
        guest_name: guestName,
        phone: phone,
        items: cartItems,
        subTotal,
        tax: taxAmt,
        serviceCharge: serviceChargeAmt,
        total,
        order_status: "PENDING",
        created_at: new Date().toISOString()
      }));

      localStorage.removeItem('emenu_cart');
      toast.success(`Order #${existingOrderId} updated successfully!`);
      setShowModal(true);
    } catch (error: any) {
      console.error("Order update failed:", error.message);
      toast.error("Failed to update order: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!existingOrderId) return;
    setCancellingOrder(true);
    try {
      const cancelPayload = {
        order_status: 'CANCELLED',
        status: 'CANCELLED'
      };

      let response = await fetch(`${API_BASE_URL}/order/update-status/${existingOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cancelPayload)
      });

      if (!response.ok) {
        response = await fetch(`${API_BASE_URL}/order/update-status/${existingOrderId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cancelPayload)
        });
      }

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      localStorage.removeItem('emenu_cart');
      localStorage.removeItem('emenu_last_order');
      sessionStorage.removeItem('emenu_table');
      setShowCancelModal(false);
      toast.info(`Order #${existingOrderId} has been cancelled.`);
      navigate('/');
    } catch (error: any) {
      console.error("Cancel order failed:", error.message);
      toast.error(`Failed to cancel order: ${error.message}`);
    } finally {
      setCancellingOrder(false);
    }
  };

  return (
    <div className="infobody min-h-screen bg-[#FAF6F0] font-sans pb-32">
      {/* Top Header */}
      <div className="header-info sticky top-0 z-50 flex h-11 md:h-16 w-full items-center bg-[#FFFBF8] px-3 md:px-8 shadow-xs border-b border-[#F0E6DF]">
        <button
          onClick={() => navigate(-1)}
          className="back-arrow mr-2.5 p-1.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Order Information</h2>
      </div>

      <div className="bodymiddle flex justify-center px-2 sm:px-4 py-2 sm:py-6">
        <div className="info-container w-full max-w-2xl bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xs border-0 sm:border border-[#F0E6DF] space-y-3 sm:space-y-5 flex flex-col">

          {/* Restaurant Header Info (Only visible for Guest Customers; Hidden for Waiters/Staff) */}
          {isGuestCustomer && (
            <div className="restaurant-info bg-[#FAF6F0]/60 rounded-xl p-2.5 sm:p-4 border border-[#F0E6DF]">
              <h2 className="text-base sm:text-lg font-black text-gray-900 mb-0.5 tracking-tight">{posSettings?.restaurant_info?.name || 'BIG BEN RESTAURANT'}</h2>
              <p className="text-[11px] sm:text-xs text-gray-600 flex items-start gap-1 my-0.5">
                <span>📍</span> <span>{posSettings?.restaurant_info?.address || '1st Flr, A Wing, Todi Estate, Sun Mill Compound, Lower Parel (west)'}</span>
              </p>
              <p className="text-[11px] sm:text-xs text-gray-600 flex items-center gap-1 my-0.5">
                <span>📞</span> <span>{posSettings?.restaurant_info?.phone || '+91-9876543212'}</span>
              </p>
            </div>
          )}

          {/* Order Type & Table Badges */}
          <div className={`grid ${isEnableTables ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5 sm:gap-4 items-start`}>
            <div>
              <label className="block text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                Order Type
              </label>
              <div className="h-10 sm:h-11 rounded-xl border border-[#f05a24]/30 bg-[#FFF0E6]/70 px-3 text-center text-xs font-black text-[#f05a24] flex items-center justify-center gap-1.5 shadow-2xs">
                <span>{isEnableTables ? '🍽️' : '🛍️'}</span> <span>{isEnableTables ? 'DINE-IN' : 'DIRECT ORDER'}</span>
              </div>
            </div>

            {isEnableTables && (
              <div>
                <label className="block text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                  Table Number *
                </label>
                {isGuestCustomer ? (
                  <select
                    value={selectedTable}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedTable(val);
                      if (val) {
                        sessionStorage.setItem('emenu_table', val);
                        localStorage.setItem('emenu_table', val);
                      } else {
                        sessionStorage.removeItem('emenu_table');
                      }
                    }}
                    className="w-full h-10 sm:h-11 rounded-xl border border-gray-300 px-3 outline-none focus:border-[#f05a24] focus:ring-2 focus:ring-[#f05a24]/20 text-xs font-bold text-gray-900 bg-white cursor-pointer shadow-2xs"
                  >
                    <option value="">-- Select Table Number * --</option>
                    {tables.map((t: any) => {
                      const num = String(t.table_number || t.table_name || t.table_id).replace(/[^0-9]/g, '') || t.table_number;
                      return (
                        <option key={t.table_id || num} value={num}>
                          Table #{num} ({t.status || 'Available'})
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="h-10 sm:h-11 rounded-xl border border-[#f05a24]/30 bg-[#FFF0E6]/70 px-3 text-xs font-black text-[#f05a24] flex items-center justify-center gap-1.5 shadow-2xs">
                    <span>Table #{selectedTable || tableIdFromUrl || sessionStorage.getItem('emenu_table') || '1'}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="personal-info space-y-2.5 sm:space-y-4 pt-0">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Guest Name *
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter Guest Name"
                className="w-full h-10 sm:h-11 rounded-xl border border-gray-300 px-3 outline-none focus:border-[#f05a24] focus:ring-2 focus:ring-[#f05a24]/20 text-xs sm:text-sm font-medium text-gray-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter Phone Number"
                className="w-full h-10 sm:h-11 rounded-xl border border-gray-300 px-3 outline-none focus:border-[#f05a24] focus:ring-2 focus:ring-[#f05a24]/20 text-xs sm:text-sm font-medium text-gray-900 transition-all"
              />
            </div>
          </div>

          {/* Billing Summary Box */}
          <div className="summary bg-[#FAF6F0]/60 rounded-xl p-3 sm:p-4 border border-[#F0E6DF] text-xs sm:text-sm space-y-2 sm:space-y-2.5">
            <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
              <span className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px] sm:text-xs">Order Summary</span>
              <span className="text-[11px] font-bold text-gray-800">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span>
            </div>

            {/* Itemized List of Cart Dishes */}
            <div className="space-y-1.5 border-b border-gray-200/80 pb-2 max-h-40 overflow-y-auto">
              {cartItems.map((item: any) => {
                const itemLineTotal = (item.price * item.quantity).toFixed(2);
                return (
                  <div key={item.id} className="flex justify-between items-center text-gray-800 text-xs">
                    <span className="font-semibold truncate max-w-[220px]">
                      {item.name} <span className="text-gray-700 font-bold">× {item.quantity}</span>
                    </span>
                    <span className="font-bold text-gray-900">₹{itemLineTotal}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-gray-800 font-bold pt-0.5">
              <span>Items Subtotal</span>
              <span className="font-extrabold text-gray-900">₹{subTotal.toFixed(2)}</span>
            </div>

            {serviceChargeRate > 0 && (
              <div className="flex justify-between text-gray-700 font-medium">
                <span>Service Charge ({serviceChargeRate}%)</span>
                <span className="font-bold">+₹{serviceChargeAmt.toFixed(2)}</span>
              </div>
            )}

            {taxRate > 0 && (
              <>
                <div className="flex justify-between text-gray-700 font-medium pl-2 text-xs">
                  <span>CGST ({(taxRate / 2).toFixed(1)}%)</span>
                  <span className="font-bold">+₹{cgstAmt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700 font-medium pl-2 text-xs">
                  <span>SGST ({(taxRate / 2).toFixed(1)}%)</span>
                  <span className="font-bold">+₹{sgstAmt.toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="border-t border-dashed border-gray-300 pt-2.5 flex justify-between font-black text-base text-[#f05a24]">
              <span>Grand Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Bottom Place / Update / Cancel Order Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-2.5 sm:p-4 flex justify-center shadow-lg">
        {!isGuestCustomer && existingOrderId ? (
          <div className="w-full max-w-[550px] flex items-center gap-2">
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={loading}
              className="flex-1 py-3 px-2.5 sm:px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-extrabold text-[11px] sm:text-sm whitespace-nowrap shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 border border-rose-700/20"
            >
              <span>Cancel</span>
            </button>

            <button
              onClick={handleUpdateOrder}
              disabled={loading}
              className="flex-[1.6] py-3 px-3 sm:px-4 rounded-xl bg-[#f05a24] hover:bg-[#d94815] active:scale-[0.99] text-white font-extrabold text-[11px] sm:text-sm whitespace-nowrap shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 border border-[#f05a24]/20"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Order (₹{total.toFixed(2)}) →</span>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full max-w-[550px] py-3.5 px-6 rounded-xl bg-[#f05a24] hover:bg-[#d94815] active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Placing Order...</span>
              </>
            ) : (
              <span>Place Order (₹{total.toFixed(2)})</span>
            )}
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="confirmationmodal fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="confirmationmodal-content w-full max-w-[380px] rounded-2xl bg-white p-6 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="confirmationcheck-icon mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Order Successful!</h3>
              <p className="text-xs text-gray-500 mt-1">Your order has been placed and sent to the kitchen.</p>
            </div>
            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => {
                  setShowModal(false);
                  navigate('/history');
                }}
                className="w-full py-3 rounded-xl bg-[#f05a24] hover:bg-[#d94815] text-sm font-bold text-white transition-all cursor-pointer shadow-md"
              >
                View Order History
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  navigate('/order-number');
                }}
                className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
              >
                View Order Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Cancel Order */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in" onClick={() => setShowCancelModal(false)}>
          <div className="w-full max-w-[340px] rounded-2xl bg-white p-6 text-center shadow-2xl space-y-4 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <Trash2 size={26} className="text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Cancel Order #{existingOrderId}?</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button 
                onClick={() => setShowCancelModal(false)}
                disabled={cancellingOrder}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                No, Keep Order
              </button>
              <button 
                onClick={handleConfirmCancelOrder}
                disabled={cancellingOrder}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {cancellingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Yes, Cancel</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderInfoPage;
