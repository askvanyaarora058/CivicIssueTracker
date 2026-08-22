import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
          <span className="brand-mark">CT</span>
          Civic Tracker
        </Link>

        <nav className="nav-links">
          {!isAuthenticated && (
            <>
              <Link to="/">Home</Link>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            </>
          )}

          {isAuthenticated && !isAdmin && (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/report">Report issue</Link>
              <span style={{ color: 'var(--ink-soft)', fontSize: '0.88rem' }}>{user?.name}</span>
              <button className="link" onClick={handleLogout}>Log out</button>
            </>
          )}

          {isAuthenticated && isAdmin && (
            <>
              <Link to="/admin">Admin dashboard</Link>
              <span className="nav-tag">Admin</span>
              <span style={{ color: 'var(--ink-soft)', fontSize: '0.88rem' }}>{user?.name}</span>
              <button className="link" onClick={handleLogout}>Log out</button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
