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
  // register the comment module
  Meteor.call('registerModule', {
    name: 'email-notifier',
    callback_enable: 'enable_notifier_module',
    callback_disable: 'disable_notifier_module',
    description: 'Sends an email to the ticket requester containing a link to the updated ticket.',
    depends: [],
    conflicts: ['email-gateway']
  }, function(error, module_id) {
    if(!error) {

    }
  });
});

Meteor.methods({
  enable_notifier_module: function(args) {
    args = args || {};

  },

  disable_notifier_module: function(args) {
    args = args || {};

  },

  notifier_send_ticket_updated_email: function(args) {
    args = args || {};
    this.unblock();

    var ticket = Tickets.findOne({_id: args.ticketId});
    if (ticket !== undefined) {
      var subject = '[' + ticket._id + '] ' + ticket.subject;
      var ticketurl = URLROOT + 'ticket/' + ticket._id;
      var text = 'To view your updated ticket please visit ' + ticketurl;
      var html = '<p>To view your updated ticket please visit <a href="' + ticketurl + '">' + ticketurl + '</a>.</p>';

      Email.send({
        to: useremail(ticket.requester),
        from: EMAIL_FROM,
        subject: subject,
        text: text,
        html: html
      });
    }
  }
});