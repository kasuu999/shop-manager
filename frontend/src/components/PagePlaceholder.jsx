/**
 * Every page in this initial setup renders this same placeholder — it's
 * intentionally simple so it's obvious where real CRUD UI/API calls will
 * be added next. `icon`, `title`, and `description` are the only things
 * that change per page.
 */
export default function PagePlaceholder({ icon: Icon, title, description }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-card">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon size={26} strokeWidth={1.75} />
      </div>
      <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>
      <span className="mt-5 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">
        Coming soon
      </span>
    </div>
  );
}
