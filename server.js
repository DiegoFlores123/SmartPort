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

async function enviarMensaje(numeroDestino, palabra) {
  try {
    const message = await client.messages.create({
      body: `Tu palabra clave: ${palabra}`,
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
  const asignaciones = numerosLimitados
    .map((numero, index) => ({
      numero,
      palabra: PALABRAS_ALFABETO[index]
    }))
    .sort((a, b) => a.palabra.localeCompare(b.palabra))
    .map((asignacion, index) => ({
      ...asignacion,
      posicion: index + 1 // Agregar posición basada en el orden alfabético
    }));

  let indice = 0;
  const intervaloEnvio = setInterval(async () => {
    if (indice < asignaciones.length) {
      await enviarMensaje(asignaciones[indice].numero, asignaciones[indice].palabra);
      mensajesEnviados.push({
        ...asignaciones[indice],
        timestamp: Date.now()
      });
      indice++;
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