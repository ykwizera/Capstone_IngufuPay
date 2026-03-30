import { useState, useEffect } from "react"
import { X, Send, MapPin, User, FileText, ChevronRight, Zap } from "lucide-react"
import api from "../api/axios"
import "./RequestMeterModal.css"

const REASONS = [
  { value: "new_connection", label: "New Connection" },
  { value: "replacement",    label: "Replacement" },
  { value: "additional",     label: "Additional Meter" },
  { value: "other",          label: "Other" },
]

const CATEGORIES = [
  { value: "residential",     label: "Residential (Household)",                 rate: "89–369 FRW/kWh (tiered)" },
  { value: "non_residential", label: "Non-Residential",                          rate: "355–376 FRW/kWh" },
  { value: "health",          label: "Health Facility",                          rate: "214 FRW/kWh" },
  { value: "school",          label: "School / Higher Learning Institution",     rate: "214 FRW/kWh" },
  { value: "hotel_small",     label: "Hotel (< 660,000 kWh/yr)",                rate: "239 FRW/kWh" },
  { value: "hotel_large",     label: "Hotel (>= 660,000 kWh/yr)",               rate: "175 FRW/kWh" },
  { value: "commercial",      label: "Commercial / Data Centre",                 rate: "175 FRW/kWh" },
  { value: "water_pumping",   label: "Water Pumping Station",                    rate: "133 FRW/kWh" },
  { value: "water_treatment", label: "Water Treatment Plant",                    rate: "133 FRW/kWh" },
  { value: "telecom",         label: "Telecom Tower",                            rate: "289 FRW/kWh" },
  { value: "industry_small",  label: "Industry - Small (5,000-100,000 kWh/yr)", rate: "175 FRW/kWh" },
  { value: "industry_medium", label: "Industry - Medium (100,000-1M kWh/yr)",   rate: "133 FRW/kWh" },
  { value: "industry_large",  label: "Industry - Large (>=1,000,000 kWh/yr)",   rate: "110 FRW/kWh" },
]

