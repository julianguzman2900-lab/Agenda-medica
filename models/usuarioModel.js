// ============================================================
// models/usuarioModel.js
// Define el esquema y modelo de Usuario para MongoDB.
// Establece la estructura de los datos, validaciones básicas
// y restricciones que tendrán los usuarios registrados.
// ============================================================

const mongoose = require('mongoose');

// Esquema de la colección de usuarios
const usuarioSchema = new mongoose.Schema({

  // Nombre completo del usuario
  nombreCompleto: {
    type: String,      // Tipo de dato texto
    required: true,    // Campo obligatorio
    trim: true         // Elimina espacios al inicio y al final
  },

  // Correo electrónico del usuario
  correo: {
    type: String,      // Tipo de dato texto
    required: true,    // Campo obligatorio
    unique: true,      // No permite correos duplicados
    trim: true         // Elimina espacios innecesarios
  },

  // Contraseña del usuario
  contrasena: {
    type: String,      // Se almacena como texto (normalmente cifrado)
    required: true     // Campo obligatorio
  }

});

// Crea el modelo que permitirá realizar operaciones CRUD
// sobre la colección "usuarios" en MongoDB.
const Usuario = mongoose.model('Usuario', usuarioSchema);

// Exporta el modelo para utilizarlo en controladores y otros módulos.
module.exports = Usuario;
