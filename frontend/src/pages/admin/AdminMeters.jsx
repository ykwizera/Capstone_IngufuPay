import { useState, useEffect } from "react"
import { RefreshCw, Search, Eye, X, Copy } from "lucide-react"
import api from "../../api/axios"
import "./AdminDashboard.css"

export default function AdminMeters() {
  const [meters, setMeters]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch]       = useState("")
  const [province, setProvince]   = useState("")
  const [statusF, setStatusF]     = useState("")
  const [provinces, setProvinces] = useState([])
  const [selected, setSelected]   = useState(null)
  const [msg, setMsg]             = useState("")
  const [saving, setSaving]       = useState(false)
  const [newBalance, setNewBalance] = useState("")
  const [deviceToken, setDeviceToken] = useState("")

  const fetch = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)   params.set("search", search)
      if (province) params.set("province", province)
      if (statusF)  params.set("status", statusF)
      const res = await api.get(`/admin-panel/meters/?${params}`)
      setMeters(res.data)
    } finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => {
    api.get("/locations/").then(res => setProvinces(res.data.provinces || []))
  }, [])

  useEffect(() => { fetch() }, [province, statusF]) // eslint-disable-line

  const handleSearch = e => { e.preventDefault(); fetch() }

  const adjustBalance = async () => {
    if (!newBalance) return
    setSaving(true)
    try {
      await api.patch(`/admin-panel/meters/${selected.id}/`, {
        current_balance_units: parseFloat(newBalance)
      })
      setMeters(prev => prev.map(m => m.id === selected.id
        ? { ...m, balance: newBalance } : m))
      setSelected(s => ({ ...s, balance: newBalance }))
      setMsg("Balance updated.")
      setNewBalance("")
    } catch { setMsg("Failed to update balance.") }
    finally { setSaving(false) }
  }

  const generateToken = async () => {
    setSaving(true)
    try {
      const res = await api.post(`/admin-panel/meters/${selected.id}/generate-token/`)
      setDeviceToken(res.data.device_token)
      setMsg("Device token generated.")
    } catch { setMsg("Failed to generate token.") }
    finally { setSaving(false) }
  }

  const copyToken = () => {
    navigator.clipboard.writeText(deviceToken)
    setMsg("Token copied to clipboard.")
  }

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Meters</div>
          <div className="page-sub">All registered meters across all users</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => fetch(true)} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? "spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <form onSubmit={handleSearch} className="admin-filter-group">
          <label>Search</label>
          <input
            placeholder="Meter number, owner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "180px", maxWidth: "180px" }}
          />
          <button type="submit" className="btn btn-secondary btn-sm"><Search size={13} /></button>
        </form>
        <div className="admin-filter-group">
          <label>Province</label>
          <select value={province} onChange={e => setProvince(e.target.value)}>
            <option value="">All</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="admin-filter-group">
          <label>Status</label>
          <select value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <button className="btn btn-secondary btn-sm"
          onClick={() => { setSearch(""); setProvince(""); setStatusF("") }}>Clear</button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="table-wrap"><table>
          <thead><tr><th>Meter No.</th><th>Owner</th><th>Province</th><th>District</th><th>Balance</th><th>Status</th><th>Last Seen</th><th></th></tr></thead>
          <tbody>{Array.from({ length: 6 }).map((_, i) => (
            <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
              <td key={j}><div className="skeleton" style={{ height: "0.8rem", borderRadius: "4px" }} /></td>
            ))}</tr>
          ))}</tbody>
        </table></div>
      ) : meters.length === 0 ? (
        <div className="admin-empty">No meters found.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Meter No.</th><th>Owner</th><th>Province</th><th>District</th>
                <th>Balance</th><th>Status</th><th>Last Seen</th><th></th>
              </tr>
            </thead>
            <tbody>
              {meters.map(m => (
                <tr key={m.id} style={{ opacity: m.status === "disabled" ? 0.55 : 1 }}>
                  <td className="mono" style={{ fontSize: "0.75rem" }}>{m.meter_number}</td>
                  <td><strong>{m.owner}</strong></td>
                  <td style={{ color: "var(--text2)" }}>{m.province || "—"}</td>
                  <td style={{ color: "var(--text2)" }}>{m.district || "—"}</td>
                  <td className="mono"
                    style={{ color: m.is_low ? "var(--danger)" : "var(--text)" }}>
                    {m.balance} kWh
                    {m.is_low && <span className="badge badge-low" style={{ marginLeft: "0.4rem" }}>Low</span>}
                  </td>
                  <td>
                    <span className={`badge ${m.status === "active" ? "badge-active" : "badge-disabled"}`}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--text3)", fontSize: "0.72rem" }}>
                    {m.last_seen ? m.last_seen.substring(0, 10) : "Never"}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-xs"
                      onClick={() => { setSelected(m); setMsg(""); setDeviceToken(""); setNewBalance("") }}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <span className="modal-title">{selected.meter_number}</span>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={14} /></button>
            </div>

            {msg && (
              <div className={`profile-${msg.includes("Failed") || msg.includes("failed") ? "error" : "success"}`}
                style={{ marginBottom: "0.85rem" }}>
                {msg}
              </div>
            )}

            {[
              ["Owner",    selected.owner],
              ["Province", selected.province || "—"],
              ["District", selected.district || "—"],
              ["Sector",   selected.sector || "—"],
              ["Balance",  `${selected.balance} kWh`],
              ["Status",   selected.status],
            ].map(([label, val]) => (
              <div key={label} className="admin-detail-row">
                <span>{label}</span><strong>{val}</strong>
              </div>
            ))}

            {/* Adjust balance */}
            <div style={{ marginTop: "1.25rem" }}>
              <div className="admin-section-title">Adjust Balance</div>
              <div style={{ display: "flex", gap: "0.65rem" }}>
                <div className="fg" style={{ flex: 1 }}>
                  <input
                    type="number"
                    placeholder="New balance in kWh"
                    value={newBalance}
                    onChange={e => setNewBalance(e.target.value)}
                    step="0.001"
                    min="0"
                  />
                </div>
                <button className="btn btn-primary btn-sm" onClick={adjustBalance}
                  disabled={saving || !newBalance}>
                  Update
                </button>
              </div>
            </div>

            {/* Generate device token */}
            <div style={{ marginTop: "1.25rem" }}>
              <div className="admin-section-title">ESP32 Device Token</div>
              {deviceToken && (
                <div className="info-box" style={{ marginBottom: "0.75rem", fontFamily: "monospace", fontSize: "0.72rem", wordBreak: "break-all" }}>
                  {deviceToken}
                </div>
              )}
              <div style={{ display: "flex", gap: "0.65rem" }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}
                  onClick={generateToken} disabled={saving}>
                  Generate Token
                </button>
                {deviceToken && (
                  <button className="btn btn-secondary btn-sm" onClick={copyToken}>
                    <Copy size={13} /> Copy
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}