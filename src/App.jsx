import { API_URL } from './apiConfig';
import { useState, useRef, useEffect } from 'react';
import './App.css'; 

function App() {
  const [area, setArea] = useState('');
  const [estadoAnimo, setEstadoAnimo] = useState(null);
  const [comentarios, setComentarios] = useState('');
  
  // NUEVO: Estados para gestionar el envío y la respuesta
  const [enviando, setEnviando] = useState(false);
  const [mensajeServidor, setMensajeServidor] = useState({ tipo: '', texto: '' });

  // NUEVO: Estado y lógica para el dropdown personalizado
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 1. Definimos el MIN y MAX de caracteres
  const MIN_CARACTERES = 40;
  const MAX_CARACTERES = 500; // <--- NUEVO: Límite máximo establecido
  const longitudTexto = comentarios.trim().length;
  
  let mensajeFeedback = '';
  let claseFeedback = '';
  
  // 2. Lógica estricta: El texto AHORA ES OBLIGATORIO. Solo es válido si alcanza la meta.
  const textoValido = longitudTexto >= MIN_CARACTERES;

  // Actualizamos los mensajes para mostrar el contador en base al MÁXIMO
  if (longitudTexto === 0) {
    mensajeFeedback = `El comentario es obligatorio para el análisis de IA.`;
    claseFeedback = 'feedback-corto'; 
  } else if (!textoValido) {
    mensajeFeedback = `📝 Cuéntanos un poco más (mínimo ${MIN_CARACTERES} caracteres)...`;
    claseFeedback = 'feedback-corto'; 
  } else {
    mensajeFeedback = `✨ ¡Excelente! Este nivel de detalle es perfecto.`;
    claseFeedback = 'feedback-ideal'; 
  }

  // 3. El botón se bloquea SI falta el área, SI falta el ánimo, o SI el texto no llega a 40
  const botonBloqueado = !area || !estadoAnimo || !textoValido;

  // Opciones para el selector de área
  const areaOptions = [
    { value: 'mesa_partes', label: 'Mesa de Partes', icon: '📥' },
    { value: 'catastro', label: 'Catastro', icon: '🗺️' },
    { value: 'registro', label: 'Registro de Propiedad', icon: '🏠' },
    { value: 'asesoria', label: 'Asesoría Jurídica', icon: '⚖️' }
  ];

  // Función para manejar la selección en el dropdown personalizado
  const handleAreaSelect = (value) => {
    setArea(value);
    setIsAreaDropdownOpen(false);
  };

  // Efecto para cerrar el dropdown si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAreaDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    

    // Doble validación de seguridad por si el usuario burla el HTML
    if (botonBloqueado) return;

    setEnviando(true); // <-- Inicia el estado de carga
    setMensajeServidor({ tipo: '', texto: '' }); // Limpiamos mensajes previos

    const datosParaElBackend = { area, estadoAnimo, comentarios };
    

    try {
      const respuesta = await fetch(`${API_URL}/api/evaluaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosParaElBackend),
      });

      if (respuesta.ok) {
        setMensajeServidor({ tipo: 'exito', texto: '¡Tus comentarios fueron enviados de forma segura y anónima!' });
        // Limpiamos el formulario para el siguiente trabajador
        setArea('');
        setEstadoAnimo(null);
        setComentarios('');
      } else {
        const errorData = await respuesta.json();
        setMensajeServidor({ tipo: 'error', texto: `Hubo un error al enviar los datos: ${errorData.error || 'Inténtalo de nuevo.'}` });
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setMensajeServidor({ tipo: 'error', texto: 'Error: No se pudo conectar con el servidor. Revisa tu conexión.' });
    } finally {
      setEnviando(false); // <-- Finaliza el estado de carga
    }
  };

  return (
    <div className="panel-central">
      <header className="cabecera">
        <h1>Monitor de Bienestar Laboral</h1>
        <h2>Tu Voz Anónima</h2>
        <p className="mensaje-confianza">Queremos saber cómo te sientes hoy para mejorar juntos nuestro entorno de trabajo. Este espacio es 100% anónimo.</p>
      </header>

      {/* NUEVO: Contenedor para mensajes del servidor (éxito/error) */}
      {mensajeServidor.texto && (
        <div className={`mensaje-servidor ${mensajeServidor.tipo === 'exito' ? 'exito' : 'error'}`}>
          {mensajeServidor.texto}
        </div>
      )}

      <form onSubmit={manejarEnvio}>
        
        <div className="grupo-formulario" ref={dropdownRef}>
          <label>1. Selección de Área (Mapeo):</label>
          {/* Componente de Dropdown Personalizado */}
          <div className="custom-select-wrapper">
            <div 
              className={`custom-select-trigger ${isAreaDropdownOpen ? 'open' : ''} ${!area ? 'placeholder' : ''}`}
              onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
              tabIndex="0" // Para accesibilidad con teclado
            >
              {area ? (
                <div className="option-content">
                  <span className="custom-select-icon">{areaOptions.find(opt => opt.value === area).icon}</span>
                  {areaOptions.find(opt => opt.value === area).label}
                </div>
              ) : 'Selecciona tu departamento...'}
            </div>
            <ul className={`custom-options ${isAreaDropdownOpen ? 'open' : ''}`}>
              {areaOptions.map(option => (
                <li 
                  key={option.value} 
                  className={`custom-option ${area === option.value ? 'selected' : ''}`}
                  onClick={() => handleAreaSelect(option.value)}
                >
                  <div className="option-content">
                    <span className="custom-select-icon">{option.icon}</span>
                    {option.label}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grupo-formulario">
          <label>2. ¿Cómo calificarías tu día de hoy?</label>
          <div className="selector-emojis">
            {[ // UX MEJORA: Se añaden etiquetas de texto visibles para mayor claridad y accesibilidad
              { valor: 1, emoji: '😄', titulo: 'Excelente' },
              { valor: 2, emoji: '🙂', titulo: 'Bien' },
              { valor: 3, emoji: '😐', titulo: 'Regular' },
              { valor: 4, emoji: '🙁', titulo: 'Mal' },
              { valor: 5, emoji: '😩', titulo: 'Agotado' }
              
            ].map((item) => (
              <div 
                key={item.valor} 
                className={`emoji-container ${estadoAnimo === item.valor ? 'seleccionado' : ''}`}
                onClick={() => setEstadoAnimo(item.valor)}
                role="button"
                tabIndex="0"
                aria-pressed={estadoAnimo === item.valor}
                aria-label={item.titulo}
              >
                <div className="emoji-display">{item.emoji}</div>
                <span className="emoji-titulo">{item.titulo}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grupo-formulario">
          <label>3. Cuéntanos más sobre tu jornada (Obligatorio):</label>
          <div className="guia-texto">
            <div className="guia-texto-header">
              <span className="guia-texto-icon">💡</span>
              <span>Puedes guiarte con esto:</span>
            </div>
            <ul>
              <li>¿Qué tarea o situación te consumió más energía hoy?</li>
              <li>Describe brevemente cómo fue la interacción con tus compañeros o usuarios.</li>
              <li>¿Qué fue lo mejor o lo más frustrante de tu jornada?</li>
            </ul>
          </div>
          <div className="textarea-wrapper">
            <textarea 
              rows="5" 
              placeholder="Ejemplo: Hoy la atención en ventanilla..."
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              maxLength={MAX_CARACTERES}
            ></textarea>
            <span className={`textarea-counter ${claseFeedback}`}>{longitudTexto}/{MAX_CARACTERES}</span>
          </div>
          
          {/* El mensaje de validación */}
          <div style={{ minHeight: '24px', marginTop: '8px' }}>
            <span className={`feedback-texto ${claseFeedback}`}>{mensajeFeedback}</span>
          </div>
        </div>

        <button 
          type="submit" 
          className={`btn-enviar ${(botonBloqueado || enviando) ? 'bloqueado' : ''}`}
          disabled={botonBloqueado || enviando}
        >
          {enviando ? 'Enviando...' : 'Enviar mi comentario de forma anónima'}
        </button>
      </form>
    </div>
  );
}

export default App;