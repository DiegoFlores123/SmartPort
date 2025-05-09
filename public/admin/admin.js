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

// Función para verificar la sesión
function verificarSesion() {
    const SESSION_KEY = ENV_VARS.SESSION_KEY_SECRET;
    const sessionData = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');

    if (!sessionData.token || sessionData.exp < Date.now()) {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
        return false;
    }

    return true;
}

let caso1Tiempo, caso1Litros, caso1Costo, caso1CO2;
let caso2Tiempo, caso2Litros, caso2Costo, caso2CO2;

async function cargarResultadosGuardados() {
    try {
        const response = await fetch('/resultados-casos');
        const data = await response.json();

        // Actualizar la interfaz con los datos del servidor
        caso1Tiempo.textContent = data.caso1.tiempo;
        caso1Litros.textContent = data.caso1.litros;
        caso1Costo.textContent = `$${data.caso1.costo}`;
        caso1CO2.textContent = data.caso1.co2;

        caso2Tiempo.textContent = data.caso2.tiempo;
        caso2Litros.textContent = data.caso2.litros;
        caso2Costo.textContent = `$${data.caso2.costo}`;
        caso2CO2.textContent = data.caso2.co2;
    } catch (error) {
        console.error('Error al cargar los resultados guardados:', error);
    }
}


// Inicializar la página después de verificar la sesión
async function inicializarPagina() {
    await loadEnvVars();

    if (!verificarSesion()) return;

    document.body.style.display = 'block';

    inicializarDOM();
    await cargarResultadosGuardados(); // Cargar los resultados guardados
}

const toggle = document.getElementById('dashboardToggle');

// Cargar el estado inicial del toggle desde el servidor
async function cargarEstadoToggle() {
    try {
        const response = await fetch('/dashboard-visible');
        const data = await response.json();
        toggle.checked = data.visible;
    } catch (error) {
        console.error('Error al cargar el estado del toggle:', error);
    }
}

// Guardar el estado del toggle en el servidor
toggle.addEventListener('change', async () => {
    try {
        await fetch('/dashboard-visible', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visible: toggle.checked })
        });
    } catch (error) {
        console.error('Error al guardar el estado del toggle:', error);
    }
});

// Llamar a la función para cargar el estado inicial
cargarEstadoToggle();

const cronometroToggle = document.getElementById('cronometroToggle');

// Cargar el estado inicial del cronómetro desde el servidor
async function cargarEstadoCronometro() {
    try {
        const response = await fetch('/cronometro-visible');
        const data = await response.json();
        cronometroToggle.checked = data.visible;
    } catch (error) {
        console.error('Error al cargar el estado del cronómetro:', error);
    }
}

// Guardar el estado del cronómetro en el servidor
cronometroToggle.addEventListener('change', async () => {
    try {
        await fetch('/cronometro-visible', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visible: cronometroToggle.checked })
        });
    } catch (error) {
        console.error('Error al guardar el estado del cronómetro:', error);
    }
});

// Llamar a la función para cargar el estado inicial
cargarEstadoCronometro();

