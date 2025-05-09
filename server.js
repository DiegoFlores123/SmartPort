require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const twilio = require("twilio");

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'seleccion.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

let NUMEROS_DESTINO = [];
const PALABRAS_ALFABETO = [
  'Quartz', 'Quasar', 'Nimbus', 'Nimble', 'Zephyr', 
  'Zodiac', 'Fjord', 'Flicker', 'Glyph', 'Glitch'
];
let mensajesEnviados = [];

app.post('/agregar-numero', (req, res) => {
  const { numero } = req.body;
  if (!NUMEROS_DESTINO.includes(numero)) {
    NUMEROS_DESTINO.push(numero);
  }
  res.status(200).json(NUMEROS_DESTINO);
});

app.delete('/eliminar-numero/:numero', (req, res) => {
  NUMEROS_DESTINO = NUMEROS_DESTINO.filter(n => n !== req.params.numero);
  res.status(200).json(NUMEROS_DESTINO);
});

app.get('/mensajes-enviados', (req, res) => {
  res.json(mensajesEnviados.slice(-10));
});

app.get('/numeros', (req, res) => {
  res.json(NUMEROS_DESTINO);
});

app.get('/env', (req, res) => {
  res.json({
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    SESSION_KEY_SECRET: process.env.SESSION_KEY_SECRET,
    ADMIN_PAGE_ROUTE: process.env.ADMIN_PAGE_ROUTE,
  });
});

let dashboardVisible = false; // Estado inicial del toggle

// Endpoint para obtener el estado del toggle
app.get('/dashboard-visible', (req, res) => {
  res.json({ visible: dashboardVisible });
});

// Endpoint para actualizar el estado del toggle
app.post('/dashboard-visible', (req, res) => {
  const { visible } = req.body;
  dashboardVisible = visible;
  res.status(200).json({ success: true });
});

let cronometroVisible = false; // Estado inicial del cronómetro

// Endpoint para obtener el estado del cronómetro
app.get('/cronometro-visible', (req, res) => {
  res.json({ visible: cronometroVisible });
});

// Endpoint para actualizar el estado del cronómetro
app.post('/cronometro-visible', (req, res) => {
  const { visible } = req.body;
  cronometroVisible = visible;
  res.status(200).json({ success: true });
});

let cronometroEstado = {
  segundos: 0,
  minutos: 0,
  horas: 0,
  litros: 0,
  costo: 0,
  co2: 0,
  corriendo: false // Indica si el cronómetro está en ejecución
};

// Endpoint para obtener el estado del cronómetro
app.get('/cronometro-estado', (req, res) => {
  res.json(cronometroEstado);
});

// Endpoint para actualizar el estado del cronómetro
app.post('/cronometro-estado', (req, res) => {
  const { segundos, minutos, horas, litros, costo, co2, corriendo } = req.body;
  cronometroEstado = { segundos, minutos, horas, litros, costo, co2, corriendo };
  res.status(200).json({ success: true });
});

async function enviarMensaje(numeroDestino, palabra, posicion) {
  try {
    const message = await client.messages.create({
      body: `Tu palabra clave: ${palabra} y tu posición es: ${posicion}`,
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:+${numeroDestino}`
    });  
    console.log(`Mensaje enviado a ${message.to}`);
    return message.sid;
  } 
  catch (error) {
    console.error('Detalle error:', {
      code: error.code,
      message: error.message,
      moreInfo: error.more_info
    });
    throw error;
  }
}
  
app.post('/iniciar-dinamica', (req, res) => {
  mensajesEnviados = [];
  const numerosLimitados = NUMEROS_DESTINO.slice(0, 10);

  // Ordenar las palabras alfabéticamente antes de asignarlas
  const palabrasOrdenadas = [...PALABRAS_ALFABETO].sort((a, b) => a.localeCompare(b));

  // Asignar las palabras ordenadas a los números
  const asignaciones = numerosLimitados.map((numero, index) => ({
    numero,
    palabra: palabrasOrdenadas[index] // Asignar la palabra correcta
  }));

  let indice = 0;
  let posicion = 1; // Iniciar la posición en 1

  const intervaloEnvio = setInterval(async () => {
    if (indice < asignaciones.length) {
      await enviarMensaje(asignaciones[indice].numero, asignaciones[indice].palabra, posicion);
      mensajesEnviados.push({
        ...asignaciones[indice],
        posicion, // Agregar la posición al mensaje enviado
        timestamp: Date.now()
      });
      indice++;
      posicion++; // Incrementar la posición para el siguiente mensaje
    } else {
      clearInterval(intervaloEnvio);
    }
  }, 3000);

  setTimeout(() => clearInterval(intervaloEnvio), 31000);
  res.status(200).json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});