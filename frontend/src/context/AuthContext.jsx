import { createContext, useContext, useState, useCallback } from 'react'
import { loginUser, registerUser } from '../services/api.js'
import { saveSession, clearSession, loadToken, loadUser } from '../utils/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => loadToken())
  const [user, setUser] = useState(() => loadUser())

  const login = useCallback(async (email, password) => {
    const data = await loginUser({ email, password })
    // Backend returns { token, user }
    saveSession(data.token, data.user)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    return registerUser({ name, email, password })
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setToken(null)
    setUser(null)
  }, [])

  // Called by pages when an API call comes back 401, so the whole app
  // agrees the session is gone and the user is sent back to /login.
  const handleSessionExpired = useCallback(() => {
    clearSession()
    setToken(null)
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'admin'
  const isAuthenticated = Boolean(token)

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated, isAdmin, login, register, logout, handleSessionExpired }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
