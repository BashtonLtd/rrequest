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
    name: 'ticketstates',
    callback_enable: 'enable_ticketstate_module',
    callback_disable: 'disable_ticketstate_module',
    description: 'Allows extra ticket states to be defined.',
    depends: []
  }, function(error, module_id) {
    if (!error) {

    }
  });

  var settings = TicketStateSettings.findOne();
  if (settings === undefined) {
    // Add list of icons
    icons = [
      'icon-heart',
      'icon-ok',
      'icon-lock',
      'icon-tag',
      'icon-plus-sign',
      'icon-question-sign',
      'icon-ok-circle',
      'icon-exclamation-sign',
      'icon-calendar',
      'icon-thumbs-up',
      'icon-tasks',
      'icon-star',
      'icon-remove',
      'icon-flag',
      'icon-map-marker',
      'icon-minus-sign',
      'icon-info-sign',
      'icon-ban-circle',
      'icon-plus',
      'icon-thumbs-down',
      'icon-globe',
      'icon-comment',
      'icon-warning-sign',
      'icon-minus',
      'icon-remove-sign',
      'icon-check',
      'icon-time',
      'icon-cog',
      'icon-star-empty',
      'icon-trash',
      'icon-ok-sign',
      'icon-remove-circle',
      'icon-asterisk',
      'icon-shopping-cart',
      'icon-wrench',
      'icon-certificate',
    ]

    TicketStateSettings.insert({
      icons: icons
    });
  }
});

Meteor.methods({
  enable_ticketstate_module: function(args) {
    args = args || {};

    Hooks.insert({
      hook: 'settings_page',
      module_id: args.module_id,
      data: 'ticketstate_settings_page'
    });
  },

  disable_ticketstate_module: function(args) {
    args = args || {};

    Hooks.remove({
      module_id: args.module_id
    });
  },
});