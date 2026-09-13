import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Clock,
  ChefHat,
  CheckCircle2,
  Utensils,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  XCircle,
  ShoppingBag,
} from 'lucide-react';
import DesktopLayout from '../components/DesktopLayout';
import { MobileHeader, MobileFooter } from '../components/mobile';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { API_BASE_URL } from '../config';

const TrackOrderPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialId = queryParams.get('id') || queryParams.get('order_id') || queryParams.get('track_id') || '';

  const [searchId, setSearchId] = useState(initialId);
  const [activeOrderId, setActiveOrderId] = useState(initialId);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recentOrder = (() => {
    try {
      const savedLast = localStorage.getItem('emenu_last_order');
      return savedLast ? JSON.parse(savedLast) : null;
    } catch {
      return null;
    }
  })();

  // Sync state if query string changes
  useEffect(() => {
    const urlId = queryParams.get('id') || queryParams.get('order_id') || queryParams.get('track_id') || '';
    if (urlId) {
      setSearchId(urlId);
      setActiveOrderId(urlId);
    } else if (recentOrder?.order_id) {
      const cleanId = String(recentOrder.order_id).replace(/^#/i, '');
      setSearchId(cleanId);
      setActiveOrderId(cleanId);
    }
  }, [location.search]);

  // Real-time Live Polling Function to fetch order details from backend
  const fetchOrderDetails = async (targetId: string, showLoader = false) => {
    if (!targetId.trim()) return;
    const cleanId = targetId.replace(/^#/i, '').trim();

    if (showLoader) setLoading(true);
    setError(null);

    try {
      const savedUserStr = localStorage.getItem('emenu_user');
      const userObj = savedUserStr ? JSON.parse(savedUserStr) : null;
      const rid = userObj?.restaurant_id || userObj?.restaurent_id || 9;

      const res = await fetch(`${API_BASE_URL}/orders/${rid}`);
      if (!res.ok) throw new Error(`HTTP Error! Status: ${res.status}`);

      const data = await res.json();
      const rawOrders = Array.isArray(data) ? data : (data?.data || []);
      const matched = rawOrders.find((o: any) => String(o.order_id).replace(/^#/i, '').trim() === cleanId);

      if (matched) {
        setOrder(matched);
        setError(null);
      } else {
        // Fallback check local storage last order
        if (recentOrder && String(recentOrder.order_id).replace(/^#/i, '').trim() === cleanId) {
          setOrder(recentOrder);
          setError(null);
          if (showLoader) setLoading(false);
          return;
        }
        setOrder(null);
        setError(`Order #${cleanId} not found. Please verify your Order ID.`);
      }
    } catch (err: any) {
      console.error('Failed to fetch tracking order:', err);
      if (recentOrder && String(recentOrder.order_id).replace(/^#/i, '').trim() === cleanId) {
        setOrder(recentOrder);
        setError(null);
      } else {
        setError('Network error while checking status. Retrying...');
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Initial fetch and 5-second live polling loop
  useEffect(() => {
    if (activeOrderId) {
      fetchOrderDetails(activeOrderId, true);
      const interval = setInterval(() => {
        fetchOrderDetails(activeOrderId, false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeOrderId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    const clean = searchId.replace(/^#/i, '').trim();
    setActiveOrderId(clean);
    navigate(`/track?id=${clean}`, { replace: true });
  };

  // Helper to map order status string to step index (0 to 3)
  const getStepIndex = (statusStr?: string) => {
    const s = String(statusStr || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'PAID' || s === 'SERVED') return 3;
    if (s === 'READY') return 2;
    if (s === 'PREPARING' || s === 'CONFIRMED' || s === 'IN_PROGRESS' || s === 'KITCHEN') return 1;
    return 0; // PENDING / PLACED / ACTIVE
  };

  const isCancelled =
    order &&
    (String(order.order_status || order.status || '').toUpperCase() === 'CANCELLED' ||
      String(order.order_status || order.status || '').toUpperCase() === 'REJECTED');
  const currentStep = order ? getStepIndex(order.order_status || order.status) : 0;

  const steps = [
    { title: 'Order Placed', desc: 'Received by kitchen', icon: Utensils },
    { title: 'Preparing', desc: 'Chef cooking your meal', icon: ChefHat },
    { title: 'Ready to Serve', desc: 'Food is prepared & plated', icon: Clock },
    { title: 'Completed', desc: 'Served & order closed', icon: CheckCircle2 },
  ];

  const renderTrackBody = (isMobile: boolean = false) => (
    <div className={isMobile ? 'px-3.5 py-3.5 pb-24 space-y-3.5 max-w-2xl mx-auto' : 'px-6 py-5 space-y-4 w-full'}>



        {/* Search Bar matching theme */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] px-3 shadow-[0_1px_4px_rgba(16,24,40,0.03)] focus-within:border-[#ff5520] transition">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Order ID (e.g. 1042)..."
              className="w-full bg-transparent text-[12.5px] font-medium text-slate-800 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>
          <button
            type="submit"
            className="flex h-10 px-4 items-center justify-center rounded-xl bg-[#ff5520] hover:bg-[#e04800] active:scale-95 text-white text-[12px] font-medium shadow-xs transition cursor-pointer shrink-0"
          >
            Track
          </button>
        </form>

        {/* Loading Indicator */}
        {loading && (
          <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] p-6 text-center shadow-xs">
            <RefreshCw size={24} className="animate-spin text-[#ff5520] mx-auto mb-2" />
            <p className="text-[12.5px] font-medium text-slate-800 dark:text-zinc-200">
              Fetching live kitchen status...
            </p>
          </div>
        )}

        {/* Error / Not Found Message */}
        {error && !loading && (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 p-4 text-center shadow-xs">
            <AlertTriangle size={24} className="text-rose-500 mx-auto mb-1.5" />
            <h3 className="text-[13px] font-semibold text-rose-900 dark:text-rose-300 mb-0.5">
              Order Not Found
            </h3>
            <p className="text-[11.5px] text-rose-700 dark:text-rose-400 mb-3">{error}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ff5520] hover:bg-[#e04800] text-white text-[11.5px] font-medium rounded-xl shadow-xs no-underline transition active:scale-95"
            >
              Explore Menu →
            </Link>
          </div>
        )}

        {/* No active order selected yet (empty state + recent order card) */}
        {!order && !loading && !error && (
          <div className="space-y-3">
            {recentOrder && recentOrder.order_id && (
              <div className="rounded-2xl border border-orange-200/80 dark:border-orange-900/40 bg-[#fff9f6] dark:bg-[#ff5520]/10 p-3.5 transition-all shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-[#ff5520] flex items-center gap-1">
                    <Clock size={13} /> Recent Order Found
                  </span>
                  <span className="text-[12px] font-semibold text-slate-800 dark:text-zinc-100">
                    #{String(recentOrder.order_id).replace(/^#/i, '')}
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-600 dark:text-zinc-400 mb-2.5">
                  Table {recentOrder.table || 'Walk-In'} • {recentOrder.items?.length || 0} items • ₹{parseFloat(recentOrder.total || 0).toFixed(2)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const clean = String(recentOrder.order_id).replace(/^#/i, '');
                    setSearchId(clean);
                    setActiveOrderId(clean);
                    navigate(`/track?id=${clean}`, { replace: true });
                  }}
                  className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl bg-[#ff5520] text-white text-[11.5px] font-medium shadow-xs active:scale-98 transition cursor-pointer hover:bg-[#e04800]"
                >
                  Track This Order
                </button>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] p-6 text-center shadow-xs">
              <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1e9] dark:bg-[#ff5520]/20 text-[#ff5520]">
                <Clock size={20} />
              </div>
              <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">
                Live Kitchen Status
              </h3>
              <p className="mt-0.5 text-[11.5px] text-slate-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Enter your Order ID from your receipt or click the recent order above to view real-time status.
              </p>
              <Link
                to="/"
                className="mt-3.5 inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-xl bg-[#ff5520] text-white text-[11.5px] font-medium shadow-xs transition active:scale-95 no-underline hover:bg-[#e04800]"
              >
                <ShoppingBag size={13} />
                <span>Explore Menu</span>
              </Link>
            </div>
          </div>
        )}

        {/* Live Tracking Card */}
        {order && !loading && (
          <div className="space-y-3.5">
            {/* Order Header Badge Card */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10.5px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Order
                  </span>
                  <span className="text-[14px] font-semibold text-[#ff5520]">
                    #{String(order.order_id).replace(/^#/i, '')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11.5px] font-medium text-slate-600 dark:text-zinc-400">
                  <span>
                    Table:{' '}
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {order.table_name || order.table_number || order.table || 'Walk-In'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    {order.created_at || order.time
                      ? new Date(order.created_at || order.time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Just Now'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fetchOrderDetails(activeOrderId, true)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition cursor-pointer active:scale-95"
                  title="Sync Status"
                  aria-label="Sync"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                </button>
                <OrderStatusBadge status={order.order_status || order.status} />
              </div>
            </div>

            {/* Cancelled Alert Box */}
            {isCancelled ? (
              <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 p-5 text-center shadow-xs">
                <XCircle size={32} className="text-rose-600 mx-auto mb-1.5" />
                <h3 className="text-[13.5px] font-semibold text-rose-900 dark:text-rose-300 mb-0.5">
                  Order Cancelled
                </h3>
                <p className="text-[11.5px] text-rose-700 dark:text-rose-400">
                  This order was cancelled by the restaurant or staff.
                </p>
              </div>
            ) : (
              /* Real-Time Stepper Progress Timeline */
              <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] p-4 sm:p-5 shadow-xs">
                <h3 className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3.5">
                  Live Preparation Timeline
                </h3>

                <div className="space-y-3.5">
                  {steps.map((step, idx) => {
                    const isDone = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    const IconComp = step.icon;
                    const isLast = idx === steps.length - 1;

                    return (
                      <div key={idx} className="relative flex items-start gap-3">
                        {/* Connecting Line */}
                        {!isLast && (
                          <div
                            className={`absolute left-[17px] top-[30px] bottom-[-16px] w-[2px] transition-colors ${
                              idx < currentStep
                                ? 'bg-emerald-500'
                                : 'bg-slate-200 dark:bg-zinc-700'
                            }`}
                          />
                        )}

                        {/* Icon Node */}
                        <div
                          className={`relative z-10 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl transition-all ${
                            isDone
                              ? isCurrent
                                ? 'bg-[#ff5520] text-white shadow-[0_2px_8px_rgba(255,85,32,0.25)] ring-4 ring-[#ff5520]/20'
                                : 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border border-slate-200/80 dark:border-zinc-700'
                          }`}
                        >
                          <IconComp size={16} className={isCurrent ? 'animate-pulse' : ''} />
                        </div>

                        {/* Label */}
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <h4
                              className={`text-[12.5px] font-medium leading-tight ${
                                isDone
                                  ? 'text-slate-900 dark:text-white'
                                  : 'text-slate-400 dark:text-zinc-500'
                              }`}
                            >
                              {step.title}
                            </h4>
                            {isCurrent && (
                              <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-medium bg-[#fff1e9] text-[#ff5520] dark:bg-[#ff5520]/20">
                                In Progress
                              </span>
                            )}
                            {isDone && !isCurrent && (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                ✓
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Itemized Order Details */}
            {order.items && order.items.length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1f1f28] p-3.5 sm:p-4 shadow-xs space-y-2.5">
                <h3 className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider pb-1.5 border-b border-slate-100 dark:border-zinc-800">
                  Ordered Items ({order.items.length})
                </h3>

                <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {order.items.map((item: any, idx: number) => {
                    const itemPrice = parseFloat(item.unit_price || item.price || 0);
                    const itemQty = parseInt(item.quantity || 1, 10);
                    return (
                      <div key={idx} className="flex justify-between items-center text-[12px] pt-1.5 first:pt-0">
                        <div className="min-w-0 flex-1 truncate pr-2">
                          <span className="font-medium text-slate-800 dark:text-zinc-100">
                            {item.name || item.item_name}
                          </span>
                          <span className="text-slate-500 dark:text-zinc-400 ml-1.5">
                            × {itemQty}
                          </span>
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white shrink-0">
                          ₹{(itemPrice * itemQty).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Grand Total Footer */}
                <div className="pt-2 border-t border-dashed border-slate-200 dark:border-zinc-700 flex justify-between items-center text-[13px]">
                  <span className="font-medium text-slate-700 dark:text-zinc-300">Grand Total</span>
                  <span className="text-[#ff5520] font-semibold text-[14.5px]">
                    ₹{parseFloat(order.bill?.grand_total || order.grand_total || order.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex gap-2 pt-1">
              <Link
                to="/"
                className="flex-1 flex h-9 items-center justify-center gap-1.5 bg-[#ff5520] hover:bg-[#e04800] text-white text-[12px] font-medium rounded-xl shadow-xs no-underline transition active:scale-98"
              >
                <ShoppingBag size={14} />
                <span>Order More Items</span>
              </Link>
            </div>
          </div>
        )}
    </div>
  );

  return (
    <>
      {/* Mobile View (< md) */}
      <div className="block md:hidden min-h-screen bg-[#faf9f7] dark:bg-[#16161d] text-slate-800 dark:text-zinc-100">
        <MobileHeader title="Live Orders" />
        {renderTrackBody(true)}
        <MobileFooter activeTab="orders" />
      </div>

      {/* Desktop View (>= md) */}
      <div className="hidden md:block">
        <DesktopLayout activePage="Orders">
          {renderTrackBody(false)}
        </DesktopLayout>
      </div>
    </>
  );
};

export default TrackOrderPage;
