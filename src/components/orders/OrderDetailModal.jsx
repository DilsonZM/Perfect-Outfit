import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { formatCOP, formatDateTime, formatFolio } from '../../lib/format'
import StatusBadge from '../StatusBadge'

export default function OrderDetailModal({ order, onClose }) {
  const [items, setItems] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('order_items')
        .select('id, quantity, item_type, inventory:inventory_item_id(item_code, subcategory, size, color, base_price)')
        .eq('order_id', order.id)
        .order('item_type')
      setItems(data ?? [])
    }
    load()
  }, [order.id])

  const subtotal = items?.reduce(
    (acc, oi) => acc + (oi.inventory?.base_price ?? 0) * oi.quantity,
    0,
  ) ?? 0

  const discount = Number(order.discount) || 0
  const total = Number(order.total_amount) || 0

  function handlePrint() {
    window.print()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 print:static print:bg-white print:p-0"
      onClick={onClose}
    >
      <div
        id="order-invoice"
        className="my-8 w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl print:my-0 print:max-w-none print:rounded-none print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6 print:border-slate-300">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Perfect Outfit</h2>
            <p className="text-sm text-slate-500">Comprobante de alquiler</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatFolio(order.folio)}
            </p>
            <p className="text-xs text-slate-400">{formatDateTime(order.created_at)}</p>
          </div>
        </div>

        {/* Cliente y orden */}
        <div className="mt-6 grid grid-cols-2 gap-6 border-b border-slate-100 pb-6 print:border-slate-300">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cliente</p>
            <p className="mt-1 font-medium text-slate-800">{order.clients?.full_name ?? '—'}</p>
            <p className="text-sm text-slate-500">{order.clients?.phone ?? ''}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Estado</p>
            <div className="mt-1">
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Atendido por: {order.users?.full_name ?? '—'}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-b border-slate-100 pb-4 text-sm print:border-slate-300">
          <div>
            <span className="text-slate-400">Entrega:</span>{' '}
            <span className="text-slate-700">{formatDateTime(order.delivery_date)}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400">Devolución:</span>{' '}
            <span className="text-slate-700">{formatDateTime(order.return_date)}</span>
          </div>
          <div>
            <span className="text-slate-400">Método de pago:</span>{' '}
            <span className="capitalize text-slate-700">{order.payment_method ?? '—'}</span>
          </div>
        </div>

        {/* Ítems */}
        <div className="mt-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 print:border-slate-300">
                <th className="py-2 font-medium">Código</th>
                <th className="py-2 font-medium">Descripción</th>
                <th className="py-2 font-medium">Tipo</th>
                <th className="py-2 text-center font-medium">Cant</th>
                <th className="py-2 text-right font-medium">P. Unit</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {items === null ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">Cargando…</td>
                </tr>
              ) : (
                items.map((oi) => {
                  const inv = oi.inventory
                  const unitPrice = inv?.base_price ?? 0
                  const lineTotal = unitPrice * oi.quantity
                  return (
                    <tr key={oi.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 font-mono text-xs text-indigo-600">{inv?.item_code ?? '—'}</td>
                      <td className="py-2 text-slate-700">
                        {inv?.subcategory ?? '—'}
                        {inv?.size ? ` · Talla ${inv.size}` : ''}
                        {inv?.color ? ` · ${inv.color}` : ''}
                      </td>
                      <td className="py-2 text-xs capitalize text-slate-500">{oi.item_type}</td>
                      <td className="py-2 text-center text-slate-600">{oi.quantity}</td>
                      <td className="py-2 text-right text-slate-600">{formatCOP(unitPrice)}</td>
                      <td className="py-2 text-right font-medium text-slate-800">{formatCOP(lineTotal)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="mt-4 flex flex-col items-end border-t border-slate-200 pt-4 text-sm print:border-slate-300">
          <div className="flex w-56 justify-between text-slate-500">
            <span>Subtotal</span>
            <span>{formatCOP(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="mt-1 flex w-56 justify-between text-red-600">
              <span>Descuento</span>
              <span>−{formatCOP(discount)}</span>
            </div>
          )}
          <div className="mt-2 flex w-56 justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
            <span>Total</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCOP(total)}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-6 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  )
}
