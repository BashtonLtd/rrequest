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
Template.apisettings.events({
  'click .generate-auth-token': function (event, template) {
    event.preventDefault();
    var forminput = template.find(".api-settings-authtoken");
    forminput.value = generate_auth_token();
  },

  'click .api-settings-save': function (event, template) {
    var authtoken = template.find(".api-settings-authtoken").value;
    Meteor.call('api_settings_save', {
      authtoken: authtoken
    });

  }
});

Template.apisettings.authtoken = function() {
  var settings = APISettings.findOne({});
  if (settings !== undefined) {
    return settings.authtoken;
  }
};

api_settings_page = function(args) {
  args = args || {};

  return {
    name: 'API',
    content_page: 'apisettings'
  };
};

var generate_auth_token = function () {
  var authtoken = "";
  var chars = "abcdef0123456789";

  for( var i=0; i < 32; i++ )
    authtoken += chars.charAt(Math.floor(Math.random() * chars.length));

  return authtoken;
};
