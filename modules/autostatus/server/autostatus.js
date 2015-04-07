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
  // register the autostatus module
  Meteor.call('registerModule', {
    name: 'autostatus',
    callback_enable: 'enable_autostatus_module',
    callback_disable: 'disable_autostatus_module',
    description: 'Changes the ticket state automatically on defined events.',
    depends: [],
  }, function(error, module_id) {
    if (!error) {

    }
  });

  var settings = AutostatusSettings.findOne();
  if (settings === undefined) {
    AutostatusSettings.insert({
      staff_typing: 'new'
    });
  }
});

Meteor.methods({
  enable_autostatus_module: function(args) {
    args = args || {};

    Hooks.insert({
      hook: 'settings_page',
      module_id: args.module_id,
      data: 'autostatus_settings_page'
    });
  },

  disable_autostatus_module: function(args) {
    args = args || {};

    Hooks.remove({
      module_id: args.module_id
    });
  },

  updateAutostatusSettings: function(args) {
    args = args || {};

    AutostatusSettings.update({},
      {$set: {
        staff_typing: args.staff_typing
      }},
      {multi: true}
    );
  },

  autostatus_staffupdating: function(args) {
    return autostatus_staffupdating(args.ticketId, args.postedBy);
  }
});

autostatus_staffupdating = function (ticketId, postedBy) {
    var ticket = Tickets.findOne({_id: ticketId});
    if (ticket !== undefined) {
        var settings = AutostatusSettings.findOne();
        if (settings !== undefined) {
            if (settings.staff_typing != ticket.status) {
                ticket.original_status = ticket.status;
                ticket.status = staff_typing;
                ticket.insert_event({
                    user: Meteor.user()._id,
                    body: 'Ticket status changed to "' + settings.staff_typing + '" by ' + useremail(Meteor.userId()) + '.',
                    update: false
                });
                ticket.save();
            }
        }
    }
};
