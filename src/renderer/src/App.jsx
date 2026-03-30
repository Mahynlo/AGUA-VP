import React from "react";
import { HashRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { LogoProvider } from './context/LogoContext';

//Vista de navegación y rutas
import NavbarApp from './components/menuElements/navbar';
import SidebarApp from './components/menuElements/sidebar';

//vistas y paginas Principales de la aplicación
import InicioVista from './components/vistas/InicioVista';
import Clientes from './components/vistas/clientes/ClientesVista';
import Historial from './components/vistas/HistorialVista';
import Ayuda from './components/vistas/AyudaVista';
import Resibos from './components/vistas/ResibosVista';
import Impresion from './components/vistas/ImpresionVista';
import LoginApp from './components/login/login';
import PerfilPage from './components/perfil/perfilpage';
import NotFoundVista from './components/vistas/NotFoundVista';

import Medidores from "./components/vistas/medidores/MedidoresVista";
import Administrador from "./components/administrador/Administrador";
import Lecturas from "./components/vistas/LecturasVista";
import Tarifas from "./components/vistas/TarifasVista";
import Pagos from "./components/vistas/PagosVista";

// Contextos de la aplicación para manejar el estado global
import { useAuth } from "./context/AuthContext";
import { ClientesProvider } from './context/ClientesContext';
import { MedidoresProvider } from './context/MedidoresContext';
import { AuthProvider } from "./context/AuthContext";
import { AuthAppProvider } from "./context/appAuthContext";
import { TarifasProvider } from "./context/TarifasContext";
import { RutasProvider } from "./context/RutasContext";
import { FacturasProvider } from "./context/FacturasContext";
import { PagosProvider } from "./context/PagosContext";
import { DeudoresProvider } from "./context/DeudoresContext";
import { UsuariosProvider } from "./context/UsuariosContext";

// Rutas protegidas
import ProtectedRoute from "./ProtectedRoutes/ProtectedRoute";

import RecuperarPassword from "./components/AdministrarPassword/Recuperacion";

//Impresion de recibos
import Recibo from "./components/recibo/Recibo";
import ReporteLecturas from "./components/recibo/ReporteLecturas";
import ReporteClientesCompleto from "./components/recibo/ReporteClientes"
import ComprobantePago from "./components/recibo/ComprobantePago";

// Pantalla de carga de la aplicación
import PantallaCarga from "./components/pantalladecarga/PantallaCarga";

// Modal de bienvenida a la aplicación
import ModalBienvenida from "./components/appBienvenida/ModalBienvenida";
//cargar datos al iniciar sección en la aplicacion 
import InitDataLoader from "./context/InitDataLoader";

import FeedbackMessages from "./components/toast/FeedbackMessages"; // Importar el componente de mensajes de feedback

function App() {
  return (
    <LogoProvider>
    <Router>
      <AuthAppProvider>

        <AuthProvider>

          <ClientesProvider>
            <MedidoresProvider>
              <TarifasProvider>
                <RutasProvider>
                  <FacturasProvider>
                    <PagosProvider>
                      <UsuariosProvider>
                        <DeudoresProvider>

                          <InitDataLoader /> {/* Compoennete de carga de datos al iniciar seccion*/}


                          <MainApp /> {/* Aqui se cargan las rutas de al apalicacion*/}
                          {/* Componente global de mensajes */}
                          <FeedbackMessages position="bottom-right" />

                          <ModalBienvenida /> {/* Modal de bienvenida para obtener token de aplicacion al iniciar */}
                        </DeudoresProvider>
                      </UsuariosProvider>
                    </PagosProvider>

                  </FacturasProvider>
                </RutasProvider>
              </TarifasProvider>
            </MedidoresProvider>
          </ClientesProvider>
        </AuthProvider>
      </AuthAppProvider>

    </Router>
    </LogoProvider>
  );
}


function MainApp() {
  const location = useLocation();
  const hideSidebarRoutes = ['/', '/registro', '/recuperarPassword', '/recibo', '/reporteLecturas', '/reporteClientes', '/comprobante-pago'];
  const hideNavbarRoutes = ['/recibo', '/reporteLecturas', '/reporteClientes', '/comprobante-pago'];

  const { loading } = useAuth();

  // Verificar si estamos en modo impresión
  // Con HashRouter los params van dentro del hash (#/recibo?print=true...), no en window.location.search
  const hashSearch = window.location.hash.includes('?')
    ? window.location.hash.split('?')[1]
    : '';
  const isPrintMode = new URLSearchParams(hashSearch).get('print') === 'true';



  // PERSISTENCIA DE RUTA: Guardar la última ruta visitada
  React.useEffect(() => {
    // Lista de rutas que NO queremos guardar (login, rutas ocultas, etc.)
    const ignoredRoutes = ['/', '/login', '/recuperarPassword', ...hideSidebarRoutes];

    if (!ignoredRoutes.includes(location.pathname) && !isPrintMode) {
      localStorage.setItem('app_last_route', location.pathname);
    }
  }, [location, hideSidebarRoutes, isPrintMode]);

  // CONTROL DE ZOOM MANUAL (DPI AWARENESS)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Detectar Ctrl (Windows) o Command (Mac)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          window.api.zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          window.api.zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          window.api.zoomReset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Si está cargando y NO estamos en modo impresión, mostrar pantalla de carga
  if (loading && !isPrintMode) {
    return <PantallaCarga tiempo={4000} />; // Aquí puedes colocar un componente de carga mientras esperas
  }

  return (
    <main className='dark:bg-gray-900 bg-gray-200 h-[calc(100vh-4rem)]'>

      {/* Navbar solo si no está en rutas ocultas Y no está en modo impresión */}
      {!hideNavbarRoutes.includes(location.pathname) && !isPrintMode && <NavbarApp />}

      {/* Sidebar solo si no está en rutas ocultas Y no está en modo impresión */}
      {!hideSidebarRoutes.includes(location.pathname) && !isPrintMode && <SidebarApp />}

      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<InicioVista />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/resibos/historial" element={<Historial />} />
          <Route path="/resibos" element={<Resibos />} />
          <Route path="/resibos/impresion" element={<Impresion />} />
          <Route path="/resibos/pagos" element={<Pagos />} />
          <Route path="/resibos/lecturas" element={<Lecturas />} />
          <Route path="/resibos/tarifas" element={<Tarifas />} />
          <Route path="/ayuda" element={<Ayuda />} />
          <Route path='/perfil' element={<PerfilPage />} />
          <Route path="/medidores" element={<Medidores />} />
          <Route path="/administrador" element={<Administrador />} />

        </Route>
        <Route path="/recibo" element={<Recibo />} />
        <Route path="/reporteLecturas" element={<ReporteLecturas />} />
        <Route path="/reporteClientes" element={<ReporteClientesCompleto />} />
        <Route path="/comprobante-pago" element={<ComprobantePago />} />
        {/* Rutas públicas */}
        <Route path='/' element={<LoginApp />} />
        <Route path='/recuperarPassword' element={<RecuperarPassword />} />
        <Route path='*' element={<NotFoundVista />} />
      </Routes>
    </main>
  );
}


export default App;

