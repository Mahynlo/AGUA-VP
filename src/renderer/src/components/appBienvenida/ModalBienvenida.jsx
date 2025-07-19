// src/components/appBienvenida/ModalBienvenida.jsx
import {useAuthApp} from '../../context/appAuthContext'; // Asegúrate de que la ruta sea correcta
const ModalBienvenida = () => {
  const { modalAbierto, registrarApp,error} = useAuthApp(); // Usamos el hook personalizado para acceder al contexto
  if (!modalAbierto) return null; //si el modal no está abierto, no renderizamos nada

  return (

    <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">¡Bienvenido!</h2>

        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Esta es la primera vez que usas la app en este equipo. Presiona continuar para registrarla.
        </p>
        {error && (
          <div className="bg-red-100 text-red-800 px-3 py-2 mb-4 rounded">
            {error}
          </div>
        )}
        <button
          onClick={registrarApp}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default ModalBienvenida;

