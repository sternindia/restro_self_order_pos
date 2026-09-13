import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DesktopLayout from '../components/DesktopLayout';
import { MobileHeader, MobileFooter } from '../components/mobile';
import { 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Plus, 
  Minus, 
  SlidersHorizontal,
  X,
  Truck,
  FileText,
  Printer,
  Calendar,
  LayoutGrid,
  List
} from 'lucide-react';
import { toast } from 'react-toastify';

interface StockItem {
  id: string;
  name: string;
  category: 'Dairy & Cheese' | 'Meat & Poultry' | 'Kitchen Staples' | 'Fresh Produce' | 'Packaged Beverages';
  sku: string;
  openingStock: number;
  consumed: number;
  currentStock: number;
  minThreshold: number;
  unit: 'kg' | 'Litres' | 'Bottles' | 'Cans' | 'Packs';
  unitCost: number;
  supplier: string;
  image: string;
  lastRestocked: string;
}

const initialStockData: StockItem[] = [
  {
    id: 'RAW-01',
    name: 'Mozzarella Cheese Block',
    category: 'Dairy & Cheese',
    sku: 'DAI-MOZ-01',
    openingStock: 10,
    consumed: 5.5,
    currentStock: 14.5,
    minThreshold: 5,
    unit: 'kg',
    unitCost: 450,
    supplier: 'Amul Dairy Supply',
    image: '🧀',
    lastRestocked: 'Today, 08:30 AM'
  },
  {
    id: 'RAW-02',
    name: 'Fresh Malai Paneer',
    category: 'Dairy & Cheese',
    sku: 'DAI-PAN-02',
    openingStock: 8,
    consumed: 5.0,
    currentStock: 3.0,
    minThreshold: 8,
    unit: 'kg',
    unitCost: 320,
    supplier: 'Local Farm Fresh',
    image: '🧈',
    lastRestocked: 'Yesterday'
  },
  {
    id: 'RAW-03',
    name: 'Refined Cooking Sunflower Oil',
    category: 'Kitchen Staples',
    sku: 'GRO-OIL-03',
    openingStock: 25,
    consumed: 10,
    currentStock: 35,
    minThreshold: 15,
    unit: 'Litres',
    unitCost: 140,
    supplier: 'Fortune Distributors',
    image: '🛢️',
    lastRestocked: '2 days ago'
  },
  {
    id: 'RAW-04',
    name: 'Premium Basmati Biryani Rice',
    category: 'Kitchen Staples',
    sku: 'GRO-RIC-04',
    openingStock: 30,
    consumed: 12,
    currentStock: 48,
    minThreshold: 20,
    unit: 'kg',
    unitCost: 110,
    supplier: 'India Gate Wholesale',
    image: '🍚',
    lastRestocked: '3 days ago'
  },
  {
    id: 'RAW-05',
    name: 'Boneless Fresh Chicken Breast',
    category: 'Meat & Poultry',
    sku: 'MET-CHK-05',
    openingStock: 12,
    consumed: 9,
    currentStock: 18.0,
    minThreshold: 6,
    unit: 'kg',
    unitCost: 260,
    supplier: 'Zorabian Fresh Cuts',
    image: '🍗',
    lastRestocked: 'Today, 07:00 AM'
  },
  {
    id: 'RAW-06',
    name: 'Red Onions (Pyaaz)',
    category: 'Fresh Produce',
    sku: 'VEG-ONI-06',
    openingStock: 15,
    consumed: 10.5,
    currentStock: 4.5,
    minThreshold: 10,
    unit: 'kg',
    unitCost: 35,
    supplier: 'Sabzi Mandi Market',
    image: '🧅',
    lastRestocked: 'Yesterday'
  },
  {
    id: 'RAW-07',
    name: 'Farm Fresh Tomatoes',
    category: 'Fresh Produce',
    sku: 'VEG-TOM-07',
    openingStock: 10,
    consumed: 8,
    currentStock: 12.0,
    minThreshold: 6,
    unit: 'kg',
    unitCost: 40,
    supplier: 'Sabzi Mandi Market',
    image: '🍅',
    lastRestocked: 'Today, 06:30 AM'
  },
  {
    id: 'RAW-08',
    name: 'Coca Cola Cans (330ml)',
    category: 'Packaged Beverages',
    sku: 'BEV-COK-08',
    openingStock: 24,
    consumed: 16,
    currentStock: 48,
    minThreshold: 24,
    unit: 'Cans',
    unitCost: 32,
    supplier: 'Hindustan Coca-Cola',
    image: '🥤',
    lastRestocked: '4 days ago'
  },
  {
    id: 'RAW-09',
    name: 'Kinley Packaged Water (1L)',
    category: 'Packaged Beverages',
    sku: 'BEV-WAT-09',
    openingStock: 20,
    consumed: 20,
    currentStock: 0,
    minThreshold: 20,
    unit: 'Bottles',
    unitCost: 14,
    supplier: 'Hindustan Coca-Cola',
    image: '💧',
    lastRestocked: '5 days ago'
  },
  {
    id: 'RAW-10',
    name: 'Truffle Mushroom Seasoning',
    category: 'Kitchen Staples',
    sku: 'GRO-TRF-10',
    openingStock: 2.0,
    consumed: 0.5,
    currentStock: 1.5,
    minThreshold: 3,
    unit: 'kg',
    unitCost: 950,
    supplier: 'Chef Specialty Imports',
    image: '🍄',
    lastRestocked: '1 week ago'
  }
];

