// RutaCard.jsx
import { useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@nextui-org/react";
import CarruselLecturasModal from "./CarruselLecturasModal";

export default function RutaCard({ ruta }) {
  return (
    <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 border-gray-300 dark:border-gray-600 ">
      {/* Dropdown de opciones */}
      <div className="absolute top-2 right-2 z-20">
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <button
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-md"
              title="Opciones"
            >
              ⋮
            </button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Opciones de ruta"
            className="text-gray-800 dark:text-white"
          >
            <DropdownItem onClick={() => alert(`Ver detalles de ${ruta.nombre}`)}>
              📄 Ver Detalles
            </DropdownItem>
            <DropdownItem onClick={() => alert(`Editar ruta ${ruta.nombre}`)}>
              ✏️ Editar Ruta
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Imagen */}
      <div className="h-48 overflow-hidden">
        <img
          src={ruta.imagen}
          alt={ruta.nombre}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Contenido */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {ruta.nombre}
          </h2>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Completadas: {ruta.completadas}/{ruta.total}
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          {ruta.descripcion}
        </p>

        <div className="mt-4">
          <CarruselLecturasModal />
        </div>
      </div>
    </div>
  );
}
