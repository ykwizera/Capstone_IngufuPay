import { useState } from "react"
import { Mail, Phone, MessageCircle, Clock, Send, CheckCircle } from "lucide-react"
import api from "../api/axios"
import "./Support.css"

const CATEGORIES = [
  "Token not working",
  "Payment issue",
  "Meter problem",
  "Account issue",
  "Low balance alert",
  "Other",
]

const CONTACT_INFO = [
  {
    icon: Mail,
    label: "Email Support",
    value: "y.kwizera@alustudent.com",
    sub: "We reply within 2 hours",
  },
  {
    icon: Phone,
    label: "Phone (Mon–Fri 8am–6pm)",
    value: "+250 784 494 644",
    sub: "For urgent issues",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+250 784 494 644",
    sub: "Quick responses",
  },
  {
    icon: Clock,
    label: "Average Response Time",
    value: "Under 2 hours",
    sub: "During business hours",
  },
]

export default function Support() {
  const [form, setForm] = useState({
    subject: "", category: "", message: ""
  })
  const [loading, setLoading]     = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]         = useState("")

  const handleSubmit = async () => {
    if (!form.subject || !form.category || !form.message) {
      return setError("Please fill in all required fields.")
    }
    setLoading(true)
    setError("")
    try {
      await api.post("/support/", form)
      setSubmitted(true)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === "object") {
        const first = Object.values(data).flat()[0]
        setError(typeof first === "string" ? first : "Failed to submit request.")
      } else {
        setError("Failed to submit request. Please try again or contact us directly.")
      }
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setForm({ subject: "", category: "", message: "" })
    setSubmitted(false)
    setError("")
  }

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Contact Support</div>
          <div className="page-sub">We are here to help with any issues</div>
        </div>
      </div>

      <div className="support-grid">

        {/* Left — form */}
        <div className="form-card">
          <div className="fc-title">Submit a Support Request</div>

          {submitted ? (
            <div className="support-success">
              <div className="support-success-icon">
                <CheckCircle size={28} />
              </div>
              <div className="support-success-title">Request Submitted!</div>
              <div className="support-success-sub">
                We have received your request and will get back to you within 2 hours.
                Check your email for a confirmation.
              </div>
              <button className="btn btn-secondary" onClick={reset}>
                Submit Another Request
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div className="form-row">
                <div className="fg">
                  <label>Subject *</label>
                  <input
                    placeholder="Briefly describe your issue"
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
                <div className="fg">
                  <label>Category *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="fg">
                <label>Description *</label>
                <textarea
                  style={{ minHeight: "130px" }}
                  placeholder="Describe your issue in detail. Include meter numbers, transaction IDs, or any error messages you saw..."
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                />
              </div>

              {error && (
                <div style={{ color: "var(--danger)", fontSize: "0.8rem" }}>
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  <Send size={14} />
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={reset}
                  disabled={loading}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — contact info */}
        <div>
          <div className="support-info-title">Get in touch directly</div>
          <div className="support-info-list">
            {CONTACT_INFO.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="support-info-item">
                  <div className="support-info-icon">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="support-info-label">{item.label}</div>
                    <div className="support-info-val">{item.value}</div>
                    <div className="support-info-sub">{item.sub}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="support-note">
            For urgent issues such as tokens not working on your meter,
            please call us directly rather than submitting a form.
          </div>
        </div>

      </div>
    </div>
  )
}