document.addEventListener('DOMContentLoaded', () => {
    const nuevoNumero = document.getElementById('nuevoNumero');
    const registrarBtn = document.getElementById('registrarNumero');
    const listaNumeros = document.getElementById('listaNumeros');
    const listaEnvios = document.getElementById('listaEnvios');

    // Actualizar lista de números
    async function actualizarNumeros() {
        try {
            const response = await fetch('/numeros');
            const numeros = await response.json();
            listaNumeros.innerHTML = numeros.map(num =>
                `<li>${num}</li>`
            ).join('');

        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Registrar nuevo número
    async function registrarNumero() {
        const numero = nuevoNumero.value.trim();
        const errorContainer = document.getElementById('errorContainer');

        if (!numero || !/^\d{13}$/.test(numero)) {
            errorContainer.textContent = 'Formato inválido. Ejemplo: 5212234567890';
            errorContainer.style.display = 'block';
            // Ocultar el mensaje de error después de 3 segundos
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 3000);

            return;
        }

        try {
            const response = await fetch('/agregar-numero', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numero })
            });

            if (response.ok) {
                nuevoNumero.value = '';
                actualizarNumeros();
            }
        } catch (error) {
            console.error('Error:', error);
            errorContainer.textContent = 'Ocurrió un error al agregar el número. Inténtalo de nuevo.';
            errorContainer.style.display = 'block';
                // Ocultar el mensaje de error después de 3 segundos
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 3000);

        }
    }

    // Actualizar dashboard en tiempo real
    async function actualizarDashboard() {
        try {
            const response = await fetch('/mensajes-enviados');
            const mensajes = await response.json();
            
            listaEnvios.innerHTML = mensajes.reverse().map(msg => `
                <div class="envio-item">
                    <span>${msg.numero}</span>
                    <span>${msg.posicion}</span> <!-- Mostrar posición -->
                    <span>${msg.palabra}</span>
                    <span>${new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Event Listeners
    registrarBtn.addEventListener('click', registrarNumero);
    nuevoNumero.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') registrarNumero();
    });

    // Cargar datos iniciales
    actualizarNumeros();
    
    // Sincronización en tiempo real
    setInterval(() => {
        actualizarDashboard();
        actualizarNumeros();
    }, 1000);

    const dashboardContainer = document.getElementById('dashboardContainer');

    // Cargar el estado del dashboard desde el servidor
    async function cargarEstadoDashboard() {
        try {
            const response = await fetch('/dashboard-visible');
            const data = await response.json();
            dashboardContainer.style.display = data.visible ? 'block' : 'none';
        } catch (error) {
            console.error('Error al cargar el estado del dashboard:', error);
        }
    }

    // Llamar a la función para cargar el estado inicial
    cargarEstadoDashboard();

    // Sincronizar el estado del dashboard periódicamente
    setInterval(cargarEstadoDashboard, 5000);
});