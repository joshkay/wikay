const ApplicationPolicy = require('./application');

module.exports = class WikiPolicy extends ApplicationPolicy
{
  show()
  {
    if (this.record && this.record.private)
    {
      return this._isOwner() || this.record.isCollaborator(this.user) || this._isAdmin();
    }
    return super.show();
  }

  edit()
  {
    if (this.record && this.record.private)
    {
      return this._isOwner() || this.record.isCollaborator(this.user) || this._isAdmin();
    }
    return super.edit();
  } 

  createPrivate()
  {
    return this.user != null &&
      (this.user.isPremium() || this.user.isAdmin());
  }

  updatePrivate()
  {
    return this.createPrivate() && this._isOwner();
  }

  collaborators()
  {
    if (this.record && this.record.private)
    {
      return this._isOwner() || this._isAdmin();
    }
    return false;
  }

  addCollaborator()
  {
    return this.collaborators();
  }

  removeCollaborator()
  {
    return this.collaborators();
  }
};