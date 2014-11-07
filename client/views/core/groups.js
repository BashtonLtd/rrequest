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

Template.editGroupDialog.rendered = function () {

    var hooks = Hooks.find({hook:'group_edit_form_field'});
    hooks.forEach(function (hook) {
        UI.insert(UI.render
            (Template[hook.template]),
            $('#groupeditextrafields').get(0)
        );
    });

    $(".grouprequesters").select2({
        placeholder: 'Select requesters',
        data: get_requesters,
        multiple: true,
        tokenSeparators: [" "],

        createSearchChoice:function(term, data) {
            if ($(data).filter(function() {
                return this.text.localeCompare(term) === 0;
            }).length === 0) {
                return {id:term, text: term, isNew: true};
            }
        },

        formatResult: function(term) {
            if (term.isNew) {
                return '<span class="label label-important">New</span> ' + term.text;
            } else {
                return term.text;
            }
        }
    });

    var group_id = Session.get("selectedGroup");
    var group = Groups.findOne({_id:group_id});
    $(".grouprequesters").val(group.members).trigger("change");
};

var get_requesters = function (query_opts) {
  var users = Meteor.users.find({"profile.isStaff": false});
  var requesters = [];
  users.forEach(function (user) {
    requesters.push({id:user._id, text:user.profile.email});
  });
  return {results: requesters};
};

Template.editGroupDialog.groupname = function () {
  var group_id = Session.get("selectedGroup");
  var group = Groups.findOne({_id:group_id});
  return group !== undefined ? group.name : '';
};

Template.editGroupDialog.events({
  'click .save': function (event, template) {
    var name = template.find(".name").value;
    var members = $(".grouprequesters").select2('val');

    var existing_users = [];
    var new_users = [];

    members.forEach(function (member){
      var user = Meteor.users.findOne({_id:member});
      if (user !== undefined) {
        // User already exists in the system
        existing_users.push(user._id);
      } else {
        // User not found, check for valid email address
        var emailMatcher = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (emailMatcher.test(member)) {
          new_users.push(member);
        }
      }
    });
    new_users.forEach(function (email_address){
      Meteor.call('createAutoUser', email_address, function (error, userId) {
        if (!error) {
          Meteor.call('addGroupMembers', {
            _id: Session.get("selectedGroup"),
            members: [userId]
          }, function (error, group) {

          });
        }
      });
    });

    var extras = $('#groupeditextrafields').serializeArray();

    var extrafields = [];
    $.each(extras, function() {
      extrafields.push({name: this.name, value: this.value || ''});
    });

    var args = {
        _id: Session.get("selectedGroup"),
        name: name,
        members: existing_users,
        extrafields: extrafields
    };

    Meteor.call('updateGroup', args, function (error, group) {
      if (! error) {

      }
    });
    Session.set("showEditGroupDialog", false);
  },

  'click .cancel': function () {
    Session.set("showEditGroupDialog", false);
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
