import html2pdf from 'html2pdf.js';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import ChatAnalitico from './ChatAnalitico';

function DashboardRRHH() {
  // NUEVO: Estados para el Login
  const [estaLogueado, setEstaLogueado] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [cargandoLogin, setCargandoLogin] = useState(false);

  // Estados originales del Dashboard
  const [areaActiva, setAreaActiva] = useState('global');
  const [datosReales, setDatosReales] = useState([]);
  const [cargando, setCargando] = useState(true);

  // 1. EXTRAER DATOS DE MYSQL AL CARGAR LA PÁGINA
  useEffect(() => {
    // NUEVO: Solo carga los datos pesados si el usuario ya pasó el login
    if (estaLogueado) {
      fetch('http://localhost:3000/api/evaluaciones')
        .then(res => res.json())
        .then(data => {
          setDatosReales(data);
          setCargando(false);
        })
        .catch(err => console.error("Error al cargar datos:", err));
    }
  }, [estaLogueado]);

  // NUEVO: Función que maneja el acceso
  const manejarLogin = async (e) => {
    e.preventDefault();
    setCargandoLogin(true);
    setErrorLogin('');

    try {
      const respuesta = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });

      const datos = await respuesta.json();

      if (datos.success) {
        setEstaLogueado(true); // Se abre la puerta
      } else {
        setErrorLogin(datos.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      // PLAN B DE EMERGENCIA (Para la exposición):
      // Si el backend falla justo mañana, puedes borrar el error y forzar el acceso
      // comentando la línea de setErrorLogin y descomentando setEstaLogueado(true)
      setErrorLogin('Error al conectar con el servidor de autenticación');
      // setEstaLogueado(true); 
    } finally {
      setCargandoLogin(false);
    }
  };

  // NUEVO: PANTALLA DE LOGIN (Si no está logueado, retorna esto y no avanza)
  if (!estaLogueado) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          
          <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>Acceso Restringido</h2>
          <p style={{ color: '#7f8c8d', marginBottom: '30px', fontSize: '0.9rem' }}>Portal de Recursos Humanos - SUNARP</p>
          
          <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="text" 
              placeholder="Usuario" 
              value={usuario} 
              onChange={(e) => setUsuario(e.target.value)} 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '1rem', outline: 'none' }}
              required
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '1rem', outline: 'none' }}
              required
            />
            
            {errorLogin && <div style={{ color: '#e74c3c', fontSize: '0.9rem', backgroundColor: '#fdedf0', padding: '10px', borderRadius: '6px' }}>{errorLogin}</div>}
            
            <button 
              type="submit" 
              disabled={cargandoLogin}
              style={{ padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: cargandoLogin ? '#95a5a6' : '#2980b9', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: cargandoLogin ? 'not-allowed' : 'pointer', marginTop: '10px', transition: 'background-color 0.3s' }}
            >
              {cargandoLogin ? 'Verificando...' : 'Ingresar al Dashboard'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // A PARTIR DE AQUÍ ES TU CÓDIGO ORIGINAL DEL DASHBOARD
  // Pantalla de carga mientras trae los datos (Ya pasó el login)
  if (cargando) {
    return <div style={{ padding: '50px', textAlign: 'center', fontSize: '1.5rem', fontFamily: 'sans-serif', color: '#7f8c8d' }}>⏳ Procesando métricas de la Base de Datos...</div>;
  }

  // 2. MOTOR DE CÁLCULO DINÁMICO
  const datosFiltrados = areaActiva === 'global' 
    ? datosReales 
    : datosReales.filter(item => item.area === areaActiva);

  let kpiBienestar = 0;
  let kpiAgotamiento = 0;
  let riesgo = 'Bajo';
  let comentariosFiltrados = [];

  if (datosFiltrados.length > 0) {
    const sumaBienestar = datosFiltrados.reduce((acc, curr) => acc + ((5 - curr.nivel_animo) * 25), 0);
    kpiBienestar = Math.round(sumaBienestar / datosFiltrados.length);

    const sumaAgotamiento = datosFiltrados.reduce((acc, curr) => acc + ((curr.nivel_animo - 1) * 25), 0);
    kpiAgotamiento = Math.round(sumaAgotamiento / datosFiltrados.length);

    if (kpiBienestar < 50) riesgo = 'Alto';
    else if (kpiBienestar <= 75) riesgo = 'Medio';

    comentariosFiltrados = datosFiltrados
      .filter(item => item.texto && item.texto.trim().length > 0)
      .map(item => ({
        id: item.id,
        texto: item.texto,
        tag: item.tag || 'Pendiente',
        color: item.tag === 'Alerta' ? '#dc3545' : '#3498db'
      }));
  }

  const graficoMaslach = [
    { dimension: 'Agotamiento', nivel: kpiAgotamiento, normal: 30 },
    { dimension: 'Despersonalización', nivel: Math.max(0, kpiAgotamiento - 15), normal: 20 },
    { dimension: 'Realización', nivel: Math.max(0, kpiBienestar - 10), normal: 80 }
  ];

  // 2. AGREGA ESTA FUNCIÓN ANTES DEL RETURN
  const exportarAPDF = () => {
    // Apuntamos al contenedor específico que queremos imprimir
    const elemento = document.getElementById('seccion-reporte-pdf');
    
    // Configuramos los parámetros del documento oficial
    const opciones = {
      margin:       [15, 15, 15, 15], // Márgenes profesionales (arriba, derecha, abajo, izquierda)
      filename:     `Reporte_Bienestar_SUNARP_${areaActiva}_2026.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true }, // Escala 2 para que las gráficas no salgan pixeleadas
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' } // Formato A4 listo para imprimir
    };

    // Ejecuta la conversión y descarga el archivo automáticamente
    html2pdf().from(elemento).set(opciones).save();
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#2c3e50', margin: '0 0 5px 0' }}>Panel Analítico de Bienestar (En Vivo)</h1>
          <p style={{ color: '#7f8c8d', margin: 0 }}>Datos extraídos de MySQL - Total Registros: {datosReales.length}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select 
            value={areaActiva} 
            onChange={(e) => setAreaActiva(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '1rem', outline: 'none' }}
          >
            <option value="global">Vista Global</option>
            <option value="mesa_partes">Mesa de Partes</option>
            <option value="catastro">Catastro</option>
            <option value="registro">Registro de Propiedad</option>
            <option value="asesoria">Asesoría Jurídica</option>
          </select>
          
          {/* NUEVO: Botón de Exportación a PDF */}
          <button 
            onClick={exportarAPDF}
            style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#27ae60', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
          >
            📊 Exportar PDF
          </button>

          {/* Botón para cerrar sesión */}
          <button 
            onClick={() => { setEstaLogueado(false); setUsuario(''); setPassword(''); }}
            style={{ padding: '12px 20px', borderRadius: '8px', border: '1px solid #e74c3c', backgroundColor: 'transparent', color: '#e74c3c', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* NUEVO: CONTENEDOR PARA EL REPORTE PDF */}
      <div id="seccion-reporte-pdf">

        {/* NUEVO: Título institucional (Solo visible en el PDF gracias al CSS) */}
        <div className="solo-visible-pdf" style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#1a365d', margin: '0 0 5px 0' }}>SUPERINTENDENCIA NACIONAL DE LOS REGISTROS PÚBLICOS</h2>
          <h3 style={{ color: '#4a5568', margin: '0', fontSize: '1.1rem' }}>Informe Ejecutivo de Clima Laboral y Prevención de Burnout</h3>
          <p style={{ color: '#718096', fontSize: '0.85rem', marginTop: '5px' }}>Filtro de Consulta: Área {areaActiva.toUpperCase()} | Fecha de Emisión: {new Date().toLocaleDateString()}</p>
          <hr style={{ border: '0', borderTop: '2px solid #1a365d', marginTop: '15px' }} />
        </div>

        {/* ALERTAS DINÁMICAS */}
        {riesgo === 'Alto' && datosFiltrados.length > 0 && (
          <div style={{ backgroundColor: '#fff5f5', borderLeft: '6px solid #e53e3e', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#c53030' }}>⚠️ Alerta Crítica: Bienestar por debajo del 50%</h3>
          </div>
        )}

        {/* KPIs */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: `5px solid ${kpiBienestar > 70 ? '#2ecc71' : '#e74c3c'}` }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#7f8c8d' }}>Índice de Bienestar</h3>
            <h2 style={{ margin: 0, fontSize: '3rem', color: '#2c3e50' }}>{kpiBienestar}%</h2>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#7f8c8d' }}>Participación (Muestras)</h3>
            <h2 style={{ margin: 0, fontSize: '3rem', color: '#2c3e50' }}>{datosFiltrados.length}</h2>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: `5px solid ${riesgo === 'Alto' ? '#e74c3c' : '#2ecc71'}` }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#7f8c8d' }}>Riesgo Actual</h3>
            <h2 style={{ margin: 0, fontSize: '3rem', color: '#2c3e50' }}>{datosFiltrados.length === 0 ? 'S/D' : riesgo}</h2>
          </div>
        </div>

        {/* GRÁFICO MASLACH */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 25px 0', color: '#2c3e50' }}>Dimensiones de Maslach vs Saludable</h3>
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficoMaslach}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="dimension" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8f9fa'}} />
                <Legend />
                <Bar dataKey="nivel" name="Nivel Actual" fill="#2980b9" radius={[6, 6, 0, 0]} barSize={40} />
                <Bar dataKey="normal" name="Promedio Saludable" fill="#bdc3c7" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABLA DE COMENTARIOS */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>Buzón de Voces</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', color: '#7f8c8d' }}>
                <th style={{ padding: '15px', borderBottom: '2px solid #eee' }}>ID</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #eee' }}>Comentario</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #eee' }}>Clasificación IA</th>
              </tr>
            </thead>
            <tbody>
              {comentariosFiltrados.length > 0 ? comentariosFiltrados.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px', color: '#95a5a6' }}>#{c.id}</td>
                  <td style={{ padding: '15px', fontStyle: 'italic', color: '#34495e', maxWidth: '400px', wordWrap: 'break-word', overflowWrap: 'break-word'}}>"{c.texto}"</td>
                  <td style={{ padding: '15px', color: c.color, fontWeight: 'bold' }}>{c.tag}</td>
                </tr>
              )) : <tr><td colSpan="3" style={{ padding: '15px', textAlign: 'center', color: '#7f8c8d' }}>No hay comentarios con texto en esta área.</td></tr>}
            </tbody>
          </table>
        </div>

      </div> {/* FIN DEL CONTENEDOR PDF */}

      <ChatAnalitico />

    </div>
  );
}

export default DashboardRRHH;