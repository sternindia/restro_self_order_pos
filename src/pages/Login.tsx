import React, { useState } from 'react';

interface LoginProps {
  onLogin: (userData: { phone: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    // Basic format check for phone
    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);

    // Simulate API delay for premium feel
    setTimeout(() => {
      // Demo credentials check (phone: 9876543210, password: password)
      if (phone.trim() === '9876543210' && password === 'password') {
        onLogin({ phone: phone.trim() });
      } else {
        setError('Invalid phone number or password. Try the demo credentials!');
      }
      setLoading(false);
    }, 800);
  };

  const handleFillDemo = () => {
    setPhone('9876543210');
    setPassword('password');
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
            Welcome to <span className="text-[#0077b6]">E-Menu Storefront</span>
          </h2>
          <p className="text-gray-500 text-sm">Sign in to view menu and place orders</p>
        </div>

        {/* Demo Credentials Info Box */}
        <div 
          onClick={handleFillDemo}
          className="group mb-6 p-4 bg-[#d1efff]/20 hover:bg-[#d1efff]/45 border border-[#0077b6]/20 rounded-xl cursor-pointer transition-all duration-300 flex items-start gap-3"
        >
          <span className="text-[#0077b6] text-lg mt-0.5 group-hover:scale-110 transition-transform">💡</span>
          <div>
            <div className="text-xs font-semibold text-[#0077b6] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              Demo Credentials
              <span className="inline-block px-1.5 py-0.5 bg-[#0077b6]/20 text-[10px] text-[#0077b6] rounded-md font-semibold border border-[#0077b6]/20 animate-pulse">
                Click to Auto-fill
              </span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              Phone: <strong className="text-gray-950">9876543210</strong><br />
              Password: <strong className="text-gray-950">password</strong>
            </p>
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
        <div className="mt-8 text-center text-xs text-gray-400">
          E-Menu Storefront &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default Login;
