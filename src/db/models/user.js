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
    },
    role: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    upgraded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    amountPaid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    datePaid: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {});
  User.associate = function(models) {
    // associations can be defined here
    User.hasMany(models.Wiki, {
      foreignKey: 'userId',
      as: 'wikis'
    });

    // User.belongsToMany(models.Wiki, {
    //   through: 'WikiCollaborators',
    //   as: 'collaborators'
    // });
  };

  User.prototype.isOwner = function(wiki)
  {
    if (wiki && wiki.userId)
    {
      return wiki.userId === this.id;
    }
    return false;
  };

  User.ROLE_STANDARD = 0;
  User.ROLE_PREMIUM = 1;
  User.ROLE_ADMIN = 2;

  User.prototype.isStandard = function()
  {
    return this.role === User.ROLE_STANDARD;
  }
  User.prototype.isPremium = function()
  {
    return this.role === User.ROLE_PREMIUM;
  }
  User.prototype.isAdmin = function()
  {
    return this.role === User.ROLE_ADMIN;
  }

  User.getRoleText = function(role)
  {
    switch (role)
    {
      case User.ROLE_STANDARD:
        return 'Standard User';
      case User.ROLE_PREMIUM:
        return 'Premium User';
      case User.ROLE_ADMIN:
        return 'Admin User';
    }
  }
  User.prototype.getRoleText = function()
  {
    return User.getRoleText(this.role);
  }

  return User;
};