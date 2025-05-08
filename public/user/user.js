document.addEventListener('DOMContentLoaded', () => {
    const nuevoNumero = document.getElementById('nuevoNumero');
    const registrarBtn = document.getElementById('registrarNumero');
    const listaNumeros = document.getElementById('listaNumeros');
    const listaEnvios = document.getElementById('listaEnvios');

    // Mostrar notificación toast
    function mostrarToast(mensaje) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = mensaje;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 1000);
    }

    // Actualizar lista de números
    async function actualizarNumeros() {
        try {
            const response = await fetch('/numeros');
            const numeros = await response.json();
            listaNumeros.innerHTML = numeros

        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Registrar nuevo número
    async function registrarNumero() {
        const numero = nuevoNumero.value.trim();
        
        if (!numero || !/^\d{10,15}$/.test(numero)) {
            alert('Formato inválido. Ejemplo: 5212234567890');
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
                mostrarToast('¡Número registrado exitosamente!');
                actualizarNumeros();
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarToast('Error al registrar el número');
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

    const dashboardVisible = JSON.parse(localStorage.getItem('dashboardVisible')) || false;
    const dashboardContainer = document.getElementById('dashboardContainer');
    dashboardContainer.style.display = dashboardVisible ? 'block' : 'none';
});