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
//var emailjs = __meteor_bootstrap__.require('emailjs');
emailjs = Npm.require('emailjs');
Meteor.startup(function (){
  // register the email gateway module
  Meteor.call('registerModule', {
    name: 'email-gateway',
    callback_enable: 'enable_gateway_module',
    callback_disable: 'disable_gateway_module',
    description: 'Creates tickets from emails and sends an email to the requester with the ticket reply.',
    depends: [],
    conflicts: ['email-notifier']
  }, function(error, module_id) {
    if(!error) {

    }
  });

  var settings = EmailGatewaySettings.findOne();
  if (settings === undefined) {
    EmailGatewaySettings.insert({
      imap_username: '',
      imap_password: '',
      imap_host: '',
      imap_port: '',
      imap_secure: false
    });
  }

});

Meteor.methods({
  enable_gateway_module: function(args) {
    args = args || {};

    Hooks.insert({
      hook: 'settings_page',
      module_id: args.module_id,
      data: 'emailgateway_settings_page'
    });
  },

  disable_gateway_module: function(args) {
    args = args || {};

    Hooks.remove({
      module_id: args.module_id
    });
  },

  updateEmailGatewaySettings: function(args) {
    args = args || {};

    EmailGatewaySettings.update({},
      {$set: {
        imap_username: args.username,
        imap_password: args.password,
        imap_host: args.host,
        imap_port: args.port,
        imap_secure: args.secure,
        imap_interval: args.interval
      }},
      {multi: true}
    );
  },

  emailgateway_send_ticket_updated_email: function(args) {
    args = args || {};
    this.unblock();

    var ticket = Tickets.findOne({_id: args.ticketId});
    var replyIndex = _.indexOf(_.pluck(ticket.replies, '_id'), args.replyId);
    var reply = ticket.replies[replyIndex];
    if (ticket !== undefined) {
      var subject = '[' + ticket._id + '] ' + ticket.subject;
      var text = reply.body;
      var html = marked(reply.body);

      var server  = emailjs.server.connect({
        host:    "127.0.0.1"
      });

      var message = {
        text: text,
        from: EMAIL_FROM,
        to: useremail(ticket.requester),
        subject: subject,
        'in-reply-to': get_requester_message_id(ticket._id, ticket.requester),
        attachment:
        [
          {data:html, alternative:true}
        ]
      };
      server.send(message, function(err, message) {  });
    }
  }
});

var get_requester_message_id = function(ticketId, userId) {
  var ticket = Tickets.findOne({_id: ticketId});
  var message_id = '';

  if (ticket !== undefined) {
    var replies = [];
    ticket.replies.forEach(function(reply){
      if(reply !== {}) {
        if(reply.status == 'posted') {
          replies.push(reply);
        }
      }
    });
    replies.sort(sortByDate);
    replies.reverse();

    for (var i = 0, l = replies.length; i < l; i++) {
      if (replies[i].posted_by == userId && replies[i].message_id) {
        message_id = replies[i].message_id;
        break;
      }
    }
  }
  return message_id;
};

