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
Template.ticketpriority_ticket_create_form_field.ticketpriority = function () {
  var priorities = TicketPrioritySettings.findOne().priorities;
  return priorities;
};

Template.ticketpriority_ticket_create_form_field.helpers({
  selectedpriority: function(priority) {
    var settings = TicketPrioritySettings.findOne();
    if (settings.default_priority == priority) {
      return 'selected';
    }
  },

  defaultpriority: function() {
    var settings = TicketPrioritySettings.findOne();
    return settings.default_priority;
  }
});

Template.ticketpriority_ticket_edit_form_field.ticketpriority = function () {
  var priorities = TicketPrioritySettings.findOne().priorities;
  return priorities;
};

Template.ticketpriority_ticket_edit_form_field.helpers({
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
    Session.set('selected_sort_field', 'priority');
    Session.set('selected_sort_order', 1);
  }
});

Template.ticketpriority_tickettopright.priority = function (ticketId) {
  var ticket = Tickets.findOne({_id: ticketId}, {fields: {priority: 1}});
  return ticket.priority;
};