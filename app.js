const express = require('express');
const { Sequelize } = require('sequelize');
const personRoutes = require('./routes/personRoutes');
const errorHandler = require('./middlewares/errorHandler');
const path = require('path');

const app = express();

// Conectar a la base de datos
const sequelize = new Sequelize('postgres://fsuarez:123456@localhost:5432/data_personas');

app.use(express.json());
app.use(express.static('public'));

// Rutas API
app.use('/api/persons', personRoutes);

// Ruta para la aplicación web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
