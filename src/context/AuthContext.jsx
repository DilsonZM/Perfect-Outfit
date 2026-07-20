import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AuthContext } from './auth-context'

const STORAGE_KEY = 'po_user'

/**
 * Autenticación básica de DESARROLLO contra la tabla `users`.
 * ⚠️ Antes de producción: reemplazar por Supabase Auth.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  async function login(email, password) {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .eq('email', email.trim().toLowerCase())
      .eq('password', password)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    setUser(data)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return data
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = {
    user,
    login,
    logout,
    isAdmin: user?.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
