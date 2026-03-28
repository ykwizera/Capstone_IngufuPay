import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Clock, RefreshCw, Eye, X } from "lucide-react"
import api from "../../api/axios"
import "./AdminDashboard.css"

const STATUS_CLASS = { pending: "badge-pending", approved: "badge-active", rejected: "badge-low" }
const STATUS_ICON  = { pending: <Clock size={11} />, approved: <CheckCircle size={11} />, rejected: <XCircle size={11} /> }

export default function AdminRequests() {
  const [requests, setRequests]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatus] = useState("")
  const [selected, setSelected]   = useState(null)
  const [action, setAction]       = useState("")   // "approve" | "reject"
  const [reason, setReason]       = useState("")
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState("")

  const fetch = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true)
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ""
      const res = await api.get(`/admin-panel/meter-requests/${params}`)
      setRequests(res.data)
    } finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetch() }, [statusFilter]) // eslint-disable-line

  const handleReview = async () => {
    if (action === "reject" && !reason.trim()) return
    setSaving(true)
    try {
      const body = action === "approve"
        ? { action: "approve" }
        : { action: "reject", reason }
      await api.post(`/admin-panel/meter-requests/${selected.id}/review/`, body)
      setMsg(action === "approve" ? `Meter approved! Number assigned.` : "Request rejected.")
      setSelected(null); setAction(""); setReason("")
      fetch(true)
    } catch (e) {
      setMsg(e.response?.data?.detail || "Action failed.")
    } finally { setSaving(false) }
  }

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Meter Requests</div>
          <div className="page-sub">Review and approve user meter applications</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => fetch(true)} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? "spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {msg && (
        <div className={`profile-${msg.includes("failed") || msg.includes("Failed") ? "error" : "success"}`}
          style={{ marginBottom: "1rem" }}>
          {msg}
        </div>
      )}

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-filter-group">
          <label>Status</label>
          <select value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setStatus("")}>Clear</button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Applicant</th><th>Location</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>{Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                <td key={j}><div className="skeleton" style={{ height: "0.8rem", borderRadius: "4px" }} /></td>
              ))}</tr>
            ))}</tbody>
          </table>
        </div>
      ) : requests.length === 0 ? (
        <div className="admin-empty">No meter requests found.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Applicant</th><th>User</th><th>Location</th>
                <th>Reason</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.full_name}</strong></td>
                  <td style={{ color: "var(--text2)" }}>{r.user}</td>
                  <td style={{ fontSize: "0.75rem", color: "var(--text2)" }}>
                    {r.sector}, {r.district}, {r.province}
                  </td>
                  <td style={{ textTransform: "capitalize", color: "var(--text2)" }}>
                    {r.reason.replace("_", " ")}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[r.status]}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      {STATUS_ICON[r.status]} {r.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--text3)", fontSize: "0.75rem" }}>
                    {r.created_at?.substring(0, 10)}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-xs" onClick={() => { setSelected(r); setAction(""); setMsg("") }}>
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
          <div className="modal" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <span className="modal-title">Meter Request — {selected.full_name}</span>
              <button className="modal-close" onClick={() => { setSelected(null); setAction("") }}><X size={14} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                ["Applicant",  selected.full_name],
                ["Username",   selected.user],
                ["Email",      selected.user_email],
                ["ID Number",  selected.id_number],
                ["Reason",     selected.reason.replace("_", " ")],
                ["Province",   selected.province],
                ["District",   selected.district],
                ["Sector",     selected.sector],
                ["Cell",       selected.cell],
                ["Village",    selected.village],
                ["Status",     selected.status],
                ["Submitted",  selected.created_at?.substring(0, 10)],
                ...(selected.meter_number ? [["Meter Number", selected.meter_number]] : []),
                ...(selected.rejection_reason ? [["Rejection Reason", selected.rejection_reason]] : []),
              ].map(([label, val]) => (
                <div key={label} className="admin-detail-row">
                  <span>{label}</span>
                  <strong style={{ textTransform: "capitalize" }}>{val}</strong>
                </div>
              ))}
            </div>

            {selected.reason_details && (
              <div className="info-box" style={{ marginTop: "0.85rem", fontSize: "0.78rem" }}>
                <strong>Additional details:</strong> {selected.reason_details}
              </div>
            )}

            {selected.status === "pending" && (
              <div style={{ marginTop: "1.25rem" }}>
                {!action ? (
                  <div style={{ display: "flex", gap: "0.65rem" }}>
                    <button className="btn btn-success" style={{ flex: 1, justifyContent: "center" }}
                      onClick={() => setAction("approve")}>
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }}
                      onClick={() => setAction("reject")}>
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                ) : action === "approve" ? (
                  <div>
                    <div className="info-box" style={{ marginBottom: "0.85rem" }}>
                      A meter number will be automatically assigned based on the province.
                      The user will be notified by email.
                    </div>
                    <div style={{ display: "flex", gap: "0.65rem" }}>
                      <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}
                        onClick={() => setAction("")}>Cancel</button>
                      <button className="btn btn-success" style={{ flex: 1, justifyContent: "center" }}
                        onClick={handleReview} disabled={saving}>
                        <CheckCircle size={14} />
                        {saving ? "Approving..." : "Confirm Approve"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="fg" style={{ marginBottom: "0.75rem" }}>
                      <label>Rejection Reason *</label>
                      <textarea
                        rows={3}
                        placeholder="Explain why this request is being rejected..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.65rem" }}>
                      <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}
                        onClick={() => setAction("")}>Cancel</button>
                      <button className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }}
                        onClick={handleReview} disabled={saving || !reason.trim()}>
                        <XCircle size={14} />
                        {saving ? "Rejecting..." : "Confirm Reject"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}