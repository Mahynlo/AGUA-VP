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
import { CustomTitleBar } from './TitleBar';

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

function MainApp() {
  const location = useLocation(); // Hook para obtener la ruta actual

  return (
    <main className='dark:bg-gray-900 bg-gray-200 '>
      <NavbarApp />
      {/* Solo mostramos el Sidebar si no estamos en la ruta de Login */}
      {location.pathname !== '/' && <SidebarApp />}
        
      <Routes>
        <Route path="/home" element={<InicioVista />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/resibos" element={<Resibos />} />
        <Route path="/impresion" element={<Impresion />} />
        <Route path="/ayuda" element={<Ayuda />} />
        <Route path='/perfil' element={<PerfilPage />} />
        <Route path='/' element={<LoginApp />} />
        <Route path='*' element={<NotFoundVista />} />
      </Routes>
    </main>
  );
}

export default App;

