
import {
  createContext,
  useContext,
  useState,
  useCallback
} from 'react'

import { loginUser, registerUser } from '../services/api.js'

import {
  saveSession,
  clearSession,
  loadToken,
  loadUser
} from '../utils/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => loadToken())
  const [user, setUser] = useState(() => loadUser())

  const login = useCallback(async (email, password, otp) => {
    const data = await loginUser({
      email,
      password,
      ...(otp ? { otp } : {})
    })

    // MFA is required: do not create or save a session.
    if (data.mfaRequired) {
      return {
        mfaRequired: true,
        message: data.message
      }
    }

    // Never accept a login response without a token and user.
    if (!data.token || !data.user) {
      throw new Error('Login failed: no valid session was returned.')
    }

    saveSession(data.token, data.user)

    setToken(data.token)
    setUser(data.user)

    return data.user
  }, [])

  const register = useCallback(async (details) => {
    return await registerUser(details)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setToken(null)
    setUser(null)
  }, [])

  const value = {
    token,
    user,
    login,
    register,
    logout,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
