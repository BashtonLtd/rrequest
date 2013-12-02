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
var module;
var handles = [];

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

  module = Modules.findOne({name: 'email-gateway'});
  if (module.enabled) {
    start_watching_replies();
  }

});

var start_watching_replies = function() {
  var initializing = true;
  var handle = Tickets.find({isVisible: {$ne: false}}, {fields: {_id: 1, modified: 1}}).observeChanges({
    changed: function (id, fields) {
      if (!initializing) {

        var ticket = Tickets.findOne({_id: id});

        if (ticket !== undefined) {
          var replies = [];
          // find all with notified false and type reply
          ticket.replies.forEach(function(reply) {
            if (reply.type == 'reply' && reply.notified == false) {
              replies.push(reply);
            }
          });

          replies.sort(sortByDate);
          var latest_reply = replies[replies.length-1];

          if (latest_reply !== undefined) {
            var postedBy = Meteor.users.findOne({_id: latest_reply.posted_by});
            if (postedBy !== undefined) {
              Meteor.call('emailgateway_send_ticket_updated_email', {
                ticketId: id,
                user: postedBy,
                replyId: latest_reply._id
              }, function (error) {
                if (!error) {
                  set_reply_notified(id, latest_reply._id);
                }
              });
            }
          }
        }
      }
    }
  });
  initializing = false;
  handles.push({handle: handle});
};

Meteor.methods({
  enable_gateway_module: function(args) {
    args = args || {};

    Hooks.insert({
      hook: 'settings_page',
      module_id: args.module_id,
      data: 'emailgateway_settings_page'
    });

    start_watching_replies();
  },

  disable_gateway_module: function(args) {
    args = args || {};

    Hooks.remove({
      module_id: args.module_id
    });
    handles.forEach(function(handle) {
      try {
        handle.handle.stop();
      } catch(error) {
        
      }
    })
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
    emailgateway_send_ticket_updated_email(args);
  }
});

var set_reply_notified = function(ticketId, replyId) {
  var now = new Date();
  var modifier = {$set: {}};
  var ticket = Tickets.findOne({_id: ticketId});

  if (ticket !== undefined) {
    var replyIndex = _.indexOf(_.pluck(ticket.replies, '_id'), replyId);

    modifier.$set["replies." + replyIndex + ".notified"] = now;

    return Tickets.update(
      {_id: ticketId},
      modifier
    );
  }
};

var emailgateway_send_ticket_updated_email = function(args) {
  args = args || {};

  var ticket = Tickets.findOne({_id: args.ticketId});
  var replyIndex = _.indexOf(_.pluck(ticket.replies, '_id'), args.replyId);
  var reply = ticket.replies[replyIndex];
  if (ticket !== undefined) {
    var requesteremails = '';
    if (args.user.profile.isStaff) {
      for (var i = 0, l = ticket.requesters.length; i < l; i++) {
      requesteremails += useremail(ticket.requesters[i]);
        if (i < ticket.requesters.length -1) {
          requesteremails += ', ';
        }
      }
    } else {
      for (var i = 0, l = ticket.requesters.length; i < l; i++) {
        if (useremail(ticket.requesters[i]) != args.user.profile.email) {
          requesteremails += useremail(ticket.requesters[i]);
          if (i < ticket.requesters.length -1) {
            requesteremails += ', ';
          }
        }
      }
    }

    if (requesteremails != '') {
      var subject = '[' + ticket._id + '] ' + ticket.subject;

      var ticketurl = Meteor.absoluteUrl('ticket/' + ticket._id, {});
      var body = 'An update to your request has been posted and is shown below.\n\n';
      body += 'To view the thread in context, visit ' + ticketurl + '.  ';
      body += 'You can reply online or by replying to this email.\n\n';

      body += reply.body;

      var text = body;
      var html = marked(body);

      var site_name_setting = Settings.findOne({name: 'site_name'});
      var site_name = 'rrequest';
      if (site_name_setting !== undefined) {
        site_name = site_name_setting.value;
      }
      var emailfrom = args.user.profile.name + ' via ' + site_name + ' <' + EMAIL_FROM + '>';
      
      Email.send({
        text: text,
        from: emailfrom,
        to: requesteremails,
        subject: subject,
        headers: {
          'in-reply-to': get_requester_message_id(ticket._id)
        }
      });
    }
  }
};

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

