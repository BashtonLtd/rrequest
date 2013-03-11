Template.userlist.users = function () {
  return Meteor.users.find();
};

Template.userlist.events({
  'click .edit-user': function (evt) {
    openEditUserDialog(this._id);
  },

  'click .disable-user': function (evt) {
    openDisableUserDialog(this._id);
  }
});

Template.users.showEditUserDialog = function () {
  return Session.get("showEditUserDialog");
};

var openEditUserDialog = function (user_id) {
  Session.set('currentScroll',$('body').scrollTop());
  Session.set("selectedUser", user_id);
  Session.set("showEditUserDialog", true);
};

Template.editUserDialog.email = function () {
  var user_id = Session.get("selectedUser");
  var user = Meteor.users.findOne({_id:user_id});
  return user !== undefined ? user.profile.email : '';
};

Template.editUserDialog.profilename = function () {
  var user_id = Session.get("selectedUser");
  var user = Meteor.users.findOne({_id:user_id});
  var profilename = '';
  if (user !== undefined) {
    if (user.profile.name !== null) {
      profilename = user.profile.name;
    }
  }
  return profilename;
};

Template.editUserDialog.usereditadmin = function () {
  var user_id = Session.get("selectedUser");
  var user = Meteor.users.findOne({_id:user_id});
  var usereditadmin = '';
  if (user !== undefined) {
    if (user.isAdmin) {
      usereditadmin = 'active';
    }
  }
  return usereditadmin;
};

Template.editUserDialog.usereditstaff = function () {
  var user_id = Session.get("selectedUser");
  var user = Meteor.users.findOne({_id:user_id});
  var usereditstaff = '';
  if (user !== undefined) {
    if (user.isAdmin) {
      usereditstaff = '';
    } else if (user.profile.isStaff) {
      usereditstaff = 'active';
    }
  }
  return usereditstaff;
};

Template.editUserDialog.usereditrequester = function () {
  var user_id = Session.get("selectedUser");
  var user = Meteor.users.findOne({_id:user_id});
  var usereditrequester = '';
  if (user !== undefined) {
    if (user.isAdmin) {
      usereditrequester = '';
    } else if (user.profile.isStaff) {
      usereditrequester = '';
    } else {
      usereditrequester = 'active';
    }
  }
  return usereditrequester;
};

Template.editUserDialog.events({
  'click .save': function (event, template) {
    var profilename = template.find(".profilename").value;
    var userlevel = template.find(".active").value;

    var user = Meteor.call('updateUser', {
      _id: Session.get("selectedUser"),
      name: profilename,
      userlevel: userlevel
    }, function (error, group) {
      if (! error) {

      }
    });
    Session.set("showEditUserDialog", false);
  },

  'click .cancel': function () {
    Session.set("showEditUserDialog", false);
  }
});


Template.userlist.helpers({
  usertype: function () {
    if (is_admin_by_id(this._id)) {
      return 'Admin User';
    }
    if (is_staff_by_id(this._id)) {
      return 'Staff User';
    }
    return 'Requester';
  }
});