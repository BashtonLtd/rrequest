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
Meteor.startup(function (){
  Meteor.call('registerModule', {
    name: 'attachments',
    callback_enable: 'enable_attachments_module',
    callback_disable: 'disable_attachments_module',
    description: 'Displays attachments with the ticket reply.'
  }, function(error, module_id) {
    if(!error) {

    }
  });
});

Meteor.methods({
  enable_attachments_module: function(args) {
    args = args || {};

    Hooks.insert({
      hook: 'reply_footer',
      module_id: args.module_id,
      template: 'attachments'
    });

    Hooks.insert({
      hook: 'replyentry_footer',
      module_id: args.module_id,
      template: 'replyentry_attachments'
    });
  },

  disable_attachments_module: function(args) {
    args = args || {};

    Hooks.remove({
      module_id: args.module_id
    });
  },

  removeAttachment: function (args) {
    return Attachments.remove({_id: args.id});
  },

  createAttachment: function (options) {
    return create_attachment(options);
  }
});

var create_attachment = function (options) {
  options = options || {};

  return Attachments.insert({
    ticketId: options.ticketId,
    replyId: options.replyId,
    requester: options.requester,
    group: options.group,
    location: options.location,
    mimetype: options.mimetype,
    getfile: options.getfile,
    type: options.type,
    template: options.template
  });
};
