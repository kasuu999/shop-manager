import { useNavigate } from "react-router-dom";
import { Menu, Bell, LogOut } from "lucide-react";

// Simple logout: clear the token (and cached user info) from localStorage,
// then send the user back to /login. No backend call needed for this —
// JWT logout is just "the frontend stops sending/keeping the token".
const handleLogout = (navigate) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/login");
};

export default function Header({ onMenuClick, pageTitle }) {
  const navigate = useNavigate();

  // Pull the saved user's name for a nicer header (falls back to "Account"
  // if nothing was saved, so this never breaks even without that data).
  const savedUser = JSON.parse(localStorage.getItem("user") || "null");
  const displayName = savedUser?.name || "Account";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-ink-900">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell size={19} />
        </button>

        <div className="flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {initial}
          </div>
          <span className="hidden text-sm font-medium text-slate-700 sm:inline">
            {displayName}
          </span>
        </div>

        <button
          onClick={() => handleLogout(navigate)}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-red-600"
          aria-label="Log out"
        >
          <LogOut size={17} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}