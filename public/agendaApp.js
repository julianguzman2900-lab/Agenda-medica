// Ruta exacta: /public/agendaApp.js

document.addEventListener('DOMContentLoaded', () => {
  // --- ELEMENTOS PACIENTES (index.html) ---
  const authSection = document.getElementById('authSection');
  const mainAppSection = document.getElementById('mainAppSection');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegistroBtn = document.getElementById('tabRegistroBtn');
  const loginForm = document.getElementById('loginForm');
  const registroForm = document.getElementById('registroForm');
  const reservaForm = document.getElementById('reservaForm');
  const notification = document.getElementById('notification');
  const infoPacienteNombre = document.getElementById('infoPacienteNombre');
  const infoPacienteCorreo = document.getElementById('infoPacienteCorreo');
  const logoutPacienteBtn = document.getElementById('logoutPacienteBtn');
  
  // Elementos del formulario de reserva
  const especialidadSelect = document.getElementById('especialidad');
  const calendarWeekGrid = document.getElementById('calendarWeekGrid');
  const prevWeekBtn = document.getElementById('prevWeekBtn');
  const nextWeekBtn = document.getElementById('nextWeekBtn');
  const weekLabel = document.getElementById('weekLabel');
  const horasSeccion = document.getElementById('horasSeccion');
  const horasGrid = document.getElementById('horasGrid');
  const horasMensaje = document.getElementById('horasMensaje');

  // Modal Resumen Paciente
  const resumenModal = document.getElementById('resumenModal');
  const cerrarResumenBtn = document.getElementById('cerrarResumenBtn');
  const resumenPaciente = document.getElementById('resumenPaciente');
  const resumenEspecialidad = document.getElementById('resumenEspecialidad');
  const resumenDoctor = document.getElementById('resumenDoctor');
  const resumenFecha = document.getElementById('resumenFecha');
  const resumenHora = document.getElementById('resumenHora');

  // Historial Paciente
  const historialPacienteBody = document.getElementById('historialPacienteBody');
  const sinHistorialMensaje = document.getElementById('sinHistorialMensaje');

  // --- VARIABLES DE ESTADO PACIENTE ---
  let pacienteSesion = JSON.parse(localStorage.getItem('pacienteSesion')) || null;
  let fechaSeleccionada = '';
  let horaSeleccionada = '';
  let semanaOffset = 0; // 0 = semana actual, 1 = semana siguiente...

  // --- ELEMENTOS DOCTORES (panel.html) ---
  const loginCard = document.getElementById('loginCard');
  const dashboardCard = document.getElementById('dashboardCard');
  const loginDoctorForm = document.getElementById('loginDoctorForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const notificationPanel = document.getElementById('notificationPanel');
  const infoDoctorNombre = document.getElementById('infoDoctorNombre');
  const infoDoctorEspecialidad = document.getElementById('infoDoctorEspecialidad');
  const tabCalendarioBtn = document.getElementById('tabCalendarioBtn');
  const tabHistorialBtn = document.getElementById('tabHistorialBtn');
  const seccionCalendario = document.getElementById('seccionCalendario');
  const seccionHistorial = document.getElementById('seccionHistorial');

  // Calendario mensual
  const currentMonthLabel = document.getElementById('currentMonthLabel');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  const calendarGridDays = document.getElementById('calendarGridDays');

  // Historial Doctor
  const historialDoctorBody = document.getElementById('historialDoctorBody');
  const sinPacientesMensaje = document.getElementById('sinPacientesMensaje');

  // Modal Doctor Acciones
  const citaModal = document.getElementById('citaModal');
  const cerrarModalBtn = document.getElementById('cerrarModalBtn');
  const modalCitaTitulo = document.getElementById('modalCitaTitulo');
  const detPaciente = document.getElementById('detPaciente');
  const detEdad = document.getElementById('detEdad');
  const detTelefono = document.getElementById('detTelefono');
  const detCorreo = document.getElementById('detCorreo');
  const detFechaHora = document.getElementById('detFechaHora');
  const detEstado = document.getElementById('detEstado');
  const historialPacientePrevio = document.getElementById('historialPacientePrevio');
  const inputDiagnostico = document.getElementById('inputDiagnostico');
  const btnFinalizarCita = document.getElementById('btnFinalizarCita');
  const btnBorrarCita = document.getElementById('btnBorrarCita');
  const btnMostrarReagendar = document.getElementById('btnMostrarReagendar');
  const btnCancelarReagendar = document.getElementById('btnCancelarReagendar');
  const btnGuardarReagendar = document.getElementById('btnGuardarReagendar');
  const reagendarContainer = document.getElementById('reagendarContainer');
  const reagendarFecha = document.getElementById('reagendarFecha');
  const reagendarHorasSeccion = document.getElementById('reagendarHorasSeccion');
  const reagendarHorasGrid = document.getElementById('reagendarHorasGrid');
  const botonesAccionCita = document.getElementById('botonesAccionCita');
  const botonesConfirmarReagendado = document.getElementById('botonesConfirmarReagendado');

  // --- VARIABLES DE ESTADO DOCTOR ---
  let doctorSesion = JSON.parse(localStorage.getItem('doctorSesion')) || null;
  let fechaActualDoctor = new Date(); // Para el mes del calendario
  let citaSeleccionadaId = null;
  let citaSeleccionadaPacienteEmail = '';
  let horaReagendarSeleccionada = '';

  // ==========================================
  // LÓGICA DE PACIENTES (index.html)
  // ==========================================
  if (authSection || mainAppSection) {
    if (pacienteSesion) {
      mostrarAppPaciente();
    } else {
      mostrarAuthPaciente();
    }

    // Toggle de pestañas Login / Registro
    if (tabLoginBtn && tabRegistroBtn) {
      tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.classList.add('active');
        tabRegistroBtn.classList.remove('active');
        loginForm.style.display = 'block';
        registroForm.style.display = 'none';
      });

      tabRegistroBtn.addEventListener('click', () => {
        tabRegistroBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        registroForm.style.display = 'block';
        loginForm.style.display = 'none';
      });
    }

    // Submit de Registro
    if (registroForm) {
      registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombreCompleto = document.getElementById('regNombre').value.trim();
        const correo = document.getElementById('regCorreo').value.trim();
        const contrasena = document.getElementById('regContrasena').value.trim();

        try {
          const res = await fetch('/api/auth/paciente/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombreCompleto, correo, contrasena })
          });
          const data = await res.json();

          if (!res.ok) {
            mostrarNotificacion(data.error || 'Error al registrar', 'error');
            return;
          }

          // Mostrar mensaje de éxito verde bien visible
          mostrarNotificacion(`✅ ¡Cuenta creada con éxito! Bienvenido/a, ${nombreCompleto}. Ahora inicia sesión con tus datos.`, 'success');
          
          // Limpiar el formulario de registro
          registroForm.reset();

          // Redirigir a la pestaña de Login automáticamente después de 1.5 segundos
          setTimeout(() => {
            tabLoginBtn.click();
          }, 1500);

        } catch (err) {
          console.error(err);
          mostrarNotificacion('Error de conexión con el servidor.', 'error');
        }
      });
    }

    // Submit de Login
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const correo = document.getElementById('loginCorreo').value.trim();
        const contrasena = document.getElementById('loginContrasena').value.trim();

        try {
          const res = await fetch('/api/auth/paciente/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena })
          });
          const data = await res.json();

          if (!res.ok) {
            mostrarNotificacion(data.error || 'Correo o contraseña incorrectos', 'error');
            return;
          }

          pacienteSesion = data.usuario;
          localStorage.setItem('pacienteSesion', JSON.stringify(pacienteSesion));
          mostrarAppPaciente();
        } catch (err) {
          console.error(err);
          mostrarNotificacion('Error al iniciar sesión.', 'error');
        }
      });
    }

    // Cerrar sesión paciente
    if (logoutPacienteBtn) {
      logoutPacienteBtn.addEventListener('click', () => {
        localStorage.removeItem('pacienteSesion');
        pacienteSesion = null;
        mostrarAuthPaciente();
      });
    }

    // Navegación de semanas en el calendario de reserva
    if (prevWeekBtn && nextWeekBtn) {
      prevWeekBtn.addEventListener('click', () => {
        if (semanaOffset > 0) {
          semanaOffset--;
          renderizarCalendarioSemanal();
        }
      });
      nextWeekBtn.addEventListener('click', () => {
        semanaOffset++;
        renderizarCalendarioSemanal();
      });
    }

    // Consultar disponibilidad al cambiar especialidad
    if (especialidadSelect) {
      especialidadSelect.addEventListener('change', () => {
        if (fechaSeleccionada) {
          consultarHorasDisponibles();
        }
      });
    }

    // Guardar reserva de cita
    if (reservaForm) {
      reservaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombrePaciente = document.getElementById('nombrePaciente').value.trim();
        const edadPaciente = parseInt(document.getElementById('edadPaciente').value, 10);
        const correoPaciente = document.getElementById('correoPaciente').value.trim();
        const telefonoPaciente = document.getElementById('telefonoPaciente').value.trim();
        const especialidad = especialidadSelect.value;

        if (!nombrePaciente || isNaN(edadPaciente) || !correoPaciente || !telefonoPaciente || !especialidad || !fechaSeleccionada) {
          mostrarNotificacion('Debe completar todos los datos personales, especialidad y fecha del calendario.', 'error');
          return;
        }

        if (!horaSeleccionada) {
          mostrarNotificacion('Debe seleccionar una hora de atención disponible.', 'error');
          return;
        }

        try {
          const res = await fetch('/api/citas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombrePaciente,
              edadPaciente,
              correoPaciente,
              telefonoPaciente,
              fecha: fechaSeleccionada,
              hora: horaSeleccionada,
              especialidad
            })
          });
          const data = await res.json();

          if (!res.ok) {
            mostrarNotificacion(data.error || 'Error al agendar cita', 'error');
            return;
          }

          // Mostrar modal con resumen de la cita
          resumenPaciente.innerText = data.cita.nombrePaciente;
          resumenEspecialidad.innerText = data.cita.especialidad;
          // Determinamos el doctor en base a los predefinidos
          const doctores = {
            'Pediatría': 'Dr. Carlos Mendoza',
            'Cardiología': 'Dra. Ana Restrepo',
            'Dermatología': 'Dr. Luis Gómez',
            'Ginecología': 'Dra. Laura Espinosa',
            'Traumatología': 'Dr. Roberto Pineda'
          };
          resumenDoctor.innerText = doctores[data.cita.especialidad] || 'Especialista';
          resumenFecha.innerText = data.cita.fecha;
          resumenHora.innerText = data.cita.hora;
          resumenModal.style.display = 'flex';

          // Limpiar formulario de reserva y actualizar historial
          reservaForm.reset();
          document.getElementById('correoPaciente').value = pacienteSesion.correo;
          document.getElementById('nombrePaciente').value = pacienteSesion.nombreCompleto;
          fechaSeleccionada = '';
          horaSeleccionada = '';
          horasSeccion.style.display = 'none';
          renderizarCalendarioSemanal();
          cargarHistorialPaciente();
        } catch (err) {
          console.error(err);
          mostrarNotificacion('Error al enviar la reservación.', 'error');
        }
      });
    }

    if (cerrarResumenBtn) {
      cerrarResumenBtn.addEventListener('click', () => {
        resumenModal.style.display = 'none';
      });
    }

    // Funciones Helper de Paciente
    function mostrarAuthPaciente() {
      authSection.style.display = 'block';
      mainAppSection.style.display = 'none';
      mostrarNotificacion('', 'clear');
    }

    function mostrarAppPaciente() {
      authSection.style.display = 'none';
      mainAppSection.style.display = 'block';
      infoPacienteNombre.innerText = pacienteSesion.nombreCompleto;
      infoPacienteCorreo.innerText = pacienteSesion.correo;
      
      // Auto rellenar datos del paciente
      document.getElementById('nombrePaciente').value = pacienteSesion.nombreCompleto;
      document.getElementById('correoPaciente').value = pacienteSesion.correo;

      semanaOffset = 0;
      fechaSeleccionada = '';
      horaSeleccionada = '';
      if (horasSeccion) horasSeccion.style.display = 'none';

      renderizarCalendarioSemanal();
      cargarHistorialPaciente();
    }

    function renderizarCalendarioSemanal() {
      calendarWeekGrid.innerHTML = '';
      
      // Obtener el lunes de la semana basado en semanaOffset
      const hoy = new Date();
      const diaActual = hoy.getDay(); // 0 = Domingo, 1 = Lunes...
      
      // Diferencia de días al lunes actual
      const diffAlLunes = hoy.getDate() - diaActual + (diaActual === 0 ? -6 : 1);
      
      // Aplicamos el offset de semanas
      const lunesSemana = new Date(hoy.setDate(diffAlLunes + (semanaOffset * 7)));
      
      const formatearFecha = (d) => {
        const mesStr = String(d.getMonth() + 1).padStart(2, '0');
        const diaStr = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mesStr}-${diaStr}`;
      };

      const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

      // Mostrar etiqueta del rango de semana
      const finSemana = new Date(lunesSemana);
      finSemana.setDate(lunesSemana.getDate() + 4);
      weekLabel.innerText = `${lunesSemana.toLocaleDateString('es-ES', {day: 'numeric', month: 'short'})} al ${finSemana.toLocaleDateString('es-ES', {day: 'numeric', month: 'short'})}`;

      // Inhabilitar botón de semana anterior si es la semana actual
      if (semanaOffset === 0) {
        prevWeekBtn.style.opacity = '0.5';
        prevWeekBtn.style.cursor = 'not-allowed';
      } else {
        prevWeekBtn.style.opacity = '1';
        prevWeekBtn.style.cursor = 'pointer';
      }

      // Crear las 5 tarjetas de lunes a viernes
      for (let i = 0; i < 5; i++) {
        const d = new Date(lunesSemana);
        d.setDate(lunesSemana.getDate() + i);
        const fechaStr = formatearFecha(d);

        const card = document.createElement('div');
        card.className = 'calendar-day-card';
        
        // Bloquear días anteriores a hoy en la semana actual
        const hoySinHora = new Date();
        hoySinHora.setHours(0,0,0,0);
        const dSinHora = new Date(d);
        dSinHora.setHours(0,0,0,0);

        const isDisabled = dSinHora < hoySinHora;
        if (isDisabled) {
          card.classList.add('disabled');
        }

        if (fechaStr === fechaSeleccionada) {
          card.classList.add('selected');
        }

        card.innerHTML = `
          <span class="day-name">${nombresDias[i]}</span>
          <span class="day-date">${d.getDate()} / ${d.getMonth() + 1}</span>
        `;

        if (!isDisabled) {
          card.addEventListener('click', () => {
            document.querySelectorAll('.calendar-day-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            fechaSeleccionada = fechaStr;
            horaSeleccionada = '';
            consultarHorasDisponibles();
          });
        }

        calendarWeekGrid.appendChild(card);
      }
    }

    async function consultarHorasDisponibles() {
      const especialidad = especialidadSelect.value;
      if (!especialidad) {
        horasSeccion.style.display = 'none';
        return;
      }

      horasGrid.innerHTML = '';
      horasMensaje.style.display = 'none';
      horasSeccion.style.display = 'block';

      try {
        const res = await fetch(`/api/disponibilidad?especialidad=${encodeURIComponent(especialidad)}&fecha=${fechaSeleccionada}`);
        const data = await res.json();

        if (data.mensaje) {
          horasMensaje.innerText = data.mensaje;
          horasMensaje.style.display = 'block';
          return;
        }

        if (data.horasDisponibles.length === 0) {
          horasMensaje.innerText = 'El doctor no dispone de horarios libres para esta fecha o ha completado su límite diario.';
          horasMensaje.style.display = 'block';
          return;
        }

        data.horasDisponibles.forEach(hora => {
          const badge = document.createElement('div');
          badge.className = 'hour-badge';
          badge.innerText = hora;
          if (hora === horaSeleccionada) {
            badge.classList.add('selected');
          }

          badge.addEventListener('click', () => {
            document.querySelectorAll('#horasGrid .hour-badge').forEach(b => b.classList.remove('selected'));
            badge.classList.add('selected');
            horaSeleccionada = hora;
          });

          horasGrid.appendChild(badge);
        });
      } catch (err) {
        console.error(err);
        horasMensaje.innerText = 'Error al consultar horarios.';
        horasMensaje.style.display = 'block';
      }
    }

    async function cargarHistorialPaciente() {
      try {
        const res = await fetch(`/api/citas/paciente/${pacienteSesion.correo}`);
        const data = await res.json();

        historialPacienteBody.innerHTML = '';
        if (data.citas.length === 0) {
          sinHistorialMensaje.style.display = 'block';
          return;
        }

        sinHistorialMensaje.style.display = 'none';
        data.citas.forEach(cita => {
          if (cita.estado === 'cancelada') return; // no mostrar citas canceladas en lista activa, o mostrarlas como cancelada

          const tr = document.createElement('tr');
          
          let estadoColor = 'var(--accent-color)';
          if (cita.estado === 'completada') estadoColor = 'var(--success-color)';

          const diagnosticoHtml = cita.estado === 'completada' 
            ? `<div class="diagnostico-box"><strong>Diagnóstico:</strong> ${cita.diagnostico}</div>`
            : '<span style="color: var(--text-muted); font-size: 0.9rem;">Cita pendiente de atención.</span>';

          tr.innerHTML = `
            <td><strong>${cita.fecha}</strong><br><small style="color: var(--text-muted);">${cita.hora}</small></td>
            <td><span class="badge-info">${cita.especialidad}</span></td>
            <td><span style="color: ${estadoColor}; font-weight: 600;">${cita.estado.toUpperCase()}</span></td>
            <td>
              ${diagnosticoHtml}
            </td>
          `;
          historialPacienteBody.appendChild(tr);
        });
      } catch (err) {
        console.error(err);
      }
    }

    function mostrarNotificacion(mensaje, tipo) {
      notification.className = 'notification';
      if (tipo === 'clear') {
        notification.style.display = 'none';
        return;
      }
      notification.classList.add(tipo);
      notification.innerText = mensaje;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ==========================================
  // LÓGICA DE DOCTORES (panel.html)
  // ==========================================
  if (loginDoctorForm || dashboardCard) {
    if (doctorSesion) {
      cargarDashboard(doctorSesion);
    } else {
      mostrarLogin();
    }

    // Iniciar Sesión de Doctor
    if (loginDoctorForm) {
      loginDoctorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        mostrarNotificacionPanel('', 'clear');

        const nombre = document.getElementById('nombreDoctor').value.trim();
        const codigoEmpleado = document.getElementById('codigoEmpleado').value.trim();

        try {
          const res = await fetch('/api/auth/doctor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, codigoEmpleado })
          });
          const data = await res.json();

          if (!res.ok) {
            mostrarNotificacionPanel(data.error || 'Error de autenticación', 'error');
            return;
          }

          doctorSesion = data.doctor;
          localStorage.setItem('doctorSesion', JSON.stringify(doctorSesion));
          cargarDashboard(doctorSesion);
        } catch (err) {
          console.error(err);
          mostrarNotificacionPanel('Error de red con el servidor.', 'error');
        }
      });
    }

    // Cerrar Sesión Doctor
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('doctorSesion');
        doctorSesion = null;
        mostrarLogin();
      });
    }

    // Control de pestañas del panel
    if (tabCalendarioBtn && tabHistorialBtn) {
      tabCalendarioBtn.addEventListener('click', () => {
        tabCalendarioBtn.classList.add('active');
        tabHistorialBtn.classList.remove('active');
        seccionCalendario.style.display = 'block';
        seccionHistorial.style.display = 'none';
      });

      tabHistorialBtn.addEventListener('click', () => {
        tabHistorialBtn.classList.add('active');
        tabCalendarioBtn.classList.remove('active');
        seccionCalendario.style.display = 'none';
        seccionHistorial.style.display = 'block';
        cargarHistorialPacientesDoctor();
      });
    }

    // Navegación del mes del calendario
    if (prevMonthBtn && nextMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        fechaActualDoctor.setMonth(fechaActualDoctor.getMonth() - 1);
        renderizarCalendarioMensual();
      });

      nextMonthBtn.addEventListener('click', () => {
        fechaActualDoctor.setMonth(fechaActualDoctor.getMonth() + 1);
        renderizarCalendarioMensual();
      });
    }

    // Cerrar modal de acciones del doctor
    if (cerrarModalBtn) {
      cerrarModalBtn.addEventListener('click', () => {
        citaModal.style.display = 'none';
      });
    }

    // Finalizar Cita (Enviar Diagnóstico)
    if (btnFinalizarCita) {
      btnFinalizarCita.addEventListener('click', async () => {
        const diagnostico = inputDiagnostico.value.trim();
        if (!diagnostico) {
          alert('Debe ingresar un diagnóstico válido para completar la consulta.');
          return;
        }

        try {
          const res = await fetch(`/api/citas/${citaSeleccionadaId}/finalizar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ diagnostico })
          });

          if (!res.ok) {
            const data = await res.json();
            alert(data.error || 'Error al completar cita.');
            return;
          }

          citaModal.style.display = 'none';
          renderizarCalendarioMensual();
        } catch (err) {
          console.error(err);
        }
      });
    }

    // Borrar Cita
    if (btnBorrarCita) {
      btnBorrarCita.addEventListener('click', async () => {
        if (!confirm('¿Está seguro de que desea borrar/cancelar esta cita médica?')) return;

        try {
          const res = await fetch(`/api/citas/${citaSeleccionadaId}`, {
            method: 'DELETE'
          });

          if (!res.ok) {
            alert('Error al borrar la cita.');
            return;
          }

          citaModal.style.display = 'none';
          renderizarCalendarioMensual();
        } catch (err) {
          console.error(err);
        }
      });
    }

    // Reagendar - Mostrar Panel
    if (btnMostrarReagendar) {
      btnMostrarReagendar.addEventListener('click', () => {
        reagendarContainer.style.display = 'block';
        botonesAccionCita.style.display = 'none';
        botonesConfirmarReagendado.style.display = 'flex';
        
        // Poner fecha mínima en reagendar
        const hoy = new Date();
        reagendarFecha.min = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
      });
    }

    // Cancelar Reagendado
    if (btnCancelarReagendar) {
      btnCancelarReagendar.addEventListener('click', () => {
        reagendarContainer.style.display = 'none';
        botonesAccionCita.style.display = 'flex';
        botonesConfirmarReagendado.style.display = 'none';
        reagendarFecha.value = '';
        reagendarHorasSeccion.style.display = 'none';
      });
    }

    // Consultar disponibilidad al cambiar fecha en reagendar
    if (reagendarFecha) {
      reagendarFecha.addEventListener('change', async () => {
        const fecha = reagendarFecha.value;
        if (!fecha) return;

        reagendarHorasGrid.innerHTML = '';
        reagendarHorasSeccion.style.display = 'block';
        horaReagendarSeleccionada = '';

        try {
          const res = await fetch(`/api/disponibilidad?especialidad=${encodeURIComponent(doctorSesion.especialidad)}&fecha=${fecha}`);
          const data = await res.json();

          if (data.horasDisponibles && data.horasDisponibles.length > 0) {
            data.horasDisponibles.forEach(hora => {
              const badge = document.createElement('div');
              badge.className = 'hour-badge';
              badge.innerText = hora;
              badge.addEventListener('click', () => {
                document.querySelectorAll('#reagendarHorasGrid .hour-badge').forEach(b => b.classList.remove('selected'));
                badge.classList.add('selected');
                horaReagendarSeleccionada = hora;
              });
              reagendarHorasGrid.appendChild(badge);
            });
          } else {
            reagendarHorasGrid.innerHTML = '<span style="color:var(--warning-color); font-size:0.85rem;">No hay horarios disponibles para ese día (límite alcanzado o fin de semana).</span>';
          }
        } catch (err) {
          console.error(err);
        }
      });
    }

    // Guardar Reagendado
    if (btnGuardarReagendar) {
      btnGuardarReagendar.addEventListener('click', async () => {
        const fecha = reagendarFecha.value;
        if (!fecha || !horaReagendarSeleccionada) {
          alert('Debe seleccionar una nueva fecha y hora para reagendar.');
          return;
        }

        try {
          const res = await fetch(`/api/citas/${citaSeleccionadaId}/reagendar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fecha, hora: horaReagendarSeleccionada })
          });

          if (!res.ok) {
            const data = await res.json();
            alert(data.error || 'Error al reagendar.');
            return;
          }

          citaModal.style.display = 'none';
          // Limpiar formulario reagendar
          reagendarContainer.style.display = 'none';
          botonesAccionCita.style.display = 'flex';
          botonesConfirmarReagendado.style.display = 'none';
          reagendarFecha.value = '';
          reagendarHorasSeccion.style.display = 'none';
          renderizarCalendarioMensual();
        } catch (err) {
          console.error(err);
        }
      });
    }

    // Funciones Helper de Doctor
    function mostrarLogin() {
      if (loginCard) loginCard.style.display = 'block';
      if (dashboardCard) dashboardCard.style.display = 'none';
    }

    function cargarDashboard(doctor) {
      if (loginCard) loginCard.style.display = 'none';
      if (dashboardCard) dashboardCard.style.display = 'block';
      infoDoctorNombre.innerText = doctor.nombre;
      infoDoctorEspecialidad.innerText = doctor.especialidad;
      
      tabCalendarioBtn.click(); // ir a la pestaña principal
      renderizarCalendarioMensual();
    }

    async function renderizarCalendarioMensual() {
      calendarGridDays.innerHTML = '';
      
      const anio = fechaActualDoctor.getFullYear();
      const mes = fechaActualDoctor.getMonth(); // 0-11

      const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      currentMonthLabel.innerText = `${nombresMeses[mes]} ${anio}`;

      // Primer día del mes
      const primerDia = new Date(anio, mes, 1);
      const diaSemanaInicio = primerDia.getDay(); // 0 = Dom, 1 = Lun...

      // Total de días del mes
      const ultimoDia = new Date(anio, mes + 1, 0);
      const totalDias = ultimoDia.getDate();

      // Consultar las citas del mes desde el servidor
      const anioMesStr = `${anio}-${String(mes + 1).padStart(2, '0')}`;
      let citasMes = [];
      try {
        const res = await fetch(`/api/citas/doctor/${doctorSesion.codigoEmpleado}/mes?anioMes=${anioMesStr}`);
        const data = await res.json();
        citasMes = data.citas || [];
      } catch (err) {
        console.error('Error al obtener citas del mes:', err);
      }

      // 1. Agregar celdas vacías para los días antes del primer día del mes
      for (let i = 0; i < diaSemanaInicio; i++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell empty-cell';
        calendarGridDays.appendChild(cell);
      }

      // 2. Agregar celdas para cada día del mes
      for (let dia = 1; dia <= totalDias; dia++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        
        // Marcar hoy
        const hoy = new Date();
        if (hoy.getDate() === dia && hoy.getMonth() === mes && hoy.getFullYear() === anio) {
          cell.classList.add('today');
        }

        const diaStr = String(dia).padStart(2, '0');
        const fechaCeldaStr = `${anio}-${String(mes+1).padStart(2,'0')}-${diaStr}`;

        cell.innerHTML = `<span class="day-num">${dia}</span>`;

        // Contenedor de citas para el día
        const appointmentsContainer = document.createElement('div');
        appointmentsContainer.className = 'calendar-appointments';

        // Filtrar citas correspondientes a este día
        const citasDia = citasMes.filter(c => c.fecha === fechaCeldaStr);

        citasDia.forEach(cita => {
          const pill = document.createElement('div');
          pill.className = `apt-pill ${cita.estado}`;
          pill.innerText = `${cita.hora} - ${cita.nombrePaciente}`;
          
          // Al dar click al badge, abrimos el modal de acciones
          pill.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar disparar clicks en la celda
            abrirCitaModal(cita);
          });

          appointmentsContainer.appendChild(pill);
        });

        cell.appendChild(appointmentsContainer);
        calendarGridDays.appendChild(cell);
      }
    }

    async function abrirCitaModal(cita) {
      citaSeleccionadaId = cita._id;
      citaSeleccionadaPacienteEmail = cita.correoPaciente;

      // Restablecer vista del modal
      reagendarContainer.style.display = 'none';
      botonesAccionCita.style.display = 'flex';
      botonesConfirmarReagendado.style.display = 'none';
      reagendarFecha.value = '';
      reagendarHorasSeccion.style.display = 'none';
      inputDiagnostico.value = cita.diagnostico || '';

      // Rellenar campos del modal
      modalCitaTitulo.innerText = `Cita: ${cita.fecha} a las ${cita.hora}`;
      detPaciente.innerText = cita.nombrePaciente;
      detEdad.innerText = cita.edadPaciente;
      detTelefono.innerText = cita.telefonoPaciente;
      detCorreo.innerText = cita.correoPaciente;
      detFechaHora.innerText = `${cita.fecha} - ${cita.hora}`;
      detEstado.innerText = cita.estado.toUpperCase();

      // Cambiar comportamiento del botón de completar según el estado
      if (cita.estado === 'completada') {
        btnFinalizarCita.style.display = 'none';
        inputDiagnostico.disabled = true;
      } else {
        btnFinalizarCita.style.display = 'inline-block';
        inputDiagnostico.disabled = false;
      }

      // Cargar historial de diagnósticos previos del paciente
      historialPacientePrevio.innerHTML = '<span style="color:var(--text-muted);">Cargando consultas anteriores...</span>';
      try {
        const res = await fetch(`/api/citas/paciente-historial-diagnosticos?correo=${encodeURIComponent(cita.correoPaciente)}`);
        const data = await res.json();
        
        historialPacientePrevio.innerHTML = '';
        const historialFiltrado = (data.historial || []).filter(h => h._id !== cita._id);

        if (historialFiltrado.length === 0) {
          historialPacientePrevio.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem;">El paciente no cuenta con consultas completadas previas en el sistema.</span>';
        } else {
          historialFiltrado.forEach(h => {
            const item = document.createElement('div');
            item.className = 'history-patient-item';
            item.innerHTML = `
              <div style="font-weight:600; color:#60a5fa; font-size:0.85rem;">Fecha: ${h.fecha} | Especialidad: ${h.especialidad}</div>
              <div style="color:var(--text-main); font-size:0.85rem; margin-top:2px;"><strong>Diagnóstico:</strong> ${h.diagnostico}</div>
            `;
            historialPacientePrevio.appendChild(item);
          });
        }
      } catch (err) {
        console.error(err);
        historialPacientePrevio.innerHTML = '<span style="color:var(--error-color);">Error al cargar consultas anteriores.</span>';
      }

      // Mostrar Modal
      citaModal.style.display = 'flex';
    }

    async function cargarHistorialPacientesDoctor() {
      try {
        const res = await fetch(`/api/citas/doctor/${doctorSesion.codigoEmpleado}/historial`);
        const data = await res.json();

        historialDoctorBody.innerHTML = '';
        if (data.citas.length === 0) {
          sinPacientesMensaje.style.display = 'block';
          return;
        }

        sinPacientesMensaje.style.display = 'none';
        data.citas.forEach(cita => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${cita.fecha}</strong><br><small style="color: var(--text-muted);">${cita.hora}</small></td>
            <td>${cita.nombrePaciente}</td>
            <td>${cita.edadPaciente} años</td>
            <td>
              <span style="font-size: 0.85rem;">✉ ${cita.correoPaciente}</span><br>
              <span style="font-size: 0.85rem; color: var(--text-muted);">☎ ${cita.telefonoPaciente}</span>
            </td>
            <td>
              <div style="font-size: 0.9rem; padding: 0.5rem; background: rgba(255,255,255,0.03); border-radius:4px; border-left: 2px solid var(--success-color);">
                ${cita.diagnostico}
              </div>
            </td>
          `;
          historialDoctorBody.appendChild(tr);
        });
      } catch (err) {
        console.error(err);
      }
    }

    function mostrarNotificacionPanel(mensaje, tipo) {
      if (!notificationPanel) return;
      notificationPanel.className = 'notification';
      if (tipo === 'clear') {
        notificationPanel.style.display = 'none';
        return;
      }
      notificationPanel.classList.add(tipo);
      notificationPanel.innerText = mensaje;
    }
  }
});
