import React, { useState } from 'react';

function ChatAnalitico() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [mensajes, setMensajes] = useState([
    { rol: 'bot', texto: 'Hola. Soy tu Copiloto Analítico. ¿Qué deseas saber sobre el clima laboral hoy?' }
  ]);
  const [cargando, setCargando] = useState(false);

  const enviarMensaje = async () => {
    if (!input.trim()) return;
    
    const nuevoMensaje = { rol: 'user', texto: input };
    setMensajes([...mensajes, nuevoMensaje]);
    setInput('');
    setCargando(true);

    try {
      const res = await fetch('http://localhost:3000/api/chat-analitico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: input })
      });
      const data = await res.json();
      setMensajes(prev => [...prev, { rol: 'bot', texto: data.respuesta }]);
    } catch (err) {
      setMensajes(prev => [...prev, { rol: 'bot', texto: 'Error al conectar con el analista.' }]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      {isOpen ? (
        <div style={{ width: '350px', height: '450px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', border: '1px solid #eee' }}>
          <div style={{ padding: '15px', backgroundColor: '#2c3e50', color: 'white', borderTopLeftRadius: '15px', borderTopRightRadius: '15px', display: 'flex', justifyContent: 'space-between' }}>
            <strong>Copiloto Analítico</strong>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
          </div>
          
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mensajes.map((m, i) => (
              <div key={i} style={{ alignSelf: m.rol === 'user' ? 'flex-end' : 'flex-start', backgroundColor: m.rol === 'user' ? '#3498db' : '#f1f2f6', color: m.rol === 'user' ? 'white' : 'black', padding: '10px', borderRadius: '10px', maxWidth: '80%' }}>
                {m.texto}
              </div>
            ))}
            {cargando && <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Analizando datos...</div>}
          </div>

          <div style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '5px' }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()} placeholder="Pregunta sobre los datos..." style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }} />
            <button onClick={enviarMensaje} style={{ backgroundColor: '#2c3e50', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>↑</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#2c3e50', color: 'white', border: 'none', fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
          💬
        </button>
      )}
    </div>
  );
}

export default ChatAnalitico;