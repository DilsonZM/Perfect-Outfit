import { useEffect, useState } from 'react'
import { ShieldAlert, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/useAuth'
import { formatDateTime } from '../lib/format'
import { btnPrimaryCls, btnSecondaryCls, inputCls, labelCls } from '../lib/styles'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/ui/Modal'

const EMPTY_FORM = { full_name: '', email: '', password: '', role: 'employee' }

export default function UsersPage() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState(null)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  async function load() {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: true })
    if (error) setError(error.message)
    else setUsers(data)
  }

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin])

  async function handleCreate(e) {
    e.preventDefault()
    setFormError(null)
    if (!form.full_name.trim() || !form.email.trim() || !form.password) {
      return setFormError('Completa todos los campos.')
    }
    setSaving(true)
    const { error } = await supabase.from('users').insert({
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
    })
    setSaving(false)
    if (error) {
      setFormError(
        error.code === '23505' ? 'Ya existe un usuario con ese correo.' : error.message,
      )
    } else {
      setModalOpen(false)
      setForm(EMPTY_FORM)
      load()
    }
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Acceso restringido</h1>
        <p className="mt-2 text-sm text-slate-500">
          Solo los usuarios con rol <strong>Administrador</strong> pueden gestionar perfiles de
          empleados.
        </p>
      </div>
    )
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Seguridad y usuarios</h1>
          <p className="mt-1 text-sm text-slate-500">Perfiles de empleados del sistema</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          data-testid="new-user"
          className={btnPrimaryCls + ' flex items-center gap-2'}
        >
          <UserPlus className="h-4 w-4" />
          Nuevo empleado
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Error cargando usuarios: {error}
        </div>
      )}

      {!error && users === null && (
        <p className="py-16 text-center text-sm text-slate-500">Cargando usuarios…</p>
      )}

      {users && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.full_name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.role} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal title="Nuevo empleado" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className={labelCls}>Nombre completo</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className={inputCls}
                data-testid="user-name"
                placeholder="Ej: Laura Torres"
              />
            </div>
            <div>
              <label className={labelCls}>Correo electrónico</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
                data-testid="user-email"
                placeholder="empleado@perfectoutfit.co"
              />
            </div>
            <div>
              <label className={labelCls}>Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputCls}
                data-testid="user-password"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className={labelCls}>Rol</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputCls}
              >
                <option value="employee">Empleado</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {formError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className={btnSecondaryCls}>
                Cancelar
              </button>
              <button type="submit" disabled={saving} className={btnPrimaryCls} data-testid="user-save">
                {saving ? 'Guardando…' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
