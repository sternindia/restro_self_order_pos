import React, { useState, useEffect } from 'react';
import { Trash2, ShoppingBag, ArrowLeft, Info, FileText, Pencil } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL, getRestaurantId } from '../config';
import BillSummaryModal from '../components/BillSummaryModal';
import { printThermalReceiptDirect } from '../components/ReceiptBillPrint';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isBillSheetOpen, setIsBillSheetOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');

  const [posSettings, setPosSettings] = useState<any>({
    taxRate: 5.0,
    serviceCharge: 0.0
  });

  const savedUser = localStorage.getItem('emenu_user');
  const userObj = savedUser ? JSON.parse(savedUser) : null;
  const roleAlias = (userObj?.role_alias || userObj?.role || '').toLowerCase();
  const isWaiter = roleAlias === 'waiter';
  const isGuestCustomer = !userObj || userObj.isGuest || roleAlias === 'guest' || roleAlias === 'guest_user';
  const isSelfPosBilling = !isGuestCustomer && !isWaiter && (
    roleAlias === 'self_billing_pos' || 
    roleAlias === 'self_pos_billing' || 
    roleAlias === 'self-pos-billing' || 
    roleAlias === 'super_admin' || 
    roleAlias === 'admin' || 
    roleAlias === 'cashier' || 
    roleAlias === 'manager'
  );
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);
  const [submittingBilling, setSubmittingBilling] = useState(false);

  useEffect(() => {
    const fetchPOSSettings = async () => {
      try {
        const savedSettingsStr = localStorage.getItem('emenu_pos_settings');
        if (savedSettingsStr) {
          const data = JSON.parse(savedSettingsStr);
          const taxRate = parseFloat(data.financials?.tax_rate_percentage ?? data.taxRate ?? 5.0);
          const serviceCharge = parseFloat(data.financials?.service_charge_percentage ?? data.serviceCharge ?? 0.0);
          setPosSettings({ taxRate, serviceCharge });
          return;
        }

        const rid = getRestaurantId();
        const res = await fetch(`${API_BASE_URL}/settings/pos/${rid}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            const settings = data?.data || data;
            localStorage.setItem('emenu_pos_settings', JSON.stringify(settings));
            const taxRate = parseFloat(settings.financials?.tax_rate_percentage ?? 5.0);
            const serviceCharge = parseFloat(settings.financials?.service_charge_percentage ?? 0.0);
            setPosSettings({ taxRate, serviceCharge });
          }
        }
      } catch (e) {
        console.warn('Failed to load dynamic POS settings in Cart:', e);
      }
    };
    fetchPOSSettings();
  }, []);

  useEffect(() => {
    const checkActiveOccupiedOrder = async () => {
      try {
        const storedTable = sessionStorage.getItem('emenu_table') || '';
        const cleanTableNum = String(storedTable).replace(/[^0-9]/g, '');

        if (cleanTableNum) {
          const rid = getRestaurantId();
          const res = await fetch(`${API_BASE_URL}/orders/${rid}`);
          if (res.ok) {
            const data = await res.json();
            const rawOrders = Array.isArray(data) ? data : (data?.data || []);
            const found = rawOrders.find((o: any) => {
              const cleanOrderTable = String(o.table_name || o.table_number || o.table_number_id || '').replace(/[^0-9]/g, '');
              const isPending = (o.order_status || o.status || '').toUpperCase() === 'PENDING';
              const isUnpaid = (o.bill?.payment_status || '').toUpperCase() !== 'PAID';
              return cleanOrderTable === cleanTableNum && isPending && isUnpaid;
            });
            if (found) {
              setExistingOrderId(String(found.order_id));
              return;
            }
          }
        }
      } catch (e) {
        console.warn('Error checking occupied order in Cart:', e);
      }
      setExistingOrderId(null);
    };

    checkActiveOccupiedOrder();
  }, []);

  const [cart, setCart] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('emenu_cart');
    return saved ? JSON.parse(saved) : {};
  });

  const saveCart = (newCart: Record<string, any>) => {
    setCart(newCart);
    localStorage.setItem('emenu_cart', JSON.stringify(newCart));
  };

  const handleClearCart = () => {
    saveCart({});
    setIsClearModalOpen(false);
  };

  const [updating, setUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleConfirmCancelOrder = async () => {
    if (!existingOrderId) return;
    setCancelling(true);
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

      saveCart({});
      localStorage.removeItem('emenu_last_order');
      sessionStorage.removeItem('emenu_table');
      setShowCancelModal(false);
      toast.info(`Order #${existingOrderId} has been cancelled.`);
      navigate('/');
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      toast.error(`Failed to cancel order: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const handleDirectUpdateOrderInCart = async () => {
    if (!existingOrderId) return;
    if (cartItems.length === 0) {
      toast.warning("Your cart is empty!");
      return;
    }
    setUpdating(true);
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
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax: parseFloat(taxAmt.toFixed(2)),
          service_charge: parseFloat(serviceChargeAmt.toFixed(2)),
          discount_amount: 0.00,
          grand_total: parseFloat(grandTotal.toFixed(2))
        }
      };

      const response = await fetch(`${API_BASE_URL}/order/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const storedTable = sessionStorage.getItem('emenu_table') || '1';
      localStorage.setItem('emenu_last_order', JSON.stringify({
        order_id: existingOrderId,
        table: storedTable,
        items: cartItems,
        subTotal: subtotal,
        tax: taxAmt,
        serviceCharge: serviceChargeAmt,
        total: grandTotal,
        order_status: "PENDING",
        created_at: new Date().toISOString()
      }));

      saveCart({});
      toast.success(`Order #${existingOrderId} updated successfully!`);
      navigate('/order-number');
    } catch (err: any) {
      console.error("Cart update failed:", err.message);
      toast.error("Failed to update order: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSelfPosPlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast.warning("Your cart is empty!");
      return;
    }

    setSubmittingBilling(true);
    try {
      const storedTable = sessionStorage.getItem('emenu_table') || '';
      const restaurantId = getRestaurantId();

      const payloadItems = cartItems.map(item => ({
        item_id: parseInt(item.id) || item.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        addons: [],
        notes: item.notes || ""
      }));

      const orderPayload = {
        order_meta: {
          restaurant_id: restaurantId,
          staff_id: userObj?.id || 99,
          staff_name: userObj?.name || "Self POS Counter",
          order_type: "TAKEAWAY",
          table_number: "Counter Order",
          table_number_id: null,
          guest_count: 1
        },
        items: payloadItems,
        totals: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax: parseFloat(taxAmt.toFixed(2)),
          service_charge: parseFloat(serviceChargeAmt.toFixed(2)),
          discount_amount: 0.00,
          grand_total: parseFloat(grandTotal.toFixed(2))
        },
        order_status: "CONFIRMED",
        status: "CONFIRMED",
        payment_status: "PAID",
        created_at: new Date().toISOString()
      };

      const response = await fetch(`${API_BASE_URL}/order/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const orderNum = data.data?.order_id || data.order_id || `#${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      localStorage.setItem('emenu_last_order', JSON.stringify({
        order_id: orderNum,
        table: "Counter Order",
        guest_name: userObj?.name || 'Self POS Counter',
        phone: userObj?.phone || '9999999999',
        items: cartItems,
        subTotal: subtotal,
        tax: taxAmt,
        serviceCharge: serviceChargeAmt,
        total: grandTotal,
        created_at: new Date().toISOString()
      }));

      // Trigger instant real-time silent thermal receipt print matching exact POS standard format
      printThermalReceiptDirect({
        orderId: orderNum,
        dateStr: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
        tableName: 'Counter Billing',
        staffName: userObj?.name || 'Counter Staff',
        guestName: userObj?.name || 'Self POS Counter',
        items: cartItems.map((item: any) => ({
          name: item.name,
          quantity: item.quantity || 1,
          price: parseFloat(item.price || 0),
          total_price: parseFloat(item.price || 0) * (item.quantity || 1)
        })),
        subtotal: subtotal,
        taxRate: taxRate,
        cgstAmt: taxAmt / 2,
        sgstAmt: taxAmt / 2,
        serviceChargeRate: serviceChargeRate,
        serviceChargeAmt: serviceChargeAmt,
        grandTotal: grandTotal,
        restaurantInfo: posSettings?.restaurantInfo || posSettings?.business_info || {
          name: posSettings?.restaurantName || posSettings?.restaurant_info?.name || 'BIG BEN RESTAURANT',
          address: posSettings?.address || posSettings?.restaurant_info?.address || '1st Flr, Sun Mill Compound, Lower Parel',
          city: posSettings?.city || posSettings?.restaurant_info?.city || 'Mumbai',
          state: posSettings?.state || posSettings?.restaurant_info?.state || 'MH',
          pincode: posSettings?.pincode || posSettings?.restaurant_info?.pincode || '',
          gstin: posSettings?.gstin || posSettings?.restaurant_info?.gstin || '27AAAAA0000A1Z5',
          fssai: posSettings?.fssaiNo || posSettings?.restaurant_info?.fssai_no || '10019022009876'
        }
      });

      saveCart({});
      toast.success("Bill Printed & Order Placed!");
      navigate('/');
    } catch (error: any) {
      console.error("Self POS Billing Order failed:", error.message);
      toast.error("Failed to place order: " + error.message);
    } finally {
      setSubmittingBilling(false);
    }
  };

  const updateQty = (id: string, delta: number) => {
    const newCart = { ...cart };
    if (!newCart[id]) return;
    newCart[id].quantity += delta;
    if (newCart[id].quantity <= 0) {
      delete newCart[id];
    }
    saveCart(newCart);
  };

  const removeItem = (id: string) => {
    const newCart = { ...cart };
    delete newCart[id];
    saveCart(newCart);
  };

  const setItemNotes = (id: string, notes: string) => {
    const newCart = { ...cart };
    if (newCart[id]) {
      newCart[id].notes = notes;
    }
    saveCart(newCart);
  };

  const openModal = (id: string) => {
    setSelectedItemId(id);
    setIsModalOpen(true);
  };

  const [isServiceChargeIncluded] = useState(true);
  const cartItems = Object.values(cart);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceChargeRate = posSettings.serviceCharge || 0.0;
  const serviceChargeAmt = isServiceChargeIncluded ? (subtotal * serviceChargeRate) / 100 : 0.0;
  const taxRate = posSettings.taxRate || 5.0;
  const taxAmt = (subtotal * taxRate) / 100;
  const cgstAmt = taxAmt / 2;
  const sgstAmt = taxAmt / 2;
  const grandTotal = subtotal + serviceChargeAmt + taxAmt;

  return (
    <div className="cart-body min-h-screen bg-[#FAF6F0] pb-24 md:pb-8">
      <div className="header-cart sticky top-0 z-50 flex h-11 md:h-[10vh] w-full items-center justify-between bg-[#FFFBF8] px-3 md:px-[3%] py-1 md:py-[1.5%] shadow-xs border-b border-[#F0E6DF]">
        <div className="backpluscart flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="back-arrow text-gray-700 hover:text-black cursor-pointer p-1 rounded-full hover:bg-gray-100 transition-all">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-lg md:text-[20px] font-bold text-gray-900">Cart</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cartItems.length > 0 && (
            <button 
              onClick={() => setIsClearModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
              title="Clear All Items"
            >
              <Trash2 size={13} className="text-rose-500 flex-shrink-0" />
              <span>Clear All</span>
            </button>
          )}
          <div className="relative flex items-center justify-center">
            <button className="cart-icon text-gray-700 p-1 cursor-default">
              <ShoppingBag size={22} />
            </button>
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#f05a24] text-white text-[10px] font-extrabold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-xs">
                {cartItems.length}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="cart-container mx-2 my-3.5 md:m-[3%_2.5%] md:w-[95%] rounded-2xl bg-white p-3.5 md:p-5 shadow-xs border border-[#F0E6DF]">
        {cartItems.length === 0 ? (
          <div className="text-center py-12 md:py-16 text-gray-500 space-y-3 flex flex-col items-center animate-slide-up">
            <div className="w-16 h-16 bg-[#FFF0E6] border border-[#f05a24]/20 rounded-full flex items-center justify-center shadow-2xs animate-pop-in animate-pulse-glow">
              <ShoppingBag size={28} className="text-[#f05a24]" />
            </div>
            <div>
              <p className="text-base font-extrabold text-gray-900">Your cart is empty</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[240px] mx-auto">Explore our menu and add your favorite dishes to get started.</p>
            </div>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 bg-[#f05a24] hover:bg-[#d94815] active:scale-95 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md transition-all no-underline mt-1"
            >
              <span>Explore Menu</span>
              <span>→</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200/70">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item py-3.5 md:py-[15px] first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="item-info flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="iconplusitem flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        <img 
                          src={item.isVeg ? "/images/veg.png" : "/images/nonVeg.png"} 
                          alt={item.isVeg ? "Veg" : "Non-Veg"} 
                          className="h-4 w-4 md:h-[20px] md:w-[20px] object-contain"
                        />
                      </div>
                      <div className="nameplusprice flex-1 min-w-0">
                        <div className="nameCart text-sm md:text-[16px] font-semibold md:font-bold text-gray-900 leading-snug break-words md:max-w-[40vw]">
                          {item.name}
                        </div>
                        <div className="price text-xs md:text-[15px] font-bold text-[#f05a24] mt-0.5">
                          {item.price.toFixed(2)} Rs
                        </div>
                      </div>
                    </div>

                    {/* Mobile Stepper */}
                    <div className="quantity flex md:hidden items-center rounded-xl border border-[#f05a24]/30 bg-[#FFF0E6]/50 px-2 py-1 shadow-2xs">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="delete p-1 text-red-500 hover:text-red-700 cursor-pointer active:scale-95 transition-transform"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        onClick={() => updateQty(item.id, -1)}
                        className="px-1 text-sm font-bold text-gray-600 hover:text-black cursor-pointer active:scale-95"
                      >
                        −
                      </button>
                      <span className="text-xs font-bold px-1.5 min-w-[16px] text-center text-gray-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQty(item.id, 1)}
                        className="add px-1 text-sm font-bold text-[#f05a24] hover:text-[#d94815] cursor-pointer active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {item.notes && (
                    <div className="text-xs text-amber-800 bg-amber-50/80 border border-amber-200/60 rounded-md px-2.5 py-1 mt-2 flex items-start gap-1">
                      <span className="font-semibold flex-shrink-0">Instruction:</span>
                      <span className="italic break-words">"{item.notes}"</span>
                    </div>
                  )}

                  <button 
                    onClick={() => openModal(item.id)}
                    className="write-instruction mt-1.5 cursor-pointer text-xs font-semibold text-gray-600 hover:text-[#f05a24] flex items-center gap-1.5 transition-colors group"
                  >
                    <Pencil size={13} className="text-gray-500 group-hover:text-[#f05a24] transition-colors flex-shrink-0" />
                    <span className="underline decoration-gray-300 group-hover:decoration-[#f05a24] underline-offset-2">{item.notes ? 'Edit instruction' : 'Write instruction on item.'}</span>
                  </button>
                </div>

                {/* Desktop Stepper */}
                <div className="quantity hidden md:flex items-center rounded-[10px] border border-[#f05a24]/40 bg-[#FFF0E6]/30 p-[10px_5px]">
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="delete mx-[10px] text-[15px] text-red-600 cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button 
                    onClick={() => updateQty(item.id, -1)}
                    className="mx-[5px] text-[16px] text-gray-500 font-bold cursor-pointer"
                  >
                    −
                  </button>
                  <span className="text-[16px] font-bold px-[5px]">{item.quantity}</span>
                  <button 
                    onClick={() => updateQty(item.id, 1)}
                    className="add mx-[10px] text-[20px] font-bold text-[#f05a24] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartItems.length > 0 && (
        <>
          {/* Mobile Bottom Footer */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 py-2.5 px-3 shadow-[0_-4px_16px_rgba(0,0,0,0.1)] flex md:hidden items-center justify-between gap-2">
            <div 
              onClick={() => setIsBillSheetOpen(true)}
              className="cursor-pointer group py-0.5 min-w-0 flex-shrink-0"
              title="Click to view detailed bill breakdown"
            >
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider group-hover:text-[#f05a24] transition-colors">TOTAL</span>
                <Info size={11} className="text-[#f05a24] group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm sm:text-base font-black text-[#f05a24] whitespace-nowrap">
                  ₹{grandTotal.toFixed(2)}
                </span>
                <span className="text-[9px] font-medium text-gray-400 whitespace-nowrap hidden xs:inline">
                  (incl. GST)
                </span>
              </div>
            </div>

            {isSelfPosBilling ? (
              <button 
                onClick={handleSelfPosPlaceOrder}
                disabled={submittingBilling}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold px-3.5 py-2 rounded-xl shadow-md flex items-center justify-center gap-1 text-xs sm:text-sm whitespace-nowrap transition-all border border-emerald-700/20 cursor-pointer disabled:opacity-50"
              >
                {submittingBilling ? (
                  <span>Generating Bill...</span>
                ) : (
                  <>
                    <span>⚡ Confirm & Print</span>
                    <span>→</span>
                  </>
                )}
              </button>
            ) : !isGuestCustomer && existingOrderId ? (
              <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold px-3 py-2 rounded-xl shadow-xs text-xs whitespace-nowrap transition-all cursor-pointer border border-rose-700/20"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDirectUpdateOrderInCart}
                  disabled={updating}
                  className="bg-[#f05a24] hover:bg-[#d94815] active:scale-98 text-white font-extrabold px-3.5 py-2 rounded-xl shadow-xs flex items-center justify-center gap-1 text-xs whitespace-nowrap transition-all border border-[#f05a24]/20 cursor-pointer disabled:opacity-50"
                >
                  {updating ? (
                    <span>Updating...</span>
                  ) : (
                    <>
                      <span>Update Order</span>
                      <span className="text-xs">→</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <Link 
                to="/order-info" 
                className="bg-[#f05a24] hover:bg-[#d94815] active:scale-98 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap transition-all no-underline"
              >
                <span>Confirm Order</span>
                <span>→</span>
              </Link>
            )}
          </div>

          {/* Desktop Bottom Footer */}
          {isSelfPosBilling ? (
            <div className="cart-footer hidden md:flex fixed bottom-[2.5vh] ml-[2.5vw] h-[6vh] w-[95vw] items-center justify-between rounded-[10px] bg-emerald-600 p-[15px] shadow-md">
              <div 
                onClick={() => setIsBillSheetOpen(true)}
                className="cart-button text-[16px] text-white font-bold flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                title="Click to view detailed Bill Summary"
              >
                <span>Total - {grandTotal.toFixed(2)} Rs</span>
                <span className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                  <FileText size={13} />
                  <span>Bill Summary</span>
                </span>
              </div>
              <button 
                onClick={handleSelfPosPlaceOrder}
                disabled={submittingBilling}
                className="bg-white text-emerald-800 hover:bg-gray-100 font-bold px-5 py-2 rounded-lg text-sm transition-all cursor-pointer shadow-md border border-white/40 disabled:opacity-50"
              >
                {submittingBilling ? 'Generating Bill...' : '⚡ Confirm & Print →'}
              </button>
            </div>
          ) : !isGuestCustomer && existingOrderId ? (
            <div className="cart-footer hidden md:flex fixed bottom-[2.5vh] ml-[2.5vw] h-[6vh] w-[95vw] items-center justify-between rounded-[10px] bg-[#f05a24] p-[15px] shadow-md">
              <div 
                onClick={() => setIsBillSheetOpen(true)}
                className="cart-button text-[16px] text-white font-bold flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                title="Click to view detailed Bill Summary"
              >
                <span>Update Order - {grandTotal.toFixed(2)} Rs</span>
                <span className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                  <FileText size={13} />
                  <span>Bill Summary ({taxRate}% GST)</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowCancelModal(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDirectUpdateOrderInCart}
                  disabled={updating}
                  className="bg-white text-[#f05a24] hover:bg-gray-100 font-bold px-4 py-1.5 rounded-lg text-xs transition-all cursor-pointer border border-white/40 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Order →'}
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="cart-footer hidden md:flex fixed bottom-[2.5vh] ml-[2.5vw] h-[6vh] w-[95vw] items-center justify-between rounded-[10px] bg-[#f05a24] p-[15px] shadow-md"
            >
              <div 
                onClick={() => setIsBillSheetOpen(true)}
                className="cart-button text-[16px] text-white font-bold flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                title="Click to view detailed Bill Summary"
              >
                <span>Confirm Order - {grandTotal.toFixed(2)} Rs</span>
                <span className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                  <FileText size={13} />
                  <span>Bill Summary ({taxRate}% GST)</span>
                </span>
              </div>
              <Link 
                to="/order-info" 
                className="bg-white text-[#f05a24] hover:bg-gray-100 font-bold px-5 py-2 rounded-lg text-sm transition-all no-underline shadow-md border border-white/40 flex items-center gap-1.5"
              >
                <span>Confirm Order</span>
                <span className="text-lg font-bold">→</span>
              </Link>
            </div>
          )}
        </>
      )}

      {/* Unified Bill Summary Modal Component */}
      <BillSummaryModal 
        isOpen={isBillSheetOpen}
        onClose={() => setIsBillSheetOpen(false)}
        subtotal={subtotal}
        taxRate={taxRate}
        cgstAmt={cgstAmt}
        sgstAmt={sgstAmt}
        serviceChargeRate={serviceChargeRate}
        serviceChargeAmt={serviceChargeAmt}
        grandTotal={grandTotal}
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="modalcart fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="modal-content-cart w-full max-w-[400px] rounded-[8px] bg-white p-[20px] text-center shadow-lg">
            <span 
              className="close float-right cursor-pointer text-[24px]" 
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </span>
            <h3 className="text-[16px] font-bold">{cart[selectedItemId]?.name}</h3>
            <textarea 
              id="notes-textarea"
              defaultValue={cart[selectedItemId]?.notes || ''}
              className="modalinput mt-[2vh] h-[20vh] w-full rounded-[5px] border border-[#ccc] p-[8px] outline-none focus:border-[#f05a24]" 
              placeholder="Enter your instruction"
            ></textarea>
            <button 
              className="submit-btn mt-[2vh] w-full rounded-[5px] bg-[#f05a24] hover:bg-[#d94815] p-[8px_12px] text-white transition-colors"
              onClick={() => {
                const el = document.getElementById('notes-textarea') as HTMLTextAreaElement;
                setItemNotes(selectedItemId, el?.value || '');
                setIsModalOpen(false);
              }}
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Modal for Clear Cart Confirmation */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setIsClearModalOpen(false)}>
          <div className="w-full max-w-[340px] rounded-2xl bg-white p-5 text-center shadow-2xl space-y-4 animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 size={22} className="text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Clear all cart items?</h3>
              <p className="text-xs text-gray-500 mt-1">This will remove all selected dishes from your cart.</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button 
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearCart}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
              >
                Clear Cart
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
                disabled={cancelling}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                No, Keep Order
              </button>
              <button 
                onClick={handleConfirmCancelOrder}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {cancelling ? (
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

export default CartPage;
