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

Template.widget_state_count.rendered = function () {
  init_gridster();
};

widget_state_count_save = function(event, template) {
  var widgetlabel = template.find(".widgetlabel").value;
  var width = template.find(".widgetwidth").value;
  var height = template.find(".widgetheight").value;
  var states = template.find(".ticketstates");
  states_for_filter = [];
  while(states.selectedIndex != -1) {
    states_for_filter.push(states.options[states.selectedIndex].value);
    states.options[states.selectedIndex].selected = false;
  }

  Meteor.call('createUserDashboard', {
    owner: Meteor.userId(),
    col:1,
    row:1,
    sizex:width,
    sizey:height,
    label:widgetlabel,
    template:'widget_state_count',
    extradata: {filter: states_for_filter}
  }, function (error, userdashboardId) {
    if (! error) {
      Session.set('showSelectWidgetDialog', false);
      Session.set('selected_widget', null);
    }
  });
};

dashboard_widgets.push({
  display_name: 'Ticket State Counter',
  template: 'widget_state_count',
  config_template: 'widget_state_count_config',
  save: widget_state_count_save
});

Template.widget_state_count.helpers({
  widget: function(id) {
    var widget = UserDashboard.findOne({_id: id});
    var states = widget.extradata.filter;
    var totalcount = 0;

    states.forEach(function(state) {
      var ticketcount = TicketStateCounts.findOne({_id: Session.get(state + 'ticketcountready')});
      if (ticketcount !== undefined) {
        totalcount = totalcount + ticketcount.count;
      }
    });
    return {label: widget.label, value: totalcount};
  }
});

Template.widget_state_count_config.helpers({
  ticketstates: function() {
    return TicketStatus.find({}, {sort: {'name': 1}});
  }
});
