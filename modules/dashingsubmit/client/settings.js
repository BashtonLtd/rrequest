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
Template.dashingsubmitsettings.events({
  'click .dashingsubmit-settings-save': function (event, template) {
    var host = template.find(".host").value;
    var port = template.find(".port").value;
    var path = template.find(".path").value;
    var auth_token = template.find(".auth_token").value;

    Meteor.call('updateDashingSubmitSettings', {
      host: host,
      port: port,
      path: path,
      auth_token: auth_token
    }, function(error, settings) {

    });
  }
});

Template.dashingsubmitsettings.helpers({
    host: function() {
        var settings = DashingSubmitSettings.findOne({});
        if (settings !== undefined) {
            return settings.host;
        }
    },

    port: function() {
        var settings = DashingSubmitSettings.findOne({});
        if (settings !== undefined) {
            return settings.port;
        }
    },

    path: function() {
        var settings = DashingSubmitSettings.findOne({});
        if (settings !== undefined) {
            return settings.path;
        }
    },

    auth_token: function() {
        var settings = DashingSubmitSettings.findOne({});
        if (settings !== undefined) {
            return settings.auth_token;
        }
    }
});

dashingsubmit_settings_page = function(args) {
  args = args || {};

  return {
    name: 'Dashing Submit',
    template: 'dashingsubmitsettings'
  };
};
