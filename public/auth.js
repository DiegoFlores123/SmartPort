let ENV_VARS = {};

// Función para cargar las variables de entorno desde el servidor
async function loadEnvVars() {
    try {
        const response = await fetch('/env');
        ENV_VARS = await response.json();
    } catch (error) {
        console.error('Error al cargar las variables de entorno:', error);
    }
}

// Cargar las variables de entorno antes de usar el resto del código
document.addEventListener('DOMContentLoaded', async () => {
    await loadEnvVars();

    const STORED_HASH = ENV_VARS.ADMIN_PASSWORD_HASH;
    const SESSION_KEY = ENV_VARS.SESSION_KEY_SECRET;
    const ADMIN_USERNAME = ENV_VARS.ADMIN_USERNAME;
    const ADMIN_PAGE_ROUTE = ENV_VARS.ADMIN_PAGE_ROUTE;

    // Función para verificar un hash
    async function verifyHash(password, storedHash) {
        const [storedHashHex, storedSaltHex] = storedHash.split(':');
        const salt = new Uint8Array(storedSaltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);

        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return hashHex === storedHashHex;
    }

    // Manejar el evento de envío del formulario de inicio de sesión
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
    
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorContainer = document.getElementById('errorContainer'); // Contenedor para el mensaje de error
    
        try {
            if (username === ADMIN_USERNAME && await verifyHash(password, STORED_HASH)) {
                // Crear sesión segura
                const sessionToken = crypto.randomUUID();
                sessionStorage.setItem(SESSION_KEY, JSON.stringify({
                    token: sessionToken,
                    exp: Date.now() + 100000
                }));
                window.location.href = ADMIN_PAGE_ROUTE;
            } else {
                // Mostrar mensaje de error
                errorContainer.textContent = 'Credenciales incorrectas. Por favor, inténtalo de nuevo.';
                errorContainer.style.display = 'block';
                // Ocultar el mensaje de error después de 3 segundos
                setTimeout(() => {
                    errorContainer.style.display = 'none';
                }, 3000);
                document.getElementById('password').value = '';
            }
        } catch (error) {
            console.error('Error durante la autenticación:', error);
            errorContainer.textContent = 'Ocurrió un error. Por favor, inténtalo de nuevo más tarde.';
            errorContainer.style.display = 'block';
            // Ocultar el mensaje de error después de 3 segundos
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 3000);
        }
    });

    // Bloquear acceso desde iframes
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }

    // Deshabilitar caché para páginas protegidas
    if (window.location.pathname.includes(ADMIN_PAGE_ROUTE)) {
        window.onunload = () => {};
        window.addEventListener('beforeunload', () => {
            sessionStorage.removeItem(SESSION_KEY);
        });
    }
});