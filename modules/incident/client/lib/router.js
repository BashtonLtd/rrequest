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
Router.map(function() {
  this.route('incidents', {
    path: '/incidents',
    onAfterAction: function() {
      var site_name = get_sitename();
      if (site_name !== undefined) {
        document.title = site_name + ': ' + this.route.name;
      } else {
        document.title = this.route.name;
      }
    }
  });

  this.route('incident', {
    path: '/incident/:_id',
    onRun: function () {
      Session.set('incidentId', this.params._id);
    },
    onBeforeAction: 'loading',
    onAfterAction: function() {
      var site_name = get_sitename();
      var incident = Incidnets.findOne({_id: Session.get('incidentId')}, {reactive: false});
      if (incident !== undefined) {
        document.title = incident._id + ' - ' + incident.subject;
      } else {
        document.title = site_name + ': ' + this.route.name;
      }
    }
  });
});