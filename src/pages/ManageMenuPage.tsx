import React, { useState, useEffect } from 'react';
import { Utensils, Plus, Edit2, Trash2, Search, X, RotateCw, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import { API_BASE_URL, getRestaurantId } from '../config';

interface MenuItem {
  item_id: string;
  category_id: string;
  item_name: string;
  price: string | number;
  dietary_info?: string;
  is_veg?: boolean;
}

interface Category {
  category_id: string;
  category_name: string;
  items?: MenuItem[];
}

const getDietaryType = (item: any): 'Veg' | 'Non-Veg' | 'Egg' => {
  const info = (item.dietary_info || '').toLowerCase();
  const nameLower = (item.item_name || '').toLowerCase();

  if (info === 'egg' || nameLower.includes('egg')) {
    return 'Egg';
  }
  if (
    info === 'non-veg' ||
    info === 'non veg' ||
    nameLower.includes('non veg') ||
    nameLower.includes('non-veg') ||
    nameLower.includes('chicken') ||
    nameLower.includes('mutton') ||
    nameLower.includes('fish') ||
    nameLower.includes('prawn') ||
    nameLower.includes('meat') ||
    nameLower.includes('kabab') ||
    nameLower.includes('kebab')
  ) {
    return 'Non-Veg';
  }
  if (item.is_veg === false) {
    return 'Non-Veg';
  }
  return 'Veg';
};

const ManageMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const savedUser = localStorage.getItem('emenu_user');
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const roleAlias = (currentUser?.role_alias || currentUser?.role || '').toLowerCase();
  const isAdmin = roleAlias === 'super_admin' || roleAlias === 'admin';

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // Mobile Tab State
  const [activeMobileTab, setActiveMobileTab] = useState<'categories' | 'items'>('items');

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('All');

  // Item Form State
  const [showStats, setShowStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'All' | 'Veg' | 'Non-Veg' | 'Egg'>('All');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItemData, setNewItemData] = useState({
    item_name: '',
    price: '',
    dietary_info: 'Veg',
    category_id: ''
  });
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const totalItemsCount = menuItems.length;
  const vegItemsCount = menuItems.filter(item => getDietaryType(item) === 'Veg').length;
  const nonVegItemsCount = menuItems.filter(item => getDietaryType(item) === 'Non-Veg').length;
  const eggItemsCount = menuItems.filter(item => getDietaryType(item) === 'Egg').length;

  const fetchMenuData = async () => {
    setLoading(true);
    try {
      const rid = getRestaurantId();
      let res = await fetch(`${API_BASE_URL}/menus/${rid}`).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`${API_BASE_URL}/menu/restaurant/${rid}`).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        const rawCats = data?.categories || data?.data?.categories || data?.data || data || [];
        const cats: Category[] = Array.isArray(rawCats) ? rawCats : [];
        setCategories(cats);

        // Flatten all items
        const allItems: MenuItem[] = [];
        cats.forEach(c => {
          if (c.items && Array.isArray(c.items)) {
            c.items.forEach(i => {
              allItems.push({
                ...i,
                item_id: String(i.item_id),
                category_id: String(i.category_id || c.category_id),
                price: parseFloat(String(i.price)).toFixed(2)
              });
            });
          }
        });
        setMenuItems(allItems);
        localStorage.setItem('emenu_categories', JSON.stringify(cats));
      }
    } catch (err: any) {
      console.warn('Failed to load menu from API, using cached menu:', err);
      const cachedStr = localStorage.getItem('emenu_categories');
      if (cachedStr) {
        try {
          const cats = JSON.parse(cachedStr);
          setCategories(cats);
          const allItems: MenuItem[] = [];
          cats.forEach((c: any) => {
            if (c.items && Array.isArray(c.items)) {
              c.items.forEach((i: any) => {
                allItems.push({
                  ...i,
                  item_id: String(i.item_id),
                  category_id: String(i.category_id || c.category_id),
                  price: parseFloat(String(i.price)).toFixed(2)
                });
              });
            }
          });
          setMenuItems(allItems);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access restricted to Admin only.');
      navigate('/', { replace: true });
      return;
    }
    fetchMenuData();
  }, [isAdmin, navigate]);

  // Handle Category Add/Update
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const rid = getRestaurantId();

    if (editingCategory) {
      const catId = editingCategory.category_id;
      try {
        await fetch(`${API_BASE_URL}/categories/${catId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurant_id: rid,
            category_name: newCatName.trim(),
            status: 1
          })
        }).catch(() => null);

        setCategories(prev => prev.map(c => String(c.category_id) === String(catId) ? { ...c, category_name: newCatName.trim() } : c));
        setEditingCategory(null);
        setNewCatName('');
        toast.success("Category updated successfully!");
      } catch (err) {
        toast.error("Failed to update category.");
      }
    } else {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurant_id: rid,
            category_name: newCatName.trim(),
            status: 1
          })
        });

        if (response.ok) {
          const resData = await response.json();
          const createdCat = resData.data || resData;
          const catId = String(createdCat.category_id || `cat_${Date.now()}`);
          const newCat: Category = { category_id: catId, category_name: newCatName.trim(), items: [] };
          setCategories(prev => [...prev, newCat]);
          setNewCatName('');
          toast.success("Category created successfully!");
        } else {
          throw new Error();
        }
      } catch (err) {
        const mockId = `cat_${Date.now()}`;
        setCategories(prev => [...prev, { category_id: mockId, category_name: newCatName.trim(), items: [] }]);
        setNewCatName('');
        toast.success("Category created successfully!");
      }
    }
  };

  // Handle Category Delete
  const handleDeleteCategory = async (cat: Category) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.category_name}"?`)) return;
    try {
      await fetch(`${API_BASE_URL}/categories/${cat.category_id}`, { method: 'DELETE' }).catch(() => null);
    } catch {}
    setCategories(prev => prev.filter(c => String(c.category_id) !== String(cat.category_id)));
    setMenuItems(prev => prev.filter(i => String(i.category_id) !== String(cat.category_id)));
    if (editingCategory && String(editingCategory.category_id) === String(cat.category_id)) {
      setEditingCategory(null);
      setNewCatName('');
    }
    toast.success("Category deleted successfully!");
  };

  // Handle Item Add
  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.item_name || !newItemData.price || !newItemData.category_id) {
      toast.error("Please fill all required fields!");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/menus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: parseInt(newItemData.category_id),
          item_name: newItemData.item_name,
          price: parseFloat(newItemData.price),
          dietary_info: newItemData.dietary_info,
          status: 1
        })
      });

      const resData = response.ok ? await response.json() : null;
      const createdItem = resData?.data || resData || {};
      const newItem: MenuItem = {
        item_id: String(createdItem.item_id || `item_${Date.now()}`),
        category_id: String(newItemData.category_id),
        item_name: newItemData.item_name,
        price: parseFloat(newItemData.price).toFixed(2),
        dietary_info: newItemData.dietary_info
      };

      setMenuItems(prev => [...prev, newItem]);
      setCategories(prev => prev.map(c => String(c.category_id) === String(newItem.category_id) ? { ...c, items: [...(c.items || []), newItem] } : c));

      setNewItemData({ item_name: '', price: '', dietary_info: 'Veg', category_id: '' });
      setShowAddItemForm(false);
      toast.success("Menu item added successfully!");
    } catch (err: any) {
      toast.error("Failed to add menu item.");
    }
  };

  // Handle Item Update
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.item_name || !editingItem.price) return;

    try {
      await fetch(`${API_BASE_URL}/menus/${editingItem.item_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: parseInt(editingItem.category_id),
          item_name: editingItem.item_name,
          price: parseFloat(String(editingItem.price)),
          dietary_info: editingItem.dietary_info || 'Veg',
          status: 1
        })
      }).catch(() => null);

      const updatedObj: MenuItem = {
        ...editingItem,
        item_id: String(editingItem.item_id),
        category_id: String(editingItem.category_id),
        price: parseFloat(String(editingItem.price)).toFixed(2)
      };

      setMenuItems(prev => prev.map(i => String(i.item_id) === String(editingItem.item_id) ? updatedObj : i));
      setCategories(prev => prev.map(cat => ({
        ...cat,
        items: (cat.items || []).map(i => String(i.item_id) === String(editingItem.item_id) ? updatedObj : i)
      })));

      setEditingItem(null);
      toast.success("Menu item updated successfully!");
    } catch (err) {
      toast.error("Failed to update item.");
    }
  };

  // Handle Item Delete
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await fetch(`${API_BASE_URL}/menus/${itemId}`, { method: 'DELETE' }).catch(() => null);
    } catch {}

    setMenuItems(prev => prev.filter(i => String(i.item_id) !== String(itemId)));
    setCategories(prev => prev.map(cat => ({
      ...cat,
      items: (cat.items || []).filter(i => String(i.item_id) !== String(itemId))
    })));
    toast.success("Menu item deleted successfully!");
  };

  // Filtered Menu Items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategoryId === 'All' || String(item.category_id) === String(selectedCategoryId);
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    const dietary = getDietaryType(item);
    const matchesDietary = dietaryFilter === 'All' || dietary === dietaryFilter;
    return matchesCategory && matchesSearch && matchesDietary;
  });

  return (
    <div className="min-h-screen bg-[#FAF6F0] font-sans pb-12">
      <Header />

      <div className="mt-4 px-[3%] py-4 max-w-[1200px] mx-auto box-border">
        {/* Clean Open Header Title */}
        <div className="flex items-center justify-between mb-5 px-1">
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">Menu & Category Management</h1>
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium hidden sm:block">Add/edit categories, dishes, prices, and dietary tags</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowStats(!showStats)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs sm:text-sm font-extrabold transition-all cursor-pointer border ${
                showStats
                  ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs'
                  : 'bg-white text-gray-700 border-[#F0E6DF] hover:bg-gray-50 shadow-2xs'
              }`}
            >
              <BarChart2 size={14} className={showStats ? 'text-amber-400' : 'text-gray-500'} />
              <span>{showStats ? 'Close Stats' : 'Stats'}</span>
            </button>
            <button 
              type="button"
              onClick={fetchMenuData}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#F0E6DF] rounded-[8px] shadow-2xs hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <RotateCw size={14} className={loading ? 'animate-spin text-[#f05a24]' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Overlay Pop-up Modal for Summary Stats */}
        {showStats && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in"
            onClick={() => setShowStats(false)}
          >
            <div 
              className="w-full max-w-[480px] bg-white rounded-3xl p-5 shadow-2xl space-y-4 border border-gray-100 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h6 className="font-extrabold text-gray-900 text-base flex items-center gap-2 m-0">
                  <BarChart2 size={20} className="text-[#f05a24]" /> Menu Summary Stats
                </h6>
                <button
                  type="button"
                  onClick={() => setShowStats(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 cursor-pointer transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-500 block uppercase">Total Dishes</span>
                    <strong className="text-slate-900 text-lg font-black">{totalItemsCount}</strong>
                  </div>
                  <span className="text-2xl">📦</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[11px] font-extrabold text-emerald-700 block uppercase">Pure Veg</span>
                    <strong className="text-emerald-900 text-lg font-black">{vegItemsCount}</strong>
                  </div>
                  <span className="w-5 h-5 border-2 border-[#00B074] flex items-center justify-center p-0.5 rounded-sm bg-white">
                    <span className="w-2 h-2 rounded-full bg-[#00B074]"></span>
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[11px] font-extrabold text-rose-700 block uppercase">Non-Veg</span>
                    <strong className="text-rose-900 text-lg font-black">{nonVegItemsCount}</strong>
                  </div>
                  <span className="w-5 h-5 border-2 border-[#E53935] flex items-center justify-center p-0.5 rounded-sm bg-white">
                    <span className="w-2 h-2 rounded-full bg-[#E53935]"></span>
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[11px] font-extrabold text-amber-700 block uppercase">Egg Dishes</span>
                    <strong className="text-amber-900 text-lg font-black">{eggItemsCount}</strong>
                  </div>
                  <span className="w-5 h-5 border-2 border-[#FFB300] flex items-center justify-center p-0.5 rounded-sm bg-white">
                    <span className="w-2 h-2 rounded-full bg-[#FFB300]"></span>
                  </span>
                </div>
              </div>

              {/* Dietary Ratio Progress Bar */}
              {totalItemsCount > 0 && (
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-gray-600">
                    <span>Dietary Ratio Breakdown</span>
                    <span className="text-emerald-600">
                      {((vegItemsCount / totalItemsCount) * 100).toFixed(0)}% Pure Veg
                    </span>
                  </div>
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden flex shadow-2xs">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${(vegItemsCount / totalItemsCount) * 100}%` }}
                      title={`Veg: ${vegItemsCount}`}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all"
                      style={{ width: `${(nonVegItemsCount / totalItemsCount) * 100}%` }}
                      title={`Non-Veg: ${nonVegItemsCount}`}
                    />
                    <div
                      className="bg-amber-500 h-full transition-all"
                      style={{ width: `${(eggItemsCount / totalItemsCount) * 100}%` }}
                      title={`Egg: ${eggItemsCount}`}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowStats(false)}
                  className="w-full py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
                >
                  Close Stats
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Segmented Control Bar (Only rendered on small screens) */}
        <div className="flex lg:hidden items-center bg-gray-200/80 p-1 rounded-2xl mb-5 border border-gray-300/60 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveMobileTab('items')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMobileTab === 'items'
                ? 'bg-white text-[#f05a24] shadow-xs'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <Utensils size={14} />
            <span>Dishes ({menuItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('categories')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMobileTab === 'categories'
                ? 'bg-white text-[#f05a24] shadow-xs'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <Plus size={14} />
            <span>Categories ({categories.length})</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 font-bold text-[#f05a24]">Loading Menu Directory...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: Categories Management (4 Cols desktop, Mobile Segmented Tab controlled) */}
            <div className={`lg:col-span-4 space-y-4 ${activeMobileTab === 'categories' ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#F0E6DF] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h6 className="font-extrabold text-gray-900 text-sm m-0">Categories ({categories.length})</h6>
                </div>

                {/* Add / Edit Category Form (Positioned at TOP for fast mobile access) */}
                <form onSubmit={handleSaveCategory} className="pb-3 border-b border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase">
                      {editingCategory ? "Edit Category" : "Add Category"}
                    </label>
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          setNewCatName('');
                        }}
                        className="text-[11px] font-extrabold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <X size={12} /> Cancel
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Category Name"
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#f05a24] outline-none"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-[#f05a24] hover:bg-[#d94815] text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-xs"
                    >
                      {editingCategory ? "Update" : "Add"}
                    </button>
                  </div>
                </form>

                {/* Categories List */}
                <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                  <div
                    onClick={() => {
                      setSelectedCategoryId('All');
                      setActiveMobileTab('items');
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer font-bold text-xs transition-all ${selectedCategoryId === 'All'
                        ? 'bg-[#FFF0E6] text-[#f05a24] border border-[#f05a24]/30 shadow-2xs'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/60'
                      }`}
                  >
                    <span>All Categories</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FFF0E6] text-[#f05a24] border border-[#f05a24]/20">
                      {menuItems.length}
                    </span>
                  </div>

                  {categories.map((cat) => {
                    const isSelected = String(selectedCategoryId) === String(cat.category_id);
                    const itemCount = menuItems.filter(i => String(i.category_id) === String(cat.category_id)).length;
                    return (
                      <div
                        key={cat.category_id}
                        onClick={() => {
                          setSelectedCategoryId(cat.category_id);
                          setActiveMobileTab('items');
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer font-bold text-xs transition-all ${isSelected
                            ? 'bg-[#FFF0E6] text-[#f05a24] border border-[#f05a24]/30 shadow-2xs'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/60'
                          }`}
                      >
                        <span className="truncate max-w-[140px]">{cat.category_name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FFF0E6] text-[#f05a24] border border-[#f05a24]/20">
                            {itemCount}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory(cat);
                              setNewCatName(cat.category_name);
                            }}
                            className="p-1 text-gray-500 hover:text-[#f05a24] rounded-md transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(cat);
                            }}
                            className="p-1 text-gray-500 hover:text-rose-600 rounded-md transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Menu Directory & Item Cards (8 Cols desktop, Mobile Segmented Tab controlled) */}
            <div className={`lg:col-span-8 space-y-4 ${activeMobileTab === 'items' ? 'block' : 'hidden lg:block'}`}>
              {/* Search & Dietary Filter */}
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#F0E6DF] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#f05a24] outline-none"
                  />
                  <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Dietary Filter Pills */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                  {(['All', 'Veg', 'Non-Veg', 'Egg'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setDietaryFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${dietaryFilter === filter
                          ? filter === 'Veg' ? 'bg-emerald-600 text-white shadow-xs' : filter === 'Non-Veg' ? 'bg-rose-600 text-white shadow-xs' : filter === 'Egg' ? 'bg-amber-500 text-white shadow-xs' : 'bg-[#1E1F24] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Directory Header (Full width -mx-3 on mobile) */}
              <div className="bg-white -mx-3 sm:mx-0 rounded-none sm:rounded-2xl p-3 sm:p-5 shadow-xs border-y sm:border border-[#F0E6DF] space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100 px-1 sm:px-0">
                  <div>
                    <h6 className="font-extrabold text-gray-900 text-sm m-0">Menu Directory ({filteredMenuItems.length})</h6>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddItemForm(!showAddItemForm);
                      if (!newItemData.category_id && categories.length > 0) {
                        setNewItemData(prev => ({ ...prev, category_id: categories[0].category_id }));
                      }
                    }}
                    className="bg-[#f05a24] hover:bg-[#d94815] text-white font-extrabold px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {showAddItemForm ? <X size={14} /> : <Plus size={14} />}
                    <span>{showAddItemForm ? "Close Form" : "Add Menu Item"}</span>
                  </button>
                </div>

                {/* Add Item Overlay Modal Popup */}
                {showAddItemForm && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
                    onClick={() => setShowAddItemForm(false)}
                  >
                    <div
                      className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 border border-gray-100 animate-scale-up"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <h6 className="font-extrabold text-[#f05a24] text-base flex items-center gap-2 m-0">
                          ➕ Add New Dish to Menu
                        </h6>
                        <button type="button" onClick={() => setShowAddItemForm(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 cursor-pointer">
                          <X size={20} />
                        </button>
                      </div>

                      <form onSubmit={handleAddNewItem} className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-extrabold text-gray-600 uppercase mb-1">Item Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Paneer Butter Masala"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#f05a24] focus:ring-2 focus:ring-[#f05a24]/20 outline-none bg-white"
                              value={newItemData.item_name}
                              onChange={(e) => setNewItemData(prev => ({ ...prev, item_name: e.target.value }))}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-extrabold text-gray-600 uppercase mb-1">Category *</label>
                              <select
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:border-[#f05a24] outline-none bg-white"
                                value={newItemData.category_id}
                                onChange={(e) => setNewItemData(prev => ({ ...prev, category_id: e.target.value }))}
                              >
                                {categories.map(c => (
                                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-extrabold text-gray-600 uppercase mb-1">Price (₹) *</label>
                              <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="299.00"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#f05a24] outline-none bg-white"
                                value={newItemData.price}
                                onChange={(e) => setNewItemData(prev => ({ ...prev, price: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-extrabold text-gray-600 uppercase mb-1">Dietary Tag *</label>
                            <select
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:border-[#f05a24] outline-none bg-white"
                              value={newItemData.dietary_info}
                              onChange={(e) => setNewItemData(prev => ({ ...prev, dietary_info: e.target.value }))}
                            >
                              <option value="Veg">Pure Veg 🟢</option>
                              <option value="Non-Veg">Non-Veg 🔴</option>
                              <option value="Egg">Egg 🟡</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setShowAddItemForm(false)}
                            className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2.5 bg-[#f05a24] hover:bg-[#d94815] text-white font-bold rounded-xl text-xs shadow-md cursor-pointer transition-all active:scale-95"
                          >
                            Add to Menu
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Edit Item Overlay Modal Popup */}
                {editingItem && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
                    onClick={() => setEditingItem(null)}
                  >
                    <div
                      className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 border border-gray-100 animate-scale-up"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <h6 className="font-extrabold text-[#f05a24] text-base flex items-center gap-2 m-0">
                          ✏️ Edit Dish Details
                        </h6>
                        <button type="button" onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 cursor-pointer">
                          <X size={20} />
                        </button>
                      </div>

                      <form onSubmit={handleUpdateItem} className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-extrabold text-gray-600 uppercase mb-1">Item Name *</label>
                            <input
                              type="text"
                              required
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#f05a24] focus:ring-2 focus:ring-[#f05a24]/20 outline-none bg-white"
                              value={editingItem.item_name}
                              onChange={(e) => setEditingItem(prev => prev ? { ...prev, item_name: e.target.value } : null)}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-extrabold text-gray-600 uppercase mb-1">Category *</label>
                              <select
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:border-[#f05a24] outline-none bg-white"
                                value={editingItem.category_id}
                                onChange={(e) => setEditingItem(prev => prev ? { ...prev, category_id: e.target.value } : null)}
                              >
                                {categories.map(c => (
                                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-extrabold text-gray-600 uppercase mb-1">Price (₹) *</label>
                              <input
                                type="number"
                                step="0.01"
                                required
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#f05a24] outline-none bg-white"
                                value={editingItem.price}
                                onChange={(e) => setEditingItem(prev => prev ? { ...prev, price: e.target.value } : null)}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-extrabold text-gray-600 uppercase mb-1">Dietary Tag *</label>
                            <select
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:border-[#f05a24] outline-none bg-white"
                              value={editingItem.dietary_info || 'Veg'}
                              onChange={(e) => setEditingItem(prev => prev ? { ...prev, dietary_info: e.target.value } : null)}
                            >
                              <option value="Veg">Pure Veg 🟢</option>
                              <option value="Non-Veg">Non-Veg 🔴</option>
                              <option value="Egg">Egg 🟡</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2.5 bg-[#f05a24] hover:bg-[#d94815] text-white font-bold rounded-xl text-xs shadow-md cursor-pointer transition-all active:scale-95"
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Items Grid (2 Columns on mobile, 3 Columns on desktop) */}
                {filteredMenuItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 font-bold text-xs">
                    No menu items found matching the selected filters.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3.5">
                    {filteredMenuItems.map((item) => {
                      const catName = categories.find(c => String(c.category_id) === String(item.category_id))?.category_name || 'General';
                      const dietary = getDietaryType(item);

                      return (
                        <div
                          key={item.item_id}
                          className="bg-white rounded-2xl p-2.5 sm:p-3.5 border border-[#F0E6DF] hover:border-[#f05a24]/50 hover:shadow-[0_4px_16px_rgba(240,90,36,0.06)] transition-all flex flex-col justify-between space-y-2 sm:space-y-3 group"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-[10px] font-extrabold text-[#f05a24] bg-[#FFF0E6] px-2 py-0.5 rounded-md border border-[#f05a24]/15 truncate max-w-[100px]">
                                {catName}
                              </span>
                              {dietary === 'Non-Veg' ? (
                                <span className="w-3.5 h-3.5 border border-rose-500 rounded-sm flex items-center justify-center p-0.5 shrink-0 bg-white" title="Non-Veg">
                                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                </span>
                              ) : dietary === 'Egg' ? (
                                <span className="w-3.5 h-3.5 border border-amber-500 rounded-sm flex items-center justify-center p-0.5 shrink-0 bg-white" title="Egg">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                </span>
                              ) : (
                                <span className="w-3.5 h-3.5 border border-emerald-500 rounded-sm flex items-center justify-center p-0.5 shrink-0 bg-white" title="Veg">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                </span>
                              )}
                            </div>

                            <h6 className="font-bold text-gray-800 text-xs sm:text-sm m-0 line-clamp-1 group-hover:text-[#f05a24] transition-colors">
                              {item.item_name}
                            </h6>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[#F0E6DF]/60">
                            <span className="font-black text-gray-900 text-xs sm:text-sm tracking-tight">₹{parseFloat(String(item.price)).toFixed(2)}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingItem(item)}
                                className="p-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded-lg transition-colors cursor-pointer"
                                title="Edit Item"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.item_id)}
                                className="p-1.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-700 rounded-lg transition-colors cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMenuPage;
