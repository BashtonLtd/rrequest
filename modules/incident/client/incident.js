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
Template.incident.connectedtickets = function () {
	var incident = Incidents.findOne({_id: Session.get('incidentId')});
	if (incident !== undefined) {
		// get tickets from tickets field
		Meteor.subscribe(
			'sortedTickets',
			{sort: {'created': 1}},
			{_id: {$in: incident.tickets}}
		)
		return Tickets.find({_id: {$in: incident.tickets}}, {sort: {'created': 1}});
	}
};

Template.incident.subject = function () {
	var incident = Incidents.findOne({_id: Session.get('incidentId')});
	if (incident !== undefined) {
		return incident.subject;
	}
};

Template.incidentsummary.incidentsummary = function () {
	var summary = {};
	var incident = Incidents.findOne({_id: Session.get('incidentId')});
	if (incident !== undefined) {
		var attached_tickets = Tickets.find({_id: {$in: incident.tickets}}, {sort: {'created': 1}});
		var incident_start_data = incidentstart(incident, attached_tickets);
		summary.opendate = moment(incident_start_data.date).format('D/MM/YYYY');
		summary.opentime = moment(incident_start_data.date).format('HH:mm:ss');

		var first_response = findFirstResponse(attached_tickets);
		summary.responded = first_response.responded;
		if (summary.responded) {
			summary.firstresponsetime = getTimeSpan(incident_start_data.date, first_response.event.eventFullDate);
		}
		summary.responsedate = first_response.event.eventDate;
		summary.responsetime = first_response.event.eventTime;

		var resolved_data = incidentresolved(attached_tickets);
		summary.resolved = resolved_data.resolved;
		if (resolved_data.date == 0) {
			summary.resolveddate = '';
			summary.resolvedtime = '';
		} else {
			summary.resolveddate = moment(resolved_data.date).format('D/MM/YYYY');
			summary.resolvedtime = moment(resolved_data.date).format('HH:mm:ss');
		}

		var incident_end_date = resolved_data.date
		if (!resolved_data.resolved) {
			incident_end_date = new Date();
		}

		summary.totaltime = getTimeSpan(incident_start_data.date, incident_end_date);

	}
	return summary;
};

UI.registerHelper('incidentopenfor', function() {
	var incident = Incidents.findOne({_id: Session.get('incidentId')});
	if (incident !== undefined) {
		var attached_tickets = Tickets.find({_id: {$in: incident.tickets}}, {sort: {'created': 1}});
		var incident_start_data = incidentstart(incident, attached_tickets);
		var resolved_data = incidentresolved(attached_tickets);
		var incident_end_date = resolved_data.date
		if (!resolved_data.resolved) {
			incident_end_date = Session.get('synctime');
		}

		return getTimeSpan(incident_start_data.date, incident_end_date);
	}
});

Template.incident.rendered = function () {
	Session.set('editIncident', false);
};

Template.addTicket.created = function () {
	Session.set('ticketsSearchfilter', '');
	incidentAddTicketListSub = Meteor.subscribeWithPagination(
		'sortedTickets',
		{'created': -1},
		getFilter,
		10);
};

var getFilter = function() {
	var incident = Incidents.findOne({_id: Session.get('incidentId')});
	var searchfilter = Session.get('ticketsSearchfilter');

	var groups = '';
	if (incident !== undefined) {
		if (incident.groups !== undefined) {
			groups = incident.groups;
		}
	}

	var filter = {};
	if (searchfilter === '' || searchfilter === undefined || searchfilter.length < 3) {
		if (groups !== '') {
			filter = {group: {$in: [groups]}}
		} else {
			filter = {};
		}
	} else {
		if (groups !== '') {
			filter = {
			group: {$in: [groups]},
			$or:
			[
				{_id: {$regex: ".*"+ searchfilter +".*", $options: 'i'}},
				{subject: {$regex: ".*"+ searchfilter +".*", $options: 'i'}},
				{'requesters.email': {$regex: ".*"+ searchfilter +".*", $options: 'i'}}
			]
			};
		} else {
			filter = {
			$or:
			[
				{_id: {$regex: ".*"+ searchfilter +".*", $options: 'i'}},
				{subject: {$regex: ".*"+ searchfilter +".*", $options: 'i'}},
				{'requesters.email': {$regex: ".*"+ searchfilter +".*", $options: 'i'}}
			]
			};
		}
	}
	return filter;
};

