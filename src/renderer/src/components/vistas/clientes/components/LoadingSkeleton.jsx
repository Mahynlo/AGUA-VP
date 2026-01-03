/**
 * Componente de Loading Skeleton compartido
 * Proporciona diferentes tipos de skeletons según la necesidad
 */

import React from "react";
import { Card, CardBody, CardHeader, Skeleton } from "@nextui-org/react";

export const LoadingSkeleton = ({ tipo = 'tabla' }) => {
  if (tipo === 'tabla') {
    return <TablaSkeleton />;
  }
  
  if (tipo === 'metricas') {
    return <MetricasSkeleton />;
  }
  
  if (tipo === 'form') {
    return <FormSkeleton />;
  }
  
  return <TablaSkeleton />;
};

// Skeleton para tabla de clientes
const TablaSkeleton = () => (
  <div className="space-y-6 p-4">
    {/* Header skeleton */}
    <Card>
      <CardHeader>
        <Skeleton className="w-48 h-6 rounded-lg" />
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <Skeleton className="w-full h-10 rounded-lg" />
          </div>
          <Skeleton className="w-full h-10 rounded-lg" />
          <Skeleton className="w-full h-10 rounded-lg" />
          <Skeleton className="w-full h-10 rounded-lg" />
        </div>
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="w-64 h-4 rounded-lg" />
          <Skeleton className="w-32 h-8 rounded-lg" />
        </div>
      </CardBody>
    </Card>

    {/* Table skeleton */}
    <Card>
      <CardBody className="p-0">
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-3/4 h-4 rounded-lg" />
                <Skeleton className="w-1/2 h-3 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="w-16 h-6 rounded-lg" />
                <Skeleton className="w-12 h-4 rounded-lg" />
              </div>
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  </div>
);

// Skeleton para métricas
const MetricasSkeleton = () => (
  <div className="space-y-6 p-4">
    {/* Header skeleton */}
    <div className="flex justify-between items-center mb-6">
      <div className="space-y-2">
        <Skeleton className="w-48 h-8 rounded-lg" />
        <Skeleton className="w-64 h-4 rounded-lg" />
      </div>
      <Skeleton className="w-32 h-10 rounded-lg" />
    </div>

    {/* Estadísticas skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="w-24 h-4 rounded-lg" />
                <Skeleton className="w-16 h-8 rounded-lg" />
              </div>
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          </CardBody>
        </Card>
      ))}
    </div>

    {/* Charts skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="w-48 h-6 rounded-lg" />
        </CardHeader>
        <CardBody>
          <Skeleton className="w-full h-64 rounded-lg" />
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="w-48 h-6 rounded-lg" />
        </CardHeader>
        <CardBody>
          <Skeleton className="w-full h-64 rounded-lg" />
        </CardBody>
      </Card>
    </div>
  </div>
);

// Skeleton para formulario
const FormSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="w-48 h-6 rounded-lg" />
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="w-full h-10 rounded-lg" />
          <Skeleton className="w-full h-10 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="w-full h-10 rounded-lg" />
          <Skeleton className="w-full h-10 rounded-lg" />
        </div>
      </CardBody>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="w-48 h-6 rounded-lg" />
      </CardHeader>
      <CardBody>
        <Skeleton className="w-full h-20 rounded-lg" />
      </CardBody>
    </Card>
  </div>
);

export default LoadingSkeleton;
