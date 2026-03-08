import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Zap, CheckCircle, AlertTriangle, CreditCard,
  TrendingUp, RefreshCw, WifiOff
} from "lucide-react"
import api from "../api/axios"
import "./Dashboard.css"

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function Skeleton({ width = "100%", height = "1rem", radius = "6px" }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius }} />
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [meters, setMeters]             = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [refreshing, setRefreshing]     = useState(false)

  const username = localStorage.getItem("username") || "there"

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [mRes, tRes] = await Promise.all([
        api.get("/meters/"),
        api.get("/transactions/"),
      ])
      setMeters(mRes.data.results ?? mRes.data)
      setTransactions(tRes.data.results ?? tRes.data)
    } catch (err) {
      if (err.response?.status === 401) navigate("/login")
      else setError("Failed to load dashboard data. Check your connection and try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, []) // eslint-disable-line

  // status === "active" is the only active state
  const totalMeters  = meters.length
  const activeMeters = meters.filter(m => m.status === "active").length
  // low balance: only active meters where is_low_balance is true
  const lowBalance   = meters.filter(m => m.is_low_balance && m.status === "active")

  const now = new Date()
  const thisMonthSpent = transactions
    .filter(t => {
      const d = new Date(t.created_at)
      return (
        d.getMonth()    === now.getMonth() &&
        d.getFullYear() === now.getFullYear() &&
        t.status?.toLowerCase() === "success"
      )
    })
    .reduce((sum, t) => sum + parseFloat(t.amount_rwf ?? 0), 0)

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d     = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = MONTHS[d.getMonth()]
    const total = transactions
      .filter(t => {
        const td = new Date(t.created_at)
        return (
          td.getMonth()    === d.getMonth() &&
          td.getFullYear() === d.getFullYear() &&
          t.status?.toLowerCase() === "success"
        )
      })
      .reduce((sum, t) => sum + parseFloat(t.amount_rwf ?? 0), 0)
    return { label, total }
  })
  const maxVal = Math.max(...chartData.map(d => d.total), 1)

  const stats = [
    {
      label: "Total Meters",
      value: totalMeters,
      icon: Zap,
      iconBg: "var(--primary-light)",
      iconColor: "var(--primary)",
      hint: "Registered",
      hintColor: "var(--text3)",
    },
    {
      label: "Active Meters",
      value: activeMeters,
      icon: CheckCircle,
      iconBg: "var(--success-light)",
      iconColor: "var(--success)",
      hint: activeMeters === totalMeters ? "All running" : `${totalMeters - activeMeters} inactive`,
      hintColor: activeMeters === totalMeters ? "var(--success)" : "var(--warning)",
    },
    {
      label: "Low Balance",
      value: lowBalance.length,
      icon: AlertTriangle,
      iconBg: lowBalance.length > 0 ? "var(--danger-light)" : "var(--success-light)",
      iconColor: lowBalance.length > 0 ? "var(--danger)" : "var(--success)",
      hint: lowBalance.length > 0 ? "Needs top up" : "All good",
      hintColor: lowBalance.length > 0 ? "var(--danger)" : "var(--success)",
    },
    {
      label: "Spent This Month",
      value: `${thisMonthSpent.toLocaleString()} RWF`,
      icon: CreditCard,
      iconBg: "rgba(124,58,237,0.1)",
      iconColor: "#7c3aed",
      hint: MONTHS[now.getMonth()] + " " + now.getFullYear(),
      hintColor: "var(--text3)",
    },
  ]

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">{getGreeting()}, {username}</div>
          <div className="page-sub">Here is a summary of your electricity meters</div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? "spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="dash-error">
          <WifiOff size={15} />
          {error}
          <button className="btn btn-secondary btn-xs" onClick={() => fetchData()}>Retry</button>
        </div>
      )}

      <div className="dash-stats">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat-card">
                <Skeleton width="60%" height="0.75rem" />
                <Skeleton width="40%" height="2rem" radius="8px" />
                <Skeleton width="50%" height="0.7rem" />
              </div>
            ))
          : stats.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">{s.label}</span>
                    <div className="stat-ico" style={{ background: s.iconBg, color: s.iconColor }}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <div className="stat-val">{s.value}</div>
                  <div className="stat-hint" style={{ color: s.hintColor }}>{s.hint}</div>
                </div>
              )
            })
        }
      </div>

      <div className="dash-grid">
        <div className="chart-card card">
          <div className="chart-header">
            <div className="chart-title">
              <TrendingUp size={15} />
              Monthly Token Purchases (RWF)
            </div>
            <div className="chart-legend">Successful transactions only</div>
          </div>
          {loading ? (
            <div className="chart-skeleton">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} width="100%" height={`${40 + i * 12}%`} radius="6px 6px 0 0" />
              ))}
            </div>
          ) : (
            <div className="chart-wrap">
              {chartData.map((d, i) => {
                const pct            = Math.round((d.total / maxVal) * 100)
                const isCurrentMonth = i === chartData.length - 1
                return (
                  <div key={i} className="bar-group">
                    <div className="bar-val">
                      {d.total > 0 ? `${(d.total / 1000).toFixed(1)}k` : "—"}
                    </div>
                    <div
                      className={`bar${isCurrentMonth ? " bar-current" : ""}`}
                      style={{ height: `${Math.max(pct, 4)}%` }}
                      title={`${d.label}: ${d.total.toLocaleString()} RWF`}
                    />
                    <div className="bar-label">{d.label}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="low-bal-card card">
          <div className="lbl-header">
            <AlertTriangle size={15} />
            Low Balance Meters
          </div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <Skeleton width="90px" height="0.82rem" />
                    <Skeleton width="60px" height="0.7rem" />
                  </div>
                  <Skeleton width="70px" height="0.78rem" />
                </div>
              ))}
            </div>
          ) : lowBalance.length === 0 ? (
            <div className="lbl-empty">
              <CheckCircle size={20} />
              All meters have sufficient balance
            </div>
          ) : (
            lowBalance.map(m => (
              <div key={m.id} className="lbl-item">
                <div>
                  <div className="lbl-name">{m.name}</div>
                  <div className="lbl-num mono">{m.meter_number}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="lbl-bal mono">{m.current_balance_units} units</div>
                  <button
                    className="btn btn-primary btn-xs"
                    style={{ marginTop: "0.35rem" }}
                    onClick={() => navigate("/buy-token")}
                  >
                    Top up
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}