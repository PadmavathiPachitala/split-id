'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toastHelpers = {
    toast: addToast,
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    info: (msg: string) => addToast(msg, 'info'),
    warning: (msg: string) => addToast(msg, 'warning'),
  }

  return (
    <ToastContext.Provider value={toastHelpers}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-24 lg:bottom-8 right-6 left-6 lg:left-auto lg:w-96 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => {
          let Icon = Info
          let colorClass = 'border-indigo-500/20 text-indigo-400 bg-slate-900/80'
          let iconColor = 'text-indigo-400'

          if (t.type === 'success') {
            Icon = CheckCircle2
            colorClass = 'border-emerald-500/20 text-emerald-400 bg-slate-900/80'
            iconColor = 'text-emerald-400'
          } else if (t.type === 'error') {
            Icon = AlertCircle
            colorClass = 'border-rose-500/20 text-rose-400 bg-slate-900/80'
            iconColor = 'text-rose-400'
          } else if (t.type === 'warning') {
            Icon = AlertTriangle
            colorClass = 'border-amber-500/20 text-amber-400 bg-slate-900/80'
            iconColor = 'text-amber-400'
          }

          return (
            <div
              key={t.id}
              className={`w-full glass-thick p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-2xl pointer-events-auto animate-toast ${colorClass}`}
              role="alert"
            >
              <div className="flex items-start gap-3 flex-1">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                <p className="text-xs font-semibold text-slate-200 leading-relaxed break-words">
                  {t.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-500 hover:text-slate-300 p-0.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
