import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { formatCOP, formatFolio } from '../../lib/format'
import { btnPrimaryCls, btnSecondaryCls, inputCls } from '../../lib/styles'
import { showToast } from '../../lib/sweetalert'
import Modal from '../ui/Modal'

export default function ReturnConfirmationModal({ order, onClose, onCompleted }) {
  const [items, setItems] = useState(null)
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [returnNotes, setReturnNotes] = useState('')
  const [checks, setChecks] = useState({}) // key: orderItemId → { ok, fine }
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('order_items')
        .select('id, quantity, item_type, inventory:inventory_item_id(item_code, subcategory, size, color, base_price, replacement_cost)')
        .eq('order_id', order.id)

      setItems(data ?? [])
      const init = {}
      for (const oi of data ?? []) {
        init[oi.id] = { ok: true, fine: '' }
      }
      setChecks(init)
    }
    load()
  }, [order.id])

  function toggleOk(oiId) {
    setChecks((prev) => ({
      ...prev,
      [oiId]: { ...prev[oiId], ok: !prev[oiId].ok, fine: '' },
    }))
  }

  function setFine(oiId, val) {
    setChecks((prev) => ({
      ...prev,
      [oiId]: { ...prev[oiId], fine: val },
    }))
  }

  async function handleConfirm() {
    setSaving(true)

    const now = new Date().toISOString()

    // 1. Update order
    const { error: orderErr } = await supabase
      .from('service_orders')
      .update({
        status: 'completada',
        return_received_at: now,
        delivery_notes: deliveryNotes.trim() || null,
        return_notes: returnNotes.trim() || null,
      })
      .eq('id', order.id)
    if (orderErr) { setSaving(false); return alert(orderErr.message) }

    // 2. Update each order_item
    for (const oi of items ?? []) {
      const chk = checks[oi.id] ?? { ok: true, fine: '' }
      const { error } = await supabase
        .from('order_items')
        .update({
          returned_ok: chk.ok,
          fine_amount: Number(chk.fine) || 0,
        })
        .eq('id', oi.id)
      if (error) { setSaving(false); return alert(error.message) }
    }

    // 3. Update inventory status
    for (const oi of items ?? []) {
      const chk = checks[oi.id] ?? { ok: true, fine: '' }
      const status = chk.ok ? 'lavanderia' : 'mantenimiento'
      await supabase
        .from('inventory')
        .update({ status })
        .eq('id', oi.inventory?.id)
        .throwOnError()
    }

    showToast('success', 'Devolución confirmada')
    setSaving(false)
    onCompleted()
  }

  return (
    <Modal title={`Recepción — ${formatFolio(order.folio)}`} onClose={onClose}>
      <div className="max-h-[75vh] overflow-y-auto space-y-5">
        {/* Cliente */}
        <p className="text-sm text-slate-600">
          Cliente: <strong>{order.clients?.full_name ?? '—'}</strong>
        </p>

        {/* Notas de entrega */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Notas de salida (entrega)
          </label>
          <textarea
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            placeholder="Ej: El traje va con una pequeña mancha en la solapa izquierda…"
            className={inputCls + ' h-16 resize-none'}
            rows={2}
          />
        </div>

        {/* Checklist de ítems */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Revisión de prendas devueltas
          </p>

          {items === null ? (
            <p className="text-sm text-slate-400">Cargando…</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {items.map((oi) => {
                const inv = oi.inventory
                const chk = checks[oi.id] ?? { ok: true, fine: '' }
                const isOk = chk.ok
                return (
                  <li key={oi.id} className={`p-3 ${isOk ? 'bg-white' : 'bg-red-50/50'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {inv?.item_code} — {inv?.subcategory ?? '—'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {inv?.size ? `Talla ${inv.size}` : ''}
                          {inv?.color ? ` · ${inv.color}` : ''}
                          {' · '}{oi.item_type}
                          {' · '}{formatCOP(inv?.base_price ?? 0)} c/u
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleOk(oi.id)}
                        className={`shrink-0 rounded-full p-1.5 transition-colors ${
                          isOk
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-red-100 text-red-500 hover:bg-red-200'
                        }`}
                        title={isOk ? 'Devuelto en buen estado' : 'Marcar como dañado/extraviado'}
                      >
                        {isOk ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {!isOk && (
                      <div className="mt-2 flex items-center gap-2">
                        <label className="shrink-0 text-xs text-red-600">Multa ($)</label>
                        <input
                          type="number"
                          min="0"
                          value={chk.fine}
                          onChange={(e) => setFine(oi.id, e.target.value)}
                          placeholder={inv?.replacement_cost ? `Costo: ${formatCOP(inv.replacement_cost)}` : '0'}
                          className={inputCls + ' w-32 text-sm'}
                        />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Notas de recepción */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Notas de recepción (devolución)
          </label>
          <textarea
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder="Ej: Se recibió todo en buen estado. El zapato derecho tiene rasguño leve…"
            className={inputCls + ' h-16 resize-none'}
            rows={2}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button onClick={onClose} className={btnSecondaryCls}>
          Cancelar
        </button>
        <button onClick={handleConfirm} disabled={saving} className={btnPrimaryCls}>
          {saving ? 'Guardando…' : 'Confirmar devolución'}
        </button>
      </div>
    </Modal>
  )
}
