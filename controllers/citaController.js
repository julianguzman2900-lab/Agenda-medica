// Ruta exacta: /controllers/citaController.js
const Cita = require('../models/citaModel');
const { Doctor } = require('../models/doctorModel');
const Usuario = require('../models/usuarioModel');

// ============================================================
// CONSTANTES Y HELPERS DE NEGOCIO (DRY — extraídos para reusar)
// ============================================================

// Bloques horarios permitidos de 8:00 AM a 4:00 PM (bloques de 1 hora)
const BLOQUES_HORARIOS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

// Máximo de citas por día por doctor
const LIMITE_DIARIO = 5;

// Regex de validación de fecha
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Regex de validación de correo
const CORREO_REGEX = /^\S+@\S+\.\S+$/;

// Especialidades bloqueadas los miércoles
const ESPECIALIDADES_BLOQUEADAS_MIERCOLES = ['Pediatría', 'Cardiología'];

/**
 * Caché en memoria de doctores (evita consultar la BD en cada request).
 * Formato: { 'Pediatría': { nombre, codigoEmpleado, especialidad, _id }, ... }
 */
let cacheDoctor = null;

const obtenerCacheDoctor = async () => {
  if (!cacheDoctor) {
    const doctores = await Doctor.find({});
    cacheDoctor = {};
    doctores.forEach(d => {
      cacheDoctor[d.especialidad] = d;
    });
  }
  return cacheDoctor;
};

// Exponer función para invalidar el caché si se modifican doctores
const invalidarCacheDoctor = () => { cacheDoctor = null; };

/**
 * Obtiene el día de la semana (0=Dom, 1=Lun, ..., 6=Sáb) para una fecha 'YYYY-MM-DD'.
 * Usa desestructuración para evitar problemas de zona horaria.
 */
const obtenerDiaDeLaSemana = (fechaStr) => {
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  return new Date(anio, mes - 1, dia).getDay();
};

/**
 * Valida si una fecha corresponde a un día hábil (Lunes a Viernes).
 * @returns {boolean}
 */
const esDiaHabil = (fechaStr) => {
  const dia = obtenerDiaDeLaSemana(fechaStr);
  return dia >= 1 && dia <= 5;
};

/**
 * Valida si una especialidad está disponible para una fecha dada.
 * Los miércoles, Pediatría y Cardiología no están disponibles.
 * @returns {boolean}
 */
const esEspecialidadDisponible = (especialidad, fechaStr) => {
  const dia = obtenerDiaDeLaSemana(fechaStr);
  if (dia === 3 && ESPECIALIDADES_BLOQUEADAS_MIERCOLES.includes(especialidad)) {
    return false;
  }
  return true;
};

/**
 * Manejador centralizado de errores de Mongoose.
 */
const manejarErrorMongo = (error, res, operacion) => {
  console.error(`Error en ${operacion}:`, error);
  if (error.code === 11000) {
    return res.status(409).json({
      error: 'Este horario ya está reservado con este doctor. Otro paciente acaba de tomar ese slot. Seleccione otra hora.'
    });
  }
  if (error.name === 'ValidationError') {
    const mensajes = Object.values(error.errors).map(e => e.message);
    return res.status(400).json({ error: mensajes.join('. ') });
  }
  return res.status(500).json({ error: 'Error interno del servidor.' });
};

// ============================================================
// OBTENER LISTA DE DOCTORES (para el frontend)
// ============================================================
exports.obtenerDoctores = async (req, res) => {
  try {
    const mapa = await obtenerCacheDoctor();
    const lista = Object.values(mapa).map(d => ({
      nombre: d.nombre,
      codigoEmpleado: d.codigoEmpleado,
      especialidad: d.especialidad
    }));
    return res.status(200).json({ doctores: lista });
  } catch (error) {
    return manejarErrorMongo(error, res, 'obtenerDoctores');
  }
};

