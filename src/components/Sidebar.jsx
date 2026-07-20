import { NavLink } from 'react-router-dom'
import {
  ClipboardList,
  LayoutDashboard,
  PlusCircle,
  Scissors,
  ShieldCheck,
  Shirt,
  Users,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/ordenes', label: 'Órdenes', icon: ClipboardList },
  { to: '/inventario', label: 'Inventario', icon: Shirt },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/usuarios', label: 'Usuarios', icon: ShieldCheck },
]

function linkClasses(isActive) {
  return [
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
  ].join(' ')
}

export default function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col bg-slate-900 md:w-64">
      {/* Marca */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
          <Scissors className="h-5 w-5 text-white" />
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-bold text-white">Perfect Outfit</p>
          <p className="text-xs text-slate-400">Gestión de alquiler</p>
        </div>
      </div>

      {/* Acción rápida */}
      <div className="px-3 pb-2">
        <NavLink
          to="/ordenes/nueva"
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 md:justify-start"
        >
          <PlusCircle className="h-5 w-5 shrink-0" />
          <span className="hidden md:inline">Nueva orden</span>
        </NavLink>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => linkClasses(isActive)}
            title={label}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Pie */}
      <div className="border-t border-slate-800 px-4 py-3">
        <p className="hidden text-xs text-slate-500 md:block">MVP · Fase 1</p>
      </div>
    </aside>
  )
}
