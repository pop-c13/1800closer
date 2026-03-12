import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function WhisperToast() {
  const { whisperToasts, dismissWhisper } = useApp();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {whisperToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ y: -80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -40, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-dark-bg/95 backdrop-blur-lg border border-brand-blue/30 rounded-xl p-4 shadow-2xl"
            style={{ borderLeft: '3px solid #00BCD4' }}
          >
            <div className="flex items-start gap-3">
              <MessageSquare size={16} className="text-brand-blue mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-brand-blue text-xs font-semibold mb-1">
                  WHISPER from {toast.managerName}
                </p>
                <p className="text-white/90 text-sm leading-relaxed">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => dismissWhisper(toast.id)}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 shrink-0 bg-white/5 rounded-md px-2 py-1"
              >
                <Check size={10} /> Got it
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
