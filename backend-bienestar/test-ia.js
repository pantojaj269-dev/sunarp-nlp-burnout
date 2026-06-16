async function descubrirModelos() {
  // 👇 REEMPLAZA ESTO CON TU CLAVE REAL
  const API_KEY = "AIzaSyA_8A4Z8m7fwLGqLRmN_Xjn0a4kLHBsLh4"; 
  
  try {
    console.log("Conectando con Google AI Studio...");
    const respuesta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const datos = await respuesta.json();
    
    console.log("\n✅ ¡Éxito! Estos son los modelos de texto que tu llave SÍ puede usar:");
    console.log("--------------------------------------------------");
    
    // Filtramos solo los modelos que sirven para generar texto
    datos.models.forEach(modelo => {
      if (modelo.supportedGenerationMethods.includes("generateContent")) {
        // Le quitamos la palabra "models/" para que veas el nombre exacto
        console.log("👉 " + modelo.name.replace("models/", ""));
      }
    });
    console.log("--------------------------------------------------");
    
  } catch (error) {
    console.log("❌ Error de conexión:", error);
  }
}

descubrirModelos();