// Ruta exacta: /controllers/autenticacionController.js
const { Doctor } = require('../models/doctorModel');
const Usuario = require('../models/usuarioModel');

// Login de Doctor (Existente)
exports.loginDoctor = async (req, res) => {
  try {
    const { nombre, codigoEmpleado } = req.body;

    if (!nombre || !codigoEmpleado) {
      return res.status(400).json({ error: 'Nombre y código de empleado son obligatorios' });
    }

    // Búsqueda del doctor con coincidencia exacta
    const doctor = await Doctor.findOne({
      nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') },
      codigoEmpleado: codigoEmpleado.trim()
    });

    if (!doctor) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifique el nombre y código de empleado.' });
    }

    return res.status(200).json({
      mensaje: 'Autenticación exitosa',
      doctor: {
        nombre: doctor.nombre,
        codigoEmpleado: doctor.codigoEmpleado,
        especialidad: doctor.especialidad
      }
    });
  } catch (error) {
    console.error('Error en loginDoctor:', error);
    return res.status(500).json({ error: 'Error del servidor al autenticar' });
  }
};

// Registro de Paciente (Usuario)
exports.registrarPaciente = async (req, res) => {
  try {
    const { nombreCompleto, correo, contrasena } = req.body;

    if (!nombreCompleto || !correo || !contrasena) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios para el registro' });
    }

    // Verificar si el correo ya existe
    const usuarioExistente = await Usuario.findOne({ correo: correo.toLowerCase().trim() });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const nuevoUsuario = new Usuario({
      nombreCompleto: nombreCompleto.trim(),
      correo: correo.toLowerCase().trim(),
      contrasena: contrasena // Simulado de manera simple sin encriptar a petición del usuario de no usar cosas avanzadas
    });

    await nuevoUsuario.save();

    return res.status(201).json({
      mensaje: 'Usuario registrado con éxito',
      usuario: {
        nombreCompleto: nuevoUsuario.nombreCompleto,
        correo: nuevoUsuario.correo
      }
    });
  } catch (error) {
    console.error('Error en registrarPaciente:', error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar usuario' });
  }
};

// Login de Paciente
exports.loginPaciente = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    const usuario = await Usuario.findOne({ correo: correo.toLowerCase().trim() });

    if (!usuario || usuario.contrasena !== contrasena) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    return res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        nombreCompleto: usuario.nombreCompleto,
        correo: usuario.correo
      }
    });
  } catch (error) {
    console.error('Error en loginPaciente:', error);
    return res.status(500).json({ error: 'Error del servidor al iniciar sesión' });
  }
};
