/**
 * Toggle Switch tipo iOS para control de estado del inventario.
 * Al hacer clic no muta directamente: dispara onToggle() para que el padre
 * abra un ConfirmDialog antes de ejecutar el cambio.
 */
export default function ToggleSwitch({ checked, onToggle, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      data-testid="toggle-switch"
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
        disabled
          ? 'cursor-not-allowed bg-slate-200'
          : checked
            ? 'bg-green-500'
            : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}
