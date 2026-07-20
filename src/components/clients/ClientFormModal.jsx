import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { btnPrimaryCls, btnSecondaryCls, inputCls, labelCls } from '../../lib/styles'
import Modal from '../ui/Modal'

const EMPTY_FORM = {
  full_name: '',
  document_id: '',
  phone: '',
  email: '',
  address: '',
  birth_date: '',
  talla: '',
  pie: '',
  colores: '',
}

function prefsToForm(client) {
  const prefs = client.preferences ?? {}
  return {
    full_name: client.full_name ?? '',
    document_id: client.document_id ?? '',
    phone: client.phone ?? '',
    email: client.email ?? '',
    address: client.address ?? '',
    birth_date: client.birth_date ?? '',
    talla: prefs.talla ?? '',
    pie: prefs.pie ?? '',
    colores: (prefs.colores ?? []).join(', '),
  }
}

export default function ClientFormModal({ client, onClose, onSaved }) {
  const isEdit = Boolean(client)
  const [form, setForm] = useState(isEdit ? prefsToForm(client) : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!form.full_name.trim()) return setError('El nombre es obligatorio.')

    const preferences = {}
    if (form.talla.trim()) preferences.talla = form.talla.trim()
    if (form.pie) preferences.pie = Number(form.pie) || form.pie
    if (form.colores.trim()) {
      preferences.colores = form.colores.split(',').map((c) => c.trim()).filter(Boolean)
    }

    const payload = {
      full_name: form.full_name.trim(),
      document_id: form.document_id.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      birth_date: form.birth_date || null,
      preferences,
    }

    setSaving(true)
    const { error } = isEdit
      ? await supabase.from('clients').update(payload).eq('id', client.id)
      : await supabase.from('clients').insert(payload)
    setSaving(false)

    if (error) {
      setError(
        error.code === '23505' ? 'Ya existe un cliente con ese documento.' : error.message,
      )
    } else {
      onSaved()
    }
  }

  return (
    <Modal title={isEdit ? `Editar ${client.full_name}` : 'Nuevo cliente'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelCls}>Nombre completo *</label>
          <input
            value={form.full_name}
            onChange={set('full_name')}
            data-testid="client-name"
            className={inputCls}
            placeholder="Ej: Carlos Mendoza"
          />
        </div>
        <div>
          <label className={labelCls}>Documento</label>
          <input
            value={form.document_id}
            onChange={set('document_id')}
            className={inputCls}
            placeholder="1020304050"
          />
        </div>
        <div>
          <label className={labelCls}>Teléfono</label>
          <input value={form.phone} onChange={set('phone')} className={inputCls} placeholder="3001234567" />
        </div>
        <div>
          <label className={labelCls}>Correo</label>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            className={inputCls}
            placeholder="cliente@mail.com"
          />
        </div>
        <div>
          <label className={labelCls}>Fecha de nacimiento</label>
          <input
            type="date"
            value={form.birth_date}
            onChange={set('birth_date')}
            className={inputCls}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Dirección</label>
          <input
            value={form.address}
            onChange={set('address')}
            className={inputCls}
            placeholder="Cra 45 #12-30, Medellín"
          />
        </div>

        <div className="col-span-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Preferencias (tallas y gustos)
          </p>
        </div>
        <div>
          <label className={labelCls}>Talla</label>
          <input value={form.talla} onChange={set('talla')} className={inputCls} placeholder="M, L, 34B…" />
        </div>
        <div>
          <label className={labelCls}>Talla de pie</label>
          <input
            type="number"
            value={form.pie}
            onChange={set('pie')}
            className={inputCls}
            placeholder="42"
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Colores preferidos (separados por coma)</label>
          <input
            value={form.colores}
            onChange={set('colores')}
            className={inputCls}
            placeholder="negro, azul marino"
          />
        </div>

        {error && (
          <p className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="col-span-2 flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondaryCls}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} className={btnPrimaryCls} data-testid="client-save">
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
