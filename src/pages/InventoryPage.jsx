import { useEffect, useMemo, useState } from 'react'
import { Pencil, PlusCircle, Search, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { formatCOP } from '../lib/format'
import { CATEGORIES, GENDER_LABELS } from '../lib/catalog'
import { btnPrimaryCls, inputCls } from '../lib/styles'
import StatusBadge from '../components/StatusBadge'
import InventoryFormModal from '../components/inventory/InventoryFormModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ToggleSwitch from '../components/ui/ToggleSwitch'

const STATUS_TABS = ['todos', 'disponible', 'alquilado', 'lavanderia', 'mantenimiento']

const STATUS_LABELS = {
  disponible: 'Disponible',
  lavanderia: 'Lavandería',
  mantenimiento: 'Mantenimiento',
}

export default function InventoryPage() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('todos')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | { item?: objeto }

  // Toggle → confirmación de estado
  const [statusDialog, setStatusDialog] = useState(null) // { item, target }
  const [statusSaving, setStatusSaving] = useState(false)

  async function load() {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('category')
      .order('item_code')
    if (error) setError(error.message)
    else setItems(data)
  }

  useEffect(() => {
    load()
  }, [])

  const counts = useMemo(() => {
    const c = { todos: items?.length ?? 0 }
    for (const s of STATUS_TABS.slice(1)) c[s] = items?.filter((i) => i.status === s).length ?? 0
    return c
  }, [items])

  const filtered = useMemo(() => {
    if (!items) return []
    const q = search.trim().toLowerCase()
    return items.filter((i) => {
      if (statusFilter !== 'todos' && i.status !== statusFilter) return false
      if (categoryFilter !== 'todas' && i.category !== categoryFilter) return false
      if (q && ![i.item_code, i.subcategory, i.color, i.brand].join(' ').toLowerCase().includes(q))
        return false
      return true
    })
  }, [items, statusFilter, categoryFilter, search])

  async function handleStatusConfirm() {
    if (!statusDialog) return
    const { item, target } = statusDialog
    setStatusSaving(true)
    const { error } = await supabase.from('inventory').update({ status: target }).eq('id', item.id)
    setStatusSaving(false)
    if (error) {
      alert('Error cambiando estado: ' + error.message)
    } else {
      setStatusDialog(null)
      load()
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`¿Eliminar ${item.item_code} (${item.subcategory ?? item.category})?`)) return
    const { error } = await supabase.from('inventory').delete().eq('id', item.id)
    if (error) {
      alert(
        error.code === '23503'
          ? 'No se puede eliminar: la prenda tiene órdenes asociadas.'
          : 'Error eliminando: ' + error.message,
      )
    } else {
      load()
    }
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventario y lavandería</h1>
          <p className="mt-1 text-sm text-slate-500">Catálogo de prendas e ítems de alquiler</p>
        </div>
        <button
          onClick={() => setModal({})}
          data-testid="new-item"
          className={btnPrimaryCls + ' flex items-center gap-2'}
        >
          <PlusCircle className="h-4 w-4" />
          Nueva prenda
        </button>
      </header>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s} ({counts[s]})
            </button>
          ))}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={inputCls + ' w-auto'}
        >
          <option value="todas">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar código, color, marca…"
            className={inputCls + ' pl-9'}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Error cargando inventario: {error}
        </div>
      ) : items === null ? (
        <p className="py-16 text-center text-sm text-slate-500">Cargando inventario…</p>
      ) : null}

      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Prenda</th>
                <th className="px-4 py-3 font-medium">Género</th>
                <th className="px-4 py-3 font-medium">Talla</th>
                <th className="px-4 py-3 font-medium">Color</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="w-28 px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isAvailable = item.status === 'disponible'
                const isRented = item.status === 'alquilado'

                return (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-indigo-600">{item.item_code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{item.subcategory ?? item.category}</p>
                      <p className="text-xs text-slate-400">
                        {item.category}
                        {item.brand ? ` · ${item.brand}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{GENDER_LABELS[item.gender] ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{item.size ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{item.color ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {formatCOP(item.base_price)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          checked={isAvailable}
                          disabled={isRented}
                          onToggle={() => {
                            const target = isAvailable ? 'lavanderia' : 'disponible'
                            setStatusDialog({ item, target })
                          }}
                        />
                        <StatusBadge status={item.status} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setModal({ item })}
                          aria-label={`Editar ${item.item_code}`}
                          title="Editar"
                          className="rounded-lg p-1.5 text-indigo-600 transition-colors hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          aria-label={`Eliminar ${item.item_code}`}
                          title="Eliminar"
                          className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {items?.length > 0 && filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Ninguna prenda coincide con los filtros.
        </p>
      )}

      {modal && (
        <InventoryFormModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            load()
          }}
        />
      )}

      {/* ConfirmDialog para cambio de estado */}
      {statusDialog && (
        <ConfirmDialog
          title="Cambiar estado de la prenda"
          message={`¿Estás seguro de cambiar el estado de ${statusDialog.item.item_code} de "${STATUS_LABELS[statusDialog.item.status] ?? statusDialog.item.status}" a "${STATUS_LABELS[statusDialog.target] ?? statusDialog.target}"?`}
          confirmLabel={statusSaving ? 'Cambiando…' : 'Confirmar'}
          onConfirm={handleStatusConfirm}
          onCancel={() => setStatusDialog(null)}
        />
      )}
    </div>
  )
}
