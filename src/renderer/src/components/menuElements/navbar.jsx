import logoagua from '../../assets/images/Escudo_Villa_Pesqueira_sin_fondo.png'
import { Link, useNavigate } from 'react-router-dom';
import { Config } from '../Configuracion/Config';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Tooltip } from "@nextui-org/react";
import AvatarPerfil from '../../assets/images/Avatar.png'
import { useLocation } from 'react-router-dom';
import { Button, Modal } from "flowbite-react";
import { useState } from "react";
import { CloseAppModal } from '../../IconsApp/IconsAppSystem';
import { useAuth } from '../../context/AuthContext';

import { CerrarSeccionIcon } from '../../IconsApp/IconsSidebar';
import { VscChromeMinimize, VscChromeMaximize, VscChromeClose } from "react-icons/vsc";

function NavbarApp() {
  const location = useLocation(); // Hook para obtener la ruta actual
  const navigate = useNavigate(); // Hook para navegación programática
  const [openModal, setOpenModal] = useState(false);
  const { logout, user } = useAuth();

  // Función mejorada de navegación
  const handleNavigation = (path, sectionName) => {
    try {
      console.log(`🧭 Navegando a ${sectionName}: ${path}`);
      navigate(path);
    } catch (error) {
      console.error(`❌ Error navegando a ${sectionName}:`, error);
    }
  };

  // Función mejorada de logout
  const handleLogout = async () => {
    try {
      console.log("🚪 Iniciando proceso de logout...");
      await logout();
      console.log("✅ Logout completado exitosamente");
    } catch (error) {
      console.error("❌ Error durante logout:", error);
      // Aún así, intentar navegar al login por seguridad
      navigate('/');
    }
  };

  const handleMinimize = () => {
    window.electronAPI.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI.maximize();
  };

  const handleClose = () => {
    window.electronAPI.close();
  };
  return (
    <>
      <nav className="fixed top-0 z-[10000] w-full  bg-blue-600 border-b border-blue-200 dark:bg-blue-800 dark:border-blue-700  overflow-hidden" style={{
        WebkitAppRegion: "drag", // Hace que el área sea arrastrable
      }}>
        <div className="px-3 lg:px-5 lg:pl-3 h-16">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center justify-start rtl:justify-end">
              <button data-drawer-target="logo-sidebar" data-drawer-toggle="logo-sidebar" aria-controls="logo-sidebar" type="button" className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                <span className="sr-only">Open sidebar</span>
                <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path clip-rule="evenodd" fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
                </svg>
              </button>
              <a className="flex ms-2 md:me-24">
                <img src={logoagua} className="h-12 me-3" alt="Logo Agua" />
                <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-white">Agua de Villa Pesqueira</span>
              </a>
            </div>

            <div className="flex items-center justify-end space-x-4 h-full" style={{
              WebkitAppRegion: "no-drag", // Evita que los botones sean arrastrables
            }}>


              {location.pathname !== '/' && location.pathname !== '/registro' && location.pathname !== '/recuperarPassword' &&
                <>

                  <Config />
                  {/*Avatar*/}
                  <Tooltip content="Cuenta" delay={2000}>
                    <div>

                      <Dropdown placement="bottom-end" arrow={false}>
                        <DropdownTrigger>
                          <Avatar
                            isBordered
                            as="button"
                            className="transition-transform"
                            src={AvatarPerfil}
                          />
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Profile Actions" variant="flat">
                          <DropdownItem
                            key="profile"
                            className="h-14 gap-2"
                            textValue="Perfil"
                            color="default"
                            onPress={() => handleNavigation("/perfil", "Perfil")}
                          >
                            <p className="font-semibold">{user && user.nombre}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user && user.correo}
                            </p>
                          </DropdownItem>

                          <DropdownItem
                            key="settings"
                            color="primary"
                            onPress={() => handleNavigation("/perfil", "Mi Perfil")}
                            textValue="Mi Perfil"
                          >
                            Mi Perfil
                          </DropdownItem>

                          {user?.rol === 'superadmin' && (
                            <DropdownItem
                              key="configurations"
                              color="primary"
                              onPress={() => handleNavigation("/administrador", "Administrador")}
                              textValue="Permisos de administrador"
                            >
                              Permisos de administrador
                            </DropdownItem>
                          )}

                          <DropdownItem
                            key="help_and_feedback"
                            color="primary"
                            onPress={() => handleNavigation("/ayuda", "Centro de Ayuda")}
                            textValue="Centro de Ayuda"
                          >
                            Centro de Ayuda
                          </DropdownItem>

                          <DropdownItem
                            key="logout"
                            color="danger"
                            onPress={handleLogout}
                            textValue="Cerrar Sesión"
                          >
                            Cerrar Sesión
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </Tooltip>

                  {/*Linea de separacion*/}
                  <div class="h-10 w-[2px] bg-gray-200"></div>
                </>

              }


              {/* Botones de control */}
              <div className="flex items-center text-gray-200 h-full">
                <Tooltip content="Minimizar" color="default" delay={1000} closeDelay={0}>
                  <button
                    onClick={handleMinimize}
                    className="h-full w-12 flex items-center justify-center hover:bg-white/10 transition-colors rounded-none"
                    aria-label="Minimizar ventana"
                  >
                    <VscChromeMinimize size={16} />
                  </button>
                </Tooltip>

                <Tooltip content="Maximizar" color="default" delay={1000} closeDelay={0}>
                  <button
                    onClick={handleMaximize}
                    className="h-full w-12 flex items-center justify-center hover:bg-white/10 transition-colors rounded-none"
                    aria-label="Maximizar ventana"
                  >
                    <VscChromeMaximize size={16} />
                  </button>
                </Tooltip>

                <Tooltip content="Cerrar" color="danger" delay={1000} closeDelay={0}>
                  <button
                    onClick={() => setOpenModal(true)}
                    className="h-full w-12 flex items-center justify-center hover:bg-red-600 transition-colors rounded-none"
                    aria-label="Cerrar ventana"
                  >
                    <VscChromeClose size={16} />
                  </button>
                </Tooltip>

                <Modal show={openModal} size="md" onClose={() => setOpenModal(false)} popup>
                  <Modal.Header />
                  <Modal.Body>
                    <div className="text-center">
                      <CloseAppModal className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                      <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                        ¿Esta seguro de que desea cerrar la aplicacion?
                      </h3>
                      <div className="flex justify-center gap-4">
                        <Button color="failure" onClick={handleClose}>
                          {"Si"}
                        </Button>
                        <Button color="blue" onClick={() => setOpenModal(false)}>
                          No
                        </Button>
                      </div>
                    </div>
                  </Modal.Body>
                </Modal>

              </div>

            </div>

          </div>
        </div>
      </nav>
    </>

  )
}

export default NavbarApp;