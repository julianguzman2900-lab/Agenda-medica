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

    // 5. Crear citas de prueba pasadas (completadas con diagnóstico) y futuras (pendientes)
    // Fechas ficticias relativas a junio de 2026 (por ejemplo, hoy es jueves 25 de junio de 2026)
    // 22 de junio de 2026 (Lunes), 23 de junio de 2026 (Martes), 29 de junio de 2026 (Lunes)
    const citas = [
      {
        nombrePaciente: 'Santiago Guzmán',
        edadPaciente: 28,
        correoPaciente: 'paciente@guzman.com',
        telefonoPaciente: '3001234567',
        fecha: '2026-06-22',
        hora: '09:00',
        especialidad: 'Dermatología',
        codigoEmpleadoDoctor: 'DOC003',
        estado: 'completada',
        diagnostico: 'Dermatitis leve por contacto. Se receta hidrocortisona en crema al 1% cada 12 horas por 5 días y evitar jabones perfumados.'
      },
      {
        nombrePaciente: 'Santiago Guzmán',
        edadPaciente: 28,
        correoPaciente: 'paciente@guzman.com',
        telefonoPaciente: '3001234567',
        fecha: '2026-06-23',
        hora: '11:00',
        especialidad: 'Cardiología',
        codigoEmpleadoDoctor: 'DOC002',
        estado: 'completada',
        diagnostico: 'Chequeo general de ritmo cardíaco. Electrocardiograma normal. Se recomienda continuar ejercicio moderado y reducir consumo de sodio.'
      },
      {
        nombrePaciente: 'Santiago Guzmán',
        edadPaciente: 28,
        correoPaciente: 'paciente@guzman.com',
        telefonoPaciente: '3001234567',
        fecha: '2026-06-29',
        hora: '08:00',
        especialidad: 'Pediatría',
        codigoEmpleadoDoctor: 'DOC001',
        estado: 'pendiente',
        diagnostico: ''
      },
      {
        nombrePaciente: 'Santiago Guzmán',
        edadPaciente: 28,
        correoPaciente: 'paciente@guzman.com',
        telefonoPaciente: '3001234567',
        fecha: '2026-06-30',
        hora: '10:00',
        especialidad: 'Traumatología',
        codigoEmpleadoDoctor: 'DOC005',
        estado: 'pendiente',
        diagnostico: ''
      },
      {
        nombrePaciente: 'Santiago Guzmán',
        edadPaciente: 28,
        correoPaciente: 'paciente@guzman.com',
        telefonoPaciente: '3001234567',
        fecha: '2026-07-01',
        hora: '14:00',
        especialidad: 'Ginecología',
        codigoEmpleadoDoctor: 'DOC004',
        estado: 'pendiente',
        diagnostico: ''
      }
    ];

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
