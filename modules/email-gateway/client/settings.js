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
Template.emailgatewaysettings.created = function() {
  Session.set('password_button_label', 'Show password');
};

Template.emailgatewaysettings.events({
  'click .toggle-password': function (event, template) {
    event.preventDefault();
    togglePasswordField(template);
  },

  'click .emailgateway-settings-save': function (event, template) {
    var username = template.find(".emailgateway-settings-username").value;
    var password = template.find(".emailgateway-settings-password").value;
    var host = template.find(".emailgateway-settings-host").value;
    var port = template.find(".emailgateway-settings-port").value;
    var secure_input = template.find(".emailgateway-settings-secure");
    var interval = template.find(".emailgateway-settings-interval").value;

    var secure = false;
    if (secure_input.checked === true) {
      secure = true;
    }

    Meteor.call('updateEmailGatewaySettings', {
      username: username,
      password: password,
      host: host,
      port: port,
      secure: secure,
      interval: interval
    }, function(error, settings) {

    });
  }
});

Template.emailgatewaysettings.password_button_label = function() {
  return Session.get('password_button_label');
};

var togglePasswordField = function(template) {
  var password_input = template.find(".emailgateway-settings-password");
  var password_type = password_input.getAttribute('type');

  if (password_type == 'password') {
    password_input.setAttribute("type","text");
    Session.set('password_button_label', 'Hide password');
  } else {
    password_input.setAttribute("type","password");
    Session.set('password_button_label', 'Show password');
  }
};

Template.emailgatewaysettings.imap_username = function() {
  var settings = EmailGatewaySettings.findOne({});
  if (settings !== undefined) {
    return settings.imap_username;
  }
};

Template.emailgatewaysettings.imap_password = function() {
  var settings = EmailGatewaySettings.findOne({});
  if (settings !== undefined) {
    return settings.imap_password;
  }
};

Template.emailgatewaysettings.imap_host = function() {
  var settings = EmailGatewaySettings.findOne({});
  if (settings !== undefined) {
    return settings.imap_host;
  }
};

Template.emailgatewaysettings.imap_port = function() {
  var settings = EmailGatewaySettings.findOne({});
  if (settings !== undefined) {
    return settings.imap_port;
  }
};

Template.emailgatewaysettings.imap_interval = function() {
  var settings = EmailGatewaySettings.findOne({});
  if (settings !== undefined) {
    return settings.imap_interval;
  }
};

Template.emailgatewaysettings.imap_secure = function() {
  var settings = EmailGatewaySettings.findOne({});
  if (settings !== undefined) {
    return settings.imap_secure;
  }
};

emailgateway_settings_page = function(args) {
  args = args || {};

  return {
    name: 'Email Gateway',
    template: 'emailgatewaysettings'
  };
};
