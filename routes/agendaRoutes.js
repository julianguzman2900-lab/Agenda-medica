// Ruta exacta: /routes/agendaRoutes.js
const express = require('express');
const router = express.Router();
const autenticacionController = require('../controllers/autenticacionController');
const citaController = require('../controllers/citaController');

// 1. Rutas de autenticación
router.post('/auth/doctor', autenticacionController.loginDoctor);
router.post('/auth/paciente/registro', autenticacionController.registrarPaciente);
router.post('/auth/paciente/login', autenticacionController.loginPaciente);

// 2. Disponibilidad
router.get('/disponibilidad', citaController.obtenerHorasDisponibles);

// 3. Gestión de Citas (Pacientes)
router.post('/citas', citaController.crearCita);
router.get('/citas/paciente/:correo', citaController.obtenerHistorialPaciente);

// 4. Gestión de Citas (Doctores)
router.get('/citas/doctor/:codigoEmpleado/mes', citaController.obtenerCitasMesDoctor);
router.get('/citas/doctor/:codigoEmpleado/historial', citaController.obtenerHistorialDoctor);
router.get('/citas/paciente-historial-diagnosticos', citaController.obtenerConsultasPacienteParaDoctor);

// Acciones del doctor sobre citas específicas
router.put('/citas/:id/finalizar', citaController.finalizarCita);
router.put('/citas/:id/reagendar', citaController.reagendarCita);
router.delete('/citas/:id', citaController.eliminarCita);

module.exports = router;
