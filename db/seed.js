// Ruta exacta: /db/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const conectarDB = require('./conexion');
const { Doctor } = require('../models/doctorModel');
const Usuario = require('../models/usuarioModel');
const Cita = require('../models/citaModel');

const seedDatabase = async () => {
  try {
    // 1. Conectar a la base de datos
    await conectarDB();
    console.log('Iniciando proceso de seed...');

    // 2. Limpiar colecciones
    await Doctor.deleteMany({});
    await Usuario.deleteMany({});
    await Cita.deleteMany({});
    console.log('Colecciones existentes eliminadas.');

    // 3. Insertar los 5 doctores con sus especialidades correspondientes
    const doctores = [
      { nombre: 'Dr. Carlos Mendoza', codigoEmpleado: 'DOC001', especialidad: 'Pediatría' },
      { nombre: 'Dra. Ana Restrepo', codigoEmpleado: 'DOC002', especialidad: 'Cardiología' },
      { nombre: 'Dr. Luis Gómez', codigoEmpleado: 'DOC003', especialidad: 'Dermatología' },
      { nombre: 'Dra. Laura Espinosa', codigoEmpleado: 'DOC004', especialidad: 'Ginecología' },
      { nombre: 'Dr. Roberto Pineda', codigoEmpleado: 'DOC005', especialidad: 'Traumatología' }
    ];

    const doctoresInsertados = await Doctor.insertMany(doctores);
    console.log('Doctores inicializados correctamente:', doctoresInsertados.length);

    // 4. Crear paciente de prueba principal (Usuario)
    const usuarioPrueba = new Usuario({
      nombreCompleto: 'Santiago Guzmán',
      correo: 'paciente@guzman.com',
      contrasena: '123456'
    });
    await usuarioPrueba.save();
    console.log('Paciente de prueba creado (paciente@guzman.com / 123456)');

   

    await Cita.insertMany(citas);
    console.log('Citas de prueba creadas exitosamente.');

    console.log('Proceso de seed completado exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error al ejecutar el seed de la base de datos:', error);
    process.exit(1);
  }
};

seedDatabase();
