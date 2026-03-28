import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Users, Zap, DollarSign, ClipboardList, AlertTriangle, RefreshCw } from "lucide-react"
import api from "../../api/axios"
import "./AdminDashboard.css"

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetch = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await api.get("/admin-panel/dashboard/")
      setData(res.data)
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403)
        navigate("/login")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetch() }, []) // eslint-disable-line

  const STATS = data ? [
    {
      label: "Total Users",
      value: data.total_users,
      icon: Users,
      color: "blue",
      action: () => navigate("/admin/users"),
    },
    {
      label: "Total Meters",
      value: data.total_meters,
      icon: Zap,
      color: "cyan",
      action: () => navigate("/admin/meters"),
    },
    {
      label: "Total Revenue",
      value: `${Number(data.total_revenue).toLocaleString()} RWF`,
      icon: DollarSign,
      color: "green",
      action: () => navigate("/admin/transactions"),
    },
    {
      label: "Pending Requests",
      value: data.pending_requests,
      icon: ClipboardList,
      color: data.pending_requests > 0 ? "orange" : "gray",
      action: () => navigate("/admin/requests"),
    },
    {
      label: "Low Balance Meters",
      value: data.low_balance_meters,
      icon: AlertTriangle,
      color: data.low_balance_meters > 0 ? "red" : "gray",
      action: () => navigate("/admin/meters"),
    },
  ] : []

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Overview</div>
          <div className="page-sub">System-wide statistics</div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => fetch(true)}
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? "spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="admin-stats-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="admin-stat-card">
              <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "10px" }} />
              <div className="skeleton" style={{ width: "60%", height: "1.5rem", marginTop: "0.75rem" }} />
              <div className="skeleton" style={{ width: "40%", height: "0.8rem", marginTop: "0.4rem" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-stats-grid">
          {STATS.map((s, i) => {
            const Icon = s.icon
            return (
              <div
                key={i}
                className={`admin-stat-card admin-stat-${s.color}`}
                onClick={s.action}
              >
                <div className={`admin-stat-icon admin-stat-icon-${s.color}`}>
                  <Icon size={20} />
                </div>
                <div className="admin-stat-value">{s.value}</div>
                <div className="admin-stat-label">{s.label}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recent transactions */}
      <div style={{ marginTop: "1.5rem" }}>
        <div className="admin-section-title">Recent Transactions</div>
        {loading ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th><th>Meter</th><th>Amount</th>
                  <th>Method</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}>
                        <div className="skeleton" style={{ height: "0.8rem", borderRadius: "4px" }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : data?.recent_transactions?.length === 0 ? (
          <div className="admin-empty">No transactions yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th><th>Meter</th><th>Amount</th>
                  <th>Method</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_transactions?.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.user}</strong></td>
                    <td className="mono" style={{ fontSize: "0.75rem" }}>{t.meter}</td>
                    <td className="mono">{Number(t.amount_rwf).toLocaleString()} RWF</td>
                    <td style={{ textTransform: "capitalize", color: "var(--text2)" }}>{t.method}</td>
                    <td>
                      <span className={`badge ${t.status === "success" ? "badge-active" : "badge-low"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ color: "var(--text3)", fontSize: "0.75rem" }}>
                      {t.created_at?.substring(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}