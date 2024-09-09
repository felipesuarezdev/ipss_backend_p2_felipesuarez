const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Manejar errores de Sequelize
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: err.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        message: 'Unique constraint error',
        errors: err.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    // Manejar errores de Express
    if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Invalid JSON' });
    }

    // Manejar errores personalizados
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    // Manejar otros errores
    res.status(500).json({ message: 'Internal server error' });
  };

  module.exports = errorHandler;
