import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  Users,
  ShoppingCart,
  Receipt,
  Boxes,
  BarChart3,
  Settings,
  Store,
  X,
} from "lucide-react";

// Single source of truth for nav items — add a page here and it shows up
// in the sidebar automatically.
const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: Package },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/purchases", label: "Purchases", icon: ShoppingCart },
  { to: "/sales", label: "Sales", icon: Receipt },
  { to: "/stock", label: "Stock", icon: Boxes },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/shop-settings", label: "Shop Settings", icon: Settings },
];

const linkClasses = ({ isActive }) =>
  [
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-brand-500/15 text-brand-400"
      : "text-slate-300 hover:bg-white/5 hover:text-white",
  ].join(" ");

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay — click to close the drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink-900 transition-transform duration-200 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Store size={18} />
            </div>
            <span className="font-display text-lg font-semibold text-white">
              Moin Shop 
            </span>
          </div>
          {/* Close button, mobile only */}
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClasses} onClick={onClose}>
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-xs text-slate-500">
          Shop Manager · v0.1
        </div>
      </aside>
    </>
  );
}