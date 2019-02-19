'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: { msg: 'must be a valid email' }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {});
  User.associate = function(models) {
    // associations can be defined here
    User.hasMany(models.Wiki, {
      foreignKey: 'userId',
      as: 'wikis'
    });
  };

  User.prototype.isOwner = function(wiki)
  {
    if (wiki && wiki.userId)
    {
      return wiki.userId === this.id;
    }
    return false;
  };

  return User;
};