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
Template.pagerdutysettings.created = function() {
    var settings = PagerdutySettings.findOne({});
    if (settings !== undefined) {
        Session.set('pagerdutyauthtoken', settings.authtoken);
    }
};

Template.pagerdutysettings.events({
  'click .generate-auth-token': function (event, template) {
    event.preventDefault();
    var forminput = template.find(".pagerduty-settings-authtoken");
    Session.set('pagerdutyauthtoken', generate_auth_token());
    forminput.value = Session.get('pagerdutyauthtoken');
  },

  'click .pagerduty-settings-save': function (event, template) {
    var authtoken = template.find(".pagerduty-settings-authtoken").value;
    var apikey = template.find(".pagerduty-settings-apikey").value;
    var subdomain = template.find(".pagerduty-settings-subdomain").value;
    var servicekey = template.find(".pagerduty-settings-servicekey").value;

    Meteor.call('pagerduty_settings_save', {
      authtoken: authtoken,
      apikey: apikey,
      subdomain: subdomain,
      servicekey: servicekey
    });
  }
});

Template.pagerdutysettings.helpers({
    authtoken: function() {
        var settings = PagerdutySettings.findOne({});
        if (settings !== undefined) {
            return settings.authtoken;
        }
    },

    apikey: function() {
        var settings = PagerdutySettings.findOne({});
        if (settings !== undefined) {
            return settings.apikey;
        }
    },

    subdomain: function() {
        var settings = PagerdutySettings.findOne({});
        if (settings !== undefined) {
            return settings.subdomain;
        }
    },

    servicekey: function() {
        var settings = PagerdutySettings.findOne({});
        if (settings !== undefined) {
            return settings.servicekey;
        }
    },

    url: function() {
        var authtoken = Session.get('pagerdutyauthtoken');
        if (authtoken !== undefined || authtoken != '') {
            return Meteor.absoluteUrl('api/pagerduty/' + authtoken);
        }
    },

    urlsecure: function() {
        var authtoken = Session.get('pagerdutyauthtoken');
        if (authtoken !== undefined || authtoken != '') {
            return Meteor.absoluteUrl('api/pagerduty/' + authtoken, {secure:true});
        }
    }
});

pagerduty_settings_page = function(args) {
  args = args || {};

  return {
    name: 'Pagerduty',
    template: 'pagerdutysettings'
  };
};

var generate_auth_token = function () {
  var authtoken = "";
  var chars = "abcdef0123456789";

  for( var i=0; i < 32; i++ )
    authtoken += chars.charAt(Math.floor(Math.random() * chars.length));

  return authtoken;
};

Template.pagerduty_group_edit_form_field.helpers({
    pagerduty_custref: function() {
        var group = Groups.findOne({_id:Session.get("selectedGroup")});
        if (group !== undefined) {
            return group.pagerduty_custref;
        }
    }
});

Template.pagerduty_user_edit_form_field.helpers({
    pagerduty_blockedP1: function() {
        var user = Meteor.users.findOne({_id: Session.get("selectedUser")});
        if (user !== undefined) {
            if (user.profile.pagerduty_blockedP1 == "true") {
                return true;
            }
        }
        return false;
    }
});

UI.registerHelper('staffresponse', function(ticketId) {
    var response_needed = 30; // this should be a setting
    var warn_after = 25;      // this should be a setting
    var ticket = Tickets.findOne({_id:ticketId});
    if (ticket !== undefined) {
        if (ticket.priority == "1" && ticket.status !== 'creating') {
            data = findLastResponse([ticket]);
            var eventDate = data.event.eventRawDate * 1000;
            if (data.responded == false) {
                eventDate = moment(ticket.created).unix() * 1000;
            }

            var timedifference = Session.get('synctime') - eventDate;
            var targettime = eventDate + response_needed * 60000;
            var labeltype = 'info';
            if (timedifference <= warn_after * 60000) {
                var difference = moment.preciseDiff(moment(Session.get('synctime')), moment(targettime));
            } else if (timedifference > warn_after * 60000 && timedifference <= response_needed * 60000) {
                var difference = moment.preciseDiff(moment(Session.get('synctime')), moment(targettime));
                labeltype = 'warning';
            } else {
                var difference = moment.preciseDiff(moment(Session.get('synctime')), moment(targettime)) + ' late';
                labeltype = 'important';
            }
            return {
                time: difference,
                labeltype: labeltype
            }
        }
    }
});

UI.registerHelper('isOpenP1Ticket', function(ticketId) {
    var ticket = Tickets.findOne({_id: ticketId});
    if (ticket !== undefined) {
        if (ticket.priority == "1" && ticket.status != 'closed') {
            return true;
        } else {
            return false;
        }
    }
    return false;
});

Template.pagerduty_ticketlistitemfooter.helpers({
    ticketPriority: function(ticketId) {
        var ticket = Tickets.findOne({_id: ticketId}, {fields: {priority: 1}});
        if (ticket !== undefined) {
            if (ticket.priority !== undefined) {
                return 'P' + ticket.priority;
            }
        }
    }
});
