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
Meteor.startup(function() {
  // register the dashing submit module
  Meteor.call('registerModule', {
    name: 'ticketpriority',
    callback_enable: 'enable_ticketpriority_module',
    callback_disable: 'disable_ticketpriority_module',
    description: 'Allows tickets to have a priority and SLA.',
    depends: []
  }, function(error, module_id) {
    if (!error) {

    }
  });

  var settings = TicketPrioritySettings.findOne();
  if (settings === undefined) {
    TicketPrioritySettings.insert({
      default_priority: '4',
      max_response_time: 480,
      time_unit: 'minutes',
      priorities: [
        {priority: '1', time: 15},
        {priority: '2', time: 30},
        {priority: '3', time: 240},
        {priority: '4', time: 480}
      ]
    });
  }
});


ticketpriority_extrafields = function () {
  var settings = TicketPrioritySettings.findOne();
  return {name: 'priority', value: settings.default_priority};
};

Meteor.methods({
  enable_ticketpriority_module: function(args) {
    args = args || {};

    var settings = TicketPrioritySettings.findOne();
    if (settings === undefined) {
      TicketPrioritySettings.insert({
        default_priority: '4',
        max_response_time: 480,
        time_unit: 'minutes',
        priorities: [
          {priority: '1', time: 15},
          {priority: '2', time: 30},
          {priority: '3', time: 240},
          {priority: '4', time: 480}
        ]
      });
    }

    Hooks.insert({
      hook: 'settings_page',
      module_id: args.module_id,
      data: 'ticketpriority_settings_page'
    });

    Hooks.insert({
      hook: 'ticket_create_form_field',
      module_id: args.module_id,
      template: 'ticketpriority_ticket_create_form_field'
    });

    Hooks.insert({
      hook: 'ticket_edit_form_field',
      module_id: args.module_id,
      template: 'ticketpriority_ticket_edit_form_field'
    });

    Hooks.insert({
      hook: 'ticketlistitemfooter_items',
      module_id: args.module_id,
      template: 'ticketpriority_ticketlistitemfooter'
    });

    Hooks.insert({
      hook: 'ticketlist_sort_filter',
      module_id: args.module_id,
      template: 'ticketpriority_ticketlistsortfilter'
    });

    Hooks.insert({
      hook: 'tickettopright',
      module_id: args.module_id,
      template: 'ticketpriority_tickettopright'
    });

    Hooks.insert({
      hook: 'ticketextrafields',
      module_id: args.module_id,
      callback: 'ticketpriority_extrafields'
    });
  },

  disable_ticketpriority_module: function(args) {
    args = args || {};

    Hooks.remove({
      module_id: args.module_id
    });
  }
});
