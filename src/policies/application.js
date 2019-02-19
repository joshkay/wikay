module.exports = class ApplicationPolicy
{
  constructor(user, record)
  {
    this.user = user;
    this.record = record;
  }

  _isOwner()
  {
    return this.record && this.user.isOwner(this.record);
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
      this.record && 
      this._isOwner();
  }

  update()
  {
    return this.edit();
  }

  destroy()
  {
    return this.update();
  }
};