import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Carousel } from "flowbite-react";
import { Button, Spinner } from "@nextui-org/react";
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiExclamationCircle } from "react-icons/hi";

import { useAuth } from '../../context/AuthContext';

// Imágenes
import logoagua from '../../assets/images/Escudo_Villa_Pesqueira_sin_fondo.png';
import imagenLogin from '../../assets/images/LoginPrueba.jpg';
import imagenLogin2 from '../../assets/images/LoginPrueba2.jpg';
import imagenLogin3 from '../../assets/images/LoginPrueba3.jpg';

function LoginApp() {
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [correosGuardados, setCorreosGuardados] = useState([]);

    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    useEffect(() => {
        const correos = JSON.parse(localStorage.getItem("correos_anteriores")) || [];
        setCorreosGuardados(correos);
    }, []);

    if (isAuthenticated()) {
        const lastRoute = localStorage.getItem('app_last_route');
        return <Navigate to={lastRoute || "/home"} />;
    }

    const validateEmail = (email) => {
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        return emailPattern.test(email);
    };

    const handleLogin = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (loading) return;

        setError("");

        const correoVal = correo.trim();
        const passVal = contrasena.trim();

        if (!correoVal || !passVal) {
            setError("Por favor, completa todos los campos.");
            return;
        }

        if (!validateEmail(correoVal)) {
            setError("Ingresa un correo electrónico válido.");
            return;
        }

        if (passVal.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        try {
            setLoading(true);
            const response = await window.api.login({ correo: correoVal, contrasena: passVal });
            console.log("Respuesta del servidor:", response);

            if (response.success) {
                const actual = [...correosGuardados];
                if (!actual.includes(correoVal)) {
                    actual.push(correoVal);
                    localStorage.setItem("correos_anteriores", JSON.stringify(actual));
                    setCorreosGuardados(actual);
                }

                login(response.accessToken, response.refreshToken, response.expiresIn);
                
                if (response.requiere_cambio_password) {
                    navigate("/perfil");
                }
            } else {
                setError(response.message || "Credenciales incorrectas. Intenta de nuevo.");
            }
        } catch (err) {
            setError("Ocurrió un error de conexión. Verifica tu red e intenta nuevamente.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="flex flex-col md:flex-row h-screen items-center bg-white dark:bg-zinc-950 overflow-hidden">
            
            {/* ── LADO IZQUIERDO: Carrusel de imágenes ── */}
            <div className="hidden lg:block relative w-full lg:w-1/2 xl:w-2/3 h-screen bg-slate-900">
                {/* Overlay oscuro para darle un toque premium y oscurecer las imágenes */}
                <div className="absolute inset-0 bg-slate-900/30 dark:bg-zinc-900/60 z-10 mix-blend-multiply pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-10 pointer-events-none"></div>
                
                <Carousel slideInterval={5000} className="h-full z-0" indicators={false}>
                    <img src={imagenLogin} alt="Villa Pesqueira 1" className="w-full h-full object-cover" />
                    <img src={imagenLogin2} alt="Villa Pesqueira 2" className="w-full h-full object-cover" />
                    <img src={imagenLogin3} alt="Villa Pesqueira 3" className="w-full h-full object-cover" />
                </Carousel>

                {/* Texto decorativo sobre el carrusel (Opcional) */}
                <div className="absolute bottom-12 left-12 z-20">
                    <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                        Sistema de Agua Potable
                    </h2>
                    <p className="text-white/80 font-medium mt-2 drop-shadow">
                        Administración y control eficiente de recursos.
                    </p>
                </div>
            </div>

            {/* ── LADO DERECHO: Formulario de inicio de sesión ── */}
            <div className="w-full lg:w-1/2 xl:w-1/3 h-screen flex flex-col justify-center px-8 sm:px-16 lg:px-12 xl:px-16 bg-white dark:bg-zinc-950 relative">
                
                <div className="w-full max-w-sm mx-auto">
                    
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="w-32 h-32 p-2 bg-slate-50 dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-center">
                            <img src={logoagua} alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
                        </div>
                    </div>

                    {/* Encabezados */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">
                            Bienvenido de nuevo
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1.5">
                            Ingresa tus credenciales para acceder al panel.
                        </p>
                    </div>

                    {/* Caja de Error Premium */}
                    {error && (
                        <div className="mb-6 p-3.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
                            <HiExclamationCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Formulario */}
                    <form className="space-y-5" onSubmit={handleLogin}>
                        
                        {/* Input Correo */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">
                                Correo Electrónico
                            </label>
                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none">
                                    <HiMail className="w-5 h-5" />
                                </span>
                                <input
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                    list="correosGuardados"
                                    autoComplete="email"
                                    disabled={loading}
                                    className="w-full pl-11 pr-4 h-12 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-950 shadow-sm disabled:opacity-50"
                                />
                                <datalist id="correosGuardados">
                                    {correosGuardados.map((correoGuardado, index) => (
                                        <option key={index} value={correoGuardado} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        {/* Input Contraseña */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">
                                Contraseña
                            </label>
                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none">
                                    <HiLockClosed className="w-5 h-5" />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={contrasena}
                                    onChange={(e) => setContrasena(e.target.value)}
                                    disabled={loading}
                                    className="w-full pl-11 pr-12 h-12 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-950 shadow-sm disabled:opacity-50"
                                />
                                {contrasena.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors focus:outline-none rounded-lg"
                                        title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                                    </button>
                                )}
                            </div>
                            <div className="flex justify-end mt-2">
                                <Link to="/recuperarPassword" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        </div>

                        {/* Botón Submit (NextUI) */}
                        <Button
                            type="submit"
                            color="primary"
                            className="w-full h-12 font-bold text-base mt-2 shadow-lg shadow-blue-500/30"
                            isLoading={loading}
                            spinner={<Spinner color="current" size="sm" />}
                        >
                            {loading ? "Autenticando..." : "Ingresar al Panel"}
                        </Button>
                    </form>

                    {/* Footer sutil */}
                    <div className="mt-10 text-center">
                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
                            Sistema Interno • Versión 2.0
                        </p>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default LoginApp;

