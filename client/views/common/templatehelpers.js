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

Handlebars.registerHelper('ticketstatus', function() {
  var ticket = Tickets.findOne({_id:this._id});
  if (ticket !== undefined) {
    return TicketStatus.findOne({name: ticket.status});
  }
});

Handlebars.registerHelper('lastModifiedBy', function() {
  var ticket = Tickets.findOne({_id:this._id});
  var latest = undefined;
  if (ticket !== undefined) {
    latest = ticket.replies[0];
    ticket.replies.forEach(function(reply){
      if (moment(reply.created).unix() > moment(latest.created).unix() && reply.status == 'posted') {
        latest = reply;
      }
    });
  }
  if (latest !== undefined && latest.posted_by !== undefined) {
    return useremail(latest.posted_by);
  } else {
    return null;
  }
});
Handlebars.registerHelper('getGroupOrRequester', function() {
  var ticket = Tickets.findOne({_id:this._id});
  if (ticket !== undefined) {
    if (ticket.group == null || ticket.group == undefined || ticket.group.length == 0) {
      // return first requester
      return useremail(ticket.requesters[0]);
    } else if (ticket.group[0] == null) {
      return useremail(ticket.requesters[0]);
    } else {
      // return group
      var groups = []
      ticket.group.forEach(function (group) {
        groups.push(groupname(group));
      });
      return groups.join(', ');
    }
  }
});

Handlebars.registerHelper('getUserEmail', function(userId) {
  var email = useremail(userId);
  return email;
});

Handlebars.registerHelper('getRequesters', function(ticketId) {
  var ticket = Tickets.findOne(ticketId);
  var requesters = [];
  ticket.requesters.forEach(function (requester) {
    requesters.push(useremail(requester));
  });
  return requesters.join(', ');
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