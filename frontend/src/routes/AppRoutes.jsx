import { Routes, Route } from "react-router-dom";
import MainLayout from "../layout/MainLayout.jsx";

import Login from "../pages/Login.jsx";
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
 * All routes live here in one place. `/login` is standalone (no
 * sidebar/header). Every other route is nested inside <MainLayout>, so
 * they all automatically get the sidebar + header + content area, and
 * render into <Outlet /> inside MainLayout.
 *
 * There is no auth-guarding logic yet (no redirect-if-not-logged-in) —
 * that's part of the future "build login functionality" step, not this one.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/purchases/report" element={<Purchases />} />
        <Route path="/sales/report" element={<Sales />} />
        <Route path="/stocks/report" element={<Stock />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<ShopSettings />} />
      </Route>
    </Routes>
  );
}
