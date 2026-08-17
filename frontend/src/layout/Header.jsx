import { Menu, Bell, ChevronDown } from "lucide-react";

export default function Header({ onMenuClick, pageTitle }) {
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

        {/* Placeholder user menu — wired up once login exists */}
        <button className="flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2 hover:bg-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            O
          </div>
          <span className="hidden text-sm font-medium text-slate-700 sm:inline">
            Owner
          </span>
          <ChevronDown size={16} className="hidden text-slate-400 sm:inline" />
        </button>
      </div>
    </header>
  );
}
