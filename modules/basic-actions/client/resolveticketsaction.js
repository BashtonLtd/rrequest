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
action_resolvetickets = function(ticketList) {
  if ($('.resolveticketscontainer').length == 0) {
    UI.insert(UI.render
      (Template['action_resolvetickets']),
      $('.container').get(0)
    );
  } else {
    Session.set("showResolveticketsDialog", true);
  }
  Session.set('resolveticketslist', ticketList);
};

Template.action_resolvetickets.created = function() {
    Session.set("showResolveticketsDialog", true);
    Session.set('resolveticketslist', []);
};

Template.action_resolvetickets.helpers({
    showResolveticketsDialog: function() {
        return Session.get("showResolveticketsDialog");
    }
});

Template.resolveticketsdialog.helpers({
    tickets: function() {
        return Tickets.find(
            {_id: {$in: Session.get('resolveticketslist')}},
            {sort: {'created': 1}}
        );
    }
});

Template.resolveticketsdialog.events({
  'click .cancel': function (event, template) {
    event.preventDefault();
    Session.set("showResolveticketsDialog", false);
  },

  'click .resolve': function (event, template) {
    event.preventDefault();

    var tickets = Session.get('resolveticketslist')

    Meteor.call('resolvetickets_action', Meteor.userId(), tickets, function (error) {
        if (!error) {

        }
    });

    Session.set("showResolveticketsDialog", false);
  }
});
