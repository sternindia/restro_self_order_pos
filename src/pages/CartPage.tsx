import React, { useState, useEffect } from 'react';
import { Trash2, ShoppingBag, ArrowLeft, Pencil, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL, getRestaurantId } from '../config';
import BillSummaryModal from '../components/BillSummaryModal';
import { printThermalReceiptDirect } from '../components/ReceiptBillPrint';
import MobileCartPage from '../mobileview/MobileCartPage';
import DesktopLayout from '../components/DesktopLayout';
import { useTheme } from '../context/ThemeContext';

const CartPage: React.FC = () => {
  const { isDark } = useTheme();
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
  const [discountInput, setDiscountInput] = useState("");
  const cartItems = Object.values(cart);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceChargeRate = posSettings.serviceCharge || 0.0;
  const serviceChargeAmt = isServiceChargeIncluded ? (subtotal * serviceChargeRate) / 100 : 0.0;
  const taxRate = posSettings.taxRate || 5.0;
  const taxAmt = (subtotal * taxRate) / 100;
  const cgstAmt = taxAmt / 2;
  const sgstAmt = taxAmt / 2;
  const discountAmt = Math.min(Math.max(parseFloat(discountInput) || 0, 0), subtotal + serviceChargeAmt + taxAmt);
  const grandTotal = subtotal + serviceChargeAmt + taxAmt - discountAmt;

  const [orderType, setOrderType] = useState<"Dine In" | "Takeaway" | "Delivery">("Dine In");

  const getFoodItemImage = (item: any): string => {
    const fallback = isDark ? "/images/dark_default_image.png" : "/images/default_image.png";
    const img = item.image || item.image_url;
    if (!img || typeof img !== "string" || img.trim() === "" || img.includes("default_image.png")) {
      return fallback;
    }
    return img;
  };


  return (
    <>
      {/* MOBILE VIEW (< md) */}
      <div className="block md:hidden">
        <MobileCartPage
          cartItems={cartItems}
          subtotal={subtotal}
          taxRate={taxRate}
          taxAmt={taxAmt}
          cgstAmt={cgstAmt}
          sgstAmt={sgstAmt}
          serviceChargeRate={serviceChargeRate}
          serviceChargeAmt={serviceChargeAmt}
          grandTotal={grandTotal}
          onUpdateQuantity={(id, change) => updateQty(id, change)}
          onRemoveItem={(id) => removeItem(id)}
          onClearCart={() => setIsClearModalOpen(true)}
          onProceed={() => {
            if (isSelfPosBilling) {
              handleSelfPosPlaceOrder();
            } else if (!isGuestCustomer && existingOrderId) {
              handleDirectUpdateOrderInCart();
            } else {
              navigate('/order-info');
            }
          }}
          isSelfPosBilling={isSelfPosBilling}
          submittingBilling={submittingBilling}
          existingOrderId={existingOrderId}
          updating={updating}
          onCancelOrder={() => setShowCancelModal(true)}
          isGuestCustomer={isGuestCustomer}
        />
      </div>

      {/* DESKTOP VIEW (>= md) */}
      <div className="hidden md:block">
        <DesktopLayout activePage="Cart">
          <div className="px-6 py-4 w-full space-y-4">
            
            {/* Header with Order Type tabs & Clear All */}
            <div className="flex items-center justify-between bg-white dark:bg-[#1a1b24] px-5 py-3 rounded-2xl border border-[#eee9e4] dark:border-[#262834] shadow-xs">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate(-1)} 
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#252836] text-slate-700 dark:text-[#cbd5e1] hover:bg-slate-200 dark:hover:bg-[#2d3142] transition cursor-pointer"
                  title="Go Back"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Your Order Cart</span>
                    {cartItems.length > 0 && (
                      <span className="text-[11px] bg-[#ff5520]/15 text-[#ff5520] font-semibold px-2.5 py-0.5 rounded-full">
                        {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                      </span>
                    )}
                  </h2>
                </div>
              </div>

              {/* Order Type Tabs */}
              <div className="flex items-center gap-1 bg-[#eeecea] dark:bg-[#121318] p-1 rounded-xl border border-transparent dark:border-[#262834]">
                {(["Dine In", "Takeaway", "Delivery"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setOrderType(type);
                      try {
                        sessionStorage.setItem("emenu_order_type", type.toUpperCase());
                      } catch { }
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      orderType === type
                        ? "bg-[#ff5520] text-white shadow-xs"
                        : "text-[#556070] dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {cartItems.length > 0 && (
                <button 
                  onClick={() => setIsClearModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Trash2 size={14} />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="bg-white dark:bg-[#1a1b24] rounded-2xl border border-[#eee9e4] dark:border-[#262834] p-16 text-center space-y-4 flex flex-col items-center shadow-xs">
                <div className="w-20 h-20 bg-[#fff1e9] dark:bg-[#ff5520]/15 border border-[#ff5520]/20 rounded-full flex items-center justify-center shadow-2xs">
                  <ShoppingBag size={36} className="text-[#ff5520]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your cart is empty</h3>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1 max-w-sm mx-auto">Add some delicious dishes from our menu to get started with your order.</p>
                </div>
                <Link 
                  to="/" 
                  className="inline-flex items-center gap-2 bg-[#ff5520] hover:bg-[#e04515] active:scale-95 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md transition-all no-underline mt-2"
                >
                  <span>Explore Menu</span>
                  <span>→</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                
                {/* LEFT COLUMN (2 Cols): Items List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white dark:bg-[#1a1b24] rounded-2xl border border-[#eee9e4] dark:border-[#262834] p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262834]">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Selected Items</h3>
                      <Link 
                        to="/" 
                        className="text-xs font-bold text-[#ff5520] hover:underline flex items-center gap-1 no-underline"
                      >
                        <Plus size={14} />
                        <span>Add More Items</span>
                      </Link>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-[#262834]">
                      {cartItems.map((item) => (
                        <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                          {/* Image & Info */}
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            <img 
                              src={getFoodItemImage(item)} 
                              alt={item.name}
                              className="w-13 h-13 rounded-xl object-cover border border-slate-100 dark:border-[#2b2e3c] shrink-0 bg-slate-50 dark:bg-[#222430]"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = isDark ? "/images/dark_default_image.png" : "/images/default_image.png";
                              }}
                            />
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={item.isVeg ? "/images/veg.png" : "/images/nonVeg.png"} 
                                  alt={item.isVeg ? "Veg" : "Non-Veg"} 
                                  className="h-4 w-4 object-contain shrink-0"
                                />
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-[#f1f5f9] truncate">
                                  {item.name}
                                </h4>
                              </div>

                              <div className="text-xs text-slate-500 dark:text-[#94a3b8] font-normal">
                                ₹{parseFloat(item.price || 0).toFixed(2)} each
                              </div>

                              {item.notes && (
                                <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg px-2.5 py-1 mt-1 flex items-start gap-1">
                                  <span className="font-semibold shrink-0">Note:</span>
                                  <span className="italic break-words">"{item.notes}"</span>
                                </div>
                              )}

                              <button 
                                onClick={() => openModal(item.id)}
                                className="mt-1 cursor-pointer text-[11px] font-medium text-slate-500 dark:text-[#94a3b8] hover:text-[#ff5520] dark:hover:text-[#ff5520] flex items-center gap-1 transition-colors"
                              >
                                <Pencil size={12} />
                                <span className="underline underline-offset-2">{item.notes ? 'Edit instruction' : '+ Special instruction'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Quantity Stepper & Subtotal */}
                          <div className="flex items-center gap-6 shrink-0">
                            {/* Stepper */}
                            <div className="flex items-center rounded-xl border border-slate-200 dark:border-[#323646] bg-slate-50 dark:bg-[#222531] p-1">
                              <button 
                                onClick={() => updateQty(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-[#cbd5e1] hover:bg-slate-200 dark:hover:bg-[#2e3242] rounded-lg cursor-pointer transition"
                              >
                                −
                              </button>
                              <span className="text-xs font-bold px-3 text-slate-900 dark:text-white min-w-[24px] text-center">
                                {item.quantity}
                              </span>
                              <button 
                                onClick={() => updateQty(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-sm font-bold text-[#ff5520] hover:bg-[#ff5520]/10 rounded-lg cursor-pointer transition"
                              >
                                +
                              </button>
                            </div>

                            {/* Item Subtotal */}
                            <div className="text-right min-w-[80px]">
                              <div className="text-[11px] text-slate-400 dark:text-[#94a3b8] font-medium">Total</div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white">
                                ₹{(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                              </div>
                            </div>

                            {/* Remove button */}
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN (1 Col): Order Summary Card */}
                <div className="lg:col-span-1 bg-white dark:bg-[#1a1b24] rounded-2xl border border-[#eee9e4] dark:border-[#262834] p-5 shadow-xs space-y-3.5 sticky top-24">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262834]">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bill Summary</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full border border-emerald-200/60 dark:border-emerald-900/40">
                      {orderType}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-[#94a3b8] font-medium">Item Subtotal</span>
                      <span className="font-semibold text-slate-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
                    </div>

                    {serviceChargeAmt > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-[#94a3b8] font-medium">Service Charge ({serviceChargeRate}%)</span>
                        <span className="font-semibold text-slate-900 dark:text-white">₹{serviceChargeAmt.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-[#94a3b8] font-medium">CGST ({(taxRate / 2).toFixed(1)}%)</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">+₹{cgstAmt.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-[#94a3b8] font-medium">SGST ({(taxRate / 2).toFixed(1)}%)</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">+₹{sgstAmt.toFixed(2)}</span>
                    </div>

                    {/* Discount Row */}
                    <div className="flex justify-between items-center gap-2 pt-1">
                      <label className="text-slate-600 dark:text-[#94a3b8] font-medium shrink-0">Discount (₹)</label>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 dark:text-[#64748b] text-[11px]">-</span>
                        <input
                          type="number"
                          min="0"
                          value={discountInput}
                          onChange={(e) => setDiscountInput(e.target.value)}
                          placeholder="0"
                          className="w-20 text-right text-xs font-semibold px-2 py-1 rounded-md border border-slate-300 dark:border-[#333748] bg-white dark:bg-[#121318] text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    {discountAmt > 0 && (
                      <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Discount Applied</span>
                        <span>-₹{discountAmt.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-200 dark:border-[#2f3342] flex justify-between items-baseline">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">To Pay (Grand Total)</span>
                      <span className="text-lg font-black text-[#ff5520]">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Primary Action Button directly inside the Summary Card */}
                  <div className="pt-2">
                    {isSelfPosBilling ? (
                      <button 
                        onClick={handleSelfPosPlaceOrder}
                        disabled={submittingBilling}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold rounded-xl shadow-md text-sm transition-all cursor-pointer border border-emerald-700/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submittingBilling ? (
                          <span>Generating Bill...</span>
                        ) : (
                          <>
                            <span>⚡ Confirm & Print Bill</span>
                            <span>→</span>
                          </>
                        )}
                      </button>
                    ) : !isGuestCustomer && existingOrderId ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowCancelModal(true)}
                          className="py-3 px-4 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleDirectUpdateOrderInCart}
                          disabled={updating}
                          className="flex-1 py-3 bg-[#ff5520] hover:bg-[#e04515] active:scale-98 text-white font-extrabold rounded-xl shadow-md text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {updating ? 'Updating...' : `Update Order #${existingOrderId}`}
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => navigate('/order-info')}
                        className="w-full py-3.5 bg-[#ff5520] hover:bg-[#e04515] active:scale-98 text-white font-extrabold rounded-xl shadow-md text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Confirm Order</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        </DesktopLayout>
      </div>

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
        <div className="modalcart fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="modal-content-cart w-full max-w-[400px] rounded-2xl bg-white dark:bg-[#1a1b24] border border-slate-100 dark:border-[#262834] p-5 text-center shadow-2xl space-y-3">
            <span 
              className="close float-right cursor-pointer text-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition" 
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{cart[selectedItemId]?.name}</h3>
            <textarea 
              id="notes-textarea"
              defaultValue={cart[selectedItemId]?.notes || ''}
              className="modalinput mt-2 h-[120px] w-full rounded-xl border border-slate-200 dark:border-[#323646] bg-slate-50 dark:bg-[#121318] p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-[#ff5520]" 
              placeholder="Enter special cooking instruction..."
            ></textarea>
            <button 
              className="submit-btn w-full rounded-xl bg-[#ff5520] hover:bg-[#e04515] py-2.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-md"
              onClick={() => {
                const el = document.getElementById('notes-textarea') as HTMLTextAreaElement;
                setItemNotes(selectedItemId, el?.value || '');
                setIsModalOpen(false);
              }}
            >
              Save Instruction
            </button>
          </div>
        </div>
      )}

      {/* Modal for Clear Cart Confirmation */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in" onClick={() => setIsClearModalOpen(false)}>
          <div className="w-full max-w-[340px] rounded-2xl bg-white dark:bg-[#1a1b24] border border-slate-100 dark:border-[#262834] p-5 text-center shadow-2xl space-y-4 animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Clear all cart items?</h3>
              <p className="text-xs text-gray-500 dark:text-[#94a3b8] mt-1">This will remove all selected dishes from your cart.</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button 
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-2 bg-gray-100 dark:bg-[#252836] hover:bg-gray-200 dark:hover:bg-[#2d3142] text-gray-700 dark:text-[#cbd5e1] rounded-xl text-xs font-bold cursor-pointer transition-all"
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
          <div className="w-full max-w-[340px] rounded-2xl bg-white dark:bg-[#1a1b24] border border-slate-100 dark:border-[#262834] p-6 text-center shadow-2xl space-y-4 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <Trash2 size={26} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Cancel Order #{existingOrderId}?</h3>
              <p className="text-xs text-gray-500 dark:text-[#94a3b8] mt-1.5 leading-relaxed">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button 
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-[#252836] hover:bg-gray-200 dark:hover:bg-[#2d3142] text-gray-700 dark:text-[#cbd5e1] rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
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
    </>
  );
};

export default CartPage;
