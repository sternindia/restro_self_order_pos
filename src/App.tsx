import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ThemeSelectionModal from './components/ThemeSelectionModal';

// Lazy loading page routes for Code-Splitting and fast initial page load
const MenuPage = lazy(() => import('./pages/MenuPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const OrderInfoPage = lazy(() => import('./pages/OrderInfoPage'));
const OrderNumberPage = lazy(() => import('./pages/OrderNumberPage'));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'));
const Login = lazy(() => import('./pages/Login'));
const TablesPage = lazy(() => import('./pages/TablesPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ManageMenuPage = lazy(() => import('./pages/ManageMenuPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const StockPage = lazy(() => import('./pages/StockPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const ContactUsPage = lazy(() => import('./pages/ContactUsPage'));
const LiveOrderPage = lazy(() => import('./pages/LiveOrderPage'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-8 h-8 border-3 border-[#0077b6] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const MenuRouteWrapper: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlRid =
    queryParams.get('id') ||
    queryParams.get('restaurant_id') ||
    queryParams.get('restaurantId') ||
    queryParams.get('restaurant') ||
    queryParams.get('rest_id') ||
    queryParams.get('rid');

  if (urlRid) {
    const cleanId = parseInt(urlRid, 10);
    if (!isNaN(cleanId) && cleanId > 0) {
      sessionStorage.setItem('emenu_restaurant_id', String(cleanId));
    }
  }

  return <MenuPage onLogout={onLogout} />;
};

function AppInner() {
  const { setTheme } = useTheme();

  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('emenu_user');
    if (savedUser) return JSON.parse(savedUser);

    // Default guest customer session for QR code scan & direct browsing (NO login required)
    const defaultUser = { phone: 'Guest Customer', isGuest: true };
    localStorage.setItem('emenu_user', JSON.stringify(defaultUser));
    return defaultUser;
  });

  const [showThemePicker, setShowThemePicker] = useState(false);

  React.useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlRid =
      queryParams.get('id') ||
      queryParams.get('restaurant_id') ||
      queryParams.get('restaurantId') ||
      queryParams.get('restaurant') ||
      queryParams.get('rest_id') ||
      queryParams.get('rid');

    if (urlRid) {
      const cleanId = parseInt(urlRid, 10);
      if (!isNaN(cleanId) && cleanId > 0) {
        sessionStorage.setItem('emenu_restaurant_id', String(cleanId));
      }
    }
  }, []);

  const handleLogin = (userData: any) => {
    // Clear guest table override when staff/waiter logs in
    sessionStorage.removeItem('emenu_table');
    const staffUser = { ...userData, isGuest: false };
    localStorage.setItem('emenu_user', JSON.stringify(staffUser));
    setUser(staffUser);
    
    // Show theme picker only on first-ever login
    const alreadyPicked = localStorage.getItem('emenu_theme_selected');
    if (!alreadyPicked) {
      setShowThemePicker(true);
    }
  };

  const handleThemeSelect = (theme: 'light' | 'dark') => {
    setTheme(theme);
    localStorage.setItem('emenu_theme_selected', '1');
    setShowThemePicker(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('emenu_user');
    localStorage.removeItem('emenu_cart');
    localStorage.removeItem('emenu_last_order');
    localStorage.removeItem('emenu_token');
    sessionStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <Router>
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar={true} newestOnTop closeOnClick pauseOnHover theme="colored" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route 
            path="/login" 
            element={
              user && !user.isGuest ? (
                (() => {
                  let enableTables = true;
                  try {
                    const cachedStr = localStorage.getItem('emenu_pos_settings');
                    if (cachedStr) {
                      const s = JSON.parse(cachedStr);
                      const val = s?.hardware_and_preferences?.is_enable_tables ?? s?.is_enable_tables ?? s?.isEnableTables;
                      if (val === false || val === 'false' || val === 0 || val === '0') enableTables = false;
                    }
                  } catch {}
                  
                  return enableTables ? <Navigate to="/tables" replace /> : <Navigate to="/" replace />;
                })()
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />
          
          <Route path="/" element={<MenuRouteWrapper onLogout={handleLogout} />} />
          <Route path="/menu" element={<MenuRouteWrapper onLogout={handleLogout} />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/order-info" element={<OrderInfoPage />} />
          <Route path="/order-number" element={<OrderNumberPage />} />
          <Route path="/track" element={<TrackOrderPage />} />
          <Route path="/track-order" element={<Navigate to="/track" replace />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/order-detail" element={<OrderDetailPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
          <Route path="/live-order" element={<LiveOrderPage />} />
          
          {/* Admin Only Routes */}
          <Route 
            path="/settings" 
            element={
              user && (
                (user?.role_alias || user?.role || '').toLowerCase() === 'admin' || 
                (user?.role_alias || user?.role || '').toLowerCase() === 'super_admin'
              ) ? (
                <SettingsPage />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/manage-menu" 
            element={
              user && (
                (user?.role_alias || user?.role || '').toLowerCase() === 'admin' || 
                (user?.role_alias || user?.role || '').toLowerCase() === 'super_admin'
              ) ? (
                <ManageMenuPage />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              user && (
                (user?.role_alias || user?.role || '').toLowerCase() === 'admin' || 
                (user?.role_alias || user?.role || '').toLowerCase() === 'super_admin'
              ) ? (
                <DashboardPage />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/stock" 
            element={
              user && (
                (user?.role_alias || user?.role || '').toLowerCase() === 'admin' || 
                (user?.role_alias || user?.role || '').toLowerCase() === 'super_admin'
              ) ? (
                <StockPage />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>
      </Suspense>

      {/* Theme Picker Modal on First Login */}
      {showThemePicker && <ThemeSelectionModal onSelect={handleThemeSelect} />}
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

export default App;
