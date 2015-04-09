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
  // register the comment module
  Meteor.call('registerModule', {
    name: 'timeworked',
    callback_enable: 'enable_timeworked_module',
    callback_disable: 'disable_timeworked_module',
    description: 'Allows staff to add time worked to a ticket reply or comment, with the total time worked displayed in the sidebar.'
  }, function(error, module_id) {
    if(!error) {

    }
  });
});

Meteor.methods({
  enable_timeworked_module: function(args) {
    args = args || {};

    // Add hook for reply form field button
    Hooks.insert({
      hook: 'ticket_reply_form_field',
      module_id: args.module_id,
      template: 'timeworked_reply_form_field'
    });

    Hooks.insert({
      hook: 'reply_header',
      module_id: args.module_id,
      template: 'timeworked_reply_header'
    });

    Hooks.insert({
      hook: 'ticket_sidebar',
      module_id: args.module_id,
      template: 'timeworked_ticket_sidebar'
    });

    Hooks.insert({
      hook: 'groupstatboxes',
      module_id: args.module_id,
      template: 'timeworked_groupstatbox'
    });
  },

  disable_timeworked_module: function(args) {
    args = args || {};

    Hooks.remove({
      module_id: args.module_id
    });
  },

  getTotalTimeworked: function (args) {
    return get_total_timeworked(args);
  }
});

get_total_timeworked = function(args) {
  var start = moment(args.start).unix();
  var end = args.end;
  if (end === null || end === undefined) {
    end = moment(new Date()).unix();
  } else {
    end = moment(args.end).unix();
  }
  var group = Groups.findOne({_id: args.groupId});
  var tickets = Tickets.find({groups: {$in: [group._id]}});
  var ticketIds = [];
  var total = 0;
  tickets.forEach(function(ticket) {
    ticketIds.push(ticket._id);
    ticket.replies.forEach(function(reply) {
      if (reply.timeworked !== undefined) {
        if (moment(reply.created).unix() > start && moment(reply.created).unix() < end) {
          total = +total + +reply.timeworked;
        }
      }
    });
  });

  // also get timeworked from comments
  var comments = Comments.find({ticketId: {$in: ticketIds}});
  comments.forEach(function(comment) {
    if (comment.timeworked !== undefined) {
      if (moment(comment.created).unix() > start && moment(comment.created).unix() < end) {
        total = +total + +comment.timeworked;
      }
    }
  });
  return total;
};
