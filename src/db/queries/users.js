const bcrypt = require('bcryptjs');

const User = require('../models').User;

module.exports =
{
  createUser(newUser, callback)
  {
    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(newUser.password, salt);

    return User.create({
      username: newUser.username,
      email: newUser.email,
      password: hashedPassword
    })
    .then((user) =>
    {
      callback(null, user);
    })
    .catch((err) =>
    {
      callback(err);
    });
  },
  updateUser(updatedUser, user, callback)
  {
    return user.update(
      updatedUser,
      {fields: Object.keys(updatedUser)}
    )
    .then((wiki) =>
    {
      callback(null, user);
    })
    .catch((err) =>
    {
      callback(err);
    });
  },
  getUser(id)
  {
    return User.findByPk(id);
  },
  getUsers()
  {
    return User.findAll();
  }
}