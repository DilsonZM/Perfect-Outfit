import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { formatCOP, formatDateTime, formatFolio } from '../lib/format'
import StatusBadge from '../components/StatusBadge'

function displayStatus(order) {
  if (order.status === 'activa' && order.return_date && new Date(order.return_date) < new Date()) {
    return 'atrasada'
  }
  return order.status
}

export default function OrdersPage() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('service_orders')
        .select(
          'id, folio, status, total_amount, discount, payment_method, delivery_date, return_date, clients(full_name), users(full_name)',
        )
        .order('folio', { ascending: false })
      if (error) setError(error.message)
      else setOrders(data)
    }
    load()
  }, [])

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

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Error cargando órdenes: {error}
        </div>
      )}

      {!error && orders === null && (
        <p className="py-16 text-center text-sm text-slate-500">Cargando órdenes…</p>
      )}

      {!error && orders?.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">Aún no hay órdenes registradas.</p>
          <Link
            to="/ordenes/nueva"
            className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:underline"
          >
            Crear la primera orden →
          </Link>
        </div>
      )}

      {orders?.length > 0 && (
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
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
