import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Carousel } from "flowbite-react";
import { Button, Spinner } from "@nextui-org/react";
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiExclamationCircle, HiShieldCheck } from "react-icons/hi";

import { useAuth } from '../../context/AuthContext';
import { useAppLogo } from '../../context/LogoContext';
import defaultImg1 from '../../assets/images/LoginPrueba.jpg';
import defaultImg2 from '../../assets/images/LoginPrueba2.jpg';
import defaultImg3 from '../../assets/images/LoginPrueba3.jpg';

const DEFAULT_LOGIN_IMAGES = [defaultImg1, defaultImg2, defaultImg3];

function LoginApp() {
    const { logoSrc, loginImages } = useAppLogo();
    const carouselImages = (loginImages && loginImages.length > 0) ? loginImages : DEFAULT_LOGIN_IMAGES;
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
        <section className="flex flex-col md:flex-row h-screen pt-16 items-center bg-slate-50 dark:bg-zinc-950 overflow-hidden">
            
            {/* ── LADO IZQUIERDO: Carrusel de imágenes con 100% de visibilidad ── */}
            <div className="hidden lg:block relative w-full lg:w-1/2 xl:w-7/12 h-full bg-slate-900">
                <Carousel slideInterval={6000} className="h-full z-0 rounded-none" indicators={false}>
                    {carouselImages.map((src, i) => (
                        <img key={i} src={src} alt={`AguaVP Vista ${i + 1}`} className="w-full h-full object-cover" />
                    ))}
                </Carousel>

                {/* Tarjeta flotante transparente de cristal (Glassmorphism) */}
                <div className="absolute bottom-8 left-8 right-8 z-20 max-w-xl">
                    <div className="p-6 rounded-3xl bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 shadow-2xl flex flex-col gap-2.5 animate-in fade-in duration-300">
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none drop-shadow-md">
                            Sistema de Agua Potable
                        </h2>
                        <p className="text-white font-medium text-xs sm:text-sm leading-relaxed mt-0.5 drop-shadow">
                            Administración y control eficiente de recursos.
                        </p>

                        <div className="flex items-center gap-3.5 pt-2.5 mt-0.5 border-t border-white/20 text-[11px] font-bold text-white uppercase tracking-wider flex-wrap drop-shadow-sm">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                Nácori Grande
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                Matapé
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                Adivino
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── LADO DERECHO: Formulario de inicio de sesión ── */}
            <div className="w-full lg:w-1/2 xl:w-5/12 h-full flex flex-col justify-center px-6 sm:px-12 xl:px-16 bg-white dark:bg-zinc-950 relative overflow-y-auto">
                
                <div className="w-full max-w-md mx-auto py-8">
                    
                    {/* Logo Institucional */}
                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 p-3 bg-slate-50 dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-center transition-transform hover:scale-105 duration-300">
                            <img src={logoSrc} alt="Logo AguaVP" className="w-full h-full object-contain drop-shadow-sm" />
                        </div>
                    </div>

                    {/* Encabezados */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                            Iniciar Sesión
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 mt-2">
                            Ingresa tus credenciales oficiales para acceder al sistema.
                        </p>
                    </div>

                    {/* Caja de Error */}
                    {error && (
                        <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
                            <HiExclamationCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <p className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Formulario */}
                    <form className="space-y-4" onSubmit={handleLogin}>
                        
                        {/* Input Correo */}
                        <div className="w-full flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                                Correo Electrónico
                            </label>
                            <div className="relative w-full flex items-center group">
                                <span className="absolute left-4 flex items-center justify-center pointer-events-none text-slate-400 dark:text-zinc-500 group-focus-within:text-blue-500 transition-colors">
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
                                    className="w-full pl-11 pr-4 h-[52px] text-sm font-medium rounded-xl transition-all bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-950 shadow-none disabled:opacity-50"
                                />
                                <datalist id="correosGuardados">
                                    {correosGuardados.map((correoGuardado, index) => (
                                        <option key={index} value={correoGuardado} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        {/* Input Contraseña */}
                        <div className="w-full flex flex-col gap-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                                    Contraseña
                                </label>
                                <Link to="/recuperarPassword" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <div className="relative w-full flex items-center group">
                                <span className="absolute left-4 flex items-center justify-center pointer-events-none text-slate-400 dark:text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                                    <HiLockClosed className="w-5 h-5" />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={contrasena}
                                    onChange={(e) => setContrasena(e.target.value)}
                                    disabled={loading}
                                    className="w-full pl-11 pr-12 h-[52px] text-sm font-medium rounded-xl transition-all bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-950 shadow-none disabled:opacity-50"
                                />
                                {contrasena.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors focus:outline-none rounded-lg"
                                        title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Botón Submit */}
                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full h-[52px] font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-transform duration-150"
                                isLoading={loading}
                                spinner={<Spinner color="current" size="sm" />}
                            >
                                {loading ? "Autenticando..." : "Ingresar al Panel"}
                            </Button>
                        </div>
                    </form>

                    {/* Footer sutil */}
                    <div className="mt-8 text-center flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
                        <HiShieldCheck className="w-4 h-4 text-slate-400 dark:text-zinc-600" />
                        <span>AguaVP • Versión 3.0</span>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default LoginApp;

