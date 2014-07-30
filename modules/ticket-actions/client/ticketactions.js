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
UI.registerHelper('ticketlistactions', function() {
  var ticketactions = [];
  var user = Meteor.users.findOne({_id: Meteor.userId()});
  if(user.profile.isStaff) {
    var hooks = Hooks.find({hook:'ticketactions', type: 'ticketlist'});
  } else {
    var hooks = Hooks.find({hook:'ticketactions', type: 'ticketlist', staff_only: false});
  }
  hooks.forEach(function (hook) {
    ticketactions.push({name: hook.name, callback: hook.callback, id: hook._id});
  });
  ticketactions.sort(sortByName);
  return ticketactions;
});

Template.ticketlistactionlist.events({
  'click .ticketaction': function (event, template) {
    event.preventDefault();
    var hook_id = $(event.target).context.id;
    var ticketlist = [];
    var selected_tickets = $(event.target).parents(".row").prev('.row').find('.ticket-item-check:checked');

    if (selected_tickets.length == 0) {
      // we may be on the dashboard page
      selected_tickets = $(event.target).parents(".box-footer").prev('.box-body').find('.ticket-item-check:checked');
    }

    if (selected_tickets.length == 0) {
        // This could be the new style collection list
        selected_tickets = $(event.target).parents('.box-body').find('.ticket-item-check:checked');
    }

    selected_tickets.each(function(ticketitem) {
      ticketlist.push(selected_tickets[ticketitem].value);
    });

    var hook = Hooks.findOne({_id:hook_id});
    if (hook !== undefined) {
      window[hook.callback](ticketlist);
    }
    
  }
});

UI.registerHelper('ticketactions', function() {
  var ticketactions = [];
  var user = Meteor.users.findOne({_id: Meteor.userId()});
  if(user.profile.isStaff) {
    var hooks = Hooks.find({hook:'ticketactions', type: 'ticket'});
  } else {
    var hooks = Hooks.find({hook:'ticketactions', type: 'ticket', staff_only: false});
  }
  hooks.forEach(function (hook) {
    ticketactions.push({name: hook.name, callback: hook.callback, id: hook._id});
  });
  ticketactions.sort(sortByName);
  return ticketactions;
});

Template.ticketactionlist.events({
  'click .ticketaction': function (event, template) {
    event.preventDefault();
    var hook_id = $(event.target).context.id;
    var ticketlist = [];
    
    ticketlist.push(Session.get('viewticketId'));

    var hook = Hooks.findOne({_id:hook_id});
    if (hook !== undefined) {
      window[hook.callback](ticketlist);
    }
    
  }
});