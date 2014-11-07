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
  // register the eventlog module
  Meteor.call('registerModule', {
    name: 'incident',
    callback_enable: 'enable_incident_module',
    callback_disable: 'disable_incident_module',
    description: 'Incident management module.',
    depends: ['ticketpriority']
  }, function(error, module_id) {
    if (!error) {}
  });

  var module = Modules.findOne({name: 'incident'});
  if (module !== undefined && module.enabled) {
    Meteor.call('add_navbar_item', {
      name: 'incidents',
      title: 'Incidents',
      url: 'incidents',
      user_level: 'loggedin'
    }, function(error, module_id) {
      if (!error) {}
    });

    watch_tickets();
  }
});

Meteor.methods({
    createIncident: function (options) {
        return create_incident(options);
    },

    addIncidentComment: function (options) {
        return add_incident_comment(options);
    },

    removeIncidentComment: function (options) {
        return remove_incident_comment(options);
    },

    removeIncidentTicket: function (options) {
        return remove_incident_ticket(options);
    }
});

create_incident = function (options) {
  options = options || {};
  var args = {};
  if (options._id !== undefined) {
    args._id = options._id;
  }
  var now = new Date();
  args.subject = options.subject;
  args.created = now;
  args.modified = now;
  args.status = options.status;
  args.groups = options.groups;
  args.comments = [];
  if (options.tickets !== undefined) {
      args.tickets = options.tickets;
  } else {
      args.tickets = [];
  }

  return Incidents.insert(args);
};

add_incident_comment = function (options) {
    options = options || {};

    return Incidents.update(
        {_id: options.incidentId},
        {
            $push: {comments: options.args}
        }
    );
};

remove_incident_comment = function (options) {
    options = options || {};

    var incident = Incidents.findOne({_id: options.incidentId});
    if (incident !== undefined) {
        var comments = incident.comments;

        comments = _.without(comments, _.findWhere(comments, {_id: options.commentId}));

        Incidents.update(
            {_id: options.incidentId},
            {
                $set: {comments: comments}
            }
        );
    }
};

remove_incident_ticket = function (options) {
    options = options || {};

    var incident = Incidents.findOne({_id: options.incidentId});
    if (incident !== undefined) {
        var tickets = incident.tickets;

        tickets = _.without(tickets, options.ticketId);

        Incidents.update(
            {_id: options.incidentId},
            {
                $set: {tickets: tickets}
            }
        );
    }
};

incident_ticket_changed = function(id, fields) {
    var ticket = Tickets.findOne({_id: id});
    var incidents = Incidents.find({tickets: {$in: [id]}});
    incidents.forEach(function(incident) {
        var tickets = Tickets.find({_id: {$in: incident.tickets}}, {sort: {'created': 1}});
        var incidentdata = incidentresolved(tickets);
        if (incidentdata.resolved == false && incident.status == 'resolved') {
            // update incident
            bound_create_event_log({level:'INFO', tags:['incident'], message:'Incident tickets updated marking incident: ' + id + ' as open.'});
            Incidents.update({_id: incident._id}, {$set: {status: 'open'}});
            // also start monitoring for notes
            pagerduty_check_notes(incident._id);
        } else if (incidentdata.resolved == true && incident.status == 'open') {
            // update incident
            bound_create_event_log({level:'INFO', tags:['incident'], message:'Incident tickets updated marking incident: ' + id + ' as resolved.'});
            Incidents.update({_id: incident._id}, {$set: {status: 'resolved'}});
        }
    });

    // Raise alert if change is the first reply added to a requester created P1 ticket
    if (ticket.requesters.length > 0 && !is_staff_by_id(ticket.requesters[0]) && ticket.priority == "1") {
        if (fields.replies !== undefined) {
            if (ticket.replies.length == 1 && !is_staff_by_id(fields.replies[0].posted_by)) {
                if (fields.replies[0].notified === false) {
                    pagerduty_create_alert(ticket);
                }
            }
        }
    }
};