Template.incident.showCreateIncidentComment = function () {
	return Session.get('showCreateIncidentComment');
};

Template.incident.showAddTicket = function () {
	return Session.get('showAddTicket');
};

Template.incident.timelineEvents = function () {
	var incident = Incidents.findOne({_id: Session.get('incidentId')});
	var events = [];
	var hidden_events = [];

	if (incident !== undefined) {
		var attached_tickets = Tickets.find({_id: {$in: incident.tickets}}, {sort: {'created': 1}});
		var incident_start_data = incidentstart(incident, attached_tickets);
		hidden_events.push(incident_start_data.id);
		events.push({
			eventRawDate: moment(incident_start_data.date).unix(),
			eventTypeClass: "new",
			eventIconClass: "new",
			eventType: "event",
			eventDate: moment(incident_start_data.date).format('D/MM/YYYY'),
			eventTime: moment(incident_start_data.date).format('HH:mm:ss'),
			eventIcon: "icon-arrow-down",
			eventHeaderText: incident_start_data.text
		});

		attached_tickets.forEach(function (ticket) {
			if (ticket !== undefined) {
				if (_.contains(hidden_events, ticket._id)) {
					// don't add
				} else {
					events.push({
						eventRawDate: moment(ticket.created).unix(),
						eventTypeClass: "open",
						eventIconClass: "open",
						eventType: "event",
						eventDate: moment(ticket.created).format('D/MM/YYYY'),
						eventTime: moment(ticket.created).format('HH:mm:ss'),
						eventIcon: "icon-asterisk",
						eventHeaderText: "Ticket " + ticket.subject + " ( " + ticket._id + " ) opened."
					});
				}

				// add resolved event if available
				if (ticket.status == 'closed') {
					var resolved_date = ticket.resolved;
					if (ticket.resolved === undefined) {
						resolved_date = findLastReply([ticket]).created;
					}
					events.push({
						eventRawDate: moment(resolved_date).unix(),
						eventTypeClass: "open",
						eventIconClass: "open",
						eventType: "event",
						eventDate: moment(resolved_date).format('D/MM/YYYY'),
						eventTime: moment(resolved_date).format('HH:mm:ss'),
						eventIcon: "icon-asterisk",
						eventHeaderText: "Ticket " + ticket.subject + " ( " + ticket._id + " ) closed."
					});
				}
			}
		});

		// Add first reponse event
		var first_response = findFirstResponse(attached_tickets);
		if (first_response.responded) {
			events.push(first_response.event);
		}

		incident.comments.forEach(function (comment) {
			events.push({
				_id: comment._id,
				eventRawDate: moment(comment.timeline_date).unix(),
				eventTypeClass: "open",
				eventIconClass: "open",
				eventType: "comment",
				eventDate: moment(comment.timeline_date).format('D/MM/YYYY'),
				eventTime: moment(comment.timeline_date).format('HH:mm:ss'),
				eventIcon: "icon-comment",
				eventHeaderText: "",
				eventText: marked(comment.body),
				eventRawText: comment.body,
				eventHasButtons: true,
				eventHasBody: true
			});
		});

		var resolved_data = incidentresolved(attached_tickets);

		if (resolved_data.resolved) {
			events.push({
				eventRawDate: moment(resolved_data.date).unix()+1,
				eventTypeClass: "resolved",
				eventIconClass: "resolved",
				eventType: "event",
				eventDate: moment(resolved_data.date).format('D/MM/YYYY'),
				eventTime: moment(resolved_data.date).format('HH:mm:ss'),
				eventIcon: "icon-ok",
				eventHeaderText: "All related tickets closed."
			});
		}

	}

	events.sort(sortIncidentComments);
	return events;
};

