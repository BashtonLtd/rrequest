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
Template.autoclosesettings.events({
  'click .autoclose-settings-save': function (event, template) {
    var inactivity_warning = template.find(".inactivity_warning").value;
    var close_period = template.find(".close_period").value;
    
    Meteor.call('updateAutocloseSettings', {
      inactivity_warning: inactivity_warning,
      close_period: close_period
    }, function(error, settings) {

    });
  }
});

Template.autoclosesettings.inactivity_warning = function() {
  var settings = AutocloseSettings.findOne({});
  if (settings !== undefined) {
    return settings.inactivity_warning;
  }
};

Template.autoclosesettings.close_period = function() {
  var settings = AutocloseSettings.findOne({});
  if (settings !== undefined) {
    return settings.close_period;
  }
};

autoclose_settings_page = function(args) {
  args = args || {};

  return {
    name: 'Autoclose',
    template: 'autoclosesettings'
  };
};