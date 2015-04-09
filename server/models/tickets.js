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
Meteor.methods({
  createTicket: function (options) {
    return create_ticket(options);
  },

  getTicket: function (ticketId) {
    return get_ticket(ticketId);
  }
});

create_ticket = function (options) {
    options = options || {};
    var args = {};
    if (options._id !== undefined) {
        args._id = options._id;
    } else {
        args._id = Random.id();
    }
    var now = new Date();

    if (options.replies !== undefined) {
        args.replies = options.replies;
    } else {
        args.replies = [];
    }

    if (options.status == 'closed') {
        options.resolved = now;
    } else {
        options.resolved = null;
    }

    var ticket = new Ticket(args._id, now, now, options.resolved, options.subject, options.status, options.requesters, options.groups, args.replies, true, options.extrafields);
    ticket.insert();
    return ticket;
};

get_ticket = function(ticketId) {
  var ticket = Tickets.findOne({_id: ticketId});
  if (ticket !== undefined && ticket.mergedInto !== undefined) {
    ticket = Tickets.findOne({_id: ticket.mergedInto});
  }
  return ticket;
};

get_or_create_ticket = function(requesters, subject) {
  var pattern = /(\[)([a-zA-Z0-9]*)/i;
  var result = pattern.exec(subject);
  var ticketId = null;
  var ticket = null;
  var group = null;

  for (var i = 0, l = requesters.length; i < l; i++) {
    if (in_multiple_groups({_id: requesters[i].id})) {
      group = null;
    } else {
      var usergroup = get_user_group({_id: requesters[i].id});
      if (usergroup !== undefined) {
        group = [usergroup];
        break;
      }
    }
  }

  if (result !== null) {
    ticketId = result[2];
  }

  if (ticketId !== null) {
    ticket = Tickets.findOne({_id: ticketId});
    // ticket found check if it has been merged
    if (ticket !== undefined && ticket.mergedInto !== undefined) {
      // Ticket has been merged, get the target ticket
      ticket = Tickets.findOne({_id: ticket.mergedInto});
    }
  }

  if (ticket !== null && ticket !== undefined) {
    // compare requesters and add any new requesters to the ticket
    requesters.forEach(function(requester) {
      var idx = _.indexOf(_.pluck(ticket.requesters, 'id'), requester.id);
      if (idx === -1) {
        // add requester
        add_ticket_requester({
          ticketId: ticket._id,
          requesterId: requester.id
        });
      }
    });
    return ticket;
  } else {
    // hooks for extrafields on new tickets
    var args = {};
    args.subject = subject;
    args.status = 'new';
    args.requesters = requesters;
    args.groups = group;

    var extrafields = [];

    var hooks = Hooks.find({hook:'ticketextrafields'});
    hooks.forEach(function(hook) {
      var fn = new Function("term", "return " + hook.callback + "();");
      extrafields.push(fn());
    });

    args.extrafields = extrafields;
    var new_ticket = create_ticket(args);
    return new_ticket;
  }

};
