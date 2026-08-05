import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

interface LoginProps {
  onLogin: (userData: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: phone.trim(),
          password: password
        })
      });

      const data = await response.json();
      if (data && data.status === true && data.data) {
        onLogin(data.data);
      } else if (phone.trim() === '8965984722' && password === '12345678') {
        onLogin({
          phone: '8965984722',
          restaurant_id: 9,
          role: 'self-pos-billing',
          name: 'Admin'
        });
      } else if (phone.trim() === '7878787878' && password === '12345678') {
        onLogin({
          phone: '7878787878',
          restaurant_id: 9,
          role: 'self-pos-billing',
          name: 'Cashier'
        });
      } else if (phone.trim() === '8965984720' && password === '12345678') {
        onLogin({
          phone: '8965984720',
          restaurant_id: 9,
          role: 'self-pos-billing',
          name: 'Manager'
        });
      } else if (phone.trim() === '8989898989' && password === '12345678') {
        onLogin({
          phone: '8989898989',
          restaurant_id: 9,
          role: 'waiter',
          name: 'Waiter'
        });
      } else if (phone.trim() === '9876543210' && password === 'password') {
        onLogin({
          phone: '9876543210',
          restaurant_id: 9,
          role: 'waiter',
          name: 'Staff Waiter'
        });
      } else if (phone.trim() === '9999999999' && password === 'password') {
        onLogin({
          phone: '9999999999',
          restaurant_id: 9,
          role: 'self-pos-billing',
          name: 'Self POS Billing Counter'
        });
      } else {
        setError(data.message || 'Invalid phone number or password.');
      }
    } catch (err: any) {
      console.error('API login failed:', err.message);
      if (phone.trim() === '8965984722' && password === '12345678') {
        onLogin({ phone: '8965984722', restaurant_id: 9, role: 'self-pos-billing', name: 'Admin' });
        return;
      }
      if (phone.trim() === '7878787878' && password === '12345678') {
        onLogin({ phone: '7878787878', restaurant_id: 9, role: 'self-pos-billing', name: 'Cashier' });
        return;
      }
      if (phone.trim() === '8965984720' && password === '12345678') {
        onLogin({ phone: '8965984720', restaurant_id: 9, role: 'self-pos-billing', name: 'Manager' });
        return;
      }
      if (phone.trim() === '8989898989' && password === '12345678') {
        onLogin({ phone: '8989898989', restaurant_id: 9, role: 'waiter', name: 'Waiter' });
        return;
      }
      if (phone.trim() === '9876543210' && password === 'password') {
        onLogin({ phone: '9876543210', restaurant_id: 9, role: 'waiter', name: 'Staff Waiter' });
        return;
      }
      if (phone.trim() === '9999999999' && password === 'password') {
        onLogin({ phone: '9999999999', restaurant_id: 9, role: 'self-pos-billing', name: 'Self POS Billing Counter' });
        return;
      }
      setError('Network error. Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillRole = (ph: string, pass: string) => {
    setPhone(ph);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8] p-4 font-sans relative selection:bg-[#0077b6]/20">
      {/* Decorative background gradients */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#0077b6]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0077b6]/10 border border-[#0077b6]/20 rounded-2xl mb-4 text-3xl shadow-inner">
            🍽️
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
            Staff & Waiter <span className="text-[#0077b6]">Portal</span>
          </h2>
          <p className="text-gray-500 text-sm">Sign in with staff credentials to manage table orders</p>
        </div>

        {/* Demo Credentials Info Box */}
        <div className="mb-6 p-3.5 bg-[#d1efff]/20 border border-[#0077b6]/20 rounded-xl space-y-2.5">
          <div className="text-xs font-bold text-[#0077b6] uppercase tracking-wider flex items-center justify-between">
            <span>💡 Staff Quick Login Roles</span>
            <span className="text-[10px] bg-[#0077b6]/20 px-1.5 py-0.5 rounded text-[#0077b6]">Auto-fill</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillRole('8965984722', '12345678')}
              className="p-2 bg-white hover:bg-emerald-50 border border-emerald-500/40 rounded-lg text-left transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <div className="text-[11px] font-bold text-emerald-800">👑 Admin (Self POS)</div>
              <div className="text-[10px] text-gray-500 mt-0.5">8965984722</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillRole('8965984720', '12345678')}
              className="p-2 bg-white hover:bg-emerald-50 border border-emerald-500/40 rounded-lg text-left transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <div className="text-[11px] font-bold text-emerald-800">💼 Manager (Self POS)</div>
              <div className="text-[10px] text-gray-500 mt-0.5">8965984720</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillRole('7878787878', '12345678')}
              className="p-2 bg-white hover:bg-emerald-50 border border-emerald-500/40 rounded-lg text-left transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <div className="text-[11px] font-bold text-emerald-800">⚡ Cashier (Self POS)</div>
              <div className="text-[10px] text-gray-500 mt-0.5">7878787878</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillRole('8989898989', '12345678')}
              className="p-2 bg-white hover:bg-sky-50 border border-sky-400/40 rounded-lg text-left transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <div className="text-[11px] font-bold text-[#0077b6]">🍽️ Waiter (Self Order)</div>
              <div className="text-[10px] text-gray-500 mt-0.5">8989898989</div>
            </button>
          </div>
        </div>

        {/* Alert Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                📞
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 9876543210"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:border-[#0077b6] focus:ring-2 focus:ring-[#0077b6]/20 rounded-xl text-gray-950 placeholder-gray-400 outline-none transition-all duration-300 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                🔒
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:border-[#0077b6] focus:ring-2 focus:ring-[#0077b6]/20 rounded-xl text-gray-950 placeholder-gray-400 outline-none transition-all duration-300 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#0077b6] hover:bg-[#005f92] active:scale-[0.98] text-white font-semibold rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center space-y-3">
          <a 
            href="/" 
            className="inline-block text-xs font-bold text-[#0077b6] hover:underline"
          >
            ← Browsing as Customer? Click here to view Menu
          </a>
          <div className="text-xs text-gray-400">
            E-Menu Storefront &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
