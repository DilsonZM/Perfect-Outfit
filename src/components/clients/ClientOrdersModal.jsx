import { useEffect, useState } from 'react'
import { History } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { formatCOP, formatDateTime, formatFolio } from '../../lib/format'
import StatusBadge from '../StatusBadge'
import Modal from '../ui/Modal'

export default function ClientOrdersModal({ client, onClose }) {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null) // orderId expanded

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('service_orders')
        .select(
          'id, folio, status, total_amount, discount, delivery_date, return_date, created_at, order_items(id, quantity, item_type, inventory:inventory_item_id(item_code, subcategory, base_price, size, color))',
        )
        .eq('client_id', client.id)
        .order('folio', { ascending: false })

      if (error) setError(error.message)
      else setOrders(data)
    }
    load()
  }, [client.id])

  return (
    <Modal title={`Historial de ${client.full_name}`} onClose={onClose}>
      <div className="max-h-[70vh] overflow-y-auto">
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Error: {error}</p>
        ) : orders === null ? (
          <p className="py-8 text-center text-sm text-slate-500">Cargando historial…</p>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <History className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-slate-600">Sin órdenes previas</p>
            <p className="mt-1 text-xs text-slate-400">Este cliente aún no tiene historial de alquiler.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <button
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-indigo-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatFolio(order.folio)}
                    </p>
                    <p className="text-xs text-slate-400">{formatDateTime(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500">
                      {formatCOP(order.total_amount)}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </button>

                {expanded === order.id && (
                  <div className="-mt-1 rounded-b-xl border border-t-0 border-slate-200 bg-slate-50 px-4 pb-4 pt-3">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400">
                          <th className="py-1.5 font-medium">Prenda</th>
                          <th className="py-1.5 font-medium">Tipo</th>
                          <th className="py-1.5 text-right font-medium">Cant</th>
                          <th className="py-1.5 text-right font-medium">Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.order_items?.map((oi) => (
                          <tr key={oi.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-1.5 text-slate-700">
                              {oi.inventory?.subcategory ?? oi.inventory?.item_code}
                              {oi.inventory?.size ? ` · Talla ${oi.inventory.size}` : ''}
                              {oi.inventory?.color ? ` · ${oi.inventory.color}` : ''}
                            </td>
                            <td className="py-1.5 capitalize text-slate-500">{oi.item_type}</td>
                            <td className="py-1.5 text-right text-slate-500">{oi.quantity}</td>
                            <td className="py-1.5 text-right font-medium text-slate-700">
                              {formatCOP(oi.inventory?.base_price ?? 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {order.discount > 0 && (
                      <p className="mt-2 text-right text-xs text-red-600">
                        Descuento aplicado: −{formatCOP(order.discount)}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
