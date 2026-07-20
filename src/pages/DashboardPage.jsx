import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Banknote, BellRing, CheckCircle2, ClipboardList, Droplets, PlusCircle, Shirt, Users } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { addDays, formatCOP, formatDateTime, formatFolio } from '../lib/format'
import { useAuth } from '../context/useAuth'
import StatusBadge from '../components/StatusBadge'

function StatCard({ icon: Icon, label, value, accent, accentBg }) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm ring-1 ring-slate-200/20 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`rounded-xl p-2.5 ${accentBg}`}>
          <Icon className={`h-5 w-5 ${accent}`} aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
    </div>
  )
}

const pillsCls =
  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-indigo-500'

export default function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.full_name?.split(' ')[0] ?? ''

  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const inTwoDays = addDays(now, 2).toISOString()

      const [incomeRes, activeRes, rentedRes, laundryRes, alertsRes] = await Promise.all([
        supabase
          .from('service_orders')
          .select('total_amount')
          .gte('created_at', startOfMonth)
          .neq('status', 'cancelada'),
        supabase
          .from('service_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'activa'),
        supabase
          .from('inventory')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'alquilado'),
        supabase
          .from('inventory')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'lavanderia'),
        supabase
          .from('service_orders')
          .select('id, folio, return_date, clients(full_name, phone)')
          .eq('status', 'activa')
          .lte('return_date', inTwoDays)
          .order('return_date', { ascending: true }),
      ])

      const firstError =
        incomeRes.error || activeRes.error || rentedRes.error || laundryRes.error || alertsRes.error
      if (firstError) {
        setError(firstError.message)
        return
      }

      setStats({
        income: incomeRes.data.reduce((acc, o) => acc + Number(o.total_amount), 0),
        activeOrders: activeRes.count ?? 0,
        rented: rentedRes.count ?? 0,
        laundry: laundryRes.count ?? 0,
      })

      const nowMs = now.getTime()
      setAlerts(
        alertsRes.data.map((o) => ({
          ...o,
          alertStatus: new Date(o.return_date).getTime() < nowMs ? 'atrasada' : 'vence_pronto',
        })),
      )
    }
    load()
  }, [])

  return (
    <div>
      {/* Saludo */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl" style={{ textWrap: 'balance' }}>
          Hola, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">Aquí tienes el resumen de hoy</p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Error cargando métricas: {error}
        </div>
      ) : null}

      {/* Acciones rápidas — chips */}
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Acciones rápidas">
        <Link
          to="/ordenes/nueva"
          className={`${pillsCls} bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500`}
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          Nueva orden
        </Link>
        <Link
          to="/ordenes"
          className={`${pillsCls} border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50`}
        >
          <ClipboardList className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Ver órdenes
        </Link>
        <Link
          to="/inventario"
          className={`${pillsCls} border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50`}
        >
          <Shirt className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Inventario
        </Link>
        <Link
          to="/clientes"
          className={`${pillsCls} border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50`}
        >
          <Users className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Clientes
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Banknote}
          label="Ingresos del mes"
          value={stats ? formatCOP(stats.income) : '…'}
          accent="text-green-600"
          accentBg="bg-green-50"
        />
        <StatCard
          icon={ClipboardList}
          label="Órdenes activas"
          value={stats?.activeOrders ?? '…'}
          accent="text-blue-600"
          accentBg="bg-blue-50"
        />
        <StatCard
          icon={Shirt}
          label="Prendas alquiladas"
          value={stats?.rented ?? '…'}
          accent="text-indigo-600"
          accentBg="bg-indigo-50"
        />
        <StatCard
          icon={Droplets}
          label="En lavandería"
          value={stats?.laundry ?? '…'}
          accent="text-amber-600"
          accentBg="bg-amber-50"
        />
      </div>

      {/* Alertas */}
      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <BellRing className="h-5 w-5 text-rose-500" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-900">Alertas de devolución</h2>
        </div>

        {alerts === null && !error ? (
          <p className="text-sm text-slate-500">Cargando alertas…</p>
        ) : alerts?.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-green-200 bg-green-50/50 p-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-green-700">Todo al día</p>
            <p className="mt-1 text-sm text-green-600">
              No hay devoluciones atrasadas ni próximas a vencer.
            </p>
          </div>
        ) : alerts?.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/20">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3.5">Folio</th>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Teléfono</th>
                  <th className="px-5 py-3.5">Devolución</th>
                  <th className="px-5 py-3.5">Estado</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((order) => (
                  <tr
                    key={order.id}
                    className={`border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50 ${
                      order.alertStatus === 'atrasada' ? 'bg-red-50/60' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5 font-semibold text-indigo-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      <Link to="/ordenes" className="hover:underline focus-visible:outline-indigo-500">
                        {formatFolio(order.folio)}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{order.clients?.full_name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500">{order.clients?.phone ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatDateTime(order.return_date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.alertStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  )
}
