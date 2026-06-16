import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import App from './App.jsx';
import DashboardRRHH from './DashboardRRHH.jsx';
import './index.css';

// Un menú de navegación muy simple para tu demo
const Navegacion = () => (
  <nav style={{ backgroundColor: '#333', padding: '10px', textAlign: 'center', marginBottom: '20px' }}>
    <Link to="/" style={{ color: 'white', marginRight: '20px', textDecoration: 'none', fontWeight: 'bold' }}>Vista Trabajador (Captura)</Link>
    <Link to="/admin" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Vista RRHH (Dashboard)</Link>
  </nav>
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