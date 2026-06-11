import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrderInfoPage from './pages/OrderInfoPage';
import OrderNumberPage from './pages/OrderNumberPage';
import Login from './pages/Login';
import TablesPage from './pages/TablesPage';

function App() {
  const [user, setUser] = useState<{ phone: string } | null>(() => {
    const savedUser = localStorage.getItem('emenu_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  React.useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlTable = queryParams.get('table') || queryParams.get('table_number');
    if (urlTable) {
      sessionStorage.setItem('emenu_table', urlTable);
    }
  }, []);

  const handleLogin = (userData: { phone: string }) => {
    localStorage.setItem('emenu_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('emenu_user');
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/" 
          element={user ? <MenuPage onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/cart" 
          element={user ? <CartPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/order-info" 
          element={user ? <OrderInfoPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/order-number" 
          element={user ? <OrderNumberPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/tables" 
          element={user ? <TablesPage /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
