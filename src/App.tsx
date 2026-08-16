import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

function App() {
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('emenu_user');
    if (savedUser) return JSON.parse(savedUser);

    // Default guest customer session for QR code scan & direct browsing (NO login required)
    const defaultUser = { phone: 'Guest Customer', isGuest: true };
    localStorage.setItem('emenu_user', JSON.stringify(defaultUser));
    return defaultUser;
  });

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
                  
                  const rAlias = (user?.role_alias || user?.role || '').toLowerCase();
                  if (rAlias !== 'waiter' || !enableTables) {
                    return <Navigate to="/" replace />;
                  }
                  return <Navigate to="/tables" replace />;
                })()
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />
          <Route 
            path="/" 
            element={<MenuRouteWrapper onLogout={handleLogout} />} 
          />
          <Route 
            path="/menu" 
            element={<MenuRouteWrapper onLogout={handleLogout} />} 
          />
          <Route 
            path="/cart" 
            element={<CartPage />} 
          />
          <Route 
            path="/order-info" 
            element={<OrderInfoPage />} 
          />
          <Route 
            path="/order-number" 
            element={<OrderNumberPage />} 
          />
          <Route 
            path="/track-order" 
            element={<TrackOrderPage />} 
          />
          <Route 
            path="/tables" 
            element={user && !user.isGuest ? <TablesPage /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/history" 
            element={user && !user.isGuest ? <HistoryPage /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/settings" 
            element={user && !user.isGuest ? <SettingsPage /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/manage-menu" 
            element={user && !user.isGuest ? <ManageMenuPage /> : <Navigate to="/" replace />} 
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
