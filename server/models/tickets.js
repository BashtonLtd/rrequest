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

  addTicketRequester: function (options) {
    return add_ticket_requester(options);
  },

  setTicketGroups: function (options) {
    return set_ticket_groups(options);
  },

  getTicket: function (ticketId) {
    return get_ticket(ticketId);
  }
});


set_ticket_groups = function (options) {
  options = options || {};
  return Tickets.update(
    {_id:options.ticketId},
    {
      $set: {group: options.groups}
    }
  );
};

add_ticket_requester = function (options) {
  options = options || {};
  var user = Meteor.users.findOne({_id:options.requesterId});
  if (user !== undefined) {
    return Tickets.update(
      {_id:options.ticketId},
      {
        $push: {requesters: {id:options.requesterId, email:user.profile.email}}
      }
    );
  }
};

create_ticket = function (options) {
  options = options || {};
  var args = {};
  if (options._id !== undefined) {
    args._id = options._id;
  }
  args.subject = options.subject;
  args.created = new Date();
  args.status = options.status;
  args.requesters = options.requesters;
  args.group = options.groups;
  args.replies = [];

  if (options.extrafields !== undefined && options.extrafields.length > 0) {
    options.extrafields.forEach(function(item) {
      args[item.name] = item.value;
    });
  }

  return Tickets.insert(args);
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
    var new_ticketId = create_ticket(args);
    ticket = Tickets.findOne({_id: new_ticketId});
    return ticket;
  }

};