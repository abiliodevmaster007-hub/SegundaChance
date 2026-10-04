import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
  return (
    <div className="fixed bottom-16 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            onClick={onToastClick}
            className="bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 text-white p-4 rounded-xl shadow-lg flex items-start gap-3.5 pointer-events-auto cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                {t.title}
              </h4>
              <p className="text-xs font-semibold text-slate-100 line-clamp-2 mt-0.5">{t.text}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
