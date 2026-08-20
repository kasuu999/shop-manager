import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layout/MainLayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Products from "../pages/Products.jsx";
import Categories from "../pages/Categories.jsx";
import Suppliers from "../pages/Suppliers.jsx";
import Customers from "../pages/Customers.jsx";
import Purchases from "../pages/Purchases.jsx";
import Sales from "../pages/Sales.jsx";
import Stock from "../pages/Stock.jsx";
import Reports from "../pages/Reports.jsx";
import ShopSettings from "../pages/ShopSettings.jsx";

/**
 * All routes live here in one place. `/login` and `/register` are public
 * and standalone (no sidebar/header).
 *
 * Every other route is nested inside <MainLayout>, and that whole group is
 * wrapped in an OUTER <ProtectedRoute> with no `allowedRoles` — this is the
 * same token-only check as before (no token -> /login). This guarantees
 * the sidebar/header shell only ever renders for a logged-in user of any
 * role.
 *
 * ON TOP of that, each individual page is wrapped in its OWN
 * <ProtectedRoute allowedRoles={[...]}> — this is what enforces the
 * business rule of who can see what. If a staff user's role isn't in a
 * page's allowedRoles list, that inner ProtectedRoute redirects them to
 * /sales (the fallback default) BEFORE the page component ever renders,
 * even if they type the URL directly into the browser.
 *
 * "/" just redirects to "/dashboard" (owner-only anyway, so a staff user
 * landing on "/" gets bounced further to "/sales" automatically by the
 * /dashboard route's own role check).
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={["owner", "staff"]}>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Categories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Suppliers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Purchases />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute allowedRoles={["owner", "staff"]}>
              <Sales />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Stock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shop-settings"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <ShopSettings />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}