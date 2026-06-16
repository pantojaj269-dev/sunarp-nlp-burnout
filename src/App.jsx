import { API_URL } from './apiConfig';
import { useState } from 'react';
import './App.css'; 

function App() {
  const [area, setArea] = useState('');
  const [estadoAnimo, setEstadoAnimo] = useState(null);
  const [comentarios, setComentarios] = useState('');

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
    mensajeFeedback = `El comentario es obligatorio para el análisis de IA (0/${MAX_CARACTERES})`;
    claseFeedback = 'feedback-corto'; 
  } else if (!textoValido) {
    mensajeFeedback = `📝 Cuéntanos un poco más (mínimo ${MIN_CARACTERES} caracteres)... (${longitudTexto}/${MAX_CARACTERES})`;
    claseFeedback = 'feedback-corto'; 
  } else {
    mensajeFeedback = `✨ ¡Excelente! Este nivel de detalle es perfecto. (${longitudTexto}/${MAX_CARACTERES})`;
    claseFeedback = 'feedback-ideal'; 
  }

  // 3. El botón se bloquea SI falta el área, SI falta el ánimo, o SI el texto no llega a 40
  const botonBloqueado = !area || !estadoAnimo || !textoValido;

  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    // Doble validación de seguridad por si el usuario burla el HTML
    if (botonBloqueado) return;

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
        alert('¡Tus comentarios fueron enviados de forma segura y anónima!');
        // Limpiamos el formulario para el siguiente trabajador
        setArea('');
        setEstadoAnimo(null);
        setComentarios('');
      } else {
        alert('Hubo un error al enviar los datos.');
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert('Error: No se pudo conectar con el servidor.');
    }
  };

  return (
    <div className="panel-central">
      <header className="cabecera">
        <h1>Monitor de Bienestar Laboral</h1>
        <h2>Tu Voz Anónima</h2>
        <p className="mensaje-confianza">Queremos saber cómo te sientes hoy para mejorar juntos nuestro entorno de trabajo. Este espacio es 100% anónimo.</p>
      </header>

      <form onSubmit={manejarEnvio}>
        
        <div className="grupo-formulario">
          <label>1. Selección de Área (Mapeo):</label>
          <select value={area} onChange={(e) => setArea(e.target.value)} required>
            <option value="" disabled>Selecciona tu departamento...</option>
            <option value="mesa_partes">Mesa de Partes</option>
            <option value="catastro">Catastro</option>
            <option value="registro">Registro de Propiedad</option>
            <option value="asesoria">Asesoría Jurídica</option>
          </select>
        </div>

        <div className="grupo-formulario">
          <label>2. ¿Cómo calificarías tu día de hoy?</label>
          <div className="selector-emojis">
            {[
              { valor: 1, emoji: '😄', titulo: 'Excelente' },
              { valor: 2, emoji: '🙂', titulo: 'Bien' },
              { valor: 3, emoji: '😐', titulo: 'Regular' },
              { valor: 4, emoji: '🙁', titulo: 'Mal' },
              { valor: 5, emoji: '😩', titulo: 'Agotado/Burnout' }
            ].map((item) => (
              <button
                key={item.valor}
                type="button"
                className={`emoji-btn ${estadoAnimo === item.valor ? 'seleccionado' : ''}`}
                title={item.titulo}
                onClick={() => setEstadoAnimo(item.valor)}
              >
                {item.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="grupo-formulario">
          <label>3. Cuéntanos más sobre tu jornada (Obligatorio):</label>
          <div className="guia-texto">
            <p>Puedes guiarte con esto:</p>
            <ul>
              <li>¿Qué tarea o situación te consumió más energía hoy?</li>
              <li>Describe brevemente cómo fue la interacción con tus compañeros o usuarios.</li>
              <li>¿Qué fue lo mejor o lo más frustrante de tu jornada?</li>
            </ul>
          </div>
          <textarea 
            rows="5" 
            placeholder="Ejemplo: Hoy la atención en ventanilla..."
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            maxLength={MAX_CARACTERES} /* <--- NUEVO: Candado de HTML para no escribir más */
          ></textarea>
          
          {/* El mensaje de validación */}
          <div style={{ minHeight: '24px', marginTop: '8px' }}>
             <span className={`feedback-texto ${claseFeedback}`}>{mensajeFeedback}</span>
          </div>
        </div>

        <button 
          type="submit" 
          className={`btn-enviar ${botonBloqueado ? 'bloqueado' : ''}`} 
          disabled={botonBloqueado}
        >
          Enviar mi comentario de forma anónima
        </button>
      </form>
    </div>
  );
}

export default App;