import logoagua from '../../assets/images/logo_login.png';
import imagenLogin from '../../assets/images/LoginPrueba.jpg';
import imagenLogin2 from '../../assets/images/LoginPrueba2.jpg';
import imagenLogin3 from '../../assets/images/LoginPrueba3.jpg';
import { Avatar, Button, FloatingLabel, Carousel} from "flowbite-react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { useState,useEffect } from "react";
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
function LoginApp() {
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar la contraseña
    const [correosGuardados, setCorreosGuardados] = useState([]);
    const [dropdownVisible, setDropdownVisible] = useState(false);


    const navigate = useNavigate();
    const { user, login, isAuthenticated } = useAuth();

    useEffect(() => {
        const correos = JSON.parse(localStorage.getItem("correos_anteriores")) || [];
        setCorreosGuardados(correos);
    }, []);

    // Si el usuario ya está autenticado, lo redirigimos a /home
    if (isAuthenticated()) {
        return <Navigate to="/home" />;
    }
    // Validación de correo electrónico
    const validateEmail = (email) => {
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        return emailPattern.test(email);
    };

    const handleLogin = async () => {
        setError(""); // Limpiar errores previos

        // Validaciones
        if (!correo || !contrasena) {
            setError("Por favor, completa todos los campos.");
            return;
        }

        if (!validateEmail(correo)) {
            setError("Por favor, ingresa un correo electrónico válido.");
            return;
        }

        if (contrasena.length < 6) {
            setError("La contrasena debe tener al menos 6 caracteres.");
            return;
        }
        //console.log("Datos enviados al proceso principal:", { correo, contrasena });
        try {
            const response = await window.api.login({ correo, contrasena });
            console.log("Respuesta del servidor:", response);

            if (response.success) {
                const actual = [...correosGuardados];
                if (!actual.includes(correo)) {
                    actual.push(correo);
                    localStorage.setItem("correos_anteriores", JSON.stringify(actual));
                    setCorreosGuardados(actual);
                }
                
                //localStorage.setItem("token", response.token);
                login(response.token);
                navigate(response.rol === "administrador" ? "/home" : "/ayuda");// Redirigir a home si es administrador o a ayuda si es usuario normal 
            } else {
                setError(response.message || "Error en la autenticación.");
            }
        } catch (err) {
            setError("Ocurrió un error en la autenticación.");
            //console.error(err);
        }
    };


    return (
        <section className="flex flex-col md:flex-row h-screen items-center">
            {/* Carrusel de imágenes */}
            <div className="bg-gray-300 dark:bg-indigo-800 hidden lg:block w-full md:w-1/2 xl:w-2/3 h-screen">
                <Carousel slideInterval={5000} className="h-full">
                    <img src={imagenLogin} alt="Imagen 1" className="w-full h-full object-cover" />
                    <img src={imagenLogin2} alt="Imagen 2" className="w-full h-full object-cover" />
                    <img src={imagenLogin3} alt="Imagen 3" className="w-full h-full object-cover" />
                </Carousel>
            </div>
         

            {/* Formulario de inicio de sesión */}
            <div className="bg-white dark:bg-gray-800 w-full md:max-w-md lg:max-w-full md:mx-auto md:w-1/2 xl:w-1/3 h-screen px-6 lg:px-16 xl:px-12 flex items-center justify-center">
                <div className="w-full">
                    <div className="flex justify-center">
                        <Avatar img={logoagua} size="xl" />
                    </div>

                    <h1 className="text-xl md:text-2xl font-bold leading-tight mt-6 text-black dark:text-white text-center">
                        Iniciar Sesión
                    </h1>

                    
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    <form className="mt-6">
                        <div className="mb-4">
                            <FloatingLabel
                                variant="filled"
                                label="Correo"
                                labelClassName="text-gray-700 dark:text-gray-200"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                list='correosGuardados'
                                autoComplete="on"
                                
                                
                            />
                          
                            <datalist id='correosGuardados'>
                                {correosGuardados.map((correoGuardado, index) => (
                                    <option key={index} value={correoGuardado} />
                                ))}
                            </datalist>

                            
                        </div>


                        <div className="mt-5 relative">
                            <FloatingLabel
                                variant="filled"
                                label="Contrasena"
                                type={showPassword ? "text" : "password"} // Cambiar tipo dependiendo del estado
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                            />
                            {/**Mostrar el boton si ya se escribio texto  */}
                            {contrasena.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)} // Alternar visibilidad
                                    className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500"
                                >
                                    {showPassword ? "Ocultar" : "Mostrar"}
                                </button>
                            )}
                        </div>

                        <div className="text-right mt-2">
                            <Link to="/recuperarPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-700">
                                ¿Olvidaste tu contrasena?
                            </Link>
                        </div>

                        <Button color="blue" className="w-full py-3 mt-6" onClick={handleLogin}>
                            Iniciar Sesión
                        </Button>

                    </form>

                    <hr className="my-6 border-gray-300 w-full" />



                </div>
            </div>
        </section>
    );
}

export default LoginApp;

