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
Template.eventlogsettings.helpers({
    showAddRuleDialog: function() {
        return Session.get('showAddRuleDialog');
    },

    eventrules: function() {
        return EventlogSettings.find();
    }
});

var openAddRuleDialog = function() {
  Session.set('showAddRuleDialog', true);
};

Template.eventlogsettings.events({
  'click .add_rule': function(event, template) {
    openAddRuleDialog();
  }
});

Template.addRuleDialog.events({
  'click .addRuleCancel': function(event, template) {
    Session.set('showAddRuleDialog', false);
  },

  'click .save': function(event, template) {
    var tag = template.find(".tag").value;
    var host = template.find(".host").value;
    var port = template.find(".port").value;
    var path = template.find(".path").value;
    var data = template.find(".data").value;

    EventlogSettings.insert({
      tag: tag,
      host: host,
      port: port,
      path: path,
      data: data
    })
    Session.set('showAddRuleDialog', false);
  }
});

eventlog_settings_page = function(args) {
  args = args || {};

  return {
    name: 'Eventlog',
    template: 'eventlogsettings'
  };
}
