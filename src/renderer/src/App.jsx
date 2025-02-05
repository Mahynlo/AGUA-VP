import Versions from './components/Versions'
import React, { useState } from "react";
import SidebarApp from './components/menuElements/sidebar'
import NavbarApp from './components/menuElements/navbar'
import InicioVista from './components/vistas/InicioVista';
import Clientes from './components/vistas/clientes/ClientesVista';
import Historial from './components/vistas/HistorialVista';
import Ayuda from './components/vistas/AyudaVista';
import Resibos from './components/vistas/ResibosVista';
import Impresion from './components/vistas/ImpresionVista';
import LoginApp from './components/login/login';
import PerfilPage from './components/perfil/perfilpage';
import NotFoundVista from './components/vistas/NotFoundVista';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import { CustomTitleBar } from './TitleBar';
function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <main className='dark:bg-gray-900 '> 
        <Router>
          <SidebarApp />      
          <NavbarApp />
          <Routes>
            <Route path="/" element={<InicioVista />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/resibos" element={<Resibos />} />
            <Route path="/impresion" element={<Impresion />} />
            <Route path="/ayuda" element={<Ayuda />} />
            <Route path='/perfil' element={<PerfilPage />} />
            <Route path='*' element={<NotFoundVista />} />
          </Routes>
        </Router>
      </main>
    </>
  )
}

export default App;

