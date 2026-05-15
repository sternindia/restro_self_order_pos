import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrderInfoPage from './pages/OrderInfoPage';
import OrderNumberPage from './pages/OrderNumberPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order-info" element={<OrderInfoPage />} />
        <Route path="/order-number" element={<OrderNumberPage />} />
      </Routes>
    </Router>
  );
}

export default App;
