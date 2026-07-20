import { useEffect, useState } from 'react'
import { AlertTriangle, Ban, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { formatCOP, formatFolio } from '../../lib/format'
import { btnPrimaryCls, btnSecondaryCls, inputCls } from '../../lib/styles'
import { showToast } from '../../lib/sweetalert'
import Modal from '../ui/Modal'

const STATES = {
  ok: { label: 'OK', icon: CheckCircle2, cls: 'text-green-600 bg-green-50 border-green-200' },
  damaged: { label: 'Dañado', icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50 border-amber-200' },
  lost: { label: 'Perdido', icon: Ban, cls: 'text-red-600 bg-red-50 border-red-200' },
}

const INVENTORY_STATUS = { ok: 'lavanderia', damaged: 'mantenimiento', lost: 'extraviado' }

export default function ReturnConfirmationModal({ order, onClose, onCompleted }) {
  const [items, setItems] = useState(null)
  const [returnNotes, setReturnNotes] = useState('')
  const [checks, setChecks] = useState({}) // key → { state, fine }
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('order_items')
        .select('id, quantity, item_type, inventory:inventory_item_id(id, item_code, subcategory, size, color, base_price, replacement_cost)')
        .eq('order_id', order.id)

      setItems(data ?? [])
      const init = {}
      for (const oi of data ?? []) {
        init[oi.id] = { state: 'ok', fine: '' }
      }
      setChecks(init)
    }
    load()
  }, [order.id])

  function setState(oiId, state) {
    setChecks((prev) => {
      const current = prev[oiId]
      const replacement = items?.find((oi) => oi.id === oiId)?.inventory?.replacement_cost ?? 0
      const fine = state === 'lost' ? String(replacement) : current.fine
      return { ...prev, [oiId]: { state, fine } }
    })
  }

  function setFine(oiId, val) {
    setChecks((prev) => ({
      ...prev,
      [oiId]: { ...prev[oiId], fine: val },
    }))
  }

  async function handleConfirm() {
    if (!returnNotes.trim()) {
      setFormError('Las notas de recepción son obligatorias.')
      return
    }
    setFormError(null)
    setSaving(true)

    const now = new Date().toISOString()

    const { error: orderErr } = await supabase
      .from('service_orders')
      .update({ status: 'completada', return_received_at: now, return_notes: returnNotes.trim() })
      .eq('id', order.id)
    if (orderErr) { setSaving(false); return alert(orderErr.message) }

    for (const oi of items ?? []) {
      const chk = checks[oi.id] ?? { state: 'ok', fine: '' }
      await supabase
        .from('order_items')
        .update({ returned_ok: chk.state === 'ok', fine_amount: Number(chk.fine) || 0 })
        .eq('id', oi.id)
    }

    for (const oi of items ?? []) {
      const chk = checks[oi.id] ?? { state: 'ok', fine: '' }
      const status = INVENTORY_STATUS[chk.state]
      await supabase.from('inventory').update({ status }).eq('id', oi.inventory?.id)
    }

    showToast('success', 'Devolución confirmada')
    setSaving(false)
    onCompleted()
  }

  return (
    <Modal title={`Recepción — ${formatFolio(order.folio)}`} onClose={onClose}>
      <div className="max-h-[75vh] overflow-y-auto space-y-5">
        <p className="text-sm text-slate-600">
          Cliente: <strong>{order.clients?.full_name ?? '—'}</strong>
        </p>

        {order.delivery_notes && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <p className="font-semibold text-slate-600">Notas de salida:</p>
            <p className="mt-0.5 text-slate-700">{order.delivery_notes}</p>
          </div>
        )}

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
                const chk = checks[oi.id] ?? { state: 'ok', fine: '' }
                const showFine = chk.state !== 'ok'

                return (
                  <li key={oi.id} className="space-y-2 p-3">
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
                          {' · Reposición: '}{formatCOP(inv?.replacement_cost ?? 0)}
                        </p>
                      </div>

                      <div className="flex shrink-0 rounded-lg border border-slate-200 p-0.5">
                        {Object.entries(STATES).map(([key, s]) => {
                          const Icon = s.icon
                          const active = chk.state === key
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setState(oi.id, key)}
                              title={s.label}
                              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                active ? s.cls + ' border' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{s.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {showFine && (
                      <div className="flex items-center gap-2">
                        <label className="shrink-0 text-xs font-medium text-slate-500">
                          {chk.state === 'lost' ? 'Costo reposición ($)' : 'Multa ($)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={chk.fine}
                          onChange={(e) => setFine(oi.id, e.target.value)}
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

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Notas de recepción (obligatorio) <span className="text-red-500">*</span>
          </label>
          <textarea
            value={returnNotes}
            onChange={(e) => { setReturnNotes(e.target.value); setFormError(null) }}
            placeholder="Describe el estado de las prendas al recibirlas…"
            className={inputCls + ' h-16 resize-none'}
            rows={2}
          />
          {formError && <p className="mt-1 text-xs text-red-600">{formError}</p>}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button onClick={onClose} className={btnSecondaryCls}>Cancelar</button>
        <button onClick={handleConfirm} disabled={saving} className={btnPrimaryCls}>
          {saving ? 'Guardando…' : 'Confirmar devolución'}
        </button>
      </div>
    </Modal>
  )
}
