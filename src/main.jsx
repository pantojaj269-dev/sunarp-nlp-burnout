import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import App from './App.jsx';
import DashboardRRHH from './DashboardRRHH.jsx';
import './index.css';

// Un menú de navegación rediseñado como una cabecera profesional
const Navegacion = () => (
  <header className="app-header">
    <div className="header-content-wrapper">
      <nav>
        <NavLink to="/" className="nav-link">
          Vista Trabajador (Captura)
        </NavLink>
        <NavLink to="/admin" className="nav-link">
          Vista RRHH (Dashboard)
        </NavLink>
      </nav>
    </div>
  </header>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Esta barra de navegación solo es para que tú pases de una a otra fácilmente */}
      <Navegacion /> 
      
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<DashboardRRHH />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)