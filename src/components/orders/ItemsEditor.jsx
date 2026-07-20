import { Plus, Shirt, Trash2 } from 'lucide-react'
import { formatCOP } from '../../lib/format'
import { GENDER_LABELS } from '../../lib/catalog'
import { newLine } from './orderLine'

/** Infiere el item_type de la orden a partir de la jerarquía del catálogo */
function inferItemType(item) {
  if (item.category === 'Calzado') return 'zapato'
  if (item.category === 'Trajes y conjuntos') return 'prenda principal'
  if (item.subcategory?.startsWith('Camisa formal')) return 'prenda principal'
  return 'accesorio'
}

const selectClasses =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'

export default function ItemsEditor({ lines, onChange, inventory }) {
  const selectedIds = lines.map((l) => l.inventoryItemId).filter(Boolean)

  // Una prenda física no puede estar dos veces en la misma orden
  const isSelectable = (item, line) =>
    item.id === line.inventoryItemId || !selectedIds.includes(item.id)

  const categories = [...new Set(inventory.map((i) => i.category).filter(Boolean))]

  const gendersFor = (category) => [
    ...new Set(inventory.filter((i) => i.category === category).map((i) => i.gender).filter(Boolean)),
  ]

  const itemsFor = (line) =>
    inventory.filter(
      (i) =>
        i.category === line.category &&
        (!line.gender || i.gender === line.gender) &&
        isSelectable(i, line),
    )

  const updateLine = (key, patch) =>
    onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  const removeLine = (key) => onChange(lines.filter((l) => l.key !== key))

  const addLine = () => onChange([...lines, newLine()])

  const handleCategory = (line, category) =>
    updateLine(line.key, { category, gender: '', inventoryItemId: '' })

  const handleGender = (line, gender) =>
    updateLine(line.key, { gender, inventoryItemId: '' })

  const handleItem = (line, itemId) => {
    const item = inventory.find((i) => i.id === itemId)
    updateLine(line.key, {
      inventoryItemId: itemId,
      itemType: item ? inferItemType(item) : line.itemType,
    })
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <Shirt className="h-5 w-5 text-indigo-600" />
        Ítems del pedido
      </h2>

      <div className="mt-4 space-y-3">
        {lines.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
            Sin ítems. Agrega la primera prenda del pedido.
          </p>
        )}

        {lines.map((line) => {
          const item = inventory.find((i) => i.id === line.inventoryItemId)
          const lineTotal = (item?.base_price ?? 0) * (Number(line.quantity) || 0)

          return (
            <div key={line.key} className="rounded-lg border border-slate-200 p-3">
              <div className="grid grid-cols-12 items-center gap-2">
                {/* 1. Categoría */}
                <div className="col-span-12 sm:col-span-5 lg:col-span-2">
                  <select
                    data-testid="category-select"
                    value={line.category}
                    onChange={(e) => handleCategory(line, e.target.value)}
                    className={selectClasses}
                  >
                    <option value="">Categoría…</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Subtipo (género) */}
                <div className="col-span-5 sm:col-span-3 lg:col-span-2">
                  <select
                    data-testid="gender-select"
                    value={line.gender}
                    onChange={(e) => handleGender(line, e.target.value)}
                    disabled={!line.category}
                    className={selectClasses}
                  >
                    <option value="">Subtipo…</option>
                    {gendersFor(line.category).map((g) => (
                      <option key={g} value={g}>
                        {GENDER_LABELS[g] ?? g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Prenda (talla y color disponibles) */}
                <div className="col-span-12 lg:col-span-5">
                  <select
                    data-testid="item-select"
                    value={line.inventoryItemId}
                    onChange={(e) => handleItem(line, e.target.value)}
                    disabled={!line.category}
                    className={selectClasses}
                  >
                    <option value="">Prenda…</option>
                    {itemsFor(line).map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.subcategory ?? i.category} · Talla {i.size} · {i.color} —{' '}
                        {formatCOP(i.base_price)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cantidad */}
                <div className="col-span-4 lg:col-span-1">
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                    title="Cantidad"
                    className={selectClasses + ' text-center'}
                  />
                </div>

                {/* Total de línea */}
                <div className="col-span-6 text-right text-sm font-medium text-slate-800 lg:col-span-1">
                  {formatCOP(lineTotal)}
                </div>

                {/* Eliminar línea */}
                <div className="col-span-2 flex justify-end lg:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    title="Quitar ítem"
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Detalle de la línea */}
              {item && (
                <p className="mt-2 text-xs capitalize text-slate-400">
                  {item.item_code} · {line.itemType} · {item.brand} · {formatCOP(item.base_price)} c/u
                </p>
              )}
            </div>
          )
        })}
      </div>

      <button
        type="button"
        data-testid="add-item"
        onClick={addLine}
        disabled={selectedIds.length >= inventory.length}
        className="mt-4 flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Agregar prenda
      </button>
    </section>
  )
}
