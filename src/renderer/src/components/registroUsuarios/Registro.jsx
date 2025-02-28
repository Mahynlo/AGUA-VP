import { useState } from "react";
import { Button, Alert } from "flowbite-react";
import { Link, useNavigate } from "react-router-dom";

function RegistroApp() {
    const [nombre, setNombre] = useState("");
    const [username, setUsername] = useState("");
    const [correo, setCorreo] = useState("");
    const [contraseña, setContraseña] = useState("");
    const [confirmarContraseña, setConfirmarContraseña] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleRegistro = async () => {
        setError("");
        setSuccess("");

        // Validaciones de campos
        if (!username || !correo || !contraseña || !confirmarContraseña) {
            setError("Todos los campos son obligatorios.");
            return;
        }

        if (username.includes(" ") || username.length < 4) {
            setError("El nombre de usuario debe tener al menos 4 caracteres y no contener espacios.");
            return;
        }

        if (contraseña.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (contraseña !== confirmarContraseña) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        // Realizar la solicitud de registro
        try {
            const response = await window.api.register({ correo, contraseña,username, rol: "superadmin" });

            // Verificar respuesta
            if (response.success) {
                setSuccess("Registro exitoso. Redirigiendo al login..."); // Mensaje de éxito
                setTimeout(() => navigate("/"), 2000); // Redirigir al login
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError("Ocurrió un error en el registro. Intenta nuevamente.");
        }
    };

    return (
        <section className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
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
                    <label htmlFor="contraseña" className="block text-sm font-medium text-gray-900 dark:text-white">Contraseña</label>
                    <input
                        id="contraseña"
                        type="password"
                        value={contraseña}
                        onChange={(e) => setContraseña(e.target.value)}
                        className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="mt-4">
                    <label htmlFor="confirmarContraseña" className="block text-sm font-medium text-gray-900 dark:text-white">Confirmar Contraseña</label>
                    <input
                        id="confirmarContraseña"
                        type="password"
                        value={confirmarContraseña}
                        onChange={(e) => setConfirmarContraseña(e.target.value)}
                        className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Botón de registro */}
                <Button color="blue" className="w-full mt-6" onClick={handleRegistro}>
                    Registrarse
                </Button>

                {/* Enlace a la página de login */}
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center mt-4">
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/" className="text-blue-600 font-semibold">Inicia sesión aquí</Link>
                </p>
            </div>
        </section>
    );
}

export default RegistroApp;




