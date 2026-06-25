// Ruta exacta: /db/conexion.js
const mongoose = require('mongoose');

const conectarDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agenda_ati';
    await mongoose.connect(uri);
    console.log('Conectado exitosamente a MongoDB');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = conectarDB;
