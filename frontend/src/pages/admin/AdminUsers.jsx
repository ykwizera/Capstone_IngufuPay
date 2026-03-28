import { useState, useEffect } from "react"
import { RefreshCw, Search, Eye, X, ToggleLeft, ToggleRight, KeyRound } from "lucide-react"
import api from "../../api/axios"
import "./AdminDashboard.css"

export default function AdminUsers() {
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch]       = useState("")
  const [province, setProvince]   = useState("")
  const [provinces, setProvinces] = useState([])
  const [selected, setSelected]   = useState(null)
  const [detail, setDetail]       = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [msg, setMsg]             = useState("")
  const [saving, setSaving]       = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [tempPassword, setTempPassword]         = useState("")

  const fetch = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)   params.set("search", search)
      if (province) params.set("province", province)
      const res = await api.get(`/admin-panel/users/?${params}`)
      setUsers(res.data)
    } finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => {
    api.get("/locations/").then(res => setProvinces(res.data.provinces || []))
  }, [])

  useEffect(() => { fetch() }, [province]) // eslint-disable-line

  const handleSearch = e => { e.preventDefault(); fetch() }

  const openDetail = async (user) => {
    setSelected(user); setLoadingDetail(true); setMsg("")
    setTempPassword(""); setShowResetConfirm(false)
    try {
      const res = await api.get(`/admin-panel/users/${user.id}/`)
      setDetail(res.data)
    } finally { setLoadingDetail(false) }
  }

  const toggleActive = async () => {
    setSaving(true)
    try {
      const res = await api.patch(`/admin-panel/users/${detail.id}/`, {
        is_active: !detail.is_active
      })
      setDetail(d => ({ ...d, is_active: res.data.is_active }))
      setUsers(prev => prev.map(u => u.id === detail.id ? { ...u, is_active: res.data.is_active } : u))
      setMsg(res.data.is_active ? "Account activated." : "Account deactivated.")
    } catch { setMsg("Failed to update.") }
    finally { setSaving(false) }
  }

  const resetPassword = async () => {
    setSaving(true)
    try {
      const res = await api.post(`/admin-panel/users/${detail.id}/reset-password/`)
      setTempPassword(res.data.temp_password)
      setShowResetConfirm(false)
      setMsg("Password reset. Temporary password shown below.")
    } catch { setMsg("Failed to reset password.") }
    finally { setSaving(false) }
  }

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Users</div>
          <div className="page-sub">Manage all registered users</div>
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
            placeholder="Username, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "200px", maxWidth: "200px" }}
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            <Search size={13} />
          </button>
        </form>
        <div className="admin-filter-group">
          <label>Province</label>
          <select value={province} onChange={e => setProvince(e.target.value)}>
            <option value="">All</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(""); setProvince("") }}>Clear</button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Username</th><th>Email</th><th>Phone</th><th>Province</th><th>Meters</th><th>Status</th><th>Joined</th><th></th></tr></thead>
            <tbody>{Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                <td key={j}><div className="skeleton" style={{ height: "0.8rem", borderRadius: "4px" }} /></td>
              ))}</tr>
            ))}</tbody>
          </table>
        </div>
      ) : users.length === 0 ? (
        <div className="admin-empty">No users found.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Username</th><th>Email</th><th>Phone</th>
                <th>Province</th><th>Meters</th><th>Status</th><th>Joined</th><th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.55 }}>
                  <td><strong>{u.username}</strong></td>
                  <td style={{ color: "var(--text2)", fontSize: "0.75rem" }}>{u.email}</td>
                  <td style={{ color: "var(--text2)", fontSize: "0.75rem" }}>{u.phone_number || "—"}</td>
                  <td style={{ color: "var(--text2)" }}>{u.province || "—"}</td>
                  <td className="mono">{u.meter_count}</td>
                  <td>
                    <span className={`badge ${u.is_active ? "badge-active" : "badge-low"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ color: "var(--text3)", fontSize: "0.75rem" }}>
                    {u.date_joined?.substring(0, 10)}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-xs" onClick={() => openDetail(u)}>
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
          <div className="modal" style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <span className="modal-title">{selected.username}</span>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={14} /></button>
            </div>

            {msg && (
              <div className={`profile-${msg.includes("Failed") || msg.includes("failed") ? "error" : "success"}`}
                style={{ marginBottom: "0.85rem" }}>
                {msg}
              </div>
            )}

            {tempPassword && (
              <div className="info-box" style={{ marginBottom: "0.85rem", fontFamily: "monospace" }}>
                Temp password: <strong>{tempPassword}</strong>
              </div>
            )}

            {loadingDetail ? (
              <div style={{ padding: "1rem 0" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: "0.8rem", borderRadius: "4px", marginBottom: "0.65rem" }} />
                ))}
              </div>
            ) : detail && (
              <>
                {[
                  ["Email",      detail.email],
                  ["Phone",      detail.phone_number || "—"],
                  ["Province",   detail.province || "—"],
                  ["District",   detail.district || "—"],
                  ["Sector",     detail.sector || "—"],
                  ["Joined",     detail.date_joined?.substring(0, 10)],
                  ["Status",     detail.is_active ? "Active" : "Inactive"],
                ].map(([label, val]) => (
                  <div key={label} className="admin-detail-row">
                    <span>{label}</span><strong>{val}</strong>
                  </div>
                ))}

                {detail.meters?.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <div className="admin-section-title">Meters ({detail.meters.length})</div>
                    {detail.meters.map(m => (
                      <div key={m.id} className="admin-detail-row">
                        <span className="mono" style={{ fontSize: "0.75rem" }}>{m.meter_number}</span>
                        <strong>{m.balance} kWh
                          <span className={`badge ${m.status === "active" ? "badge-active" : "badge-disabled"}`}
                            style={{ marginLeft: "0.5rem" }}>
                            {m.status}
                          </span>
                        </strong>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.65rem", marginTop: "1.25rem" }}>
                  <button
                    className={`btn btn-sm ${detail.is_active ? "btn-danger" : "btn-success"}`}
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={toggleActive}
                    disabled={saving}
                  >
                    {detail.is_active
                      ? <><ToggleLeft size={14} /> Deactivate</>
                      : <><ToggleRight size={14} /> Activate</>
                    }
                  </button>
                  {!showResetConfirm ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, justifyContent: "center" }}
                      onClick={() => setShowResetConfirm(true)}
                    >
                      <KeyRound size={14} /> Reset Password
                    </button>
                  ) : (
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ flex: 1, justifyContent: "center" }}
                      onClick={resetPassword}
                      disabled={saving}
                    >
                      <KeyRound size={14} /> {saving ? "Resetting..." : "Confirm Reset"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}