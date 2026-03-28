// ── AdminProtectedRoute.jsx ───────────────────────────────────────────────────
// Save as: src/components/AdminProtectedRoute.jsx

import { Navigate } from "react-router-dom"

export default function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token")
  const role  = localStorage.getItem("role")

  if (!token) return <Navigate to="/login" />
  if (role !== "admin" && role !== "staff") return <Navigate to="/dashboard" />

  return children
}


// ── Updated App.jsx ───────────────────────────────────────────────────────────
// Add these imports and routes to your existing App.jsx:

/*
import AdminProtectedRoute from "./components/AdminProtectedRoute"
import AdminLayout         from "./components/AdminLayout"
import AdminDashboard      from "./pages/admin/AdminDashboard"
import AdminRequests       from "./pages/admin/AdminRequests"
import AdminUsers          from "./pages/admin/AdminUsers"
import AdminMeters         from "./pages/admin/AdminMeters"
import AdminTransactions   from "./pages/admin/AdminTransactions"
import AdminSettings       from "./pages/admin/AdminSettings"

// Add this route block inside <Routes>, after the protected user routes:

<Route
  path="/admin"
  element={
    <AdminProtectedRoute>
      <AdminLayout />
    </AdminProtectedRoute>
  }
>
  <Route index element={<Navigate to="/admin/dashboard" />} />
  <Route path="dashboard"    element={<AdminDashboard />} />
  <Route path="requests"     element={<AdminRequests />} />
  <Route path="users"        element={<AdminUsers />} />
  <Route path="meters"       element={<AdminMeters />} />
  <Route path="transactions" element={<AdminTransactions />} />
  <Route path="settings"     element={<AdminSettings />} />
</Route>
*/