const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  // 1. Lanzamos el navegador visible para ver la magia
  const browser = await chromium.launch({ headless: false }); 
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("🚀 Iniciando PT-05: Prueba de Sistema - Exportación de Reportes con Playwright...");

    // 2. Ir a la ruta principal de tu Dashboard (donde se renderiza tu componente)
    console.log("1. Navegando al Portal de Recursos Humanos...");
    await page.goto('http://localhost:5173/'); // <-- Si tu dashboard abre directo en la raíz, déjalo así. Si usa /dashboard, cámbialo.

    // 3. Autenticación usando los Placeholders exactos de tu HTML de React
    console.log("2. Autenticando usuario de Jefatura...");
    await page.getByPlaceholder('Usuario').fill('admin_sunarp');
    await page.getByPlaceholder('Contraseña').fill('12345');
    
    // Hacemos clic en el botón usando su texto exacto en pantalla
    await page.getByRole('button', { name: 'Ingresar al Dashboard' }).click();
    console.log("Login enviado. Esperando procesamiento de métricas...");

    // 4. PREPARAR EL MANEJADOR DE DESCARGAS (Obligatorio antes de hacer clic)
    const downloadPromise = page.waitForEvent('download');

    // 5. Hacer clic en el botón de exportar usando su emoji y texto exacto
    console.log("3. Haciendo clic en el botón de Exportar PDF A4...");
    await page.getByRole('button', { name: '📊 Exportar PDF' }).click(); 

    // 6. Capturar y guardar el archivo PDF descargado
    const download = await downloadPromise;
    const rutaDestino = path.join(__dirname, 'reporte_burnout_valido.pdf');
    await download.saveAs(rutaDestino);

    console.log(`✅ [PT-05] PRUEBA EXITOSA: Interacción en la interfaz web validada.`);
    console.log(`📁 El archivo PDF fue generado correctamente y guardado en: ${rutaDestino}`);

  } catch (error) {
    console.error("❌ ERROR EN LA PRUEBA PT-05:", error);
  } finally {
    // Dejamos 3 segundos para observar el éxito antes de cerrar
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();