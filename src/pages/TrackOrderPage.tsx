import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Search, Clock, ChefHat, CheckCircle2, Utensils, AlertTriangle, ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
import Header from '../components/Header';
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

  // Sync state if query string changes
  useEffect(() => {
    const urlId = queryParams.get('id') || queryParams.get('order_id') || queryParams.get('track_id') || '';
    if (urlId) {
      setSearchId(urlId);
      setActiveOrderId(urlId);
    } else {
      // Fallback to last order stored in session if no ID in URL
      const savedLast = localStorage.getItem('emenu_last_order');
      if (savedLast) {
        try {
          const parsed = JSON.parse(savedLast);
          if (parsed?.order_id) {
            const cleanId = String(parsed.order_id).replace(/^#/i, '');
            setSearchId(cleanId);
            setActiveOrderId(cleanId);
          }
        } catch {}
      }
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
        // If not found in backend list, check local storage last order
        const savedLast = localStorage.getItem('emenu_last_order');
        if (savedLast) {
          const parsed = JSON.parse(savedLast);
          if (String(parsed.order_id).replace(/^#/i, '').trim() === cleanId) {
            setOrder(parsed);
            setError(null);
            if (showLoader) setLoading(false);
            return;
          }
        }
        setOrder(null);
        setError(`Order #${cleanId} not found. Please check your Order ID.`);
      }
    } catch (err: any) {
      console.error('Failed to fetch tracking order:', err);
      // Fallback check local storage
      const savedLast = localStorage.getItem('emenu_last_order');
      if (savedLast) {
        try {
          const parsed = JSON.parse(savedLast);
          if (String(parsed.order_id).replace(/^#/i, '').trim() === cleanId) {
            setOrder(parsed);
            setError(null);
          }
        } catch {}
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
    navigate(`/track-order?id=${clean}`, { replace: true });
  };

  // Helper to map order status string to step index (0 to 3)
  const getStepIndex = (statusStr?: string) => {
    const s = String(statusStr || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'PAID' || s === 'SERVED') return 3;
    if (s === 'READY') return 2;
    if (s === 'PREPARING' || s === 'CONFIRMED' || s === 'IN_PROGRESS' || s === 'KITCHEN') return 1;
    return 0; // PENDING / PLACED / ACTIVE
  };

  const isCancelled = order && (String(order.order_status || order.status || '').toUpperCase() === 'CANCELLED' || String(order.order_status || order.status || '').toUpperCase() === 'REJECTED');
  const currentStep = order ? getStepIndex(order.order_status || order.status) : 0;

  const steps = [
    { title: 'Order Placed', desc: 'Received by restaurant', icon: Utensils },
    { title: 'Preparing', desc: 'Chef cooking in kitchen', icon: ChefHat },
    { title: 'Ready to Serve', desc: 'Food is prepared & ready', icon: Clock },
    { title: 'Completed', desc: 'Served & payment complete', icon: CheckCircle2 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Navigation & Search Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all cursor-pointer shadow-2xs"
              title="Back to Menu"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Real-Time Order Tracking</h1>
              <p className="text-xs text-gray-500 font-medium">Track live kitchen & serving updates</p>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Order ID..."
                className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] shadow-2xs"
              />
              <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-[#0077b6] hover:bg-[#005f92] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
            >
              Track
            </button>
          </form>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center shadow-xs mb-6">
            <RefreshCw size={28} className="animate-spin text-[#0077b6] mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-800">Fetching live status...</p>
          </div>
        )}

        {/* Error / Not Found Message */}
        {error && !loading && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 text-center shadow-xs mb-6">
            <AlertTriangle size={32} className="text-rose-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-rose-900 mb-1">Order Not Found</h3>
            <p className="text-xs text-rose-700 font-medium mb-4">{error}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0077b6] text-white text-xs font-bold rounded-xl shadow-md no-underline"
            >
              Browse Menu View →
            </Link>
          </div>
        )}

        {/* Live Tracking Card */}
        {order && !loading && (
          <div className="space-y-6">
            {/* Card Header Summary */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Order ID</span>
                  <span className="text-base font-black text-[#0077b6]">#{String(order.order_id).replace(/^#/i, '')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <span>Table: <strong className="text-gray-900">{order.table_name || order.table_number || 'Walk-In'}</strong></span>
                  <span>•</span>
                  <span>{order.created_at || order.time ? new Date(order.created_at || order.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchOrderDetails(activeOrderId, true)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Refresh Live Status"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>Sync</span>
                </button>
                <OrderStatusBadge status={order.order_status || order.status} />
              </div>
            </div>

            {/* Cancelled Alert Box */}
            {isCancelled ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center shadow-xs">
                <XCircle size={36} className="text-rose-600 mx-auto mb-2" />
                <h3 className="text-base font-black text-rose-900 mb-1">Order Cancelled</h3>
                <p className="text-xs text-rose-700 font-medium">This order has been cancelled by the restaurant or staff.</p>
              </div>
            ) : (
              /* Real-Time Stepper Progress Timeline */
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-6">
                  Live Preparation Status
                </h3>

                <div className="relative flex flex-col sm:flex-row justify-between gap-6 sm:gap-0">
                  {/* Desktop Connecting Line Background */}
                  <div className="hidden sm:block absolute top-5 left-[10%] right-[10%] h-1 bg-gray-200 -z-0" />
                  {/* Desktop Active Connecting Progress Line */}
                  <div
                    className="hidden sm:block absolute top-5 left-[10%] h-1 bg-emerald-500 transition-all duration-500 -z-0"
                    style={{ width: `${(currentStep / 3) * 80}%` }}
                  />

                  {steps.map((step, idx) => {
                    const isDone = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    const IconComp = step.icon;

                    return (
                      <div key={idx} className="relative z-10 flex sm:flex-col items-center gap-3 sm:gap-2 sm:text-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                          isDone 
                            ? isCurrent
                              ? 'bg-[#0077b6] text-white ring-4 ring-[#0077b6]/20 scale-110'
                              : 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}>
                          <IconComp size={18} className={isCurrent ? 'animate-pulse' : ''} />
                        </div>

                        <div>
                          <h4 className={`text-xs font-bold ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.title}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-medium">
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
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
                  Ordered Items ({order.items.length})
                </h3>

                <div className="space-y-2.5">
                  {order.items.map((item: any, idx: number) => {
                    const itemPrice = parseFloat(item.unit_price || item.price || 0);
                    const itemQty = parseInt(item.quantity || 1, 10);
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-gray-50 last:border-0">
                        <div>
                          <span className="font-bold text-gray-900">{item.name || item.item_name}</span>
                          <span className="text-gray-500 font-semibold ml-2">× {itemQty}</span>
                        </div>
                        <span className="font-bold text-gray-900">₹{(itemPrice * itemQty).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Grand Total Footer */}
                <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center text-sm font-extrabold text-gray-900">
                  <span>Grand Total</span>
                  <span className="text-[#0077b6] text-base font-black">₹{parseFloat(order.bill?.grand_total || order.grand_total || order.total || 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                to="/"
                className="flex-1 py-3 bg-[#0077b6] hover:bg-[#005f92] text-white font-bold text-xs rounded-xl shadow-md text-center no-underline transition-all active:scale-98"
              >
                Order More Items →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderPage;
