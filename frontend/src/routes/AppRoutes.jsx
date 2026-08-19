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
 * and standalone (no sidebar/header). Every other route is nested inside
 * <MainLayout>, and that whole group is wrapped in a single
 * <ProtectedRoute> — so ONE check protects every business page at once.
 *
 * If there's no token, ProtectedRoute redirects to /login before
 * MainLayout (sidebar/header) ever renders.
 *
 * "/" just redirects to "/dashboard" — this way old links/bookmarks to "/"
 * still land somewhere sensible instead of a blank/broken route.
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/shop-settings" element={<ShopSettings />} />
      </Route>
    </Routes>
  );
}