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
widget_ticket_list_save = function(event, template) {
  var widgetlabel = template.find(".widgetlabel").value;
  var width = template.find(".widgetwidth").value;
  var height = template.find(".widgetheight").value;
  var states = template.find(".ticketstates");
  states_for_filter = [];
  while(states.selectedIndex != -1) {
    states_for_filter.push(states.options[states.selectedIndex].value);
    states.options[states.selectedIndex].selected = false;
  }

  var sortorder = '';
  for (var i = 0; i < document.getElementsByName('sortorder').length; i++) {
    if (document.getElementsByName('sortorder')[i].checked) {
      sortorder = document.getElementsByName('sortorder')[i].value;
    }
  }

  Meteor.call('createUserDashboard', {
    owner: Meteor.userId(),
    col:1,
    row:1,
    sizex:width,
    sizey:height,
    label:widgetlabel,
    template:'widget_ticket_list',
    extradata: {filter: states_for_filter, sortorder: sortorder}
  }, function (error, userdashboardId) {
    if (! error) {
      Session.set('showSelectWidgetDialog', false);
      Session.set('selected_widget', null);
    }
  });
};

dashboard_widgets.push({
  display_name: 'Ticket List',
  template: 'widget_ticket_list',
  config_template: 'widget_ticket_list_config',
  save: widget_ticket_list_save
});

Template.widget_ticket_list.helpers({
  widget: function(id) {
    var widget = UserDashboard.findOne({_id: id});
    var sorting = null;

    switch(widget.extradata.sortorder) {
      case 'ageascend':
        sorting = {sort: {'created': 1}};
        break;
      case 'agedescend':
        sorting = {sort: {'created': -1}};
        break;
      case 'replyascend':
        sorting = {sort: {'modified': 1}};
        break;
      case 'replydescend':
        sorting = {sort: {'modified': -1}};
        break;
      default:
        sorting = {sort: {'created': -1}};
    }
    var tickets = Tickets.find({status: {$in: widget.extradata.filter}}, sorting);
    return {label: widget.label, tickets: tickets};
  },

  age: function(time){
    return moment(time).fromNow();
  },

  requester_email: function () {
    var ticket = Tickets.findOne({_id:this._id});
    var user = Meteor.users.findOne({_id:ticket.requester});
    if (user !== undefined) {
      return user.profile.email;
    }
  }
});

Template.widget_ticket_list_config.helpers({
  ticketstates: function() {
    return TicketStatus.find({});
  }
});

