"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastNotification {
  id?: string;
  type?: "success" | "error" | "info";
  title?: string;
  message: string;
}

interface ConfirmationToastProps {
  toast: ToastNotification | null;
  onClose: () => void;
  autoCloseMs?: number;
}

export function ConfirmationToast({
  toast,
  onClose,
  autoCloseMs = 5000,
}: ConfirmationToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseMs);
    return () => clearTimeout(timer);
  }, [toast, autoCloseMs, onClose]);

  if (!toast) return null;

  const type = toast.type || "success";

  const colorStyles = {
    success: {
      border: "border-emerald-300",
      bg: "bg-white",
      accent: "bg-emerald-500",
      iconBg: "bg-emerald-50 text-emerald-600",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      titleColor: "text-emerald-950",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      badgeText: "Confirmed",
    },
    error: {
      border: "border-red-300",
      bg: "bg-white",
      accent: "bg-red-500",
      iconBg: "bg-red-50 text-red-600",
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      titleColor: "text-red-950",
      badge: "bg-red-100 text-red-800 border-red-200",
      badgeText: "Failed",
    },
    info: {
      border: "border-blue-300",
      bg: "bg-white",
      accent: "bg-blue-500",
      iconBg: "bg-blue-50 text-blue-600",
      icon: <Info className="w-5 h-5 text-blue-600" />,
      titleColor: "text-blue-950",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
      badgeText: "Notice",
    },
  }[type];

  return (
    <div className="fixed top-5 right-5 sm:right-6 z-[9999] max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto">
      <div
        className={`relative overflow-hidden rounded-2xl border ${colorStyles.border} ${colorStyles.bg} shadow-2xl p-4 flex items-start gap-3`}
      >
        {/* Left Color Indicator Strip */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colorStyles.accent}`} />

        <div className={`w-9 h-9 rounded-xl ${colorStyles.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5 ml-1 border border-current/10`}>
          {colorStyles.icon}
        </div>

        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colorStyles.badge}`}>
              {colorStyles.badgeText}
            </span>
            <h4 className={`text-xs font-bold ${colorStyles.titleColor}`}>
              {toast.title || (type === "success" ? "Action Confirmed" : "Notification")}
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {toast.message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
