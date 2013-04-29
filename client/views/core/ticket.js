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
Template.ticket.unposted_reply = function () {
  var user = Meteor.users.findOne({_id: Meteor.userId()});
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
  if (ticket !== undefined) {
    var unposted_reply = null;
    var user_level = 'requester';
    if (user !== undefined) {
      if(user.profile.isStaff) {
        user_level = 'staff';
      }
      ticket.replies.forEach(function(reply){
        if(reply !== {}) {
          if(reply.status == 'unposted' && reply.level == user_level){
            unposted_reply = reply;
          }
        }
      });

      if (unposted_reply === null) {
        // create an unposted reply for the current user level
        var reply = {_id: Random.id(), status: 'unposted', body: '', level: user_level};
        Tickets.update(
          {_id: Session.get('viewticketId')},
          {
            $push: { replies: reply}
          }
        );
        unposted_reply = reply;
      }
      return unposted_reply;
    }
  }
};

Template.ticket.ticket_reply_button = function () {
  var hooks = Hooks.find({hook:'ticket_reply_button'});
  var buttons = [];
  var user_id = Meteor.userId();
  hooks.forEach(function (hook) {
    if(window[hook.render]({userId:user_id})) {
      buttons.push(hook);
    }
  });
  return buttons;
};

Template.ticket.footer_items = function(replyId) {
  var footer_items = [];
  var hooks = Hooks.find({hook:'reply_footer'});
  hooks.forEach(function (hook) {
    footer_items.push({template: Template[hook.template]({replyId:replyId})});
  });
  return footer_items;
};

Template.ticket.replyentryfooter_items = function(replyId) {
  var replyentryfooter_items = [];
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
  var hooks = Hooks.find({hook:'replyentry_footer'});
  hooks.forEach(function (hook) {
    replyentryfooter_items.push({template: Template[hook.template]({ticketId: ticket._id, replyId:replyId, group:ticket.group, requester:ticket.requester})});
  });
  return replyentryfooter_items;
};

Template.ticket.posted_replies = function () {
  var user = Meteor.users.findOne({_id: Meteor.userId()});
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')});

  if (ticket !== undefined) {
    var replies = [];
    ticket.replies.forEach(function(reply){
      if(reply !== undefined) {
        if(reply.status == 'posted') {
          reply.body = marked(reply.body);
          replies.push(reply);
        }
      }
    });

    // Fetch replies from modules
    var hooks = Hooks.find({hook:'ticket_replies'});
    hooks.forEach(function (hook) {
      var ticketreplies = window[hook.data]({ticketId: Session.get('viewticketId')});
      ticketreplies.forEach(function(ticketreply) {
        ticketreply.body = marked(ticketreply.body);
        replies.push(ticketreply);
      });
    });

    // Sort array into date order
    replies.sort(sortByDate);
    return replies;
  }
};

Template.ticket.ticketstatus = function() {
  return TicketStatus.find({});
};

Template.ticket.ticketcreated = function () {
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
  if (ticket !== undefined) {
    return ticket.created;
  }
};

Template.ticket.ticketage = function () {
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
  if (ticket !== undefined) {
    return moment(ticket.created).fromNow();
  }
};

Template.ticket.replycreated = function() {
  return this.created;
};

Template.ticket.replyage = function () {
  return moment(this.created).fromNow();
};

Template.ticket.created = function () {
  Session.set('lastkeypresswasspace', false);
};

Template.ticket.events({
  'keydown .ticketreplybody': function (event, template) {
    var ticket = Tickets.findOne({_id: Session.get('viewticketId')});

    var replyId = template.find(".ticketreplyId").value;
    var level = template.find(".ticketreplylevel").value;
    var body = template.find(".ticketreplybody").value;

    var replyIndex = _.indexOf(_.pluck(ticket.replies, '_id'), replyId);

    if (event.keyCode == 32 || event.keyCode == 13) {
      //space or return pressed
      if (Session.get('lastkeypresswasspace')) {

      } else {
        // Save reply
        Meteor.call('updateReply', {
          ticketId: Session.get('viewticketId'),
          replyId: replyId,
          replyIndex: replyIndex,
          level: level,
          body: body,
          status: 'unposted'
        }, function (error, group) {
          if (! error) {

          }
        });
        Session.set('lastkeypresswasspace', true);
      }
    } else {
      Session.set('lastkeypresswasspace', false);
    }
  },

  'click .post-reply': function (event, template) {
    var ticket = Tickets.findOne({_id: Session.get('viewticketId')});

    var replyId = template.find(".ticketreplyId").value;
    var level = template.find(".ticketreplylevel").value;
    var body = template.find(".ticketreplybody").value;

    var replyIndex = _.indexOf(_.pluck(ticket.replies, '_id'), replyId);
    Meteor.call('updateReply', {
      ticketId: Session.get('viewticketId'),
      replyId: replyId,
      replyIndex: replyIndex,
      userId: Meteor.userId(),
      level: level,
      type: 'reply',
      body: body,
      status: 'posted'
      }, function (error, ticketId) {
        if (! error) {
          template.find(".ticketreplybody").value = "";
          if (ticket.status == 'creating') {
            // set status to new
            Meteor.call('updateStatus', {
              ticketId: Session.get('viewticketId'),
              status: 'new'
            }, function(error, ticketId) {

            });
          }

          // Fire ticket updated event
          EventHorizon.fire('ticketreply',{
            ticketId: Session.get('viewticketId'),
            replyId: replyId,
            postedBy: Meteor.userId()
          });
        }
      }
    );
  },

  'click .update-status': function (event, template) {
    var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
    var replyId = template.find(".ticketreplyId").value;
    var status = template.find(".ticketstatus").value;
    Meteor.call('updateStatus', {
      ticketId: Session.get('viewticketId'),
      status: status
    }, function(error, ticketId) {
      if (! error) {
        Meteor.call('insertEvent', {
          ticketId: Session.get('viewticketId'),
          body: 'Ticket status changed to "' + status + '" by ' + useremail(Meteor.userId()) + '.'
        }, function(error, ticketId) {

        });
      }
    });
    return false;
  }
});

Template.ticket.helpers({
  ticket: function(){
    var ticket = Tickets.findOne(Session.get('viewticketId'));
    return ticket;
  },

  getUserEmail: function(requesterId) {
    var email = useremail(requesterId);
    return email;
  },

  age: function(time){
    return moment(time).fromNow();
  },

  selectedstatus: function(statusname){
    var ticket = Tickets.findOne({_id:Session.get('viewticketId')});
    if (ticket !== undefined) {
      if (ticket.status == statusname) {
        return 'selected';
      }
    }
  },

  displayreply: function(replytype){
    var user = Meteor.users.findOne({_id: Meteor.userId()});
    if(user.profile.isStaff) {
      return true;
    } else {
      if (replytype == 'reply' || replytype == 'event') {
        return true;
      }
    }
    return false;
  },

  displayname: function(replytype){
    if (replytype != 'event') {
      return true;
    }
    return false;
  },

  isMuted: function(replytype){
    var user = Meteor.users.findOne({_id: Meteor.userId()});
    if (replytype == 'event') {
      return 'muted';
    }
  }
});
