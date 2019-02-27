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

    Wiki.belongsToMany(models.User, {
      foreignKey: 'wikiId',
      through: 'WikiCollaborators',
      as: 'collaborators'
    });

    Wiki.SCOPE_PUBLIC = 'public';
    Wiki.addScope(Wiki.SCOPE_PUBLIC, () =>
    {
      return {
        where: { private: false },
        order: [['createdAt', 'DESC']]
      };
    });
  };

  Wiki.prototype.isCollaborator = function(user)
  {
    if (this.private && this.collaborators && user)
    {
      return this.collaborators.map(collaborator => collaborator.id).includes(user.id);
    }
    return false;
  }

  return Wiki;
};