const categories = ['All', 'Dairy & Cheese', 'Meat & Poultry', 'Kitchen Staples', 'Fresh Produce', 'Packaged Beverages'];

type TabType = 'inventory' | 'add' | 'report';

const StockPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabParam = searchParams.get('tab');
  const activeTab: TabType = currentTabParam === 'report' ? 'report' : currentTabParam === 'add' ? 'add' : 'inventory';

  const [stockItems, setStockItems] = useState<StockItem[]>(initialStockData);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [reportDateRange, setReportDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal State for Restocking
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<StockItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [updatedThreshold, setUpdatedThreshold] = useState<number>(5);

  // Add New Item Form State
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<StockItem['category']>('Dairy & Cheese');
  const [newItemUnit, setNewItemUnit] = useState<StockItem['unit']>('kg');
  const [newItemStock, setNewItemStock] = useState<number>(10);
  const [newItemThreshold, setNewItemThreshold] = useState<number>(5);
  const [newItemUnitCost, setNewItemUnitCost] = useState<number>(100);
  const [newItemSupplier, setNewItemSupplier] = useState<string>('');
  const [newItemEmoji, setNewItemEmoji] = useState<string>('📦');

  const handleTabChange = (tab: TabType) => {
    setSearchParams(tab === 'inventory' ? {} : { tab });
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      toast.warning('Please enter an ingredient or item name.');
      return;
    }

    const newItem: StockItem = {
      id: `RAW-${Date.now().toString().slice(-4)}`,
      name: newItemName.trim(),
      category: newItemCategory,
      sku: `${newItemCategory.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`,
      openingStock: newItemStock,
      consumed: 0,
      currentStock: newItemStock,
      minThreshold: newItemThreshold,
      unit: newItemUnit,
      unitCost: newItemUnitCost || 0,
      supplier: newItemSupplier.trim() || 'General Vendor',
      image: newItemEmoji,
      lastRestocked: 'Just now'
    };

    setStockItems(prev => [newItem, ...prev]);
    toast.success(`"${newItem.name}" added to kitchen inventory!`);
    handleTabChange('inventory');
    setNewItemName('');
    setNewItemStock(10);
    setNewItemThreshold(5);
    setNewItemUnitCost(100);
    setNewItemSupplier('');
    setNewItemEmoji('📦');
  };

  // Quick In-line Stock Adjustment
  const handleQuantityAdjust = (id: string, delta: number) => {
    setStockItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextStock = Math.max(0, parseFloat((item.currentStock + delta).toFixed(1)));
        const addedConsumed = delta < 0 ? Math.abs(delta) : 0;
        return {
          ...item,
          currentStock: nextStock,
          consumed: parseFloat((item.consumed + addedConsumed).toFixed(1))
        };
      }
      return item;
    }));
  };

  // Restock modal submit
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForRestock) return;

    setStockItems(prev => prev.map(item => {
      if (item.id === selectedItemForRestock.id) {
        const newStock = parseFloat((item.currentStock + restockQty).toFixed(1));
        return {
          ...item,
          currentStock: newStock,
          minThreshold: updatedThreshold,
          lastRestocked: 'Just now'
        };
      }
      return item;
    }));

    toast.success(`Restocked +${restockQty} ${selectedItemForRestock.unit} of ${selectedItemForRestock.name}!`);
    setSelectedItemForRestock(null);
    setRestockQty(10);
  };

  // Computed KPIs
  const totalTracked = stockItems.length;
  const inStockCount = stockItems.filter(i => i.currentStock > i.minThreshold).length;
  const lowStockCount = stockItems.filter(i => i.currentStock > 0 && i.currentStock <= i.minThreshold).length;
  const outOfStockCount = stockItems.filter(i => i.currentStock === 0).length;

  // Financial Report Calculations
  const totalInventoryValue = stockItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
  const totalConsumedValue = stockItems.reduce((sum, item) => sum + (item.consumed * item.unitCost), 0);
  const urgentReorders = stockItems.filter(i => i.currentStock <= i.minThreshold);

  // Filtered List
  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

    let matchesStatus = true;
    if (statusFilter === 'in_stock') matchesStatus = item.currentStock > item.minThreshold;
    if (statusFilter === 'low_stock') matchesStatus = item.currentStock > 0 && item.currentStock <= item.minThreshold;
    if (statusFilter === 'out_of_stock') matchesStatus = item.currentStock === 0;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const renderTabSwitcher = () => (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl overflow-x-auto no-scrollbar">
      <button
        onClick={() => handleTabChange('inventory')}
        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap ${
          activeTab === 'inventory'
            ? 'bg-white dark:bg-[#18181b] text-[#ff4b1f] shadow-xs'
            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Package size={13} />
        <span>Live Stock</span>
      </button>
      <button
        onClick={() => handleTabChange('add')}
        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap ${
          activeTab === 'add'
            ? 'bg-white dark:bg-[#18181b] text-[#ff4b1f] shadow-xs'
            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Plus size={13} />
        <span>+ Add Item</span>
      </button>
      <button
        onClick={() => handleTabChange('report')}
        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap ${
          activeTab === 'report'
            ? 'bg-white dark:bg-[#18181b] text-[#ff4b1f] shadow-xs'
            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <FileText size={13} />
        <span>Stock Report</span>
      </button>
    </div>
  );

  const renderStockBody = (isMobile: boolean = false) => (
    <div className={`space-y-3 ${isMobile ? 'px-3 py-3 pb-24' : 'px-5 py-4 w-full'}`}>
      <main className="space-y-3">
        {/* Tab Switcher on Page Right */}
        <div className="flex justify-end pb-1">
          {renderTabSwitcher()}
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* VIEW 1: LIVE INVENTORY ITEMS VIEW                        */}
        {/* ───────────────────────────────────────────────────────── */}
        {activeTab === 'inventory' && (
          <>
            {/* 4 Metric Summary Cards - Compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div 
                onClick={() => setStatusFilter('all')}
                className={`p-3 rounded-xl border transition-all cursor-pointer shadow-[0_1px_3px_rgba(15,23,42,0.03)] ${
                  statusFilter === 'all' 
                    ? 'bg-white dark:bg-[#18181b] border-[#ff4b1f] ring-2 ring-[#ff4b1f]/10' 
                    : 'bg-white dark:bg-[#18181b] border-[#eee9e4] dark:border-zinc-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-[10px] font-medium uppercase tracking-wider mb-1">
                  <span>Tracked</span>
                  <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center">
                    <Package size={13} />
                  </div>
                </div>
                <div className="text-xl font-semibold text-[#071B34] dark:text-white leading-none">{totalTracked}</div>
                <div className="hidden sm:block text-[10px] text-slate-400 dark:text-zinc-500 font-normal mt-1">Total store items</div>
              </div>

              <div 
                onClick={() => setStatusFilter('in_stock')}
                className={`p-3 rounded-xl border transition-all cursor-pointer shadow-[0_1px_3px_rgba(15,23,42,0.03)] ${
                  statusFilter === 'in_stock' 
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/10' 
                    : 'bg-white dark:bg-[#18181b] border-[#eee9e4] dark:border-zinc-800 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-[10px] font-medium uppercase tracking-wider mb-1">
                  <span>In Stock</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={13} />
                  </div>
                </div>
                <div className="text-xl font-semibold text-emerald-800 dark:text-emerald-300 leading-none">{inStockCount}</div>
                <div className="hidden sm:block text-[10px] text-emerald-600/80 dark:text-emerald-500 font-normal mt-1">Ready for cooking</div>
              </div>

              <div 
                onClick={() => setStatusFilter('low_stock')}
                className={`p-3 rounded-xl border transition-all cursor-pointer shadow-[0_1px_3px_rgba(15,23,42,0.03)] ${
                  statusFilter === 'low_stock' 
                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-500 ring-2 ring-amber-500/10' 
                    : 'bg-white dark:bg-[#18181b] border-[#eee9e4] dark:border-zinc-800 hover:border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-[10px] font-medium uppercase tracking-wider mb-1">
                  <span>Low Stock</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <AlertTriangle size={13} />
                  </div>
                </div>
                <div className="text-xl font-semibold text-amber-800 dark:text-amber-300 leading-none">{lowStockCount}</div>
                <div className="hidden sm:block text-[10px] text-amber-600/80 dark:text-amber-500 font-normal mt-1">Needs vendor re-order</div>
              </div>

              <div 
                onClick={() => setStatusFilter('out_of_stock')}
                className={`p-3 rounded-xl border transition-all cursor-pointer shadow-[0_1px_3px_rgba(15,23,42,0.03)] ${
                  statusFilter === 'out_of_stock' 
                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-500 ring-2 ring-rose-500/10' 
                    : 'bg-white dark:bg-[#18181b] border-[#eee9e4] dark:border-zinc-800 hover:border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-[10px] font-medium uppercase tracking-wider mb-1">
                  <span>Out of Stock</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <XCircle size={13} />
                  </div>
                </div>
                <div className="text-xl font-semibold text-rose-800 dark:text-rose-300 leading-none">{outOfStockCount}</div>
                <div className="hidden sm:block text-[10px] text-rose-600/80 dark:text-rose-500 font-normal mt-1">Completely finished</div>
              </div>
            </div>

            {/* Filter & Search Toolbar - Compact Single Container */}
            <div className="bg-white dark:bg-[#18181b] rounded-xl p-3 border border-[#eee9e4] dark:border-zinc-800 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-2.5">
              <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
                <div className="relative w-full md:w-72">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search ingredients or supplier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4b1f]/20 focus:border-[#ff4b1f] bg-slate-50/50 dark:bg-zinc-800/50 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-0.5 md:pb-0 no-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#fff0ea] text-[#ff4b1f] border border-orange-200/80 dark:bg-orange-950/40 dark:border-orange-900/50'
                          : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-transparent'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#eee9e4] dark:border-zinc-800 text-[11px] font-medium text-slate-500 dark:text-zinc-400 no-scrollbar">
                <span className="hidden sm:flex items-center gap-1 text-slate-400 mr-1 shrink-0">
                  <SlidersHorizontal size={12} /> Status:
                </span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${statusFilter === 'all' ? 'bg-[#fff0ea] text-[#ff4b1f] font-semibold' : 'hover:text-slate-900 dark:hover:text-white'}`}
                >
                  All ({totalTracked})
                </button>
                <button
                  onClick={() => setStatusFilter('in_stock')}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${statusFilter === 'in_stock' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold' : 'hover:text-slate-900 dark:hover:text-white'}`}
                >
                  In Stock ({inStockCount})
                </button>
                <button
                  onClick={() => setStatusFilter('low_stock')}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${statusFilter === 'low_stock' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-semibold' : 'hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Low ({lowStockCount})
                </button>
                <button
                  onClick={() => setStatusFilter('out_of_stock')}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${statusFilter === 'out_of_stock' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 font-semibold' : 'hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Depleted ({outOfStockCount})
                </button>
              </div>
            </div>

            {/* Inventory Stock Container */}
            <div className="bg-white dark:bg-[#18181b] rounded-xl p-3 sm:p-4 border border-[#eee9e4] dark:border-zinc-800 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#eee9e4] dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm sm:text-base font-semibold text-[#071B34] dark:text-white tracking-tight">
                    Store Items ({filteredItems.length})
                  </h3>
                  {/* Grid / List View Switcher */}
                  <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-1 rounded-md transition cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-[#18181b] text-[#ff4b1f] shadow-xs'
                          : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700'
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`p-1 rounded-md transition cursor-pointer ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-[#18181b] text-[#ff4b1f] shadow-xs'
                          : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700'
                      }`}
                      title="List View"
                    >
                      <List size={14} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleTabChange('add')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff4b1f] hover:bg-[#e03e15] text-white rounded-xl text-[12px] font-medium transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <Plus size={14} />
                  <span>+ Add Item</span>
                </button>
              </div>

              {/* GRID VIEW */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                  {filteredItems.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-400 dark:text-zinc-500 text-xs font-normal">
                      No items found matching your filters.
                    </div>
                  ) : (
                    filteredItems.map(item => {
                      const isOutOfStock = item.currentStock === 0;
                      const isLowStock = item.currentStock > 0 && item.currentStock <= item.minThreshold;

                      return (
                        <div
                          key={item.id}
                          className="bg-slate-50/50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-3 flex flex-col justify-between gap-2.5 hover:border-slate-300 dark:hover:border-zinc-700 transition"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="w-9 h-9 rounded-xl bg-[#fff0ea] dark:bg-orange-950/40 flex items-center justify-center text-lg shrink-0 border border-orange-200/50 dark:border-orange-900/40">
                              {item.image}
                            </span>
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 shrink-0">
                                Out
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 shrink-0">
                                Low
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 shrink-0">
                                Good
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="text-[12px] font-semibold text-[#071B34] dark:text-white truncate" title={item.name}>
                              {item.name}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal truncate mt-0.5">
                              {item.category}
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-zinc-800">
                            <div className="flex items-center justify-between bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleQuantityAdjust(item.id, -1)}
                                disabled={item.currentStock === 0}
                                className="w-6 h-6 rounded-md bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-white flex items-center justify-center shadow-2xs active:scale-90 disabled:opacity-30 cursor-pointer"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="text-[11px] font-semibold text-[#071B34] dark:text-white font-mono px-1">
                                {item.currentStock} {item.unit}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuantityAdjust(item.id, 1)}
                                className="w-6 h-6 rounded-md bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-white flex items-center justify-center shadow-2xs active:scale-90 cursor-pointer"
                              >
                                <Plus size={11} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItemForRestock(item);
                                setRestockQty(10);
                                setUpdatedThreshold(item.minThreshold);
                              }}
                              className="w-full py-1 bg-[#fff0ea] hover:bg-[#ff4b1f] text-[#ff4b1f] hover:text-white dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-[#ff4b1f] dark:hover:text-white rounded-lg border border-orange-200/80 dark:border-orange-900/40 text-[11px] font-medium transition-all cursor-pointer active:scale-95 text-center"
                            >
                              + Restock
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* LIST VIEW */
                <>
                  {/* Mobile List View */}
                  <div className="block sm:hidden divide-y divide-[#eee9e4] dark:divide-zinc-800">
                    {filteredItems.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 dark:text-zinc-500 text-xs font-normal">
                        No items found matching your filters.
                      </div>
                    ) : (
                      filteredItems.map(item => {
                        const isOutOfStock = item.currentStock === 0;
                        const isLowStock = item.currentStock > 0 && item.currentStock <= item.minThreshold;

                        return (
                          <div key={item.id} className="py-3.5 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-10 h-10 rounded-xl bg-[#fff0ea] dark:bg-orange-950/30 flex items-center justify-center text-xl shrink-0 border border-orange-200/50 dark:border-orange-900/40">
                                  {item.image}
                                </span>
                                <div className="min-w-0">
                                  <div className="text-[13px] font-medium text-[#071B34] dark:text-white truncate">{item.name}</div>
                                  <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">{item.category}</div>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {isOutOfStock ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
                                    Out of Stock
                                  </span>
                                ) : isLowStock ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
                                    Low Stock
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                                    Healthy
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 rounded-xl p-1">
                                <button
                                  onClick={() => handleQuantityAdjust(item.id, -1)}
                                  disabled={item.currentStock === 0}
                                  className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-700 text-slate-700 dark:text-white flex items-center justify-center shadow-xs active:scale-90 disabled:opacity-30 cursor-pointer"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-16 text-center text-xs font-semibold text-[#071B34] dark:text-white font-mono">
                                  {item.currentStock} {item.unit}
                                </span>
                                <button
                                  onClick={() => handleQuantityAdjust(item.id, 1)}
                                  className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-700 text-slate-700 dark:text-white flex items-center justify-center shadow-xs active:scale-90 cursor-pointer"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedItemForRestock(item);
                                  setRestockQty(10);
                                  setUpdatedThreshold(item.minThreshold);
                                }}
                                className="px-3.5 py-1.5 bg-[#fff0ea] hover:bg-[#ff4b1f] text-[#ff4b1f] hover:text-white dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-[#ff4b1f] dark:hover:text-white rounded-xl border border-orange-200/80 dark:border-orange-900/40 text-[11px] font-medium transition-all cursor-pointer active:scale-95"
                              >
                                + Restock
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[720px]">
                      <thead>
                        <tr className="border-b border-[#eee9e4] dark:border-zinc-800">
                          <th className="py-2.5 px-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Item / Ingredient</th>
                          <th className="py-2.5 px-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Category</th>
                          <th className="py-2.5 px-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide text-center">Current Quantity</th>
                          <th className="py-2.5 px-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide text-center">Buffer Health</th>
                          <th className="py-2.5 px-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Supplier / Last Order</th>
                          <th className="py-2.5 px-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f4f1ee] dark:divide-zinc-800/60">
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs font-normal">
                              No inventory items found matching your filters.
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map(item => {
                            const isOutOfStock = item.currentStock === 0;
                            const isLowStock = item.currentStock > 0 && item.currentStock <= item.minThreshold;

                            return (
                              <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-[#fff0ea] dark:bg-orange-950/30 flex items-center justify-center text-xl flex-shrink-0 border border-orange-200/50 dark:border-orange-900/40">
                                      {item.image}
                                    </span>
                                    <div>
                                      <div className="text-[13px] font-medium text-[#071B34] dark:text-white">{item.name}</div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-3">
                                  <span className="inline-block px-2.5 py-0.5 text-[11px] font-normal text-[#c2410c] bg-[#fff7ed] border border-[#ffedd5] rounded-lg dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/40">
                                    {item.category}
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-center">
                                  <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 rounded-xl p-1 shadow-2xs">
                                    <button
                                      onClick={() => handleQuantityAdjust(item.id, -1)}
                                      disabled={item.currentStock === 0}
                                      className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-700 text-slate-700 dark:text-white hover:bg-slate-100 flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 cursor-pointer"
                                      title="Deduct 1 unit"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <span className="w-16 text-center text-xs font-semibold text-[#071B34] dark:text-white font-mono">
                                      {item.currentStock} {item.unit}
                                    </span>
                                    <button
                                      onClick={() => handleQuantityAdjust(item.id, 1)}
                                      className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-700 text-slate-700 dark:text-white hover:bg-slate-100 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                                      title="Add 1 unit"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal mt-1">
                                    Min Buffer: {item.minThreshold} {item.unit}
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-center">
                                  {isOutOfStock ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
                                      <XCircle size={12} /> Depleted (0)
                                    </span>
                                  ) : isLowStock ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
                                      <AlertTriangle size={12} /> Low Buffer ({item.currentStock} left)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                                      <CheckCircle2 size={12} /> Healthy Buffer
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300">
                                    <Truck size={12} className="text-[#ff4b1f] shrink-0" />
                                    <span className="truncate max-w-[130px]">{item.supplier}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal mt-0.5">
                                    {item.lastRestocked}
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedItemForRestock(item);
                                      setRestockQty(10);
                                      setUpdatedThreshold(item.minThreshold);
                                    }}
                                    className="px-3.5 py-1.5 bg-[#fff0ea] hover:bg-[#ff4b1f] text-[#ff4b1f] hover:text-white dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-[#ff4b1f] dark:hover:text-white rounded-xl border border-orange-200/80 dark:border-orange-900/40 text-[11px] font-medium transition-all cursor-pointer active:scale-95"
                                  >
                                    + Restock
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ───────────────────────────────────────────────────────── */}
        {/* VIEW 2: DETAILED STOCK REPORT VIEW                        */}
        {/* ───────────────────────────────────────────────────────── */}
        {activeTab === 'report' && (
          <div className="space-y-4">
            {/* Report Filter & Export Bar */}
            <div className="bg-white dark:bg-[#18181b] rounded-2xl p-4 border border-[#eee9e4] dark:border-zinc-800 shadow-[0_1px_4px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="text-[12px] font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1 shrink-0">
                  <Calendar size={13} /> Period:
                </span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                  {(['today', 'week', 'month'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setReportDateRange(p)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium uppercase transition-all cursor-pointer ${
                        reportDateRange === p
                          ? 'bg-white dark:bg-[#18181b] text-[#ff4b1f] shadow-xs'
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {p === 'today' ? 'Today' : p === 'week' ? 'Week' : 'Month'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#071B34] hover:bg-slate-900 text-white rounded-xl text-[12px] font-medium transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => toast.success('Report exported as CSV!')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#fff0ea] hover:bg-[#ff4b1f] text-[#ff4b1f] hover:text-white border border-orange-200/80 dark:bg-orange-950/30 dark:text-orange-400 rounded-xl text-[12px] font-medium transition-all cursor-pointer active:scale-95"
                >
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Financial Valuation Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#18181b] border border-[#eee9e4] dark:border-zinc-800 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
                <div className="text-[11px] font-medium uppercase text-slate-400 dark:text-zinc-500 mb-1">
                  Store Valuation
                </div>
                <div className="text-xl sm:text-2xl font-semibold text-[#071B34] dark:text-white font-mono">
                  ₹{totalInventoryValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal mt-0.5">Current in-stock worth</div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
                <div className="text-[11px] font-medium uppercase text-emerald-700 dark:text-emerald-400 mb-1">
                  Kitchen Consumed
                </div>
                <div className="text-xl sm:text-2xl font-semibold text-emerald-800 dark:text-emerald-300 font-mono">
                  ₹{totalConsumedValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-emerald-600/80 dark:text-emerald-500 font-normal mt-0.5">Used in orders/prep</div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
                <div className="text-[11px] font-medium uppercase text-amber-700 dark:text-amber-400 mb-1">
                  Urgent Re-orders
                </div>
                <div className="text-xl sm:text-2xl font-semibold text-amber-800 dark:text-amber-300">
                  {urgentReorders.length} Items
                </div>
                <div className="text-[11px] text-amber-600/80 dark:text-amber-500 font-normal mt-0.5">Below buffer limit</div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
                <div className="text-[11px] font-medium uppercase text-purple-700 dark:text-purple-400 mb-1">
                  Active Categories
                </div>
                <div className="text-xl sm:text-2xl font-semibold text-purple-900 dark:text-purple-300">
                  {categories.length - 1} Categories
                </div>
                <div className="text-[11px] text-purple-600/80 dark:text-purple-500 font-normal mt-0.5">Dairy, Meats, Groceries</div>
              </div>
            </div>

            {/* Comprehensive Stock Audit Table */}
            <div className="bg-white dark:bg-[#18181b] rounded-2xl p-4 sm:p-5 border border-[#eee9e4] dark:border-zinc-800 shadow-[0_1px_4px_rgba(15,23,42,0.03)] space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#eee9e4] dark:border-zinc-800">
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-[#071B34] dark:text-white tracking-tight">
                    Stock Audit & Consumption Breakdown
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">Opening stock vs kitchen usage & remaining balance</p>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                  {stockItems.length} Total Ingredients
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-[#eee9e4] dark:border-zinc-800">
                      <th className="py-2.5 px-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Item Name</th>
                      <th className="py-2.5 px-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Category</th>
                      <th className="py-2.5 px-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide text-center">Opening</th>
                      <th className="py-2.5 px-3 text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wide text-center">Consumed (-)</th>
                      <th className="py-2.5 px-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide text-center">Closing Stock</th>
                      <th className="py-2.5 px-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide text-right">Est. Value</th>
                      <th className="py-2.5 px-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4f1ee] dark:divide-zinc-800/60 text-xs">
                    {stockItems.map(item => {
                      const isOutOfStock = item.currentStock === 0;
                      const isLowStock = item.currentStock > 0 && item.currentStock <= item.minThreshold;
                      const itemValuation = item.currentStock * item.unitCost;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{item.image}</span>
                              <span className="font-medium text-[#071B34] dark:text-white">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-normal text-slate-500 dark:text-zinc-400">{item.category}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-medium text-slate-600 dark:text-zinc-300">
                            {item.openingStock} {item.unit}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20">
                            {item.consumed} {item.unit}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-semibold text-[#071B34] dark:text-white">
                            {item.currentStock} {item.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-[#071B34] dark:text-white">
                            ₹{itemValuation.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isOutOfStock ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
                                Depleted
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
                                Low
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                                Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Low Buffer Urgent Reorder Checklist */}
            {urgentReorders.length > 0 && (
              <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200/80 dark:border-amber-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-amber-700 dark:text-amber-400" />
                    <h4 className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-300">
                      Immediate Re-orders ({urgentReorders.length})
                    </h4>
                  </div>
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                    &lt; Min Buffer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {urgentReorders.map(item => (
                    <div key={item.id} className="bg-white dark:bg-[#18181b] p-3 rounded-xl border border-amber-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#071B34] dark:text-white truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal truncate">{item.supplier}</div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                          Left: {item.currentStock} {item.unit}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedItemForRestock(item);
                          setRestockQty(10);
                          setUpdatedThreshold(item.minThreshold);
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-medium shrink-0 cursor-pointer active:scale-95"
                      >
                        + Reorder
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────── */}
        {/* VIEW 3: DEDICATED ADD STORE ITEM TAB                      */}
        {/* ───────────────────────────────────────────────────────── */}
        {activeTab === 'add' && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-[#18181b] rounded-2xl p-5 sm:p-7 shadow-[0_1px_4px_rgba(15,23,42,0.03)] border border-[#eee9e4] dark:border-zinc-800 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[#eee9e4] dark:border-zinc-800">
              <span className="w-12 h-12 rounded-2xl bg-[#fff0ea] text-[#ff4b1f] dark:bg-orange-950/30 dark:text-orange-400 flex items-center justify-center text-2xl border border-orange-200/60 dark:border-orange-900/40">
                {newItemEmoji}
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#071B34] dark:text-white leading-tight">
                  Add New Store Ingredient / Item
                </h3>
                <p className="text-[12px] text-slate-400 dark:text-zinc-500 font-normal">Add raw material or beverage to kitchen inventory</p>
              </div>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400 mb-1.5">
                  Choose Icon / Emoji
                </label>
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {['🧀', '🧈', '🍗', '🥩', '🍚', '🛢️', '🧅', '🍅', '🧄', '🥔', '🥤', '💧', '🍄', '📦'].map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewItemEmoji(em)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all cursor-pointer shrink-0 ${
                        newItemEmoji === em
                          ? 'bg-[#fff0ea] border-[#ff4b1f] dark:bg-orange-950/40 dark:border-orange-500'
                          : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400 mb-1.5">
                  Ingredient / Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amul Butter, Fresh Mutton, Garlic Paste"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4b1f]/20 focus:border-[#ff4b1f] bg-slate-50/50 dark:bg-zinc-800/50 text-slate-800 dark:text-white"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400 mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4b1f]/20 focus:border-[#ff4b1f] bg-white dark:bg-zinc-800 text-slate-800 dark:text-white"
                  >
                    <option value="Dairy & Cheese">Dairy & Cheese</option>
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Kitchen Staples">Kitchen Staples</option>
                    <option value="Fresh Produce">Fresh Produce</option>
                    <option value="Packaged Beverages">Packaged Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400 mb-1.5">
                    Measuring Unit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4b1f]/20 focus:border-[#ff4b1f] bg-white dark:bg-zinc-800 text-slate-800 dark:text-white"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="Litres">Litres</option>
                    <option value="Bottles">Bottles</option>
                    <option value="Cans">Cans</option>
                    <option value="Packs">Packs</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400 mb-1.5">
                    Starting Stock ({newItemUnit})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4b1f]/20 focus:border-[#ff4b1f] bg-slate-50/50 dark:bg-zinc-800/50 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400 mb-1.5">
                    Alert Buffer Threshold ({newItemUnit})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={newItemThreshold}
                    onChange={(e) => setNewItemThreshold(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4b1f]/20 focus:border-[#ff4b1f] bg-slate-50/50 dark:bg-zinc-800/50 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400 mb-1.5">
                    Cost per {newItemUnit} (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemUnitCost}
                    onChange={(e) => setNewItemUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4b1f]/20 focus:border-[#ff4b1f] bg-slate-50/50 dark:bg-zinc-800/50 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400 mb-1.5">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amul, Metro Wholesale"
                    value={newItemSupplier}
                    onChange={(e) => setNewItemSupplier(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4b1f]/20 focus:border-[#ff4b1f] bg-slate-50/50 dark:bg-zinc-800/50 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => handleTabChange('inventory')}
                  className="flex-1 py-2.5 px-4 text-xs font-medium text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newItemName.trim()}
                  className="flex-1 py-2.5 px-4 bg-[#ff4b1f] hover:bg-[#e03e15] text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  + Add to Store Inventory
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Restock Modal */}
      {selectedItemForRestock && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedItemForRestock(null)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-[#18181b] rounded-2xl p-6 shadow-xl border border-[#eee9e4] dark:border-zinc-800 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#eee9e4] dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#fff0ea] dark:bg-orange-950/30 flex items-center justify-center text-2xl border border-orange-200/60 dark:border-orange-900/40">
                  {selectedItemForRestock.image}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[#071B34] dark:text-white leading-tight">
                    Restock {selectedItemForRestock.name}
                  </h3>
                  <p className="text-[12px] text-slate-400 dark:text-zinc-500 font-normal">
                    Current: {selectedItemForRestock.currentStock} {selectedItemForRestock.unit}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForRestock(null)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Restock Form */}
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400 mb-1.5">
                  Quantity to Add ({selectedItemForRestock.unit})
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {[5, 10, 25, 50].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRestockQty(val)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                        restockQty === val 
                          ? 'bg-[#ff4b1f] text-white border-[#ff4b1f] shadow-xs' 
                          : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      +{val}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="1000"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4b1f]/20 focus:border-[#ff4b1f] bg-slate-50/50 dark:bg-zinc-800/50 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400 mb-1.5">
                  Minimum Buffer Threshold ({selectedItemForRestock.unit})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="500"
                  required
                  value={updatedThreshold}
                  onChange={(e) => setUpdatedThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-xs font-medium border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4b1f]/20 focus:border-[#ff4b1f] bg-slate-50/50 dark:bg-zinc-800/50 text-slate-800 dark:text-white"
                />
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 font-normal">Alert triggers when raw stock drops below this buffer.</p>
              </div>

              <div className="p-3 bg-[#fff0ea] dark:bg-orange-950/20 rounded-xl border border-orange-200/70 dark:border-orange-900/40 text-xs space-y-1">
                <div className="flex justify-between font-medium text-slate-700 dark:text-zinc-300">
                  <span>Current Store Room Stock:</span>
                  <span>{selectedItemForRestock.currentStock} {selectedItemForRestock.unit}</span>
                </div>
                <div className="flex justify-between font-semibold text-[#ff4b1f]">
                  <span>New Store Room Total:</span>
                  <span className="font-mono text-sm">{parseFloat((selectedItemForRestock.currentStock + restockQty).toFixed(1))} {selectedItemForRestock.unit}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForRestock(null)}
                  className="flex-1 py-2.5 px-4 text-xs font-medium text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restockQty <= 0}
                  className="flex-1 py-2.5 px-4 bg-[#ff4b1f] hover:bg-[#e03e15] text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile View (< md) */}
      <div className="block md:hidden min-h-screen bg-[#faf9f7] dark:bg-[#16161d]">
        <MobileHeader title="Kitchen Store" />
        {renderStockBody(true)}
        <MobileFooter activeTab="more" />
      </div>

      {/* Desktop View (>= md) */}
      <div className="hidden md:block">
        <DesktopLayout activePage="Inventory">
          {renderStockBody(false)}
        </DesktopLayout>
      </div>
    </>
  );
};

export default StockPage;
