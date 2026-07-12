import React from 'react';

interface Toast {
  id: string;
  title: string;
  text: string;
}

interface ToastNotificationsProps {
  toasts: Toast[];
  onToastClick: () => void;
}

export default function ToastNotifications({ toasts, onToastClick }: ToastNotificationsProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div 
          key={t.id}
          onClick={onToastClick}
          className="bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-lg flex items-start gap-4 pointer-events-auto cursor-pointer hover:bg-slate-850 transition duration-150 transform hover:-translate-y-0.5"
        >
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse mt-1.5 shrink-0"></div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400">{t.title}</h4>
            <p className="text-xs font-semibold text-slate-100 line-clamp-2 mt-0.5">{t.text}</p>
            <span className="text-[9px] text-slate-400 mt-1 block font-mono font-bold">WebSocket STOMP Channel</span>
          </div>
        </div>
      ))}
    </div>
  );
}
