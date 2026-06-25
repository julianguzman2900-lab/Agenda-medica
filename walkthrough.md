# Walkthrough: Agenda Médica Virtual

Hemos completado la reestructuración completa del sistema de reservas y panel médico, implementando todas las validaciones de negocio solicitadas y organizando el código bajo el patrón MVC con Node.js, Express y Mongoose.

## Cambios Realizados

1. **Modelos (`models/`):**
   - [NEW] [usuarioModel.js](file:///c:/Users/julia/Desktop/agenda%20ati/models/usuarioModel.js) para soportar el registro y login de pacientes.
   - [MODIFY] [doctorModel.js](file:///c:/Users/julia/Desktop/agenda%20ati/models/doctorModel.js) ajustado para contener exactamente las 5 especialidades médicas y sus correspondientes doctores únicos. Se eliminaron todas las referencias a pisos o consultorios.
   - [MODIFY] [citaModel.js](file:///c:/Users/julia/Desktop/agenda%20ati/models/citaModel.js) modificado para soportar `estado` ('pendiente', 'completada', 'cancelada') y `diagnostico`. Se eliminaron los campos de piso o consultorio.

2. **Controladores y Rutas:**
   - [MODIFY] [autenticacionController.js](file:///c:/Users/julia/Desktop/agenda%20ati/controllers/autenticacionController.js) añade registro y login de pacientes (validando credenciales en base de datos) y conserva el login de doctores.
   - [MODIFY] [citaController.js](file:///c:/Users/julia/Desktop/agenda%20ati/controllers/citaController.js) implementa validaciones estrictas:
     - Días laborables (Lunes a Viernes únicamente).
     - Límite máximo de 5 citas al día por doctor.
     - Bloqueo de horas ya reservadas por otros pacientes con el mismo doctor (los pacientes pueden agendar más de una cita el mismo día, pero no en una hora ya apartada).
     - Restricción de miércoles: inhabilitar Pediatría y Cardiología (solo 3 de las 5 especialidades disponibles).
     - Obtención de citas del mes completo para el doctor.
     - Historial de diagnósticos del paciente disponible tanto en el panel del doctor (consultas anteriores de ese paciente) como en el historial del paciente.
   - [MODIFY] [agendaRoutes.js](file:///c:/Users/julia/Desktop/agenda%20ati/routes/agendaRoutes.js) actualiza todas las rutas API necesarias.

3. **Frontend (`public/`):**
   - [MODIFY] [index.html](file:///c:/Users/julia/Desktop/agenda%20ati/public/index.html) añade un flujo de inicio de sesión y registro para pacientes. Se incorporó una cuadrícula interactiva de calendario semanal en grande y una sección de historial del paciente con sus respectivos diagnósticos emitidos.
   - [MODIFY] [panel.html](file:///c:/Users/julia/Desktop/agenda%20ati/public/panel.html) actualiza el dashboard médico implementando una cuadrícula de calendario mensual interactiva, sección de historial de pacientes atendidos, modales para finalizar consultas (con diagnóstico), reagendar y borrar citas.
   - [MODIFY] [agendaApp.js](file:///c:/Users/julia/Desktop/agenda%20ati/public/agendaApp.js) maneja el renderizado interactivo del calendario semanal y mensual, control de sesiones en local storage, y las peticiones a la API.

---

## Médicos y Códigos en el Sistema

A continuación se detalla la tabla de doctores inicializados en la base de datos MongoDB:

| Doctor | Código de Empleado | Especialidad Médica |
| :--- | :--- | :--- |
| **Dr. Carlos Mendoza** | `DOC001` | Pediatría |
| **Dra. Ana Restrepo** | `DOC002` | Cardiología |
| **Dr. Luis Gómez** | `DOC003` | Dermatología |
| **Dra. Laura Espinosa** | `DOC004` | Ginecología |
| **Dr. Roberto Pineda** | `DOC005` | Traumatología |
