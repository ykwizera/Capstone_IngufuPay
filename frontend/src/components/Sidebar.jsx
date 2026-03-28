import { useNavigate, useLocation } from "react-router-dom"
import {
  LayoutDashboard, Zap, ShoppingCart, ClipboardList,
  Bell, User, MessageCircle, LogOut, ChevronLeft, ChevronRight,
  ShieldCheck
} from "lucide-react"
import "./Sidebar.css"

const NAV_ITEMS = [
  {
    group: "Main",
    items: [
      { path: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
      { path: "/meters",       label: "Meters",       icon: Zap },
      { path: "/buy-token",    label: "Buy Token",    icon: ShoppingCart },
      { path: "/transactions", label: "Transactions", icon: ClipboardList },
    ]
  },
  {
    group: "Account",
    items: [
      { path: "/notifications", label: "Notifications", icon: Bell, badge: true },
      { path: "/profile",       label: "Profile",       icon: User },
      { path: "/support",       label: "Support",       icon: MessageCircle },
    ]
  },
]

export default function Sidebar({ collapsed, onToggle, unreadCount = 0 }) {
  const navigate = useNavigate()
  const location = useLocation()
  const role     = localStorage.getItem("role")
  const isAdmin  = role === "admin" || role === "staff"

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
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>

      {/* Header */}
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">IP</div>
          <span className="brand-name">IngufuPay</span>
        </div>
        <button className="toggle-btn" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(group => (
          <div key={group.group}>
            <div className="nav-section">{group.group}</div>
            {group.items.map(item => {
              const Icon     = item.icon
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/dashboard" && location.pathname.startsWith(item.path))

              return (
                <button
                  key={item.path}
                  className={`nav-btn${isActive ? " active" : ""}`}
                  onClick={() => navigate(item.path)}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="nav-icon"><Icon size={17} /></span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && unreadCount > 0 && (
                    <span className="nav-badge">{unreadCount}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}

        {/* Admin Panel link — only visible to admin users */}
        {isAdmin && (
          <div>
            <div className="nav-section">Admin</div>
            <button
              className={`nav-btn${location.pathname.startsWith("/admin") ? " active" : ""}`}
              onClick={() => navigate("/admin/dashboard")}
              title={collapsed ? "Admin Panel" : undefined}
            >
              <span className="nav-icon"><ShieldCheck size={17} /></span>
              <span className="nav-label">Admin Panel</span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout} title={collapsed ? "Logout" : undefined}>
          <span className="nav-icon"><LogOut size={17} /></span>
          <span className="logout-label">Logout</span>
        </button>
      </div>

    </aside>
  )
}