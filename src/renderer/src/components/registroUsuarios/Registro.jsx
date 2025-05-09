import { useState } from "react";
import { Button, Alert } from "flowbite-react";
import { Link, useNavigate } from "react-router-dom";

function RegistroApp() {
    const [nombre, setNombre] = useState("");
    const [username, setUsername] = useState("");
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [confirmarContrasena, setConfirmarContrasena] = useState("");
    const [rol, setRol] = useState("operador"); // Valor por defecto
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleRegistro = async () => {
        setError("");
        setSuccess("");

        // Validaciones de campos
        if (!username || !correo || !contrasena || !confirmarContrasena) {
            setError("Todos los campos son obligatorios.");
            return;
        }

        if (username.includes(" ") || username.length < 4) {
            setError("El nombre de usuario debe tener al menos 4 caracteres y no contener espacios.");
            return;
        }

        if (contrasena.length < 6) {
            setError("La contrasena debe tener al menos 6 caracteres.");
            return;
        }

        if (contrasena !== confirmarContrasena) {
            setError("Las contrasenas no coinciden.");
            return;
        }

        // Realizar la solicitud de registro
        try {
            const response = await window.api.register({ correo, contrasena, username, rol });
            console.log("Respuesta del servidor:", response);
            // Verificar respuesta
            if (response.success) {
                //setSuccess("Registro exitoso. Redirigiendo al login..."); // Mensaje de éxito
                //setTimeout(() => navigate("/"), 2000); // Redirigir al login
                alert("Registro exitoso. Redirigiendo al login..."); // Mensaje de éxito
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError("Ocurrió un error en el registro. Intenta nuevamente.");
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 w-96">
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">Registro de Usuario</h2>

            {error && <Alert color="failure" className="mt-4">{error}</Alert>}
            {success && <Alert color="success" className="mt-4">{success}</Alert>}

            {/* Campos del formulario */}


            <div className="mt-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-900 dark:text-white">Username</label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="mt-4">
                <label htmlFor="correo" className="block text-sm font-medium text-gray-900 dark:text-white">Correo</label>
                <input
                    id="correo"
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="mt-4">
                <label htmlFor="contrasena" className="block text-sm font-medium text-gray-900 dark:text-white">Contrasena</label>
                <input
                    id="contrasena"
                    type="password"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="mt-4">
                <label htmlFor="confirmarContrasena" className="block text-sm font-medium text-gray-900 dark:text-white">Confirmar Contrasena</label>
                <input
                    id="confirmarContrasena"
                    type="password"
                    value={confirmarContrasena}
                    onChange={(e) => setConfirmarContrasena(e.target.value)}
                    className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Select para el rol */}
            <div className="mt-4">
                <label htmlFor="rol" className="block text-sm font-medium text-gray-900 dark:text-white">Rol</label>
                <select
                    id="rol"
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    label="Selecciona un rol"
                    className="mt-2 p-2 w-full border text-gray-800 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >

                    <option value="operador">Operador</option>
                    <option value="administrador">Administrador</option>
                    <option value="superadmin">Superadmin</option>
                </select>
            </div>
            {/* Botón de registro */}
            <Button color="blue" className="w-full mt-6" onClick={handleRegistro}>
                Registrar
            </Button>

            
        </div>
    );
}

export default RegistroApp;




