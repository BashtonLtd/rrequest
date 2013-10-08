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
Template.timeworked_reply_header.helpers({
  reply: function(replyId) {
    var ticket = Tickets.findOne({_id: Session.get('viewticketId')});

    var replies = [];
    ticket.replies.forEach(function(reply){
      if(reply.status == 'posted') {
      	replies.push(reply);
      }
    });

	  // Fetch replies from other modules
	  var hooks = Hooks.find({hook:'ticket_replies'});
	  hooks.forEach(function (hook) {
  	  var ticketreplies = window[hook.data]({ticketId: Session.get('viewticketId')});
	    ticketreplies.forEach(function(ticketreply) {
  	  	replies.push(ticketreply);
	    });
	  });

	  var replyIndex = _.indexOf(_.pluck(replies, '_id'), replyId);
	  return replies[replyIndex];
  }
});

Template.timeworked_ticket_sidebar.helpers({
  totaltimeworked: function() {

  	var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
  	var timeworked = 0;
  	if (ticket !== undefined) {
  	  ticket.replies.forEach(function(reply){
  	  	if(reply !== undefined) {
  	  	  if(reply.status == 'posted') {
  	  	  	if (reply.timeworked) {
  	  	  	  timeworked = timeworked + parseInt(reply.timeworked);
  	  	  	}
  	  	  }
  	  	}
  	  });

  	  // Fetch replies from other modules
	    var hooks = Hooks.find({hook:'ticket_replies'});
  	  hooks.forEach(function (hook) {
	      var ticketreplies = window[hook.data]({ticketId: Session.get('viewticketId')});
	      ticketreplies.forEach(function(ticketreply) {
  	  	  if (ticketreply.timeworked) {
	  	      timeworked = timeworked + parseInt(ticketreply.timeworked);
	  	    }
	      });
	    });
  	}
  	return timeworked;
  }
});

Template.timeworked_reply_form_field.events({
  'blur #timeworked': function (event, template) {
    template.find("#timeworked").value = 15 * Math.ceil(template.find("#timeworked").value/15);
  }
});