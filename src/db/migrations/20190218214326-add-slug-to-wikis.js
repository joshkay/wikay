'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Wikis',
      'slug',
      {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ''
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Wikis',
      'slug'
    );
  }
};
