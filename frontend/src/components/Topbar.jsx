import { useNavigate, useLocation } from "react-router-dom"
import { Bell, Moon, Sun } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import "./Topbar.css"

const PAGE_META = {
  "/dashboard":     { title: "Dashboard",    sub: "Overview of your account" },
}

export default function Topbar({ unreadCount = 0 }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { isDark, toggleTheme } = useTheme()

  const meta = Object.entries(PAGE_META).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + "/")
  )?.[1] || { title: "IngufuPay", sub: "" }

  const username = localStorage.getItem("username") || "user"
  const initial  = username[0].toUpperCase()

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">{meta.title}</div>
        <div className="topbar-sub">{meta.sub}</div>
      </div>

      <div className="topbar-right">
        {/* Dark mode toggle */}
        <button className="icon-btn" onClick={toggleTheme} title="Toggle dark mode">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <button className="icon-btn" onClick={() => navigate("/notifications")} title="Notifications">
          <Bell size={16} />
          {unreadCount > 0 && <span className="notif-dot" />}
        </button>

        {/* User pill */}
        <div className="user-pill" onClick={() => navigate("/profile")}>
          <div className="user-avatar" id="topbar-avatar">
            {initial}
          </div>
          <span className="uname">{username}</span>
        </div>
      </div>
    </div>
  )
}