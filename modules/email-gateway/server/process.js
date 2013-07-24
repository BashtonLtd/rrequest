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
process_mail = function(mail_object) {
  // check from address and try to match to a requester
  var requesters = [];
  var requestfrom = get_or_create_user(mail_object.from[0].address);
  requesters.push({id:requestfrom._id, email:mail_object.from[0].address});

  if (mail_object.cc !== undefined) {
    for (var i = 0, l = mail_object.cc.length; i < l; i++) {
      if (mail_object.cc[i] !== undefined) {
        var requester = get_or_create_user(mail_object.cc[i].address);
        requesters.push({id:requester._id, email:mail_object.cc[i].address});
      }
    }
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

  if (mail_object.attachments !== undefined) {
    mail_object.attachments.forEach(function(elem, index){
      Fiber(function() {
        Attachments.storeBuffer(elem.generatedFileName, elem.content, {
          contentType: elem.contentType,
          encoding: 'utf-8',
          metadata: {
            ticketId:ticket._id,
            replyId:replyId,
            requester:requestfrom._id,
            group:ticket.group
          }
        });
      }).run();
    });
  }
};
