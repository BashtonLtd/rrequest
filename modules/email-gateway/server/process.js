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
fs = Npm.require('fs');

confirm_reply_created = function(ticketId, replyId) {
  var ticket = Tickets.findOne({_id: ticketId})
  var reply_found = false;
  var msgId = null;
  if (ticket !== undefined) {
    // Check if reply exists
    for (var i = 0, l = ticket.replies.length; i < l; i++) {
      if (ticket.replies[i]._id == replyId) {
        reply_found = true;
        msgId = ticket.replies[i].message_id;
      }
    }
  }
  if (reply_found == true) {
    if (msgId !== null) {
      mark_message_seen(msgId);
    } else {
      // Add to the error log
      console.log('Failed to mark message');
    }
  } else {
    // Add to the error log
    console.log('reply not found');
  }
};

mark_message_seen = function(msgId) {
  var settings = EmailGatewaySettings.findOne();
  if (settings !== undefined) {
    if (settings.imap_username && settings.imap_password && settings.imap_host && settings.imap_port){
      var imap = new Imap({
        user: settings.imap_username,
        password: settings.imap_password,
        host: settings.imap_host,
        port: settings.imap_port,
        secure: settings.imap_secure
      });
      imap.connect(function(err) {
        if (!err) {
          try {
            imap.openBox('INBOX', false, function(err, mailbox) {
              imap.search([['HEADER', 'message-id', msgId]], function(err, results) {
                if (!err) {
                  imap.addFlags(results[0], '\\Seen', function(e) {
                    if (e) {
                      console.log('ERROR ADDING FLAG TO EMAIL');
                      // Add to error log
                    }
                  });
                }
              });
            });
          } catch (error) {
            console.log(error);
          }
        }
      })
    }
  }
};

process_mail = function(mail_object) {
  // check from address and try to match to a requester
  var requesters = [];
  if (mail_object.from[0].address.toLowerCase() != EMAIL_FROM.toLowerCase()) {
    var requestfrom = get_or_create_user(mail_object.from[0].address.toLowerCase());
    requesters.push({id:requestfrom._id, email:mail_object.from[0].address.toLowerCase()});
  }
  
  if (mail_object.to[0].address.toLowerCase() != EMAIL_FROM.toLowerCase()) {
    var requestto = get_or_create_user(mail_object.to[0].address.toLowerCase());
    requesters.push({id:requestto._id, email:mail_object.to[0].address.toLowerCase()});
    if (requestfrom === undefined) {
      var requestfrom = requestto;
    }
  }

  if (mail_object.cc !== undefined) {
    for (var i = 0, l = mail_object.cc.length; i < l; i++) {
      if (mail_object.cc[i] !== undefined && mail_object.cc[i].address.toLowerCase() != EMAIL_FROM.toLowerCase()) {
        var requester = get_or_create_user(mail_object.cc[i].address.toLowerCase());
        if (!is_staff(requester)) {
          requesters.push({id:requester._id, email:mail_object.cc[i].address.toLowerCase()});
        }
      }
    }
  }

  if (requestfrom === undefined) {
    var requestfrom = get_or_create_user('unknown@bashton.com');
  }

  var ticket = get_or_create_ticket(requesters, mail_object.subject);

  var ticketBody = mail_object.text;
  if (mail_object.html !== undefined) {
    ticketBody = html2markdown(mail_object.html);
  } else {
    ticketBody = text2markdown(mail_object.text);
  }

  replyId = create_reply({
    user: requestfrom,
    ticketId: ticket._id,
    reply: {
      message_id: mail_object.headers['message-id'],
      body: ticketBody,
      status: 'posted'
    }
  });

  confirm_reply_created(ticket._id, replyId);

  if (mail_object.attachments !== undefined) {
    mail_object.attachments.forEach(function(elem, index){
      Fiber(function() {
        var filelocation = "/mediafiles/" + Random.id();
        fs.writeFile(filelocation, elem.content, function(error) {
          if (error) {
            console.log(error);
          } else {
            
          }
        });

        Attachments.storeBuffer(elem.generatedFileName, elem.content, {
          contentType: elem.contentType,
          encoding: 'utf-8',
          metadata: {
            ticketId:ticket._id,
            replyId:replyId,
            requester:requestfrom._id,
            group:ticket.group,
            ondisk:filelocation
          }
        });
      }).run();
    });
  }
};