import { NavLink, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Scissors,
  ShieldCheck,
  Shirt,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

const navGroups = [
  {
    label: 'Operación',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/ordenes', label: 'Órdenes', icon: ClipboardList },
      { to: '/inventario', label: 'Inventario', icon: Shirt },
    ],
  },
  {
    label: 'Administración',
    items: [
      { to: '/clientes', label: 'Clientes', icon: Users },
      { to: '/usuarios', label: 'Usuarios', icon: ShieldCheck },
    ],
  },
]

function linkClasses(isActive) {
  return [
    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
    isActive
      ? 'border-l-3 border-l-indigo-500 bg-indigo-600/10 text-white shadow-sm'
      : 'border-l-3 border-l-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white',
  ].join(' ')
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const firstName = user?.full_name?.split(' ')[0] ?? ''
  const initials = user?.full_name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-slate-800/50 bg-slate-900 md:w-64">
      {/* Marca */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
          <Scissors className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-bold leading-tight text-white">Perfect Outfit</p>
          <p className="text-[11px] text-slate-400">Gestión de alquiler</p>
        </div>
      </div>

      {/* Acción rápida */}
      <div className="px-3 pb-4">
        <NavLink
          to="/ordenes/nueva"
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-400 md:justify-start"
        >
          <PlusCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="hidden md:inline">Nueva orden</span>
        </NavLink>
      </div>

      {/* Navegación agrupada */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-1" aria-label="Navegación principal">
        {navGroups.map(({ label, items }) => (
          <div key={label}>
            <p className="mb-1.5 hidden px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 md:block">
              {label}
            </p>
            <ul className="space-y-0.5">
              {items.map(({ to, label: itemLabel, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) => linkClasses(isActive)}
                    title={itemLabel}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="hidden md:inline">{itemLabel}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Usuario actual */}
      <div className="border-t border-slate-800/50 p-3">
        <div className="flex items-center justify-center gap-3 md:justify-start md:px-1">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-sm"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="truncate text-xs font-medium text-white">{firstName}</p>
            <p className="text-[11px] text-slate-400">
              {user?.role === 'admin' ? 'Administrador' : 'Empleado'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            data-testid="logout"
            className="hidden rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-500 md:block"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )
}
