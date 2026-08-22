// Thin wrapper around localStorage for the JWT and user object.
// Kept separate from AuthContext so any non-component code (like api.js)
// can read the token without importing React.

const TOKEN_KEY = 'cit_token'
const USER_KEY = 'cit_user'

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function loadToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function loadUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
