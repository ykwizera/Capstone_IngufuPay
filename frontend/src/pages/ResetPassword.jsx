import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import api from "../api/axios"
import "./PasswordReset.css"

export default function ResetPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: "", otp: "", new_password: "", confirm_password: ""
  })
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (form.new_password !== form.confirm_password) {
      return setError("Passwords do not match.")
    }
    if (form.new_password.length < 8) {
      return setError("Password must be at least 8 characters.")
    }

    setLoading(true)
    try {
      await api.post("/auth/password-reset/confirm/", {
        email:        form.email,
        otp:          form.otp,
        new_password: form.new_password,
      })
      navigate("/login")
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const first = Object.values(data).flat()[0]
        setError(typeof first === "string" ? first : "Something went wrong.")
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">IngufuPay</h1>
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">Enter the OTP sent to your email</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>OTP Code</label>
            <input
              type="text"
              name="otp"
              value={form.otp}
              onChange={handleChange}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              required
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="new_password"
              value={form.new_password}
              onChange={handleChange}
              placeholder="Min 8 characters"
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              placeholder="Repeat new password"
              required
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="auth-link">
          <Link to="/forgot-password">Request a new OTP</Link>
        </p>
        <p className="auth-link">
          <Link to="/login">Back to Sign in</Link>
        </p>
      </div>
    </div>
  )
}