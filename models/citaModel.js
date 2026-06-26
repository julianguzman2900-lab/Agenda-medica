// Ruta exacta: /models/citaModel.js
const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  // Referencia opcional al Usuario registrado (paciente)
  pacienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },
  nombrePaciente: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'El nombre no puede superar los 100 caracteres']
  },
  edadPaciente: {
    type: Number,
    required: true,
    min: [0, 'La edad no puede ser negativa'],
    max: [120, 'La edad no puede superar los 120 años']
  },
  correoPaciente: {
    type: String,
    required: true,
    trim: true,
    maxlength: [150, 'El correo no puede superar los 150 caracteres'],
    match: [/^\S+@\S+\.\S+$/, 'Formato de correo inválido']
  },
  telefonoPaciente: {
    type: String,
    required: true,
    trim: true,
    maxlength: [20, 'El teléfono no puede superar los 20 caracteres']
  },
  fecha: {
    type: String, // Almacenado como 'YYYY-MM-DD' para evitar desfases de zona horaria
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido. Use YYYY-MM-DD']
  },
  hora: {
    type: String, // Formato de 24 horas 'HH:MM' (ej: '08:00', '15:00')
    required: true,
    match: [/^\d{2}:\d{2}$/, 'Formato de hora inválido. Use HH:MM']
  },
  especialidad: {
    type: String,
    required: true,
    trim: true,
    enum: {
      values: ['Pediatría', 'Cardiología', 'Dermatología', 'Ginecología', 'Traumatología'],
      message: 'Especialidad no válida'
    }
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
    default: '',
    maxlength: [2000, 'El diagnóstico no puede superar los 2000 caracteres']
  }
});

/**
 * ÍNDICE COMPUESTO PARCIAL:
 * Garantiza unicidad de (fecha + hora + doctor) SOLO para citas NO canceladas.
 * Esto permite que un slot cancelado pueda ser reservado nuevamente.
 */
citaSchema.index(
  { fecha: 1, hora: 1, codigoEmpleadoDoctor: 1 },
  {
    unique: true,
    partialFilterExpression: { estado: { $in: ['pendiente', 'completada'] } }
  }
);

// Índices de rendimiento para campos de búsqueda frecuente
citaSchema.index({ correoPaciente: 1 });
citaSchema.index({ codigoEmpleadoDoctor: 1, fecha: 1 });

const Cita = mongoose.model('Cita', citaSchema);

module.exports = Cita;
