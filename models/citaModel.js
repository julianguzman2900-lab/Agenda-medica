// Ruta exacta: /models/citaModel.js
const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  nombrePaciente: {
    type: String,
    required: true,
    trim: true
  },
  edadPaciente: {
    type: Number,
    required: true
  },
  correoPaciente: {
    type: String,
    required: true,
    trim: true
  },
  telefonoPaciente: {
    type: String,
    required: true,
    trim: true
  },
  fecha: {
    type: String, // Almacenado como 'YYYY-MM-DD' para evitar problemas de desfase horario
    required: true
  },
  hora: {
    type: String, // Almacenado en formato de 24 horas 'HH:MM' (ej: '08:00', '15:00')
    required: true
  },
  especialidad: {
    type: String,
    required: true,
    trim: true
  },
  codigoEmpleadoDoctor: {
    type: String,
    required: true,
    trim: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'completada', 'cancelada'],
    default: 'pendiente'
  },
  diagnostico: {
    type: String,
    default: ''
  }
});

// Índice compuesto para evitar empalmes a nivel base de datos (por doctor, fecha y hora)
citaSchema.index({ fecha: 1, hora: 1, codigoEmpleadoDoctor: 1 }, { unique: true });

const Cita = mongoose.model('Cita', citaSchema);

module.exports = Cita;
