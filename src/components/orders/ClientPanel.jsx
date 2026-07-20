import { User } from 'lucide-react'
import { calculateAge } from '../../lib/format'

function Field({ label, value, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{value || '—'}</dd>
    </div>
  )
}

export default function ClientPanel({ clients, value, onChange }) {
  const client = clients.find((c) => c.id === value)
  const preferences = Object.entries(client?.preferences ?? {})

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <User className="h-5 w-5 text-indigo-600" />
        Información del cliente
      </h2>

      <select
        data-testid="client-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      >
        <option value="">Selecciona un cliente…</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.full_name} — CC {c.document_id}
          </option>
        ))}
      </select>

      {client && (
        <>
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <Field label="Nombre" value={client.full_name} />
            <Field label="Documento" value={client.document_id} />
            <Field label="Teléfono" value={client.phone} />
            <Field
              label="Edad"
              value={client.birth_date ? `${calculateAge(client.birth_date)} años` : null}
            />
            <Field label="Dirección" value={client.address} className="sm:col-span-2" />
            <Field label="Correo" value={client.email} className="sm:col-span-2" />
          </dl>

          {preferences.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {preferences.map(([key, val]) => (
                <span
                  key={key}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                >
                  {key}: {Array.isArray(val) ? val.join(', ') : String(val)}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
