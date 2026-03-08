import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, MapPin, AlertTriangle } from "lucide-react"
import api from "../api/axios"
import TokenCard from "../components/TokenCard"
import "./MeterDetail.css"

export default function MeterDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [meter, setMeter]           = useState(null)
  const [transactions, setTxs]      = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [amount, setAmount]         = useState("")
  const [method, setMethod]         = useState("momo")
  const [purchased, setPurchased]   = useState(null)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState("")

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true); setError(null)
      try {
        const [mRes, tRes] = await Promise.all([
          api.get(`/meters/${id}/`),
          api.get(`/transactions/?meter=${id}`),
        ])
        setMeter(mRes.data)
        setTxs(tRes.data.results ?? tRes.data)
      } catch (err) {
        if (err.response?.status === 401) navigate("/login")
        else setError("Failed to load meter details.")
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [id, navigate])

  const handlePurchase = async () => {
    if (!amount || parseFloat(amount) < 100) return
    setPurchasing(true)
    setPurchaseError("")
    try {
      const { data } = await api.post("/transactions/purchase-token/", {
        meter:      parseInt(id),
        amount_rwf: parseFloat(amount),
        method:     method,
      })
      setPurchased({
        token:  data.token,
        units:  data.units,
        amount: amount,
      })
      // Update meter balance in UI
      setMeter(prev => ({ ...prev, current_balance_units: data.new_balance_units }))
    } catch (err) {
      const msg = err.response?.data
      setPurchaseError(
        typeof msg === "object"
          ? Object.values(msg).flat()[0]
          : "Purchase failed. Please try again."
      )
    } finally { setPurchasing(false) }
  }

  if (loading) return (
    <div className="page">
      <div className="detail-skeleton">
        <div className="skeleton" style={{ width: "120px", height: "1.25rem", marginBottom: "1.5rem" }} />
        <div className="detail-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card" style={{ padding: "1.5rem" }}>
              <div className="skeleton" style={{ width: "60%", height: "3rem", margin: "1rem auto" }} />
            </div>
            <div className="card" style={{ padding: "1.25rem" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ width: "100%", height: "0.8rem", marginBottom: "0.75rem" }} />
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: "1.5rem" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ width: "100%", height: "2.5rem", marginBottom: "0.75rem", borderRadius: "8px" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="page">
      <div className="detail-error">
        <AlertTriangle size={15} /> {error}
        <button className="btn btn-secondary btn-xs" onClick={() => navigate("/meters")}>
          Back to Meters
        </button>
      </div>
    </div>
  )

  if (!meter) return null

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/meters")}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <div className="page-title">{meter.name}</div>
            <div className="page-sub mono">{meter.meter_number}</div>
          </div>
        </div>
        <span className={`badge ${meter.status === "active" ? "badge-active" : "badge-disabled"}`}>
          {meter.status}
        </span>
      </div>

      <div className="detail-grid">

        {/* Left */}
        <div>
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <div className="big-bal">
              <div className="big-bal-label">Current Balance</div>
              <div className="big-bal-value mono">{meter.current_balance_units}</div>
              <div className="big-bal-unit">units</div>
            </div>
            {meter.is_low_balance && (
              <div className="detail-low-alert">
                <AlertTriangle size={13} /> Low balance — top up now
              </div>
            )}
          </div>

          <div className="card" style={{ padding: "1.25rem" }}>
            <div className="detail-section-title">Meter Info</div>
            <div className="detail-row">
              <span className="detail-key">Number</span>
              <span className="detail-val mono" style={{ fontSize: "0.78rem" }}>{meter.meter_number}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Location</span>
              <span className="detail-val" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                {meter.location ? <><MapPin size={12} />{meter.location}</> : "—"}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Status</span>
              <span className="detail-val">{meter.status}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Low alert at</span>
              <span className="detail-val">{meter.low_balance_threshold} units</span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div>
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <div className="detail-section-title">Purchase Token</div>
            {purchased ? (
              <>
                <TokenCard
                  token={purchased.token}
                  units={purchased.units}
                  amount={purchased.amount}
                  meterName={meter.name}
                  meterNumber={meter.meter_number}
                />
                <button
                  className="btn btn-secondary"
                  style={{ width: "100%", marginTop: "0.5rem" }}
                  onClick={() => { setPurchased(null); setAmount(""); setPurchaseError("") }}
                >
                  Purchase Again
                </button>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div className="fg">
                  <label>Amount (RWF)</label>
                  <input
                    type="number"
                    placeholder="Minimum 100 RWF"
                    min="100"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
                <div className="info-box">Units will be calculated during checkout</div>
                <div className="fg">
                  <label>Payment Method</label>
                  <select value={method} onChange={e => setMethod(e.target.value)}>
                    <option value="momo">Mobile Money (MoMo)</option>
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                {purchaseError && (
                  <div style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{purchaseError}</div>
                )}
                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  disabled={!amount || parseFloat(amount) < 100 || purchasing}
                  onClick={handlePurchase}
                >
                  {purchasing ? "Processing..." : "Purchase Token"}
                </button>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: "1.25rem" }}>
            <div className="detail-section-title">Recent Purchases</div>
            {transactions.length === 0 ? (
              <div style={{ fontSize: "0.82rem", color: "var(--text3)", padding: "0.5rem 0" }}>
                No purchases yet
              </div>
            ) : (
              transactions.slice(0, 5).map(t => (
                <div key={t.id} className="tx-row">
                  <div>
                    <div className="mono" style={{ fontSize: "0.75rem", color: "var(--text2)" }}>
                      {t.token ? t.token.substring(0, 14) + "…" : "Failed"}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text3)", marginTop: "0.1rem" }}>
                      {t.created_at?.substring(0, 10)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>{t.units_purchased} units</div>
                    <span className={`badge ${t.status === "success" ? "badge-active" : "badge-low"}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}