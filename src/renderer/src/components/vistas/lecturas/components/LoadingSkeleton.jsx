// components/LoadingSkeleton.jsx
// Componente de skeleton loading reutilizable para la vista de rutas

import { Card, CardHeader, CardBody, Skeleton } from "@nextui-org/react";

export default function LoadingSkeleton({ rutasPorPagina = 4 }) {
  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="w-40 h-6 rounded-lg" />
                <Skeleton className="w-60 h-4 rounded-lg" />
              </div>
            </div>
            <Skeleton className="w-32 h-10 rounded-lg" />
          </div>
        </CardHeader>
        
        <CardBody className="pt-0">
          {/* Estadísticas skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border">
                <Skeleton className="w-12 h-6 rounded-lg mb-2" />
                <Skeleton className="w-20 h-3 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Barra de progreso skeleton */}
          <div className="mb-4 p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="w-40 h-4 rounded-lg" />
              <Skeleton className="w-12 h-4 rounded-lg" />
            </div>
            <Skeleton className="w-full h-2 rounded-lg mb-2" />
            <div className="flex justify-between">
              <Skeleton className="w-32 h-3 rounded-lg" />
              <Skeleton className="w-24 h-3 rounded-lg" />
            </div>
          </div>

          {/* Filtros skeleton */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end mb-4">
            <Skeleton className="w-full max-w-md h-10 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="w-40 h-10 rounded-lg" />
              <Skeleton className="w-32 h-10 rounded-lg" />
              <Skeleton className="w-32 h-10 rounded-lg" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Grid skeleton */}
      <div className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: rutasPorPagina }).map((_, i) => (
            <Card key={i} className="h-64">
              <CardBody className="p-4">
                <Skeleton className="w-full h-32 rounded-lg mb-3" />
                <Skeleton className="w-3/4 h-5 rounded-lg mb-2" />
                <Skeleton className="w-1/2 h-4 rounded-lg mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="w-16 h-6 rounded-lg" />
                  <Skeleton className="w-20 h-8 rounded-lg" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
