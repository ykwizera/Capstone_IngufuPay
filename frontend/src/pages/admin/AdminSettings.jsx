import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import api from "../../api/axios"
import "./AdminDashboard.css"

export default function AdminSettings() {
  const [settings, setSettings] = useState({ unit_price_rwf: "", low_balance_threshold: "" })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState("")

  useEffect(() => {
    api.get("/admin-panel/settings/")
      .then(res => setSettings(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true); setMsg("")
    try {
      await api.patch("/admin-panel/settings/", settings)
      setMsg("Settings saved successfully.")
    } catch { setMsg("Failed to save settings.") }
    finally { setSaving(false) }
  }

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }))

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">System-wide configuration</div>
        </div>
      </div>

      <div style={{ maxWidth: "480px" }}>
        {msg && (
          <div className={`profile-${msg.includes("Failed") ? "error" : "success"}`}
            style={{ marginBottom: "1.25rem" }}>
            {msg}
          </div>
        )}

        <div className="form-card" style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "1.5rem", boxShadow: "var(--shadow)"
        }}>
          <div className="admin-section-title" style={{ marginBottom: "1.25rem" }}>
            Pricing
          </div>

          {loading ? (
            <>
              <div className="skeleton" style={{ height: "2.5rem", borderRadius: "8px", marginBottom: "1rem" }} />
              <div className="skeleton" style={{ height: "2.5rem", borderRadius: "8px" }} />
            </>
          ) : (
            <>
              <div className="fg" style={{ marginBottom: "1rem" }}>
                <label>Unit Price (RWF per kWh)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 200"
                  value={settings.unit_price_rwf}
                  onChange={e => set("unit_price_rwf", e.target.value)}
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text3)", marginTop: "0.25rem" }}>
                  How much 1 kWh costs in RWF. Used when calculating units for purchases.
                </span>
              </div>

              <div className="fg" style={{ marginBottom: "1.25rem" }}>
                <label>Low Balance Threshold (kWh)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 5"
                  value={settings.low_balance_threshold}
                  onChange={e => set("low_balance_threshold", e.target.value)}
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text3)", marginTop: "0.25rem" }}>
                  Send low balance alerts when a meter falls below this value.
                </span>
              </div>

              <div className="info-box" style={{ marginBottom: "1.25rem" }}>
                At <strong>{settings.unit_price_rwf || "—"} RWF/kWh</strong>,
                a purchase of 1,000 RWF gives{" "}
                <strong>
                  {settings.unit_price_rwf
                    ? (1000 / parseFloat(settings.unit_price_rwf)).toFixed(3)
                    : "—"
                  } kWh
                </strong>
              </div>

              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={14} />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}