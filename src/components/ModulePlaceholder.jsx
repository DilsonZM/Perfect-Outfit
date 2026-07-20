export default function ModulePlaceholder({ title, description, features = [] }) {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </header>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8">
        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          En construcción
        </span>
        <p className="mt-4 text-sm font-medium text-slate-700">
          Este módulo incluirá:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-500">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
