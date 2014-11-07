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

  updateStatus: function (options) {
    options = options || {};
    update_status(options);
  },

  insertEvent: function (options) {
    return insert_event(options);
  },

  updateTicket: function (options) {
    return update_ticket(options);
  }
});

update_ticket  = function (options) {
  options = options || {};

  var args = {};
  args.subject = options.subject;
  args.requesters = options.requesters;
  args.group = options.groups;
  args.status = options.status;
  if (args.status == 'closed') {
      args.resolved = new Date();
  }

  if (options.extrafields !== undefined && options.extrafields.length > 0) {
    options.extrafields.forEach(function(item) {
      args[item.name] = item.value;
    });
  }

  return Tickets.update({_id: options._id},
      {$set: args}
    );
};

insert_event = function(options) {
  options = options || {};
  var now = new Date();
  if (options.created !== undefined) {
    now = options.created;
  }
  var user = {id:'', email:'System'};
  if (options.user !== undefined) {
    user = options.user;
  }
  var level = 'system';
  if (options.level !== undefined) {
    level = options.level;
  }

  var reply = {
    _id: Random.id(),
    posted_by: user,
    status: 'posted',
    type: 'event',
    body: options.body,
    level: level,
    created: now
  };

  return Tickets.update(
    {_id: options.ticketId},
    {
      $push: { replies: reply},
      $set: {modified: now}
    }
  );
};

update_status = function(options) {
  options = options || {};

  var args = {};
  args.status = options.status;
  if (args.status == 'closed') {
      args.resolved = new Date();
  }

  return Tickets.update(
    {_id: options.ticketId},
    {$set: args}
  );
};

create_reply = function(options) {
  var ticket = Tickets.findOne({_id: options.ticketId});
  var original_status = ticket.status;
  var user_level = 'requester';
  if(options.user.profile.isStaff) {
    user_level = 'staff';
  }

  var now = new Date();
  if (options.created !== undefined) {
    now = options.created;
  }

  var reply = options.reply;
  reply['_id'] = Random.id();
  reply['type'] = 'reply';
  reply['level'] = user_level;
  reply['posted_by'] = {id:options.user._id, email:options.user.profile.email};
  reply['created'] = now;

  Tickets.update(
    {_id: options.ticketId},
    {
      $push: { replies: reply},
      $set: {modified: now, status: 'new'}
    }
  );
  if (original_status !== 'new') {
    insert_event({
      ticketId: options.ticketId,
      user: options.user._id,
      body: 'Status automatically set to "new" by requester reply.'
    });
  }

  var log_email = options.user.profile.email;
  var log_subject = ticket.subject;
  var log_ticket_url = Meteor.absoluteUrl('ticket/' + ticket._id, {secure: true});

  Meteor.call('createEventLog',{
    level:'INFO',
    tags:['replycreated'],
    message: log_email + ' replied to ' + log_subject + ' ' + log_ticket_url
  });


  return reply._id;
};

sortByDate = function(obj1, obj2) {
  return new Date(obj2.created) < new Date(obj1.created) ? 1 : -1;
};

sortByDateString = function(obj1, obj2) {
    return new Date(obj2.created_at) < new Date(obj1.created_at) ? 1 : -1;
};

sortByName = function(obj1, obj2) {
  return obj2.name < obj1.name ? 1 : -1;
};
