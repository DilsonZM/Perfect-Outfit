import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Eye, PlusCircle, Printer, Search, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { formatCOP, formatDateTime, formatFolio } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import OrderDetailModal from '../components/orders/OrderDetailModal'
import ReturnConfirmationModal from '../components/orders/ReturnConfirmationModal'
import Pagination from '../components/ui/Pagination'
import { confirmAction, showError, showToast } from '../lib/sweetalert'
import { inputCls } from '../lib/styles'

const PAGE_SIZE = 20
const STATUS_FILTERS = ['activa', 'completada', 'cancelada']

function displayStatus(order) {
  if (order.status === 'activa' && order.return_date && new Date(order.return_date) < new Date()) {
    return 'atrasada'
  }
  return order.status
}

export default function OrdersPage() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [detailOrder, setDetailOrder] = useState(null)
  const [returnOrder, setReturnOrder] = useState(null)

  // Filtros
  const [search, setSearch] = useState('')
  const [statusFilters, setStatusFilters] = useState([]) // array de estados seleccionados
  const [page, setPage] = useState(1)

  async function load() {
    const { data, error } = await supabase
      .from('service_orders')
      .select(
        'id, folio, status, total_amount, discount, payment_method, delivery_date, return_date, return_received_at, delivery_notes, return_notes, created_at, clients(full_name, phone), users(full_name)',
      )
      .order('folio', { ascending: false })
    if (error) setError(error.message)
    else setOrders(data)
  }

  useEffect(() => {
    load()
  }, [])

  // Filtrado
  const filtered = useMemo(() => {
    if (!orders) return []
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      // Búsqueda por folio o nombre de cliente
      if (q) {
        const folio = `PO-${o.folio}`.toLowerCase()
        const name = (o.clients?.full_name ?? '').toLowerCase()
        if (!folio.includes(q) && !name.includes(q)) return false
      }
      // Filtro de estado (múltiple)
      if (statusFilters.length > 0) {
        const ds = displayStatus(o)
        if (!statusFilters.includes(ds)) return false
      }
      return true
    })
  }, [orders, search, statusFilters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  )

  // Resetear página al cambiar filtros
  useEffect(() => {
    setPage(1)
  }, [search, statusFilters])

  function toggleStatusFilter(s) {
    setStatusFilters((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    )
  }

  async function handleCancelOrder(order) {
    const confirmed = await confirmAction(
      `¿Cancelar ${formatFolio(order.folio)}?`,
      'Las prendas volverán a <strong>Disponible</strong>.',
      'Sí, cancelar',
    )
    if (!confirmed) return

    setUpdating(order.id)
    try {
      await supabase.from('service_orders').update({ status: 'cancelada' }).eq('id', order.id)
      const { data: items } = await supabase.from('order_items').select('inventory_item_id').eq('order_id', order.id)
      if (items?.length > 0) {
        await supabase.from('inventory').update({ status: 'disponible' }).in('id', items.map((i) => i.inventory_item_id))
      }
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'cancelada' } : o)))
      showToast('success', 'Orden cancelada')
    } catch (err) {
      await showError('Error', err.message)
    } finally {
      setUpdating(null)
    }
  }

  function handleReturnCompleted() {
    setReturnOrder(null)
    load()
  }

  const showActions = (order) => order.status === 'activa'

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Órdenes de servicio</h1>
          <p className="mt-1 text-sm text-slate-500">Historial de órdenes de alquiler</p>
        </div>
        <Link
          to="/ordenes/nueva"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          <PlusCircle className="h-4 w-4" />
          Nueva orden
        </Link>
      </header>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar folio o cliente…"
            className={inputCls + ' pl-9 w-56'}
          />
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {STATUS_FILTERS.map((s) => {
            const active = statusFilters.includes(s)
            return (
              <button
                key={s}
                onClick={() => toggleStatusFilter(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s}
              </button>
            )
          })}
        </div>

        <p className="text-xs text-slate-400">
          {filtered.length} resultados
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : orders === null ? (
        <p className="py-16 text-center text-sm text-slate-500">Cargando órdenes…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">Aún no hay órdenes registradas.</p>
          <Link to="/ordenes/nueva" className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:underline">
            Crear la primera orden →
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Folio</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Atendido por</th>
                  <th className="px-4 py-3 font-medium">Entrega</th>
                  <th className="px-4 py-3 font-medium">Devolución</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="w-28 px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setDetailOrder(order)}
                    className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-semibold text-indigo-600">
                      {formatFolio(order.folio)}
                    </td>
                    <td className="px-4 py-3 text-slate-800">{order.clients?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{order.users?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(order.delivery_date)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(order.return_date)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={displayStatus(order)} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {formatCOP(order.total_amount)}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setDetailOrder(order)}
                          aria-label={`Ver detalle ${formatFolio(order.folio)}`}
                          title="Ver detalle"
                          className="rounded-lg p-1.5 text-indigo-500 transition-colors hover:bg-indigo-50"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {showActions(order) ? (
                          <>
                            <button
                              onClick={() => setReturnOrder(order)}
                              disabled={updating === order.id}
                              aria-label="Confirmar devolución"
                              title="Confirmar devolución"
                              data-testid="complete-order"
                              className="rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order)}
                              disabled={updating === order.id}
                              aria-label="Cancelar orden"
                              title="Cancelar orden"
                              data-testid="cancel-order"
                              className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDetailOrder(order)}
                            aria-label={`Imprimir ${formatFolio(order.folio)}`}
                            title="Imprimir"
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
                          >
                            <Printer className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}
      {returnOrder && (
        <ReturnConfirmationModal order={returnOrder} onClose={() => setReturnOrder(null)} onCompleted={handleReturnCompleted} />
      )}
    </div>
  )
}
