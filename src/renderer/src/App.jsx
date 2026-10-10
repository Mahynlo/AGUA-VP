import React, { Suspense } from "react";
import { HashRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { Spinner } from "@heroui/react";
import { LogoProvider } from './context/LogoContext';

// Vista de navegación y rutas
import NavbarApp from './components/layout/navbar';
import SidebarApp from './components/layout/sidebar';

// Carga directa de la pantalla de inicio de sesión para arranque inmediato
import LoginApp from './vistas/login/LoginVista';

// Vistas y páginas principales con Carga Diferida (Lazy Loading / Code Splitting)
const InicioVista = React.lazy(() => import('./vistas/inicio/InicioVista'));
const Clientes = React.lazy(() => import('./vistas/clientes/ClientesVista'));
const Historial = React.lazy(() => import('./vistas/historial/HistorialVista'));
const Ayuda = React.lazy(() => import('./vistas/ayuda/AyudaVista'));
const Resibos = React.lazy(() => import('./vistas/recibos/ResibosVista'));
const Impresion = React.lazy(() => import('./vistas/impresion/ImpresionVista'));
const PerfilPage = React.lazy(() => import('./vistas/perfil/PerfilVista'));
const NotFoundVista = React.lazy(() => import('./vistas/notFound/NotFoundVista'));
const ActualizacionesVista = React.lazy(() => import('./vistas/actualizaciones/ActualizacionesVista'));

const Medidores = React.lazy(() => import("./vistas/medidores/MedidoresVista"));
const Administrador = React.lazy(() => import("./vistas/administrador/AdministradorVista"));
const Lecturas = React.lazy(() => import("./vistas/lecturas/LecturasVista"));
const Tarifas = React.lazy(() => import("./vistas/tarifas/TarifasVista"));
const Pagos = React.lazy(() => import("./vistas/pagos/PagosVista"));

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
import { PermissionsProvider } from "./context/PermissionsContext";
import { DashboardProvider } from "./context/DashboardContext";
import { ReportesProvider } from "./context/ReportesContext";

// Rutas protegidas
import ProtectedRoute from "./ProtectedRoutes/ProtectedRoute";

const RecuperarPassword = React.lazy(() => import("./vistas/recuperarPassword/RecuperacionVista"));

// Impresión de recibos y reportes (Lazy Loading de módulos pesados)
const Recibo = React.lazy(() => import("./vistas/documentos/Recibo"));
const ReporteLecturas = React.lazy(() => import("./vistas/documentos/ReporteLecturas"));
const ReporteLecturasMetricas = React.lazy(() => import("./vistas/documentos/ReporteLecturasMetricas"));
const ReporteClientesCompleto = React.lazy(() => import("./vistas/documentos/ReporteClientes"));
const ComprobantePago = React.lazy(() => import("./vistas/documentos/ComprobantePago"));
const ReporteFinancieroPagos = React.lazy(() => import("./vistas/documentos/ReporteFinancieroPagos"));
const ReporteDeudoresMayores = React.lazy(() => import("./vistas/documentos/ReporteDeudoresMayores"));
const ReporteDocumentacion = React.lazy(() => import("./vistas/documentos/ReporteDocumentacion"));
const ReporteGeneral = React.lazy(() => import("./vistas/documentos/ReporteGeneral"));

// Pantalla de carga de la aplicación
import PantallaCarga from "./components/carga/PantallaCarga";

// Modal de bienvenida a la aplicación
import ModalBienvenida from "./components/bienvenida/ModalBienvenida";
import ModalActualizacionDisponible from "./components/actualizaciones/ModalActualizacionDisponible";
//cargar datos al iniciar sección en la aplicacion 
import InitDataLoader from "./context/InitDataLoader";

import FeedbackMessages from "./components/feedback/FeedbackMessages"; // Importar el componente de mensajes de feedback
import AlertaSincronizacion from "./components/feedback/AlertaSincronizacion";

function App() {
  return (
    <LogoProvider>
    <Router>
      <AuthAppProvider>

        <AuthProvider>
          <PermissionsProvider>
            <DashboardProvider>
              <ReportesProvider>
                <ClientesProvider>
                  <MedidoresProvider>
                    <TarifasProvider>
                      <RutasProvider>
                        <FacturasProvider>
                          <PagosProvider>
                            <UsuariosProvider>
                              <DeudoresProvider>

                                <InitDataLoader /> {/* Componente de carga de datos al iniciar sesión */}

                                <MainApp /> {/* Aqui se cargan las rutas de la aplicacion */}
                                {/* Componente global de mensajes */}
                                <FeedbackMessages position="bottom-right" />
                                <AlertaSincronizacion /> {/* Avisos de fallo de la copia en la nube (solo administradores) */}

                                <ModalBienvenida /> {/* Modal de bienvenida para obtener token de aplicacion al iniciar */}
                                <ModalActualizacionDisponible /> {/* Modal global para alertar actualizaciones disponibles */}
                              </DeudoresProvider>
                            </UsuariosProvider>
                          </PagosProvider>
                        </FacturasProvider>
                      </RutasProvider>
                    </TarifasProvider>
                  </MedidoresProvider>
                </ClientesProvider>
              </ReportesProvider>
            </DashboardProvider>
          </PermissionsProvider>
        </AuthProvider>
      </AuthAppProvider>

    </Router>
    </LogoProvider>
  );
}


function ViewFallback() {
  return (
    <div className="flex-1 w-full h-full min-h-[350px] flex flex-col items-center justify-center gap-3 bg-transparent">
      <Spinner size="lg" color="primary" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 animate-pulse">
        Cargando módulo...
      </span>
    </div>
  );
}

function MainApp() {
  const location = useLocation();
  const hideSidebarRoutes = ['/', '/registro', '/recuperarPassword', '/recibo', '/reporteLecturas', '/reporteLecturasMetricas', '/reporteClientes', '/comprobante-pago', '/reporteFinancieroPagos', '/reporteDeudoresMayores', '/reporteDocumentacion', '/reporteGeneral', '/ayuda'];
  const hideNavbarRoutes = ['/recibo', '/reporteLecturas', '/reporteLecturasMetricas', '/reporteClientes', '/comprobante-pago', '/reporteFinancieroPagos', '/reporteDeudoresMayores', '/reporteDocumentacion', '/reporteGeneral', '/ayuda'];

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

  // PREVENCIÓN DE ZOOM ACCIDENTAL (TECLADO Y RUEDA DE RATÓN)
  // La escala de la pantalla se gestiona exclusivamente desde el panel de Configuración.
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Bloquear atajos nativos de zoom de Chromium (Ctrl +, Ctrl -, Ctrl 0)
      if (e.ctrlKey || e.metaKey) {
        if (
          e.key === '=' ||
          e.key === '+' ||
          e.key === '-' ||
          e.key === '0' ||
          e.code === 'NumpadAdd' ||
          e.code === 'NumpadSubtract' ||
          e.code === 'Numpad0'
        ) {
          e.preventDefault();
        }
      }
    };

    const handleWheel = (e) => {
      // Bloquear completamente cualquier zoom accidental de Chromium con Ctrl + rueda de ratón
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Si está cargando y NO estamos en modo impresión ni en ayuda, mostrar pantalla de carga
  if (loading && !isPrintMode && location.pathname !== '/ayuda') {
    return <PantallaCarga tiempo={4000} />; // Aquí puedes colocar un componente de carga mientras esperas
  }

  return (
    <main className={isPrintMode ? 'bg-white h-auto overflow-visible min-h-0' : 'bg-slate-50 dark:bg-zinc-950 h-screen overflow-hidden'}>

      {/* Navbar solo si no está en rutas ocultas Y no está en modo impresión */}
      {!hideNavbarRoutes.includes(location.pathname) && !isPrintMode && <NavbarApp />}

      {/* Sidebar solo si no está en rutas ocultas Y no está en modo impresión */}
      {!hideSidebarRoutes.includes(location.pathname) && !isPrintMode && <SidebarApp />}

      <Suspense fallback={<ViewFallback />}>
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
            <Route path='/perfil' element={<PerfilPage />} />
            <Route path="/medidores" element={<Medidores />} />
            <Route path="/administrador" element={<Administrador />} />

          </Route>
          <Route path="/ayuda" element={<Ayuda />} />
          <Route path="/recibo" element={<Recibo />} />
          <Route path="/reporteLecturas" element={<ReporteLecturas />} />
          <Route path="/reporteLecturasMetricas" element={<ReporteLecturasMetricas />} />
          <Route path="/reporteClientes" element={<ReporteClientesCompleto />} />
          <Route path="/comprobante-pago" element={<ComprobantePago />} />
          <Route path="/reporteFinancieroPagos" element={<ReporteFinancieroPagos />} />
          <Route path="/reporteDeudoresMayores" element={<ReporteDeudoresMayores />} />
          <Route path="/reporteDocumentacion" element={<ReporteDocumentacion />} />
          <Route path="/reporteGeneral" element={<ReporteGeneral />} />
          {/* Rutas públicas */}
          <Route path='/' element={<LoginApp />} />
          <Route path='/actualizaciones' element={<ActualizacionesVista />} />
          <Route path='/recuperarPassword' element={<RecuperarPassword />} />
          <Route path='*' element={<NotFoundVista />} />
        </Routes>
      </Suspense>
    </main>
  );
}


export default App;

