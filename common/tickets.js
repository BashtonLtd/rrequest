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

    var now = new Date();
    var modifier = {$set: {}};
    modifier.$set["modified"] = now;

    for (var i = 0, l = _.size(options.replyfields); i < l; i++) {
      modifier.$set["replies." + options.replyIndex + "." + options.replyfields[i].name] = options.replyfields[i].value;
    };

    if (options.userId !== undefined) {
      modifier.$set["replies." + options.replyIndex + ".posted_by"] = options.userId;
      modifier.$set["replies." + options.replyIndex + ".created"] = now;
    }

    return Tickets.update(
      {_id: options.ticketId, "replies._id": options.replyId},
      modifier
    );
  },

  updateStatus: function (options) {
    options = options || {};

    return Tickets.update(
      {_id: options.ticketId},
      {$set: {status: options.status}}
    );
  },

  insertEvent: function (options) {
    options = options || {};

    var now = new Date();

    var reply = {
      _id: Random.id(),
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
  }
});

create_reply = function(options) {
  var user_level = 'requester';
  if(options.user.profile.isStaff) {
    user_level = 'staff';
  }

  var now = new Date();
  reply = options.reply;
  reply['_id'] = Random.id();
  reply['type'] = 'reply';
  reply['level'] = user_level;
  reply['posted_by'] = options.user._id;
  reply['created'] = now;

  Tickets.update(
    {_id: options.ticketId},
    {
      $push: { replies: reply},
      $set: {modified: now}
    }
  );
  return reply._id;
};

sortByDate = function(obj1, obj2) {
  return new Date(obj2.created) < new Date(obj1.created) ? 1 : -1;
};