// ============================================================
// CREAR CITA
// ============================================================
exports.crearCita = async (req, res) => {
  try {
    const {
      nombrePaciente,
      edadPaciente,
      correoPaciente,
      telefonoPaciente,
      fecha,
      hora,
      especialidad
    } = req.body;

    // 1. Validar campos requeridos
    if (!nombrePaciente || !edadPaciente || !correoPaciente || !telefonoPaciente || !fecha || !hora || !especialidad) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // 2. Validar formato de fecha
    if (!FECHA_REGEX.test(fecha)) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD.' });
    }

    // 3. Validar formato de correo
    if (!CORREO_REGEX.test(correoPaciente)) {
      return res.status(400).json({ error: 'Formato de correo electrónico inválido.' });
    }

    // 4. Validar rango de edad
    const edad = parseInt(edadPaciente, 10);
    if (isNaN(edad) || edad < 0 || edad > 120) {
      return res.status(400).json({ error: 'La edad debe ser un número entre 0 y 120.' });
    }

    // 5. Obtener doctor desde caché
    const mapa = await obtenerCacheDoctor();
    const doctor = mapa[especialidad];
    if (!doctor) {
      return res.status(404).json({ error: 'No se encontró un doctor asignado a esta especialidad.' });
    }

    // 6. Validar que la fecha sea un día hábil (Lunes a Viernes)
    if (!esDiaHabil(fecha)) {
      return res.status(400).json({ error: 'Solo se pueden agendar citas de lunes a viernes.' });
    }

    // 7. Restricción de miércoles para Pediatría y Cardiología
    if (!esEspecialidadDisponible(especialidad, fecha)) {
      return res.status(400).json({
        error: `Los días miércoles la especialidad de ${especialidad} no está disponible. Solo Dermatología, Ginecología y Traumatología atienden este día.`
      });
    }

    // 8. Validar que el bloque horario esté dentro de los permitidos
    if (!BLOQUES_HORARIOS.includes(hora)) {
      return res.status(400).json({ error: 'El bloque horario seleccionado no es válido. Rango: 8:00 AM a 4:00 PM.' });
    }

    // 9. Verificar que no haya empalme de horario con otro paciente (citas activas)
    const citaExistente = await Cita.findOne({
      fecha,
      hora,
      codigoEmpleadoDoctor: doctor.codigoEmpleado,
      estado: { $in: ['pendiente', 'completada'] }
    });

    if (citaExistente) {
      return res.status(400).json({ error: 'Este horario ya está reservado con este doctor. Seleccione otra hora.' });
    }

    // 10. Validar capacidad diaria del doctor (máximo LIMITE_DIARIO consultas)
    const totalCitasDia = await Cita.countDocuments({
      fecha,
      codigoEmpleadoDoctor: doctor.codigoEmpleado,
      estado: { $in: ['pendiente', 'completada'] }
    });

    if (totalCitasDia >= LIMITE_DIARIO) {
      return res.status(400).json({
        error: `El doctor ha alcanzado el límite máximo de ${LIMITE_DIARIO} consultas para este día. Por favor elija otra fecha.`
      });
    }

    // 11. Intentar encontrar el ID del paciente registrado (referencia opcional)
    let pacienteId = null;
    try {
      const usuario = await Usuario.findOne({ correo: correoPaciente.toLowerCase().trim() });
      if (usuario) pacienteId = usuario._id;
    } catch (_) { /* No es crítico si falla */ }

    // 12. Crear la cita
    const nuevaCita = new Cita({
      pacienteId,
      nombrePaciente: nombrePaciente.trim(),
      edadPaciente: edad,
      correoPaciente: correoPaciente.toLowerCase().trim(),
      telefonoPaciente: telefonoPaciente.trim(),
      fecha,
      hora,
      especialidad,
      codigoEmpleadoDoctor: doctor.codigoEmpleado,
      estado: 'pendiente',
      diagnostico: ''
    });

    await nuevaCita.save();

    // Incluir el nombre del doctor en la respuesta para evitar mapa hardcodeado en el cliente
    return res.status(201).json({
      mensaje: 'Cita agendada con éxito',
      cita: nuevaCita,
      nombreDoctor: doctor.nombre
    });

  } catch (error) {
    return manejarErrorMongo(error, res, 'crearCita');
  }
};

