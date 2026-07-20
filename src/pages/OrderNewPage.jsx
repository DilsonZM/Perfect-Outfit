import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, CreditCard, Flame, Truck } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { addDays, formatCOP, formatDateTime, formatFolio, toLocalInputValue } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import ClientPanel from '../components/orders/ClientPanel'
import ItemsEditor from '../components/orders/ItemsEditor'
import OrderDetailModal from '../components/orders/OrderDetailModal'
import { newLine } from '../components/orders/orderLine'
import { confirmSubmit } from '../lib/sweetalert'

const PAYMENT_METHODS = ['efectivo', 'tarjeta', 'transferencia']

export default function OrderNewPage() {
  // Datos cargados de Supabase
  const [clients, setClients] = useState([])
  const [inventory, setInventory] = useState([])
  const [employees, setEmployees] = useState([])
  const [nextFolio, setNextFolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Estado del formulario
  const [clientId, setClientId] = useState('')
  const [lines, setLines] = useState([newLine()])
  const [discountType, setDiscountType] = useState('percent') // 'percent' | 'fixed'
  const [discountValue, setDiscountValue] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [employeeId, setEmployeeId] = useState('')
  const [deliveryDate, setDeliveryDate] = useState(toLocalInputValue(new Date()))
  const [returnDate, setReturnDate] = useState(toLocalInputValue(addDays(new Date(), 3)))
  const [deliveryNotes, setDeliveryNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [created, setCreated] = useState(null) // { folio, total }

  // --- Fidelidad ------------------------------------------------------------------
  const [isLoyalClient, setIsLoyalClient] = useState(false)
  const [recentOrders, setRecentOrders] = useState(null)

  // Cada vez que cambia el cliente, verificamos si tiene historial de órdenes
  useEffect(() => {
    if (!clientId) {
      setIsLoyalClient(false)
      setRecentOrders(null)
      return
    }

    let cancelled = false

    async function check() {
      const { count, error } = await supabase
        .from('service_orders')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)

      if (cancelled) return
      if (error) return // silencioso: si falla, no mostramos el beneficio

      if ((count ?? 0) > 0) {
        setIsLoyalClient(true)
        setDiscountValue('10')
        setDiscountType('percent')

        const { data } = await supabase
          .from('service_orders')
          .select('folio, status, total_amount, created_at')
          .eq('client_id', clientId)
          .order('folio', { ascending: false })
          .limit(3)
        if (!cancelled) setRecentOrders(data ?? [])
      } else {
        setIsLoyalClient(false)
        setRecentOrders(null)
      }
    }

    check()

    return () => {
      cancelled = true
    }
  }, [clientId])

  async function loadData() {
    setLoading(true)
    setLoadError(null)
    const [clientsRes, inventoryRes, usersRes, folioRes] = await Promise.all([
      supabase.from('clients').select('*').order('full_name'),
      supabase.from('inventory').select('*').eq('status', 'disponible').order('category'),
      supabase.from('users').select('id, full_name, role').order('full_name'),
      supabase.from('service_orders').select('folio').order('folio', { ascending: false }).limit(1),
    ])

    const firstError = clientsRes.error || inventoryRes.error || usersRes.error || folioRes.error
    if (firstError) {
      setLoadError(firstError.message)
    } else {
      setClients(clientsRes.data)
      setInventory(inventoryRes.data)
      setEmployees(usersRes.data)
      setNextFolio((folioRes.data[0]?.folio ?? 0) + 1)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // ---- Totales ------------------------------------------------------------
  const subtotal = useMemo(
    () =>
      lines.reduce((acc, l) => {
        const price = inventory.find((i) => i.id === l.inventoryItemId)?.base_price ?? 0
        return acc + price * (Number(l.quantity) || 0)
      }, 0),
    [lines, inventory],
  )

  const discountAmount = useMemo(() => {
    const value = Number(discountValue) || 0
    if (value <= 0 || subtotal === 0) return 0
    const amount = discountType === 'percent' ? subtotal * (value / 100) : value
    return Math.min(Math.round(amount), subtotal)
  }, [discountType, discountValue, subtotal])

  const total = subtotal - discountAmount

  // ---- Envío ---------------------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!clientId) return setError('Selecciona un cliente para la orden.')
    const validLines = lines.filter((l) => l.inventoryItemId)
    if (validLines.length === 0) return setError('Agrega al menos una prenda al pedido.')
    if (validLines.some((l) => !(Number(l.quantity) >= 1)))
      return setError('La cantidad de cada ítem debe ser mínimo 1.')
    if (!deliveryDate || !returnDate) return setError('Define las fechas de entrega y devolución.')
    if (new Date(returnDate) <= new Date(deliveryDate))
      return setError('La fecha de devolución debe ser posterior a la de entrega.')
    if (!deliveryNotes.trim()) return setError('Describe las notas de salida (estado de las prendas al entregar).')

    const clientName = clients.find((c) => c.id === clientId)?.full_name ?? 'el cliente'
    const confirmed = await confirmSubmit(
      'generate',
      `Crear orden para <strong>${clientName}</strong> con ${validLines.length} ítem(s) por <strong>${formatCOP(total)}</strong>.`,
    )
    if (!confirmed) return

    setSubmitting(true)
    try {
      // 1. Crear la orden
      const { data: order, error: orderError } = await supabase
        .from('service_orders')
        .insert({
          client_id: clientId,
          employee_id: employeeId || null,
          total_amount: total,
          discount: discountAmount,
          payment_method: paymentMethod,
          delivery_notes: deliveryNotes.trim(),
          status: 'activa',
          delivery_date: new Date(deliveryDate).toISOString(),
          return_date: new Date(returnDate).toISOString(),
        })
        .select('id, folio')
        .single()
      if (orderError) throw orderError

      // 2. Crear los ítems (si falla, se revierte la orden)
      const itemRows = validLines.map((l) => ({
        order_id: order.id,
        inventory_item_id: l.inventoryItemId,
        quantity: Number(l.quantity),
        item_type: l.itemType,
      }))
      const { error: itemsError } = await supabase.from('order_items').insert(itemRows)
      if (itemsError) {
        await supabase.from('service_orders').delete().eq('id', order.id)
        throw itemsError
      }

      // 3. Marcar las prendas como alquiladas
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({ status: 'alquilado' })
        .in('id', validLines.map((l) => l.inventoryItemId))
      if (inventoryError) throw inventoryError

      setCreated({
        id: order.id,
        folio: order.folio,
        status: 'activa',
        total_amount: total,
        discount: discountAmount,
        payment_method: paymentMethod,
        delivery_date: new Date(deliveryDate).toISOString(),
        return_date: new Date(returnDate).toISOString(),
        delivery_notes: deliveryNotes.trim(),
        return_received_at: null,
        created_at: new Date().toISOString(),
        clients: {
          full_name: clients.find((c) => c.id === clientId)?.full_name,
          phone: clients.find((c) => c.id === clientId)?.phone,
        },
        users: { full_name: employees.find((u) => u.id === employeeId)?.full_name },
      })
    } catch (err) {
      setError(err.message ?? 'Error inesperado al crear la orden.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setCreated(null)
    setClientId('')
    setLines([newLine()])
    setDiscountValue('')
    setDiscountType('percent')
    setPaymentMethod('efectivo')
    setEmployeeId('')
    setDeliveryDate(toLocalInputValue(new Date()))
    setReturnDate(toLocalInputValue(addDays(new Date(), 3)))
    setDeliveryNotes('')
    setIsLoyalClient(false)
    loadData()
  }

  // ---- Render --------------------------------------------------------------
  if (loading) {
    return <p className="py-16 text-center text-sm text-slate-500">Cargando datos…</p>
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Error cargando datos: {loadError}
      </div>
    )
  }

  if (created) {
    return <OrderDetailModal order={created} onClose={resetForm} />
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Encabezado con folio */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva orden</h1>
          <p className="mt-1 text-sm text-slate-500">Registra un nuevo alquiler</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <StatusBadge status="borrador" />
          <span className="text-lg font-bold tracking-wide text-slate-900">
            {nextFolio ? formatFolio(nextFolio) : '…'}
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="space-y-6 lg:col-span-2">
          <ClientPanel clients={clients} value={clientId} onChange={setClientId} loyalClient={isLoyalClient} />

          <ItemsEditor lines={lines} onChange={setLines} inventory={inventory} />

          {/* Entrega y pago */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Truck className="h-5 w-5 text-indigo-600" />
              Entrega y pago
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha de entrega
                </label>
                <input
                  type="datetime-local"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha de devolución
                </label>
                <input
                  type="datetime-local"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Método de pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm capitalize outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Atendido por (opcional)
                </label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Sin asignar</option>
                  {employees.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Notas de salida (obligatorio) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Describe el estado de cada prenda al momento de la entrega. Ej: El traje va con una pequeña mancha en la solapa izquierda, los zapatos tienen desgaste leve en la suela…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                rows={3}
              />
            </div>
          </section>
        </div>

        {/* Resumen */}
        <aside className="lg:col-span-1">
          <section className="sticky top-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              Resumen
            </h2>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd data-testid="subtotal" className="font-medium text-slate-800">
                  {formatCOP(subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Descuento</dt>
                <dd data-testid="discount-amount" className="font-medium text-red-600">
                  −{formatCOP(discountAmount)}
                </dd>
              </div>
            </dl>

            {/* Descuento */}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Descuento</label>
                {isLoyalClient && (
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                    <Flame className="h-3 w-3" aria-hidden="true" />
                    Fidelidad
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-24 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="percent">%</option>
                  <option value="fixed">$ fijo</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max={discountType === 'percent' ? 100 : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="0"
                  data-testid="discount-input"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-base font-semibold text-slate-900">Total</span>
              <span data-testid="total" className="text-xl font-bold text-indigo-600">
                {formatCOP(total)}
              </span>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              data-testid="submit-order"
              disabled={submitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ClipboardList className="h-4 w-4" />
              {submitting ? 'Generando orden…' : 'Generar orden'}
            </button>
          </section>

          {/* Últimas órdenes del cliente recurrente */}
          {isLoyalClient && recentOrders && recentOrders.length > 0 && (
            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Últimas órdenes
              </p>
              <ul className="mt-3 divide-y divide-slate-50">
                {recentOrders.map((o) => (
                  <li key={o.folio} className="flex items-center justify-between py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-indigo-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatFolio(o.folio)}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <span>{formatDateTime(o.created_at)}</span>
                      <span className="font-medium text-slate-600">{formatCOP(o.total_amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </form>
  )
}
