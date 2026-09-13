import React, { useState, useEffect } from 'react';
import { 
  Utensils, Plus, Edit2, Trash2, Search, X, RotateCw, BarChart2, 
  ChevronLeft, ChevronRight, Lightbulb, LayoutGrid, List, Upload, Image as ImageIcon 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DesktopLayout from '../components/DesktopLayout';
import { MobileHeader, MobileFooter } from '../components/mobile';
import { API_BASE_URL, getRestaurantId } from '../config';
import { useTheme } from '../context/ThemeContext';

interface MenuItem {
  item_id: string;
  category_id: string;
  item_name: string;
  price: string | number;
  dietary_info?: string;
  is_veg?: boolean;
  image?: string;
  image_url?: string;
  tax_rate?: string;
  kot_station?: string;
  description?: string;
}

interface Category {
  category_id: string;
  category_name: string;
  parent_id?: string | null;
  image_url?: string;
  display_order?: number;
  description?: string;
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

const getFoodItemImage = (item: any, isDark: boolean = false): string => {
  const fallback = isDark ? '/images/dark_default_image.png' : '/images/default_image.png';
  const img = item.image || item.image_url;
  if (img && typeof img === 'string' && img.trim() !== '' && !img.includes('default_image.png')) {
    return img;
  }
  return fallback;
};

const getCategoryImage = (cat: Category, isDark: boolean = false): string => {
  const fallback = isDark ? '/images/dark_default_image.png' : '/images/default_image.png';
  if (cat.image_url && typeof cat.image_url === 'string' && cat.image_url.trim() !== '' && !cat.image_url.includes('default_image.png')) {
    return cat.image_url;
  }
  return fallback;
};

const ManageMenuPage: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const savedUser = localStorage.getItem('emenu_user');
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const roleAlias = (currentUser?.role_alias || currentUser?.role || '').toLowerCase();
  const isAdmin = roleAlias === 'super_admin' || roleAlias === 'admin';

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // View Mode: Grid or List
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mobile Tab State
  const [activeMobileTab, setActiveMobileTab] = useState<'categories' | 'items'>('items');

  // Category Search & Form State
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [categoryParentId, setCategoryParentId] = useState<string>('none');
  const [categoryImageUrl, setCategoryImageUrl] = useState('');
  const [categoryDisplayOrder, setCategoryDisplayOrder] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('All');

  // Item Form & Filter State
  const [showStats, setShowStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'All' | 'Veg' | 'Non-Veg' | 'Egg'>('All');
  const [sortBy, setSortBy] = useState<'default' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'>('default');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItemData, setNewItemData] = useState({
    item_name: '',
    price: '',
    dietary_info: 'Non-Veg',
    category_id: '',
    tax_rate: '5% GST (Standard Food)',
    kot_station: 'Main Kitchen',
    image_url: '',
    description: ''
  });
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

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

  const openAddCategoryDrawer = () => {
    setEditingCategory(null);
    setNewCatName('');
    setCategoryParentId('none');
    setCategoryImageUrl('');
    setCategoryDisplayOrder('');
    setCategoryDescription('');
    setShowAddCategoryModal(true);
  };

  const openEditCategoryDrawer = (cat: Category) => {
    setEditingCategory(cat);
    setNewCatName(cat.category_name);
    setCategoryParentId(cat.parent_id || 'none');
    setCategoryImageUrl(cat.image_url || '');
    setCategoryDisplayOrder(cat.display_order ? String(cat.display_order) : '');
    setCategoryDescription(cat.description || '');
    setShowAddCategoryModal(true);
  };

  const handleImageFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (base64Url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  // Handle Category Add/Update
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const rid = getRestaurantId();
    const parentIdVal = categoryParentId === 'none' ? null : categoryParentId;

    if (editingCategory) {
      const catId = editingCategory.category_id;
      try {
        await fetch(`${API_BASE_URL}/categories/${catId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurant_id: rid,
            category_name: newCatName.trim(),
            parent_id: parentIdVal,
            image_url: categoryImageUrl || undefined,
            status: 1
          })
        }).catch(() => null);

        setCategories(prev => prev.map(c => String(c.category_id) === String(catId) ? { 
          ...c, 
          category_name: newCatName.trim(),
          parent_id: parentIdVal,
          image_url: categoryImageUrl,
          description: categoryDescription,
          display_order: categoryDisplayOrder ? parseInt(categoryDisplayOrder) : c.display_order
        } : c));
        setEditingCategory(null);
        setNewCatName('');
        setCategoryParentId('none');
        setCategoryImageUrl('');
        setCategoryDisplayOrder('');
        setCategoryDescription('');
        setShowAddCategoryModal(false);
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
            parent_id: parentIdVal,
            image_url: categoryImageUrl || undefined,
            status: 1
          })
        });

        if (response.ok) {
          const resData = await response.json();
          const createdCat = resData.data || resData;
          const catId = String(createdCat.category_id || `cat_${Date.now()}`);
          const newCat: Category = { 
            category_id: catId, 
            category_name: newCatName.trim(), 
            parent_id: parentIdVal,
            image_url: categoryImageUrl,
            description: categoryDescription,
            display_order: categoryDisplayOrder ? parseInt(categoryDisplayOrder) : undefined,
            items: [] 
          };
          setCategories(prev => [...prev, newCat]);
          if (!newItemData.category_id) {
            setNewItemData(prev => ({ ...prev, category_id: catId }));
          }
          setNewCatName('');
          setCategoryParentId('none');
          setCategoryImageUrl('');
          setCategoryDisplayOrder('');
          setCategoryDescription('');
          setShowAddCategoryModal(false);
          toast.success("Category created successfully!");
        } else {
          throw new Error();
        }
      } catch (err) {
        const mockId = `cat_${Date.now()}`;
        const newCat: Category = { 
          category_id: mockId, 
          category_name: newCatName.trim(), 
          parent_id: parentIdVal,
          image_url: categoryImageUrl,
          description: categoryDescription,
          display_order: categoryDisplayOrder ? parseInt(categoryDisplayOrder) : undefined,
          items: [] 
        };
        setCategories(prev => [...prev, newCat]);
        if (!newItemData.category_id) {
          setNewItemData(prev => ({ ...prev, category_id: mockId }));
        }
        setNewCatName('');
        setCategoryParentId('none');
        setCategoryImageUrl('');
        setCategoryDisplayOrder('');
        setCategoryDescription('');
        setShowAddCategoryModal(false);
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
          image: newItemData.image_url || undefined,
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
        dietary_info: newItemData.dietary_info,
        image_url: newItemData.image_url,
        tax_rate: newItemData.tax_rate,
        kot_station: newItemData.kot_station,
        description: newItemData.description
      };

      setMenuItems(prev => [...prev, newItem]);
      setCategories(prev => prev.map(c => String(c.category_id) === String(newItem.category_id) ? { ...c, items: [...(c.items || []), newItem] } : c));

      setNewItemData({ 
        item_name: '', 
        price: '', 
        dietary_info: 'Non-Veg', 
        category_id: categories.length > 0 ? categories[0].category_id : '',
        tax_rate: '5% GST (Standard Food)',
        kot_station: 'Main Kitchen',
        image_url: '',
        description: ''
      });
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
          image: editingItem.image_url || undefined,
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

  // Filter Categories by Category Search
  const filteredCategories = categories.filter(c => 
    c.category_name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  // Filtered Menu Items
  let filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategoryId === 'All' || String(item.category_id) === String(selectedCategoryId);
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    const dietary = getDietaryType(item);
    const matchesDietary = dietaryFilter === 'All' || dietary === dietaryFilter;
    return matchesCategory && matchesSearch && matchesDietary;
  });

  // Sort Menu Items
  if (sortBy === 'name-asc') {
    filteredMenuItems.sort((a, b) => a.item_name.localeCompare(b.item_name));
  } else if (sortBy === 'name-desc') {
    filteredMenuItems.sort((a, b) => b.item_name.localeCompare(a.item_name));
  } else if (sortBy === 'price-asc') {
    filteredMenuItems.sort((a, b) => parseFloat(String(a.price)) - parseFloat(String(b.price)));
  } else if (sortBy === 'price-desc') {
    filteredMenuItems.sort((a, b) => parseFloat(String(b.price)) - parseFloat(String(a.price)));
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredMenuItems.slice(startIndex, startIndex + itemsPerPage);

  const renderManageMenuBody = (isMobile: boolean = false) => (
    <div className={`box-border w-full ${isMobile ? 'p-3 pb-24' : 'px-4 py-3 sm:px-6 max-w-[1400px] mx-auto space-y-3.5'}`}>
      
      {/* -------------------------------------------------------------
          HEADER ROW: Page Title & Global Actions
      ------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate m-0">
            Menu & Category Management
          </h1>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
              showStats
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white dark:bg-[#18181b] text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-2xs'
            }`}
          >
            <BarChart2 size={13} className={showStats ? 'text-amber-400' : 'text-slate-500'} />
            <span>Stats</span>
          </button>

          <button 
            type="button"
            onClick={fetchMenuData}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-lg shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-medium transition-all active:scale-95 cursor-pointer"
          >
            <RotateCw size={13} className={loading ? 'animate-spin text-[#ff5520]' : 'text-slate-500'} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          STATS MODAL POPUP
      ------------------------------------------------------------- */}
      {showStats && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setShowStats(false)}
        >
          <div 
            className="w-full max-w-[460px] bg-white dark:bg-[#18181b] rounded-2xl p-5 shadow-2xl space-y-3.5 border border-slate-100 dark:border-zinc-800 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-zinc-800">
              <h6 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2 m-0">
                <BarChart2 size={18} className="text-[#ff5520]" /> Menu Summary Stats
              </h6>
              <button
                type="button"
                onClick={() => setShowStats(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">Total Dishes</span>
                  <strong className="text-slate-900 dark:text-white text-base font-bold">{totalItemsCount}</strong>
                </div>
                <span className="text-xl">📦</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block uppercase">Pure Veg</span>
                  <strong className="text-emerald-900 dark:text-emerald-200 text-base font-bold">{vegItemsCount}</strong>
                </div>
                <span className="w-4 h-4 border-2 border-[#00B074] flex items-center justify-center p-0.5 rounded-xs bg-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B074]"></span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 block uppercase">Non-Veg</span>
                  <strong className="text-rose-900 dark:text-rose-200 text-base font-bold">{nonVegItemsCount}</strong>
                </div>
                <span className="w-4 h-4 border-2 border-[#E53935] flex items-center justify-center p-0.5 rounded-xs bg-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E53935]"></span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 block uppercase">Egg Dishes</span>
                  <strong className="text-amber-900 dark:text-amber-200 text-base font-bold">{eggItemsCount}</strong>
                </div>
                <span className="w-4 h-4 border-2 border-[#FFB300] flex items-center justify-center p-0.5 rounded-xs bg-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFB300]"></span>
                </span>
              </div>
            </div>

            {totalItemsCount > 0 && (
              <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-zinc-400">
                  <span>Dietary Ratio Breakdown</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {((vegItemsCount / totalItemsCount) * 100).toFixed(0)}% Pure Veg
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden flex shadow-2xs">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${(vegItemsCount / totalItemsCount) * 100}%` }}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all"
                    style={{ width: `${(nonVegItemsCount / totalItemsCount) * 100}%` }}
                  />
                  <div
                    className="bg-amber-500 h-full transition-all"
                    style={{ width: `${(eggItemsCount / totalItemsCount) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStats(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition-all cursor-pointer shadow-xs"
              >
                Close Stats
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Segmented Control Bar */}
      <div className="flex lg:hidden items-center bg-slate-200/80 dark:bg-zinc-800 p-1 rounded-xl mb-3 border border-slate-300/60 dark:border-zinc-700 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveMobileTab('items')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMobileTab === 'items'
              ? 'bg-white dark:bg-zinc-900 text-[#ff5520] shadow-xs'
              : 'text-slate-700 dark:text-zinc-300'
          }`}
        >
          <Utensils size={13} />
          <span>Dishes ({menuItems.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('categories')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMobileTab === 'categories'
              ? 'bg-white dark:bg-zinc-900 text-[#ff5520] shadow-xs'
              : 'text-slate-700 dark:text-zinc-300'
          }`}
        >
          <Plus size={13} />
          <span>Categories ({categories.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 font-semibold text-[#ff5520] animate-pulse text-xs">
          Loading Menu Directory...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* =========================================================================
              LEFT COLUMN: MENU DIRECTORY & DISHES GRID (9 cols / ~75% width)
          ========================================================================= */}
          <div className={`lg:col-span-9 space-y-3 ${activeMobileTab === 'items' ? 'block' : 'hidden lg:block'}`}>
            
            {/* Top Search & Filter Bar */}
            <div className="bg-white dark:bg-[#18181b] rounded-xl p-3 shadow-xs border border-slate-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              
              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-normal text-slate-900 dark:text-white focus:border-[#ff5520] outline-none placeholder:text-slate-400"
                />
                <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Dietary Filter Pills & Sort Dropdown */}
              <div className="flex items-center justify-between gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => { setDietaryFilter('All'); setCurrentPage(1); }}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                      dietaryFilter === 'All'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All
                  </button>

                  <button
                    type="button"
                    onClick={() => { setDietaryFilter('Veg'); setCurrentPage(1); }}
                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      dietaryFilter === 'Veg'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Veg</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setDietaryFilter('Non-Veg'); setCurrentPage(1); }}
                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      dietaryFilter === 'Non-Veg'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>Non-Veg</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setDietaryFilter('Egg'); setCurrentPage(1); }}
                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      dietaryFilter === 'Egg'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>Egg</span>
                  </button>
                </div>

                {/* Sort Dropdown & Grid/List View Toggle */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] font-medium text-slate-700 dark:text-zinc-300 outline-none cursor-pointer focus:border-[#ff5520]"
                  >
                    <option value="default">Sort</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>

                  {/* Grid / List View Selector */}
                  <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-zinc-800 text-[#ff5520] shadow-2xs'
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-zinc-800 text-[#ff5520] shadow-2xs'
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                      title="List View"
                    >
                      <List size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Directory Section Header & + Add Menu Item Orange Button */}
            <div className="flex items-center justify-between px-0.5">
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base m-0 flex items-center gap-2">
                Menu Directory ({filteredMenuItems.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowAddItemForm(true);
                  if (!newItemData.category_id && categories.length > 0) {
                    setNewItemData(prev => ({ ...prev, category_id: categories[0].category_id }));
                  }
                }}
                className="bg-[#ff5520] hover:bg-[#e04515] text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <Plus size={14} />
                <span>Add Menu Item</span>
              </button>
            </div>

            {/* Dishes Content: Conditional Rendering based on viewMode ('grid' | 'list') */}
            {filteredMenuItems.length === 0 ? (
              <div className="bg-white dark:bg-[#18181b] rounded-xl p-8 text-center border border-slate-200/80 dark:border-zinc-800">
                <span className="text-3xl block mb-1">🔍</span>
                <h3 className="font-semibold text-slate-800 dark:text-white text-xs">No menu dishes found</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Try clearing search filters or add a new menu dish.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {paginatedItems.map((item) => {
                  const catName = categories.find(c => String(c.category_id) === String(item.category_id))?.category_name || 'General';
                  const dietary = getDietaryType(item);
                  const foodImg = getFoodItemImage(item, isDark);

                  return (
                    <div
                      key={item.item_id}
                      className="bg-white dark:bg-[#18181b] rounded-xl border border-slate-200/80 dark:border-zinc-800/80 overflow-hidden shadow-xs hover:shadow-sm transition-all flex flex-col group"
                    >
                      {/* Top Food Image Container */}
                      <div className="relative h-32 w-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        <img 
                          src={foodImg} 
                          alt={item.item_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = isDark ? '/images/dark_default_image.png' : '/images/default_image.png';
                          }}
                        />
                        
                        {/* Top-left Overlay: Dietary Badge Icon */}
                        <div className="absolute top-2 left-2 z-10">
                          {dietary === 'Non-Veg' ? (
                            <span className="w-4.5 h-4.5 border border-[#E53935] rounded-xs flex items-center justify-center p-0.5 bg-white/95 shadow-2xs" title="Non-Veg">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E53935]"></span>
                            </span>
                          ) : dietary === 'Egg' ? (
                            <span className="w-4.5 h-4.5 border border-[#FFB300] rounded-xs flex items-center justify-center p-0.5 bg-white/95 shadow-2xs" title="Egg">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB300]"></span>
                            </span>
                          ) : (
                            <span className="w-4.5 h-4.5 border border-[#00B074] rounded-xs flex items-center justify-center p-0.5 bg-white/95 shadow-2xs" title="Veg">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00B074]"></span>
                            </span>
                          )}
                        </div>

                        {/* Top-right Overlay: Category Badge Chip */}
                        <div className="absolute top-2 right-2 z-10">
                          <span className="inline-block text-[10px] font-semibold text-[#ff5520] bg-white/95 dark:bg-zinc-900/90 border border-orange-100 dark:border-zinc-700 px-2 py-0.5 rounded-md shadow-2xs truncate max-w-[130px]">
                            {catName}
                          </span>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Dish Name */}
                          <h3 className="font-semibold text-slate-900 dark:text-white text-xs m-0 truncate leading-snug group-hover:text-[#ff5520] transition-colors">
                            {item.item_name}
                          </h3>
                        </div>

                        {/* Price & Action Icons Row */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-zinc-800">
                          <span className="font-bold text-slate-900 dark:text-white text-xs tracking-tight">
                            ₹{parseFloat(String(item.price)).toFixed(2)}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingItem(item)}
                              className="p-1 bg-slate-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-zinc-300 hover:text-blue-600 rounded-md transition-colors cursor-pointer"
                              title="Edit Dish"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.item_id)}
                              className="p-1 bg-slate-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-zinc-300 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                              title="Delete Dish"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW MODE */
              <div className="bg-white dark:bg-[#18181b] rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/80 shadow-xs">
                {paginatedItems.map((item) => {
                  const catName = categories.find(c => String(c.category_id) === String(item.category_id))?.category_name || 'General';
                  const dietary = getDietaryType(item);
                  const foodImg = getFoodItemImage(item, isDark);

                  return (
                    <div 
                      key={item.item_id} 
                      className="p-2.5 sm:p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-zinc-900/60 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={foodImg} 
                          alt={item.item_name} 
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-slate-200/80 dark:border-zinc-700 shrink-0 group-hover:scale-105 transition-transform duration-200" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = isDark ? '/images/dark_default_image.png' : '/images/default_image.png';
                          }}
                        />
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            {dietary === 'Non-Veg' ? (
                              <span className="w-3.5 h-3.5 border border-[#E53935] rounded-xs flex items-center justify-center p-0.5 bg-white shadow-2xs shrink-0" title="Non-Veg">
                                <span className="w-1 h-1 rounded-full bg-[#E53935]"></span>
                              </span>
                            ) : dietary === 'Egg' ? (
                              <span className="w-3.5 h-3.5 border border-[#FFB300] rounded-xs flex items-center justify-center p-0.5 bg-white shadow-2xs shrink-0" title="Egg">
                                <span className="w-1 h-1 rounded-full bg-[#FFB300]"></span>
                              </span>
                            ) : (
                              <span className="w-3.5 h-3.5 border border-[#00B074] rounded-xs flex items-center justify-center p-0.5 bg-white shadow-2xs shrink-0" title="Veg">
                                <span className="w-1 h-1 rounded-full bg-[#00B074]"></span>
                              </span>
                            )}
                            <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm m-0 truncate group-hover:text-[#ff5520] transition-colors">
                              {item.item_name}
                            </h3>
                          </div>
                          <span className="text-[10px] font-semibold text-[#ff5520] bg-[#fff5f0] dark:bg-[#ff5520]/15 px-2 py-0.5 rounded-md inline-block">
                            {catName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 shrink-0">
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm tracking-tight">
                          ₹{parseFloat(String(item.price)).toFixed(2)}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-zinc-300 hover:text-blue-600 rounded-md transition-colors cursor-pointer"
                            title="Edit Dish"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.item_id)}
                            className="p-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-zinc-300 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                            title="Delete Dish"
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

            {/* Pagination Footer Row */}
            {filteredMenuItems.length > 0 && (
              <div className="bg-white dark:bg-[#18181b] rounded-xl p-2.5 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredMenuItems.length)} of {filteredMenuItems.length} items
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-6 h-6 rounded-md border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-6 h-6 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center ${
                        currentPage === page
                          ? 'bg-[#ff5520] text-white shadow-xs'
                          : 'border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-6 h-6 rounded-md border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              RIGHT COLUMN: CATEGORIES MANAGEMENT CARD (3 cols / ~25% width)
          ========================================================================= */}
          <div className={`lg:col-span-3 space-y-3 ${activeMobileTab === 'categories' ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white dark:bg-[#18181b] rounded-xl p-3.5 shadow-xs border border-slate-200/80 dark:border-zinc-800 space-y-3">
              
              {/* Header: Title + Add Category Orange Button */}
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm m-0">
                  Categories ({categories.length})
                </h2>
                <button
                  type="button"
                  onClick={openAddCategoryDrawer}
                  className="bg-[#ff5520] hover:bg-[#e04515] text-white font-medium px-2.5 py-1 rounded-lg text-[11px] transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                >
                  <Plus size={12} />
                  <span>+ Add</span>
                </button>
              </div>

              {/* Category Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="w-full pl-7 pr-6 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-normal text-slate-900 dark:text-white focus:border-[#ff5520] outline-none placeholder:text-slate-400"
                />
                <Search size={12} className="absolute left-2 top-2 text-slate-400" />
                {categorySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCategorySearchQuery('')}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* Categories Scrollable List */}
              <div className="space-y-1 max-h-[420px] overflow-y-auto pr-0.5 custom-scrollbar">
                
                {/* All Categories Option */}
                <div
                  onClick={() => {
                    setSelectedCategoryId('All');
                    setCurrentPage(1);
                    setActiveMobileTab('items');
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer font-medium text-xs transition-all ${
                    selectedCategoryId === 'All'
                      ? 'bg-[#fff5f0] dark:bg-[#ff5520]/15 text-[#ff5520] border border-[#ff5520]/30 shadow-2xs'
                      : 'bg-slate-50/70 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img 
                      src={isDark ? "/images/dark_default_image.png" : "/images/default_image.png"} 
                      alt="All" 
                      className="w-5 h-5 rounded-md object-cover border border-slate-200/80 dark:border-zinc-700 shrink-0" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = isDark ? '/images/dark_default_image.png' : '/images/default_image.png';
                      }}
                    />
                    <span className="truncate">All Categories</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                    selectedCategoryId === 'All'
                      ? 'bg-[#ff5520]/20 text-[#ff5520]'
                      : 'bg-slate-200/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                  }`}>
                    {menuItems.length}
                  </span>
                </div>

                {/* Filtered Category Items */}
                {filteredCategories.map((cat) => {
                  const isSelected = String(selectedCategoryId) === String(cat.category_id);
                  const itemCount = menuItems.filter(i => String(i.category_id) === String(cat.category_id)).length;
                  const categoryImg = getCategoryImage(cat, isDark);
                  const isSubCat = Boolean(cat.parent_id && cat.parent_id !== 'none');

                  return (
                    <div
                      key={cat.category_id}
                      onClick={() => {
                        setSelectedCategoryId(cat.category_id);
                        setCurrentPage(1);
                        setActiveMobileTab('items');
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer font-medium text-xs transition-all group ${
                        isSubCat ? 'pl-5 border-l-2 border-slate-200 dark:border-zinc-700' : ''
                      } ${
                        isSelected
                          ? 'bg-[#fff5f0] dark:bg-[#ff5520]/15 text-[#ff5520] border border-[#ff5520]/30 shadow-2xs'
                          : 'bg-slate-50/70 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                        <img 
                          src={categoryImg} 
                          alt={cat.category_name} 
                          className="w-5 h-5 rounded-md object-cover border border-slate-200/80 dark:border-zinc-700 shrink-0" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = isDark ? '/images/dark_default_image.png' : '/images/default_image.png';
                          }}
                        />
                        <span className="truncate flex items-center gap-1">
                          {isSubCat && <span className="text-[10px] text-slate-400 font-bold">↳</span>}
                          <span>{cat.category_name}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          isSelected
                            ? 'bg-[#ff5520]/20 text-[#ff5520]'
                            : 'bg-slate-200/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                        }`}>
                          {itemCount}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditCategoryDrawer(cat);
                          }}
                          className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 size={11} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(cat);
                          }}
                          className="p-0.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Tip Container */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50/60 dark:from-[#ff5520]/10 dark:to-amber-950/20 border border-orange-200/60 dark:border-orange-900/30 rounded-xl p-2.5 flex items-start gap-2">
                <div className="p-1 bg-orange-100 dark:bg-[#ff5520]/20 text-[#ff5520] rounded-md shrink-0 mt-0.5">
                  <Lightbulb size={14} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-semibold text-slate-900 dark:text-white">Tip</h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight font-normal">
                    Organize items into main & sub-categories for easier management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          ADD / EDIT CATEGORY RIGHT-SIDE SLIDE-OVER DRAWER
      ------------------------------------------------------------- */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
          {/* Dark Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => {
              setShowAddCategoryModal(false);
              setEditingCategory(null);
            }}
          />

          {/* Slide-over Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-[#18181b] shadow-2xl flex flex-col justify-between border-l border-slate-100 dark:border-zinc-800">
              
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white m-0">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body - Scrollable */}
              <form id="category-form" onSubmit={handleSaveCategory} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* CATEGORY NAME */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    CATEGORY NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Biryani, Starters, Beverages"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none transition-all placeholder:text-slate-400"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                </div>

                {/* PARENT CATEGORY / SUB-CATEGORY OF */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    PARENT CATEGORY / SUB-CATEGORY
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none cursor-pointer"
                    value={categoryParentId}
                    onChange={(e) => setCategoryParentId(e.target.value)}
                  >
                    <option value="none">None (Main Category)</option>
                    {categories
                      .filter(c => !editingCategory || String(c.category_id) !== String(editingCategory.category_id))
                      .map(c => (
                        <option key={c.category_id} value={c.category_id}>
                          Sub-category of: {c.category_name}
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-slate-400">Select a parent category to create a sub-category.</p>
                </div>

                {/* CATEGORY IMAGE UPLOAD */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    CATEGORY IMAGE
                  </label>
                  {categoryImageUrl ? (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900">
                      <img 
                        src={categoryImageUrl} 
                        alt="Category Preview" 
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-zinc-700 shrink-0" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = isDark ? '/images/dark_default_image.png' : '/images/default_image.png';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">Category image</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Ready to save</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCategoryImageUrl('')}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-[#ff5520] dark:hover:border-[#ff5520] rounded-xl p-4 bg-slate-50/50 dark:bg-zinc-900/50 transition-colors cursor-pointer group">
                      <div className="flex flex-col items-center justify-center space-y-1 text-center">
                        <div className="w-9 h-9 rounded-full bg-orange-50 dark:bg-[#ff5520]/15 flex items-center justify-center text-[#ff5520] group-hover:scale-105 transition-transform">
                          <Upload size={18} />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-zinc-200">
                          Click to upload category photo
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          PNG, JPG, JPEG or WEBP (Max 5MB)
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFileChange(e, (url) => setCategoryImageUrl(url))}
                      />
                    </label>
                  )}
                </div>

                {/* DISPLAY ORDER */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    DISPLAY ORDER
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1, 2, 3"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none transition-all placeholder:text-slate-400"
                    value={categoryDisplayOrder}
                    onChange={(e) => setCategoryDisplayOrder(e.target.value)}
                  />
                </div>

                {/* DESCRIPTION (OPTIONAL) */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    DESCRIPTION (OPTIONAL)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of this category..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-normal text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none transition-all placeholder:text-slate-400 resize-none"
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                  />
                </div>
              </form>

              {/* Drawer Footer Buttons */}
              <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 bg-white dark:bg-[#18181b] shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="category-form"
                  className="px-6 py-2.5 bg-[#ff5520] hover:bg-[#e04515] text-white font-bold rounded-xl text-xs shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {editingCategory ? "Save Category Changes" : "Save Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          ADD MENU ITEM RIGHT-SIDE SLIDE-OVER DRAWER
      ------------------------------------------------------------- */}
      {showAddItemForm && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
          {/* Dark Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowAddItemForm(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-[#18181b] shadow-2xl flex flex-col justify-between border-l border-slate-100 dark:border-zinc-800">
              
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white m-0">
                  Add New Menu Item
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddItemForm(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body - Scrollable */}
              <form id="add-item-form" onSubmit={handleAddNewItem} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* DISH / ITEM NAME */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    DISH / ITEM NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Crispy Chicken Bao"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none transition-all placeholder:text-slate-400"
                    value={newItemData.item_name}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, item_name: e.target.value }))}
                  />
                </div>

                {/* CATEGORY */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    CATEGORY *
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none cursor-pointer"
                    value={newItemData.category_id}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, category_id: e.target.value }))}
                  >
                    {categories.map(c => (
                      <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                    ))}
                  </select>

                  {/* Inline quick category creation */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Or type new category..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 text-xs font-normal text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={async (e) => {
                        if (!newCatName.trim()) return;
                        await handleSaveCategory(e);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* BASE PRICE (₹) & TAX RATE RULE */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      BASE PRICE (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none transition-all placeholder:text-slate-400"
                      value={newItemData.price}
                      onChange={(e) => setNewItemData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      TAX RATE RULE
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none cursor-pointer"
                      value={newItemData.tax_rate || '5% GST (Standard Food)'}
                      onChange={(e) => setNewItemData(prev => ({ ...prev, tax_rate: e.target.value }))}
                    >
                      <option value="5% GST (Standard Food)">5% GST (Standard Food)</option>
                      <option value="12% GST">12% GST</option>
                      <option value="18% GST (Beverages)">18% GST (Beverages)</option>
                      <option value="0% GST (Exempt)">0% GST (Exempt)</option>
                    </select>
                  </div>
                </div>

                {/* CLASSIFICATION & KITCHEN STATION (KOT) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      CLASSIFICATION *
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none cursor-pointer"
                      value={newItemData.dietary_info}
                      onChange={(e) => setNewItemData(prev => ({ ...prev, dietary_info: e.target.value }))}
                    >
                      <option value="Non-Veg">Non-Veg</option>
                      <option value="Veg">Veg</option>
                      <option value="Egg">Egg</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      KITCHEN STATION (KOT)
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none cursor-pointer"
                      value={newItemData.kot_station || 'Main Kitchen'}
                      onChange={(e) => setNewItemData(prev => ({ ...prev, kot_station: e.target.value }))}
                    >
                      <option value="Main Kitchen">Main Kitchen</option>
                      <option value="Bar & Beverages">Bar & Beverages</option>
                      <option value="Tandoor Counter">Tandoor Counter</option>
                      <option value="Dessert Station">Dessert Station</option>
                    </select>
                  </div>
                </div>

                {/* ITEM IMAGE UPLOAD */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    DISH IMAGE
                  </label>
                  {newItemData.image_url ? (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900">
                      <img 
                        src={newItemData.image_url} 
                        alt="Preview" 
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-zinc-700 shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">Image selected</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Ready to save</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewItemData(prev => ({ ...prev, image_url: '' }))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-[#ff5520] dark:hover:border-[#ff5520] rounded-xl p-4 bg-slate-50/50 dark:bg-zinc-900/50 transition-colors cursor-pointer group">
                      <div className="flex flex-col items-center justify-center space-y-1 text-center">
                        <div className="w-9 h-9 rounded-full bg-orange-50 dark:bg-[#ff5520]/15 flex items-center justify-center text-[#ff5520] group-hover:scale-105 transition-transform">
                          <Upload size={18} />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-zinc-200">
                          Click to upload dish photo
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          PNG, JPG, JPEG or WEBP (Max 5MB)
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFileChange(e, (url) => setNewItemData(prev => ({ ...prev, image_url: url })))}
                      />
                    </label>
                  )}
                </div>

                {/* DESCRIPTION (OPTIONAL) */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    DESCRIPTION (OPTIONAL)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief ingredients or allergen warning..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-normal text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none transition-all placeholder:text-slate-400 resize-none"
                    value={newItemData.description || ''}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </form>

              {/* Drawer Footer Buttons */}
              <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 bg-white dark:bg-[#18181b] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddItemForm(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="add-item-form"
                  className="px-6 py-2.5 bg-[#ff5520] hover:bg-[#e04515] text-white font-bold rounded-xl text-xs shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Save Item to Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          EDIT MENU ITEM RIGHT-SIDE SLIDE-OVER DRAWER
      ------------------------------------------------------------- */}
      {editingItem && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
          {/* Dark Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setEditingItem(null)}
          />

          {/* Slide-over Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-[#18181b] shadow-2xl flex flex-col justify-between border-l border-slate-100 dark:border-zinc-800">
              
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white m-0">
                  Edit Menu Item
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body - Scrollable */}
              <form id="edit-item-form" onSubmit={handleUpdateItem} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* DISH / ITEM NAME */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    DISH / ITEM NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Crispy Chicken Bao"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none transition-all placeholder:text-slate-400"
                    value={editingItem.item_name}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, item_name: e.target.value } : null)}
                  />
                </div>

                {/* CATEGORY */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    CATEGORY *
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none cursor-pointer"
                    value={editingItem.category_id}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, category_id: e.target.value } : null)}
                  >
                    {categories.map(c => (
                      <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                    ))}
                  </select>
                </div>

                {/* BASE PRICE (₹) & TAX RATE RULE */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      BASE PRICE (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none transition-all placeholder:text-slate-400"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, price: e.target.value } : null)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      TAX RATE RULE
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none cursor-pointer"
                      value={editingItem.tax_rate || '5% GST (Standard Food)'}
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, tax_rate: e.target.value } : null)}
                    >
                      <option value="5% GST (Standard Food)">5% GST (Standard Food)</option>
                      <option value="12% GST">12% GST</option>
                      <option value="18% GST (Beverages)">18% GST (Beverages)</option>
                      <option value="0% GST (Exempt)">0% GST (Exempt)</option>
                    </select>
                  </div>
                </div>

                {/* CLASSIFICATION & KITCHEN STATION (KOT) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      CLASSIFICATION *
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none cursor-pointer"
                      value={editingItem.dietary_info || 'Veg'}
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, dietary_info: e.target.value } : null)}
                    >
                      <option value="Non-Veg">Non-Veg</option>
                      <option value="Veg">Veg</option>
                      <option value="Egg">Egg</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      KITCHEN STATION (KOT)
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none cursor-pointer"
                      value={editingItem.kot_station || 'Main Kitchen'}
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, kot_station: e.target.value } : null)}
                    >
                      <option value="Main Kitchen">Main Kitchen</option>
                      <option value="Bar & Beverages">Bar & Beverages</option>
                      <option value="Tandoor Counter">Tandoor Counter</option>
                      <option value="Dessert Station">Dessert Station</option>
                    </select>
                  </div>
                </div>

                {/* ITEM IMAGE UPLOAD */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    DISH IMAGE
                  </label>
                  {editingItem.image_url ? (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900">
                      <img 
                        src={editingItem.image_url} 
                        alt="Preview" 
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-zinc-700 shrink-0" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = isDark ? '/images/dark_default_image.png' : '/images/default_image.png';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">Dish image</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Ready to update</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingItem(prev => prev ? { ...prev, image_url: '' } : null)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-[#ff5520] dark:hover:border-[#ff5520] rounded-xl p-4 bg-slate-50/50 dark:bg-zinc-900/50 transition-colors cursor-pointer group">
                      <div className="flex flex-col items-center justify-center space-y-1 text-center">
                        <div className="w-9 h-9 rounded-full bg-orange-50 dark:bg-[#ff5520]/15 flex items-center justify-center text-[#ff5520] group-hover:scale-105 transition-transform">
                          <Upload size={18} />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-zinc-200">
                          Click to upload dish photo
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          PNG, JPG, JPEG or WEBP (Max 5MB)
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFileChange(e, (url) => setEditingItem(prev => prev ? { ...prev, image_url: url } : null))}
                      />
                    </label>
                  )}
                </div>

                {/* DESCRIPTION (OPTIONAL) */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    DESCRIPTION (OPTIONAL)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief ingredients or allergen warning..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900 text-xs font-normal text-slate-900 dark:text-white focus:bg-white focus:border-[#ff5520] outline-none transition-all placeholder:text-slate-400 resize-none"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>
              </form>

              {/* Drawer Footer Buttons */}
              <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 bg-white dark:bg-[#18181b] shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-item-form"
                  className="px-6 py-2.5 bg-[#ff5520] hover:bg-[#e04515] text-white font-bold rounded-xl text-xs shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Save Item Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile View (< md) */}
      <div className="block md:hidden min-h-screen bg-[#faf9f7] dark:bg-[#16161d]">
        <MobileHeader title="Manage Menu" />
        {renderManageMenuBody(true)}
        <MobileFooter activeTab="more" />
      </div>

      {/* Desktop View (>= md) */}
      <div className="hidden md:block">
        <DesktopLayout activePage="Add Menu">
          {renderManageMenuBody(false)}
        </DesktopLayout>
      </div>
    </>
  );
};

export default ManageMenuPage;
