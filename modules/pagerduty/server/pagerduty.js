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
Fiber = Npm.require('fibers');

var https = Npm.require('https');

var handle;
var timers = [];

Meteor.startup(function (){
  // register the api module
  Meteor.call('registerModule', {
    name: 'pagerduty',
    callback_enable: 'enable_pagerduty_module',
    callback_disable: 'disable_pagerduty_module',
    description: 'Pagerduty module plugin for incident module.',
    depends: ['incident']
  }, function(error, module_id) {
    if(!error) {

    }
  });

  var settings = PagerdutySettings.findOne();
  if (settings === undefined) {
    PagerdutySettings.insert({authtoken: ''});
  }

  module = Modules.findOne({name: 'pagerduty'});

  if (module.enabled) {
    start_monitoring();
  }
});

Meteor.methods({
  enable_pagerduty_module: function(args) {
    args = args || {};

    Hooks.insert({
      hook: 'settings_page',
      module_id: args.module_id,
      data: 'pagerduty_settings_page'
    });

    Hooks.insert({
      hook: 'group_edit_form_field',
      module_id: args.module_id,
      template: 'pagerduty_group_edit_form_field'
    });

    Hooks.insert({
      hook: 'user_edit_form_field',
      module_id: args.module_id,
      template: 'pagerduty_user_edit_form_field'
    });

    Hooks.insert({
      hook: 'ticketlistitemfooter_items',
      module_id: args.module_id,
      template: 'pagerduty_ticketlistitemfooter'
    });

    Hooks.insert({
      hook: 'tickettopright',
      module_id: args.module_id,
      template: 'pagerduty_tickettopright'
    });

    start_monitoring();
  },

  disable_pagerduty_module: function(args) {
    args = args || {};

    Hooks.remove({
      module_id: args.module_id
    });

    try {
        handle.handle.stop();
    } catch(error) {

    }
  },

  pagerduty_settings_save: function(args) {
    args = args || {};

    PagerdutySettings.update({},
        {$set: {
            authtoken: args.authtoken,
            apikey: args.apikey,
            subdomain: args.subdomain,
            servicekey: args.servicekey
        }},
        {multi: true}
    );
  }
});

var start_monitoring = function() {
    var initializing = true;
    handle = Incidents.find({}).observeChanges({
        added: function (id) {
            if (!initializing) {
                pagerduty_check_notes(id);
            }
        },
        changed: function (id, fields) {
            var incident = Incidents.findOne({_id: id});
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
            } else {
                pagerduty_check_notes(incident._id);
            }
        }
    });
    initializing = false;

    // check for existing incidents that should be monitored
    var incidents = Incidents.find({status: 'open'});
    incidents.forEach(function(incident) {
        pagerduty_check_notes(incident._id);
    });
};

pagerduty_create_alert = function(ticket) {
    var settings = PagerdutySettings.findOne({});
    if (settings !== undefined) {
        var token = settings.apikey;
        var servicekey = settings.servicekey;
    }
    if (token !== undefined && servicekey) {

        var options = {
            host: 'events.pagerduty.com',
            port: 443,
            path: '/generic/2010-04-15/create_event.json',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token token=' + token
            }
        };

        var ticket_url = Meteor.absoluteUrl('ticket/' + ticket._id, {secure:true});

        var post_data = JSON.stringify({
            'service_key': servicekey,
            'event_type': 'trigger',
            'description': ticket.subject,
            'incident_key': ticket._id,
            'client': 'rrequest',
            'client_url': ticket_url,
            'details': ticket.replies[0].body
        });

        var req = https.request(options, function(res) {
            res.setEncoding('utf8');
            var data = '';
            res.on('data', function(chunk) {
                data += chunk;
            });
            res.on('end', function() {
                console.log(res.statusCode);
                console.log(data);
                //var parseddata = JSON.parse(data);
                // pagerduty_add_notes(parseddata, incident_id);
                // console.log(res);
            });
        });
        req.on('error', function(e) {
            console.log('Problem: ' + e.message);
        });
        req.write(post_data);
        req.end();
    }
};

