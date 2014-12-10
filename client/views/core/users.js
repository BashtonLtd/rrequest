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
Template.users.created = function () {
    Session.setDefault('sortorder-users', 1);
    Session.setDefault('sortfield-users', 'profile.email');
};

Template.user_row.events({
  'click .edit-user': function (evt) {
    openEditUserDialog(this._id);
  },

  'click .disable-user': function (evt) {
    openDisableUserDialog(this._id);
  }
});

Template.users.helpers({
    showEditUserDialog: function() {
        return Session.get("showEditUserDialog");
    },

    users_data: function() {
        return {
            listLabel: "Users",
            name: 'users',
            collection: Meteor.users,
            collectionFilterKey: '',
            collectionFilterValue: '',
            publication: 'sortedUsers',
            rowtemplate: 'user_row',
            perpage: 15,
            searchfields: '_id,profile.email',
            sorttemplate: false,
            filterrow: '',
            filtertemplate: false,
            footerhooks: false
        };
    }
});

var openEditUserDialog = function (user_id) {
  Session.set('currentScroll',$(document).scrollTop());
  Session.set("selectedUser", user_id);
  Session.set("showEditUserDialog", true);
};

Template.editUserDialog.helpers({
    email: function() {
        var user_id = Session.get("selectedUser");
        var user = Meteor.users.findOne({_id:user_id});
        return user !== undefined ? user.profile.email : '';
    },

    profilename: function() {
        var user_id = Session.get("selectedUser");
        var user = Meteor.users.findOne({_id:user_id});
        var profilename = '';
        if (user !== undefined) {
            if (user.profile.name !== null) {
                profilename = user.profile.name;
            }
        }
        return profilename;
    },

    usereditadmin: function() {
        var user_id = Session.get("selectedUser");
        var user = Meteor.users.findOne({_id:user_id});
        var usereditadmin = '';
        if (user !== undefined) {
            if (user.isAdmin) {
                usereditadmin = 'active';
            }
        }
        return usereditadmin;
    },

    usereditstaff: function() {
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
    },

    usereditrequester: function() {
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
    }
});



Template.editUserDialog.rendered = function () {

    var hooks = Hooks.find({hook:'user_edit_form_field'});
    hooks.forEach(function (hook) {
        UI.insert(UI.render
            (Template[hook.template]),
            $('#usereditextrafields').get(0)
        );
    });
};

Template.editUserDialog.events({
  'click .save': function (event, template) {
    var profilename = template.find(".profilename").value;
    var userlevel = template.find(".active").value;

    var extras = $('#usereditextrafields').serializeArray();

    var extrafields = [];
    $.each(extras, function() {
      extrafields.push({name: this.name, value: this.value || ''});
    });

    var args = {
        _id: Session.get("selectedUser"),
        name: profilename,
        userlevel: userlevel,
        extrafields: extrafields
    };

    var user = Meteor.call('updateUser', args, function (error, group) {
      if (! error) {

      }
    });
    Session.set("showEditUserDialog", false);
  },

  'click .cancel': function () {
    Session.set("showEditUserDialog", false);
  }
});

Template.user_row.helpers({
    usertype: function () {
        if (is_admin_by_id(this._id)) {
            return '<span class="label label-success">Admin</span>';
        }
        if (is_staff_by_id(this._id)) {
            return '<span class="label label-info">Staff</span>';
        }
    }
});
