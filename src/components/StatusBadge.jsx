const STYLES = {
  activa: 'bg-blue-100 text-blue-700',
  atrasada: 'bg-red-100 text-red-700',
  completada: 'bg-green-100 text-green-700',
  cancelada: 'bg-slate-200 text-slate-600',
  borrador: 'bg-amber-100 text-amber-700',
}

const LABELS = {
  activa: 'Activa',
  atrasada: 'Atrasada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  borrador: 'Borrador',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {LABELS[status] ?? status}
    </span>
  )
}
