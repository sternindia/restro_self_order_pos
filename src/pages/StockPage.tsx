import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Plus, 
  Minus, 
  RefreshCw, 
  SlidersHorizontal,
  X,
  Truck,
  FileText,
  Printer,
  Calendar,
  Layers
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Top Header Card with Tab Switcher */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs border border-[#F0E6DF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-[#FFF0E6] text-[#f05a24] border border-[#f05a24]/20">
                <Package size={12} /> Kitchen Store
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● Raw Materials & Grocery
              </span>
            </div>
            <h1 className="text-base sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
              {activeTab === 'report' ? 'Stock Consumption & Audit Report' : activeTab === 'add' ? 'Add Store Item' : 'Raw Ingredients & Stock'}
            </h1>
          </div>

          {/* Tab Switcher Controls */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleTabChange('inventory')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-white text-[#f05a24] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package size={14} />
              <span>Live Stock</span>
            </button>
            <button
              onClick={() => handleTabChange('add')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'add'
                  ? 'bg-white text-[#f05a24] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Plus size={14} />
              <span>+ Add Item</span>
            </button>
            <button
              onClick={() => handleTabChange('report')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'report'
                  ? 'bg-white text-[#f05a24] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText size={14} />
              <span>Stock Report</span>
            </button>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* VIEW 1: LIVE INVENTORY ITEMS VIEW                        */}
        {/* ───────────────────────────────────────────────────────── */}
        {activeTab === 'inventory' && (
          <>
            {/* 4 Metric Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div 
                onClick={() => setStatusFilter('all')}
                className={`p-3 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                  statusFilter === 'all' ? 'bg-white border-[#f05a24] ring-2 ring-[#f05a24]/20' : 'bg-white border-[#F0E6DF] hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 sm:mb-2">
                  <span>Tracked</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-black">
                    <Package size={14} />
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-black text-gray-900 leading-none">{totalTracked}</div>
                <div className="hidden sm:block text-[11px] text-gray-400 font-medium mt-1">Total store items</div>
              </div>

              <div 
                onClick={() => setStatusFilter('in_stock')}
                className={`p-3 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                  statusFilter === 'in_stock' ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white border-[#F0E6DF] hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between text-emerald-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 sm:mb-2">
                  <span>In Stock</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                    <CheckCircle2 size={14} />
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-black text-emerald-800 leading-none">{inStockCount}</div>
                <div className="hidden sm:block text-[11px] text-emerald-600 font-medium mt-1">Ready for cooking</div>
              </div>

              <div 
                onClick={() => setStatusFilter('low_stock')}
                className={`p-3 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                  statusFilter === 'low_stock' ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white border-[#F0E6DF] hover:border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between text-amber-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 sm:mb-2">
                  <span>Low Stock</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                    <AlertTriangle size={14} />
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-black text-amber-800 leading-none">{lowStockCount}</div>
                <div className="hidden sm:block text-[11px] text-amber-600 font-medium mt-1">Needs vendor re-order</div>
              </div>

              <div 
                onClick={() => setStatusFilter('out_of_stock')}
                className={`p-3 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                  statusFilter === 'out_of_stock' ? 'bg-red-50/70 border-red-500 ring-2 ring-red-500/20' : 'bg-white border-[#F0E6DF] hover:border-red-200'
                }`}
              >
                <div className="flex items-center justify-between text-red-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 sm:mb-2">
                  <span>Out of Stock</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-black">
                    <XCircle size={14} />
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-black text-red-800 leading-none">{outOfStockCount}</div>
                <div className="hidden sm:block text-[11px] text-red-600 font-medium mt-1">Completely finished</div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs border border-[#F0E6DF] space-y-3 sm:space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search ingredients or supplier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a24]/30 focus:border-[#f05a24] bg-gray-50/50"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#f05a24] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-gray-100 text-xs font-bold text-gray-500 scrollbar-none">
                <span className="hidden sm:flex items-center gap-1 text-gray-400 mr-1 shrink-0">
                  <SlidersHorizontal size={13} /> Filter:
                </span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${statusFilter === 'all' ? 'bg-[#f05a24]/10 text-[#f05a24] font-black' : 'hover:text-gray-900'}`}
                >
                  All ({totalTracked})
                </button>
                <button
                  onClick={() => setStatusFilter('in_stock')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${statusFilter === 'in_stock' ? 'bg-emerald-100 text-emerald-800 font-black' : 'hover:text-gray-900'}`}
                >
                  In Stock ({inStockCount})
                </button>
                <button
                  onClick={() => setStatusFilter('low_stock')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${statusFilter === 'low_stock' ? 'bg-amber-100 text-amber-800 font-black' : 'hover:text-gray-900'}`}
                >
                  Low ({lowStockCount})
                </button>
                <button
                  onClick={() => setStatusFilter('out_of_stock')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${statusFilter === 'out_of_stock' ? 'bg-red-100 text-red-800 font-black' : 'hover:text-gray-900'}`}
                >
                  Depleted ({outOfStockCount})
                </button>
              </div>
            </div>

            {/* Inventory Stock Container */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs border border-[#F0E6DF] space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-gray-100">
                <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                  Store Items ({filteredItems.length})
                </h3>
                <button
                  onClick={() => handleTabChange('add')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f05a24] hover:bg-[#d94815] text-white rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Plus size={14} />
                  <span>+ Add Item</span>
                </button>
              </div>

              {/* Mobile Card View (Optimized for Small Screens) */}
              <div className="block sm:hidden divide-y divide-gray-100">
                {filteredItems.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs font-semibold">
                    No items found.
                  </div>
                ) : (
                  filteredItems.map(item => {
                    const isOutOfStock = item.currentStock === 0;
                    const isLowStock = item.currentStock > 0 && item.currentStock <= item.minThreshold;

                    return (
                      <div key={item.id} className="py-3 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-9 h-9 rounded-xl bg-[#FFF0E6] flex items-center justify-center text-lg shrink-0 border border-[#f05a24]/10 shadow-2xs">
                              {item.image}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-black text-gray-900 truncate">{item.name}</div>
                              <div className="text-[10px] text-gray-400 font-medium">{item.category}</div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700">
                                Out
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                                Low
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                Good
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl p-1">
                            <button
                              onClick={() => handleQuantityAdjust(item.id, -1)}
                              disabled={item.currentStock === 0}
                              className="w-6 h-6 rounded-lg bg-white text-gray-700 flex items-center justify-center shadow-2xs active:scale-90 disabled:opacity-30 cursor-pointer"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="w-14 text-center text-xs font-black text-gray-900 font-mono">
                              {item.currentStock} {item.unit}
                            </span>
                            <button
                              onClick={() => handleQuantityAdjust(item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-white text-gray-700 flex items-center justify-center shadow-2xs active:scale-90 cursor-pointer"
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedItemForRestock(item);
                              setRestockQty(10);
                              setUpdatedThreshold(item.minThreshold);
                            }}
                            className="px-3 py-1.5 bg-[#FFF0E6] hover:bg-[#f05a24] text-[#f05a24] hover:text-white rounded-xl border border-[#f05a24]/20 text-[11px] font-extrabold transition-all cursor-pointer active:scale-95 shadow-2xs"
                          >
                            + Restock
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View (Hidden on Small Screens) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="text-[11px] font-black text-gray-400 uppercase border-b border-gray-200 pb-2">
                      <th className="py-2.5 px-3">Item / Ingredient</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Current Quantity</th>
                      <th className="py-2.5 px-3 text-center">Buffer Health</th>
                      <th className="py-2.5 px-3">Supplier / Last Order</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400 text-sm font-semibold">
                          No inventory items found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map(item => {
                        const isOutOfStock = item.currentStock === 0;
                        const isLowStock = item.currentStock > 0 && item.currentStock <= item.minThreshold;

                        return (
                          <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-2xl bg-[#FFF0E6] flex items-center justify-center text-xl flex-shrink-0 border border-[#f05a24]/10 shadow-2xs">
                                  {item.image}
                                </span>
                                <div>
                                  <div className="text-sm font-black text-gray-900">{item.name}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="inline-block px-2.5 py-1 text-xs font-extrabold text-[#c2410c] bg-[#fff7ed] border border-[#ffedd5] rounded-lg">
                                {item.category}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1 shadow-2xs">
                                <button
                                  onClick={() => handleQuantityAdjust(item.id, -1)}
                                  disabled={item.currentStock === 0}
                                  className="w-7 h-7 rounded-lg bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center shadow-2xs transition-all active:scale-90 disabled:opacity-40 cursor-pointer"
                                  title="Deduct 1 unit"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="w-16 text-center text-sm font-black text-gray-900 font-mono">
                                  {item.currentStock} {item.unit}
                                </span>
                                <button
                                  onClick={() => handleQuantityAdjust(item.id, 1)}
                                  className="w-7 h-7 rounded-lg bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center shadow-2xs transition-all active:scale-90 cursor-pointer"
                                  title="Add 1 unit"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                              <div className="text-[10px] text-gray-400 font-semibold mt-1">
                                Min Buffer: {item.minThreshold} {item.unit}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-center">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-200">
                                  <XCircle size={12} /> Depleted (0)
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                                  <AlertTriangle size={12} /> Low Buffer ({item.currentStock} left)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 size={12} /> Healthy Buffer
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                                <Truck size={12} className="text-[#f05a24] shrink-0" />
                                <span className="truncate max-w-[130px]">{item.supplier}</span>
                              </div>
                              <div className="text-[10px] text-gray-400 font-medium mt-0.5">
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
                                className="px-3.5 py-1.5 bg-[#FFF0E6] hover:bg-[#f05a24] text-[#f05a24] hover:text-white rounded-xl border border-[#f05a24]/20 text-xs font-extrabold transition-all cursor-pointer active:scale-95 shadow-2xs"
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
            </div>
          </>
        )}

        {/* ───────────────────────────────────────────────────────── */}
        {/* VIEW 2: DETAILED STOCK REPORT VIEW                        */}
        {/* ───────────────────────────────────────────────────────── */}
        {activeTab === 'report' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Report Filter & Export Bar */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xs border border-[#F0E6DF] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="text-xs font-black text-gray-500 flex items-center gap-1 shrink-0">
                  <Calendar size={13} /> Period:
                </span>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  {(['today', 'week', 'month'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setReportDateRange(p)}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-black uppercase transition-all cursor-pointer ${
                        reportDateRange === p
                          ? 'bg-white text-[#f05a24] shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
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
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => toast.success('Report exported as CSV!')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 bg-[#FFF0E6] hover:bg-[#f05a24] text-[#f05a24] hover:text-white border border-[#f05a24]/20 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95"
                >
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Financial Valuation Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-[#F0E6DF] shadow-2xs">
                <div className="text-[10px] sm:text-xs font-bold uppercase text-gray-400 mb-1">
                  Store Valuation
                </div>
                <div className="text-lg sm:text-2xl font-black text-gray-900 font-mono">
                  ₹{totalInventoryValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-gray-400 font-medium mt-0.5">Current in-stock worth</div>
              </div>

              <div className="p-3.5 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
                <div className="text-[10px] sm:text-xs font-bold uppercase text-emerald-700 mb-1">
                  Kitchen Consumed
                </div>
                <div className="text-lg sm:text-2xl font-black text-emerald-800 font-mono">
                  ₹{totalConsumedValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Used in orders/prep</div>
              </div>

              <div className="p-3.5 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-2xs">
                <div className="text-[10px] sm:text-xs font-bold uppercase text-amber-700 mb-1">
                  Urgent Re-orders
                </div>
                <div className="text-lg sm:text-2xl font-black text-amber-800">
                  {urgentReorders.length} Items
                </div>
                <div className="text-[10px] text-amber-600 font-medium mt-0.5">Below buffer limit</div>
              </div>

              <div className="p-3.5 sm:p-5 rounded-2xl bg-purple-50/70 border border-purple-200 shadow-2xs">
                <div className="text-[10px] sm:text-xs font-bold uppercase text-purple-700 mb-1">
                  Active Categories
                </div>
                <div className="text-lg sm:text-2xl font-black text-purple-900">
                  {categories.length - 1} Categories
                </div>
                <div className="text-[10px] text-purple-600 font-medium mt-0.5">Dairy, Meats, Groceries</div>
              </div>
            </div>

            {/* Comprehensive Stock Audit Table */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs border border-[#F0E6DF] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                    Stock Audit & Consumption Breakdown
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">Opening stock vs kitchen usage & remaining balance</p>
                </div>
                <span className="text-xs text-gray-500 font-bold">
                  {stockItems.length} Total Ingredients
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="text-[11px] font-black text-gray-400 uppercase border-b border-gray-200 pb-2">
                      <th className="py-2 px-3">Item Name</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-center">Opening</th>
                      <th className="py-2 px-3 text-center text-rose-600">Consumed (-)</th>
                      <th className="py-2 px-3 text-center">Closing Stock</th>
                      <th className="py-2 px-3 text-right">Est. Value</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {stockItems.map(item => {
                      const isOutOfStock = item.currentStock === 0;
                      const isLowStock = item.currentStock > 0 && item.currentStock <= item.minThreshold;
                      const itemValuation = item.currentStock * item.unitCost;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{item.image}</span>
                              <span className="font-black text-gray-900">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-gray-500">{item.category}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-gray-600">
                            {item.openingStock} {item.unit}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-rose-600 bg-rose-50/40">
                            {item.consumed} {item.unit}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-black text-gray-900">
                            {item.currentStock} {item.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-gray-900">
                            ₹{itemValuation.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700">
                                Depleted
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                                Low
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
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
              <div className="bg-amber-50/50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-amber-200 space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-700" />
                    <h4 className="text-xs sm:text-sm font-black text-amber-900">
                      Immediate Re-orders ({urgentReorders.length})
                    </h4>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-700">
                    &lt; Min Buffer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {urgentReorders.map(item => (
                    <div key={item.id} className="bg-white p-2.5 sm:p-3 rounded-xl border border-amber-200/80 shadow-2xs flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-black text-gray-900 truncate">{item.name}</div>
                        <div className="text-[10px] text-gray-500 font-medium truncate">{item.supplier}</div>
                        <div className="text-[10px] text-amber-700 font-bold mt-0.5">
                          Left: {item.currentStock} {item.unit}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedItemForRestock(item);
                          setRestockQty(10);
                          setUpdatedThreshold(item.minThreshold);
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black shrink-0 cursor-pointer active:scale-95 shadow-2xs"
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
          <div className="max-w-2xl mx-auto bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xs border border-[#F0E6DF] space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <span className="w-12 h-12 rounded-2xl bg-[#FFF0E6] text-[#f05a24] flex items-center justify-center text-2xl font-black border border-[#f05a24]/20 shadow-2xs">
                {newItemEmoji}
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                  Add New Store Ingredient / Item
                </h3>
                <p className="text-xs text-gray-400 font-medium">Add raw material or beverage to kitchen inventory</p>
              </div>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                  Choose Icon / Emoji
                </label>
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {['🧀', '🧈', '🍗', '🥩', '🍚', '🛢️', '🧅', '🍅', '🧄', '🥔', '🥤', '💧', '🍄', '📦'].map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewItemEmoji(em)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all cursor-pointer shrink-0 ${
                        newItemEmoji === em
                          ? 'bg-[#FFF0E6] border-[#f05a24] shadow-xs'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                  Ingredient / Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amul Butter, Fresh Mutton, Garlic Paste"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a24]/30 focus:border-[#f05a24]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a24]/30 focus:border-[#f05a24] bg-white"
                  >
                    <option value="Dairy & Cheese">Dairy & Cheese</option>
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Kitchen Staples">Kitchen Staples</option>
                    <option value="Fresh Produce">Fresh Produce</option>
                    <option value="Packaged Beverages">Packaged Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                    Measuring Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a24]/30 focus:border-[#f05a24] bg-white"
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
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                    Starting Stock ({newItemUnit})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a24]/30 focus:border-[#f05a24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                    Alert Buffer Threshold ({newItemUnit})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={newItemThreshold}
                    onChange={(e) => setNewItemThreshold(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a24]/30 focus:border-[#f05a24]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                    Cost per {newItemUnit} (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemUnitCost}
                    onChange={(e) => setNewItemUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a24]/30 focus:border-[#f05a24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amul, Metro Wholesale"
                    value={newItemSupplier}
                    onChange={(e) => setNewItemSupplier(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a24]/30 focus:border-[#f05a24]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => handleTabChange('inventory')}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newItemName.trim()}
                  className="flex-1 py-2.5 px-4 bg-[#f05a24] hover:bg-[#d94815] text-white text-xs font-black rounded-xl shadow-md shadow-[#f05a24]/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedItemForRestock(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#F0E6DF] space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-2xl bg-[#FFF0E6] flex items-center justify-center text-2xl border border-[#f05a24]/20">
                  {selectedItemForRestock.image}
                </span>
                <div>
                  <h3 className="text-base font-black text-gray-900 leading-tight">
                    Restock {selectedItemForRestock.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">
                    Current: {selectedItemForRestock.currentStock} {selectedItemForRestock.unit}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForRestock(null)}
                className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Restock Form */}
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                  Quantity to Add ({selectedItemForRestock.unit})
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {[5, 10, 25, 50].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRestockQty(val)}
                      className={`flex-1 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                        restockQty === val 
                          ? 'bg-[#f05a24] text-white border-[#f05a24] shadow-xs' 
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
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
                  className="w-full px-3.5 py-2.5 text-sm font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a24]/30 focus:border-[#f05a24]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
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
                  className="w-full px-3.5 py-2.5 text-sm font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a24]/30 focus:border-[#f05a24]"
                />
                <p className="text-[11px] text-gray-400 mt-1">Alert triggers when raw stock drops below this buffer.</p>
              </div>

              <div className="p-3 bg-[#FFF0E6]/60 rounded-2xl border border-[#f05a24]/20 text-xs space-y-1">
                <div className="flex justify-between font-bold text-gray-700">
                  <span>Current Store Room Stock:</span>
                  <span>{selectedItemForRestock.currentStock} {selectedItemForRestock.unit}</span>
                </div>
                <div className="flex justify-between font-bold text-[#f05a24]">
                  <span>New Store Room Total:</span>
                  <span className="font-black text-sm">{parseFloat((selectedItemForRestock.currentStock + restockQty).toFixed(1))} {selectedItemForRestock.unit}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForRestock(null)}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restockQty <= 0}
                  className="flex-1 py-2.5 px-4 bg-[#f05a24] hover:bg-[#d94815] text-white text-xs font-black rounded-xl shadow-md shadow-[#f05a24]/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
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
};

export default StockPage;
