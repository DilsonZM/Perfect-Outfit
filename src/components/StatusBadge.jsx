const STYLES = {
  // Órdenes
  activa: 'bg-blue-100 text-blue-700',
  atrasada: 'bg-red-100 text-red-700',
  completada: 'bg-green-100 text-green-700',
  cancelada: 'bg-slate-200 text-slate-600',
  borrador: 'bg-amber-100 text-amber-700',
  vence_pronto: 'bg-amber-100 text-amber-700',
  // Inventario
  disponible: 'bg-green-100 text-green-700',
  alquilado: 'bg-blue-100 text-blue-700',
  lavanderia: 'bg-amber-100 text-amber-700',
  mantenimiento: 'bg-slate-200 text-slate-600',
  // Roles
  admin: 'bg-indigo-100 text-indigo-700',
  employee: 'bg-slate-100 text-slate-600',
}

const LABELS = {
  activa: 'Activa',
  atrasada: 'Atrasada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  borrador: 'Borrador',
  vence_pronto: 'Vence pronto',
  disponible: 'Disponible',
  alquilado: 'Alquilado',
  lavanderia: 'Lavandería',
  mantenimiento: 'Mantenimiento',
  admin: 'Administrador',
  employee: 'Empleado',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {LABELS[status] ?? status}
    </span>
  )
}
