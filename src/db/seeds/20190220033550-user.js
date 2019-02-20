'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: (queryInterface, Sequelize) => {

    const salt = bcrypt.genSaltSync();
    
    return queryInterface.bulkInsert(
      'Users',
      [
        {
          createdAt: new Date(), updatedAt: new Date(),
          email: 'joshkay@gmail.com',
          username: 'joshkay',
          password: bcrypt.hashSync('joshkay', salt)
        },
        {
          createdAt: new Date(), updatedAt: new Date(),
          email: 'heidibowman@gmail.com',
          username: 'heidibowman',
          password: bcrypt.hashSync('heidibowman', salt)
        },
        {
          createdAt: new Date(), updatedAt: new Date(),
          email: 'kylefortier@gmail.com',
          username: 'kylefortier',
          password: bcrypt.hashSync('kylefortier', salt)
        }
      ],
      {}
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(
      'Users',
      null
    );
  }
};
