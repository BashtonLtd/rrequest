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
ticketmerge = function(ticketList) {
  if ($('.ticketmergecontainer').length == 0) {
    UI.insert(UI.render
      (Template['ticketmerge']),
      $('.container').get(0)
    );
  } else {
  	Session.set("showMergeDialog", true);
  }
  Session.set('mergeticketslist', ticketList);
};

Template.ticketmerge.created = function() {
	Session.set("showMergeDialog", true);
	Session.set('mergeticketslist', []);
};

Template.ticketmerge.rendered = function() {
	$("input:radio[name=tickets]:first").attr('checked', true);
};

Template.ticketmerge.helpers({
    showMergeDialog: function() {
        return Session.get("showMergeDialog");
    }
});

Template.ticketmergedialog.helpers({
    tickets: function() {
        return Tickets.find(
            {_id: {$in: Session.get('mergeticketslist')}},
            {sort: {'created': 1}}
        );
    }
});

Template.ticketmergedialog.events({
  'click .cancel': function (event, template) {
  	event.preventDefault();
  	Session.set("showMergeDialog", false);
  },

  'click .merge': function (event, template) {
  	event.preventDefault();

  	var target_ticket = $('input:radio[name=tickets]:checked').val();
  	var source_tickets = _.without(Session.get('mergeticketslist'), target_ticket);

  	Meteor.call('mergeTickets', Meteor.userId(), target_ticket, source_tickets, function (error) {
  		if (!error) {

  		}
  	});

  	Session.set("showMergeDialog", false);
  }
});
