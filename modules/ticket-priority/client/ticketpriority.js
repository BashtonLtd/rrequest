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
Template.ticketpriority_ticket_create_form_field.helpers({
    ticketpriority: function() {
        var settings = TicketPrioritySettings.findOne();
        if (settings != undefined) {
            var user = Meteor.users.findOne({_id: Meteor.userId()});
            if (user !== undefined) {
                if (user.profile.pagerduty_blockedP1 == "true") {

                    return _.without(settings.priorities, _.findWhere(settings.priorities, {priority: "1"}));
                }
            }

            return settings.priorities;
        }
    },

    selectedpriority: function(priority) {
        var settings = TicketPrioritySettings.findOne();
        if (settings.default_priority == priority) {
            return 'selected';
        }
    },

    defaultpriority: function() {
        var settings = TicketPrioritySettings.findOne();
        return settings.default_priority;
    },

    P1Allowed: function() {
        var user = Meteor.users.findOne({_id: Meteor.userId()});
        if (user !== undefined) {
            if (user.profile.pagerduty_blockedP1 == "true") {
                return false;
            }
        }
        return true;
    }
});

Template.ticketpriority_ticket_edit_form_field.helpers({
    ticketpriority: function() {
        var priorities = TicketPrioritySettings.findOne().priorities;
        return priorities;
    },

    selectedpriority: function(priority) {
        var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
        if (ticket.priority == priority) {
            return 'selected';
        }
    }
});

Template.ticketpriority_ticketlistitemfooter.helpers({
  ticketPriority: function(ticketId) {
    var ticket = Tickets.findOne({_id: ticketId}, {fields: {priority: 1}});
    if (ticket !== undefined) {
      if (ticket.priority !== undefined) {
        return 'P' + ticket.priority;
      }
    }
  }
});

Template.ticketpriority_ticketlistsortfilter.events({
  'click .prioritysortrow': function (event, template) {
    var sortfield = $('#sortpriority').parent().parent().parent().find('#sortfieldvarname').val();
    var sortorder = $('#sortpriority').parent().parent().parent().find('#sortordervarname').val();
    Session.set(sortfield, 'priority');
    Session.set(sortorder, 1);
  }
});

Template.ticketpriority_tickettopright.helpers({
    priority: function(ticketId) {
        var ticket = Tickets.findOne({_id: ticketId}, {fields: {priority: 1}});
        return ticket.priority;
    }
});
