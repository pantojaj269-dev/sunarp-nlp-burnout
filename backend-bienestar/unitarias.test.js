// --- LÓGICA SIMULADA DEL SISTEMA ---
function validarComentario(texto) {
    return texto.length >= 40;
}

// Simulamos la lógica con tus credenciales reales
function validarCredenciales(usuario, password) {
    return usuario === "admin_sunarp" && password === "12345";
}

// --- EJECUCIÓN DE PRUEBAS CON JEST ---
describe('Pruebas Unitarias del Sistema (Jest)', () => {

    describe('PT-01: Formulario Trabajador', () => {
        test('Validar bloqueo de seguridad: Texto menor a 40 caracteres', () => {
            const textoCorto = "estoy cansado";
            expect(validarComentario(textoCorto)).toBe(false); 
        });

        test('Validar carga correcta: Texto válido', () => {
            const textoLargo = "Hoy me sentí horrible, la carga laboral es excesiva y el sistema falla constantemente.";
            expect(validarComentario(textoLargo)).toBe(true);
        });
    });

    describe('PT-02: Login RRHH', () => {
        test('Validar autenticación: Iniciar sesión válida', () => {
            // Le pasamos las credenciales correctas
            expect(validarCredenciales("admin_sunarp", "12345")).toBe(true);
        });

        test('Validar autenticación: Intento con credenciales falsas', () => {
            // Le pasamos la contraseña incorrecta para validar que la rechace
            expect(validarCredenciales("admin_sunarp", "claveMala")).toBe(false);
        });
    });

});