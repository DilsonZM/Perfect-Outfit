import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Scissors } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { inputCls, labelCls } from '../lib/styles'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const logged = await login(email, password)
      if (!logged) {
        setError('Correo o contraseña incorrectos.')
      } else {
        navigate(location.state?.from?.pathname ?? '/', { replace: true })
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
            <Scissors className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Perfect Outfit</h1>
          <p className="text-sm text-slate-500">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className={labelCls}>
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@perfectoutfit.co"
              data-testid="login-email"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelCls}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              data-testid="login-password"
              className={inputCls}
            />
          </div>

          {error && (
            <p data-testid="login-error" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit"
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-500">
          <p className="font-medium">Credenciales de prueba</p>
          <p className="mt-1">Admin: admin@perfectoutfit.co / admin123</p>
          <p>Empleado: empleada@perfectoutfit.co / empleado123</p>
        </div>
      </div>
    </div>
  )
}
