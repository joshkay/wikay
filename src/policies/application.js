module.exports = class ApplicationPolicy
{
  constructor(user, record)
  {
    this.user = user;
    this.record = record;
  }

  _isOwner()
  {
    return this.record && this.user && this.user.isOwner(this.record);
  }

  _isAdmin()
  {
    return this.user && this.user.isAdmin();
  }

  new()
  {
    return this.user != null;
  }

  list()
  {
    return this.show();
  }

  create()
  {
    return this.new();
  }

  show()
  {
    return true;
  }

  edit()
  {
    return this.new() &&
      this.record;
  }

  update()
  {
    return this.edit();
  }

  destroy()
  {
    return this.update() &&
      (this._isOwner() || this._isAdmin());
  }
};