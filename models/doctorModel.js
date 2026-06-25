// Ruta exacta: /models/doctorModel.js
const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  codigoEmpleado: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  especialidad: {
    type: String,
    required: true,
    unique: true, // Cada especialidad médica tiene exactamente 1 doctor único
    trim: true
  }
});

const Doctor = mongoose.model('Doctor', doctorSchema);

// Función para inicializar (seed) los 5 doctores si la colección está vacía
const inicializarDoctores = async () => {
  try {
    const conteo = await Doctor.countDocuments();
    if (conteo === 0) {
      const doctoresIniciales = [
        { nombre: 'Dr. Carlos Mendoza', codigoEmpleado: 'DOC001', especialidad: 'Pediatría' },
        { nombre: 'Dra. Ana Restrepo', codigoEmpleado: 'DOC002', especialidad: 'Cardiología' },
        { nombre: 'Dr. Luis Gómez', codigoEmpleado: 'DOC003', especialidad: 'Dermatología' },
        { nombre: 'Dra. Laura Espinosa', codigoEmpleado: 'DOC004', especialidad: 'Ginecología' },
        { nombre: 'Dr. Roberto Pineda', codigoEmpleado: 'DOC005', especialidad: 'Traumatología' }
      ];
      await Doctor.insertMany(doctoresIniciales);
      console.log('Base de datos inicializada: Se registraron las 5 especialidades y sus doctores.');
    }
  } catch (error) {
    console.error('Error al inicializar los doctores:', error);
  }
};

module.exports = {
  Doctor,
  inicializarDoctores
};
