import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Tooltip } from "@nextui-org/react";
import { Modal, Button } from "flowbite-react";
import { VscChromeMinimize, VscChromeMaximize, VscChromeClose } from "react-icons/vsc";
import { HiOutlineLogout, HiOutlineQuestionMarkCircle, HiOutlineCog, HiOutlineUser, HiMenuAlt2 } from "react-icons/hi";

import { useAuth } from '../../context/AuthContext';
import { Config } from '../Configuracion/Config';
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
    inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-md w-full"
  },
  header: {
    base: "hidden",
    close: { base: "hidden", icon: "hidden" }
  },
  body: { base: "pt-12 pb-6 px-6 flex-1 overflow-y-auto bg-transparent" }
};

function NavbarApp() {
  const { logoSrc } = useAppLogo();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estados independientes para cada modal
  const [openCloseAppModal, setOpenCloseAppModal] = useState(false); // Para cerrar la ventana
  const [openLogoutModal, setOpenLogoutModal] = useState(false); // Para cerrar la sesión

  const { logout, user } = useAuth();

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

  const handleNavigation = (path, sectionName) => {
    try {
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

  // Ocultar elementos si estamos en el login
  const isAuthRoute = location.pathname === '/' || location.pathname === '/registro' || location.pathname === '/recuperarPassword';

  return (
    <>
      <nav 
        className="fixed top-0 z-[10000] w-full h-16 bg-blue-600 dark:bg-blue-800 border-b border-blue-700 dark:border-blue-900 transition-colors shadow-lg"
        style={{ WebkitAppRegion: "drag" }}
      >
        <div className="flex items-center justify-between h-full pl-4 pr-0">
          
          {/* ── LADO IZQUIERDO ── */}
          <div className="flex items-center justify-start gap-3">
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

            <div className="flex items-center gap-3 pointer-events-none select-none">
              <img src={logoSrc} className="h-11 w-auto drop-shadow-md" alt="Logo" />
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white hidden sm:block leading-none">
                  AGUA DE VILLA PESQUEIRA
                </span>
                <span className="text-[10px] font-bold text-blue-100 hidden sm:block uppercase tracking-widest mt-1">
                  SISTEMA DE AGUA POTABLE
                </span>
              </div>
            </div>
          </div>

          {/* ── LADO DERECHO ── */}
          <div className="flex items-center h-full" style={{ WebkitAppRegion: "no-drag" }}>
            
            {!isAuthRoute && (
              <div className="flex items-center gap-3 pr-4 border-r border-white/10 h-10 mr-2">
                
                <Config />
                
                <Dropdown placement="bottom-end" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl min-w-[240px]">
                  <DropdownTrigger>
                    <button className="flex items-center outline-none transition-transform hover:scale-105 active:scale-95">
                      <Avatar
                        isBordered
                        color="primary"
                        className="w-9 h-9 border-2 border-white/80 shadow"
                        src={avatarSrc || AvatarPerfil}
                      />
                    </button>
                  </DropdownTrigger>
                  
                  <DropdownMenu aria-label="Acciones de perfil" itemClasses={{ base: "rounded-lg" }}>
                    <DropdownItem
                      key="profile"
                      className="h-16 gap-2 opacity-100 mb-2 pointer-events-none"
                      textValue="Perfil"
                    >
                      <div className="flex items-center gap-3 p-1 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-inner w-full">
                          <Avatar src={avatarSrc || AvatarPerfil} size="sm" className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-slate-800 dark:text-zinc-100 truncate">{user?.nombre || "Usuario"}</p>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                                {user?.correo || "Sin correo"}
                            </p>
                          </div>
                      </div>
                    </DropdownItem>

                    <DropdownItem
                      key="settings"
                      startContent={<HiOutlineUser className="text-lg text-slate-400" />}
                      onPress={() => handleNavigation("/perfil", "Mi Perfil")}
                      className="hover:bg-slate-50 dark:hover:bg-zinc-800"
                    >
                      <span className="font-semibold text-slate-700 dark:text-zinc-300 text-sm">Mi Perfil</span>
                    </DropdownItem>

                    {['superadmin', 'administrador'].includes(user?.rol) && (
                      <DropdownItem
                        key="configurations"
                        startContent={<HiOutlineCog className="text-lg text-slate-400" />}
                        onPress={() => handleNavigation("/administrador", "Administrador")}
                        className="hover:bg-slate-50 dark:hover:bg-zinc-800"
                      >
                        <span className="font-semibold text-slate-700 dark:text-zinc-300 text-sm">Panel de Administrador</span>
                      </DropdownItem>
                    )}

                    <DropdownItem
                      key="help"
                      startContent={<HiOutlineQuestionMarkCircle className="text-lg text-slate-400" />}
                      onPress={() => handleNavigation("/ayuda", "Centro de Ayuda")}
                      className="hover:bg-slate-50 dark:hover:bg-zinc-800"
                    >
                      <span className="font-semibold text-slate-700 dark:text-zinc-300 text-sm">Centro de Ayuda</span>
                    </DropdownItem>

                    {/* AQUI DISPARAMOS EL MODAL EN LUGAR DE CERRAR SESIÓN DIRECTO */}
                    <DropdownItem
                      key="logout"
                      color="danger"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 mt-2 border-t border-slate-100 dark:border-zinc-800 pt-2 rounded-t-none"
                      startContent={<HiOutlineLogout className="text-lg" />}
                      onPress={() => setOpenLogoutModal(true)}
                    >
                      <span className="font-bold text-sm">Cerrar Sesión</span>
                    </DropdownItem>

                  </DropdownMenu>
                </Dropdown>
              </div>
            )}

            {/* Botones de Ventana */}
            <div className="flex h-full text-white/90">
              <button
                onClick={handleMinimize}
                className="h-full w-12 flex items-center justify-center hover:bg-white/10 transition-colors focus:outline-none"
                title="Minimizar"
              >
                <VscChromeMinimize size={16} />
              </button>

              <button
                onClick={handleMaximize}
                className="h-full w-12 flex items-center justify-center hover:bg-white/10 transition-colors focus:outline-none"
                title="Maximizar"
              >
                <VscChromeMaximize size={16} />
              </button>

              <button
                onClick={() => setOpenCloseAppModal(true)}
                className="h-full w-12 flex items-center justify-center hover:bg-red-600 transition-colors focus:outline-none"
                title="Cerrar App"
              >
                <VscChromeClose size={16} />
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
        <Modal.Header />
        <Modal.Body>
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineLogout className="w-8 h-8" />
            </div>
            <h3 className="mb-2 text-base font-black text-slate-800 dark:text-zinc-100">
              ¿Cerrar Sesión?
            </h3>
            <p className="mb-6 text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Tendrás que volver a ingresar tus credenciales para acceder a tu panel de administración.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                color="warning"
                onClick={handleLogout}
                className="font-bold h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
              >
                Sí, cerrar sesión
              </Button>
              <Button
                color="gray"
                onClick={() => setOpenLogoutModal(false)}
                className="font-bold h-11 rounded-xl text-slate-500"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* ── 2. MODAL: CONFIRMAR CERRAR APLICACIÓN DE ESCRITORIO ── */}
      <Modal
        show={openCloseAppModal}
        onClose={() => setOpenCloseAppModal(false)}
        size="md"
        popup
        theme={confirmModalTheme}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CloseAppModal className="w-8 h-8" />
            </div>
            <h3 className="mb-2 text-base font-black text-slate-800 dark:text-zinc-100">
              ¿Cerrar AGUA-VP?
            </h3>
            <p className="mb-6 text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Estás a punto de salir del sistema. Se perderán los cambios que no se hayan guardado.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                color="failure"
                onClick={handleClose}
                className="font-bold h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                Sí, salir del sistema
              </Button>
              <Button
                color="gray"
                onClick={() => setOpenCloseAppModal(false)}
                className="font-bold h-11 rounded-xl text-slate-500"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default NavbarApp;