pagerduty_check_notes = function(incident_id) {
    bound_create_event_log({level:'INFO', tags:['pagerduty'], message:'Checking pagerduty notes for incident: ' + incident_id});
    Fiber(function() {
        var incident = Incidents.findOne({_id: incident_id});
        var settings = PagerdutySettings.findOne({});
        if (settings !== undefined) {
            var token = settings.apikey;
            var subdomain = settings.subdomain;
        }
        if (token !== undefined && subdomain !== undefined) {
            if (incident !== undefined) {
                var tickets = Tickets.find({_id: {$in: incident.tickets}}, {sort: {'created': 1}});
                if (tickets !== undefined && tickets.count() != 0) {
                    var incidentdata = incidentresolved(tickets);

                    if (incidentdata.resolved == false) {

                        tickets.forEach(function(ticket) {
                            var pagerduty_id = ticket.pagerduty_id;
                            if (pagerduty_id !== undefined) {
                                if (!_.find(_.pluck(timers, 'id'),function(id){ return id == pagerduty_id; })) {
                                    var options = {
                                        host: subdomain + '.pagerduty.com',
                                        port: 443,
                                        path: '/api/v1/incidents/' + pagerduty_id + '/notes',
                                        method: 'GET',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': 'Token token=' + token
                                        }
                                    };

                                    var req = https.request(options, function(res) {
                                        res.setEncoding('utf8');
                                        var data = '';
                                        res.on('data', function(chunk) {
                                            data += chunk;
                                        });
                                        res.on('end', function() {
                                            var parseddata = JSON.parse(data);
                                            pagerduty_add_notes(parseddata, incident_id);
                                        });
                                    });
                                    req.on('error', function(e) {
                                        console.log('Problem: ' + e.message);
                                    });
                                    req.end();

                                    // start timer for next run
                                    var timer = Meteor.setTimeout(function() {
                                        timers = _.reject(timers, function(id){ return id != pagerduty_id; });
                                        pagerduty_check_notes(incident_id);
                                    }, 60000);
                                    timers.push({id: pagerduty_id, timer: timer})
                                }
                            }
                        });


                        if (incident.pending_notes !== undefined && incident.pending_notes.length > 0) {
                            var response_needed = 30;                    // this should be a setting
                            var notify_after = response_needed - 2;      // this should be a setting

                            tickets.forEach(function(ticket) {
                                if (ticket.pagerduty_id !== undefined) {
                                    data = findLastResponse([ticket]);
                                    var now = new Date().getTime();
                                    var timedifference = now - data.event.eventRawDate * 1000;

                                    if (timedifference >= notify_after * 60000) {
                                        pagerduty_post_notes(incident_id, ticket._id);
                                    }

                                }
                            });
                        }
                    }
                }
            }
        }
    }).run();
};

var pagerduty_add_notes = function(data, incident_id) {
    Fiber(function() {
        data.notes.forEach(function(fetchednote) {
            incident = Incidents.findOne({_id: incident_id});
            if (incident.pending_notes === undefined || _.find(_.pluck(incident.pending_notes, 'id'),function(id){ return id == fetchednote.id; }) != fetchednote.id) {
                if (incident.sent_notes === undefined || _.find(_.pluck(incident.sent_notes, 'id'),function(id){ return id == fetchednote.id; }) != fetchednote.id) {
                    var current_incident = incident;
                    var current_note = fetchednote;
                    var pending_notes = current_incident.pending_notes;

                    if (pending_notes !== undefined && pending_notes.length != 0) {
                        bound_create_event_log({level:'INFO', tags:['pagerduty'], message:'Adding pagerduty notes to incident: ' + incident._id});
                        pending_notes.push(current_note);
                        Incidents.update({_id: current_incident._id},{
                            $set: {pending_notes: pending_notes}
                        });
                    } else {
                        bound_create_event_log({level:'INFO', tags:['pagerduty'], message:'Adding pagerduty notes to incident: ' + incident._id});
                        Incidents.update({_id: current_incident._id},{
                            $set: {pending_notes: [current_note]}
                        });
                    }
                }
            }
        });
    }).run();
};

var pagerduty_post_notes = function(incident_id, ticket_id) {
    Fiber(function() {
        var incident = Incidents.findOne({_id: incident_id});
        var now = new Date();

        var ticket = Tickets.findOne({_id: ticket_id});

        if (ticket !== undefined) {
            var body = '';
            var notes = incident.pending_notes;
            notes.sort(sortByDateString);

            notes.forEach(function(note) {
                body = body + '**' + note.created_at + ':** ' + note.content + '\n\n';
            });

            replyId = ticket.create_reply({
                user: user,
                created: now,
                reply: {
                    body: "This is the reply body.",
                    posted_by: {email: 'Pagerduty'},
                    status: 'posted',
                    notified: false,
                    level: 'staff'
                }
            });
        }

        bound_create_event_log({level:'INFO', tags:['pagerduty'], message:'Adding pagerduty notes as reply to ticket: ' + ticket_id});

        if (incident.sent_notes !== undefined) {
            var sent_notes = incident.sent_notes.concat(incident.pending_notes);
        } else {
            var sent_notes = incident.pending_notes;
        }

        Incidents.update({_id: incident._id},{
            $set: {sent_notes: sent_notes},
            $unset: {pending_notes: false}
        })
    }).run();
}
