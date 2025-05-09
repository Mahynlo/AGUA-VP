import React from "react";
import { HashRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import NavbarApp from './components/menuElements/navbar';
import SidebarApp from './components/menuElements/sidebar';
import InicioVista from './components/vistas/InicioVista';
import Clientes from './components/vistas/clientes/ClientesVista';
import Historial from './components/vistas/HistorialVista';
import Ayuda from './components/vistas/AyudaVista';
import Resibos from './components/vistas/ResibosVista';
import Impresion from './components/vistas/ImpresionVista';
import LoginApp from './components/login/login';
import PerfilPage from './components/perfil/perfilpage';
import NotFoundVista from './components/vistas/NotFoundVista';
import { ClientesProvider } from './context/ClientesContext';
import { MedidoresProvider } from './context/MedidoresContext';
import RegistroApp from "./components/registroUsuarios/Registro";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./ProtectedRoutes/ProtectedRoute";
import Medidores from "./components/vistas/medidores/MedidoresVista";
import Administrador from "./components/administrador/Administrador";
import RecuperarPassword from "./components/AdministrarPassword/Recuperacion";
import Pagos from "./components/vistas/PagosVista";
import Lecturas from "./components/vistas/LecturasVista";
import Tarifas from "./components/vistas/TarifasVista";
//Impresion de recibos
import Recibo from "./components/recibo/Recibo";
import ReporteLecturas from "./components/recibo/ReporteLecturas";
function App() {
  return (
    <Router>
      <AuthProvider>
        <ClientesProvider>
          <MedidoresProvider>
            <MainApp /> {/* Solo aquí */}
          </MedidoresProvider>
        </ClientesProvider>
      </AuthProvider>
    </Router>
  );
}


function MainApp() {
  const location = useLocation(); 
  const hideSidebarRoutes = ['/', '/registro', '/recuperarPassword', '/recibo','/reporteLecturas']; // Rutas donde no se muestra el sidebar 
  const hideNavbarRoutes = ['/recibo','/reporteLecturas']; // Rutas donde no se muestra el navbar

  return (
    <main className='dark:bg-gray-900 bg-gray-200 h-[calc(100vh-4rem)]'>

      {/* Navbar solo si no está en rutas ocultas */}
      {!hideNavbarRoutes.includes(location.pathname) && <NavbarApp />}

      {/* Sidebar solo si no está en rutas ocultas */}
      {!hideSidebarRoutes.includes(location.pathname) && <SidebarApp />}

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
        <Route path="/recibo" element={<Recibo />} /> {/* protegida pero sin nav ni sidebar */}
        <Route path="/reporteLecturas" element={<ReporteLecturas />} /> {/* protegida pero sin nav ni sidebar */}
        {/* Rutas públicas */}
        <Route path='/' element={<LoginApp />} />
        <Route path='/registro' element={<RegistroApp />} />
        <Route path='/recuperarPassword' element={<RecuperarPassword />} />
        <Route path='*' element={<NotFoundVista />} />
      </Routes>
    </main>
  );
}


export default App;

