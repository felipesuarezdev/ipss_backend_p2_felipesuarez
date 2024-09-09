const db = require('../models');

async function initDb() {
  try {
    await db.sequelize.sync({ force: true }); // Cuidado: esto borrará todos los datos existentes
    console.log('Database synchronized');

    // Crear algunas personas de ejemplo
    const person1 = await db.Person.create({
      name: 'Juan',
      lastName: 'Perez',
      nationality: 'Boliviano',
      year: 1990
    });

    await db.Work.create({
      company: 'Tech Co',
      position: 'Desarrollador',
      initContract: new Date('2020-01-01'),
      finishContract: new Date('2023-12-31'),
      PersonId: person1.id
    });

    console.log('Sample data created');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await db.sequelize.close();
  }
}

initDb();
