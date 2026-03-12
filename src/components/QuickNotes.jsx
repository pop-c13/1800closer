import { useState } from 'react';
import { ChevronDown, ChevronUp, StickyNote } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function QuickNotes() {
  const { sessionData, setSessionData } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border-t border-white/10">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2 text-white/60 hover:text-white/80 text-xs"
      >
        <span className="flex items-center gap-1.5">
          <StickyNote size={12} />
          Quick Notes
        </span>
        {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {!collapsed && (
        <div className="px-4 pb-3">
          <textarea
            value={sessionData.quickNotes}
            onChange={(e) => setSessionData(prev => ({ ...prev, quickNotes: e.target.value }))}
            placeholder="Jot notes during the call..."
            className="w-full h-20 bg-white/5 border border-white/10 rounded-lg p-2 text-white/80 text-xs resize-none focus:outline-none focus:border-brand-orange/50 placeholder:text-white/20"
          />
        </div>
      )}
    </div>
  );
}
