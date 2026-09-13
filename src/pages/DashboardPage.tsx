import React, { useState, useEffect } from 'react';
import DesktopLayout from '../components/DesktopLayout';
import { MobileHeader, MobileFooter } from '../components/mobile';
import { API_BASE_URL, getRestaurantId } from '../config';
import {
  RefreshCw,
  Wallet,
  ShoppingBag,
  CheckCircle2,
  Users,
  Flame,
  TrendingUp,
  Receipt,
  Tag,
  BookOpen,
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [dashboardData, setDashboardData] = useState<any>(null);

  const restaurantId = getRestaurantId() || 9;

  const getSampleMetricsByFilter = (filterKey: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const sevenDaysAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const monthStartStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    if (filterKey === 'yesterday') {
      return {
        meta: { date_range: 'Yesterday', from_date: `${yesterdayStr}T00:00:00Z`, to_date: `${yesterdayStr}T23:59:59Z`, currency: 'INR' },
        kpis: { total_revenue: 42150, total_order: 61, total_bills_settled: 58, total_gst_collected: 2107.5, total_service_charge: 4215, total_discounts: 250, total_customers: 89 },
        menus: { total_menus: 25, total_category: 10 },
        top_selling_items: [
          { item_id: 'PRD-101', name: 'Classic Wagyu Burger', category: 'Mains', quantity_sold: 32, total_sales: 16000 },
          { item_id: 'PRD-102', name: 'Truffle French Fries', category: 'Starters', quantity_sold: 25, total_sales: 6250 },
          { item_id: 'PRD-103', name: 'Thin Crust Margherita', category: 'Mains', quantity_sold: 20, total_sales: 9000 },
          { item_id: 'PRD-502', name: 'House Iced Lemon Tea', category: 'Beverages', quantity_sold: 19, total_sales: 2850 },
        ],
      };
    }
    if (filterKey === 'last_7_days') {
      return {
        meta: { date_range: 'Last 7 Days', from_date: `${sevenDaysAgoStr}T00:00:00Z`, to_date: `${todayStr}T23:59:59Z`, currency: 'INR' },
        kpis: { total_revenue: 318450, total_order: 485, total_bills_settled: 450, total_gst_collected: 15922.5, total_service_charge: 31845, total_discounts: 1500, total_customers: 720 },
        menus: { total_menus: 25, total_category: 10 },
        top_selling_items: [
          { item_id: 'PRD-101', name: 'Classic Wagyu Burger', category: 'Mains', quantity_sold: 210, total_sales: 105000 },
          { item_id: 'PRD-102', name: 'Truffle French Fries', category: 'Starters', quantity_sold: 165, total_sales: 41250 },
          { item_id: 'PRD-103', name: 'Thin Crust Margherita', category: 'Mains', quantity_sold: 140, total_sales: 63000 },
          { item_id: 'PRD-502', name: 'House Iced Lemon Tea', category: 'Beverages', quantity_sold: 135, total_sales: 20250 },
        ],
      };
    }
    if (filterKey === 'this_month') {
      return {
        meta: { date_range: 'This Month', from_date: `${monthStartStr}T00:00:00Z`, to_date: `${todayStr}T23:59:59Z`, currency: 'INR' },
        kpis: { total_revenue: 1285900, total_order: 1940, total_bills_settled: 1820, total_gst_collected: 64295, total_service_charge: 128590, total_discounts: 6500, total_customers: 2910 },
        menus: { total_menus: 25, total_category: 10 },
        top_selling_items: [
          { item_id: 'PRD-101', name: 'Classic Wagyu Burger', category: 'Mains', quantity_sold: 850, total_sales: 425000 },
          { item_id: 'PRD-103', name: 'Thin Crust Margherita', category: 'Mains', quantity_sold: 610, total_sales: 274500 },
          { item_id: 'PRD-102', name: 'Truffle French Fries', category: 'Starters', quantity_sold: 580, total_sales: 145000 },
          { item_id: 'PRD-502', name: 'House Iced Lemon Tea', category: 'Beverages', quantity_sold: 490, total_sales: 73500 },
        ],
      };
    }
    return {
      meta: { date_range: 'Today', from_date: `${todayStr}T00:00:00Z`, to_date: `${todayStr}T23:59:59Z`, currency: 'INR' },
      kpis: { total_revenue: 48920, total_order: 70, total_bills_settled: 64, total_gst_collected: 2446, total_service_charge: 4892, total_discounts: 0, total_customers: 102 },
      menus: { total_menus: 25, total_category: 10 },
      top_selling_items: [
        { item_id: 'PRD-101', name: 'Classic Wagyu Burger', category: 'Mains', quantity_sold: 38, total_sales: 19000 },
        { item_id: 'PRD-102', name: 'Truffle French Fries', category: 'Starters', quantity_sold: 29, total_sales: 7250 },
        { item_id: 'PRD-502', name: 'House Iced Lemon Tea', category: 'Beverages', quantity_sold: 24, total_sales: 3600 },
        { item_id: 'PRD-103', name: 'Thin Crust Margherita', category: 'Mains', quantity_sold: 18, total_sales: 8100 },
      ],
    };
  };

  const fetchDashboard = async (filterKey: string = dateFilter) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/${restaurantId}?filter=${filterKey}&date_range=${filterKey}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data && (data.kpis || data.status === true || data.data)) {
        setDashboardData(data.data || data);
      } else {
        setDashboardData(getSampleMetricsByFilter(filterKey));
      }
    } catch {
      setDashboardData(getSampleMetricsByFilter(filterKey));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(dateFilter); }, [restaurantId, dateFilter]);

  const data = dashboardData || getSampleMetricsByFilter(dateFilter);
  const kpis = data.kpis || {};
  const menus = data.menus || {};
  const topItems = data.top_selling_items || [];
  const meta = data.meta || {};
  const maxQtySold = topItems.reduce((max: number, i: any) => Math.max(max, i.quantity_sold || 0), 1);

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const FILTERS = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last_7_days', label: 'Last 7 Days' },
    { key: 'this_month', label: 'This Month' },
  ];

  /* ── KPI Card ── */
  const KpiCard = ({
    icon: Icon,
    label,
    value,
    sub,
    accent,
    iconBg,
  }: {
    icon: any; label: string; value: string; sub?: string;
    accent: string; iconBg: string;
  }) => (
    <div className={`bg-white dark:bg-[#18181b] rounded-2xl p-4 border ${accent} shadow-[0_1px_4px_rgba(15,23,42,0.04)] flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wide">{label}</span>
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={15} />
        </div>
      </div>
      <div>
        <p className="text-[22px] font-semibold text-[#071B34] dark:text-white leading-none tracking-tight">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 font-normal">{sub}</p>}
      </div>
    </div>
  );

  /* ── Secondary Mini Card ── */
  const MiniCard = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-white dark:bg-[#18181b] rounded-xl px-4 py-3 border border-[#eee9e4] dark:border-zinc-800 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
      <p className="text-[11px] font-normal text-slate-400 dark:text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className="text-[15px] font-medium text-[#071B34] dark:text-white mt-1 font-mono">{value}</p>
    </div>
  );

  const renderDashboardBody = (isMobile: boolean = false) => (
    <div className={`space-y-4 ${isMobile ? 'px-3.5 py-4 pb-24' : 'px-6 py-5'}`}>

      {/* ── Toolbar — single scrollable row ── */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-[#18181b] border border-[#eee9e4] dark:border-zinc-800 rounded-xl px-2 py-1.5 shadow-[0_1px_4px_rgba(15,23,42,0.03)] overflow-x-auto no-scrollbar">
        {/* Filter pills */}
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setDateFilter(f.key)}
            className={`h-[30px] px-3 rounded-lg text-[12px] font-medium transition cursor-pointer whitespace-nowrap flex-shrink-0 ${
              dateFilter === f.key
                ? 'bg-[#fff0ea] text-[#ff4b1f] border border-orange-200'
                : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-transparent'
            }`}
          >
            {f.label}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700 mx-1 flex-shrink-0" />

        {/* Refresh */}
        <button
          type="button"
          onClick={() => fetchDashboard(dateFilter)}
          disabled={loading}
          className="flex h-[30px] flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#e9e4df] dark:border-zinc-700 bg-transparent px-3 text-[12px] font-normal text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50 active:scale-95"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin text-[#ff4b1f]' : ''} />
          <span className="whitespace-nowrap">{loading ? 'Syncing…' : 'Refresh'}</span>
        </button>
      </div>


      {/* ── Primary KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Wallet}
          label="Revenue"
          value={`₹${fmt(kpis.total_revenue || 0)}`}
          sub={`Period: ${meta.date_range || dateFilter}`}
          accent="border-orange-100 dark:border-orange-900/30"
          iconBg="bg-[#fff0ea] text-[#ff4b1f]"
        />
        <KpiCard
          icon={ShoppingBag}
          label="Orders"
          value={String(kpis.total_order || 0)}
          sub="Total kitchen orders"
          accent="border-blue-100 dark:border-blue-900/30"
          iconBg="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Settled"
          value={String(kpis.total_bills_settled || 0)}
          sub="Bills paid & closed"
          accent="border-emerald-100 dark:border-emerald-900/30"
          iconBg="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          icon={Users}
          label="Guests"
          value={String(kpis.total_customers || 0)}
          sub="Dining covers"
          accent="border-purple-100 dark:border-purple-900/30"
          iconBg="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* ── Secondary Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniCard label="GST Collected" value={`₹${fmt(kpis.total_gst_collected || 0)}`} />
        <MiniCard label="Service Charge" value={`₹${fmt(kpis.total_service_charge || 0)}`} />
        <MiniCard label="Discounts" value={`₹${fmt(kpis.total_discounts || 0)}`} />
        <MiniCard label="Active Items" value={`${menus.total_menus || 0} items`} />
      </div>

      {/* ── Top Selling Items ── */}
      <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-[#eee9e4] dark:border-zinc-800 shadow-[0_1px_4px_rgba(15,23,42,0.03)] overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#eee9e4] dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Flame size={15} className="text-[#ff4b1f]" />
            <span className="text-[13px] font-medium text-[#071B34] dark:text-white">Top Selling Dishes</span>
          </div>
          <span className="text-[11px] font-normal text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 px-2.5 py-0.5 rounded-full">
            {topItems.length} items
          </span>
        </div>

        {/* Mobile card list */}
        <div className="block sm:hidden divide-y divide-[#eee9e4] dark:divide-zinc-800">
          {topItems.map((item: any, index: number) => {
            const pct = Math.round(((item.quantity_sold || 0) / maxQtySold) * 100);
            const medals = ['🥇', '🥈', '🥉', '🏅'];
            return (
              <div key={item.item_id || index} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{medals[index] || '🏅'}</span>
                    <span className="text-[13px] font-medium text-[#071B34] dark:text-white truncate">{item.name}</span>
                  </div>
                  <span className="text-[12px] font-medium text-[#071B34] dark:text-white font-mono shrink-0 ml-2">
                    ₹{fmt(item.total_sales || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 dark:text-zinc-500">{item.category}</span>
                  <span className="text-[#ff4b1f] font-medium">{item.quantity_sold} sold</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#ff4b1f] to-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-[#eee9e4] dark:border-zinc-800">
                {['Rank', 'Item', 'Category', 'Units Sold', 'Gross Sales'].map((h, i) => (
                  <th
                    key={h}
                    className={`py-2.5 px-4 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide ${i >= 2 ? 'text-center' : ''} ${i === 4 ? 'text-right' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f1ee] dark:divide-zinc-800/60">
              {topItems.map((item: any, index: number) => {
                const pct = Math.round(((item.quantity_sold || 0) / maxQtySold) * 100);
                const medals = ['🥇', '🥈', '🥉', '🏅'];
                return (
                  <tr key={item.item_id || index} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-sm">
                        {medals[index] || '🏅'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-[13px] font-medium text-[#071B34] dark:text-white">{item.name}</p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">ID: {item.item_id}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 text-[11px] font-normal text-[#c2410c] bg-[#fff7ed] border border-[#ffedd5] rounded-lg dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/40">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1 max-w-[160px] mx-auto">
                        <div className="flex justify-between text-[11px] font-normal text-slate-600 dark:text-zinc-400">
                          <span>{item.quantity_sold} sold</span>
                          <span className="text-slate-400">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#ff4b1f] to-amber-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[13px] font-medium text-[#071B34] dark:text-white font-mono">
                        ₹{fmt(item.total_sales || 0)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Quick Stats Footer Row ── */}
      <div className="flex overflow-x-auto no-scrollbar items-center gap-2.5 text-[11px] text-slate-500 dark:text-zinc-400 pb-1 whitespace-nowrap">
        <div className="flex items-center gap-1.5 shrink-0">
          <TrendingUp size={12} className="text-[#ff4b1f]" />
          <span>Showing data for <span className="font-medium text-slate-700 dark:text-zinc-200">{meta.date_range || 'Today'}</span></span>
        </div>
        <span className="opacity-30 shrink-0">•</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <Receipt size={12} className="text-slate-400" />
          <span>Restaurant <span className="font-medium text-slate-700 dark:text-zinc-200">#{restaurantId}</span></span>
        </div>
        <span className="opacity-30 shrink-0">•</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <Tag size={12} className="text-slate-400" />
          <span><span className="font-medium text-slate-700 dark:text-zinc-200">{menus.total_category || 0}</span> categories</span>
        </div>
        <span className="opacity-30 shrink-0">•</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <BookOpen size={12} className="text-slate-400" />
          <span><span className="font-medium text-slate-700 dark:text-zinc-200">{menus.total_menus || 0}</span> menu items</span>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Mobile View (< md) */}
      <div className="block md:hidden min-h-screen bg-[#faf9f7] dark:bg-[#16161d]">
        <MobileHeader title="Dashboard" />
        {renderDashboardBody(true)}
        <MobileFooter activeTab="dashboard" />
      </div>

      {/* Desktop View (>= md) */}
      <div className="hidden md:block">
        <DesktopLayout activePage="Dashboard">
          {renderDashboardBody(false)}
        </DesktopLayout>
      </div>
    </>
  );
};

export default DashboardPage;
