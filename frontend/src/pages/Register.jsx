import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import api from "../api/axios"
import "./Register.css"

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: "", email: "", phone_number: "", password: "", confirm_password: ""
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirm_password) {
      return setError("Passwords do not match.")
    }
    if (form.password.length < 8) {
      return setError("Password must be at least 8 characters.")
    }
    if (!agreedToTerms) {
      return setError("You must agree to the Terms & Conditions to create an account.")
    }

    setLoading(true)
    try {
      await api.post("/auth/register/", {
        username:     form.username,
        email:        form.email,
        phone_number: form.phone_number,
        password:     form.password,
      })
      navigate("/verify-email", { state: { email: form.email } })
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === "object") {
        const first = Object.values(data).flat()[0]
        setError(typeof first === "string" ? first : "Registration failed.")
      } else {
        setError("Registration failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">IngufuPay</h1>
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Start managing your meters today</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Choose a username"
              required
            />
          </div>
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
            <label>Phone Number</label>
            <input
              type="text"
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              placeholder="+250788000000"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 8 characters"
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              placeholder="Repeat your password"
              required
            />
          </div>

          {/* Terms checkbox */}
          <div className="terms-row">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
            />
            <label htmlFor="terms">
              I have read and agree to the{" "}
              <Link to="/terms" target="_blank" rel="noopener noreferrer">
                Terms &amp; Conditions
              </Link>
            </label>
          </div>

          <button type="submit" className="auth-btn" disabled={loading || !agreedToTerms}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}