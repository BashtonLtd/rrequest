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
UI.registerHelper('refreshEvery', function(seconds) {
  Meteor.setInterval(function() {
    Session.set('synctime', TimeSync.serverTime());
  }, parseInt(seconds, 10) * 1000);
});

UI.registerHelper('age', function(time) {
  return moment(time).from(Session.get('synctime'));
});

UI.registerHelper('duration', function(start, end) {
    if (end == null) {
        end == moment();
    }
    var difference = moment(end).diff(moment(start));
    return moment.duration(difference).humanize();
});

UI.registerHelper('ticketstatus', function() {
  var ticket = Tickets.findOne({_id:this._id});
  if (ticket !== undefined) {
    return TicketStatus.findOne({name: ticket.status});
  }
});

UI.registerHelper('lastModifiedBy', function() {
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

UI.registerHelper('getGroupOrRequester', function() {
  var ticket = Tickets.findOne({_id:this._id});
  var output = '';
  if (ticket !== undefined) {
    if (ticket.group === null || ticket.group === undefined || ticket.group.length === 0) {
      // return first requester
      output = useremail(ticket.requesters[0]);
    } else if (ticket.group[0] === null) {
      output = useremail(ticket.requesters[0]);
    } else {
      // return group
      var groups = [];
      ticket.group.forEach(function (group) {
        if (group !== null && group !== '') {
          groups.push('<a href="/group/' + group + '">' + groupname(group) + '</a>');
        }
      });
      output = groups.join(', ');
    }
  }
  return output;
});

UI.registerHelper('getUserEmail', function(userId) {
  var email = useremail(userId);
  return email;
});

UI.registerHelper('getRequesters', function(ticketId, verbose) {
  var ticket = Tickets.findOne(ticketId);
  if (ticket !== undefined) {
    var requesters = [];
    ticket.requesters.forEach(function (requester) {
      if (requester !== null || requester !== undefined) {
        requesters.push(useremail(requester));
      }
    });
    if (verbose === false) {
      if (requesters.length > 1) {
        var extras = requesters.length -1;
        return requesters[0] + ' and ' + extras + ' more';
      } else {
        return requesters.join(', ');
      }
    } else {
      return requesters.join(', ');
    }
  }
});

UI.registerHelper('isRequesterInMultipleGroups', function() {
  return in_multiple_groups(Meteor.user());
});

UI.registerHelper('isNotGrouped', function(ticketId) {
  var ticket = Tickets.findOne({_id: ticketId});
  if (ticket !== undefined) {
    if (ticket.group === null || ticket.group === undefined || ticket.group.length === 0) {
        return true;
    } else if (ticket.group.length == 1) {
      if (ticket.group[0] === null) {
        return true;
      }
      return false;
    }
    return false;
  }
  return false;

});