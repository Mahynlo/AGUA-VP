import { Link, useLocation } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader } from "@nextui-org/react";
import { HiMail, HiKey, HiShieldCheck, HiArrowLeft, HiInformationCircle } from "react-icons/hi";

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
        setMessage({
          type: 'error',
          text: res?.message || res?.error || 'No se pudo procesar la solicitud.'
        });
      }
    } catch (error) {
      console.error('Error solicitando recuperación:', error);
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
        setMessage({
          type: 'success',
          text: res.message || 'Contraseña restablecida correctamente.'
        });
        setPasswords({ nueva: '', confirmar: '' });
      } else {
        setMessage({
          type: 'error',
          text: res?.message || res?.error || 'No se pudo restablecer la contraseña.'
        });
      }
    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
      setMessage({ type: 'error', text: 'Error de conexión. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputPassword = (field) => (e) => {
    setPasswords((prev) => ({ ...prev, [field]: e.target.value }));
    if (message.text) setMessage({ type: '', text: '' });
  };

  const renderInput = ({
    id,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    icon
  }) => (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white/95 pl-10 pr-4 text-sm font-semibold text-slate-700 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-zinc-950 dark:via-slate-950 dark:to-zinc-900 px-4 pb-10 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Recuperar contraseña</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
              Solicita el enlace por correo y luego establece una nueva contraseña segura.
            </p>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <HiArrowLeft className="text-base" />
            Volver
          </Link>
        </div>

        {message.text && (
          <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
            {message.text}
          </div>
        )}

        <Card className="border border-slate-200 bg-white/95 shadow-xl shadow-blue-500/10 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
              {step === 'request' ? <HiMail className="text-2xl" /> : <HiKey className="text-2xl" />}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {step === 'request' ? 'Solicitar recuperación' : 'Restablecer contraseña'}
                </h2>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400">
                  {step === 'request' ? 'Enviaremos un token temporal al correo registrado' : 'Usa el token recibido por correo'}
                </p>
              </div>
            </div>
            <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
              {step === 'request' ? 'Paso 1' : 'Paso 2'}
            </div>
          </CardHeader>

          <CardBody className="space-y-5 px-6 py-6">
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-sm text-slate-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-zinc-200">
              <div className="flex items-start gap-3">
                <HiInformationCircle className="mt-0.5 text-lg text-blue-600 dark:text-blue-300" />
                <p>
                  El correo de recuperación no revelará si la cuenta existe. Si el correo está registrado, recibirás un token temporal de un solo uso con expiración corta.
                </p>
              </div>
            </div>

            {step === 'request' ? (
              <div className="space-y-4">
                {renderInput({
                  id: 'correo-recuperacion',
                  label: 'Correo electrónico',
                  type: 'email',
                  value: correo,
                  onChange: (e) => setCorreo(e.target.value),
                  placeholder: 'usuario@aguavp.com',
                  icon: <HiMail className="text-lg" />
                })}

                <Button
                  color="primary"
                  className="h-12 w-full font-bold"
                  onPress={handleRequestRecovery}
                  isLoading={loading}
                >
                  Enviar token de recuperación
                </Button>

                <button
                  type="button"
                  className="w-full text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                  onClick={() => setStep('reset')}
                >
                  Ya tengo el token
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {renderInput({
                  id: 'token-recuperacion',
                  label: 'Token de recuperación',
                  value: token,
                  onChange: (e) => setToken(e.target.value),
                  placeholder: 'Pega aquí el token recibido por correo',
                  icon: <HiShieldCheck className="text-lg" />
                })}

                {renderInput({
                  id: 'password-nueva',
                  label: 'Nueva contraseña',
                  type: 'password',
                  value: passwords.nueva,
                  onChange: handleInputPassword('nueva'),
                  placeholder: '••••••••',
                  icon: <HiKey className="text-lg" />
                })}

                {renderInput({
                  id: 'password-confirmar',
                  label: 'Confirmar nueva contraseña',
                  type: 'password',
                  value: passwords.confirmar,
                  onChange: handleInputPassword('confirmar'),
                  placeholder: '••••••••',
                  icon: <HiKey className="text-lg" />
                })}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    color="primary"
                    className="h-12 flex-1 font-bold"
                    onPress={handleResetPassword}
                    isLoading={loading}
                  >
                    Restablecer contraseña
                  </Button>
                  <Button
                    variant="flat"
                    className="h-12 flex-1 font-bold"
                    onPress={() => setStep('request')}
                    isDisabled={loading}
                  >
                    Volver al correo
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
              Si ya recuerdas tu contraseña, puedes volver al inicio de sesión sin completar este flujo.
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
