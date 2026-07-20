import { useEffect, useMemo, useState } from 'react'
import { History, Pencil, PlusCircle, Search, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { calculateAge } from '../lib/format'
import { btnPrimaryCls, inputCls } from '../lib/styles'
import ClientFormModal from '../components/clients/ClientFormModal'
import ClientOrdersModal from '../components/clients/ClientOrdersModal'
import { confirmDelete, showError, showToast } from '../lib/sweetalert'

export default function ClientsPage() {
  const [clients, setClients] = useState(null)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [historyClient, setHistoryClient] = useState(null)

  async function load() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('full_name', { ascending: true })
    if (error) setError(error.message)
    else setClients(data)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!clients) return []
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) =>
      [c.full_name, c.document_id, c.phone, c.email].join(' ').toLowerCase().includes(q),
    )
  }, [clients, search])

  async function handleDelete(client) {
    const confirmed = await confirmDelete(client.full_name)
    if (!confirmed) return

    const { error } = await supabase.from('clients').delete().eq('id', client.id)
    if (error) {
      await showError(
        'No se puede eliminar',
        error.code === '23503'
          ? 'El cliente tiene órdenes asociadas.'
          : error.message,
      )
    } else {
      showToast('success', 'Cliente eliminado')
      load()
    }
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes (CRM)</h1>
          <p className="mt-1 text-sm text-slate-500">Registro y preferencias de clientes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente…"
              className={inputCls + ' pl-9'}
            />
          </div>
          <button
            onClick={() => setModal({})}
            data-testid="new-client"
            className={btnPrimaryCls + ' flex items-center gap-2'}
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo cliente
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Error cargando clientes: {error}
        </div>
      ) : clients === null ? (
        <p className="py-16 text-center text-sm text-slate-500">Cargando clientes…</p>
      ) : clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Aún no hay clientes registrados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Edad</th>
                <th className="px-4 py-3 font-medium">Preferencias</th>
                <th className="w-36 px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const age = calculateAge(client.birth_date)
                const prefs = Object.entries(client.preferences ?? {})
                return (
                  <tr
                    key={client.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{client.full_name}</p>
                      <p className="text-xs text-slate-400">{client.address ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{client.document_id ?? '—'}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-600">{client.phone ?? '—'}</p>
                      <p className="text-xs text-slate-400">{client.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{age !== null ? `${age} años` : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {prefs.length === 0 && <span className="text-xs text-slate-400">—</span>}
                        {prefs.map(([key, val]) => (
                          <span
                            key={key}
                            className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                          >
                            {key}: {Array.isArray(val) ? val.join(', ') : String(val)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setHistoryClient(client)}
                          aria-label={`Ver historial de ${client.full_name}`}
                          title="Historial de órdenes"
                          data-testid="client-history"
                          className="rounded-lg p-1.5 text-amber-600 transition-colors hover:bg-amber-50 focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          <History className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setModal({ client })}
                          aria-label={`Editar ${client.full_name}`}
                          title="Editar"
                          className="rounded-lg p-1.5 text-indigo-600 transition-colors hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDelete(client)}
                          aria-label={`Eliminar ${client.full_name}`}
                          title="Eliminar"
                          className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {clients?.length > 0 && filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Ningún cliente coincide con la búsqueda.
        </p>
      )}

      {modal && (
        <ClientFormModal
          client={modal.client}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            load()
          }}
        />
      )}

      {historyClient && (
        <ClientOrdersModal client={historyClient} onClose={() => setHistoryClient(null)} />
      )}
    </div>
  )
}
