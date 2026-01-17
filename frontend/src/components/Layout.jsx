import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Layout({ children, token, setToken }) {
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    setToken && setToken(null)
    navigate('/login')
  }

  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/inventory', label: 'Inventory' },
    { to: '/transactions', label: 'Transactions' },
    { to: '/projects', label: 'Projects' },
    { to: '/allocations', label: 'Allocations' },
    { to: '/borrowings', label: 'Borrowings' },
    { to: '/competitions', label: 'Competitions' },
  ]

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r hidden md:block">
        <div className="h-16 flex items-center px-6 font-semibold text-lg">Lab Inventory</div>
        <nav className="px-2 py-4 space-y-1">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end
              className={({ isActive }) =>
                `block px-4 py-2 rounded-md text-sm ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-4 py-4">
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded-md text-sm text-red-600 hover:bg-gray-100">Logout</button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="h-16 border-b bg-white flex items-center px-4 md:px-8">
          <button className="md:hidden mr-3" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">☰</button>
          <div className="font-semibold">Lab Inventory Management</div>
        </header>
        <main className="p-4 md:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  )
}
