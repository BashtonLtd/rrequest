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