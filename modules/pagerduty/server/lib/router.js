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
var https = Npm.require('https');
var Fiber = Npm.require('fibers');

Router.map(function() {
	this.route('pagerdutyendpoint', {
		path: '/api/pagerduty/:_id',
		where: 'server',
		action: function() {
			var request = this.request;
			var response = this.response;
			var settings = PagerdutySettings.findOne({});
			if (settings === undefined) {
				var headers = {
					'Content-type': 'text/html'
				};
				this.response.writeHead(500, headers);
				response.end();
				return;
			}
			// check that _id matches
			if (settings.authtoken != this.params._id) {
				var headers = {
					'Content-type': 'text/html'
				};
				this.response.writeHead(401, headers);
				response.end();
				return;
			}

			var requestMethod = this.request.method;
			var requestData = this.request.body;

			var headers = {
				'Content-type': 'text/html'
			};
			this.response.writeHead(200, headers);
			response.end();

			requestData.messages.forEach(function(msg) {
				if (msg.data.incident.trigger_summary_data.client == 'rrequest') {
					// This is an alert that we created, no need to do anything
					return;
				}
				var incident_id = msg.data.incident.id;
				var alert_type = msg.data.incident.status;

				var useremail = '';
				if (msg.data.incident.last_status_change_by !== null) {
					useremail = msg.data.incident.last_status_change_by.email;
				}

				var details_id = msg.data.incident.trigger_details_html_url.split('/')[6];
				var settings = PagerdutySettings.findOne({});
				if (settings !== undefined) {
					var token = settings.apikey;
					var subdomain = settings.subdomain;
				}
				if (token !== undefined && subdomain !== undefined) {
					if (details_id !== undefined) {
						var options = {
							host: subdomain + '.pagerduty.com',
							port: 443,
							path: '/api/v1/log_entries/' + details_id + '?include[]=channel',
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
								var alert_data = parseddata.log_entry;
								var custref = '';
								if (parseddata.log_entry.channel.details.check !== undefined) {
									if (parseddata.log_entry.channel.details.check.customer !== undefined) {
										custref = parseddata.log_entry.channel.details.check.customer;
									}
								}

								// check type
								if (alert_type == 'triggered') {
									pagerduty_create(incident_id, alert_data, custref);
								} else if(alert_type == 'resolved') {
									pagerduty_close(incident_id);
								} else if(alert_type == 'acknowledged') {
									pagerduty_ack(incident_id, alert_data, useremail);
								}
							});
						});
						req.on('error', function(e) {
							console.log('Problem: ' + e.message);
						});
						req.end();
					}
				}
			});
		}
	});
});

var pagerduty_create = function(incident_id, alert_data, custref) {
	Fiber(function() {
		var ticket = Tickets.findOne({pagerduty_id: incident_id});
		if (ticket !== undefined) {
			return;
		}

		var now = new Date();

		// lookup group from custref
		var groups = [];
		if (custref !== '' && custref !== undefined) {
			var group = Groups.findOne({pagerduty_custref: custref});
			if (group !== undefined) {
				groups.push(group._id);
			}
		}


		// create ticket with initial reply
		var ticket_args = {};
		ticket_args._id = Random.id();
		ticket_args.requesters = [{id:'', email:'Pagerduty'}];
		ticket_args.status = 'new';
		ticket_args.subject = alert_data.channel.summary;
		ticket_args.groups = groups;
		ticket_args.replies = [{
			_id: Random.id(),
			type: 'reply',
			level: 'system',
			posted_by: {id:'', email:'Pagerduty'},
			created: now,
			status: 'posted',
			body: JSON.stringify(alert_data.channel.details)
		}];
		ticket_args.extrafields = [
			{name: 'priority', value: '1'},
			{name: 'pagerduty_id', value: incident_id}
		];

		var incident_args = {};
		incident_args.subject = ticket_args.subject;
		incident_args.status = 'open';
		incident_args.groups = ticket_args.groups;
		incident_args.tickets = [ticket_args._id];

		create_ticket(ticket_args);
		create_incident(incident_args);
	}).run();

};

var pagerduty_close = function(incident_id) {
	Fiber(function() {
		var ticket = Tickets.findOne({pagerduty_id: incident_id});
		if (ticket !== undefined) {
			ticket.status = 'closed';
			ticket.save();
		}
	}).run();
};

var pagerduty_ack = function(incident_id, alert_data, useremail) {
	Fiber(function() {
		var ticket = Tickets.findOne({pagerduty_id: incident_id});
		var user = Meteor.users.findOne({'profile.email':useremail.toLowerCase()});
		var userdata = {id: '', email: 'System'};
		if (user !== undefined) {
			userdata = {id: user._id, email:user.profile.email};
		}
		var args = {};
		args.body = 'Pagerduty alert acknowledged by ' + userdata.email + '.';
		args.level = 'staff';
		args.user = userdata;
		ticket.insert_event(args);
	}).run();
};
