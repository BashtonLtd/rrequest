/*
 * rrequest
 * http://www.rrequest.com/
 * (C) Copyright Bashton Ltd, 2013
 *
 * This file is part of rrequest.
 *
 * rrequest is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * rrequest is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with rrequest.  If not, see <http://www.gnu.org/licenses/>.
 *
*/
Template.grouplist.groups = function () {
  return Groups.find({}, {sort: {'name': 1}});
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
  Session.set("showCreateGroupDialog", true);
};

var openEditGroupDialog = function (group_id) {
  Session.set("selectedGroup", group_id);
  Session.set("showEditGroupDialog", true);
};

var openDeleteGroupDialog = function (group_id) {
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

Template.editGroupDialog.created = function () {
  Session.set('availableMemberSearchTerm', "");
  Session.set('existingMemberSearchTerm', "");
};

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
  },

  'click .removefromgroup': function (event, template) {
    var selectbox = template.find(".groupmembers");
    var memberstoremove = [];
    while(selectbox.selectedIndex != -1) {
      memberstoremove.push(selectbox.options[selectbox.selectedIndex].value);
      selectbox.options[selectbox.selectedIndex].selected = false;
    }
    Meteor.call('removeGroupMembers', {
      _id: Session.get("selectedGroup"),
      members: memberstoremove
    }, function (error, group) {
      if (! error) {

      }
    });
  },

  'click .addtogroup': function (event, template) {
    var selectbox = template.find(".availablerequesters");
    var memberstoadd = [];
    while(selectbox.selectedIndex != -1) {
      memberstoadd.push(selectbox.options[selectbox.selectedIndex].value);
      selectbox.options[selectbox.selectedIndex].selected = false;
    }
    Meteor.call('addGroupMembers', {
      _id: Session.get("selectedGroup"),
      members: memberstoadd
    }, function (error, group) {
      if (! error) {

      }
    });
  },

  'input .availableMemberSearch': function (event, template) {
    var searchterm = template.find(".availableMemberSearch").value;
    Session.set('availableMemberSearchTerm', searchterm);
  },

  'input .existingMemberSearch': function (event, template) {
    var searchterm = template.find(".existingMemberSearch").value;
    Session.set('existingMemberSearchTerm', searchterm);
  }
});

Template.editGroupDialog.groupMembers = function () {
  var group_id = Session.get("selectedGroup");
  var searchterm = Session.get("existingMemberSearchTerm");
  var group = Groups.findOne({_id:group_id});
  if (group !== undefined) {
    return Meteor.users.find({$and: [{"profile.name": {$regex: ".*"+ searchterm +".*", $options: 'i'}}, {"profile.isStaff": false}, {_id: {$in: group.members}}]});
  }
};

Template.editGroupDialog.possibleGroupMembers = function () {
  var group_id = Session.get("selectedGroup");
  var searchterm = Session.get("availableMemberSearchTerm");
  var group = Groups.findOne({_id:group_id});
  if (group !== undefined) {
    return Meteor.users.find({$and: [{"profile.name": {$regex: ".*"+ searchterm +".*", $options: 'i'}}, {"profile.isStaff": false}, {_id: {$nin: group.members}}]});
  }
};

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
