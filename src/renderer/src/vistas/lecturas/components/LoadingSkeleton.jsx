// components/LoadingSkeleton.jsx
// Componente de skeleton loading reutilizable para la vista de rutas

export default function LoadingSkeleton({ rutasPorPagina = 4 }) {
  return (
    <div className="h-full flex flex-col space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-zinc-700" />
              <div className="space-y-2">
                <div className="w-40 h-6 rounded-lg bg-slate-200 dark:bg-zinc-700" />
                <div className="w-60 h-4 rounded-lg bg-slate-200 dark:bg-zinc-700" />
              </div>
            </div>
            <div className="w-32 h-10 rounded-lg bg-slate-200 dark:bg-zinc-700" />
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Estadísticas skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                <div className="w-12 h-6 rounded-lg bg-slate-200 dark:bg-zinc-700 mb-2" />
                <div className="w-20 h-3 rounded-lg bg-slate-200 dark:bg-zinc-700" />
              </div>
            ))}
          </div>

          {/* Barra de progreso skeleton */}
          <div className="mb-4 p-4 rounded-lg border border-slate-200 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-2">
              <div className="w-40 h-4 rounded-lg bg-slate-200 dark:bg-zinc-700" />
              <div className="w-12 h-4 rounded-lg bg-slate-200 dark:bg-zinc-700" />
            </div>
            <div className="w-full h-2 rounded-lg bg-slate-200 dark:bg-zinc-700 mb-2" />
            <div className="flex justify-between">
              <div className="w-32 h-3 rounded-lg bg-slate-200 dark:bg-zinc-700" />
              <div className="w-24 h-3 rounded-lg bg-slate-200 dark:bg-zinc-700" />
            </div>
          </div>

          {/* Filtros skeleton */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end mb-4">
            <div className="w-full max-w-md h-10 rounded-lg bg-slate-200 dark:bg-zinc-700" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="w-40 h-10 rounded-lg bg-slate-200 dark:bg-zinc-700" />
              <div className="w-32 h-10 rounded-lg bg-slate-200 dark:bg-zinc-700" />
              <div className="w-32 h-10 rounded-lg bg-slate-200 dark:bg-zinc-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: rutasPorPagina }).map((_, i) => (
            <div key={i} className="h-64 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl">
              <div className="p-4">
                <div className="w-full h-32 rounded-lg bg-slate-200 dark:bg-zinc-700 mb-3" />
                <div className="w-3/4 h-5 rounded-lg bg-slate-200 dark:bg-zinc-700 mb-2" />
                <div className="w-1/2 h-4 rounded-lg bg-slate-200 dark:bg-zinc-700 mb-3" />
                <div className="flex justify-between">
                  <div className="w-16 h-6 rounded-lg bg-slate-200 dark:bg-zinc-700" />
                  <div className="w-20 h-8 rounded-lg bg-slate-200 dark:bg-zinc-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
