import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import api from "../api/axios"
import "./Login.css"

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await api.post("/auth/token/", form)
      localStorage.setItem("access_token", res.data.access)
      localStorage.setItem("refresh_token", res.data.refresh)
      localStorage.setItem("username", form.username)

      // Fetch user profile to get role
      const meRes = await api.get("/auth/me/", {
        headers: { Authorization: `Bearer ${res.data.access}` }
      })
      localStorage.setItem("role", meRes.data.role)

      // Redirect based on role
      if (meRes.data.role === "admin" || meRes.data.is_staff) {
        navigate("/admin/dashboard")
      } else {
        navigate("/dashboard")
      }
    } catch (err) {
      setError("Invalid username or password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">IngufuPay</h1>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to your account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        <p className="auth-link">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
      </div>
    </div>
  )
}