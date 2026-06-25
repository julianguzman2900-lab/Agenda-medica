// Ruta exacta: /controllers/citaController.js
const Cita = require('../models/citaModel');
const { Doctor } = require('../models/doctorModel');

// Bloques horarios permitidos de 8:00 AM a 4:00 PM (bloques de 1 hora)
const BLOQUES_HORARIOS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

// Helper para obtener el día de la semana (0 = Domingo, 1 = Lunes, ..., 5 = Viernes, 6 = Sábado)
const obtenerDiaDeLaSemana = (fechaStr) => {
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.getDay();
};

// Crear Cita con validaciones estrictas
exports.crearCita = async (req, res) => {
  try {
    const {
      nombrePaciente,
      edadPaciente,
      correoPaciente,
      telefonoPaciente,
      fecha, // Formato 'YYYY-MM-DD'
      hora,  // Formato 'HH:MM'
      especialidad
    } = req.body;

    // 1. Validar campos requeridos
    if (!nombrePaciente || !edadPaciente || !correoPaciente || !telefonoPaciente || !fecha || !hora || !especialidad) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // 2. Buscar al doctor correspondiente a la especialidad (solo 1 doctor por especialidad)
    const doctor = await Doctor.findOne({ especialidad });
    if (!doctor) {
      return res.status(404).json({ error: 'No se encontró un doctor asignado a esta especialidad' });
    }

    // 3. Validar que la fecha sea de lunes a viernes (1 a 5)
    const diaSemana = obtenerDiaDeLaSemana(fecha);
    if (diaSemana === 0 || diaSemana === 6) {
      return res.status(400).json({ error: 'Solo se pueden agendar citas de lunes a viernes.' });
    }

    // 4. Restricción de Miércoles para Pediatría y Cardiología
    // En miércoles (3), solo están disponibles 3 de las 5 especialidades.
    // Deshabilitamos Pediatría y Cardiología.
    if (diaSemana === 3) {
      if (especialidad === 'Pediatría' || especialidad === 'Cardiología') {
        return res.status(400).json({
          error: `Los días miércoles la especialidad de ${especialidad} no está disponible. Solo Dermatología, Ginecología y Traumatología atienden este día.`
        });
      }
    }

    // 5. Validar que el bloque horario esté dentro de los permitidos
    if (!BLOQUES_HORARIOS.includes(hora)) {
      return res.status(400).json({ error: 'El bloque horario seleccionado no es válido. Rango: 8:00 AM a 4:00 PM.' });
    }

    // 6. Validar que no se empalme el horario (no puede existir otra cita ACTIVA en la misma fecha, hora y doctor)
    const citaExistente = await Cita.findOne({
      fecha,
      hora,
      codigoEmpleadoDoctor: doctor.codigoEmpleado,
      estado: { $ne: 'cancelada' } // Ignorar citas canceladas/borradas
    });

    if (citaExistente) {
      return res.status(400).json({ error: 'Este horario ya está reservado con este doctor. Seleccione otra hora.' });
    }

    // 7. Validar capacidad diaria del doctor (máximo 5 consultas al día)
    const totalCitasDia = await Cita.countDocuments({
      fecha,
      codigoEmpleadoDoctor: doctor.codigoEmpleado,
      estado: { $ne: 'cancelada' }
    });

    if (totalCitasDia >= 5) {
      return res.status(400).json({
        error: 'El doctor ha alcanzado el límite máximo de 5 consultas para este día. Por favor elija otra fecha.'
      });
    }

    // 8. Crear la cita
    const nuevaCita = new Cita({
      nombrePaciente,
      edadPaciente: parseInt(edadPaciente, 10),
      correoPaciente: correoPaciente.toLowerCase().trim(),
      telefonoPaciente,
      fecha,
      hora,
      especialidad,
      codigoEmpleadoDoctor: doctor.codigoEmpleado,
      estado: 'pendiente',
      diagnostico: ''
    });

    await nuevaCita.save();
    return res.status(201).json({ mensaje: 'Cita agendada con éxito', cita: nuevaCita });

  } catch (error) {
    console.error('Error al crear cita:', error);
    return res.status(500).json({ error: 'Error interno del servidor al crear la cita.' });
  }
};

