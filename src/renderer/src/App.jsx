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
import RegistroApp from "./components/registroUsuarios/Registro";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./ProtectedRoutes/ProtectedRoute";
import Medidores from "./components/vistas/medidores/MedidoresVista";
import Administrador from "./components/administrador/Administrador";
import RecuperarPassword from "./components/AdministrarPassword/Recuperacion";
function App() {

  return (
    <Router>
      
      <AuthProvider>
      
        <ClientesProvider>
          <NavbarApp />
          <MainApp />
        </ClientesProvider>
      </AuthProvider>
    </Router>
  );
}

function MainApp() {
  const location = useLocation(); // Hook para obtener la ruta actual

  return (
    <main className='dark:bg-gray-900 bg-gray-200 h-[calc(100vh-4rem)]'>
      {/* Solo mostramos el Sidebar si no estamos en la ruta de Login y registro o recuperarPassword */}
      {location.pathname !== '/' && location.pathname !== '/registro' && location.pathname !== '/recuperarPassword' && <SidebarApp/> }

      
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<InicioVista />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/resibos" element={<Resibos />} />
          <Route path="/impresion" element={<Impresion />} />
          <Route path="/ayuda" element={<Ayuda />} />
          <Route path='/perfil' element={<PerfilPage />} />
          <Route path="/medidores" element={<Medidores />} />
          <Route path="/administrador" element={<Administrador />} />
        </Route>
        <Route path='/' element={<LoginApp />} />
        <Route path='/recuperarPassword' element={<RecuperarPassword />} />
        <Route path='/registro' element={<RegistroApp />} />
        <Route path='*' element={<NotFoundVista />} />
      </Routes>
    </main>
  );
}

export default App;

