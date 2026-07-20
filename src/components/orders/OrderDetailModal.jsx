import { useEffect, useState } from 'react'
import { Printer, Scissors } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { formatCOP, formatDateTime, formatFolio } from '../../lib/format'
import StatusBadge from '../StatusBadge'

export default function OrderDetailModal({ order, onClose }) {
  const [items, setItems] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('order_items')
        .select(
          'id, quantity, item_type, returned_ok, fine_amount, inventory:inventory_item_id(id, item_code, subcategory, size, color, base_price)',
        )
        .eq('order_id', order.id)
        .order('item_type')
      setItems(data ?? [])
    }
    load()
  }, [order.id])

  const subtotal =
    items?.reduce((acc, oi) => acc + (oi.inventory?.base_price ?? 0) * oi.quantity, 0) ?? 0
  const discount = Number(order.discount) || 0
  const total = Number(order.total_amount) || 0
  const totalFines = items?.reduce((acc, oi) => acc + (Number(oi.fine_amount) || 0), 0) ?? 0

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
        className="my-8 w-full max-w-lg overflow-hidden bg-white shadow-2xl print:my-0 print:max-w-none print:shadow-none print:bg-white"
        style={{ borderRadius: '16px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — banda de color */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 px-6 py-5 text-center text-white">
          <div className="mx-auto mb-1 flex items-center justify-center gap-2">
            <Scissors className="h-5 w-5" aria-hidden="true" />
            <p className="text-sm font-bold uppercase tracking-wider">Perfect Outfit</p>
          </div>
          <p className="text-[11px] tracking-wide text-indigo-100">COMPROBANTE DE ALQUILER</p>
        </div>

        {/* Folio y fecha */}
        <div className="flex items-center justify-between bg-indigo-50 px-6 py-3">
          <p className="text-lg font-bold text-indigo-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatFolio(order.folio)}
          </p>
          <p className="text-xs text-slate-500">{formatDateTime(order.created_at)}</p>
        </div>

        {/* Info */}
        <div className="space-y-3 px-6 py-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cliente</p>
              <p className="mt-0.5 font-medium text-slate-800">{order.clients?.full_name ?? '—'}</p>
              <p className="text-xs text-slate-400">{order.clients?.phone ?? ''}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Estado</p>
              <div className="mt-0.5">
                <StatusBadge status={order.status} />
              </div>
              <p className="mt-1 text-xs text-slate-400">Atendido: {order.users?.full_name ?? '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
            <div>
              <span className="text-slate-400">Entrega:</span>{' '}
              <span className="text-slate-700">{formatDateTime(order.delivery_date)}</span>
            </div>
            <div>
              <span className="text-slate-400">Devolución:</span>{' '}
              <span className="text-slate-700">{formatDateTime(order.return_date)}</span>
            </div>
            <div>
              <span className="text-slate-400">Pago:</span>{' '}
              <span className="capitalize text-slate-700">{order.payment_method ?? '—'}</span>
            </div>
            {order.return_received_at && (
              <div>
                <span className="text-slate-400">Recibido:</span>{' '}
                <span className="text-slate-700">{formatDateTime(order.return_received_at)}</span>
              </div>
            )}
          </div>

          {/* Notas de entrega */}
          {order.delivery_notes && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <p className="font-semibold text-slate-600">Notas de salida:</p>
              <p className="mt-0.5 text-slate-700">{order.delivery_notes}</p>
            </div>
          )}

          {/* Notas de devolución */}
          {order.return_notes && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <p className="font-semibold text-slate-600">Notas de recepción:</p>
              <p className="mt-0.5 text-slate-700">{order.return_notes}</p>
            </div>
          )}
        </div>

        {/* Separador decorativo */}
        <div className="mx-6 border-t-2 border-dashed border-slate-200" />

        {/* Tabla de ítems */}
        <div className="px-6 py-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ítems</p>

          {items === null ? (
            <p className="py-3 text-center text-xs text-slate-400">Cargando…</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-1.5 text-left font-semibold">Código</th>
                  <th className="py-1.5 text-left font-semibold">Descripción</th>
                  <th className="py-1.5 text-right font-semibold">Cant</th>
                  <th className="py-1.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((oi, idx) => {
                  const inv = oi.inventory
                  const unitPrice = inv?.base_price ?? 0
                  const lineTotal = unitPrice * oi.quantity
                  return (
                    <tr
                      key={oi.id}
                      className={`border-b border-slate-100 text-slate-700 ${idx % 2 === 1 ? 'bg-slate-50' : ''}`}
                    >
                      <td className="py-2 font-mono font-semibold text-indigo-600">
                        {inv?.item_code ?? '—'}
                      </td>
                      <td className="py-2">
                        <p>{inv?.subcategory ?? '—'}</p>
                        <p className="text-[10px] text-slate-400">
                          {inv?.size ? `T. ${inv.size}` : ''}
                          {inv?.color ? ` · ${inv.color}` : ''}
                        </p>
                      </td>
                      <td className="py-2 text-right">{oi.quantity}</td>
                      <td className="py-2 text-right font-medium">{formatCOP(lineTotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Totales */}
        <div className="mx-6 border-t border-slate-200" />
        <div className="space-y-1.5 px-6 py-4 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCOP(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Descuento</span>
              <span>−{formatCOP(discount)}</span>
            </div>
          )}
          {totalFines > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Multas</span>
              <span>+{formatCOP(totalFines)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-slate-200 pt-2 text-base font-bold text-slate-900">
            <span>Total</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCOP(total + totalFines)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 text-center text-[10px] text-slate-400 print:bg-white">
          Perfect Outfit — Sistema de Gestión de Alquiler
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 print:hidden">
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
