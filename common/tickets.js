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
  updateReply: function (options) {
    options = options || {};

    if (!this.isSimulation) {
      var now = new Date();
      var modifier = {$set: {}, $unset: {}};

      var idx = _.indexOf(_.pluck(options.replyfields, 'name'), 'status');
      if (options.replyfields[idx].value == 'posted') {
        if (!is_staff_by_id(options.userId)) {
          modifier.$set["status"] = 'new';
        }
        modifier.$set["modified"] = now;
        // This should be in the autoclose module, can't use the  ticket reply event as that is client side
        modifier.$unset["close_warning"] = "";
      }

      for (var i = 0, l = _.size(options.replyfields); i < l; i++) {
        modifier.$set["replies." + options.replyIndex + "." + options.replyfields[i].name] = options.replyfields[i].value;
      };

      if (options.userId !== undefined) {
        modifier.$set["replies." + options.replyIndex + ".posted_by"] = options.userId;
        if (options.replyfields[idx].value == 'posted') {
          modifier.$set["replies." + options.replyIndex + ".created"] = now;
        }
      }

      return Tickets.update(
        {_id: options.ticketId, "replies._id": options.replyId},
        modifier
      );
    }
  },

  updateStatus: function (options) {
    options = options || {};
    update_status(options);
  },

  insertEvent: function (options) {
    return insert_event(options);
  }
});

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

  var reply = {
    _id: Random.id(),
    posted_by: user,
    status: 'posted',
    type: 'event',
    body: options.body,
    level: 'system',
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

  return Tickets.update(
    {_id: options.ticketId},
    {$set: {status: options.status}}
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

  reply = options.reply;
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

  return reply._id;
};

sortByDate = function(obj1, obj2) {
  return new Date(obj2.created) < new Date(obj1.created) ? 1 : -1;
};

sortByName = function(obj1, obj2) {
  return obj2.name < obj1.name ? 1 : -1;
};