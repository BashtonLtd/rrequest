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
ticketunmerge = function(ticketList) {
  if ($('.ticketunmergecontainer').length === 0) {
    UI.insert(UI.render
      (Template['ticketunmerge']),
      $('.container').get(0)
    );
  } else {
    Session.set("showUnmergeDialog", true);
  }
  Session.set('unmergeticketslist', ticketList);
};

Template.ticketunmerge.created = function() {
  Session.set("showUnmergeDialog", true);
  Session.set('unmergeticketslist', []);
};

Template.ticketunmerge.helpers({
    showUnmergeDialog: function() {
        return Session.get("showUnmergeDialog");
    }
});

Template.ticketunmergedialog.events({
  'click .cancel': function (event, template) {
    event.preventDefault();
    Session.set("showUnmergeDialog", false);
  },

  'click .unmerge': function (event, template) {
    event.preventDefault();
    Meteor.call('unmergeTickets', Meteor.userId(), Session.get('unmergeticketslist'), function (error) {
      if (!error) {

      }
    });

    Session.set("showUnmergeDialog", false);
  }
});
