import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

interface LoginProps {
  onLogin: (userData: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSuccessfulLogin = (rawUserData: any) => {
    const roleAlias = (rawUserData?.role_alias || rawUserData?.role || '').toLowerCase();
    const normalizedUser = {
      ...rawUserData,
      role_alias: roleAlias,
      role_name: rawUserData?.role_name || (roleAlias === 'super_admin' ? 'Super Admin' : (roleAlias === 'admin' ? 'Admin' : (roleAlias === 'waiter' ? 'Waiter' : 'Staff'))),
      role: roleAlias,
      name: rawUserData?.name || rawUserData?.username || 'Staff User',
      phone: rawUserData?.phone || ''
    };
    onLogin(normalizedUser);

    if (roleAlias === 'waiter') {
      navigate('/tables', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedPhone = phone.trim();

    if (!trimmedPhone || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (!/^\d{10}$/.test(trimmedPhone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);

    try {
      // Always trigger backend API call first
      const response = await fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: trimmedPhone,
          password: password
        })
      });

      const data = await response.json();
      if (data && (data.status === true || data.status === "1" || data.message === "Login successful") && data.data) {
        handleSuccessfulLogin(data.data);
        return;
      }
      
      if (data && data.message && !data.data) {
        setError(data.message);
        return;
      }
    } catch (err: any) {
      console.warn('Backend API login call failed, checking offline fallback:', err.message);
    } finally {
      setLoading(false);
    }

    // Offline fallback for local testing
    if (trimmedPhone === '8269420494' && password === '12345678') {
      handleSuccessfulLogin({ id: '1', phone: '8269420494', role_alias: 'super_admin', role_name: 'Super Admin', name: 'Ravi Sen' });
      return;
    }
    if (trimmedPhone === '8965984722' && password === '12345678') {
      handleSuccessfulLogin({ id: '2', phone: '8965984722', role_alias: 'admin', role_name: 'Admin', name: 'Admin User' });
      return;
    }
    if (trimmedPhone === '8989898989' && password === '12345678') {
      handleSuccessfulLogin({ id: '3', phone: '8989898989', role_alias: 'waiter', role_name: 'Waiter', name: 'Waiter Staff' });
      return;
    }

    setError('Invalid phone number or password.');
  };

  const handleFillRole = (ph: string, pass: string) => {
    setPhone(ph);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6F0] p-4 font-sans relative selection:bg-[#f05a24]/20">
      {/* Decorative background gradients */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#f05a24]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-white border border-[#F0E6DF] rounded-2xl shadow-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFF0E6] border border-[#f05a24]/20 rounded-2xl mb-4 text-3xl shadow-inner">
            🧑‍🍳
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1">
            Staff & Waiter <span className="text-[#f05a24]">Portal</span>
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm font-medium">Sign in with staff credentials to manage table orders</p>
        </div>

        {/* Demo Credentials Info Box */}
        <div className="mb-6 p-3.5 bg-[#FFF0E6]/60 border border-[#f05a24]/20 rounded-xl space-y-2.5">
          <div className="text-xs font-extrabold text-[#f05a24] uppercase tracking-wider flex items-center justify-between">
            <span>💡 Staff Quick Login Roles</span>
            <span className="text-[10px] bg-[#f05a24]/10 px-2 py-0.5 rounded-md text-[#f05a24] font-bold">Auto-fill</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillRole('8965984722', '12345678')}
              className="p-2 bg-white hover:bg-[#FFF0E6] border border-[#f05a24]/20 hover:border-[#f05a24]/40 rounded-xl text-left transition-all active:scale-95 cursor-pointer shadow-2xs group"
            >
              <div className="text-[11px] font-extrabold text-gray-900 group-hover:text-[#f05a24]">👑 Admin (Self POS)</div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">8965984722</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillRole('8965984720', '12345678')}
              className="p-2 bg-white hover:bg-[#FFF0E6] border border-[#f05a24]/20 hover:border-[#f05a24]/40 rounded-xl text-left transition-all active:scale-95 cursor-pointer shadow-2xs group"
            >
              <div className="text-[11px] font-extrabold text-gray-900 group-hover:text-[#f05a24]">💼 Manager (Self POS)</div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">8965984720</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillRole('7878787878', '12345678')}
              className="p-2 bg-white hover:bg-[#FFF0E6] border border-[#f05a24]/20 hover:border-[#f05a24]/40 rounded-xl text-left transition-all active:scale-95 cursor-pointer shadow-2xs group"
            >
              <div className="text-[11px] font-extrabold text-gray-900 group-hover:text-[#f05a24]">⚡ Cashier (Self POS)</div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">7878787878</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillRole('8989898989', '12345678')}
              className="p-2 bg-white hover:bg-[#FFF0E6] border border-[#f05a24]/20 hover:border-[#f05a24]/40 rounded-xl text-left transition-all active:scale-95 cursor-pointer shadow-2xs group"
            >
              <div className="text-[11px] font-extrabold text-[#f05a24]">🍽️ Waiter (Self Order)</div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">8989898989</div>
            </button>
          </div>
        </div>

        {/* Alert Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                📞
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit phone"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:border-[#f05a24] focus:ring-2 focus:ring-[#f05a24]/20 rounded-xl text-gray-950 placeholder-gray-400 outline-none transition-all duration-300 text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                🔒
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:border-[#f05a24] focus:ring-2 focus:ring-[#f05a24]/20 rounded-xl text-gray-950 placeholder-gray-400 outline-none transition-all duration-300 text-sm font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#f05a24] hover:bg-[#d94815] active:scale-[0.98] text-white font-extrabold rounded-xl transition-all duration-300 shadow-md shadow-[#f05a24]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
        <div className="mt-6 text-center space-y-2">
          <a 
            href="/" 
            className="inline-block text-xs font-extrabold text-[#f05a24] hover:underline"
          >
            ← Browsing as Customer? Click here to view Menu
          </a>
          <div className="text-[11px] text-gray-400 font-medium">
            E-Menu Storefront &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
