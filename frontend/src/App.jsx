import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "./context/ThemeContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./components/Layout"

import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Register from "./pages/Register"
import VerifyEmail from "./pages/VerifyEmail"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import Dashboard from "./pages/Dashboard"
import Meters from "./pages/Meters"
import MeterDetail from "./pages/MeterDetail"
import BuyToken from "./pages/BuyToken"
import Transactions from "./pages/Transactions"
import Notifications from "./pages/Notifications"
import Profile from "./pages/Profile"
import Support from "./pages/Support"
import AdminProtectedRoute from "./components/AdminProtectedRoute"
import AdminLayout from "./components/AdminLayout"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminRequests from "./pages/admin/AdminRequests"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminMeters from "./pages/admin/AdminMeters"
import AdminTransactions from "./pages/admin/AdminTransactions"
import AdminSettings from "./pages/admin/AdminSettings"

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/"                element={<Landing />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/verify-email"    element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* Protected user routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/meters"        element={<Meters />} />
            <Route path="/meters/:id"    element={<MeterDetail />} />
            <Route path="/buy-token"     element={<BuyToken />} />
            <Route path="/transactions"  element={<Transactions />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile"       element={<Profile />} />
            <Route path="/support"       element={<Support />} />
          </Route>

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index                element={<Navigate to="/admin/dashboard" />} />
            <Route path="dashboard"     element={<AdminDashboard />} />
            <Route path="requests"      element={<AdminRequests />} />
            <Route path="users"         element={<AdminUsers />} />
            <Route path="meters"        element={<AdminMeters />} />
            <Route path="transactions"  element={<AdminTransactions />} />
            <Route path="settings"      element={<AdminSettings />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App