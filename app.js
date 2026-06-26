// Ruta exacta: /app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const conectarDB = require('./db/conexion');
const { inicializarDoctores } = require('./models/doctorModel');
const agendaRoutes = require('./routes/agendaRoutes');

const app = express();

// 1. Conexión de base de datos
conectarDB().then(async () => {
  // Inicialización (seed) de doctores
  await inicializarDoctores();
});

// 2. Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del cliente desde la carpeta /public
app.use(express.static(path.join(__dirname, 'public')));

// 3. Rutas de la API
app.use('/api', agendaRoutes);

// Servir archivos HTML explícitos como fallback para rutas directas
app.get('/panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'panel.html'));
});

// 4. Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Centro Médico Guzmán] Servidor en ejecución sobre el puerto ${PORT}`);
  console.log(`Acceso cliente paciente: http://localhost:${PORT}`);
  console.log(`Acceso panel de doctores: http://localhost:${PORT}/panel.html`);
});
