import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";

// Maps a route path to the title shown in the header.
// Keep this in sync with the routes defined in App.jsx.
const pageTitles = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/categories": "Categories",
  "/suppliers": "Suppliers",
  "/customers": "Customers",
  "/purchases": "Purchases",
  "/sales": "Sales",
  "/stock": "Stock",
  "/reports": "Reports",
  "/shop-settings": "Shop Settings",
};

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "Shop Manager";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} pageTitle={pageTitle} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}