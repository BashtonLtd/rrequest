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
var widgetData = [];

Template.widget_ticket_list.rendered = function () {
  init_gridster();
};

var getFilter = function(id, filter) {
  var searchfilter = Session.get('ticketsSearchfilter-'+id);
  if (searchfilter === '' || searchfilter === undefined || searchfilter.length < 3) {
    return {
      status: {$in: filter}
    };
  } else {
    return {
      status: {$in: filter},
      $or:
      [
        {_id: {$regex: ".*"+ searchfilter +".*", $options: 'i'}},
        {subject: {$regex: ".*"+ searchfilter +".*", $options: 'i'}},
        {'requesters.email': {$regex: ".*"+ searchfilter +".*", $options: 'i'}}
      ]
    };
  }
};

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

Template.widget_ticket_list.events({
  'click .load-more': function(event) {
    event.preventDefault();
    var id = $(event.target).context.id;
    if (_.contains(_.pluck(widgetData, 'id'), id)) {
      var widgetEntry = _.find(widgetData, function(widget) {
        if (widget.id == id) {
          return true;
        } else {
          return false;
        }
      });
      widgetEntry.sub.loadNextPage();
    } else {
      var widgetEntry = {id: widgetId};
    }
  },

  'input .searchfilter': function (event, template) {
    var id = event.target.id;
    var searchterm = template.find("#"+id).value;

    var idarray = id.split('-');
    Session.set('ticketsSearchfilter-'+idarray[1], searchterm);
  }
});

Template.widget_ticket_list.helpers({
  widget: function(id) {
    var widget = UserDashboard.findOne({_id: id});
    widgetId = id;
    var sorting = null;
    var ticketsource = null;

    switch(widget.extradata.sortorder) {
      case 'ageascend':
        subsorting = {'created': -1};
        break;
      case 'agedescend':
        subsorting = {'created': 1};
        break;
      case 'replyascend':
        subsorting = {'modified': -1};
        break;
      case 'replydescend':
        subsorting = {'modified': 1};
        break;
      default:
        subsorting = {'created': 1};
    }
    sorting = {sort: subsorting};

    if (_.contains(_.pluck(widgetData, 'id'), widgetId)) {
      var widgetEntry = _.find(widgetData, function(widget) {
        if (widget.id == widgetId) {
          return true;
        } else {
          return false;
        }
      });

    } else {
      var widgetEntry = {id: widgetId}
      widgetData.push(widgetEntry);
    }

    var limit = 10;
    if (widgetEntry.sub != undefined) {
      limit = widgetEntry.sub.limit();
    }
    widgetEntry.sub = Meteor.subscribeWithPagination(
      'sortedTickets',
      subsorting, 
      getFilter(id, widget.extradata.filter), 
      limit
    );

    sorting.limit = widgetEntry.sub.limit();
    var searchfilter = Session.get('ticketsSearchfilter-'+id);
    if (searchfilter == undefined) {
      searchfilter = '';
      Session.set('ticketsSearchfilter-'+id, '');
    }

    if (searchfilter === '' || searchfilter === undefined || searchfilter.length < 3) {
      var tickets = Tickets.find(
        {
          status: {$in: widget.extradata.filter}
        },
        sorting
      );
    } else {
      var tickets = Tickets.find(
        {
          status: {$in: widget.extradata.filter},
          $or:
          [
            {_id: {$regex: ".*"+ searchfilter+".*", $options: 'i'}},
            {subject: {$regex: ".*"+ searchfilter +".*", $options: 'i'}},
            {'requesters.email': {$regex: ".*"+ searchfilter +".*", $options: 'i'}}
      
          ]
        },
        sorting
      );
    }
    return {id: id, label: widget.label, tickets: tickets};

  },

  searchfilter: function (id) {
    return Session.get('ticketsSearchfilter-'+id);
  },

  body_height: function (id) {
    var widget = UserDashboard.findOne({_id: id});
    return widget.sizey * 82 - 95;
  }
});

Template.widget_ticket_list_config.helpers({
  ticketstates: function() {
    return TicketStatus.find({});
  }
});