// ============================================================
// DISPONIBILIDAD DE HORAS
// ============================================================
exports.obtenerHorasDisponibles = async (req, res) => {
  try {
    const { especialidad, fecha } = req.query;

    if (!especialidad || !fecha) {
      return res.status(400).json({ error: 'Especialidad y fecha son requeridas.' });
    }

    // Validar formato de fecha
    if (!FECHA_REGEX.test(fecha)) {
      return res.status(400).json({ error: 'Formato de fecha inválido.' });
    }

    const mapa = await obtenerCacheDoctor();
    const doctor = mapa[especialidad];
    if (!doctor) {
      return res.status(404).json({ error: 'No hay doctor asignado a esta especialidad.' });
    }

    // 1. Validar día hábil
    if (!esDiaHabil(fecha)) {
      return res.status(200).json({ horasDisponibles: [], mensaje: 'No hay servicio los fines de semana.' });
    }

    // 2. Restricción de miércoles
    if (!esEspecialidadDisponible(especialidad, fecha)) {
      return res.status(200).json({
        horasDisponibles: [],
        mensaje: 'Pediatría y Cardiología no están disponibles los miércoles.'
      });
    }

    // 3. Verificar límite diario total
    const totalCitasDia = await Cita.countDocuments({
      fecha,
      codigoEmpleadoDoctor: doctor.codigoEmpleado,
      estado: { $in: ['pendiente', 'completada'] }
    });

    if (totalCitasDia >= LIMITE_DIARIO) {
      return res.status(200).json({
        horasDisponibles: [],
        mensaje: `El doctor ha alcanzado el límite máximo de ${LIMITE_DIARIO} consultas para este día.`
      });
    }

    // 4. Obtener horas ya reservadas (solo citas activas)
    const citasReservadas = await Cita.find({
      fecha,
      codigoEmpleadoDoctor: doctor.codigoEmpleado,
      estado: { $in: ['pendiente', 'completada'] }
    }).select('hora');

    const horasReservadas = citasReservadas.map(c => c.hora);

    // 5. Filtrar horas disponibles
    const horasDisponibles = BLOQUES_HORARIOS.filter(h => !horasReservadas.includes(h));

    return res.status(200).json({ horasDisponibles });

  } catch (error) {
    return manejarErrorMongo(error, res, 'obtenerHorasDisponibles');
  }
};

// ============================================================
// HISTORIAL DE CITAS DEL PACIENTE
// ============================================================
exports.obtenerHistorialPaciente = async (req, res) => {
  try {
    const { correo } = req.params;

    if (!correo) {
      return res.status(400).json({ error: 'El correo del paciente es requerido.' });
    }

    if (!CORREO_REGEX.test(correo)) {
      return res.status(400).json({ error: 'Formato de correo inválido.' });
    }

    const citas = await Cita.find({ correoPaciente: correo.toLowerCase().trim() })
      .sort({ fecha: -1, hora: -1 });

    return res.status(200).json({ citas });
  } catch (error) {
    return manejarErrorMongo(error, res, 'obtenerHistorialPaciente');
  }
};

// ============================================================
// CITAS DEL MES PARA EL DOCTOR
// ============================================================
exports.obtenerCitasMesDoctor = async (req, res) => {
  try {
    const { codigoEmpleado } = req.params;
    const { anioMes } = req.query; // Formato 'YYYY-MM'

    if (!codigoEmpleado) {
      return res.status(400).json({ error: 'El código de empleado es requerido.' });
    }

    let regexFiltro;
    if (anioMes && /^\d{4}-\d{2}$/.test(anioMes)) {
      regexFiltro = new RegExp(`^${anioMes}`);
    } else {
      const hoy = new Date();
      const mesStr = String(hoy.getMonth() + 1).padStart(2, '0');
      regexFiltro = new RegExp(`^${hoy.getFullYear()}-${mesStr}`);
    }

    const citas = await Cita.find({
      codigoEmpleadoDoctor: codigoEmpleado,
      fecha: { $regex: regexFiltro },
      estado: { $in: ['pendiente', 'completada'] }
    }).sort({ fecha: 1, hora: 1 });

    return res.status(200).json({ citas });

  } catch (error) {
    return manejarErrorMongo(error, res, 'obtenerCitasMesDoctor');
  }
};

// ============================================================
// FINALIZAR CITA (agregar diagnóstico)
// ============================================================
exports.finalizarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnostico } = req.body;

    if (!diagnostico || diagnostico.trim() === '') {
      return res.status(400).json({ error: 'El diagnóstico es obligatorio para dar por completada la cita.' });
    }

    if (diagnostico.trim().length > 2000) {
      return res.status(400).json({ error: 'El diagnóstico no puede superar los 2000 caracteres.' });
    }

    const cita = await Cita.findByIdAndUpdate(
      id,
      { estado: 'completada', diagnostico: diagnostico.trim() },
      { new: true, runValidators: true }
    );

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }

    return res.status(200).json({ mensaje: 'Cita completada y diagnóstico guardado.', cita });
  } catch (error) {
    return manejarErrorMongo(error, res, 'finalizarCita');
  }
};

