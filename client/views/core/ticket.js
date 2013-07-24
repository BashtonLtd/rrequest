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

Template.ticket.sidebaritems = function() {
  var sidebar_items = [];
  var hooks = Hooks.find({hook:'ticket_sidebar'});
  hooks.forEach(function (hook) {
    sidebar_items.push({template: Template[hook.template]()});
  });
  return sidebar_items;
};

Handlebars.registerHelper('reply_header_items', function(replyId) {
  var header_items = [];
  var hooks = Hooks.find({hook:'reply_header'});
  hooks.forEach(function (hook) {
    header_items.push({template: Template[hook.template]({replyId:replyId})});
  });
  return header_items;
});

Handlebars.registerHelper('footer_items', function(replyId) {
  var footer_items = [];
  var hooks = Hooks.find({hook:'reply_footer'});
  hooks.forEach(function (hook) {
    footer_items.push({template: Template[hook.template]({replyId:replyId})});
  });
  return footer_items;
});

Template.ticket.replyentryformfields = function(replyId) {
  var extraformfields = [];
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
  var hooks = Hooks.find({hook:'ticket_reply_form_field'});
  hooks.forEach(function (hook) {
    extraformfields.push({
      template: Template[hook.template]({
        ticketId: ticket._id,
        replyId:replyId
      })
    });
  });
  return extraformfields;
};

Template.ticket.replyentryfooter_items = function(replyId) {
  var replyentryfooter_items = [];
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
  var hooks = Hooks.find({hook:'replyentry_footer'});
  hooks.forEach(function (hook) {
    replyentryfooter_items.push({
      template: Template[hook.template]({
        ticketId: ticket._id, 
        replyId:replyId, 
        groups:ticket.groups, 
        requester:Meteor.userId()
      })
    });
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
          reply.template = Template["ticketreply-"+reply.type]({reply:reply});
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
        ticketreply.template = Template["ticketreply-"+ticketreply.type]({reply:ticketreply});
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
          replyfields: [
            {name: 'body', value: body},
            {name: 'status', value: 'unposted'}
          ]
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

    var extras = $('#ticketreplyextrafields').serializeArray()
    var extrafields = [];
    $.each(extras, function() {
      extrafields.push({name: this.name, value: this.value || ''});
    });

    var args = {
      ticketId: Session.get('viewticketId'),
      replyId: replyId,
      replyIndex: replyIndex,
      userId: Meteor.userId(),
      level: level,
      replyfields: [
        {name: 'type', value: 'reply'},
        {name: 'body', value: body},
        {name: 'status', value: 'posted'}
      ]
    };
    args.replyfields = args.replyfields.concat(extrafields);
    
    Meteor.call('updateReply', args, function (error, ticketId) {
      if (! error) {
        template.find(".ticketreplybody").value = "";
        if (ticket.status == 'creating') {
          // set status to new
          Meteor.call('updateStatus', {
            ticketId: Session.get('viewticketId'),
            status: 'new'
          }, function(error, ticketId) {});
        }
        // Fire ticket updated event
        EventHorizon.fire('ticketreply',{
          ticketId: Session.get('viewticketId'),
          replyId: replyId,
          postedBy: Meteor.userId()
        });
      }
    });
  },

  'click .edit-ticket': function () {
    openEditTicketDialog();
  }
});

var openEditTicketDialog = function () {
  Session.set('currentScroll',$('body').scrollTop());
  Session.set("showEditTicketDialog", true);
};

Template.ticket.showEditTicketDialog = function () {
 return Session.get("showEditTicketDialog");
};

Template.ticket.helpers({
  ticket: function(){
    var ticket = Tickets.findOne(Session.get('viewticketId'));
    return ticket;
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
    if (replytype == 'event') {
      return 'muted';
    }
  }
});

Template.editTicketDialog.ticketstatus = function() {
  return TicketStatus.find({});
};

Template.editTicketDialog.rendered = function () {
  $(".ticketrequester").select2({
    placeholder: 'Select requesters',
    data: get_requesters,
    multiple: true,
    tokenSeparators: [" "],

    createSearchChoice:function(term, data) {
      if ($(data).filter(function() {
        return this.email.localeCompare(term) === 0;
      }).length === 0) {
        return {id:term, email: term, isNew: true};
      }
    },

    formatResult: function(term) {
      if (term.isNew) {
        return '<span class="label label-important">New</span> ' + term.email;
      } else {
        return term.email;
      }
    }  
  });

  var ticket = Tickets.findOne({_id:Session.get('viewticketId')});
  $(".ticketrequester").val(_.pluck(ticket.requesters, 'id')).trigger('change');
};

get_requesters = function (query_opts) {
  var users = Meteor.users.find({"profile.isStaff": false});
  var requesters = [];
  users.forEach(function (user) {
    requesters.push({id:user._id, email:user.profile.email});
  });
  return {results: requesters};
};

Template.editTicketDialog.helpers({
  ticket: function(){
    return Tickets.findOne({_id:Session.get('viewticketId')});
  },

  selectedstatus: function(statusname){
    var ticket = Tickets.findOne({_id:Session.get('viewticketId')});
    if (ticket !== undefined) {
      if (ticket.status == statusname) {
        return 'selected';
      }
    }
  }
});

Template.editTicketDialog.events({
  'click .cancel': function () {
    Session.set("showEditTicketDialog", false);
  },

  'click .save': function (event, template) {
    var subject = template.find(".subject").value;
    var requesters = $(".ticketrequester").select2('val');
    var status = template.find(".ticketstatus").value;
    var ticket = Tickets.findOne({_id:Session.get('viewticketId')});
    var original_status = ticket.status;

    var existing_users = [];
    var new_users = [];
    requesters.forEach(function (requester){
      var user = Meteor.users.findOne({_id:requester});
      if (user !== undefined) {
        // User already exists in the system
        existing_users.push({id:user._id, email:user.profile.email});
      } else {
        // User not found, check for valid email address
        var emailMatcher = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (emailMatcher.test(requester)) {
          new_users.push(requester);
        }
      }
    });

    Meteor.call('updateTicket', {
      _id: ticket._id,
      subject: subject,
      requesters: existing_users,
      status: status
    } , function (error, ticketId) {
      if (! error) {
        // create new users
        new_users.forEach(function (email_address) {
          Meteor.call('createAutoUser', email_address, function (error, userId) {
            if (!error) {
              // Add user to the ticket
              Meteor.call('addTicketRequester', {
                ticketId: ticketId,
                requesterId: userId
              }, function (error, ticket_id) {

              });
            }
          });
        });
      }
    });

    if (status !== original_status) {
      Meteor.call('insertEvent', {
        ticketId: Session.get('viewticketId'),
        body: 'Ticket status changed to "' + status + '" by ' + useremail(Meteor.userId()) + '.'
      }, function(error, ticketId) {

      });
    }
    Session.set("showEditTicketDialog", false);
  }
});