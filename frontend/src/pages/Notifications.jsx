import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useOutletContext } from "react-router-dom"
import { Bell, RefreshCw, WifiOff, CheckCheck, RotateCcw } from "lucide-react"
import api from "../api/axios"
import "./Notifications.css"

export default function Notifications() {
  const navigate = useNavigate()
  const { setUnreadCount } = useOutletContext()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [refreshing, setRefreshing]       = useState(false)
  const [error, setError]                 = useState(null)

  const fetchNotifications = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res  = await api.get("/notifications/")
      const data = res.data.results ?? res.data
      setNotifications(data)
      setUnreadCount(res.data.unread_count ?? data.filter(n => !n.is_read).length)
    } catch (err) {
      if (err.response?.status === 401) navigate("/login")
      else setError("Failed to load notifications.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigate, setUnreadCount])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/`, { is_read: true })
      setNotifications(prev => {
        const updated = prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        setUnreadCount(updated.filter(n => !n.is_read).length)
        return updated
      })
    } catch {
      alert("Failed to mark as read.")
    }
  }

  const markUnread = async (id) => {
    try {
      await api.patch(`/notifications/${id}/`, { is_read: false })
      setNotifications(prev => {
        const updated = prev.map(n => n.id === id ? { ...n, is_read: false } : n)
        setUnreadCount(updated.filter(n => !n.is_read).length)
        return updated
      })
    } catch {
      alert("Failed to mark as unread.")
    }
  }

  const markAllRead = async () => {
    try {
      await api.post("/notifications/mark-all-read/")
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      await Promise.all(
        notifications.filter(n => !n.is_read).map(n => markRead(n.id))
      )
    }
  }

  const markAllUnread = async () => {
    try {
      await Promise.all(
        notifications.filter(n => n.is_read).map(n =>
          api.patch(`/notifications/${n.id}/`, { is_read: false })
        )
      )
      setNotifications(prev => prev.map(n => ({ ...n, is_read: false })))
      setUnreadCount(notifications.length)
    } catch {
      alert("Failed to mark all as unread.")
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const getNotifStyle = (notif) => {
    if (notif.is_read) return {}
    if (notif.notification_type === "low_balance")
      return { borderLeft: "3px solid var(--warning)", background: "var(--warning-light)" }
    return { borderLeft: "3px solid var(--primary)", background: "var(--primary-light)" }
  }

  const getDotColor = (notif) => {
    if (notif.is_read) return "var(--border2)"
    if (notif.notification_type === "low_balance") return "var(--warning)"
    return "var(--primary)"
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ""
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (diff < 60)    return "Just now"
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Notifications</div>
          <div className="page-sub">
            {loading ? "Loading..." : unreadCount > 0
              ? `${unreadCount} unread` : "All caught up"}
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => fetchNotifications(true)}
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? "spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="notif-error">
          <WifiOff size={15} /> {error}
          <button className="btn btn-secondary btn-xs" onClick={() => fetchNotifications()}>
            Retry
          </button>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="notif-bar">
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark all read
          </button>
          <button className="btn btn-secondary btn-sm" onClick={markAllUnread}>
            <RotateCcw size={14} /> Mark all unread
          </button>
        </div>
      )}

      {loading ? (
        <div className="notif-list">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="notif-item">
              <div className="skeleton" style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, marginTop: "4px" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div className="skeleton" style={{ width: "40%", height: "0.82rem" }} />
                <div className="skeleton" style={{ width: "80%", height: "0.75rem" }} />
                <div className="skeleton" style={{ width: "20%", height: "0.68rem" }} />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="notif-empty">
          <Bell size={32} />
          <div className="notif-empty-title">No notifications yet</div>
          <div className="notif-empty-sub">
            You will be notified about purchases, low balance alerts, and account updates
          </div>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`notif-item${n.is_read ? "" : " unread"}`}
              style={getNotifStyle(n)}
            >
              <div className="notif-dot" style={{ background: getDotColor(n) }} />
              <div className="notif-body">
                <div className="notif-title">{n.title}</div>
                <div className="notif-msg">{n.message}</div>
                <div className="notif-time">{formatTime(n.created_at)}</div>
              </div>
              <div className="notif-actions">
                {n.is_read ? (
                  <button className="btn btn-secondary btn-xs" onClick={() => markUnread(n.id)}>
                    Mark unread
                  </button>
                ) : (
                  <button className="btn btn-secondary btn-xs" onClick={() => markRead(n.id)}>
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}