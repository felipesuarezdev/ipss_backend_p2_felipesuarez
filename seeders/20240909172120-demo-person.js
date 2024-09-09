'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('People', [{
      name: 'Felipe',
      lastName: 'Suárez',
      nationality: 'Chilena',
      year: 1995,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    const people = await queryInterface.sequelize.query(
      `SELECT id from "People";`
    );

    const personId = people[0][0].id;

    await queryInterface.bulkInsert('Works', [{
      company: 'Armada de Chile',
      initContract: new Date(2020, 0, 1),
      finishContract: new Date(2023, 11, 31),
      position: 'Ingeniero TI',
      PersonId: personId,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Works', null, {});
    await queryInterface.bulkDelete('People', null, {});
  }
};
