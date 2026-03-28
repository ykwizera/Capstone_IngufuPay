import { useState, useEffect } from "react"
import { RefreshCw, Download } from "lucide-react"
import api from "../../api/axios"
import "./AdminDashboard.css"

export default function AdminTransactions() {
  const [txns, setTxns]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [provinces, setProvinces] = useState([])
  const [filters, setFilters]     = useState({
    status: "", method: "", from_date: "", to_date: "", province: "", district: ""
  })
  const [districts, setDistricts] = useState([])

  const setF = (key, val) => setFilters(f => ({ ...f, [key]: val }))

  const fetch = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await api.get(`/admin-panel/transactions/?${params}`)
      setTxns(res.data)
    } finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => {
    api.get("/locations/").then(res => setProvinces(res.data.provinces || []))
  }, [])

  useEffect(() => {
    if (!filters.province) { setDistricts([]); setF("district", ""); return }
    api.get(`/locations/?province=${encodeURIComponent(filters.province)}`)
      .then(res => setDistricts(res.data.districts || []))
    setF("district", "")
  }, [filters.province])

  useEffect(() => { fetch() }, []) // eslint-disable-line

  const downloadCSV = () => {
    const headers = ["User", "Meter", "Province", "District", "Amount (RWF)", "Method", "Status", "Token", "Units", "Date"]
    const rows = txns.map(t => [
      t.user, t.meter, t.province, t.district,
      t.amount_rwf, t.method, t.status, t.token, t.units,
      t.created_at?.substring(0, 10)
    ])
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = "ingufupay-all-transactions.csv"
    a.click()
  }

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Transactions</div>
          <div className="page-sub">All transactions system-wide</div>
        </div>
        <div style={{ display: "flex", gap: "0.65rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => fetch(true)} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={downloadCSV}
            disabled={txns.length === 0}>
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-filter-group">
          <label>Status</label>
          <select value={filters.status} onChange={e => setF("status", e.target.value)}>
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="admin-filter-group">
          <label>Method</label>
          <select value={filters.method} onChange={e => setF("method", e.target.value)}>
            <option value="">All</option>
            <option value="momo">Mobile Money</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
          </select>
        </div>
        <div className="admin-filter-group">
          <label>From</label>
          <input type="date" value={filters.from_date}
            onChange={e => setF("from_date", e.target.value)} />
        </div>
        <div className="admin-filter-group">
          <label>To</label>
          <input type="date" value={filters.to_date}
            onChange={e => setF("to_date", e.target.value)} />
        </div>
        <div className="admin-filter-group">
          <label>Province</label>
          <select value={filters.province} onChange={e => setF("province", e.target.value)}>
            <option value="">All</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="admin-filter-group">
          <label>District</label>
          <select value={filters.district} onChange={e => setF("district", e.target.value)}
            disabled={!filters.province}>
            <option value="">All</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => fetch()}>Apply</button>
        <button className="btn btn-secondary btn-sm"
          onClick={() => { setFilters({ status: "", method: "", from_date: "", to_date: "", province: "", district: "" }); fetch() }}>
          Clear
        </button>
      </div>

      <div style={{ fontSize: "0.75rem", color: "var(--text3)", marginBottom: "0.75rem" }}>
        {loading ? "Loading..." : `${txns.length} transaction${txns.length !== 1 ? "s" : ""}`}
      </div>

      {/* Table */}
      {loading ? (
        <div className="table-wrap"><table>
          <thead><tr><th>User</th><th>Meter</th><th>Province</th><th>Amount</th><th>Method</th><th>Status</th><th>Units</th><th>Date</th></tr></thead>
          <tbody>{Array.from({ length: 6 }).map((_, i) => (
            <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
              <td key={j}><div className="skeleton" style={{ height: "0.8rem", borderRadius: "4px" }} /></td>
            ))}</tr>
          ))}</tbody>
        </table></div>
      ) : txns.length === 0 ? (
        <div className="admin-empty">No transactions found.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th><th>Meter</th><th>Province</th>
                <th>Amount</th><th>Method</th><th>Status</th><th>Units</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {txns.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.user}</strong></td>
                  <td className="mono" style={{ fontSize: "0.75rem" }}>{t.meter}</td>
                  <td style={{ color: "var(--text2)", fontSize: "0.75rem" }}>{t.province}</td>
                  <td className="mono">{Number(t.amount_rwf).toLocaleString()} RWF</td>
                  <td style={{ textTransform: "capitalize", color: "var(--text2)" }}>{t.method}</td>
                  <td>
                    <span className={`badge ${t.status === "success" ? "badge-active" : "badge-low"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: "0.75rem" }}>{t.units !== "—" ? `${t.units} kWh` : "—"}</td>
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
  )
}