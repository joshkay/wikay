'use strict';
module.exports = (sequelize, DataTypes) => {
  const Wiki = sequelize.define('Wiki', {
    title: {
      allowNull: false,
      unique: true,
      type: DataTypes.STRING
    },
    body: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    private: {
      allowNull: false,
      defaultValue: false,
      type: DataTypes.BOOLEAN
    },
    slug: {
      allowNull: false,
      defaultValue: '',
      type: DataTypes.STRING
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {});
  Wiki.associate = function(models) {
    // associations can be defined here
    Wiki.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };
  return Wiki;
};