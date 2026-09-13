import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from "react";
import { Avatar } from "@heroui/react";
import { Modal, ModalHeader, ModalBody } from "flowbite-react";
import { VscChromeMinimize, VscChromeMaximize, VscChromeClose } from "react-icons/vsc";
import { HiOutlineLogout, HiOutlineQuestionMarkCircle, HiOutlineCog, HiOutlineUser, HiMenuAlt2 } from "react-icons/hi";

import { useAuth } from '../../context/AuthContext';
import { Config } from '../Configuracion/Config';
import BotonActualizacionesNavbar from './BotonActualizacionesNavbar';
import { CloseAppModal } from '../../IconsApp/IconsAppSystem';

import { useAppLogo } from '../../context/LogoContext';
import AvatarPerfil from '../../assets/images/Avatar.png';

const confirmModalTheme = {
  root: {
    base: "fixed top-0 right-0 left-0 z-[100002] h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
    show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" }
  },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-md w-full overflow-hidden"
  },
  header: {
    base: "hidden",
    close: { base: "hidden", icon: "hidden" }
  },
  body: { base: "pt-8 pb-6 px-6 flex-1 overflow-y-auto bg-transparent" }
};

const ROL_CONFIG = {
  superadmin: {
    label: "Superadmin",
    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50",
    dot: "bg-purple-500",
  },
  administrador: {
    label: "Administrador",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50",
    dot: "bg-blue-500",
  },
  operador: {
    label: "Operador",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50",
    dot: "bg-amber-500",
  },
  cajero: {
    label: "Cajero",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
    dot: "bg-emerald-500",
  },
};

