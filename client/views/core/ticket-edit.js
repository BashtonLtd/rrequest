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
openEditTicketDialog = function () {
	Session.set('currentScroll',$(document).scrollTop());
	Session.set("showEditTicketDialog", true);
};

Template.ticket.helpers({
	showEditTicketDialog: function() {
		return Session.get("showEditTicketDialog");
	}
});

Template.editTicketDialog.rendered = function () {
	$(".ticketrequester").select2({
		placeholder: 'Select requesters',
		data: get_requesters,
		multiple: true,
		tokenSeparators: [" "],

		createSearchChoice:function(term, data) {
			if ($(data).filter(function() {
				return this.text.localeCompare(term) === 0;
			}).length === 0) {
				return {id:term, text: term, isNew: true};
			}
		},

		formatResult: function(term) {
			if (term.isNew) {
				return '<span class="label label-important">New</span> ' + term.text;
			} else {
				return term.text;
			}
		}
	});

	$(".ticketgroup").select2({
		placeholder: 'Select groups',
		data: get_groups,
		multiple: true
	});

	var ticket = Tickets.findOne({_id:Session.get('viewticketId')}, {fields: {requesters: 1, group: 1}});
	$(".ticketrequester").val(_.pluck(ticket.requesters, 'id')).trigger('change');
	$(".ticketgroup").val(ticket.group, 'id').trigger('change');
};

get_requesters = function (query_opts) {
	var users = Meteor.users.find({"profile.isStaff": false});
	var requesters = [];
	users.forEach(function (user) {
		requesters.push({id:user._id, text:user.profile.email});
	});
	return {results: requesters};
};

var get_groups = function (query_opts) {
	var user = Meteor.users.findOne({_id:Meteor.userId()});
	var requesters = $(".ticketrequester").select2('val');
	var grouplist = Groups.find({members: {$in: requesters}});
	if (grouplist.count() < 1 && is_staff(user)) {
		grouplist = Groups.find({}, {sort: {'name': 1}});
	}
	var groups = [];
	grouplist.forEach(function (group) {
		groups.push({id:group._id, text:group.name});
	});
	return {results: groups};
};

Template.editTicketDialog.helpers({
	selectedstatus: function(statusname){
		var ticket = Tickets.findOne({_id:Session.get('viewticketId')}, {fields: {status: 1}});
		if (ticket !== undefined) {
			if (ticket.status == statusname) {
				return 'selected';
			}
		}
	},

	ticketstatus: function() {
		return TicketStatus.find({}, {sort: {'name': 1}});
	},

	ticketeditformfields: function() {
		var hooks = Hooks.find({hook:'ticket_edit_form_field'});
		return hooks;
	},

	ticketeditformfields_template: function() {
		return Template[this.template];
	}
});

Template.editTicketDialog.events({
	'click .cancel': function () {
		Session.set("showEditTicketDialog", false);
	},

	'click .save': function (event, template) {
		var subject = template.find(".subject").value;
		var requesters = $(".ticketrequester").select2('val');
		var groups = $(".ticketgroup").select2('val');
		var status = template.find(".ticketstatus").value;
		var ticket = Tickets.findOne({_id:Session.get('viewticketId')}, {fields: {status: 1}});
		var original_status = ticket.status;

		var existing_users = [];
		var new_users = [];
		requesters.forEach(function (requester){
			var user = Meteor.users.findOne({_id:requester});
			if (user !== undefined) {
				// User already exists in the system
				existing_users.push({id:user._id, email:user.profile.email});
			} else {
				// User not found, check for valid email address
				var emailMatcher = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
				if (emailMatcher.test(requester)) {
					new_users.push(requester);
				}
			}
		});

		var extras = $('#ticketeditextrafields').serializeArray();

		var extrafields = [];
		$.each(extras, function() {
			extrafields.push({name: this.name, value: this.value || ''});
		});

		var args = {
			_id: ticket._id,
			subject: subject,
			requesters: existing_users,
			groups: groups,
			status: status,
			extrafields: extrafields
		};

		Meteor.call('updateTicket', args, function (error, ticketId) {
			if (! error) {
				// create new users
				new_users.forEach(function (email_address) {
					Meteor.call('createAutoUser', email_address, function (error, userId) {
						if (!error) {
							// Add user to the ticket
							Meteor.call('addTicketRequester', {
								ticketId: ticketId,
								requesterId: userId
							}, function (error, ticket_id) {

							});
						}
					});
				});
			}
		});

		if (status !== original_status) {
			Meteor.call('insertEvent', {
				ticketId: Session.get('viewticketId'),
				user: Meteor.user()._id,
				body: 'Ticket status changed to "' + status + '" by ' + useremail(Meteor.userId()) + '.'
			}, function(error, ticketId) {

			});
		}
		Session.set("showEditTicketDialog", false);
	}
});
