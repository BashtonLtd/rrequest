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
  }
});

create_ticket = function (options) {
  options = options || {};

  return Tickets.insert({
    subject: options.subject,
    created: new Date(),
    status: options.status,
    requester: options.requester,
    group: options.group,
    replies: []
  });

};


get_or_create_ticket = function(user, subject) {
  var pattern = /(\[)([a-zA-Z0-9]*)/i;
  var result = pattern.exec(subject);
  var ticketId = null;
  var ticket = null;
  var group = get_user_group(user);

  if (result !== null) {
    ticketId = result[2];
  }

  if (ticketId !== null) {
    ticket = Tickets.findOne({_id: ticketId});
  }

  if (ticket !== null) {
    return ticket;
  } else {
    var new_ticketId = create_ticket({
      subject: subject,
      status: 'new',
      requester: user._id,
      group: group
    });
    ticket = Tickets.findOne({_id: new_ticketId});
    return ticket;
  }

};
