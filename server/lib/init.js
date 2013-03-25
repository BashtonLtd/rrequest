var URLROOT = 'http://127.0.0.1:3000/';

var EMAIL_FROM = 'rrequest@rrequest.com';
//process.env.MAIL_URL = 'smtp://USERNAME:PASSWORD@HOST:PORT/';
process.env.MAIL_URL = 'smtp://127.0.0.1/';

Meteor.startup(function (){
  // Initialise status collection
  var status_new = TicketStatus.findOne({name: 'new'});
  if (status_new === undefined) {
    TicketStatus.insert({
      name: 'new'
    });
  }

  var status_closed = TicketStatus.findOne({name: 'closed'});
  if (status_closed === undefined) {
    TicketStatus.insert({
      name: 'closed'
    });
  }
});