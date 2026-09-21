import React from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export default function Toast({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error'
        const isSuccess = toast.type === 'success'

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border transition-all transform duration-200 backdrop-blur-md ${
              isError
                ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-rose-900/5'
                : isSuccess
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-900/5'
                : 'bg-white border-slate-200 text-slate-800 shadow-slate-900/5'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isError && <AlertCircle className="w-4 h-4 text-rose-600" />}
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {!isError && !isSuccess && <Info className="w-4 h-4 text-indigo-600" />}
            </div>

            <div className="flex-1 text-xs">
              {toast.title && <div className="font-bold text-slate-900">{toast.title}</div>}
              <div className="text-slate-600 font-medium mt-0.5">{toast.message}</div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
