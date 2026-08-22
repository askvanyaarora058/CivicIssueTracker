// Central API utility for talking to the existing Express/Postgres backend.
// Every request goes through here so headers, error handling and JSON
// parsing stay consistent across the app. No mock data — every function
// hits a real endpoint from the backend spec.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Thrown for any non-2xx response. Carries the HTTP status so callers
// (and the AuthContext) can special-case 401 / 403.
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function getToken() {
  try {
    return localStorage.getItem('cit_token')
  } catch {
    return null
  }
}

async function request(path, { method = 'GET', body, auth = false, headers = {} } = {}) {
  const finalHeaders = { ...headers }
  let finalBody = body

  if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json'
    finalBody = JSON.stringify(body)
  }

  if (auth) {
    const token = getToken()
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: finalBody,
    })
  } catch (networkErr) {
    throw new ApiError(
      'Could not reach the server. Check that the backend is running at ' + BASE_URL,
      0,
      null
    )
  }

  let data = null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null)
  }

  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) ||
      defaultMessageForStatus(response.status)
    throw new ApiError(message, response.status, data)
  }

  return data
}

function defaultMessageForStatus(status) {
  switch (status) {
    case 400:
      return 'That request was not valid. Check the form and try again.'
    case 401:
      return 'Your session has expired. Please log in again.'
    case 403:
      return "You don't have permission to do that."
    case 404:
      return 'The requested item could not be found.'
    case 500:
      return 'Something went wrong on the server. Please try again shortly.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

/* ---------------- Auth ---------------- */

export function registerUser({ name, email, password }) {
  return request('/api/auth/register', {
    method: 'POST',
    body: { name, email, password },
  })
}

export function loginUser({ email, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

/* ---------------- Issues ---------------- */

export function getIssues(params = {}) {
  const query = new URLSearchParams()
  if (params.status && params.status !== 'All') query.set('status', params.status)
  if (params.category && params.category !== 'All') query.set('category', params.category)
  if (params.search) query.set('search', params.search)
  const qs = query.toString()
  return request(`/api/issues${qs ? `?${qs}` : ''}`)
}

export function getIssueById(id) {
  return request(`/api/issues/${id}`)
}

export function createIssue(issue) {
  return request('/api/issues', {
    method: 'POST',
    body: issue,
    auth: true,
  })
}

export function updateIssue(id, { status, admin_comment }) {
  return request(`/api/issues/${id}`, {
    method: 'PUT',
    body: { status, admin_comment },
    auth: true,
  })
}

export function deleteIssue(id) {
  return request(`/api/issues/${id}`, {
    method: 'DELETE',
    auth: true,
  })
}

/* ---------------- Health ---------------- */

export function checkHealth() {
  return request('/api/health')
}
