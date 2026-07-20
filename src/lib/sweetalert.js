import Swal from 'sweetalert2'

const base = {
  confirmButtonColor: '#4f46e5',
  cancelButtonColor: '#cbd5e1',
  customClass: {
    popup: 'rounded-2xl',
    title: 'text-lg font-semibold text-slate-900',
    htmlContainer: 'text-sm text-slate-500',
    confirmButton: 'rounded-xl px-6 py-2.5 text-sm font-semibold',
    cancelButton: 'rounded-xl px-6 py-2.5 text-sm font-medium text-slate-700',
  },
}

/**
 * Confirmación de eliminación con advertencia (admitir o cancelar).
 * Retorna `true` si el usuario confirmó.
 */
export async function confirmDelete(name) {
  const result = await Swal.fire({
    ...base,
    title: '¿Eliminar?',
    html: `<p>¿Estás seguro de eliminar <strong>${name}</strong>?</p><p class="mt-1 text-xs text-slate-400">Esta acción no se puede deshacer.</p>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
  })
  return result.isConfirmed
}

/**
 * Confirmación genérica (pregunta sí / no).
 */
export async function confirmAction(title, html, confirmLabel = 'Confirmar') {
  const result = await Swal.fire({
    ...base,
    title,
    html,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmLabel,
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
  })
  return result.isConfirmed
}

/**
 * Toast de error inesperado. Solo un botón "Entendido".
 */
export async function showError(title, text) {
  await Swal.fire({
    ...base,
    title,
    html: `<p>${text}</p>`,
    icon: 'error',
    confirmButtonText: 'Entendido',
  })
}
