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
Meteor.publish("grouptimeworked", function (group, start, end) {
  var self = this;
  var timeworked = 0;
  var initializing = true;

  var handle = Tickets.find({groups: {$in: [group]}, isVisible: {$ne: false}}).observeChanges({
    added: function (id) {
      if (!initializing) {
        // Calculate timeworked
        timeworked = get_total_timeworked({groupId: group, start: start, end: end});
        self.changed("grouptimeworked", group, {timeworked: timeworked});
      }
    },
    changed: function (id) {
      timeworked = get_total_timeworked({groupId: group, start: start, end: end});
      self.changed("grouptimeworked", group, {timeworked: timeworked});
    },
    removed: function (id) {
      timeworked = get_total_timeworked({groupId: group, start: start, end: end});
      self.changed("grouptimeworked", group, {timeworked: timeworked});
    }
  });

  initializing = false;
  timeworked = get_total_timeworked({groupId: group, start: start, end: end});
  self.added("grouptimeworked", group, {timeworked: timeworked});
  self.ready();

  self.onStop(function () {
    handle.stop();
  });
});