export default function RequestMeterModal({ onClose, onSubmitted }) {
  const [step, setStep]     = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [sectors, setSectors]     = useState([])
  const [cells, setCells]         = useState([])

  const [form, setForm] = useState({
    full_name:      "",
    id_number:      "",
    meter_name:     "",
    category:       "residential",
    reason:         "new_connection",
    reason_details: "",
    province:       "",
    district:       "",
    sector:         "",
    cell:           "",
    village:        "",
  })

  useEffect(() => {
    api.get("/locations/").then(res => setProvinces(res.data.provinces || []))
  }, [])

  useEffect(() => {
    if (!form.province) { setDistricts([]); return }
    api.get(`/locations/?province=${encodeURIComponent(form.province)}`)
      .then(res => setDistricts(res.data.districts || []))
    setForm(f => ({ ...f, district: "", sector: "", cell: "", village: "" }))
    setSectors([]); setCells([])
  }, [form.province])

  useEffect(() => {
    if (!form.district || !form.province) { setSectors([]); return }
    api.get(`/locations/?province=${encodeURIComponent(form.province)}&district=${encodeURIComponent(form.district)}`)
      .then(res => setSectors(res.data.sectors || []))
    setForm(f => ({ ...f, sector: "", cell: "", village: "" }))
    setCells([])
  }, [form.district])

  useEffect(() => {
    if (!form.sector || !form.district || !form.province) { setCells([]); return }
    api.get(`/locations/?province=${encodeURIComponent(form.province)}&district=${encodeURIComponent(form.district)}&sector=${encodeURIComponent(form.sector)}`)
      .then(res => setCells(res.data.cells || []))
    setForm(f => ({ ...f, cell: "", village: "" }))
  }, [form.sector])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const selectedCategory = CATEGORIES.find(c => c.value === form.category)

  const validateStep1 = () => {
    if (!form.full_name.trim())  return "Full name is required."
    if (!form.id_number.trim())  return "ID number is required."
    if (!form.meter_name.trim()) return "Please give your meter a name."
    return ""
  }

  const validateStep2 = () => {
    if (!form.province)       return "Please select a province."
    if (!form.district)       return "Please select a district."
    if (!form.sector)         return "Please select a sector."
    if (!form.cell)           return "Please select a cell."
    if (!form.village.trim()) return "Please enter your village."
    return ""
  }

  const handleNext = () => {
    const err = validateStep1()
    if (err) { setError(err); return }
    setError(""); setStep(2)
  }

  const handleSubmit = async () => {
    const err = validateStep2()
    if (err) { setError(err); return }
    setError(""); setSaving(true)
    try {
      await api.post("/meter-requests/", form)
      setStep(3)
      if (onSubmitted) onSubmitted()
    } catch (e) {
      const msg = e.response?.data
      setError(typeof msg === "object" ? Object.values(msg).flat()[0] : "Failed to submit request.")
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal rm-modal">

        <div className="modal-header">
          <div className="rm-header-content">
            <div className="rm-header-icon">
              {step === 1 ? <User size={16} /> : step === 2 ? <MapPin size={16} /> : <span>✓</span>}
            </div>
            <div>
              <div className="modal-title">
                {step === 3 ? "Request Submitted" : "Request a Meter"}
              </div>
              <div className="rm-step-label">
                {step === 1 && "Step 1 of 2 — Personal Information"}
                {step === 2 && "Step 2 of 2 — Installation Location"}
                {step === 3 && "Your request is under review"}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>

        {step < 3 && (
          <div className="rm-progress-wrap">
            <div className="rm-progress-track">
              <div className="rm-progress-fill" style={{ width: step === 1 ? "50%" : "100%" }} />
            </div>
            <div className="rm-steps-row">
              <div className={`rm-step-dot ${step >= 1 ? "done" : ""}`}>1</div>
              <div className="rm-step-line" />
              <div className={`rm-step-dot ${step >= 2 ? "done" : ""}`}>2</div>
            </div>
          </div>
        )}

        {error && (
          <div className="rm-error">
            <span className="rm-error-dot" /> {error}
          </div>
        )}

        {step === 1 && (
          <div className="rm-body">
            <div className="rm-section-label"><User size={13} /> Personal Details</div>

            <div className="form-row">
              <div className="fg">
                <label>Full Name <span className="rm-req">*</span></label>
                <input placeholder="As on your national ID" value={form.full_name}
                  onChange={e => set("full_name", e.target.value)} />
              </div>
              <div className="fg">
                <label>National ID Number <span className="rm-req">*</span></label>
                <input placeholder="e.g. 1199080012345678" value={form.id_number}
                  onChange={e => set("id_number", e.target.value)} />
              </div>
            </div>

            <div className="fg rm-field">
              <label>Meter Name <span className="rm-req">*</span></label>
              <input placeholder="e.g. Home, Shop, Office, Bedroom" value={form.meter_name}
                onChange={e => set("meter_name", e.target.value)} />
            </div>

            <div className="fg rm-field">
              <label>Customer Category <span className="rm-req">*</span></label>
              <select value={form.category} onChange={e => set("category", e.target.value)}>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {selectedCategory && (
              <div className="rm-rate-preview">
                <Zap size={13} style={{ flexShrink: 0, color: "var(--warning)" }} />
                <div>
                  <span>REG tariff: <strong>{selectedCategory.rate}</strong></span>
                  {form.category === "residential" && (
                    <div className="rm-rate-tiers">
                      <span>Tier 1: 0–20 kWh @ 89 FRW</span>
                      <span>Tier 2: 21–50 kWh @ 310 FRW</span>
                      <span>Tier 3: &gt;50 kWh @ 369 FRW</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="fg rm-field">
              <label>Reason for Request <span className="rm-req">*</span></label>
              <select value={form.reason} onChange={e => set("reason", e.target.value)}>
                {REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="fg rm-field">
              <label>Additional Details <span className="rm-optional">(optional)</span></label>
              <textarea placeholder="Any extra information..." value={form.reason_details}
                onChange={e => set("reason_details", e.target.value)} rows={2} />
            </div>

            <div className="rm-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleNext}>
                Next: Location <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rm-body">
            <div className="rm-section-label"><MapPin size={13} /> Installation Location</div>

            <div className="form-row">
              <div className="fg">
                <label>Province <span className="rm-req">*</span></label>
                <select value={form.province} onChange={e => set("province", e.target.value)}>
                  <option value="">Select province</option>
                  {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>District <span className="rm-req">*</span></label>
                <select value={form.district} onChange={e => set("district", e.target.value)}
                  disabled={!form.province}>
                  <option value="">Select district</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="fg">
                <label>Sector <span className="rm-req">*</span></label>
                <select value={form.sector} onChange={e => set("sector", e.target.value)}
                  disabled={!form.district}>
                  <option value="">Select sector</option>
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>Cell <span className="rm-req">*</span></label>
                <select value={form.cell} onChange={e => set("cell", e.target.value)}
                  disabled={!form.sector}>
                  <option value="">Select cell</option>
                  {cells.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="fg rm-field">
              <label>Village <span className="rm-req">*</span></label>
              <input placeholder="Enter your village name" value={form.village}
                onChange={e => set("village", e.target.value)} />
            </div>

            <div className="rm-note">
              <FileText size={13} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>
                Your meter number will be automatically assigned based on your location
                once the admin approves your request.
              </span>
            </div>

            <div className="rm-footer">
              <button className="btn btn-secondary" onClick={() => { setStep(1); setError("") }}>
                ← Back
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                <Send size={13} />
                {saving ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rm-body">
            <div className="rm-success">
              <div className="rm-success-icon">✓</div>
              <div className="rm-success-title">Request Submitted!</div>
              <div className="rm-success-sub">
                Your meter request has been submitted. The admin will review it
                and you will be notified by email once approved or rejected.
                This usually takes 1–3 business days.
              </div>
              <div className="rm-success-details">
                <div className="rm-success-detail-row">
                  <span>Name</span><strong>{form.full_name}</strong>
                </div>
                <div className="rm-success-detail-row">
                  <span>Meter Name</span><strong>{form.meter_name}</strong>
                </div>
                <div className="rm-success-detail-row">
                  <span>Category</span><strong>{selectedCategory?.label}</strong>
                </div>
                <div className="rm-success-detail-row">
                  <span>Tariff rate</span><strong>{selectedCategory?.rate}</strong>
                </div>
                <div className="rm-success-detail-row">
                  <span>Location</span>
                  <strong>{form.village}, {form.cell}, {form.district}</strong>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}