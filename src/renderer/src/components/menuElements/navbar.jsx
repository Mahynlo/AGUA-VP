import logoagua from '../../assets/images/logo_login.png'
import { Link } from 'react-router-dom';
import { Config } from '../Configuracion/Config';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Tooltip } from "@nextui-org/react";
import AvatarPerfil from '../../assets/images/Avatar.png'
import { useLocation } from 'react-router-dom';
import { Button, Modal } from "flowbite-react";
import { useState } from "react";
import { CloseAppModal } from '../../IconsApp/IconsSidebar';
import { useAuth } from  '../../context/AuthContext';
import { CerrarSeccionIcon } from '../../IconsApp/IconsSidebar';

function NavbarApp() {
  const location = useLocation(); // Hook para obtener la ruta actual
  const [openModal, setOpenModal] = useState(false);
  const { logout,user } = useAuth();

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
      <nav className="fixed top-0 z-50 w-full  bg-blue-600 border-b border-blue-200 dark:bg-blue-800 dark:border-blue-700  overflow-hidden" style={{
        WebkitAppRegion: "drag", // Hace que el área sea arrastrable
      }}>
        <div className="px-3 py-2 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start rtl:justify-end">
              <button data-drawer-target="logo-sidebar" data-drawer-toggle="logo-sidebar" aria-controls="logo-sidebar" type="button" className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                <span className="sr-only">Open sidebar</span>
                <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path clip-rule="evenodd" fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
                </svg>
              </button>
              <a className="flex ms-2 md:me-24">
                <img src={logoagua} className="h-12 me-3" alt="Logo Agua" />
                <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-white">AGUA-VP</span>
              </a>
            </div>

            <div className="flex items-center justify-end flex space-x-4 " style={{
              WebkitAppRegion: "no-drag", // Evita que los botones sean arrastrables
            }}>


              {location.pathname !== '/' &&  location.pathname !== '/registro' &&  location.pathname !== '/recuperarPassword' &&
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
                        <DropdownMenu aria-label="Profile Actions" variant="flat" >
                          <DropdownItem key="profile" className="h-14 gap-2" textValue="Perfil" color="default" as={Link} to="/perfil">
                            <p className="font-semibold"></p>
                            <p className="font-semibold" ><span>{user && user.correo}</span> </p>
                          </DropdownItem>
                          <DropdownItem key="settings" color="primary" as={Link} to="/perfil">Mi Perfil</DropdownItem>
                          {user?.rol === 'superadmin' && // Si el usuario es superadmin muestra el botón de configuraciones
                            <DropdownItem key="configurations" color="primary" as={Link} to="/administrador">Permisos de administrador</DropdownItem>
                          }
                          
                          <DropdownItem key="help_and_feedback" color="primary" as={Link} to="/ayuda" >Ayuda</DropdownItem>
                          <DropdownItem key="logout" color="danger" onPress={logout} >
                            Cerrar Sesion 
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
              <div className="flex items-center space-x-1 text-gray-200">
                <Tooltip content="Minimizar" color="default" delay={2000}>
                  <button
                    onClick={handleMinimize}
                    className="hover:bg-teal-600 p-2"
                    aria-label="Minimizar ventana"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-minus"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /></svg>
                  </button>
                </Tooltip>
                <Tooltip content="Minimiz.Tamaño" delay={2000}>
                  <button
                    onClick={handleMaximize}
                    className="hover:bg-teal-600 p-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-square"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 3m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /></svg>
                  </button>
                </Tooltip>
                <Tooltip content="Cerar" color="danger" delay={2000}>
                  <button
                    onClick={() => setOpenModal(true)}

                    className="hover:bg-red-600 p-2 "
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>

                  </button>
                </Tooltip>

                <Modal show={openModal} size="md" onClose={() => setOpenModal(false)} popup>
                  <Modal.Header />
                  <Modal.Body>
                    <div className="text-center">
                      <CloseAppModal/>
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