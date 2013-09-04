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
Meteor.startup(function (){
  // register the email gateway module
  Meteor.call('registerModule', {
    name: 'email-gateway',
    callback_enable: 'enable_gateway_module',
    callback_disable: 'disable_gateway_module',
    description: 'Creates tickets from emails and sends an email to the requester with the ticket reply.',
    depends: ['attachments'],
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

      var ticketurl = Meteor.absoluteUrl('ticket/' + ticket._id, {});
      var body = 'An update to your request has been posted and is shown below.\n\n';
      body += 'To view the thread in context, visit ' + ticketurl + '.  ';
      body += 'You can reply online or by replying to this email.\n\n';

      body += reply.body;

      var text = body;
      var html = marked(body);

      var requesteremails = '';
      for (var i = 0, l = ticket.requesters.length; i < l; i++) {
        requesteremails += useremail(ticket.requesters[i]);
        if (i < ticket.requesters.length -1) {
          requesteremails += ', ';
        }
      }

      Email.send({
        text: text,
        from: EMAIL_FROM,
        to: requesteremails,
        subject: subject,
        headers: {
          'in-reply-to': get_requester_message_id(ticket._id)
        }
      });
    }
  }
});

get_requester_message_id = function(ticketId) {
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
      if (replies[i].message_id) {
        message_id = replies[i].message_id;
        break;
      }
    }
  }
  return message_id;
};

