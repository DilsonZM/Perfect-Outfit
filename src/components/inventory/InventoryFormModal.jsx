import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { CATEGORIES, GENDERS, GENDER_LABELS, INVENTORY_STATUSES } from '../../lib/catalog'
import { btnPrimaryCls, btnSecondaryCls, inputCls, labelCls } from '../../lib/styles'
import { confirmSubmit, showToast } from '../../lib/sweetalert'
import Modal from '../ui/Modal'

const EMPTY_FORM = {
  item_code: '',
  category: 'Trajes y conjuntos',
  subcategory: '',
  gender: 'hombre',
  size: '',
  color: '',
  brand: '',
  base_price: '',
  replacement_cost: '',
  status: 'disponible',
}

export default function InventoryFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState(isEdit ? { ...item } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!form.item_code.trim() || !form.category) {
      return setError('Código y categoría son obligatorios.')
    }
    if (Number(form.base_price) < 0 || Number(form.replacement_cost) < 0) {
      return setError('Los precios no pueden ser negativos.')
    }

    const payload = {
      item_code: form.item_code.trim().toUpperCase(),
      category: form.category,
      subcategory: form.subcategory.trim() || null,
      gender: form.gender || null,
      size: form.size.trim() || null,
      color: form.color.trim() || null,
      brand: form.brand.trim() || null,
      base_price: Number(form.base_price) || 0,
      replacement_cost: Number(form.replacement_cost) || 0,
      status: form.status,
    }

    setSaving(true)
    const confirmed = await confirmSubmit(
      isEdit ? 'update' : 'create',
      `${isEdit ? 'Actualizar' : 'Crear'} <strong>${payload.item_code}</strong> (${form.subcategory || form.category})`,
    )
    if (!confirmed) { setSaving(false); return }

    const { error } = isEdit
      ? await supabase.from('inventory').update(payload).eq('id', item.id)
      : await supabase.from('inventory').insert(payload)
    setSaving(false)

    if (error) {
      setError(
        error.code === '23505' ? 'Ya existe una prenda con ese código.' : error.message,
      )
    } else {
      showToast('success', isEdit ? 'Prenda actualizada' : 'Prenda creada')
      onSaved()
    }
  }

  return (
    <Modal title={isEdit ? `Editar ${item.item_code}` : 'Nueva prenda'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Código *</label>
          <input
            value={form.item_code}
            onChange={set('item_code')}
            placeholder="SMO-003"
            data-testid="inv-code"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Categoría *</label>
          <select value={form.category} onChange={set('category')} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Subcategoría</label>
          <input
            value={form.subcategory ?? ''}
            onChange={set('subcategory')}
            placeholder="Smoking, Corbata…"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Género</label>
          <select value={form.gender ?? ''} onChange={set('gender')} className={inputCls}>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {GENDER_LABELS[g]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Talla</label>
          <input value={form.size ?? ''} onChange={set('size')} placeholder="M, 42, Única" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Color</label>
          <input value={form.color ?? ''} onChange={set('color')} placeholder="Negro" className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Marca</label>
          <input value={form.brand ?? ''} onChange={set('brand')} placeholder="Arrow, Zara…" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Precio alquiler ($)</label>
          <input
            type="number"
            min="0"
            value={form.base_price}
            onChange={set('base_price')}
            placeholder="150000"
            data-testid="inv-price"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Costo reposición ($)</label>
          <input
            type="number"
            min="0"
            value={form.replacement_cost}
            onChange={set('replacement_cost')}
            placeholder="800000"
            className={inputCls}
          />
        </div>
        {isEdit && (
          <div className="col-span-2">
            <label className={labelCls}>Estado</label>
            <select value={form.status} onChange={set('status')} className={inputCls}>
              {INVENTORY_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="col-span-2 flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondaryCls}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} className={btnPrimaryCls} data-testid="inv-save">
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear prenda'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