function NavbarApp() {
  const { logoSrc } = useAppLogo();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estados independientes para cada modal
  const [openCloseAppModal, setOpenCloseAppModal] = useState(false); // Para cerrar la ventana
  const [openLogoutModal, setOpenLogoutModal] = useState(false); // Para cerrar la sesión
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const { logout, user, isAuthenticated } = useAuth();

  const avatarKey = user?.id ? `user_avatar_${user.id}` : null;
  const [avatarSrc, setAvatarSrc] = useState(() =>
    avatarKey ? localStorage.getItem(avatarKey) || null : null
  );

  useEffect(() => {
    if (!avatarKey) return;
    setAvatarSrc(localStorage.getItem(avatarKey) || null);
    const handler = () => setAvatarSrc(localStorage.getItem(avatarKey) || null);
    window.addEventListener('user-avatar-changed', handler);
    return () => window.removeEventListener('user-avatar-changed', handler);
  }, [avatarKey]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigation = (path, sectionName) => {
    try {
      setIsProfileOpen(false);
      navigate(path);
    } catch (error) {
      console.error(`❌ Error navegando a ${sectionName}:`, error);
    }
  };

  const handleLogout = async () => {
    try {
      setOpenLogoutModal(false); // Cerramos el modal
      await logout();
    } catch (error) {
      navigate('/');
    }
  };

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();

  const rolInfo = ROL_CONFIG[user?.rol] || {
    label: user?.rol || "Usuario",
    badge: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700",
    dot: "bg-slate-400",
  };

  return (
    <>
      <nav 
        className="fixed top-0 z-[10000] w-full h-16 bg-blue-600 dark:bg-blue-700 border-b border-blue-700 dark:border-blue-800 transition-colors shadow-sm select-none"
        style={{ WebkitAppRegion: "drag" }}
      >
        <div className="flex items-center justify-between h-full pl-4 pr-0">
          
          {/* ── LADO IZQUIERDO: LOGO E IDENTIDAD ── */}
          <div className="flex items-center justify-start gap-3">
            {isAuthenticated() && (
              <button 
                data-drawer-target="logo-sidebar" 
                data-drawer-toggle="logo-sidebar" 
                type="button" 
                className="inline-flex items-center p-2 text-sm text-white/80 rounded-lg sm:hidden hover:bg-white/10 focus:outline-none transition-colors"
                style={{ WebkitAppRegion: "no-drag" }}
              >
                <span className="sr-only">Abrir menú</span>
                <HiMenuAlt2 className="w-6 h-6" />
              </button>
            )}

            <div className="flex items-center gap-3 pointer-events-none select-none">
              <img src={logoSrc} className="h-10 w-auto drop-shadow-md" alt="Logo" />
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-black tracking-tight text-white hidden sm:block leading-tight">
                  AGUA DE VILLA PESQUEIRA
                </span>
                <span className="text-[9px] font-bold text-blue-100 hidden sm:block uppercase tracking-widest">
                  SISTEMA DE AGUA POTABLE
                </span>
              </div>
            </div>
          </div>

          {/* ── LADO DERECHO: UTILIDADES Y CONTROLES ── */}
          <div className="flex items-center h-full" style={{ WebkitAppRegion: "no-drag" }}>
            
            <div className="flex items-center gap-2 pr-3 border-r border-white/20 h-10 mr-1">
              <BotonActualizacionesNavbar />
              <Config />
              
              {isAuthenticated() && (
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    className="flex items-center outline-none transition-transform hover:scale-105 active:scale-95 ml-1"
                    aria-label="Menú de perfil"
                  >
                    <Avatar
                      color="primary"
                      className="w-9 h-9 border-2 border-white/90 shadow-sm"
                      src={avatarSrc || AvatarPerfil}
                    />
                  </button>
                  
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl min-w-[250px] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="h-auto py-1 opacity-100 mb-1 pointer-events-none">
                        <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800 w-full">
                          <Avatar src={avatarSrc || AvatarPerfil} size="sm" className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-slate-800 dark:text-zinc-100 truncate leading-tight">
                              {user?.nombre || "Usuario"}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${rolInfo.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${rolInfo.dot}`} />
                                {rolInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleNavigation("/perfil", "Mi Perfil")}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 rounded-xl text-left transition-colors"
                      >
                        <HiOutlineUser className="text-lg text-slate-400" />
                        <span className="font-semibold text-slate-700 dark:text-zinc-300 text-sm">Mi Perfil</span>
                      </button>

                      {['superadmin', 'administrador', 'operador'].includes(user?.rol) && (
                        <button
                          onClick={() => handleNavigation("/administrador", "Administrador")}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 rounded-xl text-left transition-colors"
                        >
                          <HiOutlineCog className="text-lg text-slate-400" />
                          <span className="font-semibold text-slate-700 dark:text-zinc-300 text-sm">Panel de Administrador</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          if (window.docsApp?.openHelpWindow) {
                            window.docsApp.openHelpWindow();
                          } else {
                            handleNavigation("/ayuda", "Centro de Ayuda");
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/80 rounded-xl text-left transition-colors"
                      >
                        <HiOutlineQuestionMarkCircle className="text-lg text-slate-400" />
                        <span className="font-semibold text-slate-700 dark:text-zinc-300 text-sm">Centro de Ayuda</span>
                      </button>

                      {/* DISPARADOR DE MODAL CERRAR SESIÓN */}
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setOpenLogoutModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 mt-1 border-t border-slate-100 dark:border-zinc-800 pt-2 rounded-t-none rounded-b-xl text-left transition-colors"
                      >
                        <HiOutlineLogout className="text-lg" />
                        <span className="font-bold text-sm">Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── BOTONES DE CONTROL DE VENTANA (ELECTRON) ── */}
            <div className="flex h-full text-white/90">
              <button
                onClick={handleMinimize}
                className="h-full w-12 flex items-center justify-center hover:bg-white/15 transition-colors focus:outline-none active:bg-white/25"
                title="Minimizar"
              >
                <VscChromeMinimize size={15} />
              </button>

              <button
                onClick={handleMaximize}
                className="h-full w-12 flex items-center justify-center hover:bg-white/15 transition-colors focus:outline-none active:bg-white/25"
                title="Maximizar"
              >
                <VscChromeMaximize size={15} />
              </button>

              <button
                onClick={() => setOpenCloseAppModal(true)}
                className="h-full w-12 flex items-center justify-center hover:bg-rose-600 active:bg-rose-700 transition-colors focus:outline-none"
                title="Cerrar AGUA-VP"
              >
                <VscChromeClose size={15} />
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── 1. MODAL: CONFIRMAR CERRAR SESIÓN ── */}
      <Modal
        show={openLogoutModal}
        onClose={() => setOpenLogoutModal(false)}
        size="md"
        popup
        theme={confirmModalTheme}
      >
        <ModalHeader />
        <ModalBody>
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HiOutlineLogout className="w-7 h-7" />
            </div>
            <h3 className="mb-2 text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100">
              ¿Cerrar Sesión?
            </h3>
            <p className="mb-6 text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Tendrás que volver a ingresar tus credenciales para acceder a tu panel de administración.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleLogout}
                className="font-black h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-transform active:scale-95 text-xs uppercase tracking-wider cursor-pointer"
              >
                Sí, cerrar sesión
              </button>
              <button
                onClick={() => setOpenLogoutModal(false)}
                className="font-bold h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </ModalBody>
      </Modal>

      {/* ── 2. MODAL: CONFIRMAR CERRAR APLICACIÓN DE ESCRITORIO ── */}
      <Modal
        show={openCloseAppModal}
        onClose={() => setOpenCloseAppModal(false)}
        size="md"
        popup
        theme={confirmModalTheme}
      >
        <ModalHeader />
        <ModalBody>
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CloseAppModal className="w-7 h-7" />
            </div>
            <h3 className="mb-2 text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100">
              ¿Cerrar AGUA-VP?
            </h3>
            <p className="mb-6 text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Estás a punto de salir del sistema. Se perderán los cambios que no se hayan guardado.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleClose}
                className="font-black h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-transform active:scale-95 text-xs uppercase tracking-wider cursor-pointer"
              >
                Sí, salir del sistema
              </button>
              <button
                onClick={() => setOpenCloseAppModal(false)}
                className="font-bold h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </>
  );
}

export default NavbarApp;