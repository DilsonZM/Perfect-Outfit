import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Banknote, BellRing, ClipboardList, Droplets, Shirt } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { addDays, formatCOP, formatDateTime, formatFolio } from '../lib/format'
import StatusBadge from '../components/StatusBadge'

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`rounded-lg p-2 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const inTwoDays = addDays(now, 2).toISOString()

      const [incomeRes, activeRes, rentedRes, laundryRes, alertsRes] = await Promise.all([
        // Ingresos del mes (sin canceladas)
        supabase
          .from('service_orders')
          .select('total_amount')
          .gte('created_at', startOfMonth)
          .neq('status', 'cancelada'),
        // Órdenes activas
        supabase
          .from('service_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'activa'),
        // Prendas alquiladas
        supabase
          .from('inventory')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'alquilado'),
        // Prendas en lavandería
        supabase
          .from('inventory')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'lavanderia'),
        // Alertas: activas vencidas o que vencen en ≤ 2 días
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
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Vista general del negocio</p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Error cargando métricas: {error}
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Banknote}
          label="Ingresos del mes"
          value={stats ? formatCOP(stats.income) : '…'}
          accent="bg-green-100 text-green-600"
        />
        <StatCard
          icon={ClipboardList}
          label="Órdenes activas"
          value={stats?.activeOrders ?? '…'}
          accent="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={Shirt}
          label="Prendas alquiladas"
          value={stats?.rented ?? '…'}
          accent="bg-indigo-100 text-indigo-600"
        />
        <StatCard
          icon={Droplets}
          label="En lavandería"
          value={stats?.laundry ?? '…'}
          accent="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Alertas de devoluciones */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <BellRing className="h-5 w-5 text-red-500" />
          Alertas de devolución
        </h2>

        {alerts === null && !error && (
          <p className="mt-4 text-sm text-slate-500">Cargando alertas…</p>
        )}

        {alerts?.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm font-medium text-green-600">Todo al día</p>
            <p className="mt-1 text-sm text-slate-500">
              No hay devoluciones atrasadas ni próximas a vencer.
            </p>
          </div>
        )}

        {alerts?.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Folio</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Devolución</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((order) => (
                  <tr
                    key={order.id}
                    className={`border-b border-slate-100 last:border-0 ${
                      order.alertStatus === 'atrasada' ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-indigo-600">
                      <Link to="/ordenes" className="hover:underline">
                        {formatFolio(order.folio)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-800">{order.clients?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{order.clients?.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(order.return_date)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.alertStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
