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
action_editgroups = function(ticketList) {
    if ($('.editgroupscontainer').length == 0) {
      UI.insert(UI.render
        (Template['action_editgroups']),
        $('.container').get(0)
      );
    } else {
        Session.set("showEditgroupDialog", true);
    }
    Session.set('editgroupslist', ticketList);
};

Template.action_editgroups.created = function() {
    Session.set("showEditgroupDialog", true);
    Session.set('editgroupslist', []);
};

Template.action_editgroups.helpers({
    showEditgroupDialog: function() {
        return Session.get("showEditgroupDialog");
    }
});

Template.editgroupdialog.rendered = function () {
  $(".ticketgroup").select2({
    placeholder: 'Select groups',
    data: get_groups,
    multiple: true
  });
  var ticket = Tickets.findOne({_id:Session.get('viewticketId')});
  $(".ticketgroup").val(ticket.groups, 'id').trigger('change');

};

var get_groups = function (query_opts) {
  var user = Meteor.users.findOne({_id:Meteor.userId()});
  var ticket = Tickets.findOne({_id:Session.get('viewticketId')});
  var requesters = [];
  ticket.requesters.forEach(function (requester) {
    requesters.push(requester.id);
  });

  var grouplist = Groups.find({members: {$in: requesters}});
  if (grouplist.count() < 1 && is_staff(user)) {
    grouplist = Groups.find({}, {sort: {'name': 1}});
  }
  var groups = [];
  grouplist.forEach(function (group) {
    groups.push({id:group._id, text:group.name});
  });
  return {results: groups};
};

Template.editgroupdialog.events({
  'click .cancel': function (event, template) {
    event.preventDefault();
    Session.set("showEditgroupDialog", false);
  },

  'click .editgroups': function (event, template) {
    event.preventDefault();
    var groups = $(".ticketgroup").select2('val');
    Meteor.call('editgroups_action', Meteor.userId(), Session.get('viewticketId'), groups, function (error) {
        if (!error) {

        }
    });

    Session.set("showEditgroupDialog", false);
  }
});
