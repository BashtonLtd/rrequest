Template.ticket.events({
  'click .post-ticket-comment': function (event, template) {
    var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
    var body = template.find(".ticketreplybody").value;
    Comments.insert({
      status: 'posted',
      body: body,
      ticketId: ticket._id,
      type: 'comment',
      posted_by: Meteor.userId(),
      created: new Date()
    });

    var replyId = template.find(".ticketreplyId").value;
    var replyIndex = _.indexOf(_.pluck(ticket.replies, '_id'), replyId);
    Meteor.call('updateReply', {
      ticketId: ticket._id,
      replyId: replyId,
      replyIndex: replyIndex,
      body: '',
      status: 'unposted'
    });
    template.find(".ticketreplybody").value = "";
  }
});

var comment_replies = function(args) {
  args = args || {};
  return Comments.find({ticketId: args.ticketId});
};

var ticket_comment_button = function(args) {
  args = args || {};
  var user = Meteor.users.findOne({_id: args.userId});
  if(user !== undefined) {
    if(user.profile.isStaff) {
      return true;
    } else {
      return false;
    }
  }
  return false;
};
