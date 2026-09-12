import { Link, useLocation } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { 
  HiMail, 
  HiKey, 
  HiShieldCheck, 
  HiArrowLeft, 
  HiInformationCircle,
  HiExclamationCircle,
  HiCheckCircle,
  HiEye,
  HiEyeOff,
  HiLockClosed
} from "react-icons/hi";

function useRecoveryTokenFromLocation() {
  const location = useLocation();

  return useMemo(() => {
    const query = new URLSearchParams(location.search);
    const searchToken = query.get('token');
    if (searchToken) return searchToken;

    const hash = location.hash || (typeof window !== 'undefined' ? window.location.hash || '' : '');
    const hashQueryIndex = hash.indexOf('?');
    if (hashQueryIndex === -1) return null;

    const hashQuery = hash.slice(hashQueryIndex + 1);
    return new URLSearchParams(hashQuery).get('token');
  }, [location.search, location.hash]);
}

export default function RecuperarPassword() {
  const tokenFromUrl = useRecoveryTokenFromLocation();
  const [step, setStep] = useState(tokenFromUrl ? 'reset' : 'request');
  const [correo, setCorreo] = useState('');
  const [token, setToken] = useState(tokenFromUrl || '');
  const [passwords, setPasswords] = useState({ nueva: '', confirmar: '' });
  const [showPasswords, setShowPasswords] = useState({ nueva: false, confirmar: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setStep('reset');
    }
  }, [tokenFromUrl]);

  const handleRequestRecovery = async () => {
    if (!correo.trim()) {
      setMessage({ type: 'error', text: 'Ingresa tu correo electrónico institucional.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await window.api.requestPasswordRecovery(correo.trim().toLowerCase());
      if (res?.success) {
        setMessage({
          type: 'success',
          text: res.message || 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.'
        });
        setStep('reset');
      } else {
        setMessage({ type: 'error', text: res?.message || res?.error || 'No se pudo procesar la solicitud.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token.trim()) {
      setMessage({ type: 'error', text: 'Ingresa el token de recuperación.' });
      return;
    }
    if (!passwords.nueva || !passwords.confirmar) {
      setMessage({ type: 'error', text: 'Completa la nueva contraseña y su confirmación.' });
      return;
    }
    if (passwords.nueva !== passwords.confirmar) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await window.api.resetPasswordRecovery({
        token,
        contraseñaNueva: passwords.nueva,
        confirmarContraseñaNueva: passwords.confirmar
      });
      if (res?.success) {
        setMessage({ type: 'success', text: res.message || 'Contraseña restablecida correctamente.' });
        setPasswords({ nueva: '', confirmar: '' });
      } else {
        setMessage({ type: 'error', text: res?.message || res?.error || 'No se pudo restablecer la contraseña.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputPassword = (field) => (e) => {
    setPasswords((prev) => ({ ...prev, [field]: e.target.value }));
    if (message.text) setMessage({ type: '', text: '' });
  };

  const toggleShowPassword = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen pt-16 pb-8 bg-slate-50 dark:bg-zinc-950 px-4 sm:px-6 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Fondo ambiental sutil */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className={`w-full ${step === 'reset' ? 'max-w-xl md:max-w-2xl' : 'max-w-lg'} transition-all duration-300 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10`}>
        
        {/* Tarjeta Central */}
        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-xl flex flex-col overflow-hidden">
          
          {/* Header de Tarjeta */}
          <div className="relative flex flex-col gap-3.5 border-b border-slate-100 dark:border-zinc-800 px-6 sm:px-8 py-6 items-center text-center">
            
            {/* Botón de Volver al Login */}
            <Link 
              to="/" 
              className="absolute top-5 left-5 p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors border border-slate-200/80 dark:border-zinc-800" 
              title="Volver al Login"
            >
              <HiArrowLeft className="w-5 h-5" />
            </Link>

            {/* Icono Tintado */}
            <div className="rounded-2xl bg-blue-500/10 p-3.5 text-blue-600 dark:text-blue-400 mt-1">
              {step === 'request' ? <HiMail className="w-6 h-6" /> : <HiKey className="w-6 h-6" />}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                {step === 'request' ? 'Recuperar Cuenta' : 'Restablecer Contraseña'}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1.5 max-w-md mx-auto">
                {step === 'request' 
                  ? 'Ingresa tu correo para recibir un token de recuperación temporal.' 
                  : 'Ingresa el código de validación recibido y define tu nueva clave de acceso.'}
              </p>
            </div>

            {/* Indicador de Pasos (Stepper) */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
                step === 'request' 
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600'
              }`}>
                1. Solicitar Token
              </div>
              <div className="w-3 h-px bg-slate-200 dark:bg-zinc-800" />
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
                step === 'reset' 
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600'
              }`}>
                2. Restablecer
              </div>
            </div>

          </div>

          <div className="flex flex-col px-6 sm:px-8 py-6 gap-4">
            
            {/* Mensajes de Alerta */}
            {message.text && (
              <div className={`p-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
                message.type === 'error'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}>
                {message.type === 'error' ? <HiExclamationCircle className="w-5 h-5 shrink-0" /> : <HiCheckCircle className="w-5 h-5 shrink-0" />}
                <p className="leading-tight">{message.text}</p>
              </div>
            )}

            {/* Aviso Informativo */}
            {!message.text && (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs font-medium text-slate-600 dark:text-zinc-300 flex items-start gap-3">
                <HiInformationCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Por seguridad, el token temporal enviado tiene vigencia limitada. No compartas este código con terceros.
                </p>
              </div>
            )}

            {/* Paso 1: Solicitud */}
            {step === 'request' ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 w-full">
                  <label htmlFor="correo-recuperacion" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">
                    Correo Electrónico
                  </label>
                  <div className="relative group w-full flex items-center">
                    <span className="absolute left-4 pointer-events-none text-slate-400 dark:text-zinc-500 group-focus-within:text-blue-500 transition-colors duration-200">
                      <HiMail className="w-5 h-5" />
                    </span>
                    <input
                      id="correo-recuperacion"
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      placeholder="ejemplo@aguavp.com"
                      disabled={loading}
                      className="w-full pl-11 pr-4 h-[50px] text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-1">
                  <Button
                    className="h-[50px] w-full font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-transform duration-150"
                    onPress={handleRequestRecovery}
                    isLoading={loading}
                    spinner={<Spinner color="current" size="sm" />}
                  >
                    Enviar Token de Recuperación
                  </Button>

                  <button
                    type="button"
                    className="w-full py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors text-center"
                    onClick={() => setStep('reset')}
                  >
                    ¿Ya tienes un token? Ingresar código
                  </button>
                </div>
              </div>
            ) : (
              /* Paso 2: Restablecimiento en layout ancho y simétrico */
              <div className="flex flex-col gap-4">
                
                {/* Input Token (ancho completo) */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label htmlFor="token-recuperacion" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">
                    Token de Recuperación
                  </label>
                  <div className="relative group w-full flex items-center">
                    <span className="absolute left-4 pointer-events-none text-slate-400 dark:text-zinc-500 group-focus-within:text-blue-500 transition-colors duration-200">
                      <HiShieldCheck className="w-5 h-5" />
                    </span>
                    <input
                      id="token-recuperacion"
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Pega aquí el código recibido"
                      disabled={loading}
                      className="w-full pl-11 pr-4 h-[50px] text-sm font-medium font-mono rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Grilla de 2 columnas para Contraseñas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Input Nueva Contraseña */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <label htmlFor="password-nueva" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">
                      Nueva Contraseña
                    </label>
                    <div className="relative group w-full flex items-center">
                      <span className="absolute left-4 pointer-events-none text-slate-400 dark:text-zinc-500 group-focus-within:text-blue-500 transition-colors duration-200">
                        <HiLockClosed className="w-5 h-5" />
                      </span>
                      <input
                        id="password-nueva"
                        type={showPasswords.nueva ? "text" : "password"}
                        value={passwords.nueva}
                        onChange={handleInputPassword('nueva')}
                        placeholder="••••••••"
                        disabled={loading}
                        className="w-full pl-11 pr-11 h-[50px] text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none disabled:opacity-50"
                      />
                      {passwords.nueva.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleShowPassword('nueva')}
                          className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors focus:outline-none rounded-lg"
                          title={showPasswords.nueva ? "Ocultar" : "Mostrar"}
                        >
                          {showPasswords.nueva ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Input Confirmar Contraseña */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <label htmlFor="password-confirmar" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">
                      Confirmar Contraseña
                    </label>
                    <div className="relative group w-full flex items-center">
                      <span className="absolute left-4 pointer-events-none text-slate-400 dark:text-zinc-500 group-focus-within:text-blue-500 transition-colors duration-200">
                        <HiLockClosed className="w-5 h-5" />
                      </span>
                      <input
                        id="password-confirmar"
                        type={showPasswords.confirmar ? "text" : "password"}
                        value={passwords.confirmar}
                        onChange={handleInputPassword('confirmar')}
                        placeholder="••••••••"
                        disabled={loading}
                        className="w-full pl-11 pr-11 h-[50px] text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none disabled:opacity-50"
                      />
                      {passwords.confirmar.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleShowPassword('confirmar')}
                          className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors focus:outline-none rounded-lg"
                          title={showPasswords.confirmar ? "Ocultar" : "Mostrar"}
                        >
                          {showPasswords.confirmar ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de acción en grid horizontal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="flat"
                    className="h-[50px] w-full font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-xl transition-colors border border-slate-200/80 dark:border-zinc-800 order-2 sm:order-1"
                    onPress={() => setStep('request')}
                    isDisabled={loading}
                  >
                    Volver al Paso 1
                  </Button>

                  <Button
                    className="h-[50px] w-full font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-transform duration-150 order-1 sm:order-2"
                    onPress={handleResetPassword}
                    isLoading={loading}
                    spinner={<Spinner color="current" size="sm" />}
                  >
                    Actualizar Contraseña
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">
          Sistema de Agua Potable • Villa Pesqueira
        </p>
      </div>
    </div>
  );
}