var incidentstart = function (incident, tickets) {
	var incident_start_id = 0;
	var incident_start = incident.created;
	var incident_start_text = "Incident opened."
	tickets.forEach(function (ticket) {
		if (ticket !== undefined) {
			// if ticket created is before incident created use it
			if (moment(ticket.created).unix() < moment(incident_start).unix()) {
				incident_start_id = ticket._id;
				incident_start = ticket.created;
				incident_start_text = "Ticket " + ticket.subject + " ( " + ticket._id + " ) opened."
			}
		}
	});
	incident.comments.forEach(function (comment) {
		if (moment(comment.timeline_date).unix() < moment(incident_start).unix()) {
			incident_start = comment.timeline_date;
			incident_start_text = "Incident opened."
		}
	});
	return {
		id: incident_start_id,
		date: incident_start,
		text: incident_start_text
	};
};

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

var getTimeSpan = function(startdate, enddate) {
	return moment.preciseDiff(moment(startdate), moment(enddate));
};

var findLastReply = function (tickets) {
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

var findFirstResponse = function (tickets) {
	var first_response = {};
	var responded = false;
	// find first staff response
	tickets.forEach(function (ticket) {
		for (var i = 0, l = _.size(ticket.replies); i < l; i++) {
			if (ticket.replies[i].level == 'staff') {
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

var sortIncidentComments = function(obj1, obj2) {
	return new Date(obj2.eventRawDate) < new Date(obj1.eventRawDate) ? 1 : -1;
};

Template.createIncidentComment.rendered = function () {
	$('#calendar').DatePicker({
		mode: 'single',
		inline: true,
		date: new Date(),
		onChange: function(date, el) {
			$('#selected_date').val(date.getDate()+'/'+(date.getMonth()+1)+'/'+date.getFullYear());
		}
	});

	var current_date = $('#calendar').DatePickerGetDate()[0];
	$('#selected_date').val(current_date.getDate()+'/'+(current_date.getMonth()+1)+'/'+current_date.getFullYear());

	$('#timepicker').timepicker({
		minuteStep: 1,
		secondStep: 1,
		showSeconds: true,
		showMeridian: false
	});

	// if editing set date, time and text to existing values
	if (Session.get('editIncident').editing == true) {
		var info = Session.get('editIncident').data;
		$('#calendar').DatePickerSetDate(info.eventRawDate, true)
		$('#selected_date').val(info.eventDate);
		$('#timepicker').timepicker('setTime', info.eventTime);
		$('.incidentcomment').val(info.eventRawText);
	}
}

Template.incident.events({
	'click .add-comment': function (event, template) {
		Session.set('showCreateIncidentComment', true);
	},

	'click .add-ticket': function (event, template) {
		Session.set('showAddTicket', true);
	}
});

Template.addTicket.events({
	'click .cancel': function (event, template) {
		Session.set('showAddTicket', false);
	},

	'input .searchfilter': function (event, template) {
		var searchterm = template.find(".searchfilter").value;
		Session.set('ticketsSearchfilter', searchterm);
	},

	'click .load-more': function(event) {
		event.preventDefault();
		incidentAddTicketListSub.loadNextPage();
	},

	'click .save': function(event, template) {
		// get list of selected tickets
		var ticketlist = [];
		var selected_tickets = $(event.target).parents('.modal').find('.ticket-item-check:checked');

		selected_tickets.each(function(ticketitem) {
			ticketlist.push(selected_tickets[ticketitem].value);
		});

		var incident = Incidents.findOne({_id: Session.get('incidentId')});

		if (incident !== undefined) {
			var existingtickets = incident.tickets;

			var newtickets = _.union(ticketlist, existingtickets);

			Incidents.update(
				{_id: Session.get('incidentId')},
				{
					$set: {tickets: newtickets}
				}
			);
		}

		Session.set('showAddTicket', false);
	}
});

Template.addTicket.tickets = function () {
	var searchfilter = Session.get('ticketsSearchfilter');
	var tickets;

	if (searchfilter == '' || searchfilter == undefined || searchfilter.length < 3) {
		tickets = Tickets.find({},
		{sort: {created: -1}, limit: incidentAddTicketListSub.limit()}
		);
	} else {
		tickets = Tickets.find(
			{
			$or:
			[
				{_id: {$regex: ".*"+ searchfilter+".*", $options: 'i'}},
				{subject: {$regex: ".*"+ searchfilter +".*", $options: 'i'}},
				{'requesters.email': {$regex: ".*"+ searchfilter +".*", $options: 'i'}}
			]
			},
			{sort: {created: -1}, limit: incidentAddTicketListSub.limit()}
		);
	}
	return tickets;
};

Template.addTicket.subReady = function() {
	return ! incidentAddTicketListSub.loading();
};

Template.createIncidentComment.events({
	'click .cancel': function (event, template) {
		Session.set('showCreateIncidentComment', false);
		Session.set('editIncident', {});
	},

	'click .save': function (event, template) {
		event.preventDefault();
		var incident = Incidents.findOne({_id: Session.get('incidentId')});
		var selected_date = template.find('#selected_date').value;
		var selected_time = template.find('#timepicker').value;
		var comment_date = moment(selected_date + ' ' + selected_time, 'D-MM-YYYY HH:mm:ss').toDate();
		var comment_text = template.find('.incidentcomment').value;

		var comment_data = {};

		if (Session.get('editIncident').editing == true) {
			var info = Session.get('editIncident').data;
			var comment = _.where(incident.comments, {_id: info._id})[0];
			comment.timeline_date = comment_date;
			comment.edited_by = Meteor.userId();
			comment.body = comment_text;

			Incidents.update(
				{_id: incident._id},
				{$set: {comments: incident.comments}}
			);
		} else {
			comment_data._id = Random.id();
			comment_data.posted_by = Meteor.userId();
			comment_data.created = new Date();
			comment_data.timeline_date = comment_date;
			comment_data.body = comment_text;

			var new_comments = incident.comments;
			new_comments.push(comment_data);

			Incidents.update(
				{_id: incident._id},
				{$set: {comments: new_comments}}
			);
		}
		Session.set('showCreateIncidentComment', false);
		Session.set('editIncident', {});
	}
});

UI.registerHelper('confirmdelete', function() {
	var sessionid = this._id + '-confirm';
	return Session.get(sessionid);
});


Template.timelineitem.events({
	'click .remove-comment': function (event, template) {
		event.preventDefault();
		// change delete button to a confirm button
		var sessionid = this._id + '-confirm';
		Session.set(sessionid, true);

		// Revert button after 15 seconds
		Meteor.setTimeout(function () {
			Session.set(sessionid, false);
		}, 5000);
	},

	'click .confirmremove-comment': function (event, template) {
		event.preventDefault();
		Meteor.call('removeIncidentComment', {
			incidentId: Session.get('incidentId'),
			commentId: this._id
		}, function(error, result){})
	},

	'click .edit-comment': function (event, template) {
		event.preventDefault();
		var incident = Incidents.findOne({_id: Session.get('incidentId')});
		Session.set('editIncident', {editing: true, data: this});
		Session.set('showCreateIncidentComment', true);
	}
});

Template.ticketrowtiny.events({
	'click .remove-ticket': function (event, template) {
		event.preventDefault();
		// change delete button to a confirm button
		var sessionid = this._id + '-confirm';
		Session.set(sessionid, true);

		// Revert button after 15 seconds
		Meteor.setTimeout(function () {
			Session.set(sessionid, false);
		}, 5000);
	},

	'click .confirmremove-ticket': function (event, template) {
		event.preventDefault();
		Meteor.call('removeIncidentTicket', {
			incidentId: Session.get('incidentId'),
			ticketId: this._id
		}, function(error, result){})
	}
});
