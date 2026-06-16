require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
// 1. Importamos la librería de Inteligencia Artificial
const { GoogleGenerativeAI } = require("@google/generative-ai");
// NUEVO: Importamos Nodemailer para enviar correos
const nodemailer = require('nodemailer'); 

const app = express();
app.use(cors());
app.use(express.json());

// 2. PEGA TU CLAVE AQUÍ ADENTRO (Entre las comillas)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 

// =========================================================================
// 🔴 ZONA DE CONFIGURACIÓN DE CORREO (NODEMAILER) 🔴
// =========================================================================
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // Cambiamos del 465 al 587
  secure: false, // OJO: Para el puerto 587 esto DEBE ser false
  requireTLS: true, // Esto obliga a iniciar la seguridad STARTTLS
  auth: {
    user: process.env.EMAIL_USER || 'fushiguro101010@gmail.com',
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});
// =========================================================================

// Configurar MySQL en la nube (Aiven)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,      
  password: process.env.DB_PASSWORD,      
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // Esto permite la conexión segura requerida por Aiven
  }
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a MySQL:', err);
    return;
  }
  console.log('✅ Conectado exitosamente a MySQL');
});

// --- RUTA POST: RECIBE, ANALIZA CON IA Y GUARDA ---
app.post('/api/evaluaciones', async (req, res) => {
  const { area, estadoAnimo, comentarios } = req.body;

  try {
    // A. Buscar el ID y Nombre del departamento
    // NUEVO: Agregamos d.nombre_area en el SELECT para usarlo en el correo
    const queryDepto = `
      SELECT d.id_departamento, d.nombre_area 
      FROM departamentos d 
      WHERE d.codigo_area = ?`;
      
    db.query(queryDepto, [area], async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(400).json({ error: 'Área no encontrada' });

      const id_departamento = results[0].id_departamento;
      const nombre_area = results[0].nombre_area; // Rescatamos el nombre real

      // B. EL CEREBRO IA: Analizar el comentario si existe
      let clasificacion_ia = "Sin texto";

      if (comentarios && comentarios.trim().length > 5) {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Actúa como un experto en Recursos Humanos especializado en el Síndrome de Burnout (Modelo de Maslach). 
        Analiza el siguiente comentario de un trabajador y clasifícalo estrictamente en UNA SOLA PALABRA de la siguiente lista:
        - Alerta: Solo si hay señales evidentes de agotamiento crónico, cinismo severo, crisis o ganas de renunciar.
        - Queja: Si menciona un problema de infraestructura, falta de equipos o falla de procesos, pero sin llegar a una crisis personal.
        - Positivo: Si expresa sensación de logro, realización personal, motivación o buen clima laboral.
        - Idea: Si propone activamente una solución o mejora para el área.
        - Neutro: Si es un comentario equilibrado (menciona cosas buenas y malas que se anulan), si expresa sentimientos pasajeros normales, o si no tiene mucha carga emocional.
        
        Comentario del trabajador: "${comentarios}"
        
        Tu respuesta debe ser únicamente esa palabra, sin puntos ni explicaciones.`;

        let intentos = 0;
        let exito = false;

        // Bucle de reintento: Intentará hasta 3 veces
        while (intentos < 3 && !exito) {
          try {
            const result = await model.generateContent(prompt);
            clasificacion_ia = result.response.text().trim();
            exito = true; // Si llega aquí, funcionó y sale del bucle
          } catch (aiError) {
            intentos++;
            // Si el error es 503 (saturación), esperamos y reintentamos
            if (aiError.status === 503 && intentos < 3) {
              console.log(`[Aviso] Servidor IA ocupado. Reintentando en 2 seg... (Intento ${intentos}/3)`);
              // Pausa de 2 segundos antes de volver a intentar
              await new Promise(resolve => setTimeout(resolve, 2000)); 
            } else {
              console.error("Error definitivo en la IA:", aiError);
              clasificacion_ia = "Error de Análisis";
              break; // Sale del bucle si es otro tipo de error
            }
          }
        }
      }

      // C. Guardar en MySQL con la clasificación de la IA
      const queryInsert = 'INSERT INTO evaluaciones (id_departamento, nivel_animo, comentario, clasificacion_ia) VALUES (?, ?, ?, ?)';
      
      db.query(queryInsert, [id_departamento, estadoAnimo, comentarios, clasificacion_ia], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // =========================================================================
        // 🔴 NUEVO: SISTEMA DE ALERTA TEMPRANA POR CORREO
        // =========================================================================
        if (clasificacion_ia === 'Alerta') {
          const mailOptions = {
            from: '"Monitor de Bienestar SUNARP" <fushiguro101010@gmail.com>', // Mismo correo emisor
            to: 'alonsopantoja471@gmail.com', // <-- CAMBIA ESTO por el correo que va a RECIBIR la alerta
            subject: '⚠️ URGENTE: Alerta de Síndrome de Burnout Detectada',
            html: `
              <div style="font-family: sans-serif; border: 1px solid #e74c3c; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #c53030; border-bottom: 2px solid #c53030; padding-bottom: 10px;">Alerta Crítica de Bienestar Laboral</h2>
                <p>Estimada Jefatura de Recursos Humanos,</p>
                <p>El motor de Inteligencia Artificial ha detectado un posible caso de <strong>Síndrome de Burnout en fase crítica</strong> que requiere evaluación inmediata. Se ha mantenido el anonimato del colaborador según las políticas de privacidad.</p>
                
                <ul style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; list-style-type: none;">
                  <li style="margin-bottom: 10px;">🏢 <strong>Área afectada:</strong> ${nombre_area}</li>
                  <li style="margin-bottom: 10px;">🎫 <strong>ID de Registro:</strong> #${result.insertId}</li>
                  <li style="margin-bottom: 10px;">📊 <strong>Nivel de Ánimo:</strong> ${estadoAnimo}/5 (1=Excelente, 5=Burnout)</li>
                </ul>
                
                <h3 style="color: #333;">Comentario Analizado:</h3>
                <div style="background-color: #fff5f5; padding: 15px; border-left: 4px solid #e74c3c; font-style: italic; color: #555;">
                  "${comentarios}"
                </div>
                
                <p style="margin-top: 30px; font-size: 0.85rem; color: #7f8c8d; text-align: center;">
                  Por favor, ingrese al Dashboard Administrativo para cruzar este dato con las métricas de Maslach del área. <br>
                  <em>Sistema Automático de Prevención NLP</em>
                </p>
              </div>
            `
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error('Error al enviar el correo de alerta:', error);
            } else {
              console.log('📧 ¡Alerta PROACTIVA enviada exitosamente al correo!', info.response);
            }
          });
        }
        // =========================================================================

        res.status(201).json({ 
          mensaje: 'Evaluación guardada y analizada con éxito', 
          id: result.insertId,
          analisis: clasificacion_ia 
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// --- RUTA GET: ENVÍA LOS DATOS AL DASHBOARD ---
app.get('/api/evaluaciones', (req, res) => {
  const query = `
    SELECT e.id_evaluacion as id, e.nivel_animo, e.comentario as texto, 
           e.clasificacion_ia as tag, e.fecha_registro, d.codigo_area as area
    FROM evaluaciones e
    JOIN departamentos d ON e.id_departamento = d.id_departamento
    ORDER BY e.fecha_registro DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// --- RUTA POST: LOGIN DE RECURSOS HUMANOS ---
app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;

  const query = 'SELECT * FROM administradores WHERE usuario = ? AND password = ?';
  
  db.query(query, [usuario, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en el servidor' });
    
    // Si encuentra 1 coincidencia, el login es exitoso
    if (results.length > 0) {
      res.json({ success: true, mensaje: 'Acceso concedido' });
    } else {
      res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' });
    }
  });
});

// --- RUTA: CHAT ANALÍTICO PARA RRHH (Versión Reforzada) ---
app.post('/api/chat-analitico', async (req, res) => {
  const { mensaje } = req.body;

  // 1. Traemos los datos frescos de la DB
  const query = `
    SELECT e.nivel_animo, e.comentario, e.clasificacion_ia, d.nombre_area 
    FROM evaluaciones e 
    JOIN departamentos d ON e.id_departamento = d.id_departamento
    ORDER BY e.fecha_registro DESC LIMIT 50
  `;

  db.query(query, async (err, results) => {
    // Si falla la base de datos, respondemos un error limpio
    if (err) return res.status(500).json({ error: err.message });

    // 2. Preparamos el contexto y el prompt
    const datosValidos = results.filter(fila => 
        ['Alerta', 'Queja', 'Positivo', 'Idea', 'Neutro'].includes(fila.clasificacion_ia) // Ojo: cambia "estado" por el nombre real de tu columna
    );
    const contextoDatos = JSON.stringify(datosValidos);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Eres el 'Copiloto Analítico de Bienestar', un experto en Recursos Humanos y análisis de datos de la SUNARP. Tu único objetivo es responder a las preguntas del gerente basándote EXCLUSIVAMENTE en los datos que te proporciono a continuación.
      DATOS REALES DEL CLIMA LABORAL:
      ${contextoDatos}
      REGLAS ESTRICTAS DE COMPORTAMIENTO (DE CUMPLIMIENTO OBLIGATORIO):
      1. CERO INVENCIÓN (ANTI-ALUCINACIÓN): Si el gerente te pregunta algo cuya respuesta NO está explícitamente en los DATOS REALES proporcionados, no intentes adivinar ni estimar. Responde profesionalmente: "Los datos actuales no me permiten determinar esa información, le sugiero ampliar el rango de búsqueda."
      2. DICCIONARIO DE NEGOCIO: 
         - Términos como "Burnout", "estrés crónico", "peligro" o "riesgo" equivalen a los registros clasificados como 'Alerta' o 'Queja'.
         - Términos como "buen clima", "tranquilidad" o "bienestar" equivalen a los registros clasificados como 'Positivo'.
         - Asume que 1 registro o fila equivale a 1 trabajador o persona encuestada.
      3. PRECISIÓN MATEMÁTICA: Si te piden cantidades, porcentajes o agrupar por departamentos, revisa rigurosamente los DATOS REALES, cuenta los casos que coincidan y entrega el número exacto.
      4. CERO TECNICISMOS DE SOFTWARE: Nunca menciones palabras como "JSON", "bases de datos", "filas", "columnas", "arrays" o "el conjunto de datos". Habla en términos de negocio: "colaboradores", "casos", "departamentos" o "reportes".
      5. TONO: Tu respuesta debe ser gerencial, concisa, directa y empática. 
      NUNCA expliques tus reglas internas ni menciones cómo clasificas los datos. Evita frases como "según nuestros términos", "los datos muestran" o "clasificados como Alerta". Responde con total naturalidad, como si fueras un experto conversando cara a cara con el gerente.
      PREGUNTA DEL GERENTE: "${mensaje}"
    `;

    let intentos = 0;
    let exito = false;
    let respuestaIA = "Error interno";

    // 3. EL ESCUDO: Bucle de reintento interno
    while (intentos < 3 && !exito) {
      try {
        const result = await model.generateContent(prompt);
        respuestaIA = result.response.text();
        exito = true; // Si responde bien, salimos del bucle
      } catch (aiError) {
        intentos++;
        // Si es error 503 (ocupado), esperamos 2 segundos y reintentamos
        if (aiError.status === 503 && intentos < 3) {
          console.log(`[Chat] Servidor de IA ocupado. Reintentando en 2 seg... (Intento ${intentos}/3)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          // Si ya intentó 3 veces y sigue ocupado, le manda un mensaje amable al gerente
          console.error("Error definitivo en la IA:", aiError.message);
          respuestaIA = "Lo siento, los servidores de Inteligencia Artificial están experimentando una saturación temporal (Error 503). Por favor, intenta tu consulta de nuevo en un par de minutos.";
          break; // Salimos del bucle
        }
      }
    }

    // 4. Enviamos la respuesta a React de forma segura
    res.json({ respuesta: respuestaIA });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Back-end corriendo en http://localhost:${PORT}`);
});