import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LayoutGrid, List, Plus, RefreshCw, WifiOff, Clock, CheckCircle, XCircle } from "lucide-react"
import api from "../api/axios"
import MeterCard from "../components/MeterCard"
import RequestMeterModal from "../components/RequestMeterModal"
import "./Meters.css"

const STATUS_ICON = {
  pending:  <Clock size={13} />,
  approved: <CheckCircle size={13} />,
  rejected: <XCircle size={13} />,
}
const STATUS_CLASS = {
  pending:  "badge-pending",
  approved: "badge-active",
  rejected: "badge-low",
}

export default function Meters() {
  const navigate = useNavigate()
  const [meters, setMeters]         = useState([])
  const [requests, setRequests]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]           = useState(null)
  const [view, setView]             = useState("cards")
  const [showModal, setShowModal]   = useState(false)

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [mRes, rRes] = await Promise.all([
        api.get("/meters/"),
        api.get("/meter-requests/"),
      ])
      setMeters(mRes.data.results ?? mRes.data)
      // Only keep pending and rejected — approved are hidden permanently
      const all = rRes.data.results ?? rRes.data
      setRequests(all.filter(r => r.status !== "approved"))
    } catch (err) {
      if (err.response?.status === 401) navigate("/login")
      else setError("Failed to load meters. Check your connection and try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, []) // eslint-disable-line

  const handleDisable = async (id) => {
    try {
      await api.patch(`/meters/${id}/`, { status: "disabled" })
      setMeters(prev => prev.map(m => m.id === id ? { ...m, status: "disabled" } : m))
    } catch {
      alert("Failed to disable meter.")
    }
  }

  const handleEnable = async (id) => {
    try {
      await api.patch(`/meters/${id}/`, { status: "active" })
      setMeters(prev => prev.map(m => m.id === id ? { ...m, status: "active" } : m))
    } catch {
      alert("Failed to enable meter.")
    }
  }

  const handleRemoveRequest = async (id, isPending) => {
    const msg = isPending
      ? "Cancel this meter request?"
      : "Dismiss this rejected request?"
    if (!window.confirm(msg)) return
    try {
      await api.delete(`/meter-requests/${id}/`)
      setRequests(prev => prev.filter(r => r.id !== id))
    } catch {
      alert("Failed to remove request.")
    }
  }

  const pendingRequests  = requests.filter(r => r.status === "pending")
  const rejectedRequests = requests.filter(r => r.status === "rejected")

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Meters</div>
          <div className="page-sub">
            {loading ? "Loading..." : `${meters.length} meter${meters.length !== 1 ? "s" : ""} registered`}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.65rem" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Request Meter
          </button>
        </div>
      </div>

      {error && (
        <div className="meters-error">
          <WifiOff size={15} />
          {error}
          <button className="btn btn-secondary btn-xs" onClick={() => fetchData()}>Retry</button>
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div className="meters-requests-banner">
          <Clock size={15} />
          <span>
            You have <strong>{pendingRequests.length}</strong> pending meter
            request{pendingRequests.length > 1 ? "s" : ""} awaiting admin approval.
          </span>
        </div>
      )}

      {rejectedRequests.length > 0 && (
        <div className="meters-requests-rejected">
          <XCircle size={15} />
          <span>
            <strong>{rejectedRequests.length}</strong> request
            {rejectedRequests.length > 1 ? "s were" : " was"} rejected. Check details below.
          </span>
        </div>
      )}

      {requests.length > 0 && (
        <div className="meters-requests-section">
          <div className="meters-requests-title">Meter Requests</div>
          <div className="meters-requests-list">
            {requests.map(r => (
              <div key={r.id} className={`meters-request-item meters-request-${r.status}`}>
                <div className="meters-request-left">
                  <span className={`badge ${STATUS_CLASS[r.status]}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", whiteSpace: "nowrap" }}>
                    {STATUS_ICON[r.status]} {r.status}
                  </span>
                  <div className="meters-request-info">
                    <div className="meters-request-location">
                      {r.village}, {r.cell}, {r.sector}, {r.district}, {r.province}
                    </div>
                    <div className="meters-request-date">
                      Submitted {r.created_at?.substring(0, 10)}
                    </div>
                    {r.rejection_reason && (
                      <div className="meters-request-rejection">
                        Reason: {r.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={() => handleRemoveRequest(r.id, r.status === "pending")}
                  style={{ color: "var(--danger)", flexShrink: 0 }}
                >
                  {r.status === "pending" ? "Cancel" : "Dismiss"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {meters.length > 0 && (
        <div className="meters-toolbar">
          <div className="view-toggle">
            <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")}>
              <LayoutGrid size={14} /> Cards
            </button>
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
              <List size={14} /> List
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="meters-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="meter-card-skeleton">
              <div className="skeleton" style={{ width: "38px", height: "38px", borderRadius: "10px" }} />
              <div className="skeleton" style={{ width: "60%", height: "0.9rem", marginTop: "0.75rem" }} />
              <div className="skeleton" style={{ width: "40%", height: "0.7rem", marginTop: "0.3rem" }} />
              <div className="skeleton" style={{ width: "50%", height: "0.7rem", marginTop: "0.3rem" }} />
              <div className="skeleton" style={{ width: "100%", height: "2rem", marginTop: "0.75rem", borderRadius: "8px" }} />
            </div>
          ))}
        </div>
      ) : meters.length === 0 ? (
        <div className="meters-empty">
          <div className="meters-empty-icon">⚡</div>
          <div className="meters-empty-title">No meters yet</div>
          <div className="meters-empty-sub">
            {pendingRequests.length > 0
              ? "Your meter request is pending approval. You will be notified once approved."
              : "Submit a meter request to get started"
            }
          </div>
          {pendingRequests.length === 0 && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Request Meter
            </button>
          )}
        </div>
      ) : view === "cards" ? (
        <div className="meters-grid">
          {meters.map(m => (
            <MeterCard key={m.id} meter={m} onDisable={handleDisable} onEnable={handleEnable} />
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Meter No.</th><th>Location</th>
                <th>Balance</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {meters.map(m => (
                <tr key={m.id} style={{ opacity: m.status === "disabled" ? 0.55 : 1 }}>
                  <td>
                    <strong>{m.name}</strong>
                    {m.is_low_balance && m.status !== "disabled" && (
                      <span className="badge badge-low" style={{ marginLeft: "0.5rem" }}>Low</span>
                    )}
                  </td>
                  <td className="mono" style={{ fontSize: "0.75rem" }}>{m.meter_number}</td>
                  <td style={{ color: "var(--text2)" }}>{m.location || "—"}</td>
                  <td className="mono" style={{ color: m.is_low_balance ? "var(--danger)" : "var(--text)" }}>
                    {m.current_balance_units} units
                  </td>
                  <td>
                    <span className={`badge ${m.status === "active" ? "badge-active" : "badge-disabled"}`}>
                      {m.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      {m.status !== "disabled" && (
                        <button className="btn btn-primary btn-xs"
                          onClick={() => navigate(`/meters/${m.id}`)}>View</button>
                      )}
                      {m.status === "disabled" ? (
                        <button className="btn btn-secondary btn-xs"
                          onClick={() => handleEnable(m.id)}>Enable</button>
                      ) : (
                        <button className="btn btn-secondary btn-xs"
                          onClick={() => handleDisable(m.id)}>Disable</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <RequestMeterModal
          onClose={() => setShowModal(false)}
          onSubmitted={() => fetchData()}
        />
      )}
    </div>
  )
}