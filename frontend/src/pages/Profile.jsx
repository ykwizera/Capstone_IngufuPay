import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  User, MapPin, Lock, Palette, Trash2,
  Camera, Save, WifiOff
} from "lucide-react"
import api from "../api/axios"
import { useTheme } from "../context/ThemeContext"
import DeleteAccountModal from "../components/DeleteAccountModal"
import "./Profile.css"

const SECTIONS = [
  { key: "account",    label: "Account Info",    icon: User },
  { key: "address",    label: "Address",          icon: MapPin },
  { key: "security",   label: "Security",         icon: Lock },
  { key: "appearance", label: "Appearance",       icon: Palette },
  { key: "danger",     label: "Delete Account",   icon: Trash2, danger: true },
]

const PROVINCES = ["Kigali City", "Northern", "Southern", "Eastern", "Western"]
const DISTRICTS = {
  "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],
  "Northern":    ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
  "Southern":    ["Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango"],
  "Eastern":     ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana"],
  "Western":     ["Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rutsiro", "Rusizi"],
}

export default function Profile() {
  const navigate    = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const avatarRef   = useRef()

  const [section, setSection]       = useState("account")
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)
  const [success, setSuccess]       = useState("")
  const [showDelete, setShowDelete] = useState(false)
  const [avatarSrc, setAvatarSrc]   = useState(null)

  const [account, setAccount] = useState({
    username: "", email: "", phone_number: "", role: ""
  })
  const [address, setAddress] = useState({
    province: "", district: "", sector: "", cell: "", village: "", details: ""
  })
  const [security, setSecurity] = useState({
    current_password: "", new_password: "", confirm_password: ""
  })

  useEffect(() => {
    api.get("/auth/me/")
      .then(res => {
        const d = res.data
        setAccount({
          username:     d.username     ?? "",
          email:        d.email        ?? "",
          phone_number: d.phone_number ?? "",
          role:         d.role         ?? "customer",
        })
        setAddress({
          province: d.province ?? "",
          district: d.district ?? "",
          sector:   d.sector   ?? "",
          cell:     d.cell     ?? "",
          village:  d.village  ?? "",
          details:  d.address_details ?? "",
        })
        if (d.avatar) setAvatarSrc(d.avatar)
      })
      .catch(err => {
        if (err.response?.status === 401) navigate("/login")
        else setError("Failed to load profile.")
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const showSuccess = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const saveAccount = async () => {
    setSaving(true); setError(null)
    try {
      const res = await api.patch("/auth/me/", {
        username:     account.username,
        email:        account.email,
        phone_number: account.phone_number,
      })
      localStorage.setItem("username", res.data.username)
      showSuccess("Account info saved successfully")
    } catch (err) {
      const msg = err.response?.data
      setError(typeof msg === "object"
        ? Object.values(msg).flat()[0]
        : "Failed to save account info."
      )
    } finally { setSaving(false) }
  }

  const saveAddress = async () => {
    setSaving(true); setError(null)
    try {
      await api.patch("/auth/me/", {
        province:        address.province,
        district:        address.district,
        sector:          address.sector,
        cell:            address.cell,
        village:         address.village,
        address_details: address.details,
      })
      showSuccess("Address saved successfully")
    } catch {
      setError("Failed to save address.")
    } finally { setSaving(false) }
  }

  const changePassword = async () => {
    if (!security.current_password || !security.new_password) {
      return setError("Please fill in all password fields.")
    }
    if (security.new_password !== security.confirm_password) {
      return setError("New passwords do not match.")
    }
    setSaving(true); setError(null)
    try {
      await api.post("/auth/change-password/", {
        current_password: security.current_password,
        new_password:     security.new_password,
      })
      setSecurity({ current_password: "", new_password: "", confirm_password: "" })
      showSuccess("Password changed successfully")
    } catch (err) {
      const msg = err.response?.data
      setError(typeof msg === "object"
        ? Object.values(msg).flat()[0]
        : "Failed to change password."
      )
    } finally { setSaving(false) }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatarSrc(ev.target.result)
    reader.readAsDataURL(file)
    try {
      const formData = new FormData()
      formData.append("avatar", file)
      await api.patch("/auth/me/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
    } catch {
      // Avatar preview still shows even if upload fails
    }
  }

  const initial = account.username?.[0]?.toUpperCase() || "U"

  if (loading) return (
    <div className="page">
      <div className="profile-skeleton">
        <div className="skeleton" style={{ width: "80px", height: "80px", borderRadius: "50%" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
          <div className="skeleton" style={{ width: "40%", height: "1rem" }} />
          <div className="skeleton" style={{ width: "60%", height: "0.8rem" }} />
          <div className="skeleton" style={{ width: "30%", height: "0.8rem" }} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Profile</div>
          <div className="page-sub">Manage your account settings</div>
        </div>
      </div>

      {success && <div className="profile-success">{success}</div>}
      {error && (
        <div className="profile-error">
          <WifiOff size={15} /> {error}
        </div>
      )}

      {/* Mobile tabs */}
      <div className="p-tabs">
        {SECTIONS.map(s => {
          const Icon = s.icon
          return (
            <button
              key={s.key}
              className={`p-tab-btn${section === s.key ? " active" : ""}${s.danger ? " danger" : ""}`}
              onClick={() => { setSection(s.key); setError(null); setSuccess("") }}
            >
              <Icon size={13} /> {s.label}
            </button>
          )
        })}
      </div>

      <div className="profile-layout">

        {/* Sidebar card */}
        <div className="profile-sidebar-card">
          <div className="avatar-wrap">
            <div className="avatar-img">
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" />
                : initial
              }
            </div>
            <label className="avatar-upload-btn" title="Upload photo">
              <Camera size={13} />
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarUpload}
              />
            </label>
          </div>

          <div className="p-name">{account.username}</div>
          <div className="p-role">{account.role}</div>
          <div className="p-email">{account.email}</div>
          {account.phone_number && (
            <div className="p-phone">{account.phone_number}</div>
          )}

          <div className="p-menu">
            {SECTIONS.map(s => {
              const Icon = s.icon
              return (
                <button
                  key={s.key}
                  className={`p-menu-btn${section === s.key ? " active" : ""}${s.danger ? " danger" : ""}`}
                  onClick={() => { setSection(s.key); setError(null); setSuccess("") }}
                >
                  <Icon size={15} /> {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content area */}
        <div className="profile-content">

          {section === "account" && (
            <div className="form-card">
              <div className="fc-title">Account Information</div>
              <div className="form-row">
                <div className="fg">
                  <label>Username</label>
                  <input
                    value={account.username}
                    onChange={e => setAccount({ ...account, username: e.target.value })}
                  />
                </div>
                <div className="fg">
                  <label>Email</label>
                  <input
                    type="email"
                    value={account.email}
                    onChange={e => setAccount({ ...account, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="fg">
                  <label>Phone Number</label>
                  <input
                    value={account.phone_number}
                    onChange={e => setAccount({ ...account, phone_number: e.target.value })}
                    placeholder="+250788000000"
                  />
                </div>
                <div className="fg">
                  <label>Role</label>
                  <input value={account.role} readOnly />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={saveAccount} disabled={saving}>
                  <Save size={14} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {section === "address" && (
            <div className="form-card">
              <div className="fc-title">Address Information</div>
              <div className="form-row three">
                <div className="fg">
                  <label>Province</label>
                  <select
                    value={address.province}
                    onChange={e => setAddress({ ...address, province: e.target.value, district: "" })}
                  >
                    <option value="">Select province</option>
                    {PROVINCES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="fg">
                  <label>District</label>
                  <select
                    value={address.district}
                    onChange={e => setAddress({ ...address, district: e.target.value })}
                    disabled={!address.province}
                  >
                    <option value="">Select district</option>
                    {(DISTRICTS[address.province] ?? []).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="fg">
                  <label>Sector</label>
                  <input
                    placeholder="e.g. Remera"
                    value={address.sector}
                    onChange={e => setAddress({ ...address, sector: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="fg">
                  <label>Cell</label>
                  <input
                    placeholder="e.g. Nyabisindu"
                    value={address.cell}
                    onChange={e => setAddress({ ...address, cell: e.target.value })}
                  />
                </div>
                <div className="fg">
                  <label>Village</label>
                  <input
                    placeholder="e.g. Agahe"
                    value={address.village}
                    onChange={e => setAddress({ ...address, village: e.target.value })}
                  />
                </div>
              </div>
              <div className="fg" style={{ marginBottom: "0.85rem" }}>
                <label>Additional Details</label>
                <textarea
                  placeholder="Street name, house number, or landmarks..."
                  value={address.details}
                  onChange={e => setAddress({ ...address, details: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={saveAddress} disabled={saving}>
                  <Save size={14} />
                  {saving ? "Saving..." : "Save Address"}
                </button>
              </div>
            </div>
          )}

          {section === "security" && (
            <div className="form-card">
              <div className="fc-title">Change Password</div>
              <div className="fg" style={{ marginBottom: "0.85rem" }}>
                <label>Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={security.current_password}
                  onChange={e => setSecurity({ ...security, current_password: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="fg">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={security.new_password}
                    onChange={e => setSecurity({ ...security, new_password: e.target.value })}
                  />
                </div>
                <div className="fg">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={security.confirm_password}
                    onChange={e => setSecurity({ ...security, confirm_password: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={changePassword} disabled={saving}>
                  <Lock size={14} />
                  {saving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          )}

          {section === "appearance" && (
            <div className="form-card">
              <div className="fc-title">Appearance</div>
              <div className="dark-toggle">
                <div>
                  <div className="dt-label">Dark Mode</div>
                  <div className="dt-sub">Switch between light and dark interface</div>
                </div>
                <label className="dt-switch">
                  <input type="checkbox" checked={isDark} onChange={toggleTheme} />
                  <span className="dt-slider" />
                </label>
              </div>
            </div>
          )}

          {section === "danger" && (
            <div className="form-card danger-card">
              <div className="fc-title danger-title">Danger Zone</div>
              <p className="danger-desc">
                Deleting your account is permanent. All your meters, transactions,
                and data will be removed and cannot be recovered.
              </p>
              <button className="btn btn-danger" onClick={() => setShowDelete(true)}>
                <Trash2 size={14} /> Delete My Account
              </button>
            </div>
          )}

        </div>
      </div>

      {showDelete && (
        <DeleteAccountModal onClose={() => setShowDelete(false)} />
      )}
    </div>
  )
}