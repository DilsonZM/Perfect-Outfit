import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Eye, PlusCircle, Printer, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { formatCOP, formatDateTime, formatFolio } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import OrderDetailModal from '../components/orders/OrderDetailModal'
import { confirmAction, showError, showToast } from '../lib/sweetalert'

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

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('service_orders')
        .select(
          'id, folio, status, total_amount, discount, payment_method, delivery_date, return_date, created_at, clients(full_name, phone), users(full_name)',
        )
        .order('folio', { ascending: false })
      if (error) setError(error.message)
      else setOrders(data)
    }
    load()
  }, [])

  async function handleStatusChange(order, newStatus) {
    const inventoryStatus = newStatus === 'completada' ? 'lavanderia' : 'disponible'

    const confirmed = await confirmAction(
      `¿${newStatus === 'completada' ? 'Completar' : 'Cancelar'} ${formatFolio(order.folio)}?`,
      newStatus === 'completada'
        ? 'Las prendas pasarán a <strong>Lavandería</strong>.'
        : 'Las prendas volverán a <strong>Disponible</strong>.',
      newStatus === 'completada' ? 'Sí, completar' : 'Sí, cancelar',
    )
    if (!confirmed) return

    setUpdating(order.id)
    try {
      const { error } = await supabase
        .from('service_orders')
        .update({ status: newStatus })
        .eq('id', order.id)
      if (error) throw error

      const { data: items } = await supabase
        .from('order_items')
        .select('inventory_item_id')
        .eq('order_id', order.id)

      if (items?.length > 0) {
        const ids = items.map((i) => i.inventory_item_id)
        const { error: invError } = await supabase
          .from('inventory')
          .update({ status: inventoryStatus })
          .in('id', ids)
        if (invError) throw invError
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)),
      )
      showToast('success', `Orden ${newStatus === 'completada' ? 'completada' : 'cancelada'}`)
    } catch (err) {
      await showError('Error', err.message)
    } finally {
      setUpdating(null)
    }
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

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Error cargando órdenes: {error}
        </div>
      ) : orders === null ? (
        <p className="py-16 text-center text-sm text-slate-500">Cargando órdenes…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">Aún no hay órdenes registradas.</p>
          <Link
            to="/ordenes/nueva"
            className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:underline"
          >
            Crear la primera orden →
          </Link>
        </div>
      ) : (
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
              {orders.map((order) => (
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
                            onClick={() => handleStatusChange(order, 'completada')}
                            disabled={updating === order.id}
                            aria-label="Completar orden"
                            title="Completar orden"
                            className="rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(order, 'cancelada')}
                            disabled={updating === order.id}
                            aria-label="Cancelar orden"
                            title="Cancelar orden"
                            className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            const el = document.getElementById('order-invoice')
                            if (el) {
                              const w = window.open('', '_blank', 'width=800,height=600')
                              w?.document.write(el.outerHTML)
                              w?.document.close()
                              w?.print()
                            }
                          }}
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
      )}

      {detailOrder && (
        <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
      )}
    </div>
  )
}