// Consultar citas del mes actual para el doctor logueado
exports.obtenerCitasMesDoctor = async (req, res) => {
  try {
    const { codigoEmpleado } = req.params;
    const { anioMes } = req.query; // Formato esperado 'YYYY-MM'

    if (!codigoEmpleado) {
      return res.status(400).json({ error: 'El código de empleado es requerido.' });
    }

    let regexFiltro;
    if (anioMes) {
      regexFiltro = new RegExp(`^${anioMes}`);
    } else {
      // Por defecto del mes actual
      const hoy = new Date();
      const mesStr = String(hoy.getMonth() + 1).padStart(2, '0');
      regexFiltro = new RegExp(`^${hoy.getFullYear()}-${mesStr}`);
    }

    // Buscar citas del doctor en ese mes que no estén canceladas
    const citas = await Cita.find({
      codigoEmpleadoDoctor: codigoEmpleado,
      fecha: { $regex: regexFiltro },
      estado: { $ne: 'cancelada' }
    }).sort({ fecha: 1, hora: 1 });

    return res.status(200).json({ citas });

  } catch (error) {
    console.error('Error al obtener citas mensuales:', error);
    return res.status(500).json({ error: 'Error al consultar las citas mensuales del doctor.' });
  }
};

// Obtener bloques de horas libres para una especialidad y fecha específica
exports.obtenerHorasDisponibles = async (req, res) => {
  try {
    const { especialidad, fecha } = req.query;

    if (!especialidad || !fecha) {
      return res.status(400).json({ error: 'Especialidad y fecha son requeridas.' });
    }

    const doctor = await Doctor.findOne({ especialidad });
    if (!doctor) {
      return res.status(404).json({ error: 'No hay doctor asignado a esta especialidad.' });
    }

    // 1. Validar que sea de lunes a viernes
    const diaSemana = obtenerDiaDeLaSemana(fecha);
    if (diaSemana === 0 || diaSemana === 6) {
      return res.status(200).json({ horasDisponibles: [], mensaje: 'No hay servicio los fines de semana.' });
    }

    // 2. Restricción de Miércoles (solo 3 de las 5 disponibles)
    if (diaSemana === 3 && (especialidad === 'Pediatría' || especialidad === 'Cardiología')) {
      return res.status(200).json({ horasDisponibles: [], mensaje: 'Pediatría y Cardiología no están disponibles los miércoles.' });
    }

    // 3. Verificar límite diario total (máximo 5 citas)
    const totalCitasDia = await Cita.countDocuments({
      fecha,
      codigoEmpleadoDoctor: doctor.codigoEmpleado,
      estado: { $ne: 'cancelada' }
    });

    if (totalCitasDia >= 5) {
      return res.status(200).json({ horasDisponibles: [], mensaje: 'El doctor ha alcanzado el límite máximo de 5 consultas para este día.' });
    }

    // 4. Obtener horas ya reservadas
    const citasReservadas = await Cita.find({
      fecha,
      codigoEmpleadoDoctor: doctor.codigoEmpleado,
      estado: { $ne: 'cancelada' }
    }).select('hora');

    const horasReservadas = citasReservadas.map(c => c.hora);

    // 5. Filtrar horas disponibles
    const horasDisponibles = BLOQUES_HORARIOS.filter(hora => !horasReservadas.includes(hora));

    return res.status(200).json({ horasDisponibles });

  } catch (error) {
    console.error('Error al obtener horas disponibles:', error);
    return res.status(500).json({ error: 'Error al calcular disponibilidad.' });
  }
};

// Historial de Citas del Paciente (filtrado por correo electrónico)
exports.obtenerHistorialPaciente = async (req, res) => {
  try {
    const { correo } = req.params;

    if (!correo) {
      return res.status(400).json({ error: 'El correo del paciente es requerido.' });
    }

    // Obtener todas las citas que ha reservado el paciente, ordenadas por fecha/hora descendente
    const citas = await Cita.find({ correoPaciente: correo.toLowerCase().trim() })
      .sort({ fecha: -1, hora: -1 });

    return res.status(200).json({ citas });
  } catch (error) {
    console.error('Error al obtener historial del paciente:', error);
    return res.status(500).json({ error: 'Error al consultar el historial de citas.' });
  }
};

