import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { teamMembers, executives } from '../data/sampleData';

// Build the full user list: reps, managers, executives
const allUsers = [
  ...teamMembers,
  ...executives.map(e => ({ ...e, role: 'executive' })),
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { setRole, setRepName, setRepId, setAuthUser } = useApp();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [toast, setToast] = useState('');

  const handleGoogleSSO = () => {
    setToast('Google SSO coming soon — use demo login below');
    setTimeout(() => setToast(''), 3500);
  };

  const handleDemoLogin = () => {
    const user = allUsers.find(u => u.id === selectedUserId);
    if (!user) return;

    // Store auth user
    setAuthUser(user);
    setRepName(user.name);
    setRepId(user.id);
    setRole(user.role);

    // Route based on role
    if (user.role === 'manager') {
      navigate('/manager');
    } else if (user.role === 'executive') {
      navigate('/executive');
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative" style={{ backgroundColor: '#0a0a0f' }}>

      {/* Subtle gradient backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #F47920 0%, transparent 70%)' }}
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm mx-auto px-4"
      >
        {/* Branding */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight select-none mb-3">
            <span className="text-white/50">1-800-</span>
            <span style={{ color: '#F47920' }}>CLOSER</span>
          </h1>
          {/* 1-800Accountant logo mark */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#F47920' }}>
              <span className="text-white font-black text-xs leading-none">A</span>
            </div>
            <span className="text-white/30 text-sm font-medium tracking-wide">1-800Accountant</span>
          </div>
        </div>

        {/* Card container */}
        <div className="bg-[#14141c] border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/50">

          {/* Google SSO Button */}
          <button
            onClick={handleGoogleSSO}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 border border-gray-200 shadow-sm"
          >
            {/* Google "G" logo SVG */}
            <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-white/25 text-xs font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Demo Login Section */}
          <div>
            <label className="block text-white/40 text-[11px] uppercase tracking-widest font-semibold mb-2">
              Demo Login
            </label>
            <div className="relative mb-3">
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full appearance-none bg-white/[0.05] text-white border border-white/[0.1] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F47920]/40 focus:border-[#F47920]/50 transition-all cursor-pointer"
              >
                <option value="" className="bg-[#14141c] text-white/50">Select a team member...</option>
                <optgroup label="Sales Reps" className="bg-[#14141c]">
                  {allUsers.filter(u => u.role === 'rep').map(u => (
                    <option key={u.id} value={u.id} className="bg-[#14141c]">{u.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Managers" className="bg-[#14141c]">
                  {allUsers.filter(u => u.role === 'manager').map(u => (
                    <option key={u.id} value={u.id} className="bg-[#14141c]">{u.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Executives" className="bg-[#14141c]">
                  {allUsers.filter(u => u.role === 'executive').map(u => (
                    <option key={u.id} value={u.id} className="bg-[#14141c]">{u.name} — {u.title}</option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>

            <button
              onClick={handleDemoLogin}
              disabled={!selectedUserId}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                selectedUserId
                  ? 'text-white hover:brightness-110 active:scale-[0.98] shadow-lg shadow-[#F47920]/20'
                  : 'text-white/30 cursor-not-allowed'
              }`}
              style={{ backgroundColor: selectedUserId ? '#F47920' : 'rgba(244, 121, 32, 0.15)' }}
            >
              <LogIn size={16} />
              Sign In
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-white/15 text-[11px] tracking-wide">
          1-800Accountant Internal Tool &middot; v1.0
        </p>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1e1e2a] border border-white/10 text-white/80 text-sm px-5 py-3 rounded-xl shadow-xl shadow-black/40"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
