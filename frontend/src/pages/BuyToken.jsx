import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Check, ShoppingCart, RefreshCw } from "lucide-react"
import api from "../api/axios"
import TokenCard from "../components/TokenCard"
import "./BuyToken.css"

export default function BuyToken() {
  const navigate = useNavigate()

  const [meters, setMeters]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState({})
  const [method, setMethod]         = useState("momo")
  const [tokens, setTokens]         = useState([])
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError]           = useState("")

  useEffect(() => {
    api.get("/meters/")
      .then(res => {
        const all = res.data.results ?? res.data
        setMeters(all.filter(m => m.status !== "disabled" && m.status !== "inactive"))
      })
      .catch(err => { if (err.response?.status === 401) navigate("/login") })
      .finally(() => setLoading(false))
  }, [navigate])

  const toggleMeter = (meter) => {
    setSelected(prev => {
      const next = { ...prev }
      if (next[meter.id]) delete next[meter.id]
      else next[meter.id] = {
        name:         meter.name,
        meter_number: meter.meter_number,
        amount:       "",
      }
      return next
    })
  }

  const setAmount = (id, amount) => {
    setSelected(prev => ({ ...prev, [id]: { ...prev[id], amount } }))
  }

  const validItems = Object.entries(selected).filter(
    ([, v]) => parseFloat(v.amount) >= 100
  )
  const total = validItems.reduce((sum, [, v]) => sum + parseFloat(v.amount), 0)

  const methodLabels = { momo: "Mobile Money", card: "Card", cash: "Cash" }

  const handlePurchase = async () => {
    if (!validItems.length) return
    setPurchasing(true)
    setError("")
    try {
      const results = await Promise.all(
        validItems.map(async ([id, v]) => {
          const { data } = await api.post("/transactions/purchase-token/", {
            meter:      parseInt(id),
            amount_rwf: parseFloat(v.amount),
            method:     method,
          })
          return {
            token:       data.token,
            units:       data.units,
            amount:      v.amount,
            meterName:   v.name,
            meterNumber: v.meter_number,
          }
        })
      )
      setTokens(results)
    } catch (err) {
      const msg = err.response?.data
      setError(
        typeof msg === "object"
          ? Object.values(msg).flat()[0]
          : "Purchase failed. Please try again."
      )
    } finally {
      setPurchasing(false)
    }
  }

  const reset = () => { setSelected({}); setTokens([]); setError("") }

  if (loading) return (
    <div className="page">
      <div className="bt-skeleton">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "10px" }} />
        ))}
      </div>
    </div>
  )

  if (tokens.length > 0) {
    return (
      <div className="page page-enter">
        <div className="bt-success">
          <div className="bt-success-icon"><Check size={28} /></div>
          <div className="bt-success-title">
            {tokens.length} Token{tokens.length > 1 ? "s" : ""} Generated!
          </div>
          <div className="bt-success-sub">
            Enter each token on your electricity meter device
          </div>
        </div>
        <div className="bt-tokens-list">
          {tokens.map((t, i) => (
            <TokenCard
              key={i}
              token={t.token}
              units={t.units}
              amount={t.amount}
              meterName={t.meterName}
              meterNumber={t.meterNumber}
            />
          ))}
        </div>
        <button className="btn btn-secondary" onClick={reset}>
          <RefreshCw size={14} /> Buy Another Token
        </button>
      </div>
    )
  }

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Buy Token</div>
          <div className="page-sub">Select one or more meters to purchase tokens</div>
        </div>
      </div>

      <div className="bt-layout">
        <div className="bt-steps">

          {/* Step 1 */}
          <div className="bt-card">
            <div className="bt-card-title">
              <span className="step-num">1</span> Select Meters
            </div>
            {meters.length === 0 ? (
              <div className="bt-no-meters">
                No active meters found.
                <button className="btn btn-primary btn-sm" onClick={() => navigate("/meters")}>
                  Add a Meter
                </button>
              </div>
            ) : (
              <div className="meter-sel-grid">
                {meters.map(m => {
                  const isSel = !!selected[m.id]
                  return (
                    <div
                      key={m.id}
                      className={`meter-sel-card${isSel ? " sel" : ""}${m.is_low_balance ? " sel-low" : ""}`}
                      onClick={() => toggleMeter(m)}
                    >
                      {isSel && <div className="sel-check"><Check size={11} /></div>}
                      <div className="msc-name">
                        {m.name}
                        {m.is_low_balance && (
                          <span className="badge badge-low" style={{ marginLeft: "0.4rem", fontSize: "0.58rem" }}>
                            Low
                          </span>
                        )}
                      </div>
                      <div className="msc-num mono">{m.meter_number}</div>
                      <div className="msc-bal">{m.current_balance_units} units</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Step 2 */}
          {Object.keys(selected).length > 0 && (
            <div className="bt-card">
              <div className="bt-card-title">
                <span className="step-num">2</span> Enter Amounts
              </div>
              <div className="bulk-rows">
                {Object.entries(selected).map(([id, v]) => (
                  <div key={id} className="bulk-row">
                    <div className="bulk-row-info">
                      <div className="bulk-row-name">{v.name}</div>
                      <div className="bulk-row-num mono">{v.meter_number}</div>
                    </div>
                    <input
                      type="number"
                      placeholder="Amount (RWF)"
                      min="100"
                      value={v.amount}
                      onChange={e => setAmount(id, e.target.value)}
                    />
                    <div className="bulk-units-hint">
                      {parseFloat(v.amount) >= 100
                        ? `${(parseFloat(v.amount) / 100).toFixed(3)} units`
                        : "—"
                      }
                    </div>
                  </div>
                ))}
              </div>
              <div className="info-box" style={{ marginTop: "0.75rem" }}>
                Exact units and breakdown will be confirmed before purchase
              </div>
            </div>
          )}

          {/* Step 3 */}
          {Object.keys(selected).length > 0 && (
            <div className="bt-card">
              <div className="bt-card-title">
                <span className="step-num">3</span> Payment Method
              </div>
              <div className="fg">
                <label>Pay with</label>
                <select value={method} onChange={e => setMethod(e.target.value)}>
                  <option value="momo">Mobile Money (MoMo)</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
            </div>
          )}

        </div>

        {/* Order summary */}
        <div className="summary-card">
          <div className="sum-title">Order Summary</div>
          {validItems.length === 0 ? (
            <div className="sum-empty">
              <ShoppingCart size={28} />
              <div>Select meters and enter amounts to see your order summary</div>
            </div>
          ) : (
            <>
              <div className="sum-rows">
                {validItems.map(([id, v]) => (
                  <div key={id}>
                    <div className="sum-row">
                      <span>{v.name}</span>
                      <span className="sum-row-val">
                        {(parseFloat(v.amount) / 100).toFixed(3)} units
                      </span>
                    </div>
                    <div className="sum-row sum-row-sub">
                      <span>{v.meter_number} · {methodLabels[method]}</span>
                      <span>{parseFloat(v.amount).toLocaleString()} RWF</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="sum-total">
                <span>Total</span>
                <span>{total.toLocaleString()} RWF</span>
              </div>
              {error && (
                <div style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "0.75rem" }}>
                  {error}
                </div>
              )}
              <button
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "1rem", padding: "0.875rem" }}
                disabled={purchasing}
                onClick={handlePurchase}
              >
                {purchasing
                  ? "Processing..."
                  : `Purchase ${validItems.length} Token${validItems.length > 1 ? "s" : ""}`
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}