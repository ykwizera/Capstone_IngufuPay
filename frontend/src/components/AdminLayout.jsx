import { useState } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import {
  LayoutDashboard, ClipboardList, Users, Zap,
  CreditCard, Settings, LogOut, ChevronLeft, ChevronRight,
  ShieldCheck
} from "lucide-react"
import "./AdminLayout.css"

const NAV = [
  { path: "/admin/dashboard",     label: "Overview",        icon: LayoutDashboard },
  { path: "/admin/requests",      label: "Meter Requests",  icon: ClipboardList, badge: true },
  { path: "/admin/users",         label: "Users",           icon: Users },
  { path: "/admin/meters",        label: "Meters",          icon: Zap },
  { path: "/admin/transactions",  label: "Transactions",    icon: CreditCard },
  { path: "/admin/settings",      label: "Settings",        icon: Settings },
]

export default function AdminLayout({ pendingCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleLogout = () => {
    const refresh = localStorage.getItem("refresh_token")
    if (refresh) {
      import("../api/axios").then(({ default: api }) => {
        api.post("/auth/token/blacklist/", { refresh }).catch(() => {})
      })
    }
    localStorage.clear()
    navigate("/")
  }

  return (
    <div className="app">
      {/* Admin Sidebar */}
      <aside className={`sidebar admin-sidebar${collapsed ? " collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon admin-brand-icon">
              <ShieldCheck size={16} />
            </div>
            <span className="brand-name">Admin Panel</span>
          </div>
          <button className="toggle-btn" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Management</div>
          {NAV.map(item => {
            const Icon     = item.icon
            const isActive = location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/")
            return (
              <button
                key={item.path}
                className={`nav-btn${isActive ? " active" : ""}`}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon"><Icon size={17} /></span>
                <span className="nav-label">{item.label}</span>
                {item.badge && pendingCount > 0 && (
                  <span className="nav-badge">{pendingCount}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-btn"
            style={{ color: "#94a3b8" }}
            onClick={() => navigate("/dashboard")}
            title={collapsed ? "User App" : undefined}
          >
            <span className="nav-icon"><LayoutDashboard size={17} /></span>
            <span className="nav-label">Back to App</span>
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon"><LogOut size={17} /></span>
            <span className="logout-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`main-content${collapsed ? " collapsed" : ""}`}>
        {/* Admin topbar */}
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <ShieldCheck size={15} style={{ color: "var(--primary)" }} />
            <span className="admin-topbar-title">IngufuPay Admin</span>
          </div>
          <div className="admin-topbar-right">
            <div className="admin-topbar-user">
              {localStorage.getItem("username") || "Admin"}
            </div>
          </div>
        </div>
        <Outlet context={{ pendingCount }} />
      </div>
    </div>
  )
}