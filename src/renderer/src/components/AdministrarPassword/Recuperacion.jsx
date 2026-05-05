import { Link, useLocation } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@nextui-org/react";
import { 
  HiMail, 
  HiKey, 
  HiShieldCheck, 
  HiArrowLeft, 
  HiInformationCircle,
  HiExclamationCircle,
  HiCheckCircle
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
      setMessage({ type: 'error', text: 'Ingresa tu correo electrónico.' });
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

  const renderInput = ({ id, label, type = 'text', value, onChange, placeholder, icon }) => (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">
        {label}
      </label>
      <div className="relative group w-full flex items-center">
        <span className="absolute left-4 pointer-events-none text-slate-400 dark:text-zinc-500 group-focus-within:text-blue-500 transition-colors duration-200">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 h-[52px] text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-zinc-950 dark:via-slate-950 dark:to-zinc-900 px-4 py-10 flex flex-col items-center justify-center relative">
      
      <div className="w-full max-w-md flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Tarjeta Central */}
        <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
          
          {/* Header de Tarjeta */}
          <div className="relative flex flex-col gap-4 border-b border-slate-100 dark:border-zinc-800/80 px-8 py-8 items-center text-center">
            {/* Botón de Volver integrado en el header */}
            <Link to="/" className="absolute top-6 left-6 text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors" title="Volver al Login">
              <HiArrowLeft className="text-xl" />
            </Link>

            <div className="rounded-2xl bg-blue-500/10 p-4 text-blue-600 dark:text-blue-400 mb-1">
              {step === 'request' ? <HiMail className="w-8 h-8" /> : <HiKey className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                {step === 'request' ? 'Recuperar Cuenta' : 'Nueva Contraseña'}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mt-2">
                {step === 'request' ? 'Paso 1: Solicitar Token' : 'Paso 2: Restablecer'}
              </p>
            </div>
          </div>

          <div className="flex flex-col px-8 py-8 gap-6">
            
            {/* Mensajes de Alerta */}
            {message.text && (
              <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
                message.type === 'error'
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}>
                {message.type === 'error' ? <HiExclamationCircle className="w-6 h-6 shrink-0" /> : <HiCheckCircle className="w-6 h-6 shrink-0" />}
                <p className="leading-tight">{message.text}</p>
              </div>
            )}

            {/* Aviso Informativo */}
            {!message.text && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-[11px] font-medium text-slate-600 dark:text-zinc-300 flex items-start gap-3">
                <HiInformationCircle className="text-lg text-blue-600 dark:text-blue-400 shrink-0" />
                <p className="leading-relaxed">
                  Por seguridad, el token temporal enviado por correo tiene una validez limitada. No compartas este código con nadie.
                </p>
              </div>
            )}

            {/* Paso 1: Solicitud */}
            {step === 'request' ? (
              <div className="flex flex-col gap-6">
                {renderInput({
                  id: 'correo-recuperacion',
                  label: 'Correo Electrónico',
                  type: 'email',
                  value: correo,
                  onChange: (e) => setCorreo(e.target.value),
                  placeholder: 'ejemplo@aguavp.com',
                  icon: <HiMail className="text-lg" />
                })}

                <div className="flex flex-col gap-4 mt-2">
                  <Button
                    className="h-[52px] w-full font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl shadow-sm transition-transform active:scale-95"
                    onPress={handleRequestRecovery}
                    isLoading={loading}
                  >
                    Enviar Token
                  </Button>

                  <button
                    type="button"
                    className="w-full text-[11px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                    onClick={() => setStep('reset')}
                  >
                    Ya tengo un token
                  </button>
                </div>
              </div>
            ) : (
              /* Paso 2: Restablecimiento */
              <div className="flex flex-col gap-5">
                {renderInput({
                  id: 'token-recuperacion',
                  label: 'Token de Recuperación',
                  value: token,
                  onChange: (e) => setToken(e.target.value),
                  placeholder: 'Ingresa el código',
                  icon: <HiShieldCheck className="text-lg" />
                })}

                {renderInput({
                  id: 'password-nueva',
                  label: 'Nueva Contraseña',
                  type: 'password',
                  value: passwords.nueva,
                  onChange: handleInputPassword('nueva'),
                  placeholder: '••••••••',
                  icon: <HiKey className="text-lg" />
                })}

                {renderInput({
                  id: 'password-confirmar',
                  label: 'Confirmar Contraseña',
                  type: 'password',
                  value: passwords.confirmar,
                  onChange: handleInputPassword('confirmar'),
                  placeholder: '••••••••',
                  icon: <HiKey className="text-lg" />
                })}

                <div className="flex flex-col gap-3 mt-4">
                  <Button
                    className="h-[52px] w-full font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl shadow-sm transition-transform active:scale-95"
                    onPress={handleResetPassword}
                    isLoading={loading}
                  >
                    Actualizar Contraseña
                  </Button>
                  
                  {/* Botón Volver Atrás reintegrado */}
                  <Button
                    variant="flat"
                    className="h-[52px] w-full font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                    onPress={() => setStep('request')}
                    isDisabled={loading}
                  >
                    Volver al Paso 1
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">
          Sistema de Agua Potable • Villa Pesqueira
        </p>
      </div>
    </div>
  );
}
