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
    } else if (ticket.group.length == 1) {
      if (ticket.group[0] == null) {
        return true;
      }
      return false
    }
    return false;
  }
  return false;

});