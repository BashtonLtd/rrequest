Meteor.methods({
  updateReply: function (options) {
    options = options || {};

    var modifier = {$set: {}};
    modifier.$set["replies." + options.replyIndex + ".body"] = options.body;
    modifier.$set["replies." + options.replyIndex + ".status"] = options.status;
    modifier.$set["replies." + options.replyIndex + ".type"] = options.type;

    if (options.userId !== undefined) {
      modifier.$set["replies." + options.replyIndex + ".posted_by"] = options.userId;
      modifier.$set["replies." + options.replyIndex + ".created"] = new Date();
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

    var reply = {
      _id: Random.id(),
      status: 'posted',
      type: 'event',
      body: options.body,
      level: 'system',
      created: new Date()
    };
    return Tickets.update(
      {_id: options.ticketId},
      {
        $push: { replies: reply}
      }
    );
  }
});