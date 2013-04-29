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

comment_replies = function(args) {
  args = args || {};
  return Comments.find({ticketId: args.ticketId});
};

ticket_comment_button = function(args) {
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