// ============================================================
// REAGENDAR CITA
// ============================================================
exports.reagendarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, hora } = req.body;

    if (!fecha || !hora) {
      return res.status(400).json({ error: 'La nueva fecha y hora son requeridas.' });
    }

    // Validar formato de fecha
    if (!FECHA_REGEX.test(fecha)) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD.' });
    }

    const cita = await Cita.findById(id);
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }

    // Validar día hábil
    if (!esDiaHabil(fecha)) {
      return res.status(400).json({ error: 'Solo se atienden citas de lunes a viernes.' });
    }

    // Validar restricción de miércoles
    if (!esEspecialidadDisponible(cita.especialidad, fecha)) {
      return res.status(400).json({
        error: `La especialidad de ${cita.especialidad} no está disponible los miércoles.`
      });
    }

    // Validar que no haya empalme (excluyendo la cita actual)
    const empalme = await Cita.findOne({
      _id: { $ne: id },
      fecha,
      hora,
      codigoEmpleadoDoctor: cita.codigoEmpleadoDoctor,
      estado: { $in: ['pendiente', 'completada'] }
    });

    if (empalme) {
      return res.status(400).json({ error: 'El horario seleccionado ya está reservado.' });
    }

    // Validar límite diario (excluyendo la cita actual)
    const totalCitasDia = await Cita.countDocuments({
      _id: { $ne: id },
      fecha,
      codigoEmpleadoDoctor: cita.codigoEmpleadoDoctor,
      estado: { $in: ['pendiente', 'completada'] }
    });

    if (totalCitasDia >= LIMITE_DIARIO) {
      return res.status(400).json({ error: `El doctor ya tiene el límite de ${LIMITE_DIARIO} citas agendadas para esa fecha.` });
    }

    cita.fecha = fecha;
    cita.hora = hora;
    cita.estado = 'pendiente';
    await cita.save();

    return res.status(200).json({ mensaje: 'Cita reagendada con éxito.', cita });
  } catch (error) {
    return manejarErrorMongo(error, res, 'reagendarCita');
  }
};

// ============================================================
// CANCELAR / BORRAR CITA
// ============================================================
exports.eliminarCita = async (req, res) => {
  try {
    const { id } = req.params;

    const cita = await Cita.findByIdAndUpdate(
      id,
      { estado: 'cancelada' },
      { new: true }
    );

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }

    return res.status(200).json({ mensaje: 'Cita cancelada correctamente.', cita });
  } catch (error) {
    return manejarErrorMongo(error, res, 'eliminarCita');
  }
};

// ============================================================
// HISTORIAL DEL DOCTOR (pacientes atendidos)
// ============================================================
exports.obtenerHistorialDoctor = async (req, res) => {
  try {
    const { codigoEmpleado } = req.params;

    if (!codigoEmpleado) {
      return res.status(400).json({ error: 'El código de empleado es requerido.' });
    }

    const citasCompletadas = await Cita.find({
      codigoEmpleadoDoctor: codigoEmpleado,
      estado: 'completada'
    }).sort({ fecha: -1, hora: -1 });

    return res.status(200).json({ citas: citasCompletadas });
  } catch (error) {
    return manejarErrorMongo(error, res, 'obtenerHistorialDoctor');
  }
};

// ============================================================
// CONSULTAS PREVIAS DE UN PACIENTE (para el doctor)
// ============================================================
exports.obtenerConsultasPacienteParaDoctor = async (req, res) => {
  try {
    const { correo } = req.query;

    if (!correo) {
      return res.status(400).json({ error: 'El correo del paciente es requerido.' });
    }

    if (!CORREO_REGEX.test(correo)) {
      return res.status(400).json({ error: 'Formato de correo inválido.' });
    }

    const historial = await Cita.find({
      correoPaciente: correo.toLowerCase().trim(),
      estado: 'completada'
    }).sort({ fecha: -1, hora: -1 });

    return res.status(200).json({ historial });
  } catch (error) {
    return manejarErrorMongo(error, res, 'obtenerConsultasPacienteParaDoctor');
  }
};
