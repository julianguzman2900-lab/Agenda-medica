
<role>
Actúa como un ingeniero de software senior experto en JavaScript, node.js y mongodb y express
</role>

<context>
Estoy realizado un programa sobre una agenda medica dirigida al usuario para poder agendar citas, quiero que antes de ingresar a la agenda nos aparzca un login el cual debe pedir nombre completo y correo electronico y una contrasena, tambien que tenga la opcion de crear una nueva cuenta, tambien quiero que los doctores puedan ingresar mediante su nombre y un codigo de trabajador unico. Luego de loguearse debe de enviar al usuario al apartado de agendar citas, quiero que el usuario pueda agendar una nueva cita, para esto debe de pedirse nombre completo, numero de telefono, edad y correo electronico, tambien el usuario debe poder especificar la especialidad a la que va con una lista desplegable con las especialidades disponibles que unicamente seran 5,el usuario debe de elegir la fecha pero quiero que el calendario se vea en grande con las fechas disponibles de la semana en que se encuentra, luego de llenar todos los campos debe de crearse la cita, debo de mostrar un resumen de la creacion de la cita, hora, fecha, especialidad, nombre del doctor y del paciente, piso y numero de consultori. Al momento de que el usurio cree su cita no debe de poder crear otra cita en la misma hora de ese dia de la semana ya que cadad doctor solo dispone de 5 citas distrubuidas en 8 horas de 8AM a 4PM, asi debe ser en los 5 dias de trabajo de lunes a viernes, los dias miercoles solo estan disponibles 3 de las 5 especialidades tambien el usuario debe de tener un apartado en el cual pueda ver un historial de sus citas en el consultorio y tambien que le aparezca el diagnostico que el doctor ingreso al sistema . Ahora el apartado del dcotor, depues de loguearse con su nombre y numero de empleado unico, deben de aparecerle las citas que tiene pendiente de igual forma en un calendario cuadricular en el cual pueda seleccionar cada una de las citas que hay agendadas, al momento de presionar las citas debe tener la opcion de borrar la cita, dar por completada, y debe de haber un apartado en el que el doctor ingrese el diagnostico realizado y poder guardar esta informacion en el sistema  y que sre muestre en el historial al paciente que le corresponda, tambien debe de tener la opcion de reagendar la cita y por supuesto debe de tener el historial de los pacientes que ha atendido, quiero que al momento de que el usuario cree la cita, esta cita solo debe de ser visible en el calendario del doctor al que le corresponde. 
</context>

<task>
Escribe un script de JavaScript que simule la agenda de citas  
1. validar que el usuario solo pueda ingresar al apartado de creacion de citas e historial de usuario y no tebnga ninguna funcion de doctor .
2. Validar que los datos ingresados al momento de loguearse sean validos 
3. Solo debe de existir un doctor por especialidad  .
4. Asegurarse de la creacion de la base de datos de mongoDB
5. Asegurarse de que el doctor solo pueda ver en el calendario las citas del mes 
6. Validar que el usuario no pueda volver a crear una cita en un dia que no tenga mas horarios disponibles ni que se pueda crear una cita en horarios seleccionados
7. El usuario solo puede crear citas de lunes a viernes 
8. Validar que el usurio no pueda crear citas en las 2 especialidades que no se encuentren disponible el dia miercoles 
9. Validar que el doctor tenga las funciones de borrar finalizar y agregar diagnostico y vtambien que pueda ver el historial  
</task>

<constrains>
* No uses cosas avanzadas . Solo herramientas básicas y necesarias de stack que te di 
* Pon comentarios sencillos pero explicativo  en el código explicando qué hace cada parte importante.
* Usa nombres de variables que sean descriptivas
* No uses angular, react ni nada por el estilo, utiliza lo que te di 
</constrains>

<outopu_format>
Por favor, muestra la respuesta de la siguiente manera
1. El código completo dentro de un bloque limpio para poder copiarlo.
2. Una explicación muy corta y con palabras sencillas de cómo funciona el programa
3. sugerencias de cambio 
4. me vas a dar un archivo ordenado de la manera en que te dare en la captura de pantalla
5. todo error que encuentres mejoralo o arreglalo
</outopu_format>
