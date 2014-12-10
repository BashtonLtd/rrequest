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
var watch_tickets_handle;

Meteor.methods({
    enable_incident_module: function(args) {
        args = args || {};

        if (this.isSimulation) {
            var exists = _.find(nav, function(item) {
                return item.name == 'incidents';
            });
            if (exists === undefined) {
                var nav = Session.get('navbar');
                nav = _.extend([], nav);
                nav.push({
                    name: 'incidents',
                    pageurl: '/incidents',
                    display_name: 'Incidents',
                    user_level: 'loggedin'
                });
                Session.set('navbar', nav);
            }
        } else {
            var hook = Hooks.findOne({module_id: args.module_id});
            if (hook === undefined) {
                Hooks.insert({
                    hook: 'settings_page',
                    module_id: args.module_id,
                    data: 'incident_settings_page'
                });
            }
            watch_tickets();
        }
    },

  disable_incident_module: function(args) {
    args = args || {};

    if (this.isSimulation) {
      var nav = Session.get('navbar');
      nav = _.extend([], nav);
      nav = _(nav).reject(function(el) { return el.name === "incidents"; });
      Session.set('navbar', nav);
    } else {
      Hooks.remove({
        module_id: args.module_id
      });

      try {
          watch_tickets_handle.handle.stop();
      } catch(error) {

      }
    }

  }
});

incidentresolved = function (tickets) {
    var incident_resolved = true;
    var incident_resolved_date = 0;
    tickets.forEach(function (ticket) {
        if (ticket !== undefined) {
            if (ticket.status == 'closed') {
                if (ticket.resolved === undefined) {
                    if (moment(incident_resolved_date).unix() < moment(findLastReply([ticket]).created).unix()) {
                        incident_resolved_date = ticket.resolved;
                    }
                } else {
                    if (moment(incident_resolved_date).unix() < moment(ticket.resolved).unix()) {
                        incident_resolved_date = ticket.resolved;
                    }
                }
            } else {
                incident_resolved = false;
            }
        } else {
            incident_resolved = false;
        }
    });
    if (tickets.count() == 0) {
        incident_resolved = false;
    }

    return {
        resolved: incident_resolved,
        date: incident_resolved_date
    };
};

findFirstResponse = function (tickets) {
    var first_response = {};
    var responded = false;
    // find first staff response
    tickets.forEach(function (ticket) {
        for (var i = 0, l = _.size(ticket.replies); i < l; i++) {
            if (ticket.replies[i].level == 'staff' && ticket.replies[i].status == 'posted') {
                // compare with stored first response
                if (first_response.eventRawDate === undefined || (moment(ticket.replies[i].created).unix() < first_response.eventRawDate)) {
                    first_response = {
                        eventRawDate: moment(ticket.replies[i].created).unix(),
                        eventFullDate: ticket.replies[i].created,
                        eventTypeClass: "open",
                        eventIconClass: "open",
                        eventType: "event",
                        eventDate: moment(ticket.replies[i].created).format('D/MM/YYYY'),
                        eventTime: moment(ticket.replies[i].created).format('HH:mm:ss'),
                        eventIcon: "icon-asterisk",
                        eventHeaderText: "First response to ticket " + ticket.subject + " ( " + ticket._id + " )."
                    };
                    responded = true;
                    break;
                }
            }
        }
    });
    return {responded: responded, event: first_response};
};

findLastResponse = function (tickets) {
    var last_response = {};
    var responded = false;
    // find first staff response
    tickets.forEach(function (ticket) {
        for (var i = 0, l = _.size(ticket.replies); i < l; i++) {
            if (ticket.replies[i].level == 'staff') {
                // compare with stored last response
                if (last_response.eventRawDate === undefined || (moment(ticket.replies[i].created).unix() > last_response.eventRawDate)) {
                    last_response = {
                        eventRawDate: moment(ticket.replies[i].created).unix(),
                        eventFullDate: ticket.replies[i].created,
                        eventTypeClass: "open",
                        eventIconClass: "open",
                        eventType: "event",
                        eventDate: moment(ticket.replies[i].created).format('D/MM/YYYY'),
                        eventTime: moment(ticket.replies[i].created).format('HH:mm:ss'),
                        eventIcon: "icon-asterisk",
                        eventHeaderText: "Last response to ticket " + ticket.subject + " ( " + ticket._id + " )."
                    };
                    responded = true;
                }
            }
        }
    });
    return {responded: responded, event: last_response};
};

findLastReply = function (tickets) {
    var last_reply = {};
    tickets.forEach(function (ticket) {
        for (var i = 0, l = _.size(ticket.replies); i < l; i++) {
            if (ticket.replies[i].level == 'staff' || ticket.replies[i].level == 'system') {
                if (last_reply.created === undefined || (moment(ticket.replies[i].created).unix() > moment(last_reply.created).unix())) {
                    last_reply = ticket.replies[i];
                }
            }
        }
    });
    return last_reply;
};

watch_tickets = function() {
    var initializing = true;
    ticketshandle = Tickets.find({}).observeChanges({
        changed: function (id, fields) {
            incident_ticket_changed(id, fields);
        }
    });
    initializing = false;
};
