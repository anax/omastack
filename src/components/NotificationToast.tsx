import React from 'react';
import { Bell, Check, Info, AlertTriangle, X } from 'lucide-react';
import { OmarchyTheme } from '../types';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  urgency: 'normal' | 'warn' | 'success';
}

interface NotificationToastProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  currentTheme: OmarchyTheme;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
  currentTheme,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm font-mono text-xs pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="p-3.5 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 pointer-events-auto animate-in slide-in-from-right duration-200"
          style={{
            backgroundColor: currentTheme.bg,
            borderColor: currentTheme.accent,
            color: currentTheme.fg,
          }}
        >
          <div
            className="p-1.5 rounded-lg shrink-0 mt-0.5"
            style={{ backgroundColor: currentTheme.primary, color: currentTheme.bg }}
          >
            <Bell className="w-4 h-4" />
          </div>

          <div className="flex-1 pr-2">
            <div className="font-bold text-xs" style={{ color: currentTheme.accent }}>
              {n.title}
            </div>
            <div className="text-[11px] opacity-80 mt-0.5">{n.message}</div>
          </div>

          <button
            onClick={() => onDismiss(n.id)}
            className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