// Completar cita agregando diagnóstico
exports.finalizarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnostico } = req.body;

    if (!diagnostico || diagnostico.trim() === '') {
      return res.status(400).json({ error: 'El diagnóstico es obligatorio para dar por completada la cita.' });
    }

    const cita = await Cita.findByIdAndUpdate(
      id,
      { estado: 'completada', diagnostico: diagnostico.trim() },
      { new: true }
    );

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }

    return res.status(200).json({ mensaje: 'Cita completada y diagnóstico guardado.', cita });
  } catch (error) {
    console.error('Error al finalizar la cita:', error);
    return res.status(500).json({ error: 'Error del servidor al finalizar la cita.' });
  }
};

// Reagendar cita (cambiar fecha y hora)
exports.reagendarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, hora } = req.body;

    if (!fecha || !hora) {
      return res.status(400).json({ error: 'La nueva fecha y hora son requeridas.' });
    }

    const cita = await Cita.findById(id);
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }

    // Validar que sea de lunes a viernes
    const diaSemana = obtenerDiaDeLaSemana(fecha);
    if (diaSemana === 0 || diaSemana === 6) {
      return res.status(400).json({ error: 'Solo se atienden citas de lunes a viernes.' });
    }

    // Validar restricción de miércoles
    if (diaSemana === 3 && (cita.especialidad === 'Pediatría' || cita.especialidad === 'Cardiología')) {
      return res.status(400).json({ error: `La especialidad de ${cita.especialidad} no está disponible los miércoles.` });
    }

    // Validar que no se empalme
    const empalme = await Cita.findOne({
      _id: { $ne: id },
      fecha,
      hora,
      codigoEmpleadoDoctor: cita.codigoEmpleadoDoctor,
      estado: { $ne: 'cancelada' }
    });

    if (empalme) {
      return res.status(400).json({ error: 'El horario seleccionado ya está reservado.' });
    }

    // Validar límite diario de 5 consultas
    const totalCitasDia = await Cita.countDocuments({
      _id: { $ne: id },
      fecha,
      codigoEmpleadoDoctor: cita.codigoEmpleadoDoctor,
      estado: { $ne: 'cancelada' }
    });

    if (totalCitasDia >= 5) {
      return res.status(400).json({ error: 'El doctor ya tiene el límite de 5 citas agendadas para esa fecha.' });
    }

    // Actualizar cita
    cita.fecha = fecha;
    cita.hora = hora;
    cita.estado = 'pendiente'; // Al reagendar se vuelve a poner pendiente
    await cita.save();

    return res.status(200).json({ mensaje: 'Cita reagendada con éxito.', cita });
  } catch (error) {
    console.error('Error al reagendar cita:', error);
    return res.status(500).json({ error: 'Error del servidor al reagendar la cita.' });
  }
};

// Cancelar o Borrar cita
exports.eliminarCita = async (req, res) => {
  try {
    const { id } = req.params;

    // En lugar de borrar físicamente, cambiamos el estado a 'cancelada' para no perder historial de canceladas
    // o podemos borrarla. El prompt dice "borrar la cita". Vamos a cambiar su estado a 'cancelada'
    // para que no cuente en los límites y no aparezca en el calendario del doctor, pero sí quede registro histórico.
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
    console.error('Error al borrar la cita:', error);
    return res.status(500).json({ error: 'Error del servidor al cancelar la cita.' });
  }
};

// Historial del Doctor (lista de pacientes atendidos)
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
    console.error('Error al obtener historial del doctor:', error);
    return res.status(500).json({ error: 'Error al consultar el historial médico.' });
  }
};

// Ver todas las consultas anteriores de un paciente (para que el doctor vea el historial del paciente)
exports.obtenerConsultasPacienteParaDoctor = async (req, res) => {
  try {
    const { correo } = req.query;

    if (!correo) {
      return res.status(400).json({ error: 'El correo del paciente es requerido.' });
    }

    // Buscamos todas las citas del paciente que estén completadas (es decir, con diagnósticos previos)
    const historial = await Cita.find({
      correoPaciente: correo.toLowerCase().trim(),
      estado: 'completada'
    }).sort({ fecha: -1, hora: -1 });

    return res.status(200).json({ historial });
  } catch (error) {
    console.error('Error al obtener consultas previas del paciente:', error);
    return res.status(500).json({ error: 'Error al consultar historial de diagnósticos del paciente.' });
  }
};
