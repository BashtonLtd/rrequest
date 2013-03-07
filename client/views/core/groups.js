Template.grouplist.groups = function () {
  return Groups.find();
};

Template.groups.showCreateGroupDialog = function () {
 return Session.get("showCreateGroupDialog");
};

Template.groups.events({
 'click .new-group': function (evt) {
    openCreateGroupDialog();
  }
});

Template.groups.showEditGroupDialog = function () {
  return Session.get("showEditGroupDialog");
};

Template.groups.showDeleteGroupDialog = function () {
  return Session.get("showDeleteGroupDialog");
};

Template.grouplist.events({
  'click .edit-group': function (evt) {
    openEditGroupDialog(this._id);
  },

  'click .delete-group': function (evt) {
    openDeleteGroupDialog(this._id);
  }
});

var openCreateGroupDialog = function () {
  Session.set('currentScroll',$('body').scrollTop());
  Session.set("showCreateGroupDialog", true);
};

var openEditGroupDialog = function (group_id) {
  Session.set('currentScroll',$('body').scrollTop());
  Session.set("selectedGroup", group_id);
  Session.set("showEditGroupDialog", true);
};

var openDeleteGroupDialog = function (group_id) {
  Session.set('currentScroll',$('body').scrollTop());
  Session.set("selectedGroup", group_id);
  Session.set("showDeleteGroupDialog", true);
};

Template.createGroupDialog.events({
  'click .save': function (event, template) {
    var name = template.find(".name").value;

    Meteor.call('createGroup', {
      name: name
    }, function (error, group_id) {
      if (! error) {
        Session.set("selectedGroup", group_id);
        Session.set("showEditGroupDialog", true);
      }
    });
    Session.set("showCreateGroupDialog", false);
  },

  'click .cancel': function () {
    Session.set("showCreateGroupDialog", false);
  }
});

Template.editGroupDialog.groupname = function () {
  var group_id = Session.get("selectedGroup");
  var group = Groups.findOne({_id:group_id});
  return group !== undefined ? group.name : '';
};

Template.editGroupDialog.events({
  'click .save': function (event, template) {
    var name = template.find(".name").value;

    var group = Meteor.call('updateGroup', {
      _id: Session.get("selectedGroup"),
      name: name
    }, function (error, group) {
      if (! error) {

      }
    });
    Session.set("showEditGroupDialog", false);
  },

  'click .cancel': function () {
    Session.set("showEditGroupDialog", false);
  }
});

Template.deleteGroupDialog.groupname = function () {
  var group_id = Session.get("selectedGroup");
  var group = Groups.findOne({_id:group_id});
  return group !== undefined ? group.name : '';
};

Template.deleteGroupDialog.events({
  'click .save': function (event, template) {
    Groups.remove(Session.get("selectedGroup"));
    Session.set("showDeleteGroupDialog", false);
  },

  'click .cancel': function () {
    Session.set("showDeleteGroupDialog", false);
  }
});

Template.grouplist.helpers({
  membercount: function () {
    var count = 0;
    var group = Groups.findOne({_id:this._id});
    if (group.members.length > 0) {
      count = group.members.length;
    }
    return count;
  }
});