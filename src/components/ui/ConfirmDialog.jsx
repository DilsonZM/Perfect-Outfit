import { AlertTriangle } from 'lucide-react'

/**
 * Diálogo de confirmación con diseño limpio.
 * Props: title, message, confirmLabel, onConfirm, onCancel, danger (bool)
 */
export default function ConfirmDialog({
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Confirmar',
  onConfirm,
  onCancel,
  danger = false,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" aria-hidden="true" />
          </div>
          <h3 className="text-center text-lg font-semibold text-slate-900" style={{ textWrap: 'balance' }}>
            {title}
          </h3>
          <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">{message}</p>
        </div>

        <div className="flex border-t border-slate-100">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 border-l border-slate-100 px-4 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-inset ${
              danger
                ? 'text-red-600 hover:bg-red-50 focus-visible:ring-red-400'
                : 'text-indigo-600 hover:bg-indigo-50 focus-visible:ring-indigo-400'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
