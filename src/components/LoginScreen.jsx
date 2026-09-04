import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';

const EXPECTED_HASH = "ebe106819f36f460184a887c06e18115a19f5d15ce570f9a2318c6f44b78476a";

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

const LoginScreen = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const hash = await hashPassword(password);
      if (hash === EXPECTED_HASH) {
        // Save to localStorage
        localStorage.setItem('math_assistant_auth', hash);
        onLoginSuccess();
      } else {
        setError('Mật khẩu không chính xác!');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative z-10 px-4">
      <div className="w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="glass-card rounded-2xl p-8 sm:p-10 shadow-2xl border border-white/20 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden">
          
          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/30 rounded-full blur-3xl"></div>

          <div className="text-center mb-8 relative z-10">
            <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Đăng Nhập</h2>
            <p className="text-gray-300">Vui lòng nhập mật khẩu để tiếp tục</p>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10">
            <div className="mb-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full bg-black/30 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang kiểm tra...' : 'Xác Nhận'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
