Handlebars.registerHelper('refreshEvery', function(seconds) {
  if (!Deps.active)
    return
    
  var computation = Deps.currentComputation
  Meteor.setTimeout(function() { 
    computation.invalidate();
  }, parseInt(seconds) * 1000);
});

Handlebars.registerHelper('age', function(time) {
  return moment(time).fromNow();
});

Handlebars.registerHelper('getUserEmail', function(userId) {
  var email = useremail(userId);
  return email;
});

Handlebars.registerHelper('isNotGrouped', function(ticketId) {
  var ticket = Tickets.findOne({_id: ticketId});
  if (ticket !== undefined) {
    if (ticket.group == null || ticket.group == undefined || ticket.group.length == 0) {
        return true;
    } else {
        return false;
    }
  } else {
    return true;
  }

});