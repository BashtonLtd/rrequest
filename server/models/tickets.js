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

  updateTicket: function (options) {
    return update_ticket(options);
  },

  addTicketRequester: function (options) {
    return add_ticket_requester(options);
  },

  
});

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
}

create_ticket = function (options) {
  options = options || {};

  return Tickets.insert({
    subject: options.subject,
    created: new Date(),
    status: options.status,
    requesters: options.requesters,
    group: options.group,
    replies: []
  });
};

update_ticket  = function (options) {
  options = options || {};

  return Tickets.update({_id: options._id},
      {$set: {subject: options.subject, requesters: options.requesters, status:options.status}}
    );
};

get_or_create_ticket = function(requesters, subject) {
  var pattern = /(\[)([a-zA-Z0-9]*)/i;
  var result = pattern.exec(subject);
  var ticketId = null;
  var ticket = null;
  var group = null;

  for (var i = 0, l = requesters.length; i < l; i++) {
    var usergroup = get_user_group(requesters[i]);
    if (usergroup) {
      group = usergroup;
      break;
    }
  }

  if (result !== null) {
    ticketId = result[2];
  }

  if (ticketId !== null) {
    ticket = Tickets.findOne({_id: ticketId});
  }

  if (ticket !== null && ticket !== undefined) {
    return ticket;
  } else {
    var new_ticketId = create_ticket({
      subject: subject,
      status: 'new',
      requesters: requesters,
      group: group
    });
    ticket = Tickets.findOne({_id: new_ticketId});
    return ticket;
  }

};