// Lógica relacionada con el DOM
function inicializarDOM() {
    const cronometro = document.querySelector('.cronometro');
    const iniciarBtn = document.getElementById('iniciar');
    const pausarBtn = document.getElementById('pausar');
    const reiniciarBtn = document.getElementById('reiniciar');

    const litrosValor = document.getElementById('litros');
    const costoValor = document.getElementById('costo');
    const co2Valor = document.getElementById('co2');

    caso1Tiempo = document.getElementById('cronometrores1');
    caso1Litros = document.getElementById('litros1');
    caso1Costo = document.getElementById('costo1');
    caso1CO2 = document.getElementById('co21');

    caso2Tiempo = document.getElementById('cronometrores2');
    caso2Litros = document.getElementById('litros2');
    caso2Costo = document.getElementById('costo2');
    caso2CO2 = document.getElementById('co22');

    const nuevoNumero = document.getElementById('nuevoNumero');
    const registrarBtn = document.getElementById('registrarNumero');
    const listaNumeros = document.getElementById('listaNumeros');
    const iniciarEnvioBtn = document.getElementById('iniciarEnvio');
    const contadorEspera = document.getElementById('contadorEspera');
    const listaEnvios = document.getElementById('listaEnvios');

    let segundos = 0, minutos = 0, horas = 0;
    let intervalo;
    let multiplicador = 0;

    const formatearNumero = (num) => {
        return Number(num).toLocaleString('es-MX', {
            maximumFractionDigits: 2
        });
    };

    const actualizarTiempo = () => {
        multiplicador++;
        segundos++;

        if (segundos === 60) {
            segundos = 0;
            minutos++;
        }
        if (minutos === 60) {
            minutos = 0;
            horas++;
        }

        const tiempoFormateado = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
        cronometro.textContent = tiempoFormateado;

        const litros = multiplicador * 500;
        const costo = litros * 25;
        const co2 = litros * 2.6;

        litrosValor.textContent = formatearNumero(litros);
        costoValor.textContent = formatearNumero(costo);
        co2Valor.textContent = formatearNumero(co2);

        // Actualizar el estado del cronómetro en el servidor
        actualizarEstadoCronometroServidor();
    };

    // Función para enviar el estado del cronómetro al servidor
    async function actualizarEstadoCronometroServidor() {
        try {
            await fetch('/cronometro-estado', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    segundos,
                    minutos,
                    horas,
                    litros: multiplicador * 500, // Calcular litros
                    costo: multiplicador * 500 * 25, // Calcular costo
                    co2: multiplicador * 500 * 2.6, // Calcular emisión de CO2
                    corriendo: !!intervalo // Si hay un intervalo, el cronómetro está corriendo
                })
            });
        } catch (error) {
            console.error('Error al actualizar el estado del cronómetro en el servidor:', error);
        }
    }

    iniciarBtn.addEventListener('click', () => {
        clearInterval(intervalo);
        intervalo = setInterval(actualizarTiempo, 1000);
        actualizarEstadoCronometroServidor();
    });

    pausarBtn.addEventListener('click', () => {
        clearInterval(intervalo);
        intervalo = null;
        actualizarEstadoCronometroServidor();
    });

    reiniciarBtn.addEventListener('click', () => {
        clearInterval(intervalo);
        segundos = minutos = horas = 0;
        multiplicador = 0;
        cronometro.textContent = '00:00:00';
        litrosValor.textContent = '0';
        costoValor.textContent = '0';
        co2Valor.textContent = '0';
        intervalo = null;
        actualizarEstadoCronometroServidor();
    });

    document.getElementById('parte1').addEventListener('click', () => guardarResultado(1));
    document.getElementById('parte2').addEventListener('click', () => guardarResultado(2));

    async function guardarResultado(caso) {
    const tiempo = cronometro.textContent;
    const litros = litrosValor.textContent;
    const costo = costoValor.textContent;
    const co2 = co2Valor.textContent;

        // Actualizar la interfaz
        if (caso === 1) {
            caso1Tiempo.textContent = tiempo;
            caso1Litros.textContent = litros;
            caso1Costo.textContent = `$${costo}`;
            caso1CO2.textContent = co2;
        } else {
            caso2Tiempo.textContent = tiempo;
            caso2Litros.textContent = litros;
            caso2Costo.textContent = `$${costo}`;
            caso2CO2.textContent = co2;
        }

        // Enviar los datos al servidor
        try {
            await fetch('/guardar-resultado', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caso, tiempo, litros, costo, co2 })
            });
        } catch (error) {
            console.error('Error al guardar el resultado en el servidor:', error);
        }
    }

    cargarNumerosRegistrados();

    registrarBtn.addEventListener('click', agregarNumero);
    nuevoNumero.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') agregarNumero();
    });

    iniciarEnvioBtn.addEventListener('click', iniciarEnvioProceso);

    async function agregarNumero() {
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
                cargarNumerosRegistrados();
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

    async function cargarNumerosRegistrados() {
        try {
            const response = await fetch('/numeros');
            const numeros = await response.json();
            listaNumeros.innerHTML = numeros.map(num =>
                `<li>${num} <button class="btn-eliminar" data-num="${num}">×</button></li>`
            ).join('');

            document.querySelectorAll('.btn-eliminar').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await fetch(`/eliminar-numero/${btn.dataset.num}`, { method: 'DELETE' });
                    cargarNumerosRegistrados();
                });
            });
        } catch (error) {
            console.error('Error:', error);
        }
    }

    setInterval(cargarNumerosRegistrados, 3000);

    async function iniciarEnvioProceso() {
        const response = await fetch('/numeros');
        const numeros = await response.json();
    
        if (numeros.length === 0) { // Verificar si no hay números registrados
            const errorContainer = document.getElementById('errorContainer');
            errorContainer.textContent = 'No hay números registrados. Por favor, agrega al menos un número antes de iniciar el envío.';
            errorContainer.style.display = 'block';
    
            // Ocultar el mensaje de error después de 3 segundos
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 3000);
    
            return; // Salir de la función
        }
    
        iniciarEnvioBtn.disabled = true;
        let contador = 3;
    
        const intervalo = setInterval(() => {
            contadorEspera.textContent = contador;
            contador--;
    
            if (contador < 0) {
                clearInterval(intervalo);
                contadorEspera.textContent = '';
                iniciarEnvioBtn.disabled = false;
                iniciarBtn.click();
                iniciarEnvioMensajes();
            }
        }, 1000);
    }

    async function iniciarEnvioMensajes() {
        try {
            const response = await fetch('/iniciar-dinamica', { method: 'POST' });
            if (!response.ok) throw new Error('Error al iniciar envío');

            setInterval(async () => {
                const response = await fetch('/mensajes-enviados');
                const mensajes = await response.json();
                actualizarDashboard(mensajes);
            }, 1000);

        } catch (error) {
            console.error('Error:', error);
        }
    }

    function actualizarDashboard(mensajes) {
        const ultimosMensajes = mensajes.slice(-10);
    
        listaEnvios.innerHTML = ultimosMensajes.reverse().map(msg => `
            <div class="envio-item">
                <span>${msg.numero}</span>
                <span>${msg.posicion}</span> <!-- Mostrar posición -->
                <span>${msg.palabra}</span>
                <span>${new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', inicializarPagina);