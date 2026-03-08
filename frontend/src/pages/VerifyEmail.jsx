import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import api from "../api/axios"
import "./PasswordReset.css"

export default function VerifyEmail() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const [form, setForm] = useState({
    email: location.state?.email || "",
    otp:   "",
  })
  const [error, setError]       = useState("")
  const [message, setMessage]   = useState("")
  const [loading, setLoading]   = useState(false)
  const [resending, setResending] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.post("/auth/verify-email/", form)
      navigate("/login", { state: { verified: true } })
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === "object") {
        const first = Object.values(data).flat()[0]
        setError(typeof first === "string" ? first : "Verification failed.")
      } else {
        setError("Verification failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!form.email) return setError("Please enter your email first.")
    setResending(true)
    setError("")
    setMessage("")
    try {
      await api.post("/auth/resend-verification/", { email: form.email })
      setMessage("A new OTP has been sent to your email.")
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === "object") {
        const first = Object.values(data).flat()[0]
        setError(typeof first === "string" ? first : "Failed to resend OTP.")
      } else {
        setError("Failed to resend OTP. Please try again.")
      }
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">IngufuPay</h1>
        <h2 className="auth-title">Verify Your Email</h2>
        <p className="auth-subtitle">
          Enter the 6-digit code sent to your email
        </p>

        {error   && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

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
            <label>Verification Code</label>
            <input
              type="text"
              name="otp"
              value={form.otp}
              onChange={handleChange}
              placeholder="Enter 6-digit code"
              maxLength={6}
              required
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <p className="auth-link">
          Didn't receive the code?{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: "none", border: "none",
              color: "#2563eb", fontWeight: 500,
              cursor: "pointer", fontSize: "0.9rem",
              padding: 0,
            }}
          >
            {resending ? "Sending..." : "Resend OTP"}
          </button>
        </p>
        <p className="auth-link">
          <Link to="/login">Back to Sign in</Link>
        </p>
      </div>
    </div>
  )